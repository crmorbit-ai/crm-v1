import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyEmail, resendOTP } = useAuth();

  const email = location.state?.email || '';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');

  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;
    const newOtp = pastedData.split('');
    while (newOtp.length < 6) newOtp.push('');
    setOtp(newOtp);
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex].focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }
    setLoading(true);
    try {
      const response = await verifyEmail(email, otpCode);
      if (response.requiresProfileCompletion) {
        window.location.href = '/complete-profile';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0].focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setSuccessMessage('');
    setResendLoading(true);
    try {
      await resendOTP(email);
      setSuccessMessage('New verification code sent to your email!');
      setResendCooldown(30);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0].focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background glow — purple top-left */}
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none'
      }} />
      {/* Background glow — blue bottom-right */}
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-10%',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <Link to="/" style={{ display: 'inline-block' }}>
            <div style={{
              background: 'white', borderRadius: '8px',
              padding: '6px 12px', display: 'inline-block'
            }}>
              <img src="/logo.png" alt="Logo" style={{ height: '20px', display: 'block' }} />
            </div>
          </Link>
        </div>

        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px'
          }}>
            ✉️
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#ffffff', marginBottom: '6px' }}>
            Verify Your Email
          </h2>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>
            We've sent a 6-digit code to
          </p>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#a78bfa' }}>
            {email}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px', color: '#f87171',
            marginBottom: '16px', fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Success */}
        {successMessage && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '8px', color: '#4ade80',
            marginBottom: '16px', fontSize: '14px'
          }}>
            {successMessage}
          </div>
        )}

        {/* OTP Inputs */}
        <form onSubmit={handleSubmit}>
          <div style={{
            display: 'flex', gap: '10px', justifyContent: 'center',
            marginBottom: '24px'
          }}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                autoFocus={index === 0}
                style={{
                  width: '48px', height: '56px',
                  textAlign: 'center', fontSize: '22px', fontWeight: '700',
                  color: '#ffffff',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: digit ? '2px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px', outline: 'none',
                  transition: 'all 0.2s ease',
                  caretColor: '#8b5cf6',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#8b5cf6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.15)';
                  e.target.style.borderWidth = '2px';
                }}
                onBlur={(e) => {
                  if (!digit) {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.borderWidth = '1px';
                  }
                  e.target.style.boxShadow = 'none';
                }}
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={loading || otp.some(d => !d)}
            style={{
              width: '100%', padding: '12px 16px',
              fontSize: '15px', fontWeight: '600', color: 'white',
              background: (loading || otp.some(d => !d))
                ? '#374151'
                : 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
              border: 'none', borderRadius: '10px',
              cursor: (loading || otp.some(d => !d)) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: (loading || otp.some(d => !d)) ? 'none' : '0 4px 15px rgba(139, 92, 246, 0.3)',
              marginBottom: '16px'
            }}
            onMouseEnter={(e) => {
              if (!loading && !otp.some(d => !d))
                e.target.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              if (!loading && !otp.some(d => !d))
                e.target.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.3)';
            }}
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '4px 0 16px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
          <span style={{ color: '#4b5563', fontSize: '13px' }}>didn't receive?</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
        </div>

        {/* Resend */}
        <button
          type="button"
          onClick={handleResendOTP}
          disabled={resendCooldown > 0 || resendLoading}
          style={{
            width: '100%', padding: '12px 16px',
            fontSize: '14px', fontWeight: '600',
            color: (resendCooldown > 0 || resendLoading) ? '#4b5563' : '#a78bfa',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            cursor: (resendCooldown > 0 || resendLoading) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            marginBottom: '20px'
          }}
          onMouseEnter={(e) => {
            if (resendCooldown === 0 && !resendLoading) {
              e.target.style.background = 'rgba(139, 92, 246, 0.08)';
              e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.04)';
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
          }}
        >
          {resendLoading ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : '↻  Resend Code'}
        </button>

        {/* Back to Login */}
        <div style={{ textAlign: 'center' }}>
          <Link
            to="/login"
            style={{ fontSize: '14px', color: '#6b7280', textDecoration: 'none' }}
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
