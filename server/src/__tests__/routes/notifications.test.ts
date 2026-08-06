/**
 * routes/notifications.ts 화이트박스 테스트
 *
 * 실제 구조:
 * - GET / → { notifications, unread_count, total }
 * - GET /settings → notificationSettings 조회/생성
 * - PUT /settings → notificationSettings 업데이트/생성
 * - POST /read-all → updateMany({ read: false } → { read: true })
 * - GET /:id → findFirst({ id, userId })
 * - POST /:id/read → 읽음 처리
 * - DELETE /:id → 삭제
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

// ──────────────────────────────────────────────
// DB 모킹 — 실제 필드 구조 반영
// ──────────────────────────────────────────────

const mockFindMany = vi.fn()
const mockCount = vi.fn()
const mockFindFirst = vi.fn()
const mockUpdate = vi.fn()
const mockUpdateMany = vi.fn()
const mockDelete = vi.fn()
const mockNsFindUnique = vi.fn()
const mockNsCreate = vi.fn()
const mockNsUpdate = vi.fn()

vi.mock('../../lib/db.js', () => ({
  db: {
    notification: {
      findMany: (...a: unknown[]) => mockFindMany(...a),
      count: (...a: unknown[]) => mockCount(...a),
      findFirst: (...a: unknown[]) => mockFindFirst(...a),
      update: (...a: unknown[]) => mockUpdate(...a),
      updateMany: (...a: unknown[]) => mockUpdateMany(...a),
      delete: (...a: unknown[]) => mockDelete(...a),
    },
    notificationSettings: {
      findUnique: (...a: unknown[]) => mockNsFindUnique(...a),
      create: (...a: unknown[]) => mockNsCreate(...a),
      update: (...a: unknown[]) => mockNsUpdate(...a),
    },
  },
}))

vi.mock('../../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

vi.mock('../../middleware/auth.js', () => ({
  requireAuth: vi.fn(async (c: { set: (k: string, v: unknown) => void }, next: () => Promise<void>) => {
    c.set('user', { sub: '1', username: 'tester', role: 'user' })
    return next()
  }),
}))

// ──────────────────────────────────────────────
// 헬퍼
// ──────────────────────────────────────────────

function makeNotif(id: number, read = false) {
  return {
    id,
    userId: 1,
    notificationType: 'mention',
    title: 'Mention',
    message: 'You were mentioned',
    read,
    readAt: read ? new Date() : null,
    priority: 'medium',
    channels: 'in_app',
    createdAt: new Date('2024-01-01'),
    relatedTestCaseId: null,
    relatedAutomationTestId: null,
    relatedPerformanceTestId: null,
    relatedTestResultId: null,
  }
}

function makeNsSettings(userId = 1) {
  return {
    id: 1,
    userId,
    settings: '{}',
    emailEnabled: true,
    slackEnabled: false,
    slackWebhookUrl: null,
    inAppEnabled: true,
  }
}

async function buildApp() {
  const { notificationsRouter } = await import('../../routes/notifications.js')
  const app = new Hono()
  app.route('/', notificationsRouter)
  return app
}

describe('notifications router', () => {
  let app: Hono

  beforeEach(async () => {
    vi.resetModules()
    mockFindMany.mockReset()
    mockCount.mockReset()
    mockFindFirst.mockReset()
    mockUpdate.mockReset()
    mockUpdateMany.mockReset()
    mockDelete.mockReset()
    mockNsFindUnique.mockReset()
    mockNsCreate.mockReset()
    mockNsUpdate.mockReset()
    app = await buildApp()
  })

  // ────────────────────────────────────────
  // GET /
  // ────────────────────────────────────────

  describe('GET /', () => {
    it('알림 목록 반환 (notifications + unread_count)', async () => {
      mockFindMany.mockResolvedValue([makeNotif(1), makeNotif(2)])
      mockCount.mockResolvedValue(1) // unread count
      const res = await app.request('/')
      expect(res.status).toBe(200)
      const body = await res.json() as { notifications: unknown[]; unread_count: number; total: number }
      expect(body.notifications).toHaveLength(2)
      expect(body.unread_count).toBe(1)
      expect(body.total).toBe(2)
    })

    it('unread_only=true → read: false 필터 포함', async () => {
      mockFindMany.mockResolvedValue([])
      mockCount.mockResolvedValue(0)
      await app.request('/?unread_only=true')
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ read: false }) }),
      )
    })

    it('limit 쿼리로 결과 수 제한', async () => {
      mockFindMany.mockResolvedValue([])
      mockCount.mockResolvedValue(0)
      await app.request('/?limit=5')
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      )
    })
  })

  // ────────────────────────────────────────
  // GET /settings
  // ────────────────────────────────────────

  describe('GET /settings', () => {
    it('설정 존재 시 반환', async () => {
      mockNsFindUnique.mockResolvedValue(makeNsSettings())
      const res = await app.request('/settings')
      expect(res.status).toBe(200)
      const body = await res.json() as { email_enabled: boolean }
      expect(body.email_enabled).toBeDefined()
    })

    it('설정 없으면 새로 생성 후 반환', async () => {
      mockNsFindUnique.mockResolvedValue(null)
      mockNsCreate.mockResolvedValue(makeNsSettings())
      const res = await app.request('/settings')
      expect(res.status).toBe(200)
      expect(mockNsCreate).toHaveBeenCalledOnce()
    })
  })

  // ────────────────────────────────────────
  // PUT /settings
  // ────────────────────────────────────────

  describe('PUT /settings', () => {
    it('설정 존재 시 update 호출', async () => {
      mockNsFindUnique.mockResolvedValue(makeNsSettings())
      mockNsUpdate.mockResolvedValue(makeNsSettings())
      const res = await app.request('/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_enabled: false }),
      })
      expect(res.status).toBe(200)
      expect(mockNsUpdate).toHaveBeenCalledOnce()
    })

    it('설정 없으면 create 호출', async () => {
      mockNsFindUnique.mockResolvedValue(null)
      mockNsCreate.mockResolvedValue(makeNsSettings())
      const res = await app.request('/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ in_app_enabled: true }),
      })
      expect(res.status).toBe(200)
      expect(mockNsCreate).toHaveBeenCalledOnce()
    })
  })

  // ────────────────────────────────────────
  // POST /read-all
  // ────────────────────────────────────────

  describe('POST /read-all', () => {
    it('해당 userId의 미읽음 알림 전체 읽음 처리', async () => {
      mockUpdateMany.mockResolvedValue({ count: 5 })
      const res = await app.request('/read-all', { method: 'POST' })
      expect(res.status).toBe(200)
      expect(mockUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 1, read: false }),
          data: expect.objectContaining({ read: true }),
        }),
      )
    })
  })

  // ────────────────────────────────────────
  // GET /:id
  // ────────────────────────────────────────

  describe('GET /:id', () => {
    it('존재하는 알림 반환', async () => {
      mockFindFirst.mockResolvedValue(makeNotif(1))
      const res = await app.request('/1')
      expect(res.status).toBe(200)
      const body = await res.json() as { id: number }
      expect(body.id).toBe(1)
    })

    it('미존재 → 404', async () => {
      mockFindFirst.mockResolvedValue(null)
      const res = await app.request('/999')
      expect(res.status).toBe(404)
    })

    it('userId 기반으로 조회 (타인 알림 접근 방지)', async () => {
      mockFindFirst.mockResolvedValue(makeNotif(5))
      await app.request('/5')
      expect(mockFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ id: 5, userId: 1 }) }),
      )
    })
  })

  // ────────────────────────────────────────
  // POST /:id/read
  // ────────────────────────────────────────

  describe('POST /:id/read', () => {
    it('읽음 처리 → 200', async () => {
      mockFindFirst.mockResolvedValue(makeNotif(1))
      mockUpdate.mockResolvedValue({ ...makeNotif(1), read: true })
      const res = await app.request('/1/read', { method: 'POST' })
      expect(res.status).toBe(200)
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ read: true }) }),
      )
    })

    it('미존재 알림 → 404', async () => {
      mockFindFirst.mockResolvedValue(null)
      const res = await app.request('/999/read', { method: 'POST' })
      expect(res.status).toBe(404)
    })
  })

  // ────────────────────────────────────────
  // DELETE /:id
  // ────────────────────────────────────────

  describe('DELETE /:id', () => {
    it('알림 삭제 → 200', async () => {
      mockFindFirst.mockResolvedValue(makeNotif(1))
      mockDelete.mockResolvedValue({})
      const res = await app.request('/1', { method: 'DELETE' })
      expect(res.status).toBe(200)
    })

    it('미존재 → 404', async () => {
      mockFindFirst.mockResolvedValue(null)
      const res = await app.request('/999', { method: 'DELETE' })
      expect(res.status).toBe(404)
    })
  })
})
