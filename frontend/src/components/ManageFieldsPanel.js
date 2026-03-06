import React, { useState } from 'react';
import { Settings, ToggleLeft, ToggleRight, Plus, ChevronDown, ChevronUp, X, Trash2 } from 'lucide-react';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'date', label: 'Date' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'currency', label: 'Currency' },
  { value: 'url', label: 'URL' },
];

const SECTION_PALETTE = [
  { accent: '#3b82f6', light: '#eff6ff', chip: '#dbeafe', chipText: '#1e40af' },
  { accent: '#10b981', light: '#f0fdf4', chip: '#d1fae5', chipText: '#065f46' },
  { accent: '#8b5cf6', light: '#f5f3ff', chip: '#ede9fe', chipText: '#4c1d95' },
  { accent: '#f59e0b', light: '#fffbeb', chip: '#fef3c7', chipText: '#92400e' },
  { accent: '#06b6d4', light: '#ecfeff', chip: '#cffafe', chipText: '#155e75' },
  { accent: '#f43f5e', light: '#fff1f2', chip: '#ffe4e6', chipText: '#9f1239' },
  { accent: '#64748b', light: '#f8fafc', chip: '#e2e8f0', chipText: '#334155' },
];

const ManageFieldsPanel = ({ allFieldDefs, togglingField, onToggle, onClose, onAdd, onDelete, canAdd, canToggle, canDelete, entityLabel, sections }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ label: '', fieldType: 'text', section: sections[0] || 'Additional Information', isRequired: false, afterField: '__end__' });
  const [collapsedSections, setCollapsedSections] = useState({});
  const [addBtnHover, setAddBtnHover] = useState(false);
  const [confirmDeleteField, setConfirmDeleteField] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleSectionChange = (section) => {
    setForm(p => ({ ...p, section, afterField: '__end__' }));
  };

  const toggleSection = (section) => {
    setCollapsedSections(p => ({ ...p, [section]: !p[section] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.label.trim()) return;
    setSaving(true);
    const fieldsInSection = allFieldDefs.filter(f => f.section === form.section);
    let displayOrder = fieldsInSection.length > 0 ? Math.max(...fieldsInSection.map(f => f.displayOrder)) + 1 : 1000;
    if (form.afterField && form.afterField !== '__end__') {
      const after = allFieldDefs.find(f => (f._id || f.fieldName) === form.afterField);
      if (after) displayOrder = after.displayOrder + 0.5;
    }
    await onAdd({
      label: form.label.trim(),
      fieldName: form.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
      fieldType: form.fieldType,
      section: form.section,
      isRequired: form.isRequired,
      displayOrder,
    });
    setForm({ label: '', fieldType: 'text', section: sections[0] || 'Additional Information', isRequired: false, afterField: '__end__' });
    setShowAddForm(false);
    setSaving(false);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteField || !onDelete) return;
    setDeleting(true);
    await onDelete(confirmDeleteField);
    setDeleting(false);
    setConfirmDeleteField(null);
  };

  const sections_map = {};
  allFieldDefs.forEach(f => {
    const s = f.section || 'Additional Information';
    if (!sections_map[s]) sections_map[s] = [];
    sections_map[s].push(f);
  });

  const orderedSections = [
    ...sections.filter(s => sections_map[s]),
    ...Object.keys(sections_map).filter(s => !sections.includes(s)),
  ];

  const activeCount = allFieldDefs.filter(f => f.isActive).length;
  const totalCount = allFieldDefs.length;

  return (
    <div style={{
      marginBottom: '12px',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(30,60,114,0.10)',
      border: '1px solid #e2e8f0',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 60%, #3b82f6 100%)',
        padding: '10px 14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings style={{ width: '14px', height: '14px', color: '#fff' }} />
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>
            Manage {entityLabel} Fields
          </span>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.12)', padding: '1px 7px', borderRadius: '10px' }}>
            {activeCount}/{totalCount} active
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '7px', cursor: 'pointer', width: '26px', height: '26px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            }}
          >
            <X style={{ width: '13px', height: '13px' }} />
          </button>
        </div>
      </div>

      {/* Body: split layout when form is open */}
      <div style={{ display: 'flex', minHeight: 0 }}>

        {/* Left: Add Field Form (slides in) */}
        {showAddForm && (
          <div style={{
            flex: '0 0 280px',
            borderRight: '1px solid #e2e8f0',
            background: 'linear-gradient(160deg, #f8fafc 0%, #eff6ff 100%)',
            padding: '12px',
            overflowY: 'auto',
            maxHeight: '340px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e3c72' }}>Add New Field</span>
              <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                <X style={{ width: '14px', height: '14px' }} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '700', color: '#374151', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Field Label *</label>
                <input
                  className="crm-form-input"
                  style={{ padding: '5px 8px', fontSize: '12px', width: '100%', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  placeholder="e.g. Budget Range"
                  value={form.label}
                  onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '700', color: '#374151', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Field Type</label>
                <select className="crm-form-select" style={{ padding: '5px 8px', fontSize: '12px', width: '100%', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} value={form.fieldType} onChange={e => setForm(p => ({ ...p, fieldType: e.target.value }))}>
                  {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '700', color: '#374151', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Section</label>
                <select className="crm-form-select" style={{ padding: '5px 8px', fontSize: '12px', width: '100%', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} value={form.section} onChange={e => handleSectionChange(e.target.value)}>
                  {sections.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '700', color: '#374151', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Place After</label>
                <select className="crm-form-select" style={{ padding: '5px 8px', fontSize: '12px', width: '100%', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} value={form.afterField} onChange={e => setForm(p => ({ ...p, afterField: e.target.value }))}>
                  <option value="__end__">— End of section</option>
                  {allFieldDefs.filter(f => f.section === form.section).map(f => (
                    <option key={f._id || f.fieldName} value={f._id || f.fieldName}>After: {f.label}</option>
                  ))}
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', color: '#374151', fontWeight: '500' }}>
                <input type="checkbox" checked={form.isRequired} onChange={e => setForm(p => ({ ...p, isRequired: e.target.checked }))} style={{ width: '13px', height: '13px', accentColor: '#3b82f6' }} />
                Required field
              </label>
              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                <button type="button" onClick={() => setShowAddForm(false)} style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: '#64748b', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: '6px', borderRadius: '6px', border: 'none', background: saving ? '#94a3b8' : 'linear-gradient(135deg, #4A90E2 0%, #2c5364 100%)', color: '#fff', fontSize: '11px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Saving...' : 'Save Field'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Right: Fields List */}
        <div style={{
          flex: showAddForm ? '1 1 55%' : '1 1 100%',
          padding: '10px',
          overflowY: 'auto',
          maxHeight: '340px',
          transition: 'flex 0.2s',
        }}>
          {canAdd && !showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              onMouseEnter={() => setAddBtnHover(true)}
              onMouseLeave={() => setAddBtnHover(false)}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                marginBottom: '10px', padding: '6px 14px', borderRadius: '8px',
                cursor: 'pointer', fontSize: '12px', fontWeight: '700',
                background: addBtnHover
                  ? 'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #ec4899 100%)'
                  : 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
                border: 'none', color: '#fff',
                boxShadow: addBtnHover
                  ? '0 3px 12px rgba(239,68,68,0.45)'
                  : '0 2px 8px rgba(99,102,241,0.4)',
                transition: 'all 0.25s ease',
                transform: addBtnHover ? 'translateY(-1px)' : 'translateY(0)',
              }}
            >
              <Plus style={{ width: '13px', height: '13px' }} /> Add Field
            </button>
          )}
          {orderedSections.map((section, idx) => {
            const fields = sections_map[section];
            const palette = SECTION_PALETTE[idx % SECTION_PALETTE.length];
            const isCollapsed = collapsedSections[section];
            const activeInSection = fields.filter(f => f.isActive).length;

            return (
              <div key={section} style={{ marginBottom: '8px', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${palette.chip}` }}>
                {/* Section Header */}
                <div
                  onClick={() => toggleSection(section)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '5px 10px',
                    background: palette.light,
                    cursor: 'pointer',
                    borderLeft: `3px solid ${palette.accent}`,
                    userSelect: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: palette.accent }} />
                    <span style={{ fontSize: '11px', fontWeight: '700', color: palette.chipText }}>{section}</span>
                    <span style={{ fontSize: '9px', fontWeight: '600', padding: '0px 5px', borderRadius: '10px', background: palette.chip, color: palette.chipText }}>
                      {activeInSection}/{fields.length}
                    </span>
                  </div>
                  {isCollapsed
                    ? <ChevronDown style={{ width: '12px', height: '12px', color: palette.accent }} />
                    : <ChevronUp style={{ width: '12px', height: '12px', color: palette.accent }} />
                  }
                </div>

                {/* Fields */}
                {!isCollapsed && (
                  <div style={{ padding: '6px', background: '#fff', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '4px' }}>
                    {fields.map(field => {
                      const isCustom = !field.isStandardField && !field._isStd;
                      const isConfirming = confirmDeleteField && (confirmDeleteField._id === field._id);

                      // Confirmation state: replace row with confirm UI
                      if (isConfirming) {
                        return (
                          <div
                            key={field._id || field.fieldName}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '5px 8px', borderRadius: '6px',
                              border: '1px solid #fca5a5',
                              background: '#fff1f2',
                              gap: '4px',
                            }}
                          >
                            <span style={{ fontSize: '10px', fontWeight: '600', color: '#b91c1c', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              Delete "{field.label}"?
                            </span>
                            <button
                              onClick={handleConfirmDelete}
                              disabled={deleting}
                              style={{ padding: '2px 7px', borderRadius: '4px', border: 'none', background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: '700', cursor: deleting ? 'not-allowed' : 'pointer' }}
                            >
                              {deleting ? '...' : 'Yes'}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteField(null)}
                              disabled={deleting}
                              style={{ padding: '2px 7px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', color: '#64748b', fontSize: '10px', fontWeight: '600', cursor: 'pointer' }}
                            >
                              No
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={field._id || field.fieldName}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '5px 8px', borderRadius: '6px',
                            border: `1px solid ${field.isActive ? palette.chip : '#e5e7eb'}`,
                            background: field.isActive ? palette.light : '#fafafa',
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '11px', fontWeight: '600', color: field.isActive ? '#1e293b' : '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {field.label}
                              {field.isRequired && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
                            </div>
                            <span style={{ fontSize: '9px', padding: '0px 5px', borderRadius: '3px', background: field.isActive ? palette.chip : '#e5e7eb', color: field.isActive ? palette.chipText : '#6b7280', fontWeight: '500' }}>
                              {field.fieldType}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                            {/* Delete button — only for custom fields */}
                            {isCustom && canDelete && (
                              <button
                                onClick={() => setConfirmDeleteField(field)}
                                title="Delete this field"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', color: '#ef4444', opacity: 0.6 }}
                                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
                              >
                                <Trash2 style={{ width: '13px', height: '13px' }} />
                              </button>
                            )}
                            {/* Toggle button */}
                            <button
                              onClick={() => canToggle && onToggle(field)}
                              disabled={!canToggle || togglingField === field.fieldName}
                              style={{ background: 'none', border: 'none', cursor: canToggle ? 'pointer' : 'not-allowed', padding: '1px', opacity: (!canToggle || togglingField === field.fieldName) ? 0.35 : 1 }}
                              title={!canToggle ? 'You need update permission to toggle fields' : field.isActive ? 'Disable field' : 'Enable field'}
                            >
                              {field.isActive
                                ? <ToggleRight style={{ width: '20px', height: '20px', color: canToggle ? palette.accent : '#cbd5e1' }} />
                                : <ToggleLeft style={{ width: '20px', height: '20px', color: '#cbd5e1' }} />
                              }
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default ManageFieldsPanel;
