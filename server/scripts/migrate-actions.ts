/**
 * actions/**\/*.js → ActionRegistry DB 마이그레이션
 *
 * 파일 구조:
 *   /** JSDoc *\/
 *   export async function functionName(page, ...) { ... }
 *
 * 파싱 결과:
 *   name = 함수명
 *   description = JSDoc 첫 번째 줄 (/** ... *\/ 블록)
 *   category = 디렉토리명 (advice, clm, common, ...)
 *   code = 함수 전체 코드
 *   parameters = page 이후 파라미터 목록
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { db } from '../src/lib/db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const ACTIONS_DIR = path.resolve(
  __dirname,
  '../../../test-scripts/playwright/lawform/actions'
)
const PROJECT_KEY = 'LAWFORM'

interface ParsedAction {
  name: string
  description: string | null
  category: string
  code: string
  parameters: { name: string; type: string }[]
  projectKey: string
}

function extractJsDocDescription(src: string, fnStart: number): string | null {
  // fnStart 이전에서 가장 가까운 /** ... */ 블록 찾기
  const before = src.slice(0, fnStart)
  const lastDoc = before.lastIndexOf('/**')
  if (lastDoc === -1) return null
  const docEnd = before.indexOf('*/', lastDoc)
  if (docEnd === -1) return null
  const docBlock = before.slice(lastDoc + 3, docEnd)
  // 각 줄에서 * 제거 후 첫 번째 유효한 줄 반환
  const lines = docBlock
    .split('\n')
    .map((l) => l.replace(/^\s*\*\s?/, '').trim())
    .filter((l) => l && !l.startsWith('@'))
  return lines[0] ?? null
}

function extractFunctionCode(src: string, fnStart: number): string {
  // export async function fnName(...) { ... } 블록 전체 추출
  let depth = 0
  let started = false
  let end = fnStart

  for (let i = fnStart; i < src.length; i++) {
    if (src[i] === '{') {
      depth++
      started = true
    } else if (src[i] === '}') {
      depth--
      if (started && depth === 0) {
        end = i + 1
        break
      }
    }
  }

  return src.slice(fnStart, end).trim()
}

function parseParams(signature: string): { name: string; type: string }[] {
  // (page, param1, param2 = {}) → [param1, param2]
  const inner = signature.match(/\(([^)]*)\)/)?.[1] ?? ''
  return inner
    .split(',')
    .map((p) => p.trim().replace(/\s*=.*$/, ''))
    .filter((p) => p && p !== 'page')
    .map((p) => ({ name: p, type: 'string' }))
}

function parseFile(filePath: string, category: string): ParsedAction[] {
  const src = fs.readFileSync(filePath, 'utf-8')
  const results: ParsedAction[] = []

  // export async function 또는 export function 패턴
  const re = /export\s+(?:async\s+)?function\s+(\w+)\s*(\([^)]*\))/g
  let match: RegExpExecArray | null

  while ((match = re.exec(src)) !== null) {
    const name = match[1]
    const signature = match[2]
    const fnStart = match.index

    const description = extractJsDocDescription(src, fnStart)
    const code = extractFunctionCode(src, fnStart)
    const parameters = parseParams(signature)

    results.push({ name, description, category, code, parameters, projectKey: PROJECT_KEY })
  }

  return results
}

async function main() {
  const existing = await db.actionRegistry.count()
  if (existing > 0) {
    console.log(`이미 ${existing}개의 action이 존재합니다. 종료합니다.`)
    console.log('재실행하려면: mysql -u root -p test_management -e "TRUNCATE ActionRegistry;"')
    return
  }

  const files = fs.readdirSync(ACTIONS_DIR, { recursive: true, withFileTypes: true })
    .filter((f) => f.isFile() && f.name.endsWith('.js'))

  let totalInserted = 0

  for (const file of files) {
    const filePath = path.join(file.parentPath ?? (file as any).path, file.name)
    // category = 상위 디렉토리명 (advice, clm, common, ...)
    const category = path.relative(ACTIONS_DIR, path.dirname(filePath))

    const actions = parseFile(filePath, category)
    if (actions.length === 0) {
      console.log(`  [SKIP] ${file.name} — action 없음`)
      continue
    }

    for (const action of actions) {
      await db.actionRegistry.create({
        data: {
          name: action.name,
          description: action.description,
          category: action.category,
          code: action.code,
          parameters: JSON.stringify(action.parameters),
          selectorIds: null,
          projectKey: action.projectKey,
        },
      })
    }

    console.log(`  [OK] ${category}/${file.name} → ${actions.length}개`)
    totalInserted += actions.length
  }

  console.log(`\n완료: 총 ${totalInserted}개 action 삽입`)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
