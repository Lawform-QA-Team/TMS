import Anthropic from '@anthropic-ai/sdk'
import { db } from './db.js'
import { env } from '../env.js'
import { logger } from './logger.js'
import { jiraClient } from './jiraClient.js'

interface FailedTest {
  title: string
  error?: string | undefined
}

interface BugDraft {
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
}

const SYSTEM_PROMPT = `당신은 QA 엔지니어입니다.
실패한 테스트 케이스 목록을 분석하여 버그 리포트 배열을 JSON으로 작성합니다.
반드시 JSON 배열만 반환하고 마크다운이나 설명은 포함하지 마세요.`

function buildBugPrompt(
  ticketKey: string,
  summary: string,
  failedTests: FailedTest[],
): string {
  const testList = failedTests.map((t, i) =>
    `${i + 1}. "${t.title}"${t.error ? `\n   오류: ${t.error.slice(0, 200)}` : ''}`
  ).join('\n')

  return `다음 실패한 테스트 케이스들에 대한 버그 리포트를 작성하세요.

연관 티켓: ${ticketKey} — ${summary}

실패한 테스트:
${testList}

아래 JSON 배열 스키마로만 응답하세요:
[
  {
    "title": "버그 제목 (명확하고 구체적으로)",
    "description": "재현 단계, 기대 결과, 실제 결과를 포함한 상세 설명",
    "severity": "critical|high|medium|low"
  }
]

severity 기준:
- critical: 핵심 기능 완전 중단, 데이터 손실 위험
- high: 주요 기능 오작동, 우회 방법 없음
- medium: 기능 일부 오작동, 우회 가능
- low: 경미한 오류, UI 문제`
}

function parseBugDrafts(text: string): BugDraft[] {
  const stripped = text.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim()
  const jsonMatch = stripped.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('Bug JSON 배열을 찾을 수 없음')
  return JSON.parse(jsonMatch[0]) as BugDraft[]
}

function buildFallbackBug(test: FailedTest, ticketKey: string): BugDraft {
  return {
    title: `[${ticketKey}] 테스트 실패: ${test.title.slice(0, 100)}`,
    description: [
      `연관 티켓: ${ticketKey}`,
      `실패한 테스트: ${test.title}`,
      test.error ? `\n오류 내용:\n${test.error}` : '',
      '\n재현 단계: 테스트 케이스 참조',
      '기대 결과: 테스트 통과',
      '실제 결과: 테스트 실패',
    ].join('\n'),
    severity: 'medium',
  }
}

export async function registerBugs(
  pipelineId: string,
): Promise<{ registered: number; skipped: number }> {
  const [ticket, testRun] = await Promise.all([
    db.collectedTicket.findUnique({ where: { pipelineId } }),
    db.testRunResult.findUnique({ where: { pipelineId } }),
  ])

  if (!ticket) throw new Error(`CollectedTicket 없음: ${pipelineId}`)
  if (!testRun) throw new Error(`TestRunResult 없음: ${pipelineId}`)

  // 실패한 테스트만 대상 (시뮬레이션 모드는 failed=0 이므로 등록 건너뜀)
  const results: Array<{ title: string; status: string; error?: string }> =
    (() => { try { return JSON.parse(testRun.results ?? '[]') } catch { return [] } })()

  const failedTests: FailedTest[] = results
    .filter((r) => r.status === 'failed')
    .map((r) => ({ title: r.title, error: r.error }))

  if (failedTests.length === 0) {
    logger.info({ pipelineId, mode: testRun.status }, '실패 테스트 없음 — 버그 등록 건너뜀')
    await db.collectedTicket.update({
      where: { pipelineId },
      data: { pipelineStatus: 'bugs', updatedAt: new Date() },
    })
    return { registered: 0, skipped: results.length }
  }

  // 버그 초안 생성
  let drafts: BugDraft[]

  if (!env.ANTHROPIC_API_KEY) {
    logger.warn('ANTHROPIC_API_KEY 미설정 — 기본 버그 초안 생성')
    drafts = failedTests.map((t) => buildFallbackBug(t, ticket.ticketKey))
  } else {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: buildBugPrompt(ticket.ticketKey, ticket.summary, failedTests),
      }],
    })

    const content = response.content[0]
    if (!content || content.type !== 'text') throw new Error('Claude 응답 오류')

    try {
      drafts = parseBugDrafts(content.text)
      // drafts 수가 실패 수보다 적으면 fallback으로 보완
      if (drafts.length < failedTests.length) {
        const extra = failedTests.slice(drafts.length).map((t) => buildFallbackBug(t, ticket.ticketKey))
        drafts = [...drafts, ...extra]
      }
    } catch (e) {
      logger.warn({ e }, 'Bug JSON 파싱 실패 — fallback 사용')
      drafts = failedTests.map((t) => buildFallbackBug(t, ticket.ticketKey))
    }
  }

  // DB 저장 + Jira 등록 시도
  let registered = 0
  for (let i = 0; i < drafts.length; i++) {
    const draft = drafts[i]
    if (!draft) continue
    const tcTitle = failedTests[i]?.title ?? null

    let jiraIssueKey: string | null = null

    if (env.JIRA_SERVER_URL) {
      try {
        const jiraSeverityMap: Record<string, string> = {
          critical: 'Highest',
          high: 'High',
          medium: 'Medium',
          low: 'Low',
        }
        const resp = await jiraClient.createIssue({
          summary: draft.title,
          description: draft.description,
          issueType: 'Bug',
          priority: jiraSeverityMap[draft.severity] ?? 'Medium',
        })
        jiraIssueKey = resp.key
        logger.info({ pipelineId, jiraIssueKey }, 'Jira Bug 등록 완료')
      } catch (e) {
        logger.warn({ e }, 'Jira Bug 등록 실패 (DB에만 저장)')
      }
    }

    await db.pipelineBug.create({
      data: {
        pipelineId,
        title: draft.title.slice(0, 500),
        description: draft.description,
        severity: draft.severity,
        status: 'open',
        tcTitle: tcTitle?.slice(0, 500) ?? null,
        jiraIssueKey,
      },
    })
    registered++
  }

  await db.collectedTicket.update({
    where: { pipelineId },
    data: { pipelineStatus: 'bugs', updatedAt: new Date() },
  })

  logger.info({ pipelineId, registered }, '버그 등록 완료 — 파이프라인 완료')
  return { registered, skipped: results.length - failedTests.length }
}
