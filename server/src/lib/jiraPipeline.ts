/**
 * Jira → TMS 자동화 파이프라인
 *
 * Flow:
 *   1. Jira Webhook 수신 (POST /jira/webhook)
 *   2. BullMQ 큐에 Job 등록
 *   3. Worker: Jira 이슈 내용 → Claude AI → TC 자동 생성
 *   4. 생성된 TC를 TMS DB에 저장
 *   5. (옵션) 결과를 Jira 이슈 댓글로 업데이트
 */
import { Queue, Worker, type Job } from 'bullmq'
import Anthropic from '@anthropic-ai/sdk'
import { getRedis } from './redis.js'
import { db } from './db.js'
import { jiraClient } from './jiraClient.js'
import { env } from '../env.js'
import { logger } from './logger.js'
import type { NormalizedTicket } from './ticketNormalizer.js'
import { resolveEpicContext } from './epicContextResolver.js'
import { generateQAPlan, createQAPlanRecord } from './qaPlanGenerator.js'
import { sendQAPlanApprovalRequest, sendTestCasesComplete, sendPageAnalysisComplete, sendCodegenComplete, sendTestRunComplete, sendReportComplete, sendBugsComplete } from './slackNotifier.js'
import { generateTestCases } from './testCaseGenerator.js'
import { analyzePages } from './pageAnalyzer.js'
import { generateCode } from './codeGenerator.js'
import { runTests } from './testRunner.js'
import { generateReport } from './reportGenerator.js'
import { registerBugs } from './bugRegistrar.js'

// ──────────────────────────────────────────────
// Job 타입 정의
// ──────────────────────────────────────────────

export type JiraPipelineJobData =
  | {
      type: 'create-tc-from-jira'
      issueKey: string
      summary: string
      description: string
      issueType: string
      priority: string
      projectKey: string
      environment?: string | undefined
      folderId?: number | undefined
      creatorId?: number | undefined
    }
  | {
      type: 'sync-jira-status'
      issueKey: string
      newStatus: string
    }
  | {
      type: 'auto-create-bug'
      testCaseId?: number | undefined
      automationTestId?: number | undefined
      performanceTestId?: number | undefined
      testName: string
      testResult: string
      errorMessage?: string | undefined
      environment: string
    }
  | {
      type: 'collect-complete'
      ticketKey: string
      pipelineId: string
      payload: NormalizedTicket
    }
  | {
      type: 'qaplan-approved'
      pipelineId: string
      qaPlanId: number
    }
  | {
      type: 'testcases-complete'
      pipelineId: string
      qaPlanId: number
    }
  | {
      type: 'pageanalysis-complete'
      pipelineId: string
      qaPlanId: number
    }
  | {
      type: 'codegen-complete'
      pipelineId: string
    }
  | {
      type: 'testrun-complete'
      pipelineId: string
    }
  | {
      type: 'report-complete'
      pipelineId: string
    }

// ──────────────────────────────────────────────
// Queue & Worker 초기화 (lazy)
// ──────────────────────────────────────────────

let _queue: Queue<JiraPipelineJobData> | null = null
let _worker: Worker<JiraPipelineJobData> | null = null

export function getJiraQueue(): Queue<JiraPipelineJobData> {
  if (!_queue) {
    _queue = new Queue<JiraPipelineJobData>(env.QUEUE_NAME, { connection: getRedis(), prefix: '{bull}' })
  }
  return _queue
}

// ──────────────────────────────────────────────
// Claude AI TC 생성 헬퍼
// ──────────────────────────────────────────────

async function generateTCFromJiraIssue(opts: {
  issueKey: string
  summary: string
  description: string
  issueType: string
  priority: string
}): Promise<Array<{ name: string; description: string; steps?: string; expectedResult?: string; priority?: string }>> {
  if (!env.ANTHROPIC_API_KEY) {
    logger.warn('ANTHROPIC_API_KEY 미설정 — 기본 TC 생성')
    return [
      {
        name: `[${opts.issueKey}] ${opts.summary}`,
        description: opts.description || opts.summary,
        priority: opts.priority === 'High' || opts.priority === 'Critical' ? 'P1' : 'P2',
      },
    ]
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  const prompt = `
Jira 이슈로부터 테스트케이스를 JSON 배열로 생성해 주세요.

이슈 정보:
- 키: ${opts.issueKey}
- 제목: ${opts.summary}
- 설명: ${opts.description || '(없음)'}
- 유형: ${opts.issueType}
- 우선순위: ${opts.priority}

각 테스트케이스는 다음 형식으로 반환해 주세요:
[
  {
    "name": "TC 이름",
    "description": "TC 설명",
    "steps": "테스트 단계 (줄바꿈 구분)",
    "expected_result": "기대 결과",
    "priority": "P1|P2|P3"
  }
]

응답은 JSON 배열만 반환하세요 (설명 없이).
`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0]
  if (!content || content.type !== 'text') throw new Error('AI 응답 오류')

  try {
    const jsonMatch = content.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('JSON 배열을 찾을 수 없음')
    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      name: string
      description: string
      steps?: string
      expected_result?: string
      priority?: string
    }>
    return parsed.map((tc) => ({
      name: tc.name,
      description: tc.description,
      ...(tc.steps !== undefined && { steps: tc.steps }),
      ...(tc.expected_result !== undefined && { expectedResult: tc.expected_result }),
      ...(tc.priority !== undefined && { priority: tc.priority }),
    }))
  } catch (e) {
    logger.error({ e }, 'TC JSON 파싱 오류')
    return [{ name: `[${opts.issueKey}] ${opts.summary}`, description: opts.description }]
  }
}

// ──────────────────────────────────────────────
// Job 처리 핸들러
// ──────────────────────────────────────────────

async function processJob(job: Job<JiraPipelineJobData>): Promise<void> {
  const data = job.data

  if (data.type === 'create-tc-from-jira') {
    logger.info({ issueKey: data.issueKey }, 'Jira → TC 생성 시작')

    const tcs = await generateTCFromJiraIssue({
      issueKey: data.issueKey,
      summary: data.summary,
      description: data.description,
      issueType: data.issueType,
      priority: data.priority,
    })

    const created = []
    for (const tc of tcs) {
      const saved = await db.testCase.create({
        data: {
          name: tc.name.slice(0, 100),
          description: tc.description ?? null,
          testSteps: tc.steps ?? null,
          expectedResult: tc.expectedResult ?? null,
          priority: tc.priority ?? 'P2',
          status: 'draft',
          environment: data.environment ?? 'dev',
          folderId: data.folderId ?? null,
          creatorId: data.creatorId ?? null,
          mainCategory: `Jira:${data.projectKey}`,
          subCategory: data.issueType,
          remark: `자동 생성: Jira 이슈 ${data.issueKey}`,
        },
      })
      created.push(saved)

      // Jira 이슈와 연결
      await db.jiraIssue.upsert({
        where: { issueKey: data.issueKey },
        create: {
          issueKey: data.issueKey,
          projectKey: data.projectKey,
          issueType: data.issueType,
          status: 'To Do',
          priority: data.priority,
          summary: data.summary,
          description: data.description,
          testCaseId: saved.id,
        },
        update: { testCaseId: saved.id },
      })
    }

    // Jira 이슈에 댓글 달기 (설정 시)
    if (env.JIRA_SERVER_URL && created.length > 0) {
      try {
        const comment = `✅ TMS에서 테스트케이스 ${created.length}개가 자동 생성되었습니다.\n` +
          created.map((tc) => `- TC #${tc.id}: ${tc.name}`).join('\n')
        await jiraClient.addComment(data.issueKey, comment)
      } catch (e) {
        logger.warn({ e }, 'Jira 댓글 추가 실패 (무시)')
      }
    }

    logger.info({ issueKey: data.issueKey, count: created.length }, 'Jira → TC 생성 완료')
  }

  else if (data.type === 'collect-complete') {
    logger.info({ pipelineId: data.pipelineId }, 'collect-complete → QA Plan 생성 시작')
    try {
      const { planContent } = await generateQAPlan(data.payload)
      const { qaPlanId } = await createQAPlanRecord(data.payload, planContent)
      await sendQAPlanApprovalRequest(data.payload, planContent, qaPlanId)
      logger.info({ pipelineId: data.pipelineId, qaPlanId }, 'QA Plan Slack 승인 요청 발송')
    } catch (e) {
      logger.error({ e, pipelineId: data.pipelineId }, 'QA Plan 생성 오류')
      await db.collectedTicket.update({
        where: { pipelineId: data.pipelineId },
        data: { pipelineStatus: 'collected', errorMessage: String(e), updatedAt: new Date() },
      })
    }
  }

  else if (data.type === 'qaplan-approved') {
    logger.info({ pipelineId: data.pipelineId, qaPlanId: data.qaPlanId }, 'QA Plan 승인 → TC 생성 시작')
    try {
      // qa-requested 레이블이 있으면 Epic 컨텍스트 재조회
      const collectedTicket = await db.collectedTicket.findUnique({ where: { pipelineId: data.pipelineId } })
      let epicContext: Awaited<ReturnType<typeof resolveEpicContext>> | undefined
      if (collectedTicket) {
        const labels = JSON.parse(collectedTicket.labels ?? '[]') as string[]
        if (labels.includes('qa-requested')) {
          epicContext = await resolveEpicContext(collectedTicket.ticketKey)
        }
      }
      const { saved } = await generateTestCases(data.qaPlanId, data.pipelineId, epicContext)
      await sendTestCasesComplete(data.pipelineId, saved)
      // Phase 4: 페이지 분석으로 자동 진행
      await getJiraQueue().add('testcases-complete', {
        type: 'testcases-complete',
        pipelineId: data.pipelineId,
        qaPlanId: data.qaPlanId,
      })
      logger.info({ pipelineId: data.pipelineId, saved }, 'AutoQaTestCase 생성 완료 → 페이지 분석 큐 등록')
    } catch (e) {
      logger.error({ e, pipelineId: data.pipelineId }, 'TC 생성 오류')
      await db.collectedTicket.update({
        where: { pipelineId: data.pipelineId },
        data: { pipelineStatus: 'qaplan', errorMessage: String(e), updatedAt: new Date() },
      })
    }
  }

  else if (data.type === 'testcases-complete') {
    logger.info({ pipelineId: data.pipelineId, qaPlanId: data.qaPlanId }, 'TC 완료 → 페이지 분석 시작')
    try {
      const { analyzed } = await analyzePages(data.pipelineId, data.qaPlanId)
      await sendPageAnalysisComplete(data.pipelineId, analyzed)
      // Phase 5: 페이지 분석 완료 → 코드 생성 자동 진행
      await getJiraQueue().add('pageanalysis-complete', {
        type: 'pageanalysis-complete',
        pipelineId: data.pipelineId,
        qaPlanId: data.qaPlanId,
      })
      logger.info({ pipelineId: data.pipelineId, analyzed }, '페이지 분석 완료 → 코드 생성 큐 등록')
    } catch (e) {
      logger.error({ e, pipelineId: data.pipelineId }, '페이지 분석 오류')
      await db.collectedTicket.update({
        where: { pipelineId: data.pipelineId },
        data: { pipelineStatus: 'testcases', errorMessage: String(e), updatedAt: new Date() },
      })
    }
  }

  else if (data.type === 'pageanalysis-complete') {
    logger.info({ pipelineId: data.pipelineId, qaPlanId: data.qaPlanId }, '페이지 분석 완료 → 코드 생성 시작')
    try {
      const { fileName, linesOfCode } = await generateCode(data.pipelineId, data.qaPlanId)
      await sendCodegenComplete(data.pipelineId, fileName, linesOfCode)
      // Phase 6: 코드 생성 완료 → 테스트 실행 자동 진행
      await getJiraQueue().add('codegen-complete', {
        type: 'codegen-complete',
        pipelineId: data.pipelineId,
      })
      logger.info({ pipelineId: data.pipelineId, fileName, linesOfCode }, '코드 생성 완료 → 테스트 실행 큐 등록')
    } catch (e) {
      logger.error({ e, pipelineId: data.pipelineId }, '코드 생성 오류')
      await db.collectedTicket.update({
        where: { pipelineId: data.pipelineId },
        data: { pipelineStatus: 'pageanalysis', errorMessage: String(e), updatedAt: new Date() },
      })
    }
  }

  else if (data.type === 'codegen-complete') {
    logger.info({ pipelineId: data.pipelineId }, '코드 생성 완료 → 테스트 실행 시작')
    try {
      const { status, totalTests, passed, failed } = await runTests(data.pipelineId)
      await sendTestRunComplete(data.pipelineId, status, totalTests, passed, failed)
      // Phase 7: 테스트 실행 완료 → 리포트 자동 생성
      await getJiraQueue().add('testrun-complete', {
        type: 'testrun-complete',
        pipelineId: data.pipelineId,
      })
      logger.info({ pipelineId: data.pipelineId, status, totalTests, passed, failed }, '테스트 실행 완료 → 리포트 큐 등록')
    } catch (e) {
      logger.error({ e, pipelineId: data.pipelineId }, '테스트 실행 오류')
      await db.collectedTicket.update({
        where: { pipelineId: data.pipelineId },
        data: { pipelineStatus: 'codegen', errorMessage: String(e), updatedAt: new Date() },
      })
    }
  }

  else if (data.type === 'testrun-complete') {
    logger.info({ pipelineId: data.pipelineId }, '테스트 실행 완료 → 리포트 생성 시작')
    try {
      const { summary, riskLevel, qualityScore, readyForRelease } = await generateReport(data.pipelineId)
      await sendReportComplete(data.pipelineId, summary, riskLevel, qualityScore, readyForRelease)
      // Phase 8: 리포트 완료 → 버그 등록 자동 진행
      await getJiraQueue().add('report-complete', {
        type: 'report-complete',
        pipelineId: data.pipelineId,
      })
      logger.info({ pipelineId: data.pipelineId, riskLevel, qualityScore, readyForRelease }, '리포트 생성 완료 → 버그 등록 큐 등록')
    } catch (e) {
      logger.error({ e, pipelineId: data.pipelineId }, '리포트 생성 오류')
      await db.collectedTicket.update({
        where: { pipelineId: data.pipelineId },
        data: { pipelineStatus: 'testrun', errorMessage: String(e), updatedAt: new Date() },
      })
    }
  }

  else if (data.type === 'report-complete') {
    logger.info({ pipelineId: data.pipelineId }, '리포트 완료 → 버그 등록 시작')
    try {
      const { registered, skipped } = await registerBugs(data.pipelineId)
      await sendBugsComplete(data.pipelineId, registered, skipped)
      logger.info({ pipelineId: data.pipelineId, registered, skipped }, '버그 등록 완료 — 파이프라인 완료')
    } catch (e) {
      logger.error({ e, pipelineId: data.pipelineId }, '버그 등록 오류')
      await db.collectedTicket.update({
        where: { pipelineId: data.pipelineId },
        data: { pipelineStatus: 'report', errorMessage: String(e), updatedAt: new Date() },
      })
    }
  }

  else if (data.type === 'sync-jira-status') {
    logger.info({ issueKey: data.issueKey, newStatus: data.newStatus }, 'Jira 상태 동기화')
    await db.jiraIssue.updateMany({
      where: { issueKey: data.issueKey },
      data: { status: data.newStatus, updatedAt: new Date() },
    })
  }

  else if (data.type === 'auto-create-bug') {
    if (!['Fail', 'Error'].includes(data.testResult)) return

    logger.info({ testName: data.testName }, '테스트 실패 → Jira Bug 생성')

    const priority = data.testResult === 'Error' ? 'High' : 'Medium'
    const summary = `[테스트 실패] ${data.testName}`
    const description = `테스트가 실패했습니다.\n\n환경: ${data.environment}\n결과: ${data.testResult}${data.errorMessage ? `\n\n오류 메시지:\n${data.errorMessage}` : ''}`

    // DB에 이슈 저장
    const lastIssue = await db.jiraIssue.findFirst({
      where: { projectKey: env.JIRA_PROJECT_KEY },
      orderBy: { id: 'desc' },
    })
    const nextNum = lastIssue
      ? (parseInt(lastIssue.issueKey.split('-')[1] ?? '0') + 1)
      : 1
    const issueKey = `${env.JIRA_PROJECT_KEY}-${nextNum}`

    const issue = await db.jiraIssue.create({
      data: {
        issueKey,
        projectKey: env.JIRA_PROJECT_KEY,
        issueType: 'Bug',
        status: 'To Do',
        priority,
        summary,
        description,
        environment: data.environment,
        testCaseId: data.testCaseId ?? null,
        automationTestId: data.automationTestId ?? null,
      },
    })

    // 실제 Jira에도 생성 시도 (설정 시)
    if (env.JIRA_SERVER_URL) {
      try {
        const jiraResp = await jiraClient.createIssue({ summary, description, issueType: 'Bug', priority })
        await db.jiraIssue.update({
          where: { id: issue.id },
          data: { issueKey: jiraResp.key },
        })
      } catch (e) {
        logger.warn({ e }, 'Jira 외부 API Bug 생성 실패 (DB에만 저장됨)')
      }
    }

    logger.info({ issueKey: issue.issueKey }, '테스트 실패 Bug 이슈 생성 완료')
  }
}

// ──────────────────────────────────────────────
// Worker 시작 (앱 부팅 시 호출)
// ──────────────────────────────────────────────

export function getJiraWorker(): Worker<JiraPipelineJobData> | null {
  return _worker
}

export function startJiraPipelineWorker(): Worker<JiraPipelineJobData> {
  if (_worker) return _worker

  _worker = new Worker<JiraPipelineJobData>(env.QUEUE_NAME, processJob, {
    connection: getRedis(),
    prefix: '{bull}',
    concurrency: 3,
  })

  _worker.on('completed', (job) =>
    logger.info({ jobId: job.id, type: job.data.type }, 'Jira pipeline job 완료'),
  )
  _worker.on('failed', (job, err) =>
    logger.error({ jobId: job?.id, type: job?.data?.type, err: String(err) }, 'Jira pipeline job 실패'),
  )

  logger.info('Jira pipeline worker 시작')
  return _worker
}
