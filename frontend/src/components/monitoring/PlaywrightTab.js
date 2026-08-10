import React from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { usePlaywrightStats } from '@tms/hooks/useMonitoring';
import { GaugePassRate } from '@tms/components/monitoring/SemiGauge';

// ── 색상 ──────────────────────────────────────────────────────────────────────
const G = {
  panel: '#ffffff',
  border: '#e2e8f0',
  text: '#1e293b',
  muted: '#64748b',
  dim: '#94a3b8',
  green: '#16a34a',
  yellow: '#ca8a04',
  orange: '#ea580c',
  red: '#dc2626',
  blue: '#2563eb',
  purple: '#7c3aed',
};

const CHART_DEFAULTS = {
  responsive: true,
  animation: false,
  plugins: { legend: { labels: { color: G.muted, font: { size: 11 } } } },
  scales: {
    x: { ticks: { color: G.dim, font: { size: 10 } }, grid: { color: '#f1f5f9' } },
    y: { ticks: { color: G.dim, font: { size: 10 } }, grid: { color: '#f1f5f9' } },
  },
};

function Panel({ title, children, style }) {
  return (
    <div style={{
      background: G.panel, border: `1px solid ${G.border}`,
      borderRadius: 4, padding: '10px 14px', ...style,
    }}>
      {title && (
        <div style={{ color: G.muted, fontSize: 12, marginBottom: 8 }}>{title}</div>
      )}
      {children}
    </div>
  );
}

function StatNumber({ label, value, color, small }) {
  return (
    <Panel style={{ flex: 1, minWidth: 140 }}>
      <div style={{ color: G.muted, fontSize: 12, marginBottom: 4 }}>
        {label} <span style={{ color: G.dim }}>ⓘ</span>
      </div>
      <div style={{ color: color || G.text, fontSize: small ? 32 : 48, fontWeight: 400, lineHeight: 1.1 }}>
        {value}
      </div>
    </Panel>
  );
}

function NoData({ message = 'No data' }) {
  return <div style={{ color: G.dim, textAlign: 'center', padding: '30px 0', fontSize: 13 }}>{message}</div>;
}

// 바차트 안에 레이블 표시 플러그인
const barLabelPlugin = {
  id: 'barLabel',
  afterDatasetsDraw(chart) {
    const ctx = chart.ctx;
    chart.data.datasets.forEach((dataset, di) => {
      const meta = chart.getDatasetMeta(di);
      if (meta.hidden) return;
      meta.data.forEach((bar, idx) => {
        const v = dataset.data[idx];
        if (v == null) return;
        const label = v >= 1000 ? `${(v / 1000).toFixed(1)}s` : `${Math.round(v)}ms`;
        ctx.save();
        ctx.fillStyle = '#d8d9da';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(label, bar.x, bar.y - 2);
        ctx.restore();
      });
    });
  },
};

export default function PlaywrightTab() {
  const { trend, top_tests = [], browser_pass_rate = [], failed_tests = [], loading, error } = usePlaywrightStats();

  if (loading) return <div style={{ color: G.muted, padding: 32 }}>로딩 중...</div>;
  if (error) return <div style={{ color: G.red, padding: 32 }}>{error}</div>;

  // ── 전체 요약 집계 ──────────────────────────────────────────────────────────
  const totalTests   = trend.reduce((s, r) => s + r.total, 0);
  const totalPassed  = trend.reduce((s, r) => s + r.passed, 0);
  const totalFailed  = trend.reduce((s, r) => s + r.failed, 0);
  const passRate     = totalTests > 0 ? (totalPassed / totalTests * 100) : 0;
  const avgDuration  = trend.length > 0
    ? Math.round(trend.reduce((s, r) => s + (r.duration_ms || 0), 0) / trend.length / 1000)
    : 0;

  // ── Pass/Fail 추이 라인차트 ─────────────────────────────────────────────────
  const trendLabels = trend.map(r =>
    new Date(r.started_at).toLocaleTimeString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  );
  const passfailData = {
    labels: trendLabels,
    datasets: [
      {
        label: 'passed',
        data: trend.map(r => r.passed),
        borderColor: G.green,
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.3,
      },
      {
        label: 'failed',
        data: trend.map(r => r.failed),
        borderColor: G.red,
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.3,
      },
      {
        label: 'skipped',
        data: trend.map(r => r.total - r.passed - r.failed),
        borderColor: G.yellow,
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        pointRadius: 2,
        tension: 0.3,
      },
    ],
  };

  // ── Top 10 바차트 (avg / max / min) ────────────────────────────────────────
  const top10Labels = top_tests.map(t =>
    t.test_name.length > 24 ? t.test_name.slice(0, 24) + '…' : t.test_name
  );
  const top10Data = {
    labels: top10Labels,
    datasets: [
      {
        label: 'avg_duration_ms',
        data: top_tests.map(t => t.avg_ms),
        backgroundColor: G.yellow + '99',
        borderColor: G.yellow,
        borderWidth: 1,
      },
      {
        label: 'max_duration_ms',
        data: top_tests.map(t => t.max_ms),
        backgroundColor: G.orange + '88',
        borderColor: G.orange,
        borderWidth: 1,
      },
      {
        label: 'min_duration_ms',
        data: top_tests.map(t => t.min_ms),
        backgroundColor: G.blue + '88',
        borderColor: G.blue,
        borderWidth: 1,
      },
    ],
  };
  const top10Options = {
    ...CHART_DEFAULTS,
    scales: {
      x: { ...CHART_DEFAULTS.scales.x, ticks: { ...CHART_DEFAULTS.scales.x.ticks, font: { size: 9 }, maxRotation: 45 } },
      y: { ...CHART_DEFAULTS.scales.y, ticks: { ...CHART_DEFAULTS.scales.y.ticks, callback: v => v >= 1000 ? (v/1000).toFixed(1)+'s' : v+'ms' } },
    },
  };

  // ── 브라우저별 Pass Rate 파이차트 ──────────────────────────────────────────
  const pieColors = [G.blue, G.yellow, G.green, G.orange];
  const pieData = {
    labels: browser_pass_rate.map(b => `${b.browser} pass_rate`),
    datasets: [{
      data: browser_pass_rate.map(b => b.pass_rate),
      backgroundColor: pieColors.map(c => c + 'cc'),
      borderColor: pieColors,
      borderWidth: 1,
    }],
  };
  const pieOptions = {
    responsive: true,
    animation: false,
    plugins: {
      legend: { position: 'right', labels: { color: G.muted, font: { size: 11 } } },
      tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed}%` } },
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* Section 헤더 */}
      <div style={{ color: G.muted, fontSize: 13, fontWeight: 500, padding: '4px 0' }}>
        ▾ Total Result
      </div>

      {/* Row 1: Pass Rate 게이지 + 3개 Stat */}
      <div style={{ display: 'flex', gap: 8 }}>
        {/* 전체 Pass Rate 게이지 */}
        <Panel style={{ flex: 1.2, minWidth: 180, textAlign: 'center' }}>
          <div style={{ color: G.muted, fontSize: 12, marginBottom: 2 }}>
            전체 Pass Rate <span style={{ color: G.dim }}>ⓘ</span>
          </div>
          <GaugePassRate value={passRate} />
        </Panel>
        <StatNumber label="Total Test"    value={totalTests.toLocaleString()} color={G.green} />
        <StatNumber label="Failed Tests"  value={totalFailed.toLocaleString()} color={G.red} />
        <StatNumber label="Avg Duration"  value={`${avgDuration} seconds`} color={G.yellow} small />
      </div>

      {/* Row 2: Pass/Fail 추이 전체 너비 */}
      <Panel title="Pass/Fail 추이">
        {trend.length === 0 ? <NoData /> : (
          <div style={{ height: 160 }}>
            <Line data={passfailData} options={{ ...CHART_DEFAULTS, maintainAspectRatio: false }} />
          </div>
        )}
      </Panel>

      {/* Row 3: Top 10 바차트 + 브라우저 파이차트 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
        <Panel title="테스트별 평균 실행시간 Top 10">
          {top_tests.length === 0 ? <NoData /> : (
            <div style={{ height: 220 }}>
              <Bar data={top10Data} options={{ ...top10Options, maintainAspectRatio: false }}
                plugins={[barLabelPlugin]} />
            </div>
          )}
        </Panel>
        <Panel title="브라우저별 Pass Rate">
          {browser_pass_rate.length === 0 ? <NoData /> : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Doughnut data={pieData} options={pieOptions} />
            </div>
          )}
        </Panel>
      </div>

      {/* Row 4: 실패 테스트 목록 */}
      <Panel title="실패 테스트 목록">
        {failed_tests.length === 0 ? (
          <NoData message="실패 테스트 없음" />
        ) : (
          <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 360 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead style={{ position: 'sticky', top: 0, background: G.panel }}>
                <tr style={{ borderBottom: `1px solid ${G.border}` }}>
                  {['time', 'suite', 'test_name', 'project', 'duration_ms', 'retry', 'error_message'].map(h => (
                    <th key={h} style={{ color: G.muted, padding: '6px 10px', textAlign: 'left', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {failed_tests.map((t, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${G.border}22` }}>
                    <td style={{ color: G.dim, padding: '5px 10px', whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: 11 }}>
                      {t.run ? new Date(t.run.startedAt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}
                    </td>
                    <td style={{ color: G.muted, padding: '5px 10px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.suiteName}
                    </td>
                    <td style={{ color: G.text, padding: '5px 10px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.testName}
                    </td>
                    <td style={{ color: G.muted, padding: '5px 10px', whiteSpace: 'nowrap' }}>{t.run?.project || '-'}</td>
                    <td style={{ color: G.muted, padding: '5px 10px', whiteSpace: 'nowrap' }}>{t.durationMs?.toLocaleString()}</td>
                    <td style={{ color: G.muted, padding: '5px 10px' }}>{t.retries}</td>
                    <td style={{ color: G.red, padding: '5px 10px', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.errorMessage || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

    </div>
  );
}
