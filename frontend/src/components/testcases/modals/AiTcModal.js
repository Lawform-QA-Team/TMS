import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import './AiTcModal.css';

// ── TC 체크박스 목록 컴포넌트 ──────────────────────────────────
const TcCheckList = ({ items, selected, onToggle }) => {
  const [expanded, setExpanded] = useState(new Set());

  const toggleExpand = (idx) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  if (!items || items.length === 0) return null;

  return (
    <ul className="ai-tc-generated-list">
      {items.map((tc, idx) => (
        <li key={idx} className="ai-tc-item">
          <div
            className="ai-tc-item-header"
            onClick={() => toggleExpand(idx)}
          >
            <input
              type="checkbox"
              checked={selected.has(idx)}
              onChange={(e) => { e.stopPropagation(); onToggle(idx); }}
              onClick={(e) => e.stopPropagation()}
            />
            <span className="ai-tc-item-name">{tc.name}</span>
            <span className="ai-tc-item-toggle">{expanded.has(idx) ? '▲' : '▼'}</span>
          </div>
          {expanded.has(idx) && (
            <div className="ai-tc-item-detail">
              {tc.main_category && (
                <div className="ai-tc-item-detail-row">
                  <strong>대분류</strong><span>{tc.main_category}</span>
                </div>
              )}
              {tc.sub_category && (
                <div className="ai-tc-item-detail-row">
                  <strong>중분류</strong><span>{tc.sub_category}</span>
                </div>
              )}
              {tc.detail_category && (
                <div className="ai-tc-item-detail-row">
                  <strong>소분류</strong><span>{tc.detail_category}</span>
                </div>
              )}
              {tc.pre_condition && (
                <div className="ai-tc-item-detail-row">
                  <strong>사전조건</strong><span>{tc.pre_condition}</span>
                </div>
              )}
              {tc.expected_result && (
                <div className="ai-tc-item-detail-row">
                  <strong>기대결과</strong><span>{tc.expected_result}</span>
                </div>
              )}
              {tc.remark && (
                <div className="ai-tc-item-detail-row">
                  <strong>비고</strong><span>{tc.remark}</span>
                </div>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};

// ── 메인 모달 ────────────────────────────────────────────────
const AiTcModal = ({ isOpen, onClose, onSaveTc, onSendToForm, selectedFolderId }) => {
  // 탭
  const [activeTab, setActiveTab] = useState('quick');

  // 빠른 생성
  const [quickPrompt, setQuickPrompt] = useState('');
  const [quickCount, setQuickCount] = useState(5);
  const [quickGenerating, setQuickGenerating] = useState(false);
  const [quickItems, setQuickItems] = useState([]);
  const [quickSelected, setQuickSelected] = useState(new Set());

  // 대화형
  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [convLoading, setConvLoading] = useState(false);

  // 스펙 추출
  const [specText, setSpecText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractItems, setExtractItems] = useState([]);
  const [extractSelected, setExtractSelected] = useState(new Set());

  const chatEndRef = useRef(null);

  // 대화 목록 조회
  const fetchConversations = useCallback(async () => {
    try {
      const res = await axios.get('/testcases/ai/conversations');
      setConversations(res.data);
    } catch (err) {
      console.error('대화 목록 조회 실패', err);
    }
  }, []);

  useEffect(() => {
    if (isOpen && activeTab === 'conversation') {
      fetchConversations();
    }
  }, [isOpen, activeTab, fetchConversations]);

  // 대화 선택 시 메시지 로드
  const loadConversation = async (convId) => {
    setConvLoading(true);
    try {
      const res = await axios.get(`/testcases/ai/conversations/${convId}`);
      setMessages(res.data.messages || []);
      setSelectedConvId(convId);
    } catch (err) {
      console.error('대화 로드 실패', err);
    } finally {
      setConvLoading(false);
    }
  };

  // 새 대화 생성
  const createConversation = async () => {
    const title = prompt('대화 이름을 입력하세요', '새 대화');
    if (!title) return;
    try {
      const res = await axios.post('/testcases/ai/conversations', {
        title,
        folder_id: selectedFolderId || null,
      });
      const newConv = res.data;
      setConversations(prev => [newConv, ...prev]);
      setSelectedConvId(newConv.id);
      setMessages([]);
    } catch (err) {
      console.error('대화 생성 실패', err);
    }
  };

  // 대화 삭제
  const deleteConversation = async (convId, e) => {
    e.stopPropagation();
    if (!window.confirm('대화를 삭제하시겠습니까?')) return;
    try {
      await axios.delete(`/testcases/ai/conversations/${convId}`);
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (selectedConvId === convId) {
        setSelectedConvId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('대화 삭제 실패', err);
    }
  };

  // 채팅 메시지 전송
  const sendMessage = async () => {
    if (!chatInput.trim() || !selectedConvId || chatSending) return;
    const content = chatInput.trim();
    setChatInput('');
    setChatSending(true);
    try {
      const res = await axios.post(
        `/testcases/ai/conversations/${selectedConvId}/messages`,
        { content }
      );
      const { user_message, assistant_message } = res.data;
      setMessages(prev => [...prev, user_message, assistant_message]);
    } catch (err) {
      console.error('메시지 전송 실패', err);
      setChatInput(content);
    } finally {
      setChatSending(false);
    }
  };

  // 채팅 스크롤
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 빠른 생성
  const handleQuickGenerate = async () => {
    if (!quickPrompt.trim() || quickGenerating) return;
    setQuickGenerating(true);
    setQuickItems([]);
    setQuickSelected(new Set());
    try {
      const res = await axios.post('/testcases/ai/generate', {
        prompt: quickPrompt,
        count: quickCount,
      });
      setQuickItems(res.data.items || []);
    } catch (err) {
      console.error('빠른 생성 실패', err);
      alert(err?.response?.data?.error || 'AI 생성 오류');
    } finally {
      setQuickGenerating(false);
    }
  };

  // 스펙 추출
  const handleExtract = async () => {
    if (!specText.trim() || extracting) return;
    setExtracting(true);
    setExtractItems([]);
    setExtractSelected(new Set());
    try {
      const res = await axios.post('/testcases/ai/extract', { spec_text: specText });
      setExtractItems(res.data.items || []);
    } catch (err) {
      console.error('스펙 추출 실패', err);
      alert(err?.response?.data?.error || '스펙 추출 오류');
    } finally {
      setExtracting(false);
    }
  };

  // 선택 토글
  const toggleQuick = (idx) => {
    setQuickSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleExtract = (idx) => {
    setExtractSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // 전체 선택/해제
  const selectAll = (items, setSelected) => {
    setSelected(new Set(items.map((_, i) => i)));
  };

  const deselectAll = (setSelected) => {
    setSelected(new Set());
  };

  // 저장
  const handleSave = (items, selected) => {
    const toSave = items.filter((_, i) => selected.has(i));
    if (toSave.length === 0) {
      alert('저장할 TC를 선택하세요.');
      return;
    }
    onSaveTc(toSave);
    onClose();
  };

  // 폼으로 전달 (첫 번째 선택 항목)
  const handleSendToForm = (items, selected) => {
    const first = items.find((_, i) => selected.has(i));
    if (!first) {
      alert('폼으로 전달할 TC를 선택하세요.');
      return;
    }
    onSendToForm(first);
  };

  // 채팅 메시지 내 TC 저장
  const handleSaveFromChat = (testCases) => {
    if (!testCases || testCases.length === 0) return;
    onSaveTc(testCases);
  };

  if (!isOpen) return null;

  return (
    <div className="ai-tc-modal-overlay" onClick={onClose}>
      <div className="ai-tc-modal" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="ai-tc-modal-header">
          <h2>AI TC 에이전트</h2>
          <button className="ai-tc-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* 탭 */}
        <div className="ai-tc-tabs">
          <button
            className={`ai-tc-tab ${activeTab === 'quick' ? 'active' : ''}`}
            onClick={() => setActiveTab('quick')}
          >
            빠른 생성
          </button>
          <button
            className={`ai-tc-tab ${activeTab === 'conversation' ? 'active' : ''}`}
            onClick={() => setActiveTab('conversation')}
          >
            대화형 생성
          </button>
          <button
            className={`ai-tc-tab ${activeTab === 'extract' ? 'active' : ''}`}
            onClick={() => setActiveTab('extract')}
          >
            스펙 추출
          </button>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="ai-tc-tab-content">

          {/* ── 빠른 생성 ── */}
          {activeTab === 'quick' && (
            <div className="ai-tc-quick">
              <div className="ai-tc-quick-controls">
                <textarea
                  rows={3}
                  value={quickPrompt}
                  onChange={(e) => setQuickPrompt(e.target.value)}
                  placeholder="테스트할 기능/시나리오를 입력하세요. 예) 회원가입 폼 유효성 검사"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) handleQuickGenerate();
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <select
                    className="ai-tc-count-select"
                    value={quickCount}
                    onChange={(e) => setQuickCount(Number(e.target.value))}
                  >
                    {[3, 5, 10, 15, 20].map(n => (
                      <option key={n} value={n}>{n}개</option>
                    ))}
                  </select>
                  <button
                    className="ai-tc-btn ai-tc-btn-primary"
                    onClick={handleQuickGenerate}
                    disabled={quickGenerating || !quickPrompt.trim()}
                  >
                    {quickGenerating ? '생성 중...' : '생성'}
                  </button>
                </div>
              </div>

              {quickItems.length > 0 && (
                <div className="ai-tc-list-area">
                  <div className="ai-tc-list-actions">
                    <span>{quickItems.length}개 생성됨 ({quickSelected.size}개 선택)</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="ai-tc-btn ai-tc-btn-secondary ai-tc-btn-sm"
                        onClick={() => selectAll(quickItems, setQuickSelected)}
                      >
                        전체 선택
                      </button>
                      <button
                        className="ai-tc-btn ai-tc-btn-secondary ai-tc-btn-sm"
                        onClick={() => deselectAll(setQuickSelected)}
                      >
                        전체 해제
                      </button>
                    </div>
                  </div>
                  <TcCheckList
                    items={quickItems}
                    selected={quickSelected}
                    onToggle={toggleQuick}
                  />
                </div>
              )}

              {quickGenerating && (
                <div className="ai-tc-loading">TC 생성 중...</div>
              )}
            </div>
          )}

          {/* ── 대화형 생성 ── */}
          {activeTab === 'conversation' && (
            <div className="ai-tc-conversation-layout">
              {/* 사이드바 */}
              <div className="ai-tc-conv-sidebar">
                <div className="ai-tc-conv-sidebar-header">
                  <button
                    className="ai-tc-btn ai-tc-btn-primary"
                    style={{ width: '100%' }}
                    onClick={createConversation}
                  >
                    + 새 대화
                  </button>
                </div>
                <ul className="ai-tc-conv-list">
                  {conversations.map(conv => (
                    <li
                      key={conv.id}
                      className={`ai-tc-conv-item ${selectedConvId === conv.id ? 'active' : ''}`}
                      onClick={() => loadConversation(conv.id)}
                    >
                      <span className="ai-tc-conv-item-name">{conv.title}</span>
                      <button
                        className="ai-tc-conv-delete-btn"
                        onClick={(e) => deleteConversation(conv.id, e)}
                        title="삭제"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                  {conversations.length === 0 && (
                    <li style={{ padding: '12px', color: '#9ca3af', fontSize: 13 }}>
                      대화가 없습니다
                    </li>
                  )}
                </ul>
              </div>

              {/* 채팅 영역 */}
              <div className="ai-tc-chat-area">
                {!selectedConvId ? (
                  <div className="ai-tc-no-conv">
                    <span>왼쪽에서 대화를 선택하거나 새로 만드세요</span>
                  </div>
                ) : convLoading ? (
                  <div className="ai-tc-loading">로딩 중...</div>
                ) : (
                  <>
                    <div className="ai-tc-chat-messages">
                      {messages.length === 0 && (
                        <div className="ai-tc-chat-empty">
                          TC 생성 요청을 입력하세요
                        </div>
                      )}
                      {messages.map((msg, idx) => {
                        const tcList = msg.role === 'assistant'
                          ? parseTcFromContent(msg.content)
                          : [];
                        return (
                          <div
                            key={msg.id || idx}
                            className={`ai-tc-message ai-tc-message-${msg.role}`}
                          >
                            <div className="ai-tc-message-bubble">{msg.content}</div>
                            {tcList.length > 0 && (
                              <div className="ai-tc-message-tc-actions">
                                <button
                                  className="ai-tc-btn ai-tc-btn-primary ai-tc-btn-sm"
                                  onClick={() => handleSaveFromChat(tcList)}
                                >
                                  TC {tcList.length}개 저장
                                </button>
                                <button
                                  className="ai-tc-btn ai-tc-btn-secondary ai-tc-btn-sm"
                                  onClick={() => onSendToForm(tcList[0])}
                                >
                                  폼으로 전달
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </div>
                    <div className="ai-tc-chat-input">
                      <textarea
                        rows={2}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="메시지를 입력하세요 (Ctrl+Enter로 전송)"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey) sendMessage();
                        }}
                        disabled={chatSending}
                      />
                      <button
                        className="ai-tc-btn ai-tc-btn-primary"
                        onClick={sendMessage}
                        disabled={chatSending || !chatInput.trim()}
                      >
                        {chatSending ? '전송 중...' : '전송'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── 스펙 추출 ── */}
          {activeTab === 'extract' && (
            <div className="ai-tc-extract">
              <textarea
                rows={8}
                value={specText}
                onChange={(e) => setSpecText(e.target.value)}
                placeholder="스펙 문서 또는 요구사항 텍스트를 붙여넣으세요..."
              />
              <button
                className="ai-tc-btn ai-tc-btn-primary"
                style={{ alignSelf: 'flex-start' }}
                onClick={handleExtract}
                disabled={extracting || !specText.trim()}
              >
                {extracting ? '추출 중...' : 'TC 추출'}
              </button>

              {extractItems.length > 0 && (
                <div className="ai-tc-list-area" style={{ flex: 1 }}>
                  <div className="ai-tc-list-actions">
                    <span>{extractItems.length}개 추출됨 ({extractSelected.size}개 선택)</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="ai-tc-btn ai-tc-btn-secondary ai-tc-btn-sm"
                        onClick={() => selectAll(extractItems, setExtractSelected)}
                      >
                        전체 선택
                      </button>
                      <button
                        className="ai-tc-btn ai-tc-btn-secondary ai-tc-btn-sm"
                        onClick={() => deselectAll(setExtractSelected)}
                      >
                        전체 해제
                      </button>
                    </div>
                  </div>
                  <TcCheckList
                    items={extractItems}
                    selected={extractSelected}
                    onToggle={toggleExtract}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* 하단 액션바 */}
        <div className="ai-tc-modal-footer">
          {activeTab === 'quick' && quickItems.length > 0 && (
            <>
              <button
                className="ai-tc-btn ai-tc-btn-secondary"
                onClick={() => handleSendToForm(quickItems, quickSelected)}
                disabled={quickSelected.size === 0}
              >
                폼으로 전달
              </button>
              <button
                className="ai-tc-btn ai-tc-btn-primary"
                onClick={() => handleSave(quickItems, quickSelected)}
                disabled={quickSelected.size === 0}
              >
                선택 저장 ({quickSelected.size}개)
              </button>
            </>
          )}
          {activeTab === 'extract' && extractItems.length > 0 && (
            <>
              <button
                className="ai-tc-btn ai-tc-btn-secondary"
                onClick={() => handleSendToForm(extractItems, extractSelected)}
                disabled={extractSelected.size === 0}
              >
                폼으로 전달
              </button>
              <button
                className="ai-tc-btn ai-tc-btn-primary"
                onClick={() => handleSave(extractItems, extractSelected)}
                disabled={extractSelected.size === 0}
              >
                선택 저장 ({extractSelected.size}개)
              </button>
            </>
          )}
          <button className="ai-tc-btn ai-tc-btn-secondary" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

// assistant 메시지에서 TC 파싱 (프론트엔드용)
function parseTcFromContent(content) {
  const match = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[1]);
    const raw = parsed.test_cases || (Array.isArray(parsed) ? parsed : null);
    if (!Array.isArray(raw)) return [];
    return raw.filter(item => typeof item === 'object' && item !== null).map((item, idx) => ({
      name: item.name || `AI 테스트 케이스 ${idx + 1}`,
      main_category: item.main_category || '',
      sub_category: item.sub_category || '',
      detail_category: item.detail_category || '',
      pre_condition: item.pre_condition || '',
      expected_result: item.expected_result || '',
      remark: item.remark || '',
    }));
  } catch {
    return [];
  }
}

export default AiTcModal;
