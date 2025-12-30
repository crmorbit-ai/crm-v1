import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import invoiceService from '../services/invoiceService';
import DashboardLayout from '../components/layout/DashboardLayout';
import '../styles/crm.css';

const Invoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchInvoices();
    fetchStats();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const response = await invoiceService.getInvoices(params);
      setInvoices(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await invoiceService.getStats();
      setStats(response.data?.overall || null);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchInvoices();
  };

  const handleDelete = async (id, invoiceNumber) => {
    if (window.confirm(`Are you sure you want to delete invoice ${invoiceNumber}?`)) {
      try {
        await invoiceService.deleteInvoice(id);
        fetchInvoices();
        fetchStats();
      } catch (err) {
        alert(err.message || 'Failed to delete invoice');
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { label: 'Draft', color: '#6c757d' },
      sent: { label: 'Sent', color: '#0d6efd' },
      partially_paid: { label: 'Partial', color: '#ffc107' },
      paid: { label: 'Paid', color: '#198754' },
      overdue: { label: 'Overdue', color: '#dc3545' },
      cancelled: { label: 'Cancelled', color: '#6c757d' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
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
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <DashboardLayout title="Invoices">
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Invoices">
      <div className="page-header">
        <div>
          <h1>🧾 Invoices</h1>
          <p className="page-subtitle">Manage your invoices and payments</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/invoices/new')}>
          + New Invoice
        </button>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="crm-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '8px' }}>Total Invoices</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#4361ee' }}>{stats.totalInvoices || 0}</div>
          </div>
          <div className="crm-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '8px' }}>Total Amount</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#4361ee' }}>{formatCurrency(stats.totalAmount)}</div>
          </div>
          <div className="crm-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '8px' }}>Total Paid</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#198754' }}>{formatCurrency(stats.totalPaid)}</div>
          </div>
          <div className="crm-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '8px' }}>Balance Due</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#dc3545' }}>{formatCurrency(stats.totalDue)}</div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div className="crm-card">
        <div className="filter-section">
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              style={{ flex: '1', minWidth: '250px' }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button type="submit" className="btn-secondary">
              Search
            </button>
          </form>
        </div>

        <div className="table-container">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Title</th>
                <th>Amount</th>
                <th>Paid</th>
                <th>Due</th>
                <th>Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '40px' }}>
                    No invoices found. Create your first invoice!
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice._id}>
                    <td>
                      <Link
                        to={`/invoices/${invoice._id}`}
                        style={{ color: '#4361ee', fontWeight: '600' }}
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: '500' }}>{invoice.customerName}</div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>
                          {invoice.customerEmail}
                        </div>
                      </div>
                    </td>
                    <td>{invoice.title}</td>
                    <td style={{ fontWeight: '600' }}>{formatCurrency(invoice.totalAmount)}</td>
                    <td style={{ color: '#198754' }}>{formatCurrency(invoice.totalPaid)}</td>
                    <td style={{ color: '#dc3545' }}>{formatCurrency(invoice.balanceDue)}</td>
                    <td>{formatDate(invoice.invoiceDate)}</td>
                    <td>{formatDate(invoice.dueDate)}</td>
                    <td>{getStatusBadge(invoice.status)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn-icon"
                          onClick={() => navigate(`/invoices/${invoice._id}`)}
                          title="View"
                        >
                          👁️
                        </button>
                        {invoice.status !== 'paid' && (
                          <button
                            className="btn-icon"
                            onClick={() => navigate(`/invoices/${invoice._id}/edit`)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                        )}
                        {invoice.status === 'draft' && invoice.payments.length === 0 && (
                          <button
                            className="btn-icon"
                            onClick={() => handleDelete(invoice._id, invoice.invoiceNumber)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Invoices;
