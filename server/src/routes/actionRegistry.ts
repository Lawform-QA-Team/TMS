import { Hono } from 'hono'
import { db } from '../lib/db.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

export const actionRegistryRouter = new Hono()

function parseJson(s: string | null | undefined, fallback: unknown = null) {
  try { return s ? JSON.parse(s) : fallback } catch { return fallback }
}

function serialize(a: {
  id: number; name: string; description: string | null; category: string
  code: string; parameters: string | null; selectorIds: string | null
  projectKey: string; createdAt: Date; updatedAt: Date
}) {
  return {
    ...a,
    parameters: parseJson(a.parameters, []),
    selectorIds: parseJson(a.selectorIds, []),
  }
}

// GET /action-registry?projectKey=xxx&category=yyy
actionRegistryRouter.get('/', requireAuth, async (c) => {
  try {
    const projectKey = c.req.query('projectKey')
    const category = c.req.query('category')
    const where: Record<string, string> = {}
    if (projectKey) where.projectKey = projectKey
    if (category) where.category = category

    const actions = await db.actionRegistry.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })
    return c.json(actions.map(serialize))
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})

// GET /action-registry/:id
actionRegistryRouter.get('/:id', requireAuth, async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const action = await db.actionRegistry.findUnique({ where: { id } })
    if (!action) return c.json({ error: '항목을 찾을 수 없습니다.' }, 404)
    return c.json(serialize(action))
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})

// POST /action-registry
actionRegistryRouter.post('/', requireAuth, requireAdmin, async (c) => {
  try {
    const body = await c.req.json()
    const { name, description, category, code, parameters, selectorIds, projectKey } = body
    if (!name || !category || !code || !projectKey) {
      return c.json({ error: 'name, category, code, projectKey는 필수입니다.' }, 400)
    }
    const action = await db.actionRegistry.create({
      data: {
        name,
        description: description ?? null,
        category,
        code,
        parameters: parameters ? JSON.stringify(parameters) : null,
        selectorIds: selectorIds ? JSON.stringify(selectorIds) : null,
        projectKey,
      },
    })
    return c.json(serialize(action), 201)
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})

// PUT /action-registry/:id
actionRegistryRouter.put('/:id', requireAuth, requireAdmin, async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const body = await c.req.json()
    const existing = await db.actionRegistry.findUnique({ where: { id } })
    if (!existing) return c.json({ error: '항목을 찾을 수 없습니다.' }, 404)

    const { name, description, category, code, parameters, selectorIds, projectKey } = body
    const action = await db.actionRegistry.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        description: description !== undefined ? description : existing.description,
        category: category ?? existing.category,
        code: code ?? existing.code,
        parameters: parameters !== undefined ? JSON.stringify(parameters) : existing.parameters,
        selectorIds: selectorIds !== undefined ? JSON.stringify(selectorIds) : existing.selectorIds,
        projectKey: projectKey ?? existing.projectKey,
      },
    })
    return c.json(serialize(action))
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})

// DELETE /action-registry/:id
actionRegistryRouter.delete('/:id', requireAuth, requireAdmin, async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const existing = await db.actionRegistry.findUnique({ where: { id } })
    if (!existing) return c.json({ error: '항목을 찾을 수 없습니다.' }, 404)
    await db.actionRegistry.delete({ where: { id } })
    return c.json({ message: '삭제되었습니다.' })
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})
