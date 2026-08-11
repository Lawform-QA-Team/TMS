import { Hono } from 'hono'
import { db } from '../lib/db.js'
import { logger } from '../lib/logger.js'
import { env } from '../env.js'
import { updateApprovalMessage } from '../lib/slackNotifier.js'
import { getJiraQueue } from '../lib/jiraPipeline.js'

export const slackRouter = new Hono()

/**
 * POST /slack/interaction
 * Slack Interactive Components 웹훅 수신
 * Slack App 설정 > Interactivity & Shortcuts > Request URL 에 등록 필요
 */
slackRouter.post('/interaction', async (c) => {
  try {
    // Slack은 application/x-www-form-urlencoded + payload 필드로 전송
    const form = await c.req.parseBody()
    const payloadStr = form['payload'] as string | undefined
    if (!payloadStr) return c.json({ error: 'payload 없음' }, 400)

    const payload = JSON.parse(payloadStr) as SlackInteractionPayload
    const action = payload.actions?.[0]
    if (!action) return c.json({ ok: true })

    const { action_id, value } = action
    if (!['qaplan_approve', 'qaplan_reject'].includes(action_id)) {
      return c.json({ ok: true })
    }

    const [pipelineId, qaPlanIdStr] = (value ?? '').split(':')
    const qaPlanId = Number(qaPlanIdStr)
    if (!pipelineId || !qaPlanId) return c.json({ error: '잘못된 value' }, 400)

    const approved = action_id === 'qaplan_approve'
    const actorName = payload.user?.name ?? payload.user?.username ?? '알 수 없음'

    // QAPlan 상태 업데이트
    await db.qAPlan.update({
      where: { id: qaPlanId },
      data: { approvalStatus: approved ? 'approved' : 'rejected', updatedAt: new Date() },
    })

    // CollectedTicket pipelineStatus 업데이트
    await db.collectedTicket.update({
      where: { pipelineId },
      data: {
        pipelineStatus: approved ? 'testcases' : 'collected',
        updatedAt: new Date(),
      },
    })

    // 승인 시 testcases 생성 job 등록
    if (approved) {
      const queue = getJiraQueue()
      await queue.add('qaplan-approved', {
        type: 'qaplan-approved',
        pipelineId,
        qaPlanId,
      })
      logger.info({ pipelineId, qaPlanId }, 'QA Plan 승인 → testcases 생성 job 등록')
    } else {
      logger.info({ pipelineId, qaPlanId, actorName }, 'QA Plan 거절')
    }

    // Slack 메시지 업데이트 (버튼 제거)
    const channel = payload.container?.channel_id ?? env.SLACK_CHANNEL_ID ?? ''
    const ts = payload.container?.message_ts ?? ''
    if (channel && ts) {
      const ticket = await db.collectedTicket.findUnique({ where: { pipelineId } })
      await updateApprovalMessage(channel, ts, ticket?.ticketKey ?? pipelineId, approved, actorName)
    }

    return c.json({ ok: true })
  } catch (e) {
    logger.error({ e }, 'Slack interaction 처리 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// 타입 정의
// ──────────────────────────────────────────────

interface SlackInteractionPayload {
  type: string
  actions?: Array<{ action_id: string; value?: string }>
  user?: { id: string; name?: string; username?: string }
  container?: { channel_id?: string; message_ts?: string }
}
