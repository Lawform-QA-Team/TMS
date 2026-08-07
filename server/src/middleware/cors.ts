import { cors } from 'hono/cors'
import { env } from '../env.js'

const isDev = env.NODE_ENV === 'development'

export const corsMiddleware = cors({
  origin: isDev
    ? (origin) => (origin?.startsWith('http://localhost') ? origin : null)
    : env.ALLOWED_ORIGINS.includes('*') ? '*' : env.ALLOWED_ORIGINS,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400,
})
