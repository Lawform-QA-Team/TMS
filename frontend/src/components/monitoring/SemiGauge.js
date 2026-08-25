import React from 'react';

const CX = 100, CY = 105, R = 88;

const BG_PATH = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;

// 세그먼트 아크 경로 (fromPct ~ toPct)
function segPath(fromPct, toPct) {
  const a1 = Math.PI * (1 - fromPct);
  const a2 = Math.PI * (1 - toPct);
  const sx = CX + R * Math.cos(a1), sy = CY - R * Math.sin(a1);
  const ex = CX + R * Math.cos(a2), ey = CY - R * Math.sin(a2);
  return `M ${sx} ${sy} A ${R} ${R} 0 0 1 ${ex} ${ey}`;
}

// 세그먼트 배열을 값(pct)까지 밝게, 이후 dim으로 렌더
function GradientArc({ segments, pct, strokeWidth = 16 }) {
  return segments.map((seg, i) => {
    const isFirst = i === 0;
    const isLast  = i === segments.length - 1;
    const capHead = isFirst ? 'round' : 'butt';
    const capTail = isLast  ? 'round' : 'butt';

    if (pct >= seg.to) {
      // 완전히 채워진 구간
      return (
        <path key={i} d={segPath(seg.from, seg.to)} stroke={seg.color}
          strokeWidth={strokeWidth} fill="none"
          strokeLinecap={isLast ? 'round' : capHead} />
      );
    } else if (pct <= seg.from) {
      // 완전히 빈 구간 (dim)
      return (
        <path key={i} d={segPath(seg.from, seg.to)} stroke={seg.color}
          strokeWidth={strokeWidth} fill="none"
          strokeLinecap={isFirst ? 'round' : capTail} opacity={0.18} />
      );
    } else {
      // 경계 구간 — 채워진 부분 + dim 부분 분할
      return (
        <React.Fragment key={i}>
          <path d={segPath(seg.from, pct)} stroke={seg.color}
            strokeWidth={strokeWidth} fill="none" strokeLinecap={capHead} />
          <path d={segPath(pct, seg.to)} stroke={seg.color}
            strokeWidth={strokeWidth} fill="none" strokeLinecap={capTail} opacity={0.18} />
        </React.Fragment>
      );
    }
  });
}

// ── K6 Web Vital 단색 반원 게이지 ────────────────────────────────────────────
export function GaugeWebVital({ value, max, unit = 'ms', color = '#73bf69', label }) {
  const pct = value != null ? Math.min(Math.max(value / max, 0), 1) : 0;

  let display;
  if (value == null) {
    display = 'N/A';
  } else if (unit === 'ms' && value >= 1000) {
    display = `${(value / 1000).toFixed(2)} s`;
    unit = '';
  } else if (unit === '') {
    display = value.toFixed(3);
  } else {
    display = `${Math.round(value)}`;
  }

  // 단색 세그먼트 하나로 처리
  const segments = [{ from: 0, to: 1, color }];

  return (
    <div style={{ textAlign: 'center', flex: 1, minWidth: 130 }}>
      <div style={{ color: '#64748b', fontSize: 12, marginBottom: 2 }}>{label}</div>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <svg width={160} height={95} viewBox="0 0 200 115">
          <GradientArc segments={segments} pct={pct} strokeWidth={16} />
          <text x={CX} y={CY - 6} textAnchor="middle" fill="#1e293b" fontSize={28} fontWeight="bold">
            {display}
          </text>
          {unit && (
            <text x={CX} y={CY + 14} textAnchor="middle" fill="#64748b" fontSize={13}>
              {unit}
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}

// ── K6 실패율 게이지 (초록 → 노랑 → 빨강) ────────────────────────────────────
const ERROR_SEGMENTS = [
  { from: 0,     to: 0.333, color: '#73bf69' },
  { from: 0.333, to: 0.666, color: '#f2cc0c' },
  { from: 0.666, to: 1,     color: '#f2495c' },
];

export function GaugeError({ value, max = 100 }) {
  const pct = value != null ? Math.min(Math.max(value / max, 0), 1) : 0;
  const display = value != null ? `${value.toFixed ? value.toFixed(1) : value}%` : 'N/A';

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={200} height={120} viewBox="0 0 200 120">
        <GradientArc segments={ERROR_SEGMENTS} pct={pct} strokeWidth={16} />
        <text x={CX} y={CY - 8} textAnchor="middle" fill="#1e293b" fontSize={26} fontWeight="bold">
          {display}
        </text>
      </svg>
    </div>
  );
}

// ── Playwright Pass Rate 무지개 게이지 ───────────────────────────────────────
const RAINBOW_SEGS = [
  { from: 0,   to: 0.2, color: '#f2495c' },
  { from: 0.2, to: 0.4, color: '#ff9830' },
  { from: 0.4, to: 0.6, color: '#f2cc0c' },
  { from: 0.6, to: 0.8, color: '#c8e825' },
  { from: 0.8, to: 1.0, color: '#73bf69' },
];

export function GaugePassRate({ value }) {
  const pct = value != null ? Math.min(Math.max(value / 100, 0), 1) : 0;
  const display = value != null ? `${value.toFixed ? value.toFixed(1) : value}%` : 'N/A';

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={220} height={130} viewBox="0 0 200 120">
        <GradientArc segments={RAINBOW_SEGS} pct={pct} strokeWidth={18} />
        <text x={CX} y={CY - 6} textAnchor="middle" fill="#1e293b" fontSize={28} fontWeight="bold">
          {display}
        </text>
      </svg>
    </div>
  );
}
