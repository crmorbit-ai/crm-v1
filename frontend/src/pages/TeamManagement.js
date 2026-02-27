import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { roleService } from '../services/roleService';
import { groupService } from '../services/groupService';
import DashboardLayout from '../components/layout/DashboardLayout';

const FEATURES = [
  // Access Management
  { slug: 'user_management', name: 'Users', category: 'Access' },
  { slug: 'role_management', name: 'Roles', category: 'Access' },
  { slug: 'group_management', name: 'Groups', category: 'Access' },
  // CRM
  { slug: 'lead_management', name: 'Leads', category: 'CRM' },
  { slug: 'contact_management', name: 'Contacts', category: 'CRM' },
  { slug: 'account_management', name: 'Accounts', category: 'CRM' },
  { slug: 'opportunity_management', name: 'Opportunities', category: 'CRM' },
  { slug: 'data_center', name: 'Customers', category: 'CRM' },
  // Sales & Finance
  { slug: 'quotation_management', name: 'Quotations', category: 'Sales' },
  { slug: 'invoice_management', name: 'Invoices', category: 'Sales' },
  { slug: 'purchase_order_management', name: 'Purchase Orders', category: 'Sales' },
  { slug: 'rfi_management', name: 'RFI', category: 'Sales' },
  // Product
  { slug: 'product_management', name: 'Products', category: 'Product' },
  // Tasks
  { slug: 'task_management', name: 'Tasks', category: 'Tasks' },
  { slug: 'meeting_management', name: 'Meetings', category: 'Tasks' },
  { slug: 'call_management', name: 'Calls', category: 'Tasks' },
  { slug: 'email_management', name: 'Emails', category: 'Tasks' },
  // Account
  { slug: 'subscription_management', name: 'Subscription & Billing', category: 'Account' },
  // Customization
  { slug: 'field_management', name: 'Manage Fields', category: 'Customization' },
  // Data
  { slug: 'audit_logs', name: 'Audit Logs', category: 'Data' },
];
const ACTIONS = ['create', 'read', 'update', 'delete', 'manage', 'import', 'export'];

const TeamManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [groups, setGroups] = useState([]);

  const [showPanel, setShowPanel] = useState(false);
  const [panelMode, setPanelMode] = useState('user');
  const [editingItem, setEditingItem] = useState(null);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [userStep, setUserStep] = useState(1);
  const [subStep, setSubStep] = useState(null); // null | 'create-role' | 'create-group'
  const [quickRoleForm, setQuickRoleForm] = useState({ name: '', description: '', permissions: [], forUserTypes: ['TENANT_USER', 'TENANT_MANAGER'] });
  const [quickGroupForm, setQuickGroupForm] = useState({ name: '', description: '' });

  const [userForm, setUserForm] = useState({ firstName: '', lastName: '', email: '', password: '', userType: 'TENANT_USER', phone: '', loginName: '', department: '', viewingPin: '', roles: [], groups: [] });
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [roleForm, setRoleForm] = useState({ name: '', description: '', permissions: [], forUserTypes: ['TENANT_USER', 'TENANT_MANAGER'] });
  const [groupForm, setGroupForm] = useState({ name: '', description: '', members: [] });
  const [submitting, setSubmitting] = useState(false);

  const ALL_FEATURES = [
    'user_management', 'role_management', 'group_management',
    'lead_management', 'contact_management', 'account_management',
    'opportunity_management', 'data_center', 'quotation_management',
    'invoice_management', 'purchase_order_management', 'rfi_management',
    'product_management', 'task_management', 'meeting_management',
    'call_management', 'email_management', 'subscription_management',
    'field_management', 'audit_logs',
  ];

  const USER_PERMISSIONS = ALL_FEATURES.map(f => ({ feature: f, actions: ['read'] }));
  const MANAGER_PERMISSIONS = ALL_FEATURES.map(f => ({ feature: f, actions: ['create', 'read', 'update'] }));
  const ADMIN_PERMISSIONS = ALL_FEATURES.map(f => ({ feature: f, actions: ['create', 'read', 'update', 'delete', 'manage'] }));

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes, groupsRes] = await Promise.all([
        userService.getUsers({ limit: 100 }),
        roleService.getRoles({ limit: 100 }),
        groupService.getGroups({ limit: 100 })
      ]);
      setUsers(usersRes.users || []);
      const customRoles = (rolesRes.roles || []).filter(r => r.roleType !== 'system');
      const fetchedGroups = groupsRes.groups || [];

      // Auto-seed defaults: create if missing, update if exists (fixes wrong slugs)
      const existingUser    = customRoles.find(r => r.name === 'User');
      const existingManager = customRoles.find(r => r.name === 'Manager');
      const existingAdmin   = customRoles.find(r => r.name === 'Admin');
      const needsMonitoringGroup = !fetchedGroups.some(g => g.name === 'Monitoring Group');

      const seeds = [];

      const upsertRole = (existing, createData) => {
        if (existing) {
          return roleService.updateRole(existing._id, {
            permissions: createData.permissions,
            forUserTypes: createData.forUserTypes,
            level: createData.level,
          }).catch(() => {});
        }
        return roleService.createRole(createData).catch(() => {});
      };

      seeds.push(upsertRole(existingUser, {
        name: 'User',
        slug: 'user',
        description: 'Read-only access to all features',
        permissions: USER_PERMISSIONS,
        forUserTypes: ['TENANT_USER'],
        level: 10,
      }));
      seeds.push(upsertRole(existingManager, {
        name: 'Manager',
        slug: 'manager',
        description: 'Create, read and update access to all features',
        permissions: MANAGER_PERMISSIONS,
        forUserTypes: ['TENANT_USER', 'TENANT_MANAGER'],
        level: 50,
      }));
      seeds.push(upsertRole(existingAdmin, {
        name: 'Admin',
        slug: 'admin',
        description: 'Full access to all features',
        permissions: ADMIN_PERMISSIONS,
        forUserTypes: ['TENANT_USER', 'TENANT_MANAGER'],
        level: 100,
      }));
      if (needsMonitoringGroup) {
        seeds.push(
          groupService.createGroup({
            name: 'Monitoring Group',
            slug: 'monitoring-group',
            description: 'Default group for monitoring and oversight',
            members: [],
          }).catch(() => {})
        );
      }

      await Promise.all(seeds);
      // Re-fetch to get latest roles/groups after upsert
      const [rolesRes2, groupsRes2] = await Promise.all([
        roleService.getRoles({ limit: 100 }),
        groupService.getGroups({ limit: 100 })
      ]);
      setRoles((rolesRes2.roles || []).filter(r => r.roleType !== 'system'));
      setGroups(groupsRes2.groups || []);
    } catch (err) {
      if (err?.isPermissionDenied) return;
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const showMessage = (msg, isError = false) => {
    if (isError) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const closePanel = () => {
    setShowPanel(false);
    setEditingItem(null);
    setShowRoleDropdown(false);
    setShowGroupDropdown(false);
    setSubmitting(false);
    setUserStep(1);
    setSubStep(null);
  };

  const openUserPanel = (u = null) => {
    setPanelMode('user');
    setEditingItem(u);
    setUserStep(1);
    setSubStep(null);
    setShowRoleDropdown(false);
    setShowGroupDropdown(false);
    const userGroups = u ? groups.filter(g => g.members?.some(m => (m._id || m) === u._id)).map(g => g._id) : [];
    setShowPassword(false);
    setShowPin(false);
    setUserForm(u ? { firstName: u.firstName, lastName: u.lastName, email: u.email, password: '', userType: u.userType, phone: u.phone || '', loginName: u.loginName || '', department: u.department || '', viewingPin: '', roles: u.roles?.map(r => r._id) || [], groups: userGroups }
      : { firstName: '', lastName: '', email: '', password: '', userType: 'TENANT_USER', phone: '', loginName: '', department: '', viewingPin: '', roles: [], groups: [] });
    setShowPanel(true);
  };

  const openRolePanel = (r = null) => {
    setPanelMode('role');
    setEditingItem(r);
    setRoleForm(r ? { name: r.name, description: r.description || '', permissions: r.permissions || [], forUserTypes: r.forUserTypes || ['TENANT_USER', 'TENANT_MANAGER'] }
      : { name: '', description: '', permissions: [], forUserTypes: ['TENANT_USER', 'TENANT_MANAGER'] });
    setShowPanel(true);
  };

  const openGroupPanel = (g = null) => {
    setPanelMode('group');
    setEditingItem(g);
    setGroupForm(g ? { name: g.name, description: g.description || '', members: g.members?.map(m => m._id) || [] }
      : { name: '', description: '', members: [] });
    setShowPanel(true);
  };

  // Handlers
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      let userId;
      if (editingItem) {
        await userService.updateUser(editingItem._id, userForm);
        userId = editingItem._id;
        showMessage('User updated!');
      } else {
        const res = await userService.createUser({ ...userForm, tenant: user.tenant?._id });
        userId = res.user?._id || res._id;
        showMessage('User created!');
      }
      if (userId) {
        await userService.assignGroups(userId, userForm.groups);
      }
      closePanel();
      loadData();
    } catch (err) {
      if (err?.isPermissionDenied) return;
      showMessage(err.message || 'Error', true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Delete ${u.firstName}?`)) return;
    try {
      await userService.deleteUser(u._id);
      showMessage('Deleted!');
      loadData();
    } catch (err) { if (err?.isPermissionDenied) return; showMessage(err.message, true); }
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...roleForm,
        slug: roleForm.name.toLowerCase().replace(/\s+/g, '_'),
        forUserTypes: roleForm.forUserTypes || ['TENANT_USER', 'TENANT_MANAGER']
      };
      if (editingItem) {
        await roleService.updateRole(editingItem._id, data);
        showMessage('Role updated!');
      } else {
        await roleService.createRole(data);
        showMessage('Role created!');
      }
      closePanel();
      loadData();
    } catch (err) { if (err?.isPermissionDenied) return; showMessage(err.message, true); }
  };

  const handleDeleteRole = async (r) => {
    if (!window.confirm(`Delete "${r.name}"?`)) return;
    try {
      await roleService.deleteRole(r._id);
      showMessage('Deleted!');
      loadData();
    } catch (err) { if (err?.isPermissionDenied) return; showMessage(err.message, true); }
  };

  const togglePermission = (feature, action) => {
    setRoleForm(prev => {
      const perms = [...prev.permissions];
      const idx = perms.findIndex(p => p.feature === feature);
      if (idx === -1) perms.push({ feature, actions: [action] });
      else {
        const actions = [...perms[idx].actions];
        const aIdx = actions.indexOf(action);
        if (aIdx === -1) actions.push(action); else actions.splice(aIdx, 1);
        if (actions.length === 0) perms.splice(idx, 1);
        else perms[idx] = { ...perms[idx], actions };
      }
      return { ...prev, permissions: perms };
    });
  };

  const hasAction = (feature, action) => roleForm.permissions.find(p => p.feature === feature)?.actions?.includes(action) || false;

  const handleGroupSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...groupForm, slug: groupForm.name.toLowerCase().replace(/\s+/g, '_') };
      if (editingItem) {
        await groupService.updateGroup(editingItem._id, data);
        showMessage('Group updated!');
      } else {
        await groupService.createGroup(data);
        showMessage('Group created!');
      }
      closePanel();
      loadData();
    } catch (err) { if (err?.isPermissionDenied) return; showMessage(err.message, true); }
  };

  const handleDeleteGroup = async (g) => {
    if (!window.confirm(`Delete "${g.name}"?`)) return;
    try {
      await groupService.deleteGroup(g._id);
      showMessage('Deleted!');
      loadData();
    } catch (err) { if (err?.isPermissionDenied) return; showMessage(err.message, true); }
  };

  const getUserTypeLabel = (type) => {
    const labels = { 'TENANT_USER': 'Tenant User', 'TENANT_MANAGER': 'Tenant Manager', 'TENANT_ADMIN': 'Tenant Admin' };
    return labels[type] || type;
  };

  const handleNextStep = () => {
    if (!userForm.firstName.trim() || !userForm.lastName.trim() || !userForm.email.trim()) {
      showMessage('Please fill in all required fields', true); return;
    }
    if (!editingItem && userForm.password.length < 6) {
      showMessage('Password must be at least 6 characters', true); return;
    }
    setUserStep(2);
  };

  const toggleQuickPermission = (feature, action) => {
    setQuickRoleForm(prev => {
      const perms = [...prev.permissions];
      const idx = perms.findIndex(p => p.feature === feature);
      if (idx === -1) perms.push({ feature, actions: [action] });
      else {
        const actions = [...perms[idx].actions];
        const aIdx = actions.indexOf(action);
        if (aIdx === -1) actions.push(action); else actions.splice(aIdx, 1);
        if (actions.length === 0) perms.splice(idx, 1);
        else perms[idx] = { ...perms[idx], actions };
      }
      return { ...prev, permissions: perms };
    });
  };

  const hasQuickAction = (feature, action) => quickRoleForm.permissions.find(p => p.feature === feature)?.actions?.includes(action) || false;

  const handleQuickRoleCreate = async (e) => {
    e.preventDefault();
    try {
      const data = { ...quickRoleForm, slug: quickRoleForm.name.toLowerCase().replace(/\s+/g, '_') };
      const res = await roleService.createRole(data);
      const newId = res.role?._id || res._id;
      await loadData();
      if (newId) setUserForm(prev => ({ ...prev, roles: [...prev.roles, newId] }));
      setSubStep(null);
      setQuickRoleForm({ name: '', description: '', permissions: [], forUserTypes: ['TENANT_USER', 'TENANT_MANAGER'] });
      showMessage('Role created and selected!');
    } catch (err) { if (err?.isPermissionDenied) return; showMessage(err.message || 'Error', true); }
  };

  const handleQuickGroupCreate = async (e) => {
    e.preventDefault();
    try {
      const data = { ...quickGroupForm, slug: quickGroupForm.name.toLowerCase().replace(/\s+/g, '_') };
      const res = await groupService.createGroup(data);
      const newId = res.group?._id || res._id;
      await loadData();
      if (newId) setUserForm(prev => ({ ...prev, groups: [...prev.groups, newId] }));
      setSubStep(null);
      setQuickGroupForm({ name: '', description: '' });
      showMessage('Group created and selected!');
    } catch (err) { if (err?.isPermissionDenied) return; showMessage(err.message || 'Error', true); }
  };

  return (
    <DashboardLayout>
      {/* Responsive CSS */}
      <style>{`
        .tm-wrapper { display: flex; gap: 16px; padding: 16px; min-height: calc(100vh - 120px); }
        .tm-main { flex: 1; min-width: 0; }
        .tm-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
        .tm-table-wrapper { overflow-x: auto; }
        .tm-panel {
          width: 320px;
          background: linear-gradient(135deg, rgb(153, 255, 251) 0%, rgb(255, 255, 255) 100%);
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          max-height: calc(100vh - 140px);
          overflow: hidden;
        }
        @media (max-width: 768px) {
          .tm-wrapper { flex-direction: column; padding: 12px; }
          .tm-header { flex-direction: column; align-items: stretch; }
          .tm-header-left { flex-direction: column; text-align: center; }
          .tm-header-icon { margin: 0 auto; }
          .tm-subtitle { display: none; }
          .tm-add-btn { width: 100%; justify-content: center; }
          .tm-stats-grid { grid-template-columns: repeat(3, 1fr); gap: 8px; }
          .tm-stat-num { font-size: 18px; }
          .tm-panel {
            width: 100%;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            max-height: 100vh;
            z-index: 1000;
            border-radius: 0;
          }
          .tm-table { min-width: 600px; }
          .tm-hide-mobile { display: none !important; }
        }
      `}</style>

      <div className="tm-wrapper">
        <div className="tm-main">
          {/* Header */}
          <div style={styles.headerCard} className="tm-header">
            <div style={styles.headerLeft} className="tm-header-left">
              <div style={styles.headerIcon} className="tm-header-icon">
                {activeTab === 'users' ? '👥' : activeTab === 'roles' ? '🔐' : '👨‍👩‍👧‍👦'}
              </div>
              <div>
                <h2 style={styles.title}>
                  {activeTab === 'users' ? 'Team Members' : activeTab === 'roles' ? 'Roles & Permissions' : 'User Groups'}
                </h2>
                <p style={styles.subtitle} className="tm-subtitle">
                  {activeTab === 'users' ? 'Add, edit and manage your team members' : activeTab === 'roles' ? 'Define roles and control feature access' : 'Organize users into groups for easy management'}
                </p>
              </div>
            </div>
            <button onClick={() => activeTab === 'users' ? openUserPanel() : activeTab === 'roles' ? openRolePanel() : openGroupPanel()} style={styles.addBtn} className="tm-add-btn">
              <span style={{ fontSize: '16px' }}>+</span> Add {activeTab === 'users' ? 'User' : activeTab === 'roles' ? 'Role' : 'Group'}
            </button>
          </div>

          {/* Alerts */}
          {success && <div style={styles.success}>{success}</div>}
          {error && <div style={styles.error}>{error}</div>}

          {/* Stats */}
          <div style={styles.statsGrid} className="tm-stats-grid">
            <div style={{ ...styles.statCard, ...(activeTab === 'users' ? styles.activeStatCard : {}) }} onClick={() => setActiveTab('users')}>
              <span style={styles.statNum} className="tm-stat-num">👥 {users.length}</span>
              <span style={styles.statLabel}>Users</span>
            </div>
            <div style={{ ...styles.statCard, ...(activeTab === 'roles' ? styles.activeStatCard : {}) }} onClick={() => setActiveTab('roles')}>
              <span style={styles.statNum} className="tm-stat-num">🔐 {roles.length}</span>
              <span style={styles.statLabel}>Roles</span>
            </div>
            <div style={{ ...styles.statCard, ...(activeTab === 'groups' ? styles.activeStatCard : {}) }} onClick={() => setActiveTab('groups')}>
              <span style={styles.statNum} className="tm-stat-num">👨‍👩‍👧‍👦 {groups.length}</span>
              <span style={styles.statLabel}>Groups</span>
            </div>
          </div>

          {/* Split layout: form left + table right */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>

          {/* Left: Add/Edit User Form */}
          {showPanel && panelMode === 'user' && (
            <div style={styles.inlineFormCard}>
              {/* Header */}
              <div style={styles.modalHeader}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                    {editingItem ? 'Edit User' : 'Add New User'}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94a3b8' }}>
                    {editingItem ? 'Update user information' : subStep === 'create-role' ? 'Step 2 — Create Role' : subStep === 'create-group' ? 'Step 2 — Create Group' : `Step ${userStep} of 2 — ${userStep === 1 ? 'Basic Information' : 'Roles & Groups'}`}
                  </p>
                </div>
                <button onClick={closePanel} style={styles.closeBtn}>×</button>
              </div>

              {/* Step indicator (add only) */}
              {!editingItem && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#fff' }}>1</div>
                  <div style={{ flex: 1, height: '2px', background: userStep === 2 ? '#3b82f6' : '#e2e8f0', borderRadius: '2px', transition: 'background 0.3s' }} />
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: userStep === 2 ? '#3b82f6' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: userStep === 2 ? '#fff' : '#94a3b8', transition: 'all 0.3s' }}>2</div>
                </div>
              )}

              <div style={styles.inlineFormBody}>
                {/* Step 1 */}
                {(userStep === 1) && (
                  <div style={styles.inlineFormGrid}>
                    <div>
                      <div style={styles.formGrid}>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>First Name *</label>
                          <input
                            style={styles.input}
                            value={userForm.firstName}
                            onChange={e => {
                              const fn = e.target.value;
                              const generated = (fn + (userForm.lastName ? '.' + userForm.lastName : '')).toLowerCase().replace(/\s+/g, '');
                              setUserForm(prev => ({ ...prev, firstName: fn, loginName: generated }));
                            }}
                            placeholder="John"
                          />
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Last Name *</label>
                          <input
                            style={styles.input}
                            value={userForm.lastName}
                            onChange={e => {
                              const ln = e.target.value;
                              const generated = ((userForm.firstName ? userForm.firstName + '.' : '') + ln).toLowerCase().replace(/\s+/g, '');
                              setUserForm(prev => ({ ...prev, lastName: ln, loginName: generated }));
                            }}
                            placeholder="Doe"
                          />
                        </div>
                      </div>
                      <div style={styles.formGrid}>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Email *</label>
                          <input type="email" style={styles.input} value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} placeholder="john@company.com" disabled={!!editingItem} />
                        </div>
                        {!editingItem && (
                          <div style={styles.formGroup}>
                            <label style={styles.label}>Password *</label>
                            <div style={{ position: 'relative' }}>
                              <input
                                type={showPassword ? 'text' : 'password'}
                                style={{ ...styles.input, paddingRight: '36px' }}
                                value={userForm.password}
                                onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                                placeholder="Min. 6 characters"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(p => !p)}
                                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0', display: 'flex', alignItems: 'center' }}
                                title={showPassword ? 'Hide password' : 'Show password'}
                              >
                                {showPassword ? (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                                    <line x1="1" y1="1" x2="23" y2="23"/>
                                  </svg>
                                ) : (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Login Name</label>
                        <input
                          style={{
                            ...styles.input,
                            borderColor: userForm.loginName && users.some(u => u.loginName === userForm.loginName && u._id !== editingItem?._id) ? '#ef4444' : undefined
                          }}
                          value={userForm.loginName}
                          onChange={e => setUserForm({ ...userForm, loginName: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                          placeholder="john.doe"
                        />
                        {userForm.loginName && users.some(u => u.loginName === userForm.loginName && u._id !== editingItem?._id) && (
                          <span style={{ fontSize: '10px', color: '#ef4444', marginTop: '3px', display: 'block' }}>
                            This login name is already taken
                          </span>
                        )}
                      </div>
                      <div style={styles.formGrid}>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Department</label>
                          <select style={styles.input} value={userForm.department} onChange={e => setUserForm({ ...userForm, department: e.target.value })}>
                            <option value="">— Select Department —</option>
                            <option value="Sales">Sales</option>
                            <option value="Marketing">Marketing</option>
                            <option value="Finance">Finance</option>
                            <option value="Operations">Operations</option>
                            <option value="Human Resources">Human Resources</option>
                            <option value="IT">IT</option>
                            <option value="Customer Support">Customer Support</option>
                            <option value="Product">Product</option>
                            <option value="Legal">Legal</option>
                            <option value="Administration">Administration</option>
                          </select>
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Set PIN (4 digits) {editingItem && <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>— leave blank to keep existing</span>}</label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type={showPin ? 'text' : 'password'}
                              style={{ ...styles.input, paddingRight: '36px', letterSpacing: showPin ? 'normal' : '4px' }}
                              value={userForm.viewingPin}
                              onChange={e => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                setUserForm({ ...userForm, viewingPin: val });
                              }}
                              placeholder="4-digit PIN"
                              maxLength={4}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPin(p => !p)}
                              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0', display: 'flex', alignItems: 'center' }}
                            >
                              {showPin ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                                  <line x1="1" y1="1" x2="23" y2="23"/>
                                </svg>
                              ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                  <circle cx="12" cy="12" r="3"/>
                                </svg>
                              )}
                            </button>
                          </div>
                          {userForm.viewingPin && userForm.viewingPin.length < 4 && (
                            <span style={{ fontSize: '10px', color: '#f59e0b', marginTop: '3px', display: 'block' }}>PIN must be exactly 4 digits</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>User Type</label>
                        <select style={styles.input} value={userForm.userType} onChange={e => setUserForm({ ...userForm, userType: e.target.value, roles: [] })}>
                          <option value="TENANT_USER">Tenant User</option>
                          <option value="TENANT_MANAGER">Tenant Manager</option>
                          <option value="TENANT_ADMIN">Tenant Admin</option>
                        </select>
                        <span style={{ fontSize: '10px', color: '#64748b', marginTop: '3px', display: 'block' }}>
                          {userForm.userType === 'TENANT_ADMIN' ? '⚡ Full access' : userForm.userType === 'TENANT_MANAGER' ? '📊 Manage team & reports' : '👤 Access via assigned roles'}
                        </span>
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Phone</label>
                        <input style={styles.input} value={userForm.phone} onChange={e => setUserForm({ ...userForm, phone: e.target.value })} placeholder="+91 00000 00000" />
                      </div>
                      {!editingItem && (
                        userForm.userType === 'TENANT_ADMIN'
                          ? <button type="button" onClick={handleUserSubmit} disabled={submitting} style={{ ...styles.submitBtn, opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}>{submitting ? 'Creating...' : 'Create User'}</button>
                          : <button type="button" onClick={handleNextStep} style={styles.submitBtn}>Next: Assign Roles & Groups →</button>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2 (add) or roles/groups section (edit) */}
                {(userStep === 2 || !!editingItem) && (
                  <div style={styles.inlineFormGrid}>

                    {/* Sub-step: Create Role inline */}
                    {subStep === 'create-role' && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          <button type="button" onClick={() => { setSubStep(null); setQuickRoleForm({ name: '', description: '', permissions: [], forUserTypes: ['TENANT_USER', 'TENANT_MANAGER'] }); }} style={styles.subStepBack}>← Back</button>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Create New Role</div>
                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Auto-selected after creation</div>
                          </div>
                        </div>
                        <form onSubmit={handleQuickRoleCreate}>
                          <div style={styles.formGroup}>
                            <label style={styles.label}>Role Name *</label>
                            <input style={styles.input} value={quickRoleForm.name} onChange={e => setQuickRoleForm({ ...quickRoleForm, name: e.target.value })} required placeholder="e.g., Sales Manager" />
                          </div>
                          <div style={styles.formGroup}>
                            <label style={styles.label}>Description</label>
                            <input style={styles.input} value={quickRoleForm.description} onChange={e => setQuickRoleForm({ ...quickRoleForm, description: e.target.value })} placeholder="Brief description" />
                          </div>
                          <div style={styles.formGroup}>
                            <label style={styles.label}>For User Types</label>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {[{ value: 'TENANT_USER', label: 'User', color: '#3b82f6' }, { value: 'TENANT_MANAGER', label: 'Manager', color: '#8b5cf6' }].map(ut => (
                                <label key={ut.value} style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', background: quickRoleForm.forUserTypes?.includes(ut.value) ? ut.color : '#f1f5f9', color: quickRoleForm.forUserTypes?.includes(ut.value) ? '#fff' : '#64748b', border: `1px solid ${quickRoleForm.forUserTypes?.includes(ut.value) ? ut.color : '#e2e8f0'}` }}>
                                  <input type="checkbox" checked={quickRoleForm.forUserTypes?.includes(ut.value)} onChange={() => { const t = quickRoleForm.forUserTypes || []; setQuickRoleForm({ ...quickRoleForm, forUserTypes: t.includes(ut.value) ? t.filter(x => x !== ut.value) : [...t, ut.value] }); }} style={{ display: 'none' }} />
                                  {ut.label}
                                </label>
                              ))}
                            </div>
                          </div>
                          <div style={styles.formGroup}>
                            <label style={styles.label}>Permissions</label>
                            <div style={styles.permTable}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
                                <thead>
                                  <tr>
                                    <th style={{ textAlign: 'left', padding: '4px 6px', background: '#f8fafc', position: 'sticky', top: 0 }}>Module</th>
                                    {ACTIONS.map(a => <th key={a} style={{ padding: '4px 3px', background: '#f8fafc', fontSize: '8px', position: 'sticky', top: 0 }} title={a}>{a[0].toUpperCase()}</th>)}
                                  </tr>
                                </thead>
                                <tbody>
                                  {['Access', 'CRM', 'Sales', 'Product', 'Tasks', 'Account', 'Customization', 'Data'].map(cat => (
                                    <React.Fragment key={cat}>
                                      <tr><td colSpan={ACTIONS.length + 1} style={{ padding: '4px 6px', background: '#e2e8f0', fontWeight: '600', fontSize: '9px', color: '#475569' }}>{cat}</td></tr>
                                      {FEATURES.filter(f => f.category === cat).map(f => (
                                        <tr key={f.slug}>
                                          <td style={{ padding: '4px 6px', borderTop: '1px solid #f1f5f9', paddingLeft: '12px' }}>{f.name}</td>
                                          {ACTIONS.map(a => (
                                            <td key={a} style={{ padding: '3px', textAlign: 'center', borderTop: '1px solid #f1f5f9' }}>
                                              <input type="checkbox" checked={hasQuickAction(f.slug, a)} onChange={() => toggleQuickPermission(f.slug, a)} style={{ cursor: 'pointer', width: '12px', height: '12px' }} />
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </React.Fragment>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                          <button type="submit" style={styles.submitBtn}>Create Role</button>
                        </form>
                      </div>
                    )}

                    {/* Sub-step: Create Group inline */}
                    {subStep === 'create-group' && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          <button type="button" onClick={() => { setSubStep(null); setQuickGroupForm({ name: '', description: '' }); }} style={styles.subStepBack}>← Back</button>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Create New Group</div>
                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Auto-selected after creation</div>
                          </div>
                        </div>
                        <form onSubmit={handleQuickGroupCreate}>
                          <div style={styles.formGroup}>
                            <label style={styles.label}>Group Name *</label>
                            <input style={styles.input} value={quickGroupForm.name} onChange={e => setQuickGroupForm({ ...quickGroupForm, name: e.target.value })} required placeholder="e.g., Sales Team" />
                          </div>
                          <div style={styles.formGroup}>
                            <label style={styles.label}>Description</label>
                            <input style={styles.input} value={quickGroupForm.description} onChange={e => setQuickGroupForm({ ...quickGroupForm, description: e.target.value })} placeholder="Brief description" />
                          </div>
                          <button type="submit" style={styles.submitBtn}>Create Group</button>
                        </form>
                      </div>
                    )}

                    {/* Normal step 2: Role & Group selectors */}
                    {!subStep && (
                      <>
                        {/* Roles */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label style={{ ...styles.label, marginBottom: 0 }}>Assign Role(s)</label>
                            <button type="button" onClick={() => { setQuickRoleForm({ name: '', description: '', permissions: [], forUserTypes: ['TENANT_USER', 'TENANT_MANAGER'] }); setSubStep('create-role'); }} style={styles.createNewBtn}>+ Create new role</button>
                          </div>
                          <div style={{ position: 'relative' }}>
                            <button type="button" onClick={() => { setShowRoleDropdown(p => !p); setShowGroupDropdown(false); }} style={styles.dropdownTrigger}>
                              <span>{userForm.roles.length > 0 ? `${userForm.roles.length} role(s) selected` : 'Select roles...'}</span>
                              <span>▾</span>
                            </button>
                            {showRoleDropdown && (
                              <div style={styles.dropdownList}>
                                {roles.length === 0
                                  ? <div style={{ padding: '12px', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>No roles yet — create one above</div>
                                  : roles.map(r => (
                                    <label key={r._id} style={{ ...styles.dropdownItem, background: userForm.roles.includes(r._id) ? '#eff6ff' : '#fff' }}>
                                      <input type="checkbox" checked={userForm.roles.includes(r._id)} onChange={() => { const n = userForm.roles.includes(r._id) ? userForm.roles.filter(i => i !== r._id) : [...userForm.roles, r._id]; setUserForm({ ...userForm, roles: n }); }} style={{ accentColor: '#3b82f6' }} />
                                      <span style={{ color: userForm.roles.includes(r._id) ? '#1d4ed8' : '#1e293b', fontWeight: userForm.roles.includes(r._id) ? '600' : '400' }}>{r.name}</span>
                                    </label>
                                  ))}
                              </div>
                            )}
                            {userForm.roles.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                                {userForm.roles.map(id => { const r = roles.find(r => r._id === id); return r ? <span key={id} style={styles.tagBlue}>{r.name}<button type="button" onClick={() => setUserForm({ ...userForm, roles: userForm.roles.filter(i => i !== id) })} style={styles.tagX}>×</button></span> : null; })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Groups */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label style={{ ...styles.label, marginBottom: 0 }}>Add to Group(s) <span style={{ color: '#94a3b8', fontWeight: 400 }}>— optional</span></label>
                            <button type="button" onClick={() => { setQuickGroupForm({ name: '', description: '' }); setSubStep('create-group'); }} style={styles.createNewBtn}>+ Create new group</button>
                          </div>
                          <div style={{ position: 'relative' }}>
                            <button type="button" onClick={() => { setShowGroupDropdown(p => !p); setShowRoleDropdown(false); }} style={styles.dropdownTrigger}>
                              <span>{userForm.groups.length > 0 ? `${userForm.groups.length} group(s) selected` : 'Select groups...'}</span>
                              <span>▾</span>
                            </button>
                            {showGroupDropdown && (
                              <div style={styles.dropdownList}>
                                {groups.length === 0
                                  ? <div style={{ padding: '12px', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>No groups yet — create one above</div>
                                  : groups.map(g => (
                                    <label key={g._id} style={{ ...styles.dropdownItem, background: userForm.groups.includes(g._id) ? '#f0fdf4' : '#fff' }}>
                                      <input type="checkbox" checked={userForm.groups.includes(g._id)} onChange={() => { const n = userForm.groups.includes(g._id) ? userForm.groups.filter(i => i !== g._id) : [...userForm.groups, g._id]; setUserForm({ ...userForm, groups: n }); }} style={{ accentColor: '#16a34a' }} />
                                      <span style={{ color: userForm.groups.includes(g._id) ? '#16a34a' : '#1e293b', fontWeight: userForm.groups.includes(g._id) ? '600' : '400' }}>{g.name}</span>
                                    </label>
                                  ))}
                              </div>
                            )}
                            {userForm.groups.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                                {userForm.groups.map(id => { const g = groups.find(g => g._id === id); return g ? <span key={id} style={styles.tagGreen}>{g.name}<button type="button" onClick={() => setUserForm({ ...userForm, groups: userForm.groups.filter(i => i !== id) })} style={styles.tagX}>×</button></span> : null; })}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                            {!editingItem && <button type="button" onClick={() => setUserStep(1)} disabled={submitting} style={styles.backBtn}>← Back</button>}
                            <button type="button" onClick={handleUserSubmit} disabled={submitting} style={{ ...styles.submitBtn, flex: 1, marginTop: 0, opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                              {submitting ? (editingItem ? 'Updating...' : 'Creating...') : (editingItem ? 'Update User' : 'Create User')}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Right: Table */}
          <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.tableCard}>
            <div className="tm-table-wrapper">
            {loading ? <div style={styles.loading}>Loading...</div> : (
              <table style={styles.table} className="tm-table">
                <thead>
                  {activeTab === 'users' && (
                    <tr>
                      <th style={styles.th}>User</th>
                      <th style={styles.th} className="tm-hide-mobile">Email</th>
                      <th style={styles.th}>Type</th>
                      <th style={styles.th} className="tm-hide-mobile">Roles</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  )}
                  {activeTab === 'roles' && (
                    <tr>
                      <th style={styles.th}>Role</th>
                      <th style={styles.th} className="tm-hide-mobile">Description</th>
                      <th style={styles.th} className="tm-hide-mobile">Type</th>
                      <th style={styles.th} className="tm-hide-mobile">Permissions</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  )}
                  {activeTab === 'groups' && (
                    <tr>
                      <th style={styles.th}>Group</th>
                      <th style={styles.th}>Description</th>
                      <th style={styles.th}>Members</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {activeTab === 'users' && users.map(u => (
                    <tr key={u._id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.cellFlex}>
                          <div style={styles.avatar}>{u.firstName?.[0]}{u.lastName?.[0]}</div>
                          <span style={styles.name}>{u.firstName} {u.lastName}</span>
                        </div>
                      </td>
                      <td style={styles.td} className="tm-hide-mobile">{u.email}</td>
                      <td style={styles.td}><span style={styles.badgeBlue}>{getUserTypeLabel(u.userType)}</span></td>
                      <td style={styles.td} className="tm-hide-mobile">{u.roles?.map(r => r.name).join(', ') || '-'}</td>
                      <td style={styles.td}><span style={u.isActive ? styles.badgeGreen : styles.badgeRed}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          <button onClick={() => openUserPanel(u)} style={styles.actionBtn}>✏️</button>
                          {u._id !== user._id && <button onClick={() => handleDeleteUser(u)} style={styles.actionBtnDanger}>🗑️</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {activeTab === 'roles' && roles.map(r => (
                    <tr key={r._id} style={styles.tr}>
                      <td style={styles.td}><span style={styles.name}>{r.name}</span></td>
                      <td style={styles.td} className="tm-hide-mobile">{r.description || '-'}</td>
                      <td style={styles.td} className="tm-hide-mobile"><span style={styles.badgePurple}>{r.roleType || 'Custom'}</span></td>
                      <td style={styles.td} className="tm-hide-mobile"><span style={{ fontSize: '10px', color: '#64748b' }}>{r.permissions?.length || 0} permissions</span></td>
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          <button onClick={() => openRolePanel(r)} style={styles.actionBtn}>✏️</button>
                          {r.roleType !== 'system' && <button onClick={() => handleDeleteRole(r)} style={styles.actionBtnDanger}>🗑️</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {activeTab === 'groups' && groups.map(g => (
                    <tr key={g._id} style={styles.tr}>
                      <td style={styles.td}><span style={styles.name}>{g.name}</span></td>
                      <td style={styles.td} className="tm-hide-mobile">{g.description || '-'}</td>
                      <td style={styles.td}><span style={styles.badgeGreen}>{g.members?.length || 0} members</span></td>
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          <button onClick={() => openGroupPanel(g)} style={styles.actionBtn}>✏️</button>
                          <button onClick={() => handleDeleteGroup(g)} style={styles.actionBtnDanger}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            </div>
            {!loading && ((activeTab === 'users' && users.length === 0) || (activeTab === 'roles' && roles.length === 0) || (activeTab === 'groups' && groups.length === 0)) && (
              <div style={styles.empty}>No {activeTab} found</div>
            )}
          </div>
          </div>{/* end table wrapper */}
          </div>{/* end split layout */}
        </div>

        {/* Side Panel — Role & Group only */}
        {showPanel && panelMode !== 'user' && (
          <div className="tm-panel" style={styles.panel}>
            <div style={styles.panelHeader}>
              <h3 style={styles.panelTitle}>{editingItem ? 'Edit' : 'Add'} {panelMode === 'role' ? 'Role' : 'Group'}</h3>
              <button onClick={closePanel} style={styles.closeBtn}>×</button>
            </div>
            <div style={styles.panelBody}>
              {/* Role Form */}
              {panelMode === 'role' && (
                <form onSubmit={handleRoleSubmit}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Role Name</label>
                    <input style={styles.input} value={roleForm.name} onChange={e => setRoleForm({ ...roleForm, name: e.target.value })} required placeholder="e.g., Sales Manager" />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Description</label>
                    <input style={styles.input} value={roleForm.description} onChange={e => setRoleForm({ ...roleForm, description: e.target.value })} placeholder="Brief description" />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>For User Types</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {[{ value: 'TENANT_USER', label: 'User', color: '#3b82f6' }, { value: 'TENANT_MANAGER', label: 'Manager', color: '#8b5cf6' }].map(ut => (
                        <label key={ut.value} style={{
                          padding: '6px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer',
                          background: roleForm.forUserTypes?.includes(ut.value) ? ut.color : '#f1f5f9',
                          color: roleForm.forUserTypes?.includes(ut.value) ? '#fff' : '#64748b',
                          border: `1px solid ${roleForm.forUserTypes?.includes(ut.value) ? ut.color : '#e2e8f0'}`,
                          display: 'flex', alignItems: 'center', gap: '4px'
                        }}>
                          <input type="checkbox" checked={roleForm.forUserTypes?.includes(ut.value)} onChange={() => {
                            const types = roleForm.forUserTypes || [];
                            const newTypes = types.includes(ut.value) ? types.filter(t => t !== ut.value) : [...types, ut.value];
                            setRoleForm({ ...roleForm, forUserTypes: newTypes });
                          }} style={{ display: 'none' }} />
                          {ut.label}
                        </label>
                      ))}
                    </div>
                    <span style={{ fontSize: '9px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>Select which user types can be assigned this role</span>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Permissions</label>
                    <div style={styles.permTable}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left', padding: '4px 6px', background: '#f8fafc', position: 'sticky', top: 0 }}>Module</th>
                            {ACTIONS.map(a => <th key={a} style={{ padding: '4px 3px', background: '#f8fafc', fontSize: '8px', position: 'sticky', top: 0 }} title={a}>{a.slice(0, 1).toUpperCase()}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {['Access', 'CRM', 'Sales', 'Product', 'Tasks', 'Account', 'Customization', 'Data'].map(cat => (
                            <React.Fragment key={cat}>
                              <tr>
                                <td colSpan={ACTIONS.length + 1} style={{ padding: '4px 6px', background: '#e2e8f0', fontWeight: '600', fontSize: '9px', color: '#475569' }}>{cat}</td>
                              </tr>
                              {FEATURES.filter(f => f.category === cat).map(f => (
                                <tr key={f.slug}>
                                  <td style={{ padding: '4px 6px', borderTop: '1px solid #f1f5f9', paddingLeft: '12px' }}>{f.name}</td>
                                  {ACTIONS.map(a => (
                                    <td key={a} style={{ padding: '3px', textAlign: 'center', borderTop: '1px solid #f1f5f9' }}>
                                      <input type="checkbox" checked={hasAction(f.slug, a)} onChange={() => togglePermission(f.slug, a)} style={{ cursor: 'pointer', width: '12px', height: '12px' }} />
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <button type="submit" style={styles.submitBtn}>{editingItem ? 'Update' : 'Create'} Role</button>
                </form>
              )}

              {/* Group Form */}
              {panelMode === 'group' && (
                <form onSubmit={handleGroupSubmit}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Group Name</label>
                    <input style={styles.input} value={groupForm.name} onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} required placeholder="e.g., Sales Team" />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Description</label>
                    <input style={styles.input} value={groupForm.description} onChange={e => setGroupForm({ ...groupForm, description: e.target.value })} placeholder="Brief description" />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Members</label>
                    <div style={styles.chipContainer}>
                      {users.map(u => (
                        <label key={u._id} style={{ ...styles.chip, ...(groupForm.members.includes(u._id) ? styles.chipActiveGreen : {}) }}>
                          <input type="checkbox" checked={groupForm.members.includes(u._id)} onChange={() => {
                            const newMembers = groupForm.members.includes(u._id) ? groupForm.members.filter(id => id !== u._id) : [...groupForm.members, u._id];
                            setGroupForm({ ...groupForm, members: newMembers });
                          }} style={{ display: 'none' }} />
                          {u.firstName} {u.lastName}
                        </label>
                      ))}
                    </div>
                  </div>
                  <button type="submit" style={styles.submitBtn}>{editingItem ? 'Update' : 'Create'} Group</button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>


    </DashboardLayout>
  );
};

const styles = {
  wrapper: { display: 'flex', gap: '16px', padding: '16px', minHeight: 'calc(100vh - 120px)' },
  headerCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    padding: '16px 20px',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '14px' },
  headerIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
  },
  title: { fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: 0 },
  subtitle: { fontSize: '12px', color: '#64748b', margin: '4px 0 0', maxWidth: '300px' },
  addBtn: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: '#fff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  success: { background: '#dcfce7', color: '#16a34a', padding: '10px', borderRadius: '6px', marginBottom: '12px', fontSize: '12px' },
  error: { background: '#fef2f2', color: '#dc2626', padding: '10px', borderRadius: '6px', marginBottom: '12px', fontSize: '12px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' },
  statCard: {
    background: 'linear-gradient(135deg, rgb(153, 255, 251) 0%, rgb(255, 255, 255) 100%)',
    padding: '14px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  activeStatCard: {
    background: 'linear-gradient(135deg, rgb(120, 245, 240) 0%, rgb(200, 255, 252) 100%)',
    border: '2px solid #14b8a6',
    boxShadow: '0 4px 12px rgba(20, 184, 166, 0.3)'
  },
  statNum: { fontSize: '24px', fontWeight: '700', color: '#1e293b' },
  statLabel: { fontSize: '11px', color: '#64748b', textTransform: 'uppercase' },
  tableCard: { background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 12px', fontSize: '10px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '10px 12px', fontSize: '12px', color: '#1e293b' },
  cellFlex: { display: 'flex', alignItems: 'center', gap: '8px' },
  avatar: { width: '28px', height: '28px', borderRadius: '6px', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: '10px' },
  name: { fontWeight: '600', fontSize: '12px' },
  badgeBlue: { padding: '3px 8px', borderRadius: '4px', background: '#dbeafe', color: '#1d4ed8', fontSize: '10px', fontWeight: '500' },
  badgeGreen: { padding: '3px 8px', borderRadius: '4px', background: '#dcfce7', color: '#16a34a', fontSize: '10px', fontWeight: '500' },
  badgeRed: { padding: '3px 8px', borderRadius: '4px', background: '#fef2f2', color: '#dc2626', fontSize: '10px', fontWeight: '500' },
  badgePurple: { padding: '3px 8px', borderRadius: '4px', background: '#f3e8ff', color: '#7c3aed', fontSize: '10px', fontWeight: '500' },
  actions: { display: 'flex', gap: '4px' },
  actionBtn: { background: '#f1f5f9', border: 'none', width: '26px', height: '26px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' },
  actionBtnDanger: { background: '#fef2f2', border: 'none', width: '26px', height: '26px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' },
  loading: { textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '12px' },
  empty: { textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '12px' },
  // Panel
  panel: {
    width: '320px',
    background: 'linear-gradient(135deg, rgb(153, 255, 251) 0%, rgb(255, 255, 255) 100%)',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100vh - 140px)',
    overflow: 'hidden'
  },
  panelHeader: {
    padding: '12px 14px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.5)'
  },
  panelTitle: { fontSize: '14px', fontWeight: '600', color: '#1e293b', margin: 0 },
  closeBtn: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b', padding: 0, lineHeight: 1 },
  panelBody: { padding: '14px', flex: 1, overflowY: 'auto' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  formGroup: { marginBottom: '12px' },
  label: { display: 'block', fontSize: '11px', fontWeight: '500', color: '#475569', marginBottom: '4px' },
  input: { width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box', background: '#fff' },
  chipContainer: { display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#f8fafc', maxHeight: '100px', overflowY: 'auto' },
  chip: { padding: '4px 10px', borderRadius: '12px', fontSize: '10px', cursor: 'pointer', background: '#fff', border: '1px solid #e2e8f0', color: '#64748b' },
  chipActive: { background: '#dbeafe', border: '1px solid #3b82f6', color: '#1d4ed8' },
  chipActiveGreen: { background: '#dcfce7', border: '1px solid #16a34a', color: '#16a34a' },
  permTable: { border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden', maxHeight: '350px', overflowY: 'auto' },
  submitBtn: { width: '100%', padding: '10px', border: 'none', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', marginTop: '8px' },
  dropdownTrigger: { width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', background: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#1e293b', textAlign: 'left' },
  dropdownList: { position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: '160px', overflowY: 'auto' },
  dropdownItem: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', cursor: 'pointer', fontSize: '12px', borderBottom: '1px solid #f1f5f9' },
  // Modal
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' },
  modal: { background: '#fff', borderRadius: '14px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' },
  modalHeader: { padding: '16px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 },
  modalBody: { padding: '16px 18px', overflowY: 'auto', flex: 1 },
  createNewBtn: { background: 'none', border: 'none', color: '#3b82f6', fontSize: '11px', fontWeight: '600', cursor: 'pointer', padding: 0, whiteSpace: 'nowrap' },
  backBtn: { padding: '9px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#f8fafc', color: '#64748b', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' },
  tagBlue: { padding: '2px 8px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '10px', fontSize: '10px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' },
  tagGreen: { padding: '2px 8px', background: '#dcfce7', color: '#16a34a', borderRadius: '10px', fontSize: '10px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' },
  tagX: { background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '12px', lineHeight: 1, opacity: 0.7 },
  subStepBack: { padding: '5px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#f8fafc', color: '#64748b', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 },
  // Inline form card (below stats, above table)
  inlineFormCard: { width: '360px', flexShrink: 0, background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', overflow: 'visible' },
  inlineFormBody: { padding: '14px 16px' },
  inlineFormGrid: { display: 'flex', flexDirection: 'column', gap: '0px' }
};

export default TeamManagement;
