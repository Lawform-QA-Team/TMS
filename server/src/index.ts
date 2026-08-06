import { serve } from '@hono/node-server'
import type { ServerType } from '@hono/node-server'
import type { Server as HttpServer } from 'http'
import { createApp } from './app.js'
import { connectDb, disconnectDb } from './lib/db.js'
import { logger } from './lib/logger.js'
import { env } from './env.js'
import { startJiraPipelineWorker } from './lib/jiraPipeline.js'
import { startExecutionWorker } from './lib/executionEngine.js'
import { initSocketServer } from './lib/socketServer.js'

async function main(): Promise<void> {
  await connectDb()

  // BullMQ 워커 시작
  startJiraPipelineWorker()
  startExecutionWorker()

  const app = createApp()

  const server: ServerType = serve(
    {
      fetch: app.fetch,
      port: env.PORT,
    },
    (info) => {
      logger.info(`TMS Server 시작: http://localhost:${info.port}`)
      logger.info(`환경: ${env.NODE_ENV}`)
    },
  )

  // Socket.IO 서버 초기화 (HTTP 서버에 연결)
  initSocketServer(server as unknown as HttpServer)
  logger.info(`Socket.IO 서버 시작: ws://localhost:${env.PORT}/socket.io`)

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received')

    // 4초 내 종료 안 되면 강제 종료 (tsx watch 5초 제한 대비)
    setTimeout(() => process.exit(0), 4000).unref()

    try {
      // BullMQ 워커 종료
      const { getJiraWorker } = await import('./lib/jiraPipeline.js')
      const { getExecutionWorkerInstance } = await import('./lib/executionEngine.js')
      const { getIO } = await import('./lib/socketServer.js')

      await Promise.allSettled([
        getJiraWorker()?.close(),
        getExecutionWorkerInstance()?.close(),
      ])

      try { getIO().close() } catch { /* 미초기화 시 무시 */ }
    } catch { /* 워커 미시작 시 무시 */ }

    // 기존 연결 강제 종료 (Socket.IO 연결이 있으면 server.close가 막힘)
    try { (server as unknown as import("http").Server).closeAllConnections?.() } catch { /* 무시 */ }
    server.close(async () => {
      await disconnectDb()
      logger.info('Server closed')
      process.exit(0)
    })
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

main().catch((err) => {
  logger.error({ err }, 'Server startup failed')
  process.exit(1)
})
