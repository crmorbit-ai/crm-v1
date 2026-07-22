import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import CreateTaskModal from '../components/CreateTaskModal';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const CaseStudyTaskDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    activeNow: 0,
    activeTasks: []
  });
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'table'
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchStats();
    fetchTasks();

    // Socket.io real-time updates
    const socket = io(API_URL, {
      auth: { token }
    });

    socket.on('task-status-update', () => {
      fetchStats();
      fetchTasks();
    });

    socket.on('task-completed', () => {
      fetchStats();
      fetchTasks();
    });

    return () => socket.disconnect();
  }, [filterStatus]);

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/case-study-tasks/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(data.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const { data } = await axios.get(`${API_URL}/api/case-study-tasks`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setTasks(data.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const getElapsedTime = (startedAt) => {
    if (!startedAt) return '0m';
    const now = new Date();
    const start = new Date(startedAt);
    const diff = Math.floor((now - start) / 1000); // seconds
    return formatTime(diff);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
      high: { bg: '#fed7aa', border: '#f97316', text: '#9a3412' },
      medium: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
      low: { bg: '#dbeafe', border: '#3b82f6', text: '#1e3a8a' }
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af' },
      in_progress: { bg: '#dbeafe', text: '#1e40af', dot: '#3b82f6' },
      completed: { bg: '#d1fae5', text: '#065f46', dot: '#10b981' },
      cancelled: { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444' }
    };
    return colors[status] || colors.pending;
  };

  const StatCard = ({ label, value, icon, gradient, isActive }) => (
    <div
      style={{
        background: gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px',
        borderRadius: '16px',
        boxShadow: isActive
          ? '0 8px 24px rgba(0,0,0,0.15), 0 0 0 3px rgba(59,130,246,0.3)'
          : '0 4px 12px rgba(0,0,0,0.1)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        cursor: isActive ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        transform: isActive ? 'translateY(-4px)' : 'none'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px', fontWeight: 500 }}>
            {label}
          </div>
          <div style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '-1px' }}>
            {value}
          </div>
        </div>
        <div style={{ opacity: 0.9 }}>{icon}</div>
      </div>
      {isActive && (
        <div style={{
          marginTop: '12px',
          fontSize: '12px',
          opacity: 0.95,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'white',
            animation: 'pulse 2s infinite'
          }} />
          Working Now
        </div>
      )}
    </div>
  );

  const TaskCard = ({ task }) => {
    const priorityColor = getPriorityColor(task.priority);
    const statusColor = getStatusColor(task.status);
    const isActive = task.timeTracking?.timerRunning;

    return (
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px',
          border: isActive ? '2px solid #3b82f6' : '1px solid #e5e7eb',
          boxShadow: isActive
            ? '0 4px 12px rgba(59,130,246,0.15)'
            : '0 2px 4px rgba(0,0,0,0.05)',
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
        onClick={() => navigate(`/saas/case-study-tasks/${task._id}`)}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#111827',
              marginBottom: '6px'
            }}>
              {task.title}
            </div>
            <div style={{
              fontSize: '13px',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                background: priorityColor.bg,
                color: priorityColor.text,
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                border: `1px solid ${priorityColor.border}`
              }}>
                {task.priority}
              </span>
              <span>•</span>
              <span>{task.topic}</span>
            </div>
          </div>

          {/* Status Badge */}
          <div style={{
            background: statusColor.bg,
            color: statusColor.text,
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: statusColor.dot
            }} />
            {task.status.replace('_', ' ').toUpperCase()}
          </div>
        </div>

        {/* User & Time */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '12px',
          borderTop: '1px solid #f3f4f6'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              fontWeight: 600
            }}>
              {task.assignedTo?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>
                {task.assignedTo?.name || 'Unknown'}
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>
                {task.assignedTo?.email || ''}
              </div>
            </div>
          </div>

          {/* Time Display */}
          <div style={{ textAlign: 'right' }}>
            {isActive ? (
              <div style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                {getElapsedTime(task.timeTracking?.startedAt)}
              </div>
            ) : (
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Total: {formatTime(task.timeTracking?.totalTimeSpent || 0)}
              </div>
            )}
          </div>
        </div>

        {/* Linked Case Study */}
        {task.linkedCaseStudy && (
          <div style={{
            marginTop: '12px',
            padding: '8px 12px',
            background: '#f0fdf4',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#065f46',
            border: '1px solid #86efac'
          }}>
            ✓ Linked to: {task.linkedCaseStudy.title}
          </div>
        )}
      </div>
    );
  };

  const KanbanView = () => {
    const columns = [
      { status: 'pending', title: 'Pending', color: '#f3f4f6' },
      { status: 'in_progress', title: 'In Progress', color: '#dbeafe' },
      { status: 'completed', title: 'Completed', color: '#d1fae5' }
    ];

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
        {columns.map(col => (
          <div key={col.status}>
            <div style={{
              background: col.color,
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontWeight: 600,
              fontSize: '14px',
              color: '#111827'
            }}>
              {col.title} ({tasks.filter(t => t.status === col.status).length})
            </div>
            <div>
              {tasks.filter(t => t.status === col.status).map(task => (
                <TaskCard key={task._id} task={task} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '32px 40px',
        color: 'white'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
            Case Study Task Dashboard
          </h1>
          <p style={{ fontSize: '16px', opacity: 0.9 }}>
            Manage and track all case study creation tasks
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 40px' }}>
        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <StatCard
            label="Total Tasks"
            value={stats.total}
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M3 3v18h18"></path>
                <path d="M18 17V9"></path>
                <path d="M13 17V5"></path>
                <path d="M8 17v-3"></path>
              </svg>
            }
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            }
            gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
          />
          <StatCard
            label="In Progress"
            value={stats.inProgress}
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            }
            gradient="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
          />
          <StatCard
            label="Active Now"
            value={stats.activeNow}
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
            }
            gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
            isActive={stats.activeNow > 0}
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            }
            gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
          />
        </div>

        {/* Active Tasks Real-time Feed */}
        {stats.activeTasks?.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '32px',
            border: '2px solid #3b82f6',
            boxShadow: '0 4px 12px rgba(59,130,246,0.15)'
          }}>
            <div style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#111827',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                animation: 'pulse 2s infinite'
              }} />
              Live Activity
            </div>
            {stats.activeTasks.map(task => (
              <div key={task._id} style={{
                padding: '12px 16px',
                background: '#f0f9ff',
                borderRadius: '8px',
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f6'
                  }} />
                  <span style={{ fontWeight: 600, color: '#111827' }}>
                    {task.assignedTo?.name}
                  </span>
                  <span style={{ color: '#6b7280' }}>•</span>
                  <span style={{ color: '#6b7280' }}>
                    Working on: <strong>{task.topic}</strong>
                  </span>
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#3b82f6'
                }}>
                  {getElapsedTime(task.timeTracking?.startedAt)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            {['all', 'pending', 'in_progress', 'completed'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: filterStatus === status ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  background: filterStatus === status ? '#eff6ff' : 'white',
                  color: filterStatus === status ? '#1e40af' : '#6b7280',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setViewMode(viewMode === 'kanban' ? 'table' : 'kanban')}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                background: 'white',
                color: '#6b7280',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              {viewMode === 'kanban' ? '📋 Table' : '📊 Kanban'}
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
              }}
            >
              + Create Task
            </button>
          </div>
        </div>

        {/* Tasks View */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
            Loading tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '60px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            No tasks found
          </div>
        ) : viewMode === 'kanban' ? (
          <KanbanView />
        ) : (
          <div>
            {tasks.map(task => (
              <TaskCard key={task._id} task={task} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Create Task Modal */}
      <CreateTaskModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchStats();
          fetchTasks();
        }}
      />
    </div>
  );
};

export default CaseStudyTaskDashboard;
