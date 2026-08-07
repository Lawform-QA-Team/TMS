/**
 * lib/socketServer.ts 화이트박스 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ──────────────────────────────────────────────
// Socket.IO 생성자 모킹 (function 사용 — arrow fn은 constructor 불가)
// ──────────────────────────────────────────────

const mockTo = vi.fn().mockReturnThis()
const mockEmit = vi.fn().mockReturnThis()
const mockOn = vi.fn()

vi.mock('socket.io', () => {
  function MockServer(this: Record<string, unknown>) {
    this.on = mockOn
    this.to = mockTo
    this.emit = mockEmit
  }
  return { Server: MockServer }
})

vi.mock('../../lib/logger.js', () => ({
  logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

describe('socketServer', () => {
  describe('getIO() — 초기화 전', () => {
    it('초기화 전 getIO() 호출 시 Error throw', async () => {
      vi.resetModules()
      const { getIO } = await import('../../lib/socketServer.js')
      expect(() => getIO()).toThrow('초기화되지 않았습니다')
    })
  })

  describe('initSocketServer()', () => {
    beforeEach(() => {
      vi.resetModules()
      mockTo.mockClear()
      mockEmit.mockClear()
      mockOn.mockClear()
    })

    it('초기화 후 getIO()가 인스턴스를 반환', async () => {
      const mod = await import('../../lib/socketServer.js')
      mod.initSocketServer({} as import('http').Server)
      expect(() => mod.getIO()).not.toThrow()
    })

    it('두 번 호출해도 같은 인스턴스 반환 (싱글턴)', async () => {
      const mod = await import('../../lib/socketServer.js')
      const io1 = mod.initSocketServer({} as import('http').Server)
      const io2 = mod.initSocketServer({} as import('http').Server)
      expect(io1).toBe(io2)
    })
  })

  describe('emit 헬퍼들 — _io null 시 무시', () => {
    beforeEach(() => {
      vi.resetModules()
    })

    it('emitExecutionStarted: _io null 시 throw 없음', async () => {
      const mod = await import('../../lib/socketServer.js')
      expect(() => mod.emitExecutionStarted({ executionId: 1, testId: 1, testType: 'playwright', testName: 't' })).not.toThrow()
    })
    it('emitExecutionLog: _io null 시 throw 없음', async () => {
      const mod = await import('../../lib/socketServer.js')
      expect(() => mod.emitExecutionLog(1, 'log')).not.toThrow()
    })
    it('emitExecutionProgress: _io null 시 throw 없음', async () => {
      const mod = await import('../../lib/socketServer.js')
      expect(() => mod.emitExecutionProgress(1, 50)).not.toThrow()
    })
    it('emitExecutionCompleted: _io null 시 throw 없음', async () => {
      const mod = await import('../../lib/socketServer.js')
      expect(() => mod.emitExecutionCompleted(1, { status: 'Pass', duration: 1 })).not.toThrow()
    })
    it('emitExecutionFailed: _io null 시 throw 없음', async () => {
      const mod = await import('../../lib/socketServer.js')
      expect(() => mod.emitExecutionFailed(1, 'err')).not.toThrow()
    })
    it('broadcastExecutionUpdate: _io null 시 throw 없음', async () => {
      const mod = await import('../../lib/socketServer.js')
      expect(() => mod.broadcastExecutionUpdate({ type: 'k6' })).not.toThrow()
    })
  })

  describe('emit 헬퍼들 — _io 초기화 후', () => {
    let mod: typeof import('../../lib/socketServer.js')

    beforeEach(async () => {
      vi.resetModules()
      mockTo.mockClear()
      mockEmit.mockClear()
      mockOn.mockClear()
      mod = await import('../../lib/socketServer.js')
      mod.initSocketServer({} as import('http').Server)
    })

    it('emitExecutionStarted: to(room).emit 호출', () => {
      mod.emitExecutionStarted({ executionId: 42, testId: 1, testType: 'playwright', testName: 'test' })
      expect(mockTo).toHaveBeenCalledWith('execution:42')
      expect(mockEmit).toHaveBeenCalledWith('execution:started', expect.objectContaining({ executionId: 42 }))
    })

    it('emitExecutionLog: to(room).emit 호출', () => {
      mod.emitExecutionLog(10, 'log line')
      expect(mockTo).toHaveBeenCalledWith('execution:10')
      expect(mockEmit).toHaveBeenCalledWith('execution:log', expect.objectContaining({ log: 'log line' }))
    })

    it('emitExecutionProgress: percent, message 포함', () => {
      mod.emitExecutionProgress(5, 75, '실행 중')
      expect(mockEmit).toHaveBeenCalledWith('execution:progress', expect.objectContaining({ percent: 75, message: '실행 중' }))
    })

    it('emitExecutionCompleted: status, duration 포함', () => {
      mod.emitExecutionCompleted(3, { status: 'Pass', duration: 2.5 })
      expect(mockEmit).toHaveBeenCalledWith('execution:completed', expect.objectContaining({ status: 'Pass', duration: 2.5 }))
    })

    it('emitExecutionFailed: error 메시지 포함', () => {
      mod.emitExecutionFailed(7, 'assertion failed')
      expect(mockEmit).toHaveBeenCalledWith('execution:failed', expect.objectContaining({ error: 'assertion failed' }))
    })

    it('broadcastExecutionUpdate: io.emit 직접 호출 (룸 없음)', () => {
      mod.broadcastExecutionUpdate({ type: 'k6', executionId: 1 })
      expect(mockEmit).toHaveBeenCalledWith('execution:update', expect.objectContaining({ type: 'k6' }))
    })
  })
})
