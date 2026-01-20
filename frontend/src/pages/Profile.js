import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import profileService from '../services/profileService';
import { useAuth } from '../context/AuthContext';
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

  // Load profile
  useEffect(() => {
    loadProfile();
  }, []);

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
      </div>
    </DashboardLayout>
  );
};

export default Profile;
