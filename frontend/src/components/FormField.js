import React from 'react';

export const FormField = ({
  label,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
  options = null, // For select dropdown
  textarea = false,
  min,
  max,
  step
}) => {
  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: error ? '1px solid #ef4444' : '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '13px',
    boxSizing: 'border-box',
    marginTop: '6px',
    background: disabled ? '#f9fafb' : '#fff',
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  const labelStyle = {
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
    display: 'block',
    marginBottom: '2px'
  };

  const errorStyle = {
    fontSize: '11px',
    color: '#ef4444',
    marginTop: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  };

  const containerStyle = {
    marginBottom: '16px'
  };

  return (
    <div style={containerStyle}>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
      </label>

      {options ? (
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          style={inputStyle}
        >
          {options.map((opt, i) => (
            <option key={i} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : textarea ? (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          style={inputStyle}
          onFocus={(e) => {
            if (!error) e.target.style.borderColor = '#3b82f6';
          }}
          onBlur={(e) => {
            if (!error) e.target.style.borderColor = '#e2e8f0';
          }}
        />
      )}

      {error && (
        <div style={errorStyle}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
};

export default FormField;
