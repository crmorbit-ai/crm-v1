import React from 'react';

/**
 * DynamicField Component
 * Renders form fields dynamically based on field definition
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

  // Common input props
  const inputProps = {
    id: fieldName,
    name: fieldName,
    value: value || '',
    onChange: handleChange,
    disabled,
    required: isRequired,
    placeholder: placeholder || '',
    className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      error ? 'border-red-500' : 'border-gray-300'
    } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`
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
            rows={4}
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
              className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                disabled ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            />
            <label htmlFor={fieldName} className="ml-2 block text-sm text-gray-700">
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
            <option value="">-- Select {label} --</option>
            {options && options.map((option, index) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-2">
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
                  className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 ${
                    disabled ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                />
                <label
                  htmlFor={`${fieldName}_${option.value}`}
                  className="ml-2 block text-sm text-gray-700"
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
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            size={Math.min(options?.length || 4, 6)}
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
    <div className="mb-4">
      {/* Label - Don't show for checkbox as it has inline label */}
      {fieldType !== 'checkbox' && (
        <label htmlFor={fieldName} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Field */}
      {renderField()}

      {/* Help Text */}
      {helpText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default DynamicField;
