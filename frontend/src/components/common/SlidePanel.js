import React, { useEffect } from 'react';
import './SlidePanel.css';

const SlidePanel = ({ isOpen, onClose, title, children, width = 560 }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      <div
        className={`slide-panel-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />
      <div
        className={`slide-panel ${isOpen ? 'open' : ''}`}
        style={{ width }}
      >
        <div className="slide-panel-header">
          <h3 className="slide-panel-title">{title}</h3>
          <button className="slide-panel-close" onClick={onClose} aria-label="닫기">×</button>
        </div>
        <div className="slide-panel-body">
          {children}
        </div>
      </div>
    </>
  );
};

export default SlidePanel;
