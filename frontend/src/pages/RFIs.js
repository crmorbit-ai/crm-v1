import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import rfiService from '../services/rfiService';
import DashboardLayout from '../components/layout/DashboardLayout';
import '../styles/crm.css';

const RFIs = () => {
  const navigate = useNavigate();
  const [rfis, setRfis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchRFIs();
  }, [statusFilter]);

  const fetchRFIs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const response = await rfiService.getRFIs(params);
      setRfis(response.data || []);
    } catch (err) {
      if (err?.isPermissionDenied) return;
      setError(err.message || 'Failed to fetch RFIs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRFIs();
  };

  const handleDelete = async (id, rfiNumber) => {
    if (window.confirm(`Are you sure you want to delete RFI ${rfiNumber}?`)) {
      try {
        await rfiService.deleteRFI(id);
        fetchRFIs();
      } catch (err) {
        if (err?.isPermissionDenied) return;
        alert(err.message || 'Failed to delete RFI');
      }
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

  if (loading) {
    return (
      <DashboardLayout title="RFIs">
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="RFIs">
      <div className="page-header">
        <div>
          <h1>📋 Request for Information (RFI)</h1>
          <p className="page-subtitle">Manage customer information requests</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/rfi/new')}>
          + New RFI
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
              placeholder="Search RFIs..."
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
              <option value="responded">Responded</option>
              <option value="converted">Converted</option>
              <option value="closed">Closed</option>
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
                <th>RFI #</th>
                <th>Customer</th>
                <th>Title</th>
                <th>Priority</th>
                <th>Created Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rfis.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                    No RFIs found. Create your first RFI!
                  </td>
                </tr>
              ) : (
                rfis.map((rfi) => (
                  <tr key={rfi._id}>
                    <td>
                      <Link
                        to={`/rfi/${rfi._id}`}
                        style={{ color: '#4361ee', fontWeight: '600' }}
                      >
                        {rfi.rfiNumber}
                      </Link>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: '500' }}>{rfi.customerName || '-'}</div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>
                          {rfi.customerEmail || '-'}
                        </div>
                      </div>
                    </td>
                    <td>{rfi.title}</td>
                    <td>{getPriorityBadge(rfi.priority)}</td>
                    <td>{formatDate(rfi.createdAt)}</td>
                    <td>{formatDate(rfi.dueDate)}</td>
                    <td>{getStatusBadge(rfi.status)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn-icon"
                          onClick={() => navigate(`/rfi/${rfi._id}`)}
                          title="View"
                        >
                          👁️
                        </button>
                        {rfi.status === 'draft' && (
                          <>
                            <button
                              className="btn-icon"
                              onClick={() => navigate(`/rfi/${rfi._id}/edit`)}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              className="btn-icon"
                              onClick={() => handleDelete(rfi._id, rfi.rfiNumber)}
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

export default RFIs;
