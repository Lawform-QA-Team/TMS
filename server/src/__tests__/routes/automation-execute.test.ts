/**
 * routes/automation.ts + performance.ts — execute 엔드포인트 화이트박스 테스트
 *
 * 커버 경로:
 * - POST /automation-tests/:id/execute: 큐 등록, 202 응답, 미존재 404
 * - POST /performance-tests/:id/execute: 큐 등록, 202 응답, 미존재 404
 * - 파라미터 오버라이드: body.environment, body.parameters 우선 적용
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

// ──────────────────────────────────────────────
// 모킹
// ──────────────────────────────────────────────

const mockAutoFindUnique = vi.fn()
const mockPerfFindUnique = vi.fn()
const mockExecCreate = vi.fn()

vi.mock('../../lib/db.js', () => ({
  db: {
    automationTest: {
      findUnique: (...a: unknown[]) => mockAutoFindUnique(...a),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    performanceTest: {
      findUnique: (...a: unknown[]) => mockPerfFindUnique(...a),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    testExecution: {
      create: (...a: unknown[]) => mockExecCreate(...a),
    },
    testResult: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    screenshot: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}))

const mockQueueAdd = vi.fn().mockResolvedValue({ id: 'exec-job-1' })
vi.mock('../../lib/executionEngine.js', () => ({
  getExecutionQueue: vi.fn().mockReturnValue({ add: mockQueueAdd }),
}))

vi.mock('../../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

vi.mock('../../middleware/auth.js', () => ({
  requireAuth: vi.fn(async (c: { set: (k: string, v: unknown) => void }, next: () => Promise<void>) => {
    c.set('user', { sub: '1', username: 'tester', role: 'admin' })
    return next()
  }),
  requireAdmin: vi.fn(async (_c: unknown, next: () => Promise<void>) => next()),
}))

// ──────────────────────────────────────────────
// 앱 구성
// ──────────────────────────────────────────────

async function buildAutoApp() {
  const { automationRouter } = await import('../../routes/automation.js')
  const app = new Hono()
  app.route('/', automationRouter)
  return app
}

async function buildPerfApp() {
  const { performanceRouter } = await import('../../routes/performance.js')
  const app = new Hono()
  app.route('/', performanceRouter)
  return app
}

const makeAutoTest = (id = 1) => ({
  id,
  name: 'Login Automation',
  description: 'Automates login flow',
  scriptPath: 'playwright/login.spec.ts',
  environment: 'dev',
  parameters: null,
  creatorId: 1,
  assigneeId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
})

const makePerfTest = (id = 1) => ({
  id,
  name: 'API Load Test',
  description: 'k6 load test',
  scriptPath: 'k6/api-load.js',
  environment: 'prod',
  parameters: JSON.stringify({ vus: '10', duration: '30s' }),
  creatorId: 1,
  assigneeId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
})

// ──────────────────────────────────────────────
// Automation Execute 테스트
// ──────────────────────────────────────────────

describe('POST /automation-tests/:id/execute', () => {
  let app: Hono

  beforeEach(async () => {
    vi.resetModules()
    mockAutoFindUnique.mockClear()
    mockExecCreate.mockClear()
    mockQueueAdd.mockClear()
    app = await buildAutoApp()
  })

  it('정상 실행 → 202 Accepted + job_id 반환', async () => {
    mockAutoFindUnique.mockResolvedValue(makeAutoTest())
    mockExecCreate.mockResolvedValue({ id: 100 })

    const res = await app.request('/1/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    expect(res.status).toBe(202)
    const body = await res.json() as { execution_id: number; job_id: string; status: string }
    expect(body.execution_id).toBe(100)
    expect(body.job_id).toBe('exec-job-1')
    expect(body.status).toBe('Pending')
  })

  it('BullMQ에 playwright-run 타입으로 등록', async () => {
    mockAutoFindUnique.mockResolvedValue(makeAutoTest())
    mockExecCreate.mockResolvedValue({ id: 101 })

    await app.request('/1/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    expect(mockQueueAdd).toHaveBeenCalledWith(
      'playwright-run',
      expect.objectContaining({
        type: 'playwright-run',
        automationTestId: 1,
        scriptPath: 'playwright/login.spec.ts',
        environment: 'dev',
      }),
    )
  })

  it('body.environment가 test의 environment보다 우선', async () => {
    mockAutoFindUnique.mockResolvedValue(makeAutoTest())
    mockExecCreate.mockResolvedValue({ id: 102 })

    await app.request('/1/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ environment: 'staging' }),
    })

    expect(mockQueueAdd).toHaveBeenCalledWith(
      'playwright-run',
      expect.objectContaining({ environment: 'staging' }),
    )
  })

  it('TestExecution 레코드가 Pending 상태로 생성됨', async () => {
    mockAutoFindUnique.mockResolvedValue(makeAutoTest())
    mockExecCreate.mockResolvedValue({ id: 103 })

    await app.request('/1/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    expect(mockExecCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          automationTestId: 1,
          testType: 'playwright',
          status: 'Pending',
        }),
      }),
    )
  })

  it('미존재 자동화 테스트 → 404', async () => {
    mockAutoFindUnique.mockResolvedValue(null)
    const res = await app.request('/999/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(404)
    expect(mockQueueAdd).not.toHaveBeenCalled()
  })
})

// ──────────────────────────────────────────────
// Performance Execute 테스트
// ──────────────────────────────────────────────

describe('POST /performance-tests/:id/execute', () => {
  let app: Hono

  beforeEach(async () => {
    vi.resetModules()
    mockPerfFindUnique.mockClear()
    mockExecCreate.mockClear()
    mockQueueAdd.mockClear()
    app = await buildPerfApp()
  })

  it('정상 실행 → 202 Accepted + job_id 반환', async () => {
    mockPerfFindUnique.mockResolvedValue(makePerfTest())
    mockExecCreate.mockResolvedValue({ id: 200 })

    const res = await app.request('/1/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    expect(res.status).toBe(202)
    const body = await res.json() as { execution_id: number; status: string }
    expect(body.execution_id).toBe(200)
    expect(body.status).toBe('Pending')
  })

  it('BullMQ에 k6-run 타입으로 등록', async () => {
    mockPerfFindUnique.mockResolvedValue(makePerfTest())
    mockExecCreate.mockResolvedValue({ id: 201 })

    await app.request('/1/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    expect(mockQueueAdd).toHaveBeenCalledWith(
      'k6-run',
      expect.objectContaining({
        type: 'k6-run',
        performanceTestId: 1,
        scriptPath: 'k6/api-load.js',
        environment: 'prod',
      }),
    )
  })

  it('body.parameters가 test.parameters보다 우선', async () => {
    mockPerfFindUnique.mockResolvedValue(makePerfTest())
    mockExecCreate.mockResolvedValue({ id: 202 })

    await app.request('/1/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parameters: { vus: '50', duration: '60s' } }),
    })

    expect(mockQueueAdd).toHaveBeenCalledWith(
      'k6-run',
      expect.objectContaining({ parameters: { vus: '50', duration: '60s' } }),
    )
  })

  it('TestExecution 레코드가 k6 타입, Pending으로 생성됨', async () => {
    mockPerfFindUnique.mockResolvedValue(makePerfTest())
    mockExecCreate.mockResolvedValue({ id: 203 })

    await app.request('/1/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    expect(mockExecCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          performanceTestId: 1,
          testType: 'k6',
          status: 'Pending',
        }),
      }),
    )
  })

  it('미존재 성능 테스트 → 404', async () => {
    mockPerfFindUnique.mockResolvedValue(null)
    const res = await app.request('/999/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(404)
    expect(mockQueueAdd).not.toHaveBeenCalled()
  })
})
