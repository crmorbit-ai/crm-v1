import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import dataCenterService from '../services/dataCenterService';
import productService from '../services/productService';
import BulkCommunication from '../components/BulkCommunication';
import DynamicField from '../components/DynamicField';
import fieldDefinitionService from '../services/fieldDefinitionService';
import '../styles/crm.css';

const DataCenter = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showMoveForm, setShowMoveForm] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewMode, setViewMode] = useState('table');

  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [showBulkWhatsAppModal, setShowBulkWhatsAppModal] = useState(false);
  const [showBulkSMSModal, setShowBulkSMSModal] = useState(false);
  const [myProducts, setMyProducts] = useState([]);
  const [bulkEmailData, setBulkEmailData] = useState({ subject: '', message: '' });
  const [bulkWhatsAppData, setBulkWhatsAppData] = useState({ message: '' });
  const [bulkSMSData, setBulkSMSData] = useState({ message: '' });
  const [sendingBulk, setSendingBulk] = useState(false);

  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  const [filters, setFilters] = useState({
    search: '', skills: '', experience_min: '', experience_max: '', location: '',
    availability: '', lastActive: '', ctc_min: '', ctc_max: '', status: '', sourceWebsite: ''
  });

  const [moveForm, setMoveForm] = useState({ leadStatus: 'New', leadSource: 'Customer', rating: 'Warm', assignTo: '' });

  const [stats, setStats] = useState({ total: 0, available: 0, immediate: 0, thisWeek: 0 });

  const [fieldDefinitions, setFieldDefinitions] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [displayColumns, setDisplayColumns] = useState([]);
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  const extractColumns = (candidatesData) => {
    if (!candidatesData || candidatesData.length === 0) return [];
    const allKeys = new Set();
    const excludeKeys = ['_id', '__v', 'tenant', 'importedBy', 'importedAt', 'createdAt', 'updatedAt', 'movedBy', 'movedToTenant', 'leadId', 'isActive', 'dataSource'];

    candidatesData.forEach(candidate => {
      Object.keys(candidate).forEach(key => {
        if (!excludeKeys.includes(key) && candidate[key] !== null && candidate[key] !== undefined && candidate[key] !== '') {
          allKeys.add(key);
        }
      });
    });

    const columnsArray = Array.from(allKeys);
    const statusIndex = columnsArray.indexOf('status');
    if (statusIndex > -1) {
      columnsArray.splice(statusIndex, 1);
      columnsArray.push('status');
    }
    return columnsArray;
  };

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const params = { page: pagination.page, limit: pagination.limit, ...filters };
      const response = await dataCenterService.getCandidates(params);
      const candidatesData = response.data.candidates;
      setCandidates(candidatesData);
      setPagination(response.data.pagination);

      const newColumns = extractColumns(candidatesData);
      if (newColumns.length > 0) {
        const mergedColumns = [...new Set([...displayColumns, ...newColumns])];
        setDisplayColumns(mergedColumns);
      }

      const available = candidatesData.filter(c => c.status === 'Available').length;
      const immediate = candidatesData.filter(c => c.availability === 'Immediate').length;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const thisWeek = candidatesData.filter(c => new Date(c.lastActiveOn) >= weekAgo).length;

      setStats({ total: response.data.pagination.total, available, immediate, thisWeek });
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
    loadFieldDefinitions();
  }, [pagination.page, pagination.limit]);

  const loadFieldDefinitions = async () => {
    try {
      const response = await fieldDefinitionService.getFieldDefinitions('Candidate', false);
      if (response && Array.isArray(response)) {
        const createFields = response.filter(field => field.isActive && field.showInCreate).sort((a, b) => a.displayOrder - b.displayOrder);
        setFieldDefinitions(createFields);
      }
    } catch (error) {
      console.error('Load field definitions error:', error);
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
    <DynamicField fieldDefinition={field} value={fieldValues[field.fieldName] || ''} onChange={handleFieldChange} error={fieldErrors[field.fieldName]} />
  );

  const loadMyProducts = async () => {
    try {
      const response = await productService.getMyProducts();
      setMyProducts(response.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = () => {
    setPagination({ ...pagination, page: 1 });
    loadCandidates();
  };

  const clearFilters = () => {
    setFilters({ search: '', skills: '', experience_min: '', experience_max: '', location: '', availability: '', lastActive: '', ctc_min: '', ctc_max: '', status: '', sourceWebsite: '' });
    setPagination({ ...pagination, page: 1 });
    setTimeout(() => loadCandidates(), 100);
  };

  const handleSelectCandidate = (candidateId) => {
    setSelectedCandidates(prev => prev.includes(candidateId) ? prev.filter(id => id !== candidateId) : [...prev, candidateId]);
  };

  const handleSelectAll = () => {
    if (selectedCandidates.length === candidates.length) setSelectedCandidates([]);
    else setSelectedCandidates(candidates.map(c => c._id));
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(file.type)) { alert('Please upload CSV or Excel file only'); return; }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const response = await dataCenterService.uploadFile(formData);
      alert(`Successfully uploaded!\nTotal: ${response.data.total}\nImported: ${response.data.imported}\nDuplicates: ${response.data.duplicates}\nFailed: ${response.data.failed}`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadCandidates();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file. Please check the format.');
    } finally {
      setUploading(false);
    }
  };

  const closeAllForms = () => {
    setShowMoveForm(false);
    setShowCreateForm(false);
  };

  const handleMoveToLeads = async () => {
    if (selectedCandidates.length === 0) { alert('Please select at least one candidate'); return; }
    try {
      const data = { candidateIds: selectedCandidates, ...moveForm };
      const response = await dataCenterService.moveToLeads(data);
      alert(`Successfully moved ${response.data.success.length} candidates to Leads!`);
      setSelectedCandidates([]);
      setShowMoveForm(false);
      loadCandidates();
    } catch (error) {
      console.error('Error moving to leads:', error);
      alert('Failed to move candidates to leads');
    }
  };

  const handleDeleteCandidates = async () => {
    if (selectedCandidates.length === 0) { alert('Please select at least one candidate'); return; }
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedCandidates.length} candidate(s)? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      const response = await dataCenterService.deleteCandidates(selectedCandidates);
      alert(`Successfully deleted ${response.data.deleted} candidate(s)!`);
      setSelectedCandidates([]);
      loadCandidates();
    } catch (error) {
      console.error('Error deleting candidates:', error);
      alert('Failed to delete candidates');
    }
  };

  const handleExport = async () => {
    try {
      const candidateIds = selectedCandidates.length > 0 ? selectedCandidates : null;
      const blob = await dataCenterService.exportCandidates(candidateIds);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `candidates_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export candidates');
    }
  };

  const handleCreateCandidate = async () => {
    try {
      const candidateData = {};
      fieldDefinitions.forEach(field => {
        const value = fieldValues[field.fieldName];
        if (value !== undefined && value !== null && value !== '') {
          candidateData[field.fieldName] = value;
        }
      });

      await dataCenterService.createCandidate(candidateData);
      alert('Candidate created successfully!');
      setFieldValues({});
      setFieldErrors({});
      setShowCreateForm(false);
      loadCandidates();
    } catch (error) {
      console.error('Create candidate error:', error);
      alert(error.response?.data?.message || 'Failed to create candidate');
    }
  };

  const getAvailabilityColor = (availability) => {
    const colors = { 'Immediate': 'success', '15 Days': 'warning', '30 Days': 'warning', '45 Days': 'secondary', '60 Days': 'secondary' };
    return colors[availability] || 'secondary';
  };

  const formatFieldName = (fieldName) => fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();

  const getFieldValue = (candidate, fieldName) => {
    if (candidate[fieldName] !== undefined && candidate[fieldName] !== null && candidate[fieldName] !== '') return candidate[fieldName];
    return null;
  };

  const formatFieldValue = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return value.toString();
  };

  return (
    <DashboardLayout title="Customer Database">
      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Total Candidates</div><div className="stat-value">{stats.total}</div><div className="stat-change">Complete database</div></div>
        <div className="stat-card"><div className="stat-label">Available Now</div><div className="stat-value">{stats.available}</div><div className="stat-change positive">Ready to hire</div></div>
        <div className="stat-card"><div className="stat-label">Immediate Join</div><div className="stat-value">{stats.immediate}</div><div className="stat-change positive">Can join immediately</div></div>
        <div className="stat-card"><div className="stat-label">Active This Week</div><div className="stat-value">{stats.thisWeek}</div><div className="stat-change">Recent activity</div></div>
      </div>

      {/* Action Buttons Section */}
      <div className="action-bar">
        <div className="action-bar-left">
          <button className="crm-btn crm-btn-primary crm-btn-sm" onClick={() => { closeAllForms(); setShowCreateForm(true); }}>Add Customer</button>
          <button className="crm-btn crm-btn-secondary crm-btn-sm" onClick={() => setShowFilters(!showFilters)}>{showFilters ? 'Hide' : 'Show'} Filters</button>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
          <button className="crm-btn crm-btn-secondary crm-btn-sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>{uploading ? 'Uploading...' : 'Upload CSV'}</button>
          <button className="crm-btn crm-btn-secondary crm-btn-sm" onClick={handleExport}>Export {selectedCandidates.length > 0 ? `(${selectedCandidates.length})` : ''}</button>
          <div className="view-toggle">
            <button className={`crm-btn crm-btn-sm ${viewMode === 'table' ? 'crm-btn-primary' : 'crm-btn-secondary'}`} onClick={() => setViewMode('table')}>Table</button>
            <button className={`crm-btn crm-btn-sm ${viewMode === 'grid' ? 'crm-btn-primary' : 'crm-btn-secondary'}`} onClick={() => setViewMode('grid')}>Grid</button>
          </div>
        </div>

        {selectedCandidates.length > 0 && (
          <div className="bulk-actions-bar">
            <span className="selection-count">{selectedCandidates.length} Selected</span>
            <BulkCommunication selectedCandidates={selectedCandidates} candidates={candidates} myProducts={myProducts} loadMyProducts={loadMyProducts} onSuccess={() => setSelectedCandidates([])} />
            <button className="crm-btn crm-btn-success crm-btn-sm" onClick={() => { closeAllForms(); setShowMoveForm(true); }}>Move to Leads</button>
            <button className="crm-btn crm-btn-danger crm-btn-sm" onClick={handleDeleteCandidates}>Delete</button>
            <button className="crm-btn crm-btn-sm crm-btn-secondary" onClick={() => setSelectedCandidates([])}>Clear</button>
          </div>
        )}
      </div>

      {/* Inline Create Customer Form */}
      {showCreateForm && (
        <div className="crm-card" style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1e3c72' }}>Add New Customer</h3>
            <button onClick={() => { setShowCreateForm(false); setFieldValues({}); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#64748b' }}>✕</button>
          </div>
          <div style={{ padding: '12px' }}>
            {(() => {
              const groupedFields = groupFieldsBySection(fieldDefinitions);
              const sectionOrder = ['Basic Information', 'Professional Information', 'Skills & Qualifications', 'Location Information', 'Salary Information', 'Availability', 'Resume & Links', 'Source Information', 'Job Preferences', 'Status', 'Additional Information'];

              return sectionOrder.map(sectionName => {
                const sectionFields = groupedFields[sectionName];
                if (!sectionFields || sectionFields.length === 0) return null;

                return (
                  <div key={sectionName} style={{ marginBottom: '10px' }}>
                    <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#374151', marginBottom: '6px', paddingBottom: '4px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>{sectionName}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                      {sectionFields.map((field) => {
                        const isFullWidth = field.fieldType === 'textarea';
                        return (
                          <div key={field._id} style={isFullWidth ? { gridColumn: 'span 3' } : {}}>
                            {renderDynamicField(field)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '8px 12px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
            <button className="crm-btn crm-btn-secondary crm-btn-sm" onClick={() => { setShowCreateForm(false); setFieldValues({}); }}>Cancel</button>
            <button className="crm-btn crm-btn-primary crm-btn-sm" onClick={handleCreateCandidate}>Create</button>
          </div>
        </div>
      )}

      {/* Inline Move to Leads Form */}
      {showMoveForm && (
        <div className="crm-card" style={{ marginBottom: '12px', border: '2px solid #86EFAC' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #e5e7eb', background: '#DCFCE7' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#166534' }}>Move {selectedCandidates.length} Candidates to Leads</h3>
            <button onClick={() => setShowMoveForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#64748b' }}>✕</button>
          </div>
          <div style={{ padding: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Lead Status</label>
                <select value={moveForm.leadStatus} onChange={(e) => setMoveForm({ ...moveForm, leadStatus: e.target.value })} className="crm-form-select" style={{ padding: '6px 8px', fontSize: '12px' }}>
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Qualified">Qualified</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Lead Source</label>
                <input type="text" value={moveForm.leadSource} onChange={(e) => setMoveForm({ ...moveForm, leadSource: e.target.value })} className="crm-form-input" style={{ padding: '6px 8px', fontSize: '12px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Rating</label>
                <select value={moveForm.rating} onChange={(e) => setMoveForm({ ...moveForm, rating: e.target.value })} className="crm-form-select" style={{ padding: '6px 8px', fontSize: '12px' }}>
                  <option value="Hot">Hot</option>
                  <option value="Warm">Warm</option>
                  <option value="Cold">Cold</option>
                </select>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '8px 12px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
            <button className="crm-btn crm-btn-secondary crm-btn-sm" onClick={() => setShowMoveForm(false)}>Cancel</button>
            <button className="crm-btn crm-btn-success crm-btn-sm" onClick={handleMoveToLeads}>Confirm & Move</button>
          </div>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-container" style={{ padding: '12px', marginBottom: '12px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '700', color: '#1e3c72' }}>Advanced Search Filters</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
            <div><label style={{ fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '2px', display: 'block' }}>Search</label><input type="text" name="search" placeholder="Name, email..." value={filters.search} onChange={handleFilterChange} className="crm-form-input" style={{ padding: '6px 8px', fontSize: '12px' }} /></div>
            <div><label style={{ fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '2px', display: 'block' }}>Skills</label><input type="text" name="skills" placeholder="React, Node..." value={filters.skills} onChange={handleFilterChange} className="crm-form-input" style={{ padding: '6px 8px', fontSize: '12px' }} /></div>
            <div><label style={{ fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '2px', display: 'block' }}>Min Exp</label><input type="number" name="experience_min" placeholder="0" value={filters.experience_min} onChange={handleFilterChange} className="crm-form-input" style={{ padding: '6px 8px', fontSize: '12px' }} /></div>
            <div><label style={{ fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '2px', display: 'block' }}>Max Exp</label><input type="number" name="experience_max" placeholder="10" value={filters.experience_max} onChange={handleFilterChange} className="crm-form-input" style={{ padding: '6px 8px', fontSize: '12px' }} /></div>
            <div><label style={{ fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '2px', display: 'block' }}>Location</label><input type="text" name="location" placeholder="Delhi..." value={filters.location} onChange={handleFilterChange} className="crm-form-input" style={{ padding: '6px 8px', fontSize: '12px' }} /></div>
            <div><label style={{ fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '2px', display: 'block' }}>Availability</label><select name="availability" value={filters.availability} onChange={handleFilterChange} className="crm-form-select" style={{ padding: '6px 8px', fontSize: '12px' }}><option value="">All</option><option value="Immediate">Immediate</option><option value="15 Days">15 Days</option><option value="30 Days">30 Days</option></select></div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button className="crm-btn crm-btn-primary crm-btn-sm" onClick={applyFilters}>Apply</button>
            <button className="crm-btn crm-btn-secondary crm-btn-sm" onClick={clearFilters}>Clear</button>
          </div>
        </div>
      )}

      {/* Candidates Display */}
      <div className="crm-card">
        <div className="crm-card-header" style={{ padding: '10px 16px' }}>
          <h2 className="crm-card-title" style={{ fontSize: '14px' }}>{viewMode === 'grid' ? 'Candidate Cards' : 'Candidate List'} ({pagination.total})</h2>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div><p style={{ marginTop: '12px', color: '#64748b', fontSize: '13px' }}>Loading...</p></div>
        ) : candidates.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', fontWeight: '600', color: '#1e3c72', marginBottom: '8px' }}>No candidates found</p>
            <p style={{ color: '#64748b', marginBottom: '16px', fontSize: '13px' }}>Upload a CSV/Excel file to get started</p>
            <button className="crm-btn crm-btn-primary crm-btn-sm" onClick={() => fileInputRef.current?.click()}>Upload Candidates</button>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {candidates.map(candidate => (
                  <div key={candidate._id} style={{ background: '#fff', borderRadius: '8px', padding: '12px', border: selectedCandidates.includes(candidate._id) ? '2px solid #4A90E2' : '1px solid #e5e7eb', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input type="checkbox" checked={selectedCandidates.includes(candidate._id)} onChange={(e) => { e.stopPropagation(); handleSelectCandidate(candidate._id); }} style={{ width: '16px', height: '16px' }} />
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1e3c72' }}>{candidate.firstName} {candidate.lastName}</h3>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{candidate.currentDesignation || 'N/A'}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span className={`status-badge ${getAvailabilityColor(candidate.availability)}`} style={{ fontSize: '10px', padding: '2px 6px' }}>{candidate.availability}</span>
                      <span className={`status-badge ${candidate.status === 'Available' ? 'success' : 'secondary'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>{candidate.status}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {candidate.email && <div style={{ marginBottom: '2px' }}>{candidate.email}</div>}
                      {candidate.phone && <div style={{ marginBottom: '2px' }}>{candidate.phone}</div>}
                      <div>{candidate.totalExperience} yrs exp</div>
                    </div>
                    <button className="crm-btn crm-btn-primary crm-btn-sm" onClick={() => navigate(`/data-center/${candidate._id}`)} style={{ width: '100%', marginTop: '8px', fontSize: '11px', padding: '4px' }}>View Profile</button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '40px', padding: '8px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                        <input type="checkbox" checked={selectedCandidates.length === candidates.length && candidates.length > 0} onChange={handleSelectAll} style={{ width: '16px', height: '16px' }} />
                      </th>
                      {displayColumns.map((column) => (
                        <th key={column} style={{ padding: '8px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{formatFieldName(column)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map(candidate => (
                      <tr key={candidate._id} onClick={(e) => { if (e.target.type !== 'checkbox') navigate(`/data-center/${candidate._id}`); }} style={{ background: selectedCandidates.includes(candidate._id) ? '#EFF6FF' : '#fff', cursor: 'pointer', border: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '8px' }}>
                          <input type="checkbox" checked={selectedCandidates.includes(candidate._id)} onChange={(e) => { e.stopPropagation(); handleSelectCandidate(candidate._id); }} onClick={(e) => e.stopPropagation()} style={{ width: '16px', height: '16px' }} />
                        </td>
                        {displayColumns.map((column) => (
                          <td key={column} style={{ padding: '8px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px', color: '#475569' }}>
                            {formatFieldValue(getFieldValue(candidate, column))}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #e5e7eb' }}>
                <button className="crm-btn crm-btn-secondary crm-btn-sm" disabled={pagination.page === 1} onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}>← Prev</button>
                <span style={{ fontWeight: '600', color: '#1e3c72', fontSize: '12px' }}>Page {pagination.page} of {pagination.pages}</span>
                <button className="crm-btn crm-btn-secondary crm-btn-sm" disabled={pagination.page === pagination.pages} onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DataCenter;
