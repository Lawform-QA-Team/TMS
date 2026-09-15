import Anthropic from '@anthropic-ai/sdk'
import { db } from './db.js'
import { env } from '../env.js'
import { logger } from './logger.js'
import type { QAPlanContent } from './qaPlanGenerator.js'

const SYSTEM_PROMPT = `당신은 시니어 성능 테스트 엔지니어입니다.
Jira 티켓과 테스트 케이스를 분석하여 k6 JavaScript 성능 테스트 스크립트를 작성합니다.
코드만 반환하고 설명이나 마크다운 코드블록은 포함하지 마세요.`

function buildK6Prompt(
  ticketKey: string,
  summary: string,
  descriptionText: string,
  plan: QAPlanContent,
  baseUrl: string,
  testCaseTitles: string[],
): string {
  return `다음 티켓을 기반으로 k6 성능 테스트 스크립트를 작성하세요.

티켓: ${ticketKey} — ${summary}
설명: ${descriptionText || '(없음)'}
기본 URL: ${baseUrl}

QA Plan:
- 목표: ${plan.objective}
- 범위: ${plan.scope.join(', ')}
- 테스트 유형: ${plan.testTypes.join(', ')}
- 리스크: ${plan.risks.join(', ')}

주요 테스트 시나리오:
${testCaseTitles.slice(0, 5).map((t, i) => `${i + 1}. ${t}`).join('\n')}

요구사항:
1. import http from 'k6/http'; import { check, sleep } from 'k6'; 사용
2. export const options = { stages: [...] } 로 부하 패턴 정의 (ramp-up → peak → ramp-down)
3. 주요 API 엔드포인트에 대한 http 요청 포함 (티켓 내용 기반으로 추론)
4. check()로 응답 상태코드, 응답시간 검증
5. 성능 임계값(thresholds) 설정 (http_req_duration p95 < 500ms 등)
6. sleep()으로 사용자 행동 시뮬레이션
7. 코드만 반환 (설명, 마크다운 없이)`
}

function sanitizeCode(text: string): string {
  return text
    .replace(/^```(?:javascript|js|k6)?\s*/m, '')
    .replace(/```\s*$/m, '')
    .trim()
}

function generateFallbackK6Code(
  ticketKey: string,
  summary: string,
  baseUrl: string,
): string {
  return `import http from 'k6/http';
import { check, sleep } from 'k6';

// ${ticketKey} — ${summary}
// 자동 생성: TMS QA 파이프라인 (k6 성능 테스트)

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // ramp-up
    { duration: '1m',  target: 10 },  // peak
    { duration: '10s', target: 0  },  // ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed:   ['rate<0.01'],
  },
};

export default function () {
  const res = http.get('${baseUrl}');

  check(res, {
    'status is 200':           (r) => r.status === 200,
    'response time < 500ms':   (r) => r.timings.duration < 500,
  });

  sleep(1);
}
`
}

export async function generateK6Code(
  pipelineId: string,
  qaPlanId: number,
): Promise<{ fileName: string; linesOfCode: number }> {
  const qaPlan = await db.qAPlan.findUnique({
    where: { id: qaPlanId },
    include: {
      collectedTicket: true,
      autoQaTestCases: { take: 10, select: { title: true } },
    },
  })
  if (!qaPlan) throw new Error(`QAPlan 없음: ${qaPlanId}`)

  const ticket = qaPlan.collectedTicket
  const plan: QAPlanContent = JSON.parse(qaPlan.planContent ?? '{}')
  const baseUrl = env.TEST_APP_BASE_URL ?? 'http://localhost:3017'
  const testCaseTitles = qaPlan.autoQaTestCases.map((tc) => tc.title)
  const fileName = `${ticket.ticketKey.toLowerCase().replace(/[^a-z0-9]/g, '-')}.k6.js`

  let code: string

  if (!env.ANTHROPIC_API_KEY) {
    logger.warn('ANTHROPIC_API_KEY 미설정 — 기본 k6 코드 생성')
    code = generateFallbackK6Code(ticket.ticketKey, ticket.summary, baseUrl)
  } else {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: buildK6Prompt(
          ticket.ticketKey,
          ticket.summary,
          ticket.descriptionText ?? '',
          plan,
          baseUrl,
          testCaseTitles,
        ),
      }],
    })

    const content = response.content[0]
    if (!content || content.type !== 'text') throw new Error('Claude 응답 오류')
    code = sanitizeCode(content.text)
  }

  // DB 저장 (pipelineId + framework 복합 unique)
  await db.generatedCode.upsert({
    where: { pipelineId_framework: { pipelineId, framework: 'k6' } },
    create: {
      pipelineId,
      language: 'javascript',
      framework: 'k6',
      fileName,
      code,
    },
    update: {
      fileName,
      code,
      updatedAt: new Date(),
    },
  })

  const linesOfCode = code.split('\n').length
  logger.info({ pipelineId, qaPlanId, fileName, linesOfCode }, 'K6 코드 생성 완료')
  return { fileName, linesOfCode }
}
