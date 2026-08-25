import { PrismaClient } from '@prisma/client'
import { logger } from './logger.js'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env['NODE_ENV'] === 'development'
        ? [{ emit: 'event', level: 'query' }, 'warn', 'error']
        : ['warn', 'error'],
  })

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = db
}

db.$on('query' as never, (e: { query: string; duration: number }) => {
  logger.debug({ query: e.query, duration: e.duration }, 'DB query')
})

export async function connectDb(): Promise<void> {
  await db.$connect()
  logger.info('DB connected')
}

export async function disconnectDb(): Promise<void> {
  await db.$disconnect()
  logger.info('DB disconnected')
}
