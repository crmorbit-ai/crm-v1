import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/layout/DashboardLayout';
import { API_URL } from '../config/api.config';
import '../styles/crm.css';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({
    resourceType: '',
    startDate: '',
    endDate: ''
  });

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    loadLogs();
  }, [pagination.page, filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.resourceType && { resourceType: filters.resourceType }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      });

      const res = await axios.get(`${API_URL}/viewing-pin/audit-logs?${params}`, {
        headers: getAuthHeader()
      });

      if (res.data?.success) {
        setLogs(res.data.data.logs || []);
        setPagination(prev => ({ ...prev, ...res.data.data.pagination }));
      }
    } catch (err) {
      console.error('Load audit logs error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getResourceIcon = (type) => {
    const icons = {
      lead: '🎯',
      contact: '👤',
      deal: '💼',
      task: '✅',
      document: '📄',
      other: '📋'
    };
    return icons[type] || '📋';
  };

  const getActionBadge = (action) => {
    const styles = {
      viewed: { bg: '#dbeafe', color: '#1d4ed8' },
      edited: { bg: '#fef3c7', color: '#92400e' },
      deleted: { bg: '#fee2e2', color: '#dc2626' },
      exported: { bg: '#d1fae5', color: '#059669' }
    };
    const style = styles[action] || styles.viewed;
    return (
      <span style={{
        padding: '3px 8px',
        borderRadius: '4px',
        fontSize: '10px',
        fontWeight: '600',
        textTransform: 'uppercase',
        background: style.bg,
        color: style.color
      }}>
        {action}
      </span>
    );
  };

  return (
    <DashboardLayout title="Access Audit Logs">
      <div className="crm-card">
        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '12px',
          padding: '16px',
          borderBottom: '1px solid #e2e8f0',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <select
            value={filters.resourceType}
            onChange={(e) => setFilters(prev => ({ ...prev, resourceType: e.target.value }))}
            style={inputStyle}
          >
            <option value="">All Types</option>
            <option value="lead">Leads</option>
            <option value="contact">Contacts</option>
            <option value="deal">Deals</option>
            <option value="task">Tasks</option>
          </select>

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            style={inputStyle}
            placeholder="Start Date"
          />

          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
            style={inputStyle}
            placeholder="End Date"
          />

          <button
            onClick={() => setFilters({ resourceType: '', startDate: '', endDate: '' })}
            style={{
              padding: '8px 16px',
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Clear Filters
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={thStyle}>User</th>
                <th style={thStyle}>Resource</th>
                <th style={thStyle}>Action</th>
                <th style={thStyle}>Access Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    Loading...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {log.user?.firstName?.[0]}{log.user?.lastName?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '13px' }}>
                            {log.user?.firstName} {log.user?.lastName}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {log.user?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>{getResourceIcon(log.resourceType)}</span>
                        <div>
                          <div style={{ fontWeight: '500', fontSize: '12px', textTransform: 'capitalize' }}>
                            {log.resourceType}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {log.resourceName || log.resourceId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      {getActionBadge(log.action)}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: '12px', color: '#475569' }}>
                        {formatDate(log.accessedAt)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            padding: '16px',
            borderTop: '1px solid #e2e8f0'
          }}>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              style={paginationBtnStyle}
            >
              Previous
            </button>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              style={paginationBtnStyle}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

const inputStyle = {
  padding: '8px 12px',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  fontSize: '12px',
  outline: 'none',
  minWidth: '120px'
};

const thStyle = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: '600',
  color: '#64748b',
  textTransform: 'uppercase'
};

const tdStyle = {
  padding: '12px 16px'
};

const paginationBtnStyle = {
  padding: '8px 16px',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  background: '#fff',
  fontSize: '12px',
  cursor: 'pointer'
};

export default AuditLogs;
