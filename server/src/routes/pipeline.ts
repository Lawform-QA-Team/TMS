import { Hono } from 'hono'
import { db } from '../lib/db.js'
import { requireAuth } from '../middleware/auth.js'
import { logger } from '../lib/logger.js'

export const pipelineRouter = new Hono()

const PIPELINE_STAGES = [
  'collected',
  'qaplan',
  'testcases',
  'pageanalysis',
  'codegen',
  'testrun',
  'report',
  'bugs',
]

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function serializeTicket(t: {
  id: number
  pipelineId: string
  ticketKey: string
  projectKey: string
  issueType: string
  priority: string
  summary: string
  descriptionRaw: string | null
  descriptionText: string | null
  labels: string | null
  sourceType: string
  pipelineStatus: string
  errorMessage: string | null
  collectedAt: Date
  updatedAt: Date
}) {
  return {
    id: t.id,
    pipeline_id: t.pipelineId,
    ticket_key: t.ticketKey,
    project_key: t.projectKey,
    issue_type: t.issueType,
    priority: t.priority,
    summary: t.summary,
    description_text: t.descriptionText,
    labels: (() => { try { return t.labels ? JSON.parse(t.labels) : [] } catch { return [] } })(),
    source_type: t.sourceType,
    pipeline_status: t.pipelineStatus,
    error_message: t.errorMessage,
    collected_at: t.collectedAt.toISOString(),
    updated_at: t.updatedAt.toISOString(),
  }
}

function buildStages(pipelineStatus: string) {
  const currentIdx = PIPELINE_STAGES.indexOf(pipelineStatus)
  return PIPELINE_STAGES.map((stage, idx) => ({
    stage,
    status: idx < currentIdx
      ? 'completed'
      : idx === currentIdx
        ? 'active'
        : 'pending',
  }))
}

function buildPagination(page: number, perPage: number, total: number) {
  const pages = Math.ceil(total / perPage)
  return {
    page,
    per_page: perPage,
    total,
    pages,
    has_next: page < pages,
    has_prev: page > 1,
  }
}

// GET /pipeline/stats — 반드시 /:pipelineId 앞에 등록
pipelineRouter.get('/stats', async (c) => {
  try {
    const [byStatus, total, todayCount] = await Promise.all([
      db.collectedTicket.groupBy({ by: ['pipelineStatus'], _count: { id: true } }),
      db.collectedTicket.count(),
      db.collectedTicket.count({
        where: { collectedAt: { gte: startOfToday() } },
      }),
    ])
    return c.json({
      success: true,
      data: {
        by_status: Object.fromEntries(byStatus.map((r) => [r.pipelineStatus, r._count.id])),
        total,
        today_count: todayCount,
      },
    })
  } catch (e) {
    logger.error({ e }, 'Pipeline stats 조회 오류')
    return c.json({ success: false, error: String(e) }, 500)
  }
})

// GET /pipeline
pipelineRouter.get('/', async (c) => {
  try {
    const page = Number(c.req.query('page') ?? 1)
    const perPage = Number(c.req.query('per_page') ?? 20)
    const pipelineStatus = c.req.query('pipelineStatus')
    const priority = c.req.query('priority')

    const where: Record<string, unknown> = {}
    if (pipelineStatus) where.pipelineStatus = pipelineStatus
    if (priority) where.priority = priority

    const [total, tickets] = await Promise.all([
      db.collectedTicket.count({ where }),
      db.collectedTicket.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { collectedAt: 'desc' },
      }),
    ])

    return c.json({
      success: true,
      data: {
        tickets: tickets.map(serializeTicket),
        pagination: buildPagination(page, perPage, total),
      },
    })
  } catch (e) {
    logger.error({ e }, 'Pipeline 목록 조회 오류')
    return c.json({ success: false, error: String(e) }, 500)
  }
})

// GET /pipeline/:pipelineId
pipelineRouter.get('/:pipelineId', async (c) => {
  const pipelineId = c.req.param('pipelineId')
  try {
    const ticket = await db.collectedTicket.findUnique({
      where: { pipelineId },
      include: {
        qaPlan: {
          include: { autoQaTestCases: { take: 5 } },
        },
      },
    })
    if (!ticket) return c.json({ success: false, error: '파이프라인을 찾을 수 없습니다.' }, 404)

    const stages = buildStages(ticket.pipelineStatus)
    const qaPlan = ticket.qaPlan
      ? {
          id: ticket.qaPlan.id,
          pipeline_id: ticket.qaPlan.pipelineId,
          plan_content: ticket.qaPlan.planContent,
          approval_status: ticket.qaPlan.approvalStatus,
          created_at: ticket.qaPlan.createdAt.toISOString(),
          test_case_count: ticket.qaPlan.autoQaTestCases.length,
          test_cases: ticket.qaPlan.autoQaTestCases.map((tc) => ({
            id: tc.id,
            title: tc.title,
            case_type: tc.caseType,
            priority: tc.priority,
            status: tc.status,
            steps: (() => { try { return tc.steps ? JSON.parse(tc.steps) : [] } catch { return [] } })(),
            expected_result: tc.expectedResult,
            gherkin: tc.gherkin,
            tags: (() => { try { return tc.tags ? JSON.parse(tc.tags) : [] } catch { return [] } })(),
          })),
        }
      : null
    return c.json({
      success: true,
      data: {
        ticket: serializeTicket(ticket),
        stages,
        qaPlan,
      },
    })
  } catch (e) {
    logger.error({ e }, 'Pipeline 상세 조회 오류')
    return c.json({ success: false, error: String(e) }, 500)
  }
})

// POST /pipeline/:pipelineId/cancel
pipelineRouter.post('/:pipelineId/cancel', requireAuth, async (c) => {
  const pipelineId = c.req.param('pipelineId')
  try {
    const ticket = await db.collectedTicket.findUnique({ where: { pipelineId } })
    if (!ticket) return c.json({ success: false, error: '파이프라인을 찾을 수 없습니다.' }, 404)
    if (ticket.pipelineStatus !== 'collected') {
      return c.json({ success: false, error: `'collected' 상태에서만 취소할 수 있습니다. 현재 상태: ${ticket.pipelineStatus}` }, 400)
    }
    await db.collectedTicket.update({
      where: { pipelineId },
      data: { pipelineStatus: 'cancelled', updatedAt: new Date() },
    })
    return c.json({ success: true, message: '파이프라인이 취소되었습니다.' })
  } catch (e) {
    logger.error({ e }, 'Pipeline 취소 오류')
    return c.json({ success: false, error: String(e) }, 500)
  }
})
