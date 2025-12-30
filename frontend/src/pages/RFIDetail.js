import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import rfiService from '../services/rfiService';
import DashboardLayout from '../components/layout/DashboardLayout';
import '../styles/crm.css';

const RFIDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rfi, setRfi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRFI();
  }, [id]);

  const fetchRFI = async () => {
    try {
      setLoading(true);
      const response = await rfiService.getRFI(id);
      setRfi(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch RFI');
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToQuotation = async () => {
    if (window.confirm('Convert this RFI to a quotation?')) {
      try {
        const response = await rfiService.convertToQuotation(id);
        if (response.success && response.data && response.data._id) {
          alert('RFI converted to quotation successfully!');
          navigate(`/quotations/${response.data._id}`);
        }
      } catch (err) {
        alert(err.message || 'Failed to convert RFI to quotation');
      }
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      await rfiService.updateStatus(id, newStatus);
      fetchRFI();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { label: 'Draft', color: '#6c757d' },
      sent: { label: 'Sent', color: '#0d6efd' },
      responded: { label: 'Responded', color: '#0dcaf0' },
      converted: { label: 'Converted', color: '#198754' },
      closed: { label: 'Closed', color: '#dc3545' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span style={{
        padding: '6px 16px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '600',
        backgroundColor: `${config.color}20`,
        color: config.color
      }}>
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { label: 'Low', color: '#198754' },
      medium: { label: 'Medium', color: '#0d6efd' },
      high: { label: 'High', color: '#ffc107' },
      urgent: { label: 'Urgent', color: '#dc3545' }
    };

    const config = priorityConfig[priority] || priorityConfig.medium;
    return (
      <span style={{
        padding: '6px 16px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '600',
        backgroundColor: `${config.color}20`,
        color: config.color
      }}>
        {config.label}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardLayout title="RFI Details">
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      </DashboardLayout>
    );
  }

  if (error || !rfi) {
    return (
      <DashboardLayout title="RFI Details">
        <div className="error-message" style={{ marginBottom: '20px' }}>
          {error || 'RFI not found'}
        </div>
        <button className="btn-secondary" onClick={() => navigate('/rfi')}>
          Back to RFIs
        </button>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`RFI ${rfi.rfiNumber}`}>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1>📋 RFI {rfi.rfiNumber}</h1>
            {getStatusBadge(rfi.status)}
            {getPriorityBadge(rfi.priority)}
          </div>
          <p className="page-subtitle">{rfi.title}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={() => navigate('/rfi')}>
            Back to List
          </button>
          {rfi.status === 'draft' && (
            <button className="btn-secondary" onClick={() => navigate(`/rfi/${id}/edit`)}>
              Edit
            </button>
          )}
          {rfi.status === 'responded' && !rfi.convertedToRFQ && (
            <button className="btn-primary" onClick={handleConvertToQuotation}>
              Convert to Quotation
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gap: '24px' }}>
        <div className="detail-section">
          <h2 className="detail-section-title">Customer Information</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-label">Customer Name</div>
              <div className="detail-value">{rfi.customerName || '-'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Email</div>
              <div className="detail-value">{rfi.customerEmail || '-'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Phone</div>
              <div className="detail-value">{rfi.customerPhone || '-'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Company</div>
              <div className="detail-value">{rfi.customerCompany || '-'}</div>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h2 className="detail-section-title">RFI Details</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-label">Created Date</div>
              <div className="detail-value">{formatDate(rfi.createdAt)}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Due Date</div>
              <div className="detail-value">{formatDate(rfi.dueDate)}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Response Date</div>
              <div className="detail-value">{formatDate(rfi.responseDate)}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Assigned To</div>
              <div className="detail-value">
                {rfi.assignedTo ? `${rfi.assignedTo.firstName} ${rfi.assignedTo.lastName}` : '-'}
              </div>
            </div>
          </div>
          {rfi.description && (
            <div className="detail-item" style={{ marginTop: '20px' }}>
              <div className="detail-label">Description</div>
              <div className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{rfi.description}</div>
            </div>
          )}
        </div>

        {rfi.requirements && rfi.requirements.length > 0 && (
          <div className="detail-section">
            <h2 className="detail-section-title">Requirements & Responses</h2>
            <div style={{ display: 'grid', gap: '20px' }}>
              {rfi.requirements.map((req, index) => (
                <div key={index} style={{ borderLeft: '3px solid #4361ee', paddingLeft: '20px', paddingTop: '8px', paddingBottom: '8px' }}>
                  {req.category && (
                    <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px', fontWeight: '500' }}>
                      {req.category}
                    </div>
                  )}
                  <div style={{ fontWeight: '600', marginBottom: '12px', fontSize: '15px' }}>
                    {req.question}
                  </div>
                  {req.answer && (
                    <div style={{ color: '#495057', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                      {req.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {rfi.documents && rfi.documents.length > 0 && (
          <div className="detail-section">
            <h2 className="detail-section-title">Attached Documents</h2>
            <div style={{ display: 'grid', gap: '16px' }}>
              {rfi.documents.map((doc, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <span style={{ fontSize: '24px' }}>📎</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{doc.name}</div>
                    <div style={{ fontSize: '13px', color: '#6c757d' }}>
                      Uploaded: {formatDate(doc.uploadedAt)}
                    </div>
                  </div>
                  {doc.url && (
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '8px 16px' }}>
                      View
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {rfi.notes && (
          <div className="detail-section">
            <h2 className="detail-section-title">Notes</h2>
            <div style={{ whiteSpace: 'pre-wrap' }}>{rfi.notes}</div>
          </div>
        )}

        {rfi.convertedToRFQ && rfi.rfq && (
          <div className="detail-section" style={{ backgroundColor: '#d1e7dd', border: '2px solid #198754' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600', color: '#198754' }}>
              ✅ Converted to Quotation
            </h2>
            <div style={{ marginBottom: '20px', color: '#0f5132', lineHeight: '1.6' }}>
              This RFI has been converted to a quotation.
            </div>
            <button
              className="btn-primary"
              onClick={() => navigate(`/quotations/${rfi.rfq._id || rfi.rfq}`)}
            >
              View Quotation
            </button>
          </div>
        )}

        <div className="detail-section">
          <h2 className="detail-section-title">Actions</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {rfi.status === 'draft' && (
              <button className="btn-secondary" onClick={() => handleUpdateStatus('sent')}>
                Mark as Sent
              </button>
            )}
            {rfi.status === 'sent' && (
              <button className="btn-secondary" onClick={() => handleUpdateStatus('responded')}>
                Mark as Responded
              </button>
            )}
            {(rfi.status === 'draft' || rfi.status === 'sent' || rfi.status === 'responded') && (
              <button
                className="btn-secondary"
                onClick={() => handleUpdateStatus('closed')}
                style={{ backgroundColor: '#dc3545', color: 'white', border: 'none' }}
              >
                Close RFI
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RFIDetail;
