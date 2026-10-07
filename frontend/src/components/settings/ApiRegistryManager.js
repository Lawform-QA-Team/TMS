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

// api.md 마크다운 테이블 파싱
const parseMarkdown = (text, defaultProjectKey) => {
  const lines = text.split('\n');
  const results = [];
  let section = '';
  let subsection = '';

  for (const line of lines) {
    let m = line.match(/^## \d+\. (\w+)/);
    if (m) { section = m[1].toLowerCase(); subsection = ''; continue; }

    m = line.match(/^### [\d.]+\s+(.+)/);
    if (m) { subsection = m[1].trim().toLowerCase().replace(/\s+/g, '_'); continue; }

    m = line.match(/^\|\s*(GET|POST|PUT|DELETE|PATCH)\s*\|\s*(\/[^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/);
    if (m) {
      const auth = m[3].trim();
      const tags = [section, subsection].filter(Boolean);
      results.push({
        method: m[1].trim(),
        path: m[2].trim(),
        description: m[4].trim(),
        tags,
        authRequired: !(auth === '-' || auth.toLowerCase().startsWith('optional')),
        projectKey: defaultProjectKey,
      });
    }
  }
  return results;
};

const parseJson = (text, defaultProjectKey) => {
  const arr = JSON.parse(text);
  if (!Array.isArray(arr)) throw new Error('JSON 배열이어야 합니다.');
  return arr.map((item) => ({
    method: item.method,
    path: item.path,
    description: item.description || '',
    tags: Array.isArray(item.tags) ? item.tags : [],
    authRequired: item.authRequired !== false,
    projectKey: item.projectKey || defaultProjectKey,
  }));
};

const ApiRegistryManager = () => {
  const { token, user } = useAuth();
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filterProject, setFilterProject] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [searchText, setSearchText] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkProjectKey, setBulkProjectKey] = useState('LAWFORM');
  const [bulkPreview, setBulkPreview] = useState(null);
  const [bulkError, setBulkError] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

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

  const handleBulkParse = () => {
    setBulkError('');
    setBulkPreview(null);
    try {
      const trimmed = bulkText.trim();
      let parsed;
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        parsed = parseJson(trimmed, bulkProjectKey);
      } else {
        parsed = parseMarkdown(trimmed, bulkProjectKey);
      }
      if (parsed.length === 0) {
        setBulkError('파싱된 항목이 없습니다. 형식을 확인해주세요.');
        return;
      }
      setBulkPreview(parsed);
    } catch (e) {
      setBulkError('파싱 오류: ' + e.message);
    }
  };

  const handleBulkSubmit = async () => {
    if (!bulkPreview || bulkPreview.length === 0) return;
    setBulkLoading(true);
    try {
      const res = await axios.post('/api-endpoints/bulk', { items: bulkPreview });
      alert(`${res.data.count}개 등록 완료!`);
      setShowBulkModal(false);
      setBulkText('');
      setBulkPreview(null);
      fetchEndpoints();
    } catch (err) {
      alert('등록 오류: ' + (err.response?.data?.error || err.message));
    } finally {
      setBulkLoading(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  const filteredEndpoints = endpoints.filter((ep) => {
    if (filterMethod && ep.method !== filterMethod) return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      if (!ep.path.toLowerCase().includes(q) && !(ep.description || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="account-container">
      <div className="account-header">
        <h2>API Registry</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="검색 (path, 설명)"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4, width: 180 }}
          />
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4 }}
          >
            <option value="">전체 Method</option>
            {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <input
            type="text"
            placeholder="프로젝트 키 필터"
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4 }}
          />
          {isAdmin && (
            <>
              <button className="btn btn-add" onClick={openAdd}>+ 추가</button>
              <button className="btn btn-secondary" onClick={() => { setShowBulkModal(true); setBulkText(''); setBulkPreview(null); setBulkError(''); }}>
                대량 등록
              </button>
            </>
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
                  {filteredEndpoints.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', color: '#9ca3af' }}>
                        {endpoints.length === 0 ? '등록된 API가 없습니다.' : '검색 결과가 없습니다.'}
                      </td>
                    </tr>
                  ) : (
                    filteredEndpoints.map((ep) => (
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

      {showBulkModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: 720, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3>API 대량 등록</h3>
            </div>
            <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
              <div className="form-group">
                <label>기본 프로젝트 키 *</label>
                <input
                  type="text"
                  value={bulkProjectKey}
                  onChange={(e) => setBulkProjectKey(e.target.value)}
                  placeholder="LAWFORM"
                />
              </div>
              <div className="form-group">
                <label>
                  내용 붙여넣기
                  <span style={{ marginLeft: 8, fontSize: 12, color: '#6b7280', fontWeight: 400 }}>
                    api.md 마크다운 표 또는 JSON 배열 지원
                  </span>
                </label>
                <textarea
                  value={bulkText}
                  onChange={(e) => { setBulkText(e.target.value); setBulkPreview(null); setBulkError(''); }}
                  rows={10}
                  style={{ width: '100%', fontFamily: 'monospace', fontSize: 12, padding: 8, border: '1px solid #d1d5db', borderRadius: 4, resize: 'vertical' }}
                  placeholder={'마크다운:\n| GET | /api/v1/tickets | requireAuth | 티켓 목록 |\n\nJSON:\n[{"method":"GET","path":"/api/v1/tickets","description":"티켓 목록","tags":["ticket"],"authRequired":true}]'}
                />
              </div>
              {bulkError && (
                <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 8 }}>{bulkError}</div>
              )}
              {bulkPreview && (
                <div>
                  <div style={{ fontSize: 13, color: '#059669', marginBottom: 6, fontWeight: 600 }}>
                    파싱 결과: {bulkPreview.length}개
                  </div>
                  <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 4 }}>
                    <table className="users-table" style={{ fontSize: 12 }}>
                      <thead>
                        <tr>
                          <th>Method</th>
                          <th>Path</th>
                          <th>설명</th>
                          <th>Tags</th>
                          <th>인증</th>
                          <th>프로젝트</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkPreview.map((item, i) => (
                          <tr key={i}>
                            <td><span style={{ background: item.method === 'GET' ? '#d1fae5' : item.method === 'POST' ? '#dbeafe' : item.method === 'DELETE' ? '#fee2e2' : '#fef3c7', padding: '1px 5px', borderRadius: 3, fontWeight: 600, fontSize: 11 }}>{item.method}</span></td>
                            <td style={{ fontFamily: 'monospace' }}>{item.path}</td>
                            <td>{item.description || '-'}</td>
                            <td>{item.tags.join(', ') || '-'}</td>
                            <td>{item.authRequired ? '예' : '아니오'}</td>
                            <td>{item.projectKey}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <div className="modal-actions">
                {!bulkPreview ? (
                  <button className="btn btn-primary" onClick={handleBulkParse} disabled={!bulkText.trim()}>
                    파싱 미리보기
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={handleBulkSubmit} disabled={bulkLoading}>
                    {bulkLoading ? '등록 중...' : `${bulkPreview.length}개 등록`}
                  </button>
                )}
                {bulkPreview && (
                  <button className="btn btn-secondary" onClick={() => setBulkPreview(null)}>다시 수정</button>
                )}
                <button className="btn btn-secondary" onClick={() => setShowBulkModal(false)}>취소</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
