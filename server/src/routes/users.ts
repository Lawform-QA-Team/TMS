import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { db } from '../lib/db.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { logger } from '../lib/logger.js'

export const usersRouter = new Hono()

// ──────────────────────────────────────────────
// GET /users  (관리자 전용)
// ──────────────────────────────────────────────
usersRouter.get('/', requireAuth, requireAdmin, async (c) => {
  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: userSelectFull,
  })
  return c.json(users.map(serializeUser))
})

// ──────────────────────────────────────────────
// GET /users/list  (인증 사용자 또는 게스트 — 담당자 선택용)
// 주의: /users/:id 보다 먼저 등록해야 'list'가 id로 인식되지 않음
// ──────────────────────────────────────────────
usersRouter.get('/list', requireAuth, async (c) => {
  const users = await db.user.findMany({
    where: { isActive: true },
    orderBy: { username: 'asc' },
    select: userSelectList,
  })
  return c.json(users.map(serializeUser))
})

// ──────────────────────────────────────────────
// GET /users/current  (인증 필수)
// ──────────────────────────────────────────────
usersRouter.get('/current', requireAuth, async (c) => {
  const { sub, username, email, role } = c.get('user')

  if (sub === 'guest') {
    return c.json({ id: 'guest', username, email, role, is_active: true })
  }

  const user = await db.user.findUnique({ where: { id: Number(sub) }, select: userSelectFull })
  if (!user) return c.json({ error: '사용자를 찾을 수 없습니다.' }, 404)
  return c.json(serializeUser(user))
})

// ──────────────────────────────────────────────
// POST /users  (관리자 전용)
// ──────────────────────────────────────────────
usersRouter.post(
  '/',
  requireAuth,
  requireAdmin,
  zValidator(
    'json',
    z.object({
      username: z.string().min(1),
      email: z.string().email(),
      password: z.string().optional(),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      role: z.enum(['admin', 'user']).default('user'),
    }),
  ),
  async (c) => {
    const data = c.req.valid('json')
    const DEFAULT_PASSWORD = '1q2w#E$R'

    const existing = await db.user.findFirst({
      where: { OR: [{ username: data.username }, { email: data.email }] },
      select: { username: true, email: true },
    })
    if (existing?.username === data.username) {
      return c.json({ error: '이미 존재하는 사용자명입니다.' }, 400)
    }
    if (existing?.email === data.email) {
      return c.json({ error: '이미 존재하는 이메일입니다.' }, 400)
    }

    const rawPassword = data.password ?? DEFAULT_PASSWORD
    const user = await db.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash: await hashPassword(rawPassword),
        firstName: data.first_name ?? '',
        lastName: data.last_name ?? '',
        role: data.role,
        isActive: true,
      },
      select: { id: true },
    })

    logger.info({ userId: user.id }, '관리자 사용자 생성')
    return c.json({
      message: '사용자가 성공적으로 생성되었습니다.',
      user_id: user.id,
      default_password: data.password ? null : DEFAULT_PASSWORD,
    })
  },
)

// ──────────────────────────────────────────────
// PUT /users/:id  (본인 또는 관리자)
// ──────────────────────────────────────────────
usersRouter.put(
  '/:id',
  requireAuth,
  zValidator(
    'json',
    z.object({
      username: z.string().optional(),
      email: z.string().email().optional(),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      role: z.enum(['admin', 'user']).optional(),
      is_active: z.boolean().optional(),
      password: z.string().min(8).optional(),
    }),
  ),
  async (c) => {
    const targetId = Number(c.req.param('id'))
    const caller = c.get('user')

    // 본인이거나 관리자만 수정 가능
    if (Number(caller.sub) !== targetId && caller.role !== 'admin') {
      return c.json({ error: '권한이 없습니다.' }, 403)
    }

    const user = await db.user.findUnique({ where: { id: targetId } })
    if (!user) return c.json({ error: '사용자를 찾을 수 없습니다.' }, 404)

    const data = c.req.valid('json')

    // username 중복 체크
    if (data.username && data.username !== user.username) {
      const dup = await db.user.findUnique({ where: { username: data.username } })
      if (dup) return c.json({ error: '이미 존재하는 사용자명입니다.' }, 400)
    }
    // email 중복 체크
    if (data.email && data.email !== user.email) {
      const dup = await db.user.findUnique({ where: { email: data.email } })
      if (dup) return c.json({ error: '이미 존재하는 이메일입니다.' }, 400)
    }

    await db.user.update({
      where: { id: targetId },
      data: {
        ...(data.username !== undefined && { username: data.username }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.first_name !== undefined && { firstName: data.first_name }),
        ...(data.last_name !== undefined && { lastName: data.last_name }),
        ...(data.role !== undefined && caller.role === 'admin' && { role: data.role }),
        ...(data.is_active !== undefined && caller.role === 'admin' && { isActive: data.is_active }),
        ...(data.password !== undefined && { passwordHash: await hashPassword(data.password) }),
      },
    })

    return c.json({ message: '사용자 정보가 성공적으로 수정되었습니다.' })
  },
)

// ──────────────────────────────────────────────
// PUT /users/:id/change-password  (본인 전용)
// ──────────────────────────────────────────────
usersRouter.put(
  '/:id/change-password',
  requireAuth,
  zValidator(
    'json',
    z.object({
      current_password: z.string().min(1),
      new_password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다.'),
    }),
  ),
  async (c) => {
    const targetId = Number(c.req.param('id'))
    const caller = c.get('user')

    if (Number(caller.sub) !== targetId) {
      return c.json({ error: '본인 비밀번호만 변경할 수 있습니다.' }, 403)
    }

    const user = await db.user.findUnique({ where: { id: targetId } })
    if (!user) return c.json({ error: '사용자를 찾을 수 없습니다.' }, 404)

    const { current_password, new_password } = c.req.valid('json')

    if (!(await verifyPassword(current_password, user.passwordHash))) {
      return c.json({ error: '현재 비밀번호가 올바르지 않습니다.' }, 400)
    }

    await db.user.update({
      where: { id: targetId },
      data: { passwordHash: await hashPassword(new_password) },
    })

    return c.json({ message: '비밀번호가 성공적으로 변경되었습니다.' })
  },
)

// ──────────────────────────────────────────────
// DELETE /users/:id  (관리자 전용)
// ──────────────────────────────────────────────
usersRouter.delete('/:id', requireAuth, requireAdmin, async (c) => {
  const targetId = Number(c.req.param('id'))
  const user = await db.user.findUnique({ where: { id: targetId } })
  if (!user) return c.json({ error: '사용자를 찾을 수 없습니다.' }, 404)

  await db.user.delete({ where: { id: targetId } })
  logger.info({ targetId }, '사용자 삭제')
  return c.json({ message: '사용자가 성공적으로 삭제되었습니다.' })
})

// ──────────────────────────────────────────────
// 내부 헬퍼
// ──────────────────────────────────────────────
const userSelectFull = {
  id: true,
  username: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  lastLogin: true,
  createdAt: true,
  updatedAt: true,
} as const

const userSelectList = {
  id: true,
  username: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  lastLogin: true,
  createdAt: true,
  updatedAt: true,
} as const

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
