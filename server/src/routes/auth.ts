import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { db } from '../lib/db.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
  requireAuth,
  type JwtPayload,
} from '../middleware/auth.js'
import { logger } from '../lib/logger.js'

export const authRouter = new Hono()

const MIN_PASSWORD_LENGTH = 8

const GUEST_USER = {
  id: 'guest',
  username: 'guest',
  email: 'guest@test.com',
  first_name: '게스트',
  last_name: '사용자',
  role: 'guest',
  is_active: true,
  created_at: null as string | null,
  updated_at: null as string | null,
  last_login: null as string | null,
}

// ──────────────────────────────────────────────
// POST /auth/register
// ──────────────────────────────────────────────
authRouter.post(
  '/register',
  zValidator(
    'json',
    z.object({
      username: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(MIN_PASSWORD_LENGTH, `비밀번호는 최소 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      role: z.enum(['admin', 'user']).default('user'),
    }),
  ),
  async (c) => {
    const data = c.req.valid('json')

    const existing = await db.user.findFirst({
      where: { OR: [{ username: data.username }, { email: data.email }] },
      select: { username: true, email: true },
    })
    if (existing?.username === data.username) {
      return c.json({ success: false, error: '이미 사용 중인 사용자명입니다.' }, 400)
    }
    if (existing?.email === data.email) {
      return c.json({ success: false, error: '이미 사용 중인 이메일입니다.' }, 400)
    }

    const passwordHash = await hashPassword(data.password)
    const user = await db.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash,
        firstName: data.first_name ?? '',
        lastName: data.last_name ?? '',
        role: data.role,
      },
      select: { id: true },
    })

    logger.info({ userId: user.id }, '회원가입 완료')
    return c.json({ success: true, message: '회원가입이 완료되었습니다.', data: { user_id: user.id } }, 201)
  },
)

// ──────────────────────────────────────────────
// POST /auth/login
// ──────────────────────────────────────────────
authRouter.post(
  '/login',
  zValidator(
    'json',
    z.object({
      username: z.string().min(1, '사용자명과 비밀번호를 입력해주세요.'),
      password: z.string().min(1, '사용자명과 비밀번호를 입력해주세요.'),
    }),
  ),
  async (c) => {
    const { username, password } = c.req.valid('json')

    const user = await db.user.findUnique({ where: { username } })
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return c.json({ success: false, error: '사용자명 또는 비밀번호가 올바르지 않습니다.' }, 401)
    }
    if (!user.isActive) {
      return c.json({ success: false, error: '비활성화된 계정입니다.' }, 401)
    }

    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: String(user.id),
      username: user.username,
      email: user.email,
      role: user.role,
    }
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(payload),
      signRefreshToken(payload),
    ])

    // 마지막 로그인 시간 & 세션 저장 (비동기, 실패해도 로그인 진행)
    const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown'
    const ua = c.req.header('user-agent') ?? ''
    db.user
      .update({ where: { id: user.id }, data: { lastLogin: new Date() } })
      .catch((e) => logger.warn({ e }, 'lastLogin 업데이트 실패'))
    db.userSession
      .create({
        data: {
          userId: user.id,
          sessionToken: refreshToken,
          ipAddress: ip,
          userAgent: ua,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })
      .catch((e) => logger.warn({ e }, '세션 생성 실패'))

    logger.info({ userId: user.id }, '로그인 성공')
    return c.json({
      success: true,
      message: '로그인이 성공했습니다.',
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: serializeUser(user),
      },
    })
  },
)

// ──────────────────────────────────────────────
// POST /auth/refresh
// ──────────────────────────────────────────────
authRouter.post('/refresh', async (c) => {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) {
    return c.json({ success: false, error: '토큰이 필요합니다.' }, 401)
  }
  try {
    const old = await verifyToken(header.slice(7))
    const user = await db.user.findUnique({
      where: { id: Number(old.sub) },
      select: { id: true, username: true, email: true, role: true, isActive: true },
    })
    if (!user || !user.isActive) {
      return c.json({ success: false, error: '사용자를 찾을 수 없습니다.' }, 401)
    }
    const newAccessToken = await signAccessToken({
      sub: String(user.id),
      username: user.username,
      email: user.email,
      role: user.role,
    })
    return c.json({ success: true, message: '토큰이 성공적으로 갱신되었습니다.', data: { access_token: newAccessToken } })
  } catch {
    return c.json({ success: false, error: '유효하지 않은 토큰입니다.' }, 401)
  }
})

// ──────────────────────────────────────────────
// POST /auth/guest
// ──────────────────────────────────────────────
authRouter.post('/guest', async (c) => {
  const accessToken = await signAccessToken({
    sub: 'guest',
    username: 'guest',
    email: 'guest@test.com',
    role: 'guest',
  })
  const now = new Date().toISOString()
  return c.json({
    success: true,
    message: '게스트 로그인 성공',
    data: {
      access_token: accessToken,
      user: { ...GUEST_USER, created_at: now, updated_at: now },
    },
  })
})

// ──────────────────────────────────────────────
// POST /auth/logout  (인증 필수)
// ──────────────────────────────────────────────
authRouter.post('/logout', requireAuth, async (c) => {
  const { sub } = c.get('user')
  if (sub !== 'guest') {
    db.userSession
      .updateMany({ where: { userId: Number(sub), isActive: true }, data: { isActive: false } })
      .catch((e) => logger.warn({ e }, '세션 비활성화 실패'))
  }
  return c.json({ success: true, message: '로그아웃이 완료되었습니다.' })
})

// ──────────────────────────────────────────────
// GET /auth/profile  (인증 필수)
// ──────────────────────────────────────────────
authRouter.get('/profile', requireAuth, async (c) => {
  const { sub } = c.get('user')
  if (sub === 'guest') {
    const now = new Date().toISOString()
    return c.json({ success: true, data: { ...GUEST_USER, created_at: now, updated_at: now } })
  }
  const user = await db.user.findUnique({ where: { id: Number(sub) } })
  if (!user) return c.json({ success: false, error: '사용자를 찾을 수 없습니다.' }, 404)
  return c.json({ success: true, data: serializeUser(user) })
})

// ──────────────────────────────────────────────
// PUT /auth/profile  (인증 필수)
// ──────────────────────────────────────────────
authRouter.put(
  '/profile',
  requireAuth,
  zValidator('json', z.object({ first_name: z.string().optional(), last_name: z.string().optional() })),
  async (c) => {
    const { sub } = c.get('user')
    if (sub === 'guest') return c.json({ success: false, error: '게스트는 프로필을 수정할 수 없습니다.' }, 403)
    const { first_name, last_name } = c.req.valid('json')
    await db.user.update({
      where: { id: Number(sub) },
      data: {
        ...(first_name !== undefined && { firstName: first_name }),
        ...(last_name !== undefined && { lastName: last_name }),
      },
    })
    return c.json({ success: true, message: '프로필이 수정되었습니다.' })
  },
)

// ──────────────────────────────────────────────
// POST /auth/change-password  (인증 필수)
// ──────────────────────────────────────────────
authRouter.post(
  '/change-password',
  requireAuth,
  zValidator(
    'json',
    z.object({
      current_password: z.string().min(1),
      new_password: z.string().min(MIN_PASSWORD_LENGTH, `비밀번호는 최소 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`),
    }),
  ),
  async (c) => {
    const { sub } = c.get('user')
    if (sub === 'guest') return c.json({ success: false, error: '게스트는 비밀번호를 변경할 수 없습니다.' }, 403)

    const { current_password, new_password } = c.req.valid('json')
    const user = await db.user.findUnique({ where: { id: Number(sub) } })
    if (!user) return c.json({ success: false, error: '사용자를 찾을 수 없습니다.' }, 404)

    if (!(await verifyPassword(current_password, user.passwordHash))) {
      return c.json({ success: false, error: '현재 비밀번호가 올바르지 않습니다.' }, 400)
    }

    await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(new_password) } })
    return c.json({ success: true, message: '비밀번호가 변경되었습니다.' })
  },
)

// ──────────────────────────────────────────────
// 내부 헬퍼
// ──────────────────────────────────────────────
function serializeUser(user: {
  id: number
  username: string
  email: string
  firstName: string | null
  lastName: string | null
  role: string
  isActive: boolean
  lastLogin: Date | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    first_name: user.firstName,
    last_name: user.lastName,
    role: user.role,
    is_active: user.isActive,
    last_login: user.lastLogin?.toISOString() ?? null,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
  }
}
