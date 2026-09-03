import Anthropic from '@anthropic-ai/sdk'
import { db } from './db.js'
import { env } from '../env.js'
import { logger } from './logger.js'

export interface UIElement {
  selector: string         // 기본 selector (data-testid, aria-label 등 우선)
  fallbackSelector: string // 폴백 selector (태그+텍스트 조합)
  type: 'button' | 'input' | 'link' | 'select' | 'checkbox' | 'radio' | 'form' | 'other'
  label: string            // 사람이 읽을 수 있는 레이블
}

export interface PageFlow {
  name: string
  steps: string[]
}

export interface AnalyzedPage {
  pageName: string
  urlPattern: string
  elements: UIElement[]
  flows: PageFlow[]
}

const SYSTEM_PROMPT = `당신은 시니어 QA 자동화 엔지니어입니다.
테스트 케이스 목록을 분석하여 각 테스트에 필요한 페이지와 UI 요소를 파악합니다.
Playwright 자동화 코드 작성에 사용할 selector를 포함해서 반환합니다.
반드시 JSON 배열만 반환하고 다른 텍스트는 포함하지 마세요.`

function buildPrompt(
  ticketKey: string,
  summary: string,
  testCases: Array<{ title: string; steps: string[]; preconditions: string[]; gherkin: string }>,
  baseUrl: string,
): string {
  const tcText = testCases.slice(0, 5).map((tc, i) =>
    `TC${i + 1}: ${tc.title}\n  Steps: ${tc.steps.slice(0, 3).join(' → ')}`
  ).join('\n\n')

  return `다음 티켓의 TC들에 필요한 페이지와 UI 요소를 파악하세요.

티켓: ${ticketKey} — ${summary}
기본 URL: ${baseUrl}

TC 요약:
${tcText}

⚠️ 반드시 아래 JSON 배열 형식만 반환하세요. 설명/마크다운 절대 금지.
최대 3개 페이지, 페이지당 elements 최대 5개, flows 최대 3개.

[{"pageName":"","urlPattern":"","elements":[{"selector":"","fallbackSelector":"","type":"button","label":""}],"flows":[{"name":"","steps":[""]}]}]

실제 응답 (위 스키마 준수, 배열만):`
}

function parseAnalyzedPages(text: string): AnalyzedPage[] {
  const stripped = text.replace(/```(?:json)?\s*/g, '').replace(/```/g, '')
  const jsonMatch = stripped.match(/\[[\s\S]*/)
  if (!jsonMatch) throw new Error('PageAnalysis JSON 배열을 찾을 수 없음')

  const raw = jsonMatch[0]
  // 시도 1: 원본 그대로
  try { return JSON.parse(raw) as AnalyzedPage[] } catch { /* continue */ }
  // 시도 2: }, 기준 잘라서 복구
  const lastComma = raw.lastIndexOf('},')
  if (lastComma !== -1) {
    try { return JSON.parse(raw.slice(0, lastComma + 1) + ']') as AnalyzedPage[] } catch { /* continue */ }
  }
  // 시도 3: } 기준 잘라서 복구
  const lastBrace = raw.lastIndexOf('}')
  if (lastBrace !== -1) {
    try { return JSON.parse(raw.slice(0, lastBrace + 1) + ']') as AnalyzedPage[] } catch { /* continue */ }
  }
  throw new Error('PageAnalysis JSON 파싱 실패')
}

export async function analyzePages(
  pipelineId: string,
  qaPlanId: number,
): Promise<{ analyzed: number }> {
  const qaPlan = await db.qAPlan.findUnique({
    where: { id: qaPlanId },
    include: {
      collectedTicket: true,
      autoQaTestCases: { take: 10 },
    },
  })
  if (!qaPlan) throw new Error(`QAPlan 없음: ${qaPlanId}`)

  const ticket = qaPlan.collectedTicket
  const testCases = qaPlan.autoQaTestCases.map((tc) => ({
    title: tc.title,
    steps: (() => { try { return JSON.parse(tc.steps ?? '[]') } catch { return [] } })() as string[],
    preconditions: (() => { try { return JSON.parse(tc.preconditions ?? '[]') } catch { return [] } })() as string[],
    gherkin: tc.gherkin ?? '',
  }))

  const baseUrl = env.TEST_APP_BASE_URL ?? 'http://localhost:3017'

  let pages: AnalyzedPage[]

  if (!env.ANTHROPIC_API_KEY) {
    logger.warn('ANTHROPIC_API_KEY 미설정 — 기본 페이지 분석 생성')
    pages = [{
      pageName: `${ticket.summary} 페이지`,
      urlPattern: `${baseUrl}/`,
      elements: [
        {
          selector: "role='button' name='제출'",
          fallbackSelector: "button[type='submit']",
          type: 'button',
          label: '제출 버튼',
        },
      ],
      flows: [{
        name: '기본 플로우',
        steps: ['페이지 접속', '기능 실행', '결과 확인'],
      }],
    }]
  } else {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: buildPrompt(ticket.ticketKey, ticket.summary, testCases, baseUrl),
      }],
    })

    const content = response.content[0]
    if (!content || content.type !== 'text') throw new Error('Claude 응답 오류')
    pages = parseAnalyzedPages(content.text)
  }

  // DB 저장 (기존 레코드 삭제 후 재생성)
  await db.pageAnalysis.deleteMany({ where: { pipelineId } })

  let analyzed = 0
  for (const page of pages) {
    await db.pageAnalysis.create({
      data: {
        pipelineId,
        pageName: page.pageName.slice(0, 200),
        urlPattern: page.urlPattern?.slice(0, 500) ?? null,
        elements: JSON.stringify(page.elements ?? []),
        flows: JSON.stringify(page.flows ?? []),
        rawAnalysis: JSON.stringify(page),
      },
    })
    analyzed++
  }

  // pipelineStatus 업데이트
  await db.collectedTicket.update({
    where: { pipelineId },
    data: { pipelineStatus: 'pageanalysis', updatedAt: new Date() },
  })

  logger.info({ pipelineId, qaPlanId, analyzed }, '페이지 분석 완료')
  return { analyzed }
}
