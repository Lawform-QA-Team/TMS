import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { useK6Stats, useK6Timeseries, useK6Runs } from '@tms/hooks/useMonitoring';
import { GaugeError, GaugeWebVital } from '@tms/components/monitoring/SemiGauge';

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

// ── 패널 컨테이너 ─────────────────────────────────────────────────────────────
function Panel({ title, children, style }) {
  return (
    <div style={{
      background: G.panel, border: `1px solid ${G.border}`, borderRadius: 4,
      padding: '10px 14px', ...style,
    }}>
      {title && (
        <div style={{ color: G.muted, fontSize: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

// ── Stat 카드 ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, style }) {
  return (
    <Panel style={{ flex: 1, minWidth: 140, ...style }}>
      <div style={{ color: G.muted, fontSize: 12, marginBottom: 4 }}>
        {label} <span style={{ color: G.dim }}>ⓘ</span>
      </div>
      <div style={{ color: color || G.text, fontSize: 42, fontWeight: 400, lineHeight: 1.2 }}>
        {value}
      </div>
    </Panel>
  );
}

// ── "No data" 패널 ─────────────────────────────────────────────────────────────
function NoData() {
  return (
    <div style={{ color: G.dim, textAlign: 'center', padding: '40px 0', fontSize: 14 }}>
      No data
    </div>
  );
}

// ── 바차트 데이터 레이블 플러그인 ──────────────────────────────────────────────
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
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(label, bar.x, bar.y - 3);
        ctx.restore();
      });
    });
  },
};

// ── Web Vital 임계값 ──────────────────────────────────────────────────────────
const VITALS_META = {
  lcp:  { label: 'LCP',  max: 4000, unit: 'ms', good: 2500, poor: 4000 },
  fcp:  { label: 'FCP',  max: 3000, unit: 'ms', good: 1800, poor: 3000 },
  ttfb: { label: 'TTFB', max: 1800, unit: 'ms', good: 800,  poor: 1800 },
  cls:  { label: 'CLS',  max: 0.25, unit: '',   good: 0.1,  poor: 0.25 },
  fid:  { label: 'FID',  max: 300,  unit: 'ms', good: 100,  poor: 300  },
  inp:  { label: 'INP',  max: 500,  unit: 'ms', good: 200,  poor: 500  },
};

function vitalColor(key, value) {
  if (value == null) return G.dim;
  const m = VITALS_META[key];
  if (!m) return G.muted;
  return value <= m.good ? G.green : value <= m.poor ? G.yellow : G.red;
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────────
export default function K6Tab() {
  const { trend, web_vitals, loading: statsLoading } = useK6Stats();
  const { timeseries, loading: tsLoading } = useK6Timeseries(5);
  const { runs } = useK6Runs({ limit: 1 });

  if (statsLoading) return <div style={{ color: G.muted, padding: 32 }}>로딩 중...</div>;

  const latest = runs[0];
  const m = latest?.metrics;

  const totalReq    = m?.totalRequests ?? 0;
  const failedReq   = m?.failedRequests ?? 0;
  const errorRate   = m ? m.errorRate * 100 : null;
  const avgMs       = m ? Math.round(m.avgResponseMs) : null;
  const p95Ms       = m ? Math.round(m.p95ResponseMs) : null;

  // ── 응답시간 시계열 차트 ────────────────────────────────────────────────────
  const tsLabels = timeseries.map(t =>
    new Date(t.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  );
  const tsData = {
    labels: tsLabels,
    datasets: [
      {
        label: 'avg_ms',
        data: timeseries.map(t => t.response_ms),
        borderColor: G.yellow,
        backgroundColor: 'rgba(242,204,12,0.05)',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.3,
      },
      {
        label: 'request_rate',
        data: timeseries.map(t => t.request_rate),
        borderColor: G.orange,
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.3,
        yAxisID: 'y1',
      },
    ],
  };
  const tsOptions = {
    ...CHART_DEFAULTS,
    scales: {
      x: CHART_DEFAULTS.scales.x,
      y:  { ...CHART_DEFAULTS.scales.y, ticks: { ...CHART_DEFAULTS.scales.y.ticks, callback: v => v + 'ms' } },
      y1: { position: 'right', ticks: { color: G.dim, font: { size: 10 }, callback: v => v + '/s' }, grid: { drawOnChartArea: false } },
    },
  };

  // ── 응답시간 분포 바차트 ────────────────────────────────────────────────────
  const distLabels = ['avg_ms', 'p95_ms', 'p99_ms'];
  const distValues = [m?.avgResponseMs, m?.p95ResponseMs, m?.p99ResponseMs];
  const distColors = [G.yellow, G.orange, G.red];
  const distData = {
    labels: distLabels,
    datasets: [{
      label: '응답시간',
      data: distValues,
      backgroundColor: distColors.map(c => c + '99'),
      borderColor: distColors,
      borderWidth: 1,
    }],
  };
  const distOptions = {
    ...CHART_DEFAULTS,
    plugins: { ...CHART_DEFAULTS.plugins, legend: { display: false } },
    scales: {
      x: CHART_DEFAULTS.scales.x,
      y: { ...CHART_DEFAULTS.scales.y, ticks: { ...CHART_DEFAULTS.scales.y.ticks, callback: v => v >= 1000 ? (v/1000).toFixed(1) + 's' : v + 'ms' } },
    },
  };

  // ── LCP/FCP/TTFB 추이 ─────────────────────────────────────────────────────
  const trendLabels = trend.map(r =>
    new Date(r.started_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
  );
  const webvitalTrendData = (keys, colors) => ({
    labels: trendLabels,
    datasets: keys.map((key, i) => ({
      label: key,
      data: trend.map(r => r[key] ?? null),
      borderColor: colors[i],
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      pointRadius: 2,
      tension: 0.3,
    })),
  });
  const lcpTrendData  = webvitalTrendData(['lcp', 'fcp', 'ttfb'], [G.yellow, G.blue, G.green]);
  const clsTrendData  = webvitalTrendData(['cls', 'fid', 'inp'],  [G.orange, G.blue, G.purple]);

  const webvitalOptions = {
    ...CHART_DEFAULTS,
    scales: {
      x: CHART_DEFAULTS.scales.x,
      y: { ...CHART_DEFAULTS.scales.y, ticks: { ...CHART_DEFAULTS.scales.y.ticks } },
    },
  };

  // ── Iteration / request rate 추이 ─────────────────────────────────────────
  const iterData = {
    labels: tsLabels,
    datasets: [{
      label: 'iterations',
      data: timeseries.map(t => t.request_rate),
      borderColor: G.green,
      backgroundColor: 'rgba(115,191,105,0.1)',
      borderWidth: 1.5,
      pointRadius: 0,
      tension: 0.3,
      fill: true,
    }],
  };

  // ── Data Sent / Received ───────────────────────────────────────────────────
  const dataTransferData = {
    labels: tsLabels,
    datasets: [
      {
        label: 'data_sent',
        data: timeseries.map(t => t.data_sent_bytes ?? null),
        borderColor: G.yellow,
        backgroundColor: 'rgba(242,204,12,0.1)',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.3,
        fill: true,
      },
      {
        label: 'data_received',
        data: timeseries.map(t => t.data_received_bytes ?? null),
        borderColor: G.blue,
        backgroundColor: 'rgba(87,148,242,0.1)',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.3,
        fill: true,
      },
    ],
  };
  const dataTransferOptions = {
    ...CHART_DEFAULTS,
    scales: {
      x: CHART_DEFAULTS.scales.x,
      y: { ...CHART_DEFAULTS.scales.y, ticks: { ...CHART_DEFAULTS.scales.y.ticks,
        callback: v => v >= 1_000_000 ? (v/1_000_000).toFixed(1)+'MB' : v >= 1000 ? (v/1000).toFixed(0)+'KB' : v+'B',
      }},
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* Row 1: Stat 카드 5개 */}
      <div style={{ display: 'flex', gap: 8 }}>
        <StatCard label="전체 요청수 ⓘ" value={totalReq.toLocaleString()} color={G.green} />
        <StatCard label="실패건수 ⓘ"    value={failedReq.toLocaleString()} color={G.red} />
        {/* 실패율 게이지 */}
        <Panel style={{ flex: 1, minWidth: 140, textAlign: 'center' }}>
          <div style={{ color: G.muted, fontSize: 12, marginBottom: 2 }}>실패율 ⓘ</div>
          <GaugeError value={errorRate} max={5} />
        </Panel>
        <StatCard label="평균 응답시간 ⓘ" value={avgMs != null ? `${avgMs} ms` : 'N/A'} color={G.yellow} />
        <StatCard label="P95 응답시간 ⓘ"  value={p95Ms != null ? `${p95Ms} ms` : 'N/A'} color={G.red} />
      </div>

      {/* Row 2: 응답시간 시계열 */}
      <Panel title="응답시간 Min / Avg / Med / Max / P90 / P95 비교 ⓘ">
        {tsLoading || timeseries.length === 0 ? <NoData /> : (
          <div style={{ height: 140 }}>
            <Line data={tsData} options={{ ...tsOptions, maintainAspectRatio: false }} />
          </div>
        )}
      </Panel>

      {/* Row 3: 응답시간 분포 바차트 */}
      <Panel title="응답시간 Min / Avg / Med / Max / P90 / P95 비교 ⓘ">
        {!m ? <NoData /> : (
          <div style={{ height: 140 }}>
            <Bar data={distData} options={{ ...distOptions, maintainAspectRatio: false, plugins: { ...distOptions.plugins } }}
              plugins={[barLabelPlugin]} />
          </div>
        )}
      </Panel>

      {/* Row 4: 네트워크 상세 */}
      <Panel title="네트워크 상세 ⓘ" style={{ minHeight: 80 }}>
        <NoData />
      </Panel>

      {/* Row 5: Web Vitals 6개 반원 게이지 */}
      <div style={{ display: 'flex', gap: 8 }}>
        {Object.entries(VITALS_META).map(([key, meta]) => {
          const v = web_vitals ? web_vitals[key] : null;
          return (
            <Panel key={key} style={{ flex: 1, minWidth: 120, textAlign: 'center', padding: '8px 4px' }}>
              <GaugeWebVital
                value={v}
                max={meta.max}
                unit={meta.unit}
                label={meta.label}
                color={vitalColor(key, v)}
              />
            </Panel>
          );
        })}
      </div>

      {/* Row 6: LCP/FCP/TTFB 추이 | CLS/FID/INP 추이 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Panel title="LCP / FCP / TTFB 추이 ⓘ">
          {trend.length === 0 ? <NoData /> : (
            <div style={{ height: 160 }}>
              <Line data={lcpTrendData} options={{ ...webvitalOptions, maintainAspectRatio: false }} />
            </div>
          )}
        </Panel>
        <Panel title="CLS / FID / INP 추이 ⓘ">
          {trend.length === 0 ? <NoData /> : (
            <div style={{ height: 160 }}>
              <Line data={clsTrendData} options={{ ...webvitalOptions, maintainAspectRatio: false }} />
            </div>
          )}
        </Panel>
      </div>

      {/* Row 7: Iteration 추이 | Data Sent/Received */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Panel title="Iteration 추이 ⓘ">
          {timeseries.length === 0 ? <NoData /> : (
            <div style={{ height: 160 }}>
              <Line data={iterData} options={{ ...CHART_DEFAULTS, maintainAspectRatio: false }} />
            </div>
          )}
        </Panel>
        <Panel title="Data Sent / Received ⓘ">
          {timeseries.length === 0 ? <NoData /> : (
            <div style={{ height: 160 }}>
              <Line data={dataTransferData} options={{ ...dataTransferOptions, maintainAspectRatio: false }} />
            </div>
          )}
        </Panel>
      </div>

    </div>
  );
}
