// reporters/influxdb-reporter.ts
import { Reporter, TestCase, TestResult, FullResult, TestStep } from '@playwright/test/reporter';
import { createRequire } from 'module';

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
  private writeApi: any | null;
  private Point: any | null;
  private runId: string;
  private startAt: number;
  private stats: Stats;
  private enabled: boolean;
  private influx: { url: string; token: string; org: string; bucket: string } | null;

  constructor(options: InfluxDBReporterOptions = {}) {
    const url = options.url || process.env.INFLUXDB_URL || '';
    const token = options.token || process.env.INFLUXDB_TOKEN || '';
    const org = options.org || process.env.INFLUXDB_ORG || '';
    const bucket = options.bucket || process.env.INFLUXDB_BUCKET || '';

    this.enabled = Boolean(url && token && org && bucket);
    this.runId = `run_${Date.now()}`;
    this.startAt = Date.now();
    this.stats = { passed: 0, failed: 0, skipped: 0, timedOut: 0, total: 0 };

    this.writeApi = null;
    this.Point = null;
    this.influx = this.enabled ? { url, token, org, bucket } : null;
  }

  async onBegin(): Promise<void> {
    if (!this.enabled || !this.influx) return;
    if (this.writeApi && this.Point) return;

    try {
      const require = createRequire(import.meta.url);
      const mod: any = require('@influxdata/influxdb-client');
      const client = new mod.InfluxDB({ url: this.influx.url, token: this.influx.token });
      this.writeApi = client.getWriteApi(this.influx.org, this.influx.bucket, 'ms');
      this.Point = mod.Point;
    } catch (_) {
      this.enabled = false;
      this.writeApi = null;
      this.Point = null;
    }
  }

  private bumpStats(status: TestResult['status']) {
    this.stats.total++;
    switch (status) {
      case 'passed':
        this.stats.passed++;
        break;
      case 'failed':
        this.stats.failed++;
        break;
      case 'timedOut':
        this.stats.timedOut++;
        break;
      case 'skipped':
        this.stats.skipped++;
        break;
      default:
        this.stats.failed++;
        break;
    }
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    this.bumpStats(result.status);
    if (!this.enabled || !this.writeApi) return;

    const project = test.parent?.project()?.name ?? 'default';
    const suite = test.parent?.title ?? 'unknown';

    const PointCtor = this.Point;
    if (!PointCtor) return;

    const point = new PointCtor('test_result')
      .tag('run_id', this.runId)
      .tag('project', project)
      .tag('suite', suite)
      .tag('test_name', test.title)
      .tag('status', result.status)
      .tag('env', process.env.TEST_ENV || 'local')
      .floatField('duration_ms', result.duration)
      .intField('retry', result.retry)
      .booleanField('passed', result.status === 'passed')
      .timestamp(new Date());

    if (result.status === 'failed' || result.status === 'timedOut') {
      point.stringField('error_message', (result.error?.message ?? '').substring(0, 1000));
    }

    this.writeApi.writePoint(point);

    result.steps?.forEach((step: TestStep) => {
      const stepPoint = new PointCtor('test_step')
        .tag('run_id', this.runId)
        .tag('test_name', test.title)
        .tag('suite', suite)
        .tag('step_name', step.title)
        .tag('status', step.error ? 'failed' : 'passed')
        .floatField('duration_ms', step.duration ?? 0)
        .timestamp(new Date(step.startTime));

      this.writeApi?.writePoint(stepPoint);
    });
  }

  async onEnd(result: FullResult): Promise<void> {
    const totalDuration = Date.now() - this.startAt;
    const passRate = this.stats.total > 0 ? (this.stats.passed / this.stats.total) * 100 : 0;

    if (this.enabled && this.writeApi && this.Point) {
      const summary = new this.Point('test_run_summary')
        .tag('run_id', this.runId)
        .tag('status', result.status)
        .tag('env', process.env.TEST_ENV || 'local')
        .intField('total', this.stats.total)
        .intField('passed', this.stats.passed)
        .intField('failed', this.stats.failed)
        .intField('skipped', this.stats.skipped)
        .intField('timed_out', this.stats.timedOut)
        .floatField('pass_rate', passRate)
        .floatField('total_duration', totalDuration)
        .timestamp(new Date());

      this.writeApi.writePoint(summary);
      await this.writeApi.flush();
      await this.writeApi.close();
    }

    console.log(`\n📊 InfluxDB 리포터 종료 | run_id: ${this.runId}`);
    console.log(`   Pass Rate: ${passRate.toFixed(1)}% (${this.stats.passed}/${this.stats.total})`);
  }
}

export default InfluxDBReporter;

