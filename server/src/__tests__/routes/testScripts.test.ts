/**
 * routes/testScripts.ts 화이트박스 테스트
 *
 * 커버 경로:
 * - GET /explore: 정상 탐색, 경로 미존재(404), 파일이 디렉토리 아닌 경우(400), 경로 traversal 방지(403)
 * - GET /file-content: 텍스트 파일, 바이너리 파일, 경로 traversal(403), 미존재(404), 너무 큰 파일(413)
 * - GET /search: 정상 검색, 검색어 없음(400)
 * - GET /stats: 통계 반환
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import path from 'path'

// ──────────────────────────────────────────────
// fs 모킹
// ──────────────────────────────────────────────

const mockStat = vi.fn()
const mockReaddir = vi.fn()
const mockReadFile = vi.fn()

vi.mock('fs', () => ({
  promises: {
    stat: (...a: unknown[]) => mockStat(...a),
    readdir: (...a: unknown[]) => mockReaddir(...a),
    readFile: (...a: unknown[]) => mockReadFile(...a),
  },
}))

vi.mock('../../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

// ──────────────────────────────────────────────
// 헬퍼
// ──────────────────────────────────────────────

function makeStat(opts: { isDir?: boolean; size?: number; mode?: number; mtimeMs?: number }) {
  return {
    isDirectory: () => opts.isDir ?? false,
    isFile: () => !opts.isDir,
    size: opts.size ?? 1024,
    mode: opts.mode ?? 0o755,
    mtimeMs: opts.mtimeMs ?? Date.now(),
  }
}

async function buildApp() {
  const { testScriptsRouter } = await import('../../routes/testScripts.js')
  const app = new Hono()
  app.route('/', testScriptsRouter)
  return app
}

describe('testScripts router', () => {
  let app: Hono

  beforeEach(async () => {
    vi.resetModules()
    mockStat.mockReset()
    mockReaddir.mockReset()
    mockReadFile.mockReset()
    // Once 소진 후에도 .catch()가 가능하도록 기본값 설정
    mockStat.mockResolvedValue(null)
    mockReaddir.mockResolvedValue([])
    mockReadFile.mockResolvedValue('')
    app = await buildApp()
  })

  // ────────────────────────────────────────
  // GET /explore
  // ────────────────────────────────────────

  describe('GET /explore', () => {
    it('기본 경로(test-scripts) 탐색 성공', async () => {
      mockStat.mockResolvedValue(makeStat({ isDir: true }))
      mockReaddir.mockResolvedValue(['script1.js', 'subdir'])
      // 각 entry의 stat
      mockStat
        .mockResolvedValueOnce(makeStat({ isDir: true })) // 첫 번째: 루트 디렉토리
        .mockResolvedValueOnce(makeStat({ isDir: false, size: 512 })) // script1.js
        .mockResolvedValueOnce(makeStat({ isDir: true })) // subdir
        .mockResolvedValueOnce(makeStat({ isDir: true })) // getDirInfo에서 subdir stat
        .mockResolvedValueOnce(makeStat({ isDir: true })) // readdir count용
      mockReaddir.mockResolvedValue(['script1.js'])

      const res = await app.request('/explore')
      expect(res.status).toBe(200)
      const body = await res.json() as { type: string }
      expect(body.type).toBe('directory')
    })

    it('경로 traversal → 403', async () => {
      const res = await app.request('/explore?path=../../etc/passwd')
      expect(res.status).toBe(403)
    })

    it('존재하지 않는 경로 → 404', async () => {
      mockStat.mockResolvedValue(null) // stat이 null 반환 (catch → null)
      mockStat.mockImplementation(() => { throw new Error('ENOENT') })

      // 실제로 catch에서 null 반환
      mockStat.mockRejectedValue(new Error('ENOENT'))
      const res = await app.request('/explore?path=test-scripts/nonexistent')
      expect(res.status).toBe(404)
    })

    it('파일 경로 전달 시 → 400 (디렉토리 아님)', async () => {
      mockStat.mockResolvedValue(makeStat({ isDir: false, size: 500 }))
      const res = await app.request('/explore?path=test-scripts/script.js')
      expect(res.status).toBe(400)
    })
  })

  // ────────────────────────────────────────
  // GET /file-content
  // ────────────────────────────────────────

  describe('GET /file-content', () => {
    it('경로 없음 → 400', async () => {
      const res = await app.request('/file-content')
      expect(res.status).toBe(400)
    })

    it('경로 traversal → 403', async () => {
      const res = await app.request('/file-content?path=../../etc/passwd')
      expect(res.status).toBe(403)
    })

    it('파일 미존재 → 404', async () => {
      mockStat.mockRejectedValue(new Error('ENOENT'))
      const res = await app.request('/file-content?path=test-scripts/missing.js')
      expect(res.status).toBe(404)
    })

    it('디렉토리 → 400', async () => {
      mockStat.mockResolvedValue(makeStat({ isDir: true }))
      const res = await app.request('/file-content?path=test-scripts/subdir')
      expect(res.status).toBe(400)
    })

    it('10MB 초과 파일 → 413', async () => {
      mockStat.mockResolvedValue(makeStat({ isDir: false, size: 11 * 1024 * 1024 }))
      const res = await app.request('/file-content?path=test-scripts/huge.js')
      expect(res.status).toBe(413)
    })

    it('.js 파일 텍스트로 읽기', async () => {
      mockStat.mockResolvedValue(makeStat({ isDir: false, size: 100 }))
      mockReadFile.mockResolvedValue('console.log("hello")')
      const res = await app.request('/file-content?path=test-scripts/hello.js')
      expect(res.status).toBe(200)
      const body = await res.json() as { type: string; content: string }
      expect(body.type).toBe('text')
      expect(body.content).toBe('console.log("hello")')
    })

    it('.png 파일 → binary 타입 반환', async () => {
      mockStat.mockResolvedValue(makeStat({ isDir: false, size: 2048 }))
      const res = await app.request('/file-content?path=test-scripts/screenshot.png')
      expect(res.status).toBe(200)
      const body = await res.json() as { type: string }
      expect(body.type).toBe('binary')
    })
  })

  // ────────────────────────────────────────
  // GET /search
  // ────────────────────────────────────────

  describe('GET /search', () => {
    it('검색어 없음 → 400', async () => {
      const res = await app.request('/search')
      expect(res.status).toBe(400)
    })

    it('test-scripts 폴더 없음 → 404', async () => {
      mockStat.mockRejectedValue(new Error('ENOENT'))
      const res = await app.request('/search?q=login')
      expect(res.status).toBe(404)
    })

    it('검색어 매칭 파일 반환', async () => {
      // stat: 루트 있음 → 디렉토리
      mockStat
        .mockResolvedValueOnce(makeStat({ isDir: true })) // 루트 stat
        .mockResolvedValueOnce(makeStat({ isDir: false, size: 200 })) // login.spec.js stat
        .mockResolvedValueOnce(makeStat({ isDir: false, size: 300 })) // other.js stat

      mockReaddir.mockResolvedValue(['login.spec.js', 'other.js'])

      const res = await app.request('/search?q=login')
      expect(res.status).toBe(200)
      const body = await res.json() as { results: Array<{ name: string }>; total_count: number }
      expect(body.results.some((r) => r.name.includes('login'))).toBe(true)
    })

    it('검색 결과 알파벳 정렬', async () => {
      mockStat
        .mockResolvedValueOnce(makeStat({ isDir: true }))           // root stat
        .mockResolvedValueOnce(makeStat({ isDir: false, size: 100 })) // z-test.js entry
        .mockResolvedValueOnce(makeStat({ isDir: false, size: 100 })) // z-test.js getFileInfo
        .mockResolvedValueOnce(makeStat({ isDir: false, size: 100 })) // a-test.js entry
        .mockResolvedValueOnce(makeStat({ isDir: false, size: 100 })) // a-test.js getFileInfo

      mockReaddir.mockResolvedValue(['z-test.js', 'a-test.js'])

      const res = await app.request('/search?q=test')
      const body = await res.json() as { results: Array<{ name: string }> }
      const names = body.results.map((r) => r.name)
      expect(names[0]).toBe('a-test.js')
      expect(names[1]).toBe('z-test.js')
    })
  })

  // ────────────────────────────────────────
  // GET /stats
  // ────────────────────────────────────────

  describe('GET /stats', () => {
    it('test-scripts 없음 → 404', async () => {
      mockStat.mockRejectedValue(new Error('ENOENT'))
      const res = await app.request('/stats')
      expect(res.status).toBe(404)
    })

    it('통계 정보 반환', async () => {
      mockStat
        .mockResolvedValueOnce(makeStat({ isDir: true })) // 루트
        .mockResolvedValueOnce(makeStat({ isDir: false, size: 1024 })) // script.js
        .mockResolvedValueOnce(makeStat({ isDir: true })) // subdir
        .mockResolvedValueOnce(makeStat({ isDir: false, size: 512 })) // subdir/test.js

      mockReaddir
        .mockResolvedValueOnce(['script.js', 'subdir']) // 루트
        .mockResolvedValueOnce(['test.js']) // subdir 파일 목록 (collectStats용)
        .mockResolvedValueOnce(['test.js']) // subdir children_count용

      const res = await app.request('/stats')
      expect(res.status).toBe(200)
      const body = await res.json() as { total_files: number; total_directories: number; file_types: Record<string, number> }
      expect(body.total_files).toBeGreaterThanOrEqual(0)
      expect(body.file_types).toBeDefined()
    })
  })
})
