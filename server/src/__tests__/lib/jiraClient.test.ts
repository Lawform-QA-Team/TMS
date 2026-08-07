/**
 * lib/jiraClient.ts 화이트박스 테스트
 *
 * 커버 경로:
 * - request(): 정상 응답, 204 No Content, 에러 응답, 쿼리 파라미터 추가
 * - healthCheck(): healthy / unhealthy 분기
 * - getProjects(), getIssue(), createIssue(), updateIssue()
 * - addComment(), getComments(), searchIssues(), transitionIssue()
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { JiraClient } from '../../lib/jiraClient.js'

// globalThis.fetch 모킹
const mockFetch = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

function makeResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as Response
}

describe('JiraClient', () => {
  let client: JiraClient

  beforeEach(() => {
    client = new JiraClient('http://jira.test', 'user', 'token')
  })

  // ────────────────────────────────────────
  // request() 내부 경로
  // ────────────────────────────────────────

  describe('request()', () => {
    it('정상 응답 시 JSON 반환', async () => {
      mockFetch.mockResolvedValueOnce(makeResponse({ key: 'TEST-1' }))
      const result = await client.getIssue('TEST-1')
      expect(result).toEqual({ key: 'TEST-1' })
    })

    it('204 No Content 응답 시 빈 객체 반환', async () => {
      mockFetch.mockResolvedValueOnce(makeResponse(null, 204))
      // updateIssue는 204를 반환
      await expect(client.updateIssue('TEST-1', { summary: 'new' })).resolves.toBeUndefined()
    })

    it('에러 응답 시 Error throw', async () => {
      mockFetch.mockResolvedValueOnce(makeResponse('Not Found', 404))
      await expect(client.getIssue('INVALID-1')).rejects.toThrow('404')
    })

    it('쿼리 파라미터가 URL에 포함됨', async () => {
      mockFetch.mockResolvedValueOnce(makeResponse({ total: 0, issues: [], startAt: 0, maxResults: 50 }))
      await client.searchIssues('project = TEST', 10, 25)

      const calledUrl = (mockFetch.mock.calls[0] as unknown[])[0] as string
      expect(calledUrl).toContain('jql=project+%3D+TEST')
      expect(calledUrl).toContain('startAt=10')
      expect(calledUrl).toContain('maxResults=25')
    })

    it('Authorization 헤더가 Basic 인코딩으로 전달됨', async () => {
      mockFetch.mockResolvedValueOnce(makeResponse([]))
      await client.getProjects()

      const init = (mockFetch.mock.calls[0] as unknown[])[1] as RequestInit
      const expected = 'Basic ' + Buffer.from('user:token').toString('base64')
      expect((init.headers as Record<string, string>)['Authorization']).toBe(expected)
    })

    it('body 있을 때 JSON 직렬화됨', async () => {
      mockFetch.mockResolvedValueOnce(makeResponse({ id: '1', key: 'TEST-2', fields: {} }))
      await client.createIssue({ summary: 'Test', issueType: 'Bug' })

      const init = (mockFetch.mock.calls[0] as unknown[])[1] as RequestInit
      expect(init.body).toBeDefined()
      const body = JSON.parse(init.body as string) as { fields: { summary: string } }
      expect(body.fields.summary).toBe('Test')
    })

    it('body 없을 때 body 속성 없음', async () => {
      mockFetch.mockResolvedValueOnce(makeResponse([]))
      await client.getProjects()

      const init = (mockFetch.mock.calls[0] as unknown[])[1] as RequestInit
      expect(init.body).toBeUndefined()
    })
  })

  // ────────────────────────────────────────
  // healthCheck()
  // ────────────────────────────────────────

  describe('healthCheck()', () => {
    it('정상 응답 → healthy 반환', async () => {
      mockFetch.mockResolvedValueOnce(makeResponse({ status: 'ok' }))
      const result = await client.healthCheck()
      expect(result.status).toBe('healthy')
      expect(result.server_url).toBe('http://jira.test')
    })

    it('fetch 실패 → unhealthy 반환 (throw 안 함)', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'))
      const result = await client.healthCheck()
      expect(result.status).toBe('unhealthy')
      expect(result.error).toContain('Connection refused')
    })

    it('4xx 응답 → unhealthy 반환 (에러 응답은 throw → catch)', async () => {
      mockFetch.mockResolvedValueOnce(makeResponse('Server Error', 500))
      const result = await client.healthCheck()
      expect(result.status).toBe('unhealthy')
    })
  })

  // ────────────────────────────────────────
  // createIssue() — 필드 매핑
  // ────────────────────────────────────────

  describe('createIssue()', () => {
    it('projectKey 기본값(env.JIRA_PROJECT_KEY) 사용', async () => {
      mockFetch.mockResolvedValueOnce(makeResponse({ id: '1', key: 'TEST-3', fields: {} }))
      await client.createIssue({ summary: 'S' })

      const body = JSON.parse(((mockFetch.mock.calls[0] as unknown[])[1] as RequestInit).body as string) as {
        fields: { project: { key: string }; issuetype: { name: string }; priority: { name: string } }
      }
      expect(body.fields.project.key).toBe('TEST')
      expect(body.fields.issuetype.name).toBe('Task')
      expect(body.fields.priority.name).toBe('Medium')
    })

    it('assignee, labels 포함 시 필드에 추가됨', async () => {
      mockFetch.mockResolvedValueOnce(makeResponse({ id: '1', key: 'TEST-4', fields: {} }))
      await client.createIssue({
        summary: 'S',
        assigneeAccountId: 'acc-123',
        labels: ['bug', 'critical'],
      })

      const body = JSON.parse(((mockFetch.mock.calls[0] as unknown[])[1] as RequestInit).body as string) as {
        fields: { assignee?: { accountId: string }; labels?: string[] }
      }
      expect(body.fields.assignee?.accountId).toBe('acc-123')
      expect(body.fields.labels).toEqual(['bug', 'critical'])
    })

    it('assignee, labels 없으면 필드에 포함되지 않음', async () => {
      mockFetch.mockResolvedValueOnce(makeResponse({ id: '1', key: 'TEST-5', fields: {} }))
      await client.createIssue({ summary: 'S' })

      const body = JSON.parse(((mockFetch.mock.calls[0] as unknown[])[1] as RequestInit).body as string) as {
        fields: Record<string, unknown>
      }
      expect(body.fields['assignee']).toBeUndefined()
      expect(body.fields['labels']).toBeUndefined()
    })
  })

  // ────────────────────────────────────────
  // updateIssue() — 조건부 필드 매핑
  // ────────────────────────────────────────

  describe('updateIssue()', () => {
    it('전달된 필드만 mapped 객체에 포함', async () => {
      mockFetch.mockResolvedValueOnce(makeResponse(null, 204))
      await client.updateIssue('TEST-1', { summary: 'New Title', priority: { name: 'High' } })

      const body = JSON.parse(((mockFetch.mock.calls[0] as unknown[])[1] as RequestInit).body as string) as {
        fields: Record<string, unknown>
      }
      expect(body.fields['summary']).toBe('New Title')
      expect(body.fields['priority']).toEqual({ name: 'High' })
      expect(body.fields['description']).toBeUndefined()
    })

    it('PUT 메서드 사용', async () => {
      mockFetch.mockResolvedValueOnce(makeResponse(null, 204))
      await client.updateIssue('TEST-1', { summary: 'X' })

      const method = ((mockFetch.mock.calls[0] as unknown[])[1] as RequestInit).method
      expect(method).toBe('PUT')
    })
  })

  // ────────────────────────────────────────
  // getComments() — comments 배열 추출
  // ────────────────────────────────────────

  describe('getComments()', () => {
    it('comments 배열 반환', async () => {
      mockFetch.mockResolvedValueOnce(makeResponse({ comments: [{ id: '1', body: 'hi', created: '', updated: '' }] }))
      const result = await client.getComments('TEST-1')
      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe('1')
    })

    it('comments 없으면 빈 배열 반환', async () => {
      mockFetch.mockResolvedValueOnce(makeResponse({}))
      const result = await client.getComments('TEST-1')
      expect(result).toEqual([])
    })
  })

  // ────────────────────────────────────────
  // transitionIssue()
  // ────────────────────────────────────────

  describe('transitionIssue()', () => {
    it('transition.id 포함하여 POST 요청', async () => {
      mockFetch.mockResolvedValueOnce(makeResponse(null, 204))
      await client.transitionIssue('TEST-1', '31')

      const body = JSON.parse(((mockFetch.mock.calls[0] as unknown[])[1] as RequestInit).body as string) as {
        transition: { id: string }
      }
      expect(body.transition.id).toBe('31')
    })
  })

  // ────────────────────────────────────────
  // baseUrl trailing slash 제거
  // ────────────────────────────────────────

  describe('baseUrl 처리', () => {
    it('trailing slash 제거됨', async () => {
      const c = new JiraClient('http://jira.test/', 'u', 't')
      mockFetch.mockResolvedValueOnce(makeResponse([]))
      await c.getProjects()

      const url = (mockFetch.mock.calls[0] as unknown[])[0] as string
      expect(url).toMatch(/^http:\/\/jira\.test\//)
      // 프로토콜(://) 이후에 double slash가 없어야 함 (trailing slash 제거 확인)
      expect(url.slice(url.indexOf('://') + 3)).not.toContain('//')
    })
  })
})
