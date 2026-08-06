import React from 'react';
import { usePipelineDetail, cancelPipeline } from '@tms/hooks/usePipeline';
import { useAuth } from '@tms/contexts/AuthContext';
import './Pipeline.css';

const STAGE_LABELS = {
  collected: '1. 티켓 수집',
  qaplan: '2. QA 계획',
  testcases: '3. 테스트케이스 생성',
  pageanalysis: '4. 페이지 분석',
  codegen: '5. 코드 생성',
  testrun: '6. 테스트 실행',
  report: '7. 리포트',
  bugs: '8. 버그 등록',
};

const STAGE_STATUS_CLASS = {
  completed: 'stage-completed',
  active: 'stage-active',
  pending: 'stage-pending',
  failed: 'stage-failed',
};

export default function PipelineDetail({ pipelineId, onClose }) {
  const { token } = useAuth();
  const { data, loading, error, refresh } = usePipelineDetail(pipelineId);

  async function handleCancel() {
    if (!window.confirm('이 파이프라인을 취소하시겠습니까?')) return;
    const res = await cancelPipeline(pipelineId, token);
    if (res.success) refresh();
    else alert(res.error ?? '취소 실패');
  }

  if (!pipelineId) return null;
  if (loading) return <div className="pipeline-loading">로딩 중...</div>;
  if (error) return <div className="pipeline-error">오류: {error}</div>;
  if (!data) return null;

  const { ticket, stages } = data;

  return (
    <div className="pipeline-detail">
      <div className="pipeline-detail-header">
        <h3 className="pipeline-detail-title">{ticket.ticket_key} — {ticket.summary}</h3>
        {onClose && (
          <button className="pipeline-detail-close" onClick={onClose}>✕</button>
        )}
      </div>

      <div className="pipeline-detail-meta">
        <span className="pipeline-meta-item"><b>우선순위:</b> {ticket.priority}</span>
        <span className="pipeline-meta-item"><b>유형:</b> {ticket.issue_type}</span>
        <span className="pipeline-meta-item"><b>출처:</b> {ticket.source_type}</span>
        {ticket.labels?.length > 0 && (
          <span className="pipeline-meta-item">
            <b>레이블:</b> {ticket.labels.join(', ')}
          </span>
        )}
      </div>

      <div className="pipeline-stages-vertical">
        {stages.map(({ stage, status }) => (
          <div key={stage} className={`pipeline-stage-item ${STAGE_STATUS_CLASS[status] ?? ''}`}>
            <div className="pipeline-stage-dot-v" />
            <span className="pipeline-stage-name">{STAGE_LABELS[stage] ?? stage}</span>
            <span className="pipeline-stage-status-label">{status}</span>
          </div>
        ))}
      </div>

      {ticket.pipeline_status === 'collected' && (
        <div className="pipeline-detail-actions">
          <button className="pipeline-cancel-btn" onClick={handleCancel}>
            파이프라인 취소
          </button>
        </div>
      )}
    </div>
  );
}
