import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/auth.css';
import { API_URL } from '../config/api.config';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('OTP sent to your email!');
        setStep(2);
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('OTP verified! Set your new password.');
        setStep(3);
      } else {
        setError(data.message || 'Invalid OTP');
      }
    } catch (err) {
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword: password })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Password reset successful!');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <img
            src="/ufsscrmlogo.png"
            alt="UFS CRM"
            style={{
              width: '140px',
              height: 'auto',
              mixBlendMode: 'multiply',
              filter: 'contrast(1.1)',
              display: 'block',
              margin: '0 auto 16px'
            }}
          />
          <h1 className="auth-title">
            {step === 1 && 'Forgot Password?'}
            {step === 2 && 'Verify OTP'}
            {step === 3 && 'Create New Password'}
          </h1>
          <p className="auth-subtitle">
            {step === 1 && 'Enter your email to receive OTP'}
            {step === 2 && 'Enter the 6-digit code sent to your email'}
            {step === 3 && 'Enter your new password'}
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div style={{ 
            padding: '12px 16px', 
            background: '#DCFCE7', 
            color: '#166534', 
            borderRadius: '8px', 
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            ✅ {success}
          </div>
        )}

        {error && (
          <div style={{ 
            padding: '12px 16px', 
            background: '#FEE2E2', 
            color: '#991B1B', 
            borderRadius: '8px', 
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            ❌ {error}
          </div>
        )}

        {/* Step 1: Enter Email */}
        {step === 1 && (
          <form onSubmit={handleSendOTP}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {/* Step 2: Enter OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP}>
            <div style={{ marginBottom: '20px', padding: '16px', background: '#EFF6FF', borderRadius: '8px' }}>
              <p style={{ fontSize: '13px', color: '#1E40AF', margin: 0 }}>
                📧 OTP sent to: <strong>{email}</strong>
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Enter OTP</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                autoFocus
                maxLength={6}
                style={{ fontSize: '24px', letterSpacing: '8px', textAlign: 'center', fontWeight: '600' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtp('');
                  setError('');
                }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#3B82F6', 
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ← Back to Email
              </button>
            </div>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter new password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ 
              padding: '12px 16px', 
              background: '#EFF6FF', 
              borderRadius: '8px', 
              marginBottom: '20px' 
            }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#1E40AF', marginBottom: '8px' }}>
                Password Requirements:
              </p>
              <ul style={{ fontSize: '13px', color: '#1E40AF', paddingLeft: '20px', margin: 0 }}>
                <li>At least 6 characters long</li>
                <li>Mix of letters and numbers (recommended)</li>
              </ul>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="auth-footer">
          <p>
            Remember your password?{' '}
            <Link to="/login" className="auth-link">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;