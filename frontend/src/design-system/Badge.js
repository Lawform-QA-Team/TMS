import React from 'react';

const VARIANT_MAP = {
  primary: 'tms-badge--primary',
  accent: 'tms-badge--accent',
  success: 'tms-badge--success',
  error: 'tms-badge--error',
  warning: 'tms-badge--warning',
  neutral: 'tms-badge--neutral',
};

/**
 * 디자인 시스템 배지. variant: primary | accent | success | error | warning | neutral
 */
function Badge({ children, variant = 'neutral', className = '' }) {
  const classes = ['tms-badge', VARIANT_MAP[variant] || VARIANT_MAP.neutral, className]
    .filter(Boolean)
    .join(' ');
  return <span className={classes}>{children}</span>;
}

export default Badge;
