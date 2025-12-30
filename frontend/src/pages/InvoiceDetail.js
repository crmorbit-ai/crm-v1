import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import '../styles/crm.css';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/invoices/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
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
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/invoices/${id}/download-pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
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
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/invoices/${id}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { label: 'Draft', color: '#6c757d' },
      sent: { label: 'Sent', color: '#0d6efd' },
      viewed: { label: 'Viewed', color: '#0dcaf0' },
      partial: { label: 'Partially Paid', color: '#ffc107' },
      paid: { label: 'Paid', color: '#198754' },
      overdue: { label: 'Overdue', color: '#dc3545' },
      cancelled: { label: 'Cancelled', color: '#6c757d' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span style={{
        padding: '8px 16px',
        borderRadius: '20px',
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
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <DashboardLayout title="Invoice Details">
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      </DashboardLayout>
    );
  }

  if (error || !invoice) {
    return (
      <DashboardLayout title="Invoice Details">
        <div className="error-message">{error || 'Invoice not found'}</div>
      </DashboardLayout>
    );
  }

  const balanceDue = (invoice.totalAmount || 0) - (invoice.paidAmount || 0);

  return (
    <DashboardLayout title={`Invoice ${invoice.invoiceNumber}`}>
      <div className="page-header">
        <div>
          <h1>Invoice {invoice.invoiceNumber}</h1>
          <p className="page-subtitle">{invoice.title}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn-secondary"
            onClick={() => navigate('/invoices')}
          >
            ← Back
          </button>
          {invoice.status === 'draft' && (
            <button
              className="btn-primary"
              onClick={() => navigate(`/invoices/${id}/edit`)}
            >
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="crm-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Invoice Details</h2>
          {getStatusBadge(invoice.status)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px', marginBottom: '28px' }}>
          <div>
            <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer Information</h3>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>{invoice.customerName}</div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '6px', lineHeight: '1.5' }}>{invoice.customerEmail}</div>
            {invoice.customerPhone && (
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '6px', lineHeight: '1.5' }}>{invoice.customerPhone}</div>
            )}
            {invoice.customerAddress && (
              <div style={{ fontSize: '14px', color: '#666', marginTop: '12px', lineHeight: '1.6', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>{invoice.customerAddress}</div>
            )}
          </div>
          <div>
            <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Invoice Information</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', padding: '8px 0', borderBottom: '1px solid #f1f3f5' }}>
              <span style={{ color: '#666', fontWeight: '500' }}>Date:</span>
              <span style={{ fontWeight: '600' }}>{formatDate(invoice.invoiceDate)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', padding: '8px 0', borderBottom: '1px solid #f1f3f5' }}>
              <span style={{ color: '#666', fontWeight: '500' }}>Due Date:</span>
              <span style={{ fontWeight: '600' }}>{formatDate(invoice.dueDate)}</span>
            </div>
            {invoice.sentAt && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', padding: '8px 0', borderBottom: '1px solid #f1f3f5' }}>
                <span style={{ color: '#666', fontWeight: '500' }}>Sent On:</span>
                <span style={{ fontWeight: '600' }}>{formatDate(invoice.sentAt)}</span>
              </div>
            )}
          </div>
        </div>

        {invoice.description && (
          <div style={{ marginBottom: '28px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px', borderLeft: '4px solid #dc3545' }}>
            <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</h3>
            <p style={{ margin: 0, color: '#333', lineHeight: '1.6' }}>{invoice.description}</p>
          </div>
        )}

        <h3 style={{ fontSize: '16px', marginBottom: '20px', fontWeight: '700' }}>Items</h3>
        <div className="table-container" style={{ marginBottom: '28px' }}>
          <table className="crm-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Discount</th>
                <th>Tax</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: '600' }}>{item.productName}</td>
                  <td style={{ color: '#666' }}>{item.description || '-'}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.unitPrice)}</td>
                  <td>{item.discount}%</td>
                  <td>{item.tax}%</td>
                  <td style={{ fontWeight: '700', color: '#1e293b' }}>{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '28px', padding: '24px', backgroundColor: '#f8f9fa', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ minWidth: '350px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', padding: '8px 0' }}>
                <span style={{ fontWeight: '500' }}>Subtotal:</span>
                <span style={{ fontWeight: '600', fontSize: '15px' }}>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', padding: '8px 0', color: '#dc3545' }}>
                <span style={{ fontWeight: '500' }}>Discount:</span>
                <span style={{ fontWeight: '600', fontSize: '15px' }}>- {formatCurrency(invoice.totalDiscount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', padding: '8px 0' }}>
                <span style={{ fontWeight: '500' }}>Tax (GST):</span>
                <span style={{ fontWeight: '600', fontSize: '15px' }}>+ {formatCurrency(invoice.totalTax)}</span>
              </div>
              <div style={{ borderTop: '2px solid #dee2e6', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <span style={{ fontSize: '18px', fontWeight: '700' }}>Total:</span>
                <span style={{ fontSize: '22px', fontWeight: '700', color: '#dc3545' }}>{formatCurrency(invoice.totalAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', padding: '8px 0', color: '#198754' }}>
                <span style={{ fontWeight: '500' }}>Paid:</span>
                <span style={{ fontWeight: '600', fontSize: '15px' }}>- {formatCurrency(invoice.paidAmount || 0)}</span>
              </div>
              <div style={{ borderTop: '2px solid #dee2e6', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', backgroundColor: balanceDue > 0 ? '#fff5f5' : '#f0fdf4', padding: '16px', borderRadius: '8px', marginTop: '12px' }}>
                <span style={{ fontSize: '18px', fontWeight: '700' }}>Balance Due:</span>
                <span style={{ fontSize: '22px', fontWeight: '700', color: balanceDue > 0 ? '#dc3545' : '#198754' }}>
                  {formatCurrency(balanceDue)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {(invoice.terms || invoice.notes) && (
          <div style={{ marginTop: '28px', padding: '20px', backgroundColor: '#fff8e1', borderLeft: '4px solid #ffc107', borderRadius: '8px' }}>
            {invoice.terms && (
              <div style={{ marginBottom: invoice.notes ? '20px' : 0 }}>
                <h4 style={{ fontSize: '14px', marginBottom: '12px', fontWeight: '600', color: '#856404' }}>Terms & Conditions</h4>
                <p style={{ margin: 0, fontSize: '14px', whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#533f03' }}>{invoice.terms}</p>
              </div>
            )}
            {invoice.notes && (
              <div>
                <h4 style={{ fontSize: '14px', marginBottom: '12px', fontWeight: '600', color: '#856404' }}>Notes</h4>
                <p style={{ margin: 0, fontSize: '14px', whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#533f03' }}>{invoice.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="crm-card">
        <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '700' }}>Actions</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            className="btn-primary"
            onClick={handleDownloadPDF}
            disabled={actionLoading}
          >
            📥 Download PDF
          </button>
          {invoice.status !== 'sent' && (
            <button
              className="btn-primary"
              onClick={handleSendEmail}
              disabled={actionLoading}
            >
              📧 Send Email
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InvoiceDetail;
