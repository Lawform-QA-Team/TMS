import { db } from '../src/lib/db.js'

const PROJECTS = ['backoffice', 'real-service']
const BROWSERS = ['chromium', 'firefox', 'webkit']
const ENVIRONMENTS = ['staging', 'production']
const BRANCHES = ['main', 'develop', 'feat/login-refactor', 'fix/chart-render']
const K6_SCENARIOS = ['load-test', 'stress-test', 'soak-test', 'spike-test']

const SUITE_TESTS: Record<string, string[]> = {
  'Auth / Login': ['로그인 성공', '잘못된 비밀번호 거부', '세션 만료 처리', 'SSO 로그인'],
  'Dashboard': ['대시보드 차트 렌더링', '프로젝트 통계 로드', '필터 적용', '날짜 범위 선택'],
  'TestCase / Create': ['테스트케이스 생성', '필수 필드 검증', '파일 첨부', '중복 제목 방지'],
  'TestCase / Execute': ['실행 결과 저장', '스크린샷 업로드', '상태 업데이트', '히스토리 조회'],
  'Pipeline': ['파이프라인 생성', 'Jira 연동 확인', 'Slack 알림 발송', '결과 리포트 생성'],
  'Settings': ['사용자 프로필 수정', '알림 설정 토글', 'API 키 생성', '권한 변경'],
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function randFloat(min: number, max: number, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}
function randItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(rand(0, 23), rand(0, 59), 0, 0)
  return d
}
function uuid() {
  return Math.random().toString(36).slice(2, 10) + '-' + Math.random().toString(36).slice(2, 10)
}

async function seedPlaywright() {
  console.log('Playwright 데이터 삽입 중...')

  for (let i = 29; i >= 0; i--) {
    const project = i % 3 === 0 ? 'real-service' : 'backoffice'
    const env = i < 5 ? 'production' : 'staging'

    // 최근으로 올수록 pass rate 개선 추세 (70% → 95%)
    const basePassRate = 0.70 + (29 - i) * 0.009
    const suiteEntries = Object.entries(SUITE_TESTS)
    const totalTests = suiteEntries.reduce((s, [, tests]) => s + tests.length, 0)

    const testResults: Array<{
      suiteName: string
      testName: string
      status: string
      durationMs: number
      browser: string | null
      retries: number
      errorMessage: string | null
    }> = []

    for (const [suite, tests] of suiteEntries) {
      for (const testName of tests) {
        const passed = Math.random() < basePassRate
        const isSlow = Math.random() < 0.1
        testResults.push({
          suiteName: suite,
          testName,
          status: passed ? 'passed' : Math.random() < 0.3 ? 'skipped' : 'failed',
          durationMs: isSlow ? rand(5000, 15000) : rand(200, 3000),
          browser: randItem([...BROWSERS, null]),
          retries: passed ? 0 : rand(0, 2),
          errorMessage: passed
            ? null
            : randItem([
                'Timeout 30000ms exceeded.',
                'locator.click: Target closed.',
                'expect(received).toBe(expected) — 404 received',
                'Navigation failed: net::ERR_CONNECTION_REFUSED',
                'Element not found: [data-testid="submit-btn"]',
              ]),
        })
      }
    }

    const passed = testResults.filter(t => t.status === 'passed').length
    const failed = testResults.filter(t => t.status === 'failed').length
    const skipped = testResults.filter(t => t.status === 'skipped').length

    await db.playwrightRun.create({
      data: {
        runId: uuid(),
        project,
        branch: randItem(BRANCHES),
        environment: env,
        totalTests: totalTests,
        passed,
        failed,
        skipped,
        durationMs: rand(30000, 120000),
        startedAt: daysAgo(i),
        testResults: { createMany: { data: testResults } },
      },
    })
  }

  console.log('  ✓ PlaywrightRuns 30개 삽입 완료')
}

async function seedK6() {
  console.log('K6 데이터 삽입 중...')

  for (let i = 19; i >= 0; i--) {
    const scenario = randItem(K6_SCENARIOS)
    const env = i < 3 ? 'production' : 'staging'

    // 최근으로 올수록 응답시간 개선 추세
    const improvement = (19 - i) * 5
    const avgResponse = Math.max(80, rand(200, 500) - improvement)
    const p95Response = Math.max(150, rand(400, 1200) - improvement)
    const p99Response = Math.max(200, rand(800, 2000) - improvement)
    const totalRequests = rand(8000, 25000)
    const errorRate = Math.max(0, randFloat(0, 0.05) - (19 - i) * 0.001)
    const failedRequests = Math.round(totalRequests * errorRate)
    const vus = randItem([10, 25, 50, 100, 200])

    await db.k6Run.create({
      data: {
        runId: uuid(),
        scenario,
        environment: env,
        virtualUsers: vus,
        durationSeconds: randItem([60, 120, 300, 600]),
        startedAt: daysAgo(i),
        metrics: {
          create: {
            totalRequests,
            failedRequests,
            errorRate,
            avgResponseMs: avgResponse,
            p95ResponseMs: p95Response,
            p99ResponseMs: p99Response,
            lcp: randFloat(800, 4000),
            fcp: randFloat(400, 2500),
            ttfb: randFloat(100, 1500),
            cls: randFloat(0, 0.3, 3),
            fid: randFloat(10, 400),
            inp: randFloat(50, 600),
          },
        },
        timeseries: {
          createMany: {
            data: Array.from({ length: 12 }, (_, t) => {
              const ts = new Date(daysAgo(i))
              ts.setMinutes(ts.getMinutes() + t * 5)
              const reqRate = randFloat(20, 120)
              return {
                timestamp: ts,
                requestRate: reqRate,
                responseMs: avgResponse + rand(-50, 100),
                errorRate: Math.max(0, errorRate + randFloat(-0.01, 0.01)),
                activeVus: vus,
                dataSentBytes: reqRate * rand(800, 2000),
                dataReceivedBytes: reqRate * rand(5000, 20000),
              }
            }),
          },
        },
      },
    })
  }

  console.log('  ✓ K6Runs 20개 (metrics + timeseries) 삽입 완료')
}

async function main() {
  try {
    // 기존 데이터 초기화
    console.log('기존 mock 데이터 정리 중...')
    await db.k6Timeseries.deleteMany()
    await db.k6Metrics.deleteMany()
    await db.k6Run.deleteMany()
    await db.playwrightTestResult.deleteMany()
    await db.playwrightRun.deleteMany()

    await seedPlaywright()
    await seedK6()

    console.log('\n모든 mock 데이터 삽입 완료!')
  } finally {
    await db.$disconnect()
  }
}

main().catch(e => { console.error(e); process.exit(1) })
