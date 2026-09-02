import { randomUUID } from 'crypto'
import type { JiraIssueFields, JiraIssueResponse } from './jiraClient.js'
import type { EpicContext } from './epicContextResolver.js'

export interface NormalizedTicket {
  pipelineId: string
  ticketKey: string
  projectKey: string
  issueType: string
  priority: string
  summary: string
  descriptionRaw: string | null
  descriptionText: string
  labels: string[]
  sourceType: 'webhook' | 'cron'
  epicContext?: EpicContext
}

const PRIORITY_MAP: Record<string, string> = {
  Highest: 'P1',
  High: 'P1',
  Medium: 'P2',
  Low: 'P4',
  Lowest: 'P4',
}

export function normalizeTicket(
  issue: JiraIssueResponse,
  sourceType: 'webhook' | 'cron',
): NormalizedTicket {
  const fields = issue.fields
  const rawPriority = fields.priority?.name ?? 'Medium'
  const priority = PRIORITY_MAP[rawPriority] ?? 'P2'

  const descriptionRaw =
    fields.description != null ? JSON.stringify(fields.description) : null
  const descriptionText = adfToPlainText(fields.description)

  return {
    pipelineId: randomUUID(),
    ticketKey: issue.key,
    projectKey: fields.project?.key ?? 'UNKNOWN',
    issueType: fields.issuetype?.name ?? 'Task',
    priority,
    summary: fields.summary ?? '',
    descriptionRaw,
    descriptionText,
    labels: Array.isArray(fields.labels) ? fields.labels : [],
    sourceType,
  }
}

export function adfToPlainText(adf: unknown): string {
  if (adf == null) return ''
  if (typeof adf === 'string') return adf

  const parts: string[] = []
  traverseAdf(adf, parts)
  return parts.join('').trim()
}

function traverseAdf(node: unknown, parts: string[]): void {
  if (node == null || typeof node !== 'object') return
  const n = node as Record<string, unknown>

  if (n.type === 'text' && typeof n.text === 'string') {
    parts.push(n.text)
    return
  }

  if (n.type === 'paragraph' || n.type === 'heading') {
    traverseChildren(n.content, parts)
    parts.push('\n')
    return
  }

  if (n.type === 'listItem' || n.type === 'bulletListItem') {
    parts.push('- ')
    traverseChildren(n.content, parts)
    return
  }

  traverseChildren(n.content, parts)
}

function traverseChildren(content: unknown, parts: string[]): void {
  if (!Array.isArray(content)) return
  for (const child of content) {
    traverseAdf(child, parts)
  }
}

export function isQATarget(fields: JiraIssueFields): boolean {
  const labels = Array.isArray(fields.labels) ? fields.labels : []
  if (labels.includes('qa-requested')) return true
  if (fields.status?.name === 'Ready for QA') return true
  const issueType = fields.issuetype?.name ?? ''
  if (issueType === 'Task') return (fields.summary ?? '').toUpperCase().includes('QA')
  return ['Story', 'Bug', 'QA Task'].includes(issueType)
}
