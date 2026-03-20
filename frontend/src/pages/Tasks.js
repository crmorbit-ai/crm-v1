import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { taskService } from '../services/taskService';
import { leadService } from '../services/leadService';
import { contactService } from '../services/contactService';
import { accountService } from '../services/accountService';
import templateService from '../services/templateService';
import '../styles/crm.css';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [panelWidth, setPanelWidth] = useState(36);

  const [formData, setFormData] = useState({
    subject: '', dueDate: '', status: 'Not Started', priority: 'Normal', description: ''
  });
  const [taskTemplates, setTaskTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Related To state
  const [relatedToType, setRelatedToType] = useState('');
  const [relatedToSearch, setRelatedToSearch] = useState('');
  const [relatedToId, setRelatedToId] = useState('');
  const [relatedToOptions, setRelatedToOptions] = useState([]);
  const [relatedToSearching, setRelatedToSearching] = useState(false);
  const [showRelatedDropdown, setShowRelatedDropdown] = useState(false);
  const relatedSearchRef = useRef(null);
  const searchTimerRef = useRef(null);

  const statuses = [
    { name: 'Not Started', color: '#6B7280', icon: '⭕' },
    { name: 'Deferred',    color: '#F59E0B', icon: '⏸️' },
    { name: 'In Progress', color: '#3B82F6', icon: '🔄' },
    { name: 'Completed',   color: '#10B981', icon: '✅' },
    { name: 'Waiting for Input', color: '#8B5CF6', icon: '⏳' },
  ];

  useEffect(() => {
    loadTasks();
    templateService.getTemplates('task').then(r => setTaskTemplates(r?.data || [])).catch(() => {});
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await taskService.getTasks({ page: 1, limit: 100 });
      if (response?.success) setTasks(response.data.tasks || []);
    } catch (err) {
      if (err?.isPermissionDenied) return;
      setError('Failed to load tasks');
    } finally { setLoading(false); }
  };

  const searchRelatedEntities = async (term, type) => {
    if (!type) { setRelatedToOptions([]); return; }
    setRelatedToSearching(true);
    try {
      const params = { limit: 20 };
      if (term.trim()) params.search = term.trim();
      if (type === 'Lead') {
        const res = await leadService.getLeads(params);
        setRelatedToOptions((res?.data?.leads || []).map(l => ({ _id: l._id, label: l.customerName || l.email || 'Unnamed Lead' })));
      } else if (type === 'Contact') {
        const res = await contactService.getContacts(params);
        setRelatedToOptions((res?.data?.contacts || []).map(c => ({ _id: c._id, label: `${c.firstName||''} ${c.lastName||''}`.trim() || c.email || 'Unnamed Contact' })));
      } else if (type === 'Account') {
        const res = await accountService.getAccounts(params);
        setRelatedToOptions((res?.data?.accounts || []).map(a => ({ _id: a._id, label: a.companyName || a.name || 'Unnamed Account' })));
      }
    } catch { setRelatedToOptions([]); }
    finally { setRelatedToSearching(false); }
  };

  const handleRelatedTypeChange = (type) => {
    setRelatedToType(type); setRelatedToSearch(''); setRelatedToId('');
    setRelatedToOptions([]); setShowRelatedDropdown(!!type);
    if (type) searchRelatedEntities('', type);
  };

  const handleRelatedSearch = (val) => {
    setRelatedToSearch(val); setRelatedToId(''); setShowRelatedDropdown(true);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => searchRelatedEntities(val, relatedToType), 250);
  };

  const selectRelatedEntity = (opt) => {
    setRelatedToId(opt._id); setRelatedToSearch(opt.label); setShowRelatedDropdown(false);
  };

  const resetForm = () => {
    setFormData({ subject: '', dueDate: '', status: 'Not Started', priority: 'Normal', description: '' });
    setRelatedToType(''); setRelatedToSearch(''); setRelatedToId('');
    setRelatedToOptions([]); setShowRelatedDropdown(false);
    setSelectedTemplate(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (relatedToType && relatedToId) { payload.relatedTo = relatedToType; payload.relatedToId = relatedToId; }
      await taskService.createTask(payload);
      setSuccess('Task created!');
      setShowCreateForm(false);
      resetForm();
      loadTasks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err?.isPermissionDenied) return;
      setError('Failed to create task');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDividerDrag = (e) => {
    e.preventDefault();
    const container = document.getElementById('tasks-split-container');
    if (!container) return;
    const startX = e.clientX, startW = panelWidth, cW = container.getBoundingClientRect().width;
    const onMove = (mv) => { const d = ((mv.clientX - startX) / cW) * 100; setPanelWidth(Math.max(25, Math.min(55, startW + d))); };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const handleDragStart = (e, task) => { setDraggedItem(task); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.status === targetStatus) { setDraggedItem(null); return; }
    setTasks(prev => prev.map(t => t._id === draggedItem._id ? { ...t, status: targetStatus } : t));
    try { await taskService.updateTask(draggedItem._id, { status: targetStatus }); }
    catch { loadTasks(); }
    setDraggedItem(null);
  };

  const getTasksByStatus = (s) => tasks.filter(t => t.status === s);
  const getPriorityColor = (p) => ({ High: '#EF4444', Normal: '#3B82F6', Low: '#6B7280' }[p] || '#6B7280');
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—';

  const statCards = [
    { label: 'Total Tasks',   value: tasks.length,                                             icon: '📋', bg: '#eff6ff', border: '#93c5fd', left: '#3b82f6', labelColor: '#2563eb', valColor: '#1e3a8a', iconBg: '#dbeafe' },
    { label: 'In Progress',   value: tasks.filter(t => t.status === 'In Progress').length,     icon: '🔄', bg: '#fffbeb', border: '#fcd34d', left: '#f59e0b', labelColor: '#d97706', valColor: '#78350f', iconBg: '#fde68a' },
    { label: 'Completed',     value: tasks.filter(t => t.status === 'Completed').length,       icon: '✅', bg: '#f0fdf4', border: '#86efac', left: '#22c55e', labelColor: '#16a34a', valColor: '#14532d', iconBg: '#dcfce7' },
    { label: 'High Priority', value: tasks.filter(t => t.priority === 'High').length,          icon: '🔴', bg: '#fff1f2', border: '#fca5a5', left: '#ef4444', labelColor: '#dc2626', valColor: '#7f1d1d', iconBg: '#fee2e2' },
  ];

  if (loading) return (
    <DashboardLayout title="Tasks">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: '#94a3b8', fontSize: '14px' }}>Loading Tasks...</span>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="Tasks">
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', overflow: 'hidden' }}>

        {/* Fixed top */}
        <div style={{ flexShrink: 0, padding: '0 16px 10px 16px' }}>
          {/* Header banner */}
          <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderRadius: '14px', padding: '16px 22px', marginBottom: '10px', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 4px 12px rgba(59,130,246,0.3)', flexShrink: 0 }}>✅</div>
              <div>
                <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e3a8a' }}>Tasks</h1>
                <p style={{ margin: 0, fontSize: '12px', color: '#3b82f6', fontWeight: '500', marginTop: '2px' }}>Manage & track tasks — drag cards to update status</p>
              </div>
            </div>
          </div>
          {/* Stats */}
          <div className="resp-grid-4">
            {statCards.map((s, i) => (
              <div key={i} style={{ background: s.bg, borderRadius: '12px', padding: '12px 16px', border: `1px solid ${s.border}`, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', borderLeft: `4px solid ${s.left}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: s.labelColor, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{s.label}</div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: s.valColor, lineHeight: 1 }}>{s.value}</div>
                  </div>
                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{s.icon}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Toolbar */}
          <div style={{ background: 'white', borderRadius: '10px', padding: '8px 12px', marginTop: '8px', border: '1.5px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => setShowCreateForm(true)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(59,130,246,0.3)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              + New Task
            </button>
            {success && <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>✓ {success}</span>}
            {error && <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: '600' }}>{error}</span>}
            <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#94a3b8' }}>Drag & drop cards to change status</span>
          </div>
        </div>

        {/* Split panel */}
        <div id="tasks-split-container" style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

          {/* Left: Create Form */}
          {showCreateForm && (
            <div style={{ flex: `0 0 ${panelWidth}%`, background: 'white', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
              {/* Form header */}
              <div style={{ background: 'linear-gradient(135deg, #172554 0%, #1e3a8a 100%)', flexShrink: 0, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>✅</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>New Task</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{selectedTemplate ? '⚡ Template Mode — Quick Create' : 'Fill in task details below'}</div>
                  </div>
                </div>
                <button onClick={() => { setShowCreateForm(false); resetForm(); }}
                  style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '7px', padding: '5px 9px', color: 'white', cursor: 'pointer', fontSize: '15px', lineHeight: 1 }}>✕</button>
              </div>

              {/* Form body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                <form onSubmit={handleCreate}>

                  {/* Template selector — always shown at top */}
                  {taskTemplates.length > 0 && (
                    <div style={{ marginBottom: '14px', padding: '10px 12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>⚡ Apply Template</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {taskTemplates.map(t => (
                          <button key={t._id} type="button"
                            onClick={() => {
                              setSelectedTemplate(t._id);
                              const dv = t.defaultValues || {};
                              const updates = {};
                              if (dv.subject) updates.subject = dv.subject;
                              if (dv.priority) updates.priority = dv.priority;
                              if (dv.status) updates.status = dv.status;
                              if (dv.description) updates.description = dv.description;
                              if (t.dueDateOffset) {
                                const d = new Date(); d.setDate(d.getDate() + Number(t.dueDateOffset));
                                updates.dueDate = d.toISOString().split('T')[0];
                              }
                              setFormData(prev => ({ ...prev, ...updates }));
                              templateService.useTemplate(t._id).catch(() => {});
                            }}
                            style={{ padding: '5px 12px', borderRadius: '99px', border: `2px solid ${selectedTemplate === t._id ? t.color : '#e2e8f0'}`,
                              background: selectedTemplate === t._id ? t.color + '18' : '#fff',
                              color: selectedTemplate === t._id ? t.color : '#64748b',
                              fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {t.icon} {t.name} {selectedTemplate === t._id && '✓'}
                          </button>
                        ))}
                        {selectedTemplate && (
                          <button type="button" onClick={() => { setSelectedTemplate(null); setFormData({ subject: '', dueDate: '', status: 'Not Started', priority: 'Normal', description: '' }); }}
                            style={{ padding: '5px 10px', borderRadius: '99px', border: '1px solid #fecaca', background: '#fee2e2', color: '#dc2626', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                            ✕ Clear
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedTemplate ? (() => {
                    // ── TEMPLATE QUICK-CREATE MODE ──
                    const appliedTemplate = taskTemplates.find(t => t._id === selectedTemplate);
                    const dv = appliedTemplate?.defaultValues || {};
                    const prefilledKeys = Object.keys(dv).filter(k => dv[k] !== '' && dv[k] != null);
                    if (appliedTemplate?.dueDateOffset) prefilledKeys.push('dueDate');
                    const labelMap = { subject: 'Subject', priority: 'Priority', status: 'Status', description: 'Description', dueDate: 'Due Date' };
                    const valueMap = { ...dv, ...(appliedTemplate?.dueDateOffset ? { dueDate: formData.dueDate } : {}) };
                    return (
                      <div>
                        {/* Template applied banner */}
                        <div style={{ marginBottom: '16px', padding: '10px 13px', background: `${appliedTemplate?.color || '#6366f1'}12`, border: `1.5px solid ${appliedTemplate?.color || '#6366f1'}40`, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ fontSize: '22px' }}>{appliedTemplate?.icon || '📋'}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: appliedTemplate?.color || '#6366f1' }}>{appliedTemplate?.name}</div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>{prefilledKeys.length} field{prefilledKeys.length !== 1 ? 's' : ''} pre-filled automatically</div>
                          </div>
                        </div>

                        {/* Required empty fields */}
                        {!formData.subject && (
                          <div style={{ marginBottom: '14px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Subject *</label>
                            <input type="text" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} required
                              placeholder="Enter task subject..."
                              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
                              onFocus={e => e.target.style.borderColor = '#3b82f6'}
                              onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                          </div>
                        )}
                        {!formData.dueDate && (
                          <div style={{ marginBottom: '14px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Due Date *</label>
                            <input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} required
                              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
                              onFocus={e => e.target.style.borderColor = '#3b82f6'}
                              onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                          </div>
                        )}

                        {/* Pre-filled preview */}
                        {prefilledKeys.length > 0 && (
                          <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
                            <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>📋 Pre-filled by template</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {prefilledKeys.map(key => (
                                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#fff', borderRadius: '7px', border: '1px solid #e2e8f0' }}>
                                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>{labelMap[key] || key}</span>
                                  <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '99px', background: `${appliedTemplate?.color || '#6366f1'}12`, color: appliedTemplate?.color || '#6366f1' }}>
                                    {String(valueMap[key])}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Related To always optional */}
                        <div style={{ marginBottom: '14px', background: '#f8fafc', borderRadius: '10px', padding: '12px', border: '1px solid #e2e8f0' }}>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>🔗 Related To (Optional)</label>
                          <select value={relatedToType} onChange={e => handleRelatedTypeChange(e.target.value)}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', background: '#fff', cursor: 'pointer', boxSizing: 'border-box', marginBottom: relatedToType ? '10px' : '0' }}>
                            <option value="">— No relation —</option>
                            <option value="Lead">Lead</option>
                            <option value="Contact">Contact</option>
                            <option value="Account">Account</option>
                          </select>
                          {relatedToType && (
                            <div style={{ position: 'relative' }}>
                              <input ref={relatedSearchRef} type="text" placeholder={`Search ${relatedToType}...`} value={relatedToSearch}
                                onChange={e => handleRelatedSearch(e.target.value)} onFocus={() => setShowRelatedDropdown(true)}
                                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1.5px solid ${relatedToId ? '#10b981' : '#e2e8f0'}`, fontSize: '13px', boxSizing: 'border-box', outline: 'none', background: relatedToId ? '#f0fdf4' : '#fff', fontFamily: 'inherit' }} />
                              {showRelatedDropdown && relatedToOptions.length > 0 && (
                                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 6px 20px rgba(0,0,0,0.12)', zIndex: 200, maxHeight: '180px', overflowY: 'auto', marginTop: '2px' }}>
                                  {relatedToOptions.map(opt => (
                                    <div key={opt._id} onClick={() => selectRelatedEntity(opt)}
                                      style={{ padding: '9px 12px', cursor: 'pointer', fontSize: '13px', color: '#374151', borderBottom: '1px solid #f1f5f9' }}
                                      onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                                      onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                      {opt.label}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Footer buttons */}
                        <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                          <button type="button" onClick={() => { setSelectedTemplate(null); setFormData({ subject: '', dueDate: '', status: 'Not Started', priority: 'Normal', description: '' }); }}
                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: 'white', color: '#374151', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                            ← Change
                          </button>
                          <button type="submit"
                            style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#059669 0%,#10b981 100%)', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }}>
                            ⚡ Create Task
                          </button>
                        </div>
                      </div>
                    );
                  })() : (
                    <>
                      {/* Subject */}
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Subject *</label>
                        <input type="text" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} required
                          placeholder="Enter task subject..."
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
                          onFocus={e => e.target.style.borderColor = '#3b82f6'}
                          onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                      </div>

                      {/* Due Date + Priority */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Due Date *</label>
                          <input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} required
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
                            onFocus={e => e.target.style.borderColor = '#3b82f6'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Priority</label>
                          <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', background: '#fff', cursor: 'pointer', boxSizing: 'border-box' }}>
                            <option value="High">🔴 High</option>
                            <option value="Normal">🔵 Normal</option>
                            <option value="Low">⚪ Low</option>
                          </select>
                        </div>
                      </div>

                      {/* Related To */}
                      <div style={{ marginBottom: '14px', background: '#f8fafc', borderRadius: '10px', padding: '12px', border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>🔗 Related To (Optional)</label>
                        <select value={relatedToType} onChange={e => handleRelatedTypeChange(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', background: '#fff', cursor: 'pointer', boxSizing: 'border-box', marginBottom: relatedToType ? '10px' : '0' }}>
                          <option value="">— No relation —</option>
                          <option value="Lead">Lead</option>
                          <option value="Contact">Contact</option>
                          <option value="Account">Account</option>
                        </select>

                        {relatedToType && (
                          <div style={{ position: 'relative' }}>
                            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>
                              <span>Select {relatedToType}</span>
                              {relatedToId && <span style={{ color: '#10b981', fontWeight: '700' }}>✓ Selected</span>}
                            </label>
                            <div style={{ position: 'relative' }}>
                              <input ref={relatedSearchRef} type="text"
                                placeholder={`Search ${relatedToType}...`}
                                value={relatedToSearch}
                                onChange={e => handleRelatedSearch(e.target.value)}
                                onFocus={() => setShowRelatedDropdown(true)}
                                style={{ width: '100%', padding: '8px 30px 8px 10px', borderRadius: '8px', border: `1.5px solid ${relatedToId ? '#10b981' : '#e2e8f0'}`, fontSize: '13px', boxSizing: 'border-box', outline: 'none', background: relatedToId ? '#f0fdf4' : '#fff', fontFamily: 'inherit' }} />
                              {relatedToSearching && <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: '#94a3b8' }}>⏳</span>}
                            </div>
                            {showRelatedDropdown && relatedToOptions.length > 0 && (
                              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 6px 20px rgba(0,0,0,0.12)', zIndex: 200, maxHeight: '180px', overflowY: 'auto', marginTop: '2px' }}>
                                {relatedToOptions.map(opt => (
                                  <div key={opt._id} onClick={() => selectRelatedEntity(opt)}
                                    style={{ padding: '9px 12px', cursor: 'pointer', fontSize: '13px', color: '#374151', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                    <span style={{ fontSize: '10px', background: '#dbeafe', color: '#1d4ed8', padding: '2px 6px', borderRadius: '4px', fontWeight: '700', flexShrink: 0 }}>{relatedToType[0]}</span>
                                    {opt.label}
                                  </div>
                                ))}
                              </div>
                            )}
                            {showRelatedDropdown && !relatedToSearching && relatedToOptions.length === 0 && (
                              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 200, padding: '14px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                                No {relatedToType.toLowerCase()}s found
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Description</label>
                        <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows="3"
                          placeholder="Add task details or notes..."
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', lineHeight: '1.5' }}
                          onFocus={e => e.target.style.borderColor = '#3b82f6'}
                          onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                      </div>

                      {/* Buttons */}
                      <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                        <button type="button" onClick={() => { setShowCreateForm(false); resetForm(); }}
                          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: 'white', color: '#374151', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                          Cancel
                        </button>
                        <button type="submit"
                          style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%)', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(59,130,246,0.3)' }}>
                          ✓ Create Task
                        </button>
                      </div>
                    </>
                  )}
                </form>
              </div>
            </div>
          )}

          {/* Divider */}
          {showCreateForm && (
            <div onMouseDown={handleDividerDrag} title="Drag to resize"
              style={{ width: '6px', flexShrink: 0, background: '#e2e8f0', cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s', zIndex: 10 }}
              onMouseEnter={e => e.currentTarget.style.background = '#93c5fd'}
              onMouseLeave={e => e.currentTarget.style.background = '#e2e8f0'}>
              <div style={{ width: '2px', height: '40px', borderRadius: '99px', background: 'rgba(0,0,0,0.15)' }} />
            </div>
          )}

          {/* Right: Kanban Board */}
          <div style={{ flex: showCreateForm ? `0 0 ${100 - panelWidth}%` : '1 1 100%', minWidth: 0, overflowY: 'auto', padding: '8px 16px 16px 12px' }}>
            <div style={{ display: 'flex', gap: '12px', minHeight: 'calc(100vh - 330px)', overflowX: 'auto', paddingBottom: '8px' }}>
              {statuses.map(status => {
                const statusTasks = getTasksByStatus(status.name);
                return (
                  <div key={status.name} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, status.name)}
                    style={{ minWidth: '230px', maxWidth: '230px', background: '#f8fafc', borderRadius: '12px', padding: '10px', display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    {/* Column header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: `2px solid ${status.color}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px' }}>{status.icon}</span>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#1e293b' }}>{status.name}</span>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: 'white', background: status.color, padding: '2px 7px', borderRadius: '10px' }}>{statusTasks.length}</span>
                    </div>
                    {/* Cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
                      {statusTasks.length === 0 ? (
                        <div style={{ padding: '20px 10px', textAlign: 'center', color: '#94a3b8', fontSize: '11px', border: '2px dashed #e2e8f0', borderRadius: '8px', background: 'white' }}>
                          Drop tasks here
                        </div>
                      ) : (
                        statusTasks.map(task => (
                          <div key={task._id} draggable onDragStart={(e) => handleDragStart(e, task)}
                            style={{ background: 'white', borderRadius: '10px', padding: '10px 11px', cursor: 'grab', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.14)'; e.currentTarget.style.borderColor = '#93c5fd'; }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                            {/* Priority bar */}
                            <div style={{ height: '3px', borderRadius: '2px', background: getPriorityColor(task.priority), marginBottom: '8px' }} />
                            <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px 0', lineHeight: '1.4' }}>{task.subject}</h4>
                            {task.relatedTo && task.relatedToId && (
                              <div style={{ fontSize: '10px', color: '#3b82f6', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px', background: '#eff6ff', padding: '3px 7px', borderRadius: '4px' }}>
                                <span style={{ fontWeight: '800' }}>{task.relatedTo[0]}</span>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {task.relatedToId.companyName || `${task.relatedToId.firstName||''} ${task.relatedToId.lastName||''}`.trim() || task.relatedToId.customerName || task.relatedToId.name || 'N/A'}
                                </span>
                              </div>
                            )}
                            {task.description && (
                              <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 8px 0', lineHeight: '1.4', maxHeight: '34px', overflow: 'hidden' }}>{task.description}</p>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '7px', borderTop: '1px solid #f1f5f9' }}>
                              <span style={{ fontSize: '10px', color: '#94a3b8' }}>📅 {formatDate(task.dueDate)}</span>
                              <span style={{ fontSize: '9px', fontWeight: '700', color: 'white', background: getPriorityColor(task.priority), padding: '2px 6px', borderRadius: '6px' }}>{task.priority}</span>
                            </div>
                            {task.createdBy && (
                              <div style={{ fontSize: '10px', color: '#3b82f6', fontWeight: '600', marginTop: '5px' }}>
                                👤 {task.createdBy.firstName} {task.createdBy.lastName}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Tasks;
