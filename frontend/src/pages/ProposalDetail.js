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
      alert(err.message || 'Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleSend = async () => {
    const email = prompt('Enter recipient email:', proposal?.customerEmail);
    if (!email) return;

    try {
      await proposalService.sendProposal(id, [email]);
      alert('Proposal sent successfully!');
      fetchProposal();
    } catch (err) {
      alert(err.message || 'Failed to send proposal');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this proposal?')) return;

    try {
      await proposalService.deleteProposal(id);
      navigate('/proposals');
    } catch (err) {
      alert(err.message || 'Failed to delete proposal');
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
        <div style={{ marginBottom: '20px' }}>
          <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', background: statusColor.bg, color: statusColor.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {proposal.status}
          </span>
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </DashboardLayout>
  );
};

export default ProposalDetail;
