import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../components/layout/DashboardLayout';
import profileService from '../services/profileService';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api.config';
import '../styles/crm.css';

// Responsive CSS for Profile page
const profileResponsiveCSS = `
  .profile-container { max-width: 1000px; margin: 0 auto; padding: 16px; }
  .profile-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
  .profile-header-left { display: flex; align-items: center; gap: 16px; }
  .profile-tabs { display: flex; gap: 4px; margin-bottom: 16px; background: #f3f4f6; padding: 4px; border-radius: 8px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .profile-tabs::-webkit-scrollbar { display: none; }
  .profile-tab { padding: 8px 16px; border: none; background: transparent; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; color: #6b7280; transition: all 0.2s; white-space: nowrap; flex-shrink: 0; }
  .profile-tab.active { background: #fff; color: #1f2937; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .profile-card { background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; padding: 16px; margin-bottom: 16px; }
  .profile-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .profile-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .profile-btn-group { display: flex; gap: 8px; flex-wrap: wrap; }
  .profile-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }

  @media (max-width: 768px) {
    .profile-container { padding: 12px; }
    .profile-header { flex-direction: column; align-items: stretch; }
    .profile-header-left { flex-direction: column; align-items: center; text-align: center; }
    .profile-btn-group { justify-content: center; width: 100%; }
    .profile-tabs { padding: 3px; gap: 2px; }
    .profile-tab { padding: 6px 12px; font-size: 12px; }
    .profile-grid-2 { grid-template-columns: 1fr; }
    .profile-grid-3 { grid-template-columns: 1fr; }
    .profile-card { padding: 12px; }
    .profile-card-header { flex-direction: column; align-items: stretch; gap: 10px; }
    .profile-card-header .profile-btn-group { justify-content: flex-end; }
    .span-2-col { grid-column: span 1 !important; }
  }

  @media (max-width: 480px) {
    .profile-tab { padding: 5px 10px; font-size: 11px; }
    .profile-header-left { gap: 10px; }
  }
`;

const Profile = () => {
  const navigate = useNavigate();
  const { user: authUser, updateUser } = useAuth();
  const logoInputRef = useRef(null);

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');

  // Edit mode - Personal Info
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    firstName: '', lastName: '', phone: '', profilePicture: ''
  });

  // Edit mode - Organization Info
  const [isEditingOrg, setIsEditingOrg] = useState(false);
  const [editedOrg, setEditedOrg] = useState({
    organizationName: '', contactEmail: '', contactPhone: '', alternatePhone: '',
    industry: '', businessType: '', legalName: '', logo: '', website: '',
    numberOfEmployees: '', foundedYear: '', taxId: '', registrationNumber: '',
    socialMedia: { linkedin: '', twitter: '', facebook: '', instagram: '' },
    headquarters: { street: '', city: '', state: '', country: '', zipCode: '' },
    keyContact: { name: '', designation: '', email: '', phone: '' }
  });
  const [savingOrg, setSavingOrg] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Password change
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
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
  const [forgotPinStep, setForgotPinStep] = useState(1);
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

  useEffect(() => { loadProfile(); checkPinStatus(); }, []);

  const checkPinStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/viewing-pin/status`, { headers: getAuthHeader() });
      setIsPinSet(res.data?.data?.isViewingPinSet || false);
    } catch (err) { console.error(err); }
  };

  const handlePinInputChange = (index, value, pinArray, setPinArray, refs) => {
    if (!/^\d*$/.test(value)) return;
    const newPinArray = [...pinArray];
    newPinArray[index] = value.slice(-1);
    setPinArray(newPinArray);
    if (value && index < 3) refs.current[index + 1]?.focus();
  };

  const handlePinKeyDown = (index, e, refs) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) refs.current[index - 1]?.focus();
  };

  const handleChangePin = async () => {
    const currentPinValue = currentPin.join('');
    const newPinValue = newPin.join('');
    const confirmValue = confirmNewPin.join('');
    if (isPinSet && currentPinValue.length < 4) { setPinError('Enter current PIN'); return; }
    if (newPinValue.length < 4) { setPinError('New PIN must be at least 4 digits'); return; }
    if (newPinValue !== confirmValue) { setPinError('PINs do not match'); return; }
    try {
      setPinLoading(true); setPinError('');
      await axios.post(`${API_URL}/viewing-pin/change`, { currentPin: currentPinValue, newPin: newPinValue }, { headers: getAuthHeader() });
      alert('PIN changed successfully!');
      closePinModals(); setIsPinSet(true);
    } catch (err) { setPinError(err.response?.data?.message || 'Failed to change PIN'); }
    finally { setPinLoading(false); }
  };

  const handleForgotPinSendOtp = async () => {
    try {
      setPinLoading(true); setPinError('');
      await axios.post(`${API_URL}/viewing-pin/forgot`, {}, { headers: getAuthHeader() });
      setForgotPinStep(2); alert('OTP sent to your email!');
    } catch (err) { setPinError(err.response?.data?.message || 'Failed to send OTP'); }
    finally { setPinLoading(false); }
  };

  const handleResetPinWithOtp = async () => {
    const resetPinValue = resetPin.join('');
    const confirmValue = confirmResetPin.join('');
    if (!forgotPinOtp || forgotPinOtp.length < 6) { setPinError('Enter valid OTP'); return; }
    if (resetPinValue.length < 4) { setPinError('New PIN must be at least 4 digits'); return; }
    if (resetPinValue !== confirmValue) { setPinError('PINs do not match'); return; }
    try {
      setPinLoading(true); setPinError('');
      await axios.post(`${API_URL}/viewing-pin/reset`, { otp: forgotPinOtp, newPin: resetPinValue }, { headers: getAuthHeader() });
      alert('PIN reset successfully!');
      closePinModals(); setIsPinSet(true);
    } catch (err) { setPinError(err.response?.data?.message || 'Failed to reset PIN'); }
    finally { setPinLoading(false); }
  };

  const closePinModals = () => {
    setShowChangePinModal(false); setShowForgotPinModal(false);
    setCurrentPin(['', '', '', '']); setNewPin(['', '', '', '']); setConfirmNewPin(['', '', '', '']);
    setForgotPinOtp(''); setResetPin(['', '', '', '']); setConfirmResetPin(['', '', '', '']);
    setForgotPinStep(1); setPinError('');
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await profileService.getProfile();
      setUser(response.data.user);
      setTenant(response.data.tenant);
      setEditedUser({
        firstName: response.data.user.firstName || '',
        lastName: response.data.user.lastName || '',
        phone: response.data.user.phone || '',
        profilePicture: response.data.user.profilePicture || ''
      });
      if (response.data.tenant) {
        const t = response.data.tenant;
        setEditedOrg({
          organizationName: t.organizationName || '', contactEmail: t.contactEmail || '',
          contactPhone: t.contactPhone || '', alternatePhone: t.alternatePhone || '',
          industry: t.industry || '', businessType: t.businessType || '',
          legalName: t.legalName || '', logo: t.logo || '', website: t.website || '',
          numberOfEmployees: t.numberOfEmployees || '', foundedYear: t.foundedYear || '',
          taxId: t.taxId || '', registrationNumber: t.registrationNumber || '',
          socialMedia: { linkedin: t.socialMedia?.linkedin || '', twitter: t.socialMedia?.twitter || '', facebook: t.socialMedia?.facebook || '', instagram: t.socialMedia?.instagram || '' },
          headquarters: { street: t.headquarters?.street || '', city: t.headquarters?.city || '', state: t.headquarters?.state || '', country: t.headquarters?.country || '', zipCode: t.headquarters?.zipCode || '' },
          keyContact: { name: t.keyContact?.name || '', designation: t.keyContact?.designation || '', email: t.keyContact?.email || '', phone: t.keyContact?.phone || '' }
        });
      }
    } catch (error) { console.error('Load profile error:', error); alert('Error loading profile'); }
    finally { setLoading(false); }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditedUser({ firstName: user.firstName || '', lastName: user.lastName || '', phone: user.phone || '', profilePicture: user.profilePicture || '' });
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await profileService.updateProfile(editedUser);
      setUser(response.data); setIsEditing(false);
      if (updateUser) updateUser(response.data);
      alert('Profile updated successfully!');
    } catch (error) { console.error('Update profile error:', error); alert(error.response?.data?.message || 'Error updating profile'); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) { alert('New passwords do not match'); return; }
    if (passwordData.newPassword.length < 6) { alert('Password must be at least 6 characters'); return; }
    try {
      setChangingPassword(true);
      await profileService.updatePassword(passwordData.currentPassword, passwordData.newPassword);
      alert('Password updated successfully!');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) { console.error('Password change error:', error); alert(error.response?.data?.message || 'Error changing password'); }
    finally { setChangingPassword(false); }
  };

  const handleOrgEditToggle = () => {
    if (isEditingOrg && tenant) {
      const t = tenant;
      setEditedOrg({
        organizationName: t.organizationName || '', contactEmail: t.contactEmail || '',
        contactPhone: t.contactPhone || '', alternatePhone: t.alternatePhone || '',
        industry: t.industry || '', businessType: t.businessType || '',
        legalName: t.legalName || '', logo: t.logo || '', website: t.website || '',
        numberOfEmployees: t.numberOfEmployees || '', foundedYear: t.foundedYear || '',
        taxId: t.taxId || '', registrationNumber: t.registrationNumber || '',
        socialMedia: { linkedin: t.socialMedia?.linkedin || '', twitter: t.socialMedia?.twitter || '', facebook: t.socialMedia?.facebook || '', instagram: t.socialMedia?.instagram || '' },
        headquarters: { street: t.headquarters?.street || '', city: t.headquarters?.city || '', state: t.headquarters?.state || '', country: t.headquarters?.country || '', zipCode: t.headquarters?.zipCode || '' },
        keyContact: { name: t.keyContact?.name || '', designation: t.keyContact?.designation || '', email: t.keyContact?.email || '', phone: t.keyContact?.phone || '' }
      });
    }
    setIsEditingOrg(!isEditingOrg);
  };

  const handleOrgInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEditedOrg(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
    } else {
      setEditedOrg(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please upload an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Image size should be less than 5MB'); return; }

    try {
      setUploadingLogo(true);
      // Show instant preview using object URL (no base64)
      const previewUrl = URL.createObjectURL(file);
      setEditedOrg(prev => ({ ...prev, _logoPreview: previewUrl }));

      // Upload as multipart/form-data — no base64, no payload size issue
      const response = await profileService.uploadLogo(file);
      const savedLogoPath = response.data?.data?.logo || response.data?.logo;

      setEditedOrg(prev => ({ ...prev, logo: savedLogoPath, _logoPreview: null }));
      setTenant(prev => ({ ...prev, logo: savedLogoPath }));
      alert('Logo updated successfully!');
    } catch (err) {
      console.error('Logo upload error:', err);
      alert(err.response?.data?.message || 'Error uploading logo');
      setEditedOrg(prev => ({ ...prev, _logoPreview: null }));
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleOrgSave = async () => {
    try {
      setSavingOrg(true);
      const response = await profileService.updateOrganization(editedOrg);
      setTenant(response.data); setIsEditingOrg(false);
      alert('Organization updated successfully!');
      await loadProfile();
    } catch (error) { console.error('Update organization error:', error); alert(error.response?.data?.message || 'Error updating organization'); }
    finally { setSavingOrg(false); }
  };

  const getInitials = () => {
    if (!user) return '??';
    return ((user.firstName?.[0] || '') + (user.lastName?.[0] || '')).toUpperCase();
  };

  const getOrgInitials = () => {
    if (!tenant?.organizationName) return 'ORG';
    return tenant.organizationName.substring(0, 2).toUpperCase();
  };

  if (loading) return <DashboardLayout><div className="loading">Loading profile...</div></DashboardLayout>;
  if (!user) return <DashboardLayout><div className="error-message">User not found</div></DashboardLayout>;

  const styles = {
    container: { maxWidth: '1000px', margin: '0 auto', padding: '16px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
    logoContainer: { position: 'relative', width: '70px', height: '70px', borderRadius: '12px', overflow: 'hidden', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isEditingOrg ? 'pointer' : 'default', border: '3px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
    logoImg: { width: '100%', height: '100%', objectFit: 'cover' },
    logoInitials: { color: '#fff', fontSize: '24px', fontWeight: '700' },
    logoOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' },
    headerInfo: {},
    orgName: { fontSize: '22px', fontWeight: '700', color: '#1f2937', margin: 0 },
    orgId: { fontSize: '13px', color: '#6b7280', marginTop: '2px', fontFamily: 'monospace', background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px', display: 'inline-block' },
    tabs: { display: 'flex', gap: '4px', marginBottom: '16px', background: '#f3f4f6', padding: '4px', borderRadius: '8px' },
    tab: { padding: '8px 16px', border: 'none', background: 'transparent', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', color: '#6b7280', transition: 'all 0.2s' },
    tabActive: { background: '#fff', color: '#1f2937', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
    card: { background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px', marginBottom: '16px' },
    cardTitle: { fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' },
    grid2: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' },
    grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' },
    formGroup: { marginBottom: '0' },
    label: { display: 'block', fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase' },
    input: { width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', background: '#fff', boxSizing: 'border-box' },
    inputDisabled: { background: '#f9fafb', cursor: 'not-allowed', color: '#6b7280' },
    select: { width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', background: '#fff', boxSizing: 'border-box' },
    btnGroup: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
    btnPrimary: { padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' },
    btnSecondary: { padding: '8px 16px', background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' },
    btnPin: { padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' },
    badge: { display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: '500' },
    badgeSuccess: { background: '#dcfce7', color: '#16a34a' },
    badgeWarning: { background: '#fef3c7', color: '#d97706' },
    sideInfo: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6', fontSize: '12px' },
  };

  return (
    <DashboardLayout>
      <style>{profileResponsiveCSS}</style>
      <div className="profile-container">
        {/* Compact Header with Logo */}
        <div className="profile-header">
          <div className="profile-header-left">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div
                style={{ ...styles.logoContainer, cursor: 'pointer' }}
                onClick={() => logoInputRef.current?.click()}
                onMouseEnter={(e) => (e.currentTarget.querySelector('.overlay').style.opacity = 1)}
                onMouseLeave={(e) => (e.currentTarget.querySelector('.overlay').style.opacity = 0)}
              >
                {(editedOrg._logoPreview || editedOrg.logo || tenant?.logo) ? (
                  <img src={(() => {
                    // Priority: instant preview > saved path > tenant path
                    if (editedOrg._logoPreview) return editedOrg._logoPreview;
                    const l = editedOrg.logo || tenant?.logo;
                    if (!l) return null;
                    if (l.startsWith('http') || l.startsWith('data:')) return l;
                    return `${API_URL.replace(/\/api$/, '')}${l}`;
                  })()} alt="Logo" style={styles.logoImg} />
                ) : (
                  <span style={styles.logoInitials}>{getOrgInitials()}</span>
                )}
                <div className="overlay" style={styles.logoOverlay}>
                  <span style={{ color: '#fff', fontSize: '11px' }}>{uploadingLogo ? '...' : '📷'}</span>
                </div>
                <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
              </div>
              <button
                onClick={() => logoInputRef.current?.click()}
                style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '11px', cursor: 'pointer', padding: 0 }}
              >
                {uploadingLogo ? 'Uploading...' : 'Change Logo'}
              </button>
            </div>
            <div style={styles.headerInfo}>
              <h1 style={styles.orgName}>{tenant?.organizationName || 'My Organization'}</h1>
              {tenant?.organizationId && <span style={styles.orgId}>{tenant.organizationId}</span>}
            </div>
          </div>
          <div className="profile-btn-group">
            <button onClick={() => setShowPasswordModal(true)} style={styles.btnSecondary}>Change Password</button>
            <button onClick={() => { setPinError(''); setShowChangePinModal(true); }} style={styles.btnPin}>
              {isPinSet ? 'Change PIN' : 'Set PIN'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button className={`profile-tab ${activeTab === 'personal' ? 'active' : ''}`} onClick={() => setActiveTab('personal')}>Personal Info</button>
          <button className={`profile-tab ${activeTab === 'organization' ? 'active' : ''}`} onClick={() => setActiveTab('organization')}>Organization</button>
          <button className={`profile-tab ${activeTab === 'contact' ? 'active' : ''}`} onClick={() => setActiveTab('contact')}>Contacts & Address</button>
          <button className={`profile-tab ${activeTab === 'digital' ? 'active' : ''}`} onClick={() => setActiveTab('digital')}>Digital Presence</button>
        </div>

        {/* Personal Info Tab */}
        {activeTab === 'personal' && (
          <div className="profile-card">
            <div className="profile-card-header">
              <h3 style={{ ...styles.cardTitle, marginBottom: 0 }}>Personal Information</h3>
              <div className="profile-btn-group">
                {!isEditing ? (
                  <button onClick={handleEditToggle} style={styles.btnPrimary}>Edit</button>
                ) : (
                  <>
                    <button onClick={handleEditToggle} style={styles.btnSecondary}>Cancel</button>
                    <button onClick={handleSave} disabled={saving} style={styles.btnPrimary}>{saving ? 'Saving...' : 'Save'}</button>
                  </>
                )}
              </div>
            </div>
            <div className="profile-grid-2">
              <div style={styles.formGroup}>
                <label style={styles.label}>First Name</label>
                <input type="text" name="firstName" value={isEditing ? editedUser.firstName : user.firstName} onChange={handleInputChange} disabled={!isEditing} style={{ ...styles.input, ...(!isEditing ? styles.inputDisabled : {}) }} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Last Name</label>
                <input type="text" name="lastName" value={isEditing ? editedUser.lastName : user.lastName} onChange={handleInputChange} disabled={!isEditing} style={{ ...styles.input, ...(!isEditing ? styles.inputDisabled : {}) }} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input type="email" value={user.email} disabled style={{ ...styles.input, ...styles.inputDisabled }} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Phone</label>
                <input type="text" name="phone" value={isEditing ? editedUser.phone : (user.phone || '')} onChange={handleInputChange} disabled={!isEditing} placeholder="Enter phone" style={{ ...styles.input, ...(!isEditing ? styles.inputDisabled : {}) }} />
              </div>
            </div>
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
              <div className="profile-grid-3">
                <div style={styles.sideInfo}><span style={{ color: '#6b7280' }}>Status</span><span style={{ ...styles.badge, ...(user.isActive ? styles.badgeSuccess : styles.badgeWarning) }}>{user.isActive ? 'Active' : 'Inactive'}</span></div>
                <div style={styles.sideInfo}><span style={{ color: '#6b7280' }}>Email Verified</span><span style={{ ...styles.badge, ...(user.emailVerified ? styles.badgeSuccess : styles.badgeWarning) }}>{user.emailVerified ? 'Yes' : 'No'}</span></div>
                <div style={styles.sideInfo}><span style={{ color: '#6b7280' }}>User Type</span><span>{user.userType?.replace(/_/g, ' ')}</span></div>
              </div>
              {user.lastLogin && (
                <div style={{ marginTop: '12px', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px' }}>🕐</span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Last Login:</span>
                  <span style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>
                    {new Date(user.lastLogin).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Organization Tab */}
        {activeTab === 'organization' && tenant && (
          <div className="profile-card">
            <div className="profile-card-header">
              <h3 style={{ ...styles.cardTitle, marginBottom: 0 }}>Organization Details</h3>
              {(user.userType === 'TENANT_ADMIN' || user.userType === 'SAAS_OWNER') && (
                <div className="profile-btn-group">
                  {!isEditingOrg ? (
                    <button onClick={handleOrgEditToggle} style={styles.btnPrimary}>Edit</button>
                  ) : (
                    <>
                      <button onClick={handleOrgEditToggle} style={styles.btnSecondary}>Cancel</button>
                      <button onClick={handleOrgSave} disabled={savingOrg} style={styles.btnPrimary}>{savingOrg ? 'Saving...' : 'Save'}</button>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="profile-grid-2">
              <div style={styles.formGroup}>
                <label style={styles.label}>Organization Name *</label>
                <input type="text" name="organizationName" value={isEditingOrg ? editedOrg.organizationName : tenant.organizationName} onChange={handleOrgInputChange} disabled={!isEditingOrg} style={{ ...styles.input, ...(!isEditingOrg ? styles.inputDisabled : {}) }} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Legal Name</label>
                <input type="text" name="legalName" value={isEditingOrg ? editedOrg.legalName : (tenant.legalName || '')} onChange={handleOrgInputChange} disabled={!isEditingOrg} placeholder="Official legal entity name" style={{ ...styles.input, ...(!isEditingOrg ? styles.inputDisabled : {}) }} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Industry</label>
                <input type="text" name="industry" value={isEditingOrg ? editedOrg.industry : (tenant.industry || '')} onChange={handleOrgInputChange} disabled={!isEditingOrg} placeholder="e.g., Technology" style={{ ...styles.input, ...(!isEditingOrg ? styles.inputDisabled : {}) }} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Business Type</label>
                <select name="businessType" value={isEditingOrg ? editedOrg.businessType : tenant.businessType} onChange={handleOrgInputChange} disabled={!isEditingOrg} style={{ ...styles.select, ...(!isEditingOrg ? styles.inputDisabled : {}) }}>
                  <option value="B2B">B2B</option>
                  <option value="B2C">B2C</option>
                  <option value="B2B2C">B2B2C</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Number of Employees</label>
                <select name="numberOfEmployees" value={isEditingOrg ? editedOrg.numberOfEmployees : (tenant.numberOfEmployees || '')} onChange={handleOrgInputChange} disabled={!isEditingOrg} style={{ ...styles.select, ...(!isEditingOrg ? styles.inputDisabled : {}) }}>
                  <option value="">Select...</option>
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-500">201-500</option>
                  <option value="501-1000">501-1000</option>
                  <option value="1000+">1000+</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Founded Year</label>
                <input type="number" name="foundedYear" value={isEditingOrg ? editedOrg.foundedYear : (tenant.foundedYear || '')} onChange={handleOrgInputChange} disabled={!isEditingOrg} placeholder="e.g., 2020" style={{ ...styles.input, ...(!isEditingOrg ? styles.inputDisabled : {}) }} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Tax ID / GST</label>
                <input type="text" name="taxId" value={isEditingOrg ? editedOrg.taxId : (tenant.taxId || '')} onChange={handleOrgInputChange} disabled={!isEditingOrg} placeholder="GST/Tax number" style={{ ...styles.input, ...(!isEditingOrg ? styles.inputDisabled : {}) }} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Registration Number</label>
                <input type="text" name="registrationNumber" value={isEditingOrg ? editedOrg.registrationNumber : (tenant.registrationNumber || '')} onChange={handleOrgInputChange} disabled={!isEditingOrg} placeholder="Company registration" style={{ ...styles.input, ...(!isEditingOrg ? styles.inputDisabled : {}) }} />
              </div>
            </div>
          </div>
        )}

        {/* Contacts & Address Tab */}
        {activeTab === 'contact' && tenant && (
          <>
            <div className="profile-card">
              <div className="profile-card-header">
                <h3 style={{ ...styles.cardTitle, marginBottom: 0 }}>Contact Information</h3>
                {(user.userType === 'TENANT_ADMIN' || user.userType === 'SAAS_OWNER') && !isEditingOrg && (
                  <button onClick={handleOrgEditToggle} style={styles.btnPrimary}>Edit</button>
                )}
                {isEditingOrg && (
                  <div className="profile-btn-group">
                    <button onClick={handleOrgEditToggle} style={styles.btnSecondary}>Cancel</button>
                    <button onClick={handleOrgSave} disabled={savingOrg} style={styles.btnPrimary}>{savingOrg ? 'Saving...' : 'Save'}</button>
                  </div>
                )}
              </div>
              <div className="profile-grid-2">
                <div style={styles.formGroup}>
                  <label style={styles.label}>Contact Email *</label>
                  <input type="email" name="contactEmail" value={isEditingOrg ? editedOrg.contactEmail : tenant.contactEmail} onChange={handleOrgInputChange} disabled={!isEditingOrg} style={{ ...styles.input, ...(!isEditingOrg ? styles.inputDisabled : {}) }} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Contact Phone</label>
                  <input type="text" name="contactPhone" value={isEditingOrg ? editedOrg.contactPhone : (tenant.contactPhone || '')} onChange={handleOrgInputChange} disabled={!isEditingOrg} style={{ ...styles.input, ...(!isEditingOrg ? styles.inputDisabled : {}) }} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Alternate Phone</label>
                  <input type="text" name="alternatePhone" value={isEditingOrg ? editedOrg.alternatePhone : (tenant.alternatePhone || '')} onChange={handleOrgInputChange} disabled={!isEditingOrg} style={{ ...styles.input, ...(!isEditingOrg ? styles.inputDisabled : {}) }} />
                </div>
              </div>
            </div>

            <div className="profile-card">
              <h3 style={styles.cardTitle}>Key Contact Person</h3>
              <div className="profile-grid-2">
                <div style={styles.formGroup}>
                  <label style={styles.label}>Name</label>
                  <input type="text" name="keyContact.name" value={isEditingOrg ? editedOrg.keyContact.name : (tenant.keyContact?.name || '')} onChange={handleOrgInputChange} disabled={!isEditingOrg} placeholder="Contact person name" style={{ ...styles.input, ...(!isEditingOrg ? styles.inputDisabled : {}) }} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Designation</label>
                  <input type="text" name="keyContact.designation" value={isEditingOrg ? editedOrg.keyContact.designation : (tenant.keyContact?.designation || '')} onChange={handleOrgInputChange} disabled={!isEditingOrg} placeholder="e.g., CEO, Manager" style={{ ...styles.input, ...(!isEditingOrg ? styles.inputDisabled : {}) }} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Email</label>
                  <input type="email" name="keyContact.email" value={isEditingOrg ? editedOrg.keyContact.email : (tenant.keyContact?.email || '')} onChange={handleOrgInputChange} disabled={!isEditingOrg} style={{ ...styles.input, ...(!isEditingOrg ? styles.inputDisabled : {}) }} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Phone</label>
                  <input type="text" name="keyContact.phone" value={isEditingOrg ? editedOrg.keyContact.phone : (tenant.keyContact?.phone || '')} onChange={handleOrgInputChange} disabled={!isEditingOrg} style={{ ...styles.input, ...(!isEditingOrg ? styles.inputDisabled : {}) }} />
                </div>
              </div>
            </div>

            <div className="profile-card">
              <h3 style={styles.cardTitle}>Headquarters Address</h3>
              <div className="profile-grid-2">
                <div className="span-2-col" style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
                  <label style={styles.label}>Street Address</label>
                  <input type="text" name="headquarters.street" value={isEditingOrg ? editedOrg.headquarters.street : (tenant.headquarters?.street || '')} onChange={handleOrgInputChange} disabled={!isEditingOrg} placeholder="Street address" style={{ ...styles.input, ...(!isEditingOrg ? styles.inputDisabled : {}) }} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>City</label>
                  <input type="text" name="headquarters.city" value={isEditingOrg ? editedOrg.headquarters.city : (tenant.headquarters?.city || '')} onChange={handleOrgInputChange} disabled={!isEditingOrg} style={{ ...styles.input, ...(!isEditingOrg ? styles.inputDisabled : {}) }} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>State</label>
                  <input type="text" name="headquarters.state" value={isEditingOrg ? editedOrg.headquarters.state : (tenant.headquarters?.state || '')} onChange={handleOrgInputChange} disabled={!isEditingOrg} style={{ ...styles.input, ...(!isEditingOrg ? styles.inputDisabled : {}) }} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Country</label>
                  <input type="text" name="headquarters.country" value={isEditingOrg ? editedOrg.headquarters.country : (tenant.headquarters?.country || '')} onChange={handleOrgInputChange} disabled={!isEditingOrg} style={{ ...styles.input, ...(!isEditingOrg ? styles.inputDisabled : {}) }} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>ZIP / Postal Code</label>
                  <input type="text" name="headquarters.zipCode" value={isEditingOrg ? editedOrg.headquarters.zipCode : (tenant.headquarters?.zipCode || '')} onChange={handleOrgInputChange} disabled={!isEditingOrg} style={{ ...styles.input, ...(!isEditingOrg ? styles.inputDisabled : {}) }} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Digital Presence Tab */}
        {activeTab === 'digital' && tenant && (
          <div className="profile-card">
            <div className="profile-card-header">
              <h3 style={{ ...styles.cardTitle, marginBottom: 0 }}>Digital Presence</h3>
              {(user.userType === 'TENANT_ADMIN' || user.userType === 'SAAS_OWNER') && !isEditingOrg && (
                <button onClick={handleOrgEditToggle} style={styles.btnPrimary}>Edit</button>
              )}
              {isEditingOrg && (
                <div className="profile-btn-group">
                  <button onClick={handleOrgEditToggle} style={styles.btnSecondary}>Cancel</button>
                  <button onClick={handleOrgSave} disabled={savingOrg} style={styles.btnPrimary}>{savingOrg ? 'Saving...' : 'Save'}</button>
                </div>
              )}
            </div>
            <div className="profile-grid-2">
              <div className="span-2-col" style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
                <label style={styles.label}>Website URL</label>
                <input type="url" name="website" value={isEditingOrg ? editedOrg.website : (tenant.website || '')} onChange={handleOrgInputChange} disabled={!isEditingOrg} placeholder="https://www.yourcompany.com" style={{ ...styles.input, ...(!isEditingOrg ? styles.inputDisabled : {}) }} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>LinkedIn</label>
                <input type="url" name="socialMedia.linkedin" value={isEditingOrg ? editedOrg.socialMedia.linkedin : (tenant.socialMedia?.linkedin || '')} onChange={handleOrgInputChange} disabled={!isEditingOrg} placeholder="https://linkedin.com/company/..." style={{ ...styles.input, ...(!isEditingOrg ? styles.inputDisabled : {}) }} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Twitter / X</label>
                <input type="url" name="socialMedia.twitter" value={isEditingOrg ? editedOrg.socialMedia.twitter : (tenant.socialMedia?.twitter || '')} onChange={handleOrgInputChange} disabled={!isEditingOrg} placeholder="https://twitter.com/..." style={{ ...styles.input, ...(!isEditingOrg ? styles.inputDisabled : {}) }} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Facebook</label>
                <input type="url" name="socialMedia.facebook" value={isEditingOrg ? editedOrg.socialMedia.facebook : (tenant.socialMedia?.facebook || '')} onChange={handleOrgInputChange} disabled={!isEditingOrg} placeholder="https://facebook.com/..." style={{ ...styles.input, ...(!isEditingOrg ? styles.inputDisabled : {}) }} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Instagram</label>
                <input type="url" name="socialMedia.instagram" value={isEditingOrg ? editedOrg.socialMedia.instagram : (tenant.socialMedia?.instagram || '')} onChange={handleOrgInputChange} disabled={!isEditingOrg} placeholder="https://instagram.com/..." style={{ ...styles.input, ...(!isEditingOrg ? styles.inputDisabled : {}) }} />
              </div>
            </div>
          </div>
        )}

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '360px' }}>
              <div className="modal-header"><h2>Change Password</h2><button onClick={() => setShowPasswordModal(false)} className="close-btn">&times;</button></div>
              <form onSubmit={handlePasswordChange}>
                <div className="form-group"><label>Current Password *</label><input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} required className="form-control" /></div>
                <div className="form-group"><label>New Password * (min 6 chars)</label><input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} required minLength={6} className="form-control" /></div>
                <div className="form-group"><label>Confirm New Password *</label><input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} required className="form-control" /></div>
                <div className="modal-actions"><button type="button" onClick={() => setShowPasswordModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary" disabled={changingPassword}>{changingPassword ? 'Changing...' : 'Change Password'}</button></div>
              </form>
            </div>
          </div>
        )}

        {/* Change PIN Modal */}
        {showChangePinModal && (
          <div className="modal-overlay" onClick={closePinModals}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '280px', padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{isPinSet ? 'Change PIN' : 'Set PIN'}</h3>
                <button onClick={closePinModals} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}>&times;</button>
              </div>
              <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '16px', marginTop: '0' }}>{isPinSet ? 'Enter current & new 4 digit PIN' : 'Create a 4 digit PIN'}</p>
              {pinError && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '8px 10px', borderRadius: '6px', fontSize: '11px', marginBottom: '12px', textAlign: 'center' }}>{pinError}</div>}
              {isPinSet && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Current PIN</label>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    {currentPin.map((digit, index) => (<input key={`current-${index}`} ref={el => currentPinRefs.current[index] = el} type="password" value={digit} onChange={e => handlePinInputChange(index, e.target.value, currentPin, setCurrentPin, currentPinRefs)} onKeyDown={e => handlePinKeyDown(index, e, currentPinRefs)} style={{ width: '36px', height: '40px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '16px', fontWeight: '700', textAlign: 'center', outline: 'none' }} maxLength={1} inputMode="numeric" autoComplete="new-password" />))}
                  </div>
                </div>
              )}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>New PIN</label>
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                  {newPin.map((digit, index) => (<input key={`new-${index}`} ref={el => newPinRefs.current[index] = el} type="password" value={digit} onChange={e => handlePinInputChange(index, e.target.value, newPin, setNewPin, newPinRefs)} onKeyDown={e => handlePinKeyDown(index, e, newPinRefs)} style={{ width: '36px', height: '40px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '16px', fontWeight: '700', textAlign: 'center', outline: 'none' }} maxLength={1} inputMode="numeric" autoComplete="new-password" />))}
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Confirm PIN</label>
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                  {confirmNewPin.map((digit, index) => (<input key={`confirm-${index}`} ref={el => confirmNewPinRefs.current[index] = el} type="password" value={digit} onChange={e => handlePinInputChange(index, e.target.value, confirmNewPin, setConfirmNewPin, confirmNewPinRefs)} onKeyDown={e => handlePinKeyDown(index, e, confirmNewPinRefs)} style={{ width: '36px', height: '40px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '16px', fontWeight: '700', textAlign: 'center', outline: 'none' }} maxLength={1} inputMode="numeric" autoComplete="new-password" />))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center' }}>
                {isPinSet && <button type="button" onClick={() => { closePinModals(); setShowForgotPinModal(true); }} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '11px', cursor: 'pointer', padding: 0 }}>Forgot PIN?</button>}
                <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                  <button type="button" onClick={closePinModals} style={{ padding: '8px 14px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                  <button type="button" onClick={handleChangePin} disabled={pinLoading} style={{ padding: '8px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>{pinLoading ? 'Saving...' : (isPinSet ? 'Change' : 'Set PIN')}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Forgot PIN Modal */}
        {showForgotPinModal && (
          <div className="modal-overlay" onClick={closePinModals}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '280px', padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Reset PIN</h3>
                <button onClick={closePinModals} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}>&times;</button>
              </div>
              {pinError && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '8px 10px', borderRadius: '6px', fontSize: '11px', marginBottom: '12px', textAlign: 'center' }}>{pinError}</div>}
              {forgotPinStep === 1 ? (
                <>
                  <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '16px', marginTop: 0 }}>We'll send an OTP to your email.</p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={closePinModals} style={{ padding: '8px 14px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                    <button type="button" onClick={handleForgotPinSendOtp} disabled={pinLoading} style={{ padding: '8px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>{pinLoading ? 'Sending...' : 'Send OTP'}</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Enter OTP</label>
                    <input type="text" value={forgotPinOtp} onChange={e => setForgotPinOtp(e.target.value)} maxLength={6} placeholder="6-digit OTP" style={{ width: '100%', padding: '8px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', textAlign: 'center', letterSpacing: '6px', boxSizing: 'border-box' }} autoComplete="off" />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>New PIN</label>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      {resetPin.map((digit, index) => (<input key={`reset-${index}`} ref={el => resetPinRefs.current[index] = el} type="password" value={digit} onChange={e => handlePinInputChange(index, e.target.value, resetPin, setResetPin, resetPinRefs)} onKeyDown={e => handlePinKeyDown(index, e, resetPinRefs)} style={{ width: '36px', height: '40px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '16px', fontWeight: '700', textAlign: 'center', outline: 'none' }} maxLength={1} inputMode="numeric" autoComplete="new-password" />))}
                    </div>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Confirm PIN</label>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      {confirmResetPin.map((digit, index) => (<input key={`confirmReset-${index}`} ref={el => confirmResetPinRefs.current[index] = el} type="password" value={digit} onChange={e => handlePinInputChange(index, e.target.value, confirmResetPin, setConfirmResetPin, confirmResetPinRefs)} onKeyDown={e => handlePinKeyDown(index, e, confirmResetPinRefs)} style={{ width: '36px', height: '40px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '16px', fontWeight: '700', textAlign: 'center', outline: 'none' }} maxLength={1} inputMode="numeric" autoComplete="new-password" />))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setForgotPinStep(1)} style={{ padding: '8px 14px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Back</button>
                    <button type="button" onClick={handleResetPinWithOtp} disabled={pinLoading} style={{ padding: '8px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>{pinLoading ? 'Resetting...' : 'Reset PIN'}</button>
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
