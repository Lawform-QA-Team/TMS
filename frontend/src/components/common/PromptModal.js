import React, { useState, useEffect, useMemo } from 'react';
import { getUserDisplayName } from '@tms/utils/userDisplay';
import '@tms/components/common/Modal.css';

const PromptModal = ({
  isOpen,
  onClose,
  title,
  message,
  defaultValue = '',
  onConfirm,
  placeholder = '',
  mentionEnabled = false,
  mentionUsers = []
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue);
      setShowMentions(false);
      setMentionQuery('');
      setActiveMentionIndex(0);
    }
  }, [isOpen, defaultValue]);

  const updateMentions = (value) => {
    if (!mentionEnabled) {
      setShowMentions(false);
      setMentionQuery('');
      setActiveMentionIndex(0);
      return;
    }

    const atIndex = value.lastIndexOf('@');
    if (atIndex === -1) {
      setShowMentions(false);
      setMentionQuery('');
      setActiveMentionIndex(0);
      return;
    }

    const beforeAt = value[atIndex - 1];
    if (atIndex > 0 && beforeAt && !/\s/.test(beforeAt)) {
      setShowMentions(false);
      setMentionQuery('');
      setActiveMentionIndex(0);
      return;
    }

    const afterAt = value.slice(atIndex + 1);
    if (/\s/.test(afterAt)) {
      setShowMentions(false);
      setMentionQuery('');
      setActiveMentionIndex(0);
      return;
    }

    setMentionQuery(afterAt);
    setShowMentions(true);
    setActiveMentionIndex(0);
  };

  const handleChange = (value) => {
    setInputValue(value);
    updateMentions(value);
  };

  const filteredUsers = useMemo(() => {
    if (!mentionEnabled) return [];
    const query = (mentionQuery || '').toLowerCase();
    const list = mentionUsers || [];
    if (!query) return list.slice(0, 8);
    return list
      .filter((u) => {
        const username = (u.username || '').toLowerCase();
        const display = (getUserDisplayName(u) || '').toLowerCase();
        return username.includes(query) || display.includes(query);
      })
      .slice(0, 8);
  }, [mentionEnabled, mentionUsers, mentionQuery]);

  const handleMentionSelect = (selectedUser) => {
    if (!selectedUser?.username) return;

    const atIndex = inputValue.lastIndexOf('@');
    if (atIndex === -1) return;

    const afterAt = inputValue.slice(atIndex + 1);
    const nextSpaceIndex = afterAt.search(/\s/);
    const remaining = nextSpaceIndex === -1 ? '' : afterAt.slice(nextSpaceIndex);
    const before = inputValue.slice(0, atIndex);
    const spacer = remaining && !remaining.startsWith(' ') ? ' ' : '';
    const newValue = `${before}@${selectedUser.username}${spacer}${remaining || ' '}`;

    setInputValue(newValue);
    setShowMentions(false);
    setMentionQuery('');
    setActiveMentionIndex(0);
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(inputValue);
    }
    onClose();
  };

  const handleCancel = () => {
    if (onConfirm) {
      onConfirm(null);
    }
    onClose();
  };

  const handleKeyPress = (e) => {
    if (mentionEnabled && showMentions && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveMentionIndex((prev) => (prev + 1) % filteredUsers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveMentionIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        handleMentionSelect(filteredUsers[activeMentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
        return;
      }
    }

    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="common-modal-overlay" onClick={handleCancel}>
      <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title || '입력'}</h3>
          <button className="modal-close" onClick={handleCancel}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {message && <p style={{ marginBottom: '16px' }}>{message}</p>}
          <input
            type="text"
            className="form-control"
            value={inputValue}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            autoFocus
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e9ecef',
              borderRadius: '8px',
              fontSize: '14px',
              marginBottom: '16px'
            }}
          />
          {mentionEnabled && showMentions && filteredUsers.length > 0 && (
            <div
              className="mention-list"
              style={{
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                maxHeight: '200px',
                overflowY: 'auto',
                marginBottom: '16px'
              }}
            >
              {filteredUsers.map((u, index) => (
                <button
                  key={u.id}
                  type="button"
                  className="mention-item"
                  onClick={() => handleMentionSelect(u)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '8px 12px',
                    border: 'none',
                    background: index === activeMentionIndex ? '#f1f3f5' : 'white',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ marginRight: '8px' }}>👤</span>
                  <span>{getUserDisplayName(u)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button
            className="btn btn-secondary"
            onClick={handleCancel}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              backgroundColor: '#6c757d',
              color: 'white'
            }}
          >
            취소
          </button>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              backgroundColor: '#007bff',
              color: 'white'
            }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptModal;

