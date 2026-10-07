import { Hono } from 'hono'
import { db } from '../lib/db.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

export const apiEndpointsRouter = new Hono()

// GET /api-endpoints?projectKey=xxx
apiEndpointsRouter.get('/', requireAuth, async (c) => {
  try {
    const projectKey = c.req.query('projectKey')
    const where = projectKey ? { projectKey } : {}
    const endpoints = await db.apiEndpoint.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return c.json(
      endpoints.map((e) => ({
        ...e,
        tags: Array.isArray(e.tags) ? e.tags : (e.tags ? JSON.parse(e.tags as string) : []),
      }))
    )
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})

// POST /api-endpoints
apiEndpointsRouter.post('/', requireAuth, requireAdmin, async (c) => {
  try {
    const body = await c.req.json()
    const { method, path, description, tags, requestBody, responseSchema, authRequired, projectKey } = body

    if (!method || !path || !projectKey) {
      return c.json({ error: 'method, path, projectKey는 필수입니다.' }, 400)
    }

    const endpoint = await db.apiEndpoint.create({
      data: {
        method: method.toUpperCase(),
        path,
        description: description ?? null,
        tags: tags ?? [],
        requestBody: requestBody ?? undefined,
        responseSchema: responseSchema ?? undefined,
        authRequired: authRequired !== false,
        projectKey,
      },
    })

    return c.json({
      ...endpoint,
      tags: Array.isArray(endpoint.tags) ? endpoint.tags : (endpoint.tags ? JSON.parse(endpoint.tags as string) : []),
    }, 201)
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})

// PUT /api-endpoints/:id
apiEndpointsRouter.put('/:id', requireAuth, requireAdmin, async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const body = await c.req.json()
    const { method, path, description, tags, requestBody, responseSchema, authRequired, projectKey } = body

    const existing = await db.apiEndpoint.findUnique({ where: { id } })
    if (!existing) return c.json({ error: '항목을 찾을 수 없습니다.' }, 404)

    const endpoint = await db.apiEndpoint.update({
      where: { id },
      data: {
        ...(method && { method: method.toUpperCase() }),
        ...(path && { path }),
        description: description ?? existing.description,
        tags: tags !== undefined ? tags : existing.tags,
        requestBody: requestBody ?? existing.requestBody,
        responseSchema: responseSchema ?? existing.responseSchema,
        authRequired: authRequired !== undefined ? authRequired : existing.authRequired,
        ...(projectKey && { projectKey }),
      },
    })

    return c.json({
      ...endpoint,
      tags: Array.isArray(endpoint.tags) ? endpoint.tags : (endpoint.tags ? JSON.parse(endpoint.tags as string) : []),
    })
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})

// POST /api-endpoints/bulk
apiEndpointsRouter.post('/bulk', requireAuth, requireAdmin, async (c) => {
  try {
    const body = await c.req.json()
    const { items } = body

    if (!Array.isArray(items) || items.length === 0) {
      return c.json({ error: 'items 배열이 필요합니다.' }, 400)
    }

    for (const item of items) {
      if (!item.method || !item.path || !item.projectKey) {
        return c.json({ error: 'method, path, projectKey는 필수입니다.' }, 400)
      }
    }

    const created = await db.apiEndpoint.createMany({
      data: items.map((item: any) => ({
        method: item.method.toUpperCase(),
        path: item.path,
        description: item.description ?? null,
        tags: item.tags ?? [],
        authRequired: item.authRequired !== false,
        projectKey: item.projectKey,
      })),
      skipDuplicates: false,
    })

    return c.json({ count: created.count }, 201)
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})

// DELETE /api-endpoints/:id
apiEndpointsRouter.delete('/:id', requireAuth, requireAdmin, async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const existing = await db.apiEndpoint.findUnique({ where: { id } })
    if (!existing) return c.json({ error: '항목을 찾을 수 없습니다.' }, 404)

    await db.apiEndpoint.delete({ where: { id } })
    return c.json({ message: '삭제되었습니다.' })
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})
