import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { contactService } from '../services/contactService';
import { accountService } from '../services/accountService';
import Modal from '../components/common/Modal';
import DashboardLayout from '../components/layout/DashboardLayout';
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', mobile: '', account: '', title: '', department: '',
    isPrimary: false, doNotCall: false, emailOptOut: false, mailingStreet: '', mailingCity: '', mailingState: '',
    mailingCountry: '', mailingZipCode: '', description: ''
  });

  const [stats, setStats] = useState({
    total: 0,
    primary: 0,
    withAccount: 0,
    recent: 0
  });

  useEffect(() => {
    loadContacts();
    loadAccounts();
  }, [pagination.page, filters.search, filters.account, filters.title]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await contactService.getContacts({
        page: pagination.page, limit: pagination.limit, ...filters
      });
      if (response.success && response.data) {
        const contactsData = response.data.contacts || [];
        setContacts(contactsData);
        setPagination(prev => ({
          ...prev, total: response.data.pagination?.total || 0, pages: response.data.pagination?.pages || 0
        }));

        // Calculate stats
        const primary = contactsData.filter(c => c.isPrimary).length;
        const withAccount = contactsData.filter(c => c.account).length;
        setStats({
          total: response.data.pagination?.total || 0,
          primary,
          withAccount,
          recent: contactsData.length
        });
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

  const handleCreateContact = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await contactService.createContact(formData);
      setSuccess('Contact created successfully!');
      setShowCreateModal(false);
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
      setShowEditModal(false);
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
      setShowDeleteModal(false);
      setSelectedContact(null);
      loadContacts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete contact');
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (e, contact) => {
    e.stopPropagation();
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
    setShowEditModal(true);
  };

  const openDeleteModal = (e, contact) => {
    e.stopPropagation();
    setSelectedContact(contact);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      firstName: '', lastName: '', email: '', phone: '', mobile: '', account: '', title: '', department: '',
      isPrimary: false, doNotCall: false, emailOptOut: false, mailingStreet: '', mailingCity: '', mailingState: '',
      mailingCountry: '', mailingZipCode: '', description: ''
    });
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
      {canCreateContact && (
        <button className="crm-btn crm-btn-primary" onClick={openCreateModal}>+ New Contact</button>
      )}
    </div>
  );

  return (
    <DashboardLayout title="Contacts" actionButton={actionButton}>
      {success && <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)', color: '#166534', borderRadius: '12px', marginBottom: '24px', border: '2px solid #86EFAC', fontWeight: '600', boxShadow: '0 4px 15px rgba(34, 197, 94, 0.2)' }}>✓ {success}</div>}
      {error && <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)', color: '#991B1B', borderRadius: '12px', marginBottom: '24px', border: '2px solid #FCA5A5', fontWeight: '600', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)' }}>⚠ {error}</div>}

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
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#1e3c72' }}>
            🔍 Search & Filter
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <input type="text" name="search" placeholder="Search contacts..." className="crm-form-input" value={filters.search} onChange={handleFilterChange} />
            <select name="account" className="crm-form-select" value={filters.account} onChange={handleFilterChange}>
              <option value="">All Accounts</option>
              {accounts.map(account => <option key={account._id} value={account._id}>{account.accountName}</option>)}
            </select>
            <input type="text" name="title" placeholder="Filter by title..." className="crm-form-input" value={filters.title} onChange={handleFilterChange} />
          </div>
        </div>
      </div>

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
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>👥</div>
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#1e3c72', marginBottom: '8px' }}>No contacts found</p>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>Create your first contact to get started!</p>
            {canCreateContact && <button className="crm-btn crm-btn-primary" onClick={openCreateModal}>+ Create First Contact</button>}
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
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                      borderRadius: '16px',
                      padding: '24px',
                      cursor: 'pointer',
                      border: '2px solid #e5e7eb',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
                        fontSize: '24px',
                        fontWeight: '800',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)'
                      }}>
                        {contact.firstName?.[0]}{contact.lastName?.[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '800', color: '#1e3c72' }}>
                          {contact.firstName} {contact.lastName}
                        </h3>
                        <p style={{ margin: '0', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                          {contact.title || 'No title'}
                        </p>
                      </div>
                    </div>
                    {contact.isPrimary && (
                      <div style={{ marginBottom: '12px' }}>
                        <span className="status-badge hot">⭐ Primary Contact</span>
                      </div>
                    )}
                    <div style={{ marginBottom: '16px', color: '#64748b', fontSize: '14px' }}>
                      <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📧</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.email}</span>
                      </div>
                      {(contact.phone || contact.mobile) && (
                        <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>📞</span>
                          <span>{contact.phone || contact.mobile}</span>
                        </div>
                      )}
                      {contact.account && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>🏢</span>
                          <span>{contact.account.accountName}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', paddingTop: '16px', borderTop: '2px solid #f1f5f9' }} onClick={(e) => e.stopPropagation()}>
                      {canUpdateContact && (
                        <button className="crm-btn crm-btn-sm crm-btn-secondary" onClick={(e) => openEditModal(e, contact)} style={{ flex: 1 }}>✏️ Edit</button>
                      )}
                      {canDeleteContact && (
                        <button className="crm-btn crm-btn-sm crm-btn-danger" onClick={(e) => openDeleteModal(e, contact)} style={{ flex: 1 }}>🗑️ Delete</button>
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
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact Info</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Title</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((contact) => (
                      <tr
                        key={contact._id}
                        onClick={(e) => { if (e.target.tagName !== 'BUTTON') navigate(`/contacts/${contact._id}`); }}
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
                              fontSize: '18px',
                              fontWeight: '800',
                              color: 'white',
                              boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)'
                            }}>
                              {contact.firstName?.[0]}{contact.lastName?.[0]}
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', color: '#1e3c72', fontSize: '15px', marginBottom: '4px' }}>
                                {contact.firstName} {contact.lastName}
                                {contact.isPrimary && <span style={{ marginLeft: '8px' }}>⭐</span>}
                              </div>
                              {contact.department && (
                                <div style={{ fontSize: '13px', color: '#64748b' }}>{contact.department}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          {contact.account ? (
                            <div>
                              <div style={{ fontWeight: '600', color: '#1e3c72', fontSize: '14px' }}>{contact.account.accountName}</div>
                              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{contact.account.accountNumber}</div>
                            </div>
                          ) : '-'}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569' }}>
                              <span>📧</span>
                              <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.email}</span>
                            </div>
                            {(contact.phone || contact.mobile) && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                                <span>📞</span>
                                <span>{contact.phone || contact.mobile}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontWeight: '600', color: '#475569', fontSize: '14px' }}>
                            {contact.title || '-'}
                          </div>
                        </td>
                        <td style={{ padding: '16px' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {canUpdateContact && (
                              <button className="crm-btn crm-btn-sm crm-btn-secondary" onClick={(e) => openEditModal(e, contact)}>Edit</button>
                            )}
                            {canDeleteContact && (
                              <button className="crm-btn crm-btn-sm crm-btn-danger" onClick={(e) => openDeleteModal(e, contact)}>Delete</button>
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

      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); resetForm(); setError(''); }} title="Create New Contact" size="large">
        <form onSubmit={handleCreateContact}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name *</label>
              <input type="text" name="firstName" className="crm-form-input" value={formData.firstName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input type="text" name="lastName" className="crm-form-input" value={formData.lastName} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-group">
            <label>Account *</label>
            <select name="account" className="crm-form-select" value={formData.account} onChange={handleChange} required>
              <option value="">Select Account</option>
              {accounts.map(account => <option key={account._id} value={account._id}>{account.accountName}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email *</label>
              <input type="email" name="email" className="crm-form-input" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="tel" name="phone" className="crm-form-input" value={formData.phone} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Mobile</label>
              <input type="tel" name="mobile" className="crm-form-input" value={formData.mobile} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Title</label>
              <input type="text" name="title" className="crm-form-input" value={formData.title} onChange={handleChange} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="crm-btn crm-btn-outline" onClick={() => setShowCreateModal(false)}>Cancel</button>
            <button type="submit" className="crm-btn crm-btn-primary">Create Contact</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedContact(null); resetForm(); }} title="Edit Contact" size="large">
        <form onSubmit={handleUpdateContact}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name *</label>
              <input type="text" name="firstName" className="crm-form-input" value={formData.firstName || ''} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input type="text" name="lastName" className="crm-form-input" value={formData.lastName || ''} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email *</label>
              <input type="email" name="email" className="crm-form-input" value={formData.email || ''} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="tel" name="phone" className="crm-form-input" value={formData.phone || ''} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Department</label>
              <input type="text" name="department" className="crm-form-input" value={formData.department || ''} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" className="crm-form-textarea" rows="3" value={formData.description || ''} onChange={handleChange} />
          </div>
          <div className="modal-footer">
            <button type="button" className="crm-btn crm-btn-outline" onClick={() => setShowEditModal(false)}>Cancel</button>
            <button type="submit" className="crm-btn crm-btn-primary">Update Contact</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setSelectedContact(null); }} title="Delete Contact" size="small">
        <div>
          <p>Delete this contact?</p>
          <p style={{ fontWeight: '600', marginTop: '10px' }}>{selectedContact?.firstName} {selectedContact?.lastName}</p>
          <div className="modal-footer">
            <button className="crm-btn crm-btn-outline" onClick={() => setShowDeleteModal(false)}>Cancel</button>
            <button className="crm-btn crm-btn-danger" onClick={handleDeleteContact}>Delete</button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default Contacts;
