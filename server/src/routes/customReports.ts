import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { db } from '../lib/db.js'
import { logger } from '../lib/logger.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'
import fs from 'node:fs'
import path from 'node:path'

export const customReportsRouter = new Hono()

// ──────────────────────────────────────────────
// GET /custom-reports
// ──────────────────────────────────────────────
customReportsRouter.get('/', optionalAuth, async (c) => {
  try {
    const reportType = c.req.query('report_type')
    const projectId = c.req.query('project_id') ? Number(c.req.query('project_id')) : undefined
    const user = c.get('user') as { sub: string } | undefined

    const where: Record<string, unknown> = {}
    if (reportType) where.reportType = reportType
    if (projectId) where.projectId = projectId

    // 공개 리포트 또는 본인이 생성한 리포트만
    if (user && user.sub !== 'guest') {
      where.OR = [{ isPublic: true }, { createdBy: Number(user.sub) }]
    } else {
      where.isPublic = true
    }

    const reports = await db.customReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return c.json(reports.map(serializeReport))
  } catch (e) {
    logger.error({ e }, '리포트 목록 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /custom-reports/executions/:executionId
// ──────────────────────────────────────────────
customReportsRouter.get('/executions/:executionId', optionalAuth, async (c) => {
  try {
    const id = Number(c.req.param('executionId'))
    const execution = await db.reportExecution.findUnique({ where: { id } })
    if (!execution) return c.json({ error: '실행 기록을 찾을 수 없습니다.' }, 404)
    return c.json(serializeExecution(execution))
  } catch (e) {
    logger.error({ e }, '리포트 실행 기록 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /custom-reports/executions/:executionId/download
// ──────────────────────────────────────────────
customReportsRouter.get('/executions/:executionId/download', optionalAuth, async (c) => {
  try {
    const id = Number(c.req.param('executionId'))
    const execution = await db.reportExecution.findUnique({ where: { id } })
    if (!execution) return c.json({ error: '실행 기록을 찾을 수 없습니다.' }, 404)

    if (execution.status !== 'completed' || !execution.resultFilePath) {
      return c.json({ error: '리포트가 아직 생성되지 않았습니다.' }, 400)
    }

    if (!fs.existsSync(execution.resultFilePath)) {
      return c.json({ error: '리포트 파일을 찾을 수 없습니다.' }, 404)
    }

    const fileName = path.basename(execution.resultFilePath)
    const fileContent = fs.readFileSync(execution.resultFilePath)
    return new Response(fileContent, {
      headers: {
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Type': 'application/octet-stream',
      },
    })
  } catch (e) {
    logger.error({ e }, '리포트 다운로드 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /custom-reports/:id
// ──────────────────────────────────────────────
customReportsRouter.get('/:id', optionalAuth, async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const report = await db.customReport.findUnique({ where: { id } })
    if (!report) return c.json({ error: '리포트를 찾을 수 없습니다.' }, 404)

    const user = c.get('user') as { sub: string } | undefined
    if (!report.isPublic) {
      if (!user || user.sub === 'guest' || report.createdBy !== Number(user.sub)) {
        return c.json({ error: '리포트에 접근할 권한이 없습니다.' }, 403)
      }
    }

    return c.json(serializeReport(report))
  } catch (e) {
    logger.error({ e }, '리포트 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// POST /custom-reports
// ──────────────────────────────────────────────
customReportsRouter.post(
  '/',
  requireAuth,
  zValidator(
    'json',
    z.object({
      name: z.string().min(1),
      report_type: z.string().min(1),
      config: z.record(z.unknown()),
      description: z.string().optional(),
      template: z.string().optional(),
      output_format: z.string().default('html'),
      filters: z.record(z.unknown()).optional(),
      project_id: z.number().optional(),
      is_public: z.boolean().default(false),
    }),
  ),
  async (c) => {
    try {
      const { sub } = c.get('user')
      const data = c.req.valid('json')

      const report = await db.customReport.create({
        data: {
          name: data.name,
          reportType: data.report_type,
          config: JSON.stringify(data.config),
          description: data.description ?? null,
          template: data.template ?? null,
          outputFormat: data.output_format,
          filters: data.filters ? JSON.stringify(data.filters) : null,
          projectId: data.project_id ?? null,
          isPublic: data.is_public,
          createdBy: Number(sub),
          createdAt: new Date(),
        },
      })

      return c.json({ message: '리포트가 생성되었습니다.', report: serializeReport(report) }, 201)
    } catch (e) {
      logger.error({ e }, '리포트 생성 오류')
      return c.json({ error: String(e) }, 500)
    }
  },
)

// ──────────────────────────────────────────────
// PUT /custom-reports/:id
// ──────────────────────────────────────────────
customReportsRouter.put(
  '/:id',
  requireAuth,
  zValidator(
    'json',
    z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      config: z.record(z.unknown()).optional(),
      template: z.string().optional(),
      output_format: z.string().optional(),
      filters: z.record(z.unknown()).optional(),
      is_public: z.boolean().optional(),
    }),
  ),
  async (c) => {
    try {
      const { sub } = c.get('user')
      const id = Number(c.req.param('id'))
      const data = c.req.valid('json')

      const report = await db.customReport.findUnique({ where: { id } })
      if (!report) return c.json({ error: '리포트를 찾을 수 없습니다.' }, 404)
      if (report.createdBy !== Number(sub)) {
        return c.json({ error: '리포트를 수정할 권한이 없습니다.' }, 403)
      }

      const updated = await db.customReport.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.config !== undefined && { config: JSON.stringify(data.config) }),
          ...(data.template !== undefined && { template: data.template }),
          ...(data.output_format !== undefined && { outputFormat: data.output_format }),
          ...(data.filters !== undefined && { filters: JSON.stringify(data.filters) }),
          ...(data.is_public !== undefined && { isPublic: data.is_public }),
        },
      })

      return c.json({ message: '리포트가 수정되었습니다.', report: serializeReport(updated) })
    } catch (e) {
      logger.error({ e }, '리포트 수정 오류')
      return c.json({ error: String(e) }, 500)
    }
  },
)

// ──────────────────────────────────────────────
// DELETE /custom-reports/:id
// ──────────────────────────────────────────────
customReportsRouter.delete('/:id', requireAuth, async (c) => {
  try {
    const { sub } = c.get('user')
    const id = Number(c.req.param('id'))

    const report = await db.customReport.findUnique({ where: { id } })
    if (!report) return c.json({ error: '리포트를 찾을 수 없습니다.' }, 404)
    if (report.createdBy !== Number(sub)) {
      return c.json({ error: '리포트를 삭제할 권한이 없습니다.' }, 403)
    }

    await db.customReport.delete({ where: { id } })
    return c.json({ message: '리포트가 삭제되었습니다.' })
  } catch (e) {
    logger.error({ e }, '리포트 삭제 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// POST /custom-reports/:id/generate
// ──────────────────────────────────────────────
customReportsRouter.post('/:id/generate', requireAuth, async (c) => {
  try {
    const { sub } = c.get('user')
    const id = Number(c.req.param('id'))
    const body = await c.req.json().catch(() => ({}))
    const executionParams = body?.execution_params ?? {}

    const report = await db.customReport.findUnique({ where: { id } })
    if (!report) return c.json({ error: '리포트를 찾을 수 없습니다.' }, 404)

    const execution = await db.reportExecution.create({
      data: {
        reportId: id,
        status: 'pending',
        startedAt: new Date(),
        executionParams: JSON.stringify(executionParams),
        executedBy: Number(sub),
      },
    })

    return c.json({
      message: '리포트 생성이 시작되었습니다.',
      execution: serializeExecution(execution),
    })
  } catch (e) {
    logger.error({ e }, '리포트 실행 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /custom-reports/:id/executions
// ──────────────────────────────────────────────
customReportsRouter.get('/:id/executions', optionalAuth, async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const executions = await db.reportExecution.findMany({
      where: { reportId: id },
      orderBy: { startedAt: 'desc' },
    })
    return c.json(executions.map(serializeExecution))
  } catch (e) {
    logger.error({ e }, '리포트 실행 기록 목록 조회 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// 내부 헬퍼
// ──────────────────────────────────────────────
function serializeReport(r: {
  id: number
  name: string
  description: string | null
  reportType: string | null
  config: string
  template: string | null
  outputFormat: string | null
  scheduleEnabled: boolean | null
  scheduleExpression: string | null
  filters: string | null
  isPublic: boolean | null
  projectId: number | null
  createdBy: number
  createdAt: Date | null
  updatedAt: Date | null
}) {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    report_type: r.reportType,
    config: safeJsonParse(r.config),
    template: r.template,
    output_format: r.outputFormat,
    schedule_enabled: r.scheduleEnabled,
    schedule_expression: r.scheduleExpression,
    filters: safeJsonParse(r.filters),
    is_public: r.isPublic,
    project_id: r.projectId,
    created_by: r.createdBy,
    created_at: r.createdAt?.toISOString() ?? null,
    updated_at: r.updatedAt?.toISOString() ?? null,
  }
}

function serializeExecution(e: {
  id: number
  reportId: number
  status: string | null
  startedAt: Date | null
  completedAt: Date | null
  resultFilePath: string | null
  executionParams: string | null
  errorMessage: string | null
  executedBy: number | null
}) {
  return {
    id: e.id,
    report_id: e.reportId,
    status: e.status,
    started_at: e.startedAt?.toISOString() ?? null,
    completed_at: e.completedAt?.toISOString() ?? null,
    result_file_path: e.resultFilePath,
    execution_params: safeJsonParse(e.executionParams),
    error_message: e.errorMessage,
    executed_by: e.executedBy,
  }
}

function safeJsonParse(v: string | null): unknown {
  if (!v) return null
  try { return JSON.parse(v) } catch { return v }
}
