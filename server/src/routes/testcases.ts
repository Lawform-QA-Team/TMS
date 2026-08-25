import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import Anthropic from '@anthropic-ai/sdk'
import { db } from '../lib/db.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { logger } from '../lib/logger.js'
import { env } from '../env.js'

// ══════════════════════════════════════════════
// Projects Router
// ══════════════════════════════════════════════
export const projectsRouter = new Hono()

projectsRouter.get('/', async (c) => {
  try {
    const projects = await db.project.findMany({ orderBy: { createdAt: 'desc' } })
    return c.json(projects.map(serializeProject))
  } catch (e) {
    return c.json({ error: String(e) }, 500)
  }
})

projectsRouter.post(
  '/',
  requireAuth,
  zValidator('json', z.object({ name: z.string().min(1), description: z.string().optional() })),
  async (c) => {
    const data = c.req.valid('json')
    const caller = c.get('user')
    try {
      const project = await db.project.create({
        data: { name: data.name, description: data.description ?? null },
      })
      return c.json({ message: '프로젝트 생성 완료', id: project.id }, 201)
    } catch (e) {
      return c.json({ error: String(e) }, 500)
    }
  },
)

projectsRouter.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const project = await db.project.findUnique({ where: { id } })
  if (!project) return c.json({ error: '프로젝트를 찾을 수 없습니다.' }, 404)
  return c.json(serializeProject(project))
})

projectsRouter.put('/:id', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const project = await db.project.findUnique({ where: { id } })
  if (!project) return c.json({ error: '프로젝트를 찾을 수 없습니다.' }, 404)
  const data = await c.req.json()
  await db.project.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
    },
  })
  return c.json({ message: '프로젝트 업데이트 완료' })
})

projectsRouter.delete('/:id', requireAuth, requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  const project = await db.project.findUnique({ where: { id } })
  if (!project) return c.json({ error: '프로젝트를 찾을 수 없습니다.' }, 404)
  await db.project.delete({ where: { id } })
  return c.json({ message: '프로젝트 삭제 완료' })
})

// ══════════════════════════════════════════════
// TestCases Router
// ══════════════════════════════════════════════
export const testcasesRouter = new Hono()

// ──────────────────────────────────────────────
// POST /testcases/ai-generate  (주의: /:id 보다 먼저)
// ──────────────────────────────────────────────
testcasesRouter.post(
  '/ai-generate',
  requireAuth,
  zValidator(
    'json',
    z.object({
      feature_description: z.string().min(1),
      user_stories: z.string().optional(),
      environment: z.string().default('dev'),
      folder_id: z.number().optional(),
      project_id: z.number().default(1),
      count: z.number().min(1).max(20).default(5),
    }),
  ),
  async (c) => {
    const data = c.req.valid('json')
    const caller = c.get('user')

    try {
      const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

      const prompt = `다음 기능 설명과 사용자 스토리를 기반으로 ${data.count}개의 테스트 케이스를 생성해주세요.

기능 설명: ${data.feature_description}
${data.user_stories ? `사용자 스토리: ${data.user_stories}` : ''}

각 테스트 케이스를 다음 JSON 배열 형식으로 반환해주세요:
[
  {
    "main_category": "대분류",
    "sub_category": "중분류",
    "detail_category": "소분류",
    "pre_condition": "사전 조건",
    "expected_result": "예상 결과",
    "remark": "비고"
  }
]

JSON만 반환하고 다른 텍스트는 포함하지 마세요.`

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      })

      const content = message.content[0]
      if (!content || content.type !== 'text') throw new Error('AI 응답 형식 오류')

      let generatedCases: Array<{
        main_category?: string
        sub_category?: string
        detail_category?: string
        pre_condition?: string
        expected_result?: string
        remark?: string
      }> = []

      try {
        const jsonMatch = content.text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          generatedCases = JSON.parse(jsonMatch[0]) as typeof generatedCases
        }
      } catch {
        throw new Error('AI 응답을 JSON으로 파싱할 수 없습니다.')
      }

      // DB에 저장
      const createdIds: number[] = []
      for (const tc of generatedCases) {
        const created = await db.testCase.create({
          data: {
            name: tc.main_category ?? 'AI Generated',
            projectId: data.project_id,
            folderId: data.folder_id ?? null,
            mainCategory: tc.main_category ?? '',
            subCategory: tc.sub_category ?? '',
            detailCategory: tc.detail_category ?? '',
            preCondition: tc.pre_condition ?? '',
            expectedResult: tc.expected_result ?? '',
            resultStatus: 'N/T',
            remark: tc.remark ?? '',
            environment: data.environment,
            creatorId: Number(caller.sub),
          },
        })
        createdIds.push(created.id)
      }

      return c.json({
        message: `${createdIds.length}개의 테스트 케이스가 AI로 생성되었습니다.`,
        created_count: createdIds.length,
        test_case_ids: createdIds,
      })
    } catch (e) {
      logger.error({ e }, 'AI 테스트 케이스 생성 오류')
      return c.json({ error: `AI 생성 오류: ${String(e)}` }, 500)
    }
  },
)

// ──────────────────────────────────────────────
// POST /testcases/bulk-delete  (주의: /:id 보다 먼저)
// ──────────────────────────────────────────────
testcasesRouter.post(
  '/bulk-delete',
  requireAuth,
  zValidator('json', z.object({ testcase_ids: z.array(z.number()).min(1) })),
  async (c) => {
    const { testcase_ids } = c.req.valid('json')
    try {
      // 스크린샷 → 테스트 결과 → 테스트 계획 연결 → 테스트 케이스 순서로 삭제
      const resultIds = (
        await db.testResult.findMany({
          where: { testCaseId: { in: testcase_ids } },
          select: { id: true },
        })
      ).map((r) => r.id)

      if (resultIds.length > 0) {
        await db.screenshot.deleteMany({ where: { testResultId: { in: resultIds } } })
      }
      await db.testResult.deleteMany({ where: { testCaseId: { in: testcase_ids } } })
      await db.testPlanTestCase.deleteMany({ where: { testCaseId: { in: testcase_ids } } })

      const deleted = await db.testCase.deleteMany({ where: { id: { in: testcase_ids } } })

      return c.json({
        message: `${deleted.count}개의 테스트 케이스가 성공적으로 삭제되었습니다`,
        deleted_count: deleted.count,
        total_requested: testcase_ids.length,
        failed_deletions: [],
      })
    } catch (e) {
      logger.error({ e }, '테스트 케이스 다중 삭제 오류')
      return c.json({ error: `다중 삭제 중 오류가 발생했습니다: ${String(e)}` }, 500)
    }
  },
)

// ──────────────────────────────────────────────
// POST /testcases/bulk-status-update  (주의: /:id 보다 먼저)
// ──────────────────────────────────────────────
testcasesRouter.post(
  '/bulk-status-update',
  requireAuth,
  zValidator(
    'json',
    z.object({
      testcase_ids: z.array(z.number()).min(1),
      result_status: z.string(),
    }),
  ),
  async (c) => {
    const { testcase_ids, result_status } = c.req.valid('json')
    try {
      const updated = await db.testCase.updateMany({
        where: { id: { in: testcase_ids } },
        data: { resultStatus: result_status },
      })
      return c.json({
        message: `${updated.count}개의 테스트 케이스 상태가 업데이트되었습니다`,
        updated_count: updated.count,
      })
    } catch (e) {
      return c.json({ error: String(e) }, 500)
    }
  },
)

// ──────────────────────────────────────────────
// GET /testcases/download  (주의: /:id 보다 먼저)
// ──────────────────────────────────────────────
testcasesRouter.get('/download', async (c) => {
  try {
    const where = await buildTestCaseWhere(c.req.query.bind(c.req))
    const testcases = await db.testCase.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { creator: true, assignee: true },
    })

    const headers = [
      'ID',
      'TC Number',
      'Main Category',
      'Sub Category',
      'Detail Category',
      'Pre Condition',
      'Test Steps',
      'Expected Result',
      'Result Status',
      'Priority',
      'Environment',
      'Creator',
      'Assignee',
      'Remark',
      'Created At',
      'Updated At',
    ]

    const rows = testcases.map((tc) => [
      tc.id,
      'tc_number' in tc ? tc.tc_number : null,
      tc.mainCategory,
      tc.subCategory,
      tc.detailCategory,
      tc.preCondition,
      tc.testSteps,
      tc.expectedResult,
      tc.resultStatus,
      tc.priority,
      tc.environment,
      getDisplayName(tc.creator),
      getDisplayName(tc.assignee),
      tc.remark,
      tc.createdAt.toISOString(),
      tc.updatedAt.toISOString(),
    ])

    const csv = [headers, ...rows].map((row) => row.map(toCsvCell).join(',')).join('\r\n')
    const filename = `testcases_${new Date().toISOString().slice(0, 10)}.csv`

    return new Response(`\uFEFF${csv}`, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (e) {
    logger.error({ e }, '테스트케이스 다운로드 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /testcases
// ──────────────────────────────────────────────
testcasesRouter.get('/', async (c) => {
  try {
    const page = c.req.query('page') ? Number(c.req.query('page')) : null
    const perPage = c.req.query('per_page') ? Number(c.req.query('per_page')) : null
    const where = await buildTestCaseWhere(c.req.query.bind(c.req))

    if (!page || !perPage) {
      const testcases = await db.testCase.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { creator: true, assignee: true },
      })
      return c.json(testcases.map(serializeTestCase))
    }

    const safePage = Math.max(page, 1)
    const safePerPage = Math.min(Math.max(perPage, 1), 100)
    const skip = (safePage - 1) * safePerPage

    const [total, testcases] = await Promise.all([
      db.testCase.count({ where }),
      db.testCase.findMany({
        where,
        skip,
        take: safePerPage,
        orderBy: { createdAt: 'desc' },
        include: { creator: true, assignee: true },
      }),
    ])
    const totalPages = Math.ceil(total / safePerPage)

    return c.json({
      items: testcases.map(serializeTestCase),
      pagination: {
        page: safePage,
        per_page: safePerPage,
        total,
        pages: totalPages,
        has_next: safePage < totalPages,
        has_prev: safePage > 1,
        next_num: safePage < totalPages ? safePage + 1 : null,
        prev_num: safePage > 1 ? safePage - 1 : null,
      },
    })
  } catch (e) {
    logger.error({ e }, '테스트 케이스 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// POST /testcases
// ──────────────────────────────────────────────
testcasesRouter.post(
  '/',
  requireAuth,
  zValidator(
    'json',
    z.object({
      project_id: z.number().default(1),
      folder_id: z.number().optional(),
      main_category: z.string().default(''),
      sub_category: z.string().default(''),
      detail_category: z.string().default(''),
      pre_condition: z.string().default(''),
      expected_result: z.string().default(''),
      result_status: z.string().default('N/T'),
      remark: z.string().default(''),
      environment: z.string().default('dev'),
      automation_code_path: z.string().default(''),
      automation_code_type: z.string().default(''),
      assignee_id: z.number().optional(),
      test_steps: z.string().optional(),
      priority: z.string().optional(),
      tc_number: z.string().optional(),
    }),
  ),
  async (c) => {
    const data = c.req.valid('json')
    const caller = c.get('user')
    try {
      const tc = await db.testCase.create({
        data: {
          name: data.main_category || data.detail_category || 'Test Case',
          projectId: data.project_id,
          folderId: data.folder_id ?? null,
          mainCategory: data.main_category,
          subCategory: data.sub_category,
          detailCategory: data.detail_category,
          preCondition: data.pre_condition,
          expectedResult: data.expected_result,
          resultStatus: data.result_status,
          remark: data.remark,
          environment: data.environment,
          automationCodePath: data.automation_code_path || null,
          automationCodeType: data.automation_code_type || null,
          creatorId: Number(caller.sub),
          assigneeId: data.assignee_id ?? null,
          testSteps: data.test_steps ?? null,
          priority: data.priority ?? null,
          tc_number: data.tc_number ?? null,
        },
      })
      return c.json({ message: '테스트 케이스 생성 완료', id: tc.id }, 201)
    } catch (e) {
      logger.error({ e }, '테스트 케이스 생성 오류')
      return c.json({ error: String(e) }, 500)
    }
  },
)

// ──────────────────────────────────────────────
// GET /testcases/:id/history
// ──────────────────────────────────────────────
testcasesRouter.get('/:id/history', async (c) => {
  const id = Number(c.req.param('id'))
  const history = await db.testCaseHistory.findMany({
    where: { testCaseId: id },
    orderBy: { changedAt: 'desc' },
    include: { user: true },
  })
  return c.json(
    history.map((h) => ({
      id: h.id,
      test_case_id: h.testCaseId,
      field_name: h.fieldName,
      old_value: h.oldValue,
      new_value: h.newValue,
      changed_at: h.changedAt.toISOString(),
      changed_by: h.changedBy,
      changed_by_name: h.user
        ? [h.user.firstName, h.user.lastName].filter(Boolean).join(' ') || h.user.username
        : null,
    })),
  )
})

// ──────────────────────────────────────────────
// GET /testcases/:id/screenshots
// ──────────────────────────────────────────────
testcasesRouter.get('/:id/screenshots', async (c) => {
  const id = Number(c.req.param('id'))
  const tc = await db.testCase.findUnique({ where: { id } })
  if (!tc) return c.json({ error: '테스트 케이스를 찾을 수 없습니다.' }, 404)

  const results = await db.testResult.findMany({ where: { testCaseId: id }, select: { id: true } })
  const resultIds = results.map((r) => r.id)
  const screenshots =
    resultIds.length > 0
      ? await db.screenshot.findMany({ where: { testResultId: { in: resultIds } } })
      : []

  return c.json(
    screenshots.map((s) => ({
      id: s.id,
      screenshot_path: s.filePath,
      timestamp: s.createdAt?.toISOString() ?? null,
    })),
  )
})

// ──────────────────────────────────────────────
// GET /testcases/:id/automation
// ──────────────────────────────────────────────
testcasesRouter.get('/:id/automation', async (c) => {
  const id = Number(c.req.param('id'))
  const tc = await db.testCase.findUnique({ where: { id } })
  if (!tc) return c.json({ error: '테스트 케이스를 찾을 수 없습니다.' }, 404)

  const automationInfo = {
    has_automation: !!tc.automationCodePath,
    script_path: tc.automationCodePath,
    script_type: tc.automationCodeType,
    last_execution: null as string | null,
    execution_count: 0,
    success_rate: 0,
  }

  if (tc.automationCodePath) {
    const executions = await db.testResult.findMany({
      where: { automationTestId: id },
      orderBy: { executedAt: 'desc' },
      take: 10,
    })
    if (executions.length > 0 && executions[0]) {
      automationInfo.last_execution = executions[0].executedAt?.toISOString() ?? null
      automationInfo.execution_count = executions.length
      const successCount = executions.filter((e) => e.result === 'Pass').length
      automationInfo.success_rate = (successCount / executions.length) * 100
    }
  }

  return c.json(automationInfo)
})

// ──────────────────────────────────────────────
// POST /testcases/:id/automation
// ──────────────────────────────────────────────
testcasesRouter.post('/:id/automation', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const tc = await db.testCase.findUnique({ where: { id } })
  if (!tc) return c.json({ error: '테스트 케이스를 찾을 수 없습니다.' }, 404)

  const data = await c.req.json()
  const scriptPath = data.script_path as string | undefined
  if (!scriptPath) return c.json({ error: '스크립트 경로는 필수입니다' }, 400)

  await db.testCase.update({
    where: { id },
    data: {
      automationCodePath: scriptPath,
      automationCodeType: data.script_type ?? 'playwright',
    },
  })

  return c.json({ message: '자동화 스크립트가 성공적으로 연결되었습니다.', script_path: scriptPath })
})

// ──────────────────────────────────────────────
// POST /testcases/:id/execute
// ──────────────────────────────────────────────
testcasesRouter.post('/:id/execute', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const tc = await db.testCase.findUnique({ where: { id } })
  if (!tc) return c.json({ error: '테스트 케이스를 찾을 수 없습니다.' }, 404)

  if (!tc.automationCodePath && !tc.testSteps) {
    return c.json({ error: '자동화 코드 경로 또는 테스트 단계(test_steps)를 설정해 주세요' }, 400)
  }

  // Phase 6에서 실제 실행 엔진 연결 예정 — 현재는 시뮬레이션
  const startTime = Date.now()
  const simulatedResult = 'Pass'
  const executionDuration = (Date.now() - startTime) / 1000

  const result = await db.testResult.create({
    data: {
      testCaseId: id,
      result: simulatedResult,
      environment: tc.environment,
      executionDuration,
    },
  })

  return c.json({
    message: '자동화 코드 실행 완료',
    result: simulatedResult,
    execution_id: result.id,
    execution_duration: executionDuration,
  })
})

// ──────────────────────────────────────────────
// GET /testcases/:id
// ──────────────────────────────────────────────
testcasesRouter.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const tc = await db.testCase.findUnique({
    where: { id },
    include: { creator: true, assignee: true },
  })
  if (!tc) return c.json({ error: '테스트 케이스를 찾을 수 없습니다.' }, 404)
  return c.json(serializeTestCase(tc))
})

// ──────────────────────────────────────────────
// PUT /testcases/:id
// ──────────────────────────────────────────────
testcasesRouter.put('/:id', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const tc = await db.testCase.findUnique({ where: { id } })
  if (!tc) return c.json({ error: '테스트 케이스를 찾을 수 없습니다.' }, 404)

  const data = await c.req.json()
  try {
    // 변경 이력 추적 (result_status 변경 시)
    if (data.result_status !== undefined && data.result_status !== tc.resultStatus) {
      await db.testCaseHistory.create({
        data: {
          testCaseId: id,
          fieldName: 'result_status',
          oldValue: tc.resultStatus,
          newValue: data.result_status as string,
          changedBy: Number(c.get('user').sub),
          changeType: 'update',
          changedAt: new Date(),
        },
      })
    }

    await db.testCase.update({
      where: { id },
      data: {
        ...(data.project_id !== undefined && { projectId: data.project_id }),
        ...(data.folder_id !== undefined && { folderId: data.folder_id }),
        ...(data.main_category !== undefined && { mainCategory: data.main_category }),
        ...(data.sub_category !== undefined && { subCategory: data.sub_category }),
        ...(data.detail_category !== undefined && { detailCategory: data.detail_category }),
        ...(data.pre_condition !== undefined && { preCondition: data.pre_condition }),
        ...(data.expected_result !== undefined && { expectedResult: data.expected_result }),
        ...(data.result_status !== undefined && { resultStatus: data.result_status }),
        ...(data.remark !== undefined && { remark: data.remark }),
        ...(data.environment !== undefined && { environment: data.environment }),
        ...(data.automation_code_path !== undefined && { automationCodePath: data.automation_code_path }),
        ...(data.automation_code_type !== undefined && { automationCodeType: data.automation_code_type }),
        ...(data.assignee_id !== undefined && { assigneeId: data.assignee_id }),
        ...(data.test_steps !== undefined && { testSteps: data.test_steps }),
        ...(data.priority !== undefined && { priority: data.priority || null }),
        ...(data.tc_number !== undefined && { tc_number: data.tc_number || null }),
      },
    })

    return c.json({ message: '테스트 케이스 업데이트 완료' })
  } catch (e) {
    logger.error({ e }, '테스트 케이스 업데이트 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// DELETE /testcases/:id
// ──────────────────────────────────────────────
testcasesRouter.delete('/:id', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const tc = await db.testCase.findUnique({ where: { id } })
  if (!tc) return c.json({ error: '테스트 케이스를 찾을 수 없습니다.' }, 404)

  try {
    const resultIds = (
      await db.testResult.findMany({ where: { testCaseId: id }, select: { id: true } })
    ).map((r) => r.id)

    if (resultIds.length > 0) {
      await db.screenshot.deleteMany({ where: { testResultId: { in: resultIds } } })
    }
    await db.testResult.deleteMany({ where: { testCaseId: id } })
    await db.testPlanTestCase.deleteMany({ where: { testCaseId: id } })
    await db.testCase.delete({ where: { id } })

    return c.json({ message: '테스트 케이스 삭제 완료' })
  } catch (e) {
    logger.error({ e }, '테스트 케이스 삭제 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ══════════════════════════════════════════════
// TestResults Router (prefix: /testresults)
// ══════════════════════════════════════════════
export const testResultsRouter = new Hono()

testResultsRouter.get('/:test_case_id', async (c) => {
  const testCaseId = Number(c.req.param('test_case_id'))
  const results = await db.testResult.findMany({
    where: { testCaseId },
    orderBy: { executedAt: 'desc' },
  })
  return c.json(
    results.map((r) => ({
      id: r.id,
      test_case_id: r.testCaseId,
      result: r.result,
      executed_at: r.executedAt?.toISOString() ?? null,
      notes: r.notes,
      environment: r.environment,
      execution_duration: r.executionDuration,
      error_message: r.errorMessage,
    })),
  )
})

testResultsRouter.post('/', requireAuth, async (c) => {
  const data = await c.req.json()
  const result = await db.testResult.create({
    data: {
      testCaseId: data.test_case_id,
      result: data.result,
      notes: data.notes ?? null,
    },
  })
  return c.json({ message: '테스트 결과 생성 완료', id: result.id }, 201)
})

// ══════════════════════════════════════════════
// Screenshots Router (prefix: /screenshots)
// ══════════════════════════════════════════════
export const screenshotsRouter = new Hono()

screenshotsRouter.get('/:filename{.+}', async (c) => {
  // Phase 6에서 파일 서빙 구현 예정
  return c.json({ error: '스크린샷 파일 서빙은 Phase 6에서 구현됩니다.' }, 501)
})

// ══════════════════════════════════════════════
// Automation Suggest Router (prefix: /automation)
// ══════════════════════════════════════════════
export const automationSuggestRouter = new Hono()

automationSuggestRouter.get('/suggest', async (c) => {
  try {
    const unlinked = await db.testCase.findMany({
      where: { OR: [{ automationCodePath: null }, { automationCodePath: '' }] },
      take: 50,
    })

    const suggestions = await Promise.all(
      unlinked.map(async (tc) => {
        if (!tc.mainCategory) return null
        const similar = await db.testCase.findMany({
          where: {
            mainCategory: tc.mainCategory,
            NOT: [{ automationCodePath: null }, { automationCodePath: '' }],
          },
          take: 3,
        })
        if (!similar.length) return null
        return {
          test_case_id: tc.id,
          category: tc.mainCategory,
          suggested_scripts: similar.map((s) => ({
            script_path: s.automationCodePath,
            script_type: s.automationCodeType,
            similarity: 'category_match',
          })),
        }
      }),
    )

    return c.json(suggestions.filter(Boolean))
  } catch (e) {
    logger.error({ e }, '자동화 스크립트 추천 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ══════════════════════════════════════════════
// Templates Router (prefix: /templates)
// ══════════════════════════════════════════════
export const templatesRouter = new Hono()

templatesRouter.get('/', async (c) => {
  try {
    const search = c.req.query('search') ?? ''
    const category = c.req.query('category') ?? ''
    const isPublic = c.req.query('public') ?? ''

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { mainCategory: { contains: search } },
        { subCategory: { contains: search } },
      ]
    }
    if (category) where.mainCategory = category
    if (isPublic === 'true') where.isPublic = true

    const templates = await db.testCaseTemplate.findMany({
      where,
      orderBy: { usageCount: 'desc' },
      include: { creator: true },
    })

    return c.json(
      templates.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        main_category: t.mainCategory,
        sub_category: t.subCategory,
        detail_category: t.detailCategory,
        pre_condition: t.preCondition,
        expected_result: t.expectedResult,
        test_steps: t.testSteps,
        automation_code_path: t.automationCodePath,
        automation_code_type: t.automationCodeType,
        tags: t.tags ? (JSON.parse(t.tags) as unknown[]) : [],
        created_by: t.createdBy,
        created_at: t.createdAt?.toISOString() ?? null,
        updated_at: t.updatedAt?.toISOString() ?? null,
        is_public: t.isPublic,
        usage_count: t.usageCount,
        creator_name: t.creator
          ? [t.creator.firstName, t.creator.lastName].filter(Boolean).join(' ') || t.creator.username
          : 'Unknown',
      })),
    )
  } catch (e) {
    logger.error({ e }, '템플릿 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

templatesRouter.post(
  '/',
  requireAuth,
  zValidator('json', z.object({ name: z.string().min(1, '템플릿명은 필수입니다') }).passthrough()),
  async (c) => {
    const data = await c.req.json() as Record<string, unknown>
    const caller = c.get('user')
    try {
      const template = await db.testCaseTemplate.create({
        data: {
          name: data.name as string,
          description: (data.description as string | undefined) ?? '',
          mainCategory: (data.main_category as string | undefined) ?? '',
          subCategory: (data.sub_category as string | undefined) ?? '',
          detailCategory: (data.detail_category as string | undefined) ?? '',
          preCondition: (data.pre_condition as string | undefined) ?? '',
          expectedResult: (data.expected_result as string | undefined) ?? '',
          testSteps: (data.test_steps as string | undefined) ?? '',
          automationCodePath: (data.automation_code_path as string | undefined) ?? '',
          automationCodeType: (data.automation_code_type as string | undefined) ?? 'playwright',
          tags: JSON.stringify(data.tags ?? []),
          createdBy: Number(caller.sub),
          isPublic: (data.is_public as boolean | undefined) ?? false,
        },
      })
      return c.json({ message: '템플릿이 성공적으로 생성되었습니다.', id: template.id }, 201)
    } catch (e) {
      logger.error({ e }, '템플릿 생성 오류')
      return c.json({ error: String(e) }, 500)
    }
  },
)

templatesRouter.post('/:id/apply', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const template = await db.testCaseTemplate.findUnique({ where: { id } })
  if (!template) return c.json({ error: '템플릿을 찾을 수 없습니다.' }, 404)

  const data = await c.req.json() as Record<string, unknown>
  if (!data.folder_id) return c.json({ error: '폴더 ID는 필수입니다' }, 400)

  try {
    const tc = await db.testCase.create({
      data: {
        name: template.name,
        projectId: 1,
        folderId: data.folder_id as number,
        mainCategory: template.mainCategory ?? '',
        subCategory: template.subCategory ?? '',
        detailCategory: template.detailCategory ?? '',
        preCondition: template.preCondition ?? '',
        expectedResult: template.expectedResult ?? '',
        remark: template.testSteps ?? '',
        automationCodePath: template.automationCodePath ?? '',
        automationCodeType: template.automationCodeType ?? '',
        environment: 'dev',
        creatorId: Number(c.get('user').sub),
      },
    })
    await db.testCaseTemplate.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    })
    return c.json({ message: '템플릿이 성공적으로 적용되었습니다.', test_case_id: tc.id }, 201)
  } catch (e) {
    logger.error({ e }, '템플릿 적용 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ══════════════════════════════════════════════
// TestPlans Router (prefix: /test-plans)
// ══════════════════════════════════════════════
export const testPlansRouter = new Hono()

testPlansRouter.get('/', async (c) => {
  try {
    const plans = await db.testPlan.findMany({
      orderBy: { createdAt: 'desc' },
      include: { creator: true, testCases: true },
    })
    return c.json(
      plans.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        version: p.version,
        environment: p.environment,
        start_date: p.startDate?.toISOString().slice(0, 10) ?? null,
        end_date: p.endDate?.toISOString().slice(0, 10) ?? null,
        status: p.status,
        priority: p.priority,
        created_by: p.createdBy,
        created_at: p.createdAt?.toISOString() ?? null,
        updated_at: p.updatedAt?.toISOString() ?? null,
        creator_name: p.creator
          ? [p.creator.firstName, p.creator.lastName].filter(Boolean).join(' ') || p.creator.username
          : 'Unknown',
        test_case_count: p.testCases.length,
      })),
    )
  } catch (e) {
    logger.error({ e }, '테스트 계획 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

testPlansRouter.post(
  '/',
  requireAuth,
  zValidator('json', z.object({ name: z.string().min(1, '계획명은 필수입니다') }).passthrough()),
  async (c) => {
    const data = await c.req.json() as Record<string, unknown>
    const caller = c.get('user')
    try {
      const plan = await db.testPlan.create({
        data: {
          name: data.name as string,
          description: (data.description as string | undefined) ?? '',
          version: (data.version as string | undefined) ?? '1.0',
          environment: (data.environment as string | undefined) ?? 'dev',
          startDate: data.start_date ? new Date(data.start_date as string) : null,
          endDate: data.end_date ? new Date(data.end_date as string) : null,
          status: (data.status as string | undefined) ?? 'draft',
          priority: (data.priority as string | undefined) ?? 'medium',
          createdBy: Number(caller.sub),
        },
      })
      return c.json({ message: '테스트 계획이 성공적으로 생성되었습니다.', id: plan.id }, 201)
    } catch (e) {
      logger.error({ e }, '테스트 계획 생성 오류')
      return c.json({ error: String(e) }, 500)
    }
  },
)

testPlansRouter.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const plan = await db.testPlan.findUnique({
    where: { id },
    include: {
      creator: true,
      testCases: {
        include: { testCase: true, assignee: true },
        orderBy: { executionOrder: 'asc' },
      },
    },
  })
  if (!plan) return c.json({ error: '테스트 계획을 찾을 수 없습니다.' }, 404)

  const testCases = plan.testCases.map((ptc) => ({
    id: ptc.testCase.id,
    main_category: ptc.testCase.mainCategory,
    sub_category: ptc.testCase.subCategory,
    detail_category: ptc.testCase.detailCategory,
    environment: ptc.testCase.environment,
    result_status: ptc.testCase.resultStatus,
    execution_order: ptc.executionOrder,
    estimated_duration: ptc.estimatedDuration,
    assigned_to: ptc.assignedTo,
    assignee_name: ptc.assignee
      ? [ptc.assignee.firstName, ptc.assignee.lastName].filter(Boolean).join(' ') || ptc.assignee.username
      : null,
    notes: ptc.notes,
  }))

  return c.json({
    id: plan.id,
    name: plan.name,
    description: plan.description,
    version: plan.version,
    environment: plan.environment,
    start_date: plan.startDate?.toISOString().slice(0, 10) ?? null,
    end_date: plan.endDate?.toISOString().slice(0, 10) ?? null,
    status: plan.status,
    priority: plan.priority,
    created_by: plan.createdBy,
    created_at: plan.createdAt?.toISOString() ?? null,
    updated_at: plan.updatedAt?.toISOString() ?? null,
    creator_name: plan.creator
      ? [plan.creator.firstName, plan.creator.lastName].filter(Boolean).join(' ') || plan.creator.username
      : 'Unknown',
    test_cases: testCases,
    total_estimated_duration: testCases.reduce((sum, tc) => sum + (tc.estimated_duration ?? 0), 0),
  })
})

testPlansRouter.post('/:id/test-cases', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const plan = await db.testPlan.findUnique({ where: { id }, include: { testCases: true } })
  if (!plan) return c.json({ error: '테스트 계획을 찾을 수 없습니다.' }, 404)

  const data = await c.req.json() as Record<string, unknown>
  const testCaseIds = (data.test_case_ids as number[]) ?? []
  if (!testCaseIds.length) return c.json({ error: '테스트 케이스 ID 목록이 필요합니다' }, 400)

  try {
    let addedCount = 0
    for (const tcId of testCaseIds) {
      const existing = await db.testPlanTestCase.findFirst({ where: { testPlanId: id, testCaseId: tcId } })
      if (!existing) {
        await db.testPlanTestCase.create({
          data: {
            testPlanId: id,
            testCaseId: tcId,
            executionOrder: plan.testCases.length + addedCount + 1,
            estimatedDuration: (data.estimated_duration as number | undefined) ?? 30,
            assignedTo: (data.assigned_to as number | undefined) ?? null,
            notes: (data.notes as string | undefined) ?? '',
          },
        })
        addedCount++
      }
    }
    return c.json({ message: `${addedCount}개 테스트 케이스가 계획에 추가되었습니다.`, added_count: addedCount })
  } catch (e) {
    logger.error({ e }, '테스트 케이스 추가 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ══════════════════════════════════════════════
// Reports Router (prefix: /reports)
// ══════════════════════════════════════════════
export const reportsRouter = new Hono()

reportsRouter.get('/summary', async (c) => {
  try {
    const allTc = await db.testCase.findMany({ select: { environment: true, resultStatus: true, automationCodePath: true } })

    // 환경별 통계
    const envMap = new Map<string, { total: number; passed: number; failed: number; not_tested: number; not_applicable: number; blocked: number }>()
    for (const tc of allTc) {
      const env = tc.environment ?? 'Unknown'
      if (!envMap.has(env)) envMap.set(env, { total: 0, passed: 0, failed: 0, not_tested: 0, not_applicable: 0, blocked: 0 })
      const stat = envMap.get(env)!
      stat.total++
      if (tc.resultStatus === 'Pass') stat.passed++
      else if (tc.resultStatus === 'Fail') stat.failed++
      else if (tc.resultStatus === 'N/T') stat.not_tested++
      else if (tc.resultStatus === 'N/A') stat.not_applicable++
      else if (tc.resultStatus === 'Block') stat.blocked++
    }

    const environment_stats = Array.from(envMap.entries()).map(([env, stat]) => ({
      environment: env,
      ...stat,
      pass_rate: stat.total > 0 ? Math.round((stat.passed / stat.total) * 1000) / 10 : 0,
    }))

    // 카테고리별 통계
    const catMap = new Map<string, { total: number; passed: number; failed: number }>()
    for (const tc of allTc) {
      const cat = (tc as { mainCategory?: string }).mainCategory ?? 'Unknown'
      if (!catMap.has(cat)) catMap.set(cat, { total: 0, passed: 0, failed: 0 })
      const stat = catMap.get(cat)!
      stat.total++
      if (tc.resultStatus === 'Pass') stat.passed++
      else if (tc.resultStatus === 'Fail') stat.failed++
    }

    const category_stats = Array.from(catMap.entries()).map(([cat, stat]) => ({
      category: cat,
      ...stat,
      pass_rate: stat.total > 0 ? Math.round((stat.passed / stat.total) * 1000) / 10 : 0,
    }))

    // 자동화 통계
    const total = allTc.length
    const automated = allTc.filter((tc) => tc.automationCodePath).length

    return c.json({
      environment_stats,
      category_stats,
      automation_stats: {
        total,
        automated,
        manual: total - automated,
        automation_rate: total > 0 ? Math.round((automated / total) * 1000) / 10 : 0,
      },
      generated_at: new Date().toISOString(),
    })
  } catch (e) {
    logger.error({ e }, '요약 리포트 생성 오류')
    return c.json({ error: String(e) }, 500)
  }
})

reportsRouter.post('/export', requireAuth, async (c) => {
  // Phase 4에서 엑셀 내보내기 구현 예정
  return c.json({ error: '리포트 내보내기는 Phase 4에서 구현됩니다.' }, 501)
})

// ══════════════════════════════════════════════
// 내부 헬퍼
// ══════════════════════════════════════════════
async function collectFolderIds(
  folder: { id: number; folderType: string | null },
): Promise<number[]> {
  const ids = [folder.id]

  if (folder.folderType === 'environment' || folder.folderType === null) {
    const depFolders = await db.folder.findMany({
      where: { parentFolderId: folder.id },
      select: { id: true, folderType: true },
    })
    for (const df of depFolders) {
      ids.push(df.id)
      const featureFolders = await db.folder.findMany({
        where: { parentFolderId: df.id },
        select: { id: true },
      })
      ids.push(...featureFolders.map((f) => f.id))
    }
  } else if (folder.folderType === 'deployment_date') {
    const featureFolders = await db.folder.findMany({
      where: { parentFolderId: folder.id },
      select: { id: true },
    })
    ids.push(...featureFolders.map((f) => f.id))
  }

  return ids
}

type UserRef = { username: string; firstName: string | null; lastName: string | null } | null
type QueryReader = (key: string) => string | undefined

async function buildTestCaseWhere(query: QueryReader): Promise<Record<string, unknown>> {
  const search = query('search') ?? ''
  const status = query('status') ?? ''
  const environment = query('environment') ?? ''
  const category = query('category') ?? ''
  const creator = query('creator') ?? ''
  const assignee = query('assignee') ?? ''
  const priority = query('priority') ?? ''
  const folderIdStr = query('folder_id')

  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { mainCategory: { contains: search } },
      { subCategory: { contains: search } },
      { detailCategory: { contains: search } },
      { expectedResult: { contains: search } },
      { remark: { contains: search } },
    ]
  }
  if (status && status !== 'all') where.resultStatus = status
  if (environment && environment !== 'all') where.environment = environment
  if (priority && priority !== 'all') where.priority = priority

  if (category && category !== 'all') {
    const parts = category.split(' > ')
    if (parts[0]) where.mainCategory = parts[0]
    if (parts[1]) where.subCategory = parts[1]
    if (parts[2]) where.detailCategory = parts[2]
  }

  if (folderIdStr) {
    const folderId = Number(folderIdStr)
    if (Number.isFinite(folderId)) {
      const folder = await db.folder.findUnique({ where: { id: folderId } })
      if (folder) {
        const folderIds = await collectFolderIds(folder)
        where.folderId = { in: folderIds }
      }
    }
  }

  if (creator && creator !== 'all') {
    const u = await db.user.findUnique({ where: { username: creator } })
    if (u) where.creatorId = u.id
    else where.creatorId = -1
  }

  if (assignee && assignee !== 'all') {
    const u = await db.user.findUnique({ where: { username: assignee } })
    if (u) where.assigneeId = u.id
    else where.assigneeId = -1
  }

  return where
}

function getDisplayName(u: UserRef): string | null {
  if (!u) return null
  const full = [u.firstName, u.lastName].filter(Boolean).join(' ')
  return full || u.username
}

function toCsvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const text = String(value)
  if (!/[",\r\n]/.test(text)) return text
  return `"${text.replace(/"/g, '""')}"`
}

function serializeProject(p: {
  id: number
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    created_at: p.createdAt.toISOString(),
    updated_at: p.updatedAt.toISOString(),
  }
}

function serializeTestCase(tc: {
  id: number
  projectId: number | null
  folderId: number | null
  mainCategory: string | null
  subCategory: string | null
  detailCategory: string | null
  preCondition: string | null
  expectedResult: string | null
  resultStatus: string
  remark: string | null
  testSteps: string | null
  environment: string | null
  automationCodePath: string | null
  automationCodeType: string | null
  creatorId: number | null
  assigneeId: number | null
  createdAt: Date
  updatedAt: Date
  priority?: string | null
  tc_number?: string | null
  creator?: UserRef
  assignee?: UserRef
}) {
  return {
    id: tc.id,
    project_id: tc.projectId,
    folder_id: tc.folderId,
    main_category: tc.mainCategory,
    sub_category: tc.subCategory,
    detail_category: tc.detailCategory,
    pre_condition: tc.preCondition,
    expected_result: tc.expectedResult,
    result_status: tc.resultStatus,
    remark: tc.remark,
    test_steps: tc.testSteps,
    environment: tc.environment,
    automation_code_path: tc.automationCodePath,
    automation_code_type: tc.automationCodeType,
    priority: tc.priority ?? null,
    tc_number: tc.tc_number ?? null,
    creator_id: tc.creatorId,
    creator_name: getDisplayName(tc.creator ?? null),
    assignee_id: tc.assigneeId,
    assignee_name: getDisplayName(tc.assignee ?? null),
    created_at: tc.createdAt.toISOString(),
    updated_at: tc.updatedAt.toISOString(),
  }
}
