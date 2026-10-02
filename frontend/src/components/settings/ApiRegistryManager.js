import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@tms/config';
import { useAuth } from '@tms/contexts/AuthContext';

axios.defaults.baseURL = config.apiUrl;

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const emptyForm = {
  method: 'GET',
  path: '',
  description: '',
  tags: '',
  authRequired: true,
  projectKey: '',
};

const ApiRegistryManager = () => {
  const { token, user } = useAuth();
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filterProject, setFilterProject] = useState('');

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  useEffect(() => {
    fetchEndpoints();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterProject]);

  const fetchEndpoints = async () => {
    try {
      setLoading(true);
      const params = filterProject ? { projectKey: filterProject } : {};
      const res = await axios.get('/api-endpoints', { params });
      setEndpoints(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      alert('목록 조회 오류: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (ep) => {
    setEditTarget(ep);
    setForm({
      method: ep.method,
      path: ep.path,
      description: ep.description || '',
      tags: Array.isArray(ep.tags) ? ep.tags.join(', ') : '',
      authRequired: ep.authRequired,
      projectKey: ep.projectKey,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.method || !form.path || !form.projectKey) {
      alert('method, path, projectKey는 필수입니다.');
      return;
    }
    const payload = {
      ...form,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    };
    try {
      if (editTarget) {
        await axios.put(`/api-endpoints/${editTarget.id}`, payload);
      } else {
        await axios.post('/api-endpoints', payload);
      }
      setShowModal(false);
      fetchEndpoints();
    } catch (err) {
      alert('저장 오류: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    try {
      await axios.delete(`/api-endpoints/${id}`);
      fetchEndpoints();
    } catch (err) {
      alert('삭제 오류: ' + (err.response?.data?.error || err.message));
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="account-container">
      <div className="account-header">
        <h2>API Registry</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="프로젝트 키 필터"
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4 }}
          />
          {isAdmin && (
            <button className="btn btn-add" onClick={openAdd}>
              + 추가
            </button>
          )}
        </div>
      </div>

      <div className="account-content">
        <div className="account-section account-section-table">
          <div className="users-table-wrapper">
            {loading ? (
              <div className="account-loading">로딩 중...</div>
            ) : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Path</th>
                    <th>설명</th>
                    <th>Tags</th>
                    <th>인증필요</th>
                    <th>프로젝트</th>
                    {isAdmin && <th>관리</th>}
                  </tr>
                </thead>
                <tbody>
                  {endpoints.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', color: '#9ca3af' }}>
                        등록된 API가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    endpoints.map((ep) => (
                      <tr key={ep.id}>
                        <td>
                          <span style={{
                            background: ep.method === 'GET' ? '#d1fae5' : ep.method === 'POST' ? '#dbeafe' : ep.method === 'DELETE' ? '#fee2e2' : '#fef3c7',
                            color: ep.method === 'GET' ? '#065f46' : ep.method === 'POST' ? '#1e40af' : ep.method === 'DELETE' ? '#991b1b' : '#92400e',
                            padding: '2px 6px', borderRadius: 4, fontWeight: 600, fontSize: 12,
                          }}>
                            {ep.method}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{ep.path}</td>
                        <td>{ep.description || '-'}</td>
                        <td>{Array.isArray(ep.tags) && ep.tags.length > 0 ? ep.tags.join(', ') : '-'}</td>
                        <td>{ep.authRequired ? '예' : '아니오'}</td>
                        <td>{ep.projectKey}</td>
                        {isAdmin && (
                          <td className="col-actions">
                            <button type="button" className="btn-text btn-edit" onClick={() => openEdit(ep)}>수정</button>
                            <button type="button" className="btn-text btn-delete" onClick={() => handleDelete(ep.id)}>삭제</button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editTarget ? 'API 수정' : 'API 추가'}</h3>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Method *</label>
                <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                  {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Path * (예: /api/v1/tickets/:id)</label>
                <input
                  type="text"
                  value={form.path}
                  onChange={(e) => setForm({ ...form, path: e.target.value })}
                  placeholder="/api/v1/..."
                />
              </div>
              <div className="form-group">
                <label>설명</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Tags (쉼표 구분)</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="ticket, user, auth"
                />
              </div>
              <div className="form-group">
                <label>프로젝트 키 *</label>
                <input
                  type="text"
                  value={form.projectKey}
                  onChange={(e) => setForm({ ...form, projectKey: e.target.value })}
                  placeholder="TMS"
                />
              </div>
              <div className="form-group">
                <label>인증 필요</label>
                <select value={form.authRequired} onChange={(e) => setForm({ ...form, authRequired: e.target.value === 'true' })}>
                  <option value="true">예</option>
                  <option value="false">아니오</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={handleSave}>저장</button>
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiRegistryManager;
