import type { Context, MiddlewareHandler, Next } from 'hono'
import { createMiddleware } from 'hono/factory'
import { jwtVerify, SignJWT } from 'jose'
import { env } from '../env.js'
import { db } from '../lib/db.js'

const SECRET = new TextEncoder().encode(env.JWT_SECRET_KEY)

export interface JwtPayload {
  sub: string   // user id (string)
  username: string
  email: string
  role: string
  iat?: number
  exp?: number
}

declare module 'hono' {
  interface ContextVariableMap {
    user: JwtPayload
  }
}

export async function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_EXPIRES_IN)
    .sign(SECRET)
}

export async function signRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_EXPIRES_IN)
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, SECRET)
  return payload as unknown as JwtPayload
}

/** 인증 필수 미들웨어 */
export const requireAuth: MiddlewareHandler = createMiddleware(async (c: Context, next: Next) => {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) {
    return c.json({ success: false, error: '토큰이 필요합니다.' }, 401)
  }

  const token = header.slice(7)
  try {
    const payload = await verifyToken(token)
    c.set('user', payload)
  } catch {
    return c.json({ success: false, error: '유효하지 않은 토큰입니다.' }, 401)
  }
  return next()
})

/** 관리자 전용 미들웨어 */
export const requireAdmin: MiddlewareHandler = createMiddleware(async (c: Context, next: Next) => {
  const user = c.get('user')
  if (user.role !== 'admin') {
    return c.json({ success: false, error: '관리자 권한이 필요합니다.' }, 403)
  }
  return next()
})

/** 세션 기반 인증 검증 (선택적 — guest 허용 엔드포인트) */
export const optionalAuth: MiddlewareHandler = createMiddleware(async (c: Context, next: Next) => {
  const header = c.req.header('Authorization')
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = await verifyToken(header.slice(7))
      c.set('user', payload)
    } catch {
      // guest 허용이므로 오류 무시
    }
  }
  return next()
})
