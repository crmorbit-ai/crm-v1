import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api.config';
import templateService from '../services/templateService';
import '../styles/crm.css';

const meetingsResponsiveCss = `
  @media (max-width: 768px) {
    .meetings-split-container { flex-direction: column !important; overflow: visible !important; }
    .meetings-form-panel { flex: none !important; width: 100% !important; max-height: none !important; border-right: none !important; border-bottom: 1px solid #e0e0e0 !important; }
    .meetings-divider { display: none !important; }
    .meetings-table-panel { flex: none !important; width: 100% !important; }
    .meetings-grid-2col { grid-template-columns: 1fr !important; }
  }
`;

const Meetings = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [panelWidth, setPanelWidth] = useState(38);

  const [formData, setFormData] = useState({
    title: '', from: '', to: '', location: '', meetingType: 'Online',
    relatedTo: '', relatedToId: '', description: '', participants: '', isIndependent: true
  });

  const [entitySearch, setEntitySearch] = useState('');
  const [entityResults, setEntityResults] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [meetingTemplates, setMeetingTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    loadMeetings();
    templateService.getTemplates('meeting').then(r => setMeetingTemplates(r?.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (formData.relatedTo && entitySearch && entitySearch.length >= 2) searchEntities();
    else setEntityResults([]);
  }, [entitySearch, formData.relatedTo]);

  const searchEntities = async () => {
    if (!formData.relatedTo || !entitySearch) return;
    try {
      setLoadingEntities(true);
      const endpoint = formData.relatedTo.toLowerCase() + 's';
      const response = await fetch(`${API_URL}/${endpoint}?search=${entitySearch}&limit=10`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) setEntityResults(data.data[endpoint] || []);
    } catch (err) { console.error('Entity search error:', err); }
    finally { setLoadingEntities(false); }
  };

  const handleEntitySelect = (entity) => {
    setSelectedEntity(entity);
    setFormData({ ...formData, relatedToId: entity._id });
    setEntitySearch(entity.companyName || `${entity.firstName||''} ${entity.lastName||''}`.trim() || entity.name || entity.title || 'Selected');
    setEntityResults([]);
  };

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/meetings?limit=100`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) setMeetings(data.data.meetings || []);
    } catch (err) {
      if (err?.isPermissionDenied) return;
      setError('Failed to load meetings');
    } finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.isIndependent && !formData.relatedToId) {
      setError('Please select a ' + formData.relatedTo);
      setTimeout(() => setError(''), 3000);
      return;
    }
    try {
      const submitData = { title: formData.title, from: formData.from, to: formData.to, location: formData.location, meetingType: formData.meetingType, description: formData.description };
      if (formData.isIndependent) {
        submitData.participants = formData.participants.split(',').map(e => e.trim()).filter(e => e.length > 0);
      } else {
        submitData.relatedTo = formData.relatedTo;
        submitData.relatedToId = formData.relatedToId;
      }
      const response = await fetch(`${API_URL}/meetings`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Meeting created & invites sent!');
        setShowCreateForm(false);
        resetForm();
        loadMeetings();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to create meeting');
        setTimeout(() => setError(''), 4000);
      }
    } catch (err) {
      if (err?.isPermissionDenied) return;
      setError('Failed to create meeting');
      setTimeout(() => setError(''), 4000);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', from: '', to: '', location: '', meetingType: 'Online', relatedTo: '', relatedToId: '', description: '', participants: '', isIndependent: true });
    setEntitySearch(''); setEntityResults([]); setSelectedEntity(null);
    setSelectedTemplate(null);
  };

  const handleDividerDrag = (e) => {
    e.preventDefault();
    const container = document.getElementById('meetings-split-container');
    if (!container) return;
    const startX = e.clientX, startW = panelWidth, cW = container.getBoundingClientRect().width;
    const onMove = (mv) => { const d = ((mv.clientX - startX) / cW) * 100; setPanelWidth(Math.max(25, Math.min(60, startW + d))); };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const formatDT = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const now = new Date();
  const upcoming = meetings.filter(m => new Date(m.from) > now).length;
  const today = meetings.filter(m => {
    const d = new Date(m.from);
    return d.toDateString() === now.toDateString();
  }).length;
  const online = meetings.filter(m => m.meetingType === 'Online').length;

  const statCards = [
    { label: 'Total Meetings', value: meetings.length,  icon: '📅' },
    { label: 'Upcoming',       value: upcoming,          icon: '⏰' },
    { label: 'Today',          value: today,             icon: '🗓️' },
    { label: 'Online',         value: online,            icon: '💻' },
  ];

  const STATUS_CFG = {
    Scheduled:  { color: '#7c3aed', bg: '#ede9fe' },
    Completed:  { color: '#059669', bg: '#d1fae5' },
    Cancelled:  { color: '#dc2626', bg: '#fee2e2' },
    'In Progress': { color: '#2563eb', bg: '#dbeafe' },
  };
  const statusBadge = (s) => {
    const c = STATUS_CFG[s] || { color: '#64748b', bg: '#f1f5f9' };
    return <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>{s || 'Scheduled'}</span>;
  };

  const thStyle = { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', background: '#f8fafc' };
  const tdStyle = { padding: '11px 14px', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' };

  if (loading) return (
    <DashboardLayout title="Meetings">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#8b5cf6', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: '#94a3b8', fontSize: '14px' }}>Loading Meetings...</span>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="Meetings">
      <style>{meetingsResponsiveCss}</style>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', overflow: 'hidden' }}>

        {/* Fixed top */}
        <div style={{ flexShrink: 0, padding: '0 16px 10px 16px' }}>
          {/* Header banner */}
          <div style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', borderRadius: '14px', padding: '16px 22px', marginBottom: '10px', border: '1px solid #ddd6fe', display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 4px 12px rgba(139,92,246,0.3)', flexShrink: 0 }}>📅</div>
              <div>
                <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#4c1d95' }}>Meetings</h1>
                <p style={{ margin: 0, fontSize: '12px', color: '#8b5cf6', fontWeight: '500', marginTop: '2px' }}>Schedule & manage meetings with leads and contacts</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="resp-grid-4">
            {statCards.map((s, i) => (
              <div key={i} style={{ background: '#f5f0ff', borderRadius: '12px', padding: '12px 16px', border: '1px solid #ddd6fe', boxShadow: '0 1px 6px rgba(139,92,246,0.08)', borderLeft: '4px solid #8b5cf6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#8b5cf6', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{s.label}</div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#4c1d95', lineHeight: 1 }}>{s.value}</div>
                  </div>
                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{s.icon}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div style={{ background: 'white', borderRadius: '10px', padding: '8px 12px', marginTop: '8px', border: '1.5px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => setShowCreateForm(true)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(139,92,246,0.3)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              + New Meeting
            </button>
            {success && <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>✓ {success}</span>}
            {error && <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: '600' }}>{error}</span>}
          </div>
        </div>

        {/* Split panel */}
        <div id="meetings-split-container" className="meetings-split-container" style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

          {/* Left: Create Form */}
          {showCreateForm && (
            <div className="meetings-form-panel" style={{ flex: `0 0 ${panelWidth}%`, background: 'white', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
              {/* Form header */}
              <div style={{ background: 'linear-gradient(135deg, #2e1065 0%, #4c1d95 100%)', flexShrink: 0, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg,#8b5cf6,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>📅</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>New Meeting</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{selectedTemplate ? '⚡ Template Mode — Quick Create' : 'Fill in meeting details below'}</div>
                  </div>
                </div>
                <button onClick={() => { setShowCreateForm(false); resetForm(); }}
                  style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '7px', padding: '5px 9px', color: 'white', cursor: 'pointer', fontSize: '15px', lineHeight: 1 }}>✕</button>
              </div>

              {/* Form body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                <form onSubmit={handleCreate}>

                  {/* Template selector */}
                  {meetingTemplates.length > 0 && (
                    <div style={{ marginBottom: '14px', padding: '10px 12px', background: '#faf5ff', borderRadius: '10px', border: '1px solid #e9d5ff' }}>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>⚡ Apply Template</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {meetingTemplates.map(t => (
                          <button key={t._id} type="button"
                            onClick={() => {
                              setSelectedTemplate(t._id);
                              const dv = t.defaultValues || {};
                              const updates = {};
                              if (dv.title) updates.title = dv.title;
                              if (dv.meetingType) updates.meetingType = dv.meetingType;
                              if (dv.location) updates.location = dv.location;
                              if (dv.description) updates.description = dv.description;
                              setFormData(prev => ({ ...prev, ...updates }));
                              templateService.useTemplate(t._id).catch(() => {});
                            }}
                            style={{ padding: '5px 12px', borderRadius: '99px', border: `2px solid ${selectedTemplate === t._id ? t.color : '#e2e8f0'}`, background: selectedTemplate === t._id ? t.color + '18' : '#fff', color: selectedTemplate === t._id ? t.color : '#64748b', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {t.icon} {t.name} {selectedTemplate === t._id && '✓'}
                          </button>
                        ))}
                        {selectedTemplate && (
                          <button type="button" onClick={() => { setSelectedTemplate(null); setFormData(p => ({ ...p, title: '', meetingType: 'Online', location: '', description: '' })); }}
                            style={{ padding: '5px 10px', borderRadius: '99px', border: '1px solid #fecaca', background: '#fee2e2', color: '#dc2626', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>✕ Clear</button>
                        )}
                      </div>
                      {selectedTemplate && (() => {
                        const t = meetingTemplates.find(x => x._id === selectedTemplate);
                        const keys = Object.keys(t?.defaultValues || {}).filter(k => t.defaultValues[k]);
                        return keys.length > 0 ? (
                          <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {keys.map(k => <span key={k} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '99px', background: t.color + '18', color: t.color, fontWeight: '700' }}>{k}: {String(t.defaultValues[k]).substring(0, 25)}</span>)}
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}

                  {/* Title */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Title *</label>
                    <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required
                      placeholder="Meeting title..."
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
                      onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                  </div>

                  {/* From + To */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>From *</label>
                      <input type="datetime-local" value={formData.from} onChange={e => setFormData({...formData, from: e.target.value})} required
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '12px', boxSizing: 'border-box', outline: 'none' }}
                        onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>To *</label>
                      <input type="datetime-local" value={formData.to} onChange={e => setFormData({...formData, to: e.target.value})} required
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '12px', boxSizing: 'border-box', outline: 'none' }}
                        onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                    </div>
                  </div>

                  {/* Location + Type */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Location</label>
                      <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
                        placeholder="Room / Link..."
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
                        onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Type</label>
                      <select value={formData.meetingType} onChange={e => setFormData({...formData, meetingType: e.target.value})}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', background: '#fff', cursor: 'pointer', boxSizing: 'border-box' }}>
                        <option value="Online">💻 Online</option>
                        <option value="In-Person">🤝 In-Person</option>
                        <option value="Phone Call">📞 Phone Call</option>
                      </select>
                    </div>
                  </div>

                  {/* Independent toggle */}
                  <div style={{ marginBottom: '12px', background: '#f8fafc', borderRadius: '10px', padding: '10px 12px', border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <div onClick={() => setFormData({...formData, isIndependent: !formData.isIndependent, relatedTo: !formData.isIndependent ? '' : 'Lead', relatedToId: ''})}
                        style={{ width: '36px', height: '20px', borderRadius: '10px', background: formData.isIndependent ? '#8b5cf6' : '#e2e8f0', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                        <div style={{ position: 'absolute', top: '2px', left: formData.isIndependent ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#374151' }}>Independent Meeting</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>Not linked to a Lead / Contact</div>
                      </div>
                    </label>
                  </div>

                  {/* Participants or Related To */}
                  {formData.isIndependent ? (
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Participant Email(s) *</label>
                      <input type="text" value={formData.participants} onChange={e => setFormData({...formData, participants: e.target.value})} required
                        placeholder="email1@example.com, email2@example.com"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
                        onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>Separate multiple emails with commas</div>
                    </div>
                  ) : (
                    <div style={{ marginBottom: '12px', background: '#f8fafc', borderRadius: '10px', padding: '12px', border: '1px solid #e2e8f0' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#4c1d95', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>🔗 Link to Entity *</label>
                      <select value={formData.relatedTo} onChange={e => { setFormData({...formData, relatedTo: e.target.value, relatedToId: ''}); setEntitySearch(''); setSelectedEntity(null); setEntityResults([]); }} required
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', background: '#fff', cursor: 'pointer', boxSizing: 'border-box', marginBottom: '8px' }}>
                        <option value="">Select type...</option>
                        <option value="Lead">Lead</option>
                        <option value="Contact">Contact</option>
                        <option value="Account">Account</option>
                        <option value="Opportunity">Opportunity</option>
                      </select>
                      {formData.relatedTo && (
                        <div style={{ position: 'relative' }}>
                          <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>
                            <span>Search {formData.relatedTo}</span>
                            {selectedEntity && <span style={{ color: '#10b981', fontWeight: '700' }}>✓ Selected</span>}
                          </label>
                          <input type="text" value={entitySearch} onChange={e => setEntitySearch(e.target.value)}
                            placeholder={`Type to search ${formData.relatedTo}...`}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1.5px solid ${selectedEntity ? '#10b981' : '#e2e8f0'}`, fontSize: '13px', boxSizing: 'border-box', outline: 'none', background: selectedEntity ? '#f0fdf4' : '#fff', fontFamily: 'inherit' }}
                            onFocus={e => e.target.style.borderColor = selectedEntity ? '#10b981' : '#8b5cf6'}
                            onBlur={e => e.target.style.borderColor = selectedEntity ? '#10b981' : '#e2e8f0'} />
                          {loadingEntities && <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', display: 'block' }}>Searching...</span>}
                          {entityResults.length > 0 && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 6px 20px rgba(0,0,0,0.12)', zIndex: 200, maxHeight: '160px', overflowY: 'auto', marginTop: '2px' }}>
                              {entityResults.map(entity => {
                                const name = entity.companyName || `${entity.firstName||''} ${entity.lastName||''}`.trim() || entity.name || entity.title;
                                return (
                                  <div key={entity._id} onClick={() => handleEntitySelect(entity)}
                                    style={{ padding: '9px 12px', cursor: 'pointer', fontSize: '13px', color: '#374151', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f5f3ff'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                    <span style={{ fontSize: '10px', background: '#ede9fe', color: '#7c3aed', padding: '2px 6px', borderRadius: '4px', fontWeight: '700', flexShrink: 0 }}>{formData.relatedTo[0]}</span>
                                    {name}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Description</label>
                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows="3"
                      placeholder="Meeting agenda or notes..."
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', lineHeight: '1.5' }}
                      onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                  </div>

                  {/* Buttons */}
                  <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                    <button type="button" onClick={() => { setShowCreateForm(false); resetForm(); }}
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: 'white', color: '#374151', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button type="submit"
                      style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#4c1d95 0%,#8b5cf6 100%)', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(139,92,246,0.3)' }}>
                      📅 Create & Send Invites
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Divider */}
          {showCreateForm && (
            <div onMouseDown={handleDividerDrag} title="Drag to resize"
              style={{ width: '6px', flexShrink: 0, background: '#e2e8f0', cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s', zIndex: 10 }}
              onMouseEnter={e => e.currentTarget.style.background = '#c4b5fd'}
              onMouseLeave={e => e.currentTarget.style.background = '#e2e8f0'}>
              <div style={{ width: '2px', height: '40px', borderRadius: '99px', background: 'rgba(0,0,0,0.15)' }} />
            </div>
          )}

          {/* Right: Meetings Table */}
          <div style={{ flex: showCreateForm ? `0 0 ${100 - panelWidth}%` : '1 1 100%', minWidth: 0, overflowY: 'auto', padding: '0 16px 16px 12px' }}>
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              {meetings.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '42px', marginBottom: '10px' }}>📅</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>No meetings found</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Click "+ New Meeting" to schedule your first one</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                        {['Title','From','To','Type','Related To','Host','Status','Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {meetings.map(meeting => (
                        <tr key={meeting._id} style={{ transition: 'background 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#faf7ff'}
                          onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                          <td style={tdStyle}>
                            <span onClick={() => navigate(`/meetings/${meeting._id}`)}
                              style={{ color: '#7c3aed', fontWeight: '700', cursor: 'pointer', textDecoration: 'none' }}>
                              {meeting.title}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, color: '#64748b', whiteSpace: 'nowrap', fontSize: '12px' }}>{formatDT(meeting.from)}</td>
                          <td style={{ ...tdStyle, color: '#64748b', whiteSpace: 'nowrap', fontSize: '12px' }}>{formatDT(meeting.to)}</td>
                          <td style={tdStyle}>
                            <span style={{ fontSize: '11px', background: '#f5f3ff', color: '#7c3aed', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
                              {meeting.meetingType === 'Online' ? '💻' : meeting.meetingType === 'In-Person' ? '🤝' : '📞'} {meeting.meetingType}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            {meeting.relatedTo ? (
                              <span style={{ fontSize: '11px', background: '#ede9fe', color: '#7c3aed', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>{meeting.relatedTo}</span>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '11px' }}>Independent ({meeting.participants?.length || 0} participants)</span>
                            )}
                          </td>
                          <td style={tdStyle}>
                            {meeting.host ? (
                              <div>
                                <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '12px' }}>{meeting.host.firstName} {meeting.host.lastName}</div>
                              </div>
                            ) : '—'}
                          </td>
                          <td style={tdStyle}>{statusBadge(meeting.status)}</td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <button onClick={() => navigate(`/meetings/${meeting._id}`)} title="View"
                                style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '13px' }}>👁️</button>
                              {meeting.meetingLink && (
                                <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer"
                                  style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #ddd6fe', background: '#f5f3ff', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }} title="Join">🔗</a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {meetings.length > 0 && (
                <div style={{ padding: '10px 14px', borderTop: '1px solid #f8fafc', background: '#faf7ff' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>Showing <strong style={{ color: '#374151' }}>{meetings.length}</strong> meeting{meetings.length !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Meetings;
