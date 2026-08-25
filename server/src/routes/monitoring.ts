import { Hono } from 'hono'
import { db } from '../lib/db.js'
import { logger } from '../lib/logger.js'

export const monitoringRouter = new Hono()

// ── Playwright ──────────────────────────────────────────────────────────────

// POST /monitoring/playwright/runs — CI/CD 결과 업로드
monitoringRouter.post('/playwright/runs', async (c) => {
  try {
    const body = await c.req.json()
    const {
      run_id,
      project,
      branch,
      environment = 'staging',
      total_tests,
      passed,
      failed,
      skipped,
      duration_ms,
      started_at,
      test_results = [],
    } = body

    const run = await db.playwrightRun.create({
      data: {
        runId: run_id,
        project,
        branch,
        environment,
        totalTests: total_tests,
        passed,
        failed,
        skipped,
        durationMs: duration_ms,
        startedAt: new Date(started_at),
        testResults: {
          createMany: {
            data: test_results.map((r: any) => ({
              suiteName: r.suite_name,
              testName: r.test_name,
              status: r.status,
              durationMs: r.duration_ms,
              browser: r.browser ?? null,
              retries: r.retries ?? 0,
              errorMessage: r.error_message ?? null,
            })),
          },
        },
      },
    })

    return c.json({ success: true, data: { id: run.id } }, 201)
  } catch (e) {
    logger.error({ e }, 'Playwright run 업로드 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// GET /monitoring/playwright/runs
monitoringRouter.get('/playwright/runs', async (c) => {
  try {
    const project = c.req.query('project')
    const environment = c.req.query('environment')
    const limit = Number(c.req.query('limit') ?? 20)
    const offset = Number(c.req.query('offset') ?? 0)

    const where: any = {}
    if (project) where.project = project
    if (environment) where.environment = environment

    const [runs, total] = await Promise.all([
      db.playwrightRun.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          runId: true,
          project: true,
          branch: true,
          environment: true,
          totalTests: true,
          passed: true,
          failed: true,
          skipped: true,
          durationMs: true,
          startedAt: true,
          createdAt: true,
        },
      }),
      db.playwrightRun.count({ where }),
    ])

    const totalPassed = runs.reduce((s, r) => s + r.passed, 0)
    const totalAll = runs.reduce((s, r) => s + r.totalTests, 0)
    const avgDuration =
      runs.length > 0
        ? Math.round(runs.reduce((s, r) => s + r.durationMs, 0) / runs.length)
        : 0

    return c.json({
      runs,
      summary: {
        total_runs: total,
        pass_rate: totalAll > 0 ? Math.round((totalPassed / totalAll) * 10000) / 100 : 0,
        avg_duration: avgDuration,
      },
    })
  } catch (e) {
    logger.error({ e }, 'Playwright runs 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// GET /monitoring/playwright/runs/:runId
monitoringRouter.get('/playwright/runs/:runId', async (c) => {
  try {
    const runId = c.req.param('runId')
    const run = await db.playwrightRun.findUnique({
      where: { runId },
      include: { testResults: true },
    })
    if (!run) return c.json({ error: 'Not found' }, 404)
    return c.json(run)
  } catch (e) {
    logger.error({ e }, 'Playwright run 상세 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// GET /monitoring/playwright/stats
monitoringRouter.get('/playwright/stats', async (c) => {
  try {
    // 최근 30회 실행 pass rate 추이
    const recent = await db.playwrightRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 30,
      select: {
        runId: true,
        project: true,
        totalTests: true,
        passed: true,
        failed: true,
        startedAt: true,
        durationMs: true,
      },
    })

    const trend = recent.reverse().map((r) => ({
      run_id: r.runId,
      project: r.project,
      started_at: r.startedAt,
      pass_rate: r.totalTests > 0 ? Math.round((r.passed / r.totalTests) * 10000) / 100 : 0,
      passed: r.passed,
      failed: r.failed,
      total: r.totalTests,
      duration_ms: r.durationMs,
    }))

    // top 10 avg duration (groupBy suite + test)
    const topTestsRaw = await db.playwrightTestResult.groupBy({
      by: ['suiteName', 'testName'],
      _avg: { durationMs: true },
      _max: { durationMs: true },
      _min: { durationMs: true },
      orderBy: { _avg: { durationMs: 'desc' } },
      take: 10,
    })
    const topTests = topTestsRaw.map((t) => ({
      suite_name: t.suiteName,
      test_name: t.testName,
      avg_ms: Math.round(t._avg.durationMs ?? 0),
      max_ms: t._max.durationMs ?? 0,
      min_ms: t._min.durationMs ?? 0,
    }))

    // 브라우저별 pass rate
    const browserStats = await db.playwrightTestResult.groupBy({
      by: ['browser', 'status'],
      _count: { id: true },
    })

    const browserMap: Record<string, { passed: number; total: number }> = {}
    for (const row of browserStats) {
      const key = row.browser ?? 'unknown'
      if (!browserMap[key]) browserMap[key] = { passed: 0, total: 0 }
      browserMap[key].total += row._count.id
      if (row.status === 'passed') browserMap[key].passed += row._count.id
    }
    const browserPassRate = Object.entries(browserMap).map(([browser, v]) => ({
      browser,
      pass_rate: v.total > 0 ? Math.round((v.passed / v.total) * 10000) / 100 : 0,
      total: v.total,
    }))

    // 실패 테스트 목록 (최근 50개)
    const failedTests = await db.playwrightTestResult.findMany({
      where: { status: 'failed' },
      orderBy: { id: 'desc' },
      take: 50,
      select: {
        suiteName: true,
        testName: true,
        errorMessage: true,
        browser: true,
        durationMs: true,
        retries: true,
        run: { select: { runId: true, startedAt: true, project: true } },
      },
    })

    return c.json({ trend, top_tests: topTests, browser_pass_rate: browserPassRate, failed_tests: failedTests })
  } catch (e) {
    logger.error({ e }, 'Playwright stats 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ── K6 ──────────────────────────────────────────────────────────────────────

// POST /monitoring/k6/runs — CI/CD 결과 업로드
monitoringRouter.post('/k6/runs', async (c) => {
  try {
    const body = await c.req.json()
    const {
      run_id,
      scenario,
      environment = 'staging',
      virtual_users,
      duration_seconds,
      started_at,
      metrics,
      timeseries = [],
    } = body

    const run = await db.k6Run.create({
      data: {
        runId: run_id,
        scenario,
        environment,
        virtualUsers: virtual_users,
        durationSeconds: duration_seconds,
        startedAt: new Date(started_at),
        ...(metrics && {
          metrics: {
            create: {
              totalRequests: metrics.total_requests,
              failedRequests: metrics.failed_requests,
              errorRate: metrics.error_rate,
              avgResponseMs: metrics.avg_response_ms,
              p95ResponseMs: metrics.p95_response_ms,
              p99ResponseMs: metrics.p99_response_ms,
              lcp: metrics.lcp ?? null,
              fcp: metrics.fcp ?? null,
              ttfb: metrics.ttfb ?? null,
              cls: metrics.cls ?? null,
              fid: metrics.fid ?? null,
              inp: metrics.inp ?? null,
            },
          },
        }),
        ...(timeseries.length > 0 && {
          timeseries: {
            createMany: {
              data: timeseries.map((t: any) => ({
                timestamp: new Date(t.timestamp),
                requestRate: t.request_rate,
                responseMs: t.response_ms,
                errorRate: t.error_rate,
                activeVus: t.active_vus,
              })),
            },
          },
        }),
      },
    })

    return c.json({ success: true, data: { id: run.id } }, 201)
  } catch (e) {
    logger.error({ e }, 'K6 run 업로드 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// GET /monitoring/k6/runs
monitoringRouter.get('/k6/runs', async (c) => {
  try {
    const scenario = c.req.query('scenario')
    const environment = c.req.query('environment')
    const limit = Number(c.req.query('limit') ?? 20)
    const offset = Number(c.req.query('offset') ?? 0)

    const where: any = {}
    if (scenario) where.scenario = scenario
    if (environment) where.environment = environment

    const [runs, total] = await Promise.all([
      db.k6Run.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        take: limit,
        skip: offset,
        include: { metrics: true },
      }),
      db.k6Run.count({ where }),
    ])

    return c.json({ runs, total })
  } catch (e) {
    logger.error({ e }, 'K6 runs 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// GET /monitoring/k6/runs/:runId
monitoringRouter.get('/k6/runs/:runId', async (c) => {
  try {
    const runId = c.req.param('runId')
    const run = await db.k6Run.findUnique({
      where: { runId },
      include: { metrics: true, timeseries: { orderBy: { timestamp: 'asc' } } },
    })
    if (!run) return c.json({ error: 'Not found' }, 404)
    return c.json(run)
  } catch (e) {
    logger.error({ e }, 'K6 run 상세 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// GET /monitoring/k6/stats
monitoringRouter.get('/k6/stats', async (c) => {
  try {
    // 최근 30회 metrics 추이
    const recent = await db.k6Run.findMany({
      orderBy: { startedAt: 'desc' },
      take: 30,
      include: { metrics: true },
    })

    const trend = recent.reverse().map((r) => ({
      run_id: r.runId,
      scenario: r.scenario,
      started_at: r.startedAt,
      virtual_users: r.virtualUsers,
      avg_response_ms: r.metrics?.avgResponseMs ?? null,
      p95_response_ms: r.metrics?.p95ResponseMs ?? null,
      error_rate: r.metrics?.errorRate ?? null,
      total_requests: r.metrics?.totalRequests ?? null,
      lcp:  r.metrics?.lcp  ?? null,
      fcp:  r.metrics?.fcp  ?? null,
      ttfb: r.metrics?.ttfb ?? null,
      cls:  r.metrics?.cls  ?? null,
      fid:  r.metrics?.fid  ?? null,
      inp:  r.metrics?.inp  ?? null,
    }))

    // 최근 실행 web vitals
    const latestRun = recent[recent.length - 1]
    const webVitals = latestRun?.metrics
      ? {
          lcp: latestRun.metrics.lcp,
          fcp: latestRun.metrics.fcp,
          ttfb: latestRun.metrics.ttfb,
          cls: latestRun.metrics.cls,
          fid: latestRun.metrics.fid,
          inp: latestRun.metrics.inp,
        }
      : null

    return c.json({ trend, web_vitals: webVitals })
  } catch (e) {
    logger.error({ e }, 'K6 stats 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// GET /monitoring/k6/timeseries — 최근 runs의 timeseries 합산
monitoringRouter.get('/k6/timeseries', async (c) => {
  try {
    const limit = Number(c.req.query('runs') ?? 5)
    const runs = await db.k6Run.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: { timeseries: { orderBy: { timestamp: 'asc' } } },
    })
    const series = runs
      .flatMap((r) =>
        r.timeseries.map((t) => ({
          timestamp: t.timestamp,
          request_rate: t.requestRate,
          response_ms: t.responseMs,
          error_rate: t.errorRate,
          active_vus: t.activeVus,
          data_sent_bytes: t.dataSentBytes,
          data_received_bytes: t.dataReceivedBytes,
          scenario: r.scenario,
        }))
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    return c.json(series)
  } catch (e) {
    logger.error({ e }, 'K6 timeseries 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})
