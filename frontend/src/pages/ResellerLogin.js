import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api.config';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box;}
body{margin:0;}
.rl-page{
  min-height:100vh;
  background:
    radial-gradient(ellipse at 82% 8%, #1EB980 0%, rgba(30,185,128,0.55) 28%, transparent 55%),
    radial-gradient(ellipse at 5% 90%, #0a1622 0%, transparent 42%),
    linear-gradient(150deg, #0a1622 0%, #0d1c2e 15%, #10243a 30%, #132d46 45%, #163654 58%, #194060 68%, #1c4e62 76%, #1d5c58 84%, #1e7050 91%, #1EB980 100%);
  display:flex; align-items:center; justify-content:center;
  padding:16px 16px; font-family:'Inter',-apple-system,sans-serif; overflow-x:hidden; overflow-y:auto;
}
.rl-card{
  width:100%; max-width:380px; position:relative; z-index:1;
  background:rgba(8,18,32,0.75); border:1px solid rgba(255,255,255,0.12);
  border-radius:18px; padding:24px 28px;
  backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px);
  box-shadow:0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08);
}
@media(max-width:480px){.rl-card{padding:20px 18px;}}
.rl-inp{
  width:100%; padding:10px 13px; font-size:13px; font-family:inherit; color:#fff;
  background:rgba(255,255,255,0.07); border:1.5px solid rgba(255,255,255,0.12);
  border-radius:9px; outline:none; transition:border-color .2s,box-shadow .2s,background .2s;
}
.rl-inp::placeholder{color:rgba(255,255,255,0.28);}
.rl-inp:focus{border-color:#1EB980;box-shadow:0 0 0 3px rgba(30,185,128,0.15);background:rgba(255,255,255,0.1);}
.rl-inp:-webkit-autofill{-webkit-box-shadow:0 0 0 30px #0d1e30 inset!important;-webkit-text-fill-color:#fff!important;}
.rl-lbl{display:block;font-size:12px;font-weight:600;color:rgba(255,255,255,0.6);margin-bottom:5px;}
.rl-btn{
  width:100%; padding:11px; font-size:14px; font-weight:700; font-family:inherit;
  color:#fff; background:#1EB980; border:none; border-radius:999px; cursor:pointer;
  transition:background .2s,box-shadow .2s,transform .15s;
  box-shadow:0 4px 16px rgba(30,185,128,0.4);
}
.rl-btn:hover{background:#19a872;box-shadow:0 6px 22px rgba(30,185,128,0.55);transform:translateY(-1px);}
.rl-btn:disabled{background:rgba(30,185,128,0.3);box-shadow:none;cursor:not-allowed;transform:none;}
.rl-sep{height:1px;background:rgba(255,255,255,0.08);margin:16px 0;}
`;

const EyeOn  = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const EyeOff = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

const ResellerLogin = () => {
  const navigate = useNavigate();
  const [fd, setFd]       = useState({ email:'', password:'' });
  const [loading, setLoad] = useState(false);
  const [error, setErr]    = useState('');
  const [showPw, setShowPw]= useState(false);

  const change = (e) => setFd({...fd, [e.target.name]:e.target.value});

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setLoad(true);
    try {
      const res  = await fetch(`${API_URL}/resellers/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(fd) });
      const data = await res.json();
      if (data.success) { localStorage.setItem('token', data.data.token); localStorage.setItem('user', JSON.stringify(data.data.reseller)); navigate('/reseller/dashboard'); }
      else setErr(data.message || 'Login failed');
    } catch { setErr('Failed to login. Please try again.'); }
    finally { setLoad(false); }
  };

  return (
    <div className="rl-page">
      <style>{CSS}</style>
      <div className="rl-card">
        <div style={{textAlign:'center',marginBottom:12}}>
          <button type="button" onClick={()=>navigate('/')} style={{background:'none',border:'none',cursor:'pointer',padding:0,display:'inline-block',marginBottom:6}}>
            <div style={{background:'#fff',borderRadius:6,padding:'4px 10px',display:'inline-block'}}>
              <img src="/logo.png" alt="Unified CRM" style={{height:16,display:'block'}}/>
            </div>
          </button>
          <div style={{marginBottom:4}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',background:'rgba(30,185,128,0.15)',border:'1px solid rgba(30,185,128,0.3)',borderRadius:999}}>
              <span style={{fontSize:9}}>🤝</span>
              <span style={{fontSize:9,fontWeight:700,color:'#1EB980',letterSpacing:'0.5px'}}>PARTNER PORTAL</span>
            </div>
          </div>
          <h1 style={{fontSize:18,fontWeight:800,color:'#fff',margin:'0 0 2px',letterSpacing:'-0.2px'}}>Partner sign in</h1>
          <p style={{fontSize:11,color:'rgba(255,255,255,0.45)',margin:0}}>
            Not a partner yet?{' '}
            <button type="button" onClick={()=>navigate('/reseller/register')} style={{background:'none',border:'none',color:'#1EB980',fontWeight:600,cursor:'pointer',padding:0,fontFamily:'inherit',fontSize:11}}>Apply now</button>
          </p>
        </div>

        {error && (
          <div style={{padding:'9px 12px',background:'rgba(239,68,68,0.12)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:9,color:'#fca5a5',marginBottom:14,fontSize:12,display:'flex',gap:7,alignItems:'center'}}>
            <span>⚠️</span>{error}
          </div>
        )}

        <form onSubmit={submit}>
          <div style={{marginBottom:11}}>
            <label className="rl-lbl">Email address</label>
            <input className="rl-inp" type="email" name="email" value={fd.email} onChange={change} required autoFocus placeholder="partner@company.com"/>
          </div>
          <div style={{marginBottom:16}}>
            <label className="rl-lbl">Password</label>
            <div style={{position:'relative'}}>
              <input className="rl-inp" type={showPw?'text':'password'} name="password" value={fd.password} onChange={change} required placeholder="Enter your password" style={{paddingRight:46}}/>
              <button type="button" onClick={()=>setShowPw(v=>!v)} tabIndex={-1} style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.35)',padding:0,display:'flex',alignItems:'center'}}>
                {showPw?<EyeOn/>:<EyeOff/>}
              </button>
            </div>
          </div>
          <button className="rl-btn" type="submit" disabled={loading}>
            {loading?'Signing in…':'Sign in to Partner Portal →'}
          </button>
        </form>

        <div className="rl-sep"/>
        <div style={{textAlign:'center'}}>
          <button type="button" onClick={()=>navigate('/')} style={{background:'none',border:'none',fontSize:13,color:'rgba(255,255,255,0.3)',cursor:'pointer',fontFamily:'inherit'}}>← Back to home</button>
        </div>
      </div>
    </div>
  );
};

export default ResellerLogin;
