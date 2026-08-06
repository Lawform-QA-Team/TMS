import { env } from '../env.js'
import { logger } from './logger.js'
import type { QAPlanContent } from './qaPlanGenerator.js'
import type { NormalizedTicket } from './ticketNormalizer.js'

const SLACK_API = 'https://slack.com/api'

async function postSlack(method: string, body: unknown): Promise<{ ok: boolean; ts?: string; error?: string }> {
  if (!env.SLACK_BOT_TOKEN) {
    logger.warn('SLACK_BOT_TOKEN 미설정 — Slack 발송 스킵')
    return { ok: false, error: 'no_token' }
  }
  const res = await fetch(`${SLACK_API}/${method}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json() as { ok: boolean; ts?: string; error?: string }
  if (!data.ok) logger.warn({ error: data.error, method }, 'Slack API 오류')
  return data
}

export async function sendQAPlanApprovalRequest(
  ticket: NormalizedTicket,
  plan: QAPlanContent,
  qaPlanId: number,
): Promise<string | null> {
  const channel = env.SLACK_CHANNEL_ID
  if (!channel) {
    logger.warn('SLACK_CHANNEL_ID 미설정 — Slack 발송 스킵')
    return null
  }

  const scopeText = plan.scope.slice(0, 3).map((s) => `• ${s}`).join('\n')
  const risksText = plan.risks.slice(0, 3).map((r) => `• ${r}`).join('\n')

  const result = await postSlack('chat.postMessage', {
    channel,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `QA Plan 승인 요청 — ${ticket.ticketKey}` },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*티켓*\n${ticket.ticketKey}` },
          { type: 'mrkdwn', text: `*우선순위*\n${ticket.priority}` },
          { type: 'mrkdwn', text: `*유형*\n${ticket.issueType}` },
          { type: 'mrkdwn', text: `*예상 TC 수*\n${plan.estimatedTcCount}개` },
        ],
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*제목*\n${ticket.summary}` },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*테스트 목표*\n${plan.objective}` },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*테스트 범위*\n${scopeText}` },
          { type: 'mrkdwn', text: `*리스크*\n${risksText}` },
        ],
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*접근 방식*\n${plan.approach}` },
      },
      { type: 'divider' },
      {
        type: 'actions',
        block_id: `qaplan_approval_${qaPlanId}`,
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '승인' },
            style: 'primary',
            action_id: 'qaplan_approve',
            value: `${ticket.pipelineId}:${qaPlanId}`,
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: '거절' },
            style: 'danger',
            action_id: 'qaplan_reject',
            value: `${ticket.pipelineId}:${qaPlanId}`,
          },
        ],
      },
    ],
  })

  return result.ts ?? null
}

export async function sendTestCasesComplete(
  pipelineId: string,
  tcCount: number,
): Promise<void> {
  const channel = env.SLACK_CHANNEL_ID
  if (!channel) return

  const ticket = await (await import('./db.js')).db.collectedTicket.findUnique({
    where: { pipelineId },
  })
  if (!ticket) return

  await postSlack('chat.postMessage', {
    channel,
    text: `:white_check_mark: *${ticket.ticketKey}* 테스트 케이스 ${tcCount}개 자동 생성 완료`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:clipboard: *${ticket.ticketKey}* — ${ticket.summary}\n테스트 케이스 *${tcCount}개* 자동 생성 완료 (상태: \`testcases\`)`,
        },
      },
    ],
  })
}

export async function updateApprovalMessage(
  channel: string,
  ts: string,
  ticketKey: string,
  approved: boolean,
  actorName: string,
): Promise<void> {
  await postSlack('chat.update', {
    channel,
    ts,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: approved
            ? `:white_check_mark: *${ticketKey}* QA Plan *승인* — ${actorName}`
            : `:x: *${ticketKey}* QA Plan *거절* — ${actorName}`,
        },
      },
    ],
  })
}
