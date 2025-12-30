import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import purchaseOrderService from '../services/purchaseOrderService';
import DashboardLayout from '../components/layout/DashboardLayout';
import '../styles/crm.css';

const PurchaseOrders = () => {
  const navigate = useNavigate();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchPurchaseOrders();
  }, [statusFilter]);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const response = await purchaseOrderService.getPurchaseOrders(params);
      setPurchaseOrders(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPurchaseOrders();
  };

  const handleDelete = async (id, poNumber) => {
    if (window.confirm(`Are you sure you want to delete PO ${poNumber}?`)) {
      try {
        await purchaseOrderService.deletePurchaseOrder(id);
        fetchPurchaseOrders();
      } catch (err) {
        alert(err.message || 'Failed to delete purchase order');
      }
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
      <DashboardLayout title="Purchase Orders">
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Purchase Orders">
      <div className="page-header">
        <div>
          <h1>📦 Purchase Orders</h1>
          <p className="page-subtitle">Manage customer purchase orders</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/purchase-orders/new')}>
          + New Purchase Order
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
              placeholder="Search purchase orders..."
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
              <option value="received">Received</option>
              <option value="approved">Approved</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
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
                <th>PO #</th>
                <th>Customer PO #</th>
                <th>Customer</th>
                <th>Title</th>
                <th>Amount</th>
                <th>PO Date</th>
                <th>Delivery Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>
                    No purchase orders found. Create your first PO!
                  </td>
                </tr>
              ) : (
                purchaseOrders.map((po) => (
                  <tr key={po._id}>
                    <td>
                      <Link
                        to={`/purchase-orders/${po._id}`}
                        style={{ color: '#4361ee', fontWeight: '600' }}
                      >
                        {po.poNumber}
                      </Link>
                    </td>
                    <td style={{ fontWeight: '600' }}>{po.customerPONumber}</td>
                    <td>
                      <div>
                        <div style={{ fontWeight: '500' }}>{po.customerName || '-'}</div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>
                          {po.customerEmail || '-'}
                        </div>
                      </div>
                    </td>
                    <td>{po.title}</td>
                    <td style={{ fontWeight: '600' }}>{formatCurrency(po.totalAmount)}</td>
                    <td>{formatDate(po.poDate)}</td>
                    <td>{formatDate(po.deliveryDate)}</td>
                    <td>{getStatusBadge(po.status)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn-icon"
                          onClick={() => navigate(`/purchase-orders/${po._id}`)}
                          title="View"
                        >
                          👁️
                        </button>
                        {po.status === 'draft' && (
                          <>
                            <button
                              className="btn-icon"
                              onClick={() => navigate(`/purchase-orders/${po._id}/edit`)}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              className="btn-icon"
                              onClick={() => handleDelete(po._id, po.poNumber)}
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

export default PurchaseOrders;
