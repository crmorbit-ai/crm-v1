import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { tenantService } from '../services/tenantService';
import { API_URL } from '../config/api.config';
import { useAuth } from '../context/AuthContext';
import SaasLayout, { StatCard, Card, Badge, Button, Table, DetailPanel, InfoRow, useWindowSize } from '../components/layout/SaasLayout';

const Tenants = () => {
  const { user } = useAuth();
  const isManager = user?.saasRole === 'Manager';
  const [searchParams, setSearchParams] = useSearchParams();
  const [stats, setStats] = useState({ total: 0, active: 0, trial: 0, suspended: 0, deletionRequested: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'all');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [allTenants, setAllTenants] = useState([]);
  const [managers, setManagers] = useState([]);
  const [assigningManager, setAssigningManager] = useState(false);
  const [checkedTenants, setCheckedTenants] = useState(new Set());
  const [bulkManagerId, setBulkManagerId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const { isMobile, isTablet } = useWindowSize();

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
    loadManagers();
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
    if (isManager) return; // Managers get stats from their filtered tenant list
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

  const loadManagers = async () => {
    try {
      const res = await axios.get(`${API_URL}/saas-admins/managers`, { headers: getAuthHeader() });
      setManagers(res.data?.data?.managers || []);
    } catch (err) { console.error('Load managers failed:', err); }
  };

  const handleAssignManager = async (tenantId, managerId) => {
    try {
      setAssigningManager(true);
      await axios.post(`${API_URL}/tenants/${tenantId}/assign-manager`, { managerId: managerId || null }, { headers: getAuthHeader() });
      await loadTenants();
      setSelectedTenant(prev => prev ? {
        ...prev,
        assignedManager: managerId ? managers.find(m => m._id === managerId) : null
      } : null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign manager');
    } finally {
      setAssigningManager(false);
    }
  };

  const handleBulkAssign = async () => {
    if (!bulkManagerId || checkedTenants.size === 0) return;
    try {
      setAssigningManager(true);
      await axios.post(`${API_URL}/tenants/bulk-assign-manager`, {
        managerId: bulkManagerId,
        tenantIds: [...checkedTenants]
      }, { headers: getAuthHeader() });
      setCheckedTenants(new Set());
      setBulkManagerId('');
      await loadTenants();
      alert(`✅ ${checkedTenants.size} tenant(s) assigned`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign');
    } finally {
      setAssigningManager(false);
    }
  };

  const toggleCheck = (e, id) => {
    e.stopPropagation();
    setCheckedTenants(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllVisible = (e) => {
    e.stopPropagation();
    const visibleIds = paginatedTenants.map(t => t._id);
    const allChecked = visibleIds.every(id => checkedTenants.has(id));
    setCheckedTenants(prev => {
      const next = new Set(prev);
      if (allChecked) visibleIds.forEach(id => next.delete(id));
      else visibleIds.forEach(id => next.add(id));
      return next;
    });
  };

  const loadTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      // Load all tenants (managers see only assigned tenants)
      const params = { page: 1, limit: 1000 };
      if (isManager) params.assignedManager = 'me';
      const data = await tenantService.getTenants(params);
      const tenantList = data.tenants || data || [];
      setAllTenants(tenantList);
      // Count deletion requests from loaded data
      const deletionCount = tenantList.filter(t => t.deletionRequest?.status === 'pending').length;
      // For managers: compute stats from their filtered list
      if (isManager) {
        setStats({
          total: tenantList.length,
          active: tenantList.filter(t => t.subscription?.status === 'active').length,
          trial: tenantList.filter(t => t.subscription?.status === 'trial').length,
          suspended: tenantList.filter(t => t.isSuspended).length,
          deletionRequested: deletionCount
        });
      } else {
        setStats(prev => ({ ...prev, deletionRequested: deletionCount }));
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

  // Deletion request handlers
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [deletionActionLoading, setDeletionActionLoading] = useState(false);

  const handleApproveDeletion = async (id) => {
    if (!window.confirm('Are you sure you want to APPROVE this deletion request? The tenant will lose access immediately and their data will be deleted after 45 days.')) return;
    try {
      setDeletionActionLoading(true);
      await tenantService.approveDeletion(id);
      setSelectedTenant(null);
      loadTenants();
      loadStats();
      alert('Deletion request approved. Tenant has been notified via email.');
    } catch (err) { alert(err.response?.data?.message || 'Failed to approve deletion'); }
    finally { setDeletionActionLoading(false); }
  };

  const handleRejectDeletion = async (id) => {
    try {
      setDeletionActionLoading(true);
      await tenantService.rejectDeletion(id, rejectReason);
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedTenant(null);
      loadTenants();
      alert('Deletion request rejected. Tenant has been notified via email.');
    } catch (err) { alert(err.response?.data?.message || 'Failed to reject deletion'); }
    finally { setDeletionActionLoading(false); }
  };

  const handleRecoverTenant = async (id) => {
    if (!window.confirm('Recover this tenant account? They will regain full access immediately.')) return;
    try {
      setDeletionActionLoading(true);
      await tenantService.recoverTenant(id);
      setSelectedTenant(null);
      loadTenants();
      alert('Account recovered successfully. Tenant has been notified via email.');
    } catch (err) { alert(err.response?.data?.message || 'Failed to recover tenant'); }
    finally { setDeletionActionLoading(false); }
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
    const matchesStatus = filterStatus === 'all'
      || status === filterStatus
      || (filterStatus === 'deletion_requested' && t.deletionRequest?.status === 'pending');

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
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <style>{`
  /* ── RESPONSIVE ────────────────── */
  @media(max-width:768px){
    .tenants-grid4,.tenants-grid3{grid-template-columns:repeat(2,1fr)!important;}
    .tenants-grid2{grid-template-columns:1fr!important;}
    .tenants-split{flex-direction:column!important;}
    .tenants-sidebar{width:100%!important;min-width:unset!important;max-width:unset!important;}
    .tenants-panel{width:100%!important;}
    .tenants-table{overflow-x:auto;-webkit-overflow-scrolling:touch;}
    .tenants-form-row{grid-template-columns:1fr!important;}
    .tenants-hide{display:none!important;}
  }
  @media(max-width:480px){
    .tenants-grid4,.tenants-grid3,.tenants-grid2{grid-template-columns:1fr!important;}
  }
`}</style>
            <Badge variant={getStatusVariant(status)}>{status}</Badge>
            {row.deletionRequest?.status === 'pending' && (
              <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fecaca' }}>🗑 DEL REQ</span>
            )}
            {row.deletionRequest?.status === 'approved' && (
              <span style={{ background: '#fef2f2', color: '#991b1b', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fecaca' }}>⏳ DELETING</span>
            )}
          </div>
        );
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
      <style>{`
        .xTh { position:sticky; top:0; z-index:2; background:#1e293b; border:1px solid #334155; padding:7px 10px; font-size:10px; font-weight:700; color:#94a3b8; text-align:left; white-space:nowrap; user-select:none; letter-spacing:.5px; text-transform:uppercase; }
        .xTd { border:1px solid #e2e6eb; padding:0 10px; font-size:12px; color:#1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; height:38px; vertical-align:middle; }
        .xRow { cursor:pointer; }
        .xRow:hover .xTd { background:#eff6ff !important; }
        .xRow.xSel .xTd { background:#e0e7ff !important; border-color:#c7d2fe !important; }
        .xNum { position:sticky; left:0; z-index:1; background:#f8fafc !important; border:1px solid #d1d5db !important; padding:0 8px; font-size:10px; color:#94a3b8; text-align:center; width:32px; min-width:32px; font-weight:600; }
        .xRow.xSel .xNum { background:#e0e7ff !important; }
        .xPin { position:sticky; right:0; z-index:1; background:#fff !important; border-left:2px solid #e2e8f0 !important; }
        .xRow.xSel .xPin { background:#e0e7ff !important; }
        .dRow { display:grid; grid-template-columns:110px 1fr; align-items:center; border-bottom:1px solid #f1f5f9; min-height:30px; }
        .dRow:last-child { border-bottom:none; }
        .dLbl { font-size:10px; font-weight:600; color:#64748b; padding:5px 10px; text-transform:uppercase; letter-spacing:.3px; }
        .dVal { font-size:12px; font-weight:500; color:#1e293b; padding:5px 10px; border-left:1px solid #f1f5f9; word-break:break-all; }
        .dRow:nth-child(even) { background:#f8fafc; }
        .dRow:nth-child(odd) { background:#fff; }
        .sStat { cursor:pointer; border-radius:8px; padding:10px 14px; transition:transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease; }
        .sStat:hover { transform:translateY(-3px) scale(1.03); filter:brightness(1.15); box-shadow:0 8px 24px rgba(0,0,0,0.28) !important; }
        .sStat:active { transform:translateY(0) scale(0.98); }
        @media (max-width:768px) {
          .xHideM { display:none !important; }
          .xFullM { width:100% !important; }
          .tSplitWrap { flex-direction:column !important; }
          .tDetailPanel { flex:1 1 100% !important; order:0 !important; max-height:none !important; width:100% !important; }
          .tTableSide { flex:1 1 100% !important; }
          .tAssignGrid { grid-template-columns:1fr !important; }
          .tKpiRow { grid-template-columns:1fr 1fr !important; }
        }
      `}</style>

      {/* TOP BAR: hero + PIN */}
      <div style={{background:'linear-gradient(135deg,#0f0c29 0%,#1e1b4b 40%,#0d1b4b 100%)',borderRadius:12,marginBottom:10,padding:'11px 18px',display:'flex',alignItems:isMobile?'flex-start':'center',justifyContent:'space-between',gap:10,flexWrap:'wrap',flexDirection:isMobile?'column':'row'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:34,height:34,borderRadius:8,background:'rgba(99,102,241,0.3)',border:'1px solid rgba(99,102,241,0.5)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>🏢</div>
          <div>
            <div style={{fontSize:15,fontWeight:800,color:'#fff',letterSpacing:'-0.3px'}}>Tenant Management</div>
            <div style={{fontSize:10,color:'#8b9ccc',marginTop:1}}>{allTenants.length} organizations · Manage subscriptions &amp; access</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:7,flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:5,background:'rgba(255,255,255,0.07)',borderRadius:7,padding:'5px 9px',border:'1px solid rgba(255,255,255,0.1)',fontSize:11}}>
            <span>🔐</span>
            <span style={{color:'#94a3b8',fontWeight:500}}>PIN:</span>
            {isPinSet?<span style={{background:'#14532d',color:'#86efac',fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:3}}>SET</span>:<span style={{background:'#7f1d1d',color:'#fca5a5',fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:3}}>NOT SET</span>}
            {isPinVerified&&<span style={{background:'#1e3a5f',color:'#60a5fa',fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:3}}>VERIFIED</span>}
          </div>
          {!isPinSet
            ?<button onClick={()=>setShowSetupModal(true)} style={{background:'linear-gradient(135deg,#6366f1,#4f46e5)',color:'#fff',border:'none',padding:'6px 13px',borderRadius:6,fontSize:11,fontWeight:700,cursor:'pointer'}}>Set PIN</button>
            :<>
              <button onClick={()=>{setIsPinVerified(false);setShowPinModal(true);setPendingTenant(null);}} style={{background:'linear-gradient(135deg,#6366f1,#4f46e5)',color:'#fff',border:'none',padding:'6px 13px',borderRadius:6,fontSize:11,fontWeight:700,cursor:'pointer'}}>{isPinVerified?'Re-verify':'Verify PIN'}</button>
              <button onClick={()=>{setPinError('');setShowChangePinModal(true);}} style={{background:'transparent',color:'#a5b4fc',border:'1px solid rgba(99,102,241,0.4)',padding:'6px 13px',borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer'}}>Change PIN</button>
            </>
          }
        </div>
      </div>

      {/* Manager banner */}
      {isManager && (
        <div style={{background:'linear-gradient(135deg,#4c1d95,#6d28d9)',borderRadius:8,padding:'8px 14px',marginBottom:10,display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:14}}>👤</span>
          <span style={{fontSize:12,fontWeight:700,color:'#fff'}}>Manager View</span>
          <span style={{fontSize:11,color:'rgba(255,255,255,0.65)'}}>— You are viewing only your assigned organizations ({allTenants.length})</span>
        </div>
      )}

      {/* STATS */}
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':isTablet?'repeat(3,1fr)':'repeat(5,1fr)',gap:isMobile?6:8,marginBottom:10}}>
        {[
          {k:'total',label:'Total Tenants',val:stats.total,            grad:'linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#06b6d4 100%)', hov:'linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#0891b2 100%)', f:()=>setFilterStatus('all'),               act:filterStatus==='all'},
          {k:'act',  label:'Active',       val:stats.active,           grad:'linear-gradient(135deg,#10b981 0%,#16a34a 50%,#84cc16 100%)', hov:'linear-gradient(135deg,#059669 0%,#15803d 50%,#65a30d 100%)', f:()=>setFilterStatus('active'),            act:filterStatus==='active'},
          {k:'tri',  label:'Trial',        val:stats.trial,            grad:'linear-gradient(135deg,#0ea5e9 0%,#6366f1 50%,#8b5cf6 100%)', hov:'linear-gradient(135deg,#0284c7 0%,#4f46e5 50%,#7c3aed 100%)', f:()=>setFilterStatus('trial'),             act:filterStatus==='trial'},
          {k:'sus',  label:'Suspended',    val:stats.suspended,        grad:'linear-gradient(135deg,#ec4899 0%,#dc2626 50%,#9f1239 100%)', hov:'linear-gradient(135deg,#db2777 0%,#b91c1c 50%,#881337 100%)', f:()=>setFilterStatus('suspended'),         act:filterStatus==='suspended'},
          {k:'del',  label:'Del. Requests',val:stats.deletionRequested,grad:'linear-gradient(135deg,#f97316 0%,#ea580c 40%,#7c3aed 100%)', hov:'linear-gradient(135deg,#ea580c 0%,#c2410c 40%,#6d28d9 100%)', f:()=>setFilterStatus('deletion_requested'),act:filterStatus==='deletion_requested'},
        ].map(s=>(
          <div key={s.k} onClick={s.f} className="sStat"
            style={{background:s.grad,boxShadow:s.act?'0 4px 18px rgba(0,0,0,0.3)':'0 2px 8px rgba(0,0,0,0.15)',outline:s.act?'2px solid rgba(255,255,255,0.5)':'none',outlineOffset:3}}>
            <div style={{fontSize:22,fontWeight:900,color:'#fff',lineHeight:1,marginBottom:4,textShadow:'0 1px 3px rgba(0,0,0,0.2)'}}>{s.val}</div>
            <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.85)',textTransform:'uppercase',letterSpacing:'0.5px'}}>{s.label}</div>
            {s.act&&<div style={{width:20,height:2,background:'rgba(255,255,255,0.6)',borderRadius:1,marginTop:5}} />}
          </div>
        ))}
      </div>

      {/* Deletion alert */}
      {stats.deletionRequested>0&&(
        <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderLeft:'4px solid #dc2626',borderRadius:7,padding:'7px 13px',marginBottom:10,display:'flex',alignItems:isMobile?'flex-start':'center',justifyContent:'space-between',gap:8,flexWrap:'wrap',flexDirection:isMobile?'column':'row'}}>
          <div style={{display:'flex',alignItems:'center',gap:7}}>
            <span style={{fontSize:14}}>⚠️</span>
            <span style={{fontWeight:700,fontSize:12,color:'#dc2626'}}>{stats.deletionRequested} Pending Deletion Request{stats.deletionRequested>1?'s':''}</span>
            <span style={{fontSize:11,color:'#b91c1c'}}>— requires your action</span>
          </div>
          <button onClick={()=>setFilterStatus('deletion_requested')} style={{background:'#dc2626',color:'#fff',border:'none',borderRadius:5,padding:'4px 11px',fontSize:11,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}>Review →</button>
        </div>
      )}

      {/* MAIN */}
      <div className="tSplitWrap" style={{display:'flex',flexDirection:isMobile?'column':'row',gap:12,minHeight:isMobile?'auto':400}}>
        {/* EXCEL TABLE SIDE */}
        <div className="tTableSide" style={{flex:(!isMobile&&selectedTenant&&isPinVerified)?'0 0 58%':'1',minWidth:0,display:'flex',flexDirection:'column',gap:0}}>
          {/* Floating bulk-assign bar */}
          {checkedTenants.size > 0 && !isManager && (
            <div style={{background:'linear-gradient(135deg,#0f0c29,#1e1b4b)',borderRadius:'8px 8px 0 0',padding:'8px 12px',display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',border:'1px solid rgba(99,102,241,0.4)',borderBottom:'none'}}>
              <div style={{width:22,height:22,borderRadius:'50%',background:'#f59e0b',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:900,color:'#fff',flexShrink:0}}>{checkedTenants.size}</div>
              <span style={{fontSize:12,fontWeight:700,color:'#fff'}}>tenant{checkedTenants.size!==1?'s':''} selected</span>
              <span style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>→ Assign to manager:</span>
              <select
                value={bulkManagerId}
                onChange={e=>setBulkManagerId(e.target.value)}
                style={{flex:1,minWidth:160,padding:'5px 9px',border:'1px solid rgba(255,255,255,0.2)',borderRadius:6,fontSize:11,outline:'none',background:'rgba(255,255,255,0.1)',color:'#fff',fontWeight:600}}
              >
                <option value="" style={{color:'#374151'}}>— Select Manager —</option>
                {managers.filter(m=>m.isActive).map(m=>(
                  <option key={m._id} value={m._id} style={{color:'#374151'}}>{m.firstName} {m.lastName}</option>
                ))}
              </select>
              <button
                onClick={handleBulkAssign}
                disabled={!bulkManagerId || assigningManager}
                style={{background:bulkManagerId?'linear-gradient(135deg,#f59e0b,#f97316)':'rgba(255,255,255,0.1)',color:'#fff',border:'none',padding:'6px 14px',borderRadius:6,fontSize:11,fontWeight:700,cursor:bulkManagerId?'pointer':'not-allowed',whiteSpace:'nowrap',opacity:assigningManager?0.7:1}}
              >
                {assigningManager ? 'Assigning...' : '✅ Assign'}
              </button>
              <button
                onClick={()=>{setCheckedTenants(new Set());setBulkManagerId('');}}
                style={{background:'rgba(239,68,68,0.15)',color:'#fca5a5',border:'1px solid rgba(239,68,68,0.3)',padding:'5px 10px',borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'}}
              >✕ Clear</button>
              {managers.length===0&&<span style={{fontSize:10,color:'#fbbf24'}}>No managers yet — create one in SAAS Admins</span>}
            </div>
          )}

          {/* Toolbar */}
          <div style={{background:'#fff',borderRadius:checkedTenants.size>0&&!isManager?'0':'8px 8px 0 0',border:'1px solid #d1d5db',borderBottom:'none',padding:'8px 12px',display:'flex',gap:7,alignItems:'center',flexWrap:'wrap'}}>
            <input type="text" placeholder="🔍 Search organization, ID..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
              autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" name="tenant-search-unique"
              style={{flex:1,minWidth:140,padding:'5px 10px',border:'1px solid #d1d5db',borderRadius:5,fontSize:12,outline:'none',background:'#f9fafb'}} />
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
              style={{padding:'5px 8px',border:'1px solid #d1d5db',borderRadius:5,fontSize:11,outline:'none',background:'#f9fafb',fontWeight:600,color:'#374151'}}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="suspended">Suspended</option>
              <option value="deletion_requested">Del. Requested</option>
            </select>
            {filterStatus!=='all'&&<button onClick={()=>setFilterStatus('all')} style={{background:'#fee2e2',color:'#dc2626',border:'1px solid #fecaca',padding:'5px 9px',borderRadius:5,fontSize:11,fontWeight:600,cursor:'pointer'}}>✕ Clear</button>}
            <span style={{marginLeft:'auto',fontSize:10,color:'#94a3b8',fontWeight:600,whiteSpace:'nowrap'}}>{filteredTenants.length} records</span>
          </div>

          {/* Excel Grid */}
          <div style={{overflowX:'auto',borderRadius:'0 0 8px 8px',border:'1px solid #d1d5db',background:'#fff'}}>
            {loading?(
              <div style={{padding:40,textAlign:'center',color:'#94a3b8',fontSize:13}}>Loading tenants...</div>
            ):(
              <table style={{width:'100%',borderCollapse:'collapse',tableLayout:isMobile?'auto':'fixed',minWidth:isMobile?'auto':600}}>
                {!isMobile&&<colgroup>
                  {!isManager&&<col style={{width:34}} />}
                  <col style={{width:30}} />
                  <col style={{width:'26%'}} />
                  <col style={{width:'12%'}} />
                  <col style={{width:'9%'}} />
                  <col style={{width:'9%'}} />
                  <col style={{width:'9%'}} />
                  <col style={{width:'10%'}} />
                  <col style={{width:'10%'}} />
                  <col style={{width:64}} />
                </colgroup>}
                <thead>
                  <tr>
                    {!isManager&&(
                      <th className="xTh" style={{textAlign:'center',padding:'6px 8px'}}>
                        <input type="checkbox"
                          checked={paginatedTenants.length>0&&paginatedTenants.every(t=>checkedTenants.has(t._id))}
                          onChange={toggleAllVisible}
                          onClick={e=>e.stopPropagation()}
                          style={{cursor:'pointer',width:14,height:14,accentColor:'#6366f1'}}
                        />
                      </th>
                    )}
                    <th className="xTh xNum">#</th>
                    <th className="xTh">Company</th>
                    <th className={`xTh${isMobile?' xHideM':''}`}>Org ID</th>
                    <th className="xTh" style={{textAlign:'center'}}>Status</th>
                    <th className={`xTh${isMobile?' xHideM':''}`} style={{textAlign:'center'}}>Plan</th>
                    <th className={`xTh${isMobile?' xHideM':''}`} style={{textAlign:'center'}}>Users</th>
                    <th className={`xTh${isMobile?' xHideM':''}`}>Created</th>
                    <th className={`xTh${isMobile?' xHideM':''}`} style={{textAlign:'center'}}>Manager</th>
                    <th className="xTh xPin" style={{textAlign:'center'}}>View</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTenants.length===0?(
                    <tr><td colSpan={isManager?9:10} style={{padding:'28px',textAlign:'center',color:'#94a3b8',fontSize:13,border:'1px solid #e2e6eb'}}>No tenants found</td></tr>
                  ):paginatedTenants.map((t,i)=>{
                    const status=getTenantStatus(t);
                    const isSelected=selectedTenant?._id===t._id;
                    const isChecked=checkedTenants.has(t._id);
                    const statusCell={
                      active:   {bg:'#16a34a',color:'#fff',fw:700},
                      trial:    {bg:'#0ea5e9',color:'#fff',fw:700},
                      suspended:{bg:'#dc2626',color:'#fff',fw:700},
                    }[status]||{bg:'#475569',color:'#fff',fw:600};
                    const grads=['linear-gradient(135deg,#6366f1,#4f46e5)','linear-gradient(135deg,#8b5cf6,#7c3aed)','linear-gradient(135deg,#06b6d4,#0891b2)','linear-gradient(135deg,#10b981,#059669)','linear-gradient(135deg,#f59e0b,#d97706)','linear-gradient(135deg,#ef4444,#dc2626)','linear-gradient(135deg,#ec4899,#db2777)','linear-gradient(135deg,#14b8a6,#0d9488)'];
                    const grad=grads[(t.organizationName?.charCodeAt(0)||0)%grads.length];
                    const rowBg=isChecked?'#eff6ff':isSelected?null:i%2===0?'#fff':'#f9fafb';
                    return (
                      <tr key={t._id} className={`xRow${isSelected?' xSel':''}`} onClick={()=>handleTenantClick(t)}>
                        {!isManager&&(
                          <td className="xTd" style={{background:rowBg||undefined,textAlign:'center',padding:'6px 8px'}} onClick={e=>toggleCheck(e,t._id)}>
                            <input type="checkbox" checked={isChecked} onChange={()=>{}}
                              style={{cursor:'pointer',width:14,height:14,accentColor:'#6366f1',pointerEvents:'none'}}
                            />
                          </td>
                        )}
                        <td className="xTd xNum" style={{background:rowBg||undefined}}>{startIndex+i+1}</td>
                        <td className="xTd" style={{background:rowBg||undefined}}>
                          <div style={{display:'flex',alignItems:'center',gap:7}}>
                            <div style={{width:26,height:26,borderRadius:6,background:grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff',flexShrink:0,overflow:'hidden'}}>
                              {t.logo?<img src={getLogoUrl(t.logo)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{e.target.style.display='none'}} />:t.organizationName?.charAt(0)?.toUpperCase()||'?'}
                            </div>
                            <div style={{minWidth:0}}>
                              <div style={{fontSize:12,fontWeight:700,color:'#111827',overflow:'hidden',textOverflow:'ellipsis'}}>{t.organizationName||'N/A'}</div>
                              <div style={{fontSize:10,color:'#9ca3af',overflow:'hidden',textOverflow:'ellipsis'}}>{maskEmail(t.contactEmail)}</div>
                            </div>
                          </div>
                        </td>
                        <td className={`xTd${isMobile?' xHideM':''}`} style={{background:rowBg||undefined,fontFamily:'monospace',fontSize:10,color:'#6366f1',fontWeight:600,letterSpacing:'0.3px'}}>{t.organizationId||'—'}</td>
                        <td className="xTd" style={{background:isSelected?null:statusCell.bg,color:statusCell.color,fontWeight:statusCell.fw,fontSize:10,textAlign:'center',textTransform:'uppercase',letterSpacing:'0.5px'}}>
                          {status}
                          {t.deletionRequest?.status==='pending'&&<div style={{fontSize:9,marginTop:1,color:isSelected?'#dc2626':'#dc2626',fontWeight:700}}>DEL REQ</div>}
                        </td>
                        <td className={`xTd${isMobile?' xHideM':''}`} style={{background:isSelected?null:({Enterprise:'#f59e0b',Professional:'#8b5cf6',Basic:'#3b82f6',Free:'#64748b'}[t.subscription?.planName]||'#3b82f6'),color:'#fff',fontWeight:700,fontSize:10,textAlign:'center'}}>{t.subscription?.planName||'Free'}</td>
                        <td className={`xTd${isMobile?' xHideM':''}`} style={{background:rowBg||undefined,textAlign:'center',fontSize:11,fontWeight:700,color:'#374151'}}>{t.userCount||0}<span style={{fontSize:10,color:'#9ca3af',fontWeight:400}}>/{t.subscription?.maxUsers||'∞'}</span></td>
                        <td className={`xTd${isMobile?' xHideM':''}`} style={{background:rowBg||undefined,fontSize:11,color:'#6b7280'}}>{formatDate(t.createdAt)}</td>
                        <td className={`xTd${isMobile?' xHideM':''}`} style={{background:rowBg||undefined,textAlign:'center'}}>
                          {t.assignedManager ? (
                            <span title={`${t.assignedManager.firstName} ${t.assignedManager.lastName}`}
                              style={{display:'inline-flex',alignItems:'center',gap:4,background:'#f5f3ff',border:'1px solid #ddd6fe',borderRadius:20,padding:'2px 7px',fontSize:9,fontWeight:700,color:'#6d28d9',maxWidth:80,overflow:'hidden'}}>
                              <span>👤</span>
                              <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.assignedManager.firstName}</span>
                            </span>
                          ) : (
                            <span style={{fontSize:9,color:'#d1d5db'}}>—</span>
                          )}
                        </td>
                        <td className="xTd xPin" style={{background:rowBg||undefined,textAlign:'center'}}>
                          <button onClick={e=>{e.stopPropagation();handleTenantClick(t);}}
                            style={{background:isPinVerified?'linear-gradient(135deg,#6366f1,#4f46e5)':'linear-gradient(135deg,#475569,#334155)',color:'#fff',border:'none',padding:'5px 10px',borderRadius:5,fontSize:10,fontWeight:700,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:4,whiteSpace:'nowrap'}}>
                            {isPinVerified?<><span>👁</span><span>View</span></>:<><span>🔒</span><span>PIN</span></>}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading&&(
            <div style={{background:'#f9fafb',border:'1px solid #d1d5db',borderTop:'none',borderRadius:'0 0 8px 8px',padding:'6px 12px',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:11,color:'#6b7280',flexWrap:'wrap',gap:6}}>
              <span>Showing <b style={{color:'#111827'}}>{startIndex+1}–{Math.min(startIndex+pageSize,filteredTenants.length)}</b> of <b style={{color:'#111827'}}>{filteredTenants.length}</b> tenants{filterStatus!=='all'?` · Filter: ${filterStatus}`:''}</span>
              <div style={{display:'flex',alignItems:'center',gap:5}}>
                <button onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1}
                  style={{background:currentPage===1?'#f3f4f6':'#1e293b',color:currentPage===1?'#9ca3af':'#fff',border:'1px solid',borderColor:currentPage===1?'#d1d5db':'#1e293b',padding:'4px 9px',borderRadius:4,cursor:currentPage===1?'not-allowed':'pointer',fontSize:11,fontWeight:600}}>← Prev</button>
                <span style={{fontWeight:700,color:'#1e293b',fontSize:11,padding:'0 4px'}}>Page {currentPage} / {totalPages||1}</span>
                <button onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage>=totalPages}
                  style={{background:currentPage>=totalPages?'#f3f4f6':'#1e293b',color:currentPage>=totalPages?'#9ca3af':'#fff',border:'1px solid',borderColor:currentPage>=totalPages?'#d1d5db':'#1e293b',padding:'4px 9px',borderRadius:4,cursor:currentPage>=totalPages?'not-allowed':'pointer',fontSize:11,fontWeight:600}}>Next →</button>
              </div>
            </div>
          )}
        </div>

        {/* DETAIL PANEL */}
        {selectedTenant&&isPinVerified&&(()=>{
          const t=selectedTenant;
          const st=getTenantStatus(t);
          const stColors={active:{bg:'#16a34a',c:'#fff'},trial:{bg:'#0ea5e9',c:'#fff'},suspended:{bg:'#dc2626',c:'#fff'}};
          const sc=stColors[st]||{bg:'#f1f5f9',c:'#475569'};

          const Sec=({label,accent='#6366f1',children})=>(
            <div style={{marginBottom:0}}>
              <div style={{background:`linear-gradient(90deg,${accent}18 0%,transparent 100%)`,borderLeft:`3px solid ${accent}`,padding:'5px 10px',fontSize:10,fontWeight:800,color:accent,textTransform:'uppercase',letterSpacing:'0.5px'}}>{label}</div>
              <div>{children}</div>
            </div>
          );
          const FR=({l,v,mono})=>(
            <div className="dRow">
              <div className="dLbl">{l}</div>
              <div className="dVal" style={mono?{fontFamily:'monospace',fontSize:11,color:'#6366f1'}:{}}>{v||'—'}</div>
            </div>
          );

          return (
            <div className="tDetailPanel" style={{flex:isMobile?'1':'0 0 41%',order:-1,width:isMobile?'100%':undefined,minWidth:0,background:'#fff',borderRadius:8,border:'1px solid #d1d5db',overflow:'hidden',display:'flex',flexDirection:'column',maxHeight:isMobile?'none':'82vh',boxShadow:'0 2px 8px rgba(0,0,0,0.07)'}}>
              {/* Dark header */}
              <div style={{background:'linear-gradient(135deg,#0f0c29 0%,#1e1b4b 50%,#312e81 100%)',padding:'11px 14px 10px',flexShrink:0}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:36,height:36,borderRadius:7,background:'rgba(99,102,241,0.2)',border:'1px solid rgba(99,102,241,0.35)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0}}>
                    {t.logo?<img src={getLogoUrl(t.logo)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{e.target.style.display='none'}} />
                      :<span style={{fontSize:16,fontWeight:700,color:'#a5b4fc'}}>{t.organizationName?.charAt(0)}</span>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:800,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.organizationName}</div>
                    <div style={{display:'flex',gap:4,marginTop:3,flexWrap:'wrap'}}>
                      <span style={{background:sc.bg,color:sc.c,fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:3,textTransform:'uppercase'}}>{st}</span>
                      <span style={{background:'rgba(99,102,241,0.25)',color:'#a5b4fc',fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:3}}>{t.subscription?.planName||'Free'}</span>
                      {t.organizationId&&<span style={{background:'rgba(255,255,255,0.08)',color:'#94a3b8',fontSize:9,fontFamily:'monospace',padding:'1px 6px',borderRadius:3}}>{t.organizationId}</span>}
                    </div>
                  </div>
                  <button onClick={()=>setSelectedTenant(null)} style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',color:'#94a3b8',width:24,height:24,borderRadius:5,cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>×</button>
                </div>
              </div>

              {/* KPI row */}
              <div className="tKpiRow" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',borderBottom:'1px solid #e2e8f0',flexShrink:0}}>
                {[
                  {l:'Users',v:`${t.userCount||0}/${t.subscription?.maxUsers||'∞'}`},
                  {l:'Plan',v:t.subscription?.planName||'Free'},
                  {l:'Billing',v:t.subscription?.billingCycle||'N/A'},
                ].map(({l,v},i)=>(
                  <div key={l} style={{padding:'7px 10px',textAlign:'center',borderRight:i<2?'1px solid #e2e8f0':'none',background:i%2===0?'#fff':'#f9fafb'}}>
                    <div style={{fontSize:13,fontWeight:800,color:'#1e293b'}}>{v}</div>
                    <div style={{fontSize:9,color:'#94a3b8',fontWeight:600,textTransform:'uppercase',marginTop:1}}>{l}</div>
                  </div>
                ))}
              </div>

              {/* Scrollable sections */}
              <div style={{flex:1,overflowY:'auto'}}>
                <Sec label="Subscription" accent="#6366f1">
                  <FR l="Status"  v={st.toUpperCase()} />
                  <FR l="Expires" v={formatDate(t.subscription?.endDate)} />
                  <FR l="Max Users" v={t.subscription?.maxUsers||'Unlimited'} />
                </Sec>

                <Sec label="Contact Info" accent="#0891b2">
                  <FR l="Email"  v={t.contactEmail} />
                  <FR l="Phone"  v={t.contactPhone} />
                  {t.alternatePhone&&<FR l="Alt. Phone" v={t.alternatePhone} />}
                  <FR l="Admin"  v={t.adminUser?`${t.adminUser.firstName} ${t.adminUser.lastName}`:null} />
                  {t.website&&<FR l="Website" v={t.website} />}
                </Sec>

                {(t.industry||t.businessType||t.numberOfEmployees)&&(
                  <Sec label="Business" accent="#0d9488">
                    {t.industry&&<FR l="Industry" v={t.industry} />}
                    {t.businessType&&<FR l="Type" v={t.businessType} />}
                    {t.numberOfEmployees&&<FR l="Team Size" v={t.numberOfEmployees} />}
                    {t.foundedYear&&<FR l="Founded" v={t.foundedYear} />}
                    {t.taxId&&<FR l="Tax ID" v={t.taxId} mono />}
                    {t.registrationNumber&&<FR l="Reg. No." v={t.registrationNumber} mono />}
                  </Sec>
                )}

                {(t.headquarters?.city||t.headquarters?.country)&&(
                  <Sec label="Location" accent="#7c3aed">
                    {t.headquarters?.street&&<FR l="Street" v={t.headquarters.street} />}
                    {t.headquarters?.city&&<FR l="City" v={t.headquarters.city} />}
                    {t.headquarters?.state&&<FR l="State" v={t.headquarters.state} />}
                    {t.headquarters?.country&&<FR l="Country" v={t.headquarters.country} />}
                    {t.headquarters?.zipCode&&<FR l="ZIP" v={t.headquarters.zipCode} />}
                  </Sec>
                )}

                <Sec label="Settings" accent="#d97706">
                  <FR l="Timezone" v={t.settings?.timezone} />
                  <FR l="Date Fmt" v={t.settings?.dateFormat} />
                  <FR l="Currency" v={t.settings?.currency} />
                  <FR l="Created"  v={formatDate(t.createdAt)} />
                  {t.slug&&<FR l="Slug" v={t.slug} mono />}
                </Sec>

                {t.deletionRequest?.status&&t.deletionRequest.status!=='none'&&(
                  <Sec label="Deletion Request" accent="#dc2626">
                    <FR l="Status" v={t.deletionRequest.status.toUpperCase()} />
                    {t.deletionRequest.requestedAt&&<FR l="Requested" v={formatDate(t.deletionRequest.requestedAt)} />}
                    {t.deletionRequest.reason&&<FR l="Reason" v={t.deletionRequest.reason} />}
                    {t.deletionRequest.permanentDeleteAt&&<FR l="Perm. Del." v={formatDate(t.deletionRequest.permanentDeleteAt)} />}
                    {t.deletionRequest.status==='pending'&&(
                      <div style={{display:'flex',gap:6,padding:'8px 10px',background:'#fef2f2'}}>
                        <button onClick={()=>handleApproveDeletion(t._id)} disabled={deletionActionLoading} style={{flex:1,padding:'6px',background:'#dc2626',border:'none',borderRadius:5,color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer'}}>✅ Approve</button>
                        <button onClick={()=>setShowRejectModal(true)} disabled={deletionActionLoading} style={{flex:1,padding:'6px',background:'#fff',border:'1px solid #dc2626',borderRadius:5,color:'#dc2626',fontSize:11,fontWeight:700,cursor:'pointer'}}>❌ Reject</button>
                      </div>
                    )}
                    {t.deletionRequest.status==='approved'&&(
                      <div style={{padding:'7px 10px',background:'#fef2f2'}}>
                        <button onClick={()=>handleRecoverTenant(t._id)} disabled={deletionActionLoading} style={{width:'100%',padding:'6px',background:'#16a34a',border:'none',borderRadius:5,color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer'}}>🔄 Recover Account</button>
                      </div>
                    )}
                  </Sec>
                )}

                {/* Manager Assignment Info */}
                {t.assignedManager && (
                  <Sec label="Assigned Manager" accent="#8b5cf6">
                    <div style={{padding:'8px 10px'}}>
                      {/* Manager card */}
                      <div style={{display:'flex',alignItems:'center',gap:9,background:'#f5f3ff',borderRadius:7,padding:'8px 10px',marginBottom:7}}>
                        <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#8b5cf6,#6366f1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff',flexShrink:0}}>
                          {t.assignedManager.firstName?.[0]}{t.assignedManager.lastName?.[0]}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:700,color:'#4c1d95'}}>{t.assignedManager.firstName} {t.assignedManager.lastName}</div>
                          <div style={{fontSize:10,color:'#7c3aed',overflow:'hidden',textOverflow:'ellipsis'}}>{t.assignedManager.email}</div>
                        </div>
                        <span style={{background:'#8b5cf6',color:'#fff',fontSize:8,fontWeight:800,padding:'2px 6px',borderRadius:20,letterSpacing:0.5,flexShrink:0}}>MANAGER</span>
                      </div>
                      {/* Who assigned + when */}
                      <div className="tAssignGrid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                        {t.assignedManagerBy && (
                          <div style={{background:'#f8fafc',borderRadius:5,padding:'5px 8px',border:'1px solid #e2e8f0'}}>
                            <div style={{fontSize:8,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:0.5,marginBottom:2}}>Assigned By</div>
                            <div style={{fontSize:11,fontWeight:700,color:'#1e293b'}}>{t.assignedManagerBy.firstName} {t.assignedManagerBy.lastName}</div>
                            <div style={{fontSize:9,color:'#64748b',overflow:'hidden',textOverflow:'ellipsis'}}>{t.assignedManagerBy.email}</div>
                          </div>
                        )}
                        {t.assignedManagerAt && (
                          <div style={{background:'#f8fafc',borderRadius:5,padding:'5px 8px',border:'1px solid #e2e8f0'}}>
                            <div style={{fontSize:8,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:0.5,marginBottom:2}}>Assigned On</div>
                            <div style={{fontSize:11,fontWeight:700,color:'#1e293b'}}>{new Date(t.assignedManagerAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>
                            <div style={{fontSize:9,color:'#64748b'}}>{new Date(t.assignedManagerAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Sec>
                )}

                {/* Action — hidden for managers */}
                {!isManager && (
                  <div style={{padding:'10px 12px',borderTop:'1px solid #e2e8f0',background:'#f9fafb'}}>
                    {getTenantStatus(t)==='suspended'
                      ?<button onClick={()=>handleActivate(t._id)} style={{width:'100%',padding:'7px',background:'linear-gradient(135deg,#16a34a,#15803d)',color:'#fff',border:'none',borderRadius:6,fontSize:11,fontWeight:700,cursor:'pointer'}}>✅ Activate Tenant</button>
                      :<button onClick={()=>handleSuspend(t._id)} style={{width:'100%',padding:'7px',background:'linear-gradient(135deg,#dc2626,#b91c1c)',color:'#fff',border:'none',borderRadius:6,fontSize:11,fontWeight:700,cursor:'pointer'}}>🚫 Suspend Tenant</button>
                    }
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* VERIFY PIN MODAL */}
      {showPinModal&&(
        <div style={S.overlay} onClick={()=>setShowPinModal(false)}>
          <div style={S.modal} onClick={e=>e.stopPropagation()}>
            <div style={S.mHead}>
              <div style={S.mIcon}>🔒</div>
              <div><div style={S.mTitle}>Enter Viewing PIN</div><div style={S.mSub}>Verify identity to view tenant details</div></div>
            </div>
            <div style={S.mBody}>
              {pinError&&<div style={S.err}>{pinError}</div>}
              <div style={S.pinRow}>
                {pin.map((d,i)=>(
                  <input key={i} ref={el=>pinRefs.current[i]=el} type="password" value={d}
                    onChange={e=>handlePinChange(i,e.target.value,pin,setPin,pinRefs)}
                    onKeyDown={e=>handlePinKeyDown(i,e,pinRefs)}
                    style={S.pinBox} maxLength={1} inputMode="numeric" autoFocus={i===0}
                    autoComplete="new-password" name={`pin-digit-${i}`} />
                ))}
              </div>
              <div style={S.mAct}>
                <button onClick={()=>{setShowPinModal(false);setPin(['','','','']);setPinError('');}} style={S.btnCancel}>Cancel</button>
                <button onClick={handleVerifyPin} style={S.btnSubmit} disabled={pinLoading}>{pinLoading?'Verifying...':'Verify'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SETUP PIN MODAL */}
      {showSetupModal&&(
        <div style={S.overlay} onClick={()=>setShowSetupModal(false)}>
          <div style={S.modal} onClick={e=>e.stopPropagation()}>
            <div style={S.mHead}>
              <div style={S.mIcon}>🔐</div>
              <div><div style={S.mTitle}>Set Viewing PIN</div><div style={S.mSub}>Create a 4-digit PIN to access tenant data</div></div>
            </div>
            <div style={S.mBody}>
              {pinError&&<div style={S.err}>{pinError}</div>}
              {[['Create PIN',newPin,setNewPin,newPinRefs,'new'],['Confirm PIN',confirmPin,setConfirmPin,confirmPinRefs,'conf']].map(([lbl,arr,setArr,refs,pfx])=>(
                <div key={pfx} style={{marginBottom:12}}>
                  <div style={S.pinLabel}>{lbl}</div>
                  <div style={S.pinRow}>
                    {arr.map((d,i)=>(
                      <input key={`${pfx}-${i}`} ref={el=>refs.current[i]=el} type="password" value={d}
                        onChange={e=>handlePinChange(i,e.target.value,arr,setArr,refs)}
                        onKeyDown={e=>handlePinKeyDown(i,e,refs)}
                        style={S.pinBox} maxLength={1} inputMode="numeric" autoComplete="new-password" name={`${pfx}-pin-${i}`} />
                    ))}
                  </div>
                </div>
              ))}
              <div style={S.mAct}>
                <button onClick={()=>{setShowSetupModal(false);setNewPin(['','','','']);setConfirmPin(['','','','']);setPinError('');}} style={S.btnCancel}>Cancel</button>
                <button onClick={handleSetPin} style={S.btnSubmit} disabled={pinLoading}>{pinLoading?'Setting...':'Set PIN'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PIN MODAL */}
      {showChangePinModal&&(
        <div style={S.overlay} onClick={closeAllPinModals}>
          <div style={S.modal} onClick={e=>e.stopPropagation()}>
            <div style={S.mHead}>
              <div style={S.mIcon}>🔐</div>
              <div><div style={S.mTitle}>Change Viewing PIN</div><div style={S.mSub}>Enter current PIN and set a new one</div></div>
            </div>
            <div style={S.mBody}>
              {pinError&&<div style={S.err}>{pinError}</div>}
              {[['Current PIN',currentPin,setCurrentPin,currentPinRefs,'cur'],['New PIN',changeNewPin,setChangeNewPin,changeNewPinRefs,'cnew'],['Confirm New PIN',changeConfirmPin,setChangeConfirmPin,changeConfirmPinRefs,'cconf']].map(([lbl,arr,setArr,refs,pfx])=>(
                <div key={pfx} style={{marginBottom:11}}>
                  <div style={S.pinLabel}>{lbl}</div>
                  <div style={S.pinRow}>
                    {arr.map((d,i)=>(
                      <input key={`${pfx}-${i}`} ref={el=>refs.current[i]=el} type="password" value={d}
                        onChange={e=>handlePinChange(i,e.target.value,arr,setArr,refs)}
                        onKeyDown={e=>handlePinKeyDown(i,e,refs)}
                        style={S.pinBox} maxLength={1} inputMode="numeric" autoComplete="new-password" />
                    ))}
                  </div>
                </div>
              ))}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:4}}>
                <button onClick={()=>{closeAllPinModals();setShowForgotPinModal(true);}} style={{background:'none',border:'none',color:'#6366f1',fontSize:11,cursor:'pointer',fontWeight:600}}>Forgot PIN?</button>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={closeAllPinModals} style={S.btnCancel}>Cancel</button>
                  <button onClick={handleChangePin} style={S.btnSubmit} disabled={pinLoading}>{pinLoading?'Changing...':'Change PIN'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FORGOT PIN MODAL */}
      {showForgotPinModal&&(
        <div style={S.overlay} onClick={closeAllPinModals}>
          <div style={S.modal} onClick={e=>e.stopPropagation()}>
            <div style={S.mHead}>
              <div style={S.mIcon}>🔓</div>
              <div><div style={S.mTitle}>Reset Viewing PIN</div><div style={S.mSub}>{forgotStep===1?"We'll send an OTP to your email":"Enter OTP and set new PIN"}</div></div>
            </div>
            <div style={S.mBody}>
              {pinError&&<div style={S.err}>{pinError}</div>}
              {forgotStep===1?(
                <div style={S.mAct}>
                  <button onClick={closeAllPinModals} style={S.btnCancel}>Cancel</button>
                  <button onClick={handleForgotSendOtp} style={S.btnSubmit} disabled={pinLoading}>{pinLoading?'Sending...':'Send OTP'}</button>
                </div>
              ):(
                <>
                  <div style={{marginBottom:12}}>
                    <div style={S.pinLabel}>Enter OTP</div>
                    <input type="text" value={forgotOtp} onChange={e=>setForgotOtp(e.target.value)} maxLength={6} placeholder="6-digit OTP"
                      style={{width:'100%',padding:'11px',border:'2px solid #e2e8f0',borderRadius:8,fontSize:16,textAlign:'center',letterSpacing:8,boxSizing:'border-box',outline:'none'}} autoComplete="off" />
                  </div>
                  {[['New PIN',resetPin,setResetPin,resetPinRefs,'rst'],['Confirm PIN',resetConfirmPin,setResetConfirmPin,resetConfirmPinRefs,'rstc']].map(([lbl,arr,setArr,refs,pfx])=>(
                    <div key={pfx} style={{marginBottom:12}}>
                      <div style={S.pinLabel}>{lbl}</div>
                      <div style={S.pinRow}>
                        {arr.map((d,i)=>(
                          <input key={`${pfx}-${i}`} ref={el=>refs.current[i]=el} type="password" value={d}
                            onChange={e=>handlePinChange(i,e.target.value,arr,setArr,refs)}
                            onKeyDown={e=>handlePinKeyDown(i,e,refs)}
                            style={S.pinBox} maxLength={1} inputMode="numeric" autoComplete="new-password" />
                        ))}
                      </div>
                    </div>
                  ))}
                  <div style={S.mAct}>
                    <button onClick={()=>setForgotStep(1)} style={S.btnCancel}>Back</button>
                    <button onClick={handleResetPin} style={S.btnSubmit} disabled={pinLoading}>{pinLoading?'Resetting...':'Reset PIN'}</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REJECT DELETION MODAL */}
      {showRejectModal&&(
        <div style={S.overlay} onClick={()=>setShowRejectModal(false)}>
          <div style={{...S.modal,maxWidth:420}} onClick={e=>e.stopPropagation()}>
            <div style={{...S.mHead,background:'linear-gradient(135deg,#7f1d1d,#991b1b,#b91c1c)'}}>
              <div style={S.mIcon}>❌</div>
              <div><div style={S.mTitle}>Reject Deletion Request</div><div style={S.mSub}>Tenant will be notified via email</div></div>
            </div>
            <div style={S.mBody}>
              <div style={{marginBottom:12}}>
                <label style={{display:'block',fontSize:11,fontWeight:600,color:'#374151',marginBottom:5}}>Rejection Reason (optional)</label>
                <textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)} placeholder="Explain why the request is being rejected..." rows={3}
                  style={{width:'100%',padding:'9px 11px',border:'1px solid #e2e8f0',borderRadius:7,fontSize:12,resize:'vertical',fontFamily:'inherit',boxSizing:'border-box',outline:'none'}} />
              </div>
              <div style={S.mAct}>
                <button onClick={()=>{setShowRejectModal(false);setRejectReason('');}} style={S.btnCancel}>Cancel</button>
                <button onClick={()=>handleRejectDeletion(selectedTenant._id)} disabled={deletionActionLoading} style={{...S.btnSubmit,background:'#dc2626'}}>{deletionActionLoading?'Rejecting...':'Reject Request'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SaasLayout>
  );
};

const S = {
  overlay:   { position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 },
  modal:     { background:'#fff',borderRadius:12,overflow:'hidden',width:'100%',maxWidth:380,boxShadow:'0 20px 60px rgba(0,0,0,0.3)' },
  mHead:     { background:'linear-gradient(135deg,#0f0c29 0%,#1e1b4b 50%,#312e81 100%)',padding:'13px 16px',display:'flex',alignItems:'center',gap:11 },
  mIcon:     { width:36,height:36,borderRadius:9,background:'rgba(99,102,241,0.2)',border:'1px solid rgba(99,102,241,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:19,flexShrink:0 },
  mTitle:    { fontSize:14,fontWeight:800,color:'#fff' },
  mSub:      { fontSize:11,color:'#8b9ccc',marginTop:2 },
  mBody:     { padding:'16px 18px' },
  mAct:      { display:'flex',gap:8,justifyContent:'flex-end',marginTop:14 },
  btnCancel: { padding:'8px 14px',border:'1px solid #e2e8f0',background:'#fff',borderRadius:7,fontSize:11,cursor:'pointer',fontWeight:600,color:'#475569' },
  btnSubmit: { padding:'8px 16px',border:'none',background:'linear-gradient(135deg,#6366f1,#4f46e5)',color:'#fff',borderRadius:7,fontSize:11,fontWeight:700,cursor:'pointer' },
  pinRow:    { display:'flex',gap:8,justifyContent:'center',marginTop:6,marginBottom:4 },
  pinBox:    { width:42,height:46,border:'2px solid #e2e8f0',borderRadius:9,fontSize:20,fontWeight:700,textAlign:'center',outline:'none' },
  pinLabel:  { fontSize:10,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.5px',textAlign:'center',marginBottom:4 },
  err:       { background:'#fef2f2',color:'#dc2626',padding:'8px 12px',borderRadius:7,fontSize:11,marginBottom:12,textAlign:'center' },
};

export default Tenants;
