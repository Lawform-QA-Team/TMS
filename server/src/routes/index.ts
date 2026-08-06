import type { Hono } from 'hono'
import { authRouter } from './auth.js'
import { usersRouter } from './users.js'
import { foldersRouter } from './folders.js'
import { automationRouter } from './automation.js'
import { performanceRouter, testExecutionsRouter } from './performance.js'
import {
  projectsRouter,
  testcasesRouter,
  testResultsRouter,
  screenshotsRouter,
  automationSuggestRouter,
  templatesRouter,
  testPlansRouter,
  reportsRouter,
} from './testcases.js'
import { analyticsRouter } from './analytics.js'
import { notificationsRouter } from './notifications.js'
import { schedulesRouter } from './schedules.js'
import { cicdRouter } from './cicd.js'
import { settingsRouter } from './settings.js'
import { testDataRouter } from './testData.js'
import { testScriptsRouter } from './testScripts.js'
import { commentsRouter, mentionsRouter, workflowsRouter } from './collaboration.js'
import { dependenciesRouter } from './dependencies.js'
import { dashboardRouter, dashboardSummariesRouter, testcasesSummaryRouter } from './dashboard.js'
import { testcasesExtendedRouter } from './testcasesExtended.js'
import { jiraRouter } from './jira.js'

export function registerRoutes(app: Hono): void {
  // Phase 2: 인증 & 사용자
  app.route('/auth', authRouter)
  app.route('/users', usersRouter)

  // Phase 3: 핵심 도메인
  app.route('/projects', projectsRouter)
  app.route('/folders', foldersRouter)
  app.route('/testcases', testcasesRouter)
  app.route('/testcases', testcasesSummaryRouter)   // GET /testcases/summary/all
  app.route('/testcases', testcasesExtendedRouter)  // 추가 엔드포인트 (upload, download, status, screenshots, execute, reorganize)
  app.route('/testresults', testResultsRouter)
  app.route('/screenshots', screenshotsRouter)
  app.route('/automation', automationSuggestRouter) // /automation/suggest
  app.route('/automation-tests', automationRouter)
  app.route('/performance-tests', performanceRouter)
  app.route('/test-executions', testExecutionsRouter)
  app.route('/templates', templatesRouter)
  app.route('/test-plans', testPlansRouter)
  app.route('/reports', reportsRouter)

  // Phase 4: 분석, 알림, 스케줄, CI/CD, 설정, 테스트 데이터/스크립트, 협업, 의존성, 대시보드
  app.route('/analytics', analyticsRouter)
  app.route('/notifications', notificationsRouter)
  app.route('/schedules', schedulesRouter)
  app.route('/cicd', cicdRouter)
  app.route('/settings', settingsRouter)
  app.route('/test-data', testDataRouter)
  app.route('/test-scripts', testScriptsRouter)
  app.route('/comments', commentsRouter)
  app.route('/mentions', mentionsRouter)
  app.route('/workflows', workflowsRouter)
  app.route('/dependencies', dependenciesRouter)
  app.route('/dashboard', dashboardRouter)
  app.route('/dashboard-summaries', dashboardSummariesRouter)

  // Phase 5: Jira 연동
  app.route('/jira', jiraRouter)
}
