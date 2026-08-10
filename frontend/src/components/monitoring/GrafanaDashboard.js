import React, { useState, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import PlaywrightTab from '@tms/components/monitoring/PlaywrightTab';
import K6Tab from '@tms/components/monitoring/K6Tab';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

const TABS = [
  { id: 'k6',         label: 'K6 Result' },
  { id: 'playwright', label: 'Playwright Result' },
];

async function exportToPdf(contentRef, tabId) {
  const { default: html2canvas } = await import('html2canvas');
  const { jsPDF } = await import('jspdf');

  const el = contentRef.current;
  if (!el) return;

  const btn = el.closest('[data-dashboard]')?.querySelector('[data-export-btn]');
  if (btn) btn.disabled = true;

  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#0f172a',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * contentWidth) / canvas.width;

    // 페이지 분할
    let yOffset = 0;
    let pageIndex = 0;
    while (yOffset < imgHeight) {
      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, margin - yOffset, contentWidth, imgHeight);
      yOffset += pageHeight - margin * 2;
      pageIndex++;
    }

    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    pdf.save(`monitoring-${tabId}-${date}.pdf`);
  } finally {
    if (btn) btn.disabled = false;
  }
}

function GrafanaDashboard() {
  const [activeTab, setActiveTab] = useState('k6');
  const [environment, setEnvironment] = useState('');
  const [exporting, setExporting] = useState(false);
  const contentRef = useRef(null);

  const filters = { environment: environment || undefined };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportToPdf(contentRef, activeTab);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div data-dashboard style={{ height: 'calc(100vh - 120px)', overflowY: 'auto', background: 'var(--tms-bg)', padding: '24px', boxSizing: 'border-box' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ color: 'var(--tms-text, #1e293b)', margin: 0, fontSize: 20, fontWeight: 600 }}>모니터링 대시보드</h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <label style={{ color: '#94a3b8', fontSize: 13 }}>환경</label>
          <select
            value={environment}
            onChange={e => setEnvironment(e.target.value)}
            style={{ background: 'var(--tms-bg-card, #fff)', border: '1px solid #cbd5e1', color: 'var(--tms-text, #1e293b)', borderRadius: 6, padding: '6px 10px', fontSize: 13 }}
          >
            <option value="">전체</option>
            <option value="staging">staging</option>
            <option value="production">production</option>
          </select>
          <button
            data-export-btn
            onClick={handleExport}
            disabled={exporting}
            style={{
              background: exporting ? '#334155' : '#1d4ed8',
              border: 'none',
              color: exporting ? '#64748b' : '#f1f5f9',
              borderRadius: 6,
              padding: '6px 14px',
              fontSize: 13,
              cursor: exporting ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {exporting ? '생성 중...' : '📄 PDF 내보내기'}
          </button>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid #cbd5e1' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === tab.id ? '#3b82f6' : '#64748b',
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: activeTab === tab.id ? 600 : 400,
              marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 컨텐츠 (ref로 캡처 대상 지정) */}
      <div ref={contentRef}>
        {activeTab === 'playwright' && <PlaywrightTab filters={filters} />}
        {activeTab === 'k6' && <K6Tab filters={filters} />}
      </div>
    </div>
  );
}

export default GrafanaDashboard;
