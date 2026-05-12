import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@tms/config';
import { useAuth } from '@tms/contexts/AuthContext';

const JiraConfigPanel = ({ onConfigured }) => {
  const { token } = useAuth();
  const [configState, setConfigState] = useState({
    is_configured: false,
    url: '',
    email: '',
    has_token: false,
  });
  const [form, setForm] = useState({ url: '', email: '', token: '' });
  const [showPanel, setShowPanel] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }

  const authHeader = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await axios.get(`${config.apiUrl}/api/jira/config`, { headers: authHeader });
      if (res.data.success) {
        const data = res.data.data;
        setConfigState(data);
        setForm((prev) => ({ ...prev, url: data.url, email: data.email }));
      }
    } catch {
      // 설정 조회 실패는 조용히 처리
    }
  };

  const handleTest = async () => {
    setMessage(null);
    if (!form.url || !form.email || !form.token) {
      setMessage({ type: 'error', text: 'URL, 이메일, API 토큰을 모두 입력하세요.' });
      return;
    }
    setTesting(true);
    try {
      const res = await axios.post(
        `${config.apiUrl}/api/jira/config/test`,
        { url: form.url, email: form.email, token: form.token },
        { headers: authHeader }
      );
      if (res.data.success) {
        setMessage({ type: 'success', text: res.data.message });
      } else {
        setMessage({ type: 'error', text: res.data.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || '연결 테스트 실패' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setMessage(null);
    if (!form.url || !form.email || !form.token) {
      setMessage({ type: 'error', text: 'URL, 이메일, API 토큰을 모두 입력하세요.' });
      return;
    }
    setSaving(true);
    try {
      const res = await axios.post(
        `${config.apiUrl}/api/jira/config`,
        { url: form.url, email: form.email, token: form.token },
        { headers: authHeader }
      );
      if (res.data.success) {
        setMessage({ type: 'success', text: res.data.message });
        await fetchConfig();
        setShowPanel(false);
        if (onConfigured) onConfigured();
      } else {
        setMessage({ type: 'error', text: res.data.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || '저장 실패' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="jira-config-panel">
      <div className="jira-config-status">
        <span className={`jira-config-badge ${configState.is_configured ? 'connected' : 'disconnected'}`}>
          {configState.is_configured ? '● Jira 연동됨' : '○ Jira 미연동'}
        </span>
        <button
          type="button"
          className="btn-jira-config-toggle"
          onClick={() => { setShowPanel((v) => !v); setMessage(null); }}
        >
          {showPanel ? '닫기' : 'Jira 연동 설정'}
        </button>
      </div>

      {showPanel && (
        <div className="jira-config-form">
          <h4>Jira Cloud 연동 설정</h4>
          <p className="jira-config-desc">
            Atlassian 계정의 이메일과 API 토큰을 입력하세요.
            API 토큰은 <strong>id.atlassian.com → 보안 → API 토큰</strong>에서 발급받을 수 있습니다.
          </p>

          <div className="jira-config-fields">
            <div className="jira-config-field">
              <label>Jira Cloud URL</label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://your-domain.atlassian.net"
              />
            </div>
            <div className="jira-config-field">
              <label>이메일</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="your@email.com"
              />
            </div>
            <div className="jira-config-field">
              <label>API 토큰</label>
              <input
                type="password"
                value={form.token}
                onChange={(e) => setForm({ ...form, token: e.target.value })}
                placeholder={configState.has_token ? '저장된 토큰 있음 (변경 시 입력)' : 'Atlassian API 토큰'}
              />
            </div>
          </div>

          {message && (
            <div className={`jira-config-message ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="jira-config-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleTest}
              disabled={testing || saving}
            >
              {testing ? '테스트 중...' : '연결 테스트'}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={testing || saving}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JiraConfigPanel;
