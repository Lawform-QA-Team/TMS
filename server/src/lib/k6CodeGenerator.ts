import Anthropic from '@anthropic-ai/sdk'
import { db } from './db.js'
import { env } from '../env.js'
import { logger } from './logger.js'

// ──────────────────────────────────────────────
// 타입
// ──────────────────────────────────────────────

interface TCForK6 {
  title: string
  steps: string[]
}

type ApiEndpointRow = { method: string; path: string; description: string | null; authRequired: boolean }
type SelectorRow = { pageName: string; elementName: string; selector: string; elementType: string }

// ──────────────────────────────────────────────
// 시스템 프롬프트
// ──────────────────────────────────────────────

const LOAD_SYSTEM_PROMPT = `당신은 시니어 성능 테스트 엔지니어입니다.
API 목록과 테스트 케이스를 바탕으로 k6 HTTP 부하 테스트 JavaScript 코드를 작성합니다.
코드만 반환하고 설명이나 마크다운 코드블록은 포함하지 마세요.`

const BROWSER_SYSTEM_PROMPT = `당신은 시니어 성능 테스트 엔지니어입니다.
data-tid selector 목록과 테스트 케이스를 바탕으로 k6 browser API를 사용한 사용자 응답 성능 테스트 코드를 작성합니다.
코드만 반환하고 설명이나 마크다운 코드블록은 포함하지 마세요.`

// ──────────────────────────────────────────────
// 프롬프트 빌더
// ──────────────────────────────────────────────

function buildLoadPrompt(
  ticketKey: string,
  summary: string,
  baseUrl: string,
  testCases: TCForK6[],
  apiEndpoints: ApiEndpointRow[],
): string {
  const apiContext = apiEndpoints.length > 0
    ? apiEndpoints.map((a) => `- ${a.method} ${a.path}${a.description ? ` (${a.description})` : ''}${a.authRequired ? ' [인증필요]' : ''}`).join('\n')
    : '(등록된 API 없음 — 티켓 내용 기반으로 추론)'

  const tcContext = testCases.slice(0, 5).map((tc, i) =>
    `${i + 1}. ${tc.title}${tc.steps.length > 0 ? ` — ${tc.steps.slice(0, 2).join(' → ')}` : ''}`
  ).join('\n')

  return `다음 티켓의 k6 HTTP 부하 테스트 코드를 작성하세요.

티켓: ${ticketKey} — ${summary}
기본 URL: ${baseUrl}

등록된 API 목록:
${apiContext}

테스트 케이스:
${tcContext}

요구사항:
1. import http from 'k6/http'; import { check, sleep } from 'k6'; 사용
2. export const options = { stages: [...], thresholds: {...} } 포함
   - stages: ramp-up(30s/10vus) → peak(1m/10vus) → ramp-down(10s/0vus)
   - thresholds: http_req_duration p(95)<500, http_req_failed rate<0.01
3. const BASE_URL = __ENV.BASE_URL || '${baseUrl}'; 로 베이스 URL 설정
4. 등록된 API 엔드포인트를 순서대로 호출하는 시나리오 구성
5. check()로 상태코드, 응답시간 검증
6. sleep(1) 적절히 추가
7. 코드만 반환 (설명, 마크다운 없이)`
}

function buildBrowserPrompt(
  ticketKey: string,
  summary: string,
  baseUrl: string,
  testCases: TCForK6[],
  selectors: SelectorRow[],
): string {
  const selectorContext = selectors.length > 0
    ? selectors.map((s) => `- [${s.pageName}] ${s.elementName} (${s.elementType}): ${s.selector}`).join('\n')
    : '(등록된 selector 없음 — 티켓 내용 기반으로 추론)'

  const tcContext = testCases.slice(0, 5).map((tc, i) =>
    `${i + 1}. ${tc.title}${tc.steps.length > 0 ? ` — ${tc.steps.slice(0, 3).join(' → ')}` : ''}`
  ).join('\n')

  return `다음 티켓의 k6 browser 사용자 응답 성능 테스트 코드를 작성하세요.

티켓: ${ticketKey} — ${summary}
기본 URL: ${baseUrl}

등록된 data-tid selector:
${selectorContext}

테스트 케이스:
${tcContext}

요구사항:
1. import { browser } from 'k6/browser'; 사용
2. export const options = { scenarios: { ui: { executor: 'shared-iterations', ... } }, thresholds: {...} } 포함
   - thresholds: browser_web_vital_lcp p(75)<2500, browser_web_vital_fid p(75)<100, browser_web_vital_cls p(75)<0.1
3. export default async function() { ... } — async 필수
4. const page = await browser.newPage(); / try { ... } finally { await page.close(); } 패턴 사용
5. 등록된 selector([data-tid="..."]) 로 UI 요소 조작
6. page.waitForSelector() 또는 locator().waitFor()로 안정성 확보
7. 코드만 반환 (설명, 마크다운 없이)`
}

// ──────────────────────────────────────────────
// Fallback 코드
// ──────────────────────────────────────────────

function fallbackLoadCode(ticketKey: string, summary: string, baseUrl: string, apiEndpoints: ApiEndpointRow[]): string {
  const requests = apiEndpoints.length > 0
    ? apiEndpoints.slice(0, 5).map((a) => {
        const varName = `res_${a.method.toLowerCase()}_${a.path.replace(/[^a-zA-Z0-9]/g, '_').replace(/^_+|_+$/g, '')}`
        return `  // ${a.method} ${a.path}${a.description ? ` — ${a.description}` : ''}
  const ${varName} = http.${a.method.toLowerCase()}(\`\${BASE_URL}${a.path}\`);
  check(${varName}, { 'status 200': (r) => r.status === 200 });`
      }).join('\n\n')
    : `  const res = http.get(\`\${BASE_URL}/\`);
  check(res, { 'status 200': (r) => r.status === 200 });`

  return `import http from 'k6/http';
import { check, sleep } from 'k6';

// ${ticketKey} — ${summary}
// 자동 생성: TMS QA 파이프라인 (k6 HTTP 부하 테스트)

const BASE_URL = __ENV.BASE_URL || '${baseUrl}';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m',  target: 10 },
    { duration: '10s', target: 0  },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed:   ['rate<0.01'],
  },
};

export default function () {
${requests}
  sleep(1);
}
`
}

function fallbackBrowserCode(ticketKey: string, summary: string, baseUrl: string, selectors: SelectorRow[]): string {
  const interactions = selectors.length > 0
    ? selectors.slice(0, 5).map((s) =>
        `    // ${s.pageName} — ${s.elementName} (${s.elementType})
    await page.locator('${s.selector}').waitFor();`
      ).join('\n')
    : `    await page.waitForSelector('body');`

  return `import { browser } from 'k6/browser';

// ${ticketKey} — ${summary}
// 자동 생성: TMS QA 파이프라인 (k6 browser 사용자 응답 성능 테스트)

const BASE_URL = __ENV.BASE_URL || '${baseUrl}';

export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations',
      iterations: 1,
      vus: 1,
      options: { browser: { type: 'chromium' } },
    },
  },
  thresholds: {
    browser_web_vital_lcp: ['p(75)<2500'],
    browser_web_vital_fid: ['p(75)<100'],
    browser_web_vital_cls: ['p(75)<0.1'],
  },
};

export default async function () {
  const page = await browser.newPage();
  try {
    await page.goto(BASE_URL);
${interactions}
  } finally {
    await page.close();
  }
}
`
}

function sanitize(text: string): string {
  return text
    .replace(/^```(?:javascript|js|k6)?\s*/m, '')
    .replace(/```\s*$/m, '')
    .trim()
}

// ──────────────────────────────────────────────
// 공통 QAPlan 조회 헬퍼
// ──────────────────────────────────────────────

async function loadQAPlan(qaPlanId: number) {
  const qaPlan = await db.qAPlan.findUnique({
    where: { id: qaPlanId },
    include: {
      collectedTicket: true,
      autoQaTestCases: { take: 5, select: { title: true, steps: true } },
    },
  })
  if (!qaPlan) throw new Error(`QAPlan 없음: ${qaPlanId}`)
  return qaPlan
}

function toTCForK6(raw: { title: string; steps: string | null }[]): TCForK6[] {
  return raw.map((tc) => ({
    title: tc.title,
    steps: (() => { try { return JSON.parse(tc.steps ?? '[]') } catch { return [] } })() as string[],
  }))
}

// ──────────────────────────────────────────────
// Public: K6 HTTP 부하 테스트 생성
// ──────────────────────────────────────────────

export async function generateK6LoadTest(
  pipelineId: string,
  qaPlanId: number,
): Promise<{ fileName: string; linesOfCode: number }> {
  const qaPlan = await loadQAPlan(qaPlanId)
  const ticket = qaPlan.collectedTicket
  const baseUrl = env.TEST_APP_BASE_URL ?? 'http://localhost:3017'
  const testCases = toTCForK6(qaPlan.autoQaTestCases)

  const apiEndpoints = await db.apiEndpoint.findMany({
    where: { projectKey: ticket.projectKey },
    select: { method: true, path: true, description: true, authRequired: true },
  })

  const fileName = `${ticket.ticketKey.toLowerCase().replace(/[^a-z0-9]/g, '-')}-load.k6.js`

  let code: string
  if (!env.ANTHROPIC_API_KEY) {
    logger.warn('ANTHROPIC_API_KEY 미설정 — 기본 K6 load 코드 생성')
    code = fallbackLoadCode(ticket.ticketKey, ticket.summary, baseUrl, apiEndpoints)
  } else {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: LOAD_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildLoadPrompt(ticket.ticketKey, ticket.summary, baseUrl, testCases, apiEndpoints) }],
    })
    const content = response.content[0]
    if (!content || content.type !== 'text') throw new Error('Claude 응답 오류')
    code = sanitize(content.text)
  }

  await db.generatedCode.upsert({
    where: { pipelineId_framework: { pipelineId, framework: 'k6-load' } },
    create: { pipelineId, language: 'javascript', framework: 'k6-load', fileName, code },
    update: { fileName, code, updatedAt: new Date() },
  })

  const linesOfCode = code.split('\n').length
  logger.info({ pipelineId, qaPlanId, fileName, linesOfCode }, 'K6 load 코드 생성 완료')
  return { fileName, linesOfCode }
}

// ──────────────────────────────────────────────
// Public: K6 browser 사용자 응답 성능 테스트 생성
// ──────────────────────────────────────────────

export async function generateK6BrowserTest(
  pipelineId: string,
  qaPlanId: number,
): Promise<{ fileName: string; linesOfCode: number }> {
  const qaPlan = await loadQAPlan(qaPlanId)
  const ticket = qaPlan.collectedTicket
  const baseUrl = env.TEST_APP_BASE_URL ?? 'http://localhost:3017'
  const testCases = toTCForK6(qaPlan.autoQaTestCases)

  const selectors = await db.selectorRegistry.findMany({
    where: { projectKey: ticket.projectKey },
    select: { pageName: true, elementName: true, selector: true, elementType: true },
  })

  const fileName = `${ticket.ticketKey.toLowerCase().replace(/[^a-z0-9]/g, '-')}-browser.k6.js`

  let code: string
  if (!env.ANTHROPIC_API_KEY) {
    logger.warn('ANTHROPIC_API_KEY 미설정 — 기본 K6 browser 코드 생성')
    code = fallbackBrowserCode(ticket.ticketKey, ticket.summary, baseUrl, selectors)
  } else {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: BROWSER_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildBrowserPrompt(ticket.ticketKey, ticket.summary, baseUrl, testCases, selectors) }],
    })
    const content = response.content[0]
    if (!content || content.type !== 'text') throw new Error('Claude 응답 오류')
    code = sanitize(content.text)
  }

  await db.generatedCode.upsert({
    where: { pipelineId_framework: { pipelineId, framework: 'k6-browser' } },
    create: { pipelineId, language: 'javascript', framework: 'k6-browser', fileName, code },
    update: { fileName, code, updatedAt: new Date() },
  })

  const linesOfCode = code.split('\n').length
  logger.info({ pipelineId, qaPlanId, fileName, linesOfCode }, 'K6 browser 코드 생성 완료')
  return { fileName, linesOfCode }
}
