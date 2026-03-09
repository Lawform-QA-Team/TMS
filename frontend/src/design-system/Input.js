import React from 'react';

/**
 * 디자인 시스템 입력 필드. label, error, textarea/select 지원.
 */
function Input({
  label,
  error,
  id,
  className = '',
  wrapperClassName = '',
  as = 'input', // 'input' | 'textarea' | 'select'
  ...rest
}) {
  const inputId = id || (label ? `tms-input-${label.replace(/\s/g, '-')}` : undefined);
  const baseClass = as === 'textarea' ? 'tms-textarea' : as === 'select' ? 'tms-select' : 'tms-input';

  const inputProps = {
    id: inputId,
    className: `${baseClass} ${className}`.trim(),
    ...rest,
  };

  const input =
    as === 'textarea' ? (
      <textarea {...inputProps} />
    ) : as === 'select' ? (
      <select {...inputProps}>{rest.children}</select>
    ) : (
      <input {...inputProps} />
    );

  return (
    <div className={`tms-input-wrap ${wrapperClassName}`.trim()}>
      {label && (
        <label htmlFor={inputId} className="tms-input-label">
          {label}
        </label>
      )}
      {input}
      {error && (
        <span className="tms-input-error" style={{ color: 'var(--tms-error)', fontSize: 'var(--tms-text-xs)', marginTop: 'var(--tms-space-1)' }}>
          {error}
        </span>
      )}
    </div>
  );
}

export default Input;
