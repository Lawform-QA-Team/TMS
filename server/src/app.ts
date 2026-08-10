import { Hono } from 'hono'
import { logger as honoLogger } from 'hono/logger'
import { corsMiddleware } from './middleware/cors.js'
import { registerRoutes } from './routes/index.js'
import { logger } from './lib/logger.js'
import { db } from './lib/db.js'

export function createApp(): Hono {
  const app = new Hono()

  // 전역 미들웨어
  app.use('*', corsMiddleware)
  app.use('*', honoLogger((str) => logger.debug(str)))

  // 헬스 체크
  app.get('/health', async (c) => {
    try {
      await db.$queryRaw`SELECT 1`
      return c.json({
        status: 'healthy',
        message: 'TMS Server is running',
        version: '3.0.0',
        timestamp: new Date().toISOString(),
        database: { status: 'connected' },
      })
    } catch (err) {
      logger.error({ err }, 'Health check DB error')
      return c.json(
        {
          status: 'degraded',
          message: 'TMS Server is running (database issue)',
          version: '3.0.0',
          timestamp: new Date().toISOString(),
          database: { status: 'error' },
        },
        200,
      )
    }
  })

  app.get('/ping', (c) => c.json({ status: 'success', message: 'pong' }))

  // API 라우트 등록 (prefix 없이 + /api prefix 둘 다 지원)
  registerRoutes(app)
  const apiApp = new Hono()
  registerRoutes(apiApp)
  app.route('/api', apiApp)

  // 404
  app.notFound((c) => c.json({ success: false, error: '요청한 경로를 찾을 수 없습니다.' }, 404))

  // 전역 에러 핸들러
  app.onError((err, c) => {
    logger.error({ err, path: c.req.path }, 'Unhandled error')
    return c.json({ success: false, error: '서버 오류가 발생했습니다.' }, 500)
  })

  return app
}
