import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { API_URL } from '../config/api.config';

const NAME_MAX=30, NAME_MIN=2, PASS_MIN=8, PASS_MAX=10;
const pwChecks = (pw) => ({ length:pw.length>=PASS_MIN, upper:/[A-Z]/.test(pw), lower:/[a-z]/.test(pw), number:/[0-9]/.test(pw), symbol:/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw) });
const scoreOf  = (c) => Object.values(c).filter(Boolean).length;
const strengthOf = (s) => s<=2?['Weak','#ef4444']:s<=3?['Fair','#f59e0b']:s===4?['Good','#60a5fa']:['Strong','#1EB980'];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box;}
body{margin:0;}
.rg-page{
  min-height:100vh;
  background:
    radial-gradient(ellipse at 82% 8%, #1EB980 0%, rgba(30,185,128,0.55) 28%, transparent 55%),
    radial-gradient(ellipse at 5% 90%, #0a1622 0%, transparent 42%),
    linear-gradient(150deg, #0a1622 0%, #0d1c2e 15%, #10243a 30%, #132d46 45%, #163654 58%, #194060 68%, #1c4e62 76%, #1d5c58 84%, #1e7050 91%, #1EB980 100%);
  display:flex; align-items:center; justify-content:center;
  padding:16px 16px; font-family:'Inter',-apple-system,sans-serif; overflow-x:hidden; overflow-y:auto;
}
.rg-card{
  width:100%; max-width:440px; position:relative; z-index:1;
  background:rgba(8,18,32,0.75); border:1px solid rgba(255,255,255,0.12);
  border-radius:18px; padding:22px 26px;
  backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px);
  box-shadow:0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08);
}
@media(max-width:480px){.rg-card{padding:18px 16px;} .rg-row{grid-template-columns:1fr!important;}}
.rg-inp{
  width:100%; padding:9px 12px; font-size:13px; font-family:inherit; color:#fff;
  background:rgba(255,255,255,0.07); border:1.5px solid rgba(255,255,255,0.12);
  border-radius:9px; outline:none; transition:border-color .2s,box-shadow .2s,background .2s;
}
.rg-inp::placeholder{color:rgba(255,255,255,0.28);}
.rg-inp:focus{border-color:#1EB980;box-shadow:0 0 0 3px rgba(30,185,128,0.15);background:rgba(255,255,255,0.1);}
.rg-inp:-webkit-autofill{-webkit-box-shadow:0 0 0 30px #0d1e30 inset!important;-webkit-text-fill-color:#fff!important;}
.rg-lbl{display:block;font-size:12px;font-weight:600;color:rgba(255,255,255,0.6);margin-bottom:5px;}
.rg-btn-g{
  width:100%; padding:10px 14px; font-size:13px; font-weight:600; font-family:inherit;
  color:#fff; background:rgba(255,255,255,0.09); border:1.5px solid rgba(255,255,255,0.16);
  border-radius:999px; cursor:pointer; display:flex; align-items:center; justify-content:center;
  gap:8px; transition:all .2s; margin-bottom:12px;
}
.rg-btn-g:hover{background:rgba(255,255,255,0.15);border-color:rgba(255,255,255,0.28);}
.rg-btn-submit{
  width:100%; padding:11px; font-size:14px; font-weight:700; font-family:inherit;
  color:#fff; background:#1EB980; border:none; border-radius:999px; cursor:pointer;
  transition:background .2s,box-shadow .2s,transform .15s;
  box-shadow:0 4px 16px rgba(30,185,128,0.4);
}
.rg-btn-submit:hover{background:#19a872;box-shadow:0 6px 22px rgba(30,185,128,0.55);transform:translateY(-1px);}
.rg-btn-submit:disabled{background:rgba(30,185,128,0.3);box-shadow:none;cursor:not-allowed;transform:none;}
.rg-or{display:flex;align-items:center;gap:10px;margin:0 0 12px;}
.rg-or-line{flex:1;height:1px;background:rgba(255,255,255,0.12);}
.rg-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.rg-sep{height:1px;background:rgba(255,255,255,0.08);margin:14px 0;}
`;

const GGL = (
  <svg width="18" height="18" viewBox="0 0 24 24" style={{flexShrink:0}}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);
const EyeOn  = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const EyeOff = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

const Register = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fd, setFd] = useState({ firstName:'', lastName:'', email:'', password:'', confirmPassword:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [showCf, setShowCf]   = useState(false);
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (user) navigate(user.userType==='SAAS_OWNER'||user.userType==='SAAS_ADMIN'?'/saas/dashboard':'/dashboard');
  }, [user, navigate]);

  const checks = pwChecks(fd.password);
  const sc     = scoreOf(checks);
  const [stLabel, stColor] = strengthOf(sc);
  const pwMatch    = fd.confirmPassword && fd.password === fd.confirmPassword;
  const pwMismatch = fd.confirmPassword && fd.password !== fd.confirmPassword;

  const change = (e) => {
    const { name, value } = e.target;
    if ((name==='firstName'||name==='lastName') && value && !/^[A-Za-z\s\-']*$/.test(value)) return;
    if ((name==='firstName'||name==='lastName') && value.length > NAME_MAX) return;
    setFd({...fd, [name]:value}); setError('');
  };
  const blur = (e) => setTouched({...touched, [e.target.name]:true});
  const nameBorder = (n) => {
    if (!touched[n]) return 'rgba(255,255,255,0.12)';
    const v = fd[n].trim();
    return v.length>=NAME_MIN&&/[A-Za-z]/.test(v) ? 'rgba(30,185,128,0.6)' : 'rgba(239,68,68,0.6)';
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    const fn=fd.firstName.trim(), ln=fd.lastName.trim();
    if (fn.length<NAME_MIN) return setError(`First name must be at least ${NAME_MIN} characters`);
    if (fn.length>NAME_MAX) return setError(`First name must be at most ${NAME_MAX} characters`);
    if (!/[A-Za-z]/.test(fn)) return setError('First name must contain at least one letter');
    if (ln.length<NAME_MIN) return setError(`Last name must be at least ${NAME_MIN} characters`);
    if (ln.length>NAME_MAX) return setError(`Last name must be at most ${NAME_MAX} characters`);
    if (!/[A-Za-z]/.test(ln)) return setError('Last name must contain at least one letter');
    const ev = fd.email.trim().toLowerCase();
    if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(ev)) return setError('Please enter a valid email address');
    if (ev.length>40) return setError('Email is too long (max 40 characters)');
    if (!checks.length) return setError(`Password must be at least ${PASS_MIN} characters`);
    if (!checks.upper)  return setError('Password needs an uppercase letter (A-Z)');
    if (!checks.lower)  return setError('Password needs a lowercase letter (a-z)');
    if (!checks.number) return setError('Password needs a number (0-9)');
    if (!checks.symbol) return setError('Password needs a special character (!@#$…)');
    if (fd.password!==fd.confirmPassword) return setError('Passwords do not match');
    setLoading(true);
    try {
      const res = await authService.registerStep1({ firstName:fn, lastName:ln, email:fd.email, password:fd.password });
      if (res.success) navigate('/verify-email', { state:{ email:fd.email } });
    } catch(err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="rg-page">
      <style>{CSS}</style>
      <div className="rg-card">
        <div style={{textAlign:'center', marginBottom:12}}>
          <Link to="/" style={{display:'inline-block', marginBottom:6}}>
            <div style={{background:'#fff', borderRadius:6, padding:'4px 10px', display:'inline-block'}}>
              <img src="/logo.png" alt="Unified CRM" style={{height:16, display:'block'}}/>
            </div>
          </Link>
          <h1 style={{fontSize:18, fontWeight:800, color:'#fff', margin:'0 0 2px', letterSpacing:'-0.2px'}}>Create your account</h1>
          <p style={{fontSize:11, color:'rgba(255,255,255,0.45)', margin:0}}>
            Already have an account?{' '}
            <Link to="/login" style={{color:'#1EB980', fontWeight:600, textDecoration:'none'}}>Sign in</Link>
          </p>
        </div>

        {error && (
          <div style={{padding:'11px 14px', background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:10, color:'#fca5a5', marginBottom:20, fontSize:13, display:'flex', gap:8, alignItems:'center'}}>
            <span>⚠️</span>{error}
          </div>
        )}

        <button className="rg-btn-g" type="button" onClick={() => { window.location.href = `${API_URL}/auth/google`; }}>
          {GGL} Continue with Google
        </button>
        <div className="rg-or">
          <div className="rg-or-line"/><span style={{fontSize:12, color:'rgba(255,255,255,0.3)'}}>or</span><div className="rg-or-line"/>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="rg-row" style={{marginBottom:10}}>
            <div>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:5}}>
                <label className="rg-lbl" style={{margin:0}}>First name</label>
                <span style={{fontSize:10, color:'rgba(255,255,255,0.28)'}}>{fd.firstName.length}/{NAME_MAX}</span>
              </div>
              <input className="rg-inp" type="text" name="firstName" value={fd.firstName} onChange={change} onBlur={blur} required placeholder="John" style={{borderColor:nameBorder('firstName')}}/>
            </div>
            <div>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:5}}>
                <label className="rg-lbl" style={{margin:0}}>Last name</label>
                <span style={{fontSize:10, color:'rgba(255,255,255,0.28)'}}>{fd.lastName.length}/{NAME_MAX}</span>
              </div>
              <input className="rg-inp" type="text" name="lastName" value={fd.lastName} onChange={change} onBlur={blur} required placeholder="Doe" style={{borderColor:nameBorder('lastName')}}/>
            </div>
          </div>

          <div style={{marginBottom:10}}>
            <label className="rg-lbl">Work email</label>
            <input className="rg-inp" type="email" name="email" value={fd.email} onChange={change} onBlur={blur} required maxLength={40} placeholder="you@company.com"/>
          </div>

          <div style={{marginBottom:10}}>
            <label className="rg-lbl">Password</label>
            <div style={{position:'relative'}}>
              <input className="rg-inp" type={showPw?'text':'password'} name="password" value={fd.password} onChange={change} onBlur={blur} required maxLength={PASS_MAX} placeholder={`Min ${PASS_MIN} chars, A-Z, 0-9, symbol`} style={{paddingRight:44}}/>
              <button type="button" onClick={()=>setShowPw(v=>!v)} tabIndex={-1} style={{position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.35)',padding:0,display:'flex',alignItems:'center'}}>
                {showPw?<EyeOn/>:<EyeOff/>}
              </button>
            </div>
            {fd.password.length>0 && (
              <div style={{marginTop:10}}>
                <div style={{display:'flex', gap:4, alignItems:'center', marginBottom:8}}>
                  {[1,2,3,4,5].map(i=><div key={i} style={{flex:1,height:3,borderRadius:3,background:i<=sc?stColor:'rgba(255,255,255,0.1)',transition:'background .3s'}}/>)}
                  <span style={{fontSize:11,fontWeight:700,color:stColor,marginLeft:6}}>{stLabel}</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'3px 10px'}}>
                  {[['length',`Min ${PASS_MIN} chars`],['upper','Uppercase (A-Z)'],['lower','Lowercase (a-z)'],['number','Number (0-9)'],['symbol','Symbol (!@#$)']].map(([k,lbl])=>(
                    <div key={k} style={{display:'flex',alignItems:'center',gap:5}}>
                      <span style={{color:checks[k]?'#1EB980':'rgba(255,255,255,0.25)',fontSize:12}}>{checks[k]?'✓':'○'}</span>
                      <span style={{fontSize:12,color:checks[k]?'rgba(255,255,255,0.65)':'rgba(255,255,255,0.3)'}}>{lbl}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{marginBottom:14}}>
            <label className="rg-lbl">Confirm password</label>
            <div style={{position:'relative'}}>
              <input className="rg-inp" type={showCf?'text':'password'} name="confirmPassword" value={fd.confirmPassword} onChange={change} required maxLength={PASS_MAX} placeholder="Re-enter password"
                style={{paddingRight:44, borderColor:pwMatch?'rgba(30,185,128,0.6)':pwMismatch?'rgba(239,68,68,0.6)':'rgba(255,255,255,0.12)'}}/>
              <button type="button" onClick={()=>setShowCf(v=>!v)} tabIndex={-1} style={{position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.35)',padding:0,display:'flex',alignItems:'center'}}>
                {showCf?<EyeOn/>:<EyeOff/>}
              </button>
            </div>
            {pwMatch    && <p style={{fontSize:12,color:'#1EB980',margin:'6px 0 0',display:'flex',alignItems:'center',gap:4}}><span>✓</span>Passwords match</p>}
            {pwMismatch && <p style={{fontSize:12,color:'#f87171',margin:'6px 0 0',display:'flex',alignItems:'center',gap:4}}><span>✗</span>Passwords do not match</p>}
          </div>

          <button className="rg-btn-submit" type="submit" disabled={loading}>
            {loading?'Creating account…':'Create account →'}
          </button>
        </form>

        <div className="rg-sep"/>
        <div style={{textAlign:'center'}}>
          <Link to="/" style={{fontSize:13, color:'rgba(255,255,255,0.3)', textDecoration:'none'}}>← Back to home</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
