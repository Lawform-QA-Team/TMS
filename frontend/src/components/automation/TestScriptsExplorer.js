import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '@tms/components/automation/TestScriptsExplorer.css';

// 파일/폴더 아이템 컴포넌트 (테스트 케이스 폴더 트리 형태)
const FileTreeItem = ({ item, level = 0, scriptType }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);

  const isDirectory = item.type === 'directory';

  const toggleExpanded = async () => {
    if (!isDirectory) return;
    
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    if (children.length === 0 && !loading) {
      await loadChildren();
    }
    setIsExpanded(true);
  };

  const loadChildren = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${config.apiUrl}/test-scripts/explore?path=${encodeURIComponent(item.path)}`);
      
      // scriptType에 따라 필터링
      let filteredChildren = response.data.children || [];
      if (scriptType === 'playwright') {
        // playwright 관련 스크립트만 표시
        filteredChildren = filteredChildren.filter(child => 
          child.name === 'playwright' || 
          child.path.includes('playwright') ||
          child.name.endsWith('.spec.js')
        );
      } else if (scriptType === 'performance') {
        // performance 관련 스크립트만 표시
        filteredChildren = filteredChildren.filter(child => 
          child.name === 'performance' || 
          child.path.includes('performance') ||
          child.name.endsWith('.js') && !child.name.endsWith('.spec.js')
        );
      }
      
      setChildren(filteredChildren);
    } catch (err) {
      console.error('하위 항목 로드 오류:', err);
      setChildren([]);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (filename) => {
    if (filename.endsWith('.js')) return '📄';
    if (filename.endsWith('.py')) return '🐍';
    if (filename.endsWith('.spec.js')) return '🧪';
    if (filename.endsWith('.json')) return '⚙️';
    if (filename.endsWith('.md')) return '📝';
    if (filename.endsWith('.png') || filename.endsWith('.jpg') || filename.endsWith('.jpeg')) return '🖼️';
    if (filename.endsWith('.DS_Store')) return '🗑️';
    return '📄';
  };

  const getFolderIcon = () => {
    if (item.name === 'performance') return '⚡';
    if (item.name === 'playwright') return '🎭';
    if (item.name === 'screenshots') return '📸';
    if (item.name === 'Result') return '📊';
    if (item.name === 'python') return '🐍';
    if (item.name === 'clm') return '📋';
    if (item.name === 'advice') return '💡';
    if (item.name === 'login') return '🔐';
    if (item.name === 'litigation') return '⚖️';
    if (item.name === 'dashboard') return '📊';
    if (item.name === 'common') return '🔧';
    if (item.name === 'url') return '🔗';
    if (item.name === 'nomerl') return '📝';
    if (item.name === 'multi') return '🔄';
    if (item.name === 'dist' || item.name === 'build') return '🏗️';
    if (item.name === '__pycache__') return '💾';
    return '📁';
  };

  const handleItemClick = () => {
    if (isDirectory) {
      toggleExpanded();
    } else {
      // 파일 클릭 시 처리 (예: 내용 보기, 다운로드 등)
      if (process.env.NODE_ENV === 'development') {
        console.log('파일 클릭:', item.path);
      }
    }
  };

  return (
    <div className="file-tree-item" style={{ marginLeft: level * 20 }}>
      <div 
        className={`folder-item ${isDirectory ? 'clickable' : ''}`}
        onClick={handleItemClick}
      >
        {isDirectory && (
          <span 
            className={`folder-toggle ${isExpanded ? 'expanded' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded();
            }}
          >
            {loading ? '⏳' : isExpanded ? '▼' : '▶'}
          </span>
        )}
        <span className="folder-icon">
          {isDirectory ? getFolderIcon() : getFileIcon(item.name)}
        </span>
        <span className="folder-name">{item.name}</span>
        {!isDirectory && (
          <span className="file-size">
            {item.size ? `(${(item.size / 1024).toFixed(1)} KB)` : ''}
          </span>
        )}
      </div>
      
      {isDirectory && isExpanded && children.length > 0 && (
        <div className="folder-children expanded">
          {children.map((child, index) => (
            <FileTreeItem 
              key={`${child.path}-${index}`} 
              item={child} 
              level={level + 1}
              scriptType={scriptType}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// 테스트 스크립트 탐색기 메인 컴포넌트
const TestScriptsExplorer = ({ scriptType = 'playwright' }) => {
  const [rootItems, setRootItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileContent, setFileContent] = useState(null);

  useEffect(() => {
    loadRootStructure();
  }, [scriptType]);

  const loadRootStructure = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // scriptType에 따라 다른 경로로 요청
      let requestPath = 'test-scripts';
      if (scriptType === 'playwright') {
        requestPath = 'test-scripts/playwright';
      } else if (scriptType === 'performance') {
        requestPath = 'test-scripts/performance';
      }
      
      // 백엔드에서 루트 구조 로드
      const response = await axios.get(`/test-scripts/explore?path=${encodeURIComponent(requestPath)}`);
      
      // scriptType에 따라 필터링
      let filteredItems = response.data.children || [];
      if (scriptType === 'playwright') {
        // playwright 관련 스크립트만 표시
        filteredItems = filteredItems.filter(item => 
          item.name === 'playwright' || 
          item.path.includes('playwright') ||
          (item.type === 'file' && item.name.endsWith('.spec.js'))
        );
      } else if (scriptType === 'performance') {
        // performance 관련 스크립트만 표시
        filteredItems = filteredItems.filter(item => 
          item.name === 'performance' || 
          item.path.includes('performance') ||
          (item.type === 'file' && item.name.endsWith('.js') && !item.name.endsWith('.spec.js'))
        );
      }
      
      setRootItems(filteredItems);
    } catch (err) {
      console.error('테스트 스크립트 구조 로드 오류:', err);
      setError('테스트 스크립트 구조를 불러올 수 없습니다.');
      
      // 오류 시 기본 구조 표시 (정적 데이터)
      if (scriptType === 'playwright') {
        setRootItems([
          {
            name: 'playwright',
            type: 'directory',
            path: 'test-scripts/playwright',
            children_count: 1
          }
        ]);
      } else {
        setRootItems([
          {
            name: 'performance',
            type: 'directory',
            path: 'test-scripts/performance',
            children_count: 12
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const closeFileView = () => {
    setFileContent(null);
  };

  const getTitle = () => {
    if (scriptType === 'playwright') {
      return '🎭 자동화 테스트 스크립트';
    } else if (scriptType === 'performance') {
      return '⚡ 성능 테스트 스크립트';
    }
    return '📁 테스트 스크립트';
  };

  if (loading) {
    return (
      <div className="test-scripts-explorer">
        <div className="explorer-header">
          <h2>{getTitle()}</h2>
        </div>
        <div className="loading-container">
          <div className="automation-loading-spinner">⏳</div>
          <p>테스트 스크립트 구조를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="test-scripts-explorer">
        <div className="explorer-header">
          <h2>{getTitle()}</h2>
          <button className="btn btn-refresh" onClick={loadRootStructure}>
            🔄 새로고침
          </button>
        </div>
        <div className="error-container">
          <p className="error-message">❌ {error}</p>
          <p className="error-note">
            현재 정적 데이터로 표시됩니다. 백엔드 연결을 확인해주세요.
          </p>
        </div>
        <div className="folder-tree">
          {rootItems.map((item, index) => (
            <FileTreeItem key={`${item.path}-${index}`} item={item} scriptType={scriptType} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="test-scripts-explorer">
      <div className="explorer-header">
        <h2>{getTitle()}</h2>
        <div className="header-actions">
          <button className="btn btn-refresh" onClick={loadRootStructure}>
            🔄 새로고침
          </button>
          <button className="btn btn-help" title="도움말">
            ❓
          </button>
        </div>
      </div>

      <div className="explorer-content">
        <div className="file-tree-container">
          <div className="tree-header">
            <h3>📂 폴더 구조</h3>
            <p className="tree-description">
              {scriptType === 'playwright' 
                ? 'Playwright 자동화 테스트 스크립트를 탐색할 수 있습니다.'
                : 'K6 성능 테스트 스크립트를 탐색할 수 있습니다.'
              }
            </p>
          </div>
          
          <div className="folder-tree">
            {rootItems.map((item, index) => (
              <FileTreeItem key={`${item.path}-${index}`} item={item} scriptType={scriptType} />
            ))}
          </div>
        </div>

        {fileContent && (
          <div className="file-view-container">
            <div className="file-view-header">
              <h3>📄 파일 내용: {fileContent.path.split('/').pop()}</h3>
              <button className="btn btn-close" onClick={closeFileView}>
                ✕
              </button>
            </div>
            <div className="file-content">
              <pre className="code-content">{fileContent.content}</pre>
              <div className="file-info">
                <span>크기: {(fileContent.size / 1024).toFixed(1)} KB</span>
                <span>경로: {fileContent.path}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="explorer-footer">
        <div className="footer-info">
          {scriptType === 'playwright' ? (
            <p><strong>🎭 Playwright:</strong> 자동화 테스트 스크립트</p>
          ) : (
            <p><strong>⚡ Performance:</strong> K6 성능 테스트 스크립트</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestScriptsExplorer;
