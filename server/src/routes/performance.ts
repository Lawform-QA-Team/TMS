import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { db } from '../lib/db.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { logger } from '../lib/logger.js'
import { getExecutionQueue } from '../lib/executionEngine.js'

// performanceRouter: /performance-tests/* 처리
export const performanceRouter = new Hono()

// testExecutionsRouter: /test-executions/* 처리 (index.ts에서 별도 등록)
export const testExecutionsRouter = new Hono()

// ──────────────────────────────────────────────
// POST /performance-tests/bulk-delete  (주의: /:id 보다 먼저)
// ──────────────────────────────────────────────
performanceRouter.post(
  '/bulk-delete',
  requireAuth,
  requireAdmin,
  zValidator('json', z.object({ test_ids: z.array(z.number()) })),
  async (c) => {
    const { test_ids } = c.req.valid('json')
    if (!test_ids.length) {
      return c.json({ error: '삭제할 성능 테스트 ID 목록이 필요합니다' }, 400)
    }
    try {
      const deleted = await db.performanceTest.deleteMany({ where: { id: { in: test_ids } } })
      return c.json({
        message: `${deleted.count}개의 성능 테스트가 성공적으로 삭제되었습니다`,
        deleted_count: deleted.count,
        total_requested: test_ids.length,
        failed_deletions: [],
      })
    } catch (e) {
      logger.error({ e }, '성능 테스트 다중 삭제 오류')
      return c.json({ error: `다중 삭제 중 오류가 발생했습니다: ${String(e)}` }, 500)
    }
  },
)

// ──────────────────────────────────────────────
// GET /performance-tests
// ──────────────────────────────────────────────
performanceRouter.get('/', async (c) => {
  try {
    const page = c.req.query('page') ? Number(c.req.query('page')) : null
    const perPage = c.req.query('per_page') ? Number(c.req.query('per_page')) : null
    const search = c.req.query('search') ?? ''
    const environment = c.req.query('environment') ?? 'all'

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { scriptPath: { contains: search } },
      ]
    }
    if (environment !== 'all') where.environment = environment

    if (!page || !perPage) {
      const tests = await db.performanceTest.findMany({
        where,
        include: { creator: true, assignee: true },
      })
      return c.json(tests.map(serializePerf))
    }

    const safePage = Math.max(page, 1)
    const safePerPage = Math.min(Math.max(perPage, 1), 100)
    const skip = (safePage - 1) * safePerPage

    const [total, tests] = await Promise.all([
      db.performanceTest.count({ where }),
      db.performanceTest.findMany({
        where,
        skip,
        take: safePerPage,
        include: { creator: true, assignee: true },
      }),
    ])
    const totalPages = Math.ceil(total / safePerPage)

    return c.json({
      items: tests.map(serializePerf),
      pagination: {
        page: safePage,
        per_page: safePerPage,
        total,
        pages: totalPages,
        has_next: safePage < totalPages,
        has_prev: safePage > 1,
        next_num: safePage < totalPages ? safePage + 1 : null,
        prev_num: safePage > 1 ? safePage - 1 : null,
      },
    })
  } catch (e) {
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// POST /performance-tests
// ──────────────────────────────────────────────
performanceRouter.post(
  '/',
  requireAuth,
  zValidator(
    'json',
    z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      script_path: z.string().optional(),
      environment: z.string().default('prod'),
      parameters: z.record(z.unknown()).optional(),
      assignee_id: z.number().nullable().optional(),
    }),
  ),
  async (c) => {
    const data = c.req.valid('json')
    const caller = c.get('user')
    try {
      const pt = await db.performanceTest.create({
        data: {
          name: data.name,
          description: data.description ?? null,
          scriptPath: data.script_path ?? null,
          environment: data.environment,
          parameters: data.parameters ? JSON.stringify(data.parameters) : null,
          creatorId: Number(caller.sub),
          assigneeId: data.assignee_id ?? Number(caller.sub),
        },
      })
      return c.json({ message: '성능 테스트 생성 완료', id: pt.id }, 201)
    } catch (e) {
      logger.error({ e }, '성능 테스트 생성 오류')
      return c.json({ error: `데이터베이스 오류: ${String(e)}` }, 500)
    }
  },
)

// ──────────────────────────────────────────────
// GET /performance-tests/:id
// ──────────────────────────────────────────────
performanceRouter.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const pt = await db.performanceTest.findUnique({
    where: { id },
    include: { creator: true, assignee: true },
  })
  if (!pt) return c.json({ error: '성능 테스트를 찾을 수 없습니다.' }, 404)
  return c.json(serializePerf(pt))
})

// ──────────────────────────────────────────────
// PUT /performance-tests/:id
// ──────────────────────────────────────────────
performanceRouter.put('/:id', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const pt = await db.performanceTest.findUnique({ where: { id } })
  if (!pt) return c.json({ error: '성능 테스트를 찾을 수 없습니다.' }, 404)

  const data = await c.req.json()
  await db.performanceTest.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.script_path !== undefined && { scriptPath: data.script_path }),
      ...(data.environment !== undefined && { environment: data.environment }),
      ...(data.parameters !== undefined && { parameters: JSON.stringify(data.parameters) }),
    },
  })
  return c.json({ message: '성능 테스트 업데이트 완료' })
})

// ──────────────────────────────────────────────
// DELETE /performance-tests/:id  (관리자 전용)
// ──────────────────────────────────────────────
performanceRouter.delete('/:id', requireAuth, requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  const pt = await db.performanceTest.findUnique({ where: { id } })
  if (!pt) return c.json({ error: '성능 테스트를 찾을 수 없습니다.' }, 404)
  await db.performanceTest.delete({ where: { id } })
  return c.json({ message: '성능 테스트 삭제 완료' })
})

// ──────────────────────────────────────────────
// PUT /performance-tests/:id/assignee
// ──────────────────────────────────────────────
performanceRouter.put('/:id/assignee', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const pt = await db.performanceTest.findUnique({ where: { id } })
  if (!pt) return c.json({ error: '성능 테스트를 찾을 수 없습니다.' }, 404)

  const data = await c.req.json()
  const oldAssigneeId = pt.assigneeId
  await db.performanceTest.update({
    where: { id },
    data: { assigneeId: data.assignee_id ?? null },
  })
  return c.json({
    message: '성능 테스트 담당자 업데이트 완료',
    old_assignee_id: oldAssigneeId,
    new_assignee_id: data.assignee_id,
  })
})

// ──────────────────────────────────────────────
// POST /performance-tests/:id/execute
// ──────────────────────────────────────────────
performanceRouter.post('/:id/execute', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const pt = await db.performanceTest.findUnique({ where: { id } })
  if (!pt) return c.json({ error: '성능 테스트를 찾을 수 없습니다.' }, 404)

  const body = await c.req.json().catch(() => ({})) as Record<string, unknown>
  const environment = typeof body.environment === 'string' ? body.environment : (pt.environment ?? 'prod')
  const parameters = typeof body.parameters === 'object' && body.parameters !== null
    ? body.parameters as Record<string, unknown>
    : pt.parameters ? JSON.parse(pt.parameters) as Record<string, unknown> : undefined

  // TestExecution 레코드 생성 (Pending 상태)
  const execution = await db.testExecution.create({
    data: {
      performanceTestId: id,
      testType: 'k6',
      status: 'Pending',
    },
  })

  // BullMQ 큐에 k6 실행 Job 등록
  const queue = getExecutionQueue()
  const job = await queue.add('k6-run', {
    type: 'k6-run',
    executionId: execution.id,
    performanceTestId: id,
    testName: pt.name,
    scriptPath: pt.scriptPath,
    environment,
    ...(parameters !== undefined && { parameters }),
  })

  logger.info({ jobId: job.id, executionId: execution.id, testName: pt.name }, 'k6 실행 큐 등록')

  return c.json({
    message: 'k6 성능 테스트 실행이 큐에 등록되었습니다.',
    execution_id: execution.id,
    job_id: job.id,
    status: 'Pending',
  }, 202)
})

// ──────────────────────────────────────────────
// GET /performance-tests/:id/results
// ──────────────────────────────────────────────
performanceRouter.get('/:id/results', async (c) => {
  const id = Number(c.req.param('id'))
  const executions = await db.testExecution.findMany({ where: { performanceTestId: id } })
  return c.json(
    executions.map((e) => ({
      id: e.id,
      performance_test_id: e.performanceTestId,
      test_type: e.testType,
      status: e.status,
      started_at: e.startedAt?.toISOString() ?? null,
      completed_at: e.completedAt?.toISOString() ?? null,
      result_summary: e.resultSummary ? (JSON.parse(e.resultSummary) as unknown) : null,
    })),
  )
})

// ──────────────────────────────────────────────
// GET /test-executions
// ──────────────────────────────────────────────
testExecutionsRouter.get('/', async (c) => {
  try {
    const page = Math.max(Number(c.req.query('page') ?? 1), 1)
    const perPage = Math.min(Math.max(Number(c.req.query('per_page') ?? 10), 1), 100)
    const skip = (page - 1) * perPage

    const [total, executions] = await Promise.all([
      db.testExecution.count(),
      db.testExecution.findMany({ skip, take: perPage }),
    ])
    const totalPages = Math.ceil(total / perPage)

    return c.json({
      items: executions.map((e) => ({
        id: e.id,
        test_case_id: e.testCaseId,
        automation_test_id: e.automationTestId,
        performance_test_id: e.performanceTestId,
        test_type: e.testType,
        started_at: e.startedAt?.toISOString() ?? null,
        completed_at: e.completedAt?.toISOString() ?? null,
        status: e.status,
        result_summary: e.resultSummary ? (JSON.parse(e.resultSummary) as unknown) : null,
      })),
      pagination: {
        page,
        per_page: perPage,
        total,
        pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1,
        next_num: page < totalPages ? page + 1 : null,
        prev_num: page > 1 ? page - 1 : null,
      },
    })
  } catch (e) {
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// POST /test-executions
// ──────────────────────────────────────────────
testExecutionsRouter.post('/', async (c) => {
  const data = await c.req.json()
  const execution = await db.testExecution.create({
    data: {
      testCaseId: data.test_case_id ?? null,
      automationTestId: data.automation_test_id ?? null,
      performanceTestId: data.performance_test_id ?? null,
      testType: data.test_type ?? null,
      status: data.status ?? 'Running',
      resultSummary: JSON.stringify(data.result_data ?? {}),
    },
  })
  return c.json({ message: '테스트 실행 생성 완료', id: execution.id }, 201)
})

// ──────────────────────────────────────────────
// 내부 헬퍼
// ──────────────────────────────────────────────
type UserRef = { username: string; firstName: string | null; lastName: string | null } | null

function getDisplayName(u: UserRef): string | null {
  if (!u) return null
  const full = [u.firstName, u.lastName].filter(Boolean).join(' ')
  return full || u.username
}

function serializePerf(pt: {
  id: number
  name: string
  description: string | null
  scriptPath: string | null
  environment: string | null
  parameters: string | null
  creatorId: number | null
  assigneeId: number | null
  createdAt: Date
  updatedAt: Date
  creator?: UserRef
  assignee?: UserRef
}) {
  return {
    id: pt.id,
    name: pt.name,
    description: pt.description,
    script_path: pt.scriptPath,
    environment: pt.environment,
    parameters: pt.parameters ? (JSON.parse(pt.parameters) as unknown) : {},
    created_at: pt.createdAt.toISOString(),
    updated_at: pt.updatedAt.toISOString(),
    creator_id: pt.creatorId,
    creator_name: getDisplayName(pt.creator ?? null),
    assignee_id: pt.assigneeId,
    assignee_name: getDisplayName(pt.assignee ?? null),
  }
}
