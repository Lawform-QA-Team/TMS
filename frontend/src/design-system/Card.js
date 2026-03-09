import React from 'react';

/**
 * 디자인 시스템 카드. header, body, footer 슬롯 지원.
 */
function Card({ header, children, footer, className = '' }) {
  return (
    <div className={`tms-card ${className}`.trim()}>
      {header && <div className="tms-card__header">{header}</div>}
      <div className="tms-card__body">{children}</div>
      {footer && <div className="tms-card__footer">{footer}</div>}
    </div>
  );
}

export default Card;
