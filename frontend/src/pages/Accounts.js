import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PinVerification from '../components/common/PinVerification';
import { accountService } from '../services/accountService';
import fieldDefinitionService from '../services/fieldDefinitionService';
import DashboardLayout from '../components/layout/DashboardLayout';
import DynamicField from '../components/DynamicField';
import { Phone, Globe, Building2, X, Edit, Users, DollarSign, MapPin, Briefcase, Settings } from 'lucide-react';
import ManageFieldsPanel from '../components/ManageFieldsPanel';
import '../styles/crm.css';

const DEFAULT_ACCOUNT_FIELDS = [
  { fieldName: 'accountName', label: 'Account Name', fieldType: 'text', section: 'Basic Information', isRequired: true, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 1 },
  { fieldName: 'accountType', label: 'Account Type', fieldType: 'dropdown', section: 'Basic Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 2, options: [{ label: 'Customer', value: 'Customer' }, { label: 'Prospect', value: 'Prospect' }, { label: 'Partner', value: 'Partner' }, { label: 'Reseller', value: 'Reseller' }, { label: 'Vendor', value: 'Vendor' }, { label: 'Other', value: 'Other' }] },
  { fieldName: 'email', label: 'Email', fieldType: 'email', section: 'Basic Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 3 },
  { fieldName: 'phone', label: 'Phone', fieldType: 'phone', section: 'Basic Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 4 },
  { fieldName: 'website', label: 'Website', fieldType: 'url', section: 'Basic Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 5 },
  { fieldName: 'industry', label: 'Industry', fieldType: 'dropdown', section: 'Business Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 10, options: [{ label: 'Technology', value: 'Technology' }, { label: 'Healthcare', value: 'Healthcare' }, { label: 'Finance', value: 'Finance' }, { label: 'Manufacturing', value: 'Manufacturing' }, { label: 'Retail', value: 'Retail' }, { label: 'Education', value: 'Education' }, { label: 'Other', value: 'Other' }] },
  { fieldName: 'billingStreet', label: 'Street', fieldType: 'text', section: 'Billing Address', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 20 },
  { fieldName: 'billingCity', label: 'City', fieldType: 'text', section: 'Billing Address', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 21 },
  { fieldName: 'billingState', label: 'State', fieldType: 'text', section: 'Billing Address', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 22 },
  { fieldName: 'billingCountry', label: 'Country', fieldType: 'text', section: 'Billing Address', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 23 },
  { fieldName: 'description', label: 'Description', fieldType: 'textarea', section: 'Additional Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 30 },
];
const ACCT_DISABLED_KEY = 'crm_acct_std_disabled';
const getAcctDisabled = () => { try { return JSON.parse(localStorage.getItem(ACCT_DISABLED_KEY) || '[]'); } catch { return []; } };
const ACCOUNT_SECTIONS = ['Basic Information', 'Business Information', 'Billing Address', 'Additional Information'];

const Accounts = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasPermission } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState('table');

  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ search: '', accountType: searchParams.get('type') || '', industry: '' });
  const [showCreateForm, setShowCreateForm] = useState(false);

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

  // Manage Fields
  const [showManageFields, setShowManageFields] = useState(false);
  const [customFieldDefs, setCustomFieldDefs] = useState([]);
  const [disabledStdFields, setDisabledStdFieldsState] = useState(getAcctDisabled);
  const [togglingField, setTogglingField] = useState(null);

  // PIN Verification State
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAccountId, setPendingAccountId] = useState(null);

  // Split View Panel State
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [selectedAccountData, setSelectedAccountData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailActiveTab, setDetailActiveTab] = useState('overview');
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState([]);

  // Masking functions for sensitive data
  const maskEmail = (email) => {
    if (!email || isPinVerified) return email;
    const [name, domain] = email.split('@');
    if (!name || !domain) return '***@***.***';
    return name[0] + '***@' + domain[0] + '***.' + domain.split('.').pop();
  };

  const maskPhone = (phone) => {
    if (!phone || isPinVerified) return phone;
    return phone.slice(0, 2) + '******' + phone.slice(-2);
  };

  const maskName = (name) => {
    if (!name || isPinVerified) return name;
    return name[0] + '***';
  };

  // Detail Panel Forms
  const [showDetailEditForm, setShowDetailEditForm] = useState(false);
  const [showDetailDeleteConfirm, setShowDetailDeleteConfirm] = useState(false);
  const [detailEditData, setDetailEditData] = useState({});

  useEffect(() => {
    loadAccounts();
    loadCustomFields();
  }, [pagination.page, filters.search, filters.accountType, filters.industry]);

  // Sync filter with URL params when navigating from another page
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam && typeParam !== filters.accountType) {
      setFilters(prev => ({ ...prev, accountType: typeParam }));
    }
  }, [searchParams]);

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
      }
    } catch (err) {
      if (err?.isPermissionDenied) return;
      setError(err.response?.data?.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const buildAcctFields = (disabled, customs) => [
    ...DEFAULT_ACCOUNT_FIELDS.filter(f => !disabled.includes(f.fieldName)).map(f => ({ ...f, isActive: true, _isStd: true })),
    ...customs.filter(f => f.isActive && f.showInCreate),
  ].sort((a, b) => a.displayOrder - b.displayOrder);

  const allFieldDefs = [
    ...DEFAULT_ACCOUNT_FIELDS.map(f => ({ ...f, isActive: !disabledStdFields.includes(f.fieldName), _isStd: true })),
    ...customFieldDefs,
  ].sort((a, b) => a.displayOrder - b.displayOrder);

  const loadCustomFields = async () => {
    try {
      const response = await fieldDefinitionService.getFieldDefinitions('Account', true);
      const customs = (Array.isArray(response) ? response : []).filter(f => !f.isStandardField);
      setCustomFieldDefs(customs);
      setFieldDefinitions(buildAcctFields(disabledStdFields, customs));
    } catch (err) { console.error('Load field definitions error:', err); }
  };

  const handleToggleField = async (field) => {
    setTogglingField(field.fieldName);
    if (field._isStd) {
      const newDisabled = disabledStdFields.includes(field.fieldName)
        ? disabledStdFields.filter(n => n !== field.fieldName)
        : [...disabledStdFields, field.fieldName];
      localStorage.setItem(ACCT_DISABLED_KEY, JSON.stringify(newDisabled));
      setDisabledStdFieldsState(newDisabled);
      setFieldDefinitions(buildAcctFields(newDisabled, customFieldDefs));
    } else {
      try {
        await fieldDefinitionService.toggleFieldStatus(field._id, !field.isActive);
        const updated = customFieldDefs.map(f => f._id === field._id ? { ...f, isActive: !f.isActive } : f);
        setCustomFieldDefs(updated);
        setFieldDefinitions(buildAcctFields(disabledStdFields, updated));
      } catch (err) { console.error('Toggle error:', err); }
    }
    setTogglingField(null);
  };

  const handleAddCustomField = async (fieldData) => {
    const created = await fieldDefinitionService.createFieldDefinition({ entityType: 'Account', isStandardField: false, showInCreate: true, showInEdit: true, showInDetail: true, ...fieldData });
    const updated = [...customFieldDefs, { ...created, isActive: true }].sort((a, b) => a.displayOrder - b.displayOrder);
    setCustomFieldDefs(updated);
    setFieldDefinitions(buildAcctFields(disabledStdFields, updated));
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
    <DynamicField fieldDefinition={field} value={fieldValues[field.fieldName] || ''} onChange={handleFieldChange} error={fieldErrors[field.fieldName]} />
  );

  const closeAllForms = () => {
    setShowCreateForm(false);
    setShowManageFields(false);
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
      const accountData = { ...formData, ...standardFields, customFields: Object.keys(customFields).length > 0 ? customFields : undefined };
      await accountService.createAccount(accountData);
      setSuccess('Account created successfully!');
      setShowCreateForm(false);
      resetForm();
      loadAccounts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { if (err?.isPermissionDenied) return; setError(err.response?.data?.message || 'Failed to create account'); }
  };

  const resetForm = () => {
    setFormData({ accountName: '', accountType: 'Customer', industry: '', phone: '', website: '', fax: '', annualRevenue: '', numberOfEmployees: '', billingStreet: '', billingCity: '', billingState: '', billingCountry: '', billingZipCode: '', shippingStreet: '', shippingCity: '', shippingState: '', shippingCountry: '', shippingZipCode: '', description: '' });
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

  // Handle stats click filter
  const handleStatsFilter = (type) => {
    setFilters(prev => ({ ...prev, accountType: type }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // === Split View Functions ===
  const loadAccountDetails = async (accountId) => {
    setSelectedAccountId(accountId);
    setLoadingDetail(true);
    setDetailActiveTab('overview');
    closeDetailForms();

    try {
      const response = await accountService.getAccount(accountId);
      if (response?.success) {
        setSelectedAccountData(response.data);
        loadDetailCustomFields();
      }
    } catch (err) { console.error('Error loading account details:', err); }
    finally { setLoadingDetail(false); }
  };

  // Handle account click - check PIN first
  const handleAccountClick = (accountId) => {
    if (selectedAccountId === accountId) return;

    if (!isPinVerified) {
      setPendingAccountId(accountId);
      setShowPinModal(true);
      return;
    }
    loadAccountDetails(accountId);
  };

  // Handle PIN verification success
  const handlePinVerified = () => {
    setIsPinVerified(true);
    setShowPinModal(false);
    if (pendingAccountId) {
      loadAccountDetails(pendingAccountId);
      setPendingAccountId(null);
    }
  };

  const loadDetailCustomFields = async () => {
    try {
      const response = await fieldDefinitionService.getFieldDefinitions('Account', false);
      if (response && Array.isArray(response)) {
        const activeFields = response.filter(field => field.isActive && field.showInDetail).sort((a, b) => a.displayOrder - b.displayOrder);
        setCustomFieldDefinitions(activeFields);
      }
    } catch (err) { console.error('Load custom fields error:', err); }
  };

  const closeDetailForms = () => {
    setShowDetailEditForm(false);
    setShowDetailDeleteConfirm(false);
  };

  const closeSidePanel = () => {
    setSelectedAccountId(null);
    setSelectedAccountData(null);
    closeDetailForms();
  };

  const openDetailEditForm = () => {
    if (!selectedAccountData) return;
    setDetailEditData({
      accountName: selectedAccountData.accountName || '',
      accountType: selectedAccountData.accountType || 'Customer',
      industry: selectedAccountData.industry || '',
      phone: selectedAccountData.phone || '',
      website: selectedAccountData.website || '',
      annualRevenue: selectedAccountData.annualRevenue || '',
      numberOfEmployees: selectedAccountData.numberOfEmployees || '',
      description: selectedAccountData.description || ''
    });
    closeDetailForms();
    setShowDetailEditForm(true);
  };

  const handleDetailUpdateAccount = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await accountService.updateAccount(selectedAccountId, detailEditData);
      setSuccess('Account updated successfully!');
      setShowDetailEditForm(false);
      const response = await accountService.getAccount(selectedAccountId);
      if (response?.success) setSelectedAccountData(response.data);
      loadAccounts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { if (err?.isPermissionDenied) return; setError(err.message || 'Failed to update account'); }
  };

  const handleDetailEditChange = (e) => {
    const { name, value } = e.target;
    setDetailEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleDetailDeleteAccount = async () => {
    try {
      setError('');
      await accountService.deleteAccount(selectedAccountId);
      setSuccess('Account deleted successfully!');
      closeSidePanel();
      loadAccounts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { if (err?.isPermissionDenied) return; setError(err.message || 'Failed to delete account'); }
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
      {/* PIN Verification Modal */}
      <PinVerification
        isOpen={showPinModal}
        onClose={() => { setShowPinModal(false); setPendingAccountId(null); }}
        onVerified={handlePinVerified}
        resourceType="contact"
        resourceId={pendingAccountId}
        resourceName="Account"
      />

      {success && <div style={{ padding: '16px 20px', background: '#DCFCE7', color: '#166534', borderRadius: '12px', marginBottom: '24px', border: '2px solid #86EFAC', fontWeight: '600' }}>{success}</div>}
      {error && <div style={{ padding: '16px 20px', background: '#FEE2E2', color: '#991B1B', borderRadius: '12px', marginBottom: '24px', border: '2px solid #FCA5A5', fontWeight: '600' }}>{error}</div>}

      {/* Split View Container */}
      <div style={{ display: 'flex', gap: '0', height: 'calc(100vh - 150px)', overflow: 'hidden' }}>
        {/* Left Side */}
        <div style={{ flex: selectedAccountId ? '0 0 55%' : '1 1 100%', minWidth: 0, overflow: 'auto' }}>

          {/* Stats - Clickable */}
          <div className="stats-grid">
            <div
              className="stat-card"
              onClick={() => handleStatsFilter('')}
              style={{
                cursor: 'pointer',
                border: filters.accountType === '' ? '2px solid #14b8a6' : '1px solid #e2e8f0',
                background: filters.accountType === '' ? 'linear-gradient(135deg, rgb(120 245 240) 0%, rgb(200 255 252) 100%)' : 'linear-gradient(135deg, rgb(153 255 251) 0%, rgb(255 255 255) 100%)',
                boxShadow: filters.accountType === '' ? '0 4px 12px rgba(20, 184, 166, 0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <div className="stat-label">Total Accounts</div>
              <div className="stat-value">{stats.total}</div>
            </div>
            <div
              className="stat-card"
              onClick={() => handleStatsFilter('Customer')}
              style={{
                cursor: 'pointer',
                border: filters.accountType === 'Customer' ? '2px solid #14b8a6' : '1px solid #e2e8f0',
                background: filters.accountType === 'Customer' ? 'linear-gradient(135deg, rgb(120 245 240) 0%, rgb(200 255 252) 100%)' : 'linear-gradient(135deg, rgb(153 255 251) 0%, rgb(255 255 255) 100%)',
                boxShadow: filters.accountType === 'Customer' ? '0 4px 12px rgba(20, 184, 166, 0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <div className="stat-label">Customers</div>
              <div className="stat-value">{stats.customers}</div>
            </div>
            <div
              className="stat-card"
              onClick={() => handleStatsFilter('Prospect')}
              style={{
                cursor: 'pointer',
                border: filters.accountType === 'Prospect' ? '2px solid #14b8a6' : '1px solid #e2e8f0',
                background: filters.accountType === 'Prospect' ? 'linear-gradient(135deg, rgb(120 245 240) 0%, rgb(200 255 252) 100%)' : 'linear-gradient(135deg, rgb(153 255 251) 0%, rgb(255 255 255) 100%)',
                boxShadow: filters.accountType === 'Prospect' ? '0 4px 12px rgba(20, 184, 166, 0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <div className="stat-label">Prospects</div>
              <div className="stat-value">{stats.prospects}</div>
            </div>
            <div
              className="stat-card"
              onClick={() => handleStatsFilter('Partner')}
              style={{
                cursor: 'pointer',
                border: filters.accountType === 'Partner' ? '2px solid #14b8a6' : '1px solid #e2e8f0',
                background: filters.accountType === 'Partner' ? 'linear-gradient(135deg, rgb(120 245 240) 0%, rgb(200 255 252) 100%)' : 'linear-gradient(135deg, rgb(153 255 251) 0%, rgb(255 255 255) 100%)',
                boxShadow: filters.accountType === 'Partner' ? '0 4px 12px rgba(20, 184, 166, 0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <div className="stat-label">Partners</div>
              <div className="stat-value">{stats.partners}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="crm-card" style={{ marginBottom: '24px' }}>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <input type="text" name="search" placeholder="Search accounts..." className="crm-form-input" value={filters.search} onChange={handleFilterChange} />
                <select name="accountType" className="crm-form-select" value={filters.accountType} onChange={handleFilterChange}>
                  <option value="">All Types</option>
                  <option value="Customer">Customer</option>
                  <option value="Prospect">Prospect</option>
                  <option value="Partner">Partner</option>
                  <option value="Vendor">Vendor</option>
                </select>
                <select name="industry" className="crm-form-select" value={filters.industry} onChange={handleFilterChange}>
                  <option value="">All Industries</option>
                  <option value="Technology">Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Finance">Finance</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Retail">Retail</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className={`crm-btn crm-btn-sm ${viewMode === 'table' ? 'crm-btn-primary' : 'crm-btn-outline'}`} onClick={() => setViewMode('table')}>Table</button>
                  <button className={`crm-btn crm-btn-sm ${viewMode === 'grid' ? 'crm-btn-primary' : 'crm-btn-outline'}`} onClick={() => setViewMode('grid')}>Grid</button>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                  {hasPermission('field_management', 'read') && (
                    <button onClick={() => { closeAllForms(); setShowManageFields(v => !v); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #4A90E2 0%, #2c5364 100%)', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
                      <Settings style={{ width: '14px', height: '14px' }} /> Manage Fields
                    </button>
                  )}
                  {canCreateAccount && <button className="crm-btn crm-btn-primary" onClick={() => { closeAllForms(); resetForm(); setShowCreateForm(true); }}>+ New Account</button>}
                </div>
              </div>
            </div>
          </div>

          {/* Manage Fields Panel */}
          {showManageFields && (
            <ManageFieldsPanel
              allFieldDefs={allFieldDefs}
              togglingField={togglingField}
              onToggle={handleToggleField}
              onClose={() => setShowManageFields(false)}
              onAdd={handleAddCustomField}
              canAdd={hasPermission('field_management', 'create')}
              canToggle={hasPermission('field_management', 'update')}
              entityLabel="Account"
              sections={ACCOUNT_SECTIONS}
            />
          )}

          {/* Inline Create Account Form */}
          {showCreateForm && (
            <div style={{ marginBottom: '16px', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(30,60,114,0.10)', border: '1px solid #e2e8f0' }}>
              <div style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 60%, #3b82f6 100%)', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#fff', letterSpacing: '0.2px' }}>Create New Account</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>Fill in the details to add a new account</p>
                </div>
                <button onClick={() => { setShowCreateForm(false); resetForm(); }} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '8px', cursor: 'pointer', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '16px' }}>✕</button>
              </div>
              <div style={{ padding: '16px', background: '#fafeff' }}>
                <form onSubmit={handleCreateAccount}>
                  {(() => {
                    const groupedFields = groupFieldsBySection(fieldDefinitions);
                    const sectionOrder = ['Basic Information', 'Business Information', 'Billing Address', 'Additional Information'];
                    const palette = [
                      { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8' },
                      { bg: '#f0fdf4', border: '#10b981', text: '#065f46' },
                      { bg: '#f5f3ff', border: '#8b5cf6', text: '#4c1d95' },
                      { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' },
                    ];
                    return sectionOrder.map((sectionName, sIdx) => {
                      const sectionFields = groupedFields[sectionName];
                      if (!sectionFields || sectionFields.length === 0) return null;
                      const c = palette[sIdx % palette.length];
                      return (
                        <div key={sectionName} style={{ marginBottom: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '5px 10px', borderRadius: '7px', background: c.bg, borderLeft: `3px solid ${c.border}` }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.border, flexShrink: 0 }} />
                            <span style={{ fontSize: '11px', fontWeight: '700', color: c.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{sectionName}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
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
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                    <button type="button" onClick={() => { setShowCreateForm(false); resetForm(); }} style={{ padding: '8px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#64748b', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" style={{ padding: '8px 24px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #1e3c72 0%, #3b82f6 100%)', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 8px rgba(30,60,114,0.25)' }}>Create Account</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Account List */}
          <div className="crm-card">
            <div className="crm-card-header">
              <h2 className="crm-card-title">{viewMode === 'grid' ? 'Account Cards' : 'Account List'} ({pagination.total})</h2>
            </div>

            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
            ) : accounts.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <p style={{ fontSize: '18px', fontWeight: '600', color: '#1e3c72' }}>No accounts found</p>
                {canCreateAccount && <button className="crm-btn crm-btn-primary" onClick={() => { resetForm(); setShowCreateForm(true); }}>+ Create First Account</button>}
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {accounts.map((account) => (
                      <div key={account._id} onClick={() => handleAccountClick(account._id)}
                        style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', cursor: 'pointer', border: selectedAccountId === account._id ? '2px solid #1e3c72' : '2px solid #e5e7eb', transition: 'all 0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, rgb(153, 255, 251) 0%, rgb(255, 255, 255) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', color: '#1e3c72' }}>
                            {getAccountTypeIcon(account.accountType)}
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e3c72' }}>{maskName(account.accountName)}</h3>
                            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>#{account.accountNumber}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                          <span style={{ padding: '2px 8px', background: '#E0E7FF', color: '#3730A3', borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}>{account.accountType}</span>
                          {account.industry && <span style={{ padding: '2px 8px', background: '#f1f5f9', color: '#475569', borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}>{account.industry}</span>}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {account.phone && <div>{maskPhone(account.phone)}</div>}
                          {account.website && <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{isPinVerified ? account.website : '*****.***'}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Account</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Type</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Industry</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Phone</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accounts.map((account) => (
                          <tr key={account._id} onClick={() => handleAccountClick(account._id)}
                            style={{ cursor: 'pointer', borderBottom: '1px solid #e5e7eb', background: selectedAccountId === account._id ? '#EFF6FF' : 'white' }}>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, rgb(153, 255, 251) 0%, rgb(255, 255, 255) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: '#1e3c72' }}>
                                  {getAccountTypeIcon(account.accountType)}
                                </div>
                                <div>
                                  <div style={{ fontWeight: '600', color: '#1e3c72', fontSize: '14px' }}>{maskName(account.accountName)}</div>
                                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>#{account.accountNumber}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px' }}><span style={{ padding: '2px 8px', background: '#E0E7FF', color: '#3730A3', borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}>{account.accountType}</span></td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151' }}>{account.industry || '-'}</td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151' }}>{account.phone ? maskPhone(account.phone) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {pagination.pages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: '1px solid #e5e7eb' }}>
                    <button className="crm-btn crm-btn-secondary crm-btn-sm" onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))} disabled={pagination.page === 1}>← Previous</button>
                    <span style={{ fontWeight: '600', color: '#1e3c72', fontSize: '13px' }}>Page {pagination.page} of {pagination.pages}</span>
                    <button className="crm-btn crm-btn-secondary crm-btn-sm" onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} disabled={pagination.page === pagination.pages}>Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        {/* End Left Side */}

        {/* Right Side - Account Detail Panel */}
        {selectedAccountId && (
          <div style={{ flex: '0 0 45%', background: 'white', borderLeft: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Panel Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#1e3c72', fontSize: '15px', fontWeight: '600' }}>Account Details</h3>
              <button onClick={closeSidePanel} style={{ background: 'rgba(30,60,114,0.1)', border: 'none', borderRadius: '6px', padding: '4px', color: '#1e3c72', cursor: 'pointer' }}><X className="h-5 w-5" /></button>
            </div>

            {/* Panel Content */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingDetail ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}><div className="spinner"></div></div>
              ) : selectedAccountData ? (
                <div>
                  {/* Account Header */}
                  <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, rgb(153, 255, 251) 0%, rgb(255, 255, 255) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e3c72', fontSize: '20px', fontWeight: 'bold' }}>
                        {getAccountTypeIcon(selectedAccountData.accountType)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 4px 0', color: '#1e3c72' }}>{selectedAccountData.accountName}</h2>
                        <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>#{selectedAccountData.accountNumber}</p>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                          <span style={{ padding: '2px 8px', background: '#E0E7FF', color: '#3730A3', borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}>{selectedAccountData.accountType}</span>
                          {selectedAccountData.industry && <span style={{ padding: '2px 8px', background: '#f1f5f9', color: '#475569', borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}>{selectedAccountData.industry}</span>}
                        </div>
                      </div>
                    </div>
                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {canUpdateAccount && <button className="crm-btn crm-btn-primary crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={openDetailEditForm}><Edit className="h-3 w-3 mr-1" />Edit</button>}
                      {canDeleteAccount && <button className="crm-btn crm-btn-danger crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => { closeDetailForms(); setShowDetailDeleteConfirm(true); }}>Delete</button>}
                      {selectedAccountData.phone && <button className="crm-btn crm-btn-outline crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => window.location.href = `tel:${selectedAccountData.phone}`}><Phone className="h-3 w-3 mr-1" />Call</button>}
                    </div>
                  </div>

                  {/* Inline Edit Form */}
                  {showDetailEditForm && (
                    <div style={{ margin: '12px', padding: '12px', background: '#F0F9FF', borderRadius: '8px', border: '1px solid #93C5FD' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h5 style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#1E40AF' }}>Edit Account</h5>
                        <button onClick={() => setShowDetailEditForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#64748b' }}>✕</button>
                      </div>
                      <form onSubmit={handleDetailUpdateAccount}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Account Name *</label><input type="text" name="accountName" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.accountName || ''} onChange={handleDetailEditChange} required /></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Type</label><select name="accountType" className="crm-form-select" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.accountType || 'Customer'} onChange={handleDetailEditChange}><option value="Customer">Customer</option><option value="Prospect">Prospect</option><option value="Partner">Partner</option><option value="Vendor">Vendor</option></select></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Industry</label><select name="industry" className="crm-form-select" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.industry || ''} onChange={handleDetailEditChange}><option value="">Select</option><option value="Technology">Technology</option><option value="Healthcare">Healthcare</option><option value="Finance">Finance</option><option value="Manufacturing">Manufacturing</option><option value="Retail">Retail</option></select></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Phone</label><input type="tel" name="phone" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.phone || ''} onChange={handleDetailEditChange} /></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Website</label><input type="url" name="website" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.website || ''} onChange={handleDetailEditChange} /></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Employees</label><input type="number" name="numberOfEmployees" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.numberOfEmployees || ''} onChange={handleDetailEditChange} /></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button type="button" className="crm-btn crm-btn-secondary crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => setShowDetailEditForm(false)}>Cancel</button>
                          <button type="submit" className="crm-btn crm-btn-primary crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }}>Update</button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Inline Delete Confirm */}
                  {showDetailDeleteConfirm && (
                    <div style={{ margin: '12px', padding: '12px', background: '#FEF2F2', borderRadius: '8px', border: '1px solid #FCA5A5' }}>
                      <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#991B1B' }}>Delete <strong>{selectedAccountData.accountName}</strong>?</p>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button className="crm-btn crm-btn-secondary crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => setShowDetailDeleteConfirm(false)}>Cancel</button>
                        <button className="crm-btn crm-btn-danger crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={handleDetailDeleteAccount}>Delete</button>
                      </div>
                    </div>
                  )}

                  {/* Tabs */}
                  <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                    <button onClick={() => setDetailActiveTab('overview')} style={{ flex: 1, padding: '10px', fontSize: '12px', fontWeight: '600', border: 'none', background: detailActiveTab === 'overview' ? 'white' : 'transparent', borderBottom: detailActiveTab === 'overview' ? '2px solid #1e3c72' : '2px solid transparent', color: detailActiveTab === 'overview' ? '#1e3c72' : '#64748b', cursor: 'pointer' }}>Overview</button>
                    <button onClick={() => setDetailActiveTab('related')} style={{ flex: 1, padding: '10px', fontSize: '12px', fontWeight: '600', border: 'none', background: detailActiveTab === 'related' ? 'white' : 'transparent', borderBottom: detailActiveTab === 'related' ? '2px solid #1e3c72' : '2px solid transparent', color: detailActiveTab === 'related' ? '#1e3c72' : '#64748b', cursor: 'pointer' }}>Related</button>
                  </div>

                  {/* Tab Content */}
                  <div style={{ padding: '16px' }}>
                    {detailActiveTab === 'overview' && (
                      <div>
                        {(() => {
                          const SYSTEM_KEYS = new Set(['_id', '__v', 'tenant', 'createdBy', 'lastModifiedBy', 'updatedAt', 'createdAt', 'isActive', 'owner', 'customFields', 'billingAddress', 'shippingAddress', 'relatedData', 'parentAccount', 'accountNumber', 'rating', 'SICCode', 'tickerSymbol', 'ownership', 'fax']);
                          const fmtKey = (fn) => fn.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
                          const fieldMap = {};
                          DEFAULT_ACCOUNT_FIELDS.forEach(f => { fieldMap[f.fieldName] = { label: f.label, section: f.section, fieldType: f.fieldType }; });
                          fieldMap['annualRevenue'] = { label: 'Annual Revenue', section: 'Business Information', fieldType: 'currency' };
                          fieldMap['numberOfEmployees'] = { label: 'Employees', section: 'Business Information', fieldType: 'text' };
                          customFieldDefs.forEach(f => { fieldMap[f.fieldName] = { label: f.label, section: f.section, fieldType: f.fieldType }; });
                          const grouped = {};
                          Object.keys(selectedAccountData).forEach(key => {
                            if (SYSTEM_KEYS.has(key)) return;
                            const val = selectedAccountData[key];
                            if (val === null || val === undefined || val === '') return;
                            if (typeof val === 'object' && !Array.isArray(val)) return;
                            const def = fieldMap[key];
                            const section = def?.section || 'Additional Information';
                            if (!grouped[section]) grouped[section] = [];
                            grouped[section].push({ key, label: def?.label || fmtKey(key), fieldType: def?.fieldType || 'text', value: val });
                          });
                          if (selectedAccountData.customFields && typeof selectedAccountData.customFields === 'object') {
                            Object.keys(selectedAccountData.customFields).forEach(key => {
                              const val = selectedAccountData.customFields[key];
                              if (val === null || val === undefined || val === '') return;
                              if (typeof val === 'object' && !Array.isArray(val)) return;
                              const def = fieldMap[key];
                              const section = def?.section || 'Additional Information';
                              if (!grouped[section]) grouped[section] = [];
                              if (!grouped[section].find(f => f.key === key)) {
                                grouped[section].push({ key, label: def?.label || fmtKey(key), fieldType: def?.fieldType || 'text', value: val });
                              }
                            });
                          }
                          const sectionOrder = ['Basic Information', 'Business Information', 'Additional Information', ...Object.keys(grouped).filter(s => !['Basic Information', 'Business Information', 'Additional Information'].includes(s))];
                          return sectionOrder.map(section => {
                            const fields = grouped[section];
                            if (!fields || fields.length === 0) return null;
                            return (
                              <div key={section} style={{ marginBottom: '14px' }}>
                                <h4 style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                                  {section}
                                  <span style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                  {fields.map(({ key, label, fieldType, value }) => {
                                    let display = value;
                                    if (fieldType === 'currency') display = `₹${Number(value).toLocaleString()}`;
                                    else if (fieldType === 'date') { try { display = new Date(value).toLocaleDateString(); } catch(e) { display = value; } }
                                    else if (fieldType === 'checkbox') display = value ? 'Yes' : 'No';
                                    else if (Array.isArray(value)) display = value.join(', ');
                                    else display = value?.toString() || '-';
                                    const isEmail = fieldType === 'email' || key === 'email';
                                    const isPhone = fieldType === 'phone' || key === 'phone';
                                    const isUrl = fieldType === 'url' || key === 'website';
                                    return (
                                      <div key={key} style={{ background: '#f9fafb', padding: '8px 10px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                                        <p style={{ fontSize: '9px', color: '#9CA3AF', marginBottom: '3px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</p>
                                        {isEmail ? <a href={`mailto:${display}`} style={{ fontSize: '12px', fontWeight: '500', color: '#3B82F6', wordBreak: 'break-all' }}>{display}</a>
                                          : isPhone ? <a href={`tel:${display}`} style={{ fontSize: '12px', fontWeight: '500', color: '#059669' }}>{display}</a>
                                          : isUrl ? <a href={display} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', fontWeight: '500', color: '#7C3AED', wordBreak: 'break-all' }}>{display}</a>
                                          : <p style={{ fontSize: '12px', fontWeight: '500', margin: 0, color: '#1e293b', wordBreak: 'break-word' }}>{display}</p>
                                        }
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          });
                        })()}
                        {/* Billing Address (nested object - rendered separately) */}
                        {selectedAccountData.billingAddress && (selectedAccountData.billingAddress.street || selectedAccountData.billingAddress.city) && (
                          <div style={{ marginBottom: '14px' }}>
                            <h4 style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                              Billing Address
                              <span style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                            </h4>
                            <div style={{ background: '#f9fafb', padding: '10px', borderRadius: '6px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#374151' }}>
                              <MapPin className="h-4 w-4 text-gray-500" style={{ marginTop: '2px', flexShrink: 0 }} />
                              <div>
                                {selectedAccountData.billingAddress.street && <div>{selectedAccountData.billingAddress.street}</div>}
                                <div>{[selectedAccountData.billingAddress.city, selectedAccountData.billingAddress.state, selectedAccountData.billingAddress.zipCode].filter(Boolean).join(', ')}</div>
                                {selectedAccountData.billingAddress.country && <div>{selectedAccountData.billingAddress.country}</div>}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {detailActiveTab === 'related' && (
                      <div>
                        {/* Related Contacts */}
                        <div style={{ marginBottom: '20px' }}>
                          <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>Contacts ({selectedAccountData.relatedData?.contacts?.total || 0})</h4>
                          {selectedAccountData.relatedData?.contacts?.data?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {selectedAccountData.relatedData.contacts.data.slice(0, 5).map(contact => (
                                <div key={contact._id} style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb', cursor: 'pointer' }} onClick={() => navigate(`/contacts/${contact._id}`)}>
                                  <div style={{ fontWeight: '600', fontSize: '13px', color: '#1e3c72' }}>{contact.firstName} {contact.lastName}</div>
                                  <div style={{ fontSize: '11px', color: '#64748b' }}>{contact.email}</div>
                                  {contact.jobTitle && <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{contact.jobTitle}</div>}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '6px' }}>No contacts found</p>
                          )}
                        </div>

                        {/* Related Opportunities */}
                        <div style={{ marginBottom: '20px' }}>
                          <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>Deals ({selectedAccountData.relatedData?.opportunities?.total || 0})</h4>
                          {selectedAccountData.relatedData?.opportunities?.data?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {selectedAccountData.relatedData.opportunities.data.slice(0, 5).map(opp => (
                                <div key={opp._id} style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb', cursor: 'pointer' }} onClick={() => navigate(`/opportunities/${opp._id}`)}>
                                  <div style={{ fontWeight: '600', fontSize: '13px', color: '#1e3c72' }}>{opp.opportunityName}</div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                    <span style={{ fontSize: '11px', color: '#059669', fontWeight: '600' }}>Rs. {opp.amount?.toLocaleString() || '0'}</span>
                                    <span style={{ fontSize: '10px', padding: '1px 6px', background: '#E0E7FF', color: '#3730A3', borderRadius: '4px' }}>{opp.stage}</span>
                                  </div>
                                  <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '4px' }}>Close: {new Date(opp.closeDate).toLocaleDateString()}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '6px' }}>No deals found</p>
                          )}
                        </div>

                        {/* Related Tasks (Open Activities) */}
                        <div>
                          <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>Open Activities ({selectedAccountData.relatedData?.tasks?.total || 0})</h4>
                          {selectedAccountData.relatedData?.tasks?.data?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {selectedAccountData.relatedData.tasks.data.slice(0, 5).map(task => (
                                <div key={task._id} style={{ padding: '10px', background: task.status === 'Completed' ? '#f9fafb' : '#F0FDF4', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '10px', background: task.priority === 'High' ? '#FEE2E2' : '#E0E7FF', color: task.priority === 'High' ? '#991B1B' : '#3730A3', padding: '1px 6px', borderRadius: '4px' }}>{task.priority}</span>
                                    <span style={{ fontSize: '10px', background: task.status === 'Completed' ? '#DCFCE7' : '#FEF3C7', color: task.status === 'Completed' ? '#166534' : '#92400E', padding: '1px 6px', borderRadius: '4px' }}>{task.status}</span>
                                  </div>
                                  <div style={{ fontWeight: '600', fontSize: '12px', color: '#1e3c72' }}>{task.subject}</div>
                                  <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '4px' }}>Due: {new Date(task.dueDate).toLocaleDateString()}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '6px' }}>No activities found</p>
                          )}
                        </div>

                        {/* Custom Fields grouped by section */}
                        {customFieldDefinitions.length > 0 && selectedAccountData.customFields && Object.keys(selectedAccountData.customFields).length > 0 && (() => {
                          const groupedFields = groupFieldsBySection(customFieldDefinitions.filter(f => !f.isStandardField));
                          const sections = Object.keys(groupedFields);

                          const renderFieldValue = (field, value) => {
                            if (!value) return null;
                            let displayValue = value;

                            if (field.fieldType === 'currency') {
                              displayValue = `₹${Number(value).toLocaleString()}`;
                            } else if (field.fieldType === 'percentage') {
                              displayValue = `${value}%`;
                            } else if (field.fieldType === 'date') {
                              displayValue = new Date(value).toLocaleDateString();
                            } else if (field.fieldType === 'datetime') {
                              displayValue = new Date(value).toLocaleString();
                            } else if (field.fieldType === 'checkbox') {
                              displayValue = value ? 'Yes' : 'No';
                            } else if (field.fieldType === 'multi_select' && Array.isArray(value)) {
                              const selectedOptions = field.options?.filter(opt => value.includes(opt.value)) || [];
                              displayValue = selectedOptions.map(opt => opt.label).join(', ');
                            } else if (['dropdown', 'radio'].includes(field.fieldType)) {
                              const selectedOption = field.options?.find(opt => opt.value === value);
                              displayValue = selectedOption ? selectedOption.label : value;
                            }

                            return (
                              <div key={field._id}>
                                <p style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '2px' }}>{field.label}</p>
                                <p style={{ fontSize: '13px', fontWeight: '500', color: '#111827', margin: 0 }}>{displayValue || 'Not provided'}</p>
                              </div>
                            );
                          };

                          return sections.map(sectionName => {
                            const fieldsWithValues = groupedFields[sectionName].filter(field => selectedAccountData.customFields[field.fieldName]);
                            if (fieldsWithValues.length === 0) return null;

                            return (
                              <div key={sectionName} style={{ marginTop: '20px' }}>
                                <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ width: '3px', height: '12px', background: 'linear-gradient(135deg, rgb(153, 255, 251) 0%, rgb(255, 255, 255) 100%)', borderRadius: '2px' }}></span>
                                  {sectionName}
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
                                  {fieldsWithValues.map((field) => renderFieldValue(field, selectedAccountData.customFields[field.fieldName]))}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Failed to load account details</div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Accounts;
