/**
 * Socket.IO 서버 싱글턴
 *
 * 실행 엔진 Worker → 클라이언트로 실시간 이벤트 전송
 *
 * 이벤트 목록:
 *   execution:started   — 실행 시작
 *   execution:log       — 실행 로그 스트리밍
 *   execution:progress  — 진행률 업데이트
 *   execution:completed — 실행 완료
 *   execution:failed    — 실행 실패
 */
import type { Server as HttpServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { logger } from './logger.js'

let _io: SocketIOServer | null = null

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  if (_io) return _io

  _io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    path: '/socket.io',
  })

  _io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'Socket.IO 클라이언트 연결')

    // 클라이언트가 특정 실행 룸에 참가 요청
    socket.on('join:execution', (executionId: number | string) => {
      const room = `execution:${executionId}`
      void socket.join(room)
      logger.debug({ socketId: socket.id, room }, '실행 룸 참가')
    })

    socket.on('leave:execution', (executionId: number | string) => {
      const room = `execution:${executionId}`
      void socket.leave(room)
    })

    socket.on('disconnect', () => {
      logger.debug({ socketId: socket.id }, 'Socket.IO 클라이언트 연결 해제')
    })
  })

  logger.info('Socket.IO 서버 초기화 완료')
  return _io
}

export function getIO(): SocketIOServer {
  if (!_io) throw new Error('Socket.IO 서버가 초기화되지 않았습니다. initSocketServer()를 먼저 호출하세요.')
  return _io
}

// ──────────────────────────────────────────────
// 실행 이벤트 헬퍼
// ──────────────────────────────────────────────

export interface ExecutionEvent {
  executionId: number
  testId: number
  testType: 'playwright' | 'k6'
  testName: string
}

export function emitExecutionStarted(event: ExecutionEvent): void {
  if (!_io) return
  const room = `execution:${event.executionId}`
  _io.to(room).emit('execution:started', {
    ...event,
    timestamp: new Date().toISOString(),
  })
}

export function emitExecutionLog(executionId: number, log: string): void {
  if (!_io) return
  _io.to(`execution:${executionId}`).emit('execution:log', {
    executionId,
    log,
    timestamp: new Date().toISOString(),
  })
}

export function emitExecutionProgress(executionId: number, percent: number, message?: string): void {
  if (!_io) return
  _io.to(`execution:${executionId}`).emit('execution:progress', {
    executionId,
    percent,
    message,
    timestamp: new Date().toISOString(),
  })
}

export function emitExecutionCompleted(
  executionId: number,
  result: { status: string; summary?: unknown; duration: number },
): void {
  if (!_io) return
  _io.to(`execution:${executionId}`).emit('execution:completed', {
    executionId,
    ...result,
    timestamp: new Date().toISOString(),
  })
}

export function emitExecutionFailed(executionId: number, error: string): void {
  if (!_io) return
  _io.to(`execution:${executionId}`).emit('execution:failed', {
    executionId,
    error,
    timestamp: new Date().toISOString(),
  })
}

// 전체 브로드캐스트 (대시보드용)
export function broadcastExecutionUpdate(payload: unknown): void {
  if (!_io) return
  _io.emit('execution:update', payload)
}
