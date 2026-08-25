import { Hono } from 'hono'
import { db } from '../lib/db.js'
import { requireAuth } from '../middleware/auth.js'
import { logger } from '../lib/logger.js'

export const notificationsRouter = new Hono()

// ──────────────────────────────────────────────
// GET /notifications/settings  (주의: /:id 보다 먼저)
// ──────────────────────────────────────────────
notificationsRouter.get('/settings', requireAuth, async (c) => {
  const user = c.get('user')
  const userId = Number(user.sub)
  try {
    let settings = await db.notificationSettings.findUnique({ where: { userId } })
    if (!settings) {
      settings = await db.notificationSettings.create({
        data: { userId, settings: '{}' },
      })
    }
    return c.json({
      id: settings.id,
      user_id: settings.userId,
      settings: JSON.parse(settings.settings ?? "{}"),
      email_enabled: settings.emailEnabled,
      slack_enabled: settings.slackEnabled,
      slack_webhook_url: settings.slackWebhookUrl,
      in_app_enabled: settings.inAppEnabled,
    })
  } catch (e) {
    logger.error({ e }, '알림 설정 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// PUT /notifications/settings
// ──────────────────────────────────────────────
notificationsRouter.put('/settings', requireAuth, async (c) => {
  const user = c.get('user')
  const userId = Number(user.sub)
  try {
    const data = await c.req.json()
    const existing = await db.notificationSettings.findUnique({ where: { userId } })
    const updateData: Record<string, unknown> = {}
    if ('settings' in data) updateData.settings = JSON.stringify(data.settings)
    if ('email_enabled' in data) updateData.emailEnabled = data.email_enabled
    if ('slack_enabled' in data) updateData.slackEnabled = data.slack_enabled
    if ('slack_webhook_url' in data) updateData.slackWebhookUrl = data.slack_webhook_url
    if ('in_app_enabled' in data) updateData.inAppEnabled = data.in_app_enabled

    let settings
    if (existing) {
      settings = await db.notificationSettings.update({ where: { userId }, data: updateData })
    } else {
      settings = await db.notificationSettings.create({
        data: { userId, settings: '{}', ...updateData },
      })
    }
    return c.json({
      message: '알림 설정이 업데이트되었습니다',
      settings: {
        id: settings.id,
        user_id: settings.userId,
        settings: JSON.parse(settings.settings ?? "{}"),
        email_enabled: settings.emailEnabled,
        slack_enabled: settings.slackEnabled,
        slack_webhook_url: settings.slackWebhookUrl,
        in_app_enabled: settings.inAppEnabled,
      },
    })
  } catch (e) {
    logger.error({ e }, '알림 설정 업데이트 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// POST /notifications/read-all  (주의: /:id 보다 먼저)
// ──────────────────────────────────────────────
notificationsRouter.post('/read-all', requireAuth, async (c) => {
  const user = c.get('user')
  const userId = Number(user.sub)
  try {
    await db.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    })
    return c.json({ message: '모든 알림이 읽음 처리되었습니다' })
  } catch (e) {
    logger.error({ e }, '전체 알림 읽음 처리 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /notifications
// ──────────────────────────────────────────────
notificationsRouter.get('/', requireAuth, async (c) => {
  const user = c.get('user')
  const userId = Number(user.sub)
  try {
    const unreadOnly = c.req.query('unread_only') === 'true'
    const limit = c.req.query('limit') ? Number(c.req.query('limit')) : 50

    const where: Record<string, unknown> = { userId }
    if (unreadOnly) where.read = false

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const unreadCount = await db.notification.count({ where: { userId, read: false } })

    return c.json({
      notifications: notifications.map(serializeNotification),
      unread_count: unreadCount,
      total: notifications.length,
    })
  } catch (e) {
    logger.error({ e }, '알림 목록 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /notifications/:id
// ──────────────────────────────────────────────
notificationsRouter.get('/:id', requireAuth, async (c) => {
  const user = c.get('user')
  const userId = Number(user.sub)
  const id = Number(c.req.param('id'))
  try {
    const notification = await db.notification.findFirst({ where: { id, userId } })
    if (!notification) return c.json({ error: '알림을 찾을 수 없습니다' }, 404)
    return c.json(serializeNotification(notification))
  } catch (e) {
    logger.error({ e }, '알림 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// POST /notifications/:id/read
// ──────────────────────────────────────────────
notificationsRouter.post('/:id/read', requireAuth, async (c) => {
  const user = c.get('user')
  const userId = Number(user.sub)
  const id = Number(c.req.param('id'))
  try {
    const notification = await db.notification.findFirst({ where: { id, userId } })
    if (!notification) return c.json({ error: '알림을 찾을 수 없습니다' }, 404)
    await db.notification.update({ where: { id }, data: { read: true, readAt: new Date() } })
    return c.json({ message: '알림이 읽음 처리되었습니다' })
  } catch (e) {
    logger.error({ e }, '알림 읽음 처리 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// DELETE /notifications/:id
// ──────────────────────────────────────────────
notificationsRouter.delete('/:id', requireAuth, async (c) => {
  const user = c.get('user')
  const userId = Number(user.sub)
  const id = Number(c.req.param('id'))
  try {
    const notification = await db.notification.findFirst({ where: { id, userId } })
    if (!notification) return c.json({ error: '알림을 찾을 수 없습니다' }, 404)
    await db.notification.delete({ where: { id } })
    return c.json({ message: '알림이 삭제되었습니다' })
  } catch (e) {
    logger.error({ e }, '알림 삭제 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// 내부 헬퍼
// ──────────────────────────────────────────────
function serializeNotification(n: {
  id: number
  userId: number
  notificationType: string
  title: string
  message: string
  read: boolean
  readAt: Date | null
  priority: string
  channels: string
  createdAt: Date
  relatedTestCaseId: number | null
  relatedAutomationTestId: number | null
  relatedPerformanceTestId: number | null
  relatedTestResultId: number | null
}) {
  return {
    id: n.id,
    user_id: n.userId,
    notification_type: n.notificationType,
    title: n.title,
    message: n.message,
    read: n.read,
    read_at: n.readAt?.toISOString() ?? null,
    priority: n.priority,
    channels: n.channels,
    created_at: n.createdAt.toISOString(),
    related_test_case_id: n.relatedTestCaseId,
    related_automation_test_id: n.relatedAutomationTestId,
    related_performance_test_id: n.relatedPerformanceTestId,
    related_test_result_id: n.relatedTestResultId,
  }
}
