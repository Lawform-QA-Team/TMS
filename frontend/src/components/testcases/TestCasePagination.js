import React from 'react';
import '@tms/components/testcases/TestCasePagination.css';

const TestCasePagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange
}) => {
  if (totalPages <= 1) return null;

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // 끝 페이지가 조정되면 시작 페이지도 조정
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // 첫 페이지가 1이 아니면 "..." 표시
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          className="pagination-btn"
          onClick={() => onPageChange(1)}
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis1" className="pagination-ellipsis">
            ...
          </span>
        );
      }
    }
    
    // 페이지 번호들
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`pagination-btn ${currentPage === i ? 'active' : ''}`}
          onClick={() => onPageChange(i)}
        >
          {i}
        </button>
      );
    }
    
    // 마지막 페이지가 끝이 아니면 "..." 표시
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="ellipsis2" className="pagination-ellipsis">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          className="pagination-btn"
          onClick={() => onPageChange(totalPages)}
        >
          {totalPages}
        </button>
      );
    }
    
    return pages;
  };

  return (
    <div className="pagination-container">
      {/* 페이지 크기 선택 */}
      <div className="pagination-controls-top">
        <div className="items-per-page-selector">
          <label htmlFor="items-per-page">페이지당 항목 수:</label>
          <select
            id="items-per-page"
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="items-per-page-select"
          >
            <option value={10}>10개</option>
            <option value={20}>20개</option>
            <option value={50}>50개</option>
            <option value={100}>100개</option>
          </select>
        </div>
        <div className="pagination-info-top">
          <span>
            {totalItems > 0 ? `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, totalItems)}` : '0'} / {totalItems}개
          </span>
        </div>
      </div>

      {/* 페이지네이션 버튼들 */}
      <div className="pagination-controls">
        <div className="pagination-buttons">
          <button
            className="pagination-btn"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            title="첫 페이지"
          >
            &lt;&lt;
          </button>
          <button
            className="pagination-btn"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            title="이전 페이지"
          >
            &lt;
          </button>
          
          {renderPageNumbers()}
          
          <button
            className="pagination-btn"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            title="다음 페이지"
          >
            &gt;
          </button>
          <button
            className="pagination-btn"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            title="마지막 페이지"
          >
            &gt;&gt;
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestCasePagination;
