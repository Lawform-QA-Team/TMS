import { Hono } from 'hono'
import { promises as fs } from 'fs'
import path from 'path'
import { logger } from '../lib/logger.js'

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
