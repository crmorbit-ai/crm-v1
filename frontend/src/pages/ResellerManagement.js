import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { API_URL } from '../config/api.config';
import '../styles/dashboard.css';

const ResellerManagement = () => {
  const { user, logout } = useAuth();
  const [resellers, setResellers] = useState([]);
  const [selectedReseller, setSelectedReseller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [actionData, setActionData] = useState({ status: '', commissionRate: '' });

  useEffect(() => {
    fetchResellers();
  }, [filter]);

  const fetchResellers = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = filter === 'all'
        ? `${API_URL}/resellers`
        : `${API_URL}/resellers?status=${filter}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setResellers(data.data.resellers);
      }
    } catch (error) {
      console.error('Error fetching resellers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResellerDetails = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/resellers/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setSelectedReseller(data.data);
      }
    } catch (error) {
      console.error('Error fetching reseller details:', error);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/resellers/${selectedReseller.reseller._id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
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
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleCommissionUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/resellers/${selectedReseller.reseller._id}/commission`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ commissionRate: parseFloat(actionData.commissionRate) })
      });

      const data = await response.json();
      if (data.success) {
        alert('Commission rate updated successfully');
        setShowModal(false);
        fetchResellerDetails(selectedReseller.reseller._id);
      }
    } catch (error) {
      console.error('Error updating commission:', error);
      alert('Failed to update commission');
    }
  };

  const openModal = (type, reseller = null) => {
    setModalType(type);
    if (reseller) {
      setActionData({
        status: reseller.status,
        commissionRate: reseller.commissionRate
      });
    }
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#fff3cd', color: '#856404' },
      approved: { bg: '#d4edda', color: '#155724' },
      rejected: { bg: '#f8d7da', color: '#721c24' },
      suspended: { bg: '#e2e3e5', color: '#383d41' }
    };
    const style = styles[status] || styles.pending;
    return (
      <span style={{
        padding: '4px 12px',
        background: style.bg,
        color: style.color,
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        textTransform: 'capitalize'
      }}>
        {status}
      </span>
    );
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="container">
          <div className="flex-between">
            <h1>Reseller Management</h1>
            <div className="flex gap-10">
              <span>Welcome, {user?.firstName} {user?.lastName}</span>
              <button onClick={logout} className="btn btn-outline">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="dashboard-nav">
        <div className="container">
          <Link to="/saas/dashboard" className="nav-item">Dashboard</Link>
          <Link to="/saas/tenants" className="nav-item">Tenants</Link>
          <Link to="/saas/subscriptions" className="nav-item">Subscriptions</Link>
          <Link to="/saas/billings" className="nav-item">Billings</Link>
          <Link to="/saas/resellers" className="nav-item active">🤝 Resellers</Link>
        </div>
      </nav>

      <main className="dashboard-content">
        <div className="container">
          {loading ? (
            <p>Loading resellers...</p>
          ) : (
            <div style={{ display: 'flex', gap: '24px' }}>
              {/* Left Side - Resellers List */}
              <div style={{ flex: selectedReseller ? '0 0 400px' : '1' }}>
                {/* Filters */}
                <div style={{ marginBottom: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['all', 'pending', 'approved', 'suspended'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilter(status)}
                      className={filter === status ? 'btn btn-primary' : 'btn btn-outline'}
                      style={{ textTransform: 'capitalize' }}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                {/* Resellers Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {resellers.map((reseller) => (
                    <div
                      key={reseller._id}
                      onClick={() => fetchResellerDetails(reseller._id)}
                      className="card"
                      style={{
                        cursor: 'pointer',
                        border: selectedReseller?.reseller._id === reseller._id ? '2px solid #007bff' : '1px solid #dee2e6'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>
                            {reseller.firstName} {reseller.lastName}
                          </h3>
                          <p style={{ fontSize: '14px', color: '#6c757d', margin: 0 }}>
                            {reseller.companyName}
                          </p>
                        </div>
                        {getStatusBadge(reseller.status)}
                      </div>

                      <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6c757d' }}>
                        <div>
                          <span style={{ fontWeight: '600', color: '#212529' }}>
                            {reseller.stats?.totalTenants || 0}
                          </span> Clients
                        </div>
                        <div>
                          <span style={{ fontWeight: '600', color: '#8B5CF6' }}>
                            ₹{reseller.stats?.monthlyCommission?.toLocaleString() || 0}
                          </span> /mo
                        </div>
                        <div>
                          {reseller.commissionRate}% rate
                        </div>
                      </div>
                    </div>
                  ))}

                  {resellers.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤝</div>
                      <p style={{ color: '#6c757d' }}>No resellers found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side - Reseller Details */}
              {selectedReseller && (
                <div className="card" style={{ flex: '1' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #dee2e6' }}>
                    <div>
                      <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0' }}>
                        {selectedReseller.reseller.firstName} {selectedReseller.reseller.lastName}
                      </h2>
                      <p style={{ fontSize: '16px', color: '#6c757d', margin: 0 }}>
                        {selectedReseller.reseller.companyName}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedReseller(null)}
                      style={{
                        padding: '8px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '20px',
                        color: '#6c757d'
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                    <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
                      <p style={{ fontSize: '12px', color: '#6c757d', margin: '0 0 8px 0' }}>Total Clients</p>
                      <p style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>
                        {selectedReseller.stats.totalTenants}
                      </p>
                    </div>
                    <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
                      <p style={{ fontSize: '12px', color: '#6c757d', margin: '0 0 8px 0' }}>Monthly Revenue</p>
                      <p style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>
                        ₹{selectedReseller.stats.totalMonthlyRevenue?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
                      <p style={{ fontSize: '12px', color: '#6c757d', margin: '0 0 8px 0' }}>Commission</p>
                      <p style={{ fontSize: '24px', fontWeight: '700', color: '#8B5CF6', margin: 0 }}>
                        ₹{selectedReseller.stats.monthlyCommission?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                      Contact Information
                    </h3>
                    <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <span style={{ color: '#6c757d', minWidth: '100px' }}>Email:</span>
                        <span style={{ fontWeight: '500' }}>{selectedReseller.reseller.email}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <span style={{ color: '#6c757d', minWidth: '100px' }}>Phone:</span>
                        <span style={{ fontWeight: '500' }}>{selectedReseller.reseller.phone}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <span style={{ color: '#6c757d', minWidth: '100px' }}>Status:</span>
                        {getStatusBadge(selectedReseller.reseller.status)}
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <span style={{ color: '#6c757d', minWidth: '100px' }}>Commission:</span>
                        <span style={{ fontWeight: '600' }}>{selectedReseller.reseller.commissionRate}%</span>
                      </div>
                    </div>
                  </div>

                  {/* ============================================ */}
                  {/* 🚀 REFERRAL LINK - NEW */}
                  {/* ============================================ */}
                  {selectedReseller.reseller.status === 'approved' && (
                    <div style={{ 
                      marginBottom: '32px',
                      padding: '20px',
                      background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                      borderRadius: '12px',
                      border: '2px solid #3B82F6'
                    }}>
                      <h3 style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        marginBottom: '12px',
                        color: '#1E40AF'
                      }}>
                        🔗 Referral Link
                      </h3>
                      <p style={{ 
                        fontSize: '13px', 
                        color: '#1F2937', 
                        marginBottom: '12px' 
                      }}>
                        Share this link with potential clients. They will be automatically assigned to this reseller.
                      </p>
                      <div style={{
                        padding: '12px',
                        background: 'white',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        wordBreak: 'break-all',
                        marginBottom: '12px',
                        border: '1px solid #BFDBFE'
                      }}>
                        {`${window.location.origin}/register?ref=${selectedReseller.reseller._id}`}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}/register?ref=${selectedReseller.reseller._id}`
                          );
                          alert('✅ Referral link copied to clipboard!');
                        }}
                        style={{
                          padding: '10px 20px',
                          background: '#3B82F6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#2563EB'}
                        onMouseOut={(e) => e.target.style.background = '#3B82F6'}
                      >
                        📋 Copy Referral Link
                      </button>
                    </div>
                  )}
                  {/* ============================================ */}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
                    <button
                      onClick={() => openModal('status', selectedReseller.reseller)}
                      className="btn btn-primary"
                      style={{ flex: '1' }}
                    >
                      Change Status
                    </button>
                    <button
                      onClick={() => openModal('commission', selectedReseller.reseller)}
                      className="btn btn-secondary"
                      style={{ flex: '1' }}
                    >
                      Update Commission
                    </button>
                  </div>

                  {/* Clients Table */}
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                      Clients ({selectedReseller.tenants.length})
                    </h3>
                    {selectedReseller.tenants.length > 0 ? (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Organization</th>
                              <th>Plan</th>
                              <th style={{ textAlign: 'right' }}>Subscription</th>
                              <th style={{ textAlign: 'right' }}>Commission</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedReseller.tenants.map((tenant) => (
                              <tr key={tenant.id}>
                                <td>
                                  {tenant.organizationName}
                                  {!tenant.isActive && (
                                    <span style={{ marginLeft: '8px', fontSize: '12px', color: '#dc3545' }}>(Inactive)</span>
                                  )}
                                </td>
                                <td style={{ textTransform: 'capitalize' }}>
                                  {tenant.planType}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: '600' }}>
                                  ₹{tenant.monthlySubscription?.toLocaleString() || 0}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: '700', color: '#8B5CF6' }}>
                                  ₹{tenant.monthlyCommission?.toLocaleString() || 0}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '32px', background: '#f8f9fa', borderRadius: '8px' }}>
                        <p style={{ color: '#6c757d', margin: 0 }}>No clients yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div style={{
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
        }}>
          <div className="card" style={{ width: '400px', maxWidth: '90%' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>
              {modalType === 'status' ? 'Change Status' : 'Update Commission Rate'}
            </h3>

            {modalType === 'status' ? (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  Select Status
                </label>
                <select
                  value={actionData.status}
                  onChange={(e) => setActionData({ ...actionData, status: e.target.value })}
                  className="form-control"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            ) : (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  Commission Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={actionData.commissionRate}
                  onChange={(e) => setActionData({ ...actionData, commissionRate: e.target.value })}
                  className="form-control"
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-outline"
                style={{ flex: '1' }}
              >
                Cancel
              </button>
              <button
                onClick={modalType === 'status' ? handleStatusUpdate : handleCommissionUpdate}
                className="btn btn-primary"
                style={{ flex: '1' }}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResellerManagement;