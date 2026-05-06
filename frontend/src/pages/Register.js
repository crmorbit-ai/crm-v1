import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { API_URL } from '../config/api.config';

const NAME_MAX = 30;
const NAME_MIN = 2;
const PASS_MIN = 8;
const PASS_MAX = 10;

const passwordChecks = (pw) => ({
  length:    pw.length >= PASS_MIN,
  uppercase: /[A-Z]/.test(pw),
  lowercase: /[a-z]/.test(pw),
  number:    /[0-9]/.test(pw),
  special:   /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw),
});

const strengthScore = (checks) => Object.values(checks).filter(Boolean).length;

const strengthLabel = (score) => {
  if (score <= 2) return { label: 'Weak', color: '#ef4444' };
  if (score <= 3) return { label: 'Fair', color: '#f59e0b' };
  if (score === 4) return { label: 'Good', color: '#3b82f6' };
  return { label: 'Strong', color: '#10b981' };
};

const EyeIcon = ({ open }) => open ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const CheckIcon = ({ pass }) => (
  <span style={{ color: pass ? '#10b981' : 'rgba(255,255,255,0.25)', fontSize: 13, flexShrink: 0 }}>
    {pass ? '✓' : '○'}
  </span>
);

const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  fontSize: '15px',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  outline: 'none',
  transition: 'all 0.2s ease',
  fontFamily: 'inherit',
  background: 'rgba(255,255,255,0.05)',
  color: '#ffffff',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  fontSize: '14px',
  fontWeight: '600',
  color: '#e5e7eb',
  marginBottom: '6px',
};

const Register = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (user) {
      navigate(user.userType === 'SAAS_OWNER' || user.userType === 'SAAS_ADMIN' ? '/saas/dashboard' : '/dashboard');
    }
  }, [user, navigate]);

  const pwChecks = passwordChecks(formData.password);
  const score = strengthScore(pwChecks);
  const strength = strengthLabel(score);
  const passwordsMatch = formData.confirmPassword !== '' && formData.password === formData.confirmPassword;
  const passwordsMismatch = formData.confirmPassword !== '' && formData.password !== formData.confirmPassword;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if ((name === 'firstName' || name === 'lastName')) {
      if (value && !/^[A-Za-z\s\-']*$/.test(value)) return;
      if (value.length > NAME_MAX) return;
    }
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleBlur = (e) => setTouched({ ...touched, [e.target.name]: true });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const fn = formData.firstName.trim();
    const ln = formData.lastName.trim();

    if (fn.length < NAME_MIN) return setError(`First name must be at least ${NAME_MIN} characters`);
    if (fn.length > NAME_MAX) return setError(`First name must be at most ${NAME_MAX} characters`);
    if (!/[A-Za-z]/.test(fn)) return setError('First name must contain at least one letter');

    if (ln.length < NAME_MIN) return setError(`Last name must be at least ${NAME_MIN} characters`);
    if (ln.length > NAME_MAX) return setError(`Last name must be at most ${NAME_MAX} characters`);
    if (!/[A-Za-z]/.test(ln)) return setError('Last name must contain at least one letter');

    const emailVal = formData.email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailVal)) return setError('Please enter a valid email address');
    if (emailVal.length > 40) return setError('Email address is too long (max 40 characters)');

    if (!pwChecks.length)    return setError(`Password must be at least ${PASS_MIN} characters`);
    if (!pwChecks.uppercase) return setError('Password must contain at least one uppercase letter (A-Z)');
    if (!pwChecks.lowercase) return setError('Password must contain at least one lowercase letter (a-z)');
    if (!pwChecks.number)    return setError('Password must contain at least one number (0-9)');
    if (!pwChecks.special)   return setError('Password must contain at least one special character (!@#$%...)');
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match');

    setLoading(true);
    try {
      const response = await authService.registerStep1({
        firstName: fn,
        lastName: ln,
        email: formData.email,
        password: formData.password,
      });
      if (response.success) navigate('/verify-email', { state: { email: formData.email } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => { window.location.href = `${API_URL}/auth/google`; };

  const nameBorder = (fieldName) => {
    if (!touched[fieldName]) return 'rgba(255,255,255,0.1)';
    const val = formData[fieldName].trim();
    return val.length >= NAME_MIN && val.length <= NAME_MAX && /[A-Za-z]/.test(val)
      ? '#10b981' : '#ef4444';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @media(max-width:768px){.register-form-row{grid-template-columns:1fr!important;}}
        input::placeholder{color:rgba(255,255,255,0.25);}
        input:-webkit-autofill{-webkit-box-shadow:0 0 0 30px #1e293b inset!important;-webkit-text-fill-color:#fff!important;}
      `}</style>

      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <Link to="/" style={{ display: 'inline-block' }}>
            <div style={{ background: 'white', borderRadius: '8px', padding: '6px 12px', display: 'inline-block' }}>
              <img src="/logo.png" alt="Logo" style={{ height: '20px', display: 'block' }} />
            </div>
          </Link>
        </div>

        {/* Header */}
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', marginBottom: '4px' }}>Create your account</h2>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: '600' }}>Log in</Link>
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', marginBottom: '16px', fontSize: '14px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ flexShrink: 0 }}>⚠️</span> {error}
          </div>
        )}

        {/* Google */}
        <button type="button" onClick={handleGoogleSignup}
          style={{ width: '100%', padding: '11px 16px', fontSize: '15px', fontWeight: '600', color: '#fff', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '14px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ color: '#6b7280', fontSize: '13px', fontWeight: '500' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        </div>

        <form onSubmit={handleSubmit} noValidate>

          {/* Name row */}
          <div className="register-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            {/* First Name */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={labelStyle}>First name</label>
                <span style={{ fontSize: 11, color: formData.firstName.length > NAME_MAX * 0.9 ? '#f59e0b' : 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
                  {formData.firstName.length}/{NAME_MAX}
                </span>
              </div>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={(e) => { e.target.style.borderColor = '#8b5cf6'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.1)'; }}
                required
                placeholder="John"
                style={{ ...inputStyle, borderColor: touched.firstName ? nameBorder('firstName') : 'rgba(255,255,255,0.1)' }}
              />
              {touched.firstName && formData.firstName.trim().length < NAME_MIN && formData.firstName.length > 0 && (
                <p style={{ fontSize: 11, color: '#ef4444', margin: '4px 0 0', lineHeight: 1.4 }}>Min {NAME_MIN} characters</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={labelStyle}>Last name</label>
                <span style={{ fontSize: 11, color: formData.lastName.length > NAME_MAX * 0.9 ? '#f59e0b' : 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
                  {formData.lastName.length}/{NAME_MAX}
                </span>
              </div>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={(e) => { e.target.style.borderColor = '#8b5cf6'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.1)'; }}
                required
                placeholder="Doe"
                style={{ ...inputStyle, borderColor: touched.lastName ? nameBorder('lastName') : 'rgba(255,255,255,0.1)' }}
              />
              {touched.lastName && formData.lastName.trim().length < NAME_MIN && formData.lastName.length > 0 && (
                <p style={{ fontSize: 11, color: '#ef4444', margin: '4px 0 0', lineHeight: 1.4 }}>Min {NAME_MIN} characters</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              onFocus={(e) => { e.target.style.borderColor = '#8b5cf6'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.1)'; }}
              required
              maxLength={40}
              placeholder="john@company.com"
              style={{
                ...inputStyle,
                borderColor: touched.email && formData.email && !/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(formData.email)
                  ? '#ef4444' : 'rgba(255,255,255,0.1)'
              }}
            />
            {touched.email && formData.email && !/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(formData.email) && (
              <p style={{ fontSize: 11, color: '#ef4444', margin: '4px 0 0' }}>Please enter a valid email address</p>
            )}
          </div>

          {/* Password */}
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={(e) => { e.target.style.borderColor = '#8b5cf6'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.1)'; }}
                required
                maxLength={PASS_MAX}
                placeholder={`Min ${PASS_MIN} chars, uppercase, number, symbol`}
                style={{ ...inputStyle, paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 0, display: 'flex', alignItems: 'center' }}
                tabIndex={-1}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>

            {/* Strength bar */}
            {formData.password.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= score ? strength.color : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
                  ))}
                  <span style={{ fontSize: 11, fontWeight: 700, color: strength.color, marginLeft: 6, whiteSpace: 'nowrap' }}>{strength.label}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                  {[
                    { key: 'length',    label: `Min ${PASS_MIN} characters` },
                    { key: 'uppercase', label: 'Uppercase letter (A-Z)' },
                    { key: 'lowercase', label: 'Lowercase letter (a-z)' },
                    { key: 'number',    label: 'Number (0-9)' },
                    { key: 'special',   label: 'Special character (!@#$...)' },
                  ].map(({ key, label }) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckIcon pass={pwChecks[key]} />
                      <span style={{ fontSize: 12, color: pwChecks[key] ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>Confirm password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={(e) => { e.target.style.borderColor = '#8b5cf6'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.1)'; }}
                required
                maxLength={PASS_MAX}
                placeholder="Re-enter your password"
                style={{
                  ...inputStyle,
                  paddingRight: 44,
                  borderColor: passwordsMatch ? '#10b981' : passwordsMismatch ? '#ef4444' : 'rgba(255,255,255,0.1)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 0, display: 'flex', alignItems: 'center' }}
                tabIndex={-1}
              >
                <EyeIcon open={showConfirm} />
              </button>
            </div>
            {passwordsMatch && (
              <p style={{ fontSize: 12, color: '#10b981', margin: '5px 0 0', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span>✓</span> Passwords match
              </p>
            )}
            {passwordsMismatch && (
              <p style={{ fontSize: 12, color: '#ef4444', margin: '5px 0 0', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span>✗</span> Passwords do not match
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '12px 16px', fontSize: '15px', fontWeight: '700', color: 'white', background: loading ? '#4b5563' : 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)', border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease', boxShadow: loading ? 'none' : '0 4px 15px rgba(139,92,246,0.3)', fontFamily: 'inherit' }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.boxShadow = '0 6px 20px rgba(139,92,246,0.45)')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.boxShadow = '0 4px 15px rgba(139,92,246,0.3)')}
          >
            {loading ? 'Creating account...' : 'Create Account →'}
          </button>
        </form>

        <div style={{ marginTop: '14px', textAlign: 'center' }}>
          <Link to="/" style={{ color: '#6b7280', fontSize: '14px', textDecoration: 'none' }}>← Back to home</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
