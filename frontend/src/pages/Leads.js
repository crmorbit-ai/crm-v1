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
  const [viewMode, setViewMode] = useState('table');

  const [emailVerification, setEmailVerification] = useState({
    status: 'pending',
    message: '',
    isValid: null
  });

  const [phoneVerification, setPhoneVerification] = useState({
    status: 'pending',
    message: '',
    isValid: null
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const [filters, setFilters] = useState({
    search: '',
    leadStatus: '',
    leadSource: '',
    rating: ''
  });

  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    qualified: 0,
    contacted: 0
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);

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

        // Calculate stats
        const newLeads = leadsData.filter(l => l.leadStatus === 'New').length;
        const qualified = leadsData.filter(l => l.leadStatus === 'Qualified').length;
        const contacted = leadsData.filter(l => l.leadStatus === 'Contacted').length;

        setStats({
          total: response.data.pagination?.total || 0,
          new: newLeads,
          qualified,
          contacted
        });
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

    if (name === 'email') {
      debouncedEmailVerify(newValue);
    }

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

  const getRatingIcon = (rating) => {
    const icons = {
      'Hot': '🔥',
      'Warm': '🌤️',
      'Cold': '❄️'
    };
    return icons[rating] || '📊';
  };

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
      <TooltipButton
        className="crm-btn crm-btn-primary"
        onClick={openCreateModal}
        disabled={!canCreateLead}
        tooltipText="You don't have permission to create leads"
      >
        + New Lead
      </TooltipButton>
    </div>
  );

  return (
    <DashboardLayout title="Leads" actionButton={actionButton}>
      {success && <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)', color: '#166534', borderRadius: '12px', marginBottom: '24px', border: '2px solid #86EFAC', fontWeight: '600', boxShadow: '0 4px 15px rgba(34, 197, 94, 0.2)' }}>✓ {success}</div>}
      {error && <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)', color: '#991B1B', borderRadius: '12px', marginBottom: '24px', border: '2px solid #FCA5A5', fontWeight: '600', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)' }}>⚠ {error}</div>}

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Leads</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-change">All leads</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">New Leads</div>
          <div className="stat-value">{stats.new}</div>
          <div className="stat-change positive">Fresh prospects</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Qualified</div>
          <div className="stat-value">{stats.qualified}</div>
          <div className="stat-change positive">Ready to convert</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Contacted</div>
          <div className="stat-value">{stats.contacted}</div>
          <div className="stat-change">In progress</div>
        </div>
      </div>

      {/* Filters */}
      <div className="crm-card" style={{ marginBottom: '24px' }}>
        <div style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#1e3c72' }}>🔍 Search & Filter</h3>
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
      </div>

      {/* Leads Display */}
      <div className="crm-card">
        <div className="crm-card-header">
          <h2 className="crm-card-title">{viewMode === 'grid' ? 'Lead Cards' : 'Lead List'} ({pagination.total})</h2>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '16px', color: '#64748b', fontSize: '15px', fontWeight: '600' }}>Loading leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎯</div>
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#1e3c72', marginBottom: '8px' }}>No leads found</p>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>Create your first lead to get started!</p>
            {canCreateLead && <button className="crm-btn crm-btn-primary" onClick={openCreateModal}>+ Create First Lead</button>}
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {leads.map((lead) => (
                  <div
                    key={lead._id}
                    onClick={() => handleLeadClick(lead._id)}
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
                        fontSize: '24px',
                        fontWeight: '800',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)'
                      }}>
                        {lead.firstName?.[0]}{lead.lastName?.[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '800', color: '#1e3c72' }}>
                          {lead.firstName} {lead.lastName}
                        </h3>
                        <p style={{ margin: '0', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                          {lead.jobTitle || 'No title'} {lead.company && `at ${lead.company}`}
                        </p>
                      </div>
                    </div>
                    <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span className={`status-badge ${(lead.leadStatus || 'new').toLowerCase()}`}>
                        {lead.leadStatus || 'New'}
                      </span>
                      {lead.rating && (
                        <span className={`rating-badge ${lead.rating.toLowerCase()}`}>
                          {getRatingIcon(lead.rating)} {lead.rating}
                        </span>
                      )}
                    </div>
                    <div style={{ marginBottom: '16px', color: '#64748b', fontSize: '14px' }}>
                      <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📧</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.email}</span>
                        {lead.emailVerified && <span style={{ color: '#10B981' }}>✅</span>}
                      </div>
                      {lead.phone && (
                        <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>📞</span>
                          <span>{lead.phone}</span>
                          {lead.phoneVerified && <span style={{ color: '#10B981' }}>✅</span>}
                        </div>
                      )}
                      {lead.leadSource && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>🌐</span>
                          <span>{lead.leadSource}</span>
                        </div>
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
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Company</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rating</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr
                        key={lead._id}
                        onClick={(e) => { if (e.target.tagName !== 'BUTTON') handleLeadClick(lead._id); }}
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
                              {lead.firstName?.[0]}{lead.lastName?.[0]}
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', color: '#1e3c72', fontSize: '15px', marginBottom: '4px' }}>
                                {lead.firstName} {lead.lastName}
                              </div>
                              {lead.jobTitle && (
                                <div style={{ fontSize: '13px', color: '#64748b' }}>{lead.jobTitle}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontWeight: '600', color: '#475569', fontSize: '14px' }}>
                            {lead.company || '-'}
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569' }}>
                              <span>📧</span>
                              <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.email}</span>
                              {lead.emailVerified && <span style={{ color: '#10B981' }}>✅</span>}
                            </div>
                            {lead.phone && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                                <span>📞</span>
                                <span>{lead.phone}</span>
                                {lead.phoneVerified && <span style={{ color: '#10B981' }}>✅</span>}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span className={`status-badge ${(lead.leadStatus || 'new').toLowerCase()}`}>
                            {lead.leadStatus || 'New'}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          {lead.rating ? (
                            <span className={`rating-badge ${lead.rating.toLowerCase()}`}>
                              {getRatingIcon(lead.rating)} {lead.rating}
                            </span>
                          ) : '-'}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontWeight: '600', color: '#475569', fontSize: '14px' }}>
                            {lead.leadSource || '-'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderTop: '2px solid #f1f5f9' }}>
                <button
                  className="crm-btn crm-btn-secondary"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  ← Previous
                </button>
                <span style={{ fontWeight: '700', color: '#1e3c72', fontSize: '15px' }}>
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  className="crm-btn crm-btn-secondary"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Lead Modal - Keep existing modal code */}
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
          <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #E5E7EB' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Lead Image
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #D1D5DB', overflow: 'hidden' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#111827', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #E5E7EB', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Lead Information
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 140px 1fr', gap: '12px 16px', alignItems: 'center' }}>
              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Lead Owner</label>
              <div>
                <select className="crm-form-input" disabled style={{ background: '#F9FAFB' }}>
                  <option>{user?.firstName} {user?.lastName}</option>
                </select>
              </div>

              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Company</label>
              <div>
                <input type="text" name="company" className="crm-form-input" value={formData.company} onChange={handleChange} />
              </div>

              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>First Name</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select className="crm-form-select" style={{ width: '90px' }}>
                  <option>-None-</option>
                  <option>Mr.</option>
                  <option>Mrs.</option>
                  <option>Ms.</option>
                  <option>Dr.</option>
                </select>
                <input type="text" name="firstName" className="crm-form-input" style={{ flex: 1 }} value={formData.firstName} onChange={handleChange} />
              </div>

              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Last Name</label>
              <div>
                <input type="text" name="lastName" className="crm-form-input" value={formData.lastName} onChange={handleChange} />
              </div>

              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Title</label>
              <div>
                <input type="text" name="jobTitle" className="crm-form-input" value={formData.jobTitle} onChange={handleChange} />
              </div>

              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <input type="email" name="email" className="crm-form-input" value={formData.email} onChange={handleChange} style={{ paddingRight: '40px' }} />
                <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                  <VerificationIcon status={emailVerification.status} message={emailVerification.message} />
                </div>
                {emailVerification.message && emailVerification.status !== 'pending' && (
                  <div style={{ fontSize: '11px', marginTop: '4px', color: emailVerification.status === 'valid' ? '#10B981' : emailVerification.status === 'invalid' ? '#EF4444' : '#F59E0B' }}>
                    {emailVerification.message}
                  </div>
                )}
              </div>

              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Phone</label>
              <div style={{ position: 'relative' }}>
                <input type="tel" name="phone" className="crm-form-input" value={formData.phone} onChange={handleChange} style={{ paddingRight: '40px' }} />
                <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                  <VerificationIcon status={phoneVerification.status} message={phoneVerification.message} />
                </div>
                {phoneVerification.message && phoneVerification.status !== 'pending' && (
                  <div style={{ fontSize: '11px', marginTop: '4px', color: phoneVerification.status === 'valid' ? '#10B981' : phoneVerification.status === 'invalid' ? '#EF4444' : '#F59E0B' }}>
                    {phoneVerification.message}
                  </div>
                )}
              </div>

              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Mobile</label>
              <div>
                <input type="tel" name="mobilePhone" className="crm-form-input" value={formData.mobilePhone} onChange={handleChange} />
              </div>

              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Website</label>
              <div>
                <input type="url" name="website" className="crm-form-input" value={formData.website} onChange={handleChange} />
              </div>

              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Lead Source</label>
              <div>
                <select name="leadSource" className="crm-form-select" value={formData.leadSource} onChange={handleChange}>
                  <option value="">-None-</option>
                  <option value="Advertisement">Advertisement</option>
                  <option value="Cold Call">Cold Call</option>
                  <option value="Employee Referral">Employee Referral</option>
                  <option value="External Referral">External Referral</option>
                  <option value="Partner">Partner</option>
                  <option value="Website">Website</option>
                </select>
              </div>

              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Lead Status</label>
              <div>
                <select name="leadStatus" className="crm-form-select" value={formData.leadStatus} onChange={handleChange}>
                  <option value="">-None-</option>
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Unqualified">Unqualified</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>

              <label style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>Rating</label>
              <div>
                <select name="rating" className="crm-form-select" value={formData.rating} onChange={handleChange}>
                  <option value="">-None-</option>
                  <option value="Hot">Hot</option>
                  <option value="Warm">Warm</option>
                  <option value="Cold">Cold</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '20px', borderTop: '1px solid #E5E7EB', marginTop: '20px' }}>
            <button type="button" className="crm-btn crm-btn-secondary" onClick={() => { setShowCreateModal(false); resetForm(); setError(''); }}>
              Cancel
            </button>
            <button type="submit" className="crm-btn crm-btn-primary">
              Save
            </button>
          </div>
        </form>
      </Modal>

      {showBulkUploadModal && (
        <Modal isOpen={showBulkUploadModal} onClose={() => setShowBulkUploadModal(false)} title="Bulk Upload Leads" size="large">
          <BulkUploadForm onClose={() => setShowBulkUploadModal(false)} onSuccess={loadLeads} />
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default Leads;
