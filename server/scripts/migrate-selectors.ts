/**
 * selectors/*.js → SelectorRegistry DB 마이그레이션
 *
 * 파일 구조:
 *   export const PAGE = { SECTION: { BUTTON_NAME: '[data-tid="xxx"]' } }
 *
 * 파싱 결과:
 *   pageName = 파일명 (예: advice)
 *   elementName = "SECTION.BUTTON_NAME"
 *   dataTid = "xxx"
 *   selector = '[data-tid="xxx"]'
 *   elementType = BUTTON_NAME의 앞 부분 (BUTTON → button, INPUT → input, ...)
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { db } from '../src/lib/db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const SELECTORS_DIR = path.resolve(
  __dirname,
  '../../../test-scripts/playwright/lawform/selectors'
)
const PROJECT_KEY = 'LAWFORM'

const TYPE_MAP: Record<string, string> = {
  BUTTON: 'button',
  INPUT: 'input',
  A: 'link',
  LINK: 'link',
  SELECT: 'select',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  IMG: 'image',
  IMAGE: 'image',
  DIV: 'container',
  SPAN: 'text',
  TEXT: 'text',
}

function resolveElementType(key: string): string {
  const prefix = key.split('_')[0]
  return TYPE_MAP[prefix] ?? 'etc'
}

function parseFile(filePath: string, pageName: string) {
  const src = fs.readFileSync(filePath, 'utf-8')
  const results: Array<{
    pageName: string
    elementName: string
    dataTid: string
    selector: string
    elementType: string
    projectKey: string
  }> = []

  // '[data-tid="xxx"]' 패턴으로 전체 매칭
  // KEY: '[data-tid="xxx"]' 형태를 찾아 KEY와 dataTid 추출
  const lineRe = /(\w+):\s*'\[data-tid="([^"]+)"\]'/g
  // section 블록 파싱: SECTION_NAME: { ... } 구조 내에서 key 추출
  // 간단하게: 각 줄에서 key와 selector를 추출하고, 현재 section을 추적
  const lines = src.split('\n')
  const sections: string[] = []
  let currentSection = ''

  for (const line of lines) {
    const trimmed = line.trim()

    // section 시작: 대문자로만 이루어진 식별자 + ': {' 패턴
    const sectionMatch = trimmed.match(/^([A-Z][A-Z0-9_]*):\s*\{/)
    if (sectionMatch) {
      currentSection = sectionMatch[1]
      sections.push(currentSection)
      continue
    }

    // 닫는 중괄호: section 종료
    if (trimmed === '},' || trimmed === '}') {
      sections.pop()
      currentSection = sections[sections.length - 1] ?? ''
      continue
    }

    // selector 라인: KEY: '[data-tid="xxx"]'
    const selMatch = trimmed.match(/^([A-Z][A-Z0-9_]*):\s*'\[data-tid="([^"]+)"\]'/)
    if (selMatch && currentSection) {
      const key = selMatch[1]
      const tid = selMatch[2]
      results.push({
        pageName,
        elementName: `${currentSection}.${key}`,
        dataTid: tid,
        selector: `[data-tid="${tid}"]`,
        elementType: resolveElementType(key),
        projectKey: PROJECT_KEY,
      })
    }
  }

  return results
}

async function main() {
  const existing = await db.selectorRegistry.count()
  if (existing > 0) {
    console.log(`이미 ${existing}개의 selector가 존재합니다. 종료합니다.`)
    console.log('재실행하려면: mysql -u root -p test_management -e "TRUNCATE SelectorRegistry;"')
    return
  }

  const files = fs.readdirSync(SELECTORS_DIR).filter(
    (f) => f.endsWith('.js') && f !== 'index.js'
  )

  let totalInserted = 0

  for (const file of files) {
    const pageName = path.basename(file, '.js')
    const filePath = path.join(SELECTORS_DIR, file)
    const records = parseFile(filePath, pageName)

    if (records.length === 0) {
      console.log(`  [SKIP] ${file} — selector 없음`)
      continue
    }

    // createMany로 배치 삽입
    await db.selectorRegistry.createMany({ data: records })
    console.log(`  [OK] ${file} → ${records.length}개`)
    totalInserted += records.length
  }

  console.log(`\n완료: 총 ${totalInserted}개 selector 삽입`)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
