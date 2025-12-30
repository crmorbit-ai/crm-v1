import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import purchaseOrderService from '../services/purchaseOrderService';
import DashboardLayout from '../components/layout/DashboardLayout';
import '../styles/crm.css';

const PurchaseOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPurchaseOrder();
  }, [id]);

  const fetchPurchaseOrder = async () => {
    try {
      setLoading(true);
      const response = await purchaseOrderService.getPurchaseOrder(id);
      setPo(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch purchase order');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (window.confirm('Approve this purchase order?')) {
      try {
        await purchaseOrderService.approvePurchaseOrder(id);
        alert('Purchase order approved successfully!');
        fetchPurchaseOrder();
      } catch (err) {
        alert(err.message || 'Failed to approve purchase order');
      }
    }
  };

  const handleConvertToInvoice = async () => {
    if (window.confirm('Convert this purchase order to an invoice?')) {
      try {
        const response = await purchaseOrderService.convertToInvoice(id);
        if (response.success && response.data && response.data._id) {
          alert('Purchase order converted to invoice successfully!');
          navigate(`/invoices/${response.data._id}`);
        }
      } catch (err) {
        alert(err.message || 'Failed to convert purchase order to invoice');
      }
    }
  };

  const handleDownloadDocument = async () => {
    try {
      const response = await purchaseOrderService.downloadDocument(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', po.poDocument?.filename || 'PO-document.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || 'Failed to download document');
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      await purchaseOrderService.updateStatus(id, newStatus);
      fetchPurchaseOrder();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { label: 'Draft', color: '#6c757d' },
      received: { label: 'Received', color: '#0d6efd' },
      approved: { label: 'Approved', color: '#198754' },
      in_progress: { label: 'In Progress', color: '#0dcaf0' },
      completed: { label: 'Completed', color: '#198754' },
      cancelled: { label: 'Cancelled', color: '#dc3545' }
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

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <DashboardLayout title="Purchase Order Details">
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      </DashboardLayout>
    );
  }

  if (error || !po) {
    return (
      <DashboardLayout title="Purchase Order Details">
        <div className="error-message" style={{ marginBottom: '20px' }}>
          {error || 'Purchase order not found'}
        </div>
        <button className="btn-secondary" onClick={() => navigate('/purchase-orders')}>
          Back to Purchase Orders
        </button>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`PO ${po.poNumber}`}>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1>📦 PO {po.poNumber}</h1>
            {getStatusBadge(po.status)}
          </div>
          <p className="page-subtitle">{po.title}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={() => navigate('/purchase-orders')}>
            Back to List
          </button>
          {po.status === 'draft' && (
            <button className="btn-secondary" onClick={() => navigate(`/purchase-orders/${id}/edit`)}>
              Edit
            </button>
          )}
          {po.status === 'received' && !po.approvedBy && (
            <button className="btn-primary" onClick={handleApprove}>
              Approve PO
            </button>
          )}
          {po.status === 'approved' && !po.convertedToInvoice && (
            <button className="btn-primary" onClick={handleConvertToInvoice}>
              Convert to Invoice
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gap: '24px' }}>
        <div className="crm-card">
          <h2 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: '700' }}>
            PO Information
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Internal PO Number
              </div>
              <div style={{ fontWeight: '700', fontSize: '16px' }}>{po.poNumber}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Customer PO Number
              </div>
              <div style={{ fontWeight: '700', fontSize: '16px', color: '#4361ee' }}>{po.customerPONumber}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                PO Date
              </div>
              <div style={{ fontWeight: '600', fontSize: '15px' }}>{formatDate(po.poDate)}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Delivery Date
              </div>
              <div style={{ fontWeight: '600', fontSize: '15px' }}>{formatDate(po.deliveryDate)}</div>
            </div>
          </div>
        </div>

        <div className="crm-card">
          <h2 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: '700' }}>
            Customer Information
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Customer Name
              </div>
              <div style={{ fontWeight: '600', fontSize: '15px' }}>{po.customerName || '-'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Email
              </div>
              <div style={{ fontWeight: '600', fontSize: '15px' }}>{po.customerEmail || '-'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Phone
              </div>
              <div style={{ fontWeight: '600', fontSize: '15px' }}>{po.customerPhone || '-'}</div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Address
              </div>
              <div style={{ fontWeight: '500', fontSize: '15px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px', lineHeight: '1.6' }}>{po.customerAddress || '-'}</div>
            </div>
          </div>
        </div>

        {po.items && po.items.length > 0 && (
          <div className="crm-card">
            <h2 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: '700' }}>
              Items
            </h2>
            <div className="table-container">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Product</th>
                    <th style={{ textAlign: 'right' }}>Quantity</th>
                    <th style={{ textAlign: 'right' }}>Unit Price</th>
                    <th style={{ textAlign: 'right' }}>Discount %</th>
                    <th style={{ textAlign: 'right' }}>Tax %</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {po.items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>{item.productName}</div>
                        {item.description && (
                          <div style={{ fontSize: '13px', color: '#6c757d', lineHeight: '1.4' }}>
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '500' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right', fontWeight: '500' }}>{formatCurrency(item.unitPrice)}</td>
                      <td style={{ textAlign: 'right', fontWeight: '500' }}>{item.discount}%</td>
                      <td style={{ textAlign: 'right', fontWeight: '500' }}>{item.tax}%</td>
                      <td style={{ textAlign: 'right', fontWeight: '700', fontSize: '15px', color: '#1e293b' }}>
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <td colSpan="5" style={{ textAlign: 'right', fontWeight: '600', padding: '12px' }}>
                      Subtotal:
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '700', fontSize: '15px', padding: '12px' }}>
                      {formatCurrency(po.subtotal)}
                    </td>
                  </tr>
                  {po.totalDiscount > 0 && (
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <td colSpan="5" style={{ textAlign: 'right', fontWeight: '600', color: '#dc3545', padding: '12px' }}>
                        Total Discount:
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '700', fontSize: '15px', color: '#dc3545', padding: '12px' }}>
                        -{formatCurrency(po.totalDiscount)}
                      </td>
                    </tr>
                  )}
                  {po.totalTax > 0 && (
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <td colSpan="5" style={{ textAlign: 'right', fontWeight: '600', padding: '12px' }}>
                        Total Tax (GST):
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '700', fontSize: '15px', padding: '12px' }}>
                        {formatCurrency(po.totalTax)}
                      </td>
                    </tr>
                  )}
                  <tr style={{ borderTop: '2px solid #4361ee', backgroundColor: '#e8f4fd' }}>
                    <td colSpan="5" style={{ textAlign: 'right', fontWeight: '700', fontSize: '17px', padding: '16px' }}>
                      Total Amount:
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '700', fontSize: '18px', color: '#4361ee', padding: '16px' }}>
                      {formatCurrency(po.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {po.poDocument && (
          <div className="crm-card">
            <h2 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: '700' }}>
              PO Document
            </h2>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <span style={{ fontSize: '28px' }}>📎</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>{po.poDocument.filename}</div>
                <div style={{ fontSize: '13px', color: '#6c757d' }}>
                  Uploaded: {formatDate(po.poDocument.uploadedAt)}
                </div>
              </div>
              <button className="btn-secondary" onClick={handleDownloadDocument} style={{ padding: '10px 20px' }}>
                📥 Download
              </button>
            </div>
          </div>
        )}

        {(po.terms || po.notes || po.paymentTerms) && (
          <div className="crm-card">
            <h2 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: '700' }}>
              Terms & Notes
            </h2>
            {po.paymentTerms && (
              <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#fff8e1', borderRadius: '8px', borderLeft: '4px solid #ffc107' }}>
                <div style={{ fontSize: '13px', color: '#856404', marginBottom: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Payment Terms
                </div>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#533f03' }}>{po.paymentTerms}</div>
              </div>
            )}
            {po.terms && (
              <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#e8f4fd', borderRadius: '8px', borderLeft: '4px solid #4361ee' }}>
                <div style={{ fontSize: '13px', color: '#1e40af', marginBottom: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Terms & Conditions
                </div>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#1e3a8a' }}>{po.terms}</div>
              </div>
            )}
            {po.notes && (
              <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px', borderLeft: '4px solid #6c757d' }}>
                <div style={{ fontSize: '13px', color: '#495057', marginBottom: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Notes
                </div>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#212529' }}>{po.notes}</div>
              </div>
            )}
          </div>
        )}

        {po.approvedBy && (
          <div className="crm-card" style={{ backgroundColor: '#d1e7dd', border: '2px solid #198754' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '700', color: '#198754' }}>
              ✅ Approval Information
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#0f5132', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Approved By
                </div>
                <div style={{ fontWeight: '600', fontSize: '15px', color: '#0f5132' }}>
                  {po.approvedBy.firstName} {po.approvedBy.lastName}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#0f5132', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Approved At
                </div>
                <div style={{ fontWeight: '600', fontSize: '15px', color: '#0f5132' }}>
                  {formatDate(po.approvedAt)}
                </div>
              </div>
            </div>
          </div>
        )}

        {po.convertedToInvoice && po.invoice && (
          <div className="crm-card" style={{ backgroundColor: '#d1e7dd', border: '2px solid #198754' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '700', color: '#198754' }}>
              ✅ Converted to Invoice
            </h2>
            <div style={{ marginBottom: '20px', color: '#0f5132', lineHeight: '1.6' }}>
              This purchase order has been converted to an invoice.
            </div>
            <button
              className="btn-primary"
              onClick={() => navigate(`/invoices/${po.invoice._id || po.invoice}`)}
            >
              View Invoice
            </button>
          </div>
        )}

        {po.quotation && (
          <div className="crm-card" style={{ backgroundColor: '#e8f4fd', border: '2px solid #4361ee' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '700', color: '#1e40af' }}>
              📄 Related Quotation
            </h2>
            <button
              className="btn-secondary"
              onClick={() => navigate(`/quotations/${po.quotation._id || po.quotation}`)}
            >
              View Quotation
            </button>
          </div>
        )}

        <div className="crm-card">
          <h2 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: '700' }}>
            Actions
          </h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {po.status === 'draft' && (
              <button className="btn-secondary" onClick={() => handleUpdateStatus('received')}>
                Mark as Received
              </button>
            )}
            {po.status === 'approved' && (
              <button className="btn-secondary" onClick={() => handleUpdateStatus('in_progress')}>
                Start Processing
              </button>
            )}
            {po.status === 'in_progress' && !po.convertedToInvoice && (
              <button className="btn-secondary" onClick={() => handleUpdateStatus('completed')}>
                Mark as Completed
              </button>
            )}
            {(po.status === 'draft' || po.status === 'received') && (
              <button
                className="btn-secondary"
                onClick={() => handleUpdateStatus('cancelled')}
                style={{ backgroundColor: '#dc3545', color: 'white', border: 'none' }}
              >
                Cancel PO
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PurchaseOrderDetail;
