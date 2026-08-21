import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { db } from '../lib/db.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { logger } from '../lib/logger.js'

export const foldersRouter = new Hono()

// ──────────────────────────────────────────────
// POST /folders/feature  (주의: /:id 보다 먼저 등록)
// ──────────────────────────────────────────────
foldersRouter.post('/feature', requireAuth, async (c) => {
  const featureFolders = [
    { folderName: 'CLM/Draft', parentFolderId: 4 },
    { folderName: 'CLM/Review', parentFolderId: 4 },
    { folderName: 'CLM/Sign', parentFolderId: 4 },
    { folderName: 'CLM/Process', parentFolderId: 4 },
    { folderName: 'Litigation/Draft', parentFolderId: 5 },
    { folderName: 'Litigation/Schedule', parentFolderId: 5 },
    { folderName: 'Dashboard/Setting', parentFolderId: 6 },
  ]

  const addedFolders: string[] = []
  try {
    for (const feat of featureFolders) {
      const existing = await db.folder.findFirst({
        where: { folderName: feat.folderName, parentFolderId: feat.parentFolderId },
      })
      if (!existing) {
        await db.folder.create({ data: { folderName: feat.folderName, parentFolderId: feat.parentFolderId } })
        addedFolders.push(feat.folderName)
      }
    }

    if (addedFolders.length > 0) {
      return c.json({
        status: 'success',
        message: `기능 폴더 ${addedFolders.length}개가 추가되었습니다.`,
        added_folders: addedFolders,
      })
    }
    return c.json({ status: 'info', message: '추가할 기능 폴더가 없습니다.' })
  } catch (e) {
    logger.error({ e }, '기능 폴더 추가 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /folders/tree  (주의: /:id 보다 먼저 등록)
// ──────────────────────────────────────────────
foldersRouter.get('/tree', async (c) => {
  try {
    // project_id 없는 레거시 폴더 → 기본 프로젝트 2로 설정
    const legacyCount = await db.folder.count({ where: { projectId: null } })
    if (legacyCount > 0) {
      await db.folder.updateMany({ where: { projectId: null }, data: { projectId: 2 } })
    }

    const projects = await db.project.findMany()

    const tree = await Promise.all(
      projects.map(async (project) => {
        const envFolders = await db.folder.findMany({
          where: {
            projectId: project.id,
            parentFolderId: null,
            folderType: 'environment',
          },
        })

        const projectNode = {
          id: project.id,
          name: project.name,
          type: 'project',
          children: await Promise.all(
            envFolders.map(async (ef) => {
              const depFolders = await db.folder.findMany({
                where: {
                  parentFolderId: ef.id,
                  folderType: 'deployment_date',
                },
              })

              return {
                id: ef.id,
                name: ef.folderName,
                type: 'environment',
                environment: ef.environment ?? 'dev',
                project_id: ef.projectId,
                children: await Promise.all(
                  depFolders.map(async (df) => {
                    const featureFolders = await db.folder.findMany({
                      where: {
                        parentFolderId: df.id,
                        folderType: 'feature',
                      },
                    })

                    return {
                      id: df.id,
                      name: df.folderName,
                      type: 'deployment_date',
                      deployment_date: df.deploymentDate
                        ? df.deploymentDate.toISOString().slice(0, 10)
                        : (df.folderName ?? 'Unknown'),
                      project_id: df.projectId,
                      children: featureFolders.map((ff) => ({
                        id: ff.id,
                        name: ff.folderName,
                        type: 'feature',
                        project_id: ff.projectId,
                        children: [],
                      })),
                    }
                  }),
                ),
              }
            }),
          ),
        }

        return projectNode
      }),
    )

    return c.json(tree)
  } catch (e) {
    logger.error({ e }, '폴더 트리 조회 오류')
    return c.json({ error: '폴더 트리 조회 오류', message: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /folders
// ──────────────────────────────────────────────
foldersRouter.get('/', async (c) => {
  try {
    const folders = await db.folder.findMany()
    const countRows = await db.testCase.groupBy({
      by: ['folderId'],
      _count: { id: true },
      where: { folderId: { not: null } },
    })
    const countMap = new Map(countRows.map((r) => [r.folderId!, r._count.id]))

    return c.json({
      success: true,
      message: '폴더 목록을 성공적으로 조회했습니다.',
      data: folders.map((f) => ({
        id: f.id,
        folder_name: f.folderName,
        parent_folder_id: f.parentFolderId,
        folder_type: f.folderType,
        environment: f.environment,
        deployment_date: f.deploymentDate?.toISOString().slice(0, 10) ?? null,
        project_id: f.projectId,
        test_case_count: countMap.get(f.id) ?? 0,
        created_at: f.createdAt.toISOString(),
      })),
    })
  } catch (e) {
    logger.error({ e }, '폴더 조회 오류')
    return c.json({ error: '폴더 조회 중 오류가 발생했습니다.' }, 500)
  }
})

// ──────────────────────────────────────────────
// POST /folders
// ──────────────────────────────────────────────
foldersRouter.post(
  '/',
  requireAuth,
  zValidator(
    'json',
    z.object({
      folder_name: z.string().min(1, '폴더명은 필수입니다'),
      parent_folder_id: z.number().nullable().optional(),
      folder_type: z.enum(['environment', 'deployment_date', 'feature']).default('environment'),
      environment: z.string().optional(),
      deployment_date: z.string().optional(),
      project_id: z.number().nullable().optional(),
    }),
  ),
  async (c) => {
    const data = c.req.valid('json')
    try {
      let parentFolder = null
      if (data.parent_folder_id) {
        parentFolder = await db.folder.findUnique({ where: { id: data.parent_folder_id } })
        if (!parentFolder) return c.json({ error: '부모 폴더를 찾을 수 없습니다.' }, 404)

        const pt = parentFolder.folderType
        if ((pt === null || pt === 'environment') && data.folder_type !== 'deployment_date') {
          return c.json({ error: '환경 폴더 아래에는 배포일자 폴더만 생성할 수 있습니다.' }, 400)
        }
        if (pt === 'deployment_date' && data.folder_type !== 'feature') {
          return c.json({ error: '배포일자 폴더 아래에는 기능 폴더만 생성할 수 있습니다.' }, 400)
        }
        if (pt === 'feature') {
          return c.json({ error: '기능 폴더 아래에는 더 이상 하위 폴더를 만들 수 없습니다.' }, 400)
        }
      }

      const projectId = parentFolder?.projectId ?? data.project_id ?? 2
      let environment: string = data.environment ?? 'dev'
      if (parentFolder) environment = parentFolder.environment ?? 'dev'
      if (data.folder_type === 'environment' && !environment) environment = 'dev'

      const folder = await db.folder.create({
        data: {
          folderName: data.folder_name,
          parentFolderId: data.parent_folder_id ?? null,
          folderType: data.folder_type,
          environment,
          deploymentDate: data.deployment_date ? new Date(data.deployment_date) : null,
          projectId,
        },
      })

      return c.json(
        {
          message: '폴더 생성 완료',
          id: folder.id,
          folder_name: folder.folderName,
          folder_type: folder.folderType,
          environment: folder.environment,
        },
        201,
      )
    } catch (e) {
      logger.error({ e }, '폴더 생성 오류')
      return c.json({ error: '폴더 생성 오류', message: String(e) }, 500)
    }
  },
)

// ──────────────────────────────────────────────
// GET /folders/:id
// ──────────────────────────────────────────────
foldersRouter.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const folder = await db.folder.findUnique({ where: { id } })
  if (!folder) return c.json({ error: '폴더를 찾을 수 없습니다.' }, 404)
  return c.json({
    id: folder.id,
    folder_name: folder.folderName,
    parent_folder_id: folder.parentFolderId,
    folder_type: folder.folderType,
    environment: folder.environment,
    deployment_date: folder.deploymentDate?.toISOString().slice(0, 10) ?? null,
    project_id: folder.projectId,
    created_at: folder.createdAt.toISOString(),
  })
})

// ──────────────────────────────────────────────
// PUT /folders/:id
// ──────────────────────────────────────────────
foldersRouter.put(
  '/:id',
  requireAuth,
  zValidator(
    'json',
    z.object({
      folder_name: z.string().optional(),
      parent_folder_id: z.number().nullable().optional(),
      folder_type: z.enum(['environment', 'deployment_date', 'feature']).optional(),
      environment: z.string().optional(),
      deployment_date: z.string().optional(),
      project_id: z.number().nullable().optional(),
    }),
  ),
  async (c) => {
    const id = Number(c.req.param('id'))
    const folder = await db.folder.findUnique({ where: { id } })
    if (!folder) return c.json({ error: '폴더를 찾을 수 없습니다.' }, 404)

    const data = c.req.valid('json')
    try {
      const parentId = data.parent_folder_id !== undefined ? data.parent_folder_id : folder.parentFolderId
      const newFolderType = data.folder_type ?? folder.folderType

      let parentFolder = null
      if (parentId) {
        parentFolder = await db.folder.findUnique({ where: { id: parentId } })
        if (parentFolder) {
          const pt = parentFolder.folderType
          if ((pt === null || pt === 'environment') && newFolderType !== 'deployment_date') {
            return c.json({ error: '환경 폴더 아래에는 배포일자 폴더만 둘 수 있습니다.' }, 400)
          }
          if (pt === 'deployment_date' && newFolderType !== 'feature') {
            return c.json({ error: '배포일자 폴더 아래에는 기능 폴더만 둘 수 있습니다.' }, 400)
          }
          if (pt === 'feature') {
            return c.json({ error: '기능 폴더 아래에는 더 이상 하위 폴더를 둘 수 없습니다.' }, 400)
          }
        }
      }

      await db.folder.update({
        where: { id },
        data: {
          ...(data.folder_name !== undefined && { folderName: data.folder_name }),
          parentFolderId: parentId,
          ...(newFolderType !== undefined && { folderType: newFolderType }),
          ...(parentFolder
            ? { projectId: parentFolder.projectId, environment: parentFolder.environment }
            : {
                ...(data.project_id !== undefined && { projectId: data.project_id }),
                ...(data.environment !== undefined && { environment: data.environment }),
              }),
          ...(data.deployment_date && { deploymentDate: new Date(data.deployment_date) }),
        },
      })

      return c.json({ message: '폴더 업데이트 완료' })
    } catch (e) {
      logger.error({ e }, '폴더 업데이트 오류')
      return c.json({ error: '폴더 업데이트 오류', message: String(e) }, 500)
    }
  },
)

// ──────────────────────────────────────────────
// DELETE /folders/:id  (관리자 전용)
// ──────────────────────────────────────────────
foldersRouter.delete('/:id', requireAuth, requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  const folder = await db.folder.findUnique({ where: { id } })
  if (!folder) return c.json({ error: '폴더를 찾을 수 없습니다.' }, 404)

  try {
    const childCount = await db.folder.count({ where: { parentFolderId: id } })
    if (childCount > 0) {
      return c.json(
        { error: '하위 폴더가 있어서 삭제할 수 없습니다. 먼저 하위 폴더를 삭제해주세요.' },
        400,
      )
    }

    const tcCount = await db.testCase.count({ where: { folderId: id } })
    if (tcCount > 0) {
      return c.json(
        { error: '테스트 케이스가 있어서 삭제할 수 없습니다. 먼저 테스트 케이스를 이동하거나 삭제해주세요.' },
        400,
      )
    }

    await db.folder.delete({ where: { id } })
    return c.json({ message: '폴더 삭제 완료' })
  } catch (e) {
    logger.error({ e }, '폴더 삭제 오류')
    return c.json({ error: '폴더 삭제 오류', message: String(e) }, 500)
  }
})
