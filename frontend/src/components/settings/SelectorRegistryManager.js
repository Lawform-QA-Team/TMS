import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@tms/config';
import { useAuth } from '@tms/contexts/AuthContext';

axios.defaults.baseURL = config.apiUrl;

const ELEMENT_TYPES = ['button', 'input', 'link', 'text', 'select', 'checkbox', 'radio', 'image', 'container', 'etc'];

const emptyForm = {
  pageName: '',
  elementName: '',
  dataTid: '',
  elementType: 'button',
  description: '',
  projectKey: '',
};

const SelectorRegistryManager = () => {
  const { token, user } = useAuth();
  const [selectors, setSelectors] = useState([]);
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
    fetchSelectors();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterProject]);

  const fetchSelectors = async () => {
    try {
      setLoading(true);
      const params = filterProject ? { projectKey: filterProject } : {};
      const res = await axios.get('/selector-registry', { params });
      setSelectors(Array.isArray(res.data) ? res.data : []);
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

  const openEdit = (sel) => {
    setEditTarget(sel);
    setForm({
      pageName: sel.pageName,
      elementName: sel.elementName,
      dataTid: sel.dataTid,
      elementType: sel.elementType,
      description: sel.description || '',
      projectKey: sel.projectKey,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.pageName || !form.elementName || !form.dataTid || !form.elementType || !form.projectKey) {
      alert('pageName, elementName, dataTid, elementType, projectKey는 필수입니다.');
      return;
    }
    try {
      if (editTarget) {
        await axios.put(`/selector-registry/${editTarget.id}`, form);
      } else {
        await axios.post('/selector-registry', form);
      }
      setShowModal(false);
      fetchSelectors();
    } catch (err) {
      alert('저장 오류: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    try {
      await axios.delete(`/selector-registry/${id}`);
      fetchSelectors();
    } catch (err) {
      alert('삭제 오류: ' + (err.response?.data?.error || err.message));
    }
  };

  // dataTid 입력 시 selector 미리보기
  const selectorPreview = form.dataTid ? `[data-tid="${form.dataTid}"]` : '';

  const isAdmin = user?.role === 'admin';

  return (
    <div className="account-container">
      <div className="account-header">
        <h2>Selector Registry</h2>
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
                    <th>페이지</th>
                    <th>요소명</th>
                    <th>data-tid</th>
                    <th>Selector</th>
                    <th>타입</th>
                    <th>프로젝트</th>
                    {isAdmin && <th>관리</th>}
                  </tr>
                </thead>
                <tbody>
                  {selectors.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', color: '#9ca3af' }}>
                        등록된 selector가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    selectors.map((sel) => (
                      <tr key={sel.id}>
                        <td>{sel.pageName}</td>
                        <td>{sel.elementName}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#7c3aed' }}>{sel.dataTid}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{sel.selector}</td>
                        <td>{sel.elementType}</td>
                        <td>{sel.projectKey}</td>
                        {isAdmin && (
                          <td className="col-actions">
                            <button type="button" className="btn-text btn-edit" onClick={() => openEdit(sel)}>수정</button>
                            <button type="button" className="btn-text btn-delete" onClick={() => handleDelete(sel.id)}>삭제</button>
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
              <h3>{editTarget ? 'Selector 수정' : 'Selector 추가'}</h3>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>페이지명 * (예: 로그인, 티켓목록)</label>
                <input
                  type="text"
                  value={form.pageName}
                  onChange={(e) => setForm({ ...form, pageName: e.target.value })}
                  placeholder="로그인"
                />
              </div>
              <div className="form-group">
                <label>요소명 * (예: 로그인 버튼)</label>
                <input
                  type="text"
                  value={form.elementName}
                  onChange={(e) => setForm({ ...form, elementName: e.target.value })}
                  placeholder="로그인 버튼"
                />
              </div>
              <div className="form-group">
                <label>data-tid * (예: login-btn)</label>
                <input
                  type="text"
                  value={form.dataTid}
                  onChange={(e) => setForm({ ...form, dataTid: e.target.value })}
                  placeholder="login-btn"
                />
                {selectorPreview && (
                  <small style={{ color: '#6b7280', fontFamily: 'monospace' }}>
                    자동 생성: {selectorPreview}
                  </small>
                )}
              </div>
              <div className="form-group">
                <label>요소 타입 *</label>
                <select value={form.elementType} onChange={(e) => setForm({ ...form, elementType: e.target.value })}>
                  {ELEMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
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
                <label>프로젝트 키 *</label>
                <input
                  type="text"
                  value={form.projectKey}
                  onChange={(e) => setForm({ ...form, projectKey: e.target.value })}
                  placeholder="TMS"
                />
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

export default SelectorRegistryManager;
