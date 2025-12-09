import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import dataCenterService from '../services/dataCenterService';
import productService from '../services/productService';
import BulkCommunication from '../components/BulkCommunication';
import '../styles/crm.css';

const DataCenter = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // State
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Bulk Communication states
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [showBulkWhatsAppModal, setShowBulkWhatsAppModal] = useState(false);
  const [showBulkSMSModal, setShowBulkSMSModal] = useState(false);
  const [myProducts, setMyProducts] = useState([]);
  const [bulkEmailData, setBulkEmailData] = useState({ subject: '', message: '' });
  const [bulkWhatsAppData, setBulkWhatsAppData] = useState({ message: '' });
  const [bulkSMSData, setBulkSMSData] = useState({ message: '' });
  const [sendingBulk, setSendingBulk] = useState(false);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    skills: '',
    experience_min: '',
    experience_max: '',
    location: '',
    availability: '',
    lastActive: '',
    ctc_min: '',
    ctc_max: '',
    status: '',
    sourceWebsite: ''
  });

  // Move to Leads form
  const [moveForm, setMoveForm] = useState({
    leadStatus: 'New',
    leadSource: 'Customer',
    rating: 'Warm',
    assignTo: ''
  });

  // Create Candidate form
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    currentDesignation: '',
    skills: '',
    totalExperience: '0',
    currentLocation: '',
    availability: 'Immediate',
    status: 'Available',
    currentCTC: '0',
    expectedCTC: '0',
    noticePeriod: '30',
    sourceWebsite: 'Other',
    lastActiveOn: new Date().toISOString()
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    immediate: 0,
    thisWeek: 0
  });

  // Load candidates
  const loadCandidates = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };

      const response = await dataCenterService.getCandidates(params);
      const candidatesData = response.data.candidates;
      setCandidates(candidatesData);
      setPagination(response.data.pagination);

      // Calculate stats
      const available = candidatesData.filter(c => c.status === 'Available').length;
      const immediate = candidatesData.filter(c => c.availability === 'Immediate').length;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const thisWeek = candidatesData.filter(c => new Date(c.lastActiveOn) >= weekAgo).length;

      setStats({
        total: response.data.pagination.total,
        available,
        immediate,
        thisWeek
      });
    } catch (error) {
      console.error('Error loading candidates:', error);
      alert('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
    loadMyProducts();
  }, [pagination.page, pagination.limit]);

  // Load user's products
  const loadMyProducts = async () => {
    try {
      const response = await productService.getMyProducts();
      setMyProducts(response.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  // Apply filters
  const applyFilters = () => {
    setPagination({ ...pagination, page: 1 });
    loadCandidates();
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      search: '',
      skills: '',
      experience_min: '',
      experience_max: '',
      location: '',
      availability: '',
      lastActive: '',
      ctc_min: '',
      ctc_max: '',
      status: '',
      sourceWebsite: ''
    });
    setPagination({ ...pagination, page: 1 });
    setTimeout(() => loadCandidates(), 100);
  };

  // Handle checkbox selection
  const handleSelectCandidate = (candidateId) => {
    setSelectedCandidates(prev =>
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  // Select all filtered
  const handleSelectAll = () => {
    if (selectedCandidates.length === candidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(candidates.map(c => c._id));
    }
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload CSV or Excel file only');
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('file', file);

      const response = await dataCenterService.uploadFile(formData);

      alert(`✅ Successfully uploaded!\n\nTotal: ${response.data.total}\nImported: ${response.data.imported}\nDuplicates: ${response.data.duplicates}\nFailed: ${response.data.failed}`);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Reload candidates
      loadCandidates();

    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file. Please check the format.');
    } finally {
      setUploading(false);
    }
  };

  // Move to Leads
  const handleMoveToLeads = async () => {
    if (selectedCandidates.length === 0) {
      alert('Please select at least one candidate');
      return;
    }

    try {
      const data = {
        candidateIds: selectedCandidates,
        ...moveForm
      };

      const response = await dataCenterService.moveToLeads(data);

      alert(`✅ Successfully moved ${response.data.success.length} candidates to Leads!`);

      // Reset selection and reload
      setSelectedCandidates([]);
      setShowMoveModal(false);
      loadCandidates();
    } catch (error) {
      console.error('Error moving to leads:', error);
      alert('Failed to move candidates to leads');
    }
  };

  // Export to Excel
  const handleExport = async () => {
    try {
      const candidateIds = selectedCandidates.length > 0 ? selectedCandidates : null;
      const blob = await dataCenterService.exportCandidates(candidateIds);

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `candidates_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export candidates');
    }
  };

  // Create Candidate
  const handleCreateCandidate = async () => {
    try {
      // Validate required core fields
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.currentLocation) {
        alert('Please fill all required fields (First Name, Last Name, Email, Phone, Current Location)');
        return;
      }

      // Prepare data
      const candidateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        currentDesignation: formData.currentDesignation,
        currentLocation: formData.currentLocation,
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(s => s) : [],
        totalExperience: formData.totalExperience ? parseFloat(formData.totalExperience) : 0,
        currentCTC: formData.currentCTC ? parseFloat(formData.currentCTC) : 0,
        expectedCTC: formData.expectedCTC ? parseFloat(formData.expectedCTC) : 0,
        noticePeriod: formData.noticePeriod ? parseInt(formData.noticePeriod) : 30,
        availability: formData.availability,
        status: formData.status,
        sourceWebsite: formData.sourceWebsite,
        lastActiveOn: new Date().toISOString()
      };

      await dataCenterService.createCandidate(candidateData);

      alert('✅ Candidate created successfully!');

      // Reset form
      const resetData = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        currentDesignation: '',
        skills: '',
        totalExperience: '0',
        currentLocation: '',
        availability: 'Immediate',
        status: 'Available',
        currentCTC: '0',
        expectedCTC: '0',
        noticePeriod: '30',
        sourceWebsite: 'Other',
        lastActiveOn: new Date().toISOString()
      };

      setFormData(resetData);
      setShowCreateModal(false);
      loadCandidates();
    } catch (error) {
      console.error('Create candidate error:', error);
      alert(error.response?.data?.message || 'Failed to create candidate');
    }
  };

  const getAvailabilityColor = (availability) => {
    const colors = {
      'Immediate': 'success',
      '15 Days': 'warning',
      '30 Days': 'warning',
      '45 Days': 'secondary',
      '60 Days': 'secondary'
    };
    return colors[availability] || 'secondary';
  };

  return (
    <DashboardLayout title="Customer Database">
      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Candidates</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-change">Complete database</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Available Now</div>
          <div className="stat-value">{stats.available}</div>
          <div className="stat-change positive">Ready to hire</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Immediate Join</div>
          <div className="stat-value">{stats.immediate}</div>
          <div className="stat-change positive">Can join immediately</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active This Week</div>
          <div className="stat-value">{stats.thisWeek}</div>
          <div className="stat-change">Recent activity</div>
        </div>
      </div>

      {/* Action Buttons Section */}
      <div style={{
        background: 'white',
        padding: '16px 20px',
        borderRadius: '12px',
        marginBottom: '20px',
        border: '2px solid #e5e7eb',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'space-between'
        }}>
          {/* Left Side - Main Actions */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="crm-btn crm-btn-primary crm-btn-sm"
              onClick={() => setShowCreateModal(true)}
            >
              ➕ Add Candidate
            </button>

            <button
              className="crm-btn crm-btn-secondary crm-btn-sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              🔍 {showFilters ? 'Hide' : 'Show'} Filters
            </button>

            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
            />
            <button
              className="crm-btn crm-btn-secondary crm-btn-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? '⏳ Uploading...' : '📤 Upload CSV/Excel'}
            </button>

            <button
              className="crm-btn crm-btn-secondary crm-btn-sm"
              onClick={handleExport}
            >
              📥 Export {selectedCandidates.length > 0 ? `(${selectedCandidates.length})` : '(All)'}
            </button>

            {/* View Mode Toggle */}
            <div style={{
              display: 'flex',
              gap: '6px',
              background: '#f8fafc',
              borderRadius: '8px',
              padding: '4px',
              border: '1px solid #e5e7eb'
            }}>
              <button
                className={`crm-btn crm-btn-sm ${viewMode === 'table' ? 'crm-btn-primary' : 'crm-btn-secondary'}`}
                onClick={() => setViewMode('table')}
                style={{ padding: '6px 12px', minWidth: 'auto' }}
              >
                ☰
              </button>
              <button
                className={`crm-btn crm-btn-sm ${viewMode === 'grid' ? 'crm-btn-primary' : 'crm-btn-secondary'}`}
                onClick={() => setViewMode('grid')}
                style={{ padding: '6px 12px', minWidth: 'auto' }}
              >
                ⊞
              </button>
            </div>
          </div>

          {/* Right Side - Bulk Actions (shown when candidates selected) */}
          {selectedCandidates.length > 0 && (
            <div style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
              borderRadius: '8px',
              border: '2px solid #93C5FD'
            }}>
              <span style={{ fontWeight: '700', color: '#1e40af', fontSize: '14px' }}>
                {selectedCandidates.length} Selected:
              </span>

              {/* Bulk Communication Buttons */}
              <BulkCommunication
                selectedCandidates={selectedCandidates}
                candidates={candidates}
                myProducts={myProducts}
                loadMyProducts={loadMyProducts}
                onSuccess={() => setSelectedCandidates([])}
              />

              {/* Move to Leads Button */}
              <button
                className="crm-btn crm-btn-primary crm-btn-sm"
                onClick={() => setShowMoveModal(true)}
                style={{
                  background: '#10b981',
                  borderColor: '#10b981'
                }}
              >
                ➡️ Move to Leads
              </button>

              <button
                className="crm-btn crm-btn-sm crm-btn-secondary"
                onClick={() => setSelectedCandidates([])}
                style={{ padding: '6px 12px' }}
              >
                ✕ Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="crm-card" style={{ marginBottom: '24px' }}>
          <div style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: '#1e3c72' }}>
              🔍 Advanced Search Filters
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              <div className="crm-form-group">
                <label className="crm-form-label">🔎 Search</label>
                <input
                  type="text"
                  name="search"
                  placeholder="Name, email, skills..."
                  value={filters.search}
                  onChange={handleFilterChange}
                  className="crm-form-input"
                />
              </div>

              <div className="crm-form-group">
                <label className="crm-form-label">💻 Skills</label>
                <input
                  type="text"
                  name="skills"
                  placeholder="React, Node.js, Python..."
                  value={filters.skills}
                  onChange={handleFilterChange}
                  className="crm-form-input"
                />
              </div>

              <div className="crm-form-group">
                <label className="crm-form-label">📊 Min Experience (Years)</label>
                <input
                  type="number"
                  name="experience_min"
                  placeholder="0"
                  value={filters.experience_min}
                  onChange={handleFilterChange}
                  className="crm-form-input"
                />
              </div>

              <div className="crm-form-group">
                <label className="crm-form-label">📊 Max Experience (Years)</label>
                <input
                  type="number"
                  name="experience_max"
                  placeholder="10"
                  value={filters.experience_max}
                  onChange={handleFilterChange}
                  className="crm-form-input"
                />
              </div>

              <div className="crm-form-group">
                <label className="crm-form-label">📍 Location</label>
                <input
                  type="text"
                  name="location"
                  placeholder="Delhi, Bangalore..."
                  value={filters.location}
                  onChange={handleFilterChange}
                  className="crm-form-input"
                />
              </div>

              <div className="crm-form-group">
                <label className="crm-form-label">📅 Availability</label>
                <select
                  name="availability"
                  value={filters.availability}
                  onChange={handleFilterChange}
                  className="crm-form-select"
                >
                  <option value="">All</option>
                  <option value="Immediate">Immediate</option>
                  <option value="15 Days">15 Days</option>
                  <option value="30 Days">30 Days</option>
                  <option value="45 Days">45 Days</option>
                  <option value="60 Days">60 Days</option>
                </select>
              </div>

              <div className="crm-form-group">
                <label className="crm-form-label">🕐 Last Active</label>
                <select
                  name="lastActive"
                  value={filters.lastActive}
                  onChange={handleFilterChange}
                  className="crm-form-select"
                >
                  <option value="">All Time</option>
                  <option value="24hours">Last 24 Hours</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="3months">Last 3 Months</option>
                </select>
              </div>

              <div className="crm-form-group">
                <label className="crm-form-label">🌐 Source</label>
                <select
                  name="sourceWebsite"
                  value={filters.sourceWebsite}
                  onChange={handleFilterChange}
                  className="crm-form-select"
                >
                  <option value="">All Sources</option>
                  <option value="Naukri">Naukri</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Monster">Monster</option>
                  <option value="Indeed">Indeed</option>
                  <option value="Manual Upload">Manual Upload</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button className="crm-btn crm-btn-primary" onClick={applyFilters}>
                Apply Filters
              </button>
              <button className="crm-btn crm-btn-secondary" onClick={clearFilters}>
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidates Display */}
      <div className="crm-card">
        <div className="crm-card-header">
          <h2 className="crm-card-title">
            {viewMode === 'grid' ? 'Candidate Cards' : 'Candidate List'} ({pagination.total})
          </h2>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '16px', color: '#64748b', fontSize: '15px', fontWeight: '600' }}>
              Loading candidates...
            </p>
          </div>
        ) : candidates.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>👥</div>
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#1e3c72', marginBottom: '8px' }}>
              No candidates found
            </p>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
              Upload a CSV/Excel file to get started or adjust your filters
            </p>
            <button
              className="crm-btn crm-btn-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              📤 Upload Candidates
            </button>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div style={{
                padding: '24px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '24px'
              }}>
                {candidates.map(candidate => (
                  <div
                    key={candidate._id}
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                      borderRadius: '16px',
                      padding: '24px',
                      border: selectedCandidates.includes(candidate._id)
                        ? '2px solid #4A90E2'
                        : '2px solid #e5e7eb',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: selectedCandidates.includes(candidate._id)
                        ? '0 8px 24px rgba(74, 144, 226, 0.25)'
                        : '0 4px 12px rgba(0, 0, 0, 0.05)',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedCandidates.includes(candidate._id)) {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedCandidates.includes(candidate._id)) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
                      }
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: 'linear-gradient(90deg, #4A90E2 0%, #2c5364 100%)'
                    }}></div>

                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                      <input
                        type="checkbox"
                        checked={selectedCandidates.includes(candidate._id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectCandidate(candidate._id);
                        }}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <h3 style={{
                          margin: '0 0 4px 0',
                          fontSize: '18px',
                          fontWeight: '800',
                          color: '#1e3c72'
                        }}>
                          {candidate.firstName} {candidate.lastName}
                        </h3>
                        <p style={{ margin: '0', fontSize: '14px', color: '#64748b', fontWeight: '600' }}>
                          {candidate.currentDesignation || 'Position not specified'}
                        </p>
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span className={`status-badge ${getAvailabilityColor(candidate.availability)}`}>
                        📅 {candidate.availability}
                      </span>
                      <span className={`status-badge ${candidate.status === 'Available' ? 'success' : 'secondary'}`}>
                        {candidate.status}
                      </span>
                    </div>

                    <div style={{ marginBottom: '16px', color: '#64748b', fontSize: '14px' }}>
                      {candidate.email && (
                        <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>📧</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {candidate.email}
                          </span>
                        </div>
                      )}
                      {candidate.phone && (
                        <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>📞</span>
                          <span>{candidate.phone}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span>📊</span>
                        <span>{candidate.totalExperience} years experience</span>
                      </div>
                      {candidate.currentLocation && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>📍</span>
                          <span>{candidate.currentLocation}</span>
                        </div>
                      )}
                    </div>

                    {candidate.skills && candidate.skills.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>
                          Skills:
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {candidate.skills.slice(0, 4).map((skill, idx) => (
                            <span key={idx} style={{
                              padding: '4px 10px',
                              background: '#f1f5f9',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '600',
                              color: '#475569'
                            }}>
                              {skill}
                            </span>
                          ))}
                          {candidate.skills.length > 4 && (
                            <span style={{
                              padding: '4px 10px',
                              background: '#e2e8f0',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '600',
                              color: '#475569'
                            }}>
                              +{candidate.skills.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <button
                      className="crm-btn crm-btn-primary"
                      onClick={() => navigate(`/data-center/${candidate._id}`)}
                      style={{ width: '100%' }}
                    >
                      👁️ View Full Profile
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ overflowX: 'auto', padding: '0' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'separate',
                  borderSpacing: '0 8px'
                }}>
                  <thead>
                    <tr style={{ background: 'transparent' }}>
                      <th style={{
                        width: '50px',
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: '800',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedCandidates.length === candidates.length && candidates.length > 0}
                          onChange={handleSelectAll}
                          style={{
                            cursor: 'pointer',
                            width: '18px',
                            height: '18px'
                          }}
                        />
                      </th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: '800',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Name & Role</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: '800',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Contact</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: '800',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Experience</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: '800',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Skills</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: '800',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Location</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: '800',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Availability</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: '800',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map(candidate => (
                      <tr
                        key={candidate._id}
                        onClick={(e) => {
                          // Don't navigate if clicking checkbox
                          if (e.target.type !== 'checkbox') {
                            navigate(`/data-center/${candidate._id}`);
                          }
                        }}
                        style={{
                          background: selectedCandidates.includes(candidate._id)
                            ? 'linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(74, 144, 226, 0.04) 100%)'
                            : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          borderRadius: '12px',
                          boxShadow: selectedCandidates.includes(candidate._id)
                            ? '0 4px 12px rgba(74, 144, 226, 0.15), inset 0 0 0 2px #4A90E2'
                            : '0 2px 4px rgba(0, 0, 0, 0.05)',
                          border: selectedCandidates.includes(candidate._id)
                            ? '2px solid transparent'
                            : '2px solid #e5e7eb'
                        }}
                        onMouseEnter={(e) => {
                          if (!selectedCandidates.includes(candidate._id)) {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(74, 144, 226, 0.15)';
                            e.currentTarget.style.borderColor = '#4A90E2';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!selectedCandidates.includes(candidate._id)) {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                            e.currentTarget.style.borderColor = '#e5e7eb';
                          }
                        }}
                      >
                        <td style={{
                          padding: '16px',
                          borderTopLeftRadius: '12px',
                          borderBottomLeftRadius: '12px'
                        }}>
                          <input
                            type="checkbox"
                            checked={selectedCandidates.includes(candidate._id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleSelectCandidate(candidate._id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              cursor: 'pointer',
                              width: '18px',
                              height: '18px'
                            }}
                          />
                        </td>
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
                              flexShrink: 0,
                              boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)'
                            }}>
                              {candidate.firstName?.[0]}{candidate.lastName?.[0]}
                            </div>
                            <div>
                              <div style={{
                                fontWeight: '700',
                                color: '#1e3c72',
                                fontSize: '15px',
                                marginBottom: '4px'
                              }}>
                                {candidate.firstName} {candidate.lastName}
                              </div>
                              <div style={{
                                fontSize: '13px',
                                color: '#64748b',
                                fontWeight: '500'
                              }}>
                                {candidate.currentDesignation || 'Position not specified'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '13px',
                              color: '#475569'
                            }}>
                              <span style={{ fontSize: '14px' }}>📧</span>
                              <span style={{
                                maxWidth: '180px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {candidate.email}
                              </span>
                            </div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '13px',
                              color: '#475569',
                              fontWeight: '600'
                            }}>
                              <span style={{ fontSize: '14px' }}>📞</span>
                              <span>{candidate.phone}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: '700',
                            color: '#1e3c72',
                            border: '2px solid #cbd5e1'
                          }}>
                            <span style={{ fontSize: '16px' }}>📊</span>
                            <span>{candidate.totalExperience} yrs</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxWidth: '200px' }}>
                            {candidate.skills && candidate.skills.length > 0 ? (
                              <>
                                {candidate.skills.slice(0, 2).map((skill, idx) => (
                                  <span key={idx} style={{
                                    padding: '4px 10px',
                                    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: '#1e40af',
                                    border: '1px solid #93c5fd'
                                  }}>
                                    {skill}
                                  </span>
                                ))}
                                {candidate.skills.length > 2 && (
                                  <span style={{
                                    padding: '4px 10px',
                                    background: '#e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    color: '#475569'
                                  }}>
                                    +{candidate.skills.length - 2}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '13px' }}>No skills</span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: '#475569',
                            fontSize: '14px',
                            fontWeight: '600'
                          }}>
                            <span style={{ fontSize: '16px' }}>📍</span>
                            <span>{candidate.currentLocation}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '10px',
                            fontSize: '13px',
                            fontWeight: '700',
                            background: candidate.availability === 'Immediate'
                              ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)'
                              : candidate.availability === '15 Days' || candidate.availability === '30 Days'
                              ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                              : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                            color: candidate.availability === 'Immediate'
                              ? '#166534'
                              : candidate.availability === '15 Days' || candidate.availability === '30 Days'
                              ? '#92400e'
                              : '#475569',
                            border: candidate.availability === 'Immediate'
                              ? '2px solid #86efac'
                              : candidate.availability === '15 Days' || candidate.availability === '30 Days'
                              ? '2px solid #fcd34d'
                              : '2px solid #cbd5e1'
                          }}>
                            <span>📅</span>
                            <span>{candidate.availability}</span>
                          </span>
                        </td>
                        <td style={{
                          padding: '16px',
                          borderTopRightRadius: '12px',
                          borderBottomRightRadius: '12px'
                        }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '10px',
                            fontSize: '13px',
                            fontWeight: '700',
                            background: candidate.status === 'Available'
                              ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)'
                              : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                            color: candidate.status === 'Available' ? '#166534' : '#991b1b',
                            border: candidate.status === 'Available'
                              ? '2px solid #86efac'
                              : '2px solid #fca5a5'
                          }}>
                            <span>{candidate.status === 'Available' ? '✅' : '⚠️'}</span>
                            <span>{candidate.status}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '24px',
                borderTop: '2px solid #f1f5f9'
              }}>
                <button
                  className="crm-btn crm-btn-secondary"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                >
                  ← Previous
                </button>
                <span style={{
                  fontWeight: '700',
                  color: '#1e3c72',
                  fontSize: '15px'
                }}>
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  className="crm-btn crm-btn-secondary"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Move to Leads Modal */}
      {showMoveModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setShowMoveModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '24px',
              borderBottom: '2px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#1e3c72' }}>
                Move {selectedCandidates.length} Candidates to Leads
              </h3>
              <button
                onClick={() => setShowMoveModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div className="crm-form-group" style={{ marginBottom: '20px' }}>
                <label className="crm-form-label">Lead Status</label>
                <select
                  value={moveForm.leadStatus}
                  onChange={(e) => setMoveForm({ ...moveForm, leadStatus: e.target.value })}
                  className="crm-form-select"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Qualified">Qualified</option>
                </select>
              </div>

              <div className="crm-form-group" style={{ marginBottom: '20px' }}>
                <label className="crm-form-label">Lead Source</label>
                <input
                  type="text"
                  value={moveForm.leadSource}
                  onChange={(e) => setMoveForm({ ...moveForm, leadSource: e.target.value })}
                  className="crm-form-input"
                />
              </div>

              <div className="crm-form-group" style={{ marginBottom: '20px' }}>
                <label className="crm-form-label">Rating</label>
                <select
                  value={moveForm.rating}
                  onChange={(e) => setMoveForm({ ...moveForm, rating: e.target.value })}
                  className="crm-form-select"
                >
                  <option value="Hot">🔥 Hot</option>
                  <option value="Warm">🌤️ Warm</option>
                  <option value="Cold">❄️ Cold</option>
                </select>
              </div>
            </div>

            <div style={{
              padding: '24px',
              borderTop: '2px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                className="crm-btn crm-btn-secondary"
                onClick={() => setShowMoveModal(false)}
              >
                Cancel
              </button>
              <button
                className="crm-btn crm-btn-primary"
                onClick={handleMoveToLeads}
              >
                ✅ Confirm & Move
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Candidate Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '24px',
              borderBottom: '2px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #4A90E2 0%, #2c5364 100%)'
            }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'white' }}>
                ➕ Add New Candidate
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'white'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="crm-form-group">
                  <label className="crm-form-label">First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="crm-form-input"
                    placeholder="Enter first name"
                  />
                </div>

                <div className="crm-form-group">
                  <label className="crm-form-label">Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="crm-form-input"
                    placeholder="Enter last name"
                  />
                </div>

                <div className="crm-form-group">
                  <label className="crm-form-label">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="crm-form-input"
                    placeholder="candidate@example.com"
                  />
                </div>

                <div className="crm-form-group">
                  <label className="crm-form-label">Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="crm-form-input"
                    placeholder="+91 XXXXXXXXXX"
                  />
                </div>

                <div className="crm-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="crm-form-label">Current Designation</label>
                  <input
                    type="text"
                    value={formData.currentDesignation}
                    onChange={(e) => setFormData({ ...formData, currentDesignation: e.target.value })}
                    className="crm-form-input"
                    placeholder="Senior Software Engineer"
                  />
                </div>

                <div className="crm-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="crm-form-label">Skills (comma separated)</label>
                  <input
                    type="text"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    className="crm-form-input"
                    placeholder="React, Node.js, Python, AWS"
                  />
                </div>

                <div className="crm-form-group">
                  <label className="crm-form-label">Total Experience (Years)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.totalExperience}
                    onChange={(e) => setFormData({ ...formData, totalExperience: e.target.value })}
                    className="crm-form-input"
                    placeholder="5"
                  />
                </div>

                <div className="crm-form-group">
                  <label className="crm-form-label">Current Location *</label>
                  <input
                    type="text"
                    value={formData.currentLocation}
                    onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })}
                    className="crm-form-input"
                    placeholder="Bangalore"
                  />
                </div>

                <div className="crm-form-group">
                  <label className="crm-form-label">Availability</label>
                  <select
                    value={formData.availability}
                    onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                    className="crm-form-select"
                  >
                    <option value="Immediate">Immediate</option>
                    <option value="15 Days">15 Days</option>
                    <option value="30 Days">30 Days</option>
                    <option value="45 Days">45 Days</option>
                    <option value="60 Days">60 Days</option>
                  </select>
                </div>

                <div className="crm-form-group">
                  <label className="crm-form-label">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="crm-form-select"
                  >
                    <option value="Available">Available</option>
                    <option value="Not Available">Not Available</option>
                  </select>
                </div>

                <div className="crm-form-group">
                  <label className="crm-form-label">Current CTC (LPA)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.currentCTC}
                    onChange={(e) => setFormData({ ...formData, currentCTC: e.target.value })}
                    className="crm-form-input"
                    placeholder="12"
                  />
                </div>

                <div className="crm-form-group">
                  <label className="crm-form-label">Expected CTC (LPA)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.expectedCTC}
                    onChange={(e) => setFormData({ ...formData, expectedCTC: e.target.value })}
                    className="crm-form-input"
                    placeholder="15"
                  />
                </div>

                <div className="crm-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="crm-form-label">Notice Period</label>
                  <input
                    type="text"
                    value={formData.noticePeriod}
                    onChange={(e) => setFormData({ ...formData, noticePeriod: e.target.value })}
                    className="crm-form-input"
                    placeholder="30 Days"
                  />
                </div>
              </div>
            </div>

            <div style={{
              padding: '24px',
              borderTop: '2px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                className="crm-btn crm-btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="crm-btn crm-btn-primary"
                onClick={handleCreateCandidate}
              >
                ✅ Create Candidate
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default DataCenter;
