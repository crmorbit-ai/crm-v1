import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { groupService } from '../services/groupService';
import { userService } from '../services/userService';
import { roleService } from '../services/roleService';
import DashboardLayout from '../components/layout/DashboardLayout';
import '../styles/crm.css';

const Groups = () => {
  const { user, logout, hasPermission } = useAuth();
  const [groups, setGroups] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Inline forms
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMembersForm, setShowMembersForm] = useState(false);
  const [showRolesForm, setShowRolesForm] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: ''
  });

  // Member management
  const [selectedMembers, setSelectedMembers] = useState([]);

  // Role management
  const [selectedRoles, setSelectedRoles] = useState([]);

  useEffect(() => {
    loadGroups();
    loadUsers();
    loadRoles();
  }, [pagination.page]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await groupService.getGroups({
        page: pagination.page,
        limit: pagination.limit
      });
      setGroups(response.groups);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
        pages: response.pagination.pages
      }));
    } catch (err) {
      setError(err.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userService.getUsers({ limit: 100 });
      setAllUsers(response.users);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await roleService.getRoles({ limit: 100 });
      setAllRoles(response.roles || []);
    } catch (err) {
      console.error('Failed to load roles:', err);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await groupService.createGroup(formData);
      setSuccess('Group created successfully!');
      setShowCreateForm(false);
      resetForm();
      loadGroups();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create group');
    }
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await groupService.updateGroup(selectedGroup._id, formData);
      setSuccess('Group updated successfully!');
      setShowEditForm(false);
      setSelectedGroup(null);
      resetForm();
      loadGroups();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update group');
    }
  };

  const handleDeleteGroup = async () => {
    try {
      setError('');
      await groupService.deleteGroup(selectedGroup._id);
      setSuccess('Group deleted successfully!');
      setShowDeleteConfirm(false);
      setSelectedGroup(null);
      loadGroups();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete group');
    }
  };

  const handleUpdateMembers = async () => {
    try {
      setError('');

      // Get current member IDs
      const currentMemberIds = selectedGroup.members.map(m => m._id);

      // Find members to add and remove
      const membersToAdd = selectedMembers.filter(id => !currentMemberIds.includes(id));
      const membersToRemove = currentMemberIds.filter(id => !selectedMembers.includes(id));

      // Add new members
      if (membersToAdd.length > 0) {
        await groupService.addMembers(selectedGroup._id, membersToAdd);
      }

      // Remove members
      if (membersToRemove.length > 0) {
        await groupService.removeMembers(selectedGroup._id, membersToRemove);
      }

      setSuccess('Group members updated successfully!');
      setShowMembersForm(false);
      setSelectedGroup(null);
      setSelectedMembers([]);
      loadGroups();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update members');
    }
  };

  const handleUpdateRoles = async () => {
    try {
      setError('');

      // Get current role IDs
      const currentRoleIds = selectedGroup.roles?.map(r => r._id) || [];

      // Find roles to add and remove
      const rolesToAdd = selectedRoles.filter(id => !currentRoleIds.includes(id));
      const rolesToRemove = currentRoleIds.filter(id => !selectedRoles.includes(id));

      // Add new roles
      if (rolesToAdd.length > 0) {
        await groupService.assignRoles(selectedGroup._id, rolesToAdd);
      }

      // Remove roles
      if (rolesToRemove.length > 0) {
        await groupService.removeRoles(selectedGroup._id, rolesToRemove);
      }

      setSuccess('Group roles updated successfully!');
      setShowRolesForm(false);
      setSelectedGroup(null);
      setSelectedRoles([]);
      loadGroups();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update roles');
    }
  };

  const closeAllForms = () => {
    setShowCreateForm(false);
    setShowEditForm(false);
    setShowDeleteConfirm(false);
    setShowMembersForm(false);
    setShowRolesForm(false);
    setSelectedGroup(null);
    setSelectedMembers([]);
    setSelectedRoles([]);
    resetForm();
  };

  const openEditForm = (group) => {
    closeAllForms();
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      slug: group.slug,
      description: group.description || ''
    });
    setShowEditForm(true);
  };

  const openDeleteConfirm = (group) => {
    closeAllForms();
    setSelectedGroup(group);
    setShowDeleteConfirm(true);
  };

  const openMembersForm = (group) => {
    closeAllForms();
    setSelectedGroup(group);
    setSelectedMembers(group.members.map(m => m._id));
    setShowMembersForm(true);
  };

  const openRolesForm = (group) => {
    closeAllForms();
    setSelectedGroup(group);
    setSelectedRoles(group.roles?.map(r => r._id) || []);
    setShowRolesForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-generate slug from name
    if (name === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleMemberToggle = (userId) => {
    setSelectedMembers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleRoleToggle = (roleId) => {
    setSelectedRoles(prev => {
      if (prev.includes(roleId)) {
        return prev.filter(id => id !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  };

  const canCreateGroup = hasPermission('group_management', 'create');
  const canUpdateGroup = hasPermission('group_management', 'update');
  const canDeleteGroup = hasPermission('group_management', 'delete');
  const canManageGroup = hasPermission('group_management', 'manage');

  return (
    <DashboardLayout title="Group Management">
      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Action Bar */}
      <div className="crm-card" style={{ marginBottom: '16px' }}>
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e3c72' }}>Group Management</h3>
          {canCreateGroup && (
            <button className="crm-btn crm-btn-primary" onClick={() => { closeAllForms(); setShowCreateForm(true); }}>+ New Group</button>
          )}
        </div>
      </div>

      {/* Inline Create Group Form */}
      {showCreateForm && (
        <div className="crm-card" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e3c72' }}>Create New Group</h3>
            <button onClick={closeAllForms} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}>✕</button>
          </div>
          <div style={{ padding: '16px' }}>
            <form onSubmit={handleCreateGroup}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Group Name *</label>
                  <input type="text" name="name" className="crm-form-input" placeholder="e.g., Engineering Team" value={formData.name} onChange={handleChange} required style={{ padding: '8px 10px', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Slug *</label>
                  <input type="text" name="slug" className="crm-form-input" placeholder="engineering-team" value={formData.slug} onChange={handleChange} required style={{ padding: '8px 10px', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Description</label>
                  <input type="text" name="description" className="crm-form-input" placeholder="Group description..." value={formData.description} onChange={handleChange} style={{ padding: '8px 10px', fontSize: '13px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                <button type="button" className="crm-btn crm-btn-outline" onClick={closeAllForms}>Cancel</button>
                <button type="submit" className="crm-btn crm-btn-primary">Create Group</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inline Edit Group Form */}
      {showEditForm && selectedGroup && (
        <div className="crm-card" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e3c72' }}>Edit Group: {selectedGroup.name}</h3>
            <button onClick={closeAllForms} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}>✕</button>
          </div>
          <div style={{ padding: '16px' }}>
            <form onSubmit={handleUpdateGroup}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Group Name *</label>
                  <input type="text" name="name" className="crm-form-input" value={formData.name} onChange={handleChange} required style={{ padding: '8px 10px', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Description</label>
                  <input type="text" name="description" className="crm-form-input" value={formData.description} onChange={handleChange} style={{ padding: '8px 10px', fontSize: '13px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                <button type="button" className="crm-btn crm-btn-outline" onClick={closeAllForms}>Cancel</button>
                <button type="submit" className="crm-btn crm-btn-primary">Update Group</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inline Manage Members Form */}
      {showMembersForm && selectedGroup && (
        <div className="crm-card" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e3c72' }}>Manage Members - {selectedGroup.name}</h3>
            <button onClick={closeAllForms} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}>✕</button>
          </div>
          <div style={{ padding: '16px' }}>
            <p style={{ marginBottom: '12px', color: '#666', fontSize: '13px' }}>Select users to add or remove from this group:</p>
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px' }}>
              {allUsers.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#999', padding: '20px', fontSize: '13px' }}>No users available</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {allUsers.map(u => (
                    <label key={u._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: selectedMembers.includes(u._id) ? '#dbeafe' : '#f9fafb', borderRadius: '6px', cursor: 'pointer', border: '1px solid #e5e7eb' }}>
                      <input type="checkbox" checked={selectedMembers.includes(u._id)} onChange={() => handleMemberToggle(u._id)} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '500' }}>{u.firstName} {u.lastName}</div>
                        <div style={{ fontSize: '11px', color: '#666' }}>{u.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
              <button type="button" className="crm-btn crm-btn-outline" onClick={closeAllForms}>Cancel</button>
              <button type="button" className="crm-btn crm-btn-primary" onClick={handleUpdateMembers}>Update Members ({selectedMembers.length})</button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Manage Roles Form */}
      {showRolesForm && selectedGroup && (
        <div className="crm-card" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e3c72' }}>Manage Roles - {selectedGroup.name}</h3>
            <button onClick={closeAllForms} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}>✕</button>
          </div>
          <div style={{ padding: '16px' }}>
            <p style={{ marginBottom: '12px', color: '#666', fontSize: '13px' }}>Select roles to assign to this group. All group members will inherit these permissions:</p>
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px' }}>
              {allRoles.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#999', padding: '20px', fontSize: '13px' }}>No roles available</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {allRoles.map(role => (
                    <label key={role._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: selectedRoles.includes(role._id) ? '#dbeafe' : '#f9fafb', borderRadius: '6px', cursor: 'pointer', border: '1px solid #e5e7eb' }}>
                      <input type="checkbox" checked={selectedRoles.includes(role._id)} onChange={() => handleRoleToggle(role._id)} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '500' }}>{role.name}</div>
                        {role.description && <div style={{ fontSize: '11px', color: '#666' }}>{role.description}</div>}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
              <button type="button" className="crm-btn crm-btn-outline" onClick={closeAllForms}>Cancel</button>
              <button type="button" className="crm-btn crm-btn-primary" onClick={handleUpdateRoles}>Update Roles ({selectedRoles.length})</button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Delete Confirmation */}
      {showDeleteConfirm && selectedGroup && (
        <div className="crm-card" style={{ marginBottom: '16px', border: '2px solid #FCA5A5' }}>
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px 0', color: '#991B1B' }}>Delete Group: {selectedGroup.name}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Members: {selectedGroup.members?.length || 0}. This action cannot be undone.</p>
              </div>
              <button className="crm-btn crm-btn-outline" onClick={closeAllForms}>Cancel</button>
              <button className="crm-btn crm-btn-danger" onClick={handleDeleteGroup}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="crm-card">
        <div className="crm-card-header">
          <h2 className="crm-card-title">All Groups ({pagination.total})</h2>
        </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
                <p style={{ marginTop: '10px' }}>Loading groups...</p>
              </div>
            ) : groups.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                <p>No groups found. Create your first group!</p>
              </div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table className="crm-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Slug</th>
                        <th>Members</th>
                        <th>Roles</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.map((group) => (
                        <tr key={group._id}>
                          <td>
                            <strong>{group.name}</strong>
                            {group.description && (
                              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                {group.description}
                              </div>
                            )}
                          </td>
                          <td><code>{group.slug}</code></td>
                          <td>
                            <span className="badge badge-info">
                              {group.members?.length || 0} member(s)
                            </span>
                          </td>
                          <td>
                            {group.roles?.length > 0 ? (
                              <span>{group.roles.length} role(s)</span>
                            ) : (
                              <span style={{ color: '#999' }}>No roles</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${group.isActive ? 'badge-success' : 'badge-danger'}`}>
                              {group.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="flex gap-10">
                              {canManageGroup && (
                                <>
                                  <button
                                    className="crm-btn crm-btn-sm crm-btn-primary"
                                    onClick={() => openMembersForm(group)}
                                  >
                                    Members
                                  </button>
                                  <button
                                    className="crm-btn crm-btn-sm crm-btn-primary"
                                    onClick={() => openRolesForm(group)}
                                  >
                                    Roles
                                  </button>
                                </>
                              )}
                              {canUpdateGroup && (
                                <button
                                  className="crm-btn crm-btn-sm crm-btn-secondary"
                                  onClick={() => openEditForm(group)}
                                >
                                  Edit
                                </button>
                              )}
                              {canDeleteGroup && (
                                <button
                                  className="crm-btn crm-btn-sm crm-btn-danger"
                                  onClick={() => openDeleteConfirm(group)}
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

export default Groups;
