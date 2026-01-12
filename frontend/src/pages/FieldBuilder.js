import React, { useState, useEffect } from 'react';
import fieldDefinitionService from '../services/fieldDefinitionService';
import DashboardLayout from '../components/layout/DashboardLayout';

const FieldBuilder = () => {
  const [entityType, setEntityType] = useState('Lead');
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive
  const [filterType, setFilterType] = useState('all'); // all, standard, custom

  // Form state for creating/editing field
  const [formData, setFormData] = useState({
    fieldName: '',
    label: '',
    fieldType: 'text',
    isRequired: false,
    placeholder: '',
    helpText: '',
    section: 'Additional Information',
    displayOrder: null,
    showInList: false,
    showInCreate: true,
    showInEdit: true,
    options: [],
    validations: {}
  });

  const [optionInput, setOptionInput] = useState({ label: '', value: '' });

  const fieldTypes = [
    { value: 'text', label: 'Text (Single Line)' },
    { value: 'textarea', label: 'Text Area (Multiple Lines)' },
    { value: 'number', label: 'Number' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'url', label: 'URL/Website' },
    { value: 'date', label: 'Date' },
    { value: 'datetime', label: 'Date & Time' },
    { value: 'checkbox', label: 'Checkbox (Yes/No)' },
    { value: 'dropdown', label: 'Dropdown (Select One)' },
    { value: 'multi_select', label: 'Multi-Select' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'currency', label: 'Currency' },
    { value: 'percentage', label: 'Percentage' }
  ];

  const entityTypes = ['Lead', 'Account', 'Contact', 'Opportunity', 'Product', 'Candidate'];

  // Display label mapping (Candidate → Customer for UI)
  const entityDisplayNames = {
    'Lead': 'Lead',
    'Account': 'Account',
    'Contact': 'Contact',
    'Opportunity': 'Opportunity',
    'Product': 'Product',
    'Candidate': 'Customer'  // Display as "Customer" in UI
  };

  useEffect(() => {
    fetchFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType]);

  const fetchFields = async () => {
    try {
      setLoading(true);
      // Fetch all fields including inactive ones
      const response = await fieldDefinitionService.getFieldDefinitions(entityType, true);
      const fetchedFields = Array.isArray(response) ? response : (response.data || []);
      // Sort by displayOrder
      const sortedFields = fetchedFields.sort((a, b) => a.displayOrder - b.displayOrder);
      setFields(sortedFields);
      setError('');
    } catch (err) {
      console.error('Error fetching fields:', err);
      setError('Failed to load field definitions');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedStandardFields = async () => {
    if (!window.confirm('This will add default standard fields for Lead, Contact, Account, and Product. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fieldDefinitionService.seedStandardFields();
      setSuccess(response.message || 'Standard fields seeded successfully!');
      setError('');
      // Refresh the field list
      await fetchFields();
    } catch (err) {
      console.error('Error seeding standard fields:', err);
      setError(err.response?.data?.message || 'Failed to seed standard fields');
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (field = null) => {
    if (field) {
      setEditingField(field);
      setFormData({
        fieldName: field.fieldName,
        label: field.label,
        fieldType: field.fieldType,
        isRequired: field.isRequired,
        placeholder: field.placeholder || '',
        helpText: field.helpText || '',
        section: field.section || 'Additional Information',
        displayOrder: field.displayOrder || null,
        showInList: field.showInList,
        showInCreate: field.showInCreate,
        showInEdit: field.showInEdit,
        options: field.options || [],
        validations: field.validations || {}
      });
    } else {
      setEditingField(null);
      setFormData({
        fieldName: '',
        label: '',
        fieldType: 'text',
        isRequired: false,
        placeholder: '',
        helpText: '',
        section: 'Additional Information',
        displayOrder: null,
        showInList: false,
        showInCreate: true,
        showInEdit: true,
        options: [],
        validations: {}
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingField(null);
    setOptionInput({ label: '', value: '' });
  };

  const generateFieldName = (label) => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '_');
  };

  const handleLabelChange = (label) => {
    setFormData(prev => ({
      ...prev,
      label,
      fieldName: editingField ? prev.fieldName : generateFieldName(label)
    }));
  };

  const handleAddOption = () => {
    if (optionInput.label && optionInput.value) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, { ...optionInput }]
      }));
      setOptionInput({ label: '', value: '' });
    }
  };

  const handleRemoveOption = (index) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const dataToSubmit = {
        ...formData,
        entityType
      };

      if (editingField) {
        await fieldDefinitionService.updateFieldDefinition(editingField._id, dataToSubmit);
        setSuccess('Field updated successfully!');
      } else {
        await fieldDefinitionService.createFieldDefinition(dataToSubmit);
        setSuccess('Field created successfully!');
      }

      await fetchFields();
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (err) {
      console.error('Error saving field:', err);
      setError(err.response?.data?.message || 'Failed to save field definition');
    }
  };

  const handleToggleStatus = async (field) => {
    const newStatus = !field.isActive;
    const actionText = newStatus ? 'enable' : 'disable';

    if (window.confirm(`Are you sure you want to ${actionText} the field "${field.label}"?`)) {
      try {
        await fieldDefinitionService.toggleFieldStatus(field._id, newStatus);
        setSuccess(`Field ${actionText}d successfully!`);
        await fetchFields();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        console.error('Error toggling field status:', err);
        setError(err.response?.data?.message || `Failed to ${actionText} field`);
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleDelete = async (fieldId, isStandardField) => {
    if (isStandardField) {
      alert('Standard fields cannot be deleted. You can disable them instead.');
      return;
    }

    if (window.confirm('Are you sure you want to permanently delete this field? This action cannot be undone and will remove all data stored in this field.')) {
      try {
        // Use permanent delete for custom fields
        await fieldDefinitionService.permanentDeleteFieldDefinition(fieldId);
        setSuccess('Field permanently deleted successfully!');
        await fetchFields();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        console.error('Error deleting field:', err);
        setError(err.response?.data?.message || 'Failed to delete field');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  // Move field up in display order
  const handleMoveUp = async (field, index) => {
    if (index === 0) return; // Already at top

    const currentField = filteredFields[index];
    const previousField = filteredFields[index - 1];

    try {
      // Swap display orders
      await fieldDefinitionService.updateFieldDefinition(currentField._id, {
        displayOrder: previousField.displayOrder
      });
      await fieldDefinitionService.updateFieldDefinition(previousField._id, {
        displayOrder: currentField.displayOrder
      });

      setSuccess('Field order updated!');
      await fetchFields();
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error('Error reordering field:', err);
      setError('Failed to reorder field');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Move field down in display order
  const handleMoveDown = async (field, index) => {
    if (index === filteredFields.length - 1) return; // Already at bottom

    const currentField = filteredFields[index];
    const nextField = filteredFields[index + 1];

    try {
      // Swap display orders
      await fieldDefinitionService.updateFieldDefinition(currentField._id, {
        displayOrder: nextField.displayOrder
      });
      await fieldDefinitionService.updateFieldDefinition(nextField._id, {
        displayOrder: currentField.displayOrder
      });

      setSuccess('Field order updated!');
      await fetchFields();
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error('Error reordering field:', err);
      setError('Failed to reorder field');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Filter fields based on status and type
  const filteredFields = fields.filter(field => {
    const statusMatch = filterStatus === 'all' ||
                       (filterStatus === 'active' && field.isActive) ||
                       (filterStatus === 'inactive' && !field.isActive);

    const typeMatch = filterType === 'all' ||
                     (filterType === 'standard' && field.isStandardField) ||
                     (filterType === 'custom' && !field.isStandardField);

    return statusMatch && typeMatch;
  });

  const needsOptions = ['dropdown', 'multi_select', 'radio'].includes(formData.fieldType);

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Field Builder</h1>
          <p className="text-gray-600 mt-2">
            Manage all CRM fields - enable/disable standard fields or create custom fields for your organization
          </p>
        </div>

        {/* Entity Type Selector and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Entity Type:</label>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {entityTypes.map(type => (
                  <option key={type} value={type}>{entityDisplayNames[type]}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSeedStandardFields}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition"
                title="Add default standard fields for all entities"
              >
                🌱 Seed Standard Fields
              </button>
              <button
                onClick={() => handleOpenModal()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition"
              >
                + Add Custom Field
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4 pt-4 border-t">
            <label className="text-sm font-medium text-gray-700">Filters:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Fields</option>
              <option value="standard">Standard Fields Only</option>
              <option value="custom">Custom Fields Only</option>
            </select>
            <span className="text-sm text-gray-500">
              Showing {filteredFields.length} of {fields.length} fields
            </span>
          </div>
        </div>

        {/* Success/Error Messages */}
        {error && !showModal && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {success && !showModal && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* Fields List */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading fields...</div>
          ) : filteredFields.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p className="text-lg mb-2">No fields match the current filters</p>
              <p className="text-sm">Try changing the filters or click "Add Custom Field" to create a new field</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Reorder</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Field Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Field Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Required</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFields.map((field, index) => (
                    <tr key={field._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleMoveUp(field, index)}
                            disabled={index === 0}
                            className={`p-1 rounded ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'}`}
                            title="Move Up"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleMoveDown(field, index)}
                            disabled={index === filteredFields.length - 1}
                            className={`p-1 rounded ${index === filteredFields.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'}`}
                            title="Move Down"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {field.displayOrder}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {field.fieldName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {field.label}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {field.fieldType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {field.isStandardField ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 font-medium">Standard</span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800 font-medium">Custom</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {field.isRequired ? (
                          <span className="text-red-600 font-medium">Yes</span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {field.section}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {field.isActive ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Inactive</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleToggleStatus(field)}
                          className={field.isActive ? "text-orange-600 hover:text-orange-900" : "text-green-600 hover:text-green-900"}
                        >
                          {field.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleOpenModal(field)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        {!field.isStandardField && (
                          <button
                            onClick={() => handleDelete(field._id, field.isStandardField)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">
                  {editingField ? 'Edit Field' : 'Create New Field'}
                </h2>

                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {success}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    {/* Label */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Field Label <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.label}
                        onChange={(e) => handleLabelChange(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Course Name, Booth Size"
                      />
                    </div>

                    {/* Field Name (auto-generated) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Field Name (auto-generated)
                      </label>
                      <input
                        type="text"
                        value={formData.fieldName}
                        readOnly={!!editingField}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This is the internal name used to store the field data
                      </p>
                    </div>

                    {/* Field Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Field Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.fieldType}
                        onChange={(e) => setFormData({...formData, fieldType: e.target.value, options: []})}
                        required
                        disabled={!!editingField}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {fieldTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                      {editingField && (
                        <p className="text-xs text-gray-500 mt-1">Field type cannot be changed after creation</p>
                      )}
                    </div>

                    {/* Options for dropdown/multi_select/radio */}
                    {needsOptions && (
                      <div className="border border-gray-300 rounded-md p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Options <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2 mb-3">
                          <input
                            type="text"
                            value={optionInput.label}
                            onChange={(e) => setOptionInput({...optionInput, label: e.target.value})}
                            placeholder="Label (e.g., MBA)"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                          />
                          <input
                            type="text"
                            value={optionInput.value}
                            onChange={(e) => setOptionInput({...optionInput, value: e.target.value})}
                            placeholder="Value (e.g., mba)"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                          />
                          <button
                            type="button"
                            onClick={handleAddOption}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            Add
                          </button>
                        </div>
                        <div className="space-y-2">
                          {formData.options.map((option, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                              <span className="text-sm">{option.label} ({option.value})</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(index)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Section
                      </label>
                      <input
                        type="text"
                        value={formData.section}
                        onChange={(e) => setFormData({...formData, section: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="e.g., Additional Information, Course Details"
                      />
                    </div>

                    {/* Display Order / Position */}
                    <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Field Position in Form
                      </label>

                      {/* Show current fields for reference */}
                      <div className="mb-3 p-3 bg-white rounded border border-gray-200">
                        <p className="text-xs font-semibold text-gray-600 mb-2">Current Fields Order:</p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {fields.filter(f => f.isActive).slice(0, 10).map((f, idx) => (
                            <div key={f._id} className="text-xs text-gray-600 flex items-center gap-2">
                              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{f.displayOrder}</span>
                              <span>{f.label}</span>
                              <span className="text-gray-400">({f.section})</span>
                            </div>
                          ))}
                          {fields.filter(f => f.isActive).length > 10 && (
                            <p className="text-xs text-gray-400 italic">...and {fields.filter(f => f.isActive).length - 10} more</p>
                          )}
                        </div>
                      </div>

                      {/* Position selector */}
                      <div className="space-y-2">
                        <label className="block text-sm text-gray-700">
                          Insert Position:
                        </label>
                        <select
                          value={formData.displayOrder || ''}
                          onChange={(e) => {
                            const selectedOrder = parseInt(e.target.value);
                            if (selectedOrder) {
                              // Find the field that comes before this position
                              const previousField = fields.find(f => f.displayOrder === selectedOrder - 1);
                              // Auto-set the section to match the previous field
                              setFormData({
                                ...formData,
                                displayOrder: selectedOrder,
                                section: previousField ? previousField.section : formData.section
                              });
                            } else {
                              // Default - clear position
                              setFormData({...formData, displayOrder: null});
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">At the end (default)</option>
                          <option value="1">At the beginning (Position 1)</option>
                          {fields.filter(f => f.isActive).map((field) => (
                            <option
                              key={field._id}
                              value={field.displayOrder + 1}
                              data-section={field.section}
                            >
                              After "{field.label}" (Position {field.displayOrder + 1}) - {field.section}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          💡 Field will be added to the same section as the selected field
                        </p>
                      </div>
                    </div>

                    {/* Placeholder */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Placeholder Text
                      </label>
                      <input
                        type="text"
                        value={formData.placeholder}
                        onChange={(e) => setFormData({...formData, placeholder: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="e.g., Enter course name"
                      />
                    </div>

                    {/* Help Text */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Help Text
                      </label>
                      <textarea
                        value={formData.helpText}
                        onChange={(e) => setFormData({...formData, helpText: e.target.value})}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Additional information to help users fill this field"
                      />
                    </div>

                    {/* Checkboxes */}
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.isRequired}
                          onChange={(e) => setFormData({...formData, isRequired: e.target.checked})}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Required Field</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.showInList}
                          onChange={(e) => setFormData({...formData, showInList: e.target.checked})}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Show in List View</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.showInCreate}
                          onChange={(e) => setFormData({...formData, showInCreate: e.target.checked})}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Show in Create Form</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.showInEdit}
                          onChange={(e) => setFormData({...formData, showInEdit: e.target.checked})}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Show in Edit Form</span>
                      </label>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      {editingField ? 'Update Field' : 'Create Field'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FieldBuilder;
