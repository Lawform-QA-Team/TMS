import { Hono } from 'hono'
import { db } from '../lib/db.js'
import { requireAuth } from '../middleware/auth.js'
import { logger } from '../lib/logger.js'
import { getJiraQueue } from '../lib/jiraPipeline.js'
import { getRedis } from '../lib/redis.js'
import { normalizeTicket } from '../lib/ticketNormalizer.js'
import { env } from '../env.js'
import fs from 'fs'
import path from 'path'

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
    const issueType = c.req.query('issueType')
    const search = c.req.query('search')

    const where: Record<string, unknown> = {}
    if (pipelineStatus) where.pipelineStatus = pipelineStatus
    if (priority) where.priority = priority
    if (issueType) where.issueType = issueType
    if (search) where.summary = { contains: search }

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
    const [ticket, pageAnalyses, generatedCodes, testRunResult, pipelineReport, bugs] = await Promise.all([
      db.collectedTicket.findUnique({
        where: { pipelineId },
        include: {
          qaPlan: {
            include: {
              autoQaTestCases: true,
              _count: { select: { autoQaTestCases: true } },
            },
          },
        },
      }),
      db.pageAnalysis.findMany({ where: { pipelineId } }),
      db.generatedCode.findMany({ where: { pipelineId } }),
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
          test_case_count: ticket.qaPlan._count.autoQaTestCases,
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

    const playwrightCode = generatedCodes.find((c) => c.framework === 'playwright')
    const k6Code = generatedCodes.find((c) => c.framework === 'k6')

    const generatedCodeData = playwrightCode
      ? {
          id: playwrightCode.id,
          pipeline_id: playwrightCode.pipelineId,
          language: playwrightCode.language,
          framework: playwrightCode.framework,
          file_name: playwrightCode.fileName,
          code: playwrightCode.code,
          created_at: playwrightCode.createdAt.toISOString(),
        }
      : null

    const k6CodeData = k6Code
      ? {
          id: k6Code.id,
          pipeline_id: k6Code.pipelineId,
          language: k6Code.language,
          framework: k6Code.framework,
          file_name: k6Code.fileName,
          code: k6Code.code,
          created_at: k6Code.createdAt.toISOString(),
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
        k6Code: k6CodeData,
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

// POST /pipeline/:pipelineId/approve — 페이지 내 QA Plan 승인/반려
pipelineRouter.post('/:pipelineId/approve', requireAuth, async (c) => {
  const pipelineId = c.req.param('pipelineId')
  try {
    const body = await c.req.json() as { action: 'approve' | 'reject' | 'cancel' }
    const { action } = body

    const ticket = await db.collectedTicket.findUnique({ where: { pipelineId } })
    if (!ticket) return c.json({ success: false, error: '파이프라인을 찾을 수 없습니다.' }, 404)
    if (ticket.pipelineStatus !== 'qaplan') {
      return c.json({ success: false, error: `qaplan 상태에서만 처리할 수 있습니다. 현재: ${ticket.pipelineStatus}` }, 400)
    }

    const qaPlan = await db.qAPlan.findFirst({ where: { pipelineId } })
    if (!qaPlan) return c.json({ success: false, error: 'QA Plan을 찾을 수 없습니다.' }, 404)

    const caller = c.get('user')
    const actorName = caller.username ?? caller.email ?? '알 수 없음'

    if (action === 'cancel') {
      await db.qAPlan.update({
        where: { id: qaPlan.id },
        data: { approvalStatus: 'cancelled', updatedAt: new Date() },
      })
      await db.collectedTicket.update({
        where: { pipelineId },
        data: { pipelineStatus: 'cancelled', updatedAt: new Date() },
      })
      logger.info({ pipelineId, actorName }, 'QA Plan 취소 (페이지)')
      return c.json({ success: true, message: '취소되었습니다.' })
    }

    const approved = action === 'approve'

    await db.qAPlan.update({
      where: { id: qaPlan.id },
      data: { approvalStatus: approved ? 'approved' : 'rejected', updatedAt: new Date() },
    })

    await db.collectedTicket.update({
      where: { pipelineId },
      data: { pipelineStatus: approved ? 'testcases' : 'collected', updatedAt: new Date() },
    })

    if (approved) {
      await getJiraQueue().add('qaplan-approved', { type: 'qaplan-approved', pipelineId, qaPlanId: qaPlan.id })
      logger.info({ pipelineId, qaPlanId: qaPlan.id, actorName }, 'QA Plan 승인 (페이지) → testcases 생성 job 등록')
    } else {
      await db.qAPlan.deleteMany({ where: { pipelineId } })
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
      normalized.pipelineId = pipelineId
      await getJiraQueue().add('collect-complete', { type: 'collect-complete', ticketKey: ticket.ticketKey, pipelineId, payload: normalized })
      logger.info({ pipelineId, actorName }, 'QA Plan 반려 (페이지) → QA Plan 재생성 job 등록')
    }

    return c.json({ success: true, message: approved ? '승인되었습니다.' : '반려되었습니다.' })
  } catch (e) {
    logger.error({ e }, 'Pipeline 승인/반려 오류')
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
// ?secret=JIRA_WEBHOOK_SECRET 으로 간단 인증
pipelineRouter.post('/:pipelineId/retry', async (c) => {
  const secret = c.req.query('secret')
  if (secret !== env.JIRA_WEBHOOK_SECRET) return c.json({ success: false, error: '인증 실패' }, 401)
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

// POST /pipeline/:pipelineId/export — 생성된 코드를 자동화 테스트로 등록
pipelineRouter.post('/:pipelineId/export', requireAuth, async (c) => {
  const pipelineId = c.req.param('pipelineId')
  const userId = Number(c.get('user').sub)
  try {
    const [ticket, generatedCode] = await Promise.all([
      db.collectedTicket.findUnique({ where: { pipelineId } }),
      db.generatedCode.findFirst({ where: { pipelineId, framework: 'playwright' } }),
    ])

    if (!ticket) return c.json({ success: false, error: '파이프라인을 찾을 수 없습니다.' }, 404)
    if (!generatedCode) return c.json({ success: false, error: '생성된 코드가 없습니다. 코드 생성 단계가 완료되어야 합니다.' }, 400)

    // 파일 저장: test-scripts/playwright/pipeline/{fileName}
    const scriptsRoot = path.join(process.cwd(), '..', 'test-scripts')
    const pipelineDir = path.join(scriptsRoot, 'playwright', 'pipeline')
    fs.mkdirSync(pipelineDir, { recursive: true })

    const fileName = generatedCode.fileName ?? `${ticket.ticketKey.toLowerCase().replace(/[^a-z0-9]/g, '-')}.spec.ts`
    const filePath = path.join(pipelineDir, fileName)
    fs.writeFileSync(filePath, generatedCode.code, 'utf-8')

    // 상대 경로 (scriptsRoot 기준)
    const relativeScriptPath = path.join('playwright', 'pipeline', fileName)

    // AutomationTest 등록 (이미 등록된 경우 scriptPath/description 업데이트)
    const existing = await db.automationTest.findFirst({
      where: { name: { contains: ticket.ticketKey } },
    })

    let automationTest
    if (existing) {
      automationTest = await db.automationTest.update({
        where: { id: existing.id },
        data: {
          description: `[파이프라인 자동 생성] ${ticket.summary}`,
          scriptPath: relativeScriptPath,
          updatedAt: new Date(),
        },
      })
    } else {
      automationTest = await db.automationTest.create({
        data: {
          name: `[${ticket.ticketKey}] ${ticket.summary}`.slice(0, 200),
          description: `[파이프라인 자동 생성] ${ticket.summary}`,
          testType: 'playwright',
          scriptPath: relativeScriptPath,
          environment: 'dev',
          creatorId: userId,
        },
      })
    }

    logger.info({ pipelineId, automationTestId: automationTest.id, filePath }, '자동화 테스트 등록 완료')
    return c.json({
      success: true,
      message: '자동화 테스트로 등록되었습니다.',
      data: { automation_test_id: automationTest.id, script_path: relativeScriptPath },
    })
  } catch (e) {
    logger.error({ e }, 'Pipeline export 오류')
    return c.json({ success: false, error: String(e) }, 500)
  }
})

// POST /pipeline/:pipelineId/export-k6 — 생성된 K6 코드를 성능 테스트로 등록
pipelineRouter.post('/:pipelineId/export-k6', requireAuth, async (c) => {
  const pipelineId = c.req.param('pipelineId')
  const userId = Number(c.get('user').sub)
  try {
    const [ticket, k6Code] = await Promise.all([
      db.collectedTicket.findUnique({ where: { pipelineId } }),
      db.generatedCode.findFirst({ where: { pipelineId, framework: 'k6' } }),
    ])

    if (!ticket) return c.json({ success: false, error: '파이프라인을 찾을 수 없습니다.' }, 404)
    if (!k6Code) return c.json({ success: false, error: '생성된 K6 코드가 없습니다. 코드 생성 단계가 완료되어야 합니다.' }, 400)

    // 파일 저장: test-scripts/k6/pipeline/{fileName}
    const scriptsRoot = path.join(process.cwd(), '..', 'test-scripts')
    const k6Dir = path.join(scriptsRoot, 'k6', 'pipeline')
    fs.mkdirSync(k6Dir, { recursive: true })

    const fileName = k6Code.fileName ?? `${ticket.ticketKey.toLowerCase().replace(/[^a-z0-9]/g, '-')}.k6.js`
    const filePath = path.join(k6Dir, fileName)
    fs.writeFileSync(filePath, k6Code.code, 'utf-8')

    const relativeScriptPath = path.join('k6', 'pipeline', fileName)

    // PerformanceTest 등록 (이미 등록된 경우 업데이트)
    const existing = await db.performanceTest.findFirst({
      where: { name: { contains: ticket.ticketKey } },
    })

    let performanceTest
    if (existing) {
      performanceTest = await db.performanceTest.update({
        where: { id: existing.id },
        data: {
          description: `[파이프라인 자동 생성] ${ticket.summary}`,
          scriptPath: relativeScriptPath,
          updatedAt: new Date(),
        },
      })
    } else {
      performanceTest = await db.performanceTest.create({
        data: {
          name: `[${ticket.ticketKey}] ${ticket.summary}`.slice(0, 200),
          description: `[파이프라인 자동 생성] ${ticket.summary}`,
          testType: 'k6',
          scriptPath: relativeScriptPath,
          environment: 'dev',
          creatorId: userId,
        },
      })
    }

    logger.info({ pipelineId, performanceTestId: performanceTest.id, filePath }, '성능 테스트 등록 완료')
    return c.json({
      success: true,
      message: '성능 테스트로 등록되었습니다.',
      data: { performance_test_id: performanceTest.id, script_path: relativeScriptPath },
    })
  } catch (e) {
    logger.error({ e }, 'Pipeline K6 export 오류')
    return c.json({ success: false, error: String(e) }, 500)
  }
})
