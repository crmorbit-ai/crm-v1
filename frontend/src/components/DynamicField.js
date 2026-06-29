import React, { useState } from 'react';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

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

  const [gstVerifying, setGstVerifying] = useState(false);
  const [gstVerified, setGstVerified] = useState(null);
  const [gstError, setGstError] = useState('');

  const handleChange = (e) => {
    const newValue = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    onChange(fieldName, newValue);

    // Reset GST verification when value changes
    if (fieldName === 'gstNumber') {
      setGstVerified(null);
      setGstError('');
    }
  };

  const verifyGST = async () => {
    if (!value || value.length !== 15) {
      setGstError('GST number must be 15 characters');
      return;
    }

    setGstVerifying(true);
    setGstError('');

    try {
      const response = await fetch('/api/leads/verify-gst', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ gstNumber: value.toUpperCase() })
      });

      const data = await response.json();

      if (data.success && data.data.valid) {
        setGstVerified(true);
        setGstError('');
      } else {
        setGstVerified(false);
        setGstError(data.data?.error || data.message || 'Invalid GST number');
      }
    } catch (err) {
      setGstVerified(false);
      setGstError('Verification failed. Please try again.');
    } finally {
      setGstVerifying(false);
    }
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
    ...(error ? { border: '2px solid #ef4444' } : {}),
  };

  const baseClass = disabled ? 'crm-form-input' : 'crm-form-input';

  const renderField = () => {
    switch (fieldType) {
      case 'text':
        // Special handling for GST Number field
        if (fieldName === 'gstNumber') {
          return (
            <div>
              <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
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
                  style={{
                    ...inputStyle,
                    flex: 1,
                    textTransform: 'uppercase',
                    borderColor: gstVerified === true ? '#10b981' : gstVerified === false ? '#ef4444' : undefined
                  }}
                  maxLength={15}
                />
                <button
                  type="button"
                  onClick={verifyGST}
                  disabled={!value || value.length !== 15 || gstVerifying || disabled}
                  style={{
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: '600',
                    borderRadius: '6px',
                    border: 'none',
                    background: gstVerified === true ? '#10b981' : gstVerified === false ? '#ef4444' : '#3b82f6',
                    color: '#fff',
                    cursor: (!value || value.length !== 15 || gstVerifying || disabled) ? 'not-allowed' : 'pointer',
                    opacity: (!value || value.length !== 15 || disabled) ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {gstVerifying ? (
                    <><Loader className="h-3 w-3 animate-spin" /> Verifying...</>
                  ) : gstVerified === true ? (
                    <><CheckCircle className="h-3 w-3" /> Verified</>
                  ) : gstVerified === false ? (
                    <><XCircle className="h-3 w-3" /> Invalid</>
                  ) : (
                    'Verify GST'
                  )}
                </button>
              </div>
              {gstError && (
                <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>
                  {gstError}
                </div>
              )}
              {gstVerified === true && (
                <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle className="h-3 w-3" /> Valid GST Number
                </div>
              )}
            </div>
          );
        }

        // PAN Number field with validation
        if (fieldName === 'panNumber') {
          const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
          const isPanValid = value && value.length === 10 && panRegex.test(value);

          return (
            <div style={{ position: 'relative' }}>
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
                style={{
                  ...inputStyle,
                  textTransform: 'uppercase',
                  paddingRight: '35px',
                  borderColor: value && (isPanValid ? '#10b981' : '#ef4444')
                }}
                maxLength={10}
              />
              {value && (
                <div style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)'
                }}>
                  {isPanValid ? (
                    <CheckCircle className="h-4 w-4" style={{ color: '#10b981' }} />
                  ) : (
                    <XCircle className="h-4 w-4" style={{ color: '#ef4444' }} />
                  )}
                </div>
              )}
              {value && !isPanValid && (
                <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>
                  Invalid PAN format (e.g., ABCDE1234F)
                </div>
              )}
            </div>
          );
        }

        // Regular text field
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
            inputMode={fieldType === 'phone' ? 'numeric' : undefined}
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
            style={{ ...inputStyle, resize: 'vertical', minHeight: '160px' }}
            rows={7}
            maxLength={validations?.maxLength}
          />
        );

      case 'number':
      case 'currency':
        return (
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '13px',
              fontWeight: '600',
              color: '#64748b',
              pointerEvents: 'none',
              zIndex: 1
            }}>₹</span>
            <input
              type="number"
              id={fieldName}
              name={fieldName}
              value={value || ''}
              onChange={handleChange}
              disabled={disabled}
              required={isRequired}
              placeholder={placeholder || '0.00'}
              className={baseClass}
              style={{...inputStyle, paddingLeft: '28px'}}
              min={validations?.min}
              max={validations?.max}
              step="0.01"
            />
          </div>
        );

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
            step="1"
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
            style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #e2e8f0' }}
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
