import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../config/api.config';

const NAME_MAX=30,NAME_MIN=2,PASS_MIN=8,PASS_MAX=12;
const FEATURES=['Lead Management','Contacts & Accounts','Opportunities','B2B Sales Workflow','Email Inbox','Support Tickets','Product Catalog','Tasks & Meetings','Feedback Management','Reports & Analytics'];
const ROLES=['IT Consultant','Business Agency','Freelancer','Distributor / Reseller','System Integrator','Other'];
const pwCheck=(p)=>({len:p.length>=PASS_MIN,up:/[A-Z]/.test(p),lo:/[a-z]/.test(p),num:/[0-9]/.test(p),sym:/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p)});
const scoreOf=(c)=>Object.values(c).filter(Boolean).length;
const stOf=(s)=>s<=2?['Weak','#ef4444']:s<=3?['Fair','#f59e0b']:s===4?['Good','#60a5fa']:['Strong','#1EB980'];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box;}
body{margin:0;}
.rr-page{
  min-height:100vh;
  background:
    radial-gradient(ellipse at 82% 8%, #1EB980 0%, rgba(30,185,128,0.55) 28%, transparent 55%),
    radial-gradient(ellipse at 5% 90%, #0a1622 0%, transparent 42%),
    linear-gradient(150deg, #0a1622 0%, #0d1c2e 15%, #10243a 30%, #132d46 45%, #163654 58%, #194060 68%, #1c4e62 76%, #1d5c58 84%, #1e7050 91%, #1EB980 100%);
  display:flex; align-items:flex-start; justify-content:center;
  padding:10px 14px 14px; font-family:'Inter',-apple-system,sans-serif; overflow-y:auto;
}
.rr-card{
  width:100%; max-width:460px; position:relative; z-index:1;
  background:rgba(8,18,32,0.78); border:1px solid rgba(255,255,255,0.12);
  border-radius:16px; padding:14px 20px;
  backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px);
  box-shadow:0 16px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08);
}
@media(max-width:520px){.rr-card{padding:12px 12px;} .rr-row{grid-template-columns:1fr!important;}}
.rr-inp{
  width:100%; padding:7px 10px; font-size:12px; font-family:inherit; color:#fff;
  background:rgba(255,255,255,0.07); border:1.5px solid rgba(255,255,255,0.1);
  border-radius:7px; outline:none; transition:border-color .2s,box-shadow .2s,background .2s;
}
.rr-inp::placeholder{color:rgba(255,255,255,0.25);}
.rr-inp:focus{border-color:#1EB980;box-shadow:0 0 0 3px rgba(30,185,128,0.12);background:rgba(255,255,255,0.09);}
.rr-inp:-webkit-autofill{-webkit-box-shadow:0 0 0 30px #0d1e30 inset!important;-webkit-text-fill-color:#fff!important;}
select.rr-inp option{background:#0d1e30;color:#fff;}
.rr-lbl{display:block;font-size:10px;font-weight:600;color:rgba(255,255,255,0.55);margin-bottom:3px;}
.rr-btn{
  width:100%; padding:9px; font-size:13px; font-weight:700; font-family:inherit;
  color:#fff; background:#1EB980; border:none; border-radius:999px; cursor:pointer;
  transition:background .2s,box-shadow .2s,transform .15s;
  box-shadow:0 4px 14px rgba(30,185,128,0.4);
}
.rr-btn:hover{background:#19a872;box-shadow:0 6px 20px rgba(30,185,128,0.55);transform:translateY(-1px);}
.rr-btn:disabled{background:rgba(30,185,128,0.3);box-shadow:none;cursor:not-allowed;transform:none;}
.rr-row{display:grid;grid-template-columns:1fr 1fr;gap:7px;}
.rr-chip{
  padding:2px 8px;font-size:10px;font-weight:600;border-radius:20px;cursor:pointer;
  font-family:inherit;transition:all .15s;border:1px solid rgba(255,255,255,0.1);
  background:transparent;color:rgba(255,255,255,0.4);
}
.rr-chip.on{background:rgba(30,185,128,0.15);border-color:rgba(30,185,128,0.4);color:#1EB980;}
.rr-chip:hover{border-color:rgba(30,185,128,0.3);color:rgba(255,255,255,0.7);}
.rr-sep{height:1px;background:rgba(255,255,255,0.08);margin:10px 0;}
`;

const EyeOn  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const EyeOff = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

export default function ResellerRegister() {
  const navigate=useNavigate();
  const [f,setF]=useState({firstName:'',lastName:'',email:'',phone:'',companyName:'',role:'',requirement:'',password:'',confirmPassword:''});
  const [feats,setFeats]=useState([]);
  const [featsTouched,setFeatsTouched]=useState(false);
  const [tk,setTk]=useState({});
  const [loading,setLoad]=useState(false);
  const [error,setErr]=useState('');
  const [done,setDone]=useState(false);
  const [sp,setSp]=useState(false);
  const [sc2,setSc2]=useState(false);

  const ch=pwCheck(f.password);
  const s=scoreOf(ch);
  const [sl,sc_]=stOf(s);
  const ok=f.confirmPassword&&f.password===f.confirmPassword;
  const bad=f.confirmPassword&&f.password!==f.confirmPassword;

  const upd=(e)=>{
    const{name,value}=e.target;
    if((name==='firstName'||name==='lastName')&&value&&!/^[A-Za-z\s\-']*$/.test(value))return;
    if((name==='firstName'||name==='lastName')&&value.length>NAME_MAX)return;
    if(name==='phone'&&value&&!/^\+?[0-9]*$/.test(value))return;
    if(name==='companyName'&&value&&!/^[A-Za-z0-9\s\-&.,()]*$/.test(value))return;
    setF({...f,[name]:value});setErr('');
  };
  const tog=(x)=>setFeats(p=>p.includes(x)?p.filter(v=>v!==x):[...p,x]);
  const blur=(e)=>setTk({...tk,[e.target.name]:true});
  const nb=(n)=>{if(!tk[n])return'rgba(255,255,255,0.1)';const v=f[n].trim();return v.length>=NAME_MIN&&/[A-Za-z]/.test(v)?'rgba(30,185,128,0.5)':'rgba(239,68,68,0.5)';};

  const submit=async(e)=>{
    e.preventDefault();setErr('');
    const fn=f.firstName.trim(),ln=f.lastName.trim();
    if(fn.length<NAME_MIN)return setErr('First name must be at least 2 characters');
    if(!/[A-Za-z]/.test(fn))return setErr('First name must contain at least one letter');
    if(ln.length<NAME_MIN)return setErr('Last name must be at least 2 characters');
    if(!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(f.email.trim()))return setErr('Enter a valid email address');
    const d=f.phone.replace(/^\+/,'');
    if(!f.phone||!/^\+?[0-9]+$/.test(f.phone)||d.length<7||d.length>15)return setErr('Enter a valid phone number (digits only, + allowed at start)');
    if(!f.companyName.trim()||f.companyName.trim().length<2)return setErr('Company name must be at least 2 characters');
    if(!f.role)return setErr('Please select your role');
    if(!feats.length){setFeatsTouched(true);return setErr('Please select at least one feature you are interested in.');}
    if(!ch.len)return setErr(`Password must be at least ${PASS_MIN} characters`);
    if(!ch.up)return setErr('Password needs an uppercase letter (A-Z)');
    if(!ch.lo)return setErr('Password needs a lowercase letter (a-z)');
    if(!ch.num)return setErr('Password needs a number (0-9)');
    if(!ch.sym)return setErr('Password needs a special character (!@#$…)');
    if(!f.confirmPassword)return setErr('Please confirm your password');
    if(f.password!==f.confirmPassword)return setErr('Passwords do not match');
    setLoad(true);
    try{
      const res=await fetch(`${API_URL}/resellers/register`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({firstName:fn,lastName:ln,email:f.email,phone:f.phone,companyName:f.companyName.trim(),occupation:f.role,reason:f.requirement.trim()||`Interested in: ${feats.join(', ')}`,password:f.password,address:{street:'',city:'',state:'',country:'',zipCode:''}})});
      const data=await res.json();
      if(data.success){setDone(true);setTimeout(()=>navigate('/reseller/login'),3000);}
      else setErr(data.message||'Registration failed');
    }catch{setErr('Failed to submit. Please try again.');}
    finally{setLoad(false);}
  };

  if(done)return(
    <div style={{minHeight:'100vh',background:'linear-gradient(150deg,#0a1622,#163654,#1EB980)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Inter',-apple-system,sans-serif"}}>
      <div style={{textAlign:'center',padding:40,background:'rgba(8,18,32,0.8)',borderRadius:20,border:'1px solid rgba(255,255,255,0.12)',backdropFilter:'blur(24px)',maxWidth:360}}>
        <div style={{fontSize:52,marginBottom:16}}>🎉</div>
        <h2 style={{fontSize:22,fontWeight:800,color:'#fff',margin:'0 0 8px'}}>Application Submitted!</h2>
        <p style={{fontSize:14,color:'rgba(255,255,255,0.5)',marginBottom:24}}>We'll review and get back to you in 2–3 business days.</p>
        <button onClick={()=>navigate('/')} style={{padding:'12px 28px',fontSize:14,fontWeight:700,color:'#fff',background:'#1EB980',border:'none',borderRadius:999,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 18px rgba(30,185,128,0.4)'}}>← Back to Home</button>
      </div>
    </div>
  );

  return(
    <div className="rr-page">
      <style>{CSS}</style>
      <div className="rr-card">
        {/* Logo + Header — all centered, zero gap */}
        <div style={{textAlign:'center',marginBottom:10}}>
          <Link to="/" style={{display:'inline-block',marginBottom:6}}>
            <div style={{background:'#fff',borderRadius:6,padding:'4px 10px',display:'inline-block'}}>
              <img src="/logo.png" alt="Unified CRM" style={{height:16,display:'block'}}/>
            </div>
          </Link>
          <div style={{marginBottom:4}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',background:'rgba(30,185,128,0.15)',border:'1px solid rgba(30,185,128,0.3)',borderRadius:999}}>
              <span style={{fontSize:9}}>🤝</span>
              <span style={{fontSize:9,fontWeight:700,color:'#1EB980',letterSpacing:'0.5px'}}>PARTNER APPLICATION</span>
            </div>
          </div>
          <h1 style={{fontSize:16,fontWeight:800,color:'#fff',margin:'0 0 2px',letterSpacing:'-0.2px'}}>Become a Partner</h1>
          <p style={{fontSize:11,color:'rgba(255,255,255,0.42)',margin:0}}>
            Already a partner?{' '}
            <button type="button" onClick={()=>navigate('/reseller/login')} style={{background:'none',border:'none',color:'#1EB980',fontWeight:600,cursor:'pointer',padding:0,fontFamily:'inherit',fontSize:11}}>Sign in</button>
          </p>
        </div>

        {error&&<div style={{padding:'8px 12px',background:'rgba(239,68,68,0.12)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:8,color:'#fca5a5',marginBottom:10,fontSize:12,display:'flex',gap:7,alignItems:'center'}}><span>⚠️</span>{error}</div>}

        <form onSubmit={submit} noValidate style={{display:'flex',flexDirection:'column',gap:6}}>
          <div className="rr-row">
            <div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><label className="rr-lbl" style={{margin:0}}>First name <span style={{color:'#ef4444'}}>*</span></label><span style={{fontSize:9,color:'rgba(255,255,255,0.25)'}}>{f.firstName.length}/{NAME_MAX}</span></div>
              <input className="rr-inp" type="text" name="firstName" value={f.firstName} onChange={upd} onBlur={blur} required placeholder="John" style={{borderColor:nb('firstName')}}/>
            </div>
            <div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><label className="rr-lbl" style={{margin:0}}>Last name <span style={{color:'#ef4444'}}>*</span></label><span style={{fontSize:9,color:'rgba(255,255,255,0.25)'}}>{f.lastName.length}/{NAME_MAX}</span></div>
              <input className="rr-inp" type="text" name="lastName" value={f.lastName} onChange={upd} onBlur={blur} required placeholder="Doe" style={{borderColor:nb('lastName')}}/>
            </div>
          </div>

          <div>
            <label className="rr-lbl">Email address <span style={{color:'#ef4444'}}>*</span></label>
            <input className="rr-inp" type="email" name="email" value={f.email} onChange={upd} onBlur={blur} required maxLength={100} placeholder="john@company.com"/>
          </div>

          <div className="rr-row">
            <div>
              <label className="rr-lbl">Phone number <span style={{color:'#ef4444'}}>*</span></label>
              <input className="rr-inp" type="tel" name="phone" value={f.phone} onChange={upd} onBlur={blur} required maxLength={16} placeholder="+91 98765 43210"/>
            </div>
            <div>
              <label className="rr-lbl">Company name <span style={{color:'#ef4444'}}>*</span></label>
              <input className="rr-inp" type="text" name="companyName" value={f.companyName} onChange={upd} onBlur={blur} required maxLength={60} placeholder="Acme Pvt Ltd"/>
            </div>
          </div>

          <div>
            <label className="rr-lbl">Your role <span style={{color:'#ef4444'}}>*</span></label>
            <select name="role" value={f.role} onChange={upd} onBlur={blur} required className="rr-inp"
              style={{appearance:'none',WebkitAppearance:'none',cursor:'pointer',color:f.role?'#fff':'rgba(255,255,255,0.28)',backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,backgroundRepeat:'no-repeat',backgroundPosition:'right 12px center',paddingRight:32}}>
              <option value="" disabled>Select your role…</option>
              {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="rr-lbl" style={{marginBottom:5}}>
              Interested in <span style={{color:'#ef4444'}}>*</span>{' '}
              <span style={{fontWeight:400,color:'rgba(255,255,255,0.25)'}}>— select at least one</span>
            </label>
            <div style={{display:'flex',flexWrap:'wrap',gap:4,padding:featsTouched&&!feats.length?'6px':'0',borderRadius:8,border:featsTouched&&!feats.length?'1px solid rgba(239,68,68,0.5)':'1px solid transparent',transition:'border .2s'}}>
              {FEATURES.map(x=>(
                <button key={x} type="button" className={`rr-chip${feats.includes(x)?' on':''}`} onClick={()=>{tog(x);setFeatsTouched(true);}}>
                  {feats.includes(x)?'✓ ':''}{x}
                </button>
              ))}
            </div>
            {featsTouched && !feats.length && (
              <p style={{fontSize:10,color:'#f87171',margin:'4px 0 0'}}>Please select at least one feature.</p>
            )}
          </div>

          <div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><label className="rr-lbl" style={{margin:0}}>Requirement <span style={{fontWeight:400,color:'rgba(255,255,255,0.25)'}}>(optional)</span></label><span style={{fontSize:9,color:'rgba(255,255,255,0.25)'}}>{f.requirement.length}/200</span></div>
            <textarea name="requirement" value={f.requirement} onChange={upd} rows={2} maxLength={200} placeholder="Brief description of your business and goals…" className="rr-inp" style={{resize:'none',lineHeight:1.4}}/>
          </div>

          <div>
            <label className="rr-lbl">Password <span style={{color:'#ef4444'}}>*</span></label>
            <div style={{position:'relative'}}>
              <input className="rr-inp" type={sp?'text':'password'} name="password" value={f.password} onChange={upd} onBlur={blur} required maxLength={PASS_MAX} placeholder={`${PASS_MIN}–${PASS_MAX} chars · A-Z · 0-9 · symbol`} style={{paddingRight:36}}/>
              <button type="button" onClick={()=>setSp(v=>!v)} tabIndex={-1} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.32)',padding:0,display:'flex'}}>{sp?<EyeOn/>:<EyeOff/>}</button>
            </div>
            {f.password.length>0&&(
              <div style={{marginTop:8}}>
                <div style={{display:'flex',gap:4,alignItems:'center',marginBottom:7}}>
                  {[1,2,3,4,5].map(i=><div key={i} style={{flex:1,height:3,borderRadius:3,background:i<=s?sc_:'rgba(255,255,255,0.1)',transition:'background .3s'}}/>)}
                  <span style={{fontSize:11,fontWeight:700,color:sc_,marginLeft:6}}>{sl}</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'3px 10px'}}>
                  {[['len',`Min ${PASS_MIN} chars`],['up','Uppercase (A-Z)'],['lo','Lowercase (a-z)'],['num','Number (0-9)'],['sym','Symbol (!@#$)']].map(([k,lab])=>(
                    <div key={k} style={{display:'flex',alignItems:'center',gap:5}}>
                      <span style={{color:ch[k]?'#1EB980':'rgba(255,255,255,0.25)',fontSize:12}}>{ch[k]?'✓':'○'}</span>
                      <span style={{fontSize:12,color:ch[k]?'rgba(255,255,255,0.65)':'rgba(255,255,255,0.3)'}}>{lab}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="rr-lbl">Confirm password <span style={{color:'#ef4444'}}>*</span></label>
            <div style={{position:'relative'}}>
              <input className="rr-inp" type={sc2?'text':'password'} name="confirmPassword" value={f.confirmPassword} onChange={upd} required maxLength={PASS_MAX} placeholder="Re-enter password"
                style={{paddingRight:36,borderColor:ok?'rgba(30,185,128,0.5)':bad?'rgba(239,68,68,0.5)':'rgba(255,255,255,0.1)'}}/>
              <button type="button" onClick={()=>setSc2(v=>!v)} tabIndex={-1} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.32)',padding:0,display:'flex'}}>{sc2?<EyeOn/>:<EyeOff/>}</button>
            </div>
            {ok&&<p style={{fontSize:11,color:'#1EB980',margin:'4px 0 0'}}>✓ Passwords match</p>}
            {bad&&<p style={{fontSize:11,color:'#f87171',margin:'4px 0 0'}}>✗ Passwords do not match</p>}
          </div>

          <button className="rr-btn" type="submit" disabled={loading} style={{marginTop:2}}>
            {loading?'Submitting…':'Submit Application →'}
          </button>
        </form>

        <div className="rr-sep"/>
        <div style={{textAlign:'center'}}>
          <Link to="/" style={{fontSize:11,color:'rgba(255,255,255,0.3)',textDecoration:'none'}}>← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
