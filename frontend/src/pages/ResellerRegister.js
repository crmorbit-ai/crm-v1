import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../config/api.config';

const NAME_MAX = 30, NAME_MIN = 2, PASS_MIN = 8, PASS_MAX = 12;

const FEATURES = ['Lead Management','Contacts & Accounts','Opportunities','B2B Sales Workflow','Email Inbox','Support Tickets','Product Catalog','Tasks & Meetings','Feedback Management','Reports & Analytics'];
const ROLES    = ['IT Consultant','Business Agency','Freelancer','Distributor / Reseller','System Integrator','Other'];

const pwCheck = (p) => ({ len: p.length >= PASS_MIN, up: /[A-Z]/.test(p), lo: /[a-z]/.test(p), num: /[0-9]/.test(p), sym: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) });
const sc = (c) => Object.values(c).filter(Boolean).length;
const st = (s) => s <= 2 ? ['Weak','#ef4444'] : s <= 3 ? ['Fair','#f59e0b'] : s === 4 ? ['Good','#3b82f6'] : ['Strong','#10b981'];

const Eye = ({ on }) => on
  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

const base = { width:'100%', padding:'8px 11px', fontSize:'13px', border:'1px solid rgba(255,255,255,0.09)', borderRadius:'7px', outline:'none', fontFamily:'inherit', background:'rgba(255,255,255,0.04)', color:'#fff', boxSizing:'border-box', transition:'border-color 0.15s' };
const fIn  = e => { e.target.style.borderColor='rgba(139,92,246,0.6)'; e.target.style.background='rgba(139,92,246,0.05)'; };
const fOut = e => { e.target.style.borderColor='rgba(255,255,255,0.09)'; e.target.style.background='rgba(255,255,255,0.04)'; };

export default function ResellerRegister() {
  const navigate = useNavigate();
  const [f, setF] = useState({ firstName:'', lastName:'', email:'', phone:'', companyName:'', role:'', requirement:'', password:'', confirmPassword:'' });
  const [feats, setFeats]   = useState([]);
  const [tk, setTk]         = useState({});
  const [loading, setLoad]  = useState(false);
  const [error, setErr]     = useState('');
  const [done, setDone]     = useState(false);
  const [sp, setSp]         = useState(false);
  const [sc2, setSc2]       = useState(false);

  const ch  = pwCheck(f.password);
  const s   = sc(ch);
  const [sl, sc_] = st(s);
  const ok  = f.confirmPassword && f.password === f.confirmPassword;
  const bad = f.confirmPassword && f.password !== f.confirmPassword;

  const upd = (e) => {
    const { name, value } = e.target;
    if ((name==='firstName'||name==='lastName') && value && !/^[A-Za-z\s\-']*$/.test(value)) return;
    if ((name==='firstName'||name==='lastName') && value.length > NAME_MAX) return;
    if (name==='phone' && value && !/^[0-9+]*$/.test(value)) return;
    if (name==='companyName' && value && !/^[A-Za-z0-9\s\-&.,()]*$/.test(value)) return;
    setF({ ...f, [name]: value }); setErr('');
  };
  const tog  = (x) => setFeats(p => p.includes(x) ? p.filter(v=>v!==x) : [...p,x]);
  const blur = (e) => setTk({ ...tk, [e.target.name]: true });
  const nb   = (n) => { if (!tk[n]) return 'rgba(255,255,255,0.09)'; const v=f[n].trim(); return v.length>=NAME_MIN&&/[A-Za-z]/.test(v)?'rgba(16,185,129,0.5)':'rgba(239,68,68,0.5)'; };

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    const fn=f.firstName.trim(), ln=f.lastName.trim();
    if (fn.length<NAME_MIN) return setErr('First name must be at least 2 characters');
    if (!/[A-Za-z]/.test(fn)) return setErr('First name must contain at least one letter');
    if (ln.length<NAME_MIN) return setErr('Last name must be at least 2 characters');
    if (!/[^\s@]+@[^\s@]+\.[^\s@]+/.test(f.email)) return setErr('Enter a valid email address');
    const d=f.phone.replace('+','');
    if (!f.phone||d.length<7||d.length>15) return setErr('Enter a valid phone number');
    if (!f.companyName.trim()||f.companyName.trim().length<2) return setErr('Company name must be at least 2 characters');
    if (!f.role) return setErr('Please select your role');
    if (!feats.length) return setErr('Select at least one feature');
    if (!ch.len)  return setErr(`Password must be at least ${PASS_MIN} characters`);
    if (!ch.up)   return setErr('Password needs an uppercase letter (A-Z)');
    if (!ch.lo)   return setErr('Password needs a lowercase letter (a-z)');
    if (!ch.num)  return setErr('Password needs a number (0-9)');
    if (!ch.sym)  return setErr('Password needs a special character (!@#$...)');
    if (f.password!==f.confirmPassword) return setErr('Passwords do not match');
    setLoad(true);
    try {
      const res = await fetch(`${API_URL}/resellers/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ firstName:fn, lastName:ln, email:f.email, phone:f.phone, companyName:f.companyName.trim(), occupation:f.role, reason: f.requirement.trim() || `Interested in: ${feats.join(', ')}`, password:f.password, address:{street:'',city:'',state:'',country:'',zipCode:''} }) });
      const data = await res.json();
      if (data.success) { setDone(true); setTimeout(()=>navigate('/reseller/login'),3000); }
      else setErr(data.message||'Registration failed');
    } catch { setErr('Failed to submit. Please try again.'); }
    finally { setLoad(false); }
  };

  if (done) return (
    <div style={{minHeight:'100vh',background:'#0f172a',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:48,marginBottom:12}}>🎉</div>
        <h2 style={{fontSize:20,fontWeight:700,color:'#fff',margin:'0 0 8px'}}>Application Submitted!</h2>
        <p style={{fontSize:13,color:'#6b7280',marginBottom:20}}>We'll review and get back to you in 2–3 business days.</p>
        <button onClick={()=>navigate('/')} style={{padding:'9px 20px',fontSize:13,fontWeight:700,color:'#fff',background:'linear-gradient(135deg,#8b5cf6,#3b82f6)',border:'none',borderRadius:7,cursor:'pointer',fontFamily:'inherit'}}>← Back to Home</button>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:'#0f172a',display:'flex',alignItems:'center',justifyContent:'center',padding:'32px 16px',position:'relative',overflow:'hidden'}}>
      <style>{`
        @media(max-width:520px){.rr{grid-template-columns:1fr!important;gap:8px!important;}}
        ::placeholder{color:rgba(255,255,255,0.18)!important;}
        input:-webkit-autofill{-webkit-box-shadow:0 0 0 30px #1e2a3b inset!important;-webkit-text-fill-color:#fff!important;}
        select option{background:#1a2744;color:#fff;}
        .feat-chip:hover{border-color:rgba(139,92,246,0.4)!important;color:rgba(255,255,255,0.7)!important;}
      `}</style>

      <div style={{position:'absolute',top:'-15%',left:'-8%',width:400,height:400,background:'radial-gradient(circle,rgba(139,92,246,0.1) 0%,transparent 70%)',borderRadius:'50%',filter:'blur(50px)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:'-15%',right:'-8%',width:400,height:400,background:'radial-gradient(circle,rgba(59,130,246,0.1) 0%,transparent 70%)',borderRadius:'50%',filter:'blur(50px)',pointerEvents:'none'}}/>

      <div style={{width:'100%',maxWidth:440,position:'relative',zIndex:1}}>

        {/* Logo + title */}
        <div style={{textAlign:'center',marginBottom:18}}>
          <Link to="/"><div style={{background:'#fff',borderRadius:6,padding:'4px 10px',display:'inline-block',marginBottom:10}}><img src="/logo.png" alt="Logo" style={{height:16,display:'block'}}/></div></Link>
          <h2 style={{fontSize:18,fontWeight:700,color:'#fff',margin:'0 0 2px'}}>Reseller Partner Application</h2>
          <p style={{fontSize:12,color:'rgba(255,255,255,0.35)',margin:0}}>
            Already a partner? <button type="button" onClick={()=>navigate('/reseller/login')} style={{background:'none',border:'none',color:'#a78bfa',fontWeight:600,cursor:'pointer',padding:0,fontFamily:'inherit',fontSize:12}}>Login</button>
          </p>
        </div>

        {/* Error */}
        {error && <div style={{padding:'8px 11px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:6,color:'#f87171',marginBottom:10,fontSize:12,display:'flex',gap:6}}><span>⚠️</span>{error}</div>}

        <form onSubmit={submit} noValidate style={{display:'flex',flexDirection:'column',gap:9}}>

          {/* Name row */}
          <div className="rr" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9}}>
            <div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <label style={{fontSize:'11px',fontWeight:'600',color:'#9ca3af'}}>First name</label>
                <span style={{fontSize:'10px',color:'rgba(255,255,255,0.25)'}}>{f.firstName.length}/{NAME_MAX}</span>
              </div>
              <input type="text" name="firstName" value={f.firstName} onChange={upd} onBlur={blur} onFocus={fIn} required placeholder="John" style={{...base,borderColor:nb('firstName')}}/>
            </div>
            <div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <label style={{fontSize:'11px',fontWeight:'600',color:'#9ca3af'}}>Last name</label>
                <span style={{fontSize:'10px',color:'rgba(255,255,255,0.25)'}}>{f.lastName.length}/{NAME_MAX}</span>
              </div>
              <input type="text" name="lastName" value={f.lastName} onChange={upd} onBlur={blur} onFocus={fIn} required placeholder="Doe" style={{...base,borderColor:nb('lastName')}}/>
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{fontSize:'11px',fontWeight:'600',color:'#9ca3af',display:'block',marginBottom:4}}>Email address</label>
            <input type="email" name="email" value={f.email} onChange={upd} onBlur={blur} onFocus={fIn} required maxLength={100} placeholder="john@company.com" style={base}/>
          </div>

          {/* Phone + Company */}
          <div className="rr" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9}}>
            <div>
              <label style={{fontSize:'11px',fontWeight:'600',color:'#9ca3af',display:'block',marginBottom:4}}>Phone number</label>
              <input type="tel" name="phone" value={f.phone} onChange={upd} onBlur={blur} onFocus={fIn} required maxLength={16} placeholder="+91 98765 43210" style={base}/>
            </div>
            <div>
              <label style={{fontSize:'11px',fontWeight:'600',color:'#9ca3af',display:'block',marginBottom:4}}>Company name</label>
              <input type="text" name="companyName" value={f.companyName} onChange={upd} onBlur={blur} onFocus={fIn} required maxLength={60} placeholder="Acme Pvt Ltd" style={base}/>
            </div>
          </div>

          {/* Role */}
          <div>
            <label style={{fontSize:'11px',fontWeight:'600',color:'#9ca3af',display:'block',marginBottom:4}}>I am a <span style={{color:'#ef4444'}}>*</span></label>
            <select name="role" value={f.role} onChange={upd} onBlur={blur} onFocus={fIn} required
              style={{...base,appearance:'none',WebkitAppearance:'none',cursor:'pointer',color:f.role?'#fff':'rgba(255,255,255,0.25)',backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,backgroundRepeat:'no-repeat',backgroundPosition:'right 11px center',paddingRight:32}}>
              <option value="" disabled>Select your role…</option>
              {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Feature chips */}
          <div>
            <label style={{fontSize:'11px',fontWeight:'600',color:'#9ca3af',display:'block',marginBottom:6}}>
              Interested in <span style={{color:'#ef4444'}}>*</span> <span style={{fontWeight:400,color:'rgba(255,255,255,0.25)'}}>— select features</span>
            </label>
            <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
              {FEATURES.map(x=>{
                const on=feats.includes(x);
                return <button key={x} type="button" className="feat-chip" onClick={()=>tog(x)}
                  style={{padding:'4px 10px',fontSize:'11px',fontWeight:600,borderRadius:20,cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s',
                    background:on?'rgba(139,92,246,0.15)':'transparent',
                    border:`1px solid ${on?'rgba(139,92,246,0.5)':'rgba(255,255,255,0.1)'}`,
                    color:on?'#c4b5fd':'rgba(255,255,255,0.4)'}}>
                  {on?'✓ ':''}{x}
                </button>;
              })}
            </div>
          </div>

          {/* Requirement */}
          <div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
              <label style={{fontSize:'11px',fontWeight:'600',color:'#9ca3af'}}>Requirement <span style={{fontWeight:400,color:'rgba(255,255,255,0.25)'}}>(optional)</span></label>
              <span style={{fontSize:'10px',color:'rgba(255,255,255,0.25)'}}>{f.requirement.length}/200</span>
            </div>
            <textarea name="requirement" value={f.requirement} onChange={upd} onFocus={fIn} onBlur={fOut}
              rows={2} maxLength={200} placeholder="Brief description of your business and goals…"
              style={{...base,resize:'none',lineHeight:1.5}}/>
          </div>

          {/* Password */}
          <div>
            <label style={{fontSize:'11px',fontWeight:'600',color:'#9ca3af',display:'block',marginBottom:4}}>Password</label>
            <div style={{position:'relative'}}>
              <input type={sp?'text':'password'} name="password" value={f.password} onChange={upd} onBlur={blur} onFocus={fIn}
                required maxLength={PASS_MAX} placeholder={`${PASS_MIN}–${PASS_MAX} chars · A-Z · 0-9 · symbol`}
                style={{...base,paddingRight:36}}/>
              <button type="button" onClick={()=>setSp(v=>!v)} tabIndex={-1}
                style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.3)',padding:0,display:'flex'}}>
                <Eye on={sp}/>
              </button>
            </div>
            {f.password.length>0&&(
              <div style={{marginTop:6}}>
                <div style={{display:'flex',gap:3,alignItems:'center',marginBottom:5}}>
                  {[1,2,3,4,5].map(i=><div key={i} style={{flex:1,height:2.5,borderRadius:2,background:i<=s?sc_:'rgba(255,255,255,0.08)',transition:'background 0.2s'}}/>)}
                  <span style={{fontSize:'10px',fontWeight:700,color:sc_,marginLeft:5}}>{sl}</span>
                </div>
                <div style={{display:'flex',flexWrap:'wrap',gap:'2px 12px'}}>
                  {[['len',`≥${PASS_MIN}`],['up','A-Z'],['lo','a-z'],['num','0-9'],['sym','Symbol']].map(([k,lab])=>(
                    <span key={k} style={{fontSize:'10px',color:ch[k]?'#10b981':'rgba(255,255,255,0.25)',display:'flex',alignItems:'center',gap:3}}>
                      {ch[k]?'✓':'○'} {lab}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm */}
          <div>
            <label style={{fontSize:'11px',fontWeight:'600',color:'#9ca3af',display:'block',marginBottom:4}}>Confirm password</label>
            <div style={{position:'relative'}}>
              <input type={sc2?'text':'password'} name="confirmPassword" value={f.confirmPassword} onChange={upd} onBlur={blur} onFocus={fIn}
                required maxLength={PASS_MAX} placeholder="Re-enter password"
                style={{...base,paddingRight:36,borderColor:ok?'rgba(16,185,129,0.5)':bad?'rgba(239,68,68,0.5)':'rgba(255,255,255,0.09)'}}/>
              <button type="button" onClick={()=>setSc2(v=>!v)} tabIndex={-1}
                style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.3)',padding:0,display:'flex'}}>
                <Eye on={sc2}/>
              </button>
            </div>
            {ok  && <p style={{fontSize:'10px',color:'#10b981',margin:'3px 0 0'}}>✓ Passwords match</p>}
            {bad && <p style={{fontSize:'10px',color:'#ef4444',margin:'3px 0 0'}}>✗ Passwords do not match</p>}
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading}
            style={{width:'100%',padding:'10px',fontSize:14,fontWeight:700,color:'#fff',background:loading?'#374151':'linear-gradient(135deg,#8b5cf6,#3b82f6)',border:'none',borderRadius:8,cursor:loading?'not-allowed':'pointer',transition:'all 0.2s',boxShadow:loading?'none':'0 4px 14px rgba(139,92,246,0.25)',fontFamily:'inherit',marginTop:2}}
            onMouseEnter={e=>!loading&&(e.currentTarget.style.boxShadow='0 6px 18px rgba(139,92,246,0.4)')}
            onMouseLeave={e=>!loading&&(e.currentTarget.style.boxShadow='0 4px 14px rgba(139,92,246,0.25)')}>
            {loading?'Submitting…':'Submit Application →'}
          </button>
        </form>

        <p style={{textAlign:'center',marginTop:10,margin:'10px 0 0'}}>
          <Link to="/" style={{color:'rgba(255,255,255,0.25)',fontSize:12,textDecoration:'none'}}>← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
