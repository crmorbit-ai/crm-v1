import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { roleService } from '../services/roleService';
import { subscriptionService } from '../services/subscriptionService';
import DashboardLayout from '../components/layout/DashboardLayout';
import '../styles/crm.css';

const Users = () => {
  const { user, hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    userType: 'TENANT_USER',
    phone: '',
    roles: []
  });

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await userService.getUsers({
        page: pagination.page,
        limit: pagination.limit
      });
      setUsers(response.users);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
        pages: response.pagination.pages
      }));
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  const loadRoles = useCallback(async () => {
    try {
      const response = await roleService.getRoles({ limit: 100 });
      setAllRoles(response.roles || []);
    } catch (err) {
      console.error('Failed to load roles:', err);
    }
  }, []);

  // Load users and roles on mount and when page changes
  useEffect(() => {
    loadUsers();
    loadRoles();
  }, [pagination.page, loadUsers, loadRoles]);

  const loadSubscriptionInfo = async () => {
    try {
      setLoadingSubscription(true);
      const response = await subscriptionService.getCurrentSubscription();
      // Response structure: { success, message, data: { subscription, usage, ... } }
      console.log('🔍 Full API Response:', response);
      console.log('📊 Subscription Data:', response.data);
      console.log('📝 Plan Name:', response.data?.subscription?.planName);
      console.log('💡 Plan Object:', response.data?.subscription?.plan);
      console.log('👥 Current Users:', response.data?.usage?.users);
      setSubscriptionInfo(response.data); // Use response.data instead of response
    } catch (err) {
      console.error('Failed to load subscription info:', err);
      setSubscriptionInfo(null);
    } finally {
      setLoadingSubscription(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await userService.createUser({
        ...formData,
        tenant: user.tenant?._id
      });
      setSuccess('User created successfully!');
      setShowCreateModal(false);
      resetForm();
      loadUsers();
      loadSubscriptionInfo(); // Reload subscription to update usage count
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create user');
      // Keep modal open on error so user can see the error message
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await userService.updateUser(selectedUser._id, formData);
      setSuccess('User updated successfully!');
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    try {
      setError('');
      await userService.deleteUser(selectedUser._id);
      setSuccess('User deleted successfully!');
      setShowDeleteModal(false);
      setSelectedUser(null);
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
      phone: user.phone || '',
      password: '', // Don't populate password
      roles: user.roles?.map(r => r._id) || []
    });
    setShowEditModal(true);
  };

  const openPermissionsModal = (user) => {
    setSelectedUser(user);
    setShowPermissionsModal(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      userType: 'TENANT_USER',
      phone: '',
      roles: []
    });
  };

  const handleRoleToggle = (roleId) => {
    setFormData(prev => {
      const roles = [...prev.roles];
      const index = roles.indexOf(roleId);
      if (index === -1) {
        roles.push(roleId);
      } else {
        roles.splice(index, 1);
      }
      return { ...prev, roles };
    });
  };

  const handleChange = (e) => {
    setError(''); // Clear errors when user types
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const openCreateModal = () => {
    setShowCreateModal(true);
    setError('');
    setSuccess('');
    loadSubscriptionInfo(); // Load subscription info when opening modal
  };

  const getUserTypeLabel = (type) => {
    return type.replace(/_/g, ' ');
  };

  const canCreateUser = hasPermission('user_management', 'create');
  const canUpdateUser = hasPermission('user_management', 'update');
  const canDeleteUser = hasPermission('user_management', 'delete');

  return (
    <DashboardLayout title="User Management">
      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Action Bar */}
      <div className="crm-card" style={{ marginBottom: '16px' }}>
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e3c72' }}>User Management</h3>
          {canCreateUser && (
            <button className="crm-btn crm-btn-primary" onClick={openCreateModal}>+ New User</button>
          )}
        </div>
      </div>

      {/* Inline Create User Form */}
      {showCreateModal && (
        <div className="crm-card" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e3c72' }}>Create New User</h3>
            <button onClick={() => { setShowCreateModal(false); resetForm(); setError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}>✕</button>
          </div>
          <div style={{ padding: '16px' }}>
            {/* Subscription Info */}
            {loadingSubscription ? (
              <div style={{ padding: '12px', background: '#f3f4f6', borderRadius: '8px', marginBottom: '16px', textAlign: 'center', fontSize: '13px', color: '#666' }}>Loading subscription info...</div>
            ) : subscriptionInfo && (
              <div style={{ padding: '12px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '8px', marginBottom: '16px', color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>Plan: {subscriptionInfo.subscription?.planName || 'Free'}</span>
                  <span>Users: {subscriptionInfo.usage?.users || 0} / {subscriptionInfo.subscription?.plan?.limits?.users === -1 ? '∞' : subscriptionInfo.subscription?.plan?.limits?.users || 5}</span>
                </div>
              </div>
            )}
            <form onSubmit={handleCreateUser}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>First Name *</label>
                  <input type="text" name="firstName" className="crm-form-input" value={formData.firstName} onChange={handleChange} required style={{ padding: '8px 10px', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Last Name *</label>
                  <input type="text" name="lastName" className="crm-form-input" value={formData.lastName} onChange={handleChange} required style={{ padding: '8px 10px', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Email *</label>
                  <input type="email" name="email" className="crm-form-input" value={formData.email} onChange={handleChange} required style={{ padding: '8px 10px', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Password *</label>
                  <input type="password" name="password" className="crm-form-input" value={formData.password} onChange={handleChange} required minLength={6} style={{ padding: '8px 10px', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>User Type *</label>
                  <select name="userType" className="crm-form-select" value={formData.userType} onChange={handleChange} style={{ padding: '8px 10px', fontSize: '13px' }}>
                    <option value="TENANT_USER">Tenant User</option>
                    <option value="TENANT_MANAGER">Tenant Manager</option>
                    {user?.userType === 'TENANT_ADMIN' && <option value="TENANT_ADMIN">Tenant Admin</option>}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Phone</label>
                  <input type="tel" name="phone" className="crm-form-input" value={formData.phone} onChange={handleChange} style={{ padding: '8px 10px', fontSize: '13px' }} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Assign Roles</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '60px', overflowY: 'auto', padding: '4px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                    {allRoles.length === 0 ? <span style={{ fontSize: '12px', color: '#999' }}>No roles available</span> : allRoles.map(role => (
                      <label key={role._id} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={formData.roles.includes(role._id)} onChange={() => handleRoleToggle(role._id)} />
                        {role.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                <button type="button" className="crm-btn crm-btn-outline" onClick={() => { setShowCreateModal(false); resetForm(); setError(''); }}>Cancel</button>
                <button type="submit" className="crm-btn crm-btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inline Edit User Form */}
      {showEditModal && selectedUser && (
        <div className="crm-card" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e3c72' }}>Edit User: {selectedUser.firstName} {selectedUser.lastName}</h3>
            <button onClick={() => { setShowEditModal(false); setSelectedUser(null); resetForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}>✕</button>
          </div>
          <div style={{ padding: '16px' }}>
            <form onSubmit={handleUpdateUser}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>First Name *</label>
                  <input type="text" name="firstName" className="crm-form-input" value={formData.firstName} onChange={handleChange} required style={{ padding: '8px 10px', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Last Name *</label>
                  <input type="text" name="lastName" className="crm-form-input" value={formData.lastName} onChange={handleChange} required style={{ padding: '8px 10px', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Phone</label>
                  <input type="tel" name="phone" className="crm-form-input" value={formData.phone} onChange={handleChange} style={{ padding: '8px 10px', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>User Type *</label>
                  <select name="userType" className="crm-form-select" value={formData.userType} onChange={handleChange} style={{ padding: '8px 10px', fontSize: '13px' }}>
                    <option value="TENANT_USER">Tenant User</option>
                    <option value="TENANT_MANAGER">Tenant Manager</option>
                    {user?.userType === 'TENANT_ADMIN' && <option value="TENANT_ADMIN">Tenant Admin</option>}
                  </select>
                </div>
                <div style={{ gridColumn: 'span 4' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Assign Roles</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                    {allRoles.length === 0 ? <span style={{ fontSize: '12px', color: '#999' }}>No roles available</span> : allRoles.map(role => (
                      <label key={role._id} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={formData.roles.includes(role._id)} onChange={() => handleRoleToggle(role._id)} />
                        {role.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                <button type="button" className="crm-btn crm-btn-outline" onClick={() => { setShowEditModal(false); setSelectedUser(null); resetForm(); }}>Cancel</button>
                <button type="submit" className="crm-btn crm-btn-primary">Update User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inline Delete Confirmation */}
      {showDeleteModal && selectedUser && (
        <div className="crm-card" style={{ marginBottom: '16px', border: '2px solid #FCA5A5' }}>
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px 0', color: '#991B1B' }}>Delete User: {selectedUser.firstName} {selectedUser.lastName}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>{selectedUser.email} - This action cannot be undone.</p>
              </div>
              <button className="crm-btn crm-btn-outline" onClick={() => { setShowDeleteModal(false); setSelectedUser(null); }}>Cancel</button>
              <button className="crm-btn crm-btn-danger" onClick={handleDeleteUser}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Permissions View */}
      {showPermissionsModal && selectedUser && (
        <div className="crm-card" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e3c72' }}>Permissions - {selectedUser.firstName} {selectedUser.lastName}</h3>
            <button onClick={() => { setShowPermissionsModal(false); setSelectedUser(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}>✕</button>
          </div>
          <div style={{ padding: '16px', maxHeight: '400px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px' }}><strong>Email:</strong> {selectedUser.email}</span>
              <span className="badge badge-info">{selectedUser.userType?.replace(/_/g, ' ')}</span>
              <span className={`badge ${selectedUser.isActive ? 'badge-success' : 'badge-danger'}`}>{selectedUser.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <h4 style={{ fontSize: '14px', marginBottom: '12px' }}>Assigned Roles ({selectedUser.roles?.length || 0})</h4>
            {selectedUser.roles?.length > 0 ? (
              <div style={{ display: 'grid', gap: '8px' }}>
                {selectedUser.roles.map(role => (
                  <div key={role._id} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong>{role.name}</strong>
                      <span className={`badge ${role.roleType === 'system' ? 'badge-info' : 'badge-warning'}`}>{role.roleType}</span>
                    </div>
                    {role.permissions?.length > 0 && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {role.permissions.map((perm, idx) => (
                          <span key={idx} style={{ display: 'inline-block', marginRight: '8px' }}>
                            {perm.feature.replace(/_/g, ' ')}: {perm.actions.join(', ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : <p style={{ color: '#999', fontSize: '13px' }}>No roles assigned</p>}
          </div>
        </div>
      )}

      <div className="crm-card">
        <div className="crm-card-header">
          <h2 className="crm-card-title">All Users ({pagination.total})</h2>
        </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
                <p style={{ marginTop: '10px' }}>Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                <p>No users found. Create your first user!</p>
              </div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table className="crm-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Roles</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u._id}>
                          <td>
                            <strong>{u.firstName} {u.lastName}</strong>
                          </td>
                          <td>{u.email}</td>
                          <td>
                            <span className="badge badge-info">
                              {getUserTypeLabel(u.userType)}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                              {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            {u.roles?.length > 0 ? (
                              <span>{u.roles.length} role(s)</span>
                            ) : (
                              <span style={{ color: '#999' }}>No roles</span>
                            )}
                          </td>
                          <td>
                            <div className="flex gap-10">
                              <button
                                className="crm-btn crm-btn-sm crm-btn-primary"
                                onClick={() => openPermissionsModal(u)}
                                title="View permissions"
                              >
                                Permissions
                              </button>
                              {canUpdateUser && (
                                <button
                                  className="crm-btn crm-btn-sm crm-btn-secondary"
                                  onClick={() => openEditModal(u)}
                                >
                                  Edit
                                </button>
                              )}
                              {canDeleteUser && u._id !== user._id && (
                                <button
                                  className="crm-btn crm-btn-sm crm-btn-danger"
                                  onClick={() => openDeleteModal(u)}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="pagination">
                    <button
                      className="crm-btn crm-btn-outline"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </button>
                    <span className="pagination-info">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                      className="crm-btn crm-btn-outline"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.pages}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
      </div>

    </DashboardLayout>
  );
};

export default Users;
