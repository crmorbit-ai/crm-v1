import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api.config';

const PASS_MIN = 8;
const PASS_MAX = 10;

const pwChecks = (pw) => ({
  length:    pw.length >= PASS_MIN,
  uppercase: /[A-Z]/.test(pw),
  lowercase: /[a-z]/.test(pw),
  number:    /[0-9]/.test(pw),
  special:   /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw),
});
const strengthScore = (c) => Object.values(c).filter(Boolean).length;
const strengthLabel = (s) => s <= 2 ? { label:'Weak', color:'#ef4444' } : s <= 3 ? { label:'Fair', color:'#f59e0b' } : s === 4 ? { label:'Good', color:'#3b82f6' } : { label:'Strong', color:'#10b981' };

const EyeIcon = ({ open }) => open
  ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

const inp = {
  width: '100%', padding: '11px 14px', fontSize: '15px',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
  outline: 'none', fontFamily: 'inherit', background: 'rgba(255,255,255,0.05)',
  color: '#fff', boxSizing: 'border-box', transition: 'border-color 0.2s',
};

const StepDot = ({ step, current }) => (
  <div style={{
    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, flexShrink: 0,
    background: step < current ? '#10b981' : step === current ? 'linear-gradient(135deg,#7c3aed,#3b82f6)' : 'rgba(255,255,255,0.08)',
    color: step <= current ? '#fff' : 'rgba(255,255,255,0.3)',
    border: step === current ? 'none' : '1px solid rgba(255,255,255,0.1)',
  }}>
    {step < current ? '✓' : step}
  </div>
);

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep]   = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp]     = useState('');
  const [password, setPassword]         = useState('');
  const [confirmPassword, setConfirm]   = useState('');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [showPw, setShowPw]             = useState(false);
  const [showCPw, setShowCPw]           = useState(false);
  const [countdown, setCountdown]       = useState(0);   // resend cooldown
  const [otpExpiry, setOtpExpiry]       = useState(0);   // OTP expiry timer
  const timerRef  = useRef(null);
  const expiryRef = useRef(null);

  const checks  = pwChecks(password);
  const score   = strengthScore(checks);
  const st      = strengthLabel(score);
  const pwMatch   = confirmPassword !== '' && password === confirmPassword;
  const pwNoMatch = confirmPassword !== '' && password !== confirmPassword;

  // Resend cooldown (60s)
  useEffect(() => {
    if (countdown <= 0) { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [countdown]);

  // OTP expiry countdown (10 min = 600s)
  useEffect(() => {
    if (otpExpiry <= 0) { clearInterval(expiryRef.current); return; }
    expiryRef.current = setInterval(() => setOtpExpiry(c => c - 1), 1000);
    return () => clearInterval(expiryRef.current);
  }, [otpExpiry]);

  const startCountdown = () => {
    setCountdown(60);
    setOtpExpiry(600); // 10 minutes
  };

  // Resend OTP (no form event)
  const handleResendOTP = async () => {
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/auth/forgot-password`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (data.success) {
        setSuccess('New OTP sent! Enter it within 10 minutes.');
        setTimeout(() => setSuccess(''), 4000);
        setOtp('');
        startCountdown(); // resets both resend cooldown + expiry timer
      } else {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch { setError('Failed to resend OTP. Please try again.'); }
    finally { setLoading(false); }
  };

  // Step 1 — Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setError('Please enter a valid email address.');
    }
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/auth/forgot-password`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (data.success) { setSuccess('OTP sent to your email!'); setTimeout(() => setSuccess(''), 4000); setStep(2); startCountdown(); }
      else setError(data.message || 'Failed to send OTP');
    } catch { setError('Failed to send OTP. Please try again.'); }
    finally { setLoading(false); }
  };

  // Step 2 — Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) return setError('Please enter the complete 6-digit OTP.');
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/auth/verify-otp`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, otp }) });
      const data = await res.json();
      if (data.success) { setSuccess('OTP verified! Set your new password.'); setStep(3); }
      else setError(data.message || 'Invalid OTP. Please try again.');
    } catch { setError('Failed to verify OTP. Please try again.'); }
    finally { setLoading(false); }
  };

  // Step 3 — Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (!checks.length)    return setError(`Password must be at least ${PASS_MIN} characters`);
    if (!checks.uppercase) return setError('Password must contain at least one uppercase letter (A-Z)');
    if (!checks.lowercase) return setError('Password must contain at least one lowercase letter (a-z)');
    if (!checks.number)    return setError('Password must contain at least one number (0-9)');
    if (!checks.special)   return setError('Password must contain at least one special character (!@#$%...)');
    if (password !== confirmPassword) return setError('Passwords do not match');
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/auth/reset-password`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, newPassword: password }) });
      const data = await res.json();
      if (data.success) { setSuccess('Password reset successful! Redirecting to login…'); setTimeout(() => navigate('/login'), 2000); }
      else setError(data.message || 'Failed to reset password');
    } catch { setError('Failed to reset password. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#0f172a', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 20px', position:'relative', overflow:'hidden', fontFamily:"'Inter',-apple-system,sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); input::placeholder{color:rgba(255,255,255,0.22);}`}</style>

      {/* bg glows */}
      <div style={{ position:'absolute', top:'-20%', left:'-10%', width:500, height:500, background:'radial-gradient(circle,rgba(139,92,246,0.15) 0%,transparent 70%)', borderRadius:'50%', filter:'blur(60px)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'-20%', right:'-10%', width:500, height:500, background:'radial-gradient(circle,rgba(59,130,246,0.15) 0%,transparent 70%)', borderRadius:'50%', filter:'blur(60px)', pointerEvents:'none' }} />

      <div style={{ width:'100%', maxWidth:420, position:'relative', zIndex:1 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:16 }}>
          <Link to="/"><div style={{ background:'#fff', borderRadius:8, padding:'6px 12px', display:'inline-block' }}><img src="/logo.png" alt="Logo" style={{ height:20, display:'block' }} /></div></Link>
        </div>

        {/* Step indicator */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:0, marginBottom:24 }}>
          {[1,2,3].map((s, i) => (
            <React.Fragment key={s}>
              <StepDot step={s} current={step} />
              {i < 2 && <div style={{ width:40, height:2, background: step > s ? '#10b981' : 'rgba(255,255,255,0.08)', transition:'background 0.3s' }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Title */}
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <h2 style={{ fontSize:22, fontWeight:700, color:'#fff', margin:'0 0 4px' }}>
            {step === 1 && 'Forgot Password?'}
            {step === 2 && 'Verify OTP'}
            {step === 3 && 'Create New Password'}
          </h2>
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.4)', margin:0 }}>
            {step === 1 && 'Enter your email address to receive a reset OTP'}
            {step === 2 && `OTP sent to ${email}`}
            {step === 3 && 'Choose a strong password for your account'}
          </p>
        </div>

        {/* Success */}
        {success && (
          <div style={{ padding:'11px 14px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:8, color:'#34d399', marginBottom:14, fontSize:14, display:'flex', gap:8 }}>
            <span>✓</span> {success}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ padding:'11px 14px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:8, color:'#f87171', marginBottom:14, fontSize:14, display:'flex', gap:8 }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* ── STEP 1: Email ── */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} noValidate>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:14, fontWeight:600, color:'#e5e7eb', marginBottom:6 }}>Email address</label>
              <input
                type="email" value={email} required autoFocus maxLength={100}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                onFocus={e => { e.target.style.borderColor='#8b5cf6'; e.target.style.boxShadow='0 0 0 3px rgba(139,92,246,0.1)'; }}
                onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.boxShadow='none'; }}
                placeholder="Enter your registered email"
                style={inp}
              />
            </div>
            <button type="submit" disabled={loading}
              style={{ width:'100%', padding:'12px', fontSize:15, fontWeight:700, color:'#fff', background: loading?'#4b5563':'linear-gradient(135deg,#8b5cf6,#3b82f6)', border:'none', borderRadius:10, cursor: loading?'not-allowed':'pointer', fontFamily:'inherit', boxShadow: loading?'none':'0 4px 15px rgba(139,92,246,0.3)' }}>
              {loading ? 'Sending OTP…' : 'Send OTP →'}
            </button>
          </form>
        )}

        {/* ── STEP 2: OTP ── */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} noValidate>

            {/* OTP Expiry Timer — prominent */}
            {otpExpiry > 0 && (
              <div style={{ marginBottom:16, borderRadius:12, overflow:'hidden', border: otpExpiry <= 60 ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(139,92,246,0.2)', background: otpExpiry <= 60 ? 'rgba(239,68,68,0.08)' : 'rgba(139,92,246,0.08)' }}>
                <div style={{ padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:18 }}>{otpExpiry <= 60 ? '⚠️' : '⏱️'}</span>
                    <div>
                      <div style={{ fontSize:12, fontWeight:600, color: otpExpiry <= 60 ? '#f87171' : 'rgba(255,255,255,0.5)', marginBottom:2 }}>
                        {otpExpiry <= 60 ? 'OTP expiring soon!' : 'OTP valid for'}
                      </div>
                      <div style={{ fontSize:22, fontWeight:900, fontVariantNumeric:'tabular-nums', letterSpacing:1, color: otpExpiry <= 60 ? '#ef4444' : '#a78bfa' }}>
                        {String(Math.floor(otpExpiry / 60)).padStart(2,'0')}:{String(otpExpiry % 60).padStart(2,'0')}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', textAlign:'right', maxWidth:110 }}>
                    Enter OTP before time runs out
                  </div>
                </div>
                {/* Progress bar */}
                <div style={{ height:3, background:'rgba(255,255,255,0.06)' }}>
                  <div style={{ height:'100%', borderRadius:3, transition:'width 1s linear', background: otpExpiry <= 60 ? '#ef4444' : 'linear-gradient(90deg,#7c3aed,#3b82f6)', width: `${(otpExpiry / 600) * 100}%` }} />
                </div>
              </div>
            )}

            {otpExpiry === 0 && (
              <div style={{ marginBottom:16, padding:'12px 14px', borderRadius:10, border:'1px solid rgba(239,68,68,0.3)', background:'rgba(239,68,68,0.08)', display:'flex', alignItems:'center', gap:8 }}>
                <span>⏰</span>
                <span style={{ fontSize:13, color:'#f87171', fontWeight:600 }}>OTP has expired. Please request a new one.</span>
              </div>
            )}

            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:14, fontWeight:600, color:'#e5e7eb', marginBottom:6 }}>6-digit OTP</label>
              <input
                type="text" value={otp} required autoFocus maxLength={6}
                onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                onFocus={e => { e.target.style.borderColor='#8b5cf6'; e.target.style.boxShadow='0 0 0 3px rgba(139,92,246,0.1)'; }}
                onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.boxShadow='none'; }}
                placeholder="• • • • • •"
                style={{ ...inp, fontSize:28, letterSpacing:10, textAlign:'center', fontWeight:700 }}
              />
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)', margin:'6px 0 0', textAlign:'center' }}>
                Check your inbox and enter the 6-digit code
              </p>
              {otp.length > 0 && otp.length < 6 && (
                <p style={{ fontSize:12, color:'#f59e0b', margin:'4px 0 0', textAlign:'center' }}>
                  {6 - otp.length} more digit{6 - otp.length !== 1 ? 's' : ''} needed
                </p>
              )}
              {otp.length === 6 && (
                <p style={{ fontSize:12, color:'#10b981', margin:'4px 0 0', textAlign:'center' }}>✓ OTP complete</p>
              )}
            </div>
            <button type="submit" disabled={loading || otp.length !== 6 || otpExpiry === 0}
              style={{ width:'100%', padding:'12px', fontSize:15, fontWeight:700, color:'#fff', background: (loading || otp.length !== 6 || otpExpiry === 0)?'#4b5563':'linear-gradient(135deg,#8b5cf6,#3b82f6)', border:'none', borderRadius:10, cursor:(loading || otp.length !== 6 || otpExpiry === 0)?'not-allowed':'pointer', fontFamily:'inherit', boxShadow:(loading || otp.length !== 6 || otpExpiry === 0)?'none':'0 4px 15px rgba(139,92,246,0.3)', marginBottom:12 }}>
              {loading ? 'Verifying…' : otpExpiry === 0 ? 'OTP Expired — Resend to continue' : 'Verify OTP →'}
            </button>
            <button type="button" onClick={() => { setStep(1); setOtp(''); setError(''); }}
              style={{ width:'100%', padding:'10px', fontSize:14, fontWeight:600, color:'rgba(255,255,255,0.5)', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, cursor:'pointer', fontFamily:'inherit', marginBottom:16 }}>
              ← Back to Email
            </button>

            {/* Resend OTP — no countdown shown, just button */}
            <div style={{ textAlign:'center' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                <span style={{ fontSize:13, color:'rgba(255,255,255,0.35)' }}>Didn't receive the code?</span>
                <button type="button" onClick={handleResendOTP} disabled={loading || countdown > 0}
                  style={{ background:'none', border:'none', cursor: (loading || countdown > 0) ? 'not-allowed' : 'pointer', color: countdown > 0 ? 'rgba(255,255,255,0.25)' : '#a78bfa', fontWeight:700, fontSize:13, fontFamily:'inherit', padding:0, textDecoration: countdown > 0 ? 'none' : 'underline' }}>
                  {loading ? 'Sending…' : 'Resend OTP'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ── STEP 3: New Password ── */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} noValidate>
            {/* Password */}
            <div style={{ marginBottom:12 }}>
              <label style={{ display:'block', fontSize:14, fontWeight:600, color:'#e5e7eb', marginBottom:6 }}>New password</label>
              <div style={{ position:'relative' }}>
                <input
                  type={showPw?'text':'password'} value={password} required maxLength={PASS_MAX} autoFocus
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  onFocus={e => { e.target.style.borderColor='#8b5cf6'; e.target.style.boxShadow='0 0 0 3px rgba(139,92,246,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.boxShadow='none'; }}
                  placeholder={`Min ${PASS_MIN} chars · A-Z · 0-9 · symbol`}
                  style={{ ...inp, paddingRight:44 }}
                />
                <button type="button" onClick={() => setShowPw(v=>!v)} tabIndex={-1}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.35)', padding:0, display:'flex' }}>
                  <EyeIcon open={showPw} />
                </button>
              </div>

              {/* Strength */}
              {password.length > 0 && (
                <div style={{ marginTop:10 }}>
                  <div style={{ display:'flex', gap:4, alignItems:'center', marginBottom:6 }}>
                    {[1,2,3,4,5].map(i => (
                      <div key={i} style={{ flex:1, height:3, borderRadius:3, background: i<=score ? st.color : 'rgba(255,255,255,0.08)', transition:'background 0.25s' }} />
                    ))}
                    <span style={{ fontSize:11, fontWeight:700, color:st.color, marginLeft:6, whiteSpace:'nowrap' }}>{st.label}</span>
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'3px 14px' }}>
                    {[
                      ['length',    `Min ${PASS_MIN} characters`],
                      ['uppercase', 'Uppercase (A-Z)'],
                      ['lowercase', 'Lowercase (a-z)'],
                      ['number',    'Number (0-9)'],
                      ['special',   'Symbol (!@#$...)'],
                    ].map(([k, lab]) => (
                      <span key={k} style={{ fontSize:12, color: checks[k] ? '#10b981' : 'rgba(255,255,255,0.3)', display:'flex', alignItems:'center', gap:4 }}>
                        {checks[k] ? '✓' : '○'} {lab}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div style={{ marginBottom:20 }}>
              <label style={{ display:'block', fontSize:14, fontWeight:600, color:'#e5e7eb', marginBottom:6 }}>Confirm password</label>
              <div style={{ position:'relative' }}>
                <input
                  type={showCPw?'text':'password'} value={confirmPassword} required maxLength={PASS_MAX}
                  onChange={e => { setConfirm(e.target.value); setError(''); }}
                  onFocus={e => { e.target.style.borderColor='#8b5cf6'; e.target.style.boxShadow='0 0 0 3px rgba(139,92,246,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.boxShadow='none'; }}
                  placeholder="Re-enter new password"
                  style={{ ...inp, paddingRight:44, borderColor: pwMatch?'rgba(16,185,129,0.5)': pwNoMatch?'rgba(239,68,68,0.5)':'rgba(255,255,255,0.1)' }}
                />
                <button type="button" onClick={() => setShowCPw(v=>!v)} tabIndex={-1}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.35)', padding:0, display:'flex' }}>
                  <EyeIcon open={showCPw} />
                </button>
              </div>
              {pwMatch   && <p style={{ fontSize:12, color:'#10b981', margin:'4px 0 0' }}>✓ Passwords match</p>}
              {pwNoMatch && <p style={{ fontSize:12, color:'#ef4444', margin:'4px 0 0' }}>✗ Passwords do not match</p>}
            </div>

            <button type="submit" disabled={loading}
              style={{ width:'100%', padding:'12px', fontSize:15, fontWeight:700, color:'#fff', background: loading?'#4b5563':'linear-gradient(135deg,#8b5cf6,#3b82f6)', border:'none', borderRadius:10, cursor: loading?'not-allowed':'pointer', fontFamily:'inherit', boxShadow: loading?'none':'0 4px 15px rgba(139,92,246,0.3)' }}>
              {loading ? 'Resetting Password…' : 'Reset Password →'}
            </button>
          </form>
        )}

        <div style={{ marginTop:18, textAlign:'center' }}>
          <Link to="/login" style={{ fontSize:14, color:'rgba(255,255,255,0.4)', textDecoration:'none' }}>
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
