import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdtemp, writeFile, rm, writeFile as fsWriteFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { db } from './db.js'
import { env } from '../env.js'
import { logger } from './logger.js'

const execFileAsync = promisify(execFile)

interface TestResult {
  title: string
  status: 'passed' | 'failed' | 'skipped' | 'pending'
  durationMs: number
  error?: string | undefined
}

interface PlaywrightJsonReport {
  stats: {
    expected: number
    unexpected: number
    skipped: number
    flaky: number
    duration: number
  }
  suites: Array<{
    title: string
    specs: Array<{
      title: string
      ok: boolean
      tests: Array<{
        status: string
        duration: number
        results: Array<{ error?: { message?: string } }>
      }>
    }>
  }>
}

/** 생성된 코드에서 test('...') 제목 파싱 */
function parseTestTitles(code: string): string[] {
  const titles: string[] = []
  const re = /test\(\s*['"`]([^'"`]+)['"`]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(code)) !== null) {
    if (m[1]) titles.push(m[1])
  }
  return titles
}

/** 시뮬레이션 모드: 코드 파싱 → 전원 pending 결과 */
async function simulateRun(pipelineId: string): Promise<{
  status: string
  totalTests: number
  passed: number
  failed: number
  skipped: number
  durationMs: number
  results: TestResult[]
}> {
  const generated = await db.generatedCode.findUnique({ where: { pipelineId } })
  if (!generated) throw new Error(`GeneratedCode 없음: ${pipelineId}`)

  const titles = parseTestTitles(generated.code)
  logger.info({ pipelineId, count: titles.length }, '시뮬레이션 모드 — 코드에서 테스트 파싱')

  const results: TestResult[] = titles.map((title) => ({
    title,
    status: 'pending' as const,
    durationMs: 0,
  }))

  return {
    status: 'simulation',
    totalTests: titles.length,
    passed: 0,
    failed: 0,
    skipped: titles.length,
    durationMs: 0,
    results,
  }
}

/** 실제 Playwright 실행 */
async function actualRun(pipelineId: string): Promise<{
  status: string
  totalTests: number
  passed: number
  failed: number
  skipped: number
  durationMs: number
  results: TestResult[]
  errorMessage?: string
}> {
  const generated = await db.generatedCode.findUnique({ where: { pipelineId } })
  if (!generated) throw new Error(`GeneratedCode 없음: ${pipelineId}`)

  const baseUrl = env.TEST_APP_BASE_URL ?? 'http://localhost:3017'
  const tmpDir = await mkdtemp(join(tmpdir(), 'tms-testrun-'))

  try {
    // spec 파일 저장
    const specPath = join(tmpDir, generated.fileName ?? 'test.spec.ts')
    const reportPath = join(tmpDir, 'report.json')
    await writeFile(specPath, generated.code, 'utf-8')

    // playwright.config.ts 생성
    const configPath = join(tmpDir, 'playwright.config.ts')
    await fsWriteFile(configPath, `
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '${tmpDir}',
  timeout: 30000,
  use: { baseURL: '${baseUrl}', headless: true },
  reporter: [['json', { outputFile: '${reportPath}' }]],
});
`, 'utf-8')

    const startedAt = Date.now()
    let exitCode = 0
    let stdout = ''
    let stderr = ''

    try {
      const result = await execFileAsync('npx', [
        'playwright', 'test',
        '--config', configPath,
        '--reporter', 'json',
      ], {
        cwd: tmpDir,
        timeout: 120_000,
        env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: join(tmpDir, 'report.json') },
      })
      stdout = result.stdout
      stderr = result.stderr
    } catch (e: unknown) {
      const err = e as { code?: number; stdout?: string; stderr?: string }
      exitCode = err.code ?? 1
      stdout = err.stdout ?? ''
      stderr = err.stderr ?? ''
    }

    const durationMs = Date.now() - startedAt

    // report.json 파싱 시도
    try {
      const reportRaw = await import('node:fs').then((fs) =>
        fs.readFileSync(reportPath, 'utf-8')
      )
      const report = JSON.parse(reportRaw) as PlaywrightJsonReport
      const stats = report.stats ?? {}

      const results: TestResult[] = []
      for (const suite of report.suites ?? []) {
        for (const spec of suite.specs ?? []) {
          const testEntry = spec.tests?.[0]
          const result: TestResult = {
            title: spec.title,
            status: spec.ok ? 'passed' : 'failed',
            durationMs: testEntry?.duration ?? 0,
          }
          const errMsg = testEntry?.results?.[0]?.error?.message
          if (errMsg) result.error = errMsg.slice(0, 300)
          results.push(result)
        }
      }

      return {
        status: exitCode === 0 ? 'passed' : 'failed',
        totalTests: (stats.expected ?? 0) + (stats.unexpected ?? 0) + (stats.skipped ?? 0),
        passed: stats.expected ?? 0,
        failed: stats.unexpected ?? 0,
        skipped: stats.skipped ?? 0,
        durationMs: stats.duration ?? durationMs,
        results,
      }
    } catch {
      // report.json 없으면 exit code로 판단
      const titles = parseTestTitles(generated.code)
      return {
        status: exitCode === 0 ? 'passed' : 'failed',
        totalTests: titles.length,
        passed: exitCode === 0 ? titles.length : 0,
        failed: exitCode !== 0 ? titles.length : 0,
        skipped: 0,
        durationMs,
        results: titles.map((title): TestResult => ({
          title,
          status: exitCode === 0 ? 'passed' : 'failed',
          durationMs: 0,
          ...(exitCode !== 0 && { error: stderr.slice(0, 200) || 'Playwright 실행 실패' }),
        })),
        errorMessage: stderr.slice(0, 500),
      }
    }
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
}

export async function runTests(
  pipelineId: string,
): Promise<{ status: string; totalTests: number; passed: number; failed: number }> {
  const startedAt = new Date()

  // pending 상태로 먼저 DB 생성 (upsert)
  await db.testRunResult.upsert({
    where: { pipelineId },
    create: { pipelineId, status: 'running', startedAt },
    update: { status: 'running', startedAt, updatedAt: new Date() },
  })

  let runData: {
    status: string
    totalTests: number
    passed: number
    failed: number
    skipped: number
    durationMs: number
    results: TestResult[]
    errorMessage?: string
  }

  if (env.PLAYWRIGHT_ENABLED) {
    logger.info({ pipelineId }, 'Playwright 실제 실행 모드')
    runData = await actualRun(pipelineId)
  } else {
    logger.info({ pipelineId }, 'Playwright 시뮬레이션 모드 (PLAYWRIGHT_ENABLED=false)')
    runData = await simulateRun(pipelineId)
  }

  const completedAt = new Date()

  await db.testRunResult.update({
    where: { pipelineId },
    data: {
      status: runData.status,
      totalTests: runData.totalTests,
      passed: runData.passed,
      failed: runData.failed,
      skipped: runData.skipped,
      durationMs: runData.durationMs,
      results: JSON.stringify(runData.results),
      errorMessage: runData.errorMessage ?? null,
      completedAt,
      updatedAt: new Date(),
    },
  })

  // pipelineStatus 업데이트
  await db.collectedTicket.update({
    where: { pipelineId },
    data: { pipelineStatus: 'testrun', updatedAt: new Date() },
  })

  logger.info({ pipelineId, ...runData }, '테스트 실행 완료')
  return { status: runData.status, totalTests: runData.totalTests, passed: runData.passed, failed: runData.failed }
}
