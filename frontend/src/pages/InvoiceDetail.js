import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { API_URL, getAuthHeaders } from '../config/api.config';
import { generateInvoicePaymentLink } from '../utils/razorpay';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [paymentLink, setPaymentLink] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/invoices/${id}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Failed to fetch invoice');

      const data = await response.json();
      setInvoice(data.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(`${API_URL}/invoices/${id}/download-pdf`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Failed to download PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Error downloading PDF: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(`${API_URL}/invoices/${id}/send`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Failed to send email');

      alert('Invoice sent successfully!');
      fetchInvoice();
    } catch (err) {
      alert('Error sending email: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleGeneratePaymentLink = async () => {
    try {
      setLinkLoading(true);
      const res = await generateInvoicePaymentLink(invoice._id);
      setPaymentLink(res.data.paymentLinkUrl);
      window.open(res.data.paymentLinkUrl, '_blank');
      alert('Payment link generated successfully!');
    } catch (e) {
      alert(e?.message || 'Failed to generate payment link');
    } finally {
      setLinkLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      draft: { bg: '#f3f4f6', color: '#374151', label: 'Draft' },
      sent: { bg: '#dbeafe', color: '#1e40af', label: 'Sent' },
      viewed: { bg: '#e0f2fe', color: '#075985', label: 'Viewed' },
      partial: { bg: '#fef3c7', color: '#92400e', label: 'Partially Paid' },
      paid: { bg: '#d1fae5', color: '#065f46', label: 'Paid' },
      overdue: { bg: '#fee2e2', color: '#991b1b', label: 'Overdue' },
      cancelled: { bg: '#f3f4f6', color: '#6b7280', label: 'Cancelled' }
    };
    return styles[status] || styles.draft;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <div style={{ fontSize: '18px', color: '#6b7280' }}>Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !invoice) {
    return (
      <DashboardLayout>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '18px', color: '#ef4444', marginBottom: '20px' }}>
            {error || 'Invoice not found'}
          </div>
          <button onClick={() => navigate('/invoices')} style={styles.backButton}>
            ← Back to Invoices
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const statusStyle = getStatusStyle(invoice.status);

  return (
    <DashboardLayout>
      <div style={{...styles.container, padding: isMobile ? '12px' : '24px'}}>
        {/* Header Section */}
        <div style={{...styles.header, padding: isMobile ? '16px' : '24px 28px'}}>
          <div style={styles.headerLeft}>
            <button onClick={() => navigate('/invoices')} style={styles.backBtn}>
              ← Back
            </button>
            <div>
              <h1 style={styles.title}>Invoice {invoice.invoiceNumber}</h1>
              <p style={styles.subtitle}>{invoice.title || 'Invoice Details'}</p>
            </div>
          </div>
          <div style={styles.headerRight}>
            <span style={{ ...styles.statusBadge, background: statusStyle.bg, color: statusStyle.color }}>
              {statusStyle.label}
            </span>
            <button onClick={() => navigate(`/invoices/${id}/edit`)} style={styles.editBtn}>
              ✏️ Edit
            </button>
            <button onClick={handleDownloadPDF} disabled={actionLoading} style={styles.downloadBtn}>
              📄 {actionLoading ? 'Downloading...' : 'Download PDF'}
            </button>
            <button onClick={handleSendEmail} disabled={actionLoading} style={styles.sendBtn}>
              📧 Send Email
            </button>
          </div>
        </div>


        <div style={{...styles.content, gridTemplateColumns: isMobile ? '1fr' : '1fr 400px'}}>
          {/* Left Column */}
          <div style={styles.leftColumn}>
            {/* Premium Customer Info Card - Compact */}
            <div style={{...styles.card, border: 'none', overflow: 'hidden'}}>
              <div style={{
                background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
                padding: '12px 20px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px'
                  }}>👤</div>
                  <h3 style={{ margin: 0, color: 'white', fontSize: '15px', fontWeight: '700' }}>Customer Information</h3>
                </div>
              </div>
              <div style={styles.cardBody}>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Name</span>
                  <span style={styles.value}>{invoice.customerName}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Email</span>
                  <span style={styles.value}>{invoice.customerEmail}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Phone</span>
                  <span style={styles.value}>{invoice.customerPhone || '-'}</span>
                </div>
                <div style={{...styles.infoRow, alignItems: 'flex-start'}}>
                  <span style={styles.label}>Address</span>
                  <span style={{...styles.value, maxWidth: '65%', whiteSpace: 'normal', wordBreak: 'break-word'}}>
                    {invoice.customerAddress || '-'}
                  </span>
                </div>
                {invoice.customerGstin && (
                  <div style={styles.infoRow}>
                    <span style={styles.label}>GSTIN</span>
                    <span style={styles.valueBold}>{invoice.customerGstin}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Premium Items Card - Compact */}
            <div style={{...styles.card, border: 'none', overflow: 'hidden'}}>
              <div style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                padding: '12px 20px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px'
                  }}>📦</div>
                  <h3 style={{ margin: 0, color: 'white', fontSize: '15px', fontWeight: '700' }}>Items</h3>
                </div>
              </div>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeader}>
                      <th style={styles.th}>Product</th>
                      <th style={styles.th}>Description</th>
                      <th style={styles.thCenter}>Qty</th>
                      <th style={styles.thRight}>Unit Price</th>
                      <th style={styles.thCenter}>Discount</th>
                      <th style={styles.thCenter}>Tax</th>
                      <th style={styles.thRight}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items?.map((item, index) => (
                      <tr key={index} style={styles.tableRow}>
                        <td style={styles.td}>
                          <div style={styles.productName}>{item.productName}</div>
                          {item.hsnCode && <div style={styles.hsnCode}>HSN: {item.hsnCode}</div>}
                        </td>
                        <td style={styles.td}>{item.description || '-'}</td>
                        <td style={styles.tdCenter}>{item.quantity}</td>
                        <td style={styles.tdRight}>₹{item.unitPrice?.toLocaleString()}</td>
                        <td style={styles.tdCenter}>{item.discount || 0}%</td>
                        <td style={styles.tdCenter}>{item.tax || 18}%</td>
                        <td style={styles.tdRight}>
                          <span style={styles.totalAmount}>₹{item.total?.toLocaleString()}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={styles.rightColumn}>
            {/* Premium Invoice Info Card - Compact */}
            <div style={{...styles.card, border: 'none', overflow: 'hidden'}}>
              <div style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                padding: '12px 20px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px'
                  }}>📋</div>
                  <h3 style={{ margin: 0, color: 'white', fontSize: '15px', fontWeight: '700' }}>Invoice Information</h3>
                </div>
              </div>
              <div style={styles.cardBody}>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Date</span>
                  <span style={styles.value}>
                    {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Due Date</span>
                  <span style={styles.value}>
                    {new Date(invoice.dueDate).toLocaleDateString('en-IN')}
                  </span>
                </div>
                {invoice.placeOfSupply && (
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Place of Supply</span>
                    <span style={styles.value}>{invoice.placeOfSupply}</span>
                  </div>
                )}
                {invoice.taxType && (
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Tax Type</span>
                    <span style={styles.valueBold}>{invoice.taxType}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Premium Amount Summary Card - Compact */}
            <div style={{...styles.card, border: 'none', overflow: 'hidden'}}>
              <div style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                padding: '12px 20px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px'
                  }}>💰</div>
                  <h3 style={{ margin: 0, color: 'white', fontSize: '15px', fontWeight: '700' }}>Amount Summary</h3>
                </div>
              </div>
              <div style={styles.cardBody}>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Subtotal</span>
                  <span style={styles.summaryValue}>₹{invoice.subtotal?.toLocaleString()}</span>
                </div>
                {invoice.totalDiscount > 0 && (
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>Discount</span>
                    <span style={{ ...styles.summaryValue, color: '#dc2626' }}>
                      - ₹{invoice.totalDiscount?.toLocaleString()}
                    </span>
                  </div>
                )}
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Tax (GST)</span>
                  <span style={styles.summaryValue}>+ ₹{invoice.totalTax?.toLocaleString()}</span>
                </div>
                <div style={styles.divider}></div>
                <div style={styles.totalRow}>
                  <span style={styles.totalLabel}>Total</span>
                  <span style={styles.totalValue}>₹{invoice.totalAmount?.toLocaleString()}</span>
                </div>
                {invoice.amountPaid > 0 && (
                  <>
                    <div style={styles.summaryRow}>
                      <span style={styles.summaryLabel}>Paid</span>
                      <span style={{ ...styles.summaryValue, color: '#16a34a' }}>
                        - ₹{invoice.amountPaid?.toLocaleString()}
                      </span>
                    </div>
                    <div style={styles.totalRow}>
                      <span style={styles.totalLabel}>Balance Due</span>
                      <span style={{ ...styles.totalValue, color: '#dc2626' }}>
                        ₹{((invoice.totalAmount || 0) - (invoice.amountPaid || 0))?.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Terms Card */}
            {invoice.terms && (
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.cardIcon}>📝</span>
                  <h3 style={styles.cardTitle}>Terms & Conditions</h3>
                </div>
                <div style={styles.cardBody}>
                  <p style={styles.terms}>{invoice.terms}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Modern Professional Styles
const styles = {
  container: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
    background: '#f9fafb'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    padding: '24px 28px',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    border: '1px solid rgba(226, 232, 240, 0.8)',
    flexWrap: 'wrap',
    gap: '16px'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap'
  },
  headerRight: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  backBtn: {
    padding: '8px 16px',
    background: '#f3f4f6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    transition: 'all 0.2s'
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 4px 0'
  },
  subtitle: {
    fontSize: '13px',
    color: '#6b7280',
    margin: 0
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600'
  },
  editBtn: {
    padding: '8px 16px',
    background: '#f3f4f6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    whiteSpace: 'nowrap'
  },
  downloadBtn: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    color: '#ffffff',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap'
  },
  sendBtn: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    color: '#ffffff',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap'
  },
  paymentBtn: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)',
    transition: 'all 0.2s'
  },
  paymentLinkCard: {
    padding: '16px 24px',
    background: '#f0fdf4',
    border: '1px solid #86efac',
    borderRadius: '12px',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap'
  },
  paymentLinkLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#065f46'
  },
  paymentLinkUrl: {
    fontSize: '14px',
    color: '#10b981',
    textDecoration: 'none',
    fontWeight: '500',
    wordBreak: 'break-all'
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: '24px'
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
    border: '1px solid rgba(226, 232, 240, 0.8)'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb'
  },
  cardIcon: {
    fontSize: '20px'
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    margin: 0
  },
  cardBody: {
    padding: '24px'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #f3f4f6'
  },
  label: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500'
  },
  value: {
    fontSize: '14px',
    color: '#111827',
    textAlign: 'right'
  },
  valueBold: {
    fontSize: '14px',
    color: '#111827',
    fontWeight: '600',
    textAlign: 'right'
  },
  tableWrapper: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableHeader: {
    background: '#f9fafb',
    borderBottom: '2px solid #e5e7eb'
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  thCenter: {
    padding: '12px 16px',
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase'
  },
  thRight: {
    padding: '12px 16px',
    textAlign: 'right',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase'
  },
  tableRow: {
    borderBottom: '1px solid #f3f4f6'
  },
  td: {
    padding: '16px',
    fontSize: '14px',
    color: '#374151'
  },
  tdCenter: {
    padding: '16px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#374151'
  },
  tdRight: {
    padding: '16px',
    textAlign: 'right',
    fontSize: '14px',
    color: '#374151'
  },
  productName: {
    fontWeight: '600',
    color: '#111827',
    marginBottom: '4px'
  },
  hsnCode: {
    fontSize: '12px',
    color: '#6b7280'
  },
  totalAmount: {
    fontWeight: '600',
    color: '#111827'
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    fontSize: '14px'
  },
  summaryLabel: {
    color: '#6b7280'
  },
  summaryValue: {
    fontWeight: '500',
    color: '#111827'
  },
  divider: {
    height: '1px',
    background: '#e5e7eb',
    margin: '16px 0'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '16px 0',
    fontSize: '16px'
  },
  totalLabel: {
    fontWeight: '600',
    color: '#111827'
  },
  totalValue: {
    fontWeight: '700',
    color: '#2563eb',
    fontSize: '18px'
  },
  terms: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.6',
    margin: 0
  },
  backButton: {
    padding: '12px 24px',
    background: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  }
};

export default InvoiceDetail;
