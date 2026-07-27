import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@tms/config';
import { useAuth } from '@tms/contexts/AuthContext';

axios.defaults.baseURL = config.apiUrl;

const NEW_FOLDER_SENTINEL = '__new__';

const inputStyle = { width: '100%', padding: '8px 10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: 4 };
const labelStyle = { display: 'block', marginBottom: 4, fontWeight: 600 };

const GoogleSheetsImport = () => {
  const { token } = useAuth();
  const [mode, setMode] = useState('paste'); // 'paste' | 'url'
  const [url, setUrl] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [projects, setProjects] = useState([]);
  const [folders, setFolders] = useState([]);
  const [headerDiag, setHeaderDiag] = useState(null); // 헤더 진단 정보
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderEnv, setNewFolderEnv] = useState('dev');
  const [preview, setPreview] = useState(null);
  const [previewTotal, setPreviewTotal] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const headers = { Authorization: `Bearer ${token}` };
  const isNewFolder = selectedFolderId === NEW_FOLDER_SENTINEL;

  useEffect(() => {
    axios.get('/projects', { headers }).then(res => {
      setProjects(res.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      setFolders([]);
      setSelectedFolderId('');
      return;
    }
    axios.get('/folders', { headers }).then(res => {
      const allFolders = res.data?.data || res.data || [];
      const filtered = allFolders.filter(f => String(f.project_id) === String(selectedProjectId));
      setFolders(filtered);
      setSelectedFolderId('');
    }).catch(() => setFolders([]));
  }, [selectedProjectId]);

  const createNewFolder = async () => {
    if (!newFolderName.trim()) throw new Error('폴더 이름을 입력해 주세요.');
    const res = await axios.post('/folders', {
      folder_name: newFolderName.trim(),
      folder_type: 'environment',
      environment: newFolderEnv,
      project_id: selectedProjectId ? Number(selectedProjectId) : undefined,
    }, { headers });
    return res.data.id;
  };

  const refreshFolders = async () => {
    const res = await axios.get('/folders', { headers });
    const allFolders = res.data?.data || res.data || [];
    const filtered = allFolders.filter(f => String(f.project_id) === String(selectedProjectId));
    setFolders(filtered);
  };

  const doRequest = async (previewOnly) => {
    setError('');
    setResult(null);

    if (mode === 'paste' && !pasteText.trim()) {
      setError('구글 시트 데이터를 붙여넣어 주세요.');
      return;
    }
    if (mode === 'url' && !url.trim()) {
      setError('구글 시트 URL을 입력해 주세요.');
      return;
    }

    setLoading(true);
    try {
      let folderId = selectedFolderId && !isNewFolder ? Number(selectedFolderId) : null;

      if (!previewOnly && isNewFolder) {
        folderId = await createNewFolder();
        await refreshFolders();
        setSelectedFolderId(String(folderId));
      }

      const body = {
        project_id: selectedProjectId ? Number(selectedProjectId) : null,
        folder_id: folderId,
        preview_only: previewOnly,
        ...(mode === 'paste' ? { raw_text: pasteText } : { url: url.trim() }),
      };

      const res = await axios.post('/testcases/import-sheets', body, { headers });
      if (previewOnly) {
        setPreview(res.data.preview || []);
        setPreviewTotal(res.data.total || 0);
        setHeaderDiag({
          raw: res.data.raw_headers || [],
          matched: res.data.matched_headers || [],
          unmatched: res.data.unmatched_headers || [],
          raw_sample: res.data.raw_sample || {},
        });
      } else {
        setResult(res.data);
        setPreview(null);
        setHeaderDiag(null);
      }
    } catch (e) {
      setError(e.response?.data?.error || e.message || '가져오기 실패');
    } finally {
      setLoading(false);
    }
  };

  const PREVIEW_COLS = ['tc_number', 'main_category', 'sub_category', 'expected_result', 'result_status'];

  const tabBtn = (label, value) => (
    <button
      onClick={() => { setMode(value); setPreview(null); setResult(null); setError(''); }}
      style={{
        padding: '7px 18px',
        border: '1px solid #ccc',
        borderBottom: mode === value ? '2px solid #007bff' : '1px solid #ccc',
        background: mode === value ? '#fff' : '#f8f9fa',
        color: mode === value ? '#007bff' : '#555',
        fontWeight: mode === value ? 700 : 400,
        cursor: 'pointer',
        borderRadius: '4px 4px 0 0',
        marginRight: 4,
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ maxWidth: 720 }}>
      <h2>데이터 가져오기</h2>

      {/* 모드 탭 */}
      <div style={{ marginBottom: 0, borderBottom: '1px solid #ccc' }}>
        {tabBtn('붙여넣기로 가져오기', 'paste')}
        {tabBtn('구글 시트 URL (공개 공유)', 'url')}
      </div>

      <div style={{ border: '1px solid #ccc', borderTop: 'none', padding: '20px 16px', marginBottom: 16, borderRadius: '0 4px 4px 4px' }}>
        {mode === 'paste' ? (
          <div>
            <p style={{ color: '#555', fontSize: '0.9em', marginTop: 0 }}>
              구글 시트에서 헤더 행 포함 전체 데이터를 선택 후 <strong>Ctrl+C</strong> → 아래 칸에 <strong>Ctrl+V</strong>로 붙여넣으세요.<br />
              첫 행은 반드시 헤더(TC No. / 카테고리 / 테스트 항목 / ...)여야 합니다.
            </p>
            <label style={labelStyle}>붙여넣기 *</label>
            <textarea
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              placeholder={'TC No.\t카테고리\t테스트 항목\t테스트 과정\t사전조건\t기대결과\tLevel\tresult\t비고\nTC-001\t로그인\t이메일 로그인\t...'}
              rows={10}
              style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.85em', resize: 'vertical' }}
            />
          </div>
        ) : (
          <div>
            <p style={{ color: '#555', fontSize: '0.9em', marginTop: 0 }}>
              시트를 <strong>링크가 있는 사용자 누구나 볼 수 있음</strong>으로 공유한 뒤 URL을 입력하세요.
            </p>
            <label style={labelStyle}>구글 시트 URL *</label>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              style={inputStyle}
            />
          </div>
        )}
      </div>

      {/* 프로젝트 / 폴더 선택 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: isNewFolder ? 8 : 16 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>프로젝트</label>
          <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} style={inputStyle}>
            <option value="">-- 기본 프로젝트 --</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>폴더</label>
          <select
            value={selectedFolderId}
            onChange={e => setSelectedFolderId(e.target.value)}
            style={inputStyle}
            disabled={!selectedProjectId}
          >
            <option value="">-- 기본 폴더 --</option>
            {folders.map(f => <option key={f.id} value={f.id}>{f.folder_name}</option>)}
            {selectedProjectId && <option value={NEW_FOLDER_SENTINEL}>+ 새 폴더 만들기...</option>}
          </select>
        </div>
      </div>

      {isNewFolder && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, background: '#f8f9fa', padding: '12px 14px', borderRadius: 6, border: '1px solid #dee2e6' }}>
          <div style={{ flex: 2 }}>
            <label style={{ ...labelStyle, fontSize: '0.9em' }}>새 폴더 이름 *</label>
            <input
              type="text"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              placeholder="폴더 이름"
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ ...labelStyle, fontSize: '0.9em' }}>환경</label>
            <select value={newFolderEnv} onChange={e => setNewFolderEnv(e.target.value)} style={inputStyle}>
              <option value="dev">dev</option>
              <option value="staging">staging</option>
              <option value="prod">prod</option>
            </select>
          </div>
        </div>
      )}

      {/* 액션 버튼 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button onClick={() => doRequest(true)} disabled={loading}
          style={{ padding: '8px 18px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          {loading ? '로딩...' : '미리보기'}
        </button>
        <button onClick={() => doRequest(false)} disabled={loading}
          style={{ padding: '8px 18px', background: '#007bff', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          {loading ? '가져오는 중...' : isNewFolder ? '폴더 생성 후 가져오기' : '가져오기'}
        </button>
      </div>

      {error && (
        <div style={{ color: '#dc3545', background: '#fdecea', padding: '10px 14px', borderRadius: 4, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ background: '#d4edda', color: '#155724', padding: '12px 16px', borderRadius: 4, marginBottom: 16 }}>
          <strong>완료!</strong> 생성: {result.created}건
        </div>
      )}

      {headerDiag && (
        <div style={{ marginBottom: 16, padding: '12px 14px', border: '1px solid #dee2e6', borderRadius: 4, fontSize: '0.85em' }}>
          <strong>헤더 인식 결과</strong>
          <div style={{ marginTop: 6 }}>
            <span style={{ color: '#28a745' }}>✓ 매핑됨: </span>
            {headerDiag.matched.length > 0
              ? headerDiag.matched.map(h => <code key={h} style={{ marginRight: 6, background: '#e8f5e9', padding: '1px 4px', borderRadius: 3 }}>{h}</code>)
              : <span style={{ color: '#999' }}>(없음)</span>}
          </div>
          {headerDiag.unmatched.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <span style={{ color: '#dc3545' }}>✗ 미매핑: </span>
              {headerDiag.unmatched.map(h => <code key={h} style={{ marginRight: 6, background: '#fdecea', padding: '1px 4px', borderRadius: 3 }}>{h}</code>)}
            </div>
          )}
          {headerDiag.matched.length === 0 && (
            <div style={{ marginTop: 8, color: '#856404', background: '#fff3cd', padding: '8px 10px', borderRadius: 4 }}>
              인식된 헤더: {headerDiag.raw.map(h => `"${h}"`).join(', ')}<br />
              예상 헤더: "TC No.", "카테고리", "테스트 항목", "테스트 과정", "사전조건", "기대결과", "Level", "result", "비고"
            </div>
          )}
        </div>
      )}

      {preview && (
        <div>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>미리보기 (전체 {previewTotal}행 중 최대 5행)</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85em' }}>
              <thead>
                <tr>
                  {PREVIEW_COLS.map(col => (
                    <th key={col} style={{ border: '1px solid #dee2e6', padding: '6px 8px', background: '#f8f9fa', textAlign: 'left' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i}>
                    {PREVIEW_COLS.map(col => (
                      <td key={col} style={{ border: '1px solid #dee2e6', padding: '6px 8px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row[col] || ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleSheetsImport;
