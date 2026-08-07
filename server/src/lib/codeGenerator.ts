import Anthropic from '@anthropic-ai/sdk'
import { db } from './db.js'
import { env } from '../env.js'
import { logger } from './logger.js'

interface TCForCodegen {
  title: string
  caseType: string
  priority: string
  steps: string[]
  preconditions: string[]
  expectedResult: string
  gherkin: string
}

interface PageForCodegen {
  pageName: string
  urlPattern: string
  elements: Array<{
    selector: string
    fallbackSelector: string
    type: string
    label: string
  }>
  flows: Array<{
    name: string
    steps: string[]
  }>
}

const SYSTEM_PROMPT = `당신은 시니어 QA 자동화 엔지니어입니다.
테스트 케이스와 페이지 분석 결과를 바탕으로 Playwright TypeScript 테스트 코드를 작성합니다.
코드만 반환하고 설명이나 마크다운 코드블록은 포함하지 마세요.`

function buildCodegenPrompt(
  ticketKey: string,
  summary: string,
  pipelineId: string,
  testCases: TCForCodegen[],
  pages: PageForCodegen[],
  baseUrl: string,
): string {
  const pageContext = pages.slice(0, 5).map((p) =>
    `페이지: ${p.pageName} (${p.urlPattern})
요소: ${p.elements.slice(0, 8).map((el) => `${el.label}[${el.selector}]`).join(', ')}
플로우: ${p.flows.map((f) => f.name).join(', ')}`
  ).join('\n\n')

  const tcContext = testCases.slice(0, 10).map((tc, i) =>
    `TC${i + 1} [${tc.caseType}/${tc.priority}]: ${tc.title}
  사전조건: ${tc.preconditions.slice(0, 2).join('; ')}
  단계: ${tc.steps.slice(0, 5).join(' → ')}
  기대결과: ${tc.expectedResult}`
  ).join('\n\n')

  return `다음 티켓의 테스트 케이스를 Playwright TypeScript 코드로 작성하세요.

티켓: ${ticketKey} — ${summary}
파이프라인 ID: ${pipelineId}
기본 URL: ${baseUrl}

페이지 분석:
${pageContext}

테스트 케이스:
${tcContext}

요구사항:
1. import { test, expect } from '@playwright/test'; 사용
2. test.describe('${ticketKey}', () => { ... }) 로 묶기
3. 각 TC마다 하나의 test() 블록
4. 페이지 분석의 selector를 최대한 활용 (page.locator(), getByRole() 등)
5. 각 test() 마다 page.goto() 호출
6. 의미 있는 expect() assertion 포함
7. 코드만 반환 (설명, 마크다운 없이)`
}

function sanitizeCode(text: string): string {
  return text
    .replace(/^```(?:typescript|ts|javascript|js)?\s*/m, '')
    .replace(/```\s*$/m, '')
    .trim()
}

export async function generateCode(
  pipelineId: string,
  qaPlanId: number,
): Promise<{ fileName: string; linesOfCode: number }> {
  // TC + 페이지 분석 조회
  const [qaPlan, pages] = await Promise.all([
    db.qAPlan.findUnique({
      where: { id: qaPlanId },
      include: {
        collectedTicket: true,
        autoQaTestCases: { take: 10 },
      },
    }),
    db.pageAnalysis.findMany({ where: { pipelineId } }),
  ])

  if (!qaPlan) throw new Error(`QAPlan 없음: ${qaPlanId}`)

  const ticket = qaPlan.collectedTicket
  const baseUrl = env.TEST_APP_BASE_URL ?? 'http://localhost:3000'

  const testCases: TCForCodegen[] = qaPlan.autoQaTestCases.map((tc) => ({
    title: tc.title,
    caseType: tc.caseType,
    priority: tc.priority,
    steps: (() => { try { return JSON.parse(tc.steps ?? '[]') } catch { return [] } })() as string[],
    preconditions: (() => { try { return JSON.parse(tc.preconditions ?? '[]') } catch { return [] } })() as string[],
    expectedResult: tc.expectedResult ?? '',
    gherkin: tc.gherkin ?? '',
  }))

  const pageData: PageForCodegen[] = pages.map((p) => ({
    pageName: p.pageName,
    urlPattern: p.urlPattern ?? '',
    elements: (() => { try { return JSON.parse(p.elements ?? '[]') } catch { return [] } })() as PageForCodegen['elements'],
    flows: (() => { try { return JSON.parse(p.flows ?? '[]') } catch { return [] } })() as PageForCodegen['flows'],
  }))

  const fileName = `${ticket.ticketKey.toLowerCase().replace(/[^a-z0-9]/g, '-')}.spec.ts`

  let code: string

  if (!env.ANTHROPIC_API_KEY) {
    logger.warn('ANTHROPIC_API_KEY 미설정 — 기본 Playwright 코드 생성')
    code = generateFallbackCode(ticket.ticketKey, ticket.summary, testCases, baseUrl)
  } else {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: buildCodegenPrompt(ticket.ticketKey, ticket.summary, pipelineId, testCases, pageData, baseUrl),
      }],
    })

    const content = response.content[0]
    if (!content || content.type !== 'text') throw new Error('Claude 응답 오류')
    code = sanitizeCode(content.text)
  }

  // DB 저장 (upsert)
  await db.generatedCode.upsert({
    where: { pipelineId },
    create: {
      pipelineId,
      language: 'typescript',
      framework: 'playwright',
      fileName,
      code,
    },
    update: {
      fileName,
      code,
      updatedAt: new Date(),
    },
  })

  // pipelineStatus 업데이트
  await db.collectedTicket.update({
    where: { pipelineId },
    data: { pipelineStatus: 'codegen', updatedAt: new Date() },
  })

  const linesOfCode = code.split('\n').length
  logger.info({ pipelineId, qaPlanId, fileName, linesOfCode }, '코드 생성 완료')
  return { fileName, linesOfCode }
}

function generateFallbackCode(
  ticketKey: string,
  summary: string,
  testCases: TCForCodegen[],
  baseUrl: string,
): string {
  const tests = testCases.map((tc) => {
    const steps = tc.steps.length > 0
      ? tc.steps.map((s) => `    // ${s}`).join('\n')
      : `    // TODO: 테스트 단계 작성`

    return `
  test('${tc.title.replace(/'/g, "\\'")}', async ({ page }) => {
    await page.goto('${baseUrl}');
${steps}
    // 기대결과: ${tc.expectedResult}
  });`
  }).join('\n')

  return `import { test, expect } from '@playwright/test';

// ${ticketKey} — ${summary}
// 자동 생성: TMS QA 파이프라인

test.describe('${ticketKey}', () => {
${tests}
});
`
}
