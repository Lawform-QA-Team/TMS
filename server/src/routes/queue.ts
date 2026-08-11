import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { Queue, Job } from 'bullmq'
import { db } from '../lib/db.js'
import { logger } from '../lib/logger.js'
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/auth.js'
import { getRedis } from '../lib/redis.js'

export const queueRouter = new Hono()

const QUEUE_NAME = 'test_execution'

function getQueue(): Queue {
  return new Queue(QUEUE_NAME, { connection: getRedis(), prefix: '{bull}' })
}

// ──────────────────────────────────────────────
// POST /queue/testcases/:id/execute
// ──────────────────────────────────────────────
queueRouter.post('/testcases/:id/execute', requireAuth, async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const body = await c.req.json().catch(() => ({}))
    const environment = body?.environment ?? 'dev'
    const executionParameters = body?.execution_parameters ?? null

    const testCase = await db.testCase.findUnique({ where: { id }, select: { id: true, name: true } })
    if (!testCase) return c.json({ error: '테스트 케이스를 찾을 수 없습니다.' }, 404)

    const queue = getQueue()
    const job = await queue.add('execute_test_case', { testCaseId: id, environment, executionParameters })
    await queue.close()

    return c.json({
      message: '테스트 케이스가 실행 큐에 추가되었습니다.',
      task_id: job.id,
      test_case_id: id,
      test_case_name: testCase.name,
      status: 'queued',
    }, 202)
  } catch (e) {
    logger.error({ e }, '큐 추가 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// POST /queue/testcases/batch-execute
// ──────────────────────────────────────────────
queueRouter.post(
  '/testcases/batch-execute',
  requireAuth,
  zValidator(
    'json',
    z.object({
      test_case_ids: z.array(z.number()).min(1, '실행할 테스트 케이스가 없습니다.'),
      environment: z.string().default('dev'),
      max_workers: z.number().default(5),
    }),
  ),
  async (c) => {
    try {
      const { test_case_ids, environment, max_workers } = c.req.valid('json')

      const queue = getQueue()
      const job = await queue.add('execute_test_case_batch', { testCaseIds: test_case_ids, environment, maxWorkers: max_workers })
      await queue.close()

      return c.json({
        message: `${test_case_ids.length}개의 테스트 케이스가 병렬 실행 큐에 추가되었습니다.`,
        task_id: job.id,
        test_case_ids,
        max_workers,
        status: 'queued',
      }, 202)
    } catch (e) {
      logger.error({ e }, '배치 실행 큐 추가 오류')
      return c.json({ error: String(e) }, 500)
    }
  },
)

// ──────────────────────────────────────────────
// GET /queue/tasks/:jobId
// ──────────────────────────────────────────────
queueRouter.get('/tasks/:jobId', optionalAuth, async (c) => {
  try {
    const jobId = c.req.param('jobId')
    const queue = getQueue()
    const job = await Job.fromId(queue, jobId)
    await queue.close()

    if (!job) return c.json({ error: '태스크를 찾을 수 없습니다.' }, 404)

    const state = await job.getState()
    const isFinished = state === 'completed' || state === 'failed'

    const responseData: Record<string, unknown> = {
      task_id: jobId,
      status: state,
      ready: isFinished,
      successful: isFinished ? state === 'completed' : null,
      failed: isFinished ? state === 'failed' : null,
    }

    if (state === 'completed') {
      responseData.result = job.returnvalue
    } else if (state === 'failed') {
      responseData.error = job.failedReason ?? 'Unknown error'
    } else if (job.progress !== undefined) {
      const progress = job.progress
      if (typeof progress === 'object' && progress !== null) {
        responseData.progress = (progress as Record<string, unknown>).current ?? 0
        responseData.total = (progress as Record<string, unknown>).total ?? 0
      }
    }

    return c.json(responseData)
  } catch (e) {
    logger.error({ e }, '태스크 상태 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// POST /queue/tasks/:jobId/cancel
// ──────────────────────────────────────────────
queueRouter.post('/tasks/:jobId/cancel', requireAuth, async (c) => {
  try {
    const jobId = c.req.param('jobId')
    const queue = getQueue()
    const job = await Job.fromId(queue, jobId)

    if (job) {
      await job.remove()
    }
    await queue.close()

    return c.json({ message: '태스크가 취소되었습니다.', task_id: jobId })
  } catch (e) {
    logger.error({ e }, '태스크 취소 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /queue/stats
// ──────────────────────────────────────────────
queueRouter.get('/stats', optionalAuth, async (c) => {
  try {
    const queue = getQueue()
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ])
    await queue.close()

    return c.json({
      queue_name: QUEUE_NAME,
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    })
  } catch (e) {
    logger.error({ e }, '큐 통계 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /queue/workers
// ──────────────────────────────────────────────
queueRouter.get('/workers', optionalAuth, async (c) => {
  try {
    const queue = getQueue()
    const workers = await queue.getWorkers()
    await queue.close()

    return c.json({
      workers: workers.map((w) => ({ name: w.name, addr: w.addr })),
      total: workers.length,
    })
  } catch (e) {
    logger.error({ e }, '워커 목록 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// POST /queue/purge  (admin only)
// ──────────────────────────────────────────────
queueRouter.post('/purge', requireAdmin, async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}))
    const queueName: string = body?.queue_name ?? QUEUE_NAME

    const queue = new Queue(queueName, { connection: getRedis(), prefix: '{bull}' })
    await queue.obliterate({ force: true })
    await queue.close()

    return c.json({ message: `큐가 비워졌습니다: ${queueName}` })
  } catch (e) {
    logger.error({ e }, '큐 비우기 오류')
    return c.json({ error: String(e) }, 500)
  }
})
