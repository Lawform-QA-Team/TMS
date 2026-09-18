import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@tms/config';
import { useAuth } from '@tms/contexts/AuthContext';

axios.defaults.baseURL = config.apiUrl;

const CATEGORIES = ['e2e', 'smoke', 'regression', 'unit', 'etc'];

const emptyForm = {
  name: '',
  description: '',
  category: 'e2e',
  projectKey: '',
  steps: [],
};

const emptyStep = { order: 1, actionId: '', params: {} };

const ScenarioRegistryManager = () => {
  const { token, user } = useAuth();
  const [scenarios, setScenarios] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filterProject, setFilterProject] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [stepParamErrors, setStepParamErrors] = useState({});

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  useEffect(() => {
    fetchScenarios();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterProject, filterCategory]);

  // 모달 열릴 때 액션 목록 로드
  useEffect(() => {
    if (showModal) {
      fetchActions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, form.projectKey]);

  const fetchScenarios = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterProject) params.projectKey = filterProject;
      if (filterCategory) params.category = filterCategory;
      const res = await axios.get('/scenario-registry', { params });
      setScenarios(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      alert('목록 조회 오류: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchActions = async () => {
    try {
      const params = {};
      if (form.projectKey) params.projectKey = form.projectKey;
      const res = await axios.get('/action-registry', { params });
      setActions(Array.isArray(res.data) ? res.data : []);
    } catch {
      // 조용히 실패
    }
  };

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setStepParamErrors({});
    setShowModal(true);
  };

  const openEdit = (scenario) => {
    setEditTarget(scenario);
    setForm({
      name: scenario.name,
      description: scenario.description || '',
      category: scenario.category,
      projectKey: scenario.projectKey,
      steps: Array.isArray(scenario.steps) ? scenario.steps : [],
    });
    setStepParamErrors({});
    setShowModal(true);
  };

  const openView = (scenario) => {
    setViewTarget(scenario);
    setShowViewModal(true);
  };

  const addStep = () => {
    const nextOrder = form.steps.length + 1;
    setForm({ ...form, steps: [...form.steps, { order: nextOrder, actionId: '', params: {} }] });
  };

  const removeStep = (idx) => {
    const newSteps = form.steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 }));
    setForm({ ...form, steps: newSteps });
  };

  const moveStep = (idx, direction) => {
    const steps = [...form.steps];
    const target = idx + direction;
    if (target < 0 || target >= steps.length) return;
    [steps[idx], steps[target]] = [steps[target], steps[idx]];
    const reordered = steps.map((s, i) => ({ ...s, order: i + 1 }));
    setForm({ ...form, steps: reordered });
  };

  const updateStep = (idx, field, value) => {
    const steps = [...form.steps];
    steps[idx] = { ...steps[idx], [field]: value };
    setForm({ ...form, steps });
  };

  const updateStepParams = (idx, jsonStr) => {
    const errors = { ...stepParamErrors };
    try {
      const parsed = JSON.parse(jsonStr);
      errors[idx] = '';
      const steps = [...form.steps];
      steps[idx] = { ...steps[idx], params: parsed };
      setForm({ ...form, steps });
    } catch {
      errors[idx] = 'JSON 형식 오류';
    }
    setStepParamErrors(errors);
  };

  const handleSave = async () => {
    if (!form.name || !form.category || !form.projectKey) {
      alert('name, category, projectKey는 필수입니다.');
      return;
    }
    if (Object.values(stepParamErrors).some((e) => e)) {
      alert('단계 파라미터에 JSON 오류가 있습니다. 수정 후 저장해주세요.');
      return;
    }
    if (form.steps.some((s) => !s.actionId)) {
      alert('모든 단계에 액션을 선택해주세요.');
      return;
    }

    const payload = {
      name: form.name,
      description: form.description || null,
      category: form.category,
      projectKey: form.projectKey,
      steps: form.steps,
    };

    try {
      if (editTarget) {
        await axios.put(`/scenario-registry/${editTarget.id}`, payload);
      } else {
        await axios.post('/scenario-registry', payload);
      }
      setShowModal(false);
      fetchScenarios();
    } catch (err) {
      alert('저장 오류: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    try {
      await axios.delete(`/scenario-registry/${id}`);
      fetchScenarios();
    } catch (err) {
      alert('삭제 오류: ' + (err.response?.data?.error || err.message));
    }
  };

  const getActionName = (actionId) => {
    const action = actions.find((a) => String(a.id) === String(actionId));
    return action ? action.name : String(actionId);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="account-container">
      <div className="account-header">
        <h2>Scenario Registry</h2>
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
                    <th>단계 수</th>
                    <th>프로젝트</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {scenarios.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: '#9ca3af' }}>
                        등록된 시나리오가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    scenarios.map((scenario) => (
                      <tr key={scenario.id}>
                        <td>
                          <span style={{
                            background: '#d1fae5', color: '#065f46',
                            padding: '2px 6px', borderRadius: 4, fontSize: 12, fontWeight: 600
                          }}>
                            {scenario.category}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500 }}>{scenario.name}</td>
                        <td style={{ color: '#6b7280', fontSize: 13 }}>{scenario.description || '-'}</td>
                        <td>
                          <span style={{ color: '#2563eb', fontWeight: 500 }}>
                            {Array.isArray(scenario.steps) ? scenario.steps.length : 0}단계
                          </span>
                        </td>
                        <td>{scenario.projectKey}</td>
                        <td className="col-actions">
                          <button type="button" className="btn-text btn-edit" onClick={() => openView(scenario)}>
                            단계 보기
                          </button>
                          {isAdmin && (
                            <>
                              <button type="button" className="btn-text btn-edit" onClick={() => openEdit(scenario)}>수정</button>
                              <button type="button" className="btn-text btn-delete" onClick={() => handleDelete(scenario.id)}>삭제</button>
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

      {/* 단계 보기 모달 */}
      {showViewModal && viewTarget && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal modal-wide" style={{ maxWidth: 700 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{viewTarget.name} — 실행 단계</h3>
            </div>
            <div className="modal-body">
              {Array.isArray(viewTarget.steps) && viewTarget.steps.length > 0 ? (
                <ol style={{ paddingLeft: 20, margin: 0 }}>
                  {viewTarget.steps.map((step, i) => (
                    <li key={i} style={{ marginBottom: 12 }}>
                      <div style={{ fontWeight: 500, color: '#374151' }}>
                        {step.actionId ? getActionName(step.actionId) : `액션 #${step.actionId}`}
                      </div>
                      {step.params && Object.keys(step.params).length > 0 && (
                        <pre style={{
                          background: '#f3f4f6', padding: '6px 10px', borderRadius: 4,
                          fontSize: 12, margin: '4px 0 0', overflow: 'auto'
                        }}>
                          {JSON.stringify(step.params, null, 2)}
                        </pre>
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <p style={{ color: '#9ca3af' }}>등록된 단계가 없습니다.</p>
              )}
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
          <div className="modal modal-wide" style={{ maxWidth: 800, width: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>{editTarget ? '시나리오 수정' : '시나리오 추가'}</h3>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="form-group">
                  <label>이름 *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="예: 로그인 후 티켓 생성 플로우"
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
                    placeholder="이 시나리오의 목적"
                  />
                </div>
              </div>

              {/* 단계 빌더 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontWeight: 500 }}>실행 단계</label>
                  <button type="button" className="btn btn-add" style={{ padding: '4px 12px', fontSize: 13 }} onClick={addStep}>
                    + 단계 추가
                  </button>
                </div>

                {form.steps.length === 0 && (
                  <p style={{ color: '#9ca3af', textAlign: 'center', padding: 16, border: '1px dashed #e5e7eb', borderRadius: 4 }}>
                    단계를 추가해주세요.
                  </p>
                )}

                {form.steps.map((step, idx) => (
                  <div key={idx} style={{
                    border: '1px solid #e5e7eb', borderRadius: 6, padding: 12,
                    marginBottom: 8, background: '#f9fafb'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontWeight: 500, color: '#374151', fontSize: 13 }}>단계 {step.order}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button type="button" onClick={() => moveStep(idx, -1)} disabled={idx === 0}
                          style={{ padding: '2px 8px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 3, cursor: idx === 0 ? 'not-allowed' : 'pointer', background: '#fff' }}>
                          ↑
                        </button>
                        <button type="button" onClick={() => moveStep(idx, 1)} disabled={idx === form.steps.length - 1}
                          style={{ padding: '2px 8px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 3, cursor: idx === form.steps.length - 1 ? 'not-allowed' : 'pointer', background: '#fff' }}>
                          ↓
                        </button>
                        <button type="button" onClick={() => removeStep(idx)}
                          style={{ padding: '2px 8px', fontSize: 12, border: '1px solid #fca5a5', borderRadius: 3, color: '#dc2626', background: '#fff', cursor: 'pointer' }}>
                          삭제
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: 12 }}>액션 *</label>
                        <select
                          value={step.actionId}
                          onChange={(e) => updateStep(idx, 'actionId', e.target.value)}
                          style={{ width: '100%' }}
                        >
                          <option value="">-- 액션 선택 --</option>
                          {actions.map((a) => (
                            <option key={a.id} value={a.id}>{a.name} ({a.category})</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: 12 }}>Params (JSON)</label>
                        <input
                          type="text"
                          defaultValue={JSON.stringify(step.params || {})}
                          onBlur={(e) => updateStepParams(idx, e.target.value)}
                          style={{ fontFamily: 'monospace', fontSize: 12 }}
                          placeholder='{}'
                        />
                        {stepParamErrors[idx] && (
                          <span style={{ color: '#dc2626', fontSize: 11 }}>{stepParamErrors[idx]}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
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

export default ScenarioRegistryManager;
