// influxdb-reporter.ts
import * as fs   from 'fs';
import * as path from 'path';
import { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import { InfluxDB, Point, WriteApi } from '@influxdata/influxdb-client';

interface InfluxDBReporterOptions {
  url?: string;
  token?: string;
  org?: string;
  bucket?: string;
}

interface Stats {
  passed: number;
  failed: number;
  skipped: number;
  timedOut: number;
  total: number;
}

/** retry-after 헤더(초)만큼 대기 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class InfluxDBReporter implements Reporter {
  private writeApi: WriteApi | null = null;
  private runId: string;
  private startAt: number;
  private stats: Stats;
  // 포인트를 메모리에 버퍼링 → onEnd에서 한 번만 flush (API 호출 횟수 최소화)
  private pointBuffer: Point[] = [];

  constructor(options: InfluxDBReporterOptions = {}) {
    const url    = options.url    || process.env.INFLUXDB_URL    || '';
    const token  = options.token  || process.env.INFLUXDB_TOKEN  || '';
    const org    = options.org    || process.env.INFLUXDB_ORG    || '';
    const bucket = options.bucket || process.env.INFLUXDB_BUCKET || '';

    this.runId   = `run_${Date.now()}`;
    this.startAt = Date.now();
    this.stats   = { passed: 0, failed: 0, skipped: 0, timedOut: 0, total: 0 };

    // 연결 정보 디버그 로그
    console.log('\n🔍 InfluxDB 연결 정보 확인');
    console.log(`   URL   : ${url    || '❌ 없음'}`);
    console.log(`   ORG   : ${org    || '❌ 없음'}`);
    console.log(`   BUCKET: ${bucket || '❌ 없음'}`);
    console.log(`   TOKEN : ${token  ? '✅ 있음' : '❌ 없음'}\n`);

    if (!url || !token || !org || !bucket) {
      console.warn('⚠️  InfluxDB 환경변수 누락 - 데이터 전송을 건너뜁니다.');
      return;
    }

    try {
      const client = new InfluxDB({ url, token });
      // flushInterval: 0 → 테스트 중 자동 flush 비활성화 (onEnd에서 한 번만 전송)
      // maxRetries: 0    → WriteApi 내부 재시도 비활성화 (아래 수동 재시도로 대체)
      this.writeApi = client.getWriteApi(org, bucket, 'ms', {
        batchSize: 5000,
        flushInterval: 0,
        maxRetries: 0,
      });
      console.log('✅ InfluxDB WriteApi 초기화 성공');
    } catch (e) {
      console.error('❌ InfluxDB 초기화 실패:', e);
    }
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    this.stats.total++;
    this.stats[result.status as keyof Stats]++;

    if (!this.writeApi) return;

    const project = test.parent?.project()?.name ?? 'default';
    const suite   = test.parent?.title           ?? 'unknown';

    const point = new Point('test_result')
      .tag('run_id',    this.runId)
      .tag('project',   project)
      .tag('suite',     suite)
      .tag('test_name', test.title)
      .tag('status',    result.status)
      .tag('env',       process.env.TEST_ENV || 'local')
      .floatField('duration_ms', result.duration)
      .intField('retry',         result.retry)
      .booleanField('passed',    result.status === 'passed')
      .timestamp(new Date());

    if (result.status === 'failed' || result.status === 'timedOut') {
      point.stringField('error_message', (result.error?.message ?? '').substring(0, 1000));
    }

    // 즉시 write하지 않고 버퍼에 쌓기 (step 포인트 제거: 429 원인)
    this.pointBuffer.push(point);
  }

  async onEnd(result: FullResult): Promise<void> {
    const totalDuration = Date.now() - this.startAt;
    const passRate = this.stats.total > 0
      ? (this.stats.passed / this.stats.total) * 100
      : 0;

    if (this.writeApi) {
      const summary = new Point('test_run_summary')
        .tag('run_id', this.runId)
        .tag('status', result.status)
        .tag('env',    process.env.TEST_ENV || 'local')
        .intField('total',          this.stats.total)
        .intField('passed',         this.stats.passed)
        .intField('failed',         this.stats.failed)
        .intField('skipped',        this.stats.skipped)
        .intField('timed_out',      this.stats.timedOut)
        .floatField('pass_rate',      passRate)
        .floatField('total_duration', totalDuration)
        .timestamp(new Date());

      const allPoints = [summary, ...this.pointBuffer];

      // retry-after를 지켜서 최대 3회 재시도
      const MAX_RETRIES = 3;
      let sent = false;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          this.writeApi.writePoints(allPoints);
          await this.writeApi.flush();
          await this.writeApi.close();
          console.log(`\n📊 InfluxDB 전송 완료 | run_id: ${this.runId} | 포인트 수: ${allPoints.length}`);
          sent = true;
          break;
        } catch (e: any) {
          if (e?.statusCode === 429) {
            const retryAfterSec = Number(e?.headers?.['retry-after'] ?? 15);
            if (attempt < MAX_RETRIES) {
              console.warn(`⚠️  InfluxDB 429 (attempt ${attempt}/${MAX_RETRIES}) - ${retryAfterSec}초 후 재시도...`);
              await sleep(retryAfterSec * 1000);
            } else {
              console.warn(`⚠️  InfluxDB 429 - 최대 재시도 횟수 초과. 로컬 파일로 폴백 저장.`);
            }
          } else {
            console.error(`❌ InfluxDB 전송 실패 (attempt ${attempt}/${MAX_RETRIES}):`, e?.message ?? e);
            if (attempt >= MAX_RETRIES) break;
            await sleep(3000);
          }
        }
      }

      // 전송 실패 시 로컬 JSON 파일로 데이터 보존
      if (!sent) {
        this.saveToFallbackFile(allPoints, result, passRate, totalDuration);
      }
    }

    console.log(`   Pass Rate: ${passRate.toFixed(1)}% (${this.stats.passed}/${this.stats.total})`);
  }

  /**
   * InfluxDB 전송 실패 시 데이터 보존
   * - stdout 출력: GitHub Actions 로그에 영구 기록 (CI/로컬 공통)
   * - 로컬 파일 저장: 로컬 실행 시 추가 보존 (CI 러너는 ephemeral이라 파일은 소멸)
   */
  private saveToFallbackFile(
    points: Point[],
    result: FullResult,
    passRate: number,
    totalDuration: number,
  ): void {
    const payload = {
      run_id:         this.runId,
      status:         result.status,
      env:            process.env.TEST_ENV || 'local',
      stats:          this.stats,
      pass_rate:      passRate,
      total_duration: totalDuration,
      timestamp:      new Date().toISOString(),
      point_count:    points.length,
    };

    // stdout 출력 — GitHub Actions 로그에 영구 기록됨
    console.log('\n📋 [INFLUXDB_FALLBACK] InfluxDB 전송 실패 - 결과 데이터:');
    console.log(JSON.stringify(payload, null, 2));

    // 로컬 파일 저장 (로컬 실행 시만 유효, CI 러너는 잡 종료 후 소멸)
    try {
      const fallbackDir = path.join(__dirname, 'fallback');
      fs.mkdirSync(fallbackDir, { recursive: true });
      const fallbackPath = path.join(fallbackDir, `${this.runId}.json`);
      fs.writeFileSync(fallbackPath, JSON.stringify(payload, null, 2), 'utf-8');
      console.log(`💾 폴백 파일 저장: ${fallbackPath}`);
    } catch (_) {
      // 파일 저장 실패는 무시 (stdout 출력으로 이미 보존됨)
    }
  }
}

export default InfluxDBReporter;
