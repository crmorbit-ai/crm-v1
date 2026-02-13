import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../components/layout/DashboardLayout';
import profileService from '../services/profileService';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api.config';
import '../styles/crm.css';

const Profile = () => {
  const navigate = useNavigate();
  const { user: authUser, updateUser } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);

  // Edit mode - Personal Info
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    profilePicture: ''
  });

  // Edit mode - Organization Info
  const [isEditingOrg, setIsEditingOrg] = useState(false);
  const [editedOrg, setEditedOrg] = useState({
    organizationName: '',
    contactEmail: '',
    contactPhone: '',
    industry: '',
    businessType: ''
  });
  const [savingOrg, setSavingOrg] = useState(false);

  // Password change
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // PIN management
  const [isPinSet, setIsPinSet] = useState(false);
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [showForgotPinModal, setShowForgotPinModal] = useState(false);
  const [currentPin, setCurrentPin] = useState(['', '', '', '']);
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const [confirmNewPin, setConfirmNewPin] = useState(['', '', '', '']);
  const [forgotPinOtp, setForgotPinOtp] = useState('');
  const [resetPin, setResetPin] = useState(['', '', '', '']);
  const [confirmResetPin, setConfirmResetPin] = useState(['', '', '', '']);
  const [forgotPinStep, setForgotPinStep] = useState(1); // 1 = send OTP, 2 = enter OTP & new PIN
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  const currentPinRefs = useRef([]);
  const newPinRefs = useRef([]);
  const confirmNewPinRefs = useRef([]);
  const resetPinRefs = useRef([]);
  const confirmResetPinRefs = useRef([]);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Load profile
  useEffect(() => {
    loadProfile();
    checkPinStatus();
  }, []);

  // Check PIN status
  const checkPinStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/viewing-pin/status`, { headers: getAuthHeader() });
      setIsPinSet(res.data?.data?.isViewingPinSet || false);
    } catch (err) { console.error(err); }
  };

  // PIN input handlers
  const handlePinInputChange = (index, value, pinArray, setPinArray, refs) => {
    if (!/^\d*$/.test(value)) return;
    const newPinArray = [...pinArray];
    newPinArray[index] = value.slice(-1);
    setPinArray(newPinArray);
    if (value && index < 3) {
      refs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (index, e, refs) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  // Change PIN handler
  const handleChangePin = async () => {
    const currentPinValue = currentPin.join('');
    const newPinValue = newPin.join('');
    const confirmValue = confirmNewPin.join('');

    if (isPinSet && currentPinValue.length < 4) {
      setPinError('Enter current PIN');
      return;
    }
    if (newPinValue.length < 4) {
      setPinError('New PIN must be at least 4 digits');
      return;
    }
    if (newPinValue !== confirmValue) {
      setPinError('PINs do not match');
      return;
    }

    try {
      setPinLoading(true);
      setPinError('');
      await axios.post(`${API_URL}/viewing-pin/change`,
        { currentPin: currentPinValue, newPin: newPinValue },
        { headers: getAuthHeader() }
      );
      alert('PIN changed successfully!');
      setShowChangePinModal(false);
      setCurrentPin(['', '', '', '']);
      setNewPin(['', '', '', '']);
      setConfirmNewPin(['', '', '', '']);
      setIsPinSet(true);
    } catch (err) {
      setPinError(err.response?.data?.message || 'Failed to change PIN');
    } finally {
      setPinLoading(false);
    }
  };

  // Forgot PIN - Send OTP
  const handleForgotPinSendOtp = async () => {
    try {
      setPinLoading(true);
      setPinError('');
      await axios.post(`${API_URL}/viewing-pin/forgot`, {}, { headers: getAuthHeader() });
      setForgotPinStep(2);
      alert('OTP sent to your email!');
    } catch (err) {
      setPinError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setPinLoading(false);
    }
  };

  // Reset PIN with OTP
  const handleResetPinWithOtp = async () => {
    const resetPinValue = resetPin.join('');
    const confirmValue = confirmResetPin.join('');

    if (!forgotPinOtp || forgotPinOtp.length < 6) {
      setPinError('Enter valid OTP');
      return;
    }
    if (resetPinValue.length < 4) {
      setPinError('New PIN must be at least 4 digits');
      return;
    }
    if (resetPinValue !== confirmValue) {
      setPinError('PINs do not match');
      return;
    }

    try {
      setPinLoading(true);
      setPinError('');
      await axios.post(`${API_URL}/viewing-pin/reset`,
        { otp: forgotPinOtp, newPin: resetPinValue },
        { headers: getAuthHeader() }
      );
      alert('PIN reset successfully!');
      setShowForgotPinModal(false);
      setForgotPinStep(1);
      setForgotPinOtp('');
      setResetPin(['', '', '', '']);
      setConfirmResetPin(['', '', '', '']);
      setIsPinSet(true);
    } catch (err) {
      setPinError(err.response?.data?.message || 'Failed to reset PIN');
    } finally {
      setPinLoading(false);
    }
  };

  // Close PIN modals
  const closePinModals = () => {
    setShowChangePinModal(false);
    setShowForgotPinModal(false);
    setCurrentPin(['', '', '', '']);
    setNewPin(['', '', '', '']);
    setConfirmNewPin(['', '', '', '']);
    setForgotPinOtp('');
    setResetPin(['', '', '', '']);
    setConfirmResetPin(['', '', '', '']);
    setForgotPinStep(1);
    setPinError('');
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await profileService.getProfile();
      setUser(response.data.user);
      setTenant(response.data.tenant);

      // Initialize edit form
      setEditedUser({
        firstName: response.data.user.firstName || '',
        lastName: response.data.user.lastName || '',
        phone: response.data.user.phone || '',
        profilePicture: response.data.user.profilePicture || ''
      });

      // Initialize organization edit form
      if (response.data.tenant) {
        setEditedOrg({
          organizationName: response.data.tenant.organizationName || '',
          contactEmail: response.data.tenant.contactEmail || '',
          contactPhone: response.data.tenant.contactPhone || '',
          industry: response.data.tenant.industry || '',
          businessType: response.data.tenant.businessType || ''
        });
      }

    } catch (error) {
      console.error('Load profile error:', error);
      alert('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit toggle
  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel - reset to original values
      setEditedUser({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        profilePicture: user.profilePicture || ''
      });
    }
    setIsEditing(!isEditing);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle save
  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await profileService.updateProfile(editedUser);

      // Update local state
      setUser(response.data);
      setIsEditing(false);

      // Update auth context
      if (updateUser) {
        updateUser(response.data);
      }

      alert('Profile updated successfully!');

    } catch (error) {
      console.error('Update profile error:', error);
      alert(error.response?.data?.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      setChangingPassword(true);

      await profileService.updatePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      alert('Password updated successfully!');
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

    } catch (error) {
      console.error('Password change error:', error);
      alert(error.response?.data?.message || 'Error changing password');
    } finally {
      setChangingPassword(false);
    }
  };

  // Handle organization edit toggle
  const handleOrgEditToggle = () => {
    if (isEditingOrg) {
      // Cancel - reset to original values
      if (tenant) {
        setEditedOrg({
          organizationName: tenant.organizationName || '',
          contactEmail: tenant.contactEmail || '',
          contactPhone: tenant.contactPhone || '',
          industry: tenant.industry || '',
          businessType: tenant.businessType || ''
        });
      }
    }
    setIsEditingOrg(!isEditingOrg);
  };

  // Handle organization input change
  const handleOrgInputChange = (e) => {
    const { name, value } = e.target;
    setEditedOrg(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle organization save
  const handleOrgSave = async () => {
    try {
      setSavingOrg(true);

      const response = await profileService.updateOrganization(editedOrg);

      // Update local state
      setTenant(response.data);
      setIsEditingOrg(false);

      alert('Organization updated successfully!');

      // Reload profile to get fresh data
      await loadProfile();

    } catch (error) {
      console.error('Update organization error:', error);
      alert(error.response?.data?.message || 'Error updating organization');
    } finally {
      setSavingOrg(false);
    }
  };

  // Get user initials
  const getInitials = () => {
    if (!user) return '??';
    const firstInitial = user.firstName ? user.firstName[0] : '';
    const lastInitial = user.lastName ? user.lastName[0] : '';
    return (firstInitial + lastInitial).toUpperCase();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="loading">Loading profile...</div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="error-message">User not found</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="profile-container">
        {/* Header */}
        <div className="profile-header">
          <div>
            <h1>My Profile</h1>
            <p>View and manage your profile information</p>
          </div>
          <div className="profile-actions">
            {!isEditing ? (
              <>
                <button onClick={handleEditToggle} className="btn-primary">
                  Edit Profile
                </button>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="btn-secondary"
                >
                  Change Password
                </button>
                <button
                  onClick={() => { setPinError(''); setShowChangePinModal(true); }}
                  className="btn-secondary"
                  style={{ background: '#6366f1', color: '#fff' }}
                >
                  {isPinSet ? '🔐 Change PIN' : '🔐 Set PIN'}
                </button>
              </>
            ) : (
              <>
                <button onClick={handleEditToggle} className="btn-secondary">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="profile-grid">
          {/* Left Side - Profile Picture & Quick Info */}
          <div>
            <div className="card profile-sidebar-card">
              <div className="profile-avatar">
                {getInitials()}
              </div>

              <h2 style={{ marginBottom: '8px', fontSize: '20px' }}>
                {user.firstName} {user.lastName}
              </h2>
              <p style={{ color: '#6b7280', marginBottom: '4px', fontSize: '14px', wordBreak: 'break-all' }}>{user.email}</p>
              <p style={{ color: '#9ca3af', fontSize: '13px' }}>
                {user.userType?.replace(/_/g, ' ')}
              </p>

              {tenant && tenant.organizationId && (
                <div
                  style={{
                    marginTop: '20px',
                    padding: '12px',
                    background: '#f3f4f6',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                    Organization ID
                  </div>
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#1f2937',
                      letterSpacing: '1px'
                    }}
                  >
                    {tenant.organizationId}
                  </div>
                </div>
              )}

              <div style={{ marginTop: '20px', textAlign: 'left' }}>
                <div className="profile-info-row">
                  <span style={{ color: '#6b7280' }}>Status</span>
                  <span className={`badge ${user.isActive ? 'badge-success' : 'badge-error'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="profile-info-row">
                  <span style={{ color: '#6b7280' }}>Email Verified</span>
                  <span className={`badge ${user.emailVerified ? 'badge-success' : 'badge-warning'}`}>
                    {user.emailVerified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
                {user.lastLogin && (
                  <div className="profile-info-row">
                    <span style={{ color: '#6b7280' }}>Last Login</span>
                    <span>{new Date(user.lastLogin).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Detailed Information */}
          <div>
            {/* Personal Information */}
            <div className="card" style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '18px' }}>Personal Information</h3>

              <div className="profile-form-grid">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={isEditing ? editedUser.firstName : user.firstName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={isEditing ? editedUser.lastName : user.lastName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="form-control"
                    style={{ background: '#f9fafb', cursor: 'not-allowed' }}
                  />
                  <small style={{ color: '#6b7280', fontSize: '12px' }}>
                    Email cannot be changed
                  </small>
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={isEditing ? editedUser.phone : user.phone || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="form-control"
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="form-group">
                  <label>User Type</label>
                  <input
                    type="text"
                    value={user.userType?.replace(/_/g, ' ')}
                    disabled
                    className="form-control"
                    style={{ background: '#f9fafb', cursor: 'not-allowed' }}
                  />
                </div>
              </div>
            </div>

            {/* Organization Information */}
            {tenant && (
              <div className="card" style={{ marginBottom: '24px' }}>
                <div className="org-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>Organization Information</h3>
                  <div className="profile-actions">
                    {(user.userType === 'TENANT_ADMIN' || user.userType === 'SAAS_OWNER') && (
                      !isEditingOrg ? (
                        <button onClick={handleOrgEditToggle} className="btn-secondary">
                          Edit Organization
                        </button>
                      ) : (
                        <>
                          <button onClick={handleOrgEditToggle} className="btn-secondary">
                            Cancel
                          </button>
                          <button
                            onClick={handleOrgSave}
                            className="btn-primary"
                            disabled={savingOrg}
                          >
                            {savingOrg ? 'Saving...' : 'Save Changes'}
                          </button>
                        </>
                      )
                    )}
                  </div>
                </div>

                <div className="profile-form-grid">
                  <div className="form-group">
                    <label>Organization ID</label>
                    <input
                      type="text"
                      value={tenant.organizationId || 'Not assigned'}
                      disabled
                      className="form-control"
                      style={{
                        background: '#f9fafb',
                        cursor: 'not-allowed',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        letterSpacing: '1px'
                      }}
                    />
                    <small style={{ color: '#6b7280', fontSize: '12px' }}>
                      Organization ID cannot be changed
                    </small>
                  </div>

                  <div className="form-group">
                    <label>Organization Name *</label>
                    <input
                      type="text"
                      name="organizationName"
                      value={isEditingOrg ? editedOrg.organizationName : tenant.organizationName}
                      onChange={handleOrgInputChange}
                      disabled={!isEditingOrg}
                      className="form-control"
                      style={!isEditingOrg ? { background: '#f9fafb', cursor: 'not-allowed' } : {}}
                    />
                  </div>

                  <div className="form-group">
                    <label>Contact Email *</label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={isEditingOrg ? editedOrg.contactEmail : tenant.contactEmail}
                      onChange={handleOrgInputChange}
                      disabled={!isEditingOrg}
                      className="form-control"
                      style={!isEditingOrg ? { background: '#f9fafb', cursor: 'not-allowed' } : {}}
                    />
                  </div>

                  <div className="form-group">
                    <label>Contact Phone</label>
                    <input
                      type="text"
                      name="contactPhone"
                      value={isEditingOrg ? editedOrg.contactPhone : (tenant.contactPhone || '')}
                      onChange={handleOrgInputChange}
                      disabled={!isEditingOrg}
                      className="form-control"
                      placeholder="Enter contact phone"
                      style={!isEditingOrg ? { background: '#f9fafb', cursor: 'not-allowed' } : {}}
                    />
                  </div>

                  <div className="form-group">
                    <label>Industry</label>
                    <input
                      type="text"
                      name="industry"
                      value={isEditingOrg ? editedOrg.industry : (tenant.industry || '')}
                      onChange={handleOrgInputChange}
                      disabled={!isEditingOrg}
                      className="form-control"
                      placeholder="e.g., Technology, Healthcare"
                      style={!isEditingOrg ? { background: '#f9fafb', cursor: 'not-allowed' } : {}}
                    />
                  </div>

                  <div className="form-group">
                    <label>Business Type</label>
                    <select
                      name="businessType"
                      value={isEditingOrg ? editedOrg.businessType : tenant.businessType}
                      onChange={handleOrgInputChange}
                      disabled={!isEditingOrg}
                      className="form-control"
                      style={!isEditingOrg ? { background: '#f9fafb', cursor: 'not-allowed' } : {}}
                    >
                      <option value="B2B">B2B</option>
                      <option value="B2C">B2C</option>
                      <option value="B2B2C">B2B2C</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Roles & Permissions */}
            {user.roles && user.roles.length > 0 && (
              <div className="card">
                <h3 style={{ marginBottom: '20px' }}>Roles & Permissions</h3>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {user.roles.map((role) => (
                    <span
                      key={role._id}
                      className="badge"
                      style={{ background: '#3b82f6', color: 'white', padding: '8px 16px' }}
                    >
                      {role.name}
                    </span>
                  ))}
                </div>

                {user.groups && user.groups.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <strong style={{ display: 'block', marginBottom: '12px' }}>Groups:</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {user.groups.map((group) => (
                        <span
                          key={group._id}
                          className="badge"
                          style={{ background: '#10b981', color: 'white', padding: '8px 16px' }}
                        >
                          {group.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Change Password</h2>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="close-btn"
                >
                  &times;
                </button>
              </div>
              <form onSubmit={handlePasswordChange}>
                <div className="form-group">
                  <label>Current Password *</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    required
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>New Password * (min 6 characters)</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    required
                    minLength={6}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password *</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    required
                    className="form-control"
                  />
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={changingPassword}>
                    {changingPassword ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Change PIN Modal */}
        {showChangePinModal && (
          <div className="modal-overlay" onClick={closePinModals}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '300px', padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{isPinSet ? 'Change PIN' : 'Set PIN'}</h3>
                <button onClick={closePinModals} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}>&times;</button>
              </div>
              <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '16px', marginTop: '0' }}>
                {isPinSet ? 'Enter current & new 4 digit PIN' : 'Create a 4 digit PIN'}
              </p>

              {pinError && (
                <div style={{ background: '#fef2f2', color: '#dc2626', padding: '8px 10px', borderRadius: '6px', fontSize: '11px', marginBottom: '12px', textAlign: 'center' }}>
                  {pinError}
                </div>
              )}

              {isPinSet && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Current PIN</label>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    {currentPin.map((digit, index) => (
                      <input
                        key={`current-${index}`}
                        ref={el => currentPinRefs.current[index] = el}
                        type="password"
                        value={digit}
                        onChange={e => handlePinInputChange(index, e.target.value, currentPin, setCurrentPin, currentPinRefs)}
                        onKeyDown={e => handlePinKeyDown(index, e, currentPinRefs)}
                        style={{ width: '36px', height: '40px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '16px', fontWeight: '700', textAlign: 'center', outline: 'none' }}
                        maxLength={1}
                        inputMode="numeric"
                        autoComplete="new-password"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>New PIN</label>
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                  {newPin.map((digit, index) => (
                    <input
                      key={`new-${index}`}
                      ref={el => newPinRefs.current[index] = el}
                      type="password"
                      value={digit}
                      onChange={e => handlePinInputChange(index, e.target.value, newPin, setNewPin, newPinRefs)}
                      onKeyDown={e => handlePinKeyDown(index, e, newPinRefs)}
                      style={{ width: '36px', height: '40px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '16px', fontWeight: '700', textAlign: 'center', outline: 'none' }}
                      maxLength={1}
                      inputMode="numeric"
                      autoComplete="new-password"
                    />
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Confirm PIN</label>
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                  {confirmNewPin.map((digit, index) => (
                    <input
                      key={`confirm-${index}`}
                      ref={el => confirmNewPinRefs.current[index] = el}
                      type="password"
                      value={digit}
                      onChange={e => handlePinInputChange(index, e.target.value, confirmNewPin, setConfirmNewPin, confirmNewPinRefs)}
                      onKeyDown={e => handlePinKeyDown(index, e, confirmNewPinRefs)}
                      style={{ width: '36px', height: '40px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '16px', fontWeight: '700', textAlign: 'center', outline: 'none' }}
                      maxLength={1}
                      inputMode="numeric"
                      autoComplete="new-password"
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center' }}>
                {isPinSet && (
                  <button
                    type="button"
                    onClick={() => { closePinModals(); setShowForgotPinModal(true); }}
                    style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                  >
                    Forgot PIN?
                  </button>
                )}
                <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                  <button type="button" onClick={closePinModals} style={{ padding: '8px 14px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                  <button type="button" onClick={handleChangePin} disabled={pinLoading} style={{ padding: '8px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                    {pinLoading ? 'Saving...' : (isPinSet ? 'Change' : 'Set PIN')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Forgot PIN Modal */}
        {showForgotPinModal && (
          <div className="modal-overlay" onClick={closePinModals}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '300px', padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Reset PIN</h3>
                <button onClick={closePinModals} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}>&times;</button>
              </div>

              {pinError && (
                <div style={{ background: '#fef2f2', color: '#dc2626', padding: '8px 10px', borderRadius: '6px', fontSize: '11px', marginBottom: '12px', textAlign: 'center' }}>
                  {pinError}
                </div>
              )}

              {forgotPinStep === 1 ? (
                <>
                  <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '16px', marginTop: 0 }}>
                    We'll send an OTP to your email.
                  </p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={closePinModals} style={{ padding: '8px 14px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                    <button type="button" onClick={handleForgotPinSendOtp} disabled={pinLoading} style={{ padding: '8px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                      {pinLoading ? 'Sending...' : 'Send OTP'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Enter OTP</label>
                    <input
                      type="text"
                      value={forgotPinOtp}
                      onChange={e => setForgotPinOtp(e.target.value)}
                      maxLength={6}
                      placeholder="6-digit OTP"
                      style={{ width: '100%', padding: '8px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', textAlign: 'center', letterSpacing: '6px', boxSizing: 'border-box' }}
                      autoComplete="off"
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>New PIN</label>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      {resetPin.map((digit, index) => (
                        <input
                          key={`reset-${index}`}
                          ref={el => resetPinRefs.current[index] = el}
                          type="password"
                          value={digit}
                          onChange={e => handlePinInputChange(index, e.target.value, resetPin, setResetPin, resetPinRefs)}
                          onKeyDown={e => handlePinKeyDown(index, e, resetPinRefs)}
                          style={{ width: '36px', height: '40px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '16px', fontWeight: '700', textAlign: 'center', outline: 'none' }}
                          maxLength={1}
                          inputMode="numeric"
                          autoComplete="new-password"
                        />
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Confirm PIN</label>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      {confirmResetPin.map((digit, index) => (
                        <input
                          key={`confirmReset-${index}`}
                          ref={el => confirmResetPinRefs.current[index] = el}
                          type="password"
                          value={digit}
                          onChange={e => handlePinInputChange(index, e.target.value, confirmResetPin, setConfirmResetPin, confirmResetPinRefs)}
                          onKeyDown={e => handlePinKeyDown(index, e, confirmResetPinRefs)}
                          style={{ width: '36px', height: '40px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '16px', fontWeight: '700', textAlign: 'center', outline: 'none' }}
                          maxLength={1}
                          inputMode="numeric"
                          autoComplete="new-password"
                        />
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setForgotPinStep(1)} style={{ padding: '8px 14px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Back</button>
                    <button type="button" onClick={handleResetPinWithOtp} disabled={pinLoading} style={{ padding: '8px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                      {pinLoading ? 'Resetting...' : 'Reset PIN'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Profile;
