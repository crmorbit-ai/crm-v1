import React from 'react';

/**
 * DynamicField Component
 * Renders custom form fields with the same look/size as standard CRM fields.
 */
const DynamicField = ({ fieldDefinition, value, onChange, error, disabled = false }) => {
  const {
    fieldName,
    label,
    fieldType,
    isRequired,
    placeholder,
    helpText,
    options,
    validations
  } = fieldDefinition;

  const handleChange = (e) => {
    const newValue = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    onChange(fieldName, newValue);
  };

  const handleMultiSelectChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    onChange(fieldName, selectedOptions);
  };

  // Match standard field label style
  const lStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: '700',
    marginBottom: '5px',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    color: '#475569',
  };

  // Match standard field input style
  const inputStyle = {
    padding: '8px 10px',
    fontSize: '13px',
    ...(error ? { borderColor: '#ef4444' } : {}),
  };

  const baseClass = disabled ? 'crm-form-input' : 'crm-form-input';

  const renderField = () => {
    switch (fieldType) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <input
            type={fieldType === 'phone' ? 'tel' : fieldType}
            id={fieldName}
            name={fieldName}
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            required={isRequired}
            placeholder={placeholder || ''}
            className={baseClass}
            style={inputStyle}
            maxLength={validations?.maxLength}
            minLength={validations?.minLength}
            pattern={validations?.pattern}
          />
        );

      case 'textarea':
        return (
          <textarea
            id={fieldName}
            name={fieldName}
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            required={isRequired}
            placeholder={placeholder || ''}
            className={baseClass}
            style={{ ...inputStyle, resize: 'vertical' }}
            rows={2}
            maxLength={validations?.maxLength}
          />
        );

      case 'number':
      case 'currency':
      case 'percentage':
        return (
          <input
            type="number"
            id={fieldName}
            name={fieldName}
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            required={isRequired}
            placeholder={placeholder || ''}
            className={baseClass}
            style={inputStyle}
            min={validations?.min}
            max={validations?.max}
            step={fieldType === 'currency' ? '0.01' : fieldType === 'percentage' ? '1' : 'any'}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            id={fieldName}
            name={fieldName}
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            required={isRequired}
            className={baseClass}
            style={inputStyle}
          />
        );

      case 'datetime':
        return (
          <input
            type="datetime-local"
            id={fieldName}
            name={fieldName}
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            required={isRequired}
            className={baseClass}
            style={inputStyle}
          />
        );

      case 'checkbox':
        return (
          <div style={{ display: 'flex', alignItems: 'center', paddingTop: '4px' }}>
            <input
              type="checkbox"
              id={fieldName}
              name={fieldName}
              checked={value || false}
              onChange={handleChange}
              disabled={disabled}
              style={{ width: '16px', height: '16px', cursor: disabled ? 'not-allowed' : 'pointer' }}
            />
            <label htmlFor={fieldName} style={{ marginLeft: '8px', fontSize: '13px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}>
              {placeholder || label}
            </label>
          </div>
        );

      case 'dropdown':
      case 'select':
        return (
          <select
            id={fieldName}
            name={fieldName}
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            required={isRequired}
            className="crm-form-select"
            style={inputStyle}
          >
            <option value="">-- Select --</option>
            {options && options.map((option, index) => (
              <option key={index} value={option.value}>{option.label}</option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', paddingTop: '4px' }}>
            {options && options.map((option, index) => (
              <label key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569', cursor: 'pointer', fontWeight: '500' }}>
                <input
                  type="radio"
                  name={fieldName}
                  value={option.value}
                  checked={value === option.value}
                  onChange={handleChange}
                  disabled={disabled}
                  required={isRequired}
                  style={{ width: '15px', height: '15px' }}
                />
                {option.label}
              </label>
            ))}
          </div>
        );

      case 'multi_select':
        return (
          <select
            id={fieldName}
            name={fieldName}
            multiple
            onChange={handleMultiSelectChange}
            value={value || []}
            disabled={disabled}
            required={isRequired}
            className="crm-form-select"
            style={{ ...inputStyle, minHeight: '80px' }}
            size={Math.min(options?.length || 3, 4)}
          >
            {options && options.map((option, index) => (
              <option key={index} value={option.value}>{option.label}</option>
            ))}
          </select>
        );

      default:
        return (
          <input
            type="text"
            id={fieldName}
            name={fieldName}
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            required={isRequired}
            placeholder={placeholder || ''}
            className={baseClass}
            style={inputStyle}
          />
        );
    }
  };

  // Checkbox renders its own label inline
  if (fieldType === 'checkbox') {
    return (
      <div>
        {renderField()}
        {helpText && !error && <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>{helpText}</p>}
        {error && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '3px' }}>{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={fieldName} style={lStyle}>
        {label}
        {isRequired && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
      </label>
      {renderField()}
      {helpText && !error && <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>{helpText}</p>}
      {error && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '3px' }}>{error}</p>}
    </div>
  );
};

export default DynamicField;
