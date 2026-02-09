import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api.config';
import SaasLayout from '../components/layout/SaasLayout';

const SaasAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPanel, setShowPanel] = useState(false);
  const [panelMode, setPanelMode] = useState('add'); // 'add' or 'reset'
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [isPrimary, setIsPrimary] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', saasRole: 'Admin'
  });
  const [addStep, setAddStep] = useState(1);
  const [addOtp, setAddOtp] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    checkIfPrimary();
    fetchAdmins();
  }, []);

  const checkIfPrimary = async () => {
    try {
      const res = await axios.get(`${API_URL}/saas-admins/me`, { headers: getAuthHeader() });
      setIsPrimary(res.data?.data?.user?.isPrimary || false);
    } catch (err) { console.error(err); }
  };

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/saas-admins`, { headers: getAuthHeader() });
      setAdmins(res.data?.data?.admins || []);
    } catch (err) {
      if (err.response?.status === 403) setError('Only Primary Owner can view admin list');
      else setError(err.response?.data?.message || 'Failed to fetch admins');
    } finally { setLoading(false); }
  };

  const openAddPanel = () => {
    setPanelMode('add');
    setAddStep(1);
    setAddOtp('');
    setFormData({ firstName: '', lastName: '', email: '', password: '', saasRole: 'Admin' });
    setShowPanel(true);
  };

  const openResetPanel = (admin) => {
    setPanelMode('reset');
    setSelectedAdmin(admin);
    setNewPassword('');
    setShowPanel(true);
  };

  const closePanel = () => {
    setShowPanel(false);
    setSelectedAdmin(null);
    setAddStep(1);
  };

  // Add Admin - Step 1
  const handleSendOtp = async (e) => {
    e.preventDefault();
    try {
      setAddLoading(true);
      await axios.post(`${API_URL}/saas-admins/initiate`, formData, { headers: getAuthHeader() });
      setAddStep(2);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send OTP');
    } finally { setAddLoading(false); }
  };

  // Add Admin - Step 2
  const handleVerifyAndCreate = async () => {
    if (!addOtp || addOtp.length !== 6) return alert('Enter 6-digit OTP');
    try {
      setAddLoading(true);
      await axios.post(`${API_URL}/saas-admins/verify`, { email: formData.email, otp: addOtp }, { headers: getAuthHeader() });
      closePanel();
      fetchAdmins();
      alert('Admin created!');
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid OTP');
    } finally { setAddLoading(false); }
  };

  const handleResendOtp = async () => {
    try {
      setAddLoading(true);
      await axios.post(`${API_URL}/saas-admins/resend-otp`, { email: formData.email }, { headers: getAuthHeader() });
      alert('OTP resent!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally { setAddLoading(false); }
  };

  // Reset Password
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) return alert('Min 6 characters');
    try {
      setResetLoading(true);
      await axios.post(`${API_URL}/saas-admins/${selectedAdmin._id}/reset-password`, { newPassword }, { headers: getAuthHeader() });
      closePanel();
      alert('Password reset!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally { setResetLoading(false); }
  };

  const handleToggleActive = async (admin) => {
    if (admin.isPrimary) return;
    try {
      await axios.put(`${API_URL}/saas-admins/${admin._id}`, { isActive: !admin.isActive }, { headers: getAuthHeader() });
      fetchAdmins();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (admin) => {
    if (admin.isPrimary || !window.confirm(`Remove ${admin.firstName}?`)) return;
    try {
      await axios.delete(`${API_URL}/saas-admins/${admin._id}`, { headers: getAuthHeader() });
      fetchAdmins();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  if (!isPrimary && !loading) {
    return (
      <SaasLayout title="SAAS Admins">
        <div style={styles.accessDenied}>
          <h3>Access Denied</h3>
          <p>Only Primary Owner can access this page.</p>
        </div>
      </SaasLayout>
    );
  }

  return (
    <SaasLayout title="SAAS Admins">
      <div style={styles.wrapper}>
        {/* Main Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={styles.header}>
            <div>
              <h2 style={styles.title}>SAAS Admins</h2>
              <p style={styles.subtitle}>Manage platform administrators</p>
            </div>
            <button onClick={openAddPanel} style={styles.addBtn}>+ Add Admin</button>
          </div>

          {/* Stats */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <span style={styles.statNum}>{admins.length}</span>
              <span style={styles.statLabel}>Total</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statNum}>{admins.filter(a => a.isPrimary).length}</span>
              <span style={styles.statLabel}>Primary</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statNum}>{admins.filter(a => !a.isPrimary).length}</span>
              <span style={styles.statLabel}>Secondary</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statNum}>{admins.filter(a => a.isActive).length}</span>
              <span style={styles.statLabel}>Active</span>
            </div>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          {/* Table */}
          <div style={styles.tableCard}>
            {loading ? (
              <div style={styles.loading}>Loading...</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Admin</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map(admin => (
                    <tr key={admin._id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.adminCell}>
                          <div style={{...styles.avatar, background: admin.isPrimary ? '#6366f1' : '#10b981'}}>
                            {admin.firstName?.[0]}{admin.lastName?.[0]}
                          </div>
                          <div>
                            <div style={styles.name}>{admin.firstName} {admin.lastName}</div>
                            <div style={styles.role}>{admin.saasRole || 'Admin'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>{admin.email}</td>
                      <td style={styles.td}>
                        <span style={{...styles.badge, background: admin.isPrimary ? '#6366f1' : '#10b981'}}>
                          {admin.isPrimary ? 'Primary' : 'Secondary'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{...styles.badge, background: admin.isActive ? '#22c55e' : '#ef4444'}}>
                          {admin.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {!admin.isPrimary ? (
                          <div style={styles.actions}>
                            <button onClick={() => openResetPanel(admin)} style={styles.actionBtn} title="Reset Password">🔑</button>
                            <button onClick={() => handleToggleActive(admin)} style={styles.actionBtn} title={admin.isActive ? 'Deactivate' : 'Activate'}>
                              {admin.isActive ? '🚫' : '✅'}
                            </button>
                            <button onClick={() => handleDelete(admin)} style={{...styles.actionBtn, color: '#ef4444'}} title="Delete">🗑️</button>
                          </div>
                        ) : (
                          <span style={styles.protected}>Protected</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Side Panel */}
        {showPanel && (
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <h3 style={styles.panelTitle}>
                {panelMode === 'add' ? (addStep === 1 ? 'Add Admin' : 'Verify OTP') : 'Reset Password'}
              </h3>
              <button onClick={closePanel} style={styles.closeBtn}>×</button>
            </div>

            <div style={styles.panelBody}>
              {panelMode === 'add' ? (
                addStep === 1 ? (
                  <form onSubmit={handleSendOtp}>
                    <div style={styles.formGrid}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>First Name</label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={e => setFormData({...formData, firstName: e.target.value})}
                          style={styles.input}
                          required
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Last Name</label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={e => setFormData({...formData, lastName: e.target.value})}
                          style={styles.input}
                          required
                        />
                      </div>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        style={styles.input}
                        required
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Password</label>
                      <input
                        type="text"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        style={styles.input}
                        required
                        minLength={6}
                        placeholder="Min 6 chars"
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Role</label>
                      <input
                        type="text"
                        value={formData.saasRole}
                        onChange={e => setFormData({...formData, saasRole: e.target.value})}
                        style={styles.input}
                        placeholder="e.g., Operations"
                      />
                    </div>
                    <button type="submit" style={styles.submitBtn} disabled={addLoading}>
                      {addLoading ? 'Sending...' : 'Send OTP'}
                    </button>
                  </form>
                ) : (
                  <div>
                    <p style={styles.otpInfo}>OTP sent to <strong>{formData.email}</strong></p>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Enter OTP</label>
                      <input
                        type="text"
                        value={addOtp}
                        onChange={e => setAddOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        style={{...styles.input, fontSize: '20px', textAlign: 'center', letterSpacing: '6px'}}
                        placeholder="000000"
                        maxLength={6}
                      />
                    </div>
                    <div style={styles.resendRow}>
                      <button onClick={handleResendOtp} style={styles.resendBtn} disabled={addLoading}>Resend OTP</button>
                    </div>
                    <div style={styles.btnRow}>
                      <button onClick={() => setAddStep(1)} style={styles.backBtn}>Back</button>
                      <button onClick={handleVerifyAndCreate} style={styles.submitBtn} disabled={addLoading || addOtp.length !== 6}>
                        {addLoading ? 'Creating...' : 'Create Admin'}
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div>
                  <div style={styles.resetInfo}>
                    <div style={styles.resetAvatar}>{selectedAdmin?.firstName?.[0]}{selectedAdmin?.lastName?.[0]}</div>
                    <div>
                      <div style={styles.resetName}>{selectedAdmin?.firstName} {selectedAdmin?.lastName}</div>
                      <div style={styles.resetEmail}>{selectedAdmin?.email}</div>
                    </div>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      style={styles.input}
                      placeholder="Min 6 chars"
                      minLength={6}
                    />
                  </div>
                  <button onClick={handleResetPassword} style={styles.submitBtn} disabled={resetLoading || newPassword.length < 6}>
                    {resetLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SaasLayout>
  );
};

const styles = {
  wrapper: {
    display: 'flex',
    gap: '16px',
    minHeight: 'calc(100vh - 120px)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  title: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0
  },
  subtitle: {
    fontSize: '12px',
    color: '#64748b',
    margin: '2px 0 0 0'
  },
  addBtn: {
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '12px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '16px'
  },
  statCard: {
    background: 'linear-gradient(135deg, rgb(153, 255, 251) 0%, rgb(255, 255, 255) 100%)',
    padding: '14px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  statNum: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b'
  },
  statLabel: {
    fontSize: '11px',
    color: '#64748b',
    textTransform: 'uppercase'
  },
  tableCard: {
    background: '#fff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    fontSize: '10px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0'
  },
  tr: {
    borderBottom: '1px solid #f1f5f9'
  },
  td: {
    padding: '10px 12px',
    fontSize: '12px',
    color: '#1e293b'
  },
  adminCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: '600',
    fontSize: '11px'
  },
  name: {
    fontWeight: '600',
    fontSize: '12px'
  },
  role: {
    fontSize: '10px',
    color: '#94a3b8'
  },
  badge: {
    padding: '3px 8px',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '10px',
    fontWeight: '500'
  },
  actions: {
    display: 'flex',
    gap: '4px'
  },
  actionBtn: {
    background: '#f1f5f9',
    border: 'none',
    width: '28px',
    height: '28px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  protected: {
    fontSize: '10px',
    color: '#94a3b8'
  },
  error: {
    background: '#fef2f2',
    color: '#dc2626',
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '12px',
    fontSize: '12px'
  },
  loading: {
    textAlign: 'center',
    padding: '30px',
    color: '#64748b',
    fontSize: '12px'
  },
  accessDenied: {
    textAlign: 'center',
    padding: '40px',
    background: '#fff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  // Right Panel
  panel: {
    width: '320px',
    background: 'linear-gradient(135deg, rgb(153, 255, 251) 0%, rgb(255, 255, 255) 100%)',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  panelHeader: {
    padding: '12px 14px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.5)'
  },
  panelTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#64748b',
    padding: 0,
    lineHeight: 1
  },
  panelBody: {
    padding: '14px',
    flex: 1,
    overflowY: 'auto'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px'
  },
  formGroup: {
    marginBottom: '12px'
  },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '500',
    color: '#475569',
    marginBottom: '4px'
  },
  input: {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '12px',
    outline: 'none',
    boxSizing: 'border-box',
    background: '#fff'
  },
  submitBtn: {
    width: '100%',
    padding: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: '#fff',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '12px'
  },
  otpInfo: {
    fontSize: '12px',
    color: '#475569',
    marginBottom: '14px',
    textAlign: 'center'
  },
  resendRow: {
    textAlign: 'center',
    marginBottom: '14px'
  },
  resendBtn: {
    background: 'none',
    border: 'none',
    color: '#6366f1',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  btnRow: {
    display: 'flex',
    gap: '8px'
  },
  backBtn: {
    flex: 1,
    padding: '10px',
    border: '1px solid #e2e8f0',
    background: '#fff',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500'
  },
  resetInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    padding: '12px',
    background: 'rgba(255,255,255,0.7)',
    borderRadius: '8px'
  },
  resetAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    background: '#6366f1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: '600',
    fontSize: '14px'
  },
  resetName: {
    fontWeight: '600',
    fontSize: '13px',
    color: '#1e293b'
  },
  resetEmail: {
    fontSize: '11px',
    color: '#64748b'
  }
};

export default SaasAdmins;
