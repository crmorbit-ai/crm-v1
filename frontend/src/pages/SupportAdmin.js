import React, { useState, useEffect, useCallback } from 'react';
import supportService from '../services/supportService';
import '../styles/modal.css';

const SupportAdmin = () => {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    search: ''
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load tickets and stats
  useEffect(() => {
    loadTickets();
    loadStats();
  }, [filters, pagination.page, loadTickets, loadStats]);

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      };
      const response = await supportService.getAllTickets(params);
      setTickets(response.data?.tickets || []);
      setPagination(response.data?.pagination || pagination);
    } catch (error) {
      console.error('Error loading tickets:', error);
      alert('Error loading tickets');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  const loadStats = useCallback(async () => {
    try {
      const response = await supportService.getStats();
      setStats(response.data || {});
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  const loadTicketDetails = async (ticketId) => {
    try {
      const response = await supportService.getTicket(ticketId);
      setSelectedTicket(response.data || response);
    } catch (error) {
      console.error('Error loading ticket details:', error);
      alert('Error loading ticket details');
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedTicket) return;

    try {
      await supportService.updateStatus(selectedTicket._id, status);
      alert('Status updated successfully!');
      loadTicketDetails(selectedTicket._id);
      loadTickets();
      loadStats();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const handleAssignToMe = async () => {
    if (!selectedTicket) return;

    try {
      await supportService.assignTicket(selectedTicket._id);
      alert('Ticket assigned to you!');
      loadTicketDetails(selectedTicket._id);
      loadTickets();
    } catch (error) {
      console.error('Error assigning ticket:', error);
      alert('Error assigning ticket');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket) return;

    try {
      await supportService.addMessage(selectedTicket._id, newMessage, isInternalNote);
      setNewMessage('');
      setIsInternalNote(false);
      loadTicketDetails(selectedTicket._id);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message');
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to close this ticket?')) return;

    try {
      await supportService.deleteTicket(ticketId);
      alert('Ticket closed successfully!');
      setSelectedTicket(null);
      loadTickets();
      loadStats();
    } catch (error) {
      console.error('Error closing ticket:', error);
      alert('Error closing ticket');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Open': '#ef4444',
      'In Progress': '#f59e0b',
      'Waiting for Customer': '#3b82f6',
      'Resolved': '#10b981',
      'Closed': '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': '#10b981',
      'Medium': '#f59e0b',
      'High': '#ef4444',
      'Critical': '#dc2626'
    };
    return colors[priority] || '#6b7280';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    const icons = {
      'Open': '🔴',
      'In Progress': '🟡',
      'Waiting for Customer': '🔵',
      'Resolved': '🟢',
      'Closed': '⚫'
    };
    return icons[status] || '⚪';
  };

  const getPriorityIcon = (priority) => {
    const icons = {
      'Low': '🟢',
      'Medium': '🟡',
      'High': '🟠',
      'Critical': '🔴'
    };
    return icons[priority] || '⚪';
  };

  return (
    <div style={{
      padding: isMobile ? '16px' : '24px',
      maxWidth: '1400px',
      margin: '0 auto',
      animation: 'fadeIn 0.5s ease-in'
    }}>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
          }

          .stat-card-animated {
            animation: slideUp 0.5s ease-out forwards;
          }

          .skeleton {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 1000px 100%;
            animation: shimmer 2s infinite;
            border-radius: 8px;
          }
        `}
      </style>

      {/* Header with Gradient */}
      <div style={{
        marginBottom: '32px',
        animation: 'fadeIn 0.6s ease-in'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: isMobile ? '24px 20px' : '40px 32px',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(102, 126, 234, 0.3)',
          marginBottom: '24px'
        }}>
          <h1 style={{
            fontSize: isMobile ? '24px' : '32px',
            fontWeight: '800',
            color: 'white',
            marginBottom: '8px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
          }}>
            Support Ticket Dashboard
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: '500'
          }}>
            Manage all support tickets from tenants
          </p>
        </div>
      </div>

      {/* Statistics Cards with Glassmorphism */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: isMobile ? '16px' : '20px',
        marginBottom: '32px'
      }}>
        {[
          { label: 'Open Tickets', value: stats.byStatus?.Open || 0, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', icon: '🔴', delay: '0.1s' },
          { label: 'In Progress', value: stats.byStatus?.['In Progress'] || 0, gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', icon: '⚡', delay: '0.2s' },
          { label: 'Resolved', value: stats.byStatus?.Resolved || 0, gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', icon: '✅', delay: '0.3s' },
          { label: 'Total Tickets', value: stats.overall?.total || 0, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', icon: '📊', delay: '0.4s' }
        ].map((stat, index) => (
          <div key={index} style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            padding: isMobile ? '20px' : '28px',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.3)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            animation: `slideUp 0.5s ease-out ${stat.delay} forwards`,
            opacity: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <h3 style={{
                fontSize: '13px',
                color: '#64748b',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                margin: 0
              }}>
                {stat.label}
              </h3>
              <span style={{ fontSize: '28px' }}>{stat.icon}</span>
            </div>
            <p style={{
              fontSize: isMobile ? '36px' : '42px',
              fontWeight: '800',
              background: stat.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: 0,
              lineHeight: 1
            }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters Section */}
      <div style={{
        background: 'white',
        padding: isMobile ? '16px' : '24px',
        borderRadius: '20px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        marginBottom: '24px',
        border: '1px solid #f0f0f0'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '2px solid #e5e7eb',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            >
              <option value="">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Waiting for Customer">Waiting for Customer</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '2px solid #e5e7eb',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '2px solid #e5e7eb',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            >
              <option value="">All Categories</option>
              <option value="Lead Management">Lead Management</option>
              <option value="Account Management">Account Management</option>
              <option value="Contact Management">Contact Management</option>
              <option value="Data Center">Data Center</option>
              <option value="Email/SMS Issues">Email/SMS Issues</option>
              <option value="Product Purchase">Product Purchase</option>
              <option value="User Management">User Management</option>
              <option value="Performance Issue">Performance Issue</option>
              <option value="Bug Report">Bug Report</option>
              <option value="Feature Request">Feature Request</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Search
            </label>
            <input
              type="text"
              placeholder="Ticket number or summary..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '2px solid #e5e7eb',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
        </div>
      </div>

      {/* Tickets Table/Cards */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        border: '1px solid #f0f0f0'
      }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '4px solid #f3f4f6',
              borderTop: '4px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }} />
            <style>
              {`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}
            </style>
            <p style={{ color: '#6b7280', fontSize: '16px', fontWeight: '500' }}>Loading tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ padding: isMobile ? '40px 20px' : '80px', textAlign: 'center' }}>
            <div style={{ fontSize: '72px', marginBottom: '20px' }}>🎫</div>
            <h3 style={{
              fontSize: isMobile ? '20px' : '24px',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '12px'
            }}>
              No Tickets Found
            </h3>
            <p style={{ color: '#6b7280', fontSize: '16px' }}>
              No support tickets match your current filters
            </p>
          </div>
        ) : isMobile ? (
          // Mobile Card View
          <div style={{ padding: '16px' }}>
            {tickets.map((ticket) => (
              <div
                key={ticket._id}
                onClick={() => loadTicketDetails(ticket._id)}
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  padding: '20px',
                  borderRadius: '16px',
                  marginBottom: '16px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.transform = 'scale(0.98)';
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '12px'
                }}>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#667eea',
                    fontFamily: 'monospace'
                  }}>
                    {ticket.ticketNumber}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: '700',
                      background: `linear-gradient(135deg, ${getStatusColor(ticket.status)} 0%, ${getStatusColor(ticket.status)}dd 100%)`,
                      color: 'white',
                      boxShadow: `0 2px 8px ${getStatusColor(ticket.status)}40`
                    }}>
                      {ticket.status}
                    </span>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: '700',
                      background: `linear-gradient(135deg, ${getPriorityColor(ticket.priority)} 0%, ${getPriorityColor(ticket.priority)}dd 100%)`,
                      color: 'white',
                      boxShadow: `0 2px 8px ${getPriorityColor(ticket.priority)}40`
                    }}>
                      {ticket.priority}
                    </span>
                  </div>
                </div>

                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#1f2937',
                  marginBottom: '8px',
                  lineHeight: '1.4'
                }}>
                  {ticket.summary}
                </h4>

                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginBottom: '12px'
                }}>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Tenant:</strong> {ticket.tenant?.organizationName || 'N/A'}
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Category:</strong> {ticket.category}
                  </div>
                  <div>
                    <strong>Created:</strong> {formatDate(ticket.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Desktop Table View
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      Ticket #
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      Summary
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      Tenant
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      Category
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      Priority
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      Status
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      Created
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket._id}
                      style={{
                        borderBottom: '1px solid #f0f0f0',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: '700', color: '#667eea' }}>
                        {ticket.ticketNumber}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#374151', maxWidth: '300px' }}>
                        <div style={{ fontWeight: '600' }}>{ticket.summary}</div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                        {ticket.tenant?.organizationName || 'N/A'}
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px', color: '#6b7280' }}>
                        {ticket.category}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '700',
                          background: `linear-gradient(135deg, ${getPriorityColor(ticket.priority)} 0%, ${getPriorityColor(ticket.priority)}dd 100%)`,
                          color: 'white',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: `0 2px 8px ${getPriorityColor(ticket.priority)}40`
                        }}>
                          {getPriorityIcon(ticket.priority)} {ticket.priority}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '700',
                          background: `linear-gradient(135deg, ${getStatusColor(ticket.status)} 0%, ${getStatusColor(ticket.status)}dd 100%)`,
                          color: 'white',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: `0 2px 8px ${getStatusColor(ticket.status)}40`
                        }}>
                          {getStatusIcon(ticket.status)} {ticket.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px', color: '#6b7280' }}>
                        {formatDate(ticket.createdAt)}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <button
                          onClick={() => loadTicketDetails(ticket._id)}
                          style={{
                            padding: '8px 20px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                          }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div style={{
                padding: '24px',
                display: 'flex',
                justifyContent: 'center',
                gap: '12px',
                borderTop: '1px solid #f0f0f0',
                background: 'linear-gradient(135deg, #fafafa 0%, #ffffff 100%)'
              }}>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  style={{
                    padding: '10px 20px',
                    background: pagination.page === 1 ? '#f3f4f6' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: pagination.page === 1 ? '#9ca3af' : 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: pagination.page === 1 ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Previous
                </button>
                <span style={{
                  padding: '10px 20px',
                  color: '#374151',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.pages}
                  style={{
                    padding: '10px 20px',
                    background: pagination.page === pagination.pages ? '#f3f4f6' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: pagination.page === pagination.pages ? '#9ca3af' : 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: pagination.page === pagination.pages ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div
            className="modal-content"
            style={{
              maxWidth: isMobile ? '95%' : '900px',
              maxHeight: '90vh',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '24px',
              border: '1px solid rgba(255,255,255,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '24px 24px 0 0',
              borderBottom: 'none',
              padding: isMobile ? '20px' : '28px'
            }}>
              <div>
                <h2 style={{
                  fontSize: isMobile ? '20px' : '26px',
                  fontWeight: '800',
                  color: 'white',
                  marginBottom: '12px',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
                }}>
                  {selectedTicket.ticketNumber}
                </h2>
                <p style={{
                  fontSize: isMobile ? '16px' : '18px',
                  color: 'rgba(255,255,255,0.95)',
                  marginBottom: '16px',
                  fontWeight: '500'
                }}>
                  {selectedTicket.summary}
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: 'rgba(255,255,255,0.25)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)'
                  }}>
                    {getStatusIcon(selectedTicket.status)} {selectedTicket.status}
                  </span>
                  <span style={{
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: 'rgba(255,255,255,0.25)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)'
                  }}>
                    {getPriorityIcon(selectedTicket.priority)} {selectedTicket.priority}
                  </span>
                  <span style={{
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: 'rgba(255,255,255,0.25)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)'
                  }}>
                    {selectedTicket.category}
                  </span>
                </div>
              </div>
              <button
                className="modal-close"
                onClick={() => setSelectedTicket(null)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  fontSize: '28px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%'
                }}
              >×</button>
            </div>

            <div className="modal-body" style={{
              maxHeight: 'calc(90vh - 200px)',
              overflowY: 'auto',
              padding: isMobile ? '20px' : '28px'
            }}>
              {/* Ticket Info */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
                padding: isMobile ? '16px' : '20px',
                borderRadius: '16px',
                marginBottom: '24px',
                border: '1px solid rgba(102, 126, 234, 0.2)'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                  gap: '16px'
                }}>
                  <div>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '600' }}>Tenant</p>
                    <p style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937' }}>
                      {selectedTicket.tenant?.organizationName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '600' }}>Created By</p>
                    <p style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937' }}>
                      {selectedTicket.createdBy?.firstName} {selectedTicket.createdBy?.lastName}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '600' }}>Created At</p>
                    <p style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937' }}>
                      {formatDate(selectedTicket.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '600' }}>Assigned To</p>
                    <p style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937' }}>
                      {selectedTicket.assignedTo ?
                        `${selectedTicket.assignedTo.firstName} ${selectedTicket.assignedTo.lastName}`
                        : 'Unassigned'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '17px',
                  fontWeight: '700',
                  color: '#1f2937',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  📝 Description
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#374151',
                  lineHeight: '1.7',
                  whiteSpace: 'pre-wrap',
                  background: 'white',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb'
                }}>
                  {selectedTicket.description}
                </p>
              </div>

              {/* Admin Actions */}
              <div style={{
                marginBottom: '24px',
                padding: isMobile ? '16px' : '20px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 197, 253, 0.08) 100%)',
                borderRadius: '16px',
                border: '2px solid rgba(59, 130, 246, 0.2)'
              }}>
                <h3 style={{
                  fontSize: '17px',
                  fontWeight: '700',
                  color: '#1e40af',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  ⚙️ Admin Actions
                </h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {!selectedTicket.assignedTo && (
                    <button
                      onClick={handleAssignToMe}
                      style={{
                        padding: '10px 18px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                      }}
                      onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                      Assign to Me
                    </button>
                  )}

                  {selectedTicket.status === 'Open' && (
                    <button
                      onClick={() => handleUpdateStatus('In Progress')}
                      style={{
                        padding: '10px 18px',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                      }}
                      onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                      Start Progress
                    </button>
                  )}

                  {selectedTicket.status === 'In Progress' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus('Waiting for Customer')}
                        style={{
                          padding: '10px 18px',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                        }}
                        onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                      >
                        Wait for Customer
                      </button>
                      <button
                        onClick={() => handleUpdateStatus('Resolved')}
                        style={{
                          padding: '10px 18px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                        }}
                        onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                      >
                        Mark Resolved
                      </button>
                    </>
                  )}

                  {selectedTicket.status === 'Waiting for Customer' && (
                    <button
                      onClick={() => handleUpdateStatus('In Progress')}
                      style={{
                        padding: '10px 18px',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                      }}
                      onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                      Resume Progress
                    </button>
                  )}

                  {selectedTicket.status === 'Resolved' && (
                    <button
                      onClick={() => handleUpdateStatus('Closed')}
                      style={{
                        padding: '10px 18px',
                        background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)'
                      }}
                      onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                      Close Ticket
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteTicket(selectedTicket._id)}
                    style={{
                      padding: '10px 18px',
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    Force Close
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '17px',
                  fontWeight: '700',
                  color: '#1f2937',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  💬 Messages ({selectedTicket.messages?.length || 0})
                </h3>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  padding: '4px'
                }}>
                  {selectedTicket.messages?.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      background: 'white',
                      borderRadius: '12px',
                      border: '2px dashed #e5e7eb'
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '12px' }}>💭</div>
                      <p style={{ color: '#6b7280', fontSize: '14px' }}>No messages yet</p>
                    </div>
                  ) : (
                    selectedTicket.messages.map((msg, index) => (
                      <div
                        key={index}
                        style={{
                          padding: isMobile ? '14px' : '16px',
                          borderRadius: '16px',
                          background: msg.senderType === 'SAAS_ADMIN'
                            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 197, 253, 0.1) 100%)'
                            : 'white',
                          border: msg.senderType === 'SAAS_ADMIN'
                            ? '2px solid rgba(59, 130, 246, 0.3)'
                            : '1px solid #e5e7eb',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateX(4px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateX(0)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '10px',
                          flexWrap: 'wrap',
                          gap: '8px'
                        }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937' }}>
                              {msg.sender?.firstName} {msg.sender?.lastName}
                            </span>
                            {msg.senderType === 'SAAS_ADMIN' && (
                              <span style={{
                                padding: '3px 10px',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                color: 'white',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: '700',
                                boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)'
                              }}>
                                ADMIN
                              </span>
                            )}
                            {msg.isInternal && (
                              <span style={{
                                padding: '3px 10px',
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                color: 'white',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: '700',
                                boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)'
                              }}>
                                INTERNAL
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '500' }}>
                            {formatDate(msg.sentAt)}
                          </span>
                        </div>
                        <p style={{
                          fontSize: '14px',
                          color: '#374151',
                          lineHeight: '1.6',
                          whiteSpace: 'pre-wrap',
                          margin: 0
                        }}>
                          {msg.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Send Message Form */}
              <form onSubmit={handleSendMessage}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '12px',
                    cursor: 'pointer',
                    padding: '12px',
                    background: isInternalNote ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                    borderRadius: '10px',
                    transition: 'all 0.2s ease'
                  }}>
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      style={{
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{ fontSize: '14px', color: '#374151', fontWeight: '600' }}>
                      Internal Note (only visible to admins)
                    </span>
                  </label>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={isInternalNote ? "Add internal note..." : "Type your message..."}
                    required
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '2px solid #e5e7eb',
                      fontSize: '14px',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    padding: '14px 24px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                  }}
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportAdmin;
