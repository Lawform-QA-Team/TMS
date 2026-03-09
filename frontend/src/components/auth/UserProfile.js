import React, { useEffect, useState } from 'react';
import { useAuth } from '@tms/contexts/AuthContext';
import config from '@tms/config';
import { formatUTCToKST } from '@tms/utils/dateUtils';
import '@tms/components/auth/Auth.css';
import '@tms/components/auth/UserProfile.css';

const UserProfile = () => {
  const { user, token, changePassword, logout } = useAuth();
  const [activeMenu, setActiveMenu] = useState('account'); // account, notifications, login, login-fail, security, logout
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const isGuest = user?.role === 'guest';
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const defaultDetailSettings = {
    mention: { in_app: true, email: false, slack: false },
    assignment: { in_app: true, email: false, slack: false },
    test_status_changed: { in_app: true, email: false, slack: false }
  };
  const [notificationSettings, setNotificationSettings] = useState({
    email_enabled: true,
    slack_enabled: false,
    slack_webhook_url: '',
    in_app_enabled: true,
    settings: defaultDetailSettings
  });
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsMessage, setNotificationsMessage] = useState({ type: '', text: '' });

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const validatePasswordForm = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' });
      return false;
    }
    
    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: '새 비밀번호는 최소 8자 이상이어야 합니다.' });
      return false;
    }
    
    return true;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }
    
    setLoading(true);
    setMessage({ type: '', text: '' });

    const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
    
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
    } else {
      setMessage({ type: 'error', text: result.error });
    }
    
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    if (isGuest && !['account', 'logout'].includes(activeMenu)) {
      setActiveMenu('account');
    }
  }, [activeMenu, isGuest]);

  useEffect(() => {
    if (activeMenu === 'notifications' && !isGuest) {
      fetchNotificationSettings();
    }
  }, [activeMenu, isGuest]);

  const fetchNotificationSettings = async () => {
    try {
      setNotificationsLoading(true);
      setNotificationsMessage({ type: '', text: '' });
      const response = await fetch(`${config.apiUrl}/notifications/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotificationSettings({
          email_enabled: data?.email_enabled ?? true,
          slack_enabled: data?.slack_enabled ?? false,
          slack_webhook_url: data?.slack_webhook_url || '',
          in_app_enabled: data?.in_app_enabled ?? true,
          settings: {
            ...defaultDetailSettings,
            ...(data?.settings || {})
          }
        });
      } else {
        setNotificationsMessage({ type: 'error', text: '알림 설정을 불러오지 못했습니다.' });
      }
    } catch (err) {
      setNotificationsMessage({ type: 'error', text: '알림 설정을 불러오지 못했습니다.' });
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleNotificationSave = async () => {
    try {
      setNotificationsLoading(true);
      setNotificationsMessage({ type: '', text: '' });
      const response = await fetch(`${config.apiUrl}/notifications/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email_enabled: notificationSettings.email_enabled,
          slack_enabled: notificationSettings.slack_enabled,
          slack_webhook_url: notificationSettings.slack_webhook_url,
          in_app_enabled: notificationSettings.in_app_enabled,
          settings: notificationSettings.settings
        })
      });

      if (response.ok) {
        setNotificationsMessage({ type: 'success', text: '알림 설정이 저장되었습니다.' });
      } else {
        setNotificationsMessage({ type: 'error', text: '알림 설정 저장에 실패했습니다.' });
      }
    } catch (err) {
      setNotificationsMessage({ type: 'error', text: '알림 설정 저장에 실패했습니다.' });
    } finally {
      setNotificationsLoading(false);
    }
  };

  const renderAccountSection = () => (
    <>
      <div className="profile-section-header">
        <h2>계정 설정</h2>
        <p>기본 프로필 정보와 비밀번호를 관리합니다.</p>
      </div>

      <div className="profile-info">
        <div className="profile-field">
          <label>로그인 아이디</label>
          <span>{user?.email || user?.username}</span>
        </div>
        <div className="profile-field">
          <label>성</label>
          <span>{user?.last_name || '미설정'}</span>
        </div>
        <div className="profile-field">
          <label>이름</label>
          <span>{user?.first_name || '미설정'}</span>
        </div>
        <div className="profile-field">
          <label>역할</label>
          <span>{user?.role === 'admin' ? '관리자' : user?.role === 'user' ? '사용자' : user?.role || '알 수 없음'}</span>
        </div>
        {!isGuest && (
          <div className="profile-field">
            <label>가입일</label>
            <span>{user?.created_at ? formatUTCToKST(user.created_at) : '알 수 없음'}</span>
          </div>
        )}
        {isGuest && (
          <div className="profile-field">
            <label>로그인 일시</label>
            <span>{user?.created_at ? formatUTCToKST(user.created_at) : '알 수 없음'}</span>
          </div>
        )}
      </div>

      {message.text && (
        <div className={`auth-${message.type}`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      {!isGuest && (
        <div className="profile-actions">
          <button
            type="button"
            className="auth-button auth-button-secondary"
            onClick={() => setShowPasswordForm(!showPasswordForm)}
          >
            {showPasswordForm ? '비밀번호 변경 취소' : '🔒 비밀번호 변경'}
          </button>
        </div>
      )}

      {!isGuest && showPasswordForm && (
        <form onSubmit={handlePasswordSubmit} className="auth-form profile-password-form">
          <div className="form-group">
            <label htmlFor="currentPassword">현재 비밀번호</label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              required
              placeholder="현재 비밀번호를 입력하세요"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">새 비밀번호</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              required
              placeholder="새 비밀번호를 입력하세요 (8자 이상)"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">새 비밀번호 확인</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              required
              placeholder="새 비밀번호를 다시 입력하세요"
              disabled={loading}
            />
          </div>

          <div className="profile-actions">
            <button
              type="submit"
              className="auth-button auth-button-primary"
              disabled={loading}
            >
              {loading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </div>
        </form>
      )}
    </>
  );

  const toggleDetail = (channel, key, checked) => {
    setNotificationSettings({
      ...notificationSettings,
      settings: {
        ...notificationSettings.settings,
        [key]: {
          ...notificationSettings.settings?.[key],
          [channel]: checked
        }
      }
    });
  };

  const renderDetailOptions = (channel) => (
    <div className="notification-suboptions">
      {[
        { key: 'mention', label: '댓글 멘션 알림' },
        { key: 'assignment', label: '담당자 지정 알림' },
        { key: 'test_status_changed', label: '테스트 케이스 상태 변경' }
      ].map((item) => (
        <div key={`${channel}-${item.key}`} className="notification-suboption">
          <span>{item.label}</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={!!notificationSettings.settings?.[item.key]?.[channel]}
              onChange={(e) => toggleDetail(channel, item.key, e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      ))}
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="profile-notifications">
      <div className="profile-section-header">
        <h2>알림 / 이메일 수신 설정</h2>
        <p>알림 채널별 수신 여부와 Slack Webhook URL을 설정합니다.</p>
      </div>

      {notificationsMessage.text && (
        <div className={`auth-${notificationsMessage.type}`}>
          {notificationsMessage.type === 'success' ? '✅' : '❌'} {notificationsMessage.text}
        </div>
      )}

      <div className="profile-notification-form">
        <div className="notification-group">
          <div className="notification-row">
            <label>앱 내 알림</label>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notificationSettings.in_app_enabled}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    in_app_enabled: e.target.checked
                  })
                }
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          {notificationSettings.in_app_enabled && renderDetailOptions('in_app')}
        </div>

        <div className="notification-group">
          <div className="notification-row">
            <label>이메일 알림</label>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notificationSettings.email_enabled}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    email_enabled: e.target.checked
                  })
                }
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          {notificationSettings.email_enabled && renderDetailOptions('email')}
        </div>

        <div className="notification-group">
          <div className="notification-row">
            <label>Slack 알림</label>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notificationSettings.slack_enabled}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    slack_enabled: e.target.checked
                  })
                }
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          {notificationSettings.slack_enabled && (
            <>
              {renderDetailOptions('slack')}
              <div className="notification-field">
                <label>Slack Webhook URL</label>
                <input
                  type="text"
                  value={notificationSettings.slack_webhook_url}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      slack_webhook_url: e.target.value
                    })
                  }
                  placeholder="Slack Webhook URL을 입력하세요"
                />
              </div>
            </>
          )}
        </div>

        <div className="profile-actions">
          <button
            type="button"
            className="auth-button auth-button-primary"
            onClick={handleNotificationSave}
            disabled={notificationsLoading}
          >
            {notificationsLoading ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderLoginHistorySection = () => (
    <div className="profile-placeholder">
      <h2>로그인 기록</h2>
      <p>최근 로그인 이력, IP, 브라우저 정보 등을 확인하는 화면으로 확장할 수 있습니다.</p>
      <p>지금은 UI 레이아웃만 준비해 두었습니다.</p>
    </div>
  );

  const renderLoginFailSection = () => (
    <div className="profile-placeholder">
      <h2>로그인 실패 기록</h2>
      <p>보안 강화를 위해 실패한 로그인 시도 내역을 보여줄 수 있습니다.</p>
      <p>추후 보안 요구사항에 맞춰 구현 가능합니다.</p>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="profile-placeholder">
      <h2>보안 설정</h2>
      <p>2단계 인증, 세션 만료 시간, 접속 허용 IP 등 고급 보안 설정을 배치할 수 있는 영역입니다.</p>
    </div>
  );

  const renderLogoutSection = () => (
    <div className="profile-placeholder">
      <h2>로그아웃</h2>
      <p>현재 로그인된 계정에서 로그아웃합니다.</p>
      <div className="profile-actions">
        <button
          type="button"
          className="auth-button auth-button-danger"
          onClick={handleLogout}
        >
          🚪 로그아웃
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeMenu) {
      case 'account':
        return renderAccountSection();
      case 'notifications':
        return renderNotificationsSection();
      case 'login':
        return renderLoginHistorySection();
      case 'login-fail':
        return renderLoginFailSection();
      case 'security':
        return renderSecuritySection();
      case 'logout':
        return renderLogoutSection();
      default:
        return renderAccountSection();
    }
  };

  return (
    <div className="profile-page-container">
      <div className="profile-page-content">
        <div className="profile-main-card">
          {renderContent()}
        </div>

        <div className="profile-snb settings-snb">
          <nav className="snb-menu">
            <h3>회원 정보</h3>
            <ul>
              <li>
                <button
                  className={`snb-item ${activeMenu === 'account' ? 'active' : ''}`}
                  onClick={() => setActiveMenu('account')}
                >
                  계정 설정
                </button>
              </li>
              {!isGuest && (
                <li>
                  <button
                    className={`snb-item ${activeMenu === 'notifications' ? 'active' : ''}`}
                    onClick={() => setActiveMenu('notifications')}
                  >
                    알림 / 이메일 수신 설정
                  </button>
                </li>
              )}
              {!isGuest && (
                <li>
                  <button
                    className={`snb-item ${activeMenu === 'login' ? 'active' : ''}`}
                    onClick={() => setActiveMenu('login')}
                  >
                    로그인 기록
                  </button>
                </li>
              )}
              {!isGuest && (
                <li>
                  <button
                    className={`snb-item ${activeMenu === 'login-fail' ? 'active' : ''}`}
                    onClick={() => setActiveMenu('login-fail')}
                  >
                    로그인 실패 기록
                  </button>
                </li>
              )}
              {!isGuest && (
                <li>
                  <button
                    className={`snb-item ${activeMenu === 'security' ? 'active' : ''}`}
                    onClick={() => setActiveMenu('security')}
                  >
                    보안
                  </button>
                </li>
              )}
              <li>
                <button
                  className="snb-item"
                  onClick={handleLogout}
                >
                  로그아웃
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
