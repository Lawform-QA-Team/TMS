import { Redis } from 'ioredis'
import { env } from '../env.js'
import { logger } from './logger.js'

let _redis: Redis | null = null

export function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null, // BullMQ 요구사항
      enableReadyCheck: false,
    })
    _redis.on('error', (e) => logger.warn({ e }, 'Redis error'))
    _redis.on('connect', () => logger.info('Redis connected'))
  }
  return _redis
}
