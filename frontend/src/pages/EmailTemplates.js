import React, { useState, useEffect, useRef } from 'react';
import EmailEditor from 'react-email-editor';
import DashboardLayout from '../components/layout/DashboardLayout';
import templateService from '../services/templateService';

const CATEGORIES = ['All','Welcome','Follow-up','Proposal','Cold Outreach','Support','Promotional','Reminder','Other'];

const CAT_META = {
  'Welcome':      { icon:'👋', color:'#10b981' },
  'Follow-up':    { icon:'🔄', color:'#f59e0b' },
  'Proposal':     { icon:'📋', color:'#6366f1' },
  'Cold Outreach':{ icon:'❄️', color:'#3b82f6' },
  'Support':      { icon:'🛠️', color:'#ec4899' },
  'Promotional':  { icon:'🎯', color:'#f97316' },
  'Reminder':     { icon:'⏰', color:'#8b5cf6' },
  'Other':        { icon:'📁', color:'#64748b' },
  'General':      { icon:'📄', color:'#64748b' },
};

const SORT_OPTIONS = [
  { value:'recent', label:'Most Recent' },
  { value:'used',   label:'Most Used'   },
  { value:'name',   label:'Name A–Z'    },
];

const emptyForm = () => ({ name:'', category:'Follow-up', subject:'', description:'', color:'#1252e3' });

export default function EmailTemplates() {
  const [templates,    setTemplates]    = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [showForm,     setShowForm]     = useState(false);
  const [editingId,    setEditingId]    = useState(null);
  const [form,         setForm]         = useState(emptyForm());
  const [saving,       setSaving]       = useState(false);
  const [deleteId,     setDeleteId]     = useState(null);
  const [search,       setSearch]       = useState('');
  const [filterCat,    setFilterCat]    = useState('All');
  const [sortBy,       setSortBy]       = useState('recent');
  const [previewTpl,   setPreviewTpl]   = useState(null);
  const [previewHtml,  setPreviewHtml]  = useState('');
  const [editorReady,  setEditorReady]  = useState(false);
  const [toast,        setToast]        = useState({ msg:'', type:'success' });

  const editorRef = useRef(null);
  const toastRef  = useRef(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await templateService.getTemplates('email');
      setTemplates(res?.data || []);
    } catch { setTemplates([]); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type='success') => {
    setToast({ msg, type });
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast({ msg:'', type:'success' }), 3000);
  };

  const openCreate = () => {
    setForm(emptyForm());
    setEditingId(null);
    setEditorReady(false);
    setShowForm(true);
  };

  const openEdit = (t) => {
    setForm({
      name:        t.name || '',
      category:    t.defaultValues?.category || 'Follow-up',
      subject:     t.defaultValues?.subject  || '',
      description: t.description || '',
      color:       t.color || '#1252e3',
    });
    setEditingId(t._id);
    setEditorReady(false);
    setShowForm(true);
    // Design will be loaded after editor mounts (onReady)
  };

  // Called when Unlayer editor is ready
  const onEditorReady = () => {
    setEditorReady(true);
    if (editingId) {
      const t = templates.find(x => x._id === editingId);
      const design = t?.defaultValues?.design;
      if (design && editorRef.current?.editor) {
        editorRef.current.editor.loadDesign(design);
      }
    }
  };

  const handleSave = () => {
    if (!form.name.trim())    return showToast('Template name is required', 'error');
    if (!form.subject.trim()) return showToast('Subject is required', 'error');
    if (!editorRef.current?.editor) return showToast('Editor not ready', 'error');

    editorRef.current.editor.exportHtml(async ({ html, design }) => {
      setSaving(true);
      try {
        const payload = {
          module: 'email',
          name:   form.name,
          description: form.description,
          color:  form.color,
          defaultValues: {
            category: form.category,
            subject:  form.subject,
            message:  html,
            design:   design,
          },
        };
        if (editingId) await templateService.updateTemplate(editingId, payload);
        else           await templateService.createTemplate(payload);
        setShowForm(false);
        setEditingId(null);
        load();
        showToast(editingId ? '✓ Template updated!' : '✦ Template created!');
      } catch { showToast('Failed to save', 'error'); }
      finally { setSaving(false); }
    });
  };

  const handleDelete = async () => {
    try {
      await templateService.deleteTemplate(deleteId);
      setDeleteId(null); load(); showToast('Deleted');
    } catch { showToast('Failed', 'error'); }
  };

  const handleDuplicate = async (t) => {
    try {
      await templateService.createTemplate({
        module: 'email', name: `${t.name} (Copy)`,
        description: t.description, color: t.color,
        defaultValues: t.defaultValues,
      });
      load(); showToast('Duplicated!');
    } catch {}
  };

  const openPreview = (t) => {
    setPreviewTpl(t);
    setPreviewHtml(t.defaultValues?.message || '');
  };

  const sorted = [...templates].sort((a,b) => {
    if (sortBy === 'used') return (b.usageCount||0) - (a.usageCount||0);
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return new Date(b.updatedAt||b.createdAt) - new Date(a.updatedAt||a.createdAt);
  });
  const filtered = sorted.filter(t => {
    const cat     = t.defaultValues?.category || 'General';
    const matchCat = filterCat === 'All' || cat === filterCat;
    const matchQ   = !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.defaultValues?.subject||'').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  });

  const catCounts = CATEGORIES.slice(1).reduce((acc,c) => {
    acc[c] = templates.filter(t => (t.defaultValues?.category||'General') === c).length;
    return acc;
  }, {});

  /* ── FULL-PAGE EDITOR ── */
  if (showForm) {
    return (
      <DashboardLayout title="Email Templates">
        <style>{`
          @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
          .et-btn { cursor:pointer; transition:all .15s; border:none; font-family:inherit; }
          .et-btn:hover { filter:brightness(.92); }
          input:focus, select:focus, textarea:focus { border-color:#1252e3!important; outline:none; box-shadow:0 0 0 3px rgba(18,82,227,.08); }
        `}</style>

        {toast.msg && (
          <div style={{position:'fixed',top:20,right:24,zIndex:9999,background:toast.type==='error'?'#dc2626':'#0f172a',color:'#fff',padding:'12px 20px',borderRadius:12,fontSize:13,fontWeight:600,boxShadow:'0 8px 24px rgba(0,0,0,.25)',animation:'fadeUp .2s ease'}}>
            {toast.msg}
          </div>
        )}

        {/* Top bar */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:10}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <button onClick={()=>{setShowForm(false);setEditingId(null);}} className="et-btn"
              style={{padding:'8px 14px',background:'#f1f5f9',color:'#374151',border:'1px solid #e2e8f0',borderRadius:9,fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:6}}>
              ← Back
            </button>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:'#0f172a'}}>{editingId ? 'Edit Template' : 'New Email Template'}</div>
              <div style={{fontSize:11,color:'#94a3b8'}}>Design your email with drag & drop blocks</div>
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>{setShowForm(false);setEditingId(null);}} className="et-btn"
              style={{padding:'9px 18px',background:'#fff',color:'#374151',border:'1px solid #e2e8f0',borderRadius:9,fontSize:13,fontWeight:600}}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving||!editorReady} className="et-btn"
              style={{padding:'9px 22px',background:(saving||!editorReady)?'#94a3b8':'linear-gradient(135deg,#1252e3,#0f172a)',color:'#fff',borderRadius:9,fontSize:13,fontWeight:700,boxShadow:(saving||!editorReady)?'none':'0 4px 14px rgba(18,82,227,.28)',opacity:(saving||!editorReady)?.7:1}}>
              {saving ? '⏳ Saving...' : editingId ? '✓ Save Changes' : '✦ Save Template'}
            </button>
          </div>
        </div>

        {/* Editor layout */}
        <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:14,alignItems:'flex-start'}}>

          {/* Left: Template meta */}
          <div style={{background:'#fff',borderRadius:16,border:'1px solid #e2e8f0',overflow:'hidden',boxShadow:'0 2px 10px rgba(0,0,0,.05)',position:'sticky',top:20}}>
            <div style={{padding:'13px 16px',background:'linear-gradient(135deg,#1252e3,#0f172a)',borderBottom:'1px solid #e2e8f0'}}>
              <div style={{fontSize:12,fontWeight:800,color:'#fff'}}>Template Details</div>
              <div style={{fontSize:10,color:'rgba(255,255,255,.5)',marginTop:2}}>Fill in template info</div>
            </div>
            <div style={{padding:16,display:'flex',flexDirection:'column',gap:14}}>

              <div>
                <label style={lbl}>Template Name *</label>
                <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}
                  placeholder="e.g. Post-Demo Follow-up"
                  style={inp}/>
              </div>

              <div>
                <label style={lbl}>Email Subject *</label>
                <input value={form.subject} onChange={e=>setForm(p=>({...p,subject:e.target.value}))}
                  placeholder="e.g. Following up on our demo"
                  style={inp}/>
              </div>

              <div>
                <label style={lbl}>Category</label>
                <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} style={inp}>
                  {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{CAT_META[c]?.icon} {c}</option>)}
                </select>
              </div>

              <div>
                <label style={lbl}>When to use</label>
                <textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}
                  placeholder="e.g. Send after a product demo call"
                  rows={3} style={{...inp,resize:'none',lineHeight:1.6}}/>
              </div>

              <div>
                <label style={lbl}>Label Color</label>
                <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:4}}>
                  {['#1252e3','#10b981','#f59e0b','#6366f1','#ec4899','#f97316','#8b5cf6','#dc2626','#0f172a'].map(c=>(
                    <button key={c} onClick={()=>setForm(p=>({...p,color:c}))} className="et-btn"
                      style={{width:22,height:22,borderRadius:'50%',background:c,border:form.color===c?'2.5px solid #0f172a':'2px solid transparent',boxShadow:form.color===c?`0 0 0 2px ${c}55`:'none'}}/>
                  ))}
                </div>
              </div>


              {!editorReady && (
                <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 12px',background:'#f0f9ff',border:'1px solid #bae6fd',borderRadius:10}}>
                  <div style={{width:14,height:14,borderRadius:'50%',border:'2px solid #0ea5e9',borderTopColor:'transparent',animation:'spin .7s linear infinite',flexShrink:0}}/>
                  <span style={{fontSize:12,color:'#0369a1',fontWeight:600}}>Loading editor...</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Unlayer Editor */}
          <div style={{background:'#fff',borderRadius:16,border:'1px solid #e2e8f0',overflow:'hidden',boxShadow:'0 2px 10px rgba(0,0,0,.05)'}}>
            <div style={{padding:'11px 16px',background:'#f8fafc',borderBottom:'1px solid #e2e8f0',display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:editorReady?'#10b981':'#f59e0b',animation:editorReady?'none':'pulse 1.5s infinite'}}/>
              <span style={{fontSize:12,fontWeight:700,color:'#374151'}}>
                {editorReady ? 'Drag & Drop Editor • Ready' : 'Loading Editor...'}
              </span>
            </div>
            <EmailEditor
              ref={editorRef}
              onReady={onEditorReady}
              style={{ minHeight:'80vh' }}
              options={{
                displayMode: 'email',
                features: { colorPicker: { presets: ['#1252e3','#0077B5','#10b981','#f59e0b','#ec4899','#0f172a'] } },
                appearance: { theme: 'light', panels: { tools: { dock: 'right' } } },
              }}
            />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /* ── TEMPLATE LIST ── */
  return (
    <DashboardLayout title="Email Templates">
      <style>{`
        @keyframes fadeInUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.5} }
        .et-btn  { cursor:pointer; transition:all .15s; border:none; font-family:inherit; }
        .et-btn:hover { opacity:.85; }
        .et-card { transition:all .2s; }
        .et-card:hover { transform:translateY(-3px); box-shadow:0 12px 32px rgba(0,0,0,.12)!important; }
        .et-row  { transition:background .15s; }
        .et-row:hover { background:#f1f5f9!important; }
      `}</style>

      {toast.msg && (
        <div style={{position:'fixed',top:20,right:24,zIndex:9999,background:toast.type==='error'?'#dc2626':'#0f172a',color:'#fff',padding:'12px 20px',borderRadius:12,fontSize:13,fontWeight:600,boxShadow:'0 8px 24px rgba(0,0,0,.25)',animation:'fadeInUp .2s ease'}}>
          {toast.msg}
        </div>
      )}

      {/* Hero */}
      <div style={{background:'linear-gradient(135deg,#1252e3 0%,#58667d 50%,#0f172a 100%)',borderRadius:14,padding:'18px 22px',marginBottom:14,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:-50,right:-50,width:200,height:200,borderRadius:'50%',background:'rgba(255,255,255,.03)',pointerEvents:'none'}}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12,position:'relative'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:40,height:40,borderRadius:12,background:'rgba(255,255,255,.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>📧</div>
            <div>
              <h2 style={{margin:0,fontSize:18,fontWeight:800,color:'#fff'}}>Email Templates</h2>
              <p style={{margin:0,fontSize:11,color:'rgba(255,255,255,.5)'}}>Drag & drop designer · Variables · Reusable</p>
            </div>
          </div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
            {[{l:'Total',v:templates.length},{l:'Categories',v:Object.values(catCounts).filter(v=>v>0).length},{l:'Most Used',v:templates.reduce((a,t)=>Math.max(a,t.usageCount||0),0)+'×'}].map(s=>(
              <div key={s.l} style={{background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.12)',borderRadius:10,padding:'8px 14px',textAlign:'center',minWidth:64}}>
                <div style={{fontSize:17,fontWeight:800,color:'#fff'}}>{s.v}</div>
                <div style={{fontSize:10,color:'rgba(255,255,255,.5)',marginTop:1}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div style={{display:'grid',gridTemplateColumns:'200px 1fr',gap:14,alignItems:'flex-start'}}>

        {/* Left: category sidebar */}
        <div>
          <button onClick={openCreate} className="et-btn"
            style={{width:'100%',padding:'11px',background:'linear-gradient(135deg,#1252e3,#0f172a)',color:'#fff',borderRadius:10,fontSize:13,fontWeight:700,boxShadow:'0 4px 14px rgba(18,82,227,.28)',marginBottom:10,display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
            <span style={{fontSize:16}}>+</span> New Template
          </button>
          <div style={{background:'#fff',borderRadius:14,border:'1px solid #e2e8f0',overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,.04)'}}>
            <div style={{padding:'10px 14px',borderBottom:'1px solid #f1f5f9',background:'#f8fafc'}}>
              <div style={{fontSize:11,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.5px'}}>Categories</div>
            </div>
            {CATEGORIES.map(c => {
              const count  = c === 'All' ? templates.length : catCounts[c] || 0;
              const meta   = CAT_META[c] || {icon:'📁',color:'#64748b'};
              const active = filterCat === c;
              return (
                <div key={c} onClick={()=>setFilterCat(c)} className="et-btn et-row"
                  style={{display:'flex',alignItems:'center',gap:9,padding:'9px 14px',cursor:'pointer',borderLeft:active?`3px solid ${meta.color}`:'3px solid transparent',background:active?`${meta.color}0d`:'transparent',borderBottom:'1px solid #f8fafc'}}>
                  <span style={{fontSize:14}}>{c==='All'?'📋':meta.icon}</span>
                  <span style={{flex:1,fontSize:12,fontWeight:active?700:500,color:active?meta.color:'#374151',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c}</span>
                  <span style={{fontSize:11,fontWeight:700,color:active?meta.color:'#94a3b8',background:active?`${meta.color}18`:'#f1f5f9',padding:'1px 7px',borderRadius:99,minWidth:20,textAlign:'center'}}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: cards */}
        <div>
          <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
            <div style={{position:'relative',flex:1,minWidth:160}}>
              <span style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:'#94a3b8',fontSize:13}}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search templates..."
                style={{width:'100%',paddingLeft:32,padding:'9px 9px 9px 32px',fontSize:13,border:'1.5px solid #e2e8f0',borderRadius:9,outline:'none',boxSizing:'border-box',background:'#fff'}}/>
            </div>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
              style={{padding:'9px 11px',fontSize:12,border:'1.5px solid #e2e8f0',borderRadius:9,outline:'none',background:'#fff',color:'#374151'}}>
              {SORT_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {loading ? (
            <div style={{padding:60,textAlign:'center',background:'#fff',borderRadius:14,border:'1px solid #e5e7eb'}}>
              <div style={{width:32,height:32,borderRadius:'50%',border:'3px solid #1252e3',borderTopColor:'transparent',margin:'0 auto 10px',animation:'spin .8s linear infinite'}}/>
              <p style={{color:'#94a3b8',fontSize:13,margin:0}}>Loading...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{padding:'60px 40px',textAlign:'center',background:'#fff',borderRadius:14,border:'2px dashed #e2e8f0'}}>
              <div style={{fontSize:42,marginBottom:12}}>📭</div>
              <p style={{fontSize:15,fontWeight:700,color:'#0f172a',margin:'0 0 6px'}}>
                {search || filterCat !== 'All' ? 'No templates match' : 'No Email Templates Yet'}
              </p>
              <p style={{fontSize:13,color:'#94a3b8',margin:'0 0 20px'}}>
                {search || filterCat !== 'All' ? 'Try different filters' : 'Create your first drag & drop email template'}
              </p>
              {!search && filterCat === 'All' && (
                <button onClick={openCreate} className="et-btn"
                  style={{padding:'10px 24px',background:'linear-gradient(135deg,#1252e3,#0f172a)',color:'#fff',borderRadius:9,fontSize:13,fontWeight:700,boxShadow:'0 4px 14px rgba(18,82,227,.3)'}}>
                  Create First Template
                </button>
              )}
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
              {filtered.map((t, i) => {
                const cat  = t.defaultValues?.category || 'General';
                const meta = CAT_META[cat] || CAT_META['Other'];
                const subj = t.defaultValues?.subject || '';
                const hasDesign = !!(t.defaultValues?.design);
                return (
                  <div key={t._id} className="et-card"
                    style={{background:'#fff',borderRadius:14,border:'1px solid #e8ecf0',boxShadow:'0 2px 8px rgba(0,0,0,.05)',overflow:'hidden',animation:`fadeInUp .16s ease ${i*.04}s both`}}>
                    <div style={{height:4,background:`linear-gradient(90deg,${t.color||meta.color},${t.color||meta.color}55)`}}/>
                    <div style={{padding:14}}>
                      <div style={{display:'flex',gap:10,marginBottom:10,alignItems:'flex-start'}}>
                        <div style={{width:40,height:40,borderRadius:10,background:`${t.color||meta.color}14`,border:`1px solid ${t.color||meta.color}33`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:19,flexShrink:0}}>
                          📧
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:700,color:'#0f172a',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.name}</div>
                          {t.description && <div style={{fontSize:11,color:'#94a3b8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginTop:1}}>{t.description}</div>}
                        </div>
                        <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:99,background:`${meta.color}14`,color:meta.color,border:`1px solid ${meta.color}33`,whiteSpace:'nowrap',flexShrink:0}}>
                          {meta.icon} {cat}
                        </span>
                      </div>

                      {subj && (
                        <div style={{display:'flex',alignItems:'center',gap:6,padding:'6px 10px',borderRadius:7,background:'#f8fafc',border:'1px solid #f1f5f9',marginBottom:8}}>
                          <span style={{fontSize:10,fontWeight:700,color:'#94a3b8',whiteSpace:'nowrap'}}>SUB</span>
                          <span style={{fontSize:12,color:'#0f172a',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{subj}</span>
                        </div>
                      )}

                      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
                        <span style={{fontSize:10,padding:'2px 8px',borderRadius:99,background:hasDesign?'#f0fdf4':'#f8fafc',color:hasDesign?'#16a34a':'#94a3b8',border:`1px solid ${hasDesign?'#bbf7d0':'#e2e8f0'}`,fontWeight:600}}>
                          {hasDesign ? '✦ Visual Design' : '📄 HTML Only'}
                        </span>
                        {t.usageCount > 0 && <span style={{fontSize:10,color:'#94a3b8',marginLeft:'auto'}}>Used {t.usageCount}×</span>}
                      </div>

                      <div style={{display:'flex',gap:5}}>
                        <button onClick={()=>openPreview(t)} className="et-btn"
                          style={{flex:1,padding:'7px 4px',fontSize:11,fontWeight:700,borderRadius:7,border:'1px solid #e2e8f0',background:'#f8fafc',color:'#374151',display:'flex',alignItems:'center',justifyContent:'center',gap:3}}>
                          👁️ Preview
                        </button>
                        <button onClick={()=>openEdit(t)} className="et-btn"
                          style={{flex:1,padding:'7px 4px',fontSize:11,fontWeight:700,borderRadius:7,border:'1px solid #e2e8f0',background:'#f8fafc',color:'#374151',display:'flex',alignItems:'center',justifyContent:'center',gap:3}}>
                          ✏️ Edit
                        </button>
                        <button onClick={()=>handleDuplicate(t)} title="Duplicate" className="et-btn"
                          style={{padding:'7px 9px',fontSize:11,borderRadius:7,border:'1px solid #e2e8f0',background:'#f8fafc',color:'#374151'}}>📋</button>
                        <button onClick={()=>setDeleteId(t._id)} title="Delete" className="et-btn"
                          style={{padding:'7px 9px',fontSize:11,borderRadius:7,border:'1px solid #fee2e2',background:'#fff5f5',color:'#dc2626'}}>🗑️</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewTpl && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.7)',backdropFilter:'blur(5px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}
          onClick={()=>setPreviewTpl(null)}>
          <div style={{background:'#fff',borderRadius:18,width:'700px',maxWidth:'95vw',maxHeight:'90vh',overflow:'hidden',boxShadow:'0 32px 80px rgba(0,0,0,.3)',animation:'fadeInUp .2s ease'}}
            onClick={e=>e.stopPropagation()}>
            <div style={{padding:'14px 20px',background:'linear-gradient(135deg,#1252e3,#0f172a)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:'#fff'}}>{previewTpl.name}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,.5)',marginTop:2}}>
                  {CAT_META[previewTpl.defaultValues?.category]?.icon} {previewTpl.defaultValues?.category}
                </div>
              </div>
              <button onClick={()=>setPreviewTpl(null)} className="et-btn"
                style={{background:'rgba(255,255,255,.15)',border:'1px solid rgba(255,255,255,.2)',borderRadius:7,color:'#fff',padding:'5px 9px',fontSize:13}}>✕</button>
            </div>

            {/* Subject */}
            <div style={{padding:'12px 20px',background:'#f8fafc',borderBottom:'1px solid #e2e8f0'}}>
              <span style={{fontSize:11,fontWeight:700,color:'#94a3b8',marginRight:8}}>SUBJECT</span>
              <span style={{fontSize:13,fontWeight:600,color:'#0f172a'}}>{previewTpl.defaultValues?.subject || '(No subject)'}</span>
            </div>

            {/* HTML Preview */}
            <div style={{overflowY:'auto',maxHeight:'65vh'}}>
              {previewHtml ? (
                <iframe
                  srcDoc={previewHtml}
                  style={{width:'100%',minHeight:'60vh',border:'none'}}
                  title="Email Preview"
                  sandbox="allow-same-origin"
                />
              ) : (
                <div style={{padding:40,textAlign:'center',color:'#94a3b8',fontSize:13}}>No preview available</div>
              )}
            </div>

            <div style={{padding:'12px 20px',borderTop:'1px solid #e2e8f0',display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button onClick={()=>{setPreviewTpl(null);openEdit(previewTpl);}} className="et-btn"
                style={{padding:'9px 18px',background:'linear-gradient(135deg,#1252e3,#0f172a)',color:'#fff',borderRadius:9,fontSize:13,fontWeight:700}}>
                ✏️ Edit Template
              </button>
              <button onClick={()=>{handleDuplicate(previewTpl);setPreviewTpl(null);}} className="et-btn"
                style={{padding:'9px 16px',background:'#f8fafc',color:'#374151',border:'1px solid #e2e8f0',borderRadius:9,fontSize:13,fontWeight:600}}>
                📋 Duplicate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.6)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}
          onClick={()=>setDeleteId(null)}>
          <div style={{background:'#fff',borderRadius:16,padding:28,width:320,boxShadow:'0 24px 64px rgba(0,0,0,.28)',animation:'fadeInUp .2s ease'}}
            onClick={e=>e.stopPropagation()}>
            <div style={{width:48,height:48,borderRadius:12,background:'#fef2f2',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,margin:'0 auto 12px'}}>🗑️</div>
            <h3 style={{margin:'0 0 6px',fontSize:15,fontWeight:800,color:'#0f172a',textAlign:'center'}}>Delete Template?</h3>
            <p style={{margin:'0 0 20px',fontSize:13,color:'#64748b',textAlign:'center'}}>This will permanently delete the template.</p>
            <div style={{display:'flex',gap:10}}>
              <button onClick={handleDelete} className="et-btn"
                style={{flex:1,padding:10,background:'linear-gradient(135deg,#dc2626,#b91c1c)',color:'#fff',borderRadius:9,fontSize:13,fontWeight:700}}>
                Delete
              </button>
              <button onClick={()=>setDeleteId(null)} className="et-btn"
                style={{flex:1,padding:10,background:'#f1f5f9',color:'#374151',borderRadius:9,fontSize:13,fontWeight:600}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

const lbl = { display:'block', fontSize:11, fontWeight:700, color:'#475569', marginBottom:4, textTransform:'uppercase', letterSpacing:'.5px' };
const inp = { width:'100%', padding:'9px 11px', fontSize:13, border:'1.5px solid #e2e8f0', borderRadius:8, boxSizing:'border-box', outline:'none', fontFamily:'inherit' };
