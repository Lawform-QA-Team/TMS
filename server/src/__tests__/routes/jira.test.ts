/**
 * routes/jira.ts 화이트박스 테스트
 *
 * 커버 경로:
 * - GET /stats: groupBy 집계
 * - POST /webhook: 이벤트별 큐 등록
 * - GET /issues: 페이지네이션 + 필터
 * - POST /issues: 이슈 생성 (issueKey 자동 채번)
 * - GET /issues/:issueKey: 단일 조회
 * - PUT /issues/:issueKey: 업데이트
 * - DELETE /issues/:issueKey: 삭제
 * - POST /issues/:issueKey/comments: 댓글 + 멘션 알림
 * - GET /external/health: Jira 서버 상태
 * - POST /auto-create: Fail/Error → 큐 등록, Pass → 무시
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

// ──────────────────────────────────────────────
// DB 모킹
// ──────────────────────────────────────────────

const mockIssueCount = vi.fn()
const mockIssueGroupBy = vi.fn()
const mockIssueFindMany = vi.fn()
const mockIssueFindUnique = vi.fn()
const mockIssueFindFirst = vi.fn()
const mockIssueCreate = vi.fn()
const mockIssueUpdate = vi.fn()
const mockIssueDelete = vi.fn()
const mockCommentCreate = vi.fn()
const mockCommentFindMany = vi.fn()
const mockCommentDeleteMany = vi.fn()
const mockNotificationCreate = vi.fn()
const mockUserFindFirst = vi.fn()
const mockTcFindUnique = vi.fn()

vi.mock('../../lib/db.js', () => ({
  db: {
    jiraIssue: {
      count: (...a: unknown[]) => mockIssueCount(...a),
      groupBy: (...a: unknown[]) => mockIssueGroupBy(...a),
      findMany: (...a: unknown[]) => mockIssueFindMany(...a),
      findUnique: (...a: unknown[]) => mockIssueFindUnique(...a),
      findFirst: (...a: unknown[]) => mockIssueFindFirst(...a),
      create: (...a: unknown[]) => mockIssueCreate(...a),
      update: (...a: unknown[]) => mockIssueUpdate(...a),
      delete: (...a: unknown[]) => mockIssueDelete(...a),
    },
    jiraComment: {
      create: (...a: unknown[]) => mockCommentCreate(...a),
      findMany: (...a: unknown[]) => mockCommentFindMany(...a),
      deleteMany: (...a: unknown[]) => mockCommentDeleteMany(...a),
    },
    notification: {
      create: (...a: unknown[]) => mockNotificationCreate(...a),
    },
    user: {
      findFirst: (...a: unknown[]) => mockUserFindFirst(...a),
    },
    testCase: {
      findUnique: (...a: unknown[]) => mockTcFindUnique(...a),
    },
  },
}))

// BullMQ 모킹
const mockQueueAdd = vi.fn().mockResolvedValue({ id: 'job-123' })
vi.mock('../../lib/jiraPipeline.js', () => ({
  getJiraQueue: vi.fn().mockReturnValue({ add: mockQueueAdd }),
}))

// Jira 클라이언트 모킹
const mockHealthCheck = vi.fn().mockResolvedValue({ status: 'healthy', server_url: 'http://jira.test' })
vi.mock('../../lib/jiraClient.js', () => ({
  jiraClient: {
    healthCheck: (...a: unknown[]) => mockHealthCheck(...a),
    getProjects: vi.fn().mockResolvedValue([]),
    getIssue: vi.fn(),
    searchIssues: vi.fn().mockResolvedValue({ total: 0, issues: [] }),
  },
}))

vi.mock('../../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

vi.mock('../../middleware/auth.js', () => ({
  requireAuth: vi.fn(async (c: { set: (k: string, v: unknown) => void }, next: () => Promise<void>) => {
    c.set('user', { sub: '1', username: 'tester', role: 'admin' })
    return next()
  }),
}))

// ──────────────────────────────────────────────
// 헬퍼
// ──────────────────────────────────────────────

function makeIssue(issueKey = 'TEST-1') {
  return {
    id: 1,
    issueKey,
    projectKey: 'TEST',
    issueType: 'Bug',
    status: 'To Do',
    priority: 'Medium',
    summary: 'Test issue',
    description: 'desc',
    environment: 'dev',
    testCaseId: null,
    automationTestId: null,
    performanceTestId: null,
    assigneeEmail: null,
    reporterEmail: null,
    labels: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }
}

async function buildApp() {
  const { jiraRouter } = await import('../../routes/jira.js')
  const app = new Hono()
  app.route('/', jiraRouter)
  return app
}

describe('jira router', () => {
  let app: Hono

  beforeEach(async () => {
    vi.resetModules()
    mockIssueCount.mockReset()
    mockIssueGroupBy.mockReset()
    mockIssueFindMany.mockReset()
    mockIssueFindUnique.mockReset()
    mockIssueFindFirst.mockReset()
    mockIssueCreate.mockReset()
    mockIssueUpdate.mockReset()
    mockIssueDelete.mockReset()
    mockCommentCreate.mockReset()
    mockCommentFindMany.mockReset()
    mockCommentDeleteMany.mockReset()
    mockNotificationCreate.mockReset()
    mockUserFindFirst.mockReset()
    mockQueueAdd.mockClear()
    app = await buildApp()
  })

  // ────────────────────────────────────────
  // GET /stats
  // ────────────────────────────────────────

  describe('GET /stats', () => {
    it('이슈 통계 반환', async () => {
      mockIssueCount.mockResolvedValue(5)
      mockIssueGroupBy
        .mockResolvedValueOnce([{ status: 'To Do', _count: { id: 3 } }, { status: 'Done', _count: { id: 2 } }]) // by status
        .mockResolvedValueOnce([{ priority: 'High', _count: { id: 2 } }]) // by priority
        .mockResolvedValueOnce([{ issueType: 'Bug', _count: { id: 5 } }]) // by issueType
      mockIssueFindMany.mockResolvedValue([makeIssue('TEST-1')])

      const res = await app.request('/stats')
      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { total_issues: number; issues_by_status: Record<string, number> } }
      expect(body.success).toBe(true)
      expect(body.data.total_issues).toBe(5)
      expect(body.data.issues_by_status['To Do']).toBe(3)
    })
  })

  // ────────────────────────────────────────
  // POST /webhook
  // ────────────────────────────────────────

  describe('POST /webhook', () => {
    const basePayload = {
      issue: {
        key: 'TEST-10',
        fields: {
          summary: 'New Feature',
          description: 'desc',
          issuetype: { name: 'Story' },
          priority: { name: 'High' },
          project: { key: 'TEST' },
          status: { name: 'To Do' },
        },
      },
    }

    it('jira:issue_created → create-tc-from-jira 큐 등록', async () => {
      const res = await app.request('/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...basePayload, webhookEvent: 'jira:issue_created' }),
      })
      expect(res.status).toBe(200)
      expect(mockQueueAdd).toHaveBeenCalledWith('create-tc', expect.objectContaining({ type: 'create-tc-from-jira', issueKey: 'TEST-10' }))
    })

    it('"created" 포함 이벤트 → create-tc-from-jira 큐 등록', async () => {
      await app.request('/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...basePayload, webhookEvent: 'issue_created' }),
      })
      expect(mockQueueAdd).toHaveBeenCalledWith('create-tc', expect.objectContaining({ type: 'create-tc-from-jira' }))
    })

    it('jira:issue_updated → sync-jira-status 큐 등록', async () => {
      const res = await app.request('/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...basePayload, webhookEvent: 'jira:issue_updated' }),
      })
      expect(res.status).toBe(200)
      expect(mockQueueAdd).toHaveBeenCalledWith('sync-status', expect.objectContaining({ type: 'sync-jira-status', issueKey: 'TEST-10', newStatus: 'To Do' }))
    })

    it('미지원 이벤트 → 큐 등록 없이 200', async () => {
      // 'created'/'updated' 문자열 미포함 이벤트 사용
      await app.request('/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...basePayload, webhookEvent: 'jira:sprint_started' }),
      })
      expect(mockQueueAdd).not.toHaveBeenCalled()
    })

    it('issue 필드 없으면 200 + 메시지', async () => {
      const res = await app.request('/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookEvent: 'jira:issue_created' }),
      })
      expect(res.status).toBe(200)
      expect(mockQueueAdd).not.toHaveBeenCalled()
    })
  })

  // ────────────────────────────────────────
  // GET /issues
  // ────────────────────────────────────────

  describe('GET /issues', () => {
    it('이슈 목록 반환', async () => {
      mockIssueCount.mockResolvedValue(2)
      mockIssueFindMany.mockResolvedValue([makeIssue('TEST-1'), makeIssue('TEST-2')])

      const res = await app.request('/issues')
      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { issues: unknown[]; pagination: { total: number } } }
      expect(body.success).toBe(true)
      expect(body.data.issues).toHaveLength(2)
      expect(body.data.pagination.total).toBe(2)
    })

    it('status 필터 적용', async () => {
      mockIssueCount.mockResolvedValue(0)
      mockIssueFindMany.mockResolvedValue([])
      await app.request('/issues?status=Done')
      expect(mockIssueCount).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: 'Done' }) }))
    })

    it('priority 필터 적용', async () => {
      mockIssueCount.mockResolvedValue(0)
      mockIssueFindMany.mockResolvedValue([])
      await app.request('/issues?priority=High')
      expect(mockIssueCount).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ priority: 'High' }) }))
    })
  })

  // ────────────────────────────────────────
  // POST /issues — issueKey 자동 채번
  // ────────────────────────────────────────

  describe('POST /issues', () => {
    it('이슈 생성 → 201 + issueKey 자동 채번', async () => {
      mockIssueFindFirst.mockResolvedValue(makeIssue('TEST-5')) // 마지막 이슈 TEST-5
      mockTcFindUnique.mockResolvedValue(null)
      mockIssueCreate.mockResolvedValue(makeIssue('TEST-6'))

      const res = await app.request('/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: 'New Bug',
          issue_type: 'Bug',
          priority: 'High',
        }),
      })
      expect(res.status).toBe(201)
      // issueKey TEST-6 자동 채번 확인
      expect(mockIssueCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ issueKey: 'TEST-6' }) }),
      )
    })

    it('이전 이슈 없으면 TEST-1 채번', async () => {
      mockIssueFindFirst.mockResolvedValue(null)
      mockIssueCreate.mockResolvedValue(makeIssue('TEST-1'))

      await app.request('/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: 'First', issue_type: 'Task' }),
      })
      expect(mockIssueCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ issueKey: 'TEST-1' }) }),
      )
    })
  })

  // ────────────────────────────────────────
  // GET /issues/:issueKey
  // ────────────────────────────────────────

  describe('GET /issues/:issueKey', () => {
    it('이슈 존재 → 200', async () => {
      mockIssueFindUnique.mockResolvedValue(makeIssue('TEST-1'))
      mockCommentFindMany.mockResolvedValue([])
      const res = await app.request('/issues/TEST-1')
      expect(res.status).toBe(200)
    })

    it('이슈 미존재 → 404', async () => {
      mockIssueFindUnique.mockResolvedValue(null)
      const res = await app.request('/issues/GHOST-1')
      expect(res.status).toBe(404)
    })
  })

  // ────────────────────────────────────────
  // PUT /issues/:issueKey
  // ────────────────────────────────────────

  describe('PUT /issues/:issueKey', () => {
    it('이슈 업데이트 → 200', async () => {
      mockIssueFindUnique.mockResolvedValue(makeIssue('TEST-1'))
      mockIssueUpdate.mockResolvedValue({ ...makeIssue('TEST-1'), status: 'Done' })
      const res = await app.request('/issues/TEST-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Done' }),
      })
      expect(res.status).toBe(200)
    })

    it('미존재 이슈 → 404', async () => {
      mockIssueFindUnique.mockResolvedValue(null)
      const res = await app.request('/issues/GHOST-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Done' }),
      })
      expect(res.status).toBe(404)
    })
  })

  // ────────────────────────────────────────
  // DELETE /issues/:issueKey
  // ────────────────────────────────────────

  describe('DELETE /issues/:issueKey', () => {
    it('이슈 삭제 → 200', async () => {
      mockIssueFindUnique.mockResolvedValue(makeIssue('TEST-1'))
      mockCommentDeleteMany.mockResolvedValue({ count: 0 })
      mockIssueDelete.mockResolvedValue({})
      const res = await app.request('/issues/TEST-1', { method: 'DELETE' })
      expect(res.status).toBe(200)
    })

    it('미존재 → 404', async () => {
      mockIssueFindUnique.mockResolvedValue(null)
      const res = await app.request('/issues/GHOST-1', { method: 'DELETE' })
      expect(res.status).toBe(404)
    })
  })

  // ────────────────────────────────────────
  // POST /issues/:issueKey/comments
  // ────────────────────────────────────────

  describe('POST /issues/:issueKey/comments', () => {
    it('댓글 추가 → 201', async () => {
      // POST /issues/:issueKey/comments 는 { body } 필드 사용
      mockIssueFindUnique.mockResolvedValue(makeIssue('TEST-1'))
      mockCommentCreate.mockResolvedValue({ id: 1, body: 'hello', authorEmail: null, createdAt: new Date(), updatedAt: new Date() })

      const res = await app.request('/issues/TEST-1/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: 'hello' }),
      })
      expect(res.status).toBe(201)
    })

    it('@멘션 감지 → 멘션된 유저에 알림 생성 (user.findFirst 사용)', async () => {
      mockIssueFindUnique.mockResolvedValue(makeIssue('TEST-1'))
      mockUserFindFirst.mockResolvedValue({ id: 2, username: 'alice' })
      mockCommentCreate.mockResolvedValue({ id: 1, body: '@alice check this', authorEmail: null, createdAt: new Date(), updatedAt: new Date() })
      mockNotificationCreate.mockResolvedValue({ id: 10 })

      await app.request('/issues/TEST-1/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: '@alice check this' }),
      })
      expect(mockNotificationCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 2 }) }),
      )
    })

    it('멘션 없는 댓글 → 알림 생성 안 함', async () => {
      mockIssueFindUnique.mockResolvedValue(makeIssue('TEST-1'))
      mockCommentCreate.mockResolvedValue({ id: 1, body: 'no mention', authorEmail: null, createdAt: new Date(), updatedAt: new Date() })

      await app.request('/issues/TEST-1/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: 'no mention' }),
      })
      expect(mockNotificationCreate).not.toHaveBeenCalled()
    })

    it('이슈 미존재 → 404', async () => {
      mockIssueFindUnique.mockResolvedValue(null)
      const res = await app.request('/issues/GHOST-1/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'hi' }),
      })
      expect(res.status).toBe(404)
    })
  })

  // ────────────────────────────────────────
  // GET /external/health
  // ────────────────────────────────────────

  describe('GET /external/health', () => {
    it('Jira 서버 healthy 응답 반환', async () => {
      const res = await app.request('/external/health')
      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean; data: { status: string } }
      expect(body.data.status).toBe('healthy')
    })
  })

  // ────────────────────────────────────────
  // POST /auto-create
  // ────────────────────────────────────────

  describe('POST /auto-create', () => {
    it('Fail → auto-create-bug 큐 등록', async () => {
      const res = await app.request('/auto-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_name: 'Login Test', test_result: 'Fail', environment: 'prod', test_type: 'testcase', test_id: 5 }),
      })
      expect(res.status).toBe(200)
      expect(mockQueueAdd).toHaveBeenCalledWith('auto-bug', expect.objectContaining({ type: 'auto-create-bug', testResult: 'Fail' }))
    })

    it('Error → auto-create-bug 큐 등록', async () => {
      await app.request('/auto-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_name: 'API Test', test_result: 'Error', environment: 'dev' }),
      })
      expect(mockQueueAdd).toHaveBeenCalledWith('auto-bug', expect.objectContaining({ testResult: 'Error' }))
    })

    it('Pass → 큐 등록 없이 success: true', async () => {
      const res = await app.request('/auto-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_name: 'Pass Test', test_result: 'Pass', environment: 'dev' }),
      })
      expect(res.status).toBe(200)
      const body = await res.json() as { success: boolean }
      expect(body.success).toBe(true)
      expect(mockQueueAdd).not.toHaveBeenCalled()
    })
  })
})
