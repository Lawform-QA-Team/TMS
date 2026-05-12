import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@tms/contexts/AuthContext';
import config from '@tms/config';
import { formatUTCToKST } from '@tms/utils/dateUtils';
import '@tms/components/auth/Auth.css';
import '@tms/components/auth/UserProfile.css';

function parseBrowser(ua) {
  if (!ua) return '-';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera';
  if (ua.includes('Chrome/')) return 'Chrome';
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Safari';
  return ua.split(' ')[0] || ua;
}

function parseAccessType(ua) {
  if (!ua) return '-';
  if (/Mobile|Android|iPhone|iPad|iPod|Windows Phone|BlackBerry|IEMobile/i.test(ua)) {
    return 'WEB(MOBILE)';
  }
  return 'WEB(PC)';
}

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

  const [loginHistory, setLoginHistory] = useState([]);
  const [loginHistoryLoading, setLoginHistoryLoading] = useState(false);
  const [loginFailHistory, setLoginFailHistory] = useState([]);
  const [loginFailLoading, setLoginFailLoading] = useState(false);

  const [securitySettings, setSecuritySettings] = useState({
    session_timeout_minutes: 1440,
    allowed_ips: [],
    two_factor_enabled: false
  });
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityMessage, setSecurityMessage] = useState({ type: '', text: '' });
  const [twoFaSetup, setTwoFaSetup] = useState(null); // { secret, otp_uri }
  const [twoFaOtp, setTwoFaOtp] = useState('');
  const [ipInput, setIpInput] = useState('');
  const [showDisable2fa, setShowDisable2fa] = useState(false);
  const [disable2faPassword, setDisable2faPassword] = useState('');

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
    if (activeMenu === 'security' && !isGuest) {
      fetchSecuritySettings();
    }
    if (activeMenu === 'login' && !isGuest) {
      fetchLoginHistory();
    }
    if (activeMenu === 'login-fail' && !isGuest) {
      fetchLoginFailHistory();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const fetchLoginHistory = async () => {
    try {
      setLoginHistoryLoading(true);
      const response = await fetch(`${config.apiUrl}/users/login-history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLoginHistory(data);
      }
    } catch (err) {
      // silent
    } finally {
      setLoginHistoryLoading(false);
    }
  };

  const fetchLoginFailHistory = async () => {
    try {
      setLoginFailLoading(true);
      const response = await fetch(`${config.apiUrl}/users/login-fail-history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLoginFailHistory(data);
      }
    } catch (err) {
      // silent
    } finally {
      setLoginFailLoading(false);
    }
  };

  const fetchSecuritySettings = async () => {
    try {
      setSecurityLoading(true);
      const response = await fetch(`${config.apiUrl}/users/security-settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSecuritySettings({
          session_timeout_minutes: data.session_timeout_minutes ?? 1440,
          allowed_ips: data.allowed_ips ?? [],
          two_factor_enabled: data.two_factor_enabled ?? false
        });
      }
    } catch (err) {
      setSecurityMessage({ type: 'error', text: '보안 설정을 불러오지 못했습니다.' });
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleSecuritySave = async () => {
    try {
      setSecurityLoading(true);
      setSecurityMessage({ type: '', text: '' });
      const response = await fetch(`${config.apiUrl}/users/security-settings`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_timeout_minutes: securitySettings.session_timeout_minutes,
          allowed_ips: securitySettings.allowed_ips
        })
      });
      if (response.ok) {
        setSecurityMessage({ type: 'success', text: '보안 설정이 저장되었습니다.' });
      } else {
        setSecurityMessage({ type: 'error', text: '저장에 실패했습니다.' });
      }
    } catch (err) {
      setSecurityMessage({ type: 'error', text: '저장에 실패했습니다.' });
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleSetup2fa = async () => {
    try {
      setSecurityLoading(true);
      setSecurityMessage({ type: '', text: '' });
      const response = await fetch(`${config.apiUrl}/users/2fa/setup`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTwoFaSetup({ secret: data.secret, otp_uri: data.otp_uri });
        setTwoFaOtp('');
      } else {
        const err = await response.json();
        setSecurityMessage({ type: 'error', text: err.error || '2FA 설정을 시작하지 못했습니다.' });
      }
    } catch (err) {
      setSecurityMessage({ type: 'error', text: '2FA 설정을 시작하지 못했습니다.' });
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleVerify2fa = async () => {
    try {
      setSecurityLoading(true);
      setSecurityMessage({ type: '', text: '' });
      const response = await fetch(`${config.apiUrl}/users/2fa/verify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp_code: twoFaOtp })
      });
      if (response.ok) {
        setSecuritySettings(prev => ({ ...prev, two_factor_enabled: true }));
        setTwoFaSetup(null);
        setTwoFaOtp('');
        setSecurityMessage({ type: 'success', text: '2단계 인증이 활성화되었습니다.' });
      } else {
        const err = await response.json();
        setSecurityMessage({ type: 'error', text: err.error || 'OTP 코드가 올바르지 않습니다.' });
      }
    } catch (err) {
      setSecurityMessage({ type: 'error', text: 'OTP 검증에 실패했습니다.' });
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleDisable2fa = async () => {
    try {
      setSecurityLoading(true);
      setSecurityMessage({ type: '', text: '' });
      const response = await fetch(`${config.apiUrl}/users/2fa`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: disable2faPassword })
      });
      if (response.ok) {
        setSecuritySettings(prev => ({ ...prev, two_factor_enabled: false }));
        setShowDisable2fa(false);
        setDisable2faPassword('');
        setSecurityMessage({ type: 'success', text: '2단계 인증이 비활성화되었습니다.' });
      } else {
        const err = await response.json();
        setSecurityMessage({ type: 'error', text: err.error || '2FA 비활성화에 실패했습니다.' });
      }
    } catch (err) {
      setSecurityMessage({ type: 'error', text: '2FA 비활성화에 실패했습니다.' });
    } finally {
      setSecurityLoading(false);
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
    <div>
      <div className="profile-section-header">
        <h2>로그인 기록</h2>
      </div>
      {loginHistoryLoading ? (
        <p className="history-loading">불러오는 중...</p>
      ) : loginHistory.length === 0 ? (
        <p className="history-empty">로그인 기록이 없습니다.</p>
      ) : (
        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>접속 일시</th>
                <th>접속 유형</th>
                <th>접속 IP</th>
                <th>브라우저/웹</th>
                <th>기기 정보</th>
              </tr>
            </thead>
            <tbody>
              {loginHistory.map(row => {
                const ua = row.user_agent || '';
                const browser = parseBrowser(ua);
                const accessType = parseAccessType(ua);
                return (
                  <tr key={row.id}>
                    <td className="history-td-nowrap">{row.created_at ? formatUTCToKST(row.created_at) : '-'}</td>
                    <td>{accessType}</td>
                    <td className="history-td-nowrap">{row.ip_address || '-'}</td>
                    <td>{browser}</td>
                    <td className="history-td-ua" title={ua}>{ua || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderLoginFailSection = () => (
    <div>
      <div className="profile-section-header">
        <h2>로그인 실패 기록</h2>
      </div>
      {user?.role !== 'admin' ? (
        <p className="history-empty">관리자만 조회할 수 있습니다.</p>
      ) : loginFailLoading ? (
        <p className="history-loading">불러오는 중...</p>
      ) : loginFailHistory.length === 0 ? (
        <p className="history-empty">로그인 실패 기록이 없습니다.</p>
      ) : (
        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>접속 일시</th>
                <th>계정</th>
                <th>접속 유형</th>
                <th>접속 IP</th>
                <th>브라우저/웹</th>
                <th>기기 정보</th>
              </tr>
            </thead>
            <tbody>
              {loginFailHistory.map(row => {
                const ua = row.user_agent || '';
                const browser = parseBrowser(ua);
                const accessType = parseAccessType(ua);
                return (
                  <tr key={row.id}>
                    <td className="history-td-nowrap">{row.created_at ? formatUTCToKST(row.created_at) : '-'}</td>
                    <td>{row.username}</td>
                    <td>{accessType}</td>
                    <td className="history-td-nowrap">{row.ip_address || '-'}</td>
                    <td>{browser}</td>
                    <td className="history-td-ua" title={ua}>{ua || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const SESSION_TIMEOUT_OPTIONS = [
    { value: 30, label: '30분' },
    { value: 60, label: '1시간' },
    { value: 240, label: '4시간' },
    { value: 480, label: '8시간' },
    { value: 1440, label: '24시간 (기본값)' },
    { value: 10080, label: '7일' },
    { value: 43200, label: '30일' }
  ];

  const handleAddIp = () => {
    const trimmed = ipInput.trim();
    if (!trimmed) return;
    if (securitySettings.allowed_ips.includes(trimmed)) return;
    setSecuritySettings(prev => ({ ...prev, allowed_ips: [...prev.allowed_ips, trimmed] }));
    setIpInput('');
  };

  const handleRemoveIp = (ip) => {
    setSecuritySettings(prev => ({ ...prev, allowed_ips: prev.allowed_ips.filter(x => x !== ip) }));
  };

  const renderSecuritySection = () => (
    <div className="profile-security">
      <div className="profile-section-header">
        <h2>보안 설정</h2>
        <p>2단계 인증, 세션 만료 시간, 접속 허용 IP 등 고급 보안 설정을 관리합니다.</p>
      </div>

      {securityMessage.text && (
        <div className={`auth-${securityMessage.type}`}>
          {securityMessage.type === 'success' ? '✅' : '❌'} {securityMessage.text}
        </div>
      )}

      {/* 세션 만료 시간 */}
      <div className="security-group">
        <div className="security-group-title">세션 만료 시간</div>
        <div className="security-group-desc">로그인 후 자동으로 로그아웃되는 시간입니다.</div>
        <select
          className="security-select"
          value={securitySettings.session_timeout_minutes}
          onChange={(e) =>
            setSecuritySettings(prev => ({ ...prev, session_timeout_minutes: Number(e.target.value) }))
          }
          disabled={securityLoading}
        >
          {SESSION_TIMEOUT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* 접속 허용 IP */}
      <div className="security-group">
        <div className="security-group-title">접속 허용 IP</div>
        <div className="security-group-desc">
          지정한 IP 또는 CIDR 범위에서만 로그인을 허용합니다. 비워두면 제한 없음.
        </div>
        <div className="security-ip-input-row">
          <input
            type="text"
            className="security-ip-input"
            placeholder="예: 192.168.1.1 또는 10.0.0.0/8"
            value={ipInput}
            onChange={(e) => setIpInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddIp(); } }}
            disabled={securityLoading}
          />
          <button
            type="button"
            className="auth-button auth-button-secondary security-ip-add-btn"
            onClick={handleAddIp}
            disabled={securityLoading || !ipInput.trim()}
          >
            추가
          </button>
        </div>
        {securitySettings.allowed_ips.length > 0 && (
          <div className="security-ip-tags">
            {securitySettings.allowed_ips.map(ip => (
              <span key={ip} className="security-ip-tag">
                {ip}
                <button
                  type="button"
                  className="security-ip-tag-remove"
                  onClick={() => handleRemoveIp(ip)}
                  disabled={securityLoading}
                  aria-label={`${ip} 삭제`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 저장 버튼 */}
      <div className="profile-actions">
        <button
          type="button"
          className="auth-button auth-button-primary"
          onClick={handleSecuritySave}
          disabled={securityLoading}
        >
          {securityLoading ? '저장 중...' : '설정 저장'}
        </button>
      </div>

      {/* 2단계 인증 */}
      <div className="security-group security-2fa-group">
        <div className="security-group-title">2단계 인증 (2FA)</div>
        <div className="security-group-desc">
          Google Authenticator 등 OTP 앱을 사용한 2단계 인증을 설정합니다.
        </div>

        <div className="security-2fa-status">
          <span className={`security-2fa-badge ${securitySettings.two_factor_enabled ? 'enabled' : 'disabled'}`}>
            {securitySettings.two_factor_enabled ? '활성화됨' : '비활성화됨'}
          </span>
        </div>

        {/* 2FA 설정 플로우 */}
        {!securitySettings.two_factor_enabled && !twoFaSetup && (
          <button
            type="button"
            className="auth-button auth-button-secondary"
            onClick={handleSetup2fa}
            disabled={securityLoading}
          >
            2FA 설정 시작
          </button>
        )}

        {!securitySettings.two_factor_enabled && twoFaSetup && (
          <div className="security-2fa-setup">
            <p className="security-2fa-setup-desc">
              아래 QR 코드를 인증 앱으로 스캔하거나, 키를 직접 입력하세요.
            </p>
            <div className="security-qr-container">
              <QRCodeSVG value={twoFaSetup.otp_uri} size={180} />
            </div>
            <div className="security-2fa-secret">
              <span className="security-2fa-secret-label">수동 입력 키:</span>
              <code className="security-2fa-secret-value">{twoFaSetup.secret}</code>
            </div>
            <div className="security-otp-row">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                className="security-otp-input"
                placeholder="앱의 6자리 코드 입력"
                value={twoFaOtp}
                onChange={(e) => setTwoFaOtp(e.target.value.replace(/\D/g, ''))}
                disabled={securityLoading}
              />
              <button
                type="button"
                className="auth-button auth-button-primary"
                onClick={handleVerify2fa}
                disabled={securityLoading || twoFaOtp.length !== 6}
              >
                {securityLoading ? '확인 중...' : '인증 완료'}
              </button>
              <button
                type="button"
                className="auth-button auth-button-secondary"
                onClick={() => { setTwoFaSetup(null); setTwoFaOtp(''); }}
                disabled={securityLoading}
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 2FA 비활성화 */}
        {securitySettings.two_factor_enabled && !showDisable2fa && (
          <button
            type="button"
            className="auth-button auth-button-danger"
            onClick={() => setShowDisable2fa(true)}
            disabled={securityLoading}
          >
            2FA 비활성화
          </button>
        )}

        {securitySettings.two_factor_enabled && showDisable2fa && (
          <div className="security-disable-2fa">
            <p className="security-group-desc">비밀번호를 입력하면 2단계 인증이 해제됩니다.</p>
            <div className="security-otp-row">
              <input
                type="password"
                className="security-otp-input"
                placeholder="현재 비밀번호"
                value={disable2faPassword}
                onChange={(e) => setDisable2faPassword(e.target.value)}
                disabled={securityLoading}
              />
              <button
                type="button"
                className="auth-button auth-button-danger"
                onClick={handleDisable2fa}
                disabled={securityLoading || !disable2faPassword}
              >
                {securityLoading ? '처리 중...' : '비활성화'}
              </button>
              <button
                type="button"
                className="auth-button auth-button-secondary"
                onClick={() => { setShowDisable2fa(false); setDisable2faPassword(''); }}
                disabled={securityLoading}
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>
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
