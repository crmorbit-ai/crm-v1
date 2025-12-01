import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import dataCenterService from '../services/dataCenterService';
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
      setCandidates(response.data.candidates);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error loading candidates:', error);
      alert('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, [pagination.page, pagination.limit]);

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

  // 🚀 Handle file upload
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

  return (
    <DashboardLayout>
      <div className="crm-container">
        {/* Header */}
        <div className="crm-header">
          <div>
            <h1>👥 Customer</h1>
            <p>Raw candidate database from job portals</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="crm-btn-secondary"
              onClick={() => setShowFilters(!showFilters)}
            >
              🔍 {showFilters ? 'Hide' : 'Show'} Filters
            </button>
            
            {/* 🚀 Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
            />
            <button 
              className="crm-btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? '⏳ Uploading...' : '📤 Upload CSV/Excel'}
            </button>
            
            <button 
              className="crm-btn-secondary"
              onClick={handleExport}
            >
              📥 Export ({selectedCandidates.length || 'All'})
            </button>
            <button 
              className="crm-btn-primary"
              onClick={() => setShowMoveModal(true)}
              disabled={selectedCandidates.length === 0}
            >
              ➡️ Move to Leads ({selectedCandidates.length})
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="crm-filters-panel">
            <div className="crm-filters-grid">
              <div className="crm-form-group">
                <label>🔍 Search</label>
                <input
                  type="text"
                  name="search"
                  placeholder="Name, email, skills..."
                  value={filters.search}
                  onChange={handleFilterChange}
                  className="crm-input"
                />
              </div>

              <div className="crm-form-group">
                <label>💻 Skills</label>
                <input
                  type="text"
                  name="skills"
                  placeholder="React, Node.js, Python..."
                  value={filters.skills}
                  onChange={handleFilterChange}
                  className="crm-input"
                />
              </div>

              <div className="crm-form-group">
                <label>📊 Experience (Min)</label>
                <input
                  type="number"
                  name="experience_min"
                  placeholder="0"
                  value={filters.experience_min}
                  onChange={handleFilterChange}
                  className="crm-input"
                />
              </div>

              <div className="crm-form-group">
                <label>📊 Experience (Max)</label>
                <input
                  type="number"
                  name="experience_max"
                  placeholder="10"
                  value={filters.experience_max}
                  onChange={handleFilterChange}
                  className="crm-input"
                />
              </div>

              <div className="crm-form-group">
                <label>📍 Location</label>
                <input
                  type="text"
                  name="location"
                  placeholder="Delhi, Bangalore..."
                  value={filters.location}
                  onChange={handleFilterChange}
                  className="crm-input"
                />
              </div>

              <div className="crm-form-group">
                <label>📅 Availability</label>
                <select
                  name="availability"
                  value={filters.availability}
                  onChange={handleFilterChange}
                  className="crm-select"
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
                <label>🕐 Last Active</label>
                <select
                  name="lastActive"
                  value={filters.lastActive}
                  onChange={handleFilterChange}
                  className="crm-select"
                >
                  <option value="">All Time</option>
                  <option value="24hours">Last 24 Hours</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="3months">Last 3 Months</option>
                </select>
              </div>

              <div className="crm-form-group">
                <label>🌐 Source</label>
                <select
                  name="sourceWebsite"
                  value={filters.sourceWebsite}
                  onChange={handleFilterChange}
                  className="crm-select"
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

            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button className="crm-btn-primary" onClick={applyFilters}>
                Apply Filters
              </button>
              <button className="crm-btn-secondary" onClick={clearFilters}>
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Stats Bar */}
        <div style={{ 
          background: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          display: 'flex',
          gap: '30px'
        }}>
          <div><strong>Total:</strong> {pagination.total}</div>
          <div><strong>Selected:</strong> {selectedCandidates.length}</div>
          <div><strong>Page:</strong> {pagination.page} / {pagination.pages}</div>
        </div>

        {/* Table */}
        <div className="crm-table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="loading-spinner"></div>
              <p>Loading candidates...</p>
            </div>
          ) : candidates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>No candidates found</p>
              <p style={{ marginTop: '10px', color: '#666' }}>
                Upload a CSV/Excel file to get started!
              </p>
            </div>
          ) : (
            <table className="crm-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={selectedCandidates.length === candidates.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Experience</th>
                  <th>Skills</th>
                  <th>Location</th>
                  <th>Availability</th>
                  <th>Last Active</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map(candidate => (
                  <tr key={candidate._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedCandidates.includes(candidate._id)}
                        onChange={() => handleSelectCandidate(candidate._id)}
                      />
                    </td>
                    <td>
                      <strong>{candidate.firstName} {candidate.lastName}</strong>
                      <br />
                      <small>{candidate.currentDesignation || 'N/A'}</small>
                    </td>
                    <td>{candidate.email}</td>
                    <td>{candidate.phone}</td>
                    <td>{candidate.totalExperience} years</td>
                    <td>
                      <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {candidate.skills ? candidate.skills.slice(0, 3).join(', ') : 'N/A'}
                      </div>
                    </td>
                    <td>{candidate.currentLocation}</td>
                    <td>
                      <span className={`crm-badge crm-badge-${
                        candidate.availability === 'Immediate' ? 'success' : 'warning'
                      }`}>
                        {candidate.availability}
                      </span>
                    </td>
                    <td>{new Date(candidate.lastActiveOn).toLocaleDateString()}</td>
                    <td>
                      <span className={`crm-badge crm-badge-${
                        candidate.status === 'Available' ? 'success' : 'secondary'
                      }`}>
                        {candidate.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="crm-btn-action"
                        onClick={() => navigate(`/data-center/${candidate._id}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="crm-pagination">
            <button
              disabled={pagination.page === 1}
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            >
              Previous
            </button>
            <span>Page {pagination.page} of {pagination.pages}</span>
            <button
              disabled={pagination.page === pagination.pages}
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            >
              Next
            </button>
          </div>
        )}

        {/* Move to Leads Modal */}
        {showMoveModal && (
          <div className="crm-modal-overlay" onClick={() => setShowMoveModal(false)}>
            <div className="crm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="crm-modal-header">
                <h3>Move {selectedCandidates.length} Candidates to Leads</h3>
                <button onClick={() => setShowMoveModal(false)}>✕</button>
              </div>
              
              <div className="crm-modal-body">
                <div className="crm-form-group">
                  <label>Lead Status</label>
                  <select
                    value={moveForm.leadStatus}
                    onChange={(e) => setMoveForm({ ...moveForm, leadStatus: e.target.value })}
                    className="crm-select"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                  </select>
                </div>

                <div className="crm-form-group">
                  <label>Lead Source</label>
                  <input
                    type="text"
                    value={moveForm.leadSource}
                    onChange={(e) => setMoveForm({ ...moveForm, leadSource: e.target.value })}
                    className="crm-input"
                  />
                </div>

                <div className="crm-form-group">
                  <label>Rating</label>
                  <select
                    value={moveForm.rating}
                    onChange={(e) => setMoveForm({ ...moveForm, rating: e.target.value })}
                    className="crm-select"
                  >
                    <option value="Hot">Hot</option>
                    <option value="Warm">Warm</option>
                    <option value="Cold">Cold</option>
                  </select>
                </div>
              </div>

              <div className="crm-modal-footer">
                <button className="crm-btn-secondary" onClick={() => setShowMoveModal(false)}>
                  Cancel
                </button>
                <button className="crm-btn-primary" onClick={handleMoveToLeads}>
                  ✅ Confirm & Move
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DataCenter;