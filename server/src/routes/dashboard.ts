import { Hono } from 'hono'
import { db } from '../lib/db.js'
import { logger } from '../lib/logger.js'

export const dashboardRouter = new Hono()
export const dashboardSummariesRouter = new Hono()
export const testcasesSummaryRouter = new Hono()

// ──────────────────────────────────────────────
// GET /dashboard/project-stats
// ──────────────────────────────────────────────
dashboardRouter.get('/project-stats', async (c) => {
  try {
    const projects = await db.project.findMany()
    const testCases = await db.testCase.findMany({
      select: { id: true, projectId: true, folderId: true, resultStatus: true },
    })
    const folders = await db.folder.findMany({ select: { id: true, projectId: true } })
    const folderMap = new Map(folders.map((f) => [f.id, f]))

    // 프로젝트별 통계 집계
    const byProject = new Map<number | null, Record<string, number>>()
    for (const tc of testCases) {
      let pid = tc.projectId
      if (pid === null && tc.folderId) {
        pid = folderMap.get(tc.folderId)?.projectId ?? null
      }
      if (!byProject.has(pid)) byProject.set(pid, {})
      const counts = byProject.get(pid)!
      counts[tc.resultStatus] = (counts[tc.resultStatus] ?? 0) + 1
    }

    const result = projects.map((p) => {
      const counts = byProject.get(p.id) ?? {}
      const total = Object.values(counts).reduce((a, b) => a + b, 0)
      const passed = counts['Pass'] ?? 0
      const failed = counts['Fail'] ?? 0
      const nt = counts['N/T'] ?? 0
      const na = counts['N/A'] ?? 0
      const blocked = counts['Block'] ?? 0
      return {
        project_id: p.id,
        project_name: p.name,
        total_testcases: total,
        passed,
        failed,
        nt,
        na,
        blocked,
        pass_rate: total > 0 ? Math.round((passed / total) * 10000) / 100 : 0,
      }
    })

    // 프로젝트 미지정
    if (byProject.has(null)) {
      const counts = byProject.get(null)!
      const total = Object.values(counts).reduce((a, b) => a + b, 0)
      const passed = counts['Pass'] ?? 0
      result.push({
        project_id: null as unknown as number,
        project_name: '(프로젝트 미지정)',
        total_testcases: total,
        passed,
        failed: counts['Fail'] ?? 0,
        nt: counts['N/T'] ?? 0,
        na: counts['N/A'] ?? 0,
        blocked: counts['Block'] ?? 0,
        pass_rate: total > 0 ? Math.round((passed / total) * 10000) / 100 : 0,
      })
    }

    return c.json(result)
  } catch (e) {
    logger.error({ e }, '프로젝트 통계 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /dashboard-summaries
// ──────────────────────────────────────────────
dashboardSummariesRouter.get('/', async (c) => {
  try {
    const summaries = await db.dashboardSummary.findMany()
    return c.json(summaries.map((s) => ({
      id: s.id,
      environment: s.environment,
      total_tests: s.totalTests,
      passed_tests: s.passedTests,
      failed_tests: s.failedTests,
      skipped_tests: s.skippedTests,
      pass_rate: s.passRate,
      last_updated: s.lastUpdated?.toISOString() ?? null,
    })))
  } catch (e) {
    logger.error({ e }, '대시보드 요약 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /dashboard/weekly-activity
// ──────────────────────────────────────────────
dashboardRouter.get('/weekly-activity', async (c) => {
  try {
    const now = new Date()
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay() // 월=1 ... 일=7
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - (dayOfWeek - 1))
    weekStart.setHours(0, 0, 0, 0)
    const lastWeekStart = new Date(weekStart)
    lastWeekStart.setDate(weekStart.getDate() - 7)

    const countNewTc = async (start: Date, end: Date) =>
      db.testCase.count({ where: { createdAt: { gte: start, lt: end } } })

    const countStatusChange = async (start: Date, end: Date, status: string) =>
      db.testCaseHistory.count({
        where: {
          changedAt: { gte: start, lt: end },
          fieldName: 'result_status',
          newValue: status,
        },
      })

    const [thisNewTc, thisPassed, thisFailed, lastNewTc, lastPassed, lastFailed] = await Promise.all([
      countNewTc(weekStart, now),
      countStatusChange(weekStart, now, 'Pass'),
      countStatusChange(weekStart, now, 'Fail'),
      countNewTc(lastWeekStart, weekStart),
      countStatusChange(lastWeekStart, weekStart, 'Pass'),
      countStatusChange(lastWeekStart, weekStart, 'Fail'),
    ])

    return c.json({
      this_week: { new_tc: thisNewTc, passed: thisPassed, failed: thisFailed },
      last_week: { new_tc: lastNewTc, passed: lastPassed, failed: lastFailed },
    })
  } catch (e) {
    logger.error({ e }, '주간 활동 통계 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /testcases/summary/all  (testcasesSummaryRouter에 등록)
// ──────────────────────────────────────────────
testcasesSummaryRouter.get('/summary/all', async (c) => {
  try {
    const grouped = await db.testCase.groupBy({
      by: ['environment', 'resultStatus'],
      _count: { id: true },
    })

    const envStats = new Map<string | null, Record<string, number>>()
    for (const row of grouped) {
      const env = row.environment
      if (!envStats.has(env)) envStats.set(env, {})
      envStats.get(env)![row.resultStatus] = row._count.id
    }

    const summaries = Array.from(envStats.entries()).map(([environment, counts]) => {
      const total = Object.values(counts).reduce((a, b) => a + b, 0)
      const passed = counts['Pass'] ?? 0
      return {
        environment: environment ?? 'unknown',
        total_testcases: total,
        passed,
        failed: counts['Fail'] ?? 0,
        nt: counts['N/T'] ?? 0,
        na: counts['N/A'] ?? 0,
        blocked: counts['Block'] ?? 0,
        pass_rate: total > 0 ? Math.round((passed / total) * 10000) / 100 : 0,
        last_updated: new Date().toISOString(),
      }
    })

    return c.json(summaries)
  } catch (e) {
    logger.error({ e }, '테스트케이스 요약 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})
