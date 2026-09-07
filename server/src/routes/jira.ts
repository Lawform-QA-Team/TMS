import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { db } from '../lib/db.js'
import { requireAuth } from '../middleware/auth.js'
import { logger } from '../lib/logger.js'
import { jiraClient } from '../lib/jiraClient.js'
import { getJiraQueue } from '../lib/jiraPipeline.js'
import { env } from '../env.js'
import { isQATarget } from '../lib/ticketNormalizer.js'
import { jiraCollectorService } from '../lib/jiraCollectorService.js'

export const jiraRouter = new Hono()

// ============================================================
// 통계 & 정보
// ============================================================

// GET /jira/stats
jiraRouter.get('/stats', async (c) => {
  try {
    const total = await db.jiraIssue.count()
    const byStatus = await db.jiraIssue.groupBy({ by: ['status'], _count: { id: true } })
    const byPriority = await db.jiraIssue.groupBy({ by: ['priority'], _count: { id: true } })
    const byType = await db.jiraIssue.groupBy({ by: ['issueType'], _count: { id: true } })
    const recent = await db.jiraIssue.findMany({ orderBy: { createdAt: 'desc' }, take: 5 })

    return c.json({
      success: true,
      data: {
        total_issues: total,
        issues_by_status: Object.fromEntries(byStatus.map((r) => [r.status, r._count.id])),
        issues_by_priority: Object.fromEntries(byPriority.map((r) => [r.priority, r._count.id])),
        issues_by_type: Object.fromEntries(byType.map((r) => [r.issueType, r._count.id])),
        recent_issues: recent.map(serializeIssue),
      },
    })
  } catch (e) {
    logger.error({ e }, 'Jira 통계 조회 오류')
    return c.json({ success: false, error: String(e) }, 500)
  }
})

// GET /jira/stats/environment
jiraRouter.get('/stats/environment', async (c) => {
  try {
    const envTotals = await db.jiraIssue.groupBy({ by: ['environment'], _count: { id: true } })
    const envStatus = await db.jiraIssue.groupBy({ by: ['environment', 'status'], _count: { id: true } })

    const result: Record<string, { totalIssues: number; issuesByStatus: Record<string, number> }> = {}
    for (const row of envTotals) {
      const key = row.environment || 'unknown'
      result[key] = { totalIssues: row._count.id, issuesByStatus: {} }
    }
    for (const row of envStatus) {
      const key = row.environment || 'unknown'
      if (!result[key]) result[key] = { totalIssues: 0, issuesByStatus: {} }
      result[key].issuesByStatus[row.status] = row._count.id
    }

    return c.json({ success: true, data: result })
  } catch (e) {
    logger.error({ e }, '환경별 통계 조회 오류')
    return c.json({ success: false, error: String(e) }, 500)
  }
})

// ============================================================
// DB 기반 이슈 CRUD
// ============================================================

// GET /jira/issues/testcase/:testCaseId  (주의: /:issueKey 보다 먼저)
jiraRouter.get('/issues/testcase/:testCaseId', async (c) => {
  const testCaseId = Number(c.req.param('testCaseId'))
  try {
    const page = Number(c.req.query('page') ?? 1)
    const perPage = Number(c.req.query('per_page') ?? 10)
    const search = c.req.query('search') ?? ''
    const status = c.req.query('status')
    const priority = c.req.query('priority')

    const where: Record<string, unknown> = { testCaseId }
    if (search) where.OR = [{ summary: { contains: search } }, { issueKey: { contains: search } }]
    if (status) where.status = status
    if (priority) where.priority = priority

    const [total, issues] = await Promise.all([
      db.jiraIssue.count({ where }),
      db.jiraIssue.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return c.json({
      success: true,
      data: {
        issues: issues.map(serializeIssue),
        pagination: buildPagination(page, perPage, total),
      },
    })
  } catch (e) {
    logger.error({ e }, '테스트케이스 이슈 조회 오류')
    return c.json({ success: false, error: String(e) }, 500)
  }
})

// GET /jira/issues
jiraRouter.get('/issues', async (c) => {
  try {
    const page = Number(c.req.query('page') ?? 1)
    const perPage = Number(c.req.query('per_page') ?? 10)
    const search = c.req.query('search') ?? ''
    const status = c.req.query('status')
    const priority = c.req.query('priority')

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { summary: { contains: search } },
        { issueKey: { contains: search } },
        { description: { contains: search } },
      ]
    }
    if (status) where.status = status
    if (priority) where.priority = priority

    const [total, issues] = await Promise.all([
      db.jiraIssue.count({ where }),
      db.jiraIssue.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return c.json({
      success: true,
      data: {
        issues: issues.map(serializeIssue),
        pagination: buildPagination(page, perPage, total),
      },
    })
  } catch (e) {
    logger.error({ e }, 'Jira 이슈 목록 조회 오류')
    return c.json({ success: false, error: String(e) }, 500)
  }
})

// POST /jira/issues
jiraRouter.post(
  '/issues',
  requireAuth,
  zValidator(
    'json',
    z.object({
      summary: z.string().min(1),
      description: z.string().optional(),
      issue_type: z.string().min(1),
      status: z.string().default('To Do'),
      priority: z.string().default('Medium'),
      project_key: z.string().optional(),
      assignee_email: z.string().optional(),
      reporter_email: z.string().optional(),
      labels: z.array(z.string()).optional(),
      environment: z.string().optional(),
      test_case_id: z.number().nullable().optional(),
      automation_test_id: z.number().nullable().optional(),
      performance_test_id: z.number().nullable().optional(),
    }),
  ),
  async (c) => {
    const data = c.req.valid('json')
    try {
      // 이슈 키 자동 채번
      const projectKey = data.project_key ?? env.JIRA_PROJECT_KEY
      const lastIssue = await db.jiraIssue.findFirst({
        where: { projectKey },
        orderBy: { id: 'desc' },
      })
      const nextNum = lastIssue ? (parseInt(lastIssue.issueKey.split('-')[1] ?? '0') + 1) : 1
      const issueKey = `${projectKey}-${nextNum}`

      // 연결된 TC의 환경 참조
      let issueEnv = data.environment
      if (!issueEnv && data.test_case_id) {
        const tc = await db.testCase.findUnique({ where: { id: data.test_case_id } })
        if (tc?.environment) issueEnv = tc.environment
      }
      issueEnv = issueEnv ?? 'dev'

      const issue = await db.jiraIssue.create({
        data: {
          issueKey,
          projectKey,
          issueType: data.issue_type,
          status: data.status,
          priority: data.priority,
          summary: data.summary,
          description: data.description ?? '',
          assigneeEmail: data.assignee_email ?? null,
          reporterEmail: data.reporter_email ?? 'admin@example.com',
          labels: data.labels ? JSON.stringify(data.labels) : null,
          environment: issueEnv,
          testCaseId: data.test_case_id ?? null,
          automationTestId: data.automation_test_id ?? null,
          performanceTestId: data.performance_test_id ?? null,
        },
      })

      return c.json({ success: true, message: '이슈가 성공적으로 생성되었습니다.', data: serializeIssue(issue) }, 201)
    } catch (e) {
      logger.error({ e }, 'Jira 이슈 생성 오류')
      return c.json({ success: false, error: String(e) }, 500)
    }
  },
)

// GET /jira/issues/:issueKey
jiraRouter.get('/issues/:issueKey', async (c) => {
  const issueKey = c.req.param('issueKey')
  try {
    const issue = await db.jiraIssue.findUnique({ where: { issueKey } })
    if (!issue) return c.json({ success: false, error: '이슈를 찾을 수 없습니다.' }, 404)
    return c.json({ success: true, data: serializeIssue(issue) })
  } catch (e) {
    logger.error({ e }, 'Jira 이슈 조회 오류')
    return c.json({ success: false, error: String(e) }, 500)
  }
})

// PUT /jira/issues/:issueKey
jiraRouter.put('/issues/:issueKey', requireAuth, async (c) => {
  const issueKey = c.req.param('issueKey')
  const issue = await db.jiraIssue.findUnique({ where: { issueKey } })
  if (!issue) return c.json({ success: false, error: '이슈를 찾을 수 없습니다.' }, 404)

  try {
    const data = await c.req.json()
    await db.jiraIssue.update({
      where: { issueKey },
      data: {
        ...(data.summary !== undefined && { summary: data.summary }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.issue_type !== undefined && { issueType: data.issue_type }),
        ...(data.assignee_email !== undefined && { assigneeEmail: data.assignee_email }),
        ...(data.labels !== undefined && { labels: JSON.stringify(data.labels) }),
        ...(data.test_case_id !== undefined && { testCaseId: data.test_case_id }),
        ...(data.automation_test_id !== undefined && { automationTestId: data.automation_test_id }),
        ...(data.performance_test_id !== undefined && { performanceTestId: data.performance_test_id }),
        ...(data.environment !== undefined && { environment: data.environment }),
        updatedAt: new Date(),
      },
    })
    const updated = await db.jiraIssue.findUnique({ where: { issueKey } })
    return c.json({ success: true, message: '이슈가 성공적으로 업데이트되었습니다.', data: serializeIssue(updated!) })
  } catch (e) {
    logger.error({ e }, 'Jira 이슈 업데이트 오류')
    return c.json({ success: false, error: String(e) }, 500)
  }
})

// DELETE /jira/issues/:issueKey
jiraRouter.delete('/issues/:issueKey', requireAuth, async (c) => {
  const issueKey = c.req.param('issueKey')
  const issue = await db.jiraIssue.findUnique({ where: { issueKey } })
  if (!issue) return c.json({ success: false, error: '이슈를 찾을 수 없습니다.' }, 404)

  try {
    await db.jiraComment.deleteMany({ where: { jiraIssueId: issue.id } })
    await db.jiraIssue.delete({ where: { issueKey } })
    return c.json({ success: true, message: '이슈가 성공적으로 삭제되었습니다.' })
  } catch (e) {
    logger.error({ e }, 'Jira 이슈 삭제 오류')
    return c.json({ success: false, error: String(e) }, 500)
  }
})

// GET /jira/issues/:issueKey/comments
jiraRouter.get('/issues/:issueKey/comments', async (c) => {
  const issueKey = c.req.param('issueKey')
  try {
    const issue = await db.jiraIssue.findUnique({ where: { issueKey } })
    if (!issue) return c.json({ success: false, error: '이슈를 찾을 수 없습니다.' }, 404)

    const comments = await db.jiraComment.findMany({
      where: { jiraIssueId: issue.id },
      orderBy: { createdAt: 'asc' },
    })

    return c.json({
      success: true,
      data: {
        comments: comments.map((cm) => ({
          id: cm.id,
          body: cm.body,
          author_email: cm.authorEmail,
          created_at: cm.createdAt.toISOString(),
          updated_at: cm.updatedAt.toISOString(),
        })),
        issue_info: {
          key: issue.issueKey,
          summary: issue.summary,
          status: issue.status,
          priority: issue.priority,
        },
      },
    })
  } catch (e) {
    logger.error({ e }, 'Jira 댓글 조회 오류')
    return c.json({ success: false, error: String(e) }, 500)
  }
})

// POST /jira/issues/:issueKey/comments
jiraRouter.post('/issues/:issueKey/comments', requireAuth, async (c) => {
  const issueKey = c.req.param('issueKey')
  const issue = await db.jiraIssue.findUnique({ where: { issueKey } })
  if (!issue) return c.json({ success: false, error: '이슈를 찾을 수 없습니다.' }, 404)

  try {
    const data = await c.req.json()
    if (!data.body) return c.json({ success: false, error: '댓글 내용은 필수입니다.' }, 400)

    const comment = await db.jiraComment.create({
      data: {
        jiraIssueId: issue.id,
        body: data.body,
        authorEmail: data.author_email ?? 'system@example.com',
      },
    })

    // 멘션 처리: @username 패턴 감지 → 알림 생성
    const mentions = data.body.match(/@(\w+)/g) ?? []
    for (const mention of mentions) {
      const username = mention.slice(1)
      const user = await db.user.findFirst({ where: { username } })
      if (user) {
        await db.notification.create({
          data: {
            userId: user.id,
            notificationType: 'mention',
            title: 'Jira 이슈 멘션 알림',
            message: `Jira 이슈 '${issueKey}' 댓글에서 멘션되었습니다: ${data.body.slice(0, 50)}`,
            priority: 'medium',
            channels: 'in_app',
          },
        })
      }
    }

    return c.json({
      success: true,
      message: '댓글이 성공적으로 추가되었습니다.',
      data: { id: comment.id, body: comment.body, created_at: comment.createdAt.toISOString() },
    }, 201)
  } catch (e) {
    logger.error({ e }, 'Jira 댓글 추가 오류')
    return c.json({ success: false, error: String(e) }, 500)
  }
})

// ============================================================
// 외부 Jira API 프록시
// ============================================================

// GET /jira/external/health
jiraRouter.get('/external/health', async (c) => {
  try {
    const result = await jiraClient.healthCheck()
    return c.json({ success: result.status === 'healthy', data: result })
  } catch (e) {
    return c.json({ success: false, error: String(e) }, 500)
  }
})

// GET /jira/external/projects
jiraRouter.get('/external/projects', requireAuth, async (c) => {
  try {
    const projects = await jiraClient.getProjects()
    return c.json({ success: true, data: projects })
  } catch (e) {
    return c.json({ success: false, error: String(e) }, 500)
  }
})

// GET /jira/external/issues/:issueKey
jiraRouter.get('/external/issues/:issueKey', requireAuth, async (c) => {
  const issueKey = c.req.param('issueKey')
  try {
    const issue = await jiraClient.getIssue(issueKey)
    return c.json({ success: true, data: issue })
  } catch (e) {
    return c.json({ success: false, error: String(e) }, 500)
  }
})

// POST /jira/external/search
jiraRouter.post('/external/search', requireAuth, async (c) => {
  try {
    const data = await c.req.json()
    const result = await jiraClient.searchIssues(
      data.jql ?? '',
      data.start_at ?? 0,
      data.max_results ?? 50,
    )
    return c.json({ success: true, data: result })
  } catch (e) {
    return c.json({ success: false, error: String(e) }, 500)
  }
})

// POST /jira/external/sync — DB 이슈들을 외부 Jira와 동기화
jiraRouter.post('/external/sync', requireAuth, async (c) => {
  try {
    const data = await c.req.json().catch(() => ({}))
    const issueKey: string | undefined = data.issue_key

    if (issueKey) {
      const jiraIssue = await jiraClient.getIssue(issueKey)
      const fields = jiraIssue.fields
      await db.jiraIssue.upsert({
        where: { issueKey },
        create: {
          issueKey,
          projectKey: fields.project?.key ?? env.JIRA_PROJECT_KEY,
          issueType: fields.issuetype?.name ?? 'Task',
          status: fields.status?.name ?? 'To Do',
          priority: fields.priority?.name ?? 'Medium',
          summary: fields.summary,
          description: typeof fields.description === 'string' ? fields.description : '',
          assigneeEmail: null,
        },
        update: {
          status: fields.status?.name ?? 'To Do',
          priority: fields.priority?.name ?? 'Medium',
          summary: fields.summary,
          updatedAt: new Date(),
        },
      })
      return c.json({ success: true, message: '이슈가 동기화되었습니다.' })
    }

    // 전체 동기화
    const allIssues = await db.jiraIssue.findMany()
    let syncedCount = 0
    for (const issue of allIssues) {
      try {
        const jiraData = await jiraClient.getIssue(issue.issueKey)
        await db.jiraIssue.update({
          where: { id: issue.id },
          data: { status: jiraData.fields.status?.name ?? issue.status, updatedAt: new Date() },
        })
        syncedCount++
      } catch {
        /* 개별 실패 무시 */
      }
    }
    return c.json({ success: true, message: `${syncedCount}개의 이슈가 동기화되었습니다.` })
  } catch (e) {
    logger.error({ e }, 'Jira 동기화 오류')
    return c.json({ success: false, error: String(e) }, 500)
  }
})

// ============================================================
// 자동화 파이프라인
// ============================================================

// POST /jira/webhook  — Jira → TMS Webhook 수신
jiraRouter.post('/webhook', async (c) => {
  try {
    const payload = await c.req.json()
    const event = payload.webhookEvent ?? payload.issue_event_type_name

    logger.info({ event }, 'Jira Webhook 수신')

    const issue = payload.issue
    if (!issue) return c.json({ message: 'issue 필드가 없습니다.' })

    const fields = issue.fields ?? {}
    const issueKey: string = issue.key
    const summary: string = fields.summary ?? ''
    const description: string =
      typeof fields.description === 'string' ? fields.description : ''
    const issueType: string = fields.issuetype?.name ?? 'Task'
    const priority: string = fields.priority?.name ?? 'Medium'
    const projectKey: string = fields.project?.key ?? env.JIRA_PROJECT_KEY
    const newStatus: string = fields.status?.name ?? 'To Do'

    // 생성/업데이트 이벤트
    if (event?.includes('created') || event === 'jira:issue_created') {
      // 지정된 프로젝트만 처리
      const watchedProjects = env.JIRA_WATCHED_PROJECTS
      if (watchedProjects.length > 0 && !watchedProjects.includes(projectKey)) {
        return c.json({ message: `프로젝트 ${projectKey}는 모니터링 대상이 아닙니다.` })
      }

      const queue = getJiraQueue()
      await queue.add('create-tc', {
        type: 'create-tc-from-jira',
        issueKey,
        summary,
        description,
        issueType,
        priority,
        projectKey,
        environment: 'dev',
      })

      // 파이프라인 수집 (fire-and-forget)
      if (isQATarget(fields)) {
        jiraCollectorService.collect(issue, 'webhook')
          .catch((e) => logger.warn({ e }, 'JiraCollector 실패 (비치명)'))
      }

      return c.json({ message: '파이프라인 큐에 등록되었습니다.', issue_key: issueKey })
    }

    if (event?.includes('updated') || event === 'jira:issue_updated') {
      // qa-requested 레이블이 새로 추가된 경우 → 파이프라인 트리거
      const changelog = (payload.changelog?.items ?? []) as Array<{ field: string; fromString?: string; toString?: string }>
      const labelChange = changelog.find((item) => item.field === 'labels')
      const isQaLabelAdded = labelChange &&
        String(labelChange.toString ?? '').includes('qa-requested') &&
        !String(labelChange.fromString ?? '').includes('qa-requested')

      if (isQaLabelAdded) {
        jiraCollectorService.collect(issue, 'webhook')
          .catch((e) => logger.warn({ e }, 'JiraCollector 실패 (비치명)'))
        return c.json({ message: 'qa-requested 레이블 감지 — 파이프라인 시작', issue_key: issueKey })
      }

      const queue = getJiraQueue()
      await queue.add('sync-status', {
        type: 'sync-jira-status',
        issueKey,
        newStatus,
      })
      return c.json({ message: '상태 동기화 큐에 등록되었습니다.', issue_key: issueKey })
    }

    return c.json({ message: `처리하지 않는 이벤트: ${event}` })
  } catch (e) {
    logger.error({ e }, 'Jira Webhook 처리 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// POST /jira/auto-create — 테스트 실패 시 자동 Bug 이슈 생성
jiraRouter.post(
  '/auto-create',
  zValidator(
    'json',
    z.object({
      test_id: z.number().optional(),
      test_type: z.enum(['testcase', 'automation', 'performance']).optional(),
      test_name: z.string().min(1),
      test_result: z.string(),
      error_message: z.string().optional(),
      environment: z.string().default('dev'),
    }),
  ),
  async (c) => {
    const data = c.req.valid('json')
    try {
      if (!['Fail', 'Error'].includes(data.test_result)) {
        return c.json({ success: true, message: '테스트가 성공했으므로 이슈를 생성하지 않습니다.', data: null })
      }

      const queue = getJiraQueue()
      await queue.add('auto-bug', {
        type: 'auto-create-bug',
        testName: data.test_name,
        testResult: data.test_result,
        environment: data.environment,
        ...(data.test_type === 'testcase' && { testCaseId: data.test_id }),
        ...(data.test_type === 'automation' && { automationTestId: data.test_id }),
        ...(data.error_message !== undefined && { errorMessage: data.error_message }),
      })

      return c.json({ success: true, message: 'Bug 이슈 생성이 큐에 등록되었습니다.' })
    } catch (e) {
      logger.error({ e }, '자동 이슈 생성 오류')
      return c.json({ success: false, error: String(e) }, 500)
    }
  },
)

// POST /jira/pipeline/trigger — 특정 Jira 이슈 → TC 생성 수동 트리거
jiraRouter.post(
  '/pipeline/trigger',
  requireAuth,
  zValidator(
    'json',
    z.object({
      issue_key: z.string().min(1),
      environment: z.string().default('dev'),
      folder_id: z.number().optional(),
    }),
  ),
  async (c) => {
    const data = c.req.valid('json')
    const user = c.get('user')
    try {
      // DB에서 이슈 조회, 없으면 외부 Jira에서 가져오기
      let jiraIssue = await db.jiraIssue.findUnique({ where: { issueKey: data.issue_key } })

      if (!jiraIssue && env.JIRA_SERVER_URL) {
        const extIssue = await jiraClient.getIssue(data.issue_key)
        jiraIssue = await db.jiraIssue.create({
          data: {
            issueKey: extIssue.key,
            projectKey: extIssue.fields.project?.key ?? env.JIRA_PROJECT_KEY,
            issueType: extIssue.fields.issuetype?.name ?? 'Task',
            status: extIssue.fields.status?.name ?? 'To Do',
            priority: extIssue.fields.priority?.name ?? 'Medium',
            summary: extIssue.fields.summary,
            description: typeof extIssue.fields.description === 'string' ? extIssue.fields.description : '',
          },
        })
      }

      if (!jiraIssue) return c.json({ success: false, error: '이슈를 찾을 수 없습니다.' }, 404)

      const queue = getJiraQueue()
      const job = await queue.add('trigger-tc', {
        type: 'create-tc-from-jira',
        issueKey: jiraIssue.issueKey,
        summary: jiraIssue.summary,
        description: jiraIssue.description ?? '',
        issueType: jiraIssue.issueType,
        priority: jiraIssue.priority,
        projectKey: jiraIssue.projectKey,
        environment: data.environment,
        creatorId: Number(user.sub),
        ...(data.folder_id !== undefined && { folderId: data.folder_id }),
      })

      return c.json({ success: true, message: 'TC 생성 파이프라인이 시작되었습니다.', job_id: job.id, issue_key: jiraIssue.issueKey })
    } catch (e) {
      logger.error({ e }, '파이프라인 트리거 오류')
      return c.json({ success: false, error: String(e) }, 500)
    }
  },
)

// GET /jira/pipeline/status/:jobId — 파이프라인 Job 상태 조회
jiraRouter.get('/pipeline/status/:jobId', requireAuth, async (c) => {
  const jobId = c.req.param('jobId')
  try {
    const queue = getJiraQueue()
    const job = await queue.getJob(jobId)
    if (!job) return c.json({ success: false, error: 'Job을 찾을 수 없습니다.' }, 404)

    const state = await job.getState()
    return c.json({
      success: true,
      data: {
        id: job.id,
        state,
        data: job.data,
        progress: job.progress,
        failed_reason: job.failedReason ?? null,
        finished_on: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
      },
    })
  } catch (e) {
    logger.error({ e }, 'Job 상태 조회 오류')
    return c.json({ success: false, error: String(e) }, 500)
  }
})

// ============================================================
// 내부 헬퍼
// ============================================================

function buildPagination(page: number, perPage: number, total: number) {
  const pages = Math.ceil(total / perPage)
  return {
    page,
    per_page: perPage,
    total,
    pages,
    has_next: page < pages,
    has_prev: page > 1,
    next_num: page < pages ? page + 1 : null,
    prev_num: page > 1 ? page - 1 : null,
  }
}

function serializeIssue(i: {
  id: number
  issueKey: string
  projectKey: string
  issueType: string
  status: string
  priority: string
  summary: string
  description: string | null
  assigneeEmail: string | null
  labels: string | null
  reporterEmail: string | null
  environment: string | null
  testCaseId: number | null
  automationTestId: number | null
  performanceTestId: number | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: i.id,
    issue_key: i.issueKey,
    project_key: i.projectKey,
    issue_type: i.issueType,
    status: i.status,
    priority: i.priority,
    summary: i.summary,
    description: i.description,
    assignee_email: i.assigneeEmail,
    labels: (() => {
      try { return i.labels ? JSON.parse(i.labels) : [] } catch { return [] }
    })(),
    reporter_email: i.reporterEmail,
    environment: i.environment,
    test_case_id: i.testCaseId,
    automation_test_id: i.automationTestId,
    performance_test_id: i.performanceTestId,
    created_at: i.createdAt.toISOString(),
    updated_at: i.updatedAt.toISOString(),
  }
}
