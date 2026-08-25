import Anthropic from '@anthropic-ai/sdk'
import { db } from './db.js'
import { env } from '../env.js'
import { logger } from './logger.js'

export interface ReportContent {
  summary: string
  passRate: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  qualityScore: number   // 1-10
  testResults: {
    total: number
    passed: number
    failed: number
    skipped: number
    runMode: string
  }
  findings: string[]
  recommendation: string
  readyForRelease: boolean
}

const SYSTEM_PROMPT = `당신은 시니어 QA 리드 엔지니어입니다.
테스트 결과와 티켓 정보를 바탕으로 QA 리포트를 JSON 형식으로 작성합니다.
반드시 JSON 객체만 반환하고 마크다운이나 설명은 포함하지 마세요.`

function buildReportPrompt(
  ticketKey: string,
  summary: string,
  plan: { objective: string; approach: string; estimatedTcCount: number } | null,
  testRun: { status: string; total: number; passed: number; failed: number; skipped: number },
  testTitles: string[],
): string {
  const runModeNote = testRun.status === 'simulation'
    ? '※ 시뮬레이션 모드 (실제 앱 미연결, 모든 테스트 pending 상태)'
    : `실행 결과: 통과 ${testRun.passed}개, 실패 ${testRun.failed}개, 건너뜀 ${testRun.skipped}개`

  const tcList = testTitles.slice(0, 10).map((t, i) => `  ${i + 1}. ${t}`).join('\n')

  return `다음 QA 결과를 분석하여 리포트를 작성하세요.

티켓: ${ticketKey} — ${summary}
${plan ? `목표: ${plan.objective}` : ''}
${plan ? `접근 방식: ${plan.approach}` : ''}

테스트 현황:
- 전체 TC 수: ${testRun.total}개
- ${runModeNote}

테스트 케이스 목록:
${tcList}

아래 JSON 스키마로만 응답하세요 (JSON 외 텍스트 금지):
{
  "summary": "한 문장 QA 결과 요약",
  "passRate": 숫자(0-100, 시뮬레이션이면 null 대신 0),
  "riskLevel": "low|medium|high|critical",
  "qualityScore": 숫자(1-10),
  "testResults": {
    "total": ${testRun.total},
    "passed": ${testRun.passed},
    "failed": ${testRun.failed},
    "skipped": ${testRun.skipped},
    "runMode": "${testRun.status}"
  },
  "findings": ["발견사항1", "발견사항2", "발견사항3"],
  "recommendation": "다음 단계 권고사항",
  "readyForRelease": true|false
}`
}

function parseReportContent(text: string): ReportContent {
  const stripped = text.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim()
  const jsonMatch = stripped.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Report JSON을 찾을 수 없음')
  return JSON.parse(jsonMatch[0]) as ReportContent
}

function buildFallbackReport(
  testRun: { status: string; total: number; passed: number; failed: number; skipped: number },
): ReportContent {
  const isSimulation = testRun.status === 'simulation'
  const passRate = testRun.total > 0 ? Math.round((testRun.passed / testRun.total) * 100) : 0

  const riskLevel: ReportContent['riskLevel'] = isSimulation
    ? 'medium'
    : testRun.failed === 0
      ? 'low'
      : testRun.failed / testRun.total > 0.5
        ? 'critical'
        : testRun.failed / testRun.total > 0.2
          ? 'high'
          : 'medium'

  const qualityScore = isSimulation ? 5 : Math.max(1, Math.round(10 * (1 - testRun.failed / Math.max(testRun.total, 1))))

  return {
    summary: isSimulation
      ? `총 ${testRun.total}개 TC 작성 완료 (실행 환경 미연결 — 시뮬레이션 모드)`
      : `총 ${testRun.total}개 테스트 중 ${testRun.passed}개 통과 (통과율 ${passRate}%)`,
    passRate,
    riskLevel,
    qualityScore,
    testResults: {
      total: testRun.total,
      passed: testRun.passed,
      failed: testRun.failed,
      skipped: testRun.skipped,
      runMode: testRun.status,
    },
    findings: isSimulation
      ? [
          `${testRun.total}개의 테스트 케이스가 자동 생성되었습니다.`,
          'Playwright 테스트 코드가 생성되었으나 실제 앱 연결이 필요합니다.',
          'TEST_APP_BASE_URL 환경변수 설정 후 PLAYWRIGHT_ENABLED=true로 실제 실행 가능합니다.',
        ]
      : [
          `전체 ${testRun.total}개 중 ${testRun.passed}개 통과, ${testRun.failed}개 실패`,
          testRun.failed > 0 ? `${testRun.failed}개 실패 케이스에 대한 버그 등록 필요` : '모든 테스트 통과',
        ],
    recommendation: isSimulation
      ? 'TEST_APP_BASE_URL과 PLAYWRIGHT_ENABLED=true 설정 후 실제 테스트 실행을 권장합니다.'
      : testRun.failed === 0
        ? '모든 테스트 통과. 릴리즈 준비 완료.'
        : `${testRun.failed}개 실패 케이스 수정 후 재테스트 권장.`,
    readyForRelease: !isSimulation && testRun.failed === 0,
  }
}

export async function generateReport(
  pipelineId: string,
): Promise<{ summary: string; riskLevel: string; qualityScore: number; readyForRelease: boolean }> {
  const [ticket, testRun] = await Promise.all([
    db.collectedTicket.findUnique({
      where: { pipelineId },
      include: {
        qaPlan: { include: { autoQaTestCases: { take: 10 } } },
      },
    }),
    db.testRunResult.findUnique({ where: { pipelineId } }),
  ])

  if (!ticket) throw new Error(`CollectedTicket 없음: ${pipelineId}`)
  if (!testRun) throw new Error(`TestRunResult 없음: ${pipelineId}`)

  const plan = ticket.qaPlan?.planContent
    ? (() => {
        try {
          return JSON.parse(ticket.qaPlan!.planContent!) as {
            objective: string
            approach: string
            estimatedTcCount: number
          }
        } catch { return null }
      })()
    : null

  const testTitles = (ticket.qaPlan?.autoQaTestCases ?? []).map((tc) => tc.title)

  const runSummary = {
    status: testRun.status,
    total: testRun.totalTests,
    passed: testRun.passed,
    failed: testRun.failed,
    skipped: testRun.skipped,
  }

  let report: ReportContent

  if (!env.ANTHROPIC_API_KEY) {
    logger.warn('ANTHROPIC_API_KEY 미설정 — 기본 리포트 생성')
    report = buildFallbackReport(runSummary)
  } else {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: buildReportPrompt(ticket.ticketKey, ticket.summary, plan, runSummary, testTitles),
      }],
    })

    const content = response.content[0]
    if (!content || content.type !== 'text') throw new Error('Claude 응답 오류')

    try {
      report = parseReportContent(content.text)
      // testResults는 실제 값으로 덮어쓰기 (AI가 다른 값 반환 방지)
      report.testResults = { ...runSummary, runMode: runSummary.status }
    } catch (e) {
      logger.warn({ e }, 'Report JSON 파싱 실패 — fallback 사용')
      report = buildFallbackReport(runSummary)
    }
  }

  await db.pipelineReport.upsert({
    where: { pipelineId },
    create: {
      pipelineId,
      summary: report.summary,
      content: JSON.stringify(report),
      passRate: report.passRate,
      riskLevel: report.riskLevel,
      qualityScore: report.qualityScore,
      readyForRelease: report.readyForRelease,
    },
    update: {
      summary: report.summary,
      content: JSON.stringify(report),
      passRate: report.passRate,
      riskLevel: report.riskLevel,
      qualityScore: report.qualityScore,
      readyForRelease: report.readyForRelease,
      updatedAt: new Date(),
    },
  })

  await db.collectedTicket.update({
    where: { pipelineId },
    data: { pipelineStatus: 'report', updatedAt: new Date() },
  })

  logger.info({ pipelineId, riskLevel: report.riskLevel, qualityScore: report.qualityScore }, '리포트 생성 완료')
  return {
    summary: report.summary,
    riskLevel: report.riskLevel,
    qualityScore: report.qualityScore,
    readyForRelease: report.readyForRelease,
  }
}
