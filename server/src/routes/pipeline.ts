import { Hono } from 'hono'
import { db } from '../lib/db.js'
import { requireAuth } from '../middleware/auth.js'
import { logger } from '../lib/logger.js'
import { getJiraQueue } from '../lib/jiraPipeline.js'
import { getRedis } from '../lib/redis.js'
import { normalizeTicket } from '../lib/ticketNormalizer.js'

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
  const isLastStage = currentIdx === PIPELINE_STAGES.length - 1
  return PIPELINE_STAGES.map((stage, idx) => ({
    stage,
    status: idx < currentIdx || (isLastStage && idx === currentIdx)
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
    const [ticket, pageAnalyses, generatedCode, testRunResult, pipelineReport, bugs] = await Promise.all([
      db.collectedTicket.findUnique({
        where: { pipelineId },
        include: {
          qaPlan: {
            include: { autoQaTestCases: { take: 5 } },
          },
        },
      }),
      db.pageAnalysis.findMany({ where: { pipelineId } }),
      db.generatedCode.findUnique({ where: { pipelineId } }),
      db.testRunResult.findUnique({ where: { pipelineId } }),
      db.pipelineReport.findUnique({ where: { pipelineId } }),
      db.pipelineBug.findMany({ where: { pipelineId }, orderBy: { createdAt: 'asc' } }),
    ])
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

    const pages = pageAnalyses.map((p) => ({
      id: p.id,
      page_name: p.pageName,
      url_pattern: p.urlPattern,
      elements: (() => { try { return p.elements ? JSON.parse(p.elements) : [] } catch { return [] } })(),
      flows: (() => { try { return p.flows ? JSON.parse(p.flows) : [] } catch { return [] } })(),
    }))

    const generatedCodeData = generatedCode
      ? {
          id: generatedCode.id,
          pipeline_id: generatedCode.pipelineId,
          language: generatedCode.language,
          framework: generatedCode.framework,
          file_name: generatedCode.fileName,
          code: generatedCode.code,
          created_at: generatedCode.createdAt.toISOString(),
        }
      : null

    const testRunData = testRunResult
      ? {
          id: testRunResult.id,
          pipeline_id: testRunResult.pipelineId,
          status: testRunResult.status,
          total_tests: testRunResult.totalTests,
          passed: testRunResult.passed,
          failed: testRunResult.failed,
          skipped: testRunResult.skipped,
          duration_ms: testRunResult.durationMs,
          results: (() => { try { return testRunResult.results ? JSON.parse(testRunResult.results) : [] } catch { return [] } })(),
          error_message: testRunResult.errorMessage,
          started_at: testRunResult.startedAt?.toISOString() ?? null,
          completed_at: testRunResult.completedAt?.toISOString() ?? null,
        }
      : null

    const reportData = pipelineReport
      ? {
          id: pipelineReport.id,
          pipeline_id: pipelineReport.pipelineId,
          summary: pipelineReport.summary,
          content: (() => { try { return pipelineReport.content ? JSON.parse(pipelineReport.content) : null } catch { return null } })(),
          pass_rate: pipelineReport.passRate,
          risk_level: pipelineReport.riskLevel,
          quality_score: pipelineReport.qualityScore,
          ready_for_release: pipelineReport.readyForRelease,
          created_at: pipelineReport.createdAt.toISOString(),
        }
      : null

    const bugsData = bugs.map((b) => ({
      id: b.id,
      pipeline_id: b.pipelineId,
      title: b.title,
      description: b.description,
      severity: b.severity,
      status: b.status,
      tc_title: b.tcTitle,
      jira_issue_key: b.jiraIssueKey,
      created_at: b.createdAt.toISOString(),
    }))

    return c.json({
      success: true,
      data: {
        ticket: serializeTicket(ticket),
        stages,
        qaPlan,
        pageAnalyses: pages,
        generatedCode: generatedCodeData,
        testRunResult: testRunData,
        report: reportData,
        bugs: bugsData,
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

// POST /pipeline/:pipelineId/retry — QA Plan 생성부터 재시도 (Slack 메시지 재발송)
pipelineRouter.post('/:pipelineId/retry', requireAuth, async (c) => {
  const pipelineId = c.req.param('pipelineId')
  try {
    const ticket = await db.collectedTicket.findUnique({ where: { pipelineId } })
    if (!ticket) return c.json({ success: false, error: '파이프라인을 찾을 수 없습니다.' }, 404)

    // 기존 QAPlan 삭제 (재생성)
    await db.qAPlan.deleteMany({ where: { pipelineId } })

    // Redis dedup 초기화
    const redis = getRedis()
    await redis.del(`collected:ticket:${ticket.ticketKey}`)

    // pipelineStatus 리셋
    await db.collectedTicket.update({
      where: { pipelineId },
      data: { pipelineStatus: 'collected', errorMessage: null, updatedAt: new Date() },
    })

    // collect-complete 잡 재큐잉
    const normalized = normalizeTicket(
      {
        key: ticket.ticketKey,
        fields: {
          summary: ticket.summary,
          description: ticket.descriptionRaw ? JSON.parse(ticket.descriptionRaw) : ticket.descriptionText,
          issuetype: { name: ticket.issueType },
          priority: { name: ticket.priority },
          project: { key: ticket.projectKey },
          status: { name: 'collected' },
          labels: ticket.labels ? JSON.parse(ticket.labels) : [],
        },
      } as never,
      ticket.sourceType as 'webhook' | 'cron',
    )
    // pipelineId는 기존 것 유지
    normalized.pipelineId = pipelineId

    await getJiraQueue().add('collect-complete', {
      type: 'collect-complete',
      ticketKey: ticket.ticketKey,
      pipelineId,
      payload: normalized,
    })

    logger.info({ pipelineId }, 'Pipeline retry 요청')
    return c.json({ success: true, message: 'QA Plan 재생성 및 Slack 메시지 재발송 시작' })
  } catch (e) {
    logger.error({ e }, 'Pipeline retry 오류')
    return c.json({ success: false, error: String(e) }, 500)
  }
})
