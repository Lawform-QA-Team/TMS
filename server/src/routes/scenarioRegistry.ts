import { Hono } from 'hono'
import { db } from '../lib/db.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

export const scenarioRegistryRouter = new Hono()

function parseSteps(s: string | null | undefined): unknown[] {
  try { return s ? JSON.parse(s) : [] } catch { return [] }
}

function serialize(s: {
  id: number; name: string; description: string | null; category: string
  steps: string; projectKey: string; createdAt: Date; updatedAt: Date
}) {
  return { ...s, steps: parseSteps(s.steps) }
}

// GET /scenario-registry?projectKey=xxx&category=yyy
scenarioRegistryRouter.get('/', requireAuth, async (c) => {
  try {
    const projectKey = c.req.query('projectKey')
    const category = c.req.query('category')
    const where: Record<string, string> = {}
    if (projectKey) where.projectKey = projectKey
    if (category) where.category = category

    const scenarios = await db.scenarioRegistry.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })
    return c.json(scenarios.map(serialize))
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})

// GET /scenario-registry/:id
scenarioRegistryRouter.get('/:id', requireAuth, async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const scenario = await db.scenarioRegistry.findUnique({ where: { id } })
    if (!scenario) return c.json({ error: '항목을 찾을 수 없습니다.' }, 404)
    return c.json(serialize(scenario))
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})

// POST /scenario-registry
scenarioRegistryRouter.post('/', requireAuth, requireAdmin, async (c) => {
  try {
    const body = await c.req.json()
    const { name, description, category, steps, projectKey } = body
    if (!name || !category || !projectKey) {
      return c.json({ error: 'name, category, projectKey는 필수입니다.' }, 400)
    }
    const scenario = await db.scenarioRegistry.create({
      data: {
        name,
        description: description ?? null,
        category,
        steps: steps ? JSON.stringify(steps) : '[]',
        projectKey,
      },
    })
    return c.json(serialize(scenario), 201)
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})

// PUT /scenario-registry/:id
scenarioRegistryRouter.put('/:id', requireAuth, requireAdmin, async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const body = await c.req.json()
    const existing = await db.scenarioRegistry.findUnique({ where: { id } })
    if (!existing) return c.json({ error: '항목을 찾을 수 없습니다.' }, 404)

    const { name, description, category, steps, projectKey } = body
    const scenario = await db.scenarioRegistry.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        description: description !== undefined ? description : existing.description,
        category: category ?? existing.category,
        steps: steps !== undefined ? JSON.stringify(steps) : existing.steps,
        projectKey: projectKey ?? existing.projectKey,
      },
    })
    return c.json(serialize(scenario))
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})

// DELETE /scenario-registry/:id
scenarioRegistryRouter.delete('/:id', requireAuth, requireAdmin, async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const existing = await db.scenarioRegistry.findUnique({ where: { id } })
    if (!existing) return c.json({ error: '항목을 찾을 수 없습니다.' }, 404)
    await db.scenarioRegistry.delete({ where: { id } })
    return c.json({ message: '삭제되었습니다.' })
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})
