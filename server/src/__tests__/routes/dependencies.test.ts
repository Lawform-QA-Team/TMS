/**
 * routes/dependencies.ts 화이트박스 테스트
 *
 * 실제 모델: testDependency
 * 실제 경로: GET /, POST /, PUT /:id, DELETE /:id
 *            GET /graph, POST /execution-order
 *            GET /testcases/:testCaseId/check
 *            GET /testcases/:testCaseId/dependencies
 *            GET /testcases/:testCaseId/dependent
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

// ──────────────────────────────────────────────
// DB 모킹 (testDependency 모델)
// ──────────────────────────────────────────────

const mockDepFindMany = vi.fn()
const mockDepFindUnique = vi.fn()
const mockDepCreate = vi.fn()
const mockDepUpdate = vi.fn()
const mockDepDelete = vi.fn()
const mockTcFindMany = vi.fn()

vi.mock('../../lib/db.js', () => ({
  db: {
    testDependency: {
      findMany: (...a: unknown[]) => mockDepFindMany(...a),
      findUnique: (...a: unknown[]) => mockDepFindUnique(...a),
      create: (...a: unknown[]) => mockDepCreate(...a),
      update: (...a: unknown[]) => mockDepUpdate(...a),
      delete: (...a: unknown[]) => mockDepDelete(...a),
    },
    testCase: {
      findMany: (...a: unknown[]) => mockTcFindMany(...a),
    },
  },
}))

vi.mock('../../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

vi.mock('../../middleware/auth.js', () => ({
  requireAuth: vi.fn(async (_c: unknown, next: () => Promise<void>) => next()),
}))

// ──────────────────────────────────────────────
// 헬퍼
// ──────────────────────────────────────────────

function makeDep(id: number, tcId = 1, depOnId = 2, type = 'required') {
  return {
    id,
    testCaseId: tcId,
    dependsOnTestCaseId: depOnId,
    dependencyType: type,
    condition: null,
    priority: 1,
    enabled: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    testCase: { id: tcId, name: `TC-${tcId}` },
    dependsOn: { id: depOnId, name: `TC-${depOnId}`, testResults: [] },
  }
}

async function buildApp() {
  const { dependenciesRouter } = await import('../../routes/dependencies.js')
  const app = new Hono()
  app.route('/', dependenciesRouter)
  return app
}

describe('dependencies router', () => {
  let app: Hono

  beforeEach(async () => {
    vi.resetModules()
    mockDepFindMany.mockReset()
    mockDepFindUnique.mockReset()
    mockDepCreate.mockReset()
    mockDepUpdate.mockReset()
    mockDepDelete.mockReset()
    mockTcFindMany.mockReset()
    app = await buildApp()
  })

  // ────────────────────────────────────────
  // GET / — 의존성 목록
  // ────────────────────────────────────────

  describe('GET /', () => {
    it('전체 목록 반환 (enabled: true 필터 기본)', async () => {
      mockDepFindMany.mockResolvedValue([makeDep(1), makeDep(2)])
      const res = await app.request('/')
      expect(res.status).toBe(200)
      const body = await res.json() as unknown[]
      expect(body).toHaveLength(2)
    })

    it('test_case_id 쿼리로 필터링', async () => {
      mockDepFindMany.mockResolvedValue([])
      await app.request('/?test_case_id=5')
      expect(mockDepFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ testCaseId: 5 }) }),
      )
    })

    it('depends_on_test_case_id 쿼리로 필터링', async () => {
      mockDepFindMany.mockResolvedValue([])
      await app.request('/?depends_on_test_case_id=10')
      expect(mockDepFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ dependsOnTestCaseId: 10 }) }),
      )
    })
  })

  // ────────────────────────────────────────
  // POST / — 의존성 생성
  // ────────────────────────────────────────

  describe('POST /', () => {
    it('정상 생성 → 201', async () => {
      mockDepCreate.mockResolvedValue(makeDep(10, 1, 2))
      const res = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_case_id: 1, depends_on_test_case_id: 2, dependency_type: 'required', priority: 1 }),
      })
      expect(res.status).toBe(201)
    })

    it('자기 자신 참조 → 400', async () => {
      const res = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_case_id: 1, depends_on_test_case_id: 1 }),
      })
      expect(res.status).toBe(400)
    })

    it('필수 필드 누락 → 400 (zod validation)', async () => {
      const res = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_case_id: 1 }), // depends_on_test_case_id 없음
      })
      expect(res.status).toBe(400)
    })
  })

  // ────────────────────────────────────────
  // DELETE /:id
  // ────────────────────────────────────────

  describe('DELETE /:id', () => {
    it('존재하는 의존성 삭제 → 200', async () => {
      mockDepFindUnique.mockResolvedValue(makeDep(5))
      mockDepDelete.mockResolvedValue({})
      const res = await app.request('/5', { method: 'DELETE' })
      expect(res.status).toBe(200)
    })

    it('미존재 → 404', async () => {
      mockDepFindUnique.mockResolvedValue(null)
      const res = await app.request('/999', { method: 'DELETE' })
      expect(res.status).toBe(404)
    })
  })

  // ────────────────────────────────────────
  // PUT /:id
  // ────────────────────────────────────────

  describe('PUT /:id', () => {
    it('존재하는 의존성 수정 → 200', async () => {
      mockDepFindUnique
        .mockResolvedValueOnce(makeDep(3))   // 첫 번째: 존재 확인
        .mockResolvedValueOnce(makeDep(3))   // 두 번째: update 후 조회
      mockDepUpdate.mockResolvedValue(makeDep(3))
      const res = await app.request('/3', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: 2, enabled: false }),
      })
      expect(res.status).toBe(200)
    })

    it('미존재 → 404', async () => {
      mockDepFindUnique.mockResolvedValue(null)
      const res = await app.request('/404', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: 2 }),
      })
      expect(res.status).toBe(404)
    })
  })

  // ────────────────────────────────────────
  // GET /graph
  // ────────────────────────────────────────

  describe('GET /graph', () => {
    it('nodes + edges 반환', async () => {
      mockDepFindMany.mockResolvedValue([
        { ...makeDep(1, 10, 20), testCase: { id: 10, name: 'TC-10' }, dependsOn: { id: 20, name: 'TC-20' }, dependencyType: 'required', priority: 1 },
        { ...makeDep(2, 20, 30), testCase: { id: 20, name: 'TC-20' }, dependsOn: { id: 30, name: 'TC-30' }, dependencyType: 'required', priority: 1 },
      ])
      const res = await app.request('/graph')
      expect(res.status).toBe(200)
      const body = await res.json() as { nodes: unknown[]; edges: unknown[] }
      expect(body.nodes.length).toBeGreaterThanOrEqual(3) // TC 10, 20, 30
      expect(body.edges).toHaveLength(2)
    })

    it('의존성 없으면 빈 그래프', async () => {
      mockDepFindMany.mockResolvedValue([])
      const res = await app.request('/graph')
      const body = await res.json() as { nodes: unknown[]; edges: unknown[] }
      expect(body.nodes).toHaveLength(0)
      expect(body.edges).toHaveLength(0)
    })
  })

  // ────────────────────────────────────────
  // POST /execution-order (Kahn's 위상 정렬)
  // ────────────────────────────────────────

  describe('POST /execution-order', () => {
    it('필수 필드 누락 → 400', async () => {
      const res = await app.request('/execution-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      expect(res.status).toBe(400)
    })

    it('빈 배열 → 400', async () => {
      const res = await app.request('/execution-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_case_ids: [] }),
      })
      expect(res.status).toBe(400)
    })

    it('정상 위상 정렬: TC1 → TC2 → TC3 순서', async () => {
      // TC2가 TC1에 의존, TC3이 TC2에 의존
      mockDepFindMany.mockResolvedValue([
        { testCaseId: 2, dependsOnTestCaseId: 1, dependencyType: 'required', priority: 1, enabled: true },
        { testCaseId: 3, dependsOnTestCaseId: 2, dependencyType: 'required', priority: 1, enabled: true },
      ])
      mockTcFindMany.mockResolvedValue([
        { id: 1, name: 'TC-1' },
        { id: 2, name: 'TC-2' },
        { id: 3, name: 'TC-3' },
      ])

      const res = await app.request('/execution-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_case_ids: [1, 2, 3] }),
      })

      expect(res.status).toBe(200)
      const body = await res.json() as { execution_order: number[] }
      expect(body.execution_order.indexOf(1)).toBeLessThan(body.execution_order.indexOf(2))
      expect(body.execution_order.indexOf(2)).toBeLessThan(body.execution_order.indexOf(3))
    })

    it('순환 의존성: 400 없이 missing 추가로 처리 후 200', async () => {
      // TC1 → TC2, TC2 → TC1 (순환) — 코드는 400 반환 안 하고 missing 처리
      mockDepFindMany.mockResolvedValue([
        { testCaseId: 2, dependsOnTestCaseId: 1, dependencyType: 'required', priority: 1, enabled: true },
        { testCaseId: 1, dependsOnTestCaseId: 2, dependencyType: 'required', priority: 1, enabled: true },
      ])
      mockTcFindMany.mockResolvedValue([
        { id: 1, name: 'TC-1' },
        { id: 2, name: 'TC-2' },
      ])

      const res = await app.request('/execution-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_case_ids: [1, 2] }),
      })
      // 순환 의존성도 200으로 처리됨 (코드가 missing에 추가)
      expect(res.status).toBe(200)
    })
  })

  // ────────────────────────────────────────
  // GET /testcases/:testCaseId/check
  // ────────────────────────────────────────

  describe('GET /testcases/:testCaseId/check', () => {
    it('의존성 있고 모두 만족 → all_satisfied: true', async () => {
      mockDepFindMany.mockResolvedValue([
        {
          ...makeDep(1, 5, 3),
          dependsOn: {
            id: 3, name: 'TC-3',
            testResults: [{ result: 'Pass' }],
          },
          dependencyType: 'required',
        },
      ])
      const res = await app.request('/testcases/5/check')
      expect(res.status).toBe(200)
      const body = await res.json() as { all_satisfied: boolean }
      expect(body.all_satisfied).toBe(true)
    })

    it('의존성이 Fail 결과 → all_satisfied: false', async () => {
      mockDepFindMany.mockResolvedValue([
        {
          ...makeDep(1, 5, 3),
          dependsOn: {
            id: 3, name: 'TC-3',
            testResults: [{ result: 'Fail' }],
          },
          dependencyType: 'required',
        },
      ])
      const res = await app.request('/testcases/5/check')
      const body = await res.json() as { all_satisfied: boolean }
      expect(body.all_satisfied).toBe(false)
    })

    it('의존성 없으면 all_satisfied: true', async () => {
      mockDepFindMany.mockResolvedValue([])
      const res = await app.request('/testcases/5/check')
      const body = await res.json() as { all_satisfied: boolean }
      expect(body.all_satisfied).toBe(true)
    })
  })

  // ────────────────────────────────────────
  // GET /testcases/:testCaseId/dependencies
  // ────────────────────────────────────────

  describe('GET /testcases/:testCaseId/dependencies', () => {
    it('해당 TC의 의존성 목록 반환', async () => {
      mockDepFindMany.mockResolvedValue([makeDep(1, 7, 3)])
      const res = await app.request('/testcases/7/dependencies')
      expect(res.status).toBe(200)
      const body = await res.json() as unknown[]
      expect(body).toHaveLength(1)
    })
  })

  // ────────────────────────────────────────
  // GET /testcases/:testCaseId/dependent
  // ────────────────────────────────────────

  describe('GET /testcases/:testCaseId/dependent', () => {
    it('이 TC에 의존하는 TC 목록 반환', async () => {
      mockDepFindMany.mockResolvedValue([
        { ...makeDep(2, 8, 7), testCase: { id: 8, name: 'TC-8' } },
      ])
      const res = await app.request('/testcases/7/dependent')
      expect(res.status).toBe(200)
    })
  })
})
