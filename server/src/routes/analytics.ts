import { Hono } from 'hono'
import { db } from '../lib/db.js'
import { logger } from '../lib/logger.js'

export const analyticsRouter = new Hono()

// ──────────────────────────────────────────────
// GET /analytics/trends
// ──────────────────────────────────────────────
analyticsRouter.get('/trends', async (c) => {
  try {
    const days = Number(c.req.query('days') ?? 30)
    const environment = c.req.query('environment') ?? null
    const testCaseId = c.req.query('test_case_id') ? Number(c.req.query('test_case_id')) : null

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const where: Record<string, unknown> = { executedAt: { gte: startDate } }
    if (environment) where.environment = environment
    if (testCaseId) where.testCaseId = testCaseId

    const results = await db.testResult.findMany({
      where,
      select: { result: true, executedAt: true },
      orderBy: { executedAt: 'asc' },
    })

    // 날짜별 집계
    const trendMap = new Map<string, { date: string; passed: number; failed: number; total: number }>()
    for (const r of results) {
      const dateStr = r.executedAt.toISOString().slice(0, 10)
      if (!trendMap.has(dateStr)) {
        trendMap.set(dateStr, { date: dateStr, passed: 0, failed: 0, total: 0 })
      }
      const entry = trendMap.get(dateStr)!
      entry.total++
      if (r.result === 'Pass') entry.passed++
      else if (r.result === 'Fail') entry.failed++
    }

    const trends = Array.from(trendMap.values()).map((t) => ({
      ...t,
      pass_rate: t.total > 0 ? Math.round((t.passed / t.total) * 10000) / 100 : 0,
      failure_rate: t.total > 0 ? Math.round((t.failed / t.total) * 10000) / 100 : 0,
    }))

    const totalPassed = trends.reduce((s, t) => s + t.passed, 0)
    const totalFailed = trends.reduce((s, t) => s + t.failed, 0)
    const totalTests = trends.reduce((s, t) => s + t.total, 0)

    return c.json({
      period: { start_date: startDate.toISOString(), end_date: new Date().toISOString(), days },
      trends,
      summary: {
        total_tests: totalTests,
        total_passed: totalPassed,
        total_failed: totalFailed,
        overall_pass_rate: totalTests > 0 ? Math.round((totalPassed / totalTests) * 10000) / 100 : 0,
        overall_failure_rate: totalTests > 0 ? Math.round((totalFailed / totalTests) * 10000) / 100 : 0,
      },
      filters: { environment, test_case_id: testCaseId },
    })
  } catch (e) {
    logger.error({ e }, '트렌드 분석 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /analytics/flaky-tests
// ──────────────────────────────────────────────
analyticsRouter.get('/flaky-tests', async (c) => {
  try {
    const minExecutions = Number(c.req.query('min_executions') ?? 5)
    const days = Number(c.req.query('days') ?? 30)
    const flakinessThreshold = Number(c.req.query('flakiness_threshold') ?? 0.1)

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // 테스트 케이스별 실행 결과 집계
    const rawResults = await db.testResult.findMany({
      where: { executedAt: { gte: startDate }, testCaseId: { not: null } },
      select: { testCaseId: true, result: true, executedAt: true },
      orderBy: { executedAt: 'desc' },
    })

    // testCaseId별 그룹화
    const statsMap = new Map<number, { results: { result: string | null; executedAt: Date }[] }>()
    for (const r of rawResults) {
      if (!r.testCaseId) continue
      if (!statsMap.has(r.testCaseId)) statsMap.set(r.testCaseId, { results: [] })
      statsMap.get(r.testCaseId)!.results.push({ result: r.result, executedAt: r.executedAt })
    }

    // 테스트 케이스 이름 조회
    const tcIds = Array.from(statsMap.keys())
    const testCases = tcIds.length > 0
      ? await db.testCase.findMany({ where: { id: { in: tcIds } }, select: { id: true, name: true } })
      : []
    const tcNameMap = new Map(testCases.map((t) => [t.id, t.name]))

    const flakyTests: unknown[] = []
    for (const [tcId, { results }] of statsMap) {
      if (results.length < minExecutions) continue

      const passed = results.filter((r) => r.result === 'Pass').length
      const failed = results.filter((r) => r.result === 'Fail').length
      const total = results.length

      if (passed > 0 && failed > 0) {
        const passRate = passed / total
        const failureRate = failed / total
        const flakinessScore = Math.min(passRate, failureRate)

        if (flakinessScore >= flakinessThreshold) {
          // 패턴 변화 감지
          let patternChanges = 0
          let prevResult: string | null = null
          for (const r of [...results].reverse()) {
            if (prevResult && r.result !== prevResult) patternChanges++
            prevResult = r.result
          }

          flakyTests.push({
            test_case_id: tcId,
            test_case_name: tcNameMap.get(tcId) ?? 'Unknown',
            total_executions: total,
            passed,
            failed,
            pass_rate: Math.round(passRate * 10000) / 100,
            failure_rate: Math.round(failureRate * 10000) / 100,
            flakiness_score: Math.round(flakinessScore * 10000) / 100,
            pattern_changes: patternChanges,
            first_execution: results[results.length - 1]?.executedAt.toISOString() ?? null,
            last_execution: results[0]?.executedAt.toISOString() ?? null,
            recent_results: results.slice(0, 10).map((r) => r.result),
          })
        }
      }
    }

    ;(flakyTests as Array<{ flakiness_score: number }>).sort((a, b) => b.flakiness_score - a.flakiness_score)

    return c.json({
      period: { start_date: startDate.toISOString(), end_date: new Date().toISOString(), days },
      criteria: { min_executions: minExecutions, flakiness_threshold: flakinessThreshold },
      flaky_tests: flakyTests,
      total_flaky_tests: flakyTests.length,
    })
  } catch (e) {
    logger.error({ e }, 'Flaky 테스트 감지 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /analytics/regression-detection
// ──────────────────────────────────────────────
analyticsRouter.get('/regression-detection', async (c) => {
  try {
    const days = Number(c.req.query('days') ?? 7)
    const minPreviousPasses = Number(c.req.query('min_previous_passes') ?? 3)

    const now = new Date()
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    const previousStartDate = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000)

    // 최근 실패
    const recentFailures = await db.testResult.groupBy({
      by: ['testCaseId'],
      _count: { id: true },
      where: { executedAt: { gte: startDate }, result: 'Fail', testCaseId: { not: null } },
    })
    const recentFailMap = new Map(recentFailures.map((r) => [r.testCaseId!, r._count.id]))

    // 이전 기간 성공
    const prevPasses = await db.testResult.groupBy({
      by: ['testCaseId'],
      _count: { id: true },
      where: { executedAt: { gte: previousStartDate, lt: startDate }, result: 'Pass', testCaseId: { not: null } },
      having: { id: { _count: { gte: minPreviousPasses } } },
    })
    const prevPassMap = new Map(prevPasses.map((r) => [r.testCaseId!, r._count.id]))

    // 교집합: 이전에 통과했지만 최근에 실패한 케이스
    const regressionTcIds = [...recentFailMap.keys()].filter((id) => prevPassMap.has(id))

    const regressionList = await Promise.all(
      regressionTcIds.map(async (tcId) => {
        const tc = await db.testCase.findUnique({ where: { id: tcId }, select: { id: true, name: true, environment: true } })
        const failDetails = await db.testResult.findMany({
          where: { testCaseId: tcId, executedAt: { gte: startDate }, result: 'Fail' },
          orderBy: { executedAt: 'desc' },
          take: 5,
          select: { executedAt: true, errorMessage: true, notes: true },
        })

        return {
          test_case_id: tcId,
          test_case_name: tc?.name ?? 'Unknown',
          environment: tc?.environment ?? null,
          recent_failures: recentFailMap.get(tcId),
          previous_passes: prevPassMap.get(tcId),
          first_failure_date: failDetails[0]?.executedAt.toISOString() ?? null,
          failure_details: failDetails.map((fd) => ({
            executed_at: fd.executedAt.toISOString(),
            error_message: fd.errorMessage,
            notes: fd.notes ? fd.notes.slice(0, 200) : null,
          })),
        }
      }),
    )

    return c.json({
      period: { start_date: startDate.toISOString(), end_date: now.toISOString(), days },
      criteria: { min_previous_passes: minPreviousPasses },
      regressions: regressionList,
      total_regressions: regressionList.length,
    })
  } catch (e) {
    logger.error({ e }, '회귀 테스트 감지 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /analytics/coverage
// ──────────────────────────────────────────────
analyticsRouter.get('/coverage', async (c) => {
  try {
    const environment = c.req.query('environment') ?? null
    const folderId = c.req.query('folder_id') ? Number(c.req.query('folder_id')) : null

    const where: Record<string, unknown> = {}
    if (environment) where.environment = environment
    if (folderId) where.folderId = folderId

    const testCases = await db.testCase.findMany({
      where,
      select: {
        id: true,
        mainCategory: true,
        testResults: { select: { id: true, executedAt: true }, orderBy: { executedAt: 'desc' }, take: 1 },
      },
    })

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const totalTests = testCases.length
    const executedTests = testCases.filter((tc) => tc.testResults.length > 0).length
    const neverExecuted = totalTests - executedTests

    // 카테고리별 커버리지
    const categoryMap = new Map<string, { total: number; executed: number; never_executed: number }>()
    for (const tc of testCases) {
      const cat = tc.mainCategory ?? 'Uncategorized'
      if (!categoryMap.has(cat)) categoryMap.set(cat, { total: 0, executed: 0, never_executed: 0 })
      const stat = categoryMap.get(cat)!
      stat.total++
      if (tc.testResults.length > 0) stat.executed++
      else stat.never_executed++
    }
    const category_coverage = Object.fromEntries(
      Array.from(categoryMap.entries()).map(([cat, stat]) => [
        cat,
        { ...stat, coverage_rate: stat.total > 0 ? Math.round((stat.executed / stat.total) * 10000) / 100 : 0 },
      ]),
    )

    // 오래 실행되지 않은 테스트
    const staleTests = testCases
      .filter((tc) => {
        const last = tc.testResults[0]?.executedAt
        return !last || last < thirtyDaysAgo
      })
      .slice(0, 50)
      .map((tc) => ({
        test_case_id: tc.id,
        last_execution: tc.testResults[0]?.executedAt.toISOString() ?? null,
        days_since_execution: tc.testResults[0]
          ? Math.floor((Date.now() - tc.testResults[0].executedAt.getTime()) / 86400000)
          : null,
      }))

    return c.json({
      overall: {
        total_tests: totalTests,
        executed_tests: executedTests,
        never_executed: neverExecuted,
        coverage_rate: totalTests > 0 ? Math.round((executedTests / totalTests) * 10000) / 100 : 0,
      },
      category_coverage,
      stale_tests: staleTests,
      filters: { environment, folder_id: folderId },
    })
  } catch (e) {
    logger.error({ e }, '커버리지 분석 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /analytics/failure-patterns
// ──────────────────────────────────────────────
analyticsRouter.get('/failure-patterns', async (c) => {
  try {
    const days = Number(c.req.query('days') ?? 30)
    const environment = c.req.query('environment') ?? null

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const where: Record<string, unknown> = { executedAt: { gte: startDate }, result: 'Fail' }
    if (environment) where.environment = environment

    const failures = await db.testResult.findMany({
      where,
      select: {
        environment: true,
        errorMessage: true,
        executedAt: true,
        testCase: { select: { mainCategory: true } },
      },
    })

    const envFailures: Record<string, number> = {}
    const categoryFailures: Record<string, number> = {}
    const hourlyFailures: Record<number, number> = {}
    const errorPatterns: Record<string, number> = {}

    const ERROR_KEYWORDS = ['timeout', 'connection', 'not found', 'permission', 'invalid', 'error']

    for (const f of failures) {
      const env = f.environment ?? 'Unknown'
      envFailures[env] = (envFailures[env] ?? 0) + 1

      const cat = f.testCase?.mainCategory ?? 'Uncategorized'
      categoryFailures[cat] = (categoryFailures[cat] ?? 0) + 1

      const hour = f.executedAt.getHours()
      hourlyFailures[hour] = (hourlyFailures[hour] ?? 0) + 1

      if (f.errorMessage) {
        const lower = f.errorMessage.toLowerCase()
        for (const kw of ERROR_KEYWORDS) {
          if (lower.includes(kw)) {
            errorPatterns[kw] = (errorPatterns[kw] ?? 0) + 1
            break
          }
        }
      }
    }

    return c.json({
      period: { start_date: startDate.toISOString(), end_date: new Date().toISOString(), days },
      total_failures: failures.length,
      environment_failures: envFailures,
      category_failures: categoryFailures,
      hourly_failures: hourlyFailures,
      error_patterns: errorPatterns,
      filters: { environment },
    })
  } catch (e) {
    logger.error({ e }, '실패 패턴 분석 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /analytics/pass-rate-trend
// ──────────────────────────────────────────────
analyticsRouter.get('/pass-rate-trend', async (c) => {
  try {
    const days = Number(c.req.query('days') ?? 30)
    const environment = c.req.query('environment') ?? null
    const startDateParam = c.req.query('start_date') ?? null
    const endDateParam = c.req.query('end_date') ?? null

    const where: Record<string, unknown> = {
      fieldName: 'result_status',
      newValue: { in: ['Pass', 'Fail'] },
    }

    if (startDateParam) {
      where.changedAt = { ...(where.changedAt as object ?? {}), gte: new Date(startDateParam) }
    } else if (days > 0) {
      where.changedAt = { ...(where.changedAt as object ?? {}), gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
    }

    if (endDateParam) {
      const end = new Date(endDateParam)
      end.setHours(23, 59, 59, 999)
      where.changedAt = { ...(where.changedAt as object ?? {}), lte: end }
    }

    if (environment) {
      where.testCase = { environment }
    }

    const rows = await db.testCaseHistory.findMany({
      where,
      select: { changedAt: true, newValue: true },
      orderBy: { changedAt: 'asc' },
    })

    // 날짜별 집계
    const dateMap = new Map<string, { pass: number; fail: number }>()
    for (const row of rows) {
      const dateStr = row.changedAt.toISOString().slice(0, 10)
      if (!dateMap.has(dateStr)) dateMap.set(dateStr, { pass: 0, fail: 0 })
      const entry = dateMap.get(dateStr)!
      if (row.newValue === 'Pass') entry.pass++
      else if (row.newValue === 'Fail') entry.fail++
    }

    const dates: string[] = []
    const pass_rates: number[] = []
    const pass_counts: number[] = []
    const fail_counts: number[] = []

    for (const [date, { pass, fail }] of dateMap) {
      const total = pass + fail
      dates.push(date)
      pass_counts.push(pass)
      fail_counts.push(fail)
      pass_rates.push(total > 0 ? Math.round((pass / total) * 1000) / 10 : 0)
    }

    return c.json({ dates, pass_rates, pass_counts, fail_counts, period_days: days })
  } catch (e) {
    logger.error({ e }, 'Pass Rate 추이 분석 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /analytics/test-health
// ──────────────────────────────────────────────
analyticsRouter.get('/test-health', async (c) => {
  try {
    const days = Number(c.req.query('days') ?? 30)
    const environment = c.req.query('environment') ?? null

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const tcWhere: Record<string, unknown> = {}
    if (environment) tcWhere.environment = environment

    const [totalTests, recentResults] = await Promise.all([
      db.testCase.count({ where: tcWhere }),
      db.testResult.findMany({
        where: { executedAt: { gte: startDate }, ...(environment ? { environment } : {}) },
        select: { testCaseId: true, result: true },
      }),
    ])

    const totalExecutions = recentResults.length
    const passed = recentResults.filter((r) => r.result === 'Pass').length
    const failed = recentResults.filter((r) => r.result === 'Fail').length

    // 건강도 계산
    const executionRate = Math.min(totalTests > 0 && days > 0 ? (totalExecutions / (totalTests * days)) * 100 : 0, 100)
    const passRate = totalExecutions > 0 ? (passed / totalExecutions) * 100 : 0

    // 안정성: Flaky 비율
    const tcResultMap = new Map<number, { passed: number; failed: number }>()
    for (const r of recentResults) {
      if (!r.testCaseId) continue
      if (!tcResultMap.has(r.testCaseId)) tcResultMap.set(r.testCaseId, { passed: 0, failed: 0 })
      const s = tcResultMap.get(r.testCaseId)!
      if (r.result === 'Pass') s.passed++
      else if (r.result === 'Fail') s.failed++
    }

    const testedTcs = Array.from(tcResultMap.values()).filter((s) => s.passed + s.failed >= 5)
    const flakyCount = testedTcs.filter((s) => s.passed > 0 && s.failed > 0).length
    const stabilityScore = testedTcs.length > 0 ? 100 - (flakyCount / testedTcs.length) * 100 : 100

    const healthScore = Math.min(
      Math.round((executionRate * 0.3 + passRate * 0.5 + stabilityScore * 0.2) * 100) / 100,
      100,
    )

    let healthGrade: string
    if (healthScore >= 80) healthGrade = 'Excellent'
    else if (healthScore >= 60) healthGrade = 'Good'
    else if (healthScore >= 40) healthGrade = 'Fair'
    else healthGrade = 'Poor'

    return c.json({
      period: { start_date: startDate.toISOString(), end_date: new Date().toISOString(), days },
      health_score: healthScore,
      health_grade: healthGrade,
      metrics: {
        total_tests: totalTests,
        total_executions: totalExecutions,
        passed,
        failed,
        pass_rate: Math.round(passRate * 100) / 100,
        execution_rate: Math.round(executionRate * 100) / 100,
        stability_score: Math.round(stabilityScore * 100) / 100,
      },
      filters: { environment },
    })
  } catch (e) {
    logger.error({ e }, '테스트 건강도 분석 오류')
    return c.json({ error: String(e) }, 500)
  }
})
