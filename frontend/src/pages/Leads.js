import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { leadService } from '../services/leadService';
import { verificationService, debounce } from '../services/verificationService';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import TooltipButton from '../components/common/TooltipButton';
import '../styles/crm.css';
import BulkUploadForm from '../components/BulkUploadForm';

const Leads = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ✅ VERIFICATION STATES
  const [emailVerification, setEmailVerification] = useState({
    status: 'pending', // pending, verifying, valid, invalid
    message: '',
    isValid: null
  });

  const [phoneVerification, setPhoneVerification] = useState({
    status: 'pending',
    message: '',
    isValid: null
  });

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
    leadStatus: '',
    leadSource: '',
    rating: ''
  });

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    mobilePhone: '',
    fax: '',
    company: '',
    jobTitle: '',
    website: '',
    leadSource: '',
    leadStatus: '',
    industry: '',
    numberOfEmployees: '',
    annualRevenue: '',
    rating: '',
    emailOptOut: false,
    skypeId: '',
    secondaryEmail: '',
    twitter: '',
    street: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    flatHouseNo: '',
    latitude: '',
    longitude: '',
    description: ''
  });

  useEffect(() => {
    loadLeads();
  }, [pagination.page, filters]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await leadService.getLeads({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      if (response && response.success === true && response.data) {
        const leadsData = response.data.leads || [];
        setLeads(leadsData);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          pages: response.data.pagination?.pages || 0
        }));
      } else {
        setError(response?.message || 'Failed to load leads');
      }
    } catch (err) {
      console.error('Load leads error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  // ✅ EMAIL VERIFICATION FUNCTION
  const verifyEmail = async (email) => {
    if (!email || email.length < 5) {
      setEmailVerification({ status: 'pending', message: '', isValid: null });
      return;
    }

    setEmailVerification({ status: 'verifying', message: 'Verifying...', isValid: null });

    try {
      const result = await verificationService.verifyEmail(email);
      
      if (result.success && result.data) {
        const { isValid, status, message } = result.data;
        
        setEmailVerification({
          status: isValid ? 'valid' : status === 'unknown' ? 'unknown' : 'invalid',
          message: message || '',
          isValid: isValid
        });
      } else {
        setEmailVerification({
          status: 'unknown',
          message: 'Unable to verify',
          isValid: null
        });
      }
    } catch (err) {
      console.error('Email verification error:', err);
      setEmailVerification({
        status: 'unknown',
        message: 'Verification failed',
        isValid: null
      });
    }
  };

  // ✅ PHONE VERIFICATION FUNCTION
  const verifyPhone = async (phone) => {
    if (!phone || phone.length < 10) {
      setPhoneVerification({ status: 'pending', message: '', isValid: null });
      return;
    }

    setPhoneVerification({ status: 'verifying', message: 'Verifying...', isValid: null });

    try {
      const result = await verificationService.verifyPhone(phone);
      
      if (result.success && result.data) {
        const { isValid, status, message } = result.data;
        
        setPhoneVerification({
          status: isValid ? 'valid' : status === 'unknown' ? 'unknown' : 'invalid',
          message: message || '',
          isValid: isValid
        });
      } else {
        setPhoneVerification({
          status: 'unknown',
          message: 'Unable to verify',
          isValid: null
        });
      }
    } catch (err) {
      console.error('Phone verification error:', err);
      setPhoneVerification({
        status: 'unknown',
        message: 'Verification failed',
        isValid: null
      });
    }
  };

  // ✅ DEBOUNCED VERIFICATION
  const debouncedEmailVerify = useCallback(
    debounce((email) => verifyEmail(email), 2000),
    []
  );

  const debouncedPhoneVerify = useCallback(
    debounce((phone) => verifyPhone(phone), 2000),
    []
  );

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await leadService.createLead(formData);
      setSuccess('Lead created successfully!');
      setShowCreateModal(false);
      resetForm();
      loadLeads();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create lead');
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      mobilePhone: '',
      fax: '',
      company: '',
      jobTitle: '',
      website: '',
      leadSource: '',
      leadStatus: '',
      industry: '',
      numberOfEmployees: '',
      annualRevenue: '',
      rating: '',
      emailOptOut: false,
      skypeId: '',
      secondaryEmail: '',
      twitter: '',
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
      flatHouseNo: '',
      latitude: '',
      longitude: '',
      description: ''
    });
    setEmailVerification({ status: 'pending', message: '', isValid: null });
    setPhoneVerification({ status: 'pending', message: '', isValid: null });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: newValue
    }));

    // ✅ TRIGGER VERIFICATION ON EMAIL CHANGE
    if (name === 'email') {
      debouncedEmailVerify(newValue);
    }

    // ✅ TRIGGER VERIFICATION ON PHONE CHANGE
    if (name === 'phone') {
      debouncedPhoneVerify(newValue);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleLeadClick = (leadId) => {
    navigate(`/leads/${leadId}`);
  };

  const handleClearAddress = () => {
    setFormData(prev => ({
      ...prev,
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
      flatHouseNo: '',
      latitude: '',
      longitude: ''
    }));
  };

  const canCreateLead = hasPermission('lead_management', 'create');
  const canImportLeads = hasPermission('lead_management', 'import');

  const actionButton = (
    <TooltipButton
      className="header-action-btn"
      onClick={openCreateModal}
      disabled={!canCreateLead}
      tooltipText="You don't have permission to create leads"
    >
      + New Lead
    </TooltipButton>
  );

  // ✅ VERIFICATION ICON COMPONENT
  const VerificationIcon = ({ status, message }) => {
    if (status === 'pending') return null;
    
    if (status === 'verifying') {
      return (
        <span style={{ marginLeft: '8px', color: '#3B82F6', fontSize: '12px' }}>
          🔄 Verifying...
        </span>
      );
    }
    
    if (status === 'valid') {
      return (
        <span style={{ marginLeft: '8px', color: '#10B981', fontSize: '16px' }} title={message}>
          ✅
        </span>
      );
    }
    
    if (status === 'invalid') {
      return (
        <span style={{ marginLeft: '8px', color: '#EF4444', fontSize: '16px' }} title={message}>
          ❌
        </span>
      );
    }
    
    if (status === 'unknown') {
      return (
        <span style={{ marginLeft: '8px', color: '#F59E0B', fontSize: '16px' }} title={message}>
          ⚠️
        </span>
      );
    }
    
    return null;
  };

  return (
    <DashboardLayout title="Leads" actionButton={actionButton}>
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
            placeholder="Search leads..."
            className="crm-form-input"
            value={filters.search}
            onChange={handleFilterChange}
          />
          <select
            name="leadStatus"
            className="crm-form-select"
            value={filters.leadStatus}
            onChange={handleFilterChange}
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Unqualified">Unqualified</option>
            <option value="Lost">Lost</option>
          </select>
          <select
            name="leadSource"
            className="crm-form-select"
            value={filters.leadSource}
            onChange={handleFilterChange}
          >
            <option value="">All Sources</option>
            <option value="Website">Website</option>
            <option value="Referral">Referral</option>
            <option value="Campaign">Campaign</option>
            <option value="Cold Call">Cold Call</option>
            <option value="Social Media">Social Media</option>
          </select>
          <select
            name="rating"
            className="crm-form-select"
            value={filters.rating}
            onChange={handleFilterChange}
          >
            <option value="">All Ratings</option>
            <option value="Hot">Hot</option>
            <option value="Warm">Warm</option>
            <option value="Cold">Cold</option>
          </select>
          {canImportLeads && (
            <button
              className="crm-btn crm-btn-secondary"
              onClick={() => setShowBulkUploadModal(true)}
            >
              📤 Bulk Upload
            </button>
          )}
        </div>
      </div>

      {/* Leads Table */}
      <div className="crm-card">
        <div className="crm-card-header">
          <h2 className="crm-card-title">All Leads ({pagination.total})</h2>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '10px' }}>Loading leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            <p>No leads found. Create your first lead!</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Company</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Source</th>
                    <th>Rating</th>
                    <th>Owner</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr 
                      key={lead._id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleLeadClick(lead._id)}
                    >
                      <td>
                        <div style={{ fontWeight: '600' }}>
                          {lead.firstName} {lead.lastName}
                        </div>
                        {lead.jobTitle && (
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                            {lead.jobTitle}
                          </div>
                        )}
                      </td>
                      <td>{lead.company || '-'}</td>
                      <td>
                        {lead.email}
                        {lead.emailVerified && (
                          <span style={{ marginLeft: '4px', color: '#10B981' }} title="Verified">✅</span>
                        )}
                      </td>
                      <td>
                        {lead.phone || '-'}
                        {lead.phoneVerified && (
                          <span style={{ marginLeft: '4px', color: '#10B981' }} title="Verified">✅</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${(lead.leadStatus || 'new').toLowerCase()}`}>
                          {lead.leadStatus || 'New'}
                        </span>
                      </td>
                      <td>{lead.leadSource || '-'}</td>
                      <td>
                        <span className={`rating-badge ${(lead.rating || 'warm').toLowerCase()}`}>
                          {lead.rating || 'Warm'}
                        </span>
                      </td>
                      <td>
                        {lead.owner ? `${lead.owner.firstName || ''} ${lead.owner.lastName || ''}` : '-'}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="crm-btn crm-btn-sm crm-btn-primary"
                            onClick={() => handleLeadClick(lead._id)}
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '20px' }}>
                <button
                  className="crm-btn crm-btn-secondary crm-btn-sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </button>
                <span style={{ color: '#666', fontSize: '14px' }}>
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  className="crm-btn crm-btn-secondary crm-btn-sm"
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

      {/* Create Lead Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
          setError('');
        }}
        title="Create Lead"
        size="large"
      >
        <form onSubmit={handleCreateLead}>
          {/* Lead Image Section */}
          <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #E5E7EB' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Lead Image
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                background: '#F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed #D1D5DB',
                overflow: 'hidden'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
            </div>
          </div>

          {/* Lead Information Section */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ 
              fontSize: '12px', 
              fontWeight: '700', 
              color: '#111827', 
              marginBottom: '16px', 
              paddingBottom: '8px', 
              borderBottom: '2px solid #E5E7EB',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Lead Information
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 140px 1fr', gap: '12px 16px', alignItems: 'center' }}>
              {/* Lead Owner */}
              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Lead Owner</label>
              <div>
                <select className="crm-form-input" disabled style={{ background: '#F9FAFB' }}>
                  <option>{user?.firstName} {user?.lastName}</option>
                </select>
              </div>

              {/* Company */}
              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Company</label>
              <div>
                <input
                  type="text"
                  name="company"
                  className="crm-form-input"
                  value={formData.company}
                  onChange={handleChange}
                />
              </div>

              {/* First Name */}
              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>First Name</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select className="crm-form-select" style={{ width: '90px' }}>
                  <option>-None-</option>
                  <option>Mr.</option>
                  <option>Mrs.</option>
                  <option>Ms.</option>
                  <option>Dr.</option>
                </select>
                <input
                  type="text"
                  name="firstName"
                  className="crm-form-input"
                  style={{ flex: 1 }}
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>

              {/* Last Name */}
              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Last Name</label>
              <div>
                <input
                  type="text"
                  name="lastName"
                  className="crm-form-input"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>

              {/* Title */}
              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Title</label>
              <div>
                <input
                  type="text"
                  name="jobTitle"
                  className="crm-form-input"
                  value={formData.jobTitle}
                  onChange={handleChange}
                />
              </div>

              {/* ✅ EMAIL WITH VERIFICATION */}
              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  name="email"
                  className="crm-form-input"
                  value={formData.email}
                  onChange={handleChange}
                  style={{ paddingRight: '40px' }}
                />
                <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                  <VerificationIcon status={emailVerification.status} message={emailVerification.message} />
                </div>
                {emailVerification.message && emailVerification.status !== 'pending' && (
                  <div style={{ 
                    fontSize: '11px', 
                    marginTop: '4px',
                    color: emailVerification.status === 'valid' ? '#10B981' : emailVerification.status === 'invalid' ? '#EF4444' : '#F59E0B'
                  }}>
                    {emailVerification.message}
                  </div>
                )}
              </div>

              {/* ✅ PHONE WITH VERIFICATION */}
              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Phone</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  name="phone"
                  className="crm-form-input"
                  value={formData.phone}
                  onChange={handleChange}
                  style={{ paddingRight: '40px' }}
                />
                <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                  <VerificationIcon status={phoneVerification.status} message={phoneVerification.message} />
                </div>
                {phoneVerification.message && phoneVerification.status !== 'pending' && (
                  <div style={{ 
                    fontSize: '11px', 
                    marginTop: '4px',
                    color: phoneVerification.status === 'valid' ? '#10B981' : phoneVerification.status === 'invalid' ? '#EF4444' : '#F59E0B'
                  }}>
                    {phoneVerification.message}
                  </div>
                )}
              </div>

              {/* Fax */}
              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Fax</label>
              <div>
                <input
                  type="text"
                  name="fax"
                  className="crm-form-input"
                  value={formData.fax}
                  onChange={handleChange}
                />
              </div>

              {/* Mobile */}
              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Mobile</label>
              <div>
                <input
                  type="tel"
                  name="mobilePhone"
                  className="crm-form-input"
                  value={formData.mobilePhone}
                  onChange={handleChange}
                />
              </div>

              {/* Website */}
              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Website</label>
              <div>
                <input
                  type="url"
                  name="website"
                  className="crm-form-input"
                  value={formData.website}
                  onChange={handleChange}
                />
              </div>

              {/* Lead Source */}
              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Lead Source</label>
              <div>
                <select
                  name="leadSource"
                  className="crm-form-select"
                  value={formData.leadSource}
                  onChange={handleChange}
                >
                  <option value="">-None-</option>
                  <option value="Advertisement">Advertisement</option>
                  <option value="Cold Call">Cold Call</option>
                  <option value="Employee Referral">Employee Referral</option>
                  <option value="External Referral">External Referral</option>
                  <option value="Partner">Partner</option>
                  <option value="Public Relations">Public Relations</option>
                  <option value="Trade Show">Trade Show</option>
                  <option value="Web Research">Web Research</option>
                  <option value="Website">Website</option>
                </select>
              </div>

              {/* Lead Status */}
              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Lead Status</label>
              <div>
                <select
                  name="leadStatus"
                  className="crm-form-select"
                  value={formData.leadStatus}
                  onChange={handleChange}
                >
                  <option value="">-None-</option>
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Unqualified">Unqualified</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>

              {/* Industry */}
              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Industry</label>
              <div>
                <select
                  name="industry"
                  className="crm-form-select"
                  value={formData.industry}
                  onChange={handleChange}
                >
                  <option value="">-None-</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Banking">Banking</option>
                  <option value="Biotechnology">Biotechnology</option>
                  <option value="Construction">Construction</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Education">Education</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Energy">Energy</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Finance">Finance</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Hospitality">Hospitality</option>
                  <option value="Insurance">Insurance</option>
                  <option value="IT">IT</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Retail">Retail</option>
                  <option value="Technology">Technology</option>
                  <option value="Telecommunications">Telecommunications</option>
                </select>
              </div>

              {/* No. of Employees */}
              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>No. of Employees</label>
              <div>
                <input
                  type="number"
                  name="numberOfEmployees"
                  className="crm-form-input"
                  value={formData.numberOfEmployees}
                  onChange={handleChange}
                />
              </div>

              {/* Annual Revenue */}
              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Annual Revenue</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280', fontSize: '13px' }}>₹</span>
                <input
                  type="number"
                  name="annualRevenue"
                  className="crm-form-input"
                  style={{ paddingLeft: '28px' }}
                  value={formData.annualRevenue}
                  onChange={handleChange}
                />
              </div>

              {/* Rating */}
              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Rating</label>
              <div>
                <select
                  name="rating"
                  className="crm-form-select"
                  value={formData.rating}
                  onChange={handleChange}
                >
                  <option value="">-None-</option>
                  <option value="Hot">Hot</option>
                  <option value="Warm">Warm</option>
                  <option value="Cold">Cold</option>
                </select>
              </div>

              {/* Email Opt Out */}
              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Email Opt Out</label>
              <div>
                <input
                  type="checkbox"
                  name="emailOptOut"
                  checked={formData.emailOptOut}
                  onChange={handleChange}
                  style={{ width: '18px', height: '18px' }}
                />
              </div>

              {/* Skype ID */}
              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Skype ID</label>
              <div>
                <input
                  type="text"
                  name="skypeId"
                  className="crm-form-input"
                  value={formData.skypeId}
                  onChange={handleChange}
                />
              </div>

              {/* Secondary Email */}
              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Secondary Email</label>
              <div>
                <input
                  type="email"
                  name="secondaryEmail"
                  className="crm-form-input"
                  value={formData.secondaryEmail}
                  onChange={handleChange}
                />
              </div>

              {/* Twitter */}
              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Twitter</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280', fontSize: '13px' }}>@</span>
                <input
                  type="text"
                  name="twitter"
                  className="crm-form-input"
                  style={{ paddingLeft: '28px' }}
                  value={formData.twitter}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Address Information Section */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ 
              fontSize: '12px', 
              fontWeight: '700', 
              color: '#111827', 
              marginBottom: '16px', 
              paddingBottom: '8px', 
              borderBottom: '2px solid #E5E7EB',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Address Information
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 140px 1fr', gap: '12px 16px', alignItems: 'start' }}>
              {/* Address */}
              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right', paddingTop: '8px' }}>Address</label>
              <div style={{ gridColumn: 'span 3' }}>
                <textarea
                  name="street"
                  className="crm-form-textarea"
                  rows="2"
                  value={formData.street}
                  onChange={handleChange}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Country/Region */}
              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Country/Region</label>
              <div>
                <select
                  name="country"
                  className="crm-form-select"
                  value={formData.country}
                  onChange={handleChange}
                >
                  <option value="">-None-</option>
                  <option value="India">India</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="Germany">Germany</option>
                  <option value="France">France</option>
                </select>
              </div>

              {/* Flat/House No */}
              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Flat/House No</label>
              <div>
                <input
                  type="text"
                  name="flatHouseNo"
                  className="crm-form-input"
                  value={formData.flatHouseNo}
                  onChange={handleChange}
                />
              </div>

              {/* City */}
              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>City</label>
              <div>
                <input
                  type="text"
                  name="city"
                  className="crm-form-input"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>

              {/* State/Province */}
              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>State/Province</label>
              <div>
                <select
                  name="state"
                  className="crm-form-select"
                  value={formData.state}
                  onChange={handleChange}
                >
                  <option value="">-None-</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Gujarat">Gujarat</option>
                </select>
              </div>

              {/* Zip/Postal Code */}
              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Zip/Postal Code</label>
              <div>
                <input
                  type="text"
                  name="zipCode"
                  className="crm-form-input"
                  value={formData.zipCode}
                  onChange={handleChange}
                />
              </div>

              {/* Coordinates */}
              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Coordinates</label>
              <div style={{ display: 'flex', gap: '8px', gridColumn: 'span 3' }}>
                <input
                  type="text"
                  name="latitude"
                  className="crm-form-input"
                  placeholder="Latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  style={{ flex: 1 }}
                />
                <input
                  type="text"
                  name="longitude"
                  className="crm-form-input"
                  placeholder="Longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleClearAddress}
                  style={{
                    padding: '8px 16px',
                    background: 'white',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#6B7280',
                    cursor: 'pointer'
                  }}
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          {/* Description Information Section */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ 
              fontSize: '12px', 
              fontWeight: '700', 
              color: '#111827', 
              marginBottom: '16px', 
              paddingBottom: '8px', 
              borderBottom: '2px solid #E5E7EB',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Description Information
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '12px 16px', alignItems: 'start' }}>
              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right', paddingTop: '8px' }}>Description</label>
              <div>
                <textarea
                  name="description"
                  className="crm-form-textarea"
                  rows="4"
                  value={formData.description}
                  onChange={handleChange}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '12px', 
            paddingTop: '20px', 
            borderTop: '1px solid #E5E7EB',
            marginTop: '20px'
          }}>
            <button
              type="button"
              className="crm-btn crm-btn-secondary"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
                setError('');
              }}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="crm-btn crm-btn-secondary"
              onClick={() => {
                handleCreateLead(new Event('submit'));
                resetForm();
              }}
            >
              Save and New
            </button>
            <button type="submit" className="crm-btn crm-btn-primary">
              Save
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <Modal 
          isOpen={showBulkUploadModal} 
          onClose={() => setShowBulkUploadModal(false)} 
          title="Bulk Upload Leads"
          size="large"
        >
          <BulkUploadForm 
            onClose={() => setShowBulkUploadModal(false)} 
            onSuccess={loadLeads} 
          />
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default Leads;