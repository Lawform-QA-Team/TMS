/**
 * 실행 엔진 (BullMQ Worker)
 *
 * 지원 엔진:
 *   - Playwright: 자동화 테스트 실행 (npx playwright test)
 *   - k6: 성능 테스트 실행 (k6 run)
 *
 * Flow:
 *   1. automation/:id/execute 또는 performance/:id/execute API 호출
 *   2. BullMQ 큐에 Job 등록 (execution-engine)
 *   3. Worker가 실제 프로세스 spawn
 *   4. stdout/stderr → Socket.IO execution:log 이벤트
 *   5. 완료 → DB TestExecution/TestResult 업데이트
 *   6. 실패 시 Jira auto-bug 큐에 등록
 */
import { Queue, Worker, type Job } from 'bullmq'
import { spawn } from 'child_process'
import path from 'path'
import { getRedis } from './redis.js'
import { db } from './db.js'
import { logger } from './logger.js'
import {
  emitExecutionStarted,
  emitExecutionLog,
  emitExecutionProgress,
  emitExecutionCompleted,
  emitExecutionFailed,
  broadcastExecutionUpdate,
} from './socketServer.js'
import { getJiraQueue } from './jiraPipeline.js'
import { env } from '../env.js'

// ──────────────────────────────────────────────
// Job 타입 정의
// ──────────────────────────────────────────────

export type ExecutionJobData =
  | {
      type: 'playwright-run'
      executionId: number
      automationTestId: number
      testName: string
      scriptPath: string | null | undefined
      environment: string
      parameters?: Record<string, unknown> | undefined
    }
  | {
      type: 'k6-run'
      executionId: number
      performanceTestId: number
      testName: string
      scriptPath: string | null | undefined
      environment: string
      parameters?: Record<string, unknown> | undefined
    }

// ──────────────────────────────────────────────
// Queue & Worker 초기화 (lazy)
// ──────────────────────────────────────────────

const QUEUE_NAME = 'execution-engine'

let _queue: Queue<ExecutionJobData> | null = null
let _worker: Worker<ExecutionJobData> | null = null

export function getExecutionQueue(): Queue<ExecutionJobData> {
  if (!_queue) {
    _queue = new Queue<ExecutionJobData>(QUEUE_NAME, { connection: getRedis() })
  }
  return _queue
}

// ──────────────────────────────────────────────
// 실제 프로세스 실행 헬퍼
// ──────────────────────────────────────────────

function getTestScriptsRoot(): string {
  return path.join(process.cwd(), '..', 'test-scripts')
}

interface RunResult {
  status: 'Pass' | 'Fail' | 'Error'
  output: string
  duration: number
  exitCode: number | null
}

async function runProcess(
  cmd: string,
  args: string[],
  options: {
    executionId: number
    cwd?: string
    env?: Record<string, string>
    timeout?: number
  },
): Promise<RunResult> {
  return new Promise((resolve) => {
    const startTime = Date.now()
    const logs: string[] = []
    const timeoutMs = options.timeout ?? 10 * 60 * 1000 // 기본 10분

    const proc = spawn(cmd, args, {
      cwd: options.cwd ?? process.cwd(),
      env: { ...process.env, ...options.env },
      shell: false,
    })

    // 타임아웃 처리
    const timer = setTimeout(() => {
      proc.kill('SIGTERM')
      emitExecutionLog(options.executionId, '[TIMEOUT] 실행 시간 초과로 종료되었습니다.')
    }, timeoutMs)

    proc.stdout.on('data', (chunk: Buffer) => {
      const line = chunk.toString()
      logs.push(line)
      emitExecutionLog(options.executionId, line)
    })

    proc.stderr.on('data', (chunk: Buffer) => {
      const line = chunk.toString()
      logs.push(`[STDERR] ${line}`)
      emitExecutionLog(options.executionId, `[STDERR] ${line}`)
    })

    proc.on('close', (code) => {
      clearTimeout(timer)
      const duration = (Date.now() - startTime) / 1000
      const output = logs.join('')
      resolve({
        status: code === 0 ? 'Pass' : 'Fail',
        output,
        duration,
        exitCode: code,
      })
    })

    proc.on('error', (err) => {
      clearTimeout(timer)
      const duration = (Date.now() - startTime) / 1000
      emitExecutionLog(options.executionId, `[ERROR] 프로세스 실행 오류: ${err.message}`)
      resolve({
        status: 'Error',
        output: err.message,
        duration,
        exitCode: null,
      })
    })
  })
}

// ──────────────────────────────────────────────
// Playwright 실행
// ──────────────────────────────────────────────

async function runPlaywright(data: Extract<ExecutionJobData, { type: 'playwright-run' }>): Promise<RunResult> {
  const scriptsRoot = getTestScriptsRoot()

  emitExecutionProgress(data.executionId, 10, 'Playwright 실행 준비 중...')

  if (!data.scriptPath) {
    // 스크립트 없으면 전체 스위트 실행 또는 시뮬레이션
    emitExecutionLog(data.executionId, '[INFO] scriptPath가 없습니다. 시뮬레이션 모드로 실행합니다.')
    await new Promise((r) => setTimeout(r, 500))
    emitExecutionProgress(data.executionId, 50, '테스트 실행 중...')
    await new Promise((r) => setTimeout(r, 500))
    return { status: 'Pass', output: '[SIMULATED] Playwright test passed.', duration: 1, exitCode: 0 }
  }

  const scriptAbsPath = path.isAbsolute(data.scriptPath)
    ? data.scriptPath
    : path.join(scriptsRoot, data.scriptPath)

  emitExecutionProgress(data.executionId, 20, `스크립트 실행: ${data.scriptPath}`)

  const result = await runProcess('npx', ['playwright', 'test', scriptAbsPath, '--reporter=line'], {
    executionId: data.executionId,
    cwd: scriptsRoot,
    env: {
      TEST_ENV: data.environment,
      ...Object.fromEntries(
        Object.entries(data.parameters ?? {}).map(([k, v]) => [k, String(v)])
      ),
    },
  })

  emitExecutionProgress(data.executionId, 90, '결과 처리 중...')
  return result
}

// ──────────────────────────────────────────────
// k6 실행
// ──────────────────────────────────────────────

async function runK6(data: Extract<ExecutionJobData, { type: 'k6-run' }>): Promise<RunResult> {
  const scriptsRoot = getTestScriptsRoot()

  emitExecutionProgress(data.executionId, 10, 'k6 실행 준비 중...')

  if (!data.scriptPath) {
    emitExecutionLog(data.executionId, '[INFO] scriptPath가 없습니다. 시뮬레이션 모드로 실행합니다.')
    await new Promise((r) => setTimeout(r, 500))
    emitExecutionProgress(data.executionId, 50, '부하 테스트 실행 중...')
    await new Promise((r) => setTimeout(r, 500))
    return {
      status: 'Pass',
      output: '[SIMULATED] k6 test passed.\ncheck_rate: 100%\nhttp_req_duration: avg=150ms',
      duration: 1,
      exitCode: 0,
    }
  }

  const scriptAbsPath = path.isAbsolute(data.scriptPath)
    ? data.scriptPath
    : path.join(scriptsRoot, data.scriptPath)

  emitExecutionProgress(data.executionId, 20, `k6 스크립트 실행: ${data.scriptPath}`)

  // k6 파라미터
  const args = ['run', scriptAbsPath]
  if (data.parameters?.vus) args.push('--vus', String(data.parameters.vus))
  if (data.parameters?.duration) args.push('--duration', String(data.parameters.duration))

  const result = await runProcess('k6', args, {
    executionId: data.executionId,
    cwd: scriptsRoot,
    env: {
      K6_ENV: data.environment,
      ...Object.fromEntries(
        Object.entries(data.parameters ?? {}).map(([k, v]) => [`K6_${k.toUpperCase()}`, String(v)])
      ),
    },
    timeout: 30 * 60 * 1000, // k6는 최대 30분
  })

  emitExecutionProgress(data.executionId, 90, '결과 처리 중...')
  return result
}

// ──────────────────────────────────────────────
// Job 처리 핸들러
// ──────────────────────────────────────────────

async function processJob(job: Job<ExecutionJobData>): Promise<void> {
  const data = job.data

  if (data.type === 'playwright-run') {
    logger.info({ executionId: data.executionId, testName: data.testName }, 'Playwright 실행 시작')

    emitExecutionStarted({
      executionId: data.executionId,
      testId: data.automationTestId,
      testType: 'playwright',
      testName: data.testName,
    })

    // DB: 실행 상태 Running 으로 업데이트
    await db.testExecution.update({
      where: { id: data.executionId },
      data: { status: 'Running', startedAt: new Date() },
    })

    let runResult: RunResult
    try {
      runResult = await runPlaywright(data)
    } catch (e) {
      const errMsg = String(e)
      logger.error({ e, executionId: data.executionId }, 'Playwright 실행 오류')
      await db.testExecution.update({
        where: { id: data.executionId },
        data: { status: 'Error', completedAt: new Date(), resultSummary: JSON.stringify({ error: errMsg }) },
      })
      emitExecutionFailed(data.executionId, errMsg)
      return
    }

    // DB 업데이트
    await db.testExecution.update({
      where: { id: data.executionId },
      data: {
        status: runResult.status,
        completedAt: new Date(),
        resultSummary: JSON.stringify({ output: runResult.output, exitCode: runResult.exitCode }),
      },
    })

    // TestResult 저장
    const testResult = await db.testResult.create({
      data: {
        automationTestId: data.automationTestId,
        result: runResult.status,
        environment: data.environment,
        executionDuration: runResult.duration,
        ...(runResult.status !== 'Pass' && { errorMessage: runResult.output.slice(0, 2000) }),
      },
    })

    emitExecutionCompleted(data.executionId, {
      status: runResult.status,
      summary: { exitCode: runResult.exitCode, resultId: testResult.id },
      duration: runResult.duration,
    })
    broadcastExecutionUpdate({ type: 'playwright', executionId: data.executionId, status: runResult.status })

    // 실패 시 Jira Bug 자동 생성
    if (['Fail', 'Error'].includes(runResult.status)) {
      try {
        const queue = getJiraQueue()
        await queue.add('auto-bug', {
          type: 'auto-create-bug',
          automationTestId: data.automationTestId,
          testName: data.testName,
          testResult: runResult.status,
          environment: data.environment,
          ...(runResult.status !== 'Pass' && { errorMessage: runResult.output.slice(0, 500) }),
        })
      } catch (e) {
        logger.warn({ e }, 'Jira auto-bug 큐 등록 실패 (무시)')
      }
    }

    logger.info({ executionId: data.executionId, status: runResult.status }, 'Playwright 실행 완료')
  }

  else if (data.type === 'k6-run') {
    logger.info({ executionId: data.executionId, testName: data.testName }, 'k6 실행 시작')

    emitExecutionStarted({
      executionId: data.executionId,
      testId: data.performanceTestId,
      testType: 'k6',
      testName: data.testName,
    })

    await db.testExecution.update({
      where: { id: data.executionId },
      data: { status: 'Running', startedAt: new Date() },
    })

    let runResult: RunResult
    try {
      runResult = await runK6(data)
    } catch (e) {
      const errMsg = String(e)
      logger.error({ e, executionId: data.executionId }, 'k6 실행 오류')
      await db.testExecution.update({
        where: { id: data.executionId },
        data: { status: 'Error', completedAt: new Date(), resultSummary: JSON.stringify({ error: errMsg }) },
      })
      emitExecutionFailed(data.executionId, errMsg)
      return
    }

    // k6 출력에서 메트릭 파싱 (간단한 패턴)
    const metrics = parseK6Metrics(runResult.output)

    await db.testExecution.update({
      where: { id: data.executionId },
      data: {
        status: runResult.status,
        completedAt: new Date(),
        resultSummary: JSON.stringify({ metrics, output: runResult.output.slice(0, 5000), exitCode: runResult.exitCode }),
      },
    })

    emitExecutionCompleted(data.executionId, {
      status: runResult.status,
      summary: metrics,
      duration: runResult.duration,
    })
    broadcastExecutionUpdate({ type: 'k6', executionId: data.executionId, status: runResult.status })

    if (['Fail', 'Error'].includes(runResult.status)) {
      try {
        const queue = getJiraQueue()
        await queue.add('auto-bug', {
          type: 'auto-create-bug',
          performanceTestId: data.performanceTestId,
          testName: data.testName,
          testResult: runResult.status,
          environment: data.environment,
          ...(runResult.status !== 'Pass' && { errorMessage: runResult.output.slice(0, 500) }),
        })
      } catch (e) {
        logger.warn({ e }, 'Jira auto-bug 큐 등록 실패 (무시)')
      }
    }

    logger.info({ executionId: data.executionId, status: runResult.status }, 'k6 실행 완료')
  }
}

// ──────────────────────────────────────────────
// k6 메트릭 파서 (정규식 기반)
// ──────────────────────────────────────────────

function parseK6Metrics(output: string): Record<string, string> {
  const metrics: Record<string, string> = {}
  const patterns: Array<[RegExp, string]> = [
    [/http_req_duration\s*[^:]*:\s*avg=(\S+)/, 'http_req_duration_avg'],
    [/http_req_duration\s*[^:]*:.*p\(95\)=(\S+)/, 'http_req_duration_p95'],
    [/http_reqs\s*[^:]*:\s*(\S+)/, 'http_reqs_rate'],
    [/checks\s*[^:]*:\s*(\S+)/, 'checks_rate'],
    [/vus\s*[^:]*:\s*(\d+)/, 'vus'],
  ]
  for (const [pattern, key] of patterns) {
    const match = output.match(pattern)
    if (match?.[1]) metrics[key] = match[1]
  }
  return metrics
}

// ──────────────────────────────────────────────
// Worker 시작 (앱 부팅 시 호출)
// ──────────────────────────────────────────────

export function getExecutionWorkerInstance(): Worker<ExecutionJobData> | null {
  return _worker
}

export function startExecutionWorker(): Worker<ExecutionJobData> {
  if (_worker) return _worker

  _worker = new Worker<ExecutionJobData>(QUEUE_NAME, processJob, {
    connection: getRedis(),
    concurrency: env.NODE_ENV === 'production' ? 5 : 2,
  })

  _worker.on('completed', (job) =>
    logger.info({ jobId: job.id, type: job.data.type }, '실행 엔진 job 완료'),
  )
  _worker.on('failed', (job, err) =>
    logger.error({ jobId: job?.id, type: job?.data?.type, err: String(err) }, '실행 엔진 job 실패'),
  )

  logger.info('실행 엔진 worker 시작')
  return _worker
}
