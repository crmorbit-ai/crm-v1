import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import quotationService from '../services/quotationService';
import DashboardLayout from '../components/layout/DashboardLayout';
import '../styles/crm.css';

const Quotations = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchQuotations();
  }, [statusFilter]);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const response = await quotationService.getQuotations(params);
      setQuotations(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch quotations');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchQuotations();
  };

  const handleDelete = async (id, quotationNumber) => {
    if (window.confirm(`Are you sure you want to delete quotation ${quotationNumber}?`)) {
      try {
        await quotationService.deleteQuotation(id);
        fetchQuotations();
      } catch (err) {
        alert(err.message || 'Failed to delete quotation');
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { label: 'Draft', color: '#6c757d' },
      sent: { label: 'Sent', color: '#0d6efd' },
      viewed: { label: 'Viewed', color: '#0dcaf0' },
      accepted: { label: 'Accepted', color: '#198754' },
      rejected: { label: 'Rejected', color: '#dc3545' },
      expired: { label: 'Expired', color: '#fd7e14' }
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
      <DashboardLayout title="Quotations">
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Quotations">
      <div className="page-header">
        <div>
          <h1>💰 Quotations</h1>
          <p className="page-subtitle">Manage your price quotations</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/quotations/new')}>
          + New Quotation
        </button>
      </div>

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
              placeholder="Search quotations..."
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
              <option value="viewed">Viewed</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
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
                <th>Quotation #</th>
                <th>Customer</th>
                <th>Title</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                    No quotations found. Create your first quotation!
                  </td>
                </tr>
              ) : (
                quotations.map((quotation) => (
                  <tr key={quotation._id}>
                    <td>
                      <Link
                        to={`/quotations/${quotation._id}`}
                        style={{ color: '#4361ee', fontWeight: '600' }}
                      >
                        {quotation.quotationNumber}
                      </Link>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: '500' }}>{quotation.customerName}</div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>
                          {quotation.customerEmail}
                        </div>
                      </div>
                    </td>
                    <td>{quotation.title}</td>
                    <td style={{ fontWeight: '600' }}>{formatCurrency(quotation.totalAmount)}</td>
                    <td>{formatDate(quotation.quotationDate)}</td>
                    <td>{formatDate(quotation.expiryDate)}</td>
                    <td>{getStatusBadge(quotation.status)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn-icon"
                          onClick={() => navigate(`/quotations/${quotation._id}`)}
                          title="View"
                        >
                          👁️
                        </button>
                        {quotation.status === 'draft' && (
                          <>
                            <button
                              className="btn-icon"
                              onClick={() => navigate(`/quotations/${quotation._id}/edit`)}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              className="btn-icon"
                              onClick={() => handleDelete(quotation._id, quotation.quotationNumber)}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </>
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

export default Quotations;
