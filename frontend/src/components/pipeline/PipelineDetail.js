import React, { useState } from 'react';
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
  const [collapsed, setCollapsed] = useState({
    qaplan: false,
    testcases: false,
    pageanalysis: true,
    codegen: true,
    testrun: false,
    report: false,
    bugs: false,
  });
  function toggle(key) {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  }

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

  const { ticket, stages, qaPlan, pageAnalyses, generatedCode, testRunResult, report, bugs } = data;
  const plan = qaPlan?.plan_content ? (() => { try { return JSON.parse(qaPlan.plan_content); } catch { return null; } })() : null;

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

      {plan && (
        <div className="pipeline-qaplan">
          <div className="pipeline-accordion-header" onClick={() => toggle('qaplan')}>
            <span>QA 계획</span>
            <span className="pipeline-accordion-right">
              {qaPlan.approval_status && (
                <span className={`pipeline-approval-badge approval-${qaPlan.approval_status}`}>
                  {qaPlan.approval_status === 'pending' ? '승인 대기' : qaPlan.approval_status === 'approved' ? '승인됨' : '거절됨'}
                </span>
              )}
              <span className="pipeline-accordion-chevron">{collapsed.qaplan ? '▶' : '▼'}</span>
            </span>
          </div>
          {!collapsed.qaplan && (
            <div className="pipeline-qaplan-body">
              <div className="pipeline-qaplan-row"><b>목표</b><span>{plan.objective}</span></div>
              <div className="pipeline-qaplan-row"><b>접근 방식</b><span>{plan.approach}</span></div>
              <div className="pipeline-qaplan-row">
                <b>테스트 범위</b>
                <ul>{plan.scope?.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
              <div className="pipeline-qaplan-row">
                <b>테스트 유형</b><span>{plan.testTypes?.join(', ')}</span>
              </div>
              <div className="pipeline-qaplan-row">
                <b>예상 TC 수</b><span>{plan.estimatedTcCount}개</span>
              </div>
              {plan.risks?.length > 0 && (
                <div className="pipeline-qaplan-row">
                  <b>리스크</b>
                  <ul>{plan.risks.map((r, i) => <li key={i}>{r}</li>)}</ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {qaPlan?.test_cases?.length > 0 && (
        <div className="pipeline-tc-list">
          <div className="pipeline-accordion-header" onClick={() => toggle('testcases')}>
            <span>테스트 케이스 <span style={{ color: '#6b7280', fontWeight: 400 }}>({qaPlan.test_case_count}개)</span></span>
            <span className="pipeline-accordion-chevron">{collapsed.testcases ? '▶' : '▼'}</span>
          </div>
          {!collapsed.testcases && (
            <div className="pipeline-tc-items">
              {qaPlan.test_cases.map((tc) => (
                <div key={tc.id} className="pipeline-tc-item">
                  <div className="pipeline-tc-title">
                    <span className={`pipeline-priority-badge priority-${tc.priority?.toLowerCase()}`}>{tc.priority}</span>
                    <span className={`pipeline-badge badge-${tc.case_type === 'happyPath' ? 'green' : tc.case_type === 'negative' ? 'red' : 'yellow'}`}>
                      {tc.case_type}
                    </span>
                    {tc.title}
                  </div>
                  {tc.expected_result && (
                    <div className="pipeline-tc-expected">{tc.expected_result}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {pageAnalyses?.length > 0 && (
        <div className="pipeline-tc-list">
          <div className="pipeline-accordion-header" onClick={() => toggle('pageanalysis')}>
            <span>페이지 분석 <span style={{ color: '#6b7280', fontWeight: 400 }}>({pageAnalyses.length}개 페이지)</span></span>
            <span className="pipeline-accordion-chevron">{collapsed.pageanalysis ? '▶' : '▼'}</span>
          </div>
          {!collapsed.pageanalysis && (
            <div className="pipeline-tc-items">
              {pageAnalyses.map((page) => (
                <div key={page.id} className="pipeline-tc-item">
                  <div className="pipeline-tc-title">
                    <span className="pipeline-badge badge-indigo">{page.page_name}</span>
                    {page.url_pattern && (
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{page.url_pattern}</span>
                    )}
                  </div>
                  {page.elements?.length > 0 && (
                    <div className="pipeline-tc-expected">
                      UI 요소: {page.elements.map((el) => el.label).join(', ')}
                    </div>
                  )}
                  {page.flows?.length > 0 && (
                    <div className="pipeline-tc-expected">
                      플로우: {page.flows.map((f) => f.name).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {bugs?.length > 0 && (
        <div className="pipeline-tc-list">
          <div className="pipeline-accordion-header" onClick={() => toggle('bugs')}>
            <span>등록된 버그 <span style={{ color: '#6b7280', fontWeight: 400 }}>({bugs.length}개)</span></span>
            <span className="pipeline-accordion-chevron">{collapsed.bugs ? '▶' : '▼'}</span>
          </div>
          {!collapsed.bugs && (
            <div className="pipeline-tc-items">
              {bugs.map((bug) => (
                <div key={bug.id} className="pipeline-tc-item">
                  <div className="pipeline-tc-title">
                    <span className={`pipeline-priority-badge priority-${
                      bug.severity === 'critical' || bug.severity === 'high' ? 'high' :
                      bug.severity === 'medium' ? 'medium' : 'low'
                    }`}>{bug.severity}</span>
                    <span className={`pipeline-badge badge-${bug.status === 'open' ? 'red' : 'green'}`}>
                      {bug.status}
                    </span>
                    {bug.jira_issue_key && (
                      <span className="pipeline-badge badge-indigo">{bug.jira_issue_key}</span>
                    )}
                    {bug.title}
                  </div>
                  {bug.tc_title && (
                    <div className="pipeline-tc-expected">연관 TC: {bug.tc_title}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {report && (
        <div className="pipeline-tc-list">
          <div className="pipeline-accordion-header" onClick={() => toggle('report')}>
            <span>QA 리포트</span>
            <span className="pipeline-accordion-right">
              <span className={`pipeline-approval-badge approval-${
                report.risk_level === 'low' ? 'approved' :
                report.risk_level === 'critical' ? 'rejected' : 'pending'
              }`}>
                위험도: {report.risk_level}
              </span>
              {report.ready_for_release && (
                <span className="pipeline-approval-badge approval-approved">릴리즈 준비 완료</span>
              )}
              <span className="pipeline-accordion-chevron">{collapsed.report ? '▶' : '▼'}</span>
            </span>
          </div>
          {!collapsed.report && (
            <div className="pipeline-qaplan-body">
              <div className="pipeline-qaplan-row">
                <b>요약</b><span>{report.summary}</span>
              </div>
              <div className="pipeline-qaplan-row">
                <b>통과율</b>
                <span>{report.pass_rate != null ? `${report.pass_rate}%` : '-'}</span>
              </div>
              <div className="pipeline-qaplan-row">
                <b>품질 점수</b><span>{report.quality_score}/10</span>
              </div>
              {report.content?.findings?.length > 0 && (
                <div className="pipeline-qaplan-row">
                  <b>주요 발견</b>
                  <ul>{report.content.findings.map((f, i) => <li key={i}>{f}</li>)}</ul>
                </div>
              )}
              {report.content?.recommendation && (
                <div className="pipeline-qaplan-row">
                  <b>권고사항</b><span>{report.content.recommendation}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {testRunResult && (
        <div className="pipeline-tc-list">
          <div className="pipeline-accordion-header" onClick={() => toggle('testrun')}>
            <span>테스트 실행 결과</span>
            <span className="pipeline-accordion-right">
              <span className={`pipeline-approval-badge approval-${
                testRunResult.status === 'passed' ? 'approved' :
                testRunResult.status === 'failed' ? 'rejected' : 'pending'
              }`}>
                {testRunResult.status === 'simulation' ? '시뮬레이션' :
                 testRunResult.status === 'passed' ? '통과' :
                 testRunResult.status === 'failed' ? '실패' :
                 testRunResult.status === 'running' ? '실행 중' : testRunResult.status}
              </span>
              <span className="pipeline-accordion-chevron">{collapsed.testrun ? '▶' : '▼'}</span>
            </span>
          </div>
          {!collapsed.testrun && (
            <>
              <div className="pipeline-qaplan-body">
                <div className="pipeline-qaplan-row">
                  <b>전체</b><span>{testRunResult.total_tests}개</span>
                </div>
                <div className="pipeline-qaplan-row">
                  <b>통과</b><span style={{ color: '#16a34a' }}>{testRunResult.passed}개</span>
                </div>
                <div className="pipeline-qaplan-row">
                  <b>실패</b><span style={{ color: '#dc2626' }}>{testRunResult.failed}개</span>
                </div>
                {testRunResult.skipped > 0 && (
                  <div className="pipeline-qaplan-row">
                    <b>건너뜀</b><span style={{ color: '#6b7280' }}>{testRunResult.skipped}개</span>
                  </div>
                )}
                {testRunResult.duration_ms > 0 && (
                  <div className="pipeline-qaplan-row">
                    <b>소요 시간</b><span>{(testRunResult.duration_ms / 1000).toFixed(1)}초</span>
                  </div>
                )}
              </div>
              {testRunResult.results?.length > 0 && (
                <div className="pipeline-tc-items">
                  {testRunResult.results.map((r, i) => (
                    <div key={i} className="pipeline-tc-item">
                      <div className="pipeline-tc-title">
                        <span className={`pipeline-badge badge-${
                          r.status === 'passed' ? 'green' : r.status === 'failed' ? 'red' : 'yellow'
                        }`}>{r.status}</span>
                        {r.title}
                      </div>
                      {r.error && (
                        <div className="pipeline-tc-expected" style={{ color: '#dc2626' }}>{r.error}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {generatedCode && (
        <div className="pipeline-tc-list">
          <div className="pipeline-accordion-header" onClick={() => toggle('codegen')}>
            <span>
              생성된 테스트 코드
              <span style={{ color: '#6b7280', fontWeight: 400, marginLeft: 8 }}>
                {generatedCode.file_name}
              </span>
            </span>
            <span className="pipeline-accordion-right">
              <button
                className="pipeline-copy-btn"
                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(generatedCode.code); }}
              >
                복사
              </button>
              <span className="pipeline-accordion-chevron">{collapsed.codegen ? '▶' : '▼'}</span>
            </span>
          </div>
          {!collapsed.codegen && (
            <pre className="pipeline-code-viewer">{generatedCode.code}</pre>
          )}
        </div>
      )}

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
