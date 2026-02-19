// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import '@tms/App.css';
import {TestCaseApp} from '@tms/components/testcases';
import PerformanceTestManager from '@tms/components/performance/PerformanceTestManager';
import AutomationTestManager from '@tms/components/automation';
import TestScriptsManager from '@tms/components/testscripts/TestScriptsManager';
import UnifiedDashboard from '@tms/components/dashboard';
import FolderManager from '@tms/components/dashboard/FolderManager';
import Settings from '@tms/components/settings/Settings';
import UserProfile from '@tms/components/auth/UserProfile';
import JiraIssuesList from '@tms/components/jira/JiraIssuesList';
import NotificationBell from '@tms/components/notifications/NotificationBell';
import { ErrorBoundary } from '@tms/components/utils';
import { AuthProvider, useAuth } from '@tms/contexts/AuthContext';
import ProtectedRoute from '@tms/components/auth/ProtectedRoute';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const { user, logout } = useAuth();

  // 사용자 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  // window 객체에 setActiveTab 등록 (다른 컴포넌트에서 호출 가능하도록)
  useEffect(() => {
    window.setActiveTab = setActiveTab;
    
    return () => {
      if (window.setActiveTab === setActiveTab) {
        delete window.setActiveTab;
      }
    };
  }, [setActiveTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <ErrorBoundary>
            <UnifiedDashboard setActiveTab={setActiveTab} />
          </ErrorBoundary>
        );
      case 'testcases':
        return (
          <ErrorBoundary>
            <TestCaseApp setActiveTab={setActiveTab} />
          </ErrorBoundary>
        );
      case 'jira':
        return (
          <ErrorBoundary>
            {console.log('[App] Render Jira tab with modalMode=true')}
            <JiraIssuesList modalMode={true} />
          </ErrorBoundary>
        );
      case 'automation':
        return (
          <ErrorBoundary>
            <AutomationTestManager />
          </ErrorBoundary>
        );
      case 'performance':
        return (
          <ErrorBoundary>
            <PerformanceTestManager />
          </ErrorBoundary>
        );
      case 'testscripts':
        return (
          <ErrorBoundary>
            <TestScriptsManager />
          </ErrorBoundary>
        );
      case 'folders':
        return (
          <ErrorBoundary>
            <FolderManager />
          </ErrorBoundary>
        );
      case 'settings':
        return (
          <ErrorBoundary>
            <Settings />
          </ErrorBoundary>
        );
      case 'profile':
        return (
          <ErrorBoundary>
            <UserProfile />
          </ErrorBoundary>
        );
      default:
        return (
          <ErrorBoundary>
            <UnifiedDashboard />
          </ErrorBoundary>
        );
    }
  };

  const handleLogout = () => {
    logout();
    setActiveTab('dashboard');
  };

  // 권한별 메뉴 표시 조건
  const canAccessSettings = () => {
    return user && (user.role === 'admin' || user.role === 'user');
  };

  const canAccessAutomation = () => {
    // 게스트도 자동화 테스트 조회 가능
    return user;
  };

  const canAccessPerformance = () => {
    // 게스트도 성능 테스트 조회 가능
    return user;
  };

  const canAccessFolders = () => {
    // 게스트도 폴더 조회 가능
    return user;
  };

  const canAccessJira = () => {
    // 게스트도 JIRA 이슈 조회 가능
    return user;
  };

  const navItems = [
    { id: 'dashboard', label: '대시보드', icon: '📊' },
    { id: 'testcases', label: '테스트 케이스', icon: '🧪' },
    ...(canAccessJira() ? [{ id: 'jira', label: '이슈', icon: '🔗' }] : []),
    ...(canAccessAutomation() ? [{ id: 'automation', label: '자동화 테스트', icon: '🤖' }] : []),
    ...(canAccessPerformance() ? [{ id: 'performance', label: '성능 테스트', icon: '⚡' }] : []),
    ...(canAccessAutomation() ? [{ id: 'testscripts', label: '테스트 스크립트', icon: '📁' }] : []),
    ...(canAccessFolders() ? [{ id: 'folders', label: '폴더 관리', icon: '📁' }] : []),
  ];

  return (
    <ErrorBoundary>
      <div className="App app-layout">
        <header className="app-header">
          <h1 className="app-logo">LTMS</h1>
          {user && (
            <div className="app-header-right">
              <NotificationBell />
              <div className="user-menu" ref={userMenuRef}>
                <button
                  type="button"
                  className="user-menu-trigger"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <span className="user-info">
                    <span>👤 {user.username}</span>
                    {user.role === 'admin' && <span className="admin-badge">관리자</span>}
                    {user.role === 'user' && <span className="user-badge">사용자</span>}
                    {user.role === 'guest' && <span className="guest-badge">게스트</span>}
                  </span>
                  <span className="user-menu-chevron">{userMenuOpen ? '▲' : '▼'}</span>
                </button>
                {userMenuOpen && (
                  <ul className="user-menu-dropdown" role="menu">
                    <li role="none">
                      <button type="button" role="menuitem" className="user-menu-item" onClick={() => { setActiveTab('profile'); setUserMenuOpen(false); }}>
                        👤 프로필
                      </button>
                    </li>
                    {canAccessSettings() && (
                      <li role="none">
                        <button type="button" role="menuitem" className="user-menu-item" onClick={() => { setActiveTab('settings'); setUserMenuOpen(false); }}>
                          ⚙️ 설정
                        </button>
                      </li>
                    )}
                    <li role="none">
                      <button type="button" role="menuitem" className="user-menu-item user-menu-item--logout" onClick={() => { handleLogout(); setUserMenuOpen(false); }}>
                        🚪 로그아웃
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            </div>
          )}
        </header>

        <div className="app-body">
          <aside className="app-sidebar">
            <nav className="sidebar-nav">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <span className="sidebar-nav-icon">{item.icon}</span>
                  <span className="sidebar-nav-label">{item.label}</span>
                  <span className="sidebar-nav-chevron">&gt;</span>
                </button>
              ))}
            </nav>
          </aside>

          <main className="main-content">
            {renderContent()}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AppContent />
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;
