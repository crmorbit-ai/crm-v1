import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { tenantService } from '../services/tenantService';
import { API_URL } from '../config/api.config';
import SaasLayout, { StatCard, Card, Badge, Button, Table, DetailPanel, InfoRow, useWindowSize } from '../components/layout/SaasLayout';

const Tenants = () => {
  const [tenants, setTenants] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, trial: 0, suspended: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const { isMobile } = useWindowSize();

  // Credential states
  const [isCredentialSet, setIsCredentialSet] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [credentialId, setCredentialId] = useState('');
  const [credentialPassword, setCredentialPassword] = useState('');
  const [newCredentialId, setNewCredentialId] = useState('');
  const [newCredentialPassword, setNewCredentialPassword] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotStep, setForgotStep] = useState(1);
  const [credLoading, setCredLoading] = useState(false);
  const [pendingTenant, setPendingTenant] = useState(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    checkCredentialStatus();
    loadTenants();
    loadStats();
  }, [pagination.page]);

  const checkCredentialStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/saas-admins/me`, { headers: getAuthHeader() });
      setIsCredentialSet(res.data?.data?.user?.isViewingCredentialSet || false);
    } catch (err) { console.error(err); }
  };

  const loadStats = async () => {
    try {
      const data = await tenantService.getTenantStats();
      setStats({
        total: data.totalTenants || 0,
        active: data.activeTenants || 0,
        trial: data.trialTenants || 0,
        suspended: data.suspendedTenants || 0
      });
    } catch (err) { console.error(err); }
  };

  const loadTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tenantService.getTenants({ page: pagination.page, limit: pagination.limit });
      setTenants(data.tenants || data || []);
      if (data.pagination) {
        setPagination(prev => ({ ...prev, ...data.pagination, pages: data.pagination.pages || Math.ceil((data.pagination.total || 0) / prev.limit) }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tenants');
    } finally { setLoading(false); }
  };

  // Mask email: a***@gmail.com
  const maskEmail = (email) => {
    if (!email) return '***';
    const [name, domain] = email.split('@');
    if (!name || !domain) return '***';
    return name[0] + '***@' + domain;
  };

  // Handle tenant row click
  const handleTenantClick = (tenant) => {
    if (!isCredentialSet) {
      alert('Please set your viewing credentials first.');
      setShowSetupModal(true);
      return;
    }
    if (!isVerified) {
      setPendingTenant(tenant);
      setShowCredentialModal(true);
      return;
    }
    setSelectedTenant(tenant);
  };

  // Verify viewing credentials
  const handleVerifyCredentials = async () => {
    try {
      setCredLoading(true);
      await axios.post(`${API_URL}/saas-admins/verify-viewing-credentials`,
        { credentialId, credentialPassword },
        { headers: getAuthHeader() }
      );
      setIsVerified(true);
      setShowCredentialModal(false);
      setSelectedTenant(pendingTenant);
      setPendingTenant(null);
      setCredentialId('');
      setCredentialPassword('');
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid credentials');
    } finally { setCredLoading(false); }
  };

  // Set viewing credentials
  const handleSetCredentials = async () => {
    if (newCredentialId.length < 4) return alert('ID must be at least 4 characters');
    if (newCredentialPassword.length < 6) return alert('Password must be at least 6 characters');
    try {
      setCredLoading(true);
      await axios.post(`${API_URL}/saas-admins/set-viewing-credentials`,
        { credentialId: newCredentialId, credentialPassword: newCredentialPassword },
        { headers: getAuthHeader() }
      );
      setIsCredentialSet(true);
      setShowSetupModal(false);
      setNewCredentialId('');
      setNewCredentialPassword('');
      alert('Viewing credentials set successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to set credentials');
    } finally { setCredLoading(false); }
  };

  // Forgot credentials - send OTP
  const handleForgotSendOtp = async () => {
    try {
      setCredLoading(true);
      await axios.post(`${API_URL}/saas-admins/forgot-viewing-credentials`, {}, { headers: getAuthHeader() });
      setForgotStep(2);
      alert('OTP sent to your email!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send OTP');
    } finally { setCredLoading(false); }
  };

  // Reset credentials with OTP
  const handleResetCredentials = async () => {
    if (newCredentialId.length < 4 || newCredentialPassword.length < 6) {
      return alert('ID min 4 chars, Password min 6 chars');
    }
    try {
      setCredLoading(true);
      await axios.post(`${API_URL}/saas-admins/reset-viewing-credentials`,
        { otp: forgotOtp, newCredentialId, newCredentialPassword },
        { headers: getAuthHeader() }
      );
      setIsCredentialSet(true);
      setShowForgotModal(false);
      setForgotStep(1);
      setForgotOtp('');
      setNewCredentialId('');
      setNewCredentialPassword('');
      alert('Credentials reset successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset credentials');
    } finally { setCredLoading(false); }
  };

  const handleSuspend = async (id) => {
    if (!window.confirm('Suspend this tenant?')) return;
    try {
      await tenantService.suspendTenant(id, 'Suspended by admin');
      setSelectedTenant(null);
      loadTenants();
      loadStats();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleActivate = async (id) => {
    if (!window.confirm('Activate this tenant?')) return;
    try {
      await tenantService.activateTenant(id);
      setSelectedTenant(null);
      loadTenants();
      loadStats();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = t.organizationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.organizationId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || t.subscription?.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusVariant = (s) => ({ active: 'success', trial: 'warning', suspended: 'danger' }[s] || 'default');
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';

  const columns = [
    {
      header: 'Org ID',
      render: (row) => (
        <span style={{ background: '#fef3c7', color: '#92400e', padding: '3px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', fontFamily: 'monospace' }}>
          {row.organizationId || 'N/A'}
        </span>
      )
    },
    {
      header: 'Company',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '11px' }}>
            {row.organizationName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '12px' }}>{row.organizationName || 'N/A'}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>{maskEmail(row.contactEmail)}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Plan',
      align: 'center',
      render: (row) => <Badge variant="info">{row.subscription?.planName || 'Free'}</Badge>
    },
    {
      header: 'Status',
      align: 'center',
      render: (row) => <Badge variant={getStatusVariant(row.subscription?.status)}>{row.subscription?.status || 'N/A'}</Badge>
    }
  ];

  return (
    <SaasLayout title="Tenant Management">
      {/* Credential Status Banner */}
      <div style={styles.credBanner}>
        <div style={styles.credInfo}>
          <span style={{ fontWeight: '600' }}>Viewing Credentials:</span>
          {isCredentialSet ? (
            <Badge variant="success">Set</Badge>
          ) : (
            <Badge variant="danger">Not Set</Badge>
          )}
          {isVerified && <Badge variant="info">Verified</Badge>}
        </div>
        <div style={styles.credActions}>
          {!isCredentialSet ? (
            <button onClick={() => setShowSetupModal(true)} style={styles.credBtn}>Set Credentials</button>
          ) : (
            <>
              <button onClick={() => { setIsVerified(false); setShowCredentialModal(true); setPendingTenant(null); }} style={styles.credBtn}>
                {isVerified ? 'Re-verify' : 'Verify'}
              </button>
              <button onClick={() => { setShowForgotModal(true); setForgotStep(1); }} style={styles.credBtnOutline}>Forgot?</button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
        <StatCard icon="🏢" value={stats.total} label="Total" />
        <StatCard icon="✅" value={stats.active} label="Active" />
        <StatCard icon="⏳" value={stats.trial} label="Trial" />
        <StatCard icon="🚫" value={stats.suspended} label="Suspended" />
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', gap: '16px', minHeight: '500px' }}>
        {/* Left - List */}
        <div style={{ flex: selectedTenant ? '0 0 55%' : '1' }}>
          <Card>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={styles.selectInput}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Loading...</div>
            ) : (
              <Table
                columns={columns}
                data={filteredTenants}
                onRowClick={handleTenantClick}
                selectedId={selectedTenant?._id}
                emptyMessage="No tenants found"
              />
            )}
          </Card>
        </div>

        {/* Right - Details (only if verified) */}
        {selectedTenant && isVerified && (
          <DetailPanel title="Tenant Details" onClose={() => setSelectedTenant(null)}>
            <div style={styles.detailHeader}>
              <div style={styles.detailAvatar}>{selectedTenant.organizationName?.charAt(0)}</div>
              <div>
                <div style={styles.detailName}>{selectedTenant.organizationName}</div>
                <div style={styles.detailId}>#{selectedTenant.organizationId}</div>
              </div>
            </div>

            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>Contact Info</h4>
              <InfoRow label="Email" value={selectedTenant.contactEmail} />
              <InfoRow label="Phone" value={selectedTenant.contactPhone || 'N/A'} />
              <InfoRow label="Admin" value={selectedTenant.adminUser ? `${selectedTenant.adminUser.firstName} ${selectedTenant.adminUser.lastName}` : 'N/A'} />
            </div>

            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>Subscription</h4>
              <InfoRow label="Plan" value={selectedTenant.subscription?.planName || 'Free'} />
              <InfoRow label="Status" value={selectedTenant.subscription?.status || 'N/A'} />
              <InfoRow label="Users" value={`${selectedTenant.userCount || 0} / ${selectedTenant.subscription?.maxUsers || '∞'}`} />
              <InfoRow label="Expires" value={formatDate(selectedTenant.subscription?.endDate)} />
            </div>

            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>Info</h4>
              <InfoRow label="Created" value={formatDate(selectedTenant.createdAt)} />
              <InfoRow label="Slug" value={selectedTenant.slug || 'N/A'} />
            </div>

            <div style={styles.actionBtns}>
              {selectedTenant.subscription?.status === 'suspended' ? (
                <Button variant="success" onClick={() => handleActivate(selectedTenant._id)}>Activate</Button>
              ) : (
                <Button variant="danger" onClick={() => handleSuspend(selectedTenant._id)}>Suspend</Button>
              )}
            </div>
          </DetailPanel>
        )}
      </div>

      {/* Verify Credentials Modal */}
      {showCredentialModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCredentialModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Enter Viewing Credentials</h3>
            <p style={styles.modalSubtitle}>Verify your credentials to view tenant details</p>
            <div style={styles.formGroup}>
              <label style={styles.label}>Credential ID</label>
              <input type="text" value={credentialId} onChange={e => setCredentialId(e.target.value)} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <input type="password" value={credentialPassword} onChange={e => setCredentialPassword(e.target.value)} style={styles.input} />
            </div>
            <div style={styles.modalActions}>
              <button onClick={() => setShowCredentialModal(false)} style={styles.cancelBtn}>Cancel</button>
              <button onClick={handleVerifyCredentials} style={styles.submitBtn} disabled={credLoading}>
                {credLoading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Setup Credentials Modal */}
      {showSetupModal && (
        <div style={styles.modalOverlay} onClick={() => setShowSetupModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Set Viewing Credentials</h3>
            <p style={styles.modalSubtitle}>Create credentials to access sensitive tenant data</p>
            <div style={styles.formGroup}>
              <label style={styles.label}>Create Credential ID (min 4 chars)</label>
              <input type="text" value={newCredentialId} onChange={e => setNewCredentialId(e.target.value)} style={styles.input} placeholder="e.g., admin123" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Create Password (min 6 chars)</label>
              <input type="password" value={newCredentialPassword} onChange={e => setNewCredentialPassword(e.target.value)} style={styles.input} />
            </div>
            <div style={styles.modalActions}>
              <button onClick={() => setShowSetupModal(false)} style={styles.cancelBtn}>Cancel</button>
              <button onClick={handleSetCredentials} style={styles.submitBtn} disabled={credLoading}>
                {credLoading ? 'Setting...' : 'Set Credentials'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Credentials Modal */}
      {showForgotModal && (
        <div style={styles.modalOverlay} onClick={() => setShowForgotModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Reset Viewing Credentials</h3>
            {forgotStep === 1 ? (
              <>
                <p style={styles.modalSubtitle}>We'll send an OTP to your email to verify identity</p>
                <div style={styles.modalActions}>
                  <button onClick={() => setShowForgotModal(false)} style={styles.cancelBtn}>Cancel</button>
                  <button onClick={handleForgotSendOtp} style={styles.submitBtn} disabled={credLoading}>
                    {credLoading ? 'Sending...' : 'Send OTP'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={styles.formGroup}>
                  <label style={styles.label}>OTP (from email)</label>
                  <input type="text" value={forgotOtp} onChange={e => setForgotOtp(e.target.value)} style={styles.input} maxLength={6} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>New Credential ID</label>
                  <input type="text" value={newCredentialId} onChange={e => setNewCredentialId(e.target.value)} style={styles.input} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>New Password</label>
                  <input type="password" value={newCredentialPassword} onChange={e => setNewCredentialPassword(e.target.value)} style={styles.input} />
                </div>
                <div style={styles.modalActions}>
                  <button onClick={() => setForgotStep(1)} style={styles.cancelBtn}>Back</button>
                  <button onClick={handleResetCredentials} style={styles.submitBtn} disabled={credLoading}>
                    {credLoading ? 'Resetting...' : 'Reset'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </SaasLayout>
  );
};

const styles = {
  credBanner: {
    background: 'linear-gradient(135deg, rgb(153, 255, 251) 0%, rgb(255, 255, 255) 100%)',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
    border: '1px solid #e2e8f0'
  },
  credInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '12px'
  },
  credActions: {
    display: 'flex',
    gap: '8px'
  },
  credBtn: {
    background: '#6366f1',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  credBtnOutline: {
    background: 'transparent',
    color: '#6366f1',
    border: '1px solid #6366f1',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  searchInput: {
    flex: 1,
    minWidth: '150px',
    padding: '8px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '12px',
    outline: 'none'
  },
  selectInput: {
    padding: '8px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '12px',
    outline: 'none',
    background: '#fff'
  },
  detailHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    padding: '12px',
    background: 'linear-gradient(135deg, rgb(153, 255, 251) 0%, rgb(255, 255, 255) 100%)',
    borderRadius: '8px'
  },
  detailAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    background: '#6366f1',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '700'
  },
  detailName: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1e293b'
  },
  detailId: {
    fontSize: '11px',
    color: '#64748b'
  },
  section: {
    marginBottom: '16px'
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: '8px',
    paddingBottom: '4px',
    borderBottom: '1px solid #e2e8f0'
  },
  actionBtns: {
    marginTop: '20px',
    display: 'flex',
    gap: '8px'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    width: '100%',
    maxWidth: '380px'
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '4px'
  },
  modalSubtitle: {
    fontSize: '12px',
    color: '#64748b',
    marginBottom: '20px'
  },
  formGroup: {
    marginBottom: '14px'
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
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '20px'
  },
  cancelBtn: {
    padding: '10px 16px',
    border: '1px solid #e2e8f0',
    background: '#fff',
    borderRadius: '8px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  submitBtn: {
    padding: '10px 16px',
    border: 'none',
    background: '#6366f1',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer'
  }
};

export default Tenants;
