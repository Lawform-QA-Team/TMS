import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import config from '@tms/config';
import { useAuth } from '@tms/contexts/AuthContext';

axios.defaults.baseURL = config.apiUrl;

const CATEGORIES = ['navigation', 'form', 'assertion', 'data', 'auth', 'etc'];

const emptyForm = {
  name: '',
  description: '',
  category: 'form',
  code: '// 액션 코드를 작성하세요\nexport async function actionName(page, params = {}) {\n  \n}\n',
  parameters: '[]',
  selectorIds: '[]',
  projectKey: '',
};

const ActionRegistryManager = () => {
  const { token, user } = useAuth();
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filterProject, setFilterProject] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [paramError, setParamError] = useState('');

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  useEffect(() => {
    fetchActions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterProject, filterCategory]);

  const fetchActions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterProject) params.projectKey = filterProject;
      if (filterCategory) params.category = filterCategory;
      const res = await axios.get('/action-registry', { params });
      setActions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      alert('목록 조회 오류: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setParamError('');
    setShowModal(true);
  };

  const openEdit = (action) => {
    setEditTarget(action);
    setForm({
      name: action.name,
      description: action.description || '',
      category: action.category,
      code: action.code,
      parameters: JSON.stringify(action.parameters || [], null, 2),
      selectorIds: JSON.stringify(action.selectorIds || [], null, 2),
      projectKey: action.projectKey,
    });
    setParamError('');
    setShowModal(true);
  };

  const openView = (action) => {
    setViewTarget(action);
    setShowViewModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.category || !form.code || !form.projectKey) {
      alert('name, category, code, projectKey는 필수입니다.');
      return;
    }

    let parsedParams, parsedSelectors;
    try {
      parsedParams = JSON.parse(form.parameters || '[]');
    } catch {
      setParamError('parameters가 올바른 JSON 배열이 아닙니다.');
      return;
    }
    try {
      parsedSelectors = JSON.parse(form.selectorIds || '[]');
    } catch {
      setParamError('selectorIds가 올바른 JSON 배열이 아닙니다.');
      return;
    }

    setParamError('');
    const payload = {
      name: form.name,
      description: form.description || null,
      category: form.category,
      code: form.code,
      parameters: parsedParams,
      selectorIds: parsedSelectors,
      projectKey: form.projectKey,
    };

    try {
      if (editTarget) {
        await axios.put(`/action-registry/${editTarget.id}`, payload);
      } else {
        await axios.post('/action-registry', payload);
      }
      setShowModal(false);
      fetchActions();
    } catch (err) {
      alert('저장 오류: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    try {
      await axios.delete(`/action-registry/${id}`);
      fetchActions();
    } catch (err) {
      alert('삭제 오류: ' + (err.response?.data?.error || err.message));
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="account-container">
      <div className="account-header">
        <h2>Action Registry</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="프로젝트 키 필터"
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4 }}
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4 }}
          >
            <option value="">전체 카테고리</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
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
                    <th>카테고리</th>
                    <th>이름</th>
                    <th>설명</th>
                    <th>파라미터</th>
                    <th>Selector 참조</th>
                    <th>프로젝트</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {actions.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: '#9ca3af' }}>
                        등록된 액션이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    actions.map((action) => (
                      <tr key={action.id}>
                        <td>
                          <span style={{
                            background: '#ede9fe', color: '#7c3aed',
                            padding: '2px 6px', borderRadius: 4, fontSize: 12, fontWeight: 600
                          }}>
                            {action.category}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500 }}>{action.name}</td>
                        <td style={{ color: '#6b7280', fontSize: 13 }}>{action.description || '-'}</td>
                        <td style={{ fontSize: 12, color: '#374151' }}>
                          {Array.isArray(action.parameters) && action.parameters.length > 0
                            ? action.parameters.map((p) => p.name || p).join(', ')
                            : <span style={{ color: '#d1d5db' }}>없음</span>
                          }
                        </td>
                        <td style={{ fontSize: 12 }}>
                          {Array.isArray(action.selectorIds) && action.selectorIds.length > 0
                            ? <span style={{ color: '#2563eb' }}>{action.selectorIds.length}개</span>
                            : <span style={{ color: '#d1d5db' }}>없음</span>
                          }
                        </td>
                        <td>{action.projectKey}</td>
                        <td className="col-actions">
                          <button type="button" className="btn-text btn-edit" onClick={() => openView(action)}>
                            코드 보기
                          </button>
                          {isAdmin && (
                            <>
                              <button type="button" className="btn-text btn-edit" onClick={() => openEdit(action)}>수정</button>
                              <button type="button" className="btn-text btn-delete" onClick={() => handleDelete(action.id)}>삭제</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* 코드 보기 모달 */}
      {showViewModal && viewTarget && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal modal-wide" style={{ maxWidth: 800, width: '90vw' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{viewTarget.name} — 코드 보기</h3>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              <Editor
                height="400px"
                defaultLanguage="javascript"
                value={viewTarget.code}
                options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13 }}
                theme="vs-dark"
              />
            </div>
            <div className="modal-footer">
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>닫기</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 추가/수정 모달 */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal modal-wide" style={{ maxWidth: 900, width: '92vw' }}>
            <div className="modal-header">
              <h3>{editTarget ? '액션 수정' : '액션 추가'}</h3>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="form-group">
                  <label>이름 *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="예: clickLoginButton"
                  />
                </div>
                <div className="form-group">
                  <label>카테고리 *</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
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
                  <label>설명</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="이 액션이 하는 일"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>코드 * (JavaScript)</label>
                <div style={{ border: '1px solid #d1d5db', borderRadius: 4, overflow: 'hidden' }}>
                  <Editor
                    height="280px"
                    defaultLanguage="javascript"
                    value={form.code}
                    onChange={(val) => setForm({ ...form, code: val || '' })}
                    options={{ minimap: { enabled: false }, fontSize: 13, tabSize: 2 }}
                    theme="vs-dark"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Parameters (JSON 배열)</label>
                  <textarea
                    value={form.parameters}
                    onChange={(e) => setForm({ ...form, parameters: e.target.value })}
                    rows={4}
                    style={{ fontFamily: 'monospace', fontSize: 12, resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
                    placeholder='[{"name": "selector", "type": "string"}]'
                  />
                </div>
                <div className="form-group">
                  <label>Selector IDs (JSON 배열, selector-registry id)</label>
                  <textarea
                    value={form.selectorIds}
                    onChange={(e) => setForm({ ...form, selectorIds: e.target.value })}
                    rows={4}
                    style={{ fontFamily: 'monospace', fontSize: 12, resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
                    placeholder='[1, 2, 3]'
                  />
                </div>
              </div>
              {paramError && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 4 }}>{paramError}</div>}
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

export default ActionRegistryManager;
