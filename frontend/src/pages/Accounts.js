import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { accountService } from '../services/accountService';
import fieldDefinitionService from '../services/fieldDefinitionService';
import DashboardLayout from '../components/layout/DashboardLayout';
import DynamicField from '../components/DynamicField';
import '../styles/crm.css';

const Accounts = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState('table');

  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ search: '', accountType: '', industry: '' });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const [formData, setFormData] = useState({
    accountName: '', accountType: 'Customer', industry: '', phone: '', website: '', fax: '',
    annualRevenue: '', numberOfEmployees: '', billingStreet: '', billingCity: '', billingState: '',
    billingCountry: '', billingZipCode: '', shippingStreet: '', shippingCity: '', shippingState: '',
    shippingCountry: '', shippingZipCode: '', description: ''
  });

  const [fieldDefinitions, setFieldDefinitions] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  const [stats, setStats] = useState({ total: 0, customers: 0, prospects: 0, partners: 0 });

  useEffect(() => {
    loadAccounts();
    loadCustomFields();
  }, [pagination.page, filters.search, filters.accountType, filters.industry]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await accountService.getAccounts({ page: pagination.page, limit: pagination.limit, ...filters });
      if (response.success && response.data) {
        const accountsData = response.data.accounts || [];
        setAccounts(accountsData);
        setPagination(prev => ({ ...prev, total: response.data.pagination?.total || 0, pages: response.data.pagination?.pages || 0 }));

        const customers = accountsData.filter(a => a.accountType === 'Customer').length;
        const prospects = accountsData.filter(a => a.accountType === 'Prospect').length;
        const partners = accountsData.filter(a => a.accountType === 'Partner').length;
        setStats({ total: response.data.pagination?.total || 0, customers, prospects, partners });
      } else {
        setError(response.message || 'Failed to load accounts');
      }
    } catch (err) {
      console.error('Load accounts error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomFields = async () => {
    try {
      const response = await fieldDefinitionService.getFieldDefinitions('Account', false);
      if (response && Array.isArray(response)) {
        const createFields = response.filter(field => field.isActive && field.showInCreate).sort((a, b) => a.displayOrder - b.displayOrder);
        setFieldDefinitions(createFields);
      }
    } catch (err) {
      console.error('Load field definitions error:', err);
    }
  };

  const groupFieldsBySection = (fields) => {
    const grouped = {};
    fields.forEach(field => {
      const section = field.section || 'Additional Information';
      if (!grouped[section]) grouped[section] = [];
      grouped[section].push(field);
    });
    return grouped;
  };

  const handleFieldChange = (fieldName, value) => {
    setFieldValues(prev => ({ ...prev, [fieldName]: value }));
    setFieldErrors(prev => ({ ...prev, [fieldName]: null }));
  };

  const renderDynamicField = (field) => (
    <DynamicField
      fieldDefinition={field}
      value={fieldValues[field.fieldName] || ''}
      onChange={handleFieldChange}
      error={fieldErrors[field.fieldName]}
    />
  );

  const closeAllForms = () => {
    setShowCreateForm(false);
    setShowEditForm(false);
    setShowDeleteConfirm(false);
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const standardFields = {};
      const customFields = {};

      fieldDefinitions.forEach(field => {
        const value = fieldValues[field.fieldName];
        if (value !== undefined && value !== null && value !== '') {
          if (field.isStandardField) standardFields[field.fieldName] = value;
          else customFields[field.fieldName] = value;
        }
      });

      const accountData = {
        ...formData,
        ...standardFields,
        customFields: Object.keys(customFields).length > 0 ? customFields : undefined
      };

      await accountService.createAccount(accountData);
      setSuccess('Account created successfully!');
      setShowCreateForm(false);
      resetForm();
      loadAccounts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create account');
    }
  };

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await accountService.updateAccount(selectedAccount._id, formData);
      setSuccess('Account updated successfully!');
      setShowEditForm(false);
      setSelectedAccount(null);
      resetForm();
      loadAccounts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update account');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setError('');
      await accountService.deleteAccount(selectedAccount._id);
      setSuccess('Account deleted successfully!');
      setShowDeleteConfirm(false);
      setSelectedAccount(null);
      loadAccounts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account');
    }
  };

  const openCreateForm = () => {
    closeAllForms();
    resetForm();
    setShowCreateForm(true);
  };

  const openEditForm = (e, account) => {
    e.stopPropagation();
    closeAllForms();
    setSelectedAccount(account);
    setFormData({
      accountName: account.accountName || '', accountType: account.accountType || 'Customer',
      industry: account.industry || '', phone: account.phone || '', website: account.website || '',
      fax: account.fax || '', annualRevenue: account.annualRevenue || '', numberOfEmployees: account.numberOfEmployees || '',
      billingStreet: account.billingAddress?.street || '', billingCity: account.billingAddress?.city || '',
      billingState: account.billingAddress?.state || '', billingCountry: account.billingAddress?.country || '',
      billingZipCode: account.billingAddress?.zipCode || '', shippingStreet: account.shippingAddress?.street || '',
      shippingCity: account.shippingAddress?.city || '', shippingState: account.shippingAddress?.state || '',
      shippingCountry: account.shippingAddress?.country || '', shippingZipCode: account.shippingAddress?.zipCode || '',
      description: account.description || ''
    });
    setShowEditForm(true);
  };

  const openDeleteConfirm = (e, account) => {
    e.stopPropagation();
    closeAllForms();
    setSelectedAccount(account);
    setShowDeleteConfirm(true);
  };

  const resetForm = () => {
    setFormData({
      accountName: '', accountType: 'Customer', industry: '', phone: '', website: '', fax: '',
      annualRevenue: '', numberOfEmployees: '', billingStreet: '', billingCity: '', billingState: '',
      billingCountry: '', billingZipCode: '', shippingStreet: '', shippingCity: '', shippingState: '',
      shippingCountry: '', shippingZipCode: '', description: ''
    });
    setFieldValues({});
    setFieldErrors({});
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const canCreateAccount = hasPermission('account_management', 'create');
  const canUpdateAccount = hasPermission('account_management', 'update');
  const canDeleteAccount = hasPermission('account_management', 'delete');

  const getAccountTypeIcon = (type) => {
    const icons = { 'Customer': 'C', 'Prospect': 'P', 'Partner': 'Pr', 'Vendor': 'V', 'Competitor': 'Co' };
    return icons[type] || 'A';
  };

  return (
    <DashboardLayout title="Accounts">
      {success && <div style={{ padding: '16px 20px', background: '#DCFCE7', color: '#166534', borderRadius: '12px', marginBottom: '24px', border: '2px solid #86EFAC', fontWeight: '600' }}>{success}</div>}
      {error && <div style={{ padding: '16px 20px', background: '#FEE2E2', color: '#991B1B', borderRadius: '12px', marginBottom: '24px', border: '2px solid #FCA5A5', fontWeight: '600' }}>{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Accounts</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-change">All records</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Customers</div>
          <div className="stat-value">{stats.customers}</div>
          <div className="stat-change positive">Active clients</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Prospects</div>
          <div className="stat-value">{stats.prospects}</div>
          <div className="stat-change">Potential clients</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Partners</div>
          <div className="stat-value">{stats.partners}</div>
          <div className="stat-change positive">Strategic alliances</div>
        </div>
      </div>

      <div className="crm-card" style={{ marginBottom: '24px' }}>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <input type="text" name="search" placeholder="Search accounts..." className="crm-form-input" value={filters.search} onChange={handleFilterChange} />
            <select name="accountType" className="crm-form-select" value={filters.accountType} onChange={handleFilterChange}>
              <option value="">All Types</option>
              <option value="Customer">Customer</option>
              <option value="Prospect">Prospect</option>
              <option value="Partner">Partner</option>
              <option value="Vendor">Vendor</option>
              <option value="Competitor">Competitor</option>
            </select>
            <select name="industry" className="crm-form-select" value={filters.industry} onChange={handleFilterChange}>
              <option value="">All Industries</option>
              <option value="Technology">Technology</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Finance">Finance</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Retail">Retail</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className={`crm-btn crm-btn-sm ${viewMode === 'table' ? 'crm-btn-primary' : 'crm-btn-outline'}`} onClick={() => setViewMode('table')}>Table</button>
              <button className={`crm-btn crm-btn-sm ${viewMode === 'grid' ? 'crm-btn-primary' : 'crm-btn-outline'}`} onClick={() => setViewMode('grid')}>Grid</button>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              {canCreateAccount && <button className="crm-btn crm-btn-primary" onClick={openCreateForm}>+ New Account</button>}
            </div>
          </div>
        </div>
      </div>

      {/* Inline Create Account Form - Compact */}
      {showCreateForm && (
        <div className="crm-card" style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1e3c72' }}>Create New Account</h3>
            <button onClick={() => { setShowCreateForm(false); resetForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#64748b', padding: '2px 6px' }}>✕</button>
          </div>
          <div style={{ padding: '10px' }}>
            <form onSubmit={handleCreateAccount}>
              {(() => {
                const groupedFields = groupFieldsBySection(fieldDefinitions);
                const sectionOrder = ['Basic Information', 'Business Information', 'Address Information', 'Additional Information'];

                return sectionOrder.map(sectionName => {
                  const sectionFields = groupedFields[sectionName];
                  if (!sectionFields || sectionFields.length === 0) return null;

                  return (
                    <div key={sectionName} style={{ marginBottom: '8px' }}>
                      <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#374151', marginBottom: '6px', paddingBottom: '4px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{sectionName}</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                        {sectionFields.map((field) => (
                          <div key={field._id} style={field.fieldType === 'textarea' ? { gridColumn: 'span 2' } : {}}>
                            {renderDynamicField(field)}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                <button type="button" className="crm-btn crm-btn-outline crm-btn-sm" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => { setShowCreateForm(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="crm-btn crm-btn-primary crm-btn-sm" style={{ padding: '4px 10px', fontSize: '11px' }}>Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inline Edit Account Form - Compact */}
      {showEditForm && selectedAccount && (
        <div className="crm-card" style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1e3c72' }}>Edit Account</h3>
            <button onClick={() => { setShowEditForm(false); setSelectedAccount(null); resetForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#64748b', padding: '2px 6px' }}>✕</button>
          </div>
          <form onSubmit={handleUpdateAccount}>
            <div style={{ padding: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '2px', fontSize: '10px', fontWeight: '600', color: '#374151' }}>Account Name *</label>
                  <input type="text" name="accountName" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={formData.accountName} onChange={handleChange} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '2px', fontSize: '10px', fontWeight: '600', color: '#374151' }}>Account Type</label>
                  <select name="accountType" className="crm-form-select" style={{ padding: '4px 6px', fontSize: '11px' }} value={formData.accountType} onChange={handleChange}>
                    <option value="Customer">Customer</option>
                    <option value="Prospect">Prospect</option>
                    <option value="Partner">Partner</option>
                    <option value="Vendor">Vendor</option>
                    <option value="Competitor">Competitor</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '2px', fontSize: '10px', fontWeight: '600', color: '#374151' }}>Industry</label>
                  <select name="industry" className="crm-form-select" style={{ padding: '4px 6px', fontSize: '11px' }} value={formData.industry} onChange={handleChange}>
                    <option value="">Select</option>
                    <option value="Technology">Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Finance">Finance</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '2px', fontSize: '10px', fontWeight: '600', color: '#374151' }}>Phone</label>
                  <input type="tel" name="phone" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={formData.phone} onChange={handleChange} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '2px', fontSize: '10px', fontWeight: '600', color: '#374151' }}>Website</label>
                  <input type="url" name="website" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={formData.website} onChange={handleChange} />
                </div>
              </div>
              <div style={{ marginTop: '8px', gridColumn: 'span 3' }}>
                <label style={{ display: 'block', marginBottom: '2px', fontSize: '10px', fontWeight: '600', color: '#374151' }}>Description</label>
                <textarea name="description" className="crm-form-textarea" rows="2" style={{ width: '100%', padding: '4px 6px', fontSize: '11px' }} value={formData.description} onChange={handleChange} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', padding: '6px 10px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <button type="button" className="crm-btn crm-btn-secondary crm-btn-sm" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => { setShowEditForm(false); setSelectedAccount(null); resetForm(); }}>Cancel</button>
              <button type="submit" className="crm-btn crm-btn-primary crm-btn-sm" style={{ padding: '4px 10px', fontSize: '11px' }}>Update Account</button>
            </div>
          </form>
        </div>
      )}

      {/* Inline Delete Confirmation - Compact */}
      {showDeleteConfirm && selectedAccount && (
        <div className="crm-card" style={{ marginBottom: '10px', border: '2px solid #FCA5A5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderBottom: '1px solid #e5e7eb', background: '#FEF2F2' }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#DC2626' }}>Delete Account</h3>
            <button onClick={() => { setShowDeleteConfirm(false); setSelectedAccount(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#64748b', padding: '2px 6px' }}>✕</button>
          </div>
          <div style={{ padding: '10px' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#374151' }}>Are you sure you want to delete this account?</p>
            <p style={{ margin: '0 0 2px 0', fontWeight: '600', fontSize: '13px', color: '#111827' }}>{selectedAccount?.accountName}</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#6B7280' }}>Account #{selectedAccount?.accountNumber}</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', padding: '6px 10px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
            <button className="crm-btn crm-btn-secondary crm-btn-sm" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => { setShowDeleteConfirm(false); setSelectedAccount(null); }}>Cancel</button>
            <button className="crm-btn crm-btn-danger crm-btn-sm" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={handleDeleteAccount}>Delete</button>
          </div>
        </div>
      )}

      <div className="crm-card">
        <div className="crm-card-header">
          <h2 className="crm-card-title">{viewMode === 'grid' ? 'Account Cards' : 'Account List'} ({pagination.total})</h2>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '16px', color: '#64748b', fontSize: '15px', fontWeight: '600' }}>Loading accounts...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>A</div>
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#1e3c72', marginBottom: '8px' }}>No accounts found</p>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>Create your first account to get started!</p>
            {canCreateAccount && <button className="crm-btn crm-btn-primary" onClick={openCreateForm}>+ Create First Account</button>}
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {accounts.map((account) => (
                  <div key={account._id} onClick={() => navigate(`/accounts/${account._id}`)} style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', cursor: 'pointer', border: '2px solid #e5e7eb', transition: 'all 0.3s ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#4A90E2'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#e5e7eb'; }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'linear-gradient(135deg, #4A90E2 0%, #2c5364 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '800', color: 'white' }}>
                        {getAccountTypeIcon(account.accountType)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '800', color: '#1e3c72', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{account.accountName}</h3>
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>#{account.accountNumber}</div>
                      </div>
                    </div>
                    <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span className={`status-badge ${(account.accountType || 'customer').toLowerCase()}`}>{account.accountType || 'Customer'}</span>
                      {account.industry && <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', background: '#f1f5f9', color: '#475569' }}>{account.industry}</span>}
                    </div>
                    <div style={{ marginBottom: '16px', color: '#64748b', fontSize: '14px' }}>
                      {account.phone && <div style={{ marginBottom: '6px' }}>{account.phone}</div>}
                      {account.website && <div style={{ marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{account.website}</div>}
                      {account.owner && <div>{account.owner.firstName || ''} {account.owner.lastName || ''}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', paddingTop: '16px', borderTop: '2px solid #f1f5f9' }} onClick={(e) => e.stopPropagation()}>
                      {canUpdateAccount && <button className="crm-btn crm-btn-sm crm-btn-secondary" onClick={(e) => openEditForm(e, account)} style={{ flex: 1 }}>Edit</button>}
                      {canDeleteAccount && <button className="crm-btn crm-btn-sm crm-btn-danger" onClick={(e) => openDeleteConfirm(e, account)} style={{ flex: 1 }}>Delete</button>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ overflowX: 'auto', padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Account</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Type</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Industry</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Contact</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Owner</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account) => (
                      <tr key={account._id} onClick={(e) => { if (e.target.tagName !== 'BUTTON') navigate(`/accounts/${account._id}`); }} style={{ background: '#ffffff', cursor: 'pointer', border: '2px solid #e5e7eb', borderRadius: '12px' }}>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #4A90E2 0%, #2c5364 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800', color: 'white' }}>
                              {getAccountTypeIcon(account.accountType)}
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', color: '#1e3c72', fontSize: '15px' }}>{account.accountName}</div>
                              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>#{account.accountNumber}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span className={`status-badge ${(account.accountType || 'customer').toLowerCase()}`}>{account.accountType || 'Customer'}</span>
                        </td>
                        <td style={{ padding: '16px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>{account.industry || '-'}</td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontSize: '13px', color: '#475569' }}>{account.phone || '-'}</div>
                          {account.website && <div style={{ fontSize: '13px', color: '#475569', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{account.website}</div>}
                        </td>
                        <td style={{ padding: '16px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>{account.owner ? `${account.owner.firstName || ''} ${account.owner.lastName || ''}` : '-'}</td>
                        <td style={{ padding: '16px' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {canUpdateAccount && <button className="crm-btn crm-btn-sm crm-btn-secondary" onClick={(e) => openEditForm(e, account)}>Edit</button>}
                            {canDeleteAccount && <button className="crm-btn crm-btn-sm crm-btn-danger" onClick={(e) => openDeleteConfirm(e, account)}>Delete</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderTop: '2px solid #f1f5f9' }}>
                <button className="crm-btn crm-btn-secondary" onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))} disabled={pagination.page === 1}>← Previous</button>
                <span style={{ fontWeight: '700', color: '#1e3c72', fontSize: '15px' }}>Page {pagination.page} of {pagination.pages}</span>
                <button className="crm-btn crm-btn-secondary" onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} disabled={pagination.page === pagination.pages}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Accounts;
