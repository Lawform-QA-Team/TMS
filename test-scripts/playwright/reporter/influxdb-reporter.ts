// influxdb-reporter.ts
import { Reporter, TestCase, TestResult, FullResult, TestStep } from '@playwright/test/reporter';
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

class InfluxDBReporter implements Reporter {
  private writeApi: WriteApi | null = null;
  private runId: string;
  private startAt: number;
  private stats: Stats;

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
      this.writeApi = client.getWriteApi(org, bucket, 'ms');
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

    this.writeApi.writePoint(point);

    result.steps?.forEach((step: TestStep) => {
      const stepPoint = new Point('test_step')
        .tag('run_id',    this.runId)
        .tag('test_name', test.title)
        .tag('suite',     suite)
        .tag('step_name', step.title)
        .tag('status',    step.error ? 'failed' : 'passed')
        .floatField('duration_ms', step.duration ?? 0)
        .timestamp(new Date(step.startTime));

      this.writeApi?.writePoint(stepPoint);
    });
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

      this.writeApi.writePoint(summary);

      await this.writeApi.flush();
      await this.writeApi.close();

      console.log(`\n📊 InfluxDB 전송 완료 | run_id: ${this.runId}`);
    }

    console.log(`   Pass Rate: ${passRate.toFixed(1)}% (${this.stats.passed}/${this.stats.total})`);
  }
}

export default InfluxDBReporter;