import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../config/api.config';
import SharedHeader from '../components/SharedHeader';
import SharedFooter from '../components/SharedFooter';

const NAME_MAX=30, NAME_MIN=2, PASS_MIN=8, PASS_MAX=12;
const FEATURES=['Lead Management','Contacts & Accounts','Opportunities','B2B Sales Workflow','Email Inbox','Support Tickets','Product Catalog','Tasks & Meetings','Feedback Management','Reports & Analytics'];
const ROLES=['IT Consultant','Business Agency','Freelancer','Distributor / Reseller','System Integrator','Other'];
const pwCheck=(p)=>({len:p.length>=PASS_MIN,up:/[A-Z]/.test(p),lo:/[a-z]/.test(p),num:/[0-9]/.test(p),sym:/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p)});
const scoreOf=(c)=>Object.values(c).filter(Boolean).length;
const stOf=(s)=>s<=2?['Weak','#ef4444']:s<=3?['Fair','#d97706']:s===4?['Good','#2563eb']:['Strong','#059669'];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box;}
body{margin:0;background:#0f1e2e;}
.pp-wrap{ font-family:'Inter',-apple-system,sans-serif; background:#0f1e2e; color:#fff; overflow-x:hidden; }

/* Hero */
.pp-hero{
  padding:120px 0 80px; text-align:center; position:relative; overflow:hidden;
  background:
    radial-gradient(ellipse at 80% 10%, rgba(30,185,128,0.14) 0%, transparent 50%),
    radial-gradient(ellipse at 10% 90%, rgba(30,185,128,0.08) 0%, transparent 45%),
    #0f1e2e;
}
.pp-hero::before{
  content:''; position:absolute; inset:0; pointer-events:none;
  background-image:radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px);
  background-size:32px 32px;
}
.pp-container{ max-width:1200px; margin:0 auto; padding:0 40px; }
@media(max-width:768px){.pp-container{padding:0 20px;}}
.pp-badge{
  display:inline-flex; align-items:center; gap:6px; padding:5px 14px;
  background:rgba(30,185,128,0.1); border:1px solid rgba(30,185,128,0.25);
  border-radius:999px; font-size:11px; font-weight:800; color:#1EB980;
  letter-spacing:1.5px; text-transform:uppercase; margin-bottom:20px;
}
.pp-h1{ font-size:clamp(36px,5vw,60px); font-weight:900; color:#fff; margin:0 0 16px; letter-spacing:-1px; line-height:1.1; }
.pp-sub{ font-size:17px; color:rgba(255,255,255,0.55); max-width:540px; margin:0 auto 36px; line-height:1.7; }
.pp-btn-primary{
  padding:14px 32px; font-size:15px; font-weight:700; font-family:inherit;
  color:#fff; background:#1EB980; border:none; border-radius:999px; cursor:pointer;
  transition:all .2s; box-shadow:0 4px 20px rgba(30,185,128,0.38);
}
.pp-btn-primary:hover{background:#19a872; box-shadow:0 6px 28px rgba(30,185,128,0.52); transform:translateY(-1px);}

/* Benefits */
.pp-section{ padding:80px 0; }
.pp-section-alt{ padding:80px 0; background:#162e48; }
.pp-grid3{ display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
.pp-grid2{ display:grid; grid-template-columns:1fr 1fr; gap:20px; }
@media(max-width:900px){.pp-grid3{grid-template-columns:1fr 1fr;} .pp-grid2{grid-template-columns:1fr;}}
@media(max-width:520px){.pp-grid3{grid-template-columns:1fr;}}
@media(max-width:860px){.pp-two-col{grid-template-columns:1fr!important;}}
@media(max-width:520px){.pp-rrow{grid-template-columns:1fr!important;}}
.pp-card{
  background:#1a3654; border:1px solid rgba(255,255,255,0.08); border-radius:16px;
  padding:28px 24px; transition:all .2s;
}
.pp-card:hover{border-color:rgba(30,185,128,0.25); transform:translateY(-3px);}
.pp-card-icon{font-size:28px; margin-bottom:14px;}
.pp-card-title{font-size:16px; font-weight:700; color:#fff; margin-bottom:8px;}
.pp-card-desc{font-size:13px; color:rgba(255,255,255,0.5); line-height:1.6;}

/* Commission table */
.pp-tier{
  background:#1a3654; border:1px solid rgba(255,255,255,0.08); border-radius:14px;
  padding:24px; text-align:center; transition:all .2s;
}
.pp-tier.featured{ background:rgba(30,185,128,0.1); border-color:rgba(30,185,128,0.35); }
.pp-tier:hover{transform:translateY(-3px);}
.pp-tier-name{font-size:12px; font-weight:700; color:rgba(255,255,255,0.5); letter-spacing:1px; text-transform:uppercase; margin-bottom:8px;}
.pp-tier-pct{font-size:40px; font-weight:900; color:#1EB980; letter-spacing:-2px; margin-bottom:6px;}
.pp-tier-label{font-size:13px; color:rgba(255,255,255,0.45); margin-bottom:16px;}
.pp-tier-feat{font-size:12px; color:rgba(255,255,255,0.6); margin:4px 0; display:flex; align-items:center; gap:6px; justify-content:center;}

/* Main form section */
.pp-main{
  padding:80px 0;
  background:
    radial-gradient(ellipse at 75% 5%, rgba(30,185,128,0.14) 0%, transparent 45%),
    radial-gradient(ellipse at 10% 95%, rgba(30,185,128,0.08) 0%, transparent 40%),
    linear-gradient(155deg, #07111e 0%, #0a1826 40%, #0d2236 70%, #0f2440 100%);
}
/* Tabs */
.pp-tab-wrap{display:flex; justify-content:center; margin-bottom:40px;}
.pp-tabs{
  display:inline-flex; gap:4px; background:rgba(255,255,255,0.07);
  border-radius:999px; padding:5px;
}
.pp-tab{
  padding:10px 28px; font-size:14px; font-weight:600; font-family:inherit;
  color:rgba(255,255,255,0.55); background:none; border:none; cursor:pointer;
  border-radius:999px; white-space:nowrap; transition:all .25s;
}
.pp-tab:hover{color:rgba(255,255,255,0.85);}
.pp-tab.active{color:#0f1e2e; background:#e8f5e9; box-shadow:0 2px 12px rgba(0,0,0,0.25);}

/* Form card */
.pp-form-card{
  width:100%; max-width:500px; margin:0 auto;
  background:rgba(8,18,32,0.75); border:1px solid rgba(255,255,255,0.1);
  border-radius:20px; padding:36px 40px;
  backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px);
  box-shadow:0 24px 60px rgba(0,0,0,0.5);
}
@media(max-width:520px){.pp-form-card{padding:28px 20px;} .pp-rrow{grid-template-columns:1fr!important;}}
.pp-inp{
  width:100%; padding:9px 12px; font-size:12px; font-family:inherit; color:#1f2937;
  background:#f9fafb; border:1.5px solid #e5e7eb;
  border-radius:8px; outline:none; transition:border-color .2s,box-shadow .2s;
}
.pp-inp::placeholder{color:#9ca3af;}
.pp-inp:focus{border-color:#1EB980; box-shadow:0 0 0 3px rgba(30,185,128,0.12); background:#fff;}
.pp-inp:-webkit-autofill{-webkit-box-shadow:0 0 0 30px #f9fafb inset!important;-webkit-text-fill-color:#1f2937!important;}
select.pp-inp option{background:#fff; color:#1f2937;}
.pp-lbl{display:block; font-size:11px; font-weight:600; color:#374151; margin-bottom:4px;}
@media(max-width:860px){
  #pp-form-section > div > div > div:first-child + div { grid-template-columns:1fr!important; }
}
.pp-submit{
  width:100%; padding:13px; font-size:15px; font-weight:700; font-family:inherit;
  color:#fff; background:#1EB980; border:none; border-radius:999px; cursor:pointer;
  transition:background .2s,box-shadow .2s,transform .15s;
  box-shadow:0 4px 18px rgba(30,185,128,0.4);
}
.pp-submit:hover{background:#19a872; box-shadow:0 6px 26px rgba(30,185,128,0.55); transform:translateY(-1px);}
.pp-submit:disabled{background:rgba(30,185,128,0.3); box-shadow:none; cursor:not-allowed; transform:none;}
.pp-rrow{display:grid; grid-template-columns:1fr 1fr; gap:10px;}
.pp-chip{
  padding:3px 9px; font-size:10px; font-weight:600; border-radius:20px; cursor:pointer;
  font-family:inherit; transition:all .15s; border:1px solid #e5e7eb;
  background:#f9fafb; color:#6b7280;
}
.pp-chip:hover{border-color:#1EB980; color:#1EB980;}
.pp-chip.on{background:rgba(30,185,128,0.1); border-color:rgba(30,185,128,0.5); color:#059669;}
.pp-err{padding:'10px 14px'; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.22); border-radius:9px; color:#fca5a5; font-size:12px; display:flex; gap:8px; align-items:center; margin-bottom:16px;}
.pp-sep{height:1px; background:#e5e7eb; margin:16px 0;}
.pp-form-dark-txt{color:#374151 !important;}
.pp-form-muted{color:#6b7280 !important;}
`;

const EyeOn  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const EyeOff = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

/* ── LOGIN FORM ── */
function LoginForm() {
  const navigate = useNavigate();
  const [fd, setFd] = useState({ email:'', password:'' });
  const [loading, setLoad] = useState(false);
  const [error, setErr] = useState('');
  const [showPw, setShowPw] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setLoad(true);
    try {
      const res  = await fetch(`${API_URL}/resellers/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(fd) });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.reseller));
        navigate('/reseller/dashboard');
      } else setErr(data.message || 'Login failed');
    } catch { setErr('Failed to login. Please try again.'); }
    finally { setLoad(false); }
  };

  return (
    <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:14}}>
      {error && <div style={{padding:'10px 14px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.22)',borderRadius:9,color:'#fca5a5',fontSize:12,display:'flex',gap:8,alignItems:'center'}}><span>⚠️</span>{error}</div>}
      <div>
        <label className="pp-lbl">Email address <span style={{color:'#ef4444'}}>*</span></label>
        <input className="pp-inp" type="email" value={fd.email} onChange={e=>setFd({...fd,email:e.target.value})} required autoFocus placeholder="partner@company.com"/>
      </div>
      <div>
        <label className="pp-lbl">Password <span style={{color:'#ef4444'}}>*</span></label>
        <div style={{position:'relative'}}>
          <input className="pp-inp" type={showPw?'text':'password'} value={fd.password} onChange={e=>setFd({...fd,password:e.target.value})} required placeholder="Enter your password" style={{paddingRight:40}}/>
          <button type="button" onClick={()=>setShowPw(v=>!v)} tabIndex={-1} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.35)',padding:0,display:'flex'}}>
            {showPw?<EyeOn/>:<EyeOff/>}
          </button>
        </div>
      </div>
      <button className="pp-submit" type="submit" disabled={loading}>
        {loading ? 'Signing in…' : 'Sign in to Partner Dashboard →'}
      </button>
    </form>
  );
}

/* ── REGISTER FORM ── */
function RegisterForm() {
  const navigate = useNavigate();
  const [f, setF] = useState({firstName:'',lastName:'',email:'',phone:'',companyName:'',role:'',requirement:'',password:'',confirmPassword:''});
  const [feats, setFeats] = useState([]);
  const [featsTouched, setFeatsTouched] = useState(false);
  const [tk, setTk] = useState({});
  const [loading, setLoad] = useState(false);
  const [error, setErr] = useState('');
  const [done, setDone] = useState(false);
  const [sp, setSp] = useState(false);
  const [sc2, setSc2] = useState(false);

  const ch = pwCheck(f.password);
  const s  = scoreOf(ch);
  const [sl, sc_] = stOf(s);
  const ok  = f.confirmPassword && f.password === f.confirmPassword;
  const bad = f.confirmPassword && f.password !== f.confirmPassword;

  const upd = (e) => {
    const {name,value} = e.target;
    if ((name==='firstName'||name==='lastName') && value && !/^[A-Za-z\s\-']*$/.test(value)) return;
    if ((name==='firstName'||name==='lastName') && value.length > NAME_MAX) return;
    if (name==='phone' && value && !/^\+?[0-9]*$/.test(value)) return;
    setF({...f,[name]:value}); setErr('');
  };
  const tog  = (x) => { setFeats(p=>p.includes(x)?p.filter(v=>v!==x):[...p,x]); setFeatsTouched(true); };
  const blur = (e) => setTk({...tk,[e.target.name]:true});
  const nb   = (n) => { if(!tk[n]) return '#e5e7eb'; const v=f[n].trim(); return v.length>=NAME_MIN&&/[A-Za-z]/.test(v)?'rgba(30,185,128,0.7)':'rgba(239,68,68,0.7)'; };

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    const fn=f.firstName.trim(), ln=f.lastName.trim();
    if (fn.length<NAME_MIN) return setErr('First name must be at least 2 characters');
    if (!/[A-Za-z]/.test(fn)) return setErr('First name must contain at least one letter');
    if (ln.length<NAME_MIN) return setErr('Last name must be at least 2 characters');
    if (!/^[a-zA-Z0-9]([a-zA-Z0-9._%+\-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.\-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/.test(f.email.trim()) || /\.{2,}/.test(f.email)) return setErr('Enter a valid email address');
    const d = f.phone.replace(/^\+/,'');
    if (!f.phone||!/^\+?[0-9]+$/.test(f.phone)||d.length<7||d.length>15) return setErr('Enter a valid phone number');
    if (!f.companyName.trim()||f.companyName.trim().length<2) return setErr('Company name must be at least 2 characters');
    if (!f.role) return setErr('Please select your role');
    if (!feats.length) { setFeatsTouched(true); return setErr('Please select at least one feature you are interested in.'); }
    if (!ch.len) return setErr(`Password must be at least ${PASS_MIN} characters`);
    if (!ch.up)  return setErr('Password needs an uppercase letter (A-Z)');
    if (!ch.lo)  return setErr('Password needs a lowercase letter (a-z)');
    if (!ch.num) return setErr('Password needs a number (0-9)');
    if (!ch.sym) return setErr('Password needs a special character (!@#$…)');
    if (!f.confirmPassword) return setErr('Please confirm your password');
    if (f.password!==f.confirmPassword) return setErr('Passwords do not match');
    setLoad(true);
    try {
      const res  = await fetch(`${API_URL}/resellers/register`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({firstName:fn,lastName:ln,email:f.email,phone:f.phone,companyName:f.companyName.trim(),occupation:f.role,reason:f.requirement.trim()||`Interested in: ${feats.join(', ')}`,password:f.password,address:{street:'',city:'',state:'',country:'',zipCode:''}})});
      const data = await res.json();
      if (data.success) setDone(true);
      else setErr(data.message||'Registration failed');
    } catch { setErr('Failed to submit. Please try again.'); }
    finally { setLoad(false); }
  };

  if (done) return (
    <div style={{textAlign:'center',padding:'32px 0'}}>
      <div style={{fontSize:48,marginBottom:14}}>🎉</div>
      <h3 style={{fontSize:20,fontWeight:800,color:'#fff',margin:'0 0 8px'}}>Application Submitted!</h3>
      <p style={{fontSize:14,color:'rgba(255,255,255,0.5)',margin:'0 0 24px'}}>We'll review and get back to you in 2–3 business days.</p>
      <button className="pp-btn-primary" onClick={()=>navigate('/')}>← Back to Home</button>
    </div>
  );

  return (
    <form onSubmit={submit} noValidate style={{display:'flex',flexDirection:'column',gap:10}}>
      {error && <div style={{padding:'9px 12px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.22)',borderRadius:9,color:'#fca5a5',fontSize:12,display:'flex',gap:8,alignItems:'center'}}><span>⚠️</span>{error}</div>}

      <div className="pp-rrow">
        <div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><label className="pp-lbl" style={{margin:0}}>First name <span style={{color:'#ef4444'}}>*</span></label><span style={{fontSize:9,color:'#9ca3af'}}>{f.firstName.length}/{NAME_MAX}</span></div>
          <input className="pp-inp" type="text" name="firstName" value={f.firstName} onChange={upd} onBlur={blur} required placeholder="John" style={{borderColor:nb('firstName')}}/>
        </div>
        <div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><label className="pp-lbl" style={{margin:0}}>Last name <span style={{color:'#ef4444'}}>*</span></label><span style={{fontSize:9,color:'#9ca3af'}}>{f.lastName.length}/{NAME_MAX}</span></div>
          <input className="pp-inp" type="text" name="lastName" value={f.lastName} onChange={upd} onBlur={blur} required placeholder="Doe" style={{borderColor:nb('lastName')}}/>
        </div>
      </div>

      <div><label className="pp-lbl">Email address <span style={{color:'#ef4444'}}>*</span></label><input className="pp-inp" type="email" name="email" value={f.email} onChange={upd} onBlur={blur} required maxLength={100} placeholder="john@company.com"/></div>

      <div className="pp-rrow">
        <div><label className="pp-lbl">Phone <span style={{color:'#ef4444'}}>*</span></label><input className="pp-inp" type="tel" name="phone" value={f.phone} onChange={upd} onBlur={blur} required maxLength={16} placeholder="+91 98765 43210"/></div>
        <div><label className="pp-lbl">Company <span style={{color:'#ef4444'}}>*</span></label><input className="pp-inp" type="text" name="companyName" value={f.companyName} onChange={upd} onBlur={blur} required maxLength={60} placeholder="Acme Pvt Ltd"/></div>
      </div>

      <div>
        <label className="pp-lbl">Your role <span style={{color:'#ef4444'}}>*</span></label>
        <select name="role" value={f.role} onChange={upd} onBlur={blur} required className="pp-inp"
          style={{appearance:'none',WebkitAppearance:'none',cursor:'pointer',color:f.role?'#1f2937':'#9ca3af',backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='rgba(0,0,0,0.4)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,backgroundRepeat:'no-repeat',backgroundPosition:'right 12px center',paddingRight:32}}>
          <option value="" disabled>Select your role…</option>
          {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div>
        <label className="pp-lbl" style={{marginBottom:6}}>Interested in <span style={{color:'#ef4444'}}>*</span> <span style={{fontWeight:400,color:'#9ca3af'}}>— select features</span></label>
        <div style={{display:'flex',flexWrap:'wrap',gap:5,padding:featsTouched&&!feats.length?'6px':'0',border:featsTouched&&!feats.length?'1px solid rgba(239,68,68,0.5)':'1px solid transparent',borderRadius:8,transition:'border .2s'}}>
          {FEATURES.map(x=><button key={x} type="button" className={`pp-chip${feats.includes(x)?' on':''}`} onClick={()=>tog(x)}>{feats.includes(x)?'✓ ':''}{x}</button>)}
        </div>
      </div>

      <div>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><label className="pp-lbl" style={{margin:0}}>Requirement <span style={{fontWeight:400,color:'#9ca3af'}}>(optional)</span></label><span style={{fontSize:9,color:'#9ca3af'}}>{f.requirement.length}/200</span></div>
        <textarea name="requirement" value={f.requirement} onChange={upd} rows={2} maxLength={200} placeholder="Brief description of your business goals…" className="pp-inp" style={{resize:'none',lineHeight:1.4}}/>
      </div>

      <div>
        <label className="pp-lbl">Password <span style={{color:'#ef4444'}}>*</span></label>
        <div style={{position:'relative'}}>
          <input className="pp-inp" type={sp?'text':'password'} name="password" value={f.password} onChange={upd} onBlur={blur} required maxLength={PASS_MAX} placeholder={`${PASS_MIN}–${PASS_MAX} chars · A-Z · 0-9 · symbol`} style={{paddingRight:36}}/>
          <button type="button" onClick={()=>setSp(v=>!v)} tabIndex={-1} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.32)',padding:0,display:'flex'}}>{sp?<EyeOn/>:<EyeOff/>}</button>
        </div>
        {f.password.length>0&&(
          <div style={{marginTop:8}}>
            <div style={{display:'flex',gap:4,alignItems:'center',marginBottom:8}}>
              {[1,2,3,4,5].map(i=><div key={i} style={{flex:1,height:3,borderRadius:3,background:i<=s?sc_:'#e5e7eb',transition:'background .3s'}}/>)}
              <span style={{fontSize:11,fontWeight:700,color:sc_,marginLeft:6}}>{sl}</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 10px'}}>
              {[['len',`Min ${PASS_MIN} chars`],['up','Uppercase (A-Z)'],['lo','Lowercase (a-z)'],['num','Number (0-9)'],['sym','Symbol (!@#$)']].map(([k,lab])=>(
                <div key={k} style={{display:'flex',alignItems:'center',gap:5}}>
                  <span style={{fontSize:13,color:ch[k]?'#059669':'#9ca3af',flexShrink:0}}>{ch[k]?'✓':'○'}</span>
                  <span style={{fontSize:12,color:ch[k]?'#374151':'#9ca3af'}}>{lab}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="pp-lbl">Confirm password <span style={{color:'#ef4444'}}>*</span></label>
        <div style={{position:'relative'}}>
          <input className="pp-inp" type={sc2?'text':'password'} name="confirmPassword" value={f.confirmPassword} onChange={upd} required maxLength={PASS_MAX} placeholder="Re-enter password"
            style={{paddingRight:36,borderColor:ok?'rgba(30,185,128,0.7)':bad?'rgba(239,68,68,0.7)':'#e5e7eb'}}/>
          <button type="button" onClick={()=>setSc2(v=>!v)} tabIndex={-1} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.32)',padding:0,display:'flex'}}>{sc2?<EyeOn/>:<EyeOff/>}</button>
        </div>
        {ok  && <p style={{fontSize:11,color:'#059669',margin:'4px 0 0',fontWeight:600}}>✓ Passwords match</p>}
        {bad && <p style={{fontSize:11,color:'#f87171',margin:'4px 0 0'}}>✗ Passwords do not match</p>}
      </div>

      <button className="pp-submit" type="submit" disabled={loading} style={{marginTop:6}}>
        {loading?'Submitting…':'Submit Application →'}
      </button>
    </form>
  );
}

/* ── MAIN PAGE ── */
export default function PartnersPage() {
  const navigate = useNavigate();
  const [activeForm, setActiveForm] = useState('apply');

  const BENEFITS = [
    {icon:'💰',title:'Earn Recurring Commission',desc:'Earn on every subscription your referred clients pay — monthly, recurring, for as long as they stay.'},
    {icon:'📊',title:'Partner Dashboard',desc:'Full visibility into your referrals, earnings, payout status, and client activity in real time.'},
    {icon:'🔗',title:'Unique Referral Code',desc:'Get your own referral link and code. Share it with potential clients and track conversions automatically.'},
    {icon:'🛠️',title:'White-Label Ready',desc:'Present Unified CRM as your own product to clients. Full branding flexibility for agencies.'},
    {icon:'🎓',title:'Training & Support',desc:'Dedicated onboarding, sales materials, and priority support to help you close more clients.'},
    {icon:'🤝',title:'Co-Selling Opportunities',desc:'Work alongside our team on enterprise deals. We help you close bigger clients together.'},
  ];

  const TIERS = [
    {name:'Silver',pct:'5%',label:'per subscription',feats:['Up to 10 clients','Basic dashboard','Email support'],featured:false},
    {name:'Gold',pct:'8%',label:'per subscription',feats:['Up to 50 clients','Full dashboard','Priority support','Co-selling access'],featured:true},
    {name:'Platinum',pct:'10%',label:'per subscription',feats:['Unlimited clients','Advanced analytics','Dedicated manager','White-label rights'],featured:false},
  ];

  return (
    <div className="pp-wrap">
      <style>{CSS}</style>
      <SharedHeader/>

      {/* Hero */}
      <section className="pp-hero" style={{paddingTop:100}}>
        <div className="pp-container" style={{position:'relative',zIndex:1}}>
          <div className="pp-badge">🤝 Partner Program</div>
          <h1 className="pp-h1">Grow Together.<br/>Earn Together.</h1>
          <p className="pp-sub">Join the Unified CRM partner network. Earn recurring commissions, get your own dashboard, and help businesses transform their operations.</p>
          <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap'}}>
            <button className="pp-btn-primary" onClick={()=>{ setActiveForm('apply'); document.getElementById('pp-form-section').scrollIntoView({behavior:'smooth'}); }}>
              Become a Partner →
            </button>
            <button onClick={()=>{ setActiveForm('login'); document.getElementById('pp-form-section').scrollIntoView({behavior:'smooth'}); }}
              style={{padding:'14px 28px',fontSize:14,fontWeight:600,fontFamily:'inherit',color:'rgba(255,255,255,0.75)',background:'rgba(255,255,255,0.06)',border:'1.5px solid rgba(255,255,255,0.14)',borderRadius:999,cursor:'pointer',transition:'all .2s'}}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.12)';e.currentTarget.style.color='#fff';}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.06)';e.currentTarget.style.color='rgba(255,255,255,0.75)';}}>
              Partner Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="pp-section">
        <div className="pp-container">
          <div style={{marginBottom:48}}>
            <div style={{fontSize:11,fontWeight:800,color:'#1EB980',letterSpacing:2,textTransform:'uppercase',marginBottom:12}}>Why Partner With Us</div>
            <h2 style={{fontSize:'clamp(28px,3.5vw,40px)',fontWeight:900,color:'#fff',margin:'0 0 12px',letterSpacing:'-0.5px'}}>Everything You Need to Succeed</h2>
            <p style={{fontSize:16,color:'rgba(255,255,255,0.5)',maxWidth:520,lineHeight:1.7}}>Full support, real-time data, and recurring income — built for serious partners.</p>
          </div>
          <div className="pp-grid3">
            {BENEFITS.map((b,i)=>(
              <div key={i} className="pp-card">
                <div className="pp-card-icon">{b.icon}</div>
                <div className="pp-card-title">{b.title}</div>
                <div className="pp-card-desc">{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commission Tiers */}
      <section className="pp-section-alt">
        <div className="pp-container">
          <div style={{textAlign:'center',marginBottom:48}}>
            <div style={{fontSize:11,fontWeight:800,color:'#1EB980',letterSpacing:2,textTransform:'uppercase',marginBottom:12}}>Commission Structure</div>
            <h2 style={{fontSize:'clamp(28px,3.5vw,40px)',fontWeight:900,color:'#fff',margin:0,letterSpacing:'-0.5px'}}>Earn More as You Grow</h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20,maxWidth:780,margin:'0 auto'}}>
            {TIERS.map((t,i)=>(
              <div key={i} className={`pp-tier${t.featured?' featured':''}`}>
                {t.featured && <div style={{fontSize:10,fontWeight:700,color:'#1EB980',letterSpacing:1,textTransform:'uppercase',marginBottom:8}}>⭐ MOST POPULAR</div>}
                <div className="pp-tier-name">{t.name}</div>
                <div className="pp-tier-pct">{t.pct}</div>
                <div className="pp-tier-label">{t.label}</div>
                {t.feats.map((f,j)=>(
                  <div key={j} className="pp-tier-feat"><span style={{color:'#1EB980'}}>✓</span>{f}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form section — two column compact */}
      <section className="pp-main" id="pp-form-section" style={{padding:'60px 0'}}>
        <div className="pp-container">
          <div className="pp-two-col" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:48,alignItems:'start'}}>

            {/* LEFT — Info */}
            <div style={{paddingTop:8}}>
              <div style={{fontSize:10,fontWeight:800,color:'#1EB980',letterSpacing:2,textTransform:'uppercase',marginBottom:10}}>Get Started</div>
              <h2 style={{fontSize:'clamp(22px,3vw,32px)',fontWeight:900,color:'#fff',margin:'0 0 12px',letterSpacing:'-0.5px',lineHeight:1.2}}>
                {activeForm==='apply' ? 'Become a Certified Partner' : 'Welcome Back, Partner'}
              </h2>
              <p style={{fontSize:14,color:'rgba(255,255,255,0.5)',lineHeight:1.7,margin:'0 0 28px'}}>
                {activeForm==='apply'
                  ? 'Join our partner network and start earning recurring commissions. Fill in your details and we\'ll get back to you in 2–3 business days.'
                  : 'Sign in to your partner dashboard to track referrals, commissions, and manage your client portfolio.'}
              </p>

              {/* Quick benefits */}
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {(activeForm==='apply'
                  ? [['💰','Earn up to 10% recurring commission'],['📊','Real-time partner dashboard'],['🔗','Unique referral code & tracking'],['🛠️','White-label & co-selling ready']]
                  : [['📊','View referrals & earnings'],['💳','Track commission payouts'],['👥','Manage your client portfolio'],['🔔','Get notified on new conversions']]
                ).map(([icon,text],i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:10,fontSize:13,color:'rgba(255,255,255,0.65)'}}>
                    <span style={{fontSize:16,flexShrink:0}}>{icon}</span>{text}
                  </div>
                ))}
              </div>

              {/* Switch tab */}
              <div style={{marginTop:28,paddingTop:20,borderTop:'1px solid rgba(255,255,255,0.08)',fontSize:13,color:'rgba(255,255,255,0.4)'}}>
                {activeForm==='apply'
                  ? <>Already a partner?{' '}<button type="button" onClick={()=>setActiveForm('login')} style={{background:'none',border:'none',color:'#1EB980',fontWeight:600,cursor:'pointer',padding:0,fontFamily:'inherit',fontSize:13}}>Sign in →</button></>
                  : <>Not a partner yet?{' '}<button type="button" onClick={()=>setActiveForm('apply')} style={{background:'none',border:'none',color:'#1EB980',fontWeight:600,cursor:'pointer',padding:0,fontFamily:'inherit',fontSize:13}}>Apply now →</button></>
                }
              </div>
            </div>

            {/* RIGHT — Form */}
            <div style={{background:'#ffffff',border:'1px solid rgba(0,0,0,0.08)',borderRadius:18,padding:'28px 28px',boxShadow:'0 16px 48px rgba(0,0,0,0.25)'}}>
              {/* Pill tabs inside card */}
              <div style={{display:'flex',gap:4,background:'#f3f4f6',borderRadius:999,padding:4,marginBottom:22}}>
                {[['🤝 Apply Now','apply'],['🔑 Sign In','login']].map(([label,key])=>(
                  <button key={key} onClick={()=>setActiveForm(key)}
                    style={{flex:1,padding:'8px 0',fontSize:12,fontWeight:700,fontFamily:'inherit',border:'none',cursor:'pointer',borderRadius:999,transition:'all .2s',
                      background:activeForm===key?'#1EB980':'transparent',
                      color:activeForm===key?'#fff':'#6b7280'}}>
                    {label}
                  </button>
                ))}
              </div>

              {activeForm==='login' ? <LoginForm/> : <RegisterForm/>}
            </div>

          </div>
        </div>
      </section>

      <SharedFooter/>
    </div>
  );
}
