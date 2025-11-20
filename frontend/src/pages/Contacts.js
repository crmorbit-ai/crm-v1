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

  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
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
        setContacts(response.data.contacts || []);
        setPagination(prev => ({
          ...prev, total: response.data.pagination?.total || 0, pages: response.data.pagination?.pages || 0
        }));
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

  const actionButton = canCreateContact ? (
    <button className="crm-btn crm-btn-primary" onClick={openCreateModal}>+ New Contact</button>
  ) : null;

  return (
    <DashboardLayout title="Contacts" actionButton={actionButton}>
      {success && <div style={{padding:'16px',background:'#DCFCE7',color:'#166534',borderRadius:'8px',marginBottom:'20px'}}>{success}</div>}
      {error && <div style={{padding:'16px',background:'#FEE2E2',color:'#991B1B',borderRadius:'8px',marginBottom:'20px'}}>{error}</div>}

      <div className="crm-card" style={{marginBottom:'20px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:'16px'}}>
          <input type="text" name="search" placeholder="Search contacts..." className="crm-form-input" value={filters.search} onChange={handleFilterChange} />
          <select name="account" className="crm-form-select" value={filters.account} onChange={handleFilterChange}>
            <option value="">All Accounts</option>
            {accounts.map(account => <option key={account._id} value={account._id}>{account.accountName}</option>)}
          </select>
          <input type="text" name="title" placeholder="Filter by title..." className="crm-form-input" value={filters.title} onChange={handleFilterChange} />
        </div>
      </div>

      <div className="crm-card">
        <div className="crm-card-header">
          <h2 className="crm-card-title">All Contacts ({pagination.total})</h2>
        </div>

        {loading ? (
          <div style={{padding:'40px',textAlign:'center'}}>Loading...</div>
        ) : contacts.length === 0 ? (
          <div style={{padding:'40px',textAlign:'center',color:'#666'}}>No contacts found</div>
        ) : (
          <>
            <div style={{overflowX:'auto'}}>
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Account</th>
                    <th>Title</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Primary</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr key={contact._id} onClick={()=>navigate(`/contacts/${contact._id}`)} style={{cursor:'pointer'}}>
                      <td>
                        <div style={{fontWeight:'600',color:'#3B82F6'}}>{contact.firstName} {contact.lastName}</div>
                        {contact.department && <div style={{fontSize:'12px',color:'#666'}}>{contact.department}</div>}
                      </td>
                      <td>
                        {contact.account ? (
                          <div>
                            <div style={{fontWeight:'500'}}>{contact.account.accountName}</div>
                            <div style={{fontSize:'11px',color:'#666'}}>{contact.account.accountNumber}</div>
                          </div>
                        ) : '-'}
                      </td>
                      <td>{contact.title || '-'}</td>
                      <td>{contact.email}</td>
                      <td>{contact.phone || contact.mobile || '-'}</td>
                      <td>{contact.isPrimary && <span className="status-badge hot">Primary</span>}</td>
                      <td onClick={(e)=>e.stopPropagation()}>
                        <div style={{display:'flex',gap:'8px'}}>
                          {canUpdateContact && (
                            <button className="crm-btn crm-btn-sm crm-btn-secondary" onClick={(e)=>openEditModal(e, contact)}>Edit</button>
                          )}
                          {canDeleteContact && (
                            <button className="crm-btn crm-btn-sm crm-btn-danger" onClick={(e)=>openDeleteModal(e, contact)}>Delete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="pagination">
                <button className="crm-btn crm-btn-outline" onClick={()=>setPagination(prev=>({...prev,page:prev.page-1}))} disabled={pagination.page===1}>Previous</button>
                <span className="pagination-info">Page {pagination.page} of {pagination.pages}</span>
                <button className="crm-btn crm-btn-outline" onClick={()=>setPagination(prev=>({...prev,page:prev.page+1}))} disabled={pagination.page===pagination.pages}>Next</button>
              </div>
            )}
          </>
        )}
      </div>

      <Modal isOpen={showCreateModal} onClose={()=>{setShowCreateModal(false);resetForm();setError('');}} title="Create New Contact" size="large">
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
              {accounts.map(account=><option key={account._id} value={account._id}>{account.accountName}</option>)}
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
            <button type="button" className="crm-btn crm-btn-outline" onClick={()=>setShowCreateModal(false)}>Cancel</button>
            <button type="submit" className="crm-btn crm-btn-primary">Create Contact</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditModal} onClose={()=>{setShowEditModal(false);setSelectedContact(null);resetForm();}} title="Edit Contact" size="large">
        <form onSubmit={handleUpdateContact}>
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
          <div className="modal-footer">
            <button type="button" className="crm-btn crm-btn-outline" onClick={()=>setShowEditModal(false)}>Cancel</button>
            <button type="submit" className="crm-btn crm-btn-primary">Update Contact</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={()=>{setShowDeleteModal(false);setSelectedContact(null);}} title="Delete Contact" size="small">
        <div>
          <p>Delete this contact?</p>
          <p style={{fontWeight:'600',marginTop:'10px'}}>{selectedContact?.firstName} {selectedContact?.lastName}</p>
          <div className="modal-footer">
            <button className="crm-btn crm-btn-outline" onClick={()=>setShowDeleteModal(false)}>Cancel</button>
            <button className="crm-btn crm-btn-danger" onClick={handleDeleteContact}>Delete</button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default Contacts;