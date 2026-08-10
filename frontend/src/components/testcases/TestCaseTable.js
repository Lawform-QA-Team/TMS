import React from 'react';
import { getUserDisplayName } from '@tms/utils/userDisplay';
import { formatUTCToKST } from '@tms/utils/dateUtils';
import '@tms/components/testcases/TestCaseTable.css';

const normalizeStatus = (s) => (!s || s === 'pending') ? 'N/T' : s;

const STATUS_CONFIG = {
  'Pass':  { dot: '#28a745', bg: '#eaf6ec', color: '#1a7a35', rowCls: '' },
  'Fail':  { dot: '#dc3545', bg: '#fde8ea', color: '#a71d2a', rowCls: 'row-fail' },
  'N/T':   { dot: '#adb5bd', bg: '#f1f3f5', color: '#495057', rowCls: '' },
  'N/A':   { dot: '#74c0fc', bg: '#e7f5ff', color: '#1971c2', rowCls: '' },
  'Block': { dot: '#fd7e14', bg: '#fff4e6', color: '#d9480f', rowCls: 'row-block' },
};

const PRIORITY_CONFIG = {
  critical: { label: '긴급', bg: '#dc3545', color: '#fff' },
  high:     { label: '높음', bg: '#fd7e14', color: '#fff' },
  medium:   { label: '중간', bg: '#ffc107', color: '#333' },
  low:      { label: '낮음', bg: '#adb5bd', color: '#fff' },
};

const TestCaseTable = ({
  testCases = [],
  selectedTestCases = [],
  onSelectTestCase,
  onSelectAll,
  onStatusChange,
  onAssigneeChange,
  onEdit,
  onDelete,
  onExecute,
  onViewDetails,
  users = [],
  user,
  sortBy,
  sortOrder,
  onSort
}) => {
  const canModify = user && ['admin', 'user'].includes(user.role);

  const renderSortIcon = (col) => {
    if (sortBy !== col) return null;
    return <span className="sort-icon">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="tc-table-wrap">
      <table className="tc-table">
        <thead>
          <tr>
            <th className="col-check">
              <input
                type="checkbox"
                checked={selectedTestCases.length === testCases.length && testCases.length > 0}
                onChange={onSelectAll}
              />
            </th>
            <th className="col-no" onClick={() => onSort?.('tc_number')} style={{ cursor: 'pointer' }}>
              NO {renderSortIcon('tc_number')}
            </th>
            <th className="col-status" onClick={() => onSort?.('status')} style={{ cursor: 'pointer' }}>
              상태 {renderSortIcon('status')}
            </th>
            <th className="col-category">구분</th>
            <th className="col-name" onClick={() => onSort?.('name')} style={{ cursor: 'pointer' }}>
              화면/기능명 {renderSortIcon('name')}
            </th>
            <th className="col-reg" onClick={() => onSort?.('creator')} style={{ cursor: 'pointer' }}>
              등록 {renderSortIcon('creator')}
            </th>
            <th className="col-priority">중요도</th>
            <th className="col-actions">관리</th>
          </tr>
        </thead>
        <tbody>
          {testCases.map((tc) => {
            const status = normalizeStatus(tc.result_status);
            const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['N/T'];
            const priority = (tc.priority || '').toLowerCase();
            const priCfg = PRIORITY_CONFIG[priority];
            const tags = [
              tc.sub_category,
              tc.detail_category,
              tc.environment,
              tc.assignee_name ? `담당: ${tc.assignee_name}` : null,
            ].filter(Boolean);

            return (
              <tr
                key={tc.id}
                className={`tc-row ${cfg.rowCls} ${selectedTestCases.includes(tc.id) ? 'row-selected' : ''}`}
                onClick={() => onViewDetails(tc)}
                style={{ cursor: 'pointer' }}
              >
                <td className="col-check" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedTestCases.includes(tc.id)}
                    onChange={() => onSelectTestCase(tc.id)}
                  />
                </td>

                {/* NO */}
                <td className="col-no">{tc.tc_number || tc.id}</td>

                {/* 상태 */}
                <td className="col-status" onClick={(e) => e.stopPropagation()}>
                  <div className="status-pill" style={{ background: cfg.bg, color: cfg.color }}>
                    <span className="status-dot" style={{ background: cfg.dot }} />
                    {status}
                  </div>
                  {canModify && (
                    <select
                      className="status-select"
                      value={normalizeStatus(tc.result_status)}
                      onChange={(e) => onStatusChange(tc.id, e.target.value)}
                    >
                      {Object.keys(STATUS_CONFIG).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  )}
                </td>

                {/* 구분 */}
                <td className="col-category">{tc.main_category || '-'}</td>

                {/* 화면/기능명 */}
                <td className="col-name">
                  <div className="name-title-row">
                    {priCfg && (
                      <span className="priority-badge" style={{ background: priCfg.bg, color: priCfg.color }}>
                        {priCfg.label}
                      </span>
                    )}
                    <span className="name-title">{tc.name || '제목 없음'}</span>
                  </div>
                  {(tc.expected_result || tc.description) && (
                    <div className="name-desc">
                      {tc.expected_result || tc.description}
                    </div>
                  )}
                  {tags.length > 0 && (
                    <div className="name-tags">
                      {tags.map((tag, i) => (
                        <span key={i} className="tag-chip">{tag}</span>
                      ))}
                    </div>
                  )}
                </td>

                {/* 등록 */}
                <td className="col-reg">
                  <div className="reg-name">{tc.creator_name || '-'}</div>
                  {tc.created_at && (
                    <div className="reg-date">{formatUTCToKST(tc.created_at)}</div>
                  )}
                  {canModify && (
                    <select
                      className="assignee-select"
                      value={tc.assignee_id || ''}
                      onChange={(e) => onAssigneeChange(tc.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      title="담당자 변경"
                    >
                      <option value="">담당자 변경</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{getUserDisplayName(u)}</option>
                      ))}
                    </select>
                  )}
                </td>

                {/* 중요도 */}
                <td className="col-priority">
                  {priCfg && (
                    <span className="priority-badge" style={{ background: priCfg.bg, color: priCfg.color }}>
                      {priCfg.label}
                    </span>
                  )}
                </td>

                {/* 관리 */}
                <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                  <div className="action-btns">
                    {canModify && (tc.automation_code_path || tc.test_steps) && (
                      <button className="row-btn btn-run" onClick={() => onExecute(tc.id)}>실행</button>
                    )}
                    {canModify && (
                      <button className="row-btn btn-edit" onClick={() => onEdit(tc)}>수정</button>
                    )}
                    {user && user.role === 'admin' && (
                      <button className="row-btn btn-del" onClick={() => onDelete(tc.id)}>삭제</button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TestCaseTable;
