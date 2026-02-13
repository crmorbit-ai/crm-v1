import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_URL } from '../config/api.config';
import SaasLayout, { StatCard, Card, Badge, Button, Modal, Select, Input, DetailPanel, InfoRow } from '../components/layout/SaasLayout';

const ResellerManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allResellers, setAllResellers] = useState([]);
  const [selectedReseller, setSelectedReseller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [actionData, setActionData] = useState({ status: '', commissionRate: '' });

  useEffect(() => {
    fetchResellers();
  }, []);

  // Sync filter with URL params
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam && statusParam !== filterStatus) {
      setFilterStatus(statusParam);
    }
  }, [searchParams]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus]);

  const fetchResellers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/resellers`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      if (data.success) setAllResellers(data.data.resellers || []);
    } catch (error) {
      console.error('Error fetching resellers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilter = (status) => {
    setFilterStatus(status);
    if (status !== 'all') {
      setSearchParams({ status });
    } else {
      setSearchParams({});
    }
  };

  const fetchResellerDetails = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/resellers/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      if (data.success) setSelectedReseller(data.data);
    } catch (error) {
      console.error('Error fetching reseller details:', error);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/resellers/${selectedReseller.reseller._id}/status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: actionData.status })
      });
      const data = await response.json();
      if (data.success) {
        alert(`Reseller ${actionData.status} successfully`);
        setShowModal(false);
        fetchResellers();
        setSelectedReseller(null);
      }
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const handleCommissionUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/resellers/${selectedReseller.reseller._id}/commission`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionRate: parseFloat(actionData.commissionRate) })
      });
      const data = await response.json();
      if (data.success) {
        alert('Commission rate updated successfully');
        setShowModal(false);
        fetchResellerDetails(selectedReseller.reseller._id);
      }
    } catch (error) {
      alert('Failed to update commission');
    }
  };

  const openModal = (type, reseller = null) => {
    setModalType(type);
    if (reseller) setActionData({ status: reseller.status, commissionRate: reseller.commissionRate });
    setShowModal(true);
  };

  const getStatusVariant = (status) => {
    const map = { pending: 'warning', approved: 'success', rejected: 'danger', suspended: 'default' };
    return map[status] || 'default';
  };

  // Calculate stats from all resellers
  const stats = {
    total: allResellers.length,
    approved: allResellers.filter(r => r.status === 'approved').length,
    pending: allResellers.filter(r => r.status === 'pending').length,
    suspended: allResellers.filter(r => r.status === 'suspended').length,
    totalRevenue: allResellers.reduce((sum, r) => sum + (r.stats?.monthlyCommission || 0), 0)
  };

  // Filter resellers based on status
  const filteredResellers = allResellers.filter(r => {
    return filterStatus === 'all' || r.status === filterStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredResellers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedResellers = filteredResellers.slice(startIndex, startIndex + pageSize);

  return (
    <SaasLayout title="Reseller Management">
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
        <StatCard icon="🤝" value={stats.total} label="Total" onClick={() => handleStatusFilter('all')} active={filterStatus === 'all'} />
        <StatCard icon="✅" value={stats.approved} label="Approved" onClick={() => handleStatusFilter('approved')} active={filterStatus === 'approved'} />
        <StatCard icon="⏳" value={stats.pending} label="Pending" onClick={() => handleStatusFilter('pending')} active={filterStatus === 'pending'} />
        <StatCard icon="🚫" value={stats.suspended} label="Suspended" onClick={() => handleStatusFilter('suspended')} active={filterStatus === 'suspended'} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading...</div>
      ) : (
        /* Main Content - Split View */
        <div style={{ display: 'flex', gap: '16px', height: 'calc(100vh - 280px)', minHeight: '500px' }}>
          {/* Left Panel - List */}
          <div style={{ flex: selectedReseller ? '0 0 55%' : '1', display: 'flex', flexDirection: 'column' }}>
            {/* Filter Tabs */}
            <Card>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                {['all', 'pending', 'approved', 'suspended'].map((status) => (
                  <Button
                    key={status}
                    size="small"
                    variant={filterStatus === status ? 'primary' : 'secondary'}
                    onClick={() => handleStatusFilter(status)}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {status}
                  </Button>
                ))}
                {filterStatus !== 'all' && (
                  <button
                    onClick={() => handleStatusFilter('all')}
                    style={{
                      background: '#fee2e2',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      color: '#dc2626',
                      fontWeight: '500',
                      marginLeft: '8px'
                    }}
                  >
                    ✕ Clear
                  </button>
                )}
              </div>
            </Card>

            {/* Resellers List */}
            <Card title={`Resellers (${filteredResellers.length})`} noPadding style={{ flex: 1, marginTop: '12px', overflow: 'hidden' }}>
              <div style={{ height: '100%', overflow: 'auto' }}>
                {paginatedResellers.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {paginatedResellers.map((reseller) => (
                      <div
                        key={reseller._id}
                        onClick={() => fetchResellerDetails(reseller._id)}
                        style={{
                          padding: '12px 14px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f1f5f9',
                          background: selectedReseller?.reseller._id === reseller._id ? '#eff6ff' : 'transparent',
                          borderLeft: selectedReseller?.reseller._id === reseller._id ? '3px solid #3b82f6' : '3px solid transparent',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => { if (selectedReseller?.reseller._id !== reseller._id) e.currentTarget.style.background = '#f8fafc'; }}
                        onMouseLeave={(e) => { if (selectedReseller?.reseller._id !== reseller._id) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '600',
                              fontSize: '12px'
                            }}>
                              {reseller.firstName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '13px' }}>
                                {reseller.firstName} {reseller.lastName}
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>{reseller.companyName}</div>
                            </div>
                          </div>
                          <Badge variant={getStatusVariant(reseller.status)}>{reseller.status}</Badge>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#64748b', paddingLeft: '40px' }}>
                          <span><strong style={{ color: '#1e293b' }}>{reseller.stats?.totalTenants || 0}</strong> Clients</span>
                          <span><strong style={{ color: '#8b5cf6' }}>₹{reseller.stats?.monthlyCommission?.toLocaleString() || 0}</strong>/mo</span>
                          <span>{reseller.commissionRate}% rate</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🤝</div>
                    <div style={{ fontSize: '12px' }}>No resellers found</div>
                  </div>
                )}
              </div>
            </Card>

            {/* Pagination */}
            {filteredResellers.length > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '12px',
                padding: '10px 14px',
                background: '#fff',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Showing {startIndex + 1}-{Math.min(startIndex + pageSize, filteredResellers.length)} of {filteredResellers.length}
                  {filterStatus !== 'all' && ` (${filterStatus})`}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#1e293b' }}>
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
            )}
          </div>

          {/* Right Panel - Detail */}
          {selectedReseller && (
            <DetailPanel
              title={`${selectedReseller.reseller.firstName} ${selectedReseller.reseller.lastName}`}
              onClose={() => setSelectedReseller(null)}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
                paddingBottom: '16px',
                borderBottom: '1px solid #e2e8f0'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '20px',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                }}>
                  {selectedReseller.reseller.firstName?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                    {selectedReseller.reseller.companyName || 'No Company'}
                  </h3>
                  <Badge variant={getStatusVariant(selectedReseller.reseller.status)}>
                    {selectedReseller.reseller.status}
                  </Badge>
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>{selectedReseller.stats.totalTenants}</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Clients</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>₹{selectedReseller.stats.totalMonthlyRevenue?.toLocaleString() || 0}</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Revenue</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>₹{selectedReseller.stats.monthlyCommission?.toLocaleString() || 0}</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Commission</div>
                </div>
              </div>

              {/* Contact Info */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Contact Info
                </h4>
                <div style={{ background: '#f8fafc', borderRadius: '6px', padding: '10px' }}>
                  <InfoRow label="Email" value={selectedReseller.reseller.email} />
                  <InfoRow label="Phone" value={selectedReseller.reseller.phone} />
                  <InfoRow label="Commission Rate" value={`${selectedReseller.reseller.commissionRate}%`} />
                </div>
              </div>

              {/* Referral Link */}
              {selectedReseller.reseller.status === 'approved' && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Referral Link
                  </h4>
                  <div style={{ background: '#eff6ff', borderRadius: '6px', padding: '10px', border: '1px solid #bfdbfe' }}>
                    <div style={{
                      padding: '6px 8px',
                      background: '#fff',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                      marginBottom: '8px',
                      color: '#475569'
                    }}>
                      {`${window.location.origin}/register?ref=${selectedReseller.reseller._id}`}
                    </div>
                    <Button
                      size="small"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/register?ref=${selectedReseller.reseller._id}`);
                        alert('Referral link copied!');
                      }}
                    >
                      Copy Link
                    </Button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <Button size="small" onClick={() => openModal('status', selectedReseller.reseller)} style={{ flex: 1 }}>
                  Change Status
                </Button>
                <Button size="small" variant="secondary" onClick={() => openModal('commission', selectedReseller.reseller)} style={{ flex: 1 }}>
                  Update Rate
                </Button>
              </div>

              {/* Clients */}
              <div>
                <h4 style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Clients ({selectedReseller.tenants.length})
                </h4>
                {selectedReseller.tenants.length > 0 ? (
                  <div style={{ background: '#f8fafc', borderRadius: '6px', overflow: 'hidden' }}>
                    {selectedReseller.tenants.map((tenant, idx) => (
                      <div
                        key={tenant.id}
                        style={{
                          padding: '10px 12px',
                          borderBottom: idx < selectedReseller.tenants.length - 1 ? '1px solid #e2e8f0' : 'none',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>
                            {tenant.organizationName}
                            {!tenant.isActive && <span style={{ color: '#ef4444', fontSize: '10px', marginLeft: '4px' }}>(Inactive)</span>}
                          </div>
                          <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'capitalize' }}>{tenant.planType}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>₹{tenant.monthlySubscription?.toLocaleString() || 0}</div>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#8b5cf6' }}>₹{tenant.monthlyCommission?.toLocaleString() || 0}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '6px', color: '#64748b', fontSize: '11px' }}>
                    No clients yet
                  </div>
                )}
              </div>
            </DetailPanel>
          )}
        </div>
      )}

      {/* Modal */}
      <Modal
        show={showModal}
        title={modalType === 'status' ? 'Change Status' : 'Update Commission Rate'}
        onClose={() => setShowModal(false)}
      >
        {modalType === 'status' ? (
          <Select
            label="Select Status"
            value={actionData.status}
            onChange={(e) => setActionData({ ...actionData, status: e.target.value })}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'suspended', label: 'Suspended' }
            ]}
          />
        ) : (
          <Input
            label="Commission Rate (%)"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={actionData.commissionRate}
            onChange={(e) => setActionData({ ...actionData, commissionRate: e.target.value })}
          />
        )}
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <Button variant="secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</Button>
          <Button onClick={modalType === 'status' ? handleStatusUpdate : handleCommissionUpdate} style={{ flex: 1 }}>Update</Button>
        </div>
      </Modal>
    </SaasLayout>
  );
};

export default ResellerManagement;
