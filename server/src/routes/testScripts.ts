import { Hono } from 'hono'
import { promises as fs } from 'fs'
import path from 'path'
import { logger } from '../lib/logger.js'
import { requireAuth } from '../middleware/auth.js'
import { env } from '../env.js'
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// S3 클라이언트 (ECS에서는 IAM Role, 로컬은 환경변수 인증)
const s3 = new S3Client({ region: env.AWS_REGION })
const S3_BUCKET = env.TEST_SCRIPTS_S3_BUCKET
const S3_PREFIX = env.TEST_SCRIPTS_S3_PREFIX // 기본 'test-scripts/'

export const testScriptsRouter = new Hono()

// test-scripts 루트 경로: server/ 기준으로 ../test-scripts
function getTestScriptsRoot(): string {
  return path.join(process.cwd(), '..', 'test-scripts')
}

async function getFileInfo(filePath: string, baseDir?: string) {
  try {
    const stat = await fs.stat(filePath)
    const relativePath = baseDir ? path.relative(baseDir, filePath).replace(/\\/g, '/') : filePath
    const ext = path.extname(filePath).toLowerCase()

    let category = 'other'
    if (['.js', '.py', '.json', '.md', '.spec.js', '.ts'].includes(ext)) category = 'script'
    else if (['.png', '.jpg', '.jpeg', '.gif'].includes(ext)) category = 'image'

    return {
      name: path.basename(filePath),
      path: relativePath,
      type: 'file',
      size: stat.size,
      modified: new Date(stat.mtimeMs).toISOString(),
      permissions: (stat.mode & 0o777).toString(8),
      category,
    }
  } catch {
    return null
  }
}

async function getDirInfo(dirPath: string, baseDir?: string) {
  try {
    const stat = await fs.stat(dirPath)
    const relativePath = baseDir ? path.relative(baseDir, dirPath).replace(/\\/g, '/') : dirPath
    let childrenCount = 0
    try {
      const entries = await fs.readdir(dirPath)
      childrenCount = entries.length
    } catch { /* empty */ }

    return {
      name: path.basename(dirPath),
      path: relativePath,
      type: 'directory',
      modified: new Date(stat.mtimeMs).toISOString(),
      permissions: (stat.mode & 0o777).toString(8),
      children_count: childrenCount,
    }
  } catch {
    return null
  }
}

async function exploreDirectory(dirPath: string, baseDir?: string): Promise<{ path: string; type: string; children: unknown[]; total_count: number } | null> {
  try {
    const entries = await fs.readdir(dirPath)
    const visible = entries.filter((e) => !e.startsWith('.')).sort()
    const items = []
    for (const entry of visible) {
      const entryPath = path.join(dirPath, entry)
      const stat = await fs.stat(entryPath).catch(() => null)
      if (!stat) continue
      if (stat.isDirectory()) {
        const info = await getDirInfo(entryPath, baseDir)
        if (info) items.push(info)
      } else {
        const info = await getFileInfo(entryPath, baseDir)
        if (info) items.push(info)
      }
    }
    return { path: dirPath, type: 'directory', children: items, total_count: items.length }
  } catch {
    return null
  }
}

// ──────────────────────────────────────────────
// GET /test-scripts/explore
// ──────────────────────────────────────────────
testScriptsRouter.get('/explore', async (c) => {
  try {
    const testScriptsRoot = getTestScriptsRoot()
    const basePath = c.req.query('path') ?? 'test-scripts'

    let fullPath: string
    if (basePath === 'test-scripts') {
      fullPath = testScriptsRoot
    } else if (basePath.startsWith('test-scripts/')) {
      fullPath = path.join(testScriptsRoot, basePath.slice('test-scripts/'.length))
    } else if (path.isAbsolute(basePath)) {
      fullPath = path.normalize(basePath)
    } else {
      fullPath = path.join(testScriptsRoot, basePath)
    }

    fullPath = path.resolve(fullPath)

    if (!fullPath.startsWith(path.resolve(testScriptsRoot))) {
      return c.json({ error: '허용되지 않은 경로입니다.' }, 403)
    }

    const stat = await fs.stat(fullPath).catch(() => null)
    if (!stat) return c.json({ error: `경로를 찾을 수 없습니다: ${basePath}` }, 404)
    if (!stat.isDirectory()) return c.json({ error: `디렉토리가 아닙니다: ${basePath}` }, 400)

    const result = await exploreDirectory(fullPath, testScriptsRoot)
    if (!result) return c.json({ error: '디렉토리를 탐색할 수 없습니다.' }, 500)
    return c.json(result)
  } catch (e) {
    logger.error({ e }, '테스트 스크립트 탐색 오류')
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /test-scripts/file-content
// ──────────────────────────────────────────────
testScriptsRouter.get('/file-content', async (c) => {
  try {
    const testScriptsRoot = getTestScriptsRoot()
    const filePath = c.req.query('path')
    if (!filePath) return c.json({ error: '파일 경로가 필요합니다.' }, 400)

    const normalized = filePath.replace(/\\/g, '/').replace(/^\//, '')
    let fullPath: string
    if (path.isAbsolute(normalized)) {
      fullPath = path.normalize(normalized)
    } else if (normalized.startsWith('test-scripts/')) {
      fullPath = path.join(testScriptsRoot, normalized.slice('test-scripts/'.length))
    } else {
      fullPath = path.join(testScriptsRoot, normalized)
    }
    fullPath = path.resolve(fullPath)

    const resolvedRoot = path.resolve(testScriptsRoot)
    if (!fullPath.startsWith(resolvedRoot)) {
      return c.json({ error: '허용되지 않은 경로입니다.' }, 403)
    }

    const stat = await fs.stat(fullPath).catch(() => null)
    if (!stat) return c.json({ error: '파일을 찾을 수 없습니다.' }, 404)
    if (!stat.isFile()) return c.json({ error: '파일이 아닙니다.' }, 400)
    if (stat.size > 10 * 1024 * 1024) return c.json({ error: '파일이 너무 큽니다. (최대 10MB)' }, 413)

    const ext = path.extname(fullPath).toLowerCase()
    const textExtensions = ['.js', '.ts', '.py', '.json', '.md', '.txt', '.spec.js', '.env']
    let content: string
    if (textExtensions.includes(ext)) {
      content = await fs.readFile(fullPath, 'utf-8')
    } else {
      content = `[바이너리 파일] - 크기: ${stat.size} bytes`
    }

    return c.json({
      path: filePath,
      content,
      size: stat.size,
      type: textExtensions.includes(ext) ? 'text' : 'binary',
      extension: ext,
    })
  } catch (e) {
    logger.error({ e }, '파일 내용 읽기 오류')
    return c.json({ error: '파일을 읽을 수 없습니다.' }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /test-scripts/search
// ──────────────────────────────────────────────
testScriptsRouter.get('/search', async (c) => {
  try {
    const queryRaw = c.req.query('q')?.trim()
    if (!queryRaw) return c.json({ error: '검색어가 필요합니다.' }, 400)
    const query = queryRaw

    const testScriptsRoot = getTestScriptsRoot()
    const stat = await fs.stat(testScriptsRoot).catch(() => null)
    if (!stat) return c.json({ error: 'test-scripts 폴더를 찾을 수 없습니다.' }, 404)

    const results: unknown[] = []

    async function searchRecursive(dir: string) {
      const entries = await fs.readdir(dir).catch(() => [] as string[])
      for (const entry of entries) {
        if (entry.startsWith('.')) continue
        const entryPath = path.join(dir, entry)
        const s = await fs.stat(entryPath).catch(() => null)
        if (!s) continue
        if (s.isDirectory()) {
          await searchRecursive(entryPath)
        } else if (entry.toLowerCase().includes(query.toLowerCase())) {
          const info = await getFileInfo(entryPath, testScriptsRoot)
          if (info) results.push(info)
        }
      }
    }

    await searchRecursive(testScriptsRoot)
    results.sort((a: unknown, b: unknown) => {
      const an = (a as { name: string }).name.toLowerCase()
      const bn = (b as { name: string }).name.toLowerCase()
      return an < bn ? -1 : an > bn ? 1 : 0
    })

    return c.json({ query, results, total_count: results.length })
  } catch (e) {
    logger.error({ e }, '테스트 스크립트 검색 오류')
    return c.json({ error: '검색 중 오류가 발생했습니다.' }, 500)
  }
})

// ──────────────────────────────────────────────
// GET /test-scripts/stats
// ──────────────────────────────────────────────
testScriptsRouter.get('/stats', async (c) => {
  try {
    const testScriptsRoot = getTestScriptsRoot()
    const stat = await fs.stat(testScriptsRoot).catch(() => null)
    if (!stat) return c.json({ error: 'test-scripts 폴더를 찾을 수 없습니다.' }, 404)

    const stats = {
      total_files: 0,
      total_directories: 0,
      total_size: 0,
      file_types: {} as Record<string, number>,
      directory_structure: {} as Record<string, { type: string; children_count: number; subdirectories: string[] }>,
    }

    async function collectStats(dir: string, level = 0) {
      const entries = await fs.readdir(dir).catch(() => [] as string[])
      for (const entry of entries) {
        if (entry.startsWith('.')) continue
        const entryPath = path.join(dir, entry)
        const s = await fs.stat(entryPath).catch(() => null)
        if (!s) continue
        if (s.isDirectory()) {
          stats.total_directories++
          if (level < 3) {
            const children = await fs.readdir(entryPath).catch(() => [] as string[])
            const visible = children.filter((c) => !c.startsWith('.'))
            const subdirs = await Promise.all(
              visible.map(async (c) => {
                const cp = path.join(entryPath, c)
                const cs = await fs.stat(cp).catch(() => null)
                return cs?.isDirectory() ? c : null
              }),
            )
            stats.directory_structure[entry] = {
              type: 'directory',
              children_count: visible.length,
              subdirectories: subdirs.filter(Boolean).slice(0, 5) as string[],
            }
          }
          await collectStats(entryPath, level + 1)
        } else {
          stats.total_files++
          stats.total_size += s.size
          const ext = path.extname(entry).toLowerCase() || 'no_extension'
          stats.file_types[ext] = (stats.file_types[ext] ?? 0) + 1
        }
      }
    }

    await collectStats(testScriptsRoot)
    stats.file_types = Object.fromEntries(Object.entries(stats.file_types).sort(([, a], [, b]) => b - a))

    return c.json(stats)
  } catch (e) {
    logger.error({ e }, '테스트 스크립트 통계 오류')
    return c.json({ error: '통계 정보를 가져올 수 없습니다.' }, 500)
  }
})

// ── S3 엔드포인트 ────────────────────────────────────────────────────────────

// GET /test-scripts/s3/settings/prefix — 기본 S3 prefix 반환
testScriptsRouter.get('/s3/settings/prefix', requireAuth, async (c) => {
  return c.json({ s3_base_prefix: S3_PREFIX })
})

// POST /test-scripts/s3/settings/prefix — prefix 설정 (현재는 env 기반이므로 no-op)
testScriptsRouter.post('/s3/settings/prefix', requireAuth, async (c) => {
  return c.json({ success: true, s3_base_prefix: S3_PREFIX })
})

// GET /test-scripts/s3/list — 파일/폴더 목록
testScriptsRouter.get('/s3/list', requireAuth, async (c) => {
  try {
    const prefix = c.req.query('prefix') ?? S3_PREFIX

    const cmd = new ListObjectsV2Command({
      Bucket: S3_BUCKET,
      Prefix: prefix,
      Delimiter: '/',
    })
    const result = await s3.send(cmd)

    const files: unknown[] = []

    // 폴더 (CommonPrefixes)
    for (const cp of result.CommonPrefixes ?? []) {
      if (!cp.Prefix) continue
      const name = cp.Prefix.slice(prefix.length).replace(/\/$/, '')
      if (!name) continue
      files.push({ key: cp.Prefix, name, type: 'directory', size: 0, modified: null })
    }

    // 파일 (Contents)
    for (const obj of result.Contents ?? []) {
      if (!obj.Key || obj.Key === prefix) continue
      const name = obj.Key.slice(prefix.length)
      if (!name || name.endsWith('/')) continue
      files.push({
        key: obj.Key,
        name,
        type: 'file',
        size: obj.Size ?? 0,
        modified: obj.LastModified?.toISOString() ?? null,
      })
    }

    return c.json({ success: true, files, prefix })
  } catch (e) {
    logger.error({ e }, 'S3 파일 목록 오류')
    return c.json({ success: false, error: String(e) }, 500)
  }
})

// GET /test-scripts/s3/folders — 전체 폴더 트리 (prefix 하위)
testScriptsRouter.get('/s3/folders', requireAuth, async (c) => {
  try {
    const prefix = c.req.query('prefix') ?? S3_PREFIX
    const folders: unknown[] = []

    // 재귀 없이 단일 depth CommonPrefixes만 반환 (프론트가 depth 관리)
    let continuationToken: string | undefined
    do {
      const cmd = new ListObjectsV2Command({
        Bucket: S3_BUCKET,
        Prefix: prefix,
        Delimiter: '/',
        ContinuationToken: continuationToken,
      })
      const result = await s3.send(cmd)
      for (const cp of result.CommonPrefixes ?? []) {
        if (!cp.Prefix) continue
        const name = cp.Prefix.slice(prefix.length).replace(/\/$/, '')
        if (name) folders.push({ key: cp.Prefix, name })
      }
      continuationToken = result.NextContinuationToken
    } while (continuationToken)

    return c.json({ success: true, folders })
  } catch (e) {
    logger.error({ e }, 'S3 폴더 목록 오류')
    return c.json({ success: false, error: String(e) }, 500)
  }
})

// GET /test-scripts/s3/content — 파일 내용 조회
testScriptsRouter.get('/s3/content', requireAuth, async (c) => {
  try {
    const key = c.req.query('key')
    if (!key) return c.json({ error: 'key가 필요합니다.' }, 400)

    const cmd = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key })
    const result = await s3.send(cmd)
    const content = await result.Body?.transformToString('utf-8') ?? ''
    return c.json({ success: true, content, key })
  } catch (e) {
    logger.error({ e }, 'S3 파일 내용 조회 오류')
    return c.json({ error: 'S3 파일을 읽을 수 없습니다.' }, 500)
  }
})

// GET /test-scripts/s3/download-url — presigned URL 생성
testScriptsRouter.get('/s3/download-url', requireAuth, async (c) => {
  try {
    const key = c.req.query('key')
    if (!key) return c.json({ error: 'key가 필요합니다.' }, 400)

    const cmd = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key })
    const download_url = await getSignedUrl(s3, cmd, { expiresIn: 3600 })
    return c.json({ success: true, download_url })
  } catch (e) {
    logger.error({ e }, 'S3 presigned URL 생성 오류')
    return c.json({ error: 'URL 생성에 실패했습니다.' }, 500)
  }
})

// POST /test-scripts/s3/upload-content — 텍스트 내용 업로드 (신규/덮어쓰기)
testScriptsRouter.post('/s3/upload-content', requireAuth, async (c) => {
  try {
    const body = await c.req.json() as {
      content: string
      filename: string
      is_new_file?: boolean
      existing_s3_key?: string
    }

    // 덮어쓰기: existing_s3_key 사용, 신규: S3_PREFIX + filename
    const key = body.existing_s3_key
      ?? (body.filename.startsWith(S3_PREFIX) ? body.filename : `${S3_PREFIX}${body.filename}`)

    const cmd = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: body.content,
      ContentType: 'text/plain; charset=utf-8',
    })
    await s3.send(cmd)
    return c.json({ success: true, key })
  } catch (e) {
    logger.error({ e }, 'S3 내용 업로드 오류')
    return c.json({ error: 'S3 업로드에 실패했습니다.' }, 500)
  }
})

// POST /test-scripts/s3/upload — 파일 업로드 (multipart/form-data)
testScriptsRouter.post('/s3/upload', requireAuth, async (c) => {
  try {
    const body = await c.req.formData()
    const file = body.get('file') as File | null
    if (!file) return c.json({ error: '파일이 없습니다.' }, 400)

    const prefix = (body.get('prefix') as string | null) ?? S3_PREFIX
    const key = `${prefix.endsWith('/') ? prefix : prefix + '/'}${file.name}`
    const buffer = await file.arrayBuffer()

    const cmd = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: new Uint8Array(buffer),
      ContentType: file.type || 'application/octet-stream',
    })
    await s3.send(cmd)
    return c.json({ success: true, key, name: file.name, size: file.size })
  } catch (e) {
    logger.error({ e }, 'S3 파일 업로드 오류')
    return c.json({ error: 'S3 파일 업로드에 실패했습니다.' }, 500)
  }
})

// POST /test-scripts/s3/upload-folder — 로컬 폴더 → S3 업로드
testScriptsRouter.post('/s3/upload-folder', requireAuth, async (c) => {
  try {
    const { folder_path } = await c.req.json() as { folder_path: string }
    const testScriptsRoot = getTestScriptsRoot()

    // 경로 정규화 및 보안 검사
    const localPath = folder_path.startsWith('test-scripts')
      ? path.join(testScriptsRoot, folder_path.slice('test-scripts'.length))
      : path.join(testScriptsRoot, folder_path)
    const resolved = path.resolve(localPath)
    if (!resolved.startsWith(path.resolve(testScriptsRoot))) {
      return c.json({ error: '허용되지 않은 경로입니다.' }, 403)
    }

    let total_uploaded = 0, total_failed = 0

    async function uploadDir(dir: string) {
      const entries = await fs.readdir(dir).catch(() => [] as string[])
      for (const entry of entries) {
        if (entry.startsWith('.')) continue
        const entryPath = path.join(dir, entry)
        const stat = await fs.stat(entryPath).catch(() => null)
        if (!stat) continue
        if (stat.isDirectory()) {
          await uploadDir(entryPath)
        } else {
          try {
            const relative = path.relative(testScriptsRoot, entryPath).replace(/\\/g, '/')
            const s3Key = `${S3_PREFIX}${relative}`
            const content = await fs.readFile(entryPath)
            await s3.send(new PutObjectCommand({
              Bucket: S3_BUCKET,
              Key: s3Key,
              Body: content,
            }))
            total_uploaded++
          } catch {
            total_failed++
          }
        }
      }
    }

    await uploadDir(resolved)
    return c.json({ success: true, total_uploaded, total_failed })
  } catch (e) {
    logger.error({ e }, 'S3 폴더 업로드 오류')
    return c.json({ error: 'S3 폴더 업로드에 실패했습니다.' }, 500)
  }
})

// DELETE /test-scripts/s3/delete — 파일 또는 폴더 삭제
testScriptsRouter.delete('/s3/delete', requireAuth, async (c) => {
  try {
    const { s3_key } = await c.req.json() as { s3_key: string }
    if (!s3_key) return c.json({ error: 's3_key가 필요합니다.' }, 400)

    if (s3_key.endsWith('/')) {
      // 폴더 삭제: 하위 객체 전체 나열 후 일괄 삭제
      const list = await s3.send(new ListObjectsV2Command({ Bucket: S3_BUCKET, Prefix: s3_key }))
      const objects = (list.Contents ?? []).map((o) => ({ Key: o.Key! }))
      if (objects.length > 0) {
        await s3.send(new DeleteObjectsCommand({ Bucket: S3_BUCKET, Delete: { Objects: objects } }))
      }
    } else {
      await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: s3_key }))
    }

    return c.json({ success: true })
  } catch (e) {
    logger.error({ e }, 'S3 파일 삭제 오류')
    return c.json({ error: 'S3 파일 삭제에 실패했습니다.' }, 500)
  }
})
