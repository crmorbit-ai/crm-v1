import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api.config';
import { leadService } from '../services/leadService';
import { accountService } from '../services/accountService';
import { contactService } from '../services/contactService';
import { opportunityService } from '../services/opportunityService';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box;}
body{margin:0;}

.ln-page {
  min-height:100vh;
  background:
    radial-gradient(ellipse at 82% 8%, #1EB980 0%, rgba(30,185,128,0.55) 28%, transparent 55%),
    radial-gradient(ellipse at 5% 90%, #0a1622 0%, transparent 42%),
    linear-gradient(150deg, #0a1622 0%, #0d1c2e 15%, #10243a 30%, #132d46 45%, #163654 58%, #194060 68%, #1c4e62 76%, #1d5c58 84%, #1e7050 91%, #1EB980 100%);
  display:flex; align-items:center; justify-content:center;
  padding:16px 16px; position:relative; overflow-x:hidden; overflow-y:auto;
  font-family:'Inter',-apple-system,sans-serif;
}

.ln-card {
  width:100%; max-width:380px; position:relative; z-index:1;
  background:rgba(8,18,32,0.75);
  border:1px solid rgba(255,255,255,0.12);
  border-radius:18px; padding:24px 28px;
  backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px);
  box-shadow:0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08);
}
@media(max-width:480px){.ln-card{padding:20px 18px;}}

.ln-inp {
  width:100%; padding:10px 13px; font-size:13px; font-family:inherit; color:#fff;
  background:rgba(255,255,255,0.07); border:1.5px solid rgba(255,255,255,0.12);
  border-radius:9px; outline:none; transition:border-color .2s,box-shadow .2s,background .2s;
}
.ln-inp::placeholder{color:rgba(255,255,255,0.3);}
.ln-inp:focus{border-color:#1EB980;box-shadow:0 0 0 3px rgba(30,185,128,0.15);background:rgba(255,255,255,0.1);}
.ln-inp:-webkit-autofill{-webkit-box-shadow:0 0 0 30px #0d1e30 inset!important;-webkit-text-fill-color:#fff!important;}

.ln-lbl{display:block;font-size:12px;font-weight:600;color:rgba(255,255,255,0.6);margin-bottom:5px;}

.ln-btn-g {
  width:100%; padding:10px 14px; font-size:13px; font-weight:600; font-family:inherit;
  color:#fff; background:rgba(255,255,255,0.09); border:1.5px solid rgba(255,255,255,0.16);
  border-radius:999px; cursor:pointer; display:flex; align-items:center; justify-content:center;
  gap:8px; transition:all .2s; margin-bottom:14px;
}
.ln-btn-g:hover{background:rgba(255,255,255,0.15);border-color:rgba(255,255,255,0.28);}

.ln-btn-submit {
  width:100%; padding:11px; font-size:14px; font-weight:700; font-family:inherit;
  color:#fff; background:#1EB980; border:none; border-radius:999px; cursor:pointer;
  transition:background .2s,box-shadow .2s,transform .15s;
  box-shadow:0 4px 16px rgba(30,185,128,0.4);
}
.ln-btn-submit:hover{background:#19a872;box-shadow:0 6px 22px rgba(30,185,128,0.55);transform:translateY(-1px);}
.ln-btn-submit:active{transform:translateY(0);}
.ln-btn-submit:disabled{background:rgba(30,185,128,0.3);box-shadow:none;cursor:not-allowed;transform:none;}

.ln-or{display:flex;align-items:center;gap:10px;margin:0 0 14px;}
.ln-or-line{flex:1;height:1px;background:rgba(255,255,255,0.12);}
.ln-sep{height:1px;background:rgba(255,255,255,0.08);margin:16px 0;}
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

const Login = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [errorCode, setErrorCode] = useState(null);
  const [errorMeta, setErrorMeta] = useState(null);
  const [showPw, setShowPw]     = useState(false);

  useEffect(() => {
    if (user) window.location.href = user.userType === 'SAAS_OWNER' || user.userType === 'SAAS_ADMIN' ? '/saas/dashboard' : '/dashboard';
  }, [user, navigate]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    const rx = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;
    if (!rx.test(formData.email) || /\.{2,}/.test(formData.email)) {
      setError('Please enter a valid email address');
      setTimeout(() => setError(''), 6000); return;
    }
    setLoading(true);
    try {
      const response = await login(formData.email, formData.password);
      Promise.all([
        leadService.getLeadStats().catch(() => null),
        accountService.getAccountStats().catch(() => null),
        contactService.getContactStats().catch(() => null),
        opportunityService.getOpportunityStats().catch(() => null),
      ]).then(r => {
        try {
          localStorage.setItem('dashboard_stats_cache', JSON.stringify({ leads: r[0]?.data||null, accounts: r[1]?.data||null, contacts: r[2]?.data||null, opportunities: r[3]?.data||null }));
          localStorage.setItem('dashboard_stats_expiry', String(Date.now() + 120000));
        } catch(e) {}
      });
      window.location.href = response.user?.userType === 'SAAS_OWNER' || response.user?.userType === 'SAAS_ADMIN' ? '/saas/dashboard' : '/dashboard';
    } catch (err) {
      const code    = err?.errors?.code || err?.response?.data?.errors?.code || null;
      const meta    = err?.errors || err?.response?.data?.errors || null;
      const message = err?.message || err?.response?.data?.message || 'Invalid email or password';
      setError(message); setErrorCode(code); setErrorMeta(meta); setLoading(false);
      setTimeout(() => { setError(''); setErrorCode(null); setErrorMeta(null); }, 6000);
    }
  };

  return (
    <div className="ln-page">
      <style>{CSS}</style>

      <div className="ln-card">
        {/* Logo + heading tight block */}
        <div style={{textAlign:'center', marginBottom:14}}>
          <Link to="/" style={{display:'inline-block', marginBottom:6}}>
            <div style={{background:'#fff', borderRadius:6, padding:'4px 10px', display:'inline-block'}}>
              <img src="/logo.png" alt="Unified CRM" style={{height:16, display:'block'}}/>
            </div>
          </Link>
          <h1 style={{fontSize:18, fontWeight:800, color:'#fff', margin:'0 0 2px', letterSpacing:'-0.2px'}}>
            Welcome back
          </h1>
          <p style={{fontSize:11, color:'rgba(255,255,255,0.45)', margin:0}}>
            New here?{' '}
            <Link to="/register" style={{color:'#1EB980', fontWeight:600, textDecoration:'none'}}>Create a free account</Link>
          </p>
        </div>

        {/* Errors */}
        {error && !errorCode && (
          <div style={{padding:'11px 14px', background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:10, color:'#fca5a5', marginBottom:20, fontSize:13, display:'flex', gap:8, alignItems:'center'}}>
            <span>⚠️</span>{error}
          </div>
        )}
        {errorCode === 'ACCOUNT_DELETED' && (
          <div style={{padding:'14px', background:'rgba(220,38,38,0.1)', border:'1px solid rgba(220,38,38,0.25)', borderRadius:10, marginBottom:20}}>
            <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:6}}><span>🚫</span><b style={{color:'#fca5a5', fontSize:13}}>Account Deleted</b></div>
            <p style={{color:'#fca5a5', fontSize:13, margin:'0 0 3px'}}>{error}</p>
            {errorMeta?.supportEmail && <p style={{color:'#f87171', fontSize:12, margin:0}}>Contact: <a href={`mailto:${errorMeta.supportEmail}`} style={{color:'#fca5a5', fontWeight:600}}>{errorMeta.supportEmail}</a></p>}
          </div>
        )}
        {errorCode === 'DELETION_PENDING' && (
          <div style={{padding:'14px', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:10, marginBottom:20}}>
            <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:6}}><span>⏳</span><b style={{color:'#fcd34d', fontSize:13}}>Deletion Pending</b></div>
            <p style={{color:'#fbbf24', fontSize:13, margin:'0 0 3px'}}>{error}</p>
            {errorMeta?.supportEmail && <p style={{color:'#fcd34d', fontSize:12, margin:0}}>Contact: <a href={`mailto:${errorMeta.supportEmail}`} style={{color:'#fbbf24', fontWeight:600}}>{errorMeta.supportEmail}</a></p>}
          </div>
        )}

        {/* Google */}
        <button className="ln-btn-g" type="button" onClick={() => { window.location.href = `${API_URL}/auth/google`; }}>
          {GGL} Continue with Google
        </button>

        <div className="ln-or">
          <div className="ln-or-line"/>
          <span style={{fontSize:12, color:'rgba(255,255,255,0.3)'}}>or</span>
          <div className="ln-or-line"/>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{marginBottom:11}}>
            <label className="ln-lbl">Email address</label>
            <input className="ln-inp" type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="you@company.com"/>
          </div>

          <div style={{marginBottom:16}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5}}>
              <label className="ln-lbl" style={{margin:0}}>Password</label>
              <Link to="/forgot-password" style={{fontSize:12, color:'#1EB980', textDecoration:'none', fontWeight:500}}>Forgot password?</Link>
            </div>
            <div style={{position:'relative'}}>
              <input className="ln-inp" type={showPw?'text':'password'} name="password" value={formData.password} onChange={handleChange} required maxLength={10} placeholder="Enter your password" style={{paddingRight:46}}/>
              <button type="button" onClick={() => setShowPw(v=>!v)} tabIndex={-1}
                style={{position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.38)', padding:0, display:'flex', alignItems:'center'}}>
                {showPw ? <EyeOn/> : <EyeOff/>}
              </button>
            </div>
          </div>

          <button className="ln-btn-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>

        <div className="ln-sep"/>
        <div style={{textAlign:'center'}}>
          <Link to="/" style={{fontSize:12, color:'rgba(255,255,255,0.3)', textDecoration:'none'}}>← Back to home</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
