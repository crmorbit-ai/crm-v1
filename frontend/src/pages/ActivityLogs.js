import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { activityLogService } from '../services/activityLogService';
import { useAuth } from '../context/AuthContext';
import '../styles/crm.css';

const ActivityLogs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({
    user: '',
    action: '',
    resourceType: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  useEffect(() => {
    loadActivityLogs();
    loadStats();
  }, [pagination.page, filters]);

  const loadActivityLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await activityLogService.getActivityLogs({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });
      
      if (response.success && response.data) {
        setLogs(response.data.logs || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          pages: response.data.pagination?.pages || 0
        }));
      }
    } catch (err) {
      console.error('Load activity logs error:', err);
      setError(err.response?.data?.message || 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await activityLogService.getActivityStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Load stats error:', err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      setError('');
      await activityLogService.exportActivityLogs(filters);
      setSuccess('Activity logs exported successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export activity logs');
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      user: '',
      action: '',
      resourceType: '',
      startDate: '',
      endDate: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getActionBadgeClass = (action) => {
    if (action.includes('created')) return 'status-badge qualified';
    if (action.includes('updated')) return 'status-badge contacted';
    if (action.includes('deleted')) return 'status-badge lost';
    if (action.includes('login')) return 'status-badge new';
    return 'status-badge';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout
      title="🔍 Audit Logs"
      actionButton={
        <button
          className="crm-btn crm-btn-primary"
          onClick={handleExport}
          disabled={exporting}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          {exporting ? '⏳ Exporting...' : '📥 Export to Excel'}
        </button>
      }
    >
      {success && (
        <div style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
          color: '#064e3b',
          borderRadius: '12px',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(132, 250, 176, 0.3)',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '20px' }}>✅</span>
          {success}
        </div>
      )}
      {error && (
        <div style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
          color: '#fff',
          borderRadius: '12px',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '20px' }}>❌</span>
          {error}
        </div>
      )}

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div style={{
            padding: '24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            boxShadow: '0 8px 20px rgba(102, 126, 234, 0.25)',
            color: '#fff',
            transition: 'transform 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>📊 Total Activities</div>
            <div style={{ fontSize: '36px', fontWeight: '800', lineHeight: '1' }}>{stats.total?.toLocaleString()}</div>
          </div>
          <div style={{
            padding: '24px',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            borderRadius: '16px',
            boxShadow: '0 8px 20px rgba(245, 87, 108, 0.25)',
            color: '#fff',
            transition: 'transform 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>🔥 Today</div>
            <div style={{ fontSize: '36px', fontWeight: '800', lineHeight: '1' }}>{stats.todayCount?.toLocaleString()}</div>
          </div>
          <div style={{
            padding: '24px',
            background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            borderRadius: '16px',
            boxShadow: '0 8px 20px rgba(252, 182, 159, 0.25)',
            color: '#92400e',
            transition: 'transform 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>📅 This Week</div>
            <div style={{ fontSize: '36px', fontWeight: '800', lineHeight: '1' }}>{stats.weekCount?.toLocaleString()}</div>
          </div>
          <div style={{
            padding: '24px',
            background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            borderRadius: '16px',
            boxShadow: '0 8px 20px rgba(168, 237, 234, 0.25)',
            color: '#065f46',
            transition: 'transform 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>📈 This Month</div>
            <div style={{ fontSize: '36px', fontWeight: '800', lineHeight: '1' }}>{stats.monthCount?.toLocaleString()}</div>
          </div>
        </div>
      )}

      <div style={{
        marginBottom: '24px',
        padding: '24px',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🔎</span>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937', margin: 0 }}>Filters</h3>
        </div>
        <div style={{ padding: '0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <input
              type="date"
              name="startDate"
              placeholder="Start Date"
              className="crm-form-input"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
            <input
              type="date"
              name="endDate"
              placeholder="End Date"
              className="crm-form-input"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
            <select
              name="action"
              className="crm-form-select"
              value={filters.action}
              onChange={handleFilterChange}
            >
              <option value="">All Actions</option>
              <option value="user.updated">User Updated</option>
              <option value="permission.granted">Permission Changed</option>
              <option value="lead.created">Lead Created</option>
              <option value="lead.updated">Lead Updated</option>
              <option value="lead.deleted">Lead Deleted</option>
              <option value="contact.created">Contact Created</option>
              <option value="contact.updated">Contact Updated</option>
              <option value="account.created">Account Created</option>
              <option value="account.updated">Account Updated</option>
              <option value="login.success">Login Success</option>
              <option value="logout">Logout</option>
            </select>
            <select
              name="resourceType"
              className="crm-form-select"
              value={filters.resourceType}
              onChange={handleFilterChange}
            >
              <option value="">All Resources</option>
              <option value="Lead">Lead</option>
              <option value="Contact">Contact</option>
              <option value="Account">Account</option>
              <option value="Opportunity">Opportunity</option>
              <option value="Task">Task</option>
              <option value="Meeting">Meeting</option>
              <option value="User">User</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="crm-btn crm-btn-secondary"
              onClick={clearFilters}
              style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: '#fff',
                border: 'none',
                boxShadow: '0 4px 12px rgba(245, 87, 108, 0.3)',
                transition: 'all 0.3s ease',
                fontWeight: '600'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              🔄 Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(0, 0, 0, 0.05)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>📋</span>
            <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Activity Logs</h2>
          </div>
          <div style={{
            padding: '8px 16px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '700',
            backdropFilter: 'blur(10px)'
          }}>
            {pagination.total} Records
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '10px' }}>Loading activity logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            No activity logs found
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Date/Time</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>IP Address</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {formatDate(log.createdAt)}
                      </td>
                      <td>
                        <div style={{ fontWeight: '500' }}>
                          {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                        </div>
                        {log.user && (
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {log.user.email}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={getActionBadgeClass(log.action)}>
                          {log.action}
                        </span>
                      </td>
                      <td>
                    {log.resourceType ? (
                <div style={{ fontWeight: '500', color: '#374151' }}>
                         {log.resourceType}
                           </div>
                         ) : '-'}
                           </td>
                      <td style={{ fontSize: '13px', fontFamily: 'monospace', color: '#666' }}>
                        {log.ipAddress || '-'}
                      </td>
                      <td style={{ maxWidth: '450px', minWidth: '350px', padding: '12px' }}>
                        {log.details ? (
                          <div style={{
                            fontSize: '11px',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word'
                          }}>
                            {/* Show target user and changed by */}
                            {log.details.targetUser && (
                              <div style={{
                                marginBottom: '8px',
                                padding: '10px 12px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                borderRadius: '8px',
                                wordBreak: 'break-word',
                                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.15)',
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                              }}>
                                <div style={{
                                  color: '#fff',
                                  fontSize: '9px',
                                  fontWeight: '600',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  marginBottom: '4px',
                                  opacity: 0.9
                                }}>
                                  👤 Target User
                                </div>
                                <div style={{
                                  color: '#fff',
                                  fontWeight: '600',
                                  fontSize: '11px',
                                  lineHeight: '1.4'
                                }}>
                                  {log.details.targetUser}
                                </div>
                              </div>
                            )}

                            {log.details.changedBy && (
                              <div style={{
                                marginBottom: '8px',
                                padding: '10px 12px',
                                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                borderRadius: '8px',
                                wordBreak: 'break-word',
                                boxShadow: '0 2px 8px rgba(245, 87, 108, 0.15)',
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                              }}>
                                <div style={{
                                  color: '#fff',
                                  fontSize: '9px',
                                  fontWeight: '600',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  marginBottom: '4px',
                                  opacity: 0.9
                                }}>
                                  ✏️ Changed By
                                </div>
                                <div style={{
                                  color: '#fff',
                                  fontWeight: '600',
                                  fontSize: '11px',
                                  lineHeight: '1.4'
                                }}>
                                  {log.details.changedBy}
                                </div>
                              </div>
                            )}

                            {/* Show field changes */}
                            {log.details.changes && Object.keys(log.details.changes).length > 0 && (
                              <div style={{ marginTop: '10px' }}>
                                {Object.entries(log.details.changes).slice(0, 3).map(([field, values]) => (
                                  <div key={field} style={{
                                    marginBottom: '8px',
                                    padding: '10px 12px',
                                    background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                                    borderRadius: '8px',
                                    wordBreak: 'break-word',
                                    boxShadow: '0 2px 6px rgba(252, 182, 159, 0.2)',
                                    border: '1px solid rgba(255, 255, 255, 0.5)'
                                  }}>
                                    <div style={{
                                      color: '#92400e',
                                      fontSize: '10px',
                                      fontWeight: '700',
                                      textTransform: 'capitalize',
                                      marginBottom: '6px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}>
                                      <span style={{
                                        width: '4px',
                                        height: '4px',
                                        borderRadius: '50%',
                                        background: '#92400e'
                                      }}></span>
                                      {field}
                                    </div>
                                    <div style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '6px'
                                    }}>
                                      <div style={{
                                        padding: '6px 8px',
                                        background: 'rgba(255, 255, 255, 0.7)',
                                        borderRadius: '4px',
                                        backdropFilter: 'blur(10px)'
                                      }}>
                                        <div style={{
                                          fontSize: '8px',
                                          color: '#78716c',
                                          fontWeight: '600',
                                          marginBottom: '2px',
                                          textTransform: 'uppercase',
                                          letterSpacing: '0.3px'
                                        }}>
                                          Before
                                        </div>
                                        <div style={{
                                          color: '#dc2626',
                                          fontSize: '10px',
                                          fontWeight: '500',
                                          wordBreak: 'break-all',
                                          textDecoration: 'line-through',
                                          opacity: 0.8
                                        }}>
                                          {String(values.old || 'None')}
                                        </div>
                                      </div>
                                      <div style={{
                                        padding: '6px 8px',
                                        background: 'rgba(255, 255, 255, 0.9)',
                                        borderRadius: '4px',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(5, 150, 105, 0.2)'
                                      }}>
                                        <div style={{
                                          fontSize: '8px',
                                          color: '#78716c',
                                          fontWeight: '600',
                                          marginBottom: '2px',
                                          textTransform: 'uppercase',
                                          letterSpacing: '0.3px'
                                        }}>
                                          After
                                        </div>
                                        <div style={{
                                          color: '#059669',
                                          fontSize: '10px',
                                          fontWeight: '700',
                                          wordBreak: 'break-all'
                                        }}>
                                          {String(values.new || 'None')}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {Object.keys(log.details.changes).length > 3 && (
                                  <div style={{
                                    fontSize: '10px',
                                    color: '#6b7280',
                                    fontWeight: '600',
                                    marginTop: '8px',
                                    padding: '8px 12px',
                                    background: 'linear-gradient(135deg, #e0e7ff 0%, #cffafe 100%)',
                                    borderRadius: '6px',
                                    textAlign: 'center',
                                    border: '1px dashed #93c5fd'
                                  }}>
                                    📊 +{Object.keys(log.details.changes).length - 3} more changes
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Fallback for other details */}
                            {!log.details.changes && !log.details.targetUser && log.details.recordName && (
                              <div style={{
                                fontSize: '12px',
                                color: '#666',
                                wordBreak: 'break-word',
                                padding: '10px',
                                background: '#f9fafb',
                                borderRadius: '6px',
                                border: '1px solid #e5e7eb'
                              }}>
                                {log.details.recordName}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{
                            color: '#9ca3af',
                            fontSize: '12px',
                            fontStyle: 'italic'
                          }}>
                            No details
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="pagination">
                <button
                  className="crm-btn crm-btn-outline"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  ← Previous
                </button>
                <span className="pagination-info">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  className="crm-btn crm-btn-outline"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ActivityLogs;