import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import documentTemplateService from '../services/documentTemplateService';
import { userService } from '../services/userService';

const FORMAT_CONFIG = {
  word:        { label: 'Word',        icon: '📝', ext: '.docx', color: '#2563eb' },
  excel:       { label: 'Excel',       icon: '📊', ext: '.xlsx', color: '#16a34a' },
  powerpoint:  { label: 'PowerPoint',  icon: '📑', ext: '.pptx', color: '#d97706' },
};

const CATEGORIES = ['General', 'Lead Process', 'Sales SOP', 'HR & Onboarding', 'Finance', 'Operations', 'Support', 'Other'];

const emptyForm = () => ({
  title: '', description: '', category: 'General',
  content: '', format: 'word', icon: '📄', color: '#2563eb'
});

export default function DocumentTemplates() {
  const [templates, setTemplates]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [form, setForm]             = useState(emptyForm());
  const [saving, setSaving]         = useState(false);
  const [deleteId, setDeleteId]     = useState(null);
  const [search, setSearch]         = useState('');
  const [filterCat, setFilterCat]   = useState('');
  const [shareModal, setShareModal] = useState(null); // template being shared
  const [shareLink, setShareLink]   = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [users, setUsers]           = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [sharePermission, setSharePermission] = useState('view');
  const [sharingSaving, setSharingSaving] = useState(false);
  const [toast, setToast]           = useState('');
  const toastTimer                  = useRef(null);

  useEffect(() => { load(); loadUsers(); }, []);

  const load = async (cat = filterCat, q = search) => {
    setLoading(true);
    try {
      const params = {};
      if (cat) params.category = cat;
      if (q)   params.search   = q;
      const res = await documentTemplateService.getAll(params);
      setTemplates(res?.data || []);
    } catch { setTemplates([]); }
    finally { setLoading(false); }
  };

  const loadUsers = async () => {
    try {
      const res = await userService.getUsers();
      setUsers(res?.users || res?.data?.users || res?.data || []);
    } catch {}
  };

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3000);
  };

  const openCreate = () => { setForm(emptyForm()); setEditingId(null); setShowForm(true); };
  const openEdit   = (t)  => {
    setForm({ title:t.title, description:t.description||'', category:t.category||'General',
              content:t.content||'', format:t.format||'word', icon:t.icon||'📄', color:t.color||'#2563eb' });
    setEditingId(t._id); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return alert('Title is required');
    setSaving(true);
    try {
      if (editingId) await documentTemplateService.update(editingId, form);
      else           await documentTemplateService.create(form);
      setShowForm(false); load();
      showToast(editingId ? '✓ Template updated!' : '✓ Template created!');
    } catch { alert('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await documentTemplateService.remove(deleteId);
      setDeleteId(null); load(); showToast('🗑️ Template deleted');
    } catch { alert('Failed to delete'); }
  };

  const handleDownload = async (t, fmt) => {
    try {
      showToast(`⏳ Preparing ${FORMAT_CONFIG[fmt].label}...`);
      const response = await documentTemplateService.download(t._id, fmt);
      // api interceptor returns full response for blob responseType
      const blob = response instanceof Blob ? response : response.data;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${t.title.replace(/\s+/g, '_')}${FORMAT_CONFIG[fmt].ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      showToast(`✓ Downloaded as ${FORMAT_CONFIG[fmt].label}!`);
    } catch (err) {
      console.error('Download error:', err);
      showToast('❌ Download failed');
    }
  };

  const openShare = async (t) => {
    setShareModal(t);
    setShareLink(t.isPublic ? `${window.location.origin}/doc-templates/shared/${t.shareToken}` : '');
    setSelectedUsers([]);
  };

  const handleGenerateLink = async () => {
    setLinkLoading(true);
    try {
      const res = await documentTemplateService.generateShareLink(shareModal._id);
      const link = res?.data?.link || res?.link || '';
      setShareLink(link);
      load();
      showToast('🔗 Share link generated!');
    } catch { alert('Failed to generate link'); }
    finally { setLinkLoading(false); }
  };

  const handleRevokeLink = async () => {
    try {
      await documentTemplateService.revokeShareLink(shareModal._id);
      setShareLink(''); load();
      showToast('Link revoked');
    } catch {}
  };

  const handleShareUsers = async () => {
    if (!selectedUsers.length) return alert('Select at least one user');
    setSharingSaving(true);
    try {
      await documentTemplateService.shareWithUsers(shareModal._id, selectedUsers, sharePermission);
      load(); setSelectedUsers([]);
      showToast('✓ Shared with team!');
    } catch { alert('Failed to share'); }
    finally { setSharingSaving(false); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    showToast('📋 Link copied!');
  };

  const filtered = templates.filter(t =>
    (!search || t.title.toLowerCase().includes(search.toLowerCase()) ||
     (t.description||'').toLowerCase().includes(search.toLowerCase())) &&
    (!filterCat || t.category === filterCat)
  );

  return (
    <DashboardLayout title="Document Templates">
      <style>{`
        @keyframes fadeInUp    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn     { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideInLeft { from{opacity:0;transform:translateX(-24px)} to{opacity:1;transform:translateX(0)} }
        @keyframes spin        { to{transform:rotate(360deg)} }
        .dt-card:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(0,0,0,0.10)!important; }
        .dt-card { transition:all 0.2s ease; }
        .dt-btn:hover { opacity:0.85; }
        .dt-btn { transition:opacity 0.15s; cursor:pointer; }
        .dt-panel { min-width:0; overflow:hidden; }
        .dt-main-grid { display:grid; gap:14px; align-items:flex-start; width:100%; min-width:0; }
        .dt-main-grid.cols-1 { grid-template-columns:1fr; }
        .dt-main-grid.cols-2 { grid-template-columns:380px 1fr; }
        .dt-main-grid.cols-3 { grid-template-columns:360px 340px 1fr; }
        .dt-cards-grid { display:grid; gap:12px; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); }
        .dt-hero-badges { display:flex; gap:8px; flex-wrap:wrap; }
        @media (max-width:1100px) {
          .dt-main-grid.cols-3 { grid-template-columns:340px 1fr; }
          .dt-main-grid.cols-3 .dt-share-panel { display:none; }
        }
        @media (max-width:820px) {
          .dt-main-grid.cols-2, .dt-main-grid.cols-3 { grid-template-columns:1fr; }
          .dt-cards-grid { grid-template-columns:1fr 1fr; }
          .dt-hero-badges { display:none; }
        }
        @media (max-width:540px) {
          .dt-cards-grid { grid-template-columns:1fr; }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:'20px', right:'24px', zIndex:9999, background:'#0f172a', color:'#fff', padding:'12px 20px', borderRadius:'12px', fontSize:'13px', fontWeight:'600', boxShadow:'0 8px 24px rgba(0,0,0,0.25)', animation:'fadeInUp 0.2s ease' }}>
          {toast}
        </div>
      )}

      {/* ── Hero ── */}
      <div style={{ background:'linear-gradient(135deg, rgb(18,80,227) 0%, rgb(88,102,125) 50%, rgb(0,0,0) 100%)', borderRadius:'14px', padding:'16px 20px', marginBottom:'14px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'200px', height:'200px', borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }} />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'16px', position:'relative' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'6px' }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' }}>📁</div>
              <h2 style={{ margin:0, fontSize:'20px', fontWeight:'800', color:'#fff' }}>Document Templates</h2>
            </div>
            <p style={{ margin:0, fontSize:'13px', color:'rgba(255,255,255,0.55)' }}>Create SOPs & procedure docs — download as Word, Excel or PowerPoint</p>
          </div>
          <div className="dt-hero-badges">
            {['word','excel','powerpoint'].map(f => (
              <div key={f} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'10px', padding:'8px 12px', textAlign:'center' }}>
                <div style={{ fontSize:'16px' }}>{FORMAT_CONFIG[f].icon}</div>
                <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.5)', marginTop:'1px' }}>{FORMAT_CONFIG[f].label}</div>
              </div>
            ))}
            <div style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'10px', padding:'8px 12px', textAlign:'center' }}>
              <div style={{ fontSize:'18px', fontWeight:'800', color:'#fff' }}>{templates.length}</div>
              <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.5)', marginTop:'1px' }}>Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display:'flex', gap:'8px', marginBottom:'12px', flexWrap:'wrap', alignItems:'center' }}>
        {/* Search */}
        <div style={{ position:'relative', flex:1, minWidth:'200px' }}>
          <span style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:'14px' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search document templates..."
            style={{ width:'100%', paddingLeft:'34px', padding:'10px 10px 10px 34px', fontSize:'13px', border:'1.5px solid #e2e8f0', borderRadius:'10px', outline:'none', boxSizing:'border-box', background:'#fff' }} />
        </div>
        {/* Category filter */}
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          style={{ padding:'10px 12px', fontSize:'13px', border:'1.5px solid #e2e8f0', borderRadius:'10px', outline:'none', background:'#fff', color:'#374151' }}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {/* Create button */}
        <button onClick={openCreate} className="dt-btn"
          style={{ padding:'10px 20px', background:'linear-gradient(135deg,#1252e3,#0f172a)', color:'#fff', border:'none', borderRadius:'10px', fontSize:'13px', fontWeight:'700', boxShadow:'0 4px 14px rgba(18,82,227,0.3)', whiteSpace:'nowrap' }}>
          + New Document Template
        </button>
      </div>

      {/* ── Main layout ── */}
      <div className={`dt-main-grid ${(showForm && shareModal) ? 'cols-3' : (showForm || shareModal) ? 'cols-2' : 'cols-1'}`}>

        {/* ── LEFT PANEL: Form or Share ── */}
        {showForm && (
          <div className="dt-panel" style={{ background:'#fff', borderRadius:'16px', border:'2px solid #1252e322', overflow:'hidden', boxShadow:'0 8px 32px rgba(18,82,227,0.12)', animation:'slideInLeft 0.22s ease' }}>
            {/* Form header */}
            <div style={{ padding:'18px 20px', background:'linear-gradient(135deg, rgb(18,80,227) 0%, rgb(88,102,125) 50%, rgb(0,0,0) 100%)', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'3px' }}>
                  <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px' }}>
                    {editingId ? '✏️' : '✦'}
                  </div>
                  <div style={{ fontSize:'15px', fontWeight:'800', color:'#fff' }}>{editingId ? 'Edit Template' : 'New Document Template'}</div>
                </div>
                <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.55)', paddingLeft:'38px' }}>Fill details and write your procedure content</div>
              </div>
              <button onClick={() => setShowForm(false)} className="dt-btn"
                style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'7px', color:'#fff', padding:'5px 9px', fontSize:'14px' }}>✕</button>
            </div>

            <div style={{ padding:'18px', overflowY:'auto', maxHeight:'76vh', display:'flex', flexDirection:'column', gap:'14px' }}>
              {/* Title */}
              <div>
                <label style={lbl}>Title *</label>
                <input value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} placeholder="e.g. How to Take a Lead"
                  style={{ ...inp, borderColor: form.title ? '#1252e366' : '#e2e8f0' }} />
              </div>

              {/* Description */}
              <div>
                <label style={lbl}>Description</label>
                <textarea value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} rows={2}
                  placeholder="What is this document about?" style={{ ...inp, resize:'vertical' }} />
              </div>

              {/* Category + Format */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div>
                  <label style={lbl}>Category</label>
                  <select value={form.category} onChange={e => setForm(p=>({...p,category:e.target.value}))} style={{ ...inp, background:'#f8fafc' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Default Format</label>
                  <select value={form.format} onChange={e => setForm(p=>({...p,format:e.target.value}))} style={{ ...inp, background:'#f8fafc' }}>
                    {Object.entries(FORMAT_CONFIG).map(([k,f]) => (
                      <option key={k} value={k}>{f.icon} {f.label}</option>
                    ))}
                  </select>
                </div>
              </div>


              {/* Divider */}
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <div style={{ flex:1, height:'1px', background:'#f1f5f9' }} />
                <span style={{ fontSize:'10px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px', whiteSpace:'nowrap' }}>Document Content</span>
                <div style={{ flex:1, height:'1px', background:'#f1f5f9' }} />
              </div>

              {/* Content */}
              <div>
                <label style={lbl}>Steps / Procedure / SOP</label>
                <textarea value={form.content} onChange={e => setForm(p=>({...p,content:e.target.value}))} rows={12}
                  placeholder={`Write your document here...\n\nExample:\n1. Purpose\nThis document explains how to take a new lead.\n\n2. Steps\n- Ask for customer name and contact\n- Find out lead source\n- Create lead in CRM\n- Set priority\n- Schedule follow-up`}
                  style={{ ...inp, resize:'vertical', fontFamily:'monospace', fontSize:'12px', lineHeight:'1.7', background:'#fafbff' }} />
                <div style={{ fontSize:'11px', color:'#94a3b8', marginTop:'4px' }}>💡 Write plain text with numbered steps — formatted properly in the downloaded file.</div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding:'14px 18px', borderTop:'1px solid #f1f5f9', background:'#fafbff', display:'flex', gap:'10px' }}>
              <button onClick={handleSave} disabled={saving} className="dt-btn"
                style={{ flex:1, padding:'10px', background: saving ? '#94a3b8' : 'linear-gradient(135deg,#1252e3,#0f172a)', color:'#fff', border:'none', borderRadius:'9px', fontSize:'13px', fontWeight:'700', boxShadow: saving ? 'none' : '0 4px 14px rgba(18,82,227,0.3)' }}>
                {saving ? '⏳ Saving...' : editingId ? '✓ Save Changes' : '✦ Create Template'}
              </button>
              <button onClick={() => setShowForm(false)} className="dt-btn"
                style={{ padding:'10px 16px', background:'#fff', color:'#374151', border:'1px solid #e2e8f0', borderRadius:'9px', fontSize:'13px', fontWeight:'600' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── PANEL: Share (left when alone, middle when form also open) ── */}
        {shareModal && (
          <div className="dt-panel dt-share-panel" style={{ background:'#fff', borderRadius:'16px', border:'2px solid #1252e322', overflow:'hidden', boxShadow:'0 8px 32px rgba(18,82,227,0.12)', animation:'slideInLeft 0.22s ease' }}>
            {/* Share header */}
            <div style={{ padding:'18px 20px', background:'linear-gradient(135deg, rgb(18,80,227) 0%, rgb(88,102,125) 50%, rgb(0,0,0) 100%)', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'3px' }}>
                  <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px' }}>🔗</div>
                  <div style={{ fontSize:'15px', fontWeight:'800', color:'#fff' }}>Share Template</div>
                </div>
                <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.55)', paddingLeft:'38px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'260px' }}>{shareModal.title}</div>
              </div>
              <button onClick={() => setShareModal(null)} className="dt-btn"
                style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'7px', color:'#fff', padding:'5px 9px', fontSize:'14px' }}>✕</button>
            </div>

            <div style={{ padding:'20px', overflowY:'auto', maxHeight:'76vh', display:'flex', flexDirection:'column', gap:'20px' }}>
              {/* Public link */}
              <div style={{ background:'#f8fafc', borderRadius:'12px', border:'1px solid #e2e8f0', padding:'16px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
                  <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px' }}>🌐</div>
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:'700', color:'#0f172a' }}>Public Link</div>
                    <div style={{ fontSize:'11px', color:'#94a3b8' }}>Anyone with this link can view</div>
                  </div>
                </div>
                {shareLink ? (
                  <>
                    <div style={{ display:'flex', gap:'8px', marginBottom:'8px' }}>
                      <input readOnly value={shareLink}
                        style={{ flex:1, padding:'9px 12px', fontSize:'11px', border:'1.5px solid #e2e8f0', borderRadius:'8px', background:'#fff', color:'#374151', outline:'none' }} />
                      <button onClick={copyLink} className="dt-btn"
                        style={{ padding:'9px 14px', background:'#1252e3', color:'#fff', border:'none', borderRadius:'8px', fontSize:'12px', fontWeight:'700' }}>Copy</button>
                    </div>
                    <button onClick={handleRevokeLink} className="dt-btn"
                      style={{ fontSize:'12px', color:'#dc2626', background:'none', border:'none', padding:0, fontWeight:'600' }}>
                      Revoke link
                    </button>
                  </>
                ) : (
                  <button onClick={handleGenerateLink} disabled={linkLoading} className="dt-btn"
                    style={{ width:'100%', padding:'10px', background:'#eff6ff', border:'1.5px solid #bfdbfe', borderRadius:'9px', fontSize:'13px', fontWeight:'700', color:'#1252e3' }}>
                    {linkLoading ? 'Generating...' : '🔗 Generate Share Link'}
                  </button>
                )}
              </div>

              {/* Team sharing */}
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
                  <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px' }}>👥</div>
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:'700', color:'#0f172a' }}>Share with Team</div>
                    <div style={{ fontSize:'11px', color:'#94a3b8' }}>Select users from your workspace</div>
                  </div>
                </div>

                {/* Permission toggle */}
                <div style={{ display:'flex', gap:'6px', marginBottom:'12px', background:'#f1f5f9', borderRadius:'8px', padding:'4px' }}>
                  {['view','edit'].map(p => (
                    <button key={p} onClick={() => setSharePermission(p)} className="dt-btn"
                      style={{ flex:1, padding:'7px', fontSize:'12px', fontWeight:'700', borderRadius:'6px', border:'none',
                        background: sharePermission===p ? '#fff' : 'transparent',
                        color: sharePermission===p ? '#1252e3' : '#64748b',
                        boxShadow: sharePermission===p ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
                      {p === 'view' ? '👁️ View only' : '✏️ Can edit'}
                    </button>
                  ))}
                </div>

                {/* User list */}
                <div style={{ border:'1px solid #e2e8f0', borderRadius:'10px', overflow:'hidden', maxHeight:'240px', overflowY:'auto' }}>
                  {users.length === 0 ? (
                    <div style={{ padding:'20px', textAlign:'center', color:'#94a3b8', fontSize:'13px' }}>No users found</div>
                  ) : users.map(u => {
                    const isSelected = selectedUsers.includes(u._id);
                    const alreadyShared = shareModal.sharedWith?.some(s => (s.user?._id || s.user) === u._id);
                    return (
                      <div key={u._id} onClick={() => !alreadyShared && setSelectedUsers(prev => isSelected ? prev.filter(id=>id!==u._id) : [...prev, u._id])}
                        style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 14px', borderBottom:'1px solid #f8fafc',
                          cursor: alreadyShared ? 'default' : 'pointer',
                          background: isSelected ? '#eff6ff' : '#fff', transition:'background 0.15s' }}>
                        <div style={{ width:'34px', height:'34px', borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:'800',
                          background: isSelected ? '#1252e3' : '#f1f5f9',
                          color: isSelected ? '#fff' : '#374151' }}>
                          {(u.name || u.email || 'U')[0].toUpperCase()}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:'13px', fontWeight:'600', color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.name || u.email}</div>
                          <div style={{ fontSize:'11px', color:'#94a3b8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email}</div>
                        </div>
                        {alreadyShared
                          ? <span style={{ fontSize:'10px', fontWeight:'700', color:'#16a34a', background:'#f0fdf4', padding:'2px 7px', borderRadius:'99px', border:'1px solid #bbf7d0' }}>Shared</span>
                          : isSelected
                          ? <span style={{ fontSize:'14px', color:'#1252e3' }}>✓</span>
                          : null}
                      </div>
                    );
                  })}
                </div>

                {selectedUsers.length > 0 && (
                  <button onClick={handleShareUsers} disabled={sharingSaving} className="dt-btn"
                    style={{ marginTop:'12px', width:'100%', padding:'10px', background:'linear-gradient(135deg,#1252e3,#0f172a)', color:'#fff', border:'none', borderRadius:'9px', fontSize:'13px', fontWeight:'700', boxShadow:'0 4px 14px rgba(18,82,227,0.3)' }}>
                    {sharingSaving ? 'Sharing...' : `✓ Share with ${selectedUsers.length} user${selectedUsers.length>1?'s':''}`}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Template Cards ── */}
        <div className="dt-panel">
          {loading ? (
            <div style={{ padding:'60px', textAlign:'center', background:'#fff', borderRadius:'14px', border:'1px solid #e5e7eb' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'50%', border:'3px solid #2563eb', borderTopColor:'transparent', margin:'0 auto 12px', animation:'spin 0.8s linear infinite' }} />
              <p style={{ color:'#94a3b8', fontSize:'13px', margin:0 }}>Loading...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding:'60px 40px', textAlign:'center', background:'#fff', borderRadius:'14px', border:'2px dashed #e2e8f0' }}>
              <div style={{ fontSize:'40px', marginBottom:'12px' }}>📁</div>
              <p style={{ fontSize:'15px', fontWeight:'700', color:'#0f172a', margin:'0 0 6px' }}>No Document Templates Yet</p>
              <p style={{ fontSize:'13px', color:'#94a3b8', margin:'0 0 20px' }}>Create your first SOP or procedure document</p>
              <button onClick={openCreate} className="dt-btn"
                style={{ padding:'10px 24px', background:'linear-gradient(135deg,#1252e3,#0f172a)', color:'#fff', border:'none', borderRadius:'9px', fontSize:'13px', fontWeight:'700', boxShadow:'0 4px 14px rgba(18,82,227,0.3)' }}>
                Create First Template
              </button>
            </div>
          ) : (
            <div className="dt-cards-grid">
              {filtered.map((t, i) => {
                const fmt = FORMAT_CONFIG[t.format] || FORMAT_CONFIG.word;
                return (
                  <div key={t._id} className="dt-card"
                    style={{ background:'#fff', borderRadius:'14px', border:'1px solid #e8ecf0', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', overflow:'hidden', animation:`fadeInUp 0.18s ease ${i*0.04}s both` }}>
                    {/* Top bar */}
                    <div style={{ height:'4px', background:`linear-gradient(90deg,${fmt.color},${fmt.color}66)` }} />
                    <div style={{ padding:'18px' }}>
                      {/* Header row */}
                      <div style={{ display:'flex', gap:'12px', marginBottom:'12px' }}>
                        <div style={{ width:'46px', height:'46px', borderRadius:'12px', background:'#f1f5f9', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>
                          {t.icon}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:'14px', fontWeight:'700', color:'#0f172a', marginBottom:'3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.title}</div>
                          {t.description ? (
                            <p style={{ margin:0, fontSize:'12px', color:'#64748b', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{t.description}</p>
                          ) : (
                            <p style={{ margin:0, fontSize:'12px', color:'#cbd5e1', fontStyle:'italic' }}>No description</p>
                          )}
                        </div>
                      </div>

                      {/* Tags */}
                      <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'14px' }}>
                        <span style={{ fontSize:'11px', fontWeight:'600', padding:'3px 9px', borderRadius:'5px', background:'#f1f5f9', color:'#475569', border:'1px solid #e2e8f0' }}>
                          {fmt.icon} {fmt.label}
                        </span>
                        <span style={{ fontSize:'11px', fontWeight:'600', padding:'3px 9px', borderRadius:'5px', background:'#f1f5f9', color:'#475569', border:'1px solid #e2e8f0' }}>
                          {t.category}
                        </span>
                        {t.isPublic && (
                          <span style={{ fontSize:'11px', fontWeight:'600', padding:'3px 9px', borderRadius:'5px', background:'#eff6ff', color:'#2563eb', border:'1px solid #bfdbfe' }}>
                            🔗 Shared
                          </span>
                        )}
                        {t.sharedWith?.length > 0 && (
                          <span style={{ fontSize:'11px', fontWeight:'600', padding:'3px 9px', borderRadius:'5px', background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0' }}>
                            👥 {t.sharedWith.length} user{t.sharedWith.length>1?'s':''}
                          </span>
                        )}
                      </div>

                      {/* Content preview */}
                      {t.content && (
                        <div style={{ padding:'8px 10px', borderRadius:'8px', background:'#f8fafc', border:'1px solid #f1f5f9', marginBottom:'14px', fontSize:'12px', color:'#64748b', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                          {t.content.replace(/<[^>]+>/g,'').substring(0,120)}...
                        </div>
                      )}

                      {/* Download buttons */}
                      <div style={{ marginBottom:'10px' }}>
                        <div style={{ fontSize:'10px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'6px' }}>Download As</div>
                        <div style={{ display:'flex', gap:'6px' }}>
                          {Object.entries(FORMAT_CONFIG).map(([key, f]) => (
                            <button key={key} onClick={() => handleDownload(t, key)} className="dt-btn"
                              style={{ flex:1, padding:'7px 4px', fontSize:'11px', fontWeight:'700', borderRadius:'7px', border:'1px solid #e2e8f0', background: key===t.format ? f.color : '#f8fafc', color: key===t.format ? '#fff' : '#374151', display:'flex', alignItems:'center', justifyContent:'center', gap:'4px' }}>
                              {f.icon} {f.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display:'flex', gap:'6px' }}>
                        <button onClick={() => openEdit(t)} className="dt-btn"
                          style={{ flex:1, padding:'8px', fontSize:'12px', fontWeight:'700', borderRadius:'8px', border:'1px solid #e2e8f0', background:'#f8fafc', color:'#374151' }}>
                          ✏️ Edit
                        </button>
                        <button onClick={() => openShare(t)} className="dt-btn"
                          style={{ flex:1, padding:'8px', fontSize:'12px', fontWeight:'700', borderRadius:'8px', border:'1px solid #bfdbfe', background:'#eff6ff', color:'#2563eb' }}>
                          🔗 Share
                        </button>
                        <button onClick={() => setDeleteId(t._id)} className="dt-btn"
                          style={{ padding:'8px 12px', fontSize:'12px', borderRadius:'8px', border:'1px solid #e2e8f0', background:'#f8fafc', color:'#94a3b8' }}>
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

      {/* ── Delete Modal ── */}
      {deleteId && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}
          onClick={() => setDeleteId(null)}>
          <div style={{ background:'#fff', borderRadius:'18px', padding:'28px', width:'340px', boxShadow:'0 24px 64px rgba(0,0,0,0.3)' }} onClick={e=>e.stopPropagation()}>
            <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', margin:'0 auto 14px' }}>🗑️</div>
            <h3 style={{ margin:'0 0 8px', fontSize:'16px', fontWeight:'800', color:'#0f172a', textAlign:'center' }}>Delete Template?</h3>
            <p style={{ margin:'0 0 20px', fontSize:'13px', color:'#64748b', textAlign:'center' }}>This document template will be permanently deleted.</p>
            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={handleDelete} className="dt-btn"
                style={{ flex:1, padding:'10px', background:'linear-gradient(135deg,#dc2626,#b91c1c)', color:'#fff', border:'none', borderRadius:'9px', fontSize:'13px', fontWeight:'700', boxShadow:'0 4px 12px rgba(220,38,38,0.3)' }}>
                Yes, Delete
              </button>
              <button onClick={() => setDeleteId(null)} className="dt-btn"
                style={{ flex:1, padding:'10px', background:'#f1f5f9', color:'#374151', border:'1px solid #e2e8f0', borderRadius:'9px', fontSize:'13px', fontWeight:'600' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

const lbl = { display:'block', fontSize:'11px', fontWeight:'700', color:'#475569', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.5px' };
const inp = { width:'100%', padding:'9px 12px', fontSize:'13px', border:'1.5px solid #e2e8f0', borderRadius:'8px', boxSizing:'border-box', outline:'none', fontFamily:'inherit' };
