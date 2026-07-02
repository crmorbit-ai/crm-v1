import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import proposalService from '../services/proposalService';
import DashboardLayout from '../components/layout/DashboardLayout';
import { API_URL, getAuthHeaders } from '../config/api.config';
import '../styles/crm.css';

const ProposalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [managers, setManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  useEffect(() => {
    fetchProposal();
  }, [id]);

  const fetchProposal = async () => {
    try {
      setLoading(true);
      const response = await proposalService.getProposal(id);
      setProposal(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load proposal');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const response = await fetch(`${API_URL}/proposals/${id}/pdf`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to download PDF: ${response.status} ${errorText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${proposal.proposalNumber || 'proposal'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('PDF Download Error:', err);
      showToast(err.message || 'Failed to download PDF', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleSend = () => {
    setShowSendModal(true);
  };

  const handleSendConfirm = async () => {
    try {
      setSending(true);
      await proposalService.sendProposal(id, [proposal?.customerEmail]);
      showToast(`Proposal sent successfully to ${proposal?.customerEmail}!`);
      setShowSendModal(false);
      fetchProposal();
    } catch (err) {
      showToast(err.message || 'Failed to send proposal', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await proposalService.deleteProposal(id);
      navigate('/proposals');
    } catch (err) {
      showToast(err.message || 'Failed to delete proposal', 'error');
      setDeleting(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await fetch(`${API_URL}/proposals/managers/list`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setManagers(data.data);
      }
    } catch (err) {
      console.error('Fetch managers error:', err);
    }
  };

  const handleAssignClick = () => {
    fetchManagers();
    setShowAssignModal(true);
  };

  const handleAssignSubmit = async () => {
    if (!selectedManager) {
      showToast('Please select a manager', 'error');
      return;
    }

    try {
      setAssigning(true);
      const response = await fetch(`${API_URL}/proposals/${id}/assign`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ assignedTo: selectedManager })
      });

      const data = await response.json();

      if (data.success) {
        showToast('Proposal assigned successfully!');
        setShowAssignModal(false);
        setSelectedManager('');
        fetchProposal(); // Refresh to show assignment
      } else {
        throw new Error(data.message || 'Assignment failed');
      }
    } catch (err) {
      showToast(err.message || 'Failed to assign proposal', 'error');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Proposal Details">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Loading proposal...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !proposal) {
    return (
      <DashboardLayout title="Proposal Details">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <h3 style={{ fontSize: '18px', color: '#dc2626', marginBottom: '8px' }}>{error || 'Proposal not found'}</h3>
          <Link to="/proposals" style={{ color: '#10b981', textDecoration: 'none', fontSize: '14px' }}>← Back to Proposals</Link>
        </div>
      </DashboardLayout>
    );
  }

  const currencySymbol = proposal.currency === 'USD' ? '$' : proposal.currency === 'EUR' ? '€' : proposal.currency === 'GBP' ? '£' : '₹';
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const STATUS_COLORS = {
    draft: { bg: '#f1f5f9', text: '#64748b' },
    sent: { bg: '#dbeafe', text: '#2563eb' },
    viewed: { bg: '#cffafe', text: '#0891b2' },
    accepted: { bg: '#d1fae5', text: '#059669' },
    rejected: { bg: '#fee2e2', text: '#dc2626' },
    expired: { bg: '#fef3c7', text: '#d97706' }
  };

  const statusColor = STATUS_COLORS[proposal.status] || STATUS_COLORS.draft;

  return (
    <DashboardLayout title={`Proposal ${proposal.proposalNumber}`}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px 40px' }}>

        {/* Header Actions */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Link to="/proposals" style={{ padding: '10px 16px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none', color: '#0f172a', display: 'inline-block' }}>
            ← Back
          </Link>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {proposal.status === 'draft' && (
              <>
                <button onClick={() => navigate(`/proposals/${id}/edit`)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  ✏️ Edit
                </button>
                <button onClick={handleSend} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  📧 Send
                </button>
              </>
            )}
            <button onClick={handleDownloadPDF} disabled={downloading} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', fontSize: '13px', fontWeight: '700', cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading ? 0.6 : 1 }}>
              {downloading ? '⏳ Downloading...' : '📄 Download PDF'}
            </button>
            {proposal.status === 'draft' && (
              <button onClick={handleDelete} style={{ padding: '10px 16px', borderRadius: '8px', border: '1.5px solid #fecaca', background: '#fee2e2', color: '#dc2626', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                🗑️ Delete
              </button>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', background: statusColor.bg, color: statusColor.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {proposal.status}
          </span>

          {proposal.assignedTo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: '#f3f4f6', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Assigned to:</span>
              <span style={{ fontSize: '12px', color: '#1f2937', fontWeight: '700' }}>
                {proposal.assignedTo.name || proposal.assignedTo.email}
              </span>
            </div>
          )}

          {proposal.reviewStatus && (
            <span style={{
              display: 'inline-block',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              background: proposal.reviewStatus === 'approved' ? '#d1fae5' : proposal.reviewStatus === 'rejected' ? '#fee2e2' : '#fef3c7',
              color: proposal.reviewStatus === 'approved' ? '#065f46' : proposal.reviewStatus === 'rejected' ? '#991b1b' : '#92400e',
              textTransform: 'uppercase'
            }}>
              {proposal.reviewStatus === 'approved' ? '✓ Approved' : proposal.reviewStatus === 'rejected' ? '✗ Rejected' : '⏳ Pending Review'}
            </span>
          )}
        </div>

        {/* Main Content Card */}
        <div style={{ background: 'white', borderRadius: '12px', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', overflow: 'hidden' }}>

          {/* Header Section */}
          <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '32px', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', color: 'white' }}>
                  {proposal.title}
                </h1>
                <p style={{ fontSize: '14px', opacity: 0.9, margin: 0 }}>
                  Proposal Number: <strong>{proposal.proposalNumber}</strong>
                </p>
                {proposal.rfpNumber && (
                  <p style={{ fontSize: '13px', opacity: 0.8, margin: '4px 0 0' }}>
                    RFP: {proposal.rfpNumber}
                  </p>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '4px' }}>Total Amount</div>
                <div style={{ fontSize: '32px', fontWeight: '800' }}>
                  {currencySymbol}{proposal.totalAmount?.toLocaleString() || '0'}
                </div>
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Customer</div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>{proposal.customerName}</div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>{proposal.customerEmail}</div>
                {proposal.customerPhone && <div style={{ fontSize: '13px', color: '#64748b' }}>{proposal.customerPhone}</div>}
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Dates</div>
                <div style={{ fontSize: '13px', marginBottom: '4px' }}>
                  <strong>Proposal Date:</strong> {formatDate(proposal.proposalDate)}
                </div>
                <div style={{ fontSize: '13px' }}>
                  <strong>Valid Until:</strong> {formatDate(proposal.validUntil)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Created By</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                  {proposal.createdBy ? `${proposal.createdBy.firstName} ${proposal.createdBy.lastName}` : 'System'}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                  {formatDate(proposal.createdAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Sections */}
          {proposal.sections && proposal.sections.length > 0 && (
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
              {proposal.sections.map((section, index) => (
                <div key={index} style={{ marginBottom: index < proposal.sections.length - 1 ? '24px' : 0 }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>📝</span> {section.title}
                  </h3>
                  <div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                    {section.content}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Timeline */}
          {proposal.milestones && proposal.milestones.length > 0 && (
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>📅</span> Project Timeline
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', fontSize: '11px' }}>Milestone</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', fontSize: '11px' }}>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposal.milestones.map((milestone, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px', color: '#0f172a', fontWeight: '500' }}>{milestone.name}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>
                          {milestone.duration} {milestone.durationUnit}
                          {milestone.duration > 1 ? 's' : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Budget */}
          {proposal.resources && proposal.resources.length > 0 && (
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>💰</span> Budget & Resources
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', fontSize: '11px' }}>Role/Resource</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', fontSize: '11px' }}>Count</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', fontSize: '11px' }}>Rate ({currencySymbol})</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', fontSize: '11px' }}>Total ({currencySymbol})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposal.resources.map((resource, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px', color: '#0f172a', fontWeight: '500' }}>{resource.role}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>{resource.count}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#64748b' }}>{resource.rate.toLocaleString()}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#059669' }}>{resource.total.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr style={{ background: '#f0fdf4', fontWeight: '700', borderTop: '2px solid #10b981' }}>
                      <td colSpan="3" style={{ padding: '14px', textAlign: 'right', fontSize: '14px', color: '#0f172a' }}>Total Project Cost:</td>
                      <td style={{ padding: '14px', textAlign: 'right', fontSize: '16px', color: '#059669' }}>
                        {currencySymbol}{proposal.subtotal?.toLocaleString() || '0'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payment Terms */}
          {proposal.paymentTerms && proposal.paymentTerms.length > 0 && (
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>💳</span> Payment Terms
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', fontSize: '11px' }}>Milestone</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', fontSize: '11px' }}>Percentage</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', fontSize: '11px' }}>Amount ({currencySymbol})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposal.paymentTerms.map((term, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px', color: '#0f172a', fontWeight: '500' }}>{term.milestone}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>{term.percentage}%</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#059669' }}>{term.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr style={{ background: '#eff6ff', fontWeight: '700', borderTop: '2px solid #3b82f6' }}>
                      <td style={{ padding: '14px' }}>Total</td>
                      <td style={{ padding: '14px', textAlign: 'center', fontSize: '14px', color: '#0f172a' }}>
                        {proposal.paymentTerms.reduce((sum, t) => sum + t.percentage, 0)}%
                      </td>
                      <td style={{ padding: '14px', textAlign: 'right', fontSize: '16px', color: '#059669' }}>
                        {currencySymbol}{proposal.paymentTerms.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Terms & Notes */}
          {(proposal.terms || proposal.notes) && (
            <div style={{ padding: '24px' }}>
              {proposal.terms && (
                <div style={{ marginBottom: proposal.notes ? '20px' : 0 }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Terms & Conditions</h4>
                  <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                    {proposal.terms}
                  </div>
                </div>
              )}
              {proposal.notes && (
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Notes</h4>
                  <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                    {proposal.notes}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                👤 Assign to Manager
              </h2>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedManager('');
                }}
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

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                Select Manager <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={selectedManager}
                onChange={(e) => setSelectedManager(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="">-- Select Manager --</option>
                {managers.map(manager => (
                  <option key={manager._id} value={manager._id}>
                    {manager.name} ({manager.email}) - {manager.userType}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedManager('');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f1f5f9',
                  color: '#64748b',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignSubmit}
                disabled={!selectedManager || assigning}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: (!selectedManager || assigning) ? '#cbd5e1' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: (!selectedManager || assigning) ? 'not-allowed' : 'pointer'
                }}
              >
                {assigning ? '⏳ Assigning...' : '✓ Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Send Confirmation Modal */}
      {showSendModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '480px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '28px'
              }}>
                📧
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' }}>
                Send Proposal
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                The proposal will be sent via email to:
              </p>
            </div>

            <div style={{
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '10px',
              border: '2px solid #e2e8f0',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>
                Recipient
              </div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>
                {proposal?.customerEmail}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>
                Proposal: <span style={{ fontWeight: '700', color: '#0f172a' }}>{proposal?.proposalNumber}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                {proposal?.title}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowSendModal(false)}
                disabled={sending}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f1f5f9',
                  color: '#64748b',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: sending ? 'not-allowed' : 'pointer',
                  opacity: sending ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSendConfirm}
                disabled={sending}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: sending ? '#cbd5e1' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: sending ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {sending ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid white',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    Sending...
                  </>
                ) : (
                  <>📧 Send Email</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '420px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '28px'
              }}>
                🗑️
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' }}>
                Delete Proposal?
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                This action cannot be undone. The proposal will be permanently deleted.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f1f5f9',
                  color: '#64748b',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: deleting ? '#fca5a5' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: deleting ? 'not-allowed' : 'pointer'
                }}
              >
                {deleting ? 'Deleting...' : '🗑️ Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '16px 24px',
          background: toast.type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white',
          borderRadius: '10px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          zIndex: 10000,
          fontSize: '14px',
          fontWeight: '600',
          maxWidth: '400px',
          animation: 'slideIn 0.3s ease-out'
        }}>
          {toast.message}
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default ProposalDetail;
