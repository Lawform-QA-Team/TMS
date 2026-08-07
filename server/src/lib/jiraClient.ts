/**
 * Jira REST API v3 클라이언트
 * 실제 Jira Cloud/Server 및 Mock Jira 서버 모두 지원
 */
import { env } from '../env.js'
import { logger } from './logger.js'

export interface JiraIssueFields {
  summary: string
  description?: string | null
  status?: { name: string }
  priority?: { name: string }
  issuetype?: { name: string }
  project?: { key: string }
  assignee?: { accountId: string; displayName?: string } | null
  labels?: string[]
  [key: string]: unknown
}

export interface JiraIssueResponse {
  id: string
  key: string
  fields: JiraIssueFields
}

export interface JiraSearchResult {
  total: number
  startAt: number
  maxResults: number
  issues: JiraIssueResponse[]
}

export interface JiraProject {
  id: string
  key: string
  name: string
}

export interface JiraCommentResponse {
  id: string
  body: string
  author?: { accountId: string; displayName?: string }
  created: string
  updated: string
}

export class JiraClient {
  private readonly baseUrl: string
  private readonly authHeader: string

  constructor(
    serverUrl?: string,
    username?: string,
    apiToken?: string,
  ) {
    this.baseUrl = (serverUrl ?? env.JIRA_SERVER_URL ?? 'http://localhost:5004').replace(/\/$/, '')
    const user = username ?? env.JIRA_USERNAME ?? 'admin'
    const token = apiToken ?? env.JIRA_API_TOKEN ?? 'mock-token'
    this.authHeader = 'Basic ' + Buffer.from(`${user}:${token}`).toString('base64')
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string>,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`)
    if (params) {
      for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
    }

    const res = await fetch(url.toString(), {
      method,
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Jira API ${method} ${path} → ${res.status}: ${text}`)
    }

    if (res.status === 204) return {} as T
    return res.json() as Promise<T>
  }

  /** Jira 서버 상태 확인 */
  async healthCheck(): Promise<{ status: string; server_url: string; response?: unknown; error?: string }> {
    try {
      const response = await this.request<unknown>('GET', '/health')
      return { status: 'healthy', server_url: this.baseUrl, response }
    } catch (e) {
      return { status: 'unhealthy', server_url: this.baseUrl, error: String(e) }
    }
  }

  /** 프로젝트 목록 */
  async getProjects(): Promise<JiraProject[]> {
    return this.request<JiraProject[]>('GET', '/rest/api/3/project')
  }

  /** 이슈 조회 */
  async getIssue(issueKey: string): Promise<JiraIssueResponse> {
    return this.request<JiraIssueResponse>('GET', `/rest/api/3/issue/${issueKey}`)
  }

  /** 이슈 생성 */
  async createIssue(opts: {
    summary: string
    description?: string
    issueType?: string
    priority?: string
    projectKey?: string
    assigneeAccountId?: string
    labels?: string[]
  }): Promise<JiraIssueResponse> {
    const projectKey = opts.projectKey ?? env.JIRA_PROJECT_KEY
    const body = {
      fields: {
        project: { key: projectKey },
        summary: opts.summary,
        description: opts.description ?? '',
        issuetype: { name: opts.issueType ?? 'Task' },
        priority: { name: opts.priority ?? 'Medium' },
        ...(opts.assigneeAccountId && { assignee: { accountId: opts.assigneeAccountId } }),
        ...(opts.labels?.length && { labels: opts.labels }),
      },
    }
    return this.request<JiraIssueResponse>('POST', '/rest/api/3/issue', body)
  }

  /** 이슈 업데이트 */
  async updateIssue(issueKey: string, fields: Partial<JiraIssueFields>): Promise<void> {
    const mapped: Record<string, unknown> = {}
    if (fields.summary) mapped.summary = fields.summary
    if (fields.description !== undefined) mapped.description = fields.description
    if (fields.status) mapped.status = fields.status
    if (fields.priority) mapped.priority = fields.priority
    if (fields.issuetype) mapped.issuetype = fields.issuetype
    if (fields.labels) mapped.labels = fields.labels
    if (fields.assignee !== undefined) mapped.assignee = fields.assignee

    await this.request('PUT', `/rest/api/3/issue/${issueKey}`, { fields: mapped })
  }

  /** 댓글 추가 */
  async addComment(issueKey: string, body: string): Promise<JiraCommentResponse> {
    return this.request<JiraCommentResponse>('POST', `/rest/api/3/issue/${issueKey}/comment`, { body })
  }

  /** 댓글 목록 */
  async getComments(issueKey: string): Promise<JiraCommentResponse[]> {
    const res = await this.request<{ comments: JiraCommentResponse[] }>('GET', `/rest/api/3/issue/${issueKey}/comment`)
    return res.comments ?? []
  }

  /** JQL 검색 */
  async searchIssues(jql: string, startAt = 0, maxResults = 50): Promise<JiraSearchResult> {
    return this.request<JiraSearchResult>('GET', '/rest/api/3/search', undefined, {
      jql,
      startAt: String(startAt),
      maxResults: String(maxResults),
    })
  }

  /** JQL 페이지네이션 제너레이터 */
  async *searchIssuesPaginated(
    jql: string,
    pageSize = 50,
  ): AsyncGenerator<JiraIssueResponse> {
    let startAt = 0
    while (true) {
      const result = await this.searchIssues(jql, startAt, pageSize)
      for (const issue of result.issues) yield issue
      startAt += result.issues.length
      if (startAt >= result.total || result.issues.length === 0) break
    }
  }

  /** 상태 전환 */
  async transitionIssue(issueKey: string, transitionId: string): Promise<void> {
    await this.request('POST', `/rest/api/3/issue/${issueKey}/transitions`, {
      transition: { id: transitionId },
    })
  }
}

// 싱글턴 클라이언트
export const jiraClient = new JiraClient()
