import { getRedis } from './redis.js'
import { getJiraQueue } from './jiraPipeline.js'
import { normalizeTicket } from './ticketNormalizer.js'
import { db } from './db.js'
import { logger } from './logger.js'
import type { JiraIssueResponse } from './jiraClient.js'

const DEDUP_TTL = 7 * 24 * 3600 // 7일(초)

export class JiraCollectorService {
  async collect(
    issue: JiraIssueResponse,
    sourceType: 'webhook' | 'cron',
  ): Promise<{ pipelineId: string; isNew: boolean }> {
    const redis = getRedis()
    const ticketKey = issue.key

    // 1. Redis dedup
    const existing = await redis.get(`collected:ticket:${ticketKey}`)
    if (existing) {
      logger.debug({ ticketKey }, 'Jira 티켓 중복 — 스킵')
      return { pipelineId: existing, isNew: false }
    }

    // 2. 정규화
    const normalized = normalizeTicket(issue, sourceType)

    // 3. DB upsert
    await db.collectedTicket.upsert({
      where: { ticketKey },
      create: {
        pipelineId: normalized.pipelineId,
        ticketKey,
        projectKey: normalized.projectKey,
        issueType: normalized.issueType,
        priority: normalized.priority,
        summary: normalized.summary,
        descriptionRaw: normalized.descriptionRaw,
        descriptionText: normalized.descriptionText,
        labels: JSON.stringify(normalized.labels),
        sourceType,
        pipelineStatus: 'collected',
      },
      update: {
        summary: normalized.summary,
        updatedAt: new Date(),
      },
    })

    // 4. BullMQ enqueue
    const queue = getJiraQueue()
    await queue.add('collect-complete', {
      type: 'collect-complete',
      ticketKey,
      pipelineId: normalized.pipelineId,
      payload: normalized,
    })

    // 5. Redis dedup 마킹
    await redis.set(
      `collected:ticket:${ticketKey}`,
      normalized.pipelineId,
      'EX',
      DEDUP_TTL,
    )

    logger.info({ ticketKey, pipelineId: normalized.pipelineId }, 'Jira 티켓 수집 완료')
    return { pipelineId: normalized.pipelineId, isNew: true }
  }
}

export const jiraCollectorService = new JiraCollectorService()
