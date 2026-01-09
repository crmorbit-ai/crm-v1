import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api.config';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setToken, setUser, loadUser } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const requiresProfileCompletion = searchParams.get('requiresProfileCompletion') === 'true';
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError('Authentication failed. Please try again.');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (!token) {
        setError('No authentication token received.');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      // Store token first
      localStorage.setItem('token', token);

      // Fetch user data using API_URL
      try {
        console.log('🔍 Fetching user data from:', `${API_URL}/auth/me`);
        console.log('🔑 Token:', token);

        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('📥 Response status:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('✅ User data received:', result);

          const userData = result.data || result; // Handle both wrapped and unwrapped responses

          // Update auth context
          setUser(userData);

          // Check if profile completion is required
          if (requiresProfileCompletion || !userData.isProfileComplete) {
            console.log('➡️ Redirecting to complete-profile');
            navigate('/complete-profile');
          } else {
            console.log('➡️ Redirecting to dashboard');
            navigate('/dashboard');
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ Response not ok:', response.status, errorData);
          throw new Error(`Failed to fetch user data: ${errorData.message || response.statusText}`);
        }
      } catch (err) {
        console.error('❌ OAuth callback error:', err);
        setError('Failed to complete authentication. Please try logging in again.');
        localStorage.removeItem('token');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, setUser]);

  return (
    <div className="auth-container">
      <div className="auth-box" style={{ textAlign: 'center' }}>
        {error ? (
          <>
            <div className="error-icon" style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
            <h2 style={{ color: '#DC2626', marginBottom: '16px' }}>Authentication Failed</h2>
            <p style={{ color: '#6B7280' }}>{error}</p>
            <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: '16px' }}>
              Redirecting to login...
            </p>
          </>
        ) : (
          <>
            <div className="spinner" style={{
              width: '48px',
              height: '48px',
              border: '4px solid #E5E7EB',
              borderTop: '4px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <h2 style={{ color: '#1F2937', marginBottom: '12px' }}>Completing Authentication...</h2>
            <p style={{ color: '#6B7280' }}>Please wait while we set up your account.</p>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default OAuthCallback;
