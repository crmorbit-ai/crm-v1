import React, { useState, useEffect, useCallback } from 'react';
import SaasLayout, { useWindowSize } from '../components/layout/SaasLayout';
import { tenantService } from '../services/tenantService';

const SaasNotifications = () => {
  const { isMobile } = useWindowSize();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [actionLoading, setActionLoading] = useState(null); // tenantId currently being actioned
  const [rejectModal, setRejectModal] = useState(null); // { tenantId, orgName }
  const [rejectReason, setRejectReason] = useState('');
  const [filter, setFilter] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: 1, limit: 1000 };
      if (filter !== 'all') params.deletionStatus = filter;
      const data = await tenantService.getTenants(params);
      const tenants = data.tenants || data || [];
      // Filter to only those with a deletionRequest that is not 'none'
      const withRequests = tenants.filter(t =>
        t.deletionRequest && t.deletionRequest.status && t.deletionRequest.status !== 'none'
      );
      setNotifications(withRequests);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleApprove = async (tenantId, orgName) => {
    if (!window.confirm(`Approve deletion for "${orgName}"?\n\nThe tenant will lose access immediately and data will be permanently deleted after 45 days.`)) return;
    try {
      setActionLoading(tenantId);
      await tenantService.approveDeletion(tenantId);
      await fetchNotifications();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve deletion');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      setActionLoading(rejectModal.tenantId);
      await tenantService.rejectDeletion(rejectModal.tenantId, rejectReason);
      setRejectModal(null);
      setRejectReason('');
      await fetchNotifications();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject deletion');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRecover = async (tenantId, orgName) => {
    if (!window.confirm(`Recover "${orgName}"? They will regain full access immediately.`)) return;
    try {
      setActionLoading(tenantId);
      await tenantService.recoverTenant(tenantId);
      await fetchNotifications();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to recover account');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

  const daysLeft = (date) => {
    if (!date) return 0;
    return Math.max(0, Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24)));
  };

  const statusConfig = {
    pending:  { bg: '#fef3c7', color: '#92400e', border: '#fde68a', label: 'Pending Review' },
    approved: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'Deletion Approved' },
    rejected: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', label: 'Rejected' },
  };

  const pendingCount = notifications.filter(n => n.deletionRequest?.status === 'pending').length;

  return (
    <SaasLayout title="Notifications">
      {/* Page Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: isMobile ? '18px' : '22px', fontWeight: '700', color: '#1e293b' }}>
              🔔 Notifications
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
              Deletion requests and system alerts from organizations
            </p>
          </div>
          <button
            onClick={fetchNotifications}
            style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        {[
          { key: 'pending', label: '⏳ Pending', count: notifications.filter(n => n.deletionRequest?.status === 'pending').length },
          { key: 'approved', label: '🗑️ Approved' },
          { key: 'rejected', label: '✅ Rejected' },
          { key: 'all', label: 'All' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '7px 16px',
              borderRadius: '7px',
              border: 'none',
              fontSize: '12px',
              fontWeight: filter === tab.key ? '700' : '500',
              color: filter === tab.key ? '#1e293b' : '#64748b',
              background: filter === tab.key ? '#fff' : 'transparent',
              cursor: 'pointer',
              boxShadow: filter === tab.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{ background: '#dc2626', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '1px 5px', borderRadius: '8px' }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Pending Alert */}
      {pendingCount > 0 && filter !== 'approved' && filter !== 'rejected' && (
        <div style={{
          background: 'linear-gradient(135deg, #fef2f2, #fff5f5)',
          border: '1.5px solid #fecaca',
          borderRadius: '10px',
          padding: '14px 18px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '24px' }}>🚨</span>
          <div>
            <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: '#dc2626' }}>
              {pendingCount} organization{pendingCount > 1 ? 's' : ''} requesting deletion
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: '#b91c1c' }}>
              Review and take action before data is permanently deleted
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
          <p style={{ margin: 0 }}>Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#64748b' }}>No notifications</p>
          <p style={{ margin: '4px 0 0', fontSize: '13px' }}>All deletion requests have been handled</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map(tenant => {
            const dr = tenant.deletionRequest;
            const cfg = statusConfig[dr.status] || {};
            const isActioning = actionLoading === tenant._id;

            return (
              <div
                key={tenant._id}
                style={{
                  background: '#fff',
                  border: `1.5px solid ${dr.status === 'pending' ? '#fecaca' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  padding: isMobile ? '14px' : '20px 24px',
                  boxShadow: dr.status === 'pending' ? '0 2px 12px rgba(220,38,38,0.08)' : '0 1px 4px rgba(0,0,0,0.06)'
                }}
              >
                {/* Card Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Org Avatar */}
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
                      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: '700', fontSize: '18px'
                    }}>
                      {tenant.organizationName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: '700', fontSize: '15px', color: '#1e293b' }}>
                        {tenant.organizationName}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>
                        {tenant.organizationId} &nbsp;·&nbsp; {tenant.contactEmail}
                      </p>
                    </div>
                  </div>
                  {/* Status Badge */}
                  <span style={{
                    background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                    whiteSpace: 'nowrap', flexShrink: 0
                  }}>
                    {cfg.label}
                  </span>
                </div>

                {/* Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                  <div style={detailBox}>
                    <span style={detailLabel}>Requested On</span>
                    <span style={detailValue}>{formatDate(dr.requestedAt)}</span>
                  </div>
                  {dr.permanentDeleteAt && (
                    <div style={{ ...detailBox, background: daysLeft(dr.permanentDeleteAt) <= 7 ? '#fef2f2' : '#f8fafc', borderColor: daysLeft(dr.permanentDeleteAt) <= 7 ? '#fecaca' : '#e2e8f0' }}>
                      <span style={detailLabel}>Permanent Delete</span>
                      <span style={{ ...detailValue, color: daysLeft(dr.permanentDeleteAt) <= 7 ? '#dc2626' : '#1e293b' }}>
                        {formatDate(dr.permanentDeleteAt)} ({daysLeft(dr.permanentDeleteAt)}d left)
                      </span>
                    </div>
                  )}
                  {dr.rejectionReason && (
                    <div style={detailBox}>
                      <span style={detailLabel}>Rejection Reason</span>
                      <span style={detailValue}>{dr.rejectionReason}</span>
                    </div>
                  )}
                </div>

                {/* Reason */}
                {dr.reason && (
                  <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', borderLeft: '3px solid #cbd5e1' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>Reason given by tenant:</p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#374151' }}>{dr.reason}</p>
                  </div>
                )}

                {/* Action Buttons */}
                {dr.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleApprove(tenant._id, tenant.organizationName)}
                      disabled={isActioning}
                      style={{
                        flex: isMobile ? '1 1 auto' : '0 0 auto',
                        padding: '10px 22px',
                        background: isActioning ? '#9ca3af' : '#dc2626',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: isActioning ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isActioning ? 'Processing...' : '✅ Approve Deletion'}
                    </button>
                    <button
                      onClick={() => { setRejectModal({ tenantId: tenant._id, orgName: tenant.organizationName }); setRejectReason(''); }}
                      disabled={isActioning}
                      style={{
                        flex: isMobile ? '1 1 auto' : '0 0 auto',
                        padding: '10px 22px',
                        background: '#fff',
                        border: '1.5px solid #dc2626',
                        borderRadius: '8px',
                        color: '#dc2626',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: isActioning ? 'not-allowed' : 'pointer'
                      }}
                    >
                      ❌ Reject Request
                    </button>
                  </div>
                )}

                {dr.status === 'approved' && (
                  <button
                    onClick={() => handleRecover(tenant._id, tenant.organizationName)}
                    disabled={isActioning}
                    style={{
                      padding: '10px 22px',
                      background: isActioning ? '#9ca3af' : '#16a34a',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: isActioning ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isActioning ? 'Processing...' : '🔄 Recover Account'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '28px', maxWidth: '440px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>❌</div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#1e293b' }}>Reject Deletion Request</h3>
              <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b' }}>
                Rejecting request for <strong>{rejectModal.orgName}</strong>. Tenant will be notified via email.
              </p>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                Reason for rejection (optional)
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Explain why the request is being rejected..."
                rows={3}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                style={{ flex: 1, padding: '11px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', color: '#374151' }}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading === rejectModal.tenantId}
                style={{ flex: 1, padding: '11px', background: '#dc2626', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', color: '#fff' }}
              >
                {actionLoading === rejectModal.tenantId ? 'Rejecting...' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SaasLayout>
  );
};

const detailBox = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '10px 14px'
};

const detailLabel = {
  display: 'block',
  fontSize: '11px',
  fontWeight: '600',
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '4px'
};

const detailValue = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '600',
  color: '#1e293b'
};

export default SaasNotifications;
