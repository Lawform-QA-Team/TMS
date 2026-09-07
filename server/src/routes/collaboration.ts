import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { db } from '../lib/db.js'
import { requireAuth } from '../middleware/auth.js'
import { logger } from '../lib/logger.js'

export const commentsRouter = new Hono()
export const mentionsRouter = new Hono()
export const workflowsRouter = new Hono()

// ============================================================
// 댓글 API
// ============================================================

// GET /comments
commentsRouter.get('/', async (c) => {
  try {
    const entityType = c.req.query('entity_type')
    const entityId = c.req.query('entity_id') ? Number(c.req.query('entity_id')) : null
    const includeDeleted = c.req.query('include_deleted') === 'true'

    if (!entityType || !entityId) {
      return c.json({ error: 'entity_type과 entity_id는 필수입니다' }, 400)
    }

    const where: Record<string, unknown> = { entityType, entityId }
    if (!includeDeleted) where.isDeleted = false

    const comments = await db.comment.findMany({
      where,
      include: { author: true, replies: { include: { author: true } } },
      orderBy: { createdAt: 'asc' },
    })

    return c.json(comments.map(serializeComment))
  } catch (e) {
    logger.error({ e }, '댓글 목록 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// POST /comments
commentsRouter.post(
  '/',
  requireAuth,
  zValidator(
    'json',
    z.object({
      entity_type: z.string(),
      entity_id: z.number(),
      content: z.string().min(1),
      parent_comment_id: z.number().optional(),
    }),
  ),
  async (c) => {
    const data = c.req.valid('json')
    const user = c.get('user')
    try {
      const comment = await db.comment.create({
        data: {
          entityType: data.entity_type,
          entityId: data.entity_id,
          content: data.content,
          authorId: Number(user.sub),
          parentCommentId: data.parent_comment_id ?? null,
        },
        include: { author: true },
      })
      return c.json({ message: '댓글이 생성되었습니다', comment: serializeComment(comment) }, 201)
    } catch (e) {
      logger.error({ e }, '댓글 생성 오류')
      return c.json({ error: String(e) }, 500)
    }
  },
)

// PUT /comments/:commentId
commentsRouter.put('/:commentId', requireAuth, async (c) => {
  const commentId = Number(c.req.param('commentId'))
  const user = c.get('user')
  const comment = await db.comment.findUnique({ where: { id: commentId } })
  if (!comment) return c.json({ error: '댓글을 찾을 수 없습니다' }, 404)
  if (comment.authorId !== Number(user.sub)) return c.json({ error: '댓글을 수정할 권한이 없습니다' }, 403)

  try {
    const data = await c.req.json()
    if (!data.content) return c.json({ error: 'content는 필수입니다' }, 400)
    const updated = await db.comment.update({
      where: { id: commentId },
      data: { content: data.content, isEdited: true },
      include: { author: true },
    })
    return c.json({ message: '댓글이 수정되었습니다', comment: serializeComment(updated) })
  } catch (e) {
    logger.error({ e }, '댓글 수정 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// DELETE /comments/:commentId
commentsRouter.delete('/:commentId', requireAuth, async (c) => {
  const commentId = Number(c.req.param('commentId'))
  const user = c.get('user')
  const comment = await db.comment.findUnique({ where: { id: commentId } })
  if (!comment) return c.json({ error: '댓글을 찾을 수 없습니다' }, 404)
  if (comment.authorId !== Number(user.sub)) return c.json({ error: '댓글을 삭제할 권한이 없습니다' }, 403)

  try {
    await db.comment.update({ where: { id: commentId }, data: { isDeleted: true } })
    return c.json({ message: '댓글이 삭제되었습니다' })
  } catch (e) {
    logger.error({ e }, '댓글 삭제 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ============================================================
// 멘션 API
// ============================================================

// GET /mentions
mentionsRouter.get('/', requireAuth, async (c) => {
  const user = c.get('user')
  try {
    const isReadStr = c.req.query('is_read')
    const where: Record<string, unknown> = { mentionedUserId: Number(user.sub) }
    if (isReadStr !== undefined) where.isRead = isReadStr === 'true'

    const mentions = await db.mention.findMany({
      where,
      include: { comment: true },
      orderBy: { createdAt: 'desc' },
    })
    return c.json(mentions.map((m) => ({
      id: m.id,
      entity_type: m.entityType,
      entity_id: m.entityId,
      mentioned_user_id: m.mentionedUserId,
      comment_id: m.commentId,
      is_read: m.isRead,
      created_at: m.createdAt.toISOString(),
    })))
  } catch (e) {
    logger.error({ e }, '멘션 목록 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// POST /mentions/:mentionId/read
mentionsRouter.post('/:mentionId/read', requireAuth, async (c) => {
  const mentionId = Number(c.req.param('mentionId'))
  const user = c.get('user')
  const mention = await db.mention.findUnique({ where: { id: mentionId } })
  if (!mention) return c.json({ error: '멘션을 찾을 수 없습니다' }, 404)
  if (mention.mentionedUserId !== Number(user.sub)) return c.json({ error: '권한이 없습니다' }, 403)

  try {
    const updated = await db.mention.update({ where: { id: mentionId }, data: { isRead: true } })
    return c.json({ message: '멘션이 읽음 처리되었습니다', mention: { id: updated.id, is_read: updated.isRead } })
  } catch (e) {
    logger.error({ e }, '멘션 읽음 처리 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ============================================================
// 워크플로우 API
// ============================================================

// GET /workflows/state  (주의: /:id 보다 먼저)
workflowsRouter.get('/state', async (c) => {
  try {
    const entityType = c.req.query('entity_type')
    const entityId = c.req.query('entity_id') ? Number(c.req.query('entity_id')) : null
    if (!entityType || !entityId) return c.json({ error: 'entity_type과 entity_id는 필수입니다' }, 400)

    const state = await db.workflowState.findFirst({
      where: { entityType, entityId },
      include: { workflow: true, currentStep: true },
      orderBy: { updatedAt: 'desc' },
    })

    if (!state) return c.json({ message: '워크플로우가 적용되지 않았습니다' })
    return c.json(serializeWorkflowState(state))
  } catch (e) {
    logger.error({ e }, '워크플로우 상태 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// POST /workflows/transition  (주의: /:id 보다 먼저)
workflowsRouter.post('/transition', requireAuth, async (c) => {
  try {
    const data = await c.req.json()
    if (!data.entity_type || !data.entity_id || !data.next_status) {
      return c.json({ error: 'entity_type, entity_id, next_status는 필수입니다' }, 400)
    }

    const state = await db.workflowState.findFirst({
      where: { entityType: data.entity_type, entityId: data.entity_id },
    })
    if (!state) return c.json({ error: '워크플로우 상태를 찾을 수 없습니다' }, 404)

    const updated = await db.workflowState.update({
      where: { id: state.id },
      data: {
        previousStatus: state.currentStatus,
        currentStatus: data.next_status,
        changedBy: Number(c.get('user').sub),
      },
    })
    return c.json({ message: '워크플로우 상태가 전환되었습니다', state: serializeWorkflowState(updated) })
  } catch (e) {
    logger.error({ e }, '워크플로우 상태 전환 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// GET /workflows
workflowsRouter.get('/', async (c) => {
  try {
    const workflowType = c.req.query('workflow_type')
    const projectId = c.req.query('project_id') ? Number(c.req.query('project_id')) : null
    const isActiveStr = c.req.query('is_active')

    const where: Record<string, unknown> = {}
    if (workflowType) where.workflowType = workflowType
    if (projectId) where.projectId = projectId
    if (isActiveStr !== undefined) where.isActive = isActiveStr === 'true'

    const workflows = await db.workflow.findMany({
      where,
      include: { steps: true },
      orderBy: { createdAt: 'desc' },
    })
    return c.json(workflows.map(serializeWorkflow))
  } catch (e) {
    logger.error({ e }, '워크플로우 목록 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// GET /workflows/:id
workflowsRouter.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  try {
    const workflow = await db.workflow.findUnique({ where: { id }, include: { steps: true } })
    if (!workflow) return c.json({ error: '워크플로우를 찾을 수 없습니다' }, 404)
    return c.json(serializeWorkflow(workflow))
  } catch (e) {
    logger.error({ e }, '워크플로우 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// POST /workflows
workflowsRouter.post(
  '/',
  requireAuth,
  zValidator(
    'json',
    z.object({
      name: z.string().min(1),
      workflow_type: z.string(),
      initial_status: z.string(),
      steps: z.array(
        z.object({
          name: z.string(),
          display_name: z.string(),
          description: z.string().optional(),
          order: z.number(),
          allowed_roles: z.array(z.string()).optional(),
          next_steps: z.array(z.string()).optional(),
        }),
      ),
      project_id: z.number().nullable().optional(),
      description: z.string().optional(),
    }),
  ),
  async (c) => {
    const data = c.req.valid('json')
    const user = c.get('user')
    try {
      const workflow = await db.workflow.create({
        data: {
          name: data.name,
          workflowType: data.workflow_type,
          initialStatus: data.initial_status,
          projectId: data.project_id ?? null,
          description: data.description ?? null,
          createdBy: Number(user.sub),
          steps: {
            create: data.steps.map((s) => ({
              name: s.name,
              displayName: s.display_name,
              description: s.description ?? null,
              order: s.order,
              allowedRoles: s.allowed_roles ? JSON.stringify(s.allowed_roles) : null,
              nextSteps: s.next_steps ? JSON.stringify(s.next_steps) : null,
            })),
          },
        },
        include: { steps: true },
      })
      return c.json({ message: '워크플로우가 생성되었습니다', workflow: serializeWorkflow(workflow) }, 201)
    } catch (e) {
      logger.error({ e }, '워크플로우 생성 오류')
      return c.json({ error: String(e) }, 500)
    }
  },
)

// PUT /workflows/:id
workflowsRouter.put('/:id', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const workflow = await db.workflow.findUnique({ where: { id } })
  if (!workflow) return c.json({ error: '워크플로우를 찾을 수 없습니다' }, 404)

  try {
    const data = await c.req.json()
    const updated = await db.workflow.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.is_active !== undefined && { isActive: data.is_active }),
      },
      include: { steps: true },
    })
    return c.json({ message: '워크플로우가 수정되었습니다', workflow: serializeWorkflow(updated) })
  } catch (e) {
    logger.error({ e }, '워크플로우 수정 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// POST /workflows/:id/apply
workflowsRouter.post('/:id/apply', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const workflow = await db.workflow.findUnique({ where: { id }, include: { steps: true } })
  if (!workflow) return c.json({ error: '워크플로우를 찾을 수 없습니다' }, 404)

  try {
    const data = await c.req.json()
    if (!data.entity_type || !data.entity_id) {
      return c.json({ error: 'entity_type과 entity_id는 필수입니다' }, 400)
    }

    const firstStep = workflow.steps.sort((a, b) => a.order - b.order)[0]
    const state = await db.workflowState.create({
      data: {
        entityType: data.entity_type,
        entityId: data.entity_id,
        workflowId: id,
        currentStepId: firstStep?.id ?? null,
        currentStatus: workflow.initialStatus,
        changedBy: Number(c.get('user').sub),
      },
    })
    return c.json({ message: '워크플로우가 적용되었습니다', state: serializeWorkflowState(state) })
  } catch (e) {
    logger.error({ e }, '워크플로우 적용 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// 내부 헬퍼
// ──────────────────────────────────────────────
type AuthorRef = { username: string; firstName: string | null; lastName: string | null }

function serializeComment(c: {
  id: number
  entityType: string
  entityId: number
  content: string
  parentCommentId: number | null
  authorId: number
  isEdited: boolean
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
  author?: AuthorRef
  replies?: unknown[]
}) {
  return {
    id: c.id,
    entity_type: c.entityType,
    entity_id: c.entityId,
    content: c.isDeleted ? '[삭제된 댓글]' : c.content,
    parent_comment_id: c.parentCommentId,
    author_id: c.authorId,
    author_name: c.author ? [c.author.firstName, c.author.lastName].filter(Boolean).join(' ') || c.author.username : null,
    is_edited: c.isEdited,
    is_deleted: c.isDeleted,
    created_at: c.createdAt.toISOString(),
    updated_at: c.updatedAt.toISOString(),
    replies: c.replies ?? [],
  }
}

function serializeWorkflow(w: {
  id: number
  name: string
  description: string | null
  workflowType: string
  initialStatus: string
  isActive: boolean
  projectId: number | null
  createdBy: number
  createdAt: Date
  updatedAt: Date
  steps?: {
    id: number
    name: string
    displayName: string
    description: string | null
    order: number
    allowedRoles: string | null
    nextSteps: string | null
  }[]
}) {
  return {
    id: w.id,
    name: w.name,
    description: w.description,
    workflow_type: w.workflowType,
    initial_status: w.initialStatus,
    is_active: w.isActive,
    project_id: w.projectId,
    created_by: w.createdBy,
    created_at: w.createdAt.toISOString(),
    updated_at: w.updatedAt.toISOString(),
    steps: (w.steps ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      display_name: s.displayName,
      description: s.description,
      order: s.order,
      allowed_roles: s.allowedRoles ? JSON.parse(s.allowedRoles) : [],
      next_steps: s.nextSteps ? JSON.parse(s.nextSteps) : [],
    })),
  }
}

function serializeWorkflowState(s: {
  id: number
  entityType: string
  entityId: number
  workflowId: number
  currentStepId: number | null
  currentStatus: string
  previousStatus: string | null
  changedBy: number | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: s.id,
    entity_type: s.entityType,
    entity_id: s.entityId,
    workflow_id: s.workflowId,
    current_step_id: s.currentStepId,
    current_status: s.currentStatus,
    previous_status: s.previousStatus,
    changed_by: s.changedBy,
    created_at: s.createdAt.toISOString(),
    updated_at: s.updatedAt.toISOString(),
  }
}
