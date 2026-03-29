import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import socialService from '../services/socialService';
import { API_BASE_URL } from '../config/api.config';


/* ─── Real SVG Brand Icons ───────────────────────────────────── */
const Icons = {
  LinkedIn: ({ size=24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5" fill="#0077B5"/>
      <path d="M6.94 5a1.44 1.44 0 1 1 0 2.88A1.44 1.44 0 0 1 6.94 5zm-1.2 4.27h2.4V19H5.74V9.27zm4.32 0h2.3v1.34h.03a2.52 2.52 0 0 1 2.27-1.25c2.43 0 2.88 1.6 2.88 3.68V19h-2.4v-5.37c0-.9-.02-2.06-1.26-2.06-1.26 0-1.45.98-1.45 2v5.43H10.06V9.27z" fill="white"/>
    </svg>
  ),
  Twitter: ({ size=24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5" fill="#000"/>
      <path d="M13.67 10.64L18.8 5h-1.22l-4.46 4.91L9.44 5H5.5l5.38 7.43L5.5 19h1.22l4.71-5.18L15.17 19h3.94l-5.44-8.36zm-1.66 1.83l-.55-.74-4.35-5.88h1.87l3.51 4.74.55.74 4.56 6.17h-1.87l-3.72-5.03z" fill="white"/>
    </svg>
  ),
  Facebook: ({ size=24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5" fill="#1877F2"/>
      <path d="M17 12h-3V9c0-.83.17-1 1-1h2V5h-2.5C11.7 5 11 6.46 11 8.5V12H9v3h2v7h3v-7h2.5L17 12z" fill="white"/>
    </svg>
  ),
  Instagram: ({ size=24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <radialGradient id="ig1" cx="30%" cy="107%" r="130%">
          <stop offset="0%" stopColor="#fdf497"/>
          <stop offset="5%" stopColor="#fdf497"/>
          <stop offset="45%" stopColor="#fd5949"/>
          <stop offset="60%" stopColor="#d6249f"/>
          <stop offset="90%" stopColor="#285AEB"/>
        </radialGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#ig1)"/>
      <rect x="7" y="7" width="10" height="10" rx="3" stroke="white" strokeWidth="1.5" fill="none"/>
      <circle cx="12" cy="12" r="2.5" stroke="white" strokeWidth="1.5" fill="none"/>
      <circle cx="16.3" cy="7.7" r="0.8" fill="white"/>
    </svg>
  ),
  YouTube: ({ size=24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5" fill="#FF0000"/>
      <path d="M19.6 8.2s-.2-1.3-.8-1.8c-.7-.8-1.5-.8-1.9-.8C14.8 5.5 12 5.5 12 5.5s-2.8 0-4.9.1c-.4 0-1.2.1-1.9.8-.6.6-.8 1.8-.8 1.8S4.2 9.6 4.2 11v1.3c0 1.4.2 2.8.2 2.8s.2 1.3.8 1.8c.7.8 1.7.7 2.1.8C8.6 17.8 12 18 12 18s2.8 0 4.9-.1c.4 0 1.2-.1 1.9-.8.6-.6.8-1.8.8-1.8s.2-1.4.2-2.8V11c0-1.4-.2-2.8-.2-2.8zM10.2 14v-4.8l5.2 2.4-5.2 2.4z" fill="white"/>
    </svg>
  ),
};

/* ─── Platform config ────────────────────────────────────────── */
const PLATFORMS = {
  linkedin:  { label:'LinkedIn',    color:'#0077B5', bg:'#EBF5FB', charLimit:3000,  desc:'Professional network'  },
  twitter:   { label:'X (Twitter)', color:'#000000', bg:'#F2F2F2', charLimit:280,   desc:'Microblogging platform' },
  facebook:  { label:'Facebook',    color:'#1877F2', bg:'#EBF2FD', charLimit:63206, desc:'Social network'         },
  instagram: { label:'Instagram',   color:'#C13584', bg:'#FCE4F0', charLimit:2200,  desc:'Photo & video sharing'  },
  youtube:   { label:'YouTube',     color:'#FF0000', bg:'#FFEBEB', charLimit:5000,  desc:'Video platform'         },
};

const PL_ICON = { linkedin: Icons.LinkedIn, twitter: Icons.Twitter, facebook: Icons.Facebook, instagram: Icons.Instagram, youtube: Icons.YouTube };

const POST_STATUS = {
  draft:     { label:'Draft',     color:'#64748b', bg:'#F1F5F9', icon:'📄' },
  scheduled: { label:'Scheduled', color:'#D97706', bg:'#FFFBEB', icon:'⏰' },
  published: { label:'Published', color:'#059669', bg:'#ECFDF5', icon:'✅' },
  failed:    { label:'Failed',    color:'#DC2626', bg:'#FEF2F2', icon:'❌' },
};

const emptyPost = () => ({ content:'', platforms:[], scheduledAt:'', tags:'' });
const fmt     = n => n>=1e6?`${(n/1e6).toFixed(1)}M`:n>=1000?`${(n/1000).toFixed(1)}K`:String(n||0);
const fmtDate = d => d ? new Date(d).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '';

export default function SocialMedia() {
  const location = useLocation();
  const [tab,        setTab]        = useState('accounts');
  const [accounts,   setAccounts]   = useState([]);
  const [posts,      setPosts]      = useState([]);
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [post,       setPost]       = useState(emptyPost());
  const [postSaving, setPostSaving] = useState(false);
  const [editPost,   setEditPost]   = useState(null);
  const [mediaFiles,     setMediaFiles]     = useState([]); // [{ url, type, thumbnailUrl, name }]
  const [mediaUploading, setMediaUploading] = useState(false);
  const [filterStatus,   setFilterStatus]   = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [toast, setToast] = useState({ msg:'', type:'success' });
  const toastRef  = useRef(null);
  const fileInput = useRef(null);

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const connected = p.get('connected'), error = p.get('error');
    if (connected) {
      showToast(`${PLATFORMS[connected]?.label || connected} connected successfully!`);
      loadAll();
      window.history.replaceState({}, '', '/social-media');
    }
    if (error) {
      const msgs = {
        linkedin_denied:'LinkedIn auth cancelled',      linkedin_failed:'LinkedIn connection failed',
        twitter_denied:'Twitter/X auth cancelled',      twitter_failed:'Twitter/X connection failed',
        facebook_denied:'Facebook auth cancelled',      facebook_failed:'Facebook connection failed',
        instagram_denied:'Instagram auth cancelled',    instagram_failed:'Instagram connection failed',
        instagram_no_business:'No Instagram Business account — link Instagram to a Facebook Page first',
        youtube_denied:'YouTube auth cancelled',        youtube_failed:'YouTube connection failed',
        invalid_state:'Session expired — please try again',
      };
      showToast(msgs[error] || 'Connection failed', 'error');
      window.history.replaceState({}, '', '/social-media');
    }
  }, [location.search]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [acc, st, po] = await Promise.all([
        socialService.getAccounts(),
        socialService.getStats(),
        socialService.getPosts({ limit:50 }),
      ]);
      setAccounts(acc?.data || []);
      setStats(st?.data || null);
      setPosts(po?.data?.posts || []);
    } catch {}
    finally { setLoading(false); }
  };

  const showToast = (msg, type='success') => {
    setToast({ msg, type });
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast({ msg:'', type:'success' }), 3500);
  };

  const getAcc       = pl => accounts.find(a => a.platform === pl);
  const handleConnect = pl => { const t = localStorage.getItem('token'); window.location.href = `${API_BASE_URL}/api/social/auth/${pl}?token=${t}`; };
  const handleDisconnect = async pl => {
    if (!window.confirm(`Disconnect ${PLATFORMS[pl].label}?`)) return;
    try { await socialService.disconnectAccount(pl); loadAll(); showToast(`${PLATFORMS[pl].label} disconnected`); }
    catch { showToast('Failed','error'); }
  };
  const togglePlatform = pl => setPost(p => ({ ...p, platforms: p.platforms.includes(pl) ? p.platforms.filter(x=>x!==pl) : [...p.platforms, pl] }));

  const handlePublish = async (asDraft=false) => {
    if (!post.content.trim())   return showToast('Write something first','error');
    if (!post.platforms.length) return showToast('Select at least one platform','error');
    setPostSaving(true);
    try {
      const payload = {
        content: post.content, platforms: post.platforms,
        scheduledAt: post.scheduledAt || null,
        tags:   post.tags ? post.tags.split(',').map(t=>t.trim()).filter(Boolean) : [],
        media:  mediaFiles.map(m => ({ url: m.url, type: m.type, thumbnailUrl: m.thumbnailUrl })),
        status: asDraft ? 'draft' : post.scheduledAt ? 'scheduled' : 'published',
      };
      if (editPost) {
        await socialService.updatePost(editPost._id, payload);
        showToast('Post updated!');
      } else {
        const res = await socialService.createPost(payload);
        const msg = res?.data?.message || '';
        // Backend returns specific message if any platform publish failed
        if (msg.includes('failed on')) {
          showToast(msg, 'error');
        } else {
          showToast(asDraft ? 'Saved as draft' : post.scheduledAt ? 'Post scheduled!' : 'Published successfully!');
        }
      }
      setPost(emptyPost()); setEditPost(null); setMediaFiles([]); loadAll();
    } catch(e) { showToast(e?.response?.data?.message||'Failed','error'); }
    finally { setPostSaving(false); }
  };

  const handleMediaPick = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (mediaFiles.length + files.length > 4) return showToast('Max 4 media files allowed','error');
    setMediaUploading(true);
    try {
      for (const file of files) {
        const res = await socialService.uploadMedia(file);
        const m = res?.data;
        if (m?.url) setMediaFiles(prev => [...prev, { url: m.url, type: m.type, thumbnailUrl: m.thumbnailUrl, name: file.name }]);
      }
      showToast('Media uploaded!');
    } catch { showToast('Upload failed','error'); }
    finally { setMediaUploading(false); if(fileInput.current) fileInput.current.value=''; }
  };

  const removeMedia = idx => setMediaFiles(prev => prev.filter((_,i)=>i!==idx));

  const handleDeletePost = async id => {
    if (!window.confirm('Delete this post?')) return;
    try { await socialService.deletePost(id); loadAll(); showToast('Post deleted'); } catch {}
  };
  const openEditPost = p => {
    setEditPost(p);
    setPost({ content:p.content, platforms:p.platforms, scheduledAt:p.scheduledAt?new Date(p.scheduledAt).toISOString().slice(0,16):'', tags:(p.tags||[]).join(', ') });
    setTab('composer');
  };

  const filteredPosts = posts.filter(p => (!filterStatus||p.status===filterStatus) && (!filterPlatform||p.platforms.includes(filterPlatform)));
  const connectedCount = accounts.filter(a=>a.isConnected).length;
  const minCharLimit = post.platforms.length ? Math.min(...post.platforms.map(pl=>PLATFORMS[pl]?.charLimit||9999)) : 280;
  const overLimit = post.content.length > minCharLimit;

  return (
    <DashboardLayout title="Social Media">
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.35} }
        .s-btn { cursor:pointer;transition:all .15s;border:none;font-family:inherit; }
        .s-btn:hover { filter:brightness(0.93); transform:translateY(-1px); }
        .s-btn:active{ transform:translateY(0); }
        .s-card{ transition:box-shadow .2s,transform .2s; }
        .s-card:hover{ transform:translateY(-2px); box-shadow:0 10px 32px rgba(0,0,0,.09)!important; }
        .s-chip{ cursor:pointer;transition:all .15s;user-select:none; }
        .s-chip:hover{ transform:scale(1.03); }
        input:focus,textarea:focus,select:focus{ border-color:#1252e3!important;box-shadow:0 0 0 3px rgba(18,82,227,.08);outline:none; }
        ::-webkit-scrollbar{width:5px;height:5px} ::-webkit-scrollbar-track{background:#f1f5f9} ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:99px}
      `}</style>

      {/* Toast */}
      {toast.msg && (
        <div style={{position:'fixed',top:20,right:24,zIndex:9999,background:toast.type==='error'?'#DC2626':'#0F172A',color:'#fff',padding:'12px 20px',borderRadius:12,fontSize:13,fontWeight:600,boxShadow:'0 8px 28px rgba(0,0,0,.22)',animation:'fadeUp .2s ease',display:'flex',alignItems:'center',gap:8,maxWidth:360}}>
          {toast.type==='error'?'⚠️':'✓'} {toast.msg}
        </div>
      )}

      {/* ── Header Banner ── */}
      <div style={{background:'linear-gradient(135deg,#0F172A 0%,#1E3A5F 60%,#1252E3 100%)',borderRadius:16,padding:'22px 26px',marginBottom:18,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:-70,right:-70,width:250,height:250,borderRadius:'50%',background:'rgba(255,255,255,.03)'}}/>
        <div style={{position:'absolute',bottom:-50,left:'35%',width:180,height:180,borderRadius:'50%',background:'rgba(255,255,255,.02)'}}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:14,position:'relative'}}>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <div style={{width:50,height:50,borderRadius:14,background:'rgba(255,255,255,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>📱</div>
            <div>
              <h2 style={{margin:0,fontSize:20,fontWeight:800,color:'#fff',letterSpacing:'-0.3px'}}>Social Media</h2>
              <p style={{margin:0,fontSize:12,color:'rgba(255,255,255,.45)',marginTop:2}}>Manage accounts · Publish posts · Track performance</p>
            </div>
          </div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            {[{l:'Connected',v:connectedCount},{l:'Total Posts',v:stats?.total||0},{l:'Scheduled',v:stats?.scheduled||0},{l:'Published',v:stats?.published||0}].map(s=>(
              <div key={s.l} style={{background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.1)',borderRadius:12,padding:'10px 18px',textAlign:'center',minWidth:68}}>
                <div style={{fontSize:20,fontWeight:800,color:'#fff'}}>{s.v}</div>
                <div style={{fontSize:10,color:'rgba(255,255,255,.45)',marginTop:2,fontWeight:600,letterSpacing:'.3px'}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{display:'flex',gap:4,marginBottom:20,background:'#fff',borderRadius:12,padding:5,border:'1px solid #E2E8F0',width:'fit-content',boxShadow:'0 1px 4px rgba(0,0,0,.05)'}}>
        {[{id:'accounts',icon:'🔗',label:'Accounts',badge:connectedCount},{id:'composer',icon:'✍️',label:'Composer'},{id:'posts',icon:'📋',label:'Posts',badge:stats?.total||0}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} className="s-btn"
            style={{padding:'8px 20px',fontSize:12,fontWeight:700,borderRadius:8,background:tab===t.id?'linear-gradient(135deg,#1252e3,#0F172A)':'transparent',color:tab===t.id?'#fff':'#64748B',boxShadow:tab===t.id?'0 4px 14px rgba(18,82,227,.28)':'none',display:'flex',alignItems:'center',gap:6}}>
            <span>{t.icon}</span>{t.label}
            {t.badge>0&&<span style={{background:tab===t.id?'rgba(255,255,255,.2)':'#E2E8F0',color:tab===t.id?'#fff':'#64748B',fontSize:10,fontWeight:800,padding:'1px 7px',borderRadius:99}}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* ══════════════ ACCOUNTS ══════════════ */}
      {tab==='accounts' && (
        <div style={{animation:'fadeUp .2s ease'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14}}>
            {Object.entries(PLATFORMS).map(([key,pl])=>{
              const acc=getAcc(key), linked=acc?.isConnected, Icon=PL_ICON[key];
              return (
                <div key={key} className="s-card" style={{background:'#fff',borderRadius:18,border:'1px solid #E8ECF0',boxShadow:'0 2px 8px rgba(0,0,0,.05)',overflow:'hidden'}}>
                  {/* color top bar */}
                  <div style={{height:4,background:`linear-gradient(90deg,${pl.color},${pl.color}66)`}}/>
                  <div style={{padding:20}}>

                    {/* Header row */}
                    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
                      <div style={{width:48,height:48,borderRadius:14,overflow:'hidden',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:pl.bg}}>
                        <Icon size={40}/>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:15,fontWeight:800,color:'#0F172A'}}>{pl.label}</div>
                        <div style={{fontSize:11,color:'#94A3B8',marginTop:1}}>{pl.desc}</div>
                      </div>
                      {/* status dot */}
                      <div style={{display:'flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:99,background:linked?'#F0FDF4':'#F8FAFC',border:`1px solid ${linked?'#BBF7D0':'#E2E8F0'}`}}>
                        <div style={{width:6,height:6,borderRadius:'50%',background:linked?'#10B981':'#CBD5E1',...(linked?{animation:'pulse 2s infinite'}:{})}}/>
                        <span style={{fontSize:11,fontWeight:700,color:linked?'#10B981':'#94A3B8'}}>{linked?'Connected':'Not connected'}</span>
                      </div>
                    </div>

                    {linked && acc ? (
                      <>
                        {/* Profile card */}
                        <div style={{display:'flex',alignItems:'center',gap:10,padding:'11px 13px',borderRadius:12,background:'#F8FAFC',border:'1px solid #F1F5F9',marginBottom:14}}>
                          {acc.profileImage
                            ? <img src={acc.profileImage} alt="" style={{width:38,height:38,borderRadius:'50%',objectFit:'cover',border:`2px solid ${pl.color}33`,flexShrink:0}}/>
                            : <div style={{width:38,height:38,borderRadius:'50%',background:pl.color,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:16,fontWeight:700,flexShrink:0}}>{(acc.accountName||'?')[0].toUpperCase()}</div>
                          }
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:700,color:'#0F172A',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{acc.accountName||'Connected'}</div>
                            {acc.accountHandle&&<div style={{fontSize:11,color:'#94A3B8',marginTop:1}}>@{acc.accountHandle}</div>}
                          </div>
                          {acc.accountUrl&&(
                            <a href={acc.accountUrl} target="_blank" rel="noreferrer"
                              style={{fontSize:11,color:pl.color,fontWeight:700,textDecoration:'none',padding:'4px 9px',borderRadius:7,background:pl.bg,border:`1px solid ${pl.color}22`,flexShrink:0}}>
                              Visit ↗
                            </a>
                          )}
                        </div>

                        {acc.lastSyncAt&&<div style={{fontSize:11,color:'#94A3B8',textAlign:'center',marginBottom:14}}>Connected on: {fmtDate(acc.lastSyncAt)}</div>}

                        <div style={{display:'flex',gap:8}}>
                          <button onClick={()=>handleConnect(key)} className="s-btn" style={{flex:1,padding:'9px 0',fontSize:12,fontWeight:700,borderRadius:10,background:'#F1F5F9',color:'#374151',border:'1px solid #E2E8F0'}}>
                            🔄 Reconnect
                          </button>
                          <button onClick={()=>handleDisconnect(key)} className="s-btn" style={{padding:'9px 14px',fontSize:12,fontWeight:600,borderRadius:10,background:'#FFF5F5',color:'#DC2626',border:'1px solid #FEE2E2'}}>
                            Disconnect
                          </button>
                        </div>
                      </>
                    ):(
                      <>
                        <div style={{padding:'18px 14px',textAlign:'center',borderRadius:12,background:'#F8FAFC',border:'1.5px dashed #E2E8F0',marginBottom:14}}>
                          <div style={{marginBottom:8,opacity:.3}}><Icon size={36}/></div>
                          <p style={{margin:0,fontSize:12,color:'#94A3B8',lineHeight:1.6}}>
                            Connect your {pl.label} account to publish posts and track insights from one place.
                          </p>
                        </div>
                        <button onClick={()=>handleConnect(key)} className="s-btn"
                          style={{width:'100%',padding:'12px 0',fontSize:13,fontWeight:700,borderRadius:11,background:`linear-gradient(135deg,${pl.color},${pl.color}CC)`,color:'#fff',boxShadow:`0 4px 16px ${pl.color}44`,letterSpacing:'.2px',display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
                          <Icon size={20}/>
                          Connect {pl.label}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════ COMPOSER ══════════════ */}
      {tab==='composer' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 380px',gap:16,alignItems:'flex-start',animation:'fadeUp .2s ease'}}>

          {/* Left */}
          <div style={{background:'#fff',borderRadius:16,border:'1px solid #E2E8F0',overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,.05)'}}>
            <div style={{padding:'15px 20px',background:'linear-gradient(135deg,#0F172A,#1252E3)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontSize:14,fontWeight:800,color:'#fff'}}>{editPost?'✏️ Edit Post':'✍️ Compose Post'}</div>
              {editPost&&<button onClick={()=>{setEditPost(null);setPost(emptyPost());}} className="s-btn" style={{background:'rgba(255,255,255,.15)',border:'1px solid rgba(255,255,255,.2)',borderRadius:7,color:'#fff',padding:'4px 10px',fontSize:12}}>✕ Cancel Edit</button>}
            </div>

            <div style={{padding:20,display:'flex',flexDirection:'column',gap:18}}>
              {/* Platform selector */}
              <div>
                <div style={lbl}>Select Platforms *</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:8}}>
                  {Object.entries(PLATFORMS).map(([key,pl])=>{
                    const sel=post.platforms.includes(key), conn=getAcc(key)?.isConnected, Icon=PL_ICON[key];
                    return (
                      <div key={key} onClick={()=>togglePlatform(key)} className="s-chip"
                        style={{display:'flex',alignItems:'center',gap:7,padding:'7px 13px',borderRadius:99,border:`2px solid ${sel?pl.color:'#E2E8F0'}`,background:sel?pl.bg:'#F8FAFC',opacity:conn?1:.4}}>
                        <Icon size={16}/>
                        <span style={{fontSize:12,fontWeight:700,color:sel?pl.color:'#64748B'}}>{pl.label}</span>
                        {sel&&<span style={{color:pl.color,fontSize:12,fontWeight:800}}>✓</span>}
                        {!conn&&<span style={{fontSize:9,color:'#94A3B8'}}>not connected</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Content */}
              <div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                  <div style={lbl}>Content *</div>
                  <span style={{fontSize:11,fontWeight:700,color:overLimit?'#DC2626':post.content.length>minCharLimit*.85?'#D97706':'#94A3B8'}}>
                    {post.content.length.toLocaleString()} / {minCharLimit.toLocaleString()}
                  </span>
                </div>
                <textarea value={post.content} onChange={e=>setPost(p=>({...p,content:e.target.value}))}
                  rows={8} placeholder="What would you like to share? Write an update, insight, or announcement..."
                  style={{...inp,resize:'vertical',lineHeight:1.75,borderColor:overLimit?'#DC2626':'#E2E8F0'}}/>
                {overLimit&&<div style={{fontSize:11,color:'#DC2626',marginTop:4,fontWeight:600}}>⚠️ Exceeds {post.platforms.includes('twitter')?'Twitter/X (280 chars)':'platform'} character limit</div>}
              </div>

              {/* Media Upload */}
              <div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                  <div style={lbl}>Photos / Videos</div>
                  <span style={{fontSize:11,color:'#94A3B8'}}>{mediaFiles.length}/4</span>
                </div>

                {/* Upload area */}
                {mediaFiles.length < 4 && (
                  <div onClick={()=>fileInput.current?.click()}
                    style={{border:'2px dashed #E2E8F0',borderRadius:12,padding:'18px',textAlign:'center',cursor:'pointer',background:'#FAFBFF',transition:'all .15s'}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='#1252E3';e.currentTarget.style.background='#EEF2FF';}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='#E2E8F0';e.currentTarget.style.background='#FAFBFF';}}>
                    {mediaUploading
                      ? <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}><div style={{width:18,height:18,borderRadius:'50%',border:'2px solid #1252E3',borderTopColor:'transparent',animation:'spin .7s linear infinite'}}/><span style={{fontSize:12,color:'#64748B',fontWeight:600}}>Uploading...</span></div>
                      : <>
                          <div style={{fontSize:28,marginBottom:4}}>📎</div>
                          <div style={{fontSize:12,fontWeight:700,color:'#374151'}}>Click to upload photos or videos</div>
                          <div style={{fontSize:11,color:'#94A3B8',marginTop:2}}>JPG, PNG, GIF, MP4, MOV — Max 100MB</div>
                        </>
                    }
                  </div>
                )}
                <input ref={fileInput} type="file" multiple accept="image/*,video/*" style={{display:'none'}} onChange={handleMediaPick}/>

                {/* Media previews */}
                {mediaFiles.length > 0 && (
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginTop:10}}>
                    {mediaFiles.map((m,i)=>(
                      <div key={i} style={{position:'relative',borderRadius:10,overflow:'hidden',aspectRatio:'1',background:'#F1F5F9'}}>
                        {m.type==='video'
                          ? <video src={m.url} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                          : <img src={m.url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        }
                        {m.type==='video' && <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.3)'}}><span style={{fontSize:20}}>▶</span></div>}
                        <button onClick={()=>removeMedia(i)} className="s-btn"
                          style={{position:'absolute',top:4,right:4,width:22,height:22,borderRadius:'50%',background:'rgba(0,0,0,.6)',color:'#fff',fontSize:11,display:'flex',alignItems:'center',justifyContent:'center',padding:0}}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Hashtags */}
              <div>
                <div style={lbl}>Hashtags</div>
                <input value={post.tags} onChange={e=>setPost(p=>({...p,tags:e.target.value}))} placeholder="#marketing, #crm, #sales" style={{...inp,marginTop:8}}/>
              </div>

              {/* Schedule */}
              <div>
                <div style={lbl}>Schedule (leave empty to publish now)</div>
                <input type="datetime-local" value={post.scheduledAt} onChange={e=>setPost(p=>({...p,scheduledAt:e.target.value}))} style={{...inp,marginTop:8,color:post.scheduledAt?'#0F172A':'#94A3B8'}}/>
                {post.scheduledAt&&<div style={{fontSize:11,color:'#D97706',marginTop:4,fontWeight:600}}>⏰ Will publish on {new Date(post.scheduledAt).toLocaleString()}</div>}
              </div>

              {/* Buttons */}
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>handlePublish(false)} disabled={postSaving||mediaUploading} className="s-btn"
                  style={{flex:1,padding:'12px 0',background:(postSaving||mediaUploading)?'#94A3B8':'linear-gradient(135deg,#1252E3,#0F172A)',color:'#fff',borderRadius:10,fontSize:13,fontWeight:700,boxShadow:(postSaving||mediaUploading)?'none':'0 4px 14px rgba(18,82,227,.28)',opacity:(postSaving||mediaUploading)?.7:1}}>
                  {postSaving?'⏳ Publishing...':post.scheduledAt?'⏰ Schedule Post':editPost?'✓ Update Post':'🚀 Publish Now'}
                </button>
                <button onClick={()=>handlePublish(true)} disabled={postSaving||mediaUploading} className="s-btn"
                  style={{padding:'12px 18px',background:'#F8FAFC',color:'#374151',border:'1px solid #E2E8F0',borderRadius:10,fontSize:13,fontWeight:600}}>
                  📝 Draft
                </button>
              </div>
            </div>
          </div>

          {/* Right: Preview */}
          <div style={{background:'#fff',borderRadius:16,border:'1px solid #E2E8F0',overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,.04)',position:'sticky',top:20}}>
            <div style={{padding:'13px 16px',borderBottom:'1px solid #F1F5F9',display:'flex',alignItems:'center',gap:8,background:'#FAFBFF'}}>
              <div style={{width:7,height:7,borderRadius:'50%',background:'#10B981',animation:'pulse 2s infinite'}}/>
              <span style={{fontSize:12,fontWeight:700,color:'#0F172A'}}>Live Preview</span>
            </div>
            <div style={{padding:14,display:'flex',flexDirection:'column',gap:12,maxHeight:'72vh',overflowY:'auto'}}>
              {post.platforms.length===0?(
                <div style={{padding:'50px 20px',textAlign:'center'}}>
                  <div style={{fontSize:40,marginBottom:10,opacity:.25}}>📱</div>
                  <div style={{fontSize:12,color:'#94A3B8',fontWeight:600}}>Select platforms to preview your post</div>
                </div>
              ):post.platforms.map(pl=>{
                const plM=PLATFORMS[pl], acc=getAcc(pl), Icon=PL_ICON[pl];
                return (
                  <div key={pl} style={{border:'1px solid #E8ECF0',borderRadius:14,overflow:'hidden'}}>
                    <div style={{padding:'10px 13px',background:plM.bg,borderBottom:'1px solid #E8ECF0',display:'flex',alignItems:'center',gap:8}}>
                      <Icon size={18}/><span style={{fontSize:12,fontWeight:800,color:plM.color}}>{plM.label}</span>
                    </div>
                    <div style={{padding:13}}>
                      <div style={{display:'flex',gap:9,marginBottom:10,alignItems:'flex-start'}}>
                        {acc?.profileImage
                          ?<img src={acc.profileImage} alt="" style={{width:34,height:34,borderRadius:'50%',objectFit:'cover',flexShrink:0}}/>
                          :<div style={{width:34,height:34,borderRadius:'50%',background:plM.color,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:14,fontWeight:700,flexShrink:0}}>{(acc?.accountName||'Y')[0].toUpperCase()}</div>
                        }
                        <div>
                          <div style={{fontSize:12,fontWeight:700,color:'#0F172A'}}>{acc?.accountName||'Your Account'}</div>
                          <div style={{fontSize:10,color:'#94A3B8'}}>{post.scheduledAt?`Scheduled · ${new Date(post.scheduledAt).toLocaleString()}`:'Just now'}</div>
                        </div>
                      </div>
                      <div style={{fontSize:13,color:'#374151',lineHeight:1.65,whiteSpace:'pre-wrap',wordBreak:'break-word',marginBottom:8}}>
                        {post.content||<span style={{color:'#CBD5E1',fontStyle:'italic'}}>Your post content will appear here...</span>}
                      </div>
                      {post.tags&&<div style={{fontSize:12,color:plM.color,fontWeight:600,marginBottom:8}}>{post.tags.split(',').map(t=>t.trim()).filter(Boolean).map(t=>t.startsWith('#')?t:`#${t}`).join(' ')}</div>}
                      {/* Media preview */}
                      {mediaFiles.length>0&&(
                        <div style={{display:'grid',gridTemplateColumns:mediaFiles.length===1?'1fr':'1fr 1fr',gap:4,marginBottom:8,borderRadius:10,overflow:'hidden'}}>
                          {mediaFiles.slice(0,4).map((m,i)=>(
                            <div key={i} style={{position:'relative',aspectRatio:'1',background:'#F1F5F9'}}>
                              {m.type==='video'?<video src={m.url} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<img src={m.url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>}
                              {m.type==='video'&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.25)'}}><span style={{fontSize:16}}>▶</span></div>}
                              {i===3&&mediaFiles.length>4&&<div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:18}}>+{mediaFiles.length-4}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{display:'flex',gap:14,paddingTop:8,borderTop:'1px solid #F1F5F9'}}>
                        {['👍 Like','💬 Comment','↗️ Share'].map(a=><span key={a} style={{fontSize:11,color:'#94A3B8',fontWeight:600}}>{a}</span>)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ POSTS ══════════════ */}
      {tab==='posts' && (
        <div style={{animation:'fadeUp .2s ease'}}>
          {/* Summary pills */}
          <div style={{display:'flex',gap:10,marginBottom:18,flexWrap:'wrap'}}>
            {Object.entries(POST_STATUS).map(([k,v])=>{
              const count = posts.filter(p=>p.status===k).length;
              const active = filterStatus===k;
              return (
                <div key={k} onClick={()=>setFilterStatus(active?'':k)} className="s-btn"
                  style={{display:'flex',alignItems:'center',gap:9,padding:'10px 18px',borderRadius:99,cursor:'pointer',transition:'all .18s',
                    background: active ? v.color : v.bg,
                    border:`1.5px solid ${active ? v.color : v.color+'55'}`,
                    boxShadow: active ? `0 4px 16px ${v.color}44` : 'none'}}>
                  <span style={{fontSize:14}}>{v.icon}</span>
                  <span style={{fontSize:13,fontWeight:700,color:active?'#fff':v.color}}>{v.label}</span>
                  <span style={{fontSize:12,fontWeight:800,padding:'2px 9px',borderRadius:99,
                    background:active?'rgba(255,255,255,.22)':v.color+'22',
                    color:active?'#fff':v.color}}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Filters */}
          <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={selSt}>
              <option value="">All Status</option>
              {Object.entries(POST_STATUS).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
            <select value={filterPlatform} onChange={e=>setFilterPlatform(e.target.value)} style={selSt}>
              <option value="">All Platforms</option>
              {Object.entries(PLATFORMS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
            <button onClick={()=>setTab('composer')} className="s-btn"
              style={{marginLeft:'auto',padding:'9px 18px',background:'linear-gradient(135deg,#1252E3,#0F172A)',color:'#fff',borderRadius:9,fontSize:12,fontWeight:700,boxShadow:'0 4px 12px rgba(18,82,227,.25)'}}>
              + New Post
            </button>
          </div>

          {/* List */}
          {loading?(
            <div style={{padding:50,textAlign:'center'}}><div style={{width:28,height:28,borderRadius:'50%',border:'3px solid #1252E3',borderTopColor:'transparent',margin:'0 auto',animation:'spin .8s linear infinite'}}/></div>
          ):filteredPosts.length===0?(
            <div style={{padding:60,textAlign:'center',background:'#fff',borderRadius:16,border:'2px dashed #E2E8F0'}}>
              <div style={{fontSize:44,marginBottom:12}}>📭</div>
              <p style={{fontSize:14,fontWeight:700,color:'#0F172A',margin:'0 0 6px'}}>No posts yet</p>
              <p style={{fontSize:12,color:'#94A3B8',margin:'0 0 16px'}}>Create your first social media post</p>
              <button onClick={()=>setTab('composer')} className="s-btn" style={{padding:'10px 22px',background:'linear-gradient(135deg,#1252E3,#0F172A)',color:'#fff',borderRadius:9,fontSize:13,fontWeight:700,boxShadow:'0 4px 12px rgba(18,82,227,.25)'}}>+ New Post</button>
            </div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {filteredPosts.map((p,i)=>{
                const st=POST_STATUS[p.status]||POST_STATUS.draft;
                return (
                  <div key={p._id} style={{background:'#fff',borderRadius:14,border:'1px solid #E8ECF0',padding:'16px 18px',boxShadow:'0 2px 6px rgba(0,0,0,.04)',animation:`fadeUp .15s ease ${i*.03}s both`,display:'flex',gap:14,alignItems:'flex-start'}}>
                    <div style={{flex:1,minWidth:0}}>
                      {/* Platform + status */}
                      <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:9,alignItems:'center'}}>
                        {p.platforms.map(pl=>{
                          const Icon=PL_ICON[pl];
                          return Icon?(
                            <span key={pl} style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:11,fontWeight:700,padding:'3px 8px',borderRadius:99,background:PLATFORMS[pl]?.bg,color:PLATFORMS[pl]?.color,border:`1px solid ${PLATFORMS[pl]?.color}33`}}>
                              <Icon size={12}/>{PLATFORMS[pl]?.label}
                            </span>
                          ):null;
                        })}
                        <span style={{fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:99,background:st.bg,color:st.color}}>{st.icon} {st.label}</span>
                      </div>
                      <div style={{fontSize:13,color:'#374151',lineHeight:1.6,marginBottom:8,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{p.content}</div>
                      {/* Media thumbnails */}
                      {p.media?.length>0&&(
                        <div style={{display:'flex',gap:6,marginBottom:8,flexWrap:'wrap'}}>
                          {p.media.slice(0,4).map((m,i)=>(
                            <div key={i} style={{position:'relative',width:56,height:56,borderRadius:8,overflow:'hidden',background:'#F1F5F9',flexShrink:0}}>
                              <img src={m.thumbnailUrl||m.url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                              {m.type==='video'&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.3)'}}><span style={{fontSize:14,color:'#fff'}}>▶</span></div>}
                            </div>
                          ))}
                          {p.media.length>4&&<div style={{width:56,height:56,borderRadius:8,background:'#F1F5F9',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#64748B'}}>+{p.media.length-4}</div>}
                        </div>
                      )}
                      {p.tags?.length>0&&<div style={{fontSize:11,color:'#1252E3',fontWeight:600,marginBottom:6}}>{p.tags.map(t=>t.startsWith('#')?t:`#${t}`).join(' ')}</div>}
                      <div style={{display:'flex',gap:14,flexWrap:'wrap',fontSize:11,color:'#94A3B8'}}>
                        {p.scheduledAt&&<span>⏰ {fmtDate(p.scheduledAt)}</span>}
                        {p.publishedAt&&<span>✓ {fmtDate(p.publishedAt)}</span>}
                        {p.status==='published'&&<><span>👍 {p.engagement?.likes||0}</span><span>💬 {p.engagement?.comments||0}</span><span>🔁 {p.engagement?.shares||0}</span></>}
                      </div>
                    </div>
                    <div style={{display:'flex',gap:6,flexShrink:0}}>
                      {p.status!=='published'&&<button onClick={()=>openEditPost(p)} className="s-btn" style={{padding:'7px 13px',fontSize:11,fontWeight:700,borderRadius:8,border:'1px solid #E2E8F0',background:'#F8FAFC',color:'#374151'}}>✏️ Edit</button>}
                      <button onClick={()=>handleDeletePost(p._id)} className="s-btn" style={{padding:'7px 11px',fontSize:11,borderRadius:8,border:'1px solid #FEE2E2',background:'#FFF5F5',color:'#DC2626'}}>🗑️</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

const lbl   = { display:'block', fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'.5px' };
const inp   = { width:'100%', padding:'10px 12px', fontSize:13, border:'1.5px solid #E2E8F0', borderRadius:9, boxSizing:'border-box', outline:'none', fontFamily:'inherit', transition:'border-color .15s' };
const selSt = { padding:'9px 12px', fontSize:12, border:'1.5px solid #E2E8F0', borderRadius:9, outline:'none', background:'#fff', color:'#374151', fontFamily:'inherit' };