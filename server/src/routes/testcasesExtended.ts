import { Hono } from 'hono'
import { db } from '../lib/db.js'
import { requireAuth } from '../middleware/auth.js'
import { logger } from '../lib/logger.js'

/**
 * testcasesRouter와 같은 prefix (/testcases)로 마운트되어
 * 기존 testcases.ts에 없는 추가 엔드포인트를 제공하는 라우터.
 *
 * Hono는 같은 prefix에 여러 라우터를 mount할 때 순서대로 탐색하므로
 * 기존 testcasesRouter가 처리하지 못하는 경로를 이 라우터가 처리한다.
 */
export const testcasesExtendedRouter = new Hono()

// ──────────────────────────────────────────────
// POST /testcases/bulk-move  (주의: /:id 보다 먼저)
// ──────────────────────────────────────────────
testcasesExtendedRouter.post('/bulk-move', requireAuth, async (c) => {
  try {
    const data = await c.req.json()
    const testcaseIds: number[] = data.testcase_ids ?? []
    const targetFolderId: number | null = data.folder_id ?? null

    if (!testcaseIds.length) return c.json({ error: '이동할 테스트 케이스 ID 목록이 필요합니다' }, 400)
    if (!targetFolderId) return c.json({ error: '대상 폴더 ID가 필요합니다' }, 400)

    const folder = await db.folder.findUnique({ where: { id: targetFolderId } })
    if (!folder) return c.json({ error: '대상 폴더를 찾을 수 없습니다' }, 404)

    const updated = await db.testCase.updateMany({
      where: { id: { in: testcaseIds } },
      data: {
        folderId: targetFolderId,
        environment: folder.environment ?? null,
        ...(folder.projectId !== null && { projectId: folder.projectId }),
      },
    })

    return c.json({ moved: updated.count })
  } catch (e) {
    logger.error({ e }, '폴더 이동 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// POST /testcases/import-sheets  (주의: /:id 보다 먼저)
// ──────────────────────────────────────────────
testcasesExtendedRouter.post('/import-sheets', requireAuth, async (c) => {
  try {
    const data = await c.req.json()
    const rows: Record<string, unknown>[] = data.rows ?? []
    const folderId: number | null = data.folder_id ?? null
    const environment: string = data.environment ?? 'dev'
    const projectId: number | null = data.project_id != null ? Number(data.project_id) : null

    if (!rows.length) return c.json({ error: '가져올 데이터가 없습니다' }, 400)

    const caller = c.get('user')
    const created: number[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!
      const subCat = String(row.sub_category ?? '')
      const tcNum = String(row.tc_number ?? '')
      const tcName = subCat || tcNum || `TC-${i + 1}`

      const tc = await db.testCase.create({
        data: {
          name: tcName.slice(0, 200),
          tc_number: tcNum || null,
          subCategory: subCat || null,
          mainCategory: String(row.main_category ?? '') || null,
          detailCategory: String(row.detail_category ?? '') || null,
          resultStatus: String(row.result_status ?? 'N/T'),
          testSteps: row.test_steps ? String(row.test_steps) : null,
          expectedResult: row.expected_result ? String(row.expected_result) : null,
          preCondition: row.pre_condition ? String(row.pre_condition) : null,
          remark: row.remark ? String(row.remark) : null,
          priority: row.priority ? String(row.priority) : null,
          environment,
          folderId,
          projectId,
          creatorId: Number(caller.sub),
        },
      })
      created.push(tc.id)
    }

    return c.json({ imported: created.length, ids: created }, 201)
  } catch (e) {
    logger.error({ e }, 'Google Sheets 가져오기 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// POST /testcases/reorganize  (주의: /:id 보다 먼저)
// ──────────────────────────────────────────────
testcasesExtendedRouter.post('/reorganize', async (c) => {
  try {
    const testcases = await db.testCase.findMany({ select: { id: true, name: true, folderId: true } })
    let movedCount = 0
    for (const tc of testcases) {
      let newFolderId: number | null = null
      if (tc.name.includes('CLM')) {
        if (tc.name.includes('Draft')) newFolderId = 7
        else if (tc.name.includes('Review')) newFolderId = 8
        else if (tc.name.includes('Sign')) newFolderId = 9
        else if (tc.name.includes('Process')) newFolderId = 10
        else newFolderId = 7
      } else if (tc.name.includes('Litigation')) {
        if (tc.name.includes('Draft')) newFolderId = 11
        else if (tc.name.includes('Schedule')) newFolderId = 12
        else newFolderId = 11
      } else if (tc.name.includes('Dashboard')) {
        newFolderId = 13
      }
      if (newFolderId && tc.folderId !== newFolderId) {
        await db.testCase.update({ where: { id: tc.id }, data: { folderId: newFolderId } })
        movedCount++
      }
    }
    if (movedCount > 0) {
      return c.json({ status: 'success', message: `${movedCount}개의 테스트 케이스가 기능 폴더로 이동되었습니다.` })
    }
    return c.json({ status: 'info', message: '이동할 테스트 케이스가 없습니다.' })
  } catch (e) {
    logger.error({ e }, '테스트 케이스 재배치 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /testcases/download  (주의: /:id 보다 먼저)
// ──────────────────────────────────────────────
testcasesExtendedRouter.get('/download', async (c) => {
  try {
    const idsParam = c.req.query('ids')
    const search = c.req.query('search')
    const status = c.req.query('status')
    const environment = c.req.query('environment')
    const category = c.req.query('category')
    const creator = c.req.query('creator')
    const folderIdParam = c.req.query('folder_id')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    if (idsParam) {
      const idList = idsParam.split(',').map(Number).filter(Boolean)
      where.id = { in: idList }
    } else {
      if (search) {
        where.OR = [
          { mainCategory: { contains: search } },
          { subCategory: { contains: search } },
          { detailCategory: { contains: search } },
        ]
      }
      if (status) where.resultStatus = status
      if (environment) where.environment = environment
      if (category) where.mainCategory = { contains: category }
      if (creator) where.creatorId = Number(creator)
      if (folderIdParam) where.folderId = Number(folderIdParam)
    }

    const testcases = await db.testCase.findMany({ where, orderBy: { id: 'asc' } })

    const headers = ['ID', 'TC번호', '대분류', '중분류', '소분류', '사전조건', '테스트단계', '예상결과', '비고', '환경', '상태', '우선순위', '생성일']
    const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const rows = testcases.map((tc) => [
      tc.id,
      tc.tc_number ?? '',
      tc.mainCategory ?? '',
      tc.subCategory ?? '',
      tc.detailCategory ?? '',
      tc.preCondition ?? '',
      tc.testSteps ?? '',
      tc.expectedResult ?? '',
      tc.remark ?? '',
      tc.environment ?? '',
      tc.resultStatus ?? '',
      tc.priority ?? '',
      tc.createdAt.toISOString().slice(0, 10),
    ].map(escape).join(','))

    const bom = '\uFEFF'
    const csv = bom + [headers.map(escape).join(','), ...rows].join('\r\n')

    return c.body(csv, 200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="testcases.csv"',
    })
  } catch (e) {
    logger.error({ e }, '테스트케이스 다운로드 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// POST /testcases/upload  (주의: /:id 보다 먼저)
// ──────────────────────────────────────────────
testcasesExtendedRouter.post('/upload', requireAuth, async (c) => {
  return c.json({ error: 'Excel 파일 처리를 위해 별도 구현이 필요합니다. 현재 환경에서는 지원되지 않습니다.' }, 501)
})

// ──────────────────────────────────────────────
// PUT /testcases/:id/status
// ──────────────────────────────────────────────
testcasesExtendedRouter.put('/:id/status', async (c) => {
  const id = Number(c.req.param('id'))
  try {
    const testcase = await db.testCase.findUnique({ where: { id } })
    if (!testcase) return c.json({ error: '테스트 케이스를 찾을 수 없습니다' }, 404)

    const data = await c.req.json()
    const newStatus = data.status

    await db.testCase.update({ where: { id }, data: { resultStatus: newStatus } })

    // TestResult에도 기록
    await db.testResult.create({
      data: {
        testCaseId: id,
        result: newStatus,
        executionTime: data.execution_time ?? 0,
        notes: data.result_data ?? '',
        environment: testcase.environment ?? 'dev',
      },
    })

    return c.json({ status: 'success', message: 'Test case status updated successfully' })
  } catch (e) {
    logger.error({ e }, '테스트케이스 상태 업데이트 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /testcases/:id/screenshots
// ──────────────────────────────────────────────
testcasesExtendedRouter.get('/:id/screenshots', async (c) => {
  const id = Number(c.req.param('id'))
  try {
    const results = await db.testResult.findMany({ where: { testCaseId: id }, select: { id: true } })
    const resultIds = results.map((r) => r.id)
    if (resultIds.length === 0) return c.json([])

    const screenshots = await db.screenshot.findMany({ where: { testResultId: { in: resultIds } } })
    return c.json(screenshots.map((s) => ({
      id: s.id,
      screenshot_path: s.filePath,
      timestamp: s.createdAt?.toISOString() ?? null,
    })))
  } catch (e) {
    logger.error({ e }, '테스트케이스 스크린샷 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// POST /testcases/:id/execute
// ──────────────────────────────────────────────
testcasesExtendedRouter.post('/:id/execute', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  try {
    const testcase = await db.testCase.findUnique({ where: { id } })
    if (!testcase) return c.json({ error: '테스트 케이스를 찾을 수 없습니다' }, 404)

    const result = await db.testResult.create({
      data: {
        testCaseId: id,
        result: 'running',
        executionTime: 0,
        notes: 'Test execution started',
        environment: testcase.environment ?? 'dev',
      },
    })
    return c.json({ status: 'success', message: 'Test execution started', result_id: result.id })
  } catch (e) {
    logger.error({ e }, '테스트케이스 실행 오류')
    return c.json({ error: String(e) }, 500)
  }
})
