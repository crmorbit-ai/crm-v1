import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
import api from '../services/api';
import SaasLayout from '../components/layout/SaasLayout';

const SaasTenantUsers = () => {
  const { tenantId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastSuccess, setToastSuccess] = useState(true);

  // Deactivate modal
  const [deactivateModal, setDeactivateModal] = useState(false);
  const [deactivateUser, setDeactivateUser] = useState(null);
  const [deactivateReason, setDeactivateReason] = useState('');

  // Delete modal
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteUser, setDeleteUser] = useState(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading data for tenant:', tenantId);

      const [tenantRes, usersRes] = await Promise.all([
        api.get(`/tenants/${tenantId}`),
        userService.getUsers({ tenant: tenantId, limit: 1000 })
      ]);

      console.log('📦 Tenant response:', tenantRes.data);
      console.log('👥 Users response:', usersRes);
      console.log('👥 Users array:', usersRes?.users);

      setTenant(tenantRes.data?.data || null);
      setUsers(usersRes?.users || []);
    } catch (err) {
      console.error('❌ Failed to load data:', err);
      console.error('Error details:', err.response?.data);
      toast('Failed to load data', false);
    } finally {
      setLoading(false);
    }
  };

  const toast = (msg, success = true) => {
    setToastMsg(msg);
    setToastSuccess(success);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleDeactivate = async () => {
    if (!deactivateReason.trim()) {
      toast('Please provide a reason', false);
      return;
    }
    try {
      await userService.saasDeactivateUser(deactivateUser._id, deactivateReason);
      toast('User deactivated successfully');
      setDeactivateModal(false);
      setDeactivateUser(null);
      setDeactivateReason('');
      loadData();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to deactivate user', false);
    }
  };

  const handleReactivate = async (userId) => {
    try {
      await userService.saasReactivateUser(userId);
      toast('User reactivated successfully');
      loadData();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to reactivate user', false);
    }
  };

  const handlePermanentDelete = async () => {
    const fullName = `${deleteUser.firstName} ${deleteUser.lastName}`;
    if (deleteConfirmName !== fullName) {
      toast('Name does not match', false);
      return;
    }
    try {
      await userService.saasPermanentDeleteUser(deleteUser._id);
      toast('User permanently deleted');
      setDeleteModal(false);
      setDeleteUser(null);
      setDeleteConfirmName('');
      loadData();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to delete user', false);
    }
  };

  const filteredUsers = users.filter(u =>
    `${u.firstName} ${u.lastName} ${u.email} ${u.loginName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SaasLayout>
      {/* Toast */}
      {showToast && (
        <div style={{
          position: 'fixed',
          top: 18,
          right: 22,
          zIndex: 9999,
          padding: '11px 16px',
          borderRadius: 12,
          background: toastSuccess ? '#f0fdf4' : '#fff1f2',
          border: `1px solid ${toastSuccess ? '#86efac' : '#fca5a5'}`,
          color: toastSuccess ? '#15803d' : '#be123c',
          fontSize: 13,
          fontWeight: 600,
          boxShadow: '0 6px 24px rgba(0,0,0,0.1)'
        }}>
          {toastMsg}
        </div>
      )}

      <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => navigate('/saas/tenants')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#6366f1',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 12
            }}
          >
            ← Back to Tenants
          </button>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', marginBottom: 6 }}>
            {tenant?.organizationName || 'Loading...'}
          </h1>
          <p style={{ fontSize: 14, color: '#64748b' }}>
            Manage users for this organization
          </p>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="🔍 Search users..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              maxWidth: 400,
              padding: '10px 14px',
              border: '1.5px solid #e2e8f0',
              borderRadius: 9,
              fontSize: 14,
              outline: 'none'
            }}
          />
        </div>

        {/* Users Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
            No users found
          </div>
        ) : (
          <div style={{
            background: '#fff',
            border: '1.5px solid #e2e8f0',
            borderRadius: 12,
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>User</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email / Login</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, idx) => (
                  <tr key={u._id} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>
                        {u.firstName} {u.lastName}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>
                      {u.email || u.loginName || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        background: u.userType === 'TENANT_ADMIN' ? '#dbeafe' : '#f3f4f6',
                        color: u.userType === 'TENANT_ADMIN' ? '#1e40af' : '#374151'
                      }}>
                        {u.userType?.replace('TENANT_', '')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {u.isActive ? (
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          background: '#dcfce7',
                          color: '#166534'
                        }}>
                          Active
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          background: '#fee2e2',
                          color: '#991b1b'
                        }}>
                          Inactive
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        {u.isActive ? (
                          <>
                            <button
                              onClick={() => {
                                setDeactivateUser(u);
                                setDeactivateModal(true);
                              }}
                              style={{
                                padding: '6px 12px',
                                background: 'linear-gradient(135deg,#f97316,#ea580c)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Deactivate
                            </button>
                            <button
                              onClick={() => {
                                setDeleteUser(u);
                                setDeleteModal(true);
                              }}
                              style={{
                                padding: '6px 12px',
                                background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleReactivate(u._id)}
                            style={{
                              padding: '6px 12px',
                              background: 'linear-gradient(135deg,#10b981,#059669)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Deactivate Modal */}
      {deactivateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 14,
            padding: 24,
            width: '90%',
            maxWidth: 460,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
              Deactivate User
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
              Deactivating <b>{deactivateUser?.firstName} {deactivateUser?.lastName}</b>. Please provide a reason:
            </p>
            <textarea
              value={deactivateReason}
              onChange={e => setDeactivateReason(e.target.value)}
              placeholder="Reason for deactivation..."
              style={{
                width: '100%',
                minHeight: 80,
                padding: '10px 12px',
                border: '1.5px solid #e2e8f0',
                borderRadius: 9,
                fontSize: 13,
                resize: 'vertical',
                outline: 'none'
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                onClick={() => {
                  setDeactivateModal(false);
                  setDeactivateUser(null);
                  setDeactivateReason('');
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: 9,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: '#475569'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'linear-gradient(135deg,#f97316,#ea580c)',
                  border: 'none',
                  borderRadius: 9,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: '#fff'
                }}
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 14,
            padding: 24,
            width: '90%',
            maxWidth: 460,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#dc2626', marginBottom: 12 }}>
              ⚠️ Permanent Delete
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
              This action <b>CANNOT</b> be undone. This will permanently delete the user from the database.
            </p>
            <p style={{ fontSize: 13, color: '#0f172a', marginBottom: 12 }}>
              Type <b>{deleteUser?.firstName} {deleteUser?.lastName}</b> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmName}
              onChange={e => setDeleteConfirmName(e.target.value)}
              placeholder="Type full name to confirm"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1.5px solid #e2e8f0',
                borderRadius: 9,
                fontSize: 13,
                outline: 'none'
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                onClick={() => {
                  setDeleteModal(false);
                  setDeleteUser(null);
                  setDeleteConfirmName('');
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: 9,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: '#475569'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handlePermanentDelete}
                disabled={deleteConfirmName !== `${deleteUser?.firstName} ${deleteUser?.lastName}`}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: deleteConfirmName === `${deleteUser?.firstName} ${deleteUser?.lastName}`
                    ? 'linear-gradient(135deg,#dc2626,#b91c1c)'
                    : '#e2e8f0',
                  border: 'none',
                  borderRadius: 9,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: deleteConfirmName === `${deleteUser?.firstName} ${deleteUser?.lastName}` ? 'pointer' : 'not-allowed',
                  color: deleteConfirmName === `${deleteUser?.firstName} ${deleteUser?.lastName}` ? '#fff' : '#94a3b8'
                }}
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </SaasLayout>
  );
};

export default SaasTenantUsers;
