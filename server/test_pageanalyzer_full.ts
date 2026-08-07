import { db } from './src/lib/db.js'
import Anthropic from '@anthropic-ai/sdk'
import { env } from './src/env.js'

const PIPELINE_ID = 'd23c0461-08a6-4d88-8501-f5606ab5d81c'
const QA_PLAN_ID = 4

const qaPlan = await db.qAPlan.findUnique({
  where: { id: QA_PLAN_ID },
  include: { collectedTicket: true, autoQaTestCases: { take: 5 } },
})
if (!qaPlan) { console.log('QAPlan 없음'); process.exit(1) }

const ticket = qaPlan.collectedTicket
const testCases = qaPlan.autoQaTestCases.map(tc => ({
  title: tc.title,
  steps: (() => { try { return JSON.parse(tc.steps ?? '[]') } catch { return [] } })() as string[],
  gherkin: tc.gherkin ?? '',
}))
const baseUrl = 'http://localhost:3000'

const tcText = testCases.slice(0, 4).map((tc, i) =>
  `TC${i+1}: ${tc.title}\n  Steps: ${(tc.steps as string[]).slice(0,4).join(' → ')}`
).join('\n\n')

const prompt = `다음 티켓의 TC들에서 필요한 페이지와 UI 요소를 분석하세요.
티켓: ${ticket.ticketKey} — ${ticket.summary}
앱 기본 URL: ${baseUrl}

${tcText}

JSON 배열만 반환 (다른 텍스트 금지):
[{"pageName":"페이지명","urlPattern":"URL","elements":[{"selector":"...","fallbackSelector":"...","type":"button","label":"레이블"}],"flows":[{"name":"플로우명","steps":["단계"]}]}]

최대 3개 페이지, 페이지당 최대 6개 요소`

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
const response = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 3000,
  system: '당신은 QA 자동화 엔지니어입니다. 반드시 JSON 배열만 반환하세요.',
  messages: [{ role: 'user', content: prompt }],
})

const content = response.content[0]
if (content.type === 'text') {
  const text = content.text
  console.log('=== stop_reason:', response.stop_reason)
  console.log('=== 첫 50자:', JSON.stringify(text.slice(0, 50)))
  
  const stripped = text.replace(/```(?:json)?\s*/g, '').replace(/```/g, '')
  const jsonMatch = stripped.match(/\[[\s\S]*/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      console.log('파싱 성공! 페이지 수:', parsed.length)
    } catch(e) {
      console.log('파싱 실패:', (e as Error).message)
      console.log('raw 마지막 50자:', JSON.stringify(jsonMatch[0].slice(-50)))
    }
  } else {
    console.log('JSON 배열 못 찾음')
  }
}
