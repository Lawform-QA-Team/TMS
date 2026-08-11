import Anthropic from '@anthropic-ai/sdk'
import { db } from './db.js'
import { env } from '../env.js'
import { logger } from './logger.js'
import type { QAPlanContent } from './qaPlanGenerator.js'

export type CaseType = 'happyPath' | 'negative' | 'boundary' | 'edge'
export type TCPriority = 'P1' | 'P2' | 'P3' | 'P4'

export interface GeneratedTestCase {
  title: string
  caseType: CaseType
  priority: TCPriority
  preconditions: string[]
  steps: string[]
  expectedResult: string
  tags: string[]
  gherkin: string
}

const MAX_TC = 10  // 토큰 절약을 위한 상한

const SYSTEM_PROMPT = `당신은 시니어 QA 엔지니어입니다.
QA Plan과 티켓 정보를 분석하여 구체적인 테스트 케이스를 JSON 배열로 작성합니다.
반드시 JSON 배열만 반환하고 다른 텍스트는 포함하지 마세요.`
function buildEpicContextSection(epicContext: import('./ticketNormalizer.js').NormalizedTicket['epicContext']): string {
  if (!epicContext?.epicKey) return ''
  const lines: string[] = ['\n--- 기획 컨텍스트 ---']
  if (epicContext.epicSummary) lines.push(`Epic: ${epicContext.epicSummary}`)
  if (epicContext.planningContent) {
    lines.push('기획 내용:')
    lines.push(epicContext.planningContent.slice(0, 2500))
  }
  if (epicContext.figmaContent) {
    lines.push('Figma 기획 내용:')
    lines.push(epicContext.figmaContent.slice(0, 1500))
  } else if (epicContext.figmaUrls.length > 0) {
    lines.push('참고 Figma 링크:')
    lines.push(epicContext.figmaUrls.map(u => `- ${u}`).join('\n'))
  }
  return lines.join('\n')
}

function buildPrompt(
  ticketKey: string,
  summary: string,
  descriptionText: string,
  plan: QAPlanContent,
  targetCount: number,
  epicContext?: import('./ticketNormalizer.js').NormalizedTicket['epicContext'],
): string {
  const count = Math.min(targetCount, MAX_TC)
  const epicSection = buildEpicContextSection(epicContext)

): string {
  const count = Math.min(targetCount, MAX_TC)
  return `다음 정보를 바탕으로 테스트 케이스 ${count}개를 작성해주세요.

티켓: ${ticketKey}
제목: ${summary}
설명: ${descriptionText || '(없음)'}
${epicSection}

QA Plan:
- 목표: ${plan.objective}
- 범위: ${plan.scope.join(', ')}
- 테스트 유형: ${plan.testTypes.join(', ')}

아래 JSON 배열 스키마를 정확히 따라 반환하세요 (배열 외 텍스트 금지):
[
  {
    "title": "테스트 케이스 제목 (명확하고 구체적으로)",
    "caseType": "happyPath | negative | boundary | edge",
    "priority": "P1 | P2 | P3 | P4",
    "preconditions": ["사전 조건1", ...],
    "steps": ["1. 단계1", "2. 단계2", ...],
    "expectedResult": "기대 결과",
    "tags": ["태그1", ...],
    "gherkin": "Feature: ...\\nScenario: ...\\n  Given ...\\n  When ...\\n  Then ..."
  }
]

우선순위 기준: P1=치명적, P2=주요, P3=일반, P4=낮음
caseType 비율 권장: happyPath 40%, negative 30%, boundary 20%, edge 10%`
}

function parseTestCases(text: string): GeneratedTestCase[] {
  // JSON 배열 추출 — stop_reason이 max_tokens일 때 잘릴 수 있으므로 마지막 완전한 객체까지만 파싱
  const jsonMatch = text.match(/\[[\s\S]*/)
  if (!jsonMatch) throw new Error('TC JSON 배열을 찾을 수 없음')

  let raw = jsonMatch[0]

  // 완전한 JSON이면 그대로 파싱
  try {
    return JSON.parse(raw) as GeneratedTestCase[]
  } catch {
    // 응답이 잘린 경우 마지막 완전한 객체까지만 추출
    const lastBrace = raw.lastIndexOf('},')
    if (lastBrace !== -1) {
      raw = raw.slice(0, lastBrace + 1) + ']'
      try {
        return JSON.parse(raw) as GeneratedTestCase[]
      } catch {
        // 그래도 안 되면 개별 객체 단위로 추출
      }
    }
    // 완전한 JSON 객체들을 개별 추출
    const objects: GeneratedTestCase[] = []
    const objRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)?\}/g
    let match: RegExpExecArray | null
    while ((match = objRegex.exec(text)) !== null) {
      try {
        objects.push(JSON.parse(match[0]) as GeneratedTestCase)
      } catch { /* skip malformed */ }
    }
    if (objects.length === 0) throw new Error('TC JSON 파싱 실패')
    return objects
  }
}

export async function generateTestCases(
  qaPlanId: number,
  pipelineId: string,
  epicContext?: import('./epicContextResolver.js').EpicContext,
): Promise<{ saved: number }> {
  // QAPlan + CollectedTicket 조회
  const qaPlan = await db.qAPlan.findUnique({
    where: { id: qaPlanId },
    include: { collectedTicket: true },
  })
  if (!qaPlan) throw new Error(`QAPlan 없음: ${qaPlanId}`)

  const ticket = qaPlan.collectedTicket
  const plan: QAPlanContent = JSON.parse(qaPlan.planContent ?? '{}')

  const targetCount = Math.min(plan.estimatedTcCount ?? 5, MAX_TC)

  let cases: GeneratedTestCase[]

  if (!env.ANTHROPIC_API_KEY) {
    logger.warn('ANTHROPIC_API_KEY 미설정 — 기본 TC 생성')
    cases = [{
      title: `[${ticket.ticketKey}] 기본 기능 동작 확인`,
      caseType: 'happyPath',
      priority: ticket.priority as TCPriority ?? 'P2',
      preconditions: ['서비스 정상 동작 중'],
      steps: ['1. 해당 기능 접근', '2. 정상 입력값 입력', '3. 제출'],
      expectedResult: '기능이 정상적으로 동작한다.',
      tags: [ticket.issueType, ticket.projectKey],
      gherkin: `Feature: ${ticket.summary}\n  Scenario: 기본 동작\n    Given 서비스가 정상 동작 중\n    When 기능을 실행하면\n    Then 정상 결과가 반환된다`,
    }]
  } else {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: buildPrompt(
          ticket.ticketKey,
          ticket.summary,
          ticket.descriptionText ?? '',
          plan,
          targetCount,
          epicContext,
        ),
      }],
    })

    const content = response.content[0]
    if (!content || content.type !== 'text') throw new Error('Claude 응답 오류')
    cases = parseTestCases(content.text)
  }

  // DB 저장
  let saved = 0
  for (const tc of cases) {
    await db.autoQaTestCase.create({
      data: {
        qaPlanId,
        pipelineId,
        title: tc.title.slice(0, 200),
        caseType: tc.caseType ?? 'happyPath',
        priority: tc.priority ?? 'P2',
        preconditions: JSON.stringify(tc.preconditions ?? []),
        steps: JSON.stringify(tc.steps ?? []),
        expectedResult: tc.expectedResult ?? null,
        tags: JSON.stringify(tc.tags ?? []),
        gherkin: tc.gherkin ?? null,
        status: 'draft',
      },
    })
    saved++
  }

  // pipelineStatus 업데이트
  await db.collectedTicket.update({
    where: { pipelineId },
    data: { pipelineStatus: 'testcases', updatedAt: new Date() },
  })

  logger.info({ pipelineId, qaPlanId, saved }, 'AutoQaTestCase 생성 완료')
  return { saved }
}
