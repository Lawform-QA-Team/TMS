import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { db } from '../lib/db.js'
import { requireAuth } from '../middleware/auth.js'
import { logger } from '../lib/logger.js'

export const cicdRouter = new Hono()

// ──────────────────────────────────────────────
// GET /cicd/integrations
// ──────────────────────────────────────────────
cicdRouter.get('/integrations', async (c) => {
  try {
    const integrations = await db.cICDIntegration.findMany({ orderBy: { createdAt: 'desc' } })
    return c.json(integrations.map(serializeIntegration))
  } catch (e) {
    logger.error({ e }, '통합 목록 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// POST /cicd/integrations
// ──────────────────────────────────────────────
cicdRouter.post(
  '/integrations',
  requireAuth,
  zValidator(
    'json',
    z.object({
      name: z.string().min(1, 'name은 필수입니다'),
      integration_type: z.string().min(1, 'integration_type은 필수입니다'),
      webhook_url: z.string().optional(),
      webhook_secret: z.string().optional(),
      config: z.record(z.unknown()).optional(),
      enabled: z.boolean().default(true),
      active: z.boolean().default(true),
      trigger_on_push: z.boolean().default(true),
      trigger_on_pr: z.boolean().default(true),
      trigger_on_tag: z.boolean().default(false),
      test_case_filter: z.record(z.unknown()).optional(),
    }),
  ),
  async (c) => {
    const data = c.req.valid('json')
    const user = c.get('user')
    try {
      const integration = await db.cICDIntegration.create({
        data: {
          name: data.name,
          integrationType: data.integration_type,
          webhookUrl: data.webhook_url ?? null,
          webhookSecret: data.webhook_secret ?? null,
          config: data.config ? JSON.stringify(data.config) : null,
          enabled: data.enabled,
          active: data.active,
          triggerOnPush: data.trigger_on_push,
          triggerOnPr: data.trigger_on_pr,
          triggerOnTag: data.trigger_on_tag,
          testCaseFilter: data.test_case_filter ? JSON.stringify(data.test_case_filter) : null,
          createdBy: Number(user.sub),
        },
      })
      return c.json(
        { message: 'CI/CD 통합이 생성되었습니다', id: integration.id, integration: serializeIntegration(integration) },
        201,
      )
    } catch (e) {
      logger.error({ e }, '통합 생성 오류')
      return c.json({ error: String(e) }, 500)
    }
  },
)

// ──────────────────────────────────────────────
// GET /cicd/integrations/:id
// ──────────────────────────────────────────────
cicdRouter.get('/integrations/:id', async (c) => {
  const id = Number(c.req.param('id'))
  try {
    const integration = await db.cICDIntegration.findUnique({ where: { id } })
    if (!integration) return c.json({ error: '통합을 찾을 수 없습니다' }, 404)
    const serialized = serializeIntegration(integration)
    // 보안상 webhook_secret 제거
    const { webhook_secret: _ws, ...rest } = serialized as Record<string, unknown>
    return c.json(rest)
  } catch (e) {
    logger.error({ e }, '통합 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// PUT /cicd/integrations/:id
// ──────────────────────────────────────────────
cicdRouter.put('/integrations/:id', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const integration = await db.cICDIntegration.findUnique({ where: { id } })
  if (!integration) return c.json({ error: '통합을 찾을 수 없습니다' }, 404)

  try {
    const data = await c.req.json()
    await db.cICDIntegration.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.webhook_url !== undefined && { webhookUrl: data.webhook_url }),
        ...(data.webhook_secret !== undefined && { webhookSecret: data.webhook_secret }),
        ...(data.config !== undefined && { config: JSON.stringify(data.config) }),
        ...(data.enabled !== undefined && { enabled: data.enabled }),
        ...(data.active !== undefined && { active: data.active }),
        ...(data.trigger_on_push !== undefined && { triggerOnPush: data.trigger_on_push }),
        ...(data.trigger_on_pr !== undefined && { triggerOnPr: data.trigger_on_pr }),
        ...(data.trigger_on_tag !== undefined && { triggerOnTag: data.trigger_on_tag }),
        ...(data.test_case_filter !== undefined && {
          testCaseFilter: JSON.stringify(data.test_case_filter),
        }),
      },
    })
    const updated = await db.cICDIntegration.findUnique({ where: { id } })
    return c.json({ message: 'CI/CD 통합이 수정되었습니다', integration: serializeIntegration(updated!) })
  } catch (e) {
    logger.error({ e }, '통합 수정 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// DELETE /cicd/integrations/:id
// ──────────────────────────────────────────────
cicdRouter.delete('/integrations/:id', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const integration = await db.cICDIntegration.findUnique({ where: { id } })
  if (!integration) return c.json({ error: '통합을 찾을 수 없습니다' }, 404)

  try {
    await db.cICDIntegration.delete({ where: { id } })
    return c.json({ message: 'CI/CD 통합이 삭제되었습니다' })
  } catch (e) {
    logger.error({ e }, '통합 삭제 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// POST /cicd/integrations/:id/test
// ──────────────────────────────────────────────
cicdRouter.post('/integrations/:id/test', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const integration = await db.cICDIntegration.findUnique({ where: { id } })
  if (!integration) return c.json({ error: '통합을 찾을 수 없습니다' }, 404)

  try {
    const execution = await db.cICDExecution.create({
      data: {
        integrationId: id,
        triggerType: 'manual',
        triggerSource: integration.integrationType,
        status: 'running',
      },
    })
    // Phase 6에서 실제 테스트 실행 엔진 연결 예정 — 현재는 시뮬레이션
    await db.cICDExecution.update({
      where: { id: execution.id },
      data: { status: 'completed', completedAt: new Date() },
    })
    return c.json({ message: '테스트가 실행되었습니다', execution_id: execution.id })
  } catch (e) {
    logger.error({ e }, '통합 테스트 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /cicd/executions
// ──────────────────────────────────────────────
cicdRouter.get('/executions', async (c) => {
  try {
    const integrationId = c.req.query('integration_id') ? Number(c.req.query('integration_id')) : null
    const status = c.req.query('status')
    const limit = c.req.query('limit') ? Number(c.req.query('limit')) : 50

    const where: Record<string, unknown> = {}
    if (integrationId) where.integrationId = integrationId
    if (status) where.status = status

    const executions = await db.cICDExecution.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: limit,
    })
    return c.json(executions.map(serializeExecution))
  } catch (e) {
    logger.error({ e }, '실행 기록 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /cicd/executions/:id
// ──────────────────────────────────────────────
cicdRouter.get('/executions/:id', async (c) => {
  const id = Number(c.req.param('id'))
  try {
    const execution = await db.cICDExecution.findUnique({ where: { id } })
    if (!execution) return c.json({ error: '실행 기록을 찾을 수 없습니다' }, 404)
    return c.json(serializeExecution(execution))
  } catch (e) {
    logger.error({ e }, '실행 기록 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// POST /cicd/executions/:id/update-results
// ──────────────────────────────────────────────
cicdRouter.post('/executions/:id/update-results', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const execution = await db.cICDExecution.findUnique({ where: { id } })
  if (!execution) return c.json({ error: '실행 기록을 찾을 수 없습니다' }, 404)

  try {
    const data = await c.req.json()
    await db.cICDExecution.update({
      where: { id },
      data: {
        testResults: JSON.stringify(data.test_results ?? []),
        status: 'completed',
        completedAt: new Date(),
      },
    })
    return c.json({ message: '실행 결과가 업데이트되었습니다' })
  } catch (e) {
    logger.error({ e }, '실행 결과 업데이트 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// POST /cicd/webhook/github
// ──────────────────────────────────────────────
cicdRouter.post('/webhook/github', async (c) => {
  try {
    const eventType = c.req.header('X-GitHub-Event')
    const payload = await c.req.json()

    const integrations = await db.cICDIntegration.findMany({
      where: { integrationType: 'github', enabled: true, active: true },
    })

    if (integrations.length === 0) {
      return c.json({ message: '활성화된 통합이 없습니다' })
    }

    const results = []
    for (const integration of integrations) {
      const execution = await db.cICDExecution.create({
        data: {
          integrationId: integration.id,
          triggerType: 'webhook',
          triggerSource: 'github',
          triggerEvent: JSON.stringify({ event: eventType, payload }),
          status: 'running',
          prNumber: payload.pull_request?.number ?? null,
          prUrl: payload.pull_request?.html_url ?? null,
        },
      })
      results.push({ integration_id: integration.id, execution_id: execution.id, status: 'triggered' })
    }

    return c.json({ message: '웹훅이 처리되었습니다', event_type: eventType, results })
  } catch (e) {
    logger.error({ e }, 'GitHub 웹훅 처리 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// POST /cicd/webhook/jenkins
// ──────────────────────────────────────────────
cicdRouter.post('/webhook/jenkins', async (c) => {
  try {
    const payload = await c.req.json()

    const integrations = await db.cICDIntegration.findMany({
      where: { integrationType: 'jenkins', enabled: true, active: true },
    })

    if (integrations.length === 0) {
      return c.json({ message: '활성화된 통합이 없습니다' })
    }

    const results = []
    for (const integration of integrations) {
      const execution = await db.cICDExecution.create({
        data: {
          integrationId: integration.id,
          triggerType: 'webhook',
          triggerSource: 'jenkins',
          triggerEvent: JSON.stringify(payload),
          status: 'running',
        },
      })
      results.push({ integration_id: integration.id, execution_id: execution.id, status: 'triggered' })
    }

    return c.json({ message: '웹훅이 처리되었습니다', results })
  } catch (e) {
    logger.error({ e }, 'Jenkins 웹훅 처리 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// 내부 헬퍼
// ──────────────────────────────────────────────
function serializeIntegration(i: {
  id: number
  name: string
  integrationType: string
  webhookUrl: string | null
  webhookSecret: string | null
  config: string | null
  enabled: boolean
  active: boolean
  triggerOnPush: boolean
  triggerOnPr: boolean
  triggerOnTag: boolean
  testCaseFilter: string | null
  createdBy: number
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: i.id,
    name: i.name,
    integration_type: i.integrationType,
    webhook_url: i.webhookUrl,
    webhook_secret: i.webhookSecret,
    config: i.config ? JSON.parse(i.config) : {},
    enabled: i.enabled,
    active: i.active,
    trigger_on_push: i.triggerOnPush,
    trigger_on_pr: i.triggerOnPr,
    trigger_on_tag: i.triggerOnTag,
    test_case_filter: i.testCaseFilter ? JSON.parse(i.testCaseFilter) : {},
    created_by: i.createdBy,
    created_at: i.createdAt.toISOString(),
    updated_at: i.updatedAt.toISOString(),
  }
}

function serializeExecution(e: {
  id: number
  integrationId: number
  triggerType: string | null
  triggerSource: string | null
  triggerEvent: string | null
  status: string
  startedAt: Date
  completedAt: Date | null
  executedTestCases: string | null
  testResults: string | null
  prNumber: number | null
  prUrl: string | null
  prCommentId: string | null
  errorMessage: string | null
}) {
  return {
    id: e.id,
    integration_id: e.integrationId,
    trigger_type: e.triggerType,
    trigger_source: e.triggerSource,
    trigger_event: e.triggerEvent ? JSON.parse(e.triggerEvent) : null,
    status: e.status,
    started_at: e.startedAt.toISOString(),
    completed_at: e.completedAt?.toISOString() ?? null,
    executed_test_cases: e.executedTestCases ? JSON.parse(e.executedTestCases) : null,
    test_results: e.testResults ? JSON.parse(e.testResults) : null,
    pr_number: e.prNumber,
    pr_url: e.prUrl,
    pr_comment_id: e.prCommentId,
    error_message: e.errorMessage,
  }
}
