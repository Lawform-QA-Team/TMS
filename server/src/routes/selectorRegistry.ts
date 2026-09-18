import { Hono } from 'hono'
import { db } from '../lib/db.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

export const selectorRegistryRouter = new Hono()

// GET /selector-registry?projectKey=xxx
selectorRegistryRouter.get('/', requireAuth, async (c) => {
  try {
    const projectKey = c.req.query('projectKey')
    const where = projectKey ? { projectKey } : {}
    const selectors = await db.selectorRegistry.findMany({
      where,
      orderBy: [{ pageName: 'asc' }, { elementName: 'asc' }],
    })
    return c.json(selectors)
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})

// POST /selector-registry
selectorRegistryRouter.post('/', requireAuth, requireAdmin, async (c) => {
  try {
    const body = await c.req.json()
    const { pageName, elementName, dataTid, elementType, description, projectKey } = body

    if (!pageName || !elementName || !dataTid || !elementType || !projectKey) {
      return c.json({ error: 'pageName, elementName, dataTid, elementType, projectKey는 필수입니다.' }, 400)
    }

    const selector = `[data-tid="${dataTid}"]`

    const entry = await db.selectorRegistry.create({
      data: {
        pageName,
        elementName,
        dataTid,
        selector,
        elementType,
        description: description ?? null,
        projectKey,
      },
    })

    return c.json(entry, 201)
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})

// PUT /selector-registry/:id
selectorRegistryRouter.put('/:id', requireAuth, requireAdmin, async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const body = await c.req.json()
    const { pageName, elementName, dataTid, elementType, description, projectKey } = body

    const existing = await db.selectorRegistry.findUnique({ where: { id } })
    if (!existing) return c.json({ error: '항목을 찾을 수 없습니다.' }, 404)

    const newDataTid = dataTid ?? existing.dataTid
    const selector = `[data-tid="${newDataTid}"]`

    const entry = await db.selectorRegistry.update({
      where: { id },
      data: {
        pageName: pageName ?? existing.pageName,
        elementName: elementName ?? existing.elementName,
        dataTid: newDataTid,
        selector,
        elementType: elementType ?? existing.elementType,
        description: description !== undefined ? description : existing.description,
        projectKey: projectKey ?? existing.projectKey,
      },
    })

    return c.json(entry)
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})

// DELETE /selector-registry/:id
selectorRegistryRouter.delete('/:id', requireAuth, requireAdmin, async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const existing = await db.selectorRegistry.findUnique({ where: { id } })
    if (!existing) return c.json({ error: '항목을 찾을 수 없습니다.' }, 404)

    await db.selectorRegistry.delete({ where: { id } })
    return c.json({ message: '삭제되었습니다.' })
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})
