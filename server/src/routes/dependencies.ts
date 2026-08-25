import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { db } from '../lib/db.js'
import { requireAuth } from '../middleware/auth.js'
import { logger } from '../lib/logger.js'

export const dependenciesRouter = new Hono()

// ──────────────────────────────────────────────
// GET /dependencies/graph  (주의: /:id 보다 먼저)
// ──────────────────────────────────────────────
dependenciesRouter.get('/graph', async (c) => {
  try {
    const testCaseIdsStr = c.req.queries('test_case_ids')
    const testCaseIds = testCaseIdsStr ? testCaseIdsStr.map(Number) : null

    const where: Record<string, unknown> = { enabled: true }
    if (testCaseIds && testCaseIds.length > 0) {
      where.OR = [
        { testCaseId: { in: testCaseIds } },
        { dependsOnTestCaseId: { in: testCaseIds } },
      ]
    }

    const dependencies = await db.testDependency.findMany({
      where,
      include: {
        testCase: { select: { id: true, name: true } },
        dependsOn: { select: { id: true, name: true } },
      },
    })

    const nodes = new Map<number, { id: number; name: string }>()
    const edges = dependencies.map((d) => {
      nodes.set(d.testCaseId, { id: d.testCase.id, name: d.testCase.name })
      nodes.set(d.dependsOnTestCaseId, { id: d.dependsOn.id, name: d.dependsOn.name })
      return {
        from: d.testCaseId,
        to: d.dependsOnTestCaseId,
        type: d.dependencyType,
        priority: d.priority,
      }
    })

    return c.json({ nodes: Array.from(nodes.values()), edges })
  } catch (e) {
    logger.error({ e }, '의존성 그래프 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// POST /dependencies/execution-order  (주의: /:id 보다 먼저)
// ──────────────────────────────────────────────
dependenciesRouter.post('/execution-order', async (c) => {
  try {
    const data = await c.req.json()
    if (!data.test_case_ids?.length) return c.json({ error: 'test_case_ids는 필수입니다' }, 400)

    const testCaseIds: number[] = data.test_case_ids
    const dependencies = await db.testDependency.findMany({
      where: { testCaseId: { in: testCaseIds }, enabled: true },
      orderBy: { priority: 'asc' },
    })

    // 위상 정렬 (Kahn's algorithm)
    const inDegree = new Map<number, number>(testCaseIds.map((id) => [id, 0]))
    const graph = new Map<number, number[]>(testCaseIds.map((id) => [id, []]))

    for (const dep of dependencies) {
      if (inDegree.has(dep.testCaseId) && inDegree.has(dep.dependsOnTestCaseId)) {
        inDegree.set(dep.testCaseId, (inDegree.get(dep.testCaseId) ?? 0) + 1)
        graph.get(dep.dependsOnTestCaseId)?.push(dep.testCaseId)
      }
    }

    const queue = testCaseIds.filter((id) => (inDegree.get(id) ?? 0) === 0)
    const order: number[] = []
    while (queue.length > 0) {
      const current = queue.shift()!
      order.push(current)
      for (const next of graph.get(current) ?? []) {
        const deg = (inDegree.get(next) ?? 1) - 1
        inDegree.set(next, deg)
        if (deg === 0) queue.push(next)
      }
    }

    // 위상 정렬에 포함되지 않은 케이스 추가 (순환 의존성 처리)
    const missing = testCaseIds.filter((id) => !order.includes(id))
    order.push(...missing)

    const testCases = await db.testCase.findMany({ where: { id: { in: order } } })
    const tcMap = new Map(testCases.map((tc) => [tc.id, tc]))
    const orderedCases = order.map((id) => {
      const tc = tcMap.get(id)
      return tc ? { id: tc.id, name: tc.name } : { id, name: 'Unknown' }
    })

    return c.json({ execution_order: order, test_cases: orderedCases })
  } catch (e) {
    logger.error({ e }, '실행 순서 계산 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /dependencies/testcases/:testCaseId/check
// ──────────────────────────────────────────────
dependenciesRouter.get('/testcases/:testCaseId/check', async (c) => {
  const testCaseId = Number(c.req.param('testCaseId'))
  try {
    const dependencies = await db.testDependency.findMany({
      where: { testCaseId, enabled: true },
      include: { dependsOn: { include: { testResults: { orderBy: { executedAt: 'desc' }, take: 1 } } } },
    })

    const conditions = await Promise.all(dependencies.map(async (dep) => {
      const lastResult = dep.dependsOn.testResults[0]
      const isSatisfied = lastResult?.result === 'Pass'
      return {
        dependency_id: dep.id,
        depends_on_test_case_id: dep.dependsOnTestCaseId,
        depends_on_test_case_name: dep.dependsOn.name,
        dependency_type: dep.dependencyType,
        is_satisfied: isSatisfied,
        last_result: lastResult?.result ?? null,
      }
    }))

    return c.json({ test_case_id: testCaseId, conditions, all_satisfied: conditions.every((c) => c.is_satisfied) })
  } catch (e) {
    logger.error({ e }, '의존성 조건 확인 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /dependencies/testcases/:testCaseId/dependencies
// ──────────────────────────────────────────────
dependenciesRouter.get('/testcases/:testCaseId/dependencies', async (c) => {
  const testCaseId = Number(c.req.param('testCaseId'))
  try {
    const deps = await db.testDependency.findMany({
      where: { testCaseId, enabled: true },
      include: { dependsOn: { select: { id: true, name: true } } },
    })
    return c.json(deps.map(serializeDependency))
  } catch (e) {
    logger.error({ e }, '의존성 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /dependencies/testcases/:testCaseId/dependent
// ──────────────────────────────────────────────
dependenciesRouter.get('/testcases/:testCaseId/dependent', async (c) => {
  const testCaseId = Number(c.req.param('testCaseId'))
  try {
    const deps = await db.testDependency.findMany({
      where: { dependsOnTestCaseId: testCaseId, enabled: true },
      include: { testCase: { select: { id: true, name: true } } },
    })
    return c.json(deps.map(serializeDependency))
  } catch (e) {
    logger.error({ e }, '의존 테스트 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /dependencies
// ──────────────────────────────────────────────
dependenciesRouter.get('/', async (c) => {
  try {
    const testCaseId = c.req.query('test_case_id') ? Number(c.req.query('test_case_id')) : null
    const dependsOnId = c.req.query('depends_on_test_case_id') ? Number(c.req.query('depends_on_test_case_id')) : null

    const where: Record<string, unknown> = { enabled: true }
    if (testCaseId) where.testCaseId = testCaseId
    if (dependsOnId) where.dependsOnTestCaseId = dependsOnId

    const deps = await db.testDependency.findMany({ where, orderBy: { priority: 'asc' } })
    return c.json(deps.map(serializeDependency))
  } catch (e) {
    logger.error({ e }, '의존성 목록 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// POST /dependencies
// ──────────────────────────────────────────────
dependenciesRouter.post(
  '/',
  requireAuth,
  zValidator(
    'json',
    z.object({
      test_case_id: z.number(),
      depends_on_test_case_id: z.number(),
      dependency_type: z.string().default('required'),
      condition: z.record(z.unknown()).optional(),
      priority: z.number().default(1),
    }),
  ),
  async (c) => {
    const data = c.req.valid('json')
    try {
      if (data.test_case_id === data.depends_on_test_case_id) {
        return c.json({ error: '자기 자신에 대한 의존성은 생성할 수 없습니다' }, 400)
      }
      const dep = await db.testDependency.create({
        data: {
          testCaseId: data.test_case_id,
          dependsOnTestCaseId: data.depends_on_test_case_id,
          dependencyType: data.dependency_type,
          condition: data.condition ? JSON.stringify(data.condition) : null,
          priority: data.priority,
        },
      })
      return c.json({ message: '의존성이 생성되었습니다', dependency: serializeDependency(dep) }, 201)
    } catch (e) {
      logger.error({ e }, '의존성 생성 오류')
      return c.json({ error: String(e) }, 500)
    }
  },
)

// ──────────────────────────────────────────────
// PUT /dependencies/:id
// ──────────────────────────────────────────────
dependenciesRouter.put('/:id', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const dep = await db.testDependency.findUnique({ where: { id } })
  if (!dep) return c.json({ error: '의존성을 찾을 수 없습니다' }, 404)

  try {
    const data = await c.req.json()
    await db.testDependency.update({
      where: { id },
      data: {
        ...(data.dependency_type !== undefined && { dependencyType: data.dependency_type }),
        ...(data.condition !== undefined && {
          condition: data.condition ? JSON.stringify(data.condition) : null,
        }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.enabled !== undefined && { enabled: data.enabled }),
      },
    })
    const updated = await db.testDependency.findUnique({ where: { id } })
    return c.json({ message: '의존성이 수정되었습니다', dependency: serializeDependency(updated!) })
  } catch (e) {
    logger.error({ e }, '의존성 수정 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// DELETE /dependencies/:id
// ──────────────────────────────────────────────
dependenciesRouter.delete('/:id', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const dep = await db.testDependency.findUnique({ where: { id } })
  if (!dep) return c.json({ error: '의존성을 찾을 수 없습니다' }, 404)

  try {
    await db.testDependency.delete({ where: { id } })
    return c.json({ message: '의존성이 삭제되었습니다' })
  } catch (e) {
    logger.error({ e }, '의존성 삭제 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// 내부 헬퍼
// ──────────────────────────────────────────────
function serializeDependency(d: {
  id: number
  testCaseId: number
  dependsOnTestCaseId: number
  dependencyType: string
  condition: string | null
  priority: number
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: d.id,
    test_case_id: d.testCaseId,
    depends_on_test_case_id: d.dependsOnTestCaseId,
    dependency_type: d.dependencyType,
    condition: d.condition ? JSON.parse(d.condition) : null,
    priority: d.priority,
    enabled: d.enabled,
    created_at: d.createdAt.toISOString(),
    updated_at: d.updatedAt.toISOString(),
  }
}
