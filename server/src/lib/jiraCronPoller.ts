import cron from 'node-cron'
import { env } from '../env.js'
import { logger } from './logger.js'
import { jiraClient } from './jiraClient.js'
import { jiraCollectorService } from './jiraCollectorService.js'
import { isQATarget } from './ticketNormalizer.js'

const DEFAULT_JQL = 'labels = "qa-requested" OR status = "Ready for QA"'

let _task: cron.ScheduledTask | null = null

export function startJiraCronPoller(): void {
  if (!env.JIRA_CRON_ENABLED) {
    logger.info('Jira Cron Poller 비활성화')
    return
  }
  const jql = env.JIRA_CRON_JQL ?? DEFAULT_JQL
  logger.info({ jql }, 'Jira Cron Poller 시작 (*/30 * * * *)')

  _task = cron.schedule('*/30 * * * *', async () => {
    try {
      for await (const issue of jiraClient.searchIssuesPaginated(jql)) {
        if (!isQATarget(issue.fields)) continue
        await jiraCollectorService.collect(issue, 'cron')
      }
    } catch (e) {
      logger.error({ err: e instanceof Error ? { message: e.message, stack: e.stack } : String(e) }, 'Jira Cron Poller 오류')
    }
  })
}

export function stopJiraCronPoller(): void {
  _task?.stop()
  _task = null
}
