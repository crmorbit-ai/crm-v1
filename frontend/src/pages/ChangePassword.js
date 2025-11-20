import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import '../styles/crm.css';
import { API_URL } from '../config/api.config';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Password changed successfully!');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data.message || 'Failed to change password');
      }
    } catch (err) {
      setError('Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Change Password">
      <div className="crm-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="crm-card-header">
          <h2 className="crm-card-title">Change Your Password</h2>
          <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
            Keep your account secure by using a strong password
          </p>
        </div>

        <div style={{ padding: '24px' }}>
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

          <form onSubmit={handleSubmit}>
            <div className="crm-form-group">
              <label className="crm-form-label">Current Password</label>
              <input
                type="password"
                name="currentPassword"
                className="crm-form-input"
                placeholder="Enter current password"
                value={formData.currentPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div className="crm-form-group">
              <label className="crm-form-label">New Password</label>
              <input
                type="password"
                name="newPassword"
                className="crm-form-input"
                placeholder="Enter new password (min 6 characters)"
                value={formData.newPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div className="crm-form-group">
              <label className="crm-form-label">Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                className="crm-form-input"
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            {/* Password Requirements */}
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
                <li>Different from current password</li>
                <li>Use a mix of letters, numbers, and symbols (recommended)</li>
              </ul>
            </div>

            <button
              type="submit"
              className="crm-btn crm-btn-primary"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChangePassword;