import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { db } from '../lib/db.js'
import { requireAuth } from '../middleware/auth.js'
import { logger } from '../lib/logger.js'

export const schedulesRouter = new Hono()

// ──────────────────────────────────────────────
// GET /schedules
// ──────────────────────────────────────────────
schedulesRouter.get('/', async (c) => {
  try {
    const testCaseId = c.req.query('test_case_id') ? Number(c.req.query('test_case_id')) : null
    const enabledStr = c.req.query('enabled')
    const activeStr = c.req.query('active')

    const where: Record<string, unknown> = {}
    if (testCaseId) where.testCaseId = testCaseId
    if (enabledStr !== undefined) where.enabled = enabledStr === 'true'
    if (activeStr !== undefined) where.active = activeStr === 'true'

    const schedules = await db.testSchedule.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return c.json(schedules.map(serializeSchedule))
  } catch (e) {
    logger.error({ e }, '스케줄 목록 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// POST /schedules
// ──────────────────────────────────────────────
schedulesRouter.post(
  '/',
  requireAuth,
  zValidator(
    'json',
    z.object({
      test_case_id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      schedule_type: z.string(),
      schedule_expression: z.string().optional(),
      enabled: z.boolean().default(true),
      active: z.boolean().default(true),
      environment: z.string().default('dev'),
      execution_parameters: z.record(z.unknown()).optional(),
    }),
  ),
  async (c) => {
    const data = c.req.valid('json')
    const user = c.get('user')
    try {
      const testCase = await db.testCase.findUnique({ where: { id: data.test_case_id } })
      if (!testCase) return c.json({ error: '테스트 케이스를 찾을 수 없습니다' }, 404)

      const schedule = await db.testSchedule.create({
        data: {
          testCaseId: data.test_case_id,
          name: data.name ?? `${testCase.name} 자동 실행`,
          description: data.description ?? '',
          scheduleType: data.schedule_type,
          scheduleExpression: data.schedule_expression ?? '',
          enabled: data.enabled,
          active: data.active,
          environment: data.environment,
          executionParameters: data.execution_parameters
            ? JSON.stringify(data.execution_parameters)
            : null,
          createdBy: Number(user.sub),
        },
      })
      return c.json(
        { message: '스케줄이 성공적으로 생성되었습니다', id: schedule.id, schedule: serializeSchedule(schedule) },
        201,
      )
    } catch (e) {
      logger.error({ e }, '스케줄 생성 오류')
      return c.json({ error: String(e) }, 500)
    }
  },
)

// ──────────────────────────────────────────────
// GET /schedules/:id
// ──────────────────────────────────────────────
schedulesRouter.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  try {
    const schedule = await db.testSchedule.findUnique({ where: { id } })
    if (!schedule) return c.json({ error: '스케줄을 찾을 수 없습니다' }, 404)
    return c.json(serializeSchedule(schedule))
  } catch (e) {
    logger.error({ e }, '스케줄 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// PUT /schedules/:id
// ──────────────────────────────────────────────
schedulesRouter.put('/:id', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const schedule = await db.testSchedule.findUnique({ where: { id } })
  if (!schedule) return c.json({ error: '스케줄을 찾을 수 없습니다' }, 404)

  try {
    const data = await c.req.json()
    await db.testSchedule.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.schedule_type !== undefined && { scheduleType: data.schedule_type }),
        ...(data.schedule_expression !== undefined && { scheduleExpression: data.schedule_expression }),
        ...(data.enabled !== undefined && { enabled: data.enabled }),
        ...(data.active !== undefined && { active: data.active }),
        ...(data.environment !== undefined && { environment: data.environment }),
        ...(data.execution_parameters !== undefined && {
          executionParameters: data.execution_parameters
            ? JSON.stringify(data.execution_parameters)
            : null,
        }),
      },
    })
    const updated = await db.testSchedule.findUnique({ where: { id } })
    return c.json({ message: '스케줄이 성공적으로 수정되었습니다', schedule: serializeSchedule(updated!) })
  } catch (e) {
    logger.error({ e }, '스케줄 수정 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// DELETE /schedules/:id
// ──────────────────────────────────────────────
schedulesRouter.delete('/:id', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const schedule = await db.testSchedule.findUnique({ where: { id } })
  if (!schedule) return c.json({ error: '스케줄을 찾을 수 없습니다' }, 404)

  try {
    await db.testSchedule.delete({ where: { id } })
    return c.json({ message: '스케줄이 성공적으로 삭제되었습니다' })
  } catch (e) {
    logger.error({ e }, '스케줄 삭제 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// POST /schedules/:id/toggle
// ──────────────────────────────────────────────
schedulesRouter.post('/:id/toggle', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const schedule = await db.testSchedule.findUnique({ where: { id } })
  if (!schedule) return c.json({ error: '스케줄을 찾을 수 없습니다' }, 404)

  try {
    const updated = await db.testSchedule.update({
      where: { id },
      data: { enabled: !schedule.enabled },
    })
    return c.json({
      message: `스케줄이 ${updated.enabled ? '활성화' : '비활성화'}되었습니다`,
      schedule: serializeSchedule(updated),
    })
  } catch (e) {
    logger.error({ e }, '스케줄 토글 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// POST /schedules/:id/run-now
// ──────────────────────────────────────────────
schedulesRouter.post('/:id/run-now', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const schedule = await db.testSchedule.findUnique({ where: { id } })
  if (!schedule) return c.json({ error: '스케줄을 찾을 수 없습니다' }, 404)

  try {
    // Phase 6에서 실제 실행 엔진 연결 예정 — 현재는 시뮬레이션
    const result = await db.testResult.create({
      data: {
        testCaseId: schedule.testCaseId,
        result: 'Pass',
        environment: schedule.environment,
        executedBy: 'system',
        notes: `스케줄 즉시 실행: ${schedule.name}`,
        executionDuration: 0,
      },
    })
    await db.testSchedule.update({
      where: { id },
      data: { lastRunAt: new Date(), lastRunStatus: 'success', lastRunResultId: result.id },
    })
    return c.json({ message: '스케줄이 즉시 실행되었습니다' })
  } catch (e) {
    logger.error({ e }, '스케줄 즉시 실행 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// 내부 헬퍼
// ──────────────────────────────────────────────
function serializeSchedule(s: {
  id: number
  testCaseId: number
  name: string
  description: string | null
  scheduleType: string
  scheduleExpression: string | null
  enabled: boolean
  active: boolean
  nextRunAt: Date | null
  lastRunAt: Date | null
  lastRunStatus: string | null
  lastRunResultId: number | null
  environment: string | null
  executionParameters: string | null
  createdBy: number
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: s.id,
    test_case_id: s.testCaseId,
    name: s.name,
    description: s.description,
    schedule_type: s.scheduleType,
    schedule_expression: s.scheduleExpression,
    enabled: s.enabled,
    active: s.active,
    next_run_at: s.nextRunAt?.toISOString() ?? null,
    last_run_at: s.lastRunAt?.toISOString() ?? null,
    last_run_status: s.lastRunStatus,
    last_run_result_id: s.lastRunResultId,
    environment: s.environment,
    execution_parameters: s.executionParameters ? JSON.parse(s.executionParameters) : null,
    created_by: s.createdBy,
    created_at: s.createdAt.toISOString(),
    updated_at: s.updatedAt.toISOString(),
  }
}
