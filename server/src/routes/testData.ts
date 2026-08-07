import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { db } from '../lib/db.js'
import { requireAuth } from '../middleware/auth.js'
import { logger } from '../lib/logger.js'

export const testDataRouter = new Hono()

// ──────────────────────────────────────────────
// GET /test-data/datasets
// ──────────────────────────────────────────────
testDataRouter.get('/datasets', async (c) => {
  try {
    const environment = c.req.query('environment')
    const tag = c.req.query('tag')
    const search = c.req.query('search') ?? ''

    const where: Record<string, unknown> = {}
    if (environment) where.environment = environment
    if (search) {
      where.OR = [{ name: { contains: search } }, { description: { contains: search } }]
    }

    const datasets = await db.testDataSet.findMany({ where, orderBy: { createdAt: 'desc' } })

    // tag 필터링 (JSON 배열이므로 in-memory 처리)
    const filtered = tag
      ? datasets.filter((ds) => {
          if (!ds.tags) return false
          try {
            const tags: string[] = JSON.parse(ds.tags)
            return tags.includes(tag)
          } catch {
            return ds.tags.includes(tag)
          }
        })
      : datasets

    return c.json(filtered.map(serializeDataSet))
  } catch (e) {
    logger.error({ e }, '데이터 세트 목록 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// POST /test-data/datasets
// ──────────────────────────────────────────────
testDataRouter.post(
  '/datasets',
  requireAuth,
  zValidator(
    'json',
    z.object({
      name: z.string().min(1, 'name은 필수입니다'),
      data: z.unknown(),
      environment: z.string().default('dev'),
      description: z.string().optional(),
      data_type: z.string().default('json'),
      masking_enabled: z.boolean().default(false),
      masking_rules: z.record(z.unknown()).optional(),
      tags: z.array(z.string()).optional(),
    }),
  ),
  async (c) => {
    const body = c.req.valid('json')
    const user = c.get('user')
    try {
      const dataStr = typeof body.data === 'string' ? body.data : JSON.stringify(body.data)
      const dataset = await db.testDataSet.create({
        data: {
          name: body.name,
          data: dataStr,
          environment: body.environment,
          description: body.description ?? null,
          dataType: body.data_type,
          maskingEnabled: body.masking_enabled,
          maskingRules: body.masking_rules ? JSON.stringify(body.masking_rules) : null,
          tags: body.tags ? JSON.stringify(body.tags) : null,
          createdBy: Number(user.sub),
        },
      })
      return c.json({ message: '데이터 세트가 생성되었습니다', id: dataset.id, data_set: serializeDataSet(dataset) }, 201)
    } catch (e) {
      logger.error({ e }, '데이터 세트 생성 오류')
      return c.json({ error: String(e) }, 500)
    }
  },
)

// ──────────────────────────────────────────────
// GET /test-data/datasets/:id
// ──────────────────────────────────────────────
testDataRouter.get('/datasets/:id', async (c) => {
  const id = Number(c.req.param('id'))
  try {
    const dataset = await db.testDataSet.findUnique({ where: { id } })
    if (!dataset) return c.json({ error: '데이터 세트를 찾을 수 없습니다' }, 404)
    const serialized = serializeDataSet(dataset)
    const includeMasked = c.req.query('masked') === 'true'
    let parsedData: unknown
    try {
      parsedData = JSON.parse(dataset.data)
    } catch {
      parsedData = dataset.data
    }
    return c.json({ ...serialized, data: parsedData, masked: includeMasked && dataset.maskingEnabled })
  } catch (e) {
    logger.error({ e }, '데이터 세트 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// PUT /test-data/datasets/:id
// ──────────────────────────────────────────────
testDataRouter.put('/datasets/:id', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const dataset = await db.testDataSet.findUnique({ where: { id } })
  if (!dataset) return c.json({ error: '데이터 세트를 찾을 수 없습니다' }, 404)

  try {
    const data = await c.req.json()
    await db.testDataSet.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.data !== undefined && {
          data: typeof data.data === 'string' ? data.data : JSON.stringify(data.data),
        }),
        ...(data.environment !== undefined && { environment: data.environment }),
        ...(data.masking_enabled !== undefined && { maskingEnabled: data.masking_enabled }),
        ...(data.masking_rules !== undefined && {
          maskingRules: data.masking_rules ? JSON.stringify(data.masking_rules) : null,
        }),
        ...(data.tags !== undefined && {
          tags: data.tags ? JSON.stringify(data.tags) : null,
        }),
      },
    })
    const updated = await db.testDataSet.findUnique({ where: { id } })
    return c.json({ message: '데이터 세트가 수정되었습니다', data_set: serializeDataSet(updated!) })
  } catch (e) {
    logger.error({ e }, '데이터 세트 수정 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// DELETE /test-data/datasets/:id
// ──────────────────────────────────────────────
testDataRouter.delete('/datasets/:id', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const dataset = await db.testDataSet.findUnique({ where: { id } })
  if (!dataset) return c.json({ error: '데이터 세트를 찾을 수 없습니다' }, 404)

  try {
    const mappingCount = await db.testCaseDataMapping.count({ where: { dataSetId: id } })
    if (mappingCount > 0) {
      return c.json({ error: `${mappingCount}개의 테스트 케이스에 매핑되어 있어 삭제할 수 없습니다`, mappings_count: mappingCount }, 400)
    }
    await db.testDataSet.delete({ where: { id } })
    return c.json({ message: '데이터 세트가 삭제되었습니다' })
  } catch (e) {
    logger.error({ e }, '데이터 세트 삭제 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// POST /test-data/datasets/:id/versions
// ──────────────────────────────────────────────
testDataRouter.post('/datasets/:id/versions', requireAuth, async (c) => {
  const parentId = Number(c.req.param('id'))
  const parent = await db.testDataSet.findUnique({ where: { id: parentId } })
  if (!parent) return c.json({ error: '데이터 세트를 찾을 수 없습니다' }, 404)

  try {
    const body = await c.req.json()
    if (!body.data) return c.json({ error: 'data는 필수입니다' }, 400)
    const user = c.get('user')
    const dataStr = typeof body.data === 'string' ? body.data : JSON.stringify(body.data)
    const newVersion = await db.testDataSet.create({
      data: {
        name: parent.name,
        data: dataStr,
        environment: parent.environment,
        dataType: parent.dataType,
        parentVersionId: parentId,
        version: body.version ?? '1.0',
        maskingEnabled: parent.maskingEnabled,
        createdBy: Number(user.sub),
      },
    })
    return c.json({ message: '데이터 세트 버전이 생성되었습니다', id: newVersion.id, data_set: serializeDataSet(newVersion) }, 201)
  } catch (e) {
    logger.error({ e }, '데이터 세트 버전 생성 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /test-data/datasets/:id/versions
// ──────────────────────────────────────────────
testDataRouter.get('/datasets/:id/versions', async (c) => {
  const id = Number(c.req.param('id'))
  try {
    const parent = await db.testDataSet.findUnique({ where: { id } })
    if (!parent) return c.json({ error: '데이터 세트를 찾을 수 없습니다' }, 404)
    const children = await db.testDataSet.findMany({
      where: { parentVersionId: id },
      orderBy: { createdAt: 'desc' },
    })
    return c.json([parent, ...children].map(serializeDataSet))
  } catch (e) {
    logger.error({ e }, '데이터 세트 버전 목록 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /test-data/testcases/:testCaseId/data
// ──────────────────────────────────────────────
testDataRouter.get('/testcases/:testCaseId/data', async (c) => {
  const testCaseId = Number(c.req.param('testCaseId'))
  const environment = c.req.query('environment')
  try {
    const where: Record<string, unknown> = { testCaseId, enabled: true }
    const mapping = await db.testCaseDataMapping.findFirst({
      where,
      orderBy: { priority: 'asc' },
      include: { dataSet: true },
    })
    if (!mapping || !environment || mapping.dataSet.environment === environment) {
      if (mapping) {
        let data: unknown
        try { data = JSON.parse(mapping.dataSet.data) } catch { data = mapping.dataSet.data }
        return c.json({ test_case_id: testCaseId, data })
      }
    }
    return c.json({ test_case_id: testCaseId, data: null, message: '매핑된 데이터 세트가 없습니다' })
  } catch (e) {
    logger.error({ e }, '테스트 케이스 데이터 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /test-data/mappings
// ──────────────────────────────────────────────
testDataRouter.get('/mappings', async (c) => {
  try {
    const testCaseId = c.req.query('test_case_id') ? Number(c.req.query('test_case_id')) : null
    const dataSetId = c.req.query('data_set_id') ? Number(c.req.query('data_set_id')) : null

    const where: Record<string, unknown> = {}
    if (testCaseId) where.testCaseId = testCaseId
    if (dataSetId) where.dataSetId = dataSetId

    const mappings = await db.testCaseDataMapping.findMany({ where, orderBy: { priority: 'asc' } })
    return c.json(mappings.map(serializeMapping))
  } catch (e) {
    logger.error({ e }, '매핑 목록 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// POST /test-data/mappings
// ──────────────────────────────────────────────
testDataRouter.post(
  '/mappings',
  requireAuth,
  zValidator(
    'json',
    z.object({
      test_case_id: z.number(),
      data_set_id: z.number(),
      field_mapping: z.record(z.unknown()).optional(),
      priority: z.number().default(1),
      enabled: z.boolean().default(true),
    }),
  ),
  async (c) => {
    const data = c.req.valid('json')
    try {
      const existing = await db.testCaseDataMapping.findFirst({
        where: { testCaseId: data.test_case_id, dataSetId: data.data_set_id },
      })
      if (existing) return c.json({ error: '이미 매핑이 존재합니다' }, 400)

      const mapping = await db.testCaseDataMapping.create({
        data: {
          testCaseId: data.test_case_id,
          dataSetId: data.data_set_id,
          fieldMapping: data.field_mapping ? JSON.stringify(data.field_mapping) : null,
          priority: data.priority,
          enabled: data.enabled,
        },
      })
      return c.json({ message: '매핑이 생성되었습니다', id: mapping.id, mapping: serializeMapping(mapping) }, 201)
    } catch (e) {
      logger.error({ e }, '매핑 생성 오류')
      return c.json({ error: String(e) }, 500)
    }
  },
)

// ──────────────────────────────────────────────
// PUT /test-data/mappings/:id
// ──────────────────────────────────────────────
testDataRouter.put('/mappings/:id', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const mapping = await db.testCaseDataMapping.findUnique({ where: { id } })
  if (!mapping) return c.json({ error: '매핑을 찾을 수 없습니다' }, 404)

  try {
    const data = await c.req.json()
    await db.testCaseDataMapping.update({
      where: { id },
      data: {
        ...(data.field_mapping !== undefined && {
          fieldMapping: data.field_mapping ? JSON.stringify(data.field_mapping) : null,
        }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.enabled !== undefined && { enabled: data.enabled }),
      },
    })
    const updated = await db.testCaseDataMapping.findUnique({ where: { id } })
    return c.json({ message: '매핑이 수정되었습니다', mapping: serializeMapping(updated!) })
  } catch (e) {
    logger.error({ e }, '매핑 수정 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// DELETE /test-data/mappings/:id
// ──────────────────────────────────────────────
testDataRouter.delete('/mappings/:id', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const mapping = await db.testCaseDataMapping.findUnique({ where: { id } })
  if (!mapping) return c.json({ error: '매핑을 찾을 수 없습니다' }, 404)

  try {
    await db.testCaseDataMapping.delete({ where: { id } })
    return c.json({ message: '매핑이 삭제되었습니다' })
  } catch (e) {
    logger.error({ e }, '매핑 삭제 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// POST /test-data/generate
// ──────────────────────────────────────────────
testDataRouter.post('/generate', requireAuth, async (c) => {
  try {
    const body = await c.req.json()
    if (!body.schema) return c.json({ error: 'schema는 필수입니다' }, 400)
    const count = body.count ?? 1
    const schema: Record<string, string> = body.schema

    // 간단한 동적 데이터 생성
    const generatedData = Array.from({ length: count }, (_, i) => {
      const record: Record<string, unknown> = {}
      for (const [key, type] of Object.entries(schema)) {
        switch (type) {
          case 'string': record[key] = `test_${key}_${i + 1}`; break
          case 'number': record[key] = Math.floor(Math.random() * 1000); break
          case 'boolean': record[key] = Math.random() > 0.5; break
          case 'email': record[key] = `test_${i + 1}@example.com`; break
          default: record[key] = `value_${i + 1}`
        }
      }
      return record
    })

    return c.json({ message: `${count}개의 데이터가 생성되었습니다`, data: generatedData, count: generatedData.length })
  } catch (e) {
    logger.error({ e }, '동적 데이터 생성 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// 내부 헬퍼
// ──────────────────────────────────────────────
function serializeDataSet(ds: {
  id: number
  name: string
  description: string | null
  data: string
  dataType: string
  dataSchema: string | null
  environment: string
  version: string
  parentVersionId: number | null
  maskingEnabled: boolean
  maskingRules: string | null
  tags: string | null
  usageCount: number | null
  lastUsedAt: Date | null
  createdBy: number
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: ds.id,
    name: ds.name,
    description: ds.description,
    data_type: ds.dataType,
    data_schema: ds.dataSchema,
    environment: ds.environment,
    version: ds.version,
    parent_version_id: ds.parentVersionId,
    masking_enabled: ds.maskingEnabled,
    masking_rules: ds.maskingRules ? JSON.parse(ds.maskingRules) : null,
    tags: ds.tags ? JSON.parse(ds.tags) : null,
    usage_count: ds.usageCount,
    last_used_at: ds.lastUsedAt?.toISOString() ?? null,
    created_by: ds.createdBy,
    created_at: ds.createdAt.toISOString(),
    updated_at: ds.updatedAt.toISOString(),
  }
}

function serializeMapping(m: {
  id: number
  testCaseId: number
  dataSetId: number
  fieldMapping: string | null
  priority: number
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: m.id,
    test_case_id: m.testCaseId,
    data_set_id: m.dataSetId,
    field_mapping: m.fieldMapping ? JSON.parse(m.fieldMapping) : null,
    priority: m.priority,
    enabled: m.enabled,
    created_at: m.createdAt.toISOString(),
    updated_at: m.updatedAt.toISOString(),
  }
}
