import React from 'react';

/**
 * DynamicField Component
 * Renders form fields dynamically based on field definition - Compact version
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

  // Compact input styling
  const inputProps = {
    id: fieldName,
    name: fieldName,
    value: value || '',
    onChange: handleChange,
    disabled,
    required: isRequired,
    placeholder: placeholder || '',
    className: `w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
      error ? 'border-red-500' : 'border-gray-300'
    } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`,
    style: { fontSize: '11px', padding: '4px 6px' }
  };

  const renderField = () => {
    switch (fieldType) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <input
            type={fieldType === 'phone' ? 'tel' : fieldType === 'url' ? 'url' : fieldType}
            {...inputProps}
            maxLength={validations?.maxLength}
            minLength={validations?.minLength}
            pattern={validations?.pattern}
          />
        );

      case 'textarea':
        return (
          <textarea
            {...inputProps}
            rows={2}
            maxLength={validations?.maxLength}
            minLength={validations?.minLength}
          />
        );

      case 'number':
      case 'currency':
      case 'percentage':
        return (
          <input
            type="number"
            {...inputProps}
            min={validations?.min}
            max={validations?.max}
            step={fieldType === 'currency' ? '0.01' : fieldType === 'percentage' ? '1' : 'any'}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            {...inputProps}
          />
        );

      case 'datetime':
        return (
          <input
            type="datetime-local"
            {...inputProps}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={fieldName}
              name={fieldName}
              checked={value || false}
              onChange={handleChange}
              disabled={disabled}
              className={`h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                disabled ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            />
            <label htmlFor={fieldName} className="ml-1 block text-xs text-gray-700" style={{ fontSize: '10px' }}>
              {placeholder || label}
            </label>
          </div>
        );

      case 'dropdown':
        return (
          <select
            {...inputProps}
            value={value || ''}
          >
            <option value="">-- Select --</option>
            {options && options.map((option, index) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="flex flex-wrap gap-2">
            {options && options.map((option, index) => (
              <div key={index} className="flex items-center">
                <input
                  type="radio"
                  id={`${fieldName}_${option.value}`}
                  name={fieldName}
                  value={option.value}
                  checked={value === option.value}
                  onChange={handleChange}
                  disabled={disabled}
                  required={isRequired}
                  className={`h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 ${
                    disabled ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                />
                <label
                  htmlFor={`${fieldName}_${option.value}`}
                  className="ml-1 text-xs text-gray-700"
                  style={{ fontSize: '10px' }}
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );

      case 'multi_select':
        return (
          <select
            {...inputProps}
            multiple
            onChange={handleMultiSelectChange}
            value={value || []}
            size={Math.min(options?.length || 3, 4)}
          >
            {options && options.map((option, index) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            type="text"
            {...inputProps}
          />
        );
    }
  };

  return (
    <div style={{ marginBottom: '2px' }}>
      {/* Label - Compact */}
      {fieldType !== 'checkbox' && (
        <label htmlFor={fieldName} className="block font-semibold text-gray-700" style={{ fontSize: '10px', marginBottom: '2px' }}>
          {label}
          {isRequired && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Field */}
      {renderField()}

      {/* Help Text - Compact */}
      {helpText && !error && (
        <p className="text-gray-500" style={{ fontSize: '9px', marginTop: '1px' }}>{helpText}</p>
      )}

      {/* Error Message - Compact */}
      {error && (
        <p className="text-red-500" style={{ fontSize: '9px', marginTop: '1px' }}>{error}</p>
      )}
    </div>
  );
};

export default DynamicField;
