import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { promises as fs } from 'fs'
import path from 'path'
import { db } from '../lib/db.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { logger } from '../lib/logger.js'
import { getExecutionQueue } from '../lib/executionEngine.js'

export const automationRouter = new Hono()

// ──────────────────────────────────────────────
// GET /automation-tests/scripts  (주의: /:id 보다 먼저)
// ──────────────────────────────────────────────
automationRouter.get('/scripts', async (c) => {
  try {
    const scriptsDir = path.join(process.cwd(), 'scripts')
    let files: string[] = []
    try {
      const entries = await fs.readdir(scriptsDir, { recursive: true })
      files = (entries as string[]).filter(
        (f: string) => f.endsWith('.spec.js') || f.endsWith('.spec.ts') || f.endsWith('.js'),
      )
    } catch {
      // 디렉토리가 없으면 빈 배열 반환
    }
    return c.json(files)
  } catch (e) {
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// POST /automation-tests/bulk-delete  (주의: /:id 보다 먼저)
// ──────────────────────────────────────────────
automationRouter.post(
  '/bulk-delete',
  requireAuth,
  requireAdmin,
  zValidator('json', z.object({ test_ids: z.array(z.number()) })),
  async (c) => {
    const { test_ids } = c.req.valid('json')
    if (!test_ids.length) return c.json({ error: '삭제할 자동화 테스트 ID 목록이 필요합니다' }, 400)
    try {
      const deleted = await db.automationTest.deleteMany({ where: { id: { in: test_ids } } })
      return c.json({
        message: `${deleted.count}개의 자동화 테스트가 성공적으로 삭제되었습니다`,
        deleted_count: deleted.count,
        total_requested: test_ids.length,
        failed_deletions: [],
      })
    } catch (e) {
      logger.error({ e }, '자동화 테스트 다중 삭제 오류')
      return c.json({ error: String(e) }, 500)
    }
  },
)

// ──────────────────────────────────────────────
// GET /automation-tests
// ──────────────────────────────────────────────
automationRouter.get('/', async (c) => {
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
      const tests = await db.automationTest.findMany({
        where,
        include: { creator: true },
      })
      return c.json(tests.map(serializeTest))
    }

    const safePage = Math.max(page, 1)
    const safePerPage = Math.min(Math.max(perPage, 1), 100)
    const skip = (safePage - 1) * safePerPage

    const [total, tests] = await Promise.all([
      db.automationTest.count({ where }),
      db.automationTest.findMany({
        where,
        skip,
        take: safePerPage,
        include: { creator: true },
      }),
    ])
    const totalPages = Math.ceil(total / safePerPage)

    return c.json({
      items: tests.map(serializeTest),
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
    logger.error({ e }, '자동화 테스트 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// POST /automation-tests
// ──────────────────────────────────────────────
automationRouter.post(
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
      assignee_id: z.number().optional(),
    }),
  ),
  async (c) => {
    const data = c.req.valid('json')
    const caller = c.get('user')
    try {
      const test = await db.automationTest.create({
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
      return c.json({ message: '자동화 테스트 생성 완료', id: test.id }, 201)
    } catch (e) {
      logger.error({ e }, '자동화 테스트 생성 오류')
      return c.json({ error: `데이터베이스 오류: ${String(e)}` }, 500)
    }
  },
)

// ──────────────────────────────────────────────
// GET /automation-tests/:id
// ──────────────────────────────────────────────
automationRouter.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const test = await db.automationTest.findUnique({
    where: { id },
    include: { creator: true },
  })
  if (!test) return c.json({ error: '자동화 테스트를 찾을 수 없습니다.' }, 404)
  return c.json(serializeTest(test))
})

// ──────────────────────────────────────────────
// PUT /automation-tests/:id
// ──────────────────────────────────────────────
automationRouter.put('/:id', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const test = await db.automationTest.findUnique({ where: { id } })
  if (!test) return c.json({ error: '자동화 테스트를 찾을 수 없습니다.' }, 404)

  const data = await c.req.json()
  try {
    await db.automationTest.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.script_path !== undefined && { scriptPath: data.script_path }),
        ...(data.environment !== undefined && { environment: data.environment }),
        ...(data.parameters !== undefined && { parameters: JSON.stringify(data.parameters) }),
      },
    })
    return c.json({ message: '자동화 테스트 업데이트 완료' })
  } catch (e) {
    logger.error({ e }, '자동화 테스트 업데이트 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// DELETE /automation-tests/:id  (관리자 전용)
// ──────────────────────────────────────────────
automationRouter.delete('/:id', requireAuth, requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  const test = await db.automationTest.findUnique({ where: { id } })
  if (!test) return c.json({ error: '자동화 테스트를 찾을 수 없습니다.' }, 404)
  await db.automationTest.delete({ where: { id } })
  return c.json({ message: '자동화 테스트 삭제 완료' })
})

// ──────────────────────────────────────────────
// PUT /automation-tests/:id/assignee
// ──────────────────────────────────────────────
automationRouter.put('/:id/assignee', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const test = await db.automationTest.findUnique({ where: { id } })
  if (!test) return c.json({ error: '자동화 테스트를 찾을 수 없습니다.' }, 404)

  const data = await c.req.json()
  const oldAssigneeId = test.assigneeId
  await db.automationTest.update({
    where: { id },
    data: { assigneeId: data.assignee_id ?? null },
  })
  return c.json({
    message: '자동화 테스트 담당자 업데이트 완료',
    old_assignee_id: oldAssigneeId,
    new_assignee_id: data.assignee_id,
  })
})

// ──────────────────────────────────────────────
// POST /automation-tests/:id/execute
// ──────────────────────────────────────────────
automationRouter.post('/:id/execute', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const test = await db.automationTest.findUnique({ where: { id } })
  if (!test) return c.json({ error: '자동화 테스트를 찾을 수 없습니다.' }, 404)

  const body = await c.req.json().catch(() => ({})) as Record<string, unknown>
  const environment = typeof body.environment === 'string' ? body.environment : (test.environment ?? 'dev')
  const parameters = typeof body.parameters === 'object' && body.parameters !== null
    ? body.parameters as Record<string, unknown>
    : test.parameters ? JSON.parse(test.parameters) as Record<string, unknown> : undefined

  // TestExecution 레코드 생성 (Pending 상태)
  const execution = await db.testExecution.create({
    data: {
      automationTestId: id,
      testType: 'playwright',
      status: 'Pending',
    },
  })

  // BullMQ 큐에 실행 Job 등록
  const queue = getExecutionQueue()
  const job = await queue.add('playwright-run', {
    type: 'playwright-run',
    executionId: execution.id,
    automationTestId: id,
    testName: test.name,
    scriptPath: test.scriptPath,
    environment,
    ...(parameters !== undefined && { parameters }),
  })

  logger.info({ jobId: job.id, executionId: execution.id, testName: test.name }, 'Playwright 실행 큐 등록')

  return c.json({
    message: '자동화 테스트 실행이 큐에 등록되었습니다.',
    execution_id: execution.id,
    job_id: job.id,
    status: 'Pending',
  }, 202)
})

// ──────────────────────────────────────────────
// GET /automation-tests/:id/results
// ──────────────────────────────────────────────
automationRouter.get('/:id/results', async (c) => {
  const id = Number(c.req.param('id'))
  const results = await db.testResult.findMany({
    where: { automationTestId: id },
    orderBy: { executedAt: 'desc' },
  })
  return c.json(
    results.map((r) => ({
      id: r.id,
      automation_test_id: r.automationTestId,
      result: r.result,
      executed_at: r.executedAt?.toISOString() ?? null,
      environment: r.environment,
      execution_duration: r.executionDuration,
      error_message: r.errorMessage,
    })),
  )
})

// ──────────────────────────────────────────────
// GET /automation-tests/:id/screenshots
// ──────────────────────────────────────────────
automationRouter.get('/:id/screenshots', async (c) => {
  const id = Number(c.req.param('id'))
  const results = await db.testResult.findMany({
    where: { automationTestId: id },
    select: { id: true },
  })
  const resultIds = results.map((r) => r.id)
  const screenshots =
    resultIds.length > 0
      ? await db.screenshot.findMany({ where: { testResultId: { in: resultIds } } })
      : []

  return c.json(
    screenshots.map((s) => ({
      id: s.id,
      screenshot_path: s.filePath,
      timestamp: s.createdAt?.toISOString() ?? null,
    })),
  )
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

function serializeTest(test: {
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
}) {
  return {
    id: test.id,
    name: test.name,
    description: test.description,
    script_path: test.scriptPath,
    environment: test.environment,
    parameters: test.parameters ? (JSON.parse(test.parameters) as unknown) : {},
    creator_id: test.creatorId,
    creator_name: getDisplayName(test.creator ?? null),
    assignee_id: test.assigneeId,
    created_at: test.createdAt.toISOString(),
    updated_at: test.updatedAt.toISOString(),
  }
}
