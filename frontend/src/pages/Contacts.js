import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { contactService } from '../services/contactService';
import { accountService } from '../services/accountService';
import fieldDefinitionService from '../services/fieldDefinitionService';
import DashboardLayout from '../components/layout/DashboardLayout';
import DynamicField from '../components/DynamicField';
import '../styles/crm.css';

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
  const [filters, setFilters] = useState({ search: '', account: '', title: '' });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', mobile: '', account: '', title: '', department: '',
    isPrimary: false, doNotCall: false, emailOptOut: false, mailingStreet: '', mailingCity: '', mailingState: '',
    mailingCountry: '', mailingZipCode: '', description: ''
  });

  const [fieldDefinitions, setFieldDefinitions] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  const [stats, setStats] = useState({ total: 0, primary: 0, withAccount: 0, recent: 0 });

  useEffect(() => {
    loadContacts();
    loadAccounts();
    loadCustomFields();
  }, [pagination.page, filters.search, filters.account, filters.title]);

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
      console.error('Load contacts error:', err);
      setError(err.response?.data?.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const response = await accountService.getAccounts({ limit: 100 });
      if (response.success && response.data) setAccounts(response.data.accounts || []);
    } catch (err) {
      console.error('Load accounts error:', err);
    }
  };

  const loadCustomFields = async () => {
    try {
      const response = await fieldDefinitionService.getFieldDefinitions('Contact', false);
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

      const contactData = {
        ...formData,
        ...standardFields,
        customFields: Object.keys(customFields).length > 0 ? customFields : undefined
      };

      await contactService.createContact(contactData);
      setSuccess('Contact created successfully!');
      setShowCreateForm(false);
      resetForm();
      loadContacts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create contact');
    }
  };

  const handleUpdateContact = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await contactService.updateContact(selectedContact._id, formData);
      setSuccess('Contact updated successfully!');
      setShowEditForm(false);
      setSelectedContact(null);
      resetForm();
      loadContacts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update contact');
    }
  };

  const handleDeleteContact = async () => {
    try {
      setError('');
      await contactService.deleteContact(selectedContact._id);
      setSuccess('Contact deleted successfully!');
      setShowDeleteConfirm(false);
      setSelectedContact(null);
      loadContacts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete contact');
    }
  };

  const openCreateForm = () => {
    closeAllForms();
    resetForm();
    setShowCreateForm(true);
  };

  const openEditForm = (e, contact) => {
    e.stopPropagation();
    closeAllForms();
    setSelectedContact(contact);
    setFormData({
      firstName: contact.firstName || '', lastName: contact.lastName || '', email: contact.email || '',
      phone: contact.phone || '', mobile: contact.mobile || '', account: contact.account?._id || '',
      title: contact.title || '', department: contact.department || '', isPrimary: contact.isPrimary || false,
      doNotCall: contact.doNotCall || false, emailOptOut: contact.emailOptOut || false,
      mailingStreet: contact.mailingAddress?.street || '', mailingCity: contact.mailingAddress?.city || '',
      mailingState: contact.mailingAddress?.state || '', mailingCountry: contact.mailingAddress?.country || '',
      mailingZipCode: contact.mailingAddress?.zipCode || '', description: contact.description || ''
    });
    setShowEditForm(true);
  };

  const openDeleteConfirm = (e, contact) => {
    e.stopPropagation();
    closeAllForms();
    setSelectedContact(contact);
    setShowDeleteConfirm(true);
  };

  const resetForm = () => {
    setFormData({
      firstName: '', lastName: '', email: '', phone: '', mobile: '', account: '', title: '', department: '',
      isPrimary: false, doNotCall: false, emailOptOut: false, mailingStreet: '', mailingCity: '', mailingState: '',
      mailingCountry: '', mailingZipCode: '', description: ''
    });
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

  const canCreateContact = hasPermission('contact_management', 'create');
  const canUpdateContact = hasPermission('contact_management', 'update');
  const canDeleteContact = hasPermission('contact_management', 'delete');

  return (
    <DashboardLayout title="Contacts">
      {success && <div style={{ padding: '16px 20px', background: '#DCFCE7', color: '#166534', borderRadius: '12px', marginBottom: '24px', border: '2px solid #86EFAC', fontWeight: '600' }}>{success}</div>}
      {error && <div style={{ padding: '16px 20px', background: '#FEE2E2', color: '#991B1B', borderRadius: '12px', marginBottom: '24px', border: '2px solid #FCA5A5', fontWeight: '600' }}>{error}</div>}

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Contacts</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-change">All contacts</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Primary Contacts</div>
          <div className="stat-value">{stats.primary}</div>
          <div className="stat-change positive">Key contacts</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">With Account</div>
          <div className="stat-value">{stats.withAccount}</div>
          <div className="stat-change">Linked to accounts</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">This Page</div>
          <div className="stat-value">{stats.recent}</div>
          <div className="stat-change">Current page</div>
        </div>
      </div>

      {/* Filters */}
      <div className="crm-card" style={{ marginBottom: '24px' }}>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <input type="text" name="search" placeholder="Search contacts..." className="crm-form-input" value={filters.search} onChange={handleFilterChange} />
            <select name="account" className="crm-form-select" value={filters.account} onChange={handleFilterChange}>
              <option value="">All Accounts</option>
              {accounts.map(account => <option key={account._id} value={account._id}>{account.accountName}</option>)}
            </select>
            <input type="text" name="title" placeholder="Filter by title..." className="crm-form-input" value={filters.title} onChange={handleFilterChange} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className={`crm-btn crm-btn-sm ${viewMode === 'table' ? 'crm-btn-primary' : 'crm-btn-outline'}`} onClick={() => setViewMode('table')}>Table</button>
              <button className={`crm-btn crm-btn-sm ${viewMode === 'grid' ? 'crm-btn-primary' : 'crm-btn-outline'}`} onClick={() => setViewMode('grid')}>Grid</button>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              {canCreateContact && <button className="crm-btn crm-btn-primary" onClick={openCreateForm}>+ New Contact</button>}
            </div>
          </div>
        </div>
      </div>

      {/* Inline Create Contact Form - Compact */}
      {showCreateForm && (
        <div className="crm-card" style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1e3c72' }}>Create New Contact</h3>
            <button onClick={() => { setShowCreateForm(false); resetForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#64748b', padding: '2px 6px' }}>✕</button>
          </div>
          <div style={{ padding: '10px' }}>
            <form onSubmit={handleCreateContact}>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: '#374151', marginBottom: '2px' }}>Account *</label>
                <select name="account" className="crm-form-select" style={{ padding: '4px 6px', fontSize: '11px', maxWidth: '200px' }} value={formData.account} onChange={handleChange} required>
                  <option value="">Select Account</option>
                  {accounts.map(account => <option key={account._id} value={account._id}>{account.accountName}</option>)}
                </select>
              </div>

              {(() => {
                const groupedFields = groupFieldsBySection(fieldDefinitions);
                const sectionOrder = ['Basic Information', 'Contact Information', 'Address Information', 'Additional Information'];

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
                <button type="submit" className="crm-btn crm-btn-primary crm-btn-sm" style={{ padding: '4px 10px', fontSize: '11px' }}>Create Contact</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inline Edit Contact Form - Compact */}
      {showEditForm && selectedContact && (
        <div className="crm-card" style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1e3c72' }}>Edit Contact</h3>
            <button onClick={() => { setShowEditForm(false); setSelectedContact(null); resetForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#64748b', padding: '2px 6px' }}>✕</button>
          </div>
          <form onSubmit={handleUpdateContact}>
            <div style={{ padding: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '2px', fontSize: '10px', fontWeight: '600', color: '#374151' }}>First Name *</label>
                  <input type="text" name="firstName" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={formData.firstName || ''} onChange={handleChange} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '2px', fontSize: '10px', fontWeight: '600', color: '#374151' }}>Last Name *</label>
                  <input type="text" name="lastName" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={formData.lastName || ''} onChange={handleChange} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '2px', fontSize: '10px', fontWeight: '600', color: '#374151' }}>Email *</label>
                  <input type="email" name="email" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={formData.email || ''} onChange={handleChange} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '2px', fontSize: '10px', fontWeight: '600', color: '#374151' }}>Phone</label>
                  <input type="tel" name="phone" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={formData.phone || ''} onChange={handleChange} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '2px', fontSize: '10px', fontWeight: '600', color: '#374151' }}>Department</label>
                  <input type="text" name="department" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={formData.department || ''} onChange={handleChange} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '2px', fontSize: '10px', fontWeight: '600', color: '#374151' }}>Title</label>
                  <input type="text" name="title" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={formData.title || ''} onChange={handleChange} />
                </div>
              </div>
              <div style={{ marginTop: '8px', gridColumn: 'span 3' }}>
                <label style={{ display: 'block', marginBottom: '2px', fontSize: '10px', fontWeight: '600', color: '#374151' }}>Description</label>
                <textarea name="description" className="crm-form-textarea" rows="2" style={{ width: '100%', padding: '4px 6px', fontSize: '11px' }} value={formData.description || ''} onChange={handleChange} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', padding: '6px 10px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <button type="button" className="crm-btn crm-btn-secondary crm-btn-sm" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => { setShowEditForm(false); setSelectedContact(null); resetForm(); }}>Cancel</button>
              <button type="submit" className="crm-btn crm-btn-primary crm-btn-sm" style={{ padding: '4px 10px', fontSize: '11px' }}>Update Contact</button>
            </div>
          </form>
        </div>
      )}

      {/* Inline Delete Confirmation - Compact */}
      {showDeleteConfirm && selectedContact && (
        <div className="crm-card" style={{ marginBottom: '10px', border: '2px solid #FCA5A5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderBottom: '1px solid #e5e7eb', background: '#FEF2F2' }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#DC2626' }}>Delete Contact</h3>
            <button onClick={() => { setShowDeleteConfirm(false); setSelectedContact(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#64748b', padding: '2px 6px' }}>✕</button>
          </div>
          <div style={{ padding: '10px' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#374151' }}>Are you sure you want to delete this contact?</p>
            <p style={{ margin: 0, fontWeight: '600', fontSize: '13px', color: '#111827' }}>{selectedContact?.firstName} {selectedContact?.lastName}</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', padding: '6px 10px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
            <button className="crm-btn crm-btn-secondary crm-btn-sm" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => { setShowDeleteConfirm(false); setSelectedContact(null); }}>Cancel</button>
            <button className="crm-btn crm-btn-danger crm-btn-sm" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={handleDeleteContact}>Delete</button>
          </div>
        </div>
      )}

      <div className="crm-card">
        <div className="crm-card-header">
          <h2 className="crm-card-title">{viewMode === 'grid' ? 'Contact Cards' : 'Contact List'} ({pagination.total})</h2>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '16px', color: '#64748b', fontSize: '15px', fontWeight: '600' }}>Loading contacts...</p>
          </div>
        ) : contacts.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>C</div>
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#1e3c72', marginBottom: '8px' }}>No contacts found</p>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>Create your first contact to get started!</p>
            {canCreateContact && <button className="crm-btn crm-btn-primary" onClick={openCreateForm}>+ Create First Contact</button>}
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {contacts.map((contact) => (
                  <div
                    key={contact._id}
                    onClick={() => navigate(`/contacts/${contact._id}`)}
                    style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      padding: '24px',
                      cursor: 'pointer',
                      border: '2px solid #e5e7eb',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#4A90E2'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'linear-gradient(135deg, #4A90E2 0%, #2c5364 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '800', color: 'white' }}>
                        {contact.firstName?.[0]}{contact.lastName?.[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '800', color: '#1e3c72' }}>{contact.firstName} {contact.lastName}</h3>
                        <p style={{ margin: '0', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>{contact.title || 'No title'}</p>
                      </div>
                    </div>
                    {contact.isPrimary && <div style={{ marginBottom: '12px' }}><span className="status-badge hot">Primary Contact</span></div>}
                    <div style={{ marginBottom: '16px', color: '#64748b', fontSize: '14px' }}>
                      <div style={{ marginBottom: '6px' }}>{contact.email}</div>
                      {(contact.phone || contact.mobile) && <div style={{ marginBottom: '6px' }}>{contact.phone || contact.mobile}</div>}
                      {contact.account && <div>{contact.account.accountName}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', paddingTop: '16px', borderTop: '2px solid #f1f5f9' }} onClick={(e) => e.stopPropagation()}>
                      {canUpdateContact && <button className="crm-btn crm-btn-sm crm-btn-secondary" onClick={(e) => openEditForm(e, contact)} style={{ flex: 1 }}>Edit</button>}
                      {canDeleteContact && <button className="crm-btn crm-btn-sm crm-btn-danger" onClick={(e) => openDeleteConfirm(e, contact)} style={{ flex: 1 }}>Delete</button>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ overflowX: 'auto', padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Name</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Account</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Contact Info</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Title</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((contact) => (
                      <tr key={contact._id} onClick={(e) => { if (e.target.tagName !== 'BUTTON') navigate(`/contacts/${contact._id}`); }} style={{ background: '#ffffff', cursor: 'pointer', border: '2px solid #e5e7eb', borderRadius: '12px' }}>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #4A90E2 0%, #2c5364 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '800', color: 'white' }}>
                              {contact.firstName?.[0]}{contact.lastName?.[0]}
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', color: '#1e3c72', fontSize: '15px' }}>{contact.firstName} {contact.lastName}{contact.isPrimary && ' *'}</div>
                              {contact.department && <div style={{ fontSize: '13px', color: '#64748b' }}>{contact.department}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>{contact.account ? <div style={{ fontWeight: '600', color: '#1e3c72', fontSize: '14px' }}>{contact.account.accountName}</div> : '-'}</td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontSize: '13px', color: '#475569' }}>{contact.email}</div>
                          {(contact.phone || contact.mobile) && <div style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>{contact.phone || contact.mobile}</div>}
                        </td>
                        <td style={{ padding: '16px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>{contact.title || '-'}</td>
                        <td style={{ padding: '16px' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {canUpdateContact && <button className="crm-btn crm-btn-sm crm-btn-secondary" onClick={(e) => openEditForm(e, contact)}>Edit</button>}
                            {canDeleteContact && <button className="crm-btn crm-btn-sm crm-btn-danger" onClick={(e) => openDeleteConfirm(e, contact)}>Delete</button>}
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

export default Contacts;
