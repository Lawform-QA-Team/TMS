import React, { useState } from 'react';
import { usePipelineList, approvePipeline } from '@tms/hooks/usePipeline';
import { useAuth } from '@tms/contexts/AuthContext';
import './Pipeline.css';

const STAGES = ['collected', 'qaplan', 'testcases', 'pageanalysis', 'codegen', 'testrun', 'report', 'bugs'];

const STATUS_BADGE_CLASS = {
  collected: 'badge-blue',
  qaplan: 'badge-purple',
  testcases: 'badge-green',
  pageanalysis: 'badge-yellow',
  codegen: 'badge-indigo',
  testrun: 'badge-cyan',
  report: 'badge-lime',
  bugs: 'badge-red',
  cancelled: 'badge-gray',
  failed: 'badge-red',
};

const STATUS_LABELS = {
  collected: '수집됨',
  qaplan: 'QA 계획',
  testcases: 'TC 생성',
  pageanalysis: '페이지 분석',
  codegen: '코드 생성',
  testrun: '실행 중',
  report: '리포트',
  bugs: '버그 등록',
  cancelled: '취소됨',
  failed: '실패',
};

export default function PipelineList({ onSelect }) {
  const { token } = useAuth();
  const [filters, setFilters] = useState({ pipelineStatus: '', priority: '', page: 1, per_page: 20 });
  const { tickets, pagination, loading, error, refresh } = usePipelineList(filters);

  async function handleApprove(e, pipelineId, action) {
    e.stopPropagation();
    const label = action === 'approve' ? '승인' : action === 'reject' ? '반려' : '취소';
    if (!window.confirm(`이 QA Plan을 ${label}하시겠습니까?`)) return;
    const res = await approvePipeline(pipelineId, action, token);
    if (res.success) {
      alert(res.message);
      refresh();
    } else {
      alert(res.error ?? `${label} 처리 중 오류가 발생했습니다.`);
    }
  }

  function handleFilter(key, val) {
    setFilters((prev) => ({ ...prev, [key]: val, page: 1 }));
  }

  return (
    <div className="pipeline-list">
      <div className="pipeline-list-filters">
        <select
          value={filters.pipelineStatus}
          onChange={(e) => handleFilter('pipelineStatus', e.target.value)}
          className="pipeline-filter-select"
        >
          <option value="">전체 상태</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
          <option value="cancelled">취소됨</option>
          <option value="failed">실패</option>
        </select>
        <select
          value={filters.priority}
          onChange={(e) => handleFilter('priority', e.target.value)}
          className="pipeline-filter-select"
        >
          <option value="">전체 우선순위</option>
          <option value="P1">P1</option>
          <option value="P2">P2</option>
          <option value="P3">P3</option>
          <option value="P4">P4</option>
        </select>
      </div>

      <div className="pipeline-stage-indicator">
        {STAGES.map((s, i) => (
          <React.Fragment key={s}>
            <span
              className={`pipeline-stage-dot ${filters.pipelineStatus === s ? 'active' : ''}`}
              title={STATUS_LABELS[s]}
              onClick={() => handleFilter('pipelineStatus', filters.pipelineStatus === s ? '' : s)}
            />
            {i < STAGES.length - 1 && <span className="pipeline-stage-connector" />}
          </React.Fragment>
        ))}
      </div>

      {loading && <div className="pipeline-loading">로딩 중...</div>}
      {error && <div className="pipeline-error">오류: {error}</div>}

      {!loading && !error && (
        <table className="pipeline-table">
          <thead>
            <tr>
              <th>티켓</th>
              <th>유형</th>
              <th>요약</th>
              <th>출처</th>
              <th>우선순위</th>
              <th>상태</th>
              <th>수집일시</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 && (
              <tr><td colSpan={8} className="pipeline-empty">수집된 티켓이 없습니다.</td></tr>
            )}
            {tickets.map((t) => (
              <tr
                key={t.pipeline_id}
                className="pipeline-table-row"
                onClick={() => onSelect?.(t.pipeline_id)}
              >
                <td className="pipeline-ticket-key">{t.ticket_key}</td>
                <td><span className={`pipeline-issue-type-badge issue-type-${(t.issue_type ?? '').toLowerCase().replace(/\s+/g, '-')}`}>{t.issue_type}</span></td>
                <td className="pipeline-summary">{t.summary}</td>
                <td><span className="pipeline-source-badge">{t.source_type}</span></td>
                <td><span className={`pipeline-priority-badge priority-${t.priority?.toLowerCase()}`}>{t.priority}</span></td>
                <td>
                  <span className={`pipeline-badge ${STATUS_BADGE_CLASS[t.pipeline_status] ?? 'badge-gray'}`}>
                    {STATUS_LABELS[t.pipeline_status] ?? t.pipeline_status}
                  </span>
                </td>
                <td className="pipeline-date">{new Date(t.collected_at).toLocaleString('ko-KR')}</td>
                <td className="pipeline-actions" onClick={(e) => e.stopPropagation()}>
                  {t.pipeline_status === 'qaplan' && (
                    <>
                      <button
                        className="pipeline-approve-btn"
                        onClick={(e) => handleApprove(e, t.pipeline_id, 'approve')}
                      >
                        승인
                      </button>
                      <button
                        className="pipeline-reject-btn"
                        onClick={(e) => handleApprove(e, t.pipeline_id, 'reject')}
                      >
                        반려
                      </button>
                      <button
                        className="pipeline-qaplan-cancel-btn"
                        onClick={(e) => handleApprove(e, t.pipeline_id, 'cancel')}
                      >
                        취소
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="pipeline-pagination">
          <button
            disabled={!pagination.has_prev}
            onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
            className="pipeline-page-btn"
          >
            이전
          </button>
          <span className="pipeline-page-info">{pagination.page} / {pagination.pages}</span>
          <button
            disabled={!pagination.has_next}
            onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
            className="pipeline-page-btn"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
