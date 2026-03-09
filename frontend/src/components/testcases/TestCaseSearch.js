import React from 'react';
import '@tms/components/testcases/TestCaseSearch.css';

const TestCaseSearch = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  environmentFilter,
  onEnvironmentFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  creatorFilter,
  onCreatorFilterChange,
  assigneeFilter,
  onAssigneeFilterChange,
  onClearFilters,
  uniqueEnvironments = [],
  uniqueCategories = [],
  uniqueCreators = [],
  uniqueAssignees = [],
  totalItems = 0
}) => {
  return (
    <div className="testcase-search-section">
      <div className="testcase-search-container">
        {/* 기본 검색 */}
        <div className="testcase-search-input-wrapper">
          <input
            type="text"
            placeholder="🔍 테스트 케이스 검색... (대분류, 중분류, 소분류, 기대결과, 비고, 작성자, 담당자)"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="testcase-search-input"
          />
          {searchTerm && (
            <button 
              className="testcase-btn testcase-btn-clear-search"
              onClick={() => onSearchChange('')}
              title="검색어 지우기"
            >
              ✕
            </button>
          )}
        </div>

        {/* 고급 필터 */}
        <div className="testcase-advanced-filters">
          <div className="testcase-filter-row">
            <div className="testcase-filter-group">
              <label>상태:</label>
              <select
                value={statusFilter}
                onChange={(e) => onStatusFilterChange(e.target.value)}
                className="testcase-filter-select"
              >
                <option value="all">모든 상태</option>
                <option value="Pass">Pass</option>
                <option value="Fail">Fail</option>
                <option value="N/T">N/T</option>
                <option value="N/A">N/A</option>
                <option value="Block">Block</option>
              </select>
            </div>

            <div className="testcase-filter-group">
              <label>환경:</label>
              <select
                value={environmentFilter}
                onChange={(e) => onEnvironmentFilterChange(e.target.value)}
                className="testcase-filter-select"
              >
                <option value="all">모든 환경</option>
                {uniqueEnvironments.map(env => (
                  <option key={env} value={env}>{env}</option>
                ))}
              </select>
            </div>

            <div className="testcase-filter-group">
              <label>카테고리:</label>
              <select
                value={categoryFilter}
                onChange={(e) => onCategoryFilterChange(e.target.value)}
                className="testcase-filter-select"
              >
                <option value="all">모든 카테고리</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="testcase-filter-group">
              <label>작성자:</label>
              <select
                value={creatorFilter}
                onChange={(e) => onCreatorFilterChange(e.target.value)}
                className="testcase-filter-select"
              >
                <option value="all">모든 작성자</option>
                {uniqueCreators.map(creator => (
                  <option key={creator} value={creator}>{creator}</option>
                ))}
              </select>
            </div>

            <div className="testcase-filter-group">
              <label>담당자:</label>
              <select
                value={assigneeFilter}
                onChange={(e) => onAssigneeFilterChange(e.target.value)}
                className="testcase-filter-select"
              >
                <option value="all">모든 담당자</option>
                {uniqueAssignees.map(assignee => (
                  <option key={assignee} value={assignee}>{assignee}</option>
                ))}
              </select>
            </div>

            <button
              onClick={onClearFilters}
              className="testcase-btn testcase-btn-clear-filters"
              title="모든 필터 초기화"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* 검색 결과 요약 */}
        <div className="testcase-search-summary">
          <span>총 {totalItems}개 테스트 케이스</span>
          {searchTerm && <span> • 검색어: "{searchTerm}"</span>}
          {statusFilter !== 'all' && <span> • 상태: {statusFilter}</span>}
          {environmentFilter !== 'all' && <span> • 환경: {environmentFilter}</span>}
          {categoryFilter !== 'all' && <span> • 카테고리: {categoryFilter}</span>}
          {creatorFilter !== 'all' && <span> • 작성자: {creatorFilter}</span>}
          {assigneeFilter !== 'all' && <span> • 담당자: {assigneeFilter}</span>}
        </div>
      </div>
    </div>
  );
};

export default TestCaseSearch;
