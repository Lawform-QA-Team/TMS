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

const PLAYWRIGHT_SYSTEM_PROMPT = `당신은 시니어 QA 자동화 엔지니어입니다.
테스트 케이스와 페이지 분석 결과를 바탕으로 Playwright TypeScript 테스트 코드를 작성합니다.
코드만 반환하고 설명이나 마크다운 코드블록은 포함하지 마세요.`

const K6_SYSTEM_PROMPT = `당신은 시니어 성능 테스트 엔지니어입니다.
API 목록과 테스트 케이스를 바탕으로 k6 부하 테스트 JavaScript 코드를 작성합니다.
코드만 반환하고 설명이나 마크다운 코드블록은 포함하지 마세요.`

// 하위 호환을 위한 별칭
const SYSTEM_PROMPT = PLAYWRIGHT_SYSTEM_PROMPT

function buildCodegenPrompt(
  ticketKey: string,
  summary: string,
  pipelineId: string,
  testCases: TCForCodegen[],
  pages: PageForCodegen[],
  baseUrl: string,
  registeredSelectors?: Array<{ pageName: string; elementName: string; selector: string; elementType: string }>,
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

  const selectorContext = registeredSelectors && registeredSelectors.length > 0
    ? `\n등록된 data-tid 기반 selector (반드시 이 selector를 우선 사용할 것):
${registeredSelectors.map((s) => `- [${s.pageName}] ${s.elementName} (${s.elementType}): ${s.selector}`).join('\n')}\n`
    : ''

  return `다음 티켓의 테스트 케이스를 Playwright TypeScript 코드로 작성하세요.

티켓: ${ticketKey} — ${summary}
파이프라인 ID: ${pipelineId}
기본 URL: ${baseUrl}
${selectorContext}
페이지 분석:
${pageContext}

테스트 케이스:
${tcContext}

요구사항:
1. import { test, expect } from '@playwright/test'; 사용
2. test.describe('${ticketKey}', () => { ... }) 로 묶기
3. 각 TC마다 하나의 test() 블록
4. 등록된 selector가 있으면 반드시 해당 selector를 우선 사용 (page.locator('[data-tid="..."]'))
5. 각 test() 마다 page.goto() 호출
6. 의미 있는 expect() assertion 포함
7. 코드만 반환 (설명, 마크다운 없이)`
}

function buildK6Prompt(
  ticketKey: string,
  summary: string,
  pipelineId: string,
  testCases: TCForCodegen[],
  baseUrl: string,
  apiEndpoints: Array<{ method: string; path: string; description?: string | null; authRequired: boolean }>,
): string {
  const apiContext = apiEndpoints.length > 0
    ? `\n사용 가능한 API 목록 (반드시 이 API를 사용할 것):\n${apiEndpoints.map((a) => `- ${a.method} ${a.path}${a.description ? ` (${a.description})` : ''}${a.authRequired ? ' [인증필요]' : ''}`).join('\n')}\n`
    : ''

  const tcContext = testCases.slice(0, 5).map((tc, i) =>
    `TC${i + 1}: ${tc.title} — ${tc.steps.slice(0, 3).join(' → ')}`
  ).join('\n')

  return `다음 티켓의 k6 부하 테스트 코드를 작성하세요.

티켓: ${ticketKey} — ${summary}
파이프라인 ID: ${pipelineId}
기본 URL: ${baseUrl}
${apiContext}
테스트 케이스 요약:
${tcContext}

요구사항:
1. import http from 'k6/http'; import { check, sleep } from 'k6'; 사용
2. export const options = { vus: 10, duration: '30s' }; 포함
3. export default function() { ... } 로 메인 함수 작성
4. 등록된 API 엔드포인트를 사용해 시나리오 구성
5. check()로 응답 검증 (status === 200 등)
6. sleep(1) 적절히 추가
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
  // TC + 페이지 분석 + SelectorRegistry 조회
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
  const baseUrl = env.TEST_APP_BASE_URL ?? 'http://localhost:3017'

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

  // SelectorRegistry 조회 (projectKey 기반)
  const registeredSelectors = await db.selectorRegistry.findMany({
    where: { projectKey: ticket.projectKey },
    select: { pageName: true, elementName: true, selector: true, elementType: true },
  })

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
      system: PLAYWRIGHT_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: buildCodegenPrompt(ticket.ticketKey, ticket.summary, pipelineId, testCases, pageData, baseUrl, registeredSelectors),
      }],
    })

    const content = response.content[0]
    if (!content || content.type !== 'text') throw new Error('Claude 응답 오류')
    code = sanitizeCode(content.text)
  }

  // DB 저장 (pipelineId + framework 복합 unique)
  await db.generatedCode.upsert({
    where: { pipelineId_framework: { pipelineId, framework: 'playwright' } },
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

export async function generateK6Code(
  pipelineId: string,
  qaPlanId: number,
): Promise<{ fileName: string; linesOfCode: number }> {
  const qaPlan = await db.qAPlan.findUnique({
    where: { id: qaPlanId },
    include: {
      collectedTicket: true,
      autoQaTestCases: { take: 5 },
    },
  })

  if (!qaPlan) throw new Error(`QAPlan 없음: ${qaPlanId}`)

  const ticket = qaPlan.collectedTicket
  const baseUrl = env.TEST_APP_BASE_URL ?? 'http://localhost:3017'

  const testCases: TCForCodegen[] = qaPlan.autoQaTestCases.map((tc) => ({
    title: tc.title,
    caseType: tc.caseType,
    priority: tc.priority,
    steps: (() => { try { return JSON.parse(tc.steps ?? '[]') } catch { return [] } })() as string[],
    preconditions: (() => { try { return JSON.parse(tc.preconditions ?? '[]') } catch { return [] } })() as string[],
    expectedResult: tc.expectedResult ?? '',
    gherkin: tc.gherkin ?? '',
  }))

  // ApiEndpoint 조회
  const apiEndpoints = await db.apiEndpoint.findMany({
    where: { projectKey: ticket.projectKey },
    select: { method: true, path: true, description: true, authRequired: true },
  })

  const fileName = `${ticket.ticketKey.toLowerCase().replace(/[^a-z0-9]/g, '-')}-k6.js`

  let code: string

  if (!env.ANTHROPIC_API_KEY) {
    logger.warn('ANTHROPIC_API_KEY 미설정 — 기본 k6 코드 생성')
    code = generateFallbackK6Code(ticket.ticketKey, ticket.summary, baseUrl, apiEndpoints)
  } else {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: K6_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: buildK6Prompt(ticket.ticketKey, ticket.summary, pipelineId, testCases, baseUrl, apiEndpoints),
      }],
    })

    const content = response.content[0]
    if (!content || content.type !== 'text') throw new Error('Claude 응답 오류')
    code = sanitizeCode(content.text)
  }

  // GeneratedCode 테이블에 k6 코드 저장 (pipelineId + framework 조합으로 별도 관리)
  // 기존 playwright 코드와 충돌을 피해 fileName으로 구분
  const existingK6 = await db.generatedCode.findFirst({
    where: { pipelineId, framework: 'k6' },
  })

  if (existingK6) {
    await db.generatedCode.update({
      where: { id: existingK6.id },
      data: { fileName, code, updatedAt: new Date() },
    })
  } else {
    await db.generatedCode.create({
      data: {
        pipelineId: `${pipelineId}-k6`,
        language: 'javascript',
        framework: 'k6',
        fileName,
        code,
      },
    })
  }

  const linesOfCode = code.split('\n').length
  logger.info({ pipelineId, qaPlanId, fileName, linesOfCode }, 'k6 코드 생성 완료')
  return { fileName, linesOfCode }
}

function generateFallbackK6Code(
  ticketKey: string,
  summary: string,
  baseUrl: string,
  apiEndpoints: Array<{ method: string; path: string; description?: string | null; authRequired: boolean }>,
): string {
  const checks = apiEndpoints.length > 0
    ? apiEndpoints.slice(0, 5).map((a) =>
        `  // ${a.method} ${a.path}${a.description ? ` — ${a.description}` : ''}
  const res${a.method}${a.path.replace(/[^a-zA-Z0-9]/g, '_')} = http.${a.method.toLowerCase()}(\`\${BASE_URL}${a.path}\`);
  check(res${a.method}${a.path.replace(/[^a-zA-Z0-9]/g, '_')}, { 'status 200': (r) => r.status === 200 });`
      ).join('\n\n')
    : `  const res = http.get(\`\${BASE_URL}/\`);
  check(res, { 'status 200': (r) => r.status === 200 });`

  return `import http from 'k6/http';
import { check, sleep } from 'k6';

// ${ticketKey} — ${summary}
// 자동 생성: TMS QA 파이프라인

const BASE_URL = __ENV.BASE_URL || '${baseUrl}';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
${checks}
  sleep(1);
}
`
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
