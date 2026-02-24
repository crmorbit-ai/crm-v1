import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { tenantService } from '../services/tenantService';
import { API_URL } from '../config/api.config';
import SaasLayout, { StatCard, Card, Badge, Button, Table, DetailPanel, InfoRow, useWindowSize } from '../components/layout/SaasLayout';

const Tenants = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stats, setStats] = useState({ total: 0, active: 0, trial: 0, suspended: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'all');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [allTenants, setAllTenants] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const { isMobile } = useWindowSize();

  // PIN Verification States
  const [isPinSet, setIsPinSet] = useState(false);
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [showForgotPinModal, setShowForgotPinModal] = useState(false);
  const [pin, setPin] = useState(['', '', '', '']);
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [currentPin, setCurrentPin] = useState(['', '', '', '']);
  const [changeNewPin, setChangeNewPin] = useState(['', '', '', '']);
  const [changeConfirmPin, setChangeConfirmPin] = useState(['', '', '', '']);
  const [forgotOtp, setForgotOtp] = useState('');
  const [resetPin, setResetPin] = useState(['', '', '', '']);
  const [resetConfirmPin, setResetConfirmPin] = useState(['', '', '', '']);
  const [forgotStep, setForgotStep] = useState(1);
  const [pinError, setPinError] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pendingTenant, setPendingTenant] = useState(null);
  const pinRefs = useRef([]);
  const newPinRefs = useRef([]);
  const confirmPinRefs = useRef([]);
  const currentPinRefs = useRef([]);
  const changeNewPinRefs = useRef([]);
  const changeConfirmPinRefs = useRef([]);
  const resetPinRefs = useRef([]);
  const resetConfirmPinRefs = useRef([]);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    checkPinStatus();
    loadTenants();
    loadStats();
  }, []);

  // Sync filter with URL params when navigating from another page
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam && statusParam !== filterStatus) {
      setFilterStatus(statusParam);
    }
  }, [searchParams]);

  const checkPinStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/saas-admins/viewing-pin/status`, { headers: getAuthHeader() });
      setIsPinSet(res.data?.data?.isPinSet || false);
    } catch (err) { console.error(err); }
  };

  // PIN input handlers
  const handlePinChange = (index, value, pinArray, setPinArray, refs) => {
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
      // Load all tenants for client-side filtering
      const data = await tenantService.getTenants({ page: 1, limit: 1000 });
      setAllTenants(data.tenants || data || []);
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
    if (!isPinSet) {
      setShowSetupModal(true);
      return;
    }
    if (!isPinVerified) {
      setPendingTenant(tenant);
      setShowPinModal(true);
      return;
    }
    setSelectedTenant(tenant);
  };

  // Verify PIN
  const handleVerifyPin = async () => {
    const pinValue = pin.join('');
    if (pinValue.length < 4) {
      setPinError('Enter your PIN');
      return;
    }
    try {
      setPinLoading(true);
      setPinError('');
      await axios.post(`${API_URL}/saas-admins/viewing-pin/verify`,
        { pin: pinValue },
        { headers: getAuthHeader() }
      );
      setIsPinVerified(true);
      setShowPinModal(false);
      setSelectedTenant(pendingTenant);
      setPendingTenant(null);
      setPin(['', '', '', '']);
    } catch (err) {
      setPinError(err.response?.data?.message || 'Invalid PIN');
      setPin(['', '', '', '']);
      pinRefs.current[0]?.focus();
    } finally { setPinLoading(false); }
  };

  // Set PIN
  const handleSetPin = async () => {
    const pinValue = newPin.join('');
    const confirmValue = confirmPin.join('');

    if (pinValue.length < 4) {
      setPinError('PIN must be at least 4 digits');
      return;
    }
    if (pinValue !== confirmValue) {
      setPinError('PINs do not match');
      return;
    }
    try {
      setPinLoading(true);
      setPinError('');
      await axios.post(`${API_URL}/saas-admins/viewing-pin/set`,
        { pin: pinValue },
        { headers: getAuthHeader() }
      );
      setIsPinSet(true);
      setShowSetupModal(false);
      setNewPin(['', '', '', '']);
      setConfirmPin(['', '', '', '']);
    } catch (err) {
      setPinError(err.response?.data?.message || 'Failed to set PIN');
    } finally { setPinLoading(false); }
  };

  // Change PIN
  const handleChangePin = async () => {
    const currentValue = currentPin.join('');
    const newValue = changeNewPin.join('');
    const confirmValue = changeConfirmPin.join('');

    if (isPinSet && currentValue.length < 4) {
      setPinError('Enter current PIN');
      return;
    }
    if (newValue.length < 4) {
      setPinError('New PIN must be at least 4 digits');
      return;
    }
    if (newValue !== confirmValue) {
      setPinError('PINs do not match');
      return;
    }
    try {
      setPinLoading(true);
      setPinError('');
      await axios.post(`${API_URL}/saas-admins/viewing-pin/change`,
        { currentPin: currentValue, newPin: newValue },
        { headers: getAuthHeader() }
      );
      alert('PIN changed successfully!');
      closeAllPinModals();
      setIsPinSet(true);
    } catch (err) {
      setPinError(err.response?.data?.message || 'Failed to change PIN');
    } finally { setPinLoading(false); }
  };

  // Forgot PIN - Send OTP
  const handleForgotSendOtp = async () => {
    try {
      setPinLoading(true);
      setPinError('');
      await axios.post(`${API_URL}/saas-admins/viewing-pin/forgot`, {}, { headers: getAuthHeader() });
      setForgotStep(2);
      alert('OTP sent to your email!');
    } catch (err) {
      setPinError(err.response?.data?.message || 'Failed to send OTP');
    } finally { setPinLoading(false); }
  };

  // Reset PIN with OTP
  const handleResetPin = async () => {
    const newValue = resetPin.join('');
    const confirmValue = resetConfirmPin.join('');

    if (!forgotOtp || forgotOtp.length < 6) {
      setPinError('Enter valid OTP');
      return;
    }
    if (newValue.length < 4) {
      setPinError('New PIN must be at least 4 digits');
      return;
    }
    if (newValue !== confirmValue) {
      setPinError('PINs do not match');
      return;
    }
    try {
      setPinLoading(true);
      setPinError('');
      await axios.post(`${API_URL}/saas-admins/viewing-pin/reset`,
        { otp: forgotOtp, newPin: newValue },
        { headers: getAuthHeader() }
      );
      alert('PIN reset successfully!');
      closeAllPinModals();
      setIsPinSet(true);
    } catch (err) {
      setPinError(err.response?.data?.message || 'Failed to reset PIN');
    } finally { setPinLoading(false); }
  };

  // Close all PIN modals
  const closeAllPinModals = () => {
    setShowPinModal(false);
    setShowSetupModal(false);
    setShowChangePinModal(false);
    setShowForgotPinModal(false);
    setPin(['', '', '', '']);
    setNewPin(['', '', '', '']);
    setConfirmPin(['', '', '', '']);
    setCurrentPin(['', '', '', '']);
    setChangeNewPin(['', '', '', '']);
    setChangeConfirmPin(['', '', '', '']);
    setForgotOtp('');
    setResetPin(['', '', '', '']);
    setResetConfirmPin(['', '', '', '']);
    setForgotStep(1);
    setPinError('');
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

  // Get tenant status - check isSuspended first, then subscription.status
  const getTenantStatus = (t) => {
    if (t.isSuspended === true) return 'suspended';
    return t.subscription?.status || 'trial';
  };

  // Filter tenants based on search and status
  const filteredTenants = allTenants.filter(t => {
    const matchesSearch = !searchTerm ||
      t.organizationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.organizationId?.toLowerCase().includes(searchTerm.toLowerCase());

    const status = getTenantStatus(t);
    const matchesStatus = filterStatus === 'all' || status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredTenants.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTenants = filteredTenants.slice(startIndex, startIndex + pageSize);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTerm]);

  const getStatusVariant = (s) => ({ active: 'success', trial: 'warning', suspended: 'danger' }[s] || 'default');
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';

  const getLogoUrl = (logoPath) => {
    if (!logoPath) return null;
    if (logoPath.startsWith('http') || logoPath.startsWith('data:')) return logoPath;
    const base = API_URL.replace(/\/api$/, '');
    return `${base}${logoPath}`;
  };

  // Table columns - only show basic info, sensitive data in right panel after verification
  const columns = [
    {
      header: 'Company',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '13px', overflow: 'hidden', flexShrink: 0 }}>
            {row.logo
              ? <img src={getLogoUrl(row.logo)} alt={row.organizationName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
              : row.organizationName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '13px', color: '#1e293b' }}>{row.organizationName || 'N/A'}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{maskEmail(row.contactEmail)}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      align: 'center',
      render: (row) => {
        const status = getTenantStatus(row);
        return <Badge variant={getStatusVariant(status)}>{status}</Badge>;
      }
    },
    {
      header: 'Created',
      align: 'center',
      render: (row) => <span style={{ fontSize: '11px', color: '#64748b' }}>{formatDate(row.createdAt)}</span>
    },
    {
      header: 'Action',
      align: 'center',
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleTenantClick(row); }}
          style={{
            background: isPinVerified ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : '#e2e8f0',
            color: isPinVerified ? '#fff' : '#64748b',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '10px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {isPinVerified ? '👁 View' : '🔒 Locked'}
        </button>
      )
    }
  ];

  return (
    <SaasLayout title="Tenant Management">
      {/* PIN Status Banner */}
      <div style={styles.credBanner}>
        <div style={styles.credInfo}>
          <span style={{ fontWeight: '600' }}>🔐 Viewing PIN:</span>
          {isPinSet ? (
            <Badge variant="success">Set</Badge>
          ) : (
            <Badge variant="danger">Not Set</Badge>
          )}
          {isPinVerified && <Badge variant="info">Verified</Badge>}
        </div>
        <div style={styles.credActions}>
          {!isPinSet ? (
            <button onClick={() => setShowSetupModal(true)} style={styles.credBtn}>Set PIN</button>
          ) : (
            <>
              <button onClick={() => { setIsPinVerified(false); setShowPinModal(true); setPendingTenant(null); }} style={styles.credBtn}>
                {isPinVerified ? 'Re-verify' : 'Verify PIN'}
              </button>
              <button onClick={() => { setPinError(''); setShowChangePinModal(true); }} style={styles.credBtnOutline}>Change PIN</button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
        <StatCard icon="🏢" value={stats.total} label="Total" onClick={() => setFilterStatus('all')} active={filterStatus === 'all'} />
        <StatCard icon="✅" value={stats.active} label="Active" onClick={() => setFilterStatus('active')} active={filterStatus === 'active'} />
        <StatCard icon="⏳" value={stats.trial} label="Trial" onClick={() => setFilterStatus('trial')} active={filterStatus === 'trial'} />
        <StatCard icon="🚫" value={stats.suspended} label="Suspended" onClick={() => setFilterStatus('suspended')} active={filterStatus === 'suspended'} />
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
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                name="tenant-search-unique"
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
              <>
                <Table
                  columns={columns}
                  data={paginatedTenants}
                  onRowClick={handleTenantClick}
                  selectedId={selectedTenant?._id}
                  emptyMessage="No tenants found"
                />
                {/* Pagination */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  borderTop: '1px solid #e2e8f0',
                  fontSize: '12px',
                  color: '#64748b',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <span>
                    Showing {startIndex + 1}-{Math.min(startIndex + pageSize, filteredTenants.length)} of {filteredTenants.length} tenants
                    {filterStatus !== 'all' && ` (${filterStatus})`}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {filterStatus !== 'all' && (
                      <button
                        onClick={() => setFilterStatus('all')}
                        style={{
                          background: '#fee2e2',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          color: '#dc2626',
                          fontWeight: '500'
                        }}
                      >
                        ✕ Clear Filter
                      </button>
                    )}
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      style={{
                        background: currentPage === 1 ? '#f1f5f9' : '#3b82f6',
                        color: currentPage === 1 ? '#94a3b8' : '#fff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}
                    >
                      ← Prev
                    </button>
                    <span style={{ fontWeight: '600', color: '#1e293b' }}>
                      Page {currentPage} of {totalPages || 1}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      style={{
                        background: currentPage >= totalPages ? '#f1f5f9' : '#3b82f6',
                        color: currentPage >= totalPages ? '#94a3b8' : '#fff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Right - Details (only if verified) */}
        {selectedTenant && isPinVerified && (
          <DetailPanel title="Tenant Details" onClose={() => setSelectedTenant(null)}>
            {/* Header with Logo + Company Name */}
            <div style={styles.detailHeader}>
              <div style={{ ...styles.detailAvatar, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                {selectedTenant.logo
                  ? <img
                      src={getLogoUrl(selectedTenant.logo)}
                      alt="logo"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }}
                    />
                  : null}
                <span style={{ display: selectedTenant.logo ? 'none' : 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 0, left: 0, fontSize: '18px', fontWeight: '700', color: '#fff' }}>
                  {selectedTenant.organizationName?.charAt(0)}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={styles.detailName}>{selectedTenant.organizationName}</div>
                {selectedTenant.legalName && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{selectedTenant.legalName}</div>}
                <Badge variant={getStatusVariant(selectedTenant.subscription?.status)} style={{ marginTop: '4px' }}>
                  {selectedTenant.subscription?.status || 'N/A'}
                </Badge>
              </div>
              {selectedTenant.primaryColor && (
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: selectedTenant.primaryColor, border: '2px solid #e2e8f0', flexShrink: 0 }} title="Brand Color" />
              )}
            </div>

            {/* Org ID */}
            <div style={styles.orgIdBox}>
              <div style={styles.orgIdLabel}>Organization ID</div>
              <div style={styles.orgIdValue}>{selectedTenant.organizationId || 'N/A'}</div>
            </div>

            {/* Subscription */}
            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>Subscription</h4>
              <div style={styles.planBox}>
                <div style={styles.planItem}>
                  <span style={styles.planLabel}>Plan</span>
                  <Badge variant="info">{selectedTenant.subscription?.planName || 'Free'}</Badge>
                </div>
                <div style={styles.planItem}>
                  <span style={styles.planLabel}>Status</span>
                  <Badge variant={getStatusVariant(selectedTenant.subscription?.status)}>
                    {selectedTenant.subscription?.status || 'N/A'}
                  </Badge>
                </div>
              </div>
              <InfoRow label="Users" value={`${selectedTenant.userCount || 0} / ${selectedTenant.subscription?.maxUsers || '∞'}`} />
              <InfoRow label="Expires" value={formatDate(selectedTenant.subscription?.endDate)} />
              <InfoRow label="Billing" value={selectedTenant.subscription?.billingCycle || 'N/A'} />
            </div>

            {/* Branding */}
            {(selectedTenant.logo || selectedTenant.primaryColor) && (
              <div style={styles.section}>
                <h4 style={styles.sectionTitle}>Branding</h4>
                {selectedTenant.logo && (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>Logo</div>
                    <div style={{ width: '100px', height: '60px', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        src={getLogoUrl(selectedTenant.logo)}
                        alt="Company Logo"
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        onError={e => { e.target.parentNode.innerHTML = '<span style="font-size:11px;color:#94a3b8">No logo</span>'; }}
                      />
                    </div>
                  </div>
                )}
                {selectedTenant.primaryColor && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Brand Color</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: selectedTenant.primaryColor, border: '1px solid #e2e8f0' }} />
                      <span style={{ fontSize: '11px', color: '#475569', fontFamily: 'monospace' }}>{selectedTenant.primaryColor}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Business Details */}
            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>Business Details</h4>
              <InfoRow label="Industry" value={selectedTenant.industry || 'N/A'} />
              <InfoRow label="Business Type" value={selectedTenant.businessType || 'N/A'} />
              <InfoRow label="Team Size" value={selectedTenant.numberOfEmployees || 'N/A'} />
              {selectedTenant.foundedYear && <InfoRow label="Founded" value={selectedTenant.foundedYear} />}
              {selectedTenant.taxId && <InfoRow label="Tax ID" value={selectedTenant.taxId} />}
              {selectedTenant.registrationNumber && <InfoRow label="Reg. No." value={selectedTenant.registrationNumber} />}
            </div>

            {/* Contact Info */}
            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>Contact Info</h4>
              <InfoRow label="Email" value={selectedTenant.contactEmail} />
              <InfoRow label="Phone" value={selectedTenant.contactPhone || 'N/A'} />
              {selectedTenant.alternatePhone && <InfoRow label="Alt. Phone" value={selectedTenant.alternatePhone} />}
              <InfoRow label="Admin" value={selectedTenant.adminUser ? `${selectedTenant.adminUser.firstName} ${selectedTenant.adminUser.lastName}` : 'N/A'} />
              {selectedTenant.website && <InfoRow label="Website" value={selectedTenant.website} />}
            </div>

            {/* Location */}
            {(selectedTenant.headquarters?.city || selectedTenant.headquarters?.country) && (
              <div style={styles.section}>
                <h4 style={styles.sectionTitle}>Location</h4>
                {selectedTenant.headquarters?.street && <InfoRow label="Street" value={selectedTenant.headquarters.street} />}
                {selectedTenant.headquarters?.city && <InfoRow label="City" value={selectedTenant.headquarters.city} />}
                {selectedTenant.headquarters?.state && <InfoRow label="State" value={selectedTenant.headquarters.state} />}
                {selectedTenant.headquarters?.country && <InfoRow label="Country" value={selectedTenant.headquarters.country} />}
                {selectedTenant.headquarters?.zipCode && <InfoRow label="ZIP" value={selectedTenant.headquarters.zipCode} />}
              </div>
            )}

            {/* Preferences */}
            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>Preferences</h4>
              <InfoRow label="Timezone" value={selectedTenant.settings?.timezone || 'N/A'} />
              <InfoRow label="Date Format" value={selectedTenant.settings?.dateFormat || 'N/A'} />
              <InfoRow label="Currency" value={selectedTenant.settings?.currency || 'N/A'} />
            </div>

            {/* Other Info */}
            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>Other Info</h4>
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

      {/* Verify PIN Modal */}
      {showPinModal && (
        <div style={styles.modalOverlay} onClick={() => setShowPinModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔒</div>
              <h3 style={styles.modalTitle}>Enter Viewing PIN</h3>
              <p style={styles.modalSubtitle}>Enter your PIN to view tenant details</p>
            </div>
            {pinError && <div style={styles.errorBox}>{pinError}</div>}
            <div style={styles.pinInputs}>
              {pin.map((digit, index) => (
                <input
                  key={index}
                  ref={el => pinRefs.current[index] = el}
                  type="password"
                  value={digit}
                  onChange={e => handlePinChange(index, e.target.value, pin, setPin, pinRefs)}
                  onKeyDown={e => handlePinKeyDown(index, e, pinRefs)}
                  style={styles.pinInput}
                  maxLength={1}
                  inputMode="numeric"
                  autoFocus={index === 0}
                  autoComplete="new-password"
                  name={`pin-digit-${index}`}
                />
              ))}
            </div>
            <div style={styles.modalActions}>
              <button onClick={() => { setShowPinModal(false); setPin(['', '', '', '']); setPinError(''); }} style={styles.cancelBtn}>Cancel</button>
              <button onClick={handleVerifyPin} style={styles.submitBtn} disabled={pinLoading}>
                {pinLoading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Setup PIN Modal */}
      {showSetupModal && (
        <div style={styles.modalOverlay} onClick={() => setShowSetupModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔐</div>
              <h3 style={styles.modalTitle}>Set Your Viewing PIN</h3>
              <p style={styles.modalSubtitle}>Create a 4 digit PIN to securely access tenant data</p>
            </div>
            {pinError && <div style={styles.errorBox}>{pinError}</div>}
            <div style={{ marginBottom: '16px' }}>
              <label style={styles.pinLabel}>Create PIN</label>
              <div style={styles.pinInputs}>
                {newPin.map((digit, index) => (
                  <input
                    key={`new-${index}`}
                    ref={el => newPinRefs.current[index] = el}
                    type="password"
                    value={digit}
                    onChange={e => handlePinChange(index, e.target.value, newPin, setNewPin, newPinRefs)}
                    onKeyDown={e => handlePinKeyDown(index, e, newPinRefs)}
                    style={styles.pinInput}
                    maxLength={1}
                    inputMode="numeric"
                    autoComplete="new-password"
                    name={`new-pin-${index}`}
                  />
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={styles.pinLabel}>Confirm PIN</label>
              <div style={styles.pinInputs}>
                {confirmPin.map((digit, index) => (
                  <input
                    key={`confirm-${index}`}
                    ref={el => confirmPinRefs.current[index] = el}
                    type="password"
                    value={digit}
                    onChange={e => handlePinChange(index, e.target.value, confirmPin, setConfirmPin, confirmPinRefs)}
                    onKeyDown={e => handlePinKeyDown(index, e, confirmPinRefs)}
                    style={styles.pinInput}
                    maxLength={1}
                    inputMode="numeric"
                    autoComplete="new-password"
                    name={`confirm-pin-${index}`}
                  />
                ))}
              </div>
            </div>
            <div style={styles.modalActions}>
              <button onClick={() => { setShowSetupModal(false); setNewPin(['', '', '', '']); setConfirmPin(['', '', '', '']); setPinError(''); }} style={styles.cancelBtn}>Cancel</button>
              <button onClick={handleSetPin} style={styles.submitBtn} disabled={pinLoading}>
                {pinLoading ? 'Setting...' : 'Set PIN'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change PIN Modal */}
      {showChangePinModal && (
        <div style={styles.modalOverlay} onClick={closeAllPinModals}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔐</div>
              <h3 style={styles.modalTitle}>Change Viewing PIN</h3>
              <p style={styles.modalSubtitle}>Enter current PIN and set a new one</p>
            </div>
            {pinError && <div style={styles.errorBox}>{pinError}</div>}

            <div style={{ marginBottom: '16px' }}>
              <label style={styles.pinLabel}>Current PIN</label>
              <div style={styles.pinInputs}>
                {currentPin.map((digit, index) => (
                  <input
                    key={`current-${index}`}
                    ref={el => currentPinRefs.current[index] = el}
                    type="password"
                    value={digit}
                    onChange={e => handlePinChange(index, e.target.value, currentPin, setCurrentPin, currentPinRefs)}
                    onKeyDown={e => handlePinKeyDown(index, e, currentPinRefs)}
                    style={styles.pinInput}
                    maxLength={1}
                    inputMode="numeric"
                    autoComplete="new-password"
                  />
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={styles.pinLabel}>New PIN</label>
              <div style={styles.pinInputs}>
                {changeNewPin.map((digit, index) => (
                  <input
                    key={`changeNew-${index}`}
                    ref={el => changeNewPinRefs.current[index] = el}
                    type="password"
                    value={digit}
                    onChange={e => handlePinChange(index, e.target.value, changeNewPin, setChangeNewPin, changeNewPinRefs)}
                    onKeyDown={e => handlePinKeyDown(index, e, changeNewPinRefs)}
                    style={styles.pinInput}
                    maxLength={1}
                    inputMode="numeric"
                    autoComplete="new-password"
                  />
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={styles.pinLabel}>Confirm New PIN</label>
              <div style={styles.pinInputs}>
                {changeConfirmPin.map((digit, index) => (
                  <input
                    key={`changeConfirm-${index}`}
                    ref={el => changeConfirmPinRefs.current[index] = el}
                    type="password"
                    value={digit}
                    onChange={e => handlePinChange(index, e.target.value, changeConfirmPin, setChangeConfirmPin, changeConfirmPinRefs)}
                    onKeyDown={e => handlePinKeyDown(index, e, changeConfirmPinRefs)}
                    style={styles.pinInput}
                    maxLength={1}
                    inputMode="numeric"
                    autoComplete="new-password"
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => { closeAllPinModals(); setShowForgotPinModal(true); }} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '11px', cursor: 'pointer' }}>
                Forgot PIN?
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={closeAllPinModals} style={styles.cancelBtn}>Cancel</button>
                <button onClick={handleChangePin} style={styles.submitBtn} disabled={pinLoading}>
                  {pinLoading ? 'Changing...' : 'Change PIN'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forgot PIN Modal */}
      {showForgotPinModal && (
        <div style={styles.modalOverlay} onClick={closeAllPinModals}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔓</div>
              <h3 style={styles.modalTitle}>Reset Viewing PIN</h3>
              <p style={styles.modalSubtitle}>
                {forgotStep === 1 ? "We'll send an OTP to your email" : "Enter OTP and set new PIN"}
              </p>
            </div>
            {pinError && <div style={styles.errorBox}>{pinError}</div>}

            {forgotStep === 1 ? (
              <div style={styles.modalActions}>
                <button onClick={closeAllPinModals} style={styles.cancelBtn}>Cancel</button>
                <button onClick={handleForgotSendOtp} style={styles.submitBtn} disabled={pinLoading}>
                  {pinLoading ? 'Sending...' : 'Send OTP'}
                </button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={styles.pinLabel}>Enter OTP</label>
                  <input
                    type="text"
                    value={forgotOtp}
                    onChange={e => setForgotOtp(e.target.value)}
                    maxLength={6}
                    placeholder="6-digit OTP"
                    style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', textAlign: 'center', letterSpacing: '8px', boxSizing: 'border-box' }}
                    autoComplete="off"
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={styles.pinLabel}>New PIN</label>
                  <div style={styles.pinInputs}>
                    {resetPin.map((digit, index) => (
                      <input
                        key={`reset-${index}`}
                        ref={el => resetPinRefs.current[index] = el}
                        type="password"
                        value={digit}
                        onChange={e => handlePinChange(index, e.target.value, resetPin, setResetPin, resetPinRefs)}
                        onKeyDown={e => handlePinKeyDown(index, e, resetPinRefs)}
                        style={styles.pinInput}
                        maxLength={1}
                        inputMode="numeric"
                        autoComplete="new-password"
                      />
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={styles.pinLabel}>Confirm New PIN</label>
                  <div style={styles.pinInputs}>
                    {resetConfirmPin.map((digit, index) => (
                      <input
                        key={`resetConfirm-${index}`}
                        ref={el => resetConfirmPinRefs.current[index] = el}
                        type="password"
                        value={digit}
                        onChange={e => handlePinChange(index, e.target.value, resetConfirmPin, setResetConfirmPin, resetConfirmPinRefs)}
                        onKeyDown={e => handlePinKeyDown(index, e, resetConfirmPinRefs)}
                        style={styles.pinInput}
                        maxLength={1}
                        inputMode="numeric"
                        autoComplete="new-password"
                      />
                    ))}
                  </div>
                </div>

                <div style={styles.modalActions}>
                  <button onClick={() => setForgotStep(1)} style={styles.cancelBtn}>Back</button>
                  <button onClick={handleResetPin} style={styles.submitBtn} disabled={pinLoading}>
                    {pinLoading ? 'Resetting...' : 'Reset PIN'}
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
  orgIdBox: {
    background: '#fef3c7',
    border: '1px solid #fbbf24',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '16px',
    textAlign: 'center'
  },
  orgIdLabel: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#92400e',
    textTransform: 'uppercase',
    marginBottom: '4px'
  },
  orgIdValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#78350f',
    fontFamily: 'monospace',
    letterSpacing: '1px'
  },
  planBox: {
    display: 'flex',
    gap: '12px',
    marginBottom: '10px'
  },
  planItem: {
    flex: 1,
    background: '#f8fafc',
    borderRadius: '6px',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px'
  },
  planLabel: {
    fontSize: '10px',
    fontWeight: '500',
    color: '#64748b',
    textTransform: 'uppercase'
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
  },
  pinInputs: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    marginBottom: '16px'
  },
  pinInput: {
    width: '42px',
    height: '48px',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '20px',
    fontWeight: '700',
    textAlign: 'center',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  pinLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748b',
    marginBottom: '8px',
    textTransform: 'uppercase',
    textAlign: 'center'
  },
  errorBox: {
    background: '#fef2f2',
    color: '#dc2626',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '12px',
    marginBottom: '16px',
    textAlign: 'center'
  }
};

export default Tenants;
