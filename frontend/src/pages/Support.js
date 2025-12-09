import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import supportService from '../services/supportService';
import Modal from '../components/common/Modal';
import '../styles/crm.css';

const Support = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    search: ''
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Create ticket form
  const [newTicket, setNewTicket] = useState({
    summary: '',
    description: '',
    category: 'Other',
    priority: 'Medium'
  });

  // Message form
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadTickets();
  }, [filters, pagination.page]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await supportService.getAllTickets({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });

      setTickets(response.data?.tickets || []);
      setPagination(response.data?.pagination || pagination);
    } catch (error) {
      console.error('Error loading tickets:', error);
      alert('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();

    if (!newTicket.summary || !newTicket.description) {
      alert('Please fill all required fields');
      return;
    }

    try {
      await supportService.createTicket(newTicket);
      alert('Ticket created successfully!');
      setShowCreateModal(false);
      setNewTicket({ summary: '', description: '', category: 'Other', priority: 'Medium' });
      loadTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert(error.message || 'Failed to create ticket');
    }
  };

  const handleViewTicket = async (ticket) => {
    try {
      const response = await supportService.getTicket(ticket._id);
      setSelectedTicket(response.data || response);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error loading ticket:', error);
      alert('Failed to load ticket details');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) {
      alert('Please enter a message');
      return;
    }

    try {
      setSendingMessage(true);
      const response = await supportService.addMessage(selectedTicket._id, newMessage);
      setSelectedTicket(response.data || response);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSendingMessage(false);
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

  const getCategoryIcon = (category) => {
    const icons = {
      'Lead Management': '📋',
      'Account Management': '🏢',
      'Contact Management': '👤',
      'Data Center': '💾',
      'Email/SMS Issues': '✉️',
      'Product Purchase': '🛒',
      'User Management': '👥',
      'Performance Issue': '⚡',
      'Bug Report': '🐛',
      'Feature Request': '💡',
      'Other': '📌'
    };
    return icons[category] || '📌';
  };

  return (
    <DashboardLayout>
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }

          .hero-animation {
            animation: fadeInUp 0.8s ease-out;
          }

          .ticket-card {
            animation: fadeInUp 0.5s ease-out;
            animation-fill-mode: both;
          }
        `}
      </style>

      <div style={{ padding: isMobile ? '16px' : '24px' }}>
        {/* Hero Section with Beautiful Gradient */}
        <div className="hero-animation" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '24px',
          padding: isMobile ? '32px 24px' : '48px 40px',
          marginBottom: '32px',
          boxShadow: '0 20px 60px rgba(102, 126, 234, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative circles */}
          <div style={{
            position: 'absolute',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            top: '-50px',
            right: '-50px',
            animation: 'float 6s ease-in-out infinite'
          }} />
          <div style={{
            position: 'absolute',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            bottom: '-30px',
            left: '-30px',
            animation: 'float 8s ease-in-out infinite'
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '20px' : '0'
            }}>
              <div>
                <h1 style={{
                  fontSize: isMobile ? '28px' : '36px',
                  fontWeight: '800',
                  color: 'white',
                  marginBottom: '12px',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
                }}>
                  Support Center
                </h1>
                <p style={{
                  color: 'rgba(255,255,255,0.95)',
                  fontSize: isMobile ? '15px' : '18px',
                  fontWeight: '500',
                  maxWidth: '600px'
                }}>
                  Need help? Create a support ticket and our team will assist you as soon as possible.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  padding: isMobile ? '14px 24px' : '16px 32px',
                  background: 'white',
                  color: '#667eea',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: isMobile ? '15px' : '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-3px)';
                  e.target.style.boxShadow = '0 15px 40px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
                }}
              >
                + Create New Ticket
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          background: 'white',
          padding: isMobile ? '16px' : '20px',
          borderRadius: '20px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          border: '1px solid #f0f0f0'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <input
              type="text"
              placeholder="Search tickets..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                border: '2px solid #e5e7eb',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              style={{
                padding: '12px 16px',
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
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                border: '2px solid #e5e7eb',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            >
              <option value="">All Priority</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              style={{
                padding: '12px 16px',
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
        </div>

        {/* Tickets List */}
        {loading ? (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '60px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
          }}>
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
            <p style={{ color: '#6b7280', fontSize: '16px', fontWeight: '500' }}>
              Loading your tickets...
            </p>
          </div>
        ) : tickets.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: isMobile ? '40px 20px' : '80px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              fontSize: '80px',
              marginBottom: '24px',
              animation: 'float 3s ease-in-out infinite'
            }}>
              🎫
            </div>
            <h3 style={{
              fontSize: isMobile ? '22px' : '28px',
              fontWeight: '800',
              color: '#1f2937',
              marginBottom: '16px'
            }}>
              No Tickets Yet
            </h3>
            <p style={{
              color: '#6b7280',
              fontSize: isMobile ? '15px' : '17px',
              marginBottom: '28px',
              maxWidth: '500px',
              margin: '0 auto 28px'
            }}>
              Create your first support ticket to get help from our team
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 15px 40px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.3)';
              }}
            >
              Create Your First Ticket
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '20px',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(380px, 1fr))'
          }}>
            {tickets.map((ticket, index) => (
              <div
                key={ticket._id}
                className="ticket-card"
                onClick={() => handleViewTicket(ticket)}
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  padding: isMobile ? '20px' : '24px',
                  borderRadius: '20px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  animationDelay: `${index * 0.1}s`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(102, 126, 234, 0.2)';
                  e.currentTarget.style.borderColor = '#667eea';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                {/* Ticket Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{ fontSize: '28px' }}>
                      {getCategoryIcon(ticket.category)}
                    </span>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '700',
                      color: '#667eea',
                      fontFamily: 'monospace',
                      background: 'rgba(102, 126, 234, 0.1)',
                      padding: '4px 10px',
                      borderRadius: '8px'
                    }}>
                      {ticket.ticketNumber}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: '700',
                      background: `linear-gradient(135deg, ${getPriorityColor(ticket.priority)} 0%, ${getPriorityColor(ticket.priority)}dd 100%)`,
                      color: 'white',
                      boxShadow: `0 2px 8px ${getPriorityColor(ticket.priority)}40`,
                      whiteSpace: 'nowrap'
                    }}>
                      {ticket.priority}
                    </span>
                  </div>
                </div>

                {/* Ticket Title */}
                <h3 style={{
                  fontSize: isMobile ? '17px' : '18px',
                  fontWeight: '700',
                  color: '#1f2937',
                  marginBottom: '12px',
                  lineHeight: '1.5',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {ticket.summary}
                </h3>

                {/* Ticket Description */}
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  marginBottom: '16px',
                  lineHeight: '1.6',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {ticket.description}
                </p>

                {/* Ticket Footer */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '16px',
                  borderTop: '1px solid #f0f0f0',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#9ca3af' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      💬 {ticket.messages?.length || 0}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      📅 {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: `linear-gradient(135deg, ${getStatusColor(ticket.status)} 0%, ${getStatusColor(ticket.status)}dd 100%)`,
                    color: 'white',
                    boxShadow: `0 2px 8px ${getStatusColor(ticket.status)}40`
                  }}>
                    {ticket.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            marginTop: '32px'
          }}>
            <button
              disabled={pagination.page === 1}
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
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
              disabled={pagination.page === pagination.pages}
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
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
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Support Ticket"
        >
          <form onSubmit={handleCreateTicket}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Summary *
              </label>
              <input
                type="text"
                placeholder="Brief summary of the issue"
                value={newTicket.summary}
                onChange={(e) => setNewTicket({ ...newTicket, summary: e.target.value })}
                required
                maxLength={200}
                style={{
                  width: '100%',
                  padding: '12px 16px',
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

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Description *
              </label>
              <textarea
                placeholder="Detailed description of the issue"
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                rows={5}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '2px solid #e5e7eb',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Category
                </label>
                <select
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '2px solid #e5e7eb',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                >
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
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Priority
                </label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '2px solid #e5e7eb',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{
                  padding: '12px 24px',
                  background: 'white',
                  color: '#6b7280',
                  border: '2px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#9ca3af';
                  e.target.style.color = '#374151';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.color = '#6b7280';
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.3s ease'
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
                Create Ticket
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Ticket Detail Modal */}
      {showDetailModal && selectedTicket && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTicket(null);
            setNewMessage('');
          }}
          title={selectedTicket.ticketNumber}
          size="large"
        >
          <div>
            {/* Ticket Header */}
            <div style={{
              marginBottom: '24px',
              paddingBottom: '20px',
              borderBottom: '2px solid #f0f0f0'
            }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '700',
                  background: `linear-gradient(135deg, ${getStatusColor(selectedTicket.status)} 0%, ${getStatusColor(selectedTicket.status)}dd 100%)`,
                  color: 'white',
                  boxShadow: `0 2px 8px ${getStatusColor(selectedTicket.status)}40`
                }}>
                  {selectedTicket.status}
                </span>
                <span style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '700',
                  background: `linear-gradient(135deg, ${getPriorityColor(selectedTicket.priority)} 0%, ${getPriorityColor(selectedTicket.priority)}dd 100%)`,
                  color: 'white',
                  boxShadow: `0 2px 8px ${getPriorityColor(selectedTicket.priority)}40`
                }}>
                  {selectedTicket.priority} Priority
                </span>
                <span style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  background: '#f1f5f9',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {getCategoryIcon(selectedTicket.category)} {selectedTicket.category}
                </span>
              </div>

              <h2 style={{
                fontSize: isMobile ? '20px' : '24px',
                fontWeight: '800',
                color: '#1f2937',
                marginBottom: '12px'
              }}>
                {selectedTicket.summary}
              </h2>

              <p style={{
                color: '#6b7280',
                lineHeight: '1.7',
                marginBottom: '12px'
              }}>
                {selectedTicket.description}
              </p>

              <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                Created: {new Date(selectedTicket.createdAt).toLocaleString()} by {selectedTicket.createdBy?.firstName} {selectedTicket.createdBy?.lastName}
              </div>
            </div>

            {/* Messages Thread */}
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
                maxHeight: '400px',
                overflowY: 'auto',
                marginBottom: '20px'
              }}>
                {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages.map((msg, index) => (
                    <div
                      key={index}
                      style={{
                        marginBottom: '16px',
                        padding: '16px',
                        borderRadius: '16px',
                        background: msg.senderType === 'SAAS_ADMIN'
                          ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                          : 'white',
                        border: msg.senderType === 'SAAS_ADMIN'
                          ? '2px solid rgba(102, 126, 234, 0.3)'
                          : '1px solid #e5e7eb',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}>
                        <span style={{
                          fontWeight: '700',
                          color: '#1f2937',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          {msg.sender?.firstName} {msg.sender?.lastName}
                          {msg.senderType === 'SAAS_ADMIN' && (
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              fontWeight: '700'
                            }}>
                              Support
                            </span>
                          )}
                        </span>
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                          {new Date(msg.sentAt).toLocaleString()}
                        </span>
                      </div>
                      <p style={{
                        margin: 0,
                        color: '#475569',
                        whiteSpace: 'pre-wrap',
                        lineHeight: '1.6'
                      }}>
                        {msg.message}
                      </p>
                    </div>
                  ))
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    background: 'white',
                    borderRadius: '12px',
                    border: '2px dashed #e5e7eb'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>💭</div>
                    <p style={{ color: '#9ca3af' }}>No messages yet</p>
                  </div>
                )}
              </div>

              {/* Add Message Form */}
              {selectedTicket.status !== 'Closed' && (
                <form onSubmit={handleSendMessage}>
                  <textarea
                    placeholder="Type your message here..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={3}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '2px solid #e5e7eb',
                      fontSize: '14px',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      marginBottom: '12px'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage}
                    style={{
                      padding: '12px 24px',
                      background: sendingMessage ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: '700',
                      cursor: sendingMessage ? 'not-allowed' : 'pointer',
                      width: '100%',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!sendingMessage) {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                    }}
                  >
                    {sendingMessage ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default Support;
