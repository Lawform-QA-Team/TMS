import React from 'react';
import { usePipelineStats } from '@tms/hooks/usePipeline';
import './Pipeline.css';

const STATUS_LABELS = {
  collected: '수집됨',
  qaplan: 'QA 계획',
  testcases: '테스트케이스',
  pageanalysis: '페이지 분석',
  codegen: '코드 생성',
  testrun: '테스트 실행',
  report: '리포트',
  bugs: '버그 등록',
  cancelled: '취소됨',
  failed: '실패',
};

const STATUS_COLORS = {
  collected: '#3b82f6',
  qaplan: '#8b5cf6',
  testcases: '#10b981',
  pageanalysis: '#f59e0b',
  codegen: '#6366f1',
  testrun: '#06b6d4',
  report: '#84cc16',
  bugs: '#ef4444',
  cancelled: '#9ca3af',
  failed: '#ef4444',
};

export default function PipelineStats() {
  const { stats, loading, error } = usePipelineStats();

  if (loading) return <div className="pipeline-loading">통계 로딩 중...</div>;
  if (error) return <div className="pipeline-error">통계 조회 실패: {error}</div>;
  if (!stats) return null;

  const byStatus = stats.by_status ?? {};
  const total = stats.total ?? 0;

  // 모든 상태를 디폴트로 표시 (데이터 없는 상태는 0)
  const allStatuses = Object.keys(STATUS_LABELS);
  const normalizedByStatus = Object.fromEntries(
    allStatuses.map((s) => [s, byStatus[s] ?? 0])
  );

  return (
    <div className="pipeline-stats">
      <div className="pipeline-stats-cards">
        <div className="pipeline-stat-card">
          <div className="pipeline-stat-value">{total}</div>
          <div className="pipeline-stat-label">전체 수집</div>
        </div>
        <div className="pipeline-stat-card">
          <div className="pipeline-stat-value">{stats.today_count ?? 0}</div>
          <div className="pipeline-stat-label">오늘 수집</div>
        </div>
        <div className="pipeline-stat-card pipeline-stat-card--wide">
          <div className="pipeline-stat-label" style={{ marginBottom: 8 }}>상태별 분포</div>
          {Object.entries(normalizedByStatus).map(([status, count]) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={status} className="pipeline-status-bar-row">
                <span className="pipeline-status-bar-label">{STATUS_LABELS[status] ?? status}</span>
                <div className="pipeline-status-bar-track">
                  <div
                    className="pipeline-status-bar-fill"
                    style={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%`, background: STATUS_COLORS[status] ?? '#6b7280' }}
                  />
                </div>
                <span className="pipeline-status-bar-count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
