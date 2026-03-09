import React from 'react';

const VARIANT_MAP = {
  primary: 'tms-btn--primary',
  secondary: 'tms-btn--secondary',
  accent: 'tms-btn--accent',
  success: 'tms-btn--success',
  danger: 'tms-btn--danger',
  warning: 'tms-btn--warning',
  info: 'tms-btn--info',
  ghost: 'tms-btn--ghost',
};

const SIZE_MAP = {
  sm: 'tms-btn--sm',
  md: '',
  lg: 'tms-btn--lg',
};

/**
 * 디자인 시스템 버튼. variant, size, disabled 지원.
 * @param {string} variant - primary | secondary | accent | success | danger | warning | info | ghost
 * @param {string} size - sm | md | lg
 * @param {boolean} icon - true면 정사각형 아이콘 버튼
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon = false,
  disabled = false,
  type = 'button',
  className = '',
  ...rest
}) {
  const classes = [
    'tms-btn',
    VARIANT_MAP[variant] || VARIANT_MAP.primary,
    SIZE_MAP[size] || '',
    icon ? 'tms-btn--icon' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}

export default Button;
