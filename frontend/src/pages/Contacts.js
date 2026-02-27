import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PinVerification from '../components/common/PinVerification';
import { contactService } from '../services/contactService';
import { accountService } from '../services/accountService';
import { taskService } from '../services/taskService';
import { noteService } from '../services/noteService';
import fieldDefinitionService from '../services/fieldDefinitionService';
import DashboardLayout from '../components/layout/DashboardLayout';
import DynamicField from '../components/DynamicField';
import { Mail, Phone, Building2, Briefcase, X, Edit, Trash2, FileText, CheckCircle2, Calendar, Star, User, Settings } from 'lucide-react';
import ManageFieldsPanel from '../components/ManageFieldsPanel';
import '../styles/crm.css';

const DEFAULT_CONTACT_FIELDS = [
  { fieldName: 'firstName', label: 'First Name', fieldType: 'text', section: 'Basic Information', isRequired: true, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 1 },
  { fieldName: 'lastName', label: 'Last Name', fieldType: 'text', section: 'Basic Information', isRequired: true, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 2 },
  { fieldName: 'email', label: 'Email', fieldType: 'email', section: 'Basic Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 3 },
  { fieldName: 'phone', label: 'Phone', fieldType: 'phone', section: 'Basic Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 4 },
  { fieldName: 'mobile', label: 'Mobile', fieldType: 'phone', section: 'Basic Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 5 },
  { fieldName: 'title', label: 'Job Title', fieldType: 'text', section: 'Professional Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 10 },
  { fieldName: 'department', label: 'Department', fieldType: 'dropdown', section: 'Professional Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 11, options: [{ label: 'Sales', value: 'Sales' }, { label: 'Marketing', value: 'Marketing' }, { label: 'Finance', value: 'Finance' }, { label: 'Operations', value: 'Operations' }, { label: 'IT', value: 'IT' }, { label: 'Other', value: 'Other' }] },
  { fieldName: 'mailingCity', label: 'City', fieldType: 'text', section: 'Mailing Address', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 20 },
  { fieldName: 'mailingState', label: 'State', fieldType: 'text', section: 'Mailing Address', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 21 },
  { fieldName: 'mailingCountry', label: 'Country', fieldType: 'text', section: 'Mailing Address', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 22 },
  { fieldName: 'description', label: 'Description', fieldType: 'textarea', section: 'Additional Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 30 },
];
const CONT_DISABLED_KEY = 'crm_cont_std_disabled';
const getContDisabled = () => { try { return JSON.parse(localStorage.getItem(CONT_DISABLED_KEY) || '[]'); } catch { return []; } };
const CONTACT_SECTIONS = ['Basic Information', 'Professional Information', 'Mailing Address', 'Additional Information'];

const Contacts = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState('table');

  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ search: '', account: '', title: '', isPrimary: '', hasAccount: '' });
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', mobile: '', account: '', title: '', department: '',
    isPrimary: false, doNotCall: false, emailOptOut: false, mailingStreet: '', mailingCity: '', mailingState: '',
    mailingCountry: '', mailingZipCode: '', description: ''
  });

  const [fieldDefinitions, setFieldDefinitions] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [stats, setStats] = useState({ total: 0, primary: 0, withAccount: 0, recent: 0 });

  // Manage Fields
  const [showManageFields, setShowManageFields] = useState(false);
  const [customFieldDefs, setCustomFieldDefs] = useState([]);
  const [disabledStdFields, setDisabledStdFieldsState] = useState(getContDisabled);
  const [togglingField, setTogglingField] = useState(null);

  // PIN Verification State
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingContactId, setPendingContactId] = useState(null);

  // Split View Panel State
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [selectedContactData, setSelectedContactData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailActiveTab, setDetailActiveTab] = useState('overview');

  // Detail Panel Data
  const [detailTasks, setDetailTasks] = useState([]);
  const [detailNotes, setDetailNotes] = useState([]);
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState([]);

  // Detail Panel Forms
  const [showDetailEditForm, setShowDetailEditForm] = useState(false);
  const [showDetailDeleteConfirm, setShowDetailDeleteConfirm] = useState(false);
  const [showDetailTaskForm, setShowDetailTaskForm] = useState(false);
  const [showDetailNoteForm, setShowDetailNoteForm] = useState(false);

  // Detail Panel Form Data
  const [detailEditData, setDetailEditData] = useState({});
  const [detailTaskData, setDetailTaskData] = useState({ subject: '', dueDate: '', status: 'Not Started', priority: 'Normal', description: '' });
  const [detailNoteData, setDetailNoteData] = useState({ title: '', content: '' });

  // Masking functions for sensitive data (when PIN not verified)
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

  useEffect(() => {
    loadContacts();
    loadAccounts();
    loadCustomFields();
  }, [pagination.page, filters.search, filters.account, filters.title, filters.isPrimary, filters.hasAccount]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await contactService.getContacts({ page: pagination.page, limit: pagination.limit, ...filters });
      if (response.success && response.data) {
        const contactsData = response.data.contacts || [];
        setContacts(contactsData);
        setPagination(prev => ({ ...prev, total: response.data.pagination?.total || 0, pages: response.data.pagination?.pages || 0 }));
        const primary = contactsData.filter(c => c.isPrimary).length;
        const withAccount = contactsData.filter(c => c.account).length;
        setStats({ total: response.data.pagination?.total || 0, primary, withAccount, recent: contactsData.length });
      }
    } catch (err) {
      if (err?.isPermissionDenied) return;
      setError(err.response?.data?.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const response = await accountService.getAccounts({ limit: 100 });
      if (response.success && response.data) setAccounts(response.data.accounts || []);
    } catch (err) { console.error('Load accounts error:', err); }
  };

  const buildContFields = (disabled, customs) => [
    ...DEFAULT_CONTACT_FIELDS.filter(f => !disabled.includes(f.fieldName)).map(f => ({ ...f, isActive: true, _isStd: true })),
    ...customs.filter(f => f.isActive && f.showInCreate),
  ].sort((a, b) => a.displayOrder - b.displayOrder);

  const allFieldDefs = [
    ...DEFAULT_CONTACT_FIELDS.map(f => ({ ...f, isActive: !disabledStdFields.includes(f.fieldName), _isStd: true })),
    ...customFieldDefs,
  ].sort((a, b) => a.displayOrder - b.displayOrder);

  const loadCustomFields = async () => {
    try {
      const response = await fieldDefinitionService.getFieldDefinitions('Contact', true);
      const customs = (Array.isArray(response) ? response : []).filter(f => !f.isStandardField);
      setCustomFieldDefs(customs);
      setFieldDefinitions(buildContFields(disabledStdFields, customs));
    } catch (err) { console.error('Load field definitions error:', err); }
  };

  const handleToggleField = async (field) => {
    setTogglingField(field.fieldName);
    if (field._isStd) {
      const newDisabled = disabledStdFields.includes(field.fieldName)
        ? disabledStdFields.filter(n => n !== field.fieldName)
        : [...disabledStdFields, field.fieldName];
      localStorage.setItem(CONT_DISABLED_KEY, JSON.stringify(newDisabled));
      setDisabledStdFieldsState(newDisabled);
      setFieldDefinitions(buildContFields(newDisabled, customFieldDefs));
    } else {
      try {
        await fieldDefinitionService.toggleFieldStatus(field._id, !field.isActive);
        const updated = customFieldDefs.map(f => f._id === field._id ? { ...f, isActive: !f.isActive } : f);
        setCustomFieldDefs(updated);
        setFieldDefinitions(buildContFields(disabledStdFields, updated));
      } catch (err) { console.error('Toggle error:', err); }
    }
    setTogglingField(null);
  };

  const handleAddCustomField = async (fieldData) => {
    const created = await fieldDefinitionService.createFieldDefinition({ entityType: 'Contact', isStandardField: false, showInCreate: true, showInEdit: true, showInDetail: true, ...fieldData });
    const updated = [...customFieldDefs, { ...created, isActive: true }].sort((a, b) => a.displayOrder - b.displayOrder);
    setCustomFieldDefs(updated);
    setFieldDefinitions(buildContFields(disabledStdFields, updated));
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

  const handleCreateContact = async (e) => {
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
      const contactData = { ...formData, ...standardFields, customFields: Object.keys(customFields).length > 0 ? customFields : undefined };
      await contactService.createContact(contactData);
      setSuccess('Contact created successfully!');
      setShowCreateForm(false);
      resetForm();
      loadContacts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { if (err?.isPermissionDenied) return; setError(err.response?.data?.message || 'Failed to create contact'); }
  };

  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', email: '', phone: '', mobile: '', account: '', title: '', department: '', isPrimary: false, doNotCall: false, emailOptOut: false, mailingStreet: '', mailingCity: '', mailingState: '', mailingCountry: '', mailingZipCode: '', description: '' });
    setFieldValues({});
    setFieldErrors({});
  };

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatsFilter = (filterType) => {
    if (filterType === 'all') {
      setFilters(prev => ({ ...prev, isPrimary: '', hasAccount: '' }));
    } else if (filterType === 'primary') {
      setFilters(prev => ({ ...prev, isPrimary: 'true', hasAccount: '' }));
    } else if (filterType === 'withAccount') {
      setFilters(prev => ({ ...prev, isPrimary: '', hasAccount: 'true' }));
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // === Split View Functions ===
  const loadContactDetails = async (contactId) => {
    setSelectedContactId(contactId);
    setLoadingDetail(true);
    setDetailActiveTab('overview');
    closeDetailForms();

    try {
      const response = await contactService.getContact(contactId);
      if (response?.success) {
        setSelectedContactData(response.data);
        loadDetailTasks(contactId);
        loadDetailNotes(contactId);
        loadDetailCustomFields();
      }
    } catch (err) { console.error('Error loading contact details:', err); }
    finally { setLoadingDetail(false); }
  };

  // Handle contact click - check PIN first
  const handleContactClick = (contactId) => {
    if (selectedContactId === contactId) return;

    if (!isPinVerified) {
      setPendingContactId(contactId);
      setShowPinModal(true);
      return;
    }
    loadContactDetails(contactId);
  };

  // Handle PIN verification success
  const handlePinVerified = () => {
    setIsPinVerified(true);
    setShowPinModal(false);
    if (pendingContactId) {
      loadContactDetails(pendingContactId);
      setPendingContactId(null);
    }
  };

  const loadDetailTasks = async (contactId) => {
    try {
      const response = await taskService.getTasks({ relatedTo: 'Contact', relatedToId: contactId, limit: 100 });
      if (response?.success) setDetailTasks(response.data.tasks || []);
    } catch (err) { console.error('Load tasks error:', err); }
  };

  const loadDetailNotes = async (contactId) => {
    try {
      const response = await noteService.getNotes({ relatedTo: 'Contact', relatedToId: contactId, limit: 100 });
      if (response?.success) setDetailNotes(response.data?.notes || []);
    } catch (err) { console.error('Load notes error:', err); }
  };

  const loadDetailCustomFields = async () => {
    try {
      const response = await fieldDefinitionService.getFieldDefinitions('Contact', false);
      if (response && Array.isArray(response)) {
        const activeFields = response.filter(field => field.isActive && field.showInDetail).sort((a, b) => a.displayOrder - b.displayOrder);
        setCustomFieldDefinitions(activeFields);
      }
    } catch (err) { console.error('Load custom fields error:', err); }
  };

  const closeDetailForms = () => {
    setShowDetailEditForm(false);
    setShowDetailDeleteConfirm(false);
    setShowDetailTaskForm(false);
    setShowDetailNoteForm(false);
  };

  const closeSidePanel = () => {
    setSelectedContactId(null);
    setSelectedContactData(null);
    setDetailTasks([]);
    setDetailNotes([]);
    closeDetailForms();
  };

  // Detail Panel Handlers
  const handleDetailCreateTask = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await taskService.createTask({ ...detailTaskData, relatedTo: 'Contact', relatedToId: selectedContactId });
      setSuccess('Task created successfully!');
      setShowDetailTaskForm(false);
      setDetailTaskData({ subject: '', dueDate: '', status: 'Not Started', priority: 'Normal', description: '' });
      loadDetailTasks(selectedContactId);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { if (err?.isPermissionDenied) return; setError(err.message || 'Failed to create task'); }
  };

  const handleDetailCreateNote = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await noteService.createNote({ ...detailNoteData, relatedTo: 'Contact', relatedToId: selectedContactId });
      setSuccess('Note created successfully!');
      setShowDetailNoteForm(false);
      setDetailNoteData({ title: '', content: '' });
      loadDetailNotes(selectedContactId);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { if (err?.isPermissionDenied) return; setError(err.message || 'Failed to create note'); }
  };

  const openDetailEditForm = () => {
    if (!selectedContactData) return;
    setDetailEditData({
      firstName: selectedContactData.firstName || '',
      lastName: selectedContactData.lastName || '',
      email: selectedContactData.email || '',
      phone: selectedContactData.phone || '',
      mobile: selectedContactData.mobile || '',
      title: selectedContactData.title || '',
      department: selectedContactData.department || '',
      description: selectedContactData.description || ''
    });
    closeDetailForms();
    setShowDetailEditForm(true);
  };

  const handleDetailUpdateContact = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await contactService.updateContact(selectedContactId, detailEditData);
      setSuccess('Contact updated successfully!');
      setShowDetailEditForm(false);
      const response = await contactService.getContact(selectedContactId);
      if (response?.success) setSelectedContactData(response.data);
      loadContacts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { if (err?.isPermissionDenied) return; setError(err.message || 'Failed to update contact'); }
  };

  const handleDetailEditChange = (e) => {
    const { name, value } = e.target;
    setDetailEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleDetailDeleteContact = async () => {
    try {
      setError('');
      await contactService.deleteContact(selectedContactId);
      setSuccess('Contact deleted successfully!');
      closeSidePanel();
      loadContacts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { if (err?.isPermissionDenied) return; setError(err.message || 'Failed to delete contact'); }
  };

  const canCreateContact = hasPermission('contact_management', 'create');
  const canUpdateContact = hasPermission('contact_management', 'update');
  const canDeleteContact = hasPermission('contact_management', 'delete');

  return (
    <DashboardLayout title="Contacts">
      {/* PIN Verification Modal */}
      <PinVerification
        isOpen={showPinModal}
        onClose={() => { setShowPinModal(false); setPendingContactId(null); }}
        onVerified={handlePinVerified}
        resourceType="contact"
        resourceId={pendingContactId}
        resourceName="Contact"
      />

      {success && <div style={{ padding: '16px 20px', background: '#DCFCE7', color: '#166534', borderRadius: '12px', marginBottom: '24px', border: '2px solid #86EFAC', fontWeight: '600' }}>{success}</div>}
      {error && <div style={{ padding: '16px 20px', background: '#FEE2E2', color: '#991B1B', borderRadius: '12px', marginBottom: '24px', border: '2px solid #FCA5A5', fontWeight: '600' }}>{error}</div>}

      {/* Split View Container */}
      <div style={{ display: 'flex', gap: '0', height: 'calc(100vh - 150px)', overflow: 'hidden' }}>
        {/* Left Side */}
        <div style={{ flex: selectedContactId ? '0 0 55%' : '1 1 100%', minWidth: 0, overflow: 'auto' }}>

          {/* Statistics Cards - Clickable */}
          <div className="stats-grid">
            <div
              className="stat-card"
              onClick={() => handleStatsFilter('all')}
              style={{
                cursor: 'pointer',
                border: filters.isPrimary === '' && filters.hasAccount === '' ? '2px solid #14b8a6' : '1px solid #e2e8f0',
                background: filters.isPrimary === '' && filters.hasAccount === '' ? 'linear-gradient(135deg, rgb(120 245 240) 0%, rgb(200 255 252) 100%)' : 'linear-gradient(135deg, rgb(153 255 251) 0%, rgb(255 255 255) 100%)',
                boxShadow: filters.isPrimary === '' && filters.hasAccount === '' ? '0 4px 12px rgba(20, 184, 166, 0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <div className="stat-label">Total Contacts</div>
              <div className="stat-value">{stats.total}</div>
            </div>
            <div
              className="stat-card"
              onClick={() => handleStatsFilter('primary')}
              style={{
                cursor: 'pointer',
                border: filters.isPrimary === 'true' ? '2px solid #14b8a6' : '1px solid #e2e8f0',
                background: filters.isPrimary === 'true' ? 'linear-gradient(135deg, rgb(120 245 240) 0%, rgb(200 255 252) 100%)' : 'linear-gradient(135deg, rgb(153 255 251) 0%, rgb(255 255 255) 100%)',
                boxShadow: filters.isPrimary === 'true' ? '0 4px 12px rgba(20, 184, 166, 0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <div className="stat-label">Primary Contacts</div>
              <div className="stat-value">{stats.primary}</div>
            </div>
            <div
              className="stat-card"
              onClick={() => handleStatsFilter('withAccount')}
              style={{
                cursor: 'pointer',
                border: filters.hasAccount === 'true' ? '2px solid #14b8a6' : '1px solid #e2e8f0',
                background: filters.hasAccount === 'true' ? 'linear-gradient(135deg, rgb(120 245 240) 0%, rgb(200 255 252) 100%)' : 'linear-gradient(135deg, rgb(153 255 251) 0%, rgb(255 255 255) 100%)',
                boxShadow: filters.hasAccount === 'true' ? '0 4px 12px rgba(20, 184, 166, 0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <div className="stat-label">With Account</div>
              <div className="stat-value">{stats.withAccount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">This Page</div>
              <div className="stat-value">{stats.recent}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="crm-card" style={{ marginBottom: '24px' }}>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <input type="text" name="search" placeholder="Search contacts..." className="crm-form-input" value={filters.search} onChange={handleFilterChange} />
                <select name="account" className="crm-form-select" value={filters.account} onChange={handleFilterChange}>
                  <option value="">All Accounts</option>
                  {accounts.map(account => <option key={account._id} value={account._id}>{account.accountName}</option>)}
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
                  {canCreateContact && <button className="crm-btn crm-btn-primary" onClick={() => { closeAllForms(); resetForm(); setShowCreateForm(true); }}>+ New Contact</button>}
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
              entityLabel="Contact"
              sections={CONTACT_SECTIONS}
            />
          )}

          {/* Inline Create Contact Form */}
          {showCreateForm && (
            <div style={{ marginBottom: '16px', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(30,60,114,0.10)', border: '1px solid #e2e8f0' }}>
              <div style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 60%, #3b82f6 100%)', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#fff', letterSpacing: '0.2px' }}>Create New Contact</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>Fill in the details to add a new contact</p>
                </div>
                <button onClick={() => { setShowCreateForm(false); resetForm(); }} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '8px', cursor: 'pointer', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '16px' }}>✕</button>
              </div>
              <div style={{ padding: '16px', background: '#fafeff' }}>
                <form onSubmit={handleCreateContact}>
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '5px 10px', borderRadius: '7px', background: '#ecfeff', borderLeft: '3px solid #06b6d4' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06b6d4', flexShrink: 0 }} />
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#155e75', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account</span>
                    </div>
                    <select name="account" className="crm-form-select" style={{ padding: '6px 10px', fontSize: '12px', maxWidth: '260px', borderRadius: '7px' }} value={formData.account} onChange={handleChange} required>
                      <option value="">Select Account *</option>
                      {accounts.map(account => <option key={account._id} value={account._id}>{account.accountName}</option>)}
                    </select>
                  </div>
                  {(() => {
                    const groupedFields = groupFieldsBySection(fieldDefinitions);
                    const sectionOrder = ['Basic Information', 'Professional Information', 'Mailing Address', 'Additional Information'];
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
                    <button type="submit" style={{ padding: '8px 24px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #1e3c72 0%, #3b82f6 100%)', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 8px rgba(30,60,114,0.25)' }}>Create Contact</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Contact List */}
          <div className="crm-card">
            <div className="crm-card-header">
              <h2 className="crm-card-title">{viewMode === 'grid' ? 'Contact Cards' : 'Contact List'} ({pagination.total})</h2>
            </div>

            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
            ) : contacts.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <p style={{ fontSize: '18px', fontWeight: '600', color: '#1e3c72' }}>No contacts found</p>
                {canCreateContact && <button className="crm-btn crm-btn-primary" onClick={() => { resetForm(); setShowCreateForm(true); }}>+ Create First Contact</button>}
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {contacts.map((contact) => (
                      <div key={contact._id} onClick={() => handleContactClick(contact._id)}
                        style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', cursor: 'pointer', border: selectedContactId === contact._id ? '2px solid #1e3c72' : '2px solid #e5e7eb', transition: 'all 0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, rgb(153, 255, 251) 0%, rgb(255, 255, 255) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', color: '#1e3c72' }}>
                            {contact.firstName?.[0]}{contact.lastName?.[0]}
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e3c72' }}>{maskName(contact.firstName)} {maskName(contact.lastName)}</h3>
                            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{contact.title || 'No title'}</p>
                          </div>
                        </div>
                        {contact.isPrimary && <span style={{ display: 'inline-block', padding: '2px 8px', background: '#DCFCE7', color: '#166534', borderRadius: '4px', fontSize: '10px', fontWeight: '600', marginBottom: '8px' }}>Primary</span>}
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          <div>{maskEmail(contact.email)}</div>
                          {contact.account && <div style={{ marginTop: '4px' }}>{contact.account.accountName}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Name</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Account</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Email</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Phone</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contacts.map((contact) => (
                          <tr key={contact._id} onClick={() => handleContactClick(contact._id)}
                            style={{ cursor: 'pointer', borderBottom: '1px solid #e5e7eb', background: selectedContactId === contact._id ? '#EFF6FF' : 'white' }}>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, rgb(153, 255, 251) 0%, rgb(255, 255, 255) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: '#1e3c72' }}>
                                  {contact.firstName?.[0]}{contact.lastName?.[0]}
                                </div>
                                <div>
                                  <div style={{ fontWeight: '600', color: '#1e3c72', fontSize: '14px' }}>{maskName(contact.firstName)} {maskName(contact.lastName)}{contact.isPrimary && ' ⭐'}</div>
                                  <div style={{ fontSize: '12px', color: '#64748b' }}>{contact.title || '-'}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151' }}>{contact.account?.accountName || '-'}</td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151' }}>{maskEmail(contact.email)}</td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151' }}>{maskPhone(contact.phone || contact.mobile) || '-'}</td>
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

        {/* Right Side - Contact Detail Panel */}
        {selectedContactId && (
          <div style={{ flex: '0 0 45%', background: 'white', borderLeft: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Panel Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#1e3c72', fontSize: '15px', fontWeight: '600' }}>Contact Details</h3>
              <button onClick={closeSidePanel} style={{ background: 'rgba(30,60,114,0.1)', border: 'none', borderRadius: '6px', padding: '4px', color: '#1e3c72', cursor: 'pointer' }}><X className="h-5 w-5" /></button>
            </div>

            {/* Panel Content */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingDetail ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}><div className="spinner"></div></div>
              ) : selectedContactData ? (
                <div>
                  {/* Contact Header */}
                  <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, rgb(153, 255, 251) 0%, rgb(255, 255, 255) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e3c72', fontSize: '20px', fontWeight: 'bold' }}>
                        {selectedContactData.firstName?.charAt(0) || ''}{selectedContactData.lastName?.charAt(0) || ''}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 4px 0', color: '#1e3c72' }}>{selectedContactData.firstName} {selectedContactData.lastName}</h2>
                        <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>{selectedContactData.title || 'No title'} {selectedContactData.account && `at ${selectedContactData.account.accountName}`}</p>
                        {selectedContactData.isPrimary && <span style={{ display: 'inline-block', marginTop: '6px', padding: '2px 8px', background: '#DCFCE7', color: '#166534', borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}>Primary Contact</span>}
                      </div>
                    </div>
                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {canUpdateContact && <button className="crm-btn crm-btn-primary crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={openDetailEditForm}><Edit className="h-3 w-3 mr-1" />Edit</button>}
                      {canDeleteContact && <button className="crm-btn crm-btn-danger crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => { closeDetailForms(); setShowDetailDeleteConfirm(true); }}>Delete</button>}
                      {selectedContactData.phone && <button className="crm-btn crm-btn-outline crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => window.location.href = `tel:${selectedContactData.phone}`}><Phone className="h-3 w-3 mr-1" />Call</button>}
                    </div>
                  </div>

                  {/* Inline Edit Form */}
                  {showDetailEditForm && (
                    <div style={{ margin: '12px', padding: '12px', background: '#F0F9FF', borderRadius: '8px', border: '1px solid #93C5FD' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h5 style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#1E40AF' }}>Edit Contact</h5>
                        <button onClick={() => setShowDetailEditForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#64748b' }}>✕</button>
                      </div>
                      <form onSubmit={handleDetailUpdateContact}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>First Name *</label><input type="text" name="firstName" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.firstName || ''} onChange={handleDetailEditChange} required /></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Last Name *</label><input type="text" name="lastName" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.lastName || ''} onChange={handleDetailEditChange} required /></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Email *</label><input type="email" name="email" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.email || ''} onChange={handleDetailEditChange} required /></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Phone</label><input type="tel" name="phone" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.phone || ''} onChange={handleDetailEditChange} /></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Title</label><input type="text" name="title" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.title || ''} onChange={handleDetailEditChange} /></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Department</label><input type="text" name="department" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.department || ''} onChange={handleDetailEditChange} /></div>
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
                      <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#991B1B' }}>Delete <strong>{selectedContactData.firstName} {selectedContactData.lastName}</strong>?</p>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button className="crm-btn crm-btn-secondary crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => setShowDetailDeleteConfirm(false)}>Cancel</button>
                        <button className="crm-btn crm-btn-danger crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={handleDetailDeleteContact}>Delete</button>
                      </div>
                    </div>
                  )}

                  {/* Tabs */}
                  <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                    <button onClick={() => setDetailActiveTab('overview')} style={{ flex: 1, padding: '10px', fontSize: '12px', fontWeight: '600', border: 'none', background: detailActiveTab === 'overview' ? 'white' : 'transparent', borderBottom: detailActiveTab === 'overview' ? '2px solid #1e3c72' : '2px solid transparent', color: detailActiveTab === 'overview' ? '#1e3c72' : '#64748b', cursor: 'pointer' }}>Overview</button>
                    <button onClick={() => setDetailActiveTab('activities')} style={{ flex: 1, padding: '10px', fontSize: '12px', fontWeight: '600', border: 'none', background: detailActiveTab === 'activities' ? 'white' : 'transparent', borderBottom: detailActiveTab === 'activities' ? '2px solid #1e3c72' : '2px solid transparent', color: detailActiveTab === 'activities' ? '#1e3c72' : '#64748b', cursor: 'pointer' }}>Tasks ({detailTasks.length})</button>
                    <button onClick={() => setDetailActiveTab('notes')} style={{ flex: 1, padding: '10px', fontSize: '12px', fontWeight: '600', border: 'none', background: detailActiveTab === 'notes' ? 'white' : 'transparent', borderBottom: detailActiveTab === 'notes' ? '2px solid #1e3c72' : '2px solid transparent', color: detailActiveTab === 'notes' ? '#1e3c72' : '#64748b', cursor: 'pointer' }}>Notes ({detailNotes.length})</button>
                  </div>

                  {/* Tab Content */}
                  <div style={{ padding: '16px' }}>
                    {detailActiveTab === 'overview' && (
                      <div>
                        {/* Account Link */}
                        {selectedContactData.account && (
                          <div style={{ marginBottom: '12px', padding: '10px', background: '#F0F9FF', borderRadius: '8px', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Building2 className="h-4 w-4" style={{ color: '#1E40AF' }} />
                            <div>
                              <p style={{ fontSize: '9px', color: '#1E40AF', margin: 0, fontWeight: '600', textTransform: 'uppercase' }}>Account</p>
                              <p style={{ fontSize: '13px', fontWeight: '600', margin: 0, color: '#1e3c72' }}>{selectedContactData.account.accountName}</p>
                            </div>
                          </div>
                        )}
                        {(() => {
                          const SYSTEM_KEYS = new Set(['_id', '__v', 'tenant', 'createdBy', 'lastModifiedBy', 'updatedAt', 'createdAt', 'isActive', 'emailOptOut', 'doNotCall', 'customFields', 'account', 'relatedData', 'isPrimary']);
                          const fmtKey = (fn) => fn.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
                          const fieldMap = {};
                          DEFAULT_CONTACT_FIELDS.forEach(f => { fieldMap[f.fieldName] = { label: f.label, section: f.section, fieldType: f.fieldType }; });
                          customFieldDefs.forEach(f => { fieldMap[f.fieldName] = { label: f.label, section: f.section, fieldType: f.fieldType }; });
                          const grouped = {};
                          Object.keys(selectedContactData).forEach(key => {
                            if (SYSTEM_KEYS.has(key)) return;
                            const val = selectedContactData[key];
                            if (val === null || val === undefined || val === '') return;
                            if (typeof val === 'object' && !Array.isArray(val)) return;
                            const def = fieldMap[key];
                            const section = def?.section || 'Additional Information';
                            if (!grouped[section]) grouped[section] = [];
                            grouped[section].push({ key, label: def?.label || fmtKey(key), fieldType: def?.fieldType || 'text', value: val });
                          });
                          if (selectedContactData.customFields && typeof selectedContactData.customFields === 'object') {
                            Object.keys(selectedContactData.customFields).forEach(key => {
                              const val = selectedContactData.customFields[key];
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
                          const sectionOrder = ['Basic Information', 'Professional Information', 'Mailing Address', 'Additional Information', ...Object.keys(grouped).filter(s => !['Basic Information', 'Professional Information', 'Mailing Address', 'Additional Information'].includes(s))];
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
                                    const isPhone = fieldType === 'phone' || key === 'phone' || key === 'mobile';
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
                        {/* Related Deals/Opportunities */}
                        {selectedContactData.relatedData?.opportunities && (
                          <div style={{ marginTop: '16px' }}>
                            <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>Deals ({selectedContactData.relatedData.opportunities.total || 0})</h4>
                            {selectedContactData.relatedData.opportunities.data?.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {selectedContactData.relatedData.opportunities.data.map(opp => (
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
                        )}
                      </div>
                    )}

                    {detailActiveTab === 'activities' && (
                      <div>
                        <button className="crm-btn crm-btn-sm crm-btn-primary" style={{ fontSize: '11px', padding: '4px 10px', marginBottom: '12px' }} onClick={() => { closeDetailForms(); setShowDetailTaskForm(true); }}>+ Add Task</button>
                        {showDetailTaskForm && (
                          <div style={{ marginBottom: '12px', padding: '10px', background: '#F0FDF4', borderRadius: '6px', border: '1px solid #86EFAC' }}>
                            <form onSubmit={handleDetailCreateTask}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                                <div style={{ gridColumn: 'span 2' }}><label style={{ fontSize: '10px', fontWeight: '600' }}>Subject *</label><input type="text" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailTaskData.subject} onChange={(e) => setDetailTaskData({ ...detailTaskData, subject: e.target.value })} required /></div>
                                <div><label style={{ fontSize: '10px', fontWeight: '600' }}>Due Date *</label><input type="date" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailTaskData.dueDate} onChange={(e) => setDetailTaskData({ ...detailTaskData, dueDate: e.target.value })} required /></div>
                                <div><label style={{ fontSize: '10px', fontWeight: '600' }}>Priority</label><select className="crm-form-select" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailTaskData.priority} onChange={(e) => setDetailTaskData({ ...detailTaskData, priority: e.target.value })}><option value="High">High</option><option value="Normal">Normal</option><option value="Low">Low</option></select></div>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                <button type="button" className="crm-btn crm-btn-secondary crm-btn-sm" style={{ fontSize: '10px', padding: '3px 8px' }} onClick={() => setShowDetailTaskForm(false)}>Cancel</button>
                                <button type="submit" className="crm-btn crm-btn-success crm-btn-sm" style={{ fontSize: '10px', padding: '3px 8px' }}>Create</button>
                              </div>
                            </form>
                          </div>
                        )}
                        {detailTasks.length === 0 ? (
                          <p style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', padding: '20px', background: '#f9fafb', borderRadius: '6px' }}>No tasks found</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {detailTasks.map(task => (
                              <div key={task._id} style={{ padding: '10px', background: task.status === 'Completed' ? '#f9fafb' : '#F0FDF4', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                  <CheckCircle2 className={`h-3 w-3 ${task.status === 'Completed' ? 'text-gray-400' : 'text-green-600'}`} />
                                  <span style={{ fontSize: '10px', background: task.priority === 'High' ? '#FEE2E2' : '#E0E7FF', color: task.priority === 'High' ? '#991B1B' : '#3730A3', padding: '1px 6px', borderRadius: '4px' }}>{task.priority}</span>
                                  {task.status === 'Completed' && <span style={{ fontSize: '10px', background: '#DCFCE7', color: '#166534', padding: '1px 6px', borderRadius: '4px' }}>Done</span>}
                                </div>
                                <p style={{ fontSize: '12px', fontWeight: '600', margin: '0 0 4px 0' }}>{task.subject}</p>
                                <p style={{ fontSize: '10px', color: '#6B7280', margin: 0 }}>Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {detailActiveTab === 'notes' && (
                      <div>
                        <button className="crm-btn crm-btn-sm crm-btn-primary" style={{ fontSize: '11px', padding: '4px 10px', marginBottom: '12px' }} onClick={() => { closeDetailForms(); setShowDetailNoteForm(true); }}>+ Add Note</button>
                        {showDetailNoteForm && (
                          <div style={{ marginBottom: '12px', padding: '10px', background: '#FDF4FF', borderRadius: '6px', border: '1px solid #E879F9' }}>
                            <form onSubmit={handleDetailCreateNote}>
                              <div style={{ marginBottom: '8px' }}><label style={{ fontSize: '10px', fontWeight: '600' }}>Title *</label><input type="text" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailNoteData.title} onChange={(e) => setDetailNoteData({ ...detailNoteData, title: e.target.value })} required /></div>
                              <div style={{ marginBottom: '8px' }}><label style={{ fontSize: '10px', fontWeight: '600' }}>Content *</label><textarea className="crm-form-textarea" rows="3" style={{ width: '100%', padding: '4px 6px', fontSize: '11px' }} value={detailNoteData.content} onChange={(e) => setDetailNoteData({ ...detailNoteData, content: e.target.value })} required /></div>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                <button type="button" className="crm-btn crm-btn-secondary crm-btn-sm" style={{ fontSize: '10px', padding: '3px 8px' }} onClick={() => setShowDetailNoteForm(false)}>Cancel</button>
                                <button type="submit" className="crm-btn crm-btn-primary crm-btn-sm" style={{ fontSize: '10px', padding: '3px 8px', background: '#A855F7' }}>Add Note</button>
                              </div>
                            </form>
                          </div>
                        )}
                        {detailNotes.length === 0 ? (
                          <p style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', padding: '20px', background: '#f9fafb', borderRadius: '6px' }}>No notes found</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {detailNotes.map(note => (
                              <div key={note._id} style={{ padding: '12px', background: '#FDF4FF', borderRadius: '8px', border: '1px solid #F5D0FE' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}><FileText className="h-4 w-4 text-purple-600" /><span style={{ fontSize: '13px', fontWeight: '600', color: '#86198F' }}>{note.title}</span></div>
                                <p style={{ fontSize: '12px', color: '#374151', lineHeight: '1.5', margin: '0 0 8px 0' }}>{note.content}</p>
                                <p style={{ fontSize: '10px', color: '#9CA3AF', margin: 0 }}>{new Date(note.createdAt).toLocaleString()}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Failed to load contact details</div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Contacts;
