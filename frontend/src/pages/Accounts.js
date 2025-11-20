import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { accountService } from '../services/accountService';
import Modal from '../components/common/Modal';
import DashboardLayout from '../components/layout/DashboardLayout';
import '../styles/crm.css';

const Accounts = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [accounts, setAccounts] = useState([]);
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

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    accountType: '',
    industry: ''
  });

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    accountName: '',
    accountType: 'Customer',
    industry: '',
    phone: '',
    website: '',
    fax: '',
    annualRevenue: '',
    numberOfEmployees: '',
    billingStreet: '',
    billingCity: '',
    billingState: '',
    billingCountry: '',
    billingZipCode: '',
    shippingStreet: '',
    shippingCity: '',
    shippingState: '',
    shippingCountry: '',
    shippingZipCode: '',
    description: ''
  });

  useEffect(() => {
    loadAccounts();
  }, [pagination.page, filters.search, filters.accountType, filters.industry]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await accountService.getAccounts({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      if (response.success && response.data) {
        setAccounts(response.data.accounts || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          pages: response.data.pagination?.pages || 0
        }));
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

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await accountService.createAccount(formData);
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
      accountName: account.accountName || '',
      accountType: account.accountType || 'Customer',
      industry: account.industry || '',
      phone: account.phone || '',
      website: account.website || '',
      fax: account.fax || '',
      annualRevenue: account.annualRevenue || '',
      numberOfEmployees: account.numberOfEmployees || '',
      billingStreet: account.billingAddress?.street || '',
      billingCity: account.billingAddress?.city || '',
      billingState: account.billingAddress?.state || '',
      billingCountry: account.billingAddress?.country || '',
      billingZipCode: account.billingAddress?.zipCode || '',
      shippingStreet: account.shippingAddress?.street || '',
      shippingCity: account.shippingAddress?.city || '',
      shippingState: account.shippingAddress?.state || '',
      shippingCountry: account.shippingAddress?.country || '',
      shippingZipCode: account.shippingAddress?.zipCode || '',
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
      accountName: '',
      accountType: 'Customer',
      industry: '',
      phone: '',
      website: '',
      fax: '',
      annualRevenue: '',
      numberOfEmployees: '',
      billingStreet: '',
      billingCity: '',
      billingState: '',
      billingCountry: '',
      billingZipCode: '',
      shippingStreet: '',
      shippingCity: '',
      shippingState: '',
      shippingCountry: '',
      shippingZipCode: '',
      description: ''
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const canCreateAccount = hasPermission('account_management', 'create');
  const canUpdateAccount = hasPermission('account_management', 'update');
  const canDeleteAccount = hasPermission('account_management', 'delete');

  const actionButton = canCreateAccount ? (
    <button className="crm-btn crm-btn-primary" onClick={openCreateModal}>
      + New Account
    </button>
  ) : null;

  return (
    <DashboardLayout title="Accounts" actionButton={actionButton}>
      {success && (
        <div style={{ padding: '16px', background: '#DCFCE7', color: '#166534', borderRadius: '8px', marginBottom: '20px' }}>
          {success}
        </div>
      )}
      {error && (
        <div style={{ padding: '16px', background: '#FEE2E2', color: '#991B1B', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="crm-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <input
            type="text"
            name="search"
            placeholder="Search accounts..."
            className="crm-form-input"
            value={filters.search}
            onChange={handleFilterChange}
          />
          <select
            name="accountType"
            className="crm-form-select"
            value={filters.accountType}
            onChange={handleFilterChange}
          >
            <option value="">All Types</option>
            <option value="Customer">Customer</option>
            <option value="Prospect">Prospect</option>
            <option value="Partner">Partner</option>
            <option value="Vendor">Vendor</option>
            <option value="Competitor">Competitor</option>
          </select>
          <select
            name="industry"
            className="crm-form-select"
            value={filters.industry}
            onChange={handleFilterChange}
          >
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

      {/* Accounts Table */}
      <div className="crm-card">
        <div className="crm-card-header">
          <h2 className="crm-card-title">All Accounts ({pagination.total})</h2>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '10px' }}>Loading accounts...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            <p>No accounts found. Create your first account!</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Account Name</th>
                    <th>Account Number</th>
                    <th>Type</th>
                    <th>Industry</th>
                    <th>Phone</th>
                    <th>Owner</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr 
                      key={account._id} 
                      onClick={() => navigate(`/accounts/${account._id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div style={{ fontWeight: '600', color: '#3B82F6' }}>
                          {account.accountName}
                        </div>
                        {account.website && (
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                            {account.website}
                          </div>
                        )}
                      </td>
                      <td><code>{account.accountNumber}</code></td>
                      <td>
                        <span className={`status-badge ${(account.accountType || 'customer').toLowerCase()}`}>
                          {account.accountType || 'Customer'}
                        </span>
                      </td>
                      <td>{account.industry || '-'}</td>
                      <td>{account.phone || '-'}</td>
                      <td>
                        {account.owner ? `${account.owner.firstName || ''} ${account.owner.lastName || ''}` : '-'}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {canUpdateAccount && (
                            <button
                              className="crm-btn crm-btn-sm crm-btn-secondary"
                              onClick={(e) => openEditModal(e, account)}
                            >
                              Edit
                            </button>
                          )}
                          {canDeleteAccount && (
                            <button
                              className="crm-btn crm-btn-sm crm-btn-danger"
                              onClick={(e) => openDeleteModal(e, account)}
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

      {/* Create Account Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
          setError('');
        }}
        title="Create New Account"
        size="large"
      >
        <form onSubmit={handleCreateAccount}>
          <div className="form-group">
            <label className="form-label">Account Name *</label>
            <input
              type="text"
              name="accountName"
              className="crm-form-input"
              value={formData.accountName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Account Type</label>
              <select
                name="accountType"
                className="crm-form-select"
                value={formData.accountType}
                onChange={handleChange}
              >
                <option value="Customer">Customer</option>
                <option value="Prospect">Prospect</option>
                <option value="Partner">Partner</option>
                <option value="Vendor">Vendor</option>
                <option value="Competitor">Competitor</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Industry</label>
              <select
                name="industry"
                className="crm-form-select"
                value={formData.industry}
                onChange={handleChange}
              >
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
              <input
                type="tel"
                name="phone"
                className="crm-form-input"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Website</label>
              <input
                type="url"
                name="website"
                className="crm-form-input"
                value={formData.website}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Annual Revenue</label>
              <input
                type="number"
                name="annualRevenue"
                className="crm-form-input"
                value={formData.annualRevenue}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Number of Employees</label>
              <input
                type="number"
                name="numberOfEmployees"
                className="crm-form-input"
                value={formData.numberOfEmployees}
                onChange={handleChange}
              />
            </div>
          </div>

          <h4 style={{ marginTop: '20px', marginBottom: '10px' }}>Billing Address</h4>
          <div className="form-group">
            <label className="form-label">Street</label>
            <input
              type="text"
              name="billingStreet"
              className="crm-form-input"
              value={formData.billingStreet}
              onChange={handleChange}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                name="billingCity"
                className="crm-form-input"
                value={formData.billingCity}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input
                type="text"
                name="billingState"
                className="crm-form-input"
                value={formData.billingState}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Country</label>
              <input
                type="text"
                name="billingCountry"
                className="crm-form-input"
                value={formData.billingCountry}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Zip Code</label>
              <input
                type="text"
                name="billingZipCode"
                className="crm-form-input"
                value={formData.billingZipCode}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="crm-form-textarea"
              rows="3"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="crm-btn crm-btn-outline"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
                setError('');
              }}
            >
              Cancel
            </button>
            <button type="submit" className="crm-btn crm-btn-primary">
              Create Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Account Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedAccount(null);
          resetForm();
          setError('');
        }}
        title="Edit Account"
        size="large"
      >
        <form onSubmit={handleUpdateAccount}>
          <div className="form-group">
            <label className="form-label">Account Name *</label>
            <input
              type="text"
              name="accountName"
              className="crm-form-input"
              value={formData.accountName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Account Type</label>
              <select
                name="accountType"
                className="crm-form-select"
                value={formData.accountType}
                onChange={handleChange}
              >
                <option value="Customer">Customer</option>
                <option value="Prospect">Prospect</option>
                <option value="Partner">Partner</option>
                <option value="Vendor">Vendor</option>
                <option value="Competitor">Competitor</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Industry</label>
              <select
                name="industry"
                className="crm-form-select"
                value={formData.industry}
                onChange={handleChange}
              >
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
              <input
                type="tel"
                name="phone"
                className="crm-form-input"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Website</label>
              <input
                type="url"
                name="website"
                className="crm-form-input"
                value={formData.website}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="crm-form-textarea"
              rows="3"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="crm-btn crm-btn-outline"
              onClick={() => {
                setShowEditModal(false);
                setSelectedAccount(null);
                resetForm();
                setError('');
              }}
            >
              Cancel
            </button>
            <button type="submit" className="crm-btn crm-btn-primary">
              Update Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedAccount(null);
        }}
        title="Delete Account"
        size="small"
      >
        <div>
          <p>Are you sure you want to delete this account?</p>
          <p style={{ marginTop: '10px' }}>
            <strong>{selectedAccount?.accountName}</strong><br />
            <span style={{ color: '#666' }}>Account #{selectedAccount?.accountNumber}</span>
          </p>
          <p style={{ marginTop: '15px', color: 'var(--error-color)', fontSize: '14px' }}>
            This action cannot be undone.
          </p>

          <div className="modal-footer">
            <button
              className="crm-btn crm-btn-outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedAccount(null);
              }}
            >
              Cancel
            </button>
            <button
              className="crm-btn crm-btn-danger"
              onClick={handleDeleteAccount}
            >
              Delete Account
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default Accounts;