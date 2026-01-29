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
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          const userData = result.data || result;

          // Update auth context
          setUser(userData);

          // Check if profile completion is required
          if (requiresProfileCompletion || !userData.isProfileComplete) {
            navigate('/complete-profile');
          } else {
            navigate('/dashboard');
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Failed to fetch user data: ${errorData.message || response.statusText}`);
        }
      } catch (err) {
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
