import Anthropic from '@anthropic-ai/sdk'
import { randomUUID } from 'crypto'
import { db } from './db.js'
import { env } from '../env.js'
import { logger } from './logger.js'
import type { NormalizedTicket } from './ticketNormalizer.js'

export interface QAPlanContent {
  objective: string
  scope: string[]
  approach: string
  testTypes: string[]
  risks: string[]
  estimatedTcCount: number
}

const SYSTEM_PROMPT = `당신은 시니어 QA 엔지니어입니다.
Jira 티켓 정보를 분석하여 QA 계획을 JSON 형식으로 작성합니다.
반드시 아래 JSON 스키마만 반환하고 다른 텍스트는 포함하지 마세요.`


function buildEpicContextSection(ticket: NormalizedTicket): string {
  const ctx = ticket.epicContext
  if (!ctx?.epicKey) return ''

  const lines: string[] = ['\n--- 기획 컨텍스트 ---']
  if (ctx.epicSummary) lines.push(`Epic: [${ctx.epicKey}] ${ctx.epicSummary}`)
  if (ctx.epicDescription) lines.push(`Epic 설명:\n${ctx.epicDescription}`)

  if (ctx.planningTaskKey && ctx.planningContent) {
    lines.push(`\n기획 내용 (${ctx.planningTaskKey}):`)
    lines.push(ctx.planningContent.slice(0, 3000))
  }

  if (ctx.figmaContent) {
    lines.push(`\nFigma 기획 내용:`)
    lines.push(ctx.figmaContent.slice(0, 2000))
  } else if (ctx.figmaUrls.length > 0) {
    lines.push(`\n참고 Figma 링크 (직접 확인 필요):`)
    lines.push(ctx.figmaUrls.map(u => `- ${u}`).join('\n'))
  }

  return lines.join('\n')
}

function buildPrompt(ticket: NormalizedTicket): string {
  const epicSection = buildEpicContextSection(ticket)
  const hasEpicContext = !!ticket.epicContext?.epicKey
function buildPrompt(ticket: NormalizedTicket): string {
  return `다음 Jira 티켓에 대한 QA 계획을 작성해주세요.

티켓 정보:
- 키: ${ticket.ticketKey}
- 유형: ${ticket.issueType}
- 우선순위: ${ticket.priority}
- 제목: ${ticket.summary}
- 설명: ${ticket.descriptionText || '(없음)'}
- 레이블: ${ticket.labels.join(', ') || '(없음)'}
${epicSection}
${hasEpicContext ? '\n※ 이 QA Task는 기획 내용 기반으로 자동 생성됩니다. 위 기획/Figma 내용을 중심으로 QA 계획을 수립하세요.' : ''}

다음 JSON 스키마를 정확히 따라 반환하세요:
{
  "objective": "테스트 목표 (한 문장)",
  "scope": ["테스트 범위 항목1", "항목2", ...],
  "approach": "테스트 접근 방식 설명",
  "testTypes": ["기능 테스트", "회귀 테스트", ...],
  "risks": ["리스크 항목1", ...],
  "estimatedTcCount": 예상_테스트케이스_수(숫자)
}`
}

function parsePlanContent(text: string): QAPlanContent {
  // 마크다운 코드블록 제거
  const stripped = text.replace(/```(?:json)?\s*/g, '').replace(/```/g, '')
  const jsonMatch = stripped.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('QA Plan JSON을 찾을 수 없음')
  return JSON.parse(jsonMatch[0]) as QAPlanContent
}

export async function generateQAPlan(ticket: NormalizedTicket): Promise<{
  pipelineId: string
  planContent: QAPlanContent
}> {
  if (!env.ANTHROPIC_API_KEY) {
    logger.warn('ANTHROPIC_API_KEY 미설정 — 기본 QA Plan 생성')
    return {
      pipelineId: randomUUID(),
      planContent: {
        objective: `${ticket.summary} 기능 검증`,
        scope: [ticket.summary],
        approach: '기능 테스트 위주 수동 검증',
        testTypes: ['기능 테스트'],
        risks: ['요구사항 불명확'],
        estimatedTcCount: 3,
      },
    }
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildPrompt(ticket) }],
  })

  const content = response.content[0]
  if (!content || content.type !== 'text') throw new Error('Claude 응답 오류')

  const planContent = parsePlanContent(content.text)
  return { pipelineId: ticket.pipelineId, planContent }
}

export async function createQAPlanRecord(
  ticket: NormalizedTicket,
  planContent: QAPlanContent,
): Promise<{ qaPlanId: number; pipelineId: string }> {
  const collectedTicket = await db.collectedTicket.findUnique({
    where: { pipelineId: ticket.pipelineId },
  })
  if (!collectedTicket) throw new Error(`CollectedTicket 없음: ${ticket.pipelineId}`)

  const qaPlan = await db.qAPlan.upsert({
    where: { collectedTicketId: collectedTicket.id },
    create: {
      pipelineId: ticket.pipelineId,
      collectedTicketId: collectedTicket.id,
      planContent: JSON.stringify(planContent),
      approvalStatus: 'pending',
    },
    update: {
      planContent: JSON.stringify(planContent),
      approvalStatus: 'pending',
      updatedAt: new Date(),
    },
  })

  await db.collectedTicket.update({
    where: { pipelineId: ticket.pipelineId },
    data: { pipelineStatus: 'qaplan', updatedAt: new Date() },
  })

  logger.info({ pipelineId: ticket.pipelineId, qaPlanId: qaPlan.id }, 'QAPlan 생성 완료')
  return { qaPlanId: qaPlan.id, pipelineId: ticket.pipelineId }
}
