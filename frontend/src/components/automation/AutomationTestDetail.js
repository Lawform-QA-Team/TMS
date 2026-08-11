import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@tms/config';
import { formatUTCToKST, formatUnixTimestampToKST } from '@tms/utils/dateUtils';
import '@tms/components/automation/AutomationTestDetail.css';

// 스크린샷 갤러리 컴포넌트
const ScreenshotGallery = ({ testId, testName }) => {
  const [screenshots, setScreenshots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);

  useEffect(() => {
    if (testId) {
      fetchScreenshots();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  const fetchScreenshots = async () => {
    try {
      setLoading(true);
      // 먼저 테스트 관련 스크린샷 조회
      const response = await axios.get(`/screenshots/by-test/${testId}`);
      setScreenshots(response.data);
    } catch (err) {
      console.error('스크린샷 조회 오류:', err);
      // 테스트 관련 스크린샷이 없으면 최근 스크린샷 조회
      try {
        const recentResponse = await axios.get('/screenshots/recent?limit=20');
        setScreenshots(recentResponse.data);
      } catch (recentErr) {
        console.error('최근 스크린샷 조회 오류:', recentErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleScreenshotClick = (screenshot) => {
    setSelectedScreenshot(screenshot);
  };

  const closeModal = () => {
    setSelectedScreenshot(null);
  };

  if (loading) {
    return <div className="screenshots-loading">스크린샷 로딩 중...</div>;
  }

  if (screenshots.length === 0) {
    return <div className="no-screenshots">관련 스크린샷이 없습니다.</div>;
  }

  return (
    <div className="screenshot-gallery">
      <h4>관련 스크린샷 ({screenshots.length}개)</h4>
      <div className="screenshot-grid">
        {screenshots.map((screenshot, index) => (
          <div 
            key={index} 
            className="screenshot-item"
            onClick={() => handleScreenshotClick(screenshot)}
          >
            <img 
              src={`${config.apiUrl}/screenshots/${screenshot.path}`}
              alt={screenshot.filename}
              className="screenshot-thumbnail"
            />
            <div className="screenshot-info">
              <span className="screenshot-filename">{screenshot.filename}</span>
                          <span className="screenshot-date">
              {formatUnixTimestampToKST(screenshot.timestamp)}
            </span>
            </div>
          </div>
        ))}
      </div>

      {/* 스크린샷 모달 */}
      {selectedScreenshot && (
        <div className="screenshot-modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>
            <img 
              src={`${config.apiUrl}/screenshots/${selectedScreenshot.path}`}
              alt={selectedScreenshot.filename}
              className="modal-screenshot"
            />
            <div className="modal-info">
              <h3>{selectedScreenshot.filename}</h3>
              <p>경로: {selectedScreenshot.path}</p>
              <p>크기: {(selectedScreenshot.size / 1024).toFixed(1)} KB</p>
              <p>생성일: {formatUnixTimestampToKST(selectedScreenshot.timestamp)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 자동화 테스트 실행 결과 컴포넌트
const AutomationTestResults = ({ testId }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedResults, setExpandedResults] = useState(new Set());

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/automation-tests/${testId}/results`);
      setResults(response.data);
    } catch (err) {
      console.error('자동화 테스트 결과 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (testId) {
      fetchResults();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  const toggleResultDetails = (resultId) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(resultId)) {
      newExpanded.delete(resultId);
    } else {
      newExpanded.add(resultId);
    }
    setExpandedResults(newExpanded);
  };

  if (loading) {
    return <div className="results-loading">실행 결과 로딩 중...</div>;
  }

  if (results.length === 0) {
    return <div className="no-results">실행 결과가 없습니다.</div>;
  }

  return (
    <div className="automation-results-container">
      <div className="results-table-container">
        <table className="results-table">
          <thead>
            <tr>
              <th>실행 시간</th>
              <th>상태</th>
              <th>실행 시간</th>
              <th>환경</th>
              <th>실행자</th>
              <th>메모</th>
              <th>상세</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => (
              <React.Fragment key={result.id}>
                <tr className={`result-row ${(result.result || 'N/A').toLowerCase()}`}>
                                  <td>
                  {result.executed_at ? formatUTCToKST(result.executed_at) : 'N/A'}
                </td>
                  <td>
                    <span className={`status-${(result.result || 'N/A').toLowerCase()}`}>
                      {result.result || 'N/A'}
                    </span>
                  </td>
                  <td>
                    {result.execution_time ? `${result.execution_time}ms` : 'N/A'}
                  </td>
                  <td>{result.environment || 'N/A'}</td>
                  <td>{result.executed_by || 'N/A'}</td>
                  <td>
                    {result.notes ? (
                      <details>
                        <summary>결과 보기</summary>
                        <pre className="result-notes">{result.notes}</pre>
                      </details>
                    ) : 'N/A'}
                  </td>
                  <td>
                    <button 
                      className="btn btn-details btn-icon"
                      onClick={() => toggleResultDetails(result.id)}
                      title="상세보기"
                    >
                      {expandedResults.has(result.id) ? '📋' : '📄'}
                    </button>
                  </td>
                </tr>
                {expandedResults.has(result.id) && (
                  <tr className="result-detail-row">
                    <td colSpan="7">
                      <div className="result-details expanded">
                        <div className="result-detail-content">
                          <h5>📋 실행 결과 상세 정보</h5>
                          <div className="detail-grid">
                            <div className="detail-item">
                              <strong>실행 ID:</strong> {result.id}
                            </div>
                            <div className="detail-item">
                              <strong>테스트 ID:</strong> {result.automation_test_id}
                            </div>
                            <div className="detail-item">
                              <strong>실행 시작:</strong> {result.executed_at ? formatUTCToKST(result.executed_at) : 'N/A'}
                            </div>
                            <div className="detail-item">
                              <strong>실행 시간:</strong> {result.execution_time ? `${result.execution_time}ms` : 'N/A'}
                            </div>
                            <div className="detail-item">
                              <strong>환경:</strong> {result.environment || 'N/A'}
                            </div>
                            <div className="detail-item">
                              <strong>실행자:</strong> {result.executed_by || 'N/A'}
                            </div>
                            {result.notes && (
                              <div className="detail-item full-width">
                                <strong>상세 메모:</strong>
                                <pre className="result-notes">{result.notes}</pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AutomationTestDetail = ({ test, onClose, onRefresh }) => {
  const [screenshotsExpanded, setScreenshotsExpanded] = useState(true);
  const [resultsExpanded, setResultsExpanded] = useState(true);

  return (
    <div className="automation-test-detail">
      <div className="detail-content">
        {/* 기본 정보 섹션 */}
        <div className="automation-info-table">
          <h5>📋 자동화 테스트 상세 정보</h5>
          <table className="info-table">
            <tbody>
              <tr>
                <th>테스트명</th>
                <td>{test.name}</td>
                <th>테스트 타입</th>
                <td>
                  <span className="test-type-badge">{test.test_type}</span>
                </td>
              </tr>
              <tr>
                <th>환경</th>
                <td>
                  <span className="environment-badge">{test.environment}</span>
                </td>
                <th>자동화</th>
                <td>
                  <span className="automation-badge">🤖 자동화</span>
                </td>
              </tr>
              <tr>
                <th>작성자</th>
                <td>
                  <span className="creator-badge">
                    👤 {test.creator_name || '없음'}
                  </span>
                </td>
                <th>담당자</th>
                <td>
                  <span className="assignee-badge">
                    👤 {test.assignee_name || '없음'}
                  </span>
                </td>
              </tr>
              <tr>
                <th>스크립트 경로</th>
                <td colSpan="3" className="script-path">
                  {test.script_path || '없음'}
                </td>
              </tr>
              <tr>
                <th>설명</th>
                <td colSpan="3" className="description">
                  {test.description || '설명 없음'}
                </td>
              </tr>
              {test.parameters && Object.keys(test.parameters).length > 0 && (
                <tr>
                  <th>매개변수</th>
                  <td colSpan="3" className="parameters">
                    <pre className="parameters-json">{JSON.stringify(test.parameters, null, 2)}</pre>
                  </td>
                </tr>
              )}
              <tr>
                <th>생성일</th>
                <td>{formatUTCToKST(test.created_at)}</td>
                <th>수정일</th>
                <td>{test.updated_at ? formatUTCToKST(test.updated_at) : 'N/A'}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* 스크린샷 영역 */}
        <div className="detail-section">
          <h3 
            className="collapsible-header"
            onClick={() => setScreenshotsExpanded(!screenshotsExpanded)}
          >
            📸 관련 스크린샷 {screenshotsExpanded ? '▼' : '▶'}
          </h3>
          {screenshotsExpanded && (
            <ScreenshotGallery testId={test.id} testName={test.name} />
          )}
        </div>
        
        {/* 자동화 실행 결과 */}
        <div className="detail-section">
          <h3 
            className="collapsible-header"
            onClick={() => setResultsExpanded(!resultsExpanded)}
          >
            🤖 자동화 실행 결과 {resultsExpanded ? '▼' : '▶'}
          </h3>
          {resultsExpanded && (
            <AutomationTestResults testId={test.id} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AutomationTestDetail; 