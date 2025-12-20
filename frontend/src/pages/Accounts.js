import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { accountService } from '../services/accountService';
import fieldDefinitionService from '../services/fieldDefinitionService';
import Modal from '../components/common/Modal';
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const [formData, setFormData] = useState({
    accountName: '', accountType: 'Customer', industry: '', phone: '', website: '', fax: '',
    annualRevenue: '', numberOfEmployees: '', billingStreet: '', billingCity: '', billingState: '',
    billingCountry: '', billingZipCode: '', shippingStreet: '', shippingCity: '', shippingState: '',
    shippingCountry: '', shippingZipCode: '', description: ''
  });

  // Dynamic field definitions
  const [fieldDefinitions, setFieldDefinitions] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  const [stats, setStats] = useState({
    total: 0,
    customers: 0,
    prospects: 0,
    partners: 0
  });

  useEffect(() => {
    loadAccounts();
    loadCustomFields();
  }, [pagination.page, filters.search, filters.accountType, filters.industry]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await accountService.getAccounts({
        page: pagination.page, limit: pagination.limit, ...filters
      });
      if (response.success && response.data) {
        const accountsData = response.data.accounts || [];
        setAccounts(accountsData);
        setPagination(prev => ({
          ...prev, total: response.data.pagination?.total || 0, pages: response.data.pagination?.pages || 0
        }));

        const customers = accountsData.filter(a => a.accountType === 'Customer').length;
        const prospects = accountsData.filter(a => a.accountType === 'Prospect').length;
        const partners = accountsData.filter(a => a.accountType === 'Partner').length;
        setStats({
          total: response.data.pagination?.total || 0,
          customers,
          prospects,
          partners
        });
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
        const createFields = response
          .filter(field => field.isActive && field.showInCreate)
          .sort((a, b) => a.displayOrder - b.displayOrder);
        setFieldDefinitions(createFields);
      }
    } catch (err) {
      console.error('Load field definitions error:', err);
    }
  };

  // Group fields by section
  const groupFieldsBySection = (fields) => {
    const grouped = {};
    fields.forEach(field => {
      const section = field.section || 'Additional Information';
      if (!grouped[section]) {
        grouped[section] = [];
      }
      grouped[section].push(field);
    });
    return grouped;
  };

  // Handle dynamic field value change
  const handleFieldChange = (fieldName, value) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: null
    }));
  };

  // Render dynamic field
  const renderDynamicField = (field) => {
    return (
      <DynamicField
        fieldDefinition={field}
        value={fieldValues[field.fieldName] || ''}
        onChange={handleFieldChange}
        error={fieldErrors[field.fieldName]}
      />
    );
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      setError('');

      // Separate standard fields from custom fields
      const standardFields = {};
      const customFields = {};

      fieldDefinitions.forEach(field => {
        const value = fieldValues[field.fieldName];
        if (value !== undefined && value !== null && value !== '') {
          if (field.isStandardField) {
            standardFields[field.fieldName] = value;
          } else {
            customFields[field.fieldName] = value;
          }
        }
      });

      // Combine standard fields with form data and custom fields
      const accountData = {
        ...formData,
        ...standardFields,
        customFields: Object.keys(customFields).length > 0 ? customFields : undefined
      };

      await accountService.createAccount(accountData);
      setSuccess('Account created successfully!');
      setShowCreateModal(false);
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
      setShowEditModal(false);
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
      setShowDeleteModal(false);
      setSelectedAccount(null);
      loadAccounts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account');
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (e, account) => {
    e.stopPropagation();
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
    setShowEditModal(true);
  };

  const openDeleteModal = (e, account) => {
    e.stopPropagation();
    setSelectedAccount(account);
    setShowDeleteModal(true);
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
    const icons = {
      'Customer': '👤',
      'Prospect': '🎯',
      'Partner': '🤝',
      'Vendor': '🏪',
      'Competitor': '⚔️'
    };
    return icons[type] || '📊';
  };

  const actionButton = (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '8px', background: 'white', borderRadius: '8px', padding: '4px', border: '2px solid #e5e7eb' }}>
        <button
          className={`crm-btn crm-btn-sm ${viewMode === 'table' ? 'crm-btn-primary' : 'crm-btn-secondary'}`}
          onClick={() => setViewMode('table')}
          style={{ padding: '6px 12px' }}
        >
          ☰ Table
        </button>
        <button
          className={`crm-btn crm-btn-sm ${viewMode === 'grid' ? 'crm-btn-primary' : 'crm-btn-secondary'}`}
          onClick={() => setViewMode('grid')}
          style={{ padding: '6px 12px' }}
        >
          ⊞ Grid
        </button>
      </div>
      {canCreateAccount && (
        <button className="crm-btn crm-btn-primary" onClick={openCreateModal}>+ New Account</button>
      )}
    </div>
  );

  return (
    <DashboardLayout title="Accounts" actionButton={actionButton}>
      {success && <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)', color: '#166534', borderRadius: '12px', marginBottom: '24px', border: '2px solid #86EFAC', fontWeight: '600', boxShadow: '0 4px 15px rgba(34, 197, 94, 0.2)' }}>✓ {success}</div>}
      {error && <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)', color: '#991B1B', borderRadius: '12px', marginBottom: '24px', border: '2px solid #FCA5A5', fontWeight: '600', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)' }}>⚠ {error}</div>}

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
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#1e3c72' }}>🔍 Search & Filter</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
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
        </div>
      </div>

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
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📊</div>
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#1e3c72', marginBottom: '8px' }}>No accounts found</p>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>Create your first account to get started!</p>
            {canCreateAccount && <button className="crm-btn crm-btn-primary" onClick={openCreateModal}>+ Create First Account</button>}
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {accounts.map((account) => (
                  <div
                    key={account._id}
                    onClick={() => navigate(`/accounts/${account._id}`)}
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                      borderRadius: '16px',
                      padding: '24px',
                      cursor: 'pointer',
                      border: '2px solid #e5e7eb',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.boxShadow = '0 12px 32px rgba(74, 144, 226, 0.2)';
                      e.currentTarget.style.borderColor = '#4A90E2';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #4A90E2 0%, #2c5364 100%)' }}></div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #4A90E2 0%, #2c5364 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '28px',
                        flexShrink: 0,
                        boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)'
                      }}>
                        {getAccountTypeIcon(account.accountType)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '800', color: '#1e3c72', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {account.accountName}
                        </h3>
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', marginBottom: '4px' }}>
                          #{account.accountNumber}
                        </div>
                      </div>
                    </div>
                    <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span className={`status-badge ${(account.accountType || 'customer').toLowerCase()}`}>
                        {account.accountType || 'Customer'}
                      </span>
                      {account.industry && (
                        <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', background: '#f1f5f9', color: '#475569' }}>
                          {account.industry}
                        </span>
                      )}
                    </div>
                    <div style={{ marginBottom: '16px', color: '#64748b', fontSize: '14px' }}>
                      {account.phone && (
                        <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>📞</span>
                          <span>{account.phone}</span>
                        </div>
                      )}
                      {account.website && (
                        <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>🌐</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{account.website}</span>
                        </div>
                      )}
                      {account.owner && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>👨‍💼</span>
                          <span>{account.owner.firstName || ''} {account.owner.lastName || ''}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', paddingTop: '16px', borderTop: '2px solid #f1f5f9' }} onClick={(e) => e.stopPropagation()}>
                      {canUpdateAccount && (
                        <button className="crm-btn crm-btn-sm crm-btn-secondary" onClick={(e) => openEditModal(e, account)} style={{ flex: 1 }}>✏️ Edit</button>
                      )}
                      {canDeleteAccount && (
                        <button className="crm-btn crm-btn-sm crm-btn-danger" onClick={(e) => openDeleteModal(e, account)} style={{ flex: 1 }}>🗑️ Delete</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ overflowX: 'auto', padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                  <thead>
                    <tr style={{ background: 'transparent' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Industry</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Owner</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account) => (
                      <tr
                        key={account._id}
                        onClick={(e) => { if (e.target.tagName !== 'BUTTON') navigate(`/accounts/${account._id}`); }}
                        style={{
                          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          borderRadius: '12px',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                          border: '2px solid #e5e7eb'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(74, 144, 226, 0.15)';
                          e.currentTarget.style.borderColor = '#4A90E2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                          e.currentTarget.style.borderColor = '#e5e7eb';
                        }}
                      >
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '12px',
                              background: 'linear-gradient(135deg, #4A90E2 0%, #2c5364 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '24px',
                              boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)'
                            }}>
                              {getAccountTypeIcon(account.accountType)}
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', color: '#1e3c72', fontSize: '15px', marginBottom: '4px' }}>
                                {account.accountName}
                              </div>
                              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>
                                #{account.accountNumber}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span className={`status-badge ${(account.accountType || 'customer').toLowerCase()}`}>
                            {account.accountType || 'Customer'}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontWeight: '600', color: '#475569', fontSize: '14px' }}>
                            {account.industry || '-'}
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {account.phone && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                                <span>📞</span>
                                <span>{account.phone}</span>
                              </div>
                            )}
                            {account.website && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569' }}>
                                <span>🌐</span>
                                <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{account.website}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontWeight: '600', color: '#475569', fontSize: '14px' }}>
                            {account.owner ? `${account.owner.firstName || ''} ${account.owner.lastName || ''}` : '-'}
                          </div>
                        </td>
                        <td style={{ padding: '16px' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {canUpdateAccount && (
                              <button className="crm-btn crm-btn-sm crm-btn-secondary" onClick={(e) => openEditModal(e, account)}>Edit</button>
                            )}
                            {canDeleteAccount && (
                              <button className="crm-btn crm-btn-sm crm-btn-danger" onClick={(e) => openDeleteModal(e, account)}>Delete</button>
                            )}
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

      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); resetForm(); setError(''); }} title="Create New Account" size="large">
        <form onSubmit={handleCreateAccount}>
          {/* Dynamic Form Sections - Rendered from Field Definitions */}
          {(() => {
            const groupedFields = groupFieldsBySection(fieldDefinitions);
            const sectionOrder = ['Basic Information', 'Business Information', 'Address Information', 'Additional Information'];

            return sectionOrder.map(sectionName => {
              const sectionFields = groupedFields[sectionName];
              if (!sectionFields || sectionFields.length === 0) return null;

              return (
                <div key={sectionName} style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#111827', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #E5E7EB', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {sectionName}
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {sectionFields.map((field) => {
                      const isFullWidth = field.fieldType === 'textarea';

                      return (
                        <div key={field._id} style={isFullWidth ? { gridColumn: 'span 2' } : {}}>
                          {renderDynamicField(field)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}

          <div className="modal-footer">
            <button type="button" className="crm-btn crm-btn-outline" onClick={() => { setShowCreateModal(false); resetForm(); setError(''); }}>Cancel</button>
            <button type="submit" className="crm-btn crm-btn-primary">Create Account</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedAccount(null); resetForm(); setError(''); }} title="Edit Account" size="large">
        <form onSubmit={handleUpdateAccount}>
          <div className="form-group">
            <label className="form-label">Account Name *</label>
            <input type="text" name="accountName" className="crm-form-input" value={formData.accountName} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Account Type</label>
              <select name="accountType" className="crm-form-select" value={formData.accountType} onChange={handleChange}>
                <option value="Customer">Customer</option>
                <option value="Prospect">Prospect</option>
                <option value="Partner">Partner</option>
                <option value="Vendor">Vendor</option>
                <option value="Competitor">Competitor</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Industry</label>
              <select name="industry" className="crm-form-select" value={formData.industry} onChange={handleChange}>
                <option value="">Select Industry</option>
                <option value="Technology">Technology</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Finance">Finance</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input type="tel" name="phone" className="crm-form-input" value={formData.phone} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Website</label>
              <input type="url" name="website" className="crm-form-input" value={formData.website} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea name="description" className="crm-form-textarea" rows="3" value={formData.description} onChange={handleChange} />
          </div>
          <div className="modal-footer">
            <button type="button" className="crm-btn crm-btn-outline" onClick={() => { setShowEditModal(false); setSelectedAccount(null); resetForm(); setError(''); }}>Cancel</button>
            <button type="submit" className="crm-btn crm-btn-primary">Update Account</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setSelectedAccount(null); }} title="Delete Account" size="small">
        <div>
          <p>Are you sure you want to delete this account?</p>
          <p style={{ marginTop: '10px' }}>
            <strong>{selectedAccount?.accountName}</strong><br />
            <span style={{ color: '#666' }}>Account #{selectedAccount?.accountNumber}</span>
          </p>
          <p style={{ marginTop: '15px', color: 'var(--error-color)', fontSize: '14px' }}>This action cannot be undone.</p>
          <div className="modal-footer">
            <button className="crm-btn crm-btn-outline" onClick={() => { setShowDeleteModal(false); setSelectedAccount(null); }}>Cancel</button>
            <button className="crm-btn crm-btn-danger" onClick={handleDeleteAccount}>Delete Account</button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default Accounts;
