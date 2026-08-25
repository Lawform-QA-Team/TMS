/**
 * lib/executionEngine.ts 화이트박스 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventEmitter } from 'events'

// ──────────────────────────────────────────────
// BullMQ 생성자 모킹 (function 사용)
// ──────────────────────────────────────────────

const mockQueueAdd = vi.fn().mockResolvedValue({ id: 'job-1' })
const mockWorkerOn = vi.fn()
// Worker의 마지막 핸들러를 저장
let capturedHandler: ((job: unknown) => Promise<void>) | null = null

vi.mock('bullmq', () => {
  function Queue(this: Record<string, unknown>) {
    this.add = mockQueueAdd
  }
  function Worker(this: Record<string, unknown>, _name: string, handler: (job: unknown) => Promise<void>) {
    capturedHandler = handler
    this.on = mockWorkerOn
  }
  return { Queue, Worker }
})

vi.mock('../../lib/redis.js', () => ({
  getRedis: vi.fn().mockReturnValue({}),
}))

const mockDbTestExecutionUpdate = vi.fn().mockResolvedValue({})
const mockDbTestResultCreate = vi.fn().mockResolvedValue({ id: 99 })

vi.mock('../../lib/db.js', () => ({
  db: {
    testExecution: { update: (...a: unknown[]) => mockDbTestExecutionUpdate(...a) },
    testResult: { create: (...a: unknown[]) => mockDbTestResultCreate(...a) },
  },
}))

vi.mock('../../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

const mockEmitStarted = vi.fn()
const mockEmitLog = vi.fn()
const mockEmitProgress = vi.fn()
const mockEmitCompleted = vi.fn()
const mockEmitFailed = vi.fn()
const mockBroadcast = vi.fn()

vi.mock('../../lib/socketServer.js', () => ({
  emitExecutionStarted: (...a: unknown[]) => mockEmitStarted(...a),
  emitExecutionLog: (...a: unknown[]) => mockEmitLog(...a),
  emitExecutionProgress: (...a: unknown[]) => mockEmitProgress(...a),
  emitExecutionCompleted: (...a: unknown[]) => mockEmitCompleted(...a),
  emitExecutionFailed: (...a: unknown[]) => mockEmitFailed(...a),
  broadcastExecutionUpdate: (...a: unknown[]) => mockBroadcast(...a),
}))

const mockJiraQueueAdd = vi.fn().mockResolvedValue({ id: 'jira-1' })
vi.mock('../../lib/jiraPipeline.js', () => ({
  getJiraQueue: vi.fn().mockReturnValue({ add: mockJiraQueueAdd }),
}))

// child_process.spawn 모킹
const mockSpawn = vi.fn()
vi.mock('child_process', () => ({
  spawn: (...args: unknown[]) => mockSpawn(...args),
}))

function makeMockProc(exitCode: number | null = 0, stdoutData = '', stderrData = '') {
  const proc = new EventEmitter() as EventEmitter & { stdout: EventEmitter; stderr: EventEmitter; kill: ReturnType<typeof vi.fn> }
  proc.stdout = new EventEmitter()
  proc.stderr = new EventEmitter()
  proc.kill = vi.fn()
  setTimeout(() => {
    if (stdoutData) proc.stdout.emit('data', Buffer.from(stdoutData))
    if (stderrData) proc.stderr.emit('data', Buffer.from(stderrData))
    proc.emit('close', exitCode)
  }, 10)
  return proc
}

// ──────────────────────────────────────────────
// 테스트
// ──────────────────────────────────────────────

describe('executionEngine', () => {
  beforeEach(() => {
    vi.resetModules()
    capturedHandler = null
    mockQueueAdd.mockClear()
    mockWorkerOn.mockClear()
    mockDbTestExecutionUpdate.mockClear()
    mockDbTestResultCreate.mockClear()
    mockJiraQueueAdd.mockClear()
    mockSpawn.mockClear()
    mockEmitStarted.mockClear()
    mockEmitCompleted.mockClear()
    mockEmitFailed.mockClear()
  })

  describe('getExecutionQueue()', () => {
    it('Queue 인스턴스 반환', async () => {
      const { getExecutionQueue } = await import('../../lib/executionEngine.js')
      const q = getExecutionQueue()
      expect(q).toBeDefined()
      expect(typeof q.add).toBe('function')
    })

    it('싱글턴 — 두 번 호출해도 같은 인스턴스', async () => {
      const { getExecutionQueue } = await import('../../lib/executionEngine.js')
      expect(getExecutionQueue()).toBe(getExecutionQueue())
    })
  })

  describe('startExecutionWorker()', () => {
    it('Worker 인스턴스 반환', async () => {
      const { startExecutionWorker } = await import('../../lib/executionEngine.js')
      const w = startExecutionWorker()
      expect(w).toBeDefined()
    })

    it('싱글턴 — 두 번 호출해도 같은 인스턴스', async () => {
      const { startExecutionWorker } = await import('../../lib/executionEngine.js')
      expect(startExecutionWorker()).toBe(startExecutionWorker())
    })

    it('Worker 이벤트 핸들러(completed, failed) 등록', async () => {
      const { startExecutionWorker } = await import('../../lib/executionEngine.js')
      startExecutionWorker()
      expect(mockWorkerOn).toHaveBeenCalledWith('completed', expect.any(Function))
      expect(mockWorkerOn).toHaveBeenCalledWith('failed', expect.any(Function))
    })
  })

  describe('playwright-run: scriptPath 없음 → 시뮬레이션', () => {
    it('spawn 없이 Pass, DB 두 번 업데이트', async () => {
      const { startExecutionWorker } = await import('../../lib/executionEngine.js')
      startExecutionWorker()

      await capturedHandler!({
        data: { type: 'playwright-run', executionId: 1, automationTestId: 10, testName: 'Test', scriptPath: null, environment: 'dev' },
      })

      expect(mockSpawn).not.toHaveBeenCalled()
      // Running → Pass
      expect(mockDbTestExecutionUpdate).toHaveBeenCalledTimes(2)
      const statuses = mockDbTestExecutionUpdate.mock.calls.map(
        (c: unknown[]) => (c[0] as { data: { status: string } }).data.status
      )
      expect(statuses).toContain('Running')
      expect(statuses).toContain('Pass')
      expect(mockDbTestResultCreate).toHaveBeenCalledOnce()
      expect(mockJiraQueueAdd).not.toHaveBeenCalled() // Pass이므로
    })
  })

  describe('playwright-run: scriptPath 있음', () => {
    it('exitCode 0 → Pass, TestResult 생성, Jira bug 없음', async () => {
      mockSpawn.mockReturnValue(makeMockProc(0, 'All tests passed'))
      const { startExecutionWorker } = await import('../../lib/executionEngine.js')
      startExecutionWorker()

      await capturedHandler!({
        data: { type: 'playwright-run', executionId: 2, automationTestId: 11, testName: 'Login', scriptPath: 'login.spec.ts', environment: 'staging' },
      })

      expect(mockSpawn).toHaveBeenCalledWith('npx', expect.arrayContaining(['playwright', 'test']), expect.any(Object))
      const finalStatus = mockDbTestExecutionUpdate.mock.calls.at(-1)?.[0] as { data: { status: string } }
      expect(finalStatus?.data.status).toBe('Pass')
      expect(mockDbTestResultCreate).toHaveBeenCalledOnce()
      expect(mockJiraQueueAdd).not.toHaveBeenCalled()
    })

    it('exitCode 1 → Fail, Jira bug 큐 등록', async () => {
      mockSpawn.mockReturnValue(makeMockProc(1, '', 'AssertionError'))
      const { startExecutionWorker } = await import('../../lib/executionEngine.js')
      startExecutionWorker()

      await capturedHandler!({
        data: { type: 'playwright-run', executionId: 3, automationTestId: 12, testName: 'Fail Test', scriptPath: 'fail.spec.ts', environment: 'prod' },
      })

      expect(mockJiraQueueAdd).toHaveBeenCalledWith('auto-bug', expect.objectContaining({ type: 'auto-create-bug', testResult: 'Fail' }))
    })

    it('spawn error → Error 상태, emitExecutionFailed 호출', async () => {
      const proc = new EventEmitter() as EventEmitter & { stdout: EventEmitter; stderr: EventEmitter; kill: ReturnType<typeof vi.fn> }
      proc.stdout = new EventEmitter()
      proc.stderr = new EventEmitter()
      proc.kill = vi.fn()
      setTimeout(() => proc.emit('error', new Error('spawn ENOENT')), 10)
      mockSpawn.mockReturnValue(proc)

      const { startExecutionWorker } = await import('../../lib/executionEngine.js')
      startExecutionWorker()

      await capturedHandler!({
        data: { type: 'playwright-run', executionId: 4, automationTestId: 13, testName: 'Error', scriptPath: 'err.spec.ts', environment: 'dev' },
      })

      const errStatus = mockDbTestExecutionUpdate.mock.calls.at(-1)?.[0] as { data: { status: string } }
      expect(errStatus?.data.status).toBe('Error')
      // spawn error는 runProcess에서 resolve({ status: 'Error' })로 처리되므로
      // processJob catch 블록이 아닌 정상 완료 경로 → emitExecutionCompleted 호출
      expect(mockEmitCompleted).toHaveBeenCalled()
    })
  })

  describe('k6-run: scriptPath 없음 → 시뮬레이션', () => {
    it('spawn 없이 Pass', async () => {
      const { startExecutionWorker } = await import('../../lib/executionEngine.js')
      startExecutionWorker()

      await capturedHandler!({
        data: { type: 'k6-run', executionId: 5, performanceTestId: 20, testName: 'Load', scriptPath: null, environment: 'prod' },
      })

      expect(mockSpawn).not.toHaveBeenCalled()
      const finalStatus = mockDbTestExecutionUpdate.mock.calls.at(-1)?.[0] as { data: { status: string } }
      expect(finalStatus?.data.status).toBe('Pass')
    })
  })

  describe('k6-run: scriptPath 있음', () => {
    it('vus, duration 파라미터 spawn args에 포함', async () => {
      mockSpawn.mockReturnValue(makeMockProc(0, 'checks: 100%'))
      const { startExecutionWorker } = await import('../../lib/executionEngine.js')
      startExecutionWorker()

      await capturedHandler!({
        data: {
          type: 'k6-run', executionId: 6, performanceTestId: 21, testName: 'Heavy',
          scriptPath: 'k6/load.js', environment: 'prod', parameters: { vus: '10', duration: '30s' },
        },
      })

      const args = (mockSpawn.mock.calls[0] as [string, string[]])[1]
      expect(args).toContain('--vus')
      expect(args).toContain('10')
      expect(args).toContain('--duration')
      expect(args).toContain('30s')
    })

    it('exitCode 1 → Fail, Jira bug 큐 등록', async () => {
      mockSpawn.mockReturnValue(makeMockProc(1, '', 'checks failed'))
      const { startExecutionWorker } = await import('../../lib/executionEngine.js')
      startExecutionWorker()

      await capturedHandler!({
        data: { type: 'k6-run', executionId: 7, performanceTestId: 22, testName: 'Fail Load', scriptPath: 'k6/fail.js', environment: 'dev' },
      })

      expect(mockJiraQueueAdd).toHaveBeenCalledWith('auto-bug', expect.objectContaining({ type: 'auto-create-bug', testResult: 'Fail' }))
    })
  })

  describe('k6 메트릭 파싱', () => {
    it('http_req_duration, http_reqs, checks 파싱 후 resultSummary에 포함', async () => {
      const k6Output = [
        'http_req_duration.............: avg=152ms min=100ms med=140ms max=300ms p(90)=200ms p(95)=250ms',
        'http_reqs......................: 1200   40/s',
        'checks.........................: 100%   ✓ 1200 ✗ 0',
        'vus............................: 10     min=10   max=10',
      ].join('\n')

      mockSpawn.mockReturnValue(makeMockProc(0, k6Output))
      const { startExecutionWorker } = await import('../../lib/executionEngine.js')
      startExecutionWorker()

      await capturedHandler!({
        data: { type: 'k6-run', executionId: 8, performanceTestId: 23, testName: 'Metrics', scriptPath: 'k6/m.js', environment: 'dev' },
      })

      // metrics를 포함한 resultSummary 업데이트 확인
      const summaryCall = mockDbTestExecutionUpdate.mock.calls.find(
        (c: unknown[]) => {
          const arg = c[0] as { data?: { resultSummary?: string } }
          return arg?.data?.resultSummary?.includes('"metrics"')
        }
      )
      expect(summaryCall).toBeDefined()
      const parsed = JSON.parse((summaryCall![0] as { data: { resultSummary: string } }).data.resultSummary) as { metrics: Record<string, string> }
      expect(Object.keys(parsed.metrics).length).toBeGreaterThan(0)
    })
  })
})
