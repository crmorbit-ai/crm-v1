import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import templateService from '../services/templateService';

const MODULE_CONFIG = {
  lead: {
    label: 'Lead Templates', shortLabel: 'Leads', icon: '🧲', color: '#2563eb', bg: '#eff6ff',
    fields: [
      { key: 'leadSource', label: 'Lead Source', type: 'select', options: ['Website','Social Media','Referral','Campaign','Cold Call','Other'] },
      { key: 'leadType', label: 'Lead Type', type: 'select', options: ['Inbound','Outbound'] },
      { key: 'leadStatus', label: 'Lead Status', type: 'select', options: ['New','Contacted','Qualified','Unqualified','Lost','Converted'] },
      { key: 'priority', label: 'Priority', type: 'select', options: ['High','Medium','Low'] },
      { key: 'qualificationStatus', label: 'Qualification Status', type: 'select', options: ['Unqualified','In Progress','Qualified'] },
      { key: 'customerType', label: 'Customer Type', type: 'select', options: ['Customer','Prospect','Partner','Reseller','Other'] },
      { key: 'campaign', label: 'Campaign', type: 'text' },
      { key: 'industry', label: 'Industry', type: 'text' },
      { key: 'region', label: 'Region', type: 'text' },
      { key: 'description', label: 'Description / Notes', type: 'textarea' },
    ]
  },
  task: {
    label: 'Task Templates', shortLabel: 'Tasks', icon: '📋', color: '#7c3aed', bg: '#f5f3ff',
    fields: [
      { key: 'subject', label: 'Subject', type: 'text' },
      { key: 'priority', label: 'Priority', type: 'select', options: ['High','Normal','Low'] },
      { key: 'status', label: 'Status', type: 'select', options: ['Not Started','In Progress','Waiting on someone else','Deferred'] },
      { key: 'dueDateOffset', label: 'Due Date (days from today)', type: 'number' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ]
  },
  quotation: {
    label: 'Quotation Templates', shortLabel: 'Quotations', icon: '📄', color: '#d97706', bg: '#fffbeb',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'terms', label: 'Terms & Conditions', type: 'textarea' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
      { key: 'expiryDays', label: 'Expiry (days from today)', type: 'number' },
    ]
  },
  rfi: {
    label: 'RFI Templates', shortLabel: 'RFI', icon: '🔍', color: '#0891b2', bg: '#ecfeff',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'priority', label: 'Priority', type: 'select', options: ['low','medium','high','urgent'] },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ]
  },
  meeting: {
    label: 'Meeting Templates', shortLabel: 'Meetings', icon: '📅', color: '#059669', bg: '#ecfdf5',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'meetingType', label: 'Meeting Type', type: 'select', options: ['Online','In-Person','Phone Call'] },
      { key: 'location', label: 'Location / Link', type: 'text' },
      { key: 'description', label: 'Agenda / Description', type: 'textarea' },
      { key: 'durationMinutes', label: 'Duration (minutes)', type: 'number' },
    ]
  },
  purchase_order: {
    label: 'Purchase Order Templates', shortLabel: 'Purchase Orders', icon: '🧾', color: '#7c3aed', bg: '#f5f3ff',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'paymentTerms', label: 'Payment Terms', type: 'textarea' },
      { key: 'terms', label: 'Terms & Conditions', type: 'textarea' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
      { key: 'deliveryDays', label: 'Delivery (days from today)', type: 'number' },
    ]
  },
  invoice: {
    label: 'Invoice Templates', shortLabel: 'Invoices', icon: '💰', color: '#dc2626', bg: '#fef2f2',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'terms', label: 'Terms & Conditions', type: 'textarea' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
      { key: 'dueDays', label: 'Due Date (days from today)', type: 'number' },
    ]
  },
  email: {
    label: 'Email Templates', shortLabel: 'Emails', icon: '✉️', color: '#db2777', bg: '#fdf2f8',
    fields: [
      { key: 'subject', label: 'Subject', type: 'text' },
      { key: 'message', label: 'Message Body', type: 'textarea' },
    ]
  },
};

const ICONS = ['📋','🎯','🧲','💼','📄','📞','🚀','⭐','🔥','💡','🏆','📊','🤝','💰','📅','✉️','🔍','🧾','⚡','🎪'];
const COLORS = ['#6366f1','#2563eb','#7c3aed','#d97706','#16a34a','#dc2626','#0891b2','#db2777','#ea580c','#65a30d','#0f766e','#b45309'];

const emptyForm = (module) => ({
  name: '', description: '', purpose: '', module,
  icon: MODULE_CONFIG[module]?.icon || '📋',
  color: MODULE_CONFIG[module]?.color || '#6366f1',
  defaultValues: {}, dueDateOffset: ''
});

export default function TemplateManagement() {
  const [activeModule, setActiveModule] = useState('lead');
  const [templates, setTemplates] = useState([]);
  const [allCounts, setAllCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm('lead'));
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { loadTemplates(); }, [activeModule]);

  useEffect(() => {
    // Load counts for all modules for the stats bar
    Promise.all(
      Object.keys(MODULE_CONFIG).map(mod =>
        templateService.getTemplates(mod).then(r => ({ mod, count: (r?.data || []).length })).catch(() => ({ mod, count: 0 }))
      )
    ).then(results => {
      const counts = {};
      results.forEach(r => { counts[r.mod] = r.count; });
      setAllCounts(counts);
    });
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await templateService.getTemplates(activeModule);
      setTemplates(res?.data || []);
    } catch { setTemplates([]); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setForm(emptyForm(activeModule));
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (t) => {
    setForm({
      name: t.name, description: t.description || '', purpose: t.purpose || '',
      module: t.module, icon: t.icon, color: t.color,
      defaultValues: { ...t.defaultValues },
      dueDateOffset: t.dueDateOffset || ''
    });
    setEditingId(t._id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return alert('Template name is required');
    setSaving(true);
    try {
      const payload = { ...form };
      if (form.dueDateOffset !== '') payload.dueDateOffset = Number(form.dueDateOffset);
      else payload.dueDateOffset = null;

      if (editingId) await templateService.updateTemplate(editingId, payload);
      else await templateService.createTemplate(payload);
      setShowForm(false);
      loadTemplates();
      // Refresh counts
      const res = await templateService.getTemplates(activeModule);
      setAllCounts(prev => ({ ...prev, [activeModule]: (res?.data || []).length }));
    } catch (err) { alert('Failed to save template'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await templateService.deleteTemplate(id);
      setDeleteId(null);
      loadTemplates();
      setAllCounts(prev => ({ ...prev, [activeModule]: Math.max(0, (prev[activeModule] || 1) - 1) }));
    } catch { alert('Failed to delete'); }
  };

  const setFieldValue = (key, val) => {
    setForm(prev => ({ ...prev, defaultValues: { ...prev.defaultValues, [key]: val } }));
  };

  const cfg = MODULE_CONFIG[activeModule];
  const totalTemplates = Object.values(allCounts).reduce((a, b) => a + b, 0);
  const filteredTemplates = templates.filter(t =>
    !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || (t.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout title="Template Management">
      <style>{`
        @keyframes slideInLeft { from { opacity:0; transform:translateX(-24px); } to { opacity:1; transform:translateX(0); } }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .tm-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.10) !important; }
        .tm-card { transition: all 0.2s ease; }
        .tm-module-btn:hover { transform: translateX(3px); }
        .tm-module-btn { transition: all 0.15s ease; }
        .tm-action-btn:hover { opacity: 0.85; transform: scale(0.97); }
        .tm-action-btn { transition: all 0.15s ease; }
        .tm-grid { display: grid; gap: 16px; align-items: flex-start; }
        @media (min-width: 1024px) {
          .tm-grid-2col { grid-template-columns: 200px 1fr; }
          .tm-grid-3col { grid-template-columns: 200px 360px 1fr; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .tm-grid-2col { grid-template-columns: 180px 1fr; }
          .tm-grid-3col { grid-template-columns: 1fr; }
          .tm-form-mobile { order: -1; }
        }
        @media (max-width: 767px) {
          .tm-grid-2col { grid-template-columns: 1fr; }
          .tm-grid-3col { grid-template-columns: 1fr; }
          .tm-sidebar-mobile { display: flex; flex-wrap: wrap; gap: 6px; }
          .tm-sidebar-mobile button { flex: 1 1 auto; min-width: 100px; }
          .tm-hero-stats { flex-direction: column; gap: 8px; }
          .tm-stats-row { flex-wrap: wrap; }
          .tm-icon-color-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Top Hero Bar ── */}
      <div style={{ background:'linear-gradient(135deg, rgb(18,80,227) 0%, rgb(88,102,125) 50%, rgb(0,0,0) 100%)', borderRadius:'16px', padding:'24px 28px', marginBottom:'20px', position:'relative', overflow:'hidden' }}>
        {/* Decorative blobs */}
        <div style={{ position:'absolute', top:'-30px', right:'-30px', width:'160px', height:'160px', borderRadius:'50%', background:'rgba(99,102,241,0.15)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-20px', right:'180px', width:'100px', height:'100px', borderRadius:'50%', background:'rgba(139,92,246,0.10)', pointerEvents:'none' }} />

        <div className="tm-stats-row" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'16px', position:'relative' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>⚡</div>
              <h2 style={{ margin:0, fontSize:'20px', fontWeight:'800', color:'#fff', letterSpacing:'-0.3px' }}>Template Library</h2>
            </div>
            <p style={{ margin:0, fontSize:'13px', color:'rgba(255,255,255,0.55)' }}>Create reusable templates to speed up your workflow across all modules</p>
          </div>
          {/* Stats pills */}
          <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
            <div style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'12px', padding:'10px 18px', textAlign:'center' }}>
              <div style={{ fontSize:'22px', fontWeight:'800', color:'#fff', lineHeight:1 }}>{totalTemplates}</div>
              <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.45)', marginTop:'2px' }}>Total Templates</div>
            </div>
            <div style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'12px', padding:'10px 18px', textAlign:'center' }}>
              <div style={{ fontSize:'22px', fontWeight:'800', color:'#fff', lineHeight:1 }}>{Object.keys(MODULE_CONFIG).length}</div>
              <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.45)', marginTop:'2px' }}>Modules</div>
            </div>
            <div style={{ background:`linear-gradient(135deg, ${cfg.color}cc, ${cfg.color})`, border:'none', borderRadius:'12px', padding:'10px 18px', textAlign:'center' }}>
              <div style={{ fontSize:'22px', fontWeight:'800', color:'#fff', lineHeight:1 }}>{templates.length}</div>
              <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.75)', marginTop:'2px' }}>Active: {cfg.shortLabel}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Big Search Bar (below hero box) ── */}
      <div style={{ position:'relative', marginBottom:'20px' }}>
        <span style={{ position:'absolute', left:'18px', top:'50%', transform:'translateY(-50%)', fontSize:'16px', color:'#94a3b8', pointerEvents:'none' }}>🔍</span>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search templates by name or description..."
          style={{ width:'100%', padding:'13px 18px 13px 48px', fontSize:'14px', borderRadius:'12px', border:'1.5px solid #e2e8f0', background:'#fff', color:'#0f172a', outline:'none', boxSizing:'border-box', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')}
            style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:'6px', color:'#64748b', cursor:'pointer', padding:'3px 8px', fontSize:'12px' }}>
            ✕
          </button>
        )}
      </div>

      {/* ── Main 3-column layout ── */}
      <div className={`tm-grid ${showForm ? 'tm-grid-3col' : 'tm-grid-2col'}`}>

        {/* ── Column 1: Module Sidebar ── */}
        <div style={{ background:'#fff', borderRadius:'14px', border:'1px solid #e5e7eb', overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.05)' }}>
          {/* New Template button at TOP */}
          <div style={{ padding:'12px 10px 8px' }}>
            <button onClick={openCreate} className="tm-action-btn"
              style={{ width:'100%', padding:'10px', background:'linear-gradient(135deg,#1252e3,#0f172a)', color:'#fff', border:'none', borderRadius:'10px', fontSize:'13px', fontWeight:'700', cursor:'pointer', boxShadow:'0 4px 14px rgba(18,82,227,0.35)', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
              <span style={{ fontSize:'16px', lineHeight:1 }}>+</span> New Template
            </button>
          </div>
          <div style={{ padding:'4px 10px 8px', borderBottom:'1px solid #f1f5f9' }}>
            <div style={{ fontSize:'10px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.8px' }}>Modules</div>
          </div>
          <div className="tm-sidebar-mobile" style={{ padding:'8px' }}>
            {Object.entries(MODULE_CONFIG).map(([mod, c]) => {
              const isActive = activeModule === mod;
              const count = allCounts[mod] || 0;
              return (
                <button key={mod} className="tm-module-btn"
                  onClick={() => { setActiveModule(mod); setShowForm(false); }}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:'10px', padding:'9px 10px', borderRadius:'9px', border:'none', cursor:'pointer', marginBottom:'2px', textAlign:'left',
                    background: isActive ? c.color : 'transparent',
                    color: isActive ? '#fff' : '#374151' }}>
                  <span style={{ fontSize:'16px', flexShrink:0 }}>{c.icon}</span>
                  <span style={{ flex:1, fontSize:'12px', fontWeight: isActive ? '700' : '500', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.shortLabel}</span>
                  {count > 0 && (
                    <span style={{ fontSize:'10px', fontWeight:'700', padding:'1px 6px', borderRadius:'99px',
                      background: isActive ? 'rgba(255,255,255,0.25)' : c.color+'18',
                      color: isActive ? '#fff' : c.color }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Column 2: Form (LEFT of list, only when open) ── */}
        {showForm && (
          <div key="form-panel" style={{ background:'#fff', borderRadius:'14px', border:`2px solid ${cfg.color}33`, overflow:'hidden', boxShadow:`0 4px 24px ${cfg.color}22`, animation:'slideInLeft 0.22s ease' }}>
            {/* Form header */}
            <div style={{ padding:'16px 18px', background:`linear-gradient(135deg, ${cfg.color}f0, ${cfg.color}cc)`, display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'2px' }}>
                  <div style={{ width:'28px', height:'28px', borderRadius:'7px', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px' }}>
                    {form.icon}
                  </div>
                  <div style={{ fontSize:'14px', fontWeight:'800', color:'#fff' }}>{editingId ? 'Edit Template' : 'New Template'}</div>
                </div>
                <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.65)' }}>
                  {cfg.shortLabel} · Configure default field values
                </div>
              </div>
              <button onClick={() => setShowForm(false)} className="tm-action-btn"
                style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'7px', color:'#fff', cursor:'pointer', padding:'5px 9px', fontSize:'14px', lineHeight:1 }}>
                ✕
              </button>
            </div>

            <div style={{ padding:'18px', overflowY:'auto', maxHeight:'72vh', display:'flex', flexDirection:'column', gap:'16px' }}>
              {/* Name */}
              <div>
                <label style={labelStyle}>Template Name *</label>
                <input value={form.name} onChange={e => setForm(p=>({...p, name:e.target.value}))}
                  placeholder="e.g. Marketing Campaign Lead"
                  style={{ ...inputStyle, borderColor: form.name ? cfg.color+'66' : '#e2e8f0' }} />
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Description</label>
                <textarea value={form.description} onChange={e => setForm(p=>({...p, description:e.target.value}))}
                  rows={2} placeholder="What is this template for?"
                  style={{ ...inputStyle, resize:'vertical' }} />
              </div>

              {/* Purpose */}
              <div>
                <label style={labelStyle}>Purpose</label>
                <input value={form.purpose} onChange={e => setForm(p=>({...p, purpose:e.target.value}))}
                  placeholder="e.g. Used by sales team to quickly create qualified leads from cold calls"
                  style={{ ...inputStyle }} />
              </div>

              {/* Icon + Color row */}
              <div className="tm-icon-color-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
                <div>
                  <label style={labelStyle}>Icon</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                    {ICONS.map(ic => (
                      <button key={ic} onClick={() => setForm(p=>({...p, icon:ic}))} type="button"
                        style={{ width:'30px', height:'30px', borderRadius:'7px', cursor:'pointer', fontSize:'15px', border:'none',
                          background: form.icon===ic ? cfg.color : '#f1f5f9',
                          boxShadow: form.icon===ic ? `0 2px 8px ${cfg.color}55` : 'none',
                          transform: form.icon===ic ? 'scale(1.12)' : 'scale(1)',
                          transition:'all 0.15s' }}>
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Color</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'7px' }}>
                    {COLORS.map(cl => (
                      <button key={cl} onClick={() => setForm(p=>({...p, color:cl}))} type="button"
                        style={{ width:'26px', height:'26px', borderRadius:'50%', background:cl, cursor:'pointer', border:'none',
                          boxShadow: form.color===cl ? `0 0 0 3px #fff, 0 0 0 5px ${cl}` : `0 1px 4px ${cl}66`,
                          transform: form.color===cl ? 'scale(1.15)' : 'scale(1)',
                          transition:'all 0.15s' }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview chip */}
              <div style={{ padding:'10px 14px', borderRadius:'10px', background: cfg.bg, border:`1px solid ${cfg.color}22`, display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:form.color+'20', border:`1px solid ${form.color}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'17px', flexShrink:0 }}>
                  {form.icon}
                </div>
                <div>
                  <div style={{ fontSize:'12px', fontWeight:'700', color:'#0f172a' }}>{form.name || 'Template Preview'}</div>
                  <div style={{ fontSize:'11px', color:'#64748b' }}>{cfg.shortLabel} · {Object.values(form.defaultValues).filter(Boolean).length} field{Object.values(form.defaultValues).filter(Boolean).length !== 1 ? 's' : ''} preset</div>
                </div>
                <div style={{ marginLeft:'auto', width:'10px', height:'10px', borderRadius:'50%', background:form.color, boxShadow:`0 0 6px ${form.color}` }} />
              </div>

              {/* Divider */}
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ flex:1, height:'1px', background:'#f1f5f9' }} />
                <span style={{ fontSize:'10px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px', whiteSpace:'nowrap' }}>Default Field Values</span>
                <div style={{ flex:1, height:'1px', background:'#f1f5f9' }} />
              </div>

              {/* Dynamic fields */}
              <div style={{ display:'flex', flexDirection:'column', gap:'11px' }}>
                {cfg.fields.map(f => (
                  <div key={f.key}>
                    <label style={{ ...labelStyle, color:'#475569' }}>{f.label}</label>
                    {f.type === 'select' ? (
                      <select value={form.defaultValues[f.key] || ''} onChange={e => setFieldValue(f.key, e.target.value)}
                        style={{ ...inputStyle, background:'#f8fafc' }}>
                        <option value="">— not set —</option>
                        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : f.type === 'textarea' ? (
                      <textarea value={form.defaultValues[f.key] || ''} onChange={e => setFieldValue(f.key, e.target.value)}
                        rows={2} placeholder={`Default ${f.label.toLowerCase()}...`}
                        style={{ ...inputStyle, resize:'vertical', background:'#f8fafc' }} />
                    ) : f.type === 'number' ? (
                      <input type="number" min="0"
                        value={f.key === 'dueDateOffset' ? form.dueDateOffset : (form.defaultValues[f.key] || '')}
                        onChange={e => {
                          if (f.key === 'dueDateOffset') setForm(p=>({...p, dueDateOffset: e.target.value}));
                          else setFieldValue(f.key, e.target.value);
                        }}
                        placeholder="e.g. 3"
                        style={{ ...inputStyle, background:'#f8fafc' }} />
                    ) : (
                      <input type="text" value={form.defaultValues[f.key] || ''} onChange={e => setFieldValue(f.key, e.target.value)}
                        placeholder={`Default ${f.label.toLowerCase()}...`}
                        style={{ ...inputStyle, background:'#f8fafc' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding:'14px 18px', borderTop:`1px solid ${cfg.color}18`, background: cfg.bg, display:'flex', gap:'10px' }}>
              <button onClick={handleSave} disabled={saving} className="tm-action-btn"
                style={{ flex:1, padding:'10px', background: saving ? '#94a3b8' : `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)`, color:'#fff', border:'none', borderRadius:'9px', fontSize:'13px', fontWeight:'700', cursor:'pointer', boxShadow: saving ? 'none' : `0 4px 14px ${cfg.color}44` }}>
                {saving ? '⏳ Saving...' : editingId ? '✓ Save Changes' : '✦ Create Template'}
              </button>
              <button onClick={() => setShowForm(false)} className="tm-action-btn"
                style={{ padding:'10px 16px', background:'#fff', color:'#374151', border:'1px solid #e2e8f0', borderRadius:'9px', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Column 3 (or 2): Template List ── */}
        <div style={{ minWidth:0 }}>
          {/* List header */}
          <div style={{ background:'#fff', borderRadius:'14px', border:'1px solid #e5e7eb', padding:'14px 18px', marginBottom:'12px', display:'flex', alignItems:'center', gap:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ width:'40px', height:'40px', borderRadius:'11px', background:'#f1f5f9', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>
              {cfg.icon}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <h3 style={{ margin:0, fontSize:'15px', fontWeight:'800', color:'#0f172a' }}>{cfg.label}</h3>
              <p style={{ margin:'2px 0 0', fontSize:'12px', color:'#94a3b8' }}>
                {templates.length} template{templates.length!==1?'s':''}{searchQuery ? ` · "${searchQuery}"` : ''}
              </p>
            </div>
          </div>

          {/* Template cards */}
          {loading ? (
            <div style={{ padding:'60px', textAlign:'center', background:'#fff', borderRadius:'14px', border:'1px solid #e5e7eb' }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'50%', border:`3px solid ${cfg.color}`, borderTopColor:'transparent', margin:'0 auto 12px', animation:'spin 0.8s linear infinite' }} />
              <p style={{ margin:0, fontSize:'13px', color:'#94a3b8' }}>Loading templates...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div style={{ padding:'60px 40px', textAlign:'center', background:'#fff', borderRadius:'14px', border:'2px dashed #e2e8f0' }}>
              <div style={{ width:'64px', height:'64px', borderRadius:'16px', background:'#f1f5f9', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', margin:'0 auto 14px' }}>
                {cfg.icon}
              </div>
              <p style={{ fontSize:'15px', fontWeight:'700', color:'#0f172a', margin:'0 0 6px' }}>
                {searchQuery ? 'No results found' : `No ${cfg.shortLabel} Templates Yet`}
              </p>
              <p style={{ fontSize:'13px', color:'#94a3b8', margin:'0 0 20px' }}>
                {searchQuery ? 'Try a different search term' : `Create your first ${activeModule} template to speed up record creation`}
              </p>
              {!searchQuery && (
                <button onClick={openCreate} className="tm-action-btn"
                  style={{ padding:'10px 24px', background:'linear-gradient(135deg,#1e293b,#0f172a)', color:'#fff', border:'none', borderRadius:'9px', fontSize:'13px', fontWeight:'700', cursor:'pointer', boxShadow:'0 4px 14px rgba(15,23,42,0.22)' }}>
                  Create First Template
                </button>
              )}
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'12px' }}>
              {filteredTemplates.map((t, idx) => {
                const presetCount = Object.keys(t.defaultValues || {}).filter(k => t.defaultValues[k]).length;
                return (
                  <div key={t._id} className="tm-card"
                    style={{ background:'#fff', borderRadius:'14px', border:'1px solid #e8ecf0', overflow:'hidden', boxShadow:'0 1px 6px rgba(15,23,42,0.06)', animation:`fadeInUp 0.2s ease ${idx * 0.04}s both` }}>
                    <div style={{ padding:'18px' }}>
                      {/* Card top row */}
                      <div style={{ display:'flex', alignItems:'flex-start', gap:'12px', marginBottom:'14px' }}>
                        <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:'#f1f5f9', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>
                          {t.icon}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:'14px', fontWeight:'700', color:'#0f172a', marginBottom:'3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.name}</div>
                          {t.description ? (
                            <p style={{ margin:0, fontSize:'12px', color:'#64748b', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{t.description}</p>
                          ) : (
                            <p style={{ margin:0, fontSize:'12px', color:'#cbd5e1', fontStyle:'italic' }}>No description</p>
                          )}
                        </div>
                      </div>

                      {/* Tags row */}
                      <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'14px' }}>
                        <span style={{ fontSize:'11px', fontWeight:'600', padding:'3px 10px', borderRadius:'5px', background:'#f1f5f9', color:'#475569', border:'1px solid #e2e8f0' }}>
                          {presetCount} field{presetCount!==1?'s':''} preset
                        </span>
                        {t.usageCount > 0 && (
                          <span style={{ fontSize:'11px', fontWeight:'600', padding:'3px 10px', borderRadius:'5px', background:'#f1f5f9', color:'#64748b', border:'1px solid #e2e8f0' }}>
                            Used {t.usageCount}×
                          </span>
                        )}
                        {(t.dueDateOffset || t.defaultValues?.expiryDays || t.defaultValues?.deliveryDays || t.defaultValues?.dueDays || t.defaultValues?.durationMinutes) && (
                          <span style={{ fontSize:'11px', fontWeight:'600', padding:'3px 10px', borderRadius:'5px', background:'#f8fafc', color:'#64748b', border:'1px solid #e2e8f0' }}>
                            ⏰ Timing set
                          </span>
                        )}
                      </div>

                      {/* Preset values preview */}
                      {presetCount > 0 && (
                        <div style={{ padding:'8px 10px', borderRadius:'8px', background:'#f8fafc', border:'1px solid #f1f5f9', marginBottom:'14px' }}>
                          <div style={{ fontSize:'10px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'6px' }}>Preset Values</div>
                          <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                            {Object.entries(t.defaultValues || {}).filter(([,v]) => v).slice(0,4).map(([k, v]) => (
                              <span key={k} style={{ fontSize:'10px', padding:'2px 7px', borderRadius:'5px', background:'#fff', border:'1px solid #e2e8f0', color:'#374151', maxWidth:'120px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                <span style={{ color:'#94a3b8' }}>{k}: </span>{String(v)}
                              </span>
                            ))}
                            {presetCount > 4 && <span style={{ fontSize:'10px', padding:'2px 7px', borderRadius:'5px', background:'#f1f5f9', color:'#94a3b8' }}>+{presetCount-4} more</span>}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ display:'flex', gap:'8px' }}>
                        <button onClick={() => openEdit(t)} className="tm-action-btn"
                          style={{ flex:1, padding:'8px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'12px', fontWeight:'700', cursor:'pointer', color:'#374151' }}>
                          ✏️ Edit
                        </button>
                        <button onClick={() => setDeleteId(t._id)} className="tm-action-btn"
                          style={{ padding:'8px 12px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'12px', cursor:'pointer', color:'#94a3b8' }}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Delete Confirm Modal ── */}
      {deleteId && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}
          onClick={() => setDeleteId(null)}>
          <div style={{ background:'#fff', borderRadius:'18px', padding:'28px', width:'360px', boxShadow:'0 24px 64px rgba(0,0,0,0.35)', animation:'fadeInUp 0.18s ease' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width:'56px', height:'56px', borderRadius:'16px', background:'#fef2f2', border:'1px solid #fecaca', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'26px', margin:'0 auto 16px' }}>🗑️</div>
            <h3 style={{ margin:'0 0 8px', fontSize:'17px', fontWeight:'800', color:'#0f172a', textAlign:'center' }}>Delete Template?</h3>
            <p style={{ margin:'0 0 24px', fontSize:'13px', color:'#64748b', textAlign:'center', lineHeight:'1.5' }}>This template will be permanently deleted and cannot be recovered.</p>
            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={() => handleDelete(deleteId)} className="tm-action-btn"
                style={{ flex:1, padding:'11px', background:'linear-gradient(135deg,#dc2626,#b91c1c)', color:'#fff', border:'none', borderRadius:'10px', fontSize:'13px', fontWeight:'700', cursor:'pointer', boxShadow:'0 4px 12px rgba(220,38,38,0.35)' }}>
                Yes, Delete
              </button>
              <button onClick={() => setDeleteId(null)} className="tm-action-btn"
                style={{ flex:1, padding:'11px', background:'#f1f5f9', color:'#374151', border:'1px solid #e2e8f0', borderRadius:'10px', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// Shared style helpers
const labelStyle = {
  display:'block', fontSize:'11px', fontWeight:'700', color:'#475569',
  marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.5px'
};
const inputStyle = {
  width:'100%', padding:'9px 12px', fontSize:'13px',
  border:'1.5px solid #e2e8f0', borderRadius:'8px',
  boxSizing:'border-box', outline:'none', fontFamily:'inherit'
};
