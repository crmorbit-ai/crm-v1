import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { roleService } from '../services/roleService';
import { subscriptionService } from '../services/subscriptionService';
import Modal from '../components/common/Modal';
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

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, [pagination.page, loadUsers, loadRoles]);

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
    <DashboardLayout
      title="User Management"
      actionButton={canCreateUser ? (
        <button className="crm-btn crm-btn-primary" onClick={openCreateModal}>
          + New User
        </button>
      ) : null}
    >
      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

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

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
          setError('');
          setSuccess('');
        }}
        title="Create New User"
      >
        <form onSubmit={handleCreateUser}>
          {/* Subscription Info Banner */}
          {loadingSubscription ? (
            <div style={{
              padding: '15px',
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <div className="spinner" style={{ width: '20px', height: '20px', margin: '0 auto' }}></div>
              <p style={{ marginTop: '8px', fontSize: '13px', color: '#666' }}>Loading subscription info...</p>
            </div>
          ) : subscriptionInfo ? (
            <div style={{
              padding: '15px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '8px',
              marginBottom: '20px',
              color: 'white'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>Current Plan</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    {subscriptionInfo.subscription?.planName
                      ? `${subscriptionInfo.subscription.planName} Plan`
                      : subscriptionInfo.subscription?.plan?.displayName
                      || subscriptionInfo.subscription?.plan?.name
                      || 'Free Plan'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>Users</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    {subscriptionInfo.usage?.users || 0} / {
                      (() => {
                        const limit = subscriptionInfo.subscription?.plan?.limits?.users;
                        if (limit === -1) return '∞';
                        if (limit) return limit;
                        // Fallback based on plan name
                        const planName = subscriptionInfo.subscription?.planName?.toLowerCase();
                        if (planName === 'basic') return 10;
                        if (planName === 'professional') return 25;
                        if (planName === 'enterprise') return '∞';
                        return 5; // Free plan default
                      })()
                    }
                  </div>
                </div>
              </div>
              {(() => {
                const limit = subscriptionInfo.subscription?.plan?.limits?.users;
                const userLimit = limit !== undefined ? limit :
                  (() => {
                    const planName = subscriptionInfo.subscription?.planName?.toLowerCase();
                    if (planName === 'basic') return 10;
                    if (planName === 'professional') return 25;
                    if (planName === 'enterprise') return -1;
                    return 5;
                  })();
                const currentUsers = subscriptionInfo.usage?.users || 0;

                return userLimit !== -1 ? (
                  <div style={{
                    marginTop: '10px',
                    fontSize: '12px',
                    opacity: 0.9,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>💡</span>
                    <span>
                      {userLimit - currentUsers} users remaining
                    </span>
                  </div>
                ) : null;
              })()}
            </div>
          ) : null}

          {/* Error/Success Messages inside Modal */}
          {error && (
            <div style={{
              padding: '12px 15px',
              background: '#fee',
              border: '1px solid #fcc',
              borderRadius: '6px',
              marginBottom: '15px',
              color: '#c33',
              fontSize: '14px'
            }}>
              ❌ {error}
            </div>
          )}
          {success && (
            <div style={{
              padding: '12px 15px',
              background: '#efe',
              border: '1px solid #cfc',
              borderRadius: '6px',
              marginBottom: '15px',
              color: '#3c3',
              fontSize: '14px'
            }}>
              ✅ {success}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input
                type="text"
                name="firstName"
                className="form-input"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input
                type="text"
                name="lastName"
                className="form-input"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email *</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">User Type *</label>
              <select
                name="userType"
                className="form-input"
                value={formData.userType}
                onChange={handleChange}
                required
              >
                <option value="TENANT_USER">Tenant User</option>
                <option value="TENANT_MANAGER">Tenant Manager</option>
                {user?.userType === 'TENANT_ADMIN' && (
                  <option value="TENANT_ADMIN">Tenant Admin</option>
                )}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Assign Roles</label>
            <div className="roles-selection">
              {allRoles.length === 0 ? (
                <p style={{ color: '#999', fontSize: '13px' }}>No roles available. Create roles first.</p>
              ) : (
                <div className="role-checkboxes">
                  {allRoles.map(role => (
                    <label key={role._id} className="role-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.roles.includes(role._id)}
                        onChange={() => handleRoleToggle(role._id)}
                      />
                      <div className="role-info">
                        <strong>{role.name}</strong>
                        {role.description && <span>{role.description}</span>}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
                setError('');
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create User
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
          resetForm();
          setError('');
        }}
        title="Edit User"
      >
        <form onSubmit={handleUpdateUser}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input
                type="text"
                name="firstName"
                className="form-input"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input
                type="text"
                name="lastName"
                className="form-input"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              type="tel"
              name="phone"
              className="form-input"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">User Type *</label>
            <select
              name="userType"
              className="form-input"
              value={formData.userType}
              onChange={handleChange}
              required
            >
              <option value="TENANT_USER">Tenant User</option>
              <option value="TENANT_MANAGER">Tenant Manager</option>
              {user?.userType === 'TENANT_ADMIN' && (
                <option value="TENANT_ADMIN">Tenant Admin</option>
              )}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Assign Roles</label>
            <div className="roles-selection">
              {allRoles.length === 0 ? (
                <p style={{ color: '#999', fontSize: '13px' }}>No roles available. Create roles first.</p>
              ) : (
                <div className="role-checkboxes">
                  {allRoles.map(role => (
                    <label key={role._id} className="role-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.roles.includes(role._id)}
                        onChange={() => handleRoleToggle(role._id)}
                      />
                      <div className="role-info">
                        <strong>{role.name}</strong>
                        {role.description && <span>{role.description}</span>}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setShowEditModal(false);
                setSelectedUser(null);
                resetForm();
                setError('');
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Update User
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        title="Delete User"
        size="small"
      >
        <div>
          <p>Are you sure you want to delete this user?</p>
          <p style={{ marginTop: '10px' }}>
            <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong><br />
            <span style={{ color: '#666' }}>{selectedUser?.email}</span>
          </p>
          <p style={{ marginTop: '15px', color: 'var(--error-color)', fontSize: '14px' }}>
            This action cannot be undone.
          </p>

          <div className="modal-footer">
            <button
              className="btn btn-outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedUser(null);
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={handleDeleteUser}
            >
              Delete User
            </button>
          </div>
        </div>
      </Modal>

      {/* View Permissions Modal */}
      <Modal
        isOpen={showPermissionsModal}
        onClose={() => {
          setShowPermissionsModal(false);
          setSelectedUser(null);
        }}
        title={`Permissions - ${selectedUser?.firstName} ${selectedUser?.lastName}`}
        size="large"
      >
        <div className="permissions-view">
          <div className="user-summary">
            <div className="summary-item">
              <span className="label">Email:</span>
              <span className="value">{selectedUser?.email}</span>
            </div>
            <div className="summary-item">
              <span className="label">User Type:</span>
              <span className="value badge badge-info">{selectedUser?.userType?.replace(/_/g, ' ')}</span>
            </div>
            <div className="summary-item">
              <span className="label">Status:</span>
              <span className={`value badge ${selectedUser?.isActive ? 'badge-success' : 'badge-danger'}`}>
                {selectedUser?.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div className="permissions-section">
            <h3>Assigned Roles ({selectedUser?.roles?.length || 0})</h3>
            {selectedUser?.roles?.length > 0 ? (
              <div className="roles-list">
                {selectedUser.roles.map(role => (
                  <div key={role._id} className="role-card">
                    <div className="role-header">
                      <strong>{role.name}</strong>
                      <span className={`badge ${role.roleType === 'system' ? 'badge-info' : 'badge-warning'}`}>
                        {role.roleType}
                      </span>
                    </div>
                    {role.description && (
                      <p className="role-description">{role.description}</p>
                    )}
                    <div className="role-permissions">
                      <strong>Permissions:</strong>
                      {role.permissions?.length > 0 ? (
                        <ul className="permission-list">
                          {role.permissions.map((perm, idx) => (
                            <li key={idx}>
                              <span className="feature-name">{perm.feature.replace(/_/g, ' ')}:</span>
                              <div className="actions-list">
                                {perm.actions.map((action, aidx) => (
                                  <span key={aidx} className="action-badge">{action}</span>
                                ))}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ color: '#999', fontSize: '13px', margin: '5px 0' }}>No permissions defined</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-roles">
                <p>This user has no roles assigned.</p>
                <p style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>
                  Assign roles to grant permissions. Users without roles have no access.
                </p>
              </div>
            )}
          </div>

          <div className="permissions-section">
            <h3>Permissions from Groups ({selectedUser?.groups?.length || 0})</h3>
            {selectedUser?.groups && selectedUser.groups.length > 0 ? (
              <div className="roles-list">
                {selectedUser.groups.map(group => (
                  <div key={group._id} className="role-card" style={{ borderLeft: '3px solid var(--secondary-color)' }}>
                    <div className="role-header">
                      <div>
                        <strong style={{ color: 'var(--secondary-color)' }}>Group: {group.name}</strong>
                        <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>
                          Members of this group inherit these permissions:
                        </p>
                      </div>
                      <span className="badge badge-info">{group.roles?.length || 0} role(s)</span>
                    </div>
                    {group.roles && group.roles.length > 0 ? (
                      group.roles.map(role => (
                        <div key={role._id} style={{ marginLeft: '15px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <strong style={{ fontSize: '14px' }}>{role.name}</strong>
                            <span className={`badge ${role.roleType === 'system' ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: '11px' }}>
                              {role.roleType}
                            </span>
                          </div>
                          {role.description && (
                            <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 10px 0' }}>{role.description}</p>
                          )}
                          <div className="role-permissions">
                            {role.permissions?.length > 0 ? (
                              <ul className="permission-list">
                                {role.permissions.map((perm, idx) => (
                                  <li key={idx}>
                                    <span className="feature-name">{perm.feature.replace(/_/g, ' ')}:</span>
                                    <div className="actions-list">
                                      {perm.actions.map((action, aidx) => (
                                        <span key={aidx} className="action-badge" style={{ backgroundColor: '#ffe3f2' }}>{action}</span>
                                      ))}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p style={{ color: '#999', fontSize: '12px', margin: '5px 0' }}>No permissions defined</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: '#999', fontSize: '13px', margin: '10px 0 0 15px' }}>No roles assigned to this group</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-roles">
                <p>This user is not a member of any groups.</p>
                <p style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>
                  Add user to groups to grant permissions through group roles.
                </p>
              </div>
            )}
          </div>

          <div className="permissions-guide">
            <h3>Permission Guide</h3>
            <div className="guide-grid">
              <div className="guide-item">
                <strong>create</strong>
                <span>Can create new records</span>
              </div>
              <div className="guide-item">
                <strong>read</strong>
                <span>Can view and list records</span>
              </div>
              <div className="guide-item">
                <strong>update</strong>
                <span>Can edit existing records</span>
              </div>
              <div className="guide-item">
                <strong>delete</strong>
                <span>Can remove records</span>
              </div>
              <div className="guide-item">
                <strong>manage</strong>
                <span>Full access (all actions)</span>
              </div>
            </div>
          </div>

          <div className="features-guide">
            <h3>Available Features</h3>
            <div className="feature-descriptions">
              <div className="feature-desc">
                <strong>user_management</strong>
                <p>Control over user accounts - create employees, edit profiles, delete users, assign roles</p>
              </div>
              <div className="feature-desc">
                <strong>role_management</strong>
                <p>Manage custom roles - define permissions, create roles, edit role settings</p>
              </div>
              <div className="feature-desc">
                <strong>group_management</strong>
                <p>Organize users - create groups, add/remove members, assign group roles</p>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="btn btn-outline"
              onClick={() => {
                setShowPermissionsModal(false);
                setSelectedUser(null);
              }}
            >
              Close
            </button>
            {canUpdateUser && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowPermissionsModal(false);
                  openEditModal(selectedUser);
                }}
              >
                Edit User
              </button>
            )}
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default Users;
