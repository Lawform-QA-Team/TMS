/**
 * Epic 컨텍스트 리졸버
 *
 * QA Task (qa-requested 레이블) → parent Epic → [기획] Task → 기획 내용 + Figma URL 추출
 *
 * Flow:
 *   1. QA Task의 parent(Epic) 키 추출 (Next-gen: parent.key, Classic: customfield_10014)
 *   2. Epic 하위 children 조회
 *   3. '[기획]' prefix Task 찾기
 *   4. 기획 Task description ADF → 텍스트 변환
 *   5. description 텍스트 + Jira Remote Links에서 Figma URL 추출
 *   6. (옵션) Figma API 토큰이 있으면 텍스트 레이어 추출
 */
import { jiraClient } from './jiraClient.js'
import { adfToPlainText } from './ticketNormalizer.js'
import { logger } from './logger.js'
import { env } from '../env.js'

export interface EpicContext {
  epicKey: string | null
  epicSummary: string
  epicDescription: string
  planningTaskKey: string | null
  planningContent: string
  figmaUrls: string[]
  figmaContent: string    // Figma API로 추출한 텍스트 (토큰 있을 때만)
}

const EMPTY_CONTEXT: EpicContext = {
  epicKey: null,
  epicSummary: '',
  epicDescription: '',
  planningTaskKey: null,
  planningContent: '',
  figmaUrls: [],
  figmaContent: '',
}

// ──────────────────────────────────────────────
// Figma URL 추출 유틸
// ──────────────────────────────────────────────

const FIGMA_URL_PATTERN = /https?:\/\/(?:www\.)?figma\.com\/(?:file|design|proto)\/[^\s"'<>)\]]+/g

export function extractFigmaUrls(text: string): string[] {
  const matches = text.match(FIGMA_URL_PATTERN) ?? []
  return [...new Set(matches)]
}

export function extractFigmaFileKey(figmaUrl: string): string | null {
  const match = figmaUrl.match(/figma\.com\/(?:file|design|proto)\/([A-Za-z0-9]+)/)
  return match?.[1] ?? null
}

// ──────────────────────────────────────────────
// Figma API 텍스트 추출 (토큰 있을 때만)
// ──────────────────────────────────────────────

async function fetchFigmaText(fileKey: string): Promise<string> {
  if (!env.FIGMA_API_TOKEN) return ''

  try {
    const res = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: { 'X-Figma-Token': env.FIGMA_API_TOKEN },
    })
    if (!res.ok) {
      logger.warn({ fileKey, status: res.status }, 'Figma API 호출 실패')
      return ''
    }
    const data = await res.json() as { document?: unknown; name?: string }
    return extractTextFromFigmaDocument(data.document)
  } catch (e) {
    logger.warn({ e, fileKey }, 'Figma API 오류 (무시)')
    return ''
  }
}

function extractTextFromFigmaDocument(node: unknown): string {
  if (node == null || typeof node !== 'object') return ''
  const n = node as Record<string, unknown>
  const parts: string[] = []

  if (n.type === 'TEXT' && typeof n.characters === 'string' && n.characters.trim()) {
    parts.push(n.characters.trim())
  }

  if (Array.isArray(n.children)) {
    for (const child of n.children) {
      const childText = extractTextFromFigmaDocument(child)
      if (childText) parts.push(childText)
    }
  }

  return parts.join('\n')
}

// ──────────────────────────────────────────────
// 메인: Epic 컨텍스트 조회
// ──────────────────────────────────────────────

export async function resolveEpicContext(qaTaskKey: string): Promise<EpicContext> {
  try {
    // 1. QA Task 조회 (parent + Epic Link 필드 포함)
    const qaIssue = await jiraClient.getIssueWithFields(qaTaskKey, [
      'parent', 'summary', 'customfield_10014', 'labels',
    ])
    const fields = qaIssue.fields as Record<string, unknown>

    // 2. Epic 키 추출 (Next-gen: parent.key / Classic: Epic Link customfield)
    let epicKey: string | null = null
    const parent = fields.parent as Record<string, unknown> | undefined
    if (parent?.key && typeof parent.key === 'string') {
      epicKey = parent.key
    } else if (typeof fields.customfield_10014 === 'string') {
      epicKey = fields.customfield_10014
    }

    if (!epicKey) {
      logger.debug({ qaTaskKey }, 'Epic 키를 찾을 수 없음 — 컨텍스트 없이 진행')
      return EMPTY_CONTEXT
    }

    // 3. Epic 상세 조회
    const epicIssue = await jiraClient.getIssue(epicKey)
    const epicSummary = epicIssue.fields.summary ?? ''
    const epicDescription = adfToPlainText(epicIssue.fields.description)

    // 4. Epic 하위 이슈 조회
    const children = await jiraClient.getEpicChildren(epicKey)

    if (children.length === 0) {
      logger.debug({ epicKey }, 'Epic 하위 이슈 없음')
      return { ...EMPTY_CONTEXT, epicKey, epicSummary, epicDescription }
    }

    // 5. [기획] prefix Task 찾기
    const planningTask = children.find((issue) => {
      const s = issue.fields.summary ?? ''
      return s.startsWith('[기획]') || s.startsWith('[Planning]') || s.startsWith('[기획/디자인]')
    })

    // 6. Epic Remote Links에서 Figma URL 추출 (기획 Task 유무와 무관하게 항상 확인)
    const figmaUrls: string[] = extractFigmaUrls(epicDescription)
    try {
      const epicRemoteLinks = await jiraClient.getRemoteLinks(epicKey)
      for (const link of epicRemoteLinks) {
        const url = link.object?.url ?? ''
        if (/figma\.com\/(file|design|proto)\//.test(url)) {
          figmaUrls.push(url)
        }
      }
    } catch (e) {
      logger.debug({ e, issueKey: epicKey }, 'Epic Remote links 조회 실패 (무시)')
    }

    if (!planningTask) {
      logger.debug({ epicKey, childKeys: children.map(c => c.key) }, '[기획] Task를 찾을 수 없음 — Epic 링크만 사용')
      const uniqueFigmaUrls = [...new Set(figmaUrls)]
      let figmaContent = ''
      if (env.FIGMA_API_TOKEN && uniqueFigmaUrls.length > 0) {
        const texts: string[] = []
        for (const url of uniqueFigmaUrls.slice(0, 3)) {
          const fileKey = extractFigmaFileKey(url)
          if (fileKey) {
            const text = await fetchFigmaText(fileKey)
            if (text) texts.push(text)
          }
        }
        figmaContent = texts.join('\n\n')
      }
      return { ...EMPTY_CONTEXT, epicKey, epicSummary, epicDescription, figmaUrls: uniqueFigmaUrls, figmaContent }
    }

    // 7. 기획 Task 상세 조회 (description 포함)
    const planningDetail = await jiraClient.getIssue(planningTask.key)
    const planningContent = adfToPlainText(planningDetail.fields.description)

    // 8. Figma URL 추출: 기획 Task description + Remote Links
    figmaUrls.push(...extractFigmaUrls(planningContent))
    try {
      const remoteLinks = await jiraClient.getRemoteLinks(planningTask.key)
      for (const link of remoteLinks) {
        const url = link.object?.url ?? ''
        if (/figma\.com\/(file|design|proto)\//.test(url)) {
          figmaUrls.push(url)
        }
      }
    } catch (e) {
      logger.debug({ e, issueKey: planningTask.key }, 'Remote links 조회 실패 (무시)')
    }

    const uniqueFigmaUrls = [...new Set(figmaUrls)]

    // 9. Figma API 텍스트 추출 (토큰 있을 때)
    let figmaContent = ''
    if (env.FIGMA_API_TOKEN && uniqueFigmaUrls.length > 0) {
      const texts: string[] = []
      for (const url of uniqueFigmaUrls.slice(0, 3)) { // 최대 3개
        const fileKey = extractFigmaFileKey(url)
        if (fileKey) {
          const text = await fetchFigmaText(fileKey)
          if (text) texts.push(text)
        }
      }
      figmaContent = texts.join('\n\n')
    }

    logger.info(
      { qaTaskKey, epicKey, planningTaskKey: planningTask.key, figmaUrlCount: uniqueFigmaUrls.length },
      'Epic 컨텍스트 조회 완료',
    )

    return {
      epicKey,
      epicSummary,
      epicDescription,
      planningTaskKey: planningTask.key,
      planningContent,
      figmaUrls: uniqueFigmaUrls,
      figmaContent,
    }
  } catch (e) {
    logger.warn({ e, qaTaskKey }, 'Epic 컨텍스트 조회 실패 (무시하고 계속)')
    return EMPTY_CONTEXT
  }
}
