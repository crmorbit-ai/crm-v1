import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import dataCenterService from '../services/dataCenterService';
import '../styles/crm.css';

const DataCenterDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveForm, setMoveForm] = useState({
    leadStatus: 'New',
    leadSource: 'Customer',
    rating: 'Warm'
  });

  useEffect(() => {
    loadCandidate();
  }, [id]);

  const loadCandidate = async () => {
    try {
      setLoading(true);
      const response = await dataCenterService.getCandidate(id);
      setCandidate(response.data);
    } catch (error) {
      if (error?.isPermissionDenied) return;
      console.error('Error loading candidate:', error);
      alert('Failed to load candidate details');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToLead = async () => {
    try {
      const data = {
        candidateIds: [id],
        ...moveForm
      };

      await dataCenterService.moveToLeads(data);
      alert('Successfully moved to Leads!');
      navigate('/leads');
    } catch (error) {
      if (error?.isPermissionDenied) return;
      console.error('Error moving to lead:', error);
      alert('Failed to move to leads');
    }
  };

  // Format field name for display
  const formatFieldName = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ')
      .trim();
  };

  // Check if value is valid (not empty, null, undefined)
  const hasValue = (value) => {
    if (value === null || value === undefined || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return false;
    return true;
  };

  // Format value for display
  const formatValue = (key, value) => {
    if (!hasValue(value)) return null;

    // Handle arrays
    if (Array.isArray(value)) {
      return value.join(', ');
    }

    // Handle dates
    if (key.toLowerCase().includes('date') || key.toLowerCase().includes('at')) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    }

    // Handle CTC/salary values
    if (key.toLowerCase().includes('ctc') || key.toLowerCase().includes('salary')) {
      const num = Number(value);
      if (!isNaN(num)) {
        return `₹${num.toLocaleString('en-IN')}`;
      }
    }

    // Handle boolean
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    return String(value);
  };

  // Fields to exclude from display
  const excludeFields = [
    '_id', 'id', 'ID', '__v', 'tenant', 'importedBy', 'importedAt', 'createdAt', 'updatedAt',
    'movedBy', 'movedToTenant', 'leadId', 'isActive', 'dataSource', 'customFields',
    'tenantId', 'userId', 'candidateId', 'objectId', 'ObjectId'
  ];

  // Check if a value looks like an ID (MongoDB ObjectId or similar)
  const isIdLikeValue = (value) => {
    if (!value || typeof value !== 'string') return false;
    // MongoDB ObjectId is 24 hex characters
    if (/^[a-f0-9]{24}$/i.test(value)) return true;
    // UUID format
    if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)) return true;
    // Numeric ID (more than 10 digits)
    if (/^\d{10,}$/.test(value)) return true;
    return false;
  };

  // Get all displayable fields from candidate
  const getDisplayFields = () => {
    if (!candidate) return [];

    const fields = [];

    Object.keys(candidate).forEach(key => {
      // Skip excluded fields
      if (excludeFields.includes(key)) return;

      // Skip fields with "id" in the name (case insensitive)
      if (key.toLowerCase().includes('id') && key.toLowerCase() !== 'paid') return;

      const value = candidate[key];
      if (!hasValue(value)) return;

      // Skip nested objects except arrays
      if (typeof value === 'object' && !Array.isArray(value)) return;

      // Skip values that look like MongoDB ObjectIds or other IDs
      if (typeof value === 'string' && isIdLikeValue(value)) return;

      fields.push({
        key,
        label: formatFieldName(key),
        value: formatValue(key, value)
      });
    });

    return fields;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '16px', color: '#64748b', fontSize: '15px', fontWeight: '600' }}>
            Loading details...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (!candidate) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>❌</div>
          <h2 style={{ color: '#1e3c72', marginBottom: '8px' }}>Data not found</h2>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>
            This record may have been removed or doesn't exist.
          </p>
          <button className="crm-btn crm-btn-primary" onClick={() => navigate('/data-center')}>
            Back to Data Center
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const displayFields = getDisplayFields();

  // Get name for header - check multiple possible field names
  const getName = () => {
    // Check firstName + lastName combination
    if (candidate.firstName || candidate.lastName) {
      return `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim();
    }

    // Check various possible name fields (case-insensitive search)
    const nameFields = [
      'name', 'Name', 'NAME',
      'fullName', 'FullName', 'fullname', 'full_name', 'Full Name', 'Full_Name',
      'customerName', 'CustomerName', 'customer_name', 'Customer Name', 'Customer_Name',
      'contactName', 'ContactName', 'contact_name', 'Contact Name', 'Contact_Name',
      'clientName', 'ClientName', 'client_name', 'Client Name', 'Client_Name',
      'companyName', 'CompanyName', 'company_name', 'Company Name', 'Company_Name',
      'company', 'Company', 'COMPANY',
      'title', 'Title', 'TITLE'
    ];

    for (const field of nameFields) {
      if (candidate[field] && String(candidate[field]).trim()) {
        const value = String(candidate[field]).trim();
        // Skip if it looks like an ID (24 char hex string)
        if (!isIdLikeValue(value)) {
          return value;
        }
      }
    }

    // Fallback to email if available
    const emailFields = ['email', 'Email', 'EMAIL', 'emailAddress', 'EmailAddress'];
    for (const field of emailFields) {
      if (candidate[field] && String(candidate[field]).trim()) {
        return String(candidate[field]).trim();
      }
    }

    // Last resort - get the first non-empty string field that looks like a name
    const excludeKeys = ['_id', 'id', 'ID', 'status', 'Status', 'tenant', 'dataSource'];
    for (const key of Object.keys(candidate)) {
      if (excludeKeys.includes(key) || key.toLowerCase().includes('id')) continue;

      const value = candidate[key];
      if (typeof value === 'string' && value.trim()) {
        const trimmedValue = value.trim();
        // Skip ID-like values and very long strings
        if (!isIdLikeValue(trimmedValue) && trimmedValue.length < 100) {
          return trimmedValue;
        }
      }
    }

    return 'Customer';
  };

  // Get initials for avatar
  const getInitials = () => {
    const name = getName();
    if (!name || name === 'Customer') return 'CU';

    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <DashboardLayout title="Customer Details">
      {/* Header with Back and Move buttons */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <button
          className="crm-btn crm-btn-secondary"
          onClick={() => navigate('/data-center')}
        >
          ← Back to List
        </button>
        <button
          className="crm-btn crm-btn-primary"
          onClick={() => setShowMoveModal(true)}
          disabled={candidate.status === 'Moved to Leads'}
        >
          Move to Leads
        </button>
      </div>

      {/* Status Badge if moved */}
      {candidate.status === 'Moved to Leads' && (
        <div style={{
          background: '#DCFCE7',
          border: '2px solid #86EFAC',
          padding: '16px 20px',
          borderRadius: '12px',
          marginBottom: '24px',
          color: '#166534',
          fontWeight: '600'
        }}>
          This record has been moved to Leads
        </div>
      )}

      {/* Profile Header Card */}
      <div className="crm-card" style={{ marginBottom: '24px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #4A90E2 0%, #2c5364 100%)',
          padding: '32px',
          borderRadius: '12px 12px 0 0',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: '800',
              color: '#4A90E2',
              flexShrink: 0
            }}>
              {getInitials()}
            </div>
            <div>
              <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700' }}>
                {getName()}
              </h1>
              {candidate.email && (
                <p style={{ margin: '0', fontSize: '16px', opacity: 0.9 }}>
                  {candidate.email}
                </p>
              )}
              {candidate.phone && (
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.8 }}>
                  {candidate.phone}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* All Data Fields - Dynamic */}
      <div className="crm-card">
        <div className="crm-card-header">
          <h3 className="crm-card-title">All Information</h3>
        </div>
        <div className="crm-card-body">
          {displayFields.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
              No data available
            </p>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              {displayFields.map((field, index) => (
                <div
                  key={index}
                  style={{
                    padding: '16px',
                    background: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{
                    fontSize: '12px',
                    color: '#64748b',
                    fontWeight: '600',
                    marginBottom: '6px',
                    textTransform: 'uppercase'
                  }}>
                    {field.label}
                  </div>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#1e3c72',
                    wordBreak: 'break-word'
                  }}>
                    {field.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
            zIndex: 9999
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
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e3c72' }}>
                Move to Leads
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
                ×
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <p style={{ marginBottom: '20px', color: '#475569' }}>
                Move <strong>{getName()}</strong> to the Leads module?
              </p>

              <div className="crm-form-group" style={{ marginBottom: '16px' }}>
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

              <div className="crm-form-group" style={{ marginBottom: '16px' }}>
                <label className="crm-form-label">Lead Source</label>
                <input
                  type="text"
                  value={moveForm.leadSource}
                  onChange={(e) => setMoveForm({ ...moveForm, leadSource: e.target.value })}
                  className="crm-form-input"
                />
              </div>

              <div className="crm-form-group" style={{ marginBottom: '16px' }}>
                <label className="crm-form-label">Rating</label>
                <select
                  value={moveForm.rating}
                  onChange={(e) => setMoveForm({ ...moveForm, rating: e.target.value })}
                  className="crm-form-select"
                >
                  <option value="Hot">Hot</option>
                  <option value="Warm">Warm</option>
                  <option value="Cold">Cold</option>
                </select>
              </div>
            </div>

            <div style={{
              padding: '20px',
              borderTop: '1px solid #e5e7eb',
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
                onClick={handleMoveToLead}
              >
                Confirm & Move
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default DataCenterDetail;
