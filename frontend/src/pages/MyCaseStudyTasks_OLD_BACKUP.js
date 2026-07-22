import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import CreateTaskModal from '../components/CreateTaskModal';
import TaskCard from '../components/TaskCard';
import { useAuth } from '../context/AuthContext';
import SaasLayout from '../components/layout/SaasLayout';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const MyCaseStudyTasks = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, pending, in_progress, completed
  const [showCreateModal, setShowCreateModal] = useState(false);

  const token = localStorage.getItem('token');
  const isPrimaryAdmin = user?.userType === 'SAAS_OWNER';

  useEffect(() => {
    fetchMyTasks();

    // Socket.io for real-time updates
    const socket = io(API_URL, {
      auth: { token }
    });

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    socket.on(`task-assigned-${user._id}`, () => {
      fetchMyTasks();
      // Show notification
      showNotification('New task assigned!');
    });

    return () => socket.disconnect();
  }, [activeTab]);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const params = activeTab !== 'all' ? { status: activeTab } : {};

      // Primary Admin sees ALL tasks, SAAS Admin sees only own
      const endpoint = isPrimaryAdmin
        ? `${API_URL}/api/case-study-tasks`
        : `${API_URL}/api/case-study-tasks/my-tasks`;

      const { data } = await axios.get(endpoint, {
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

  const handleStartTask = async (taskId) => {
    try {
      await axios.post(`${API_URL}/api/case-study-tasks/${taskId}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMyTasks();
      showNotification('Task started!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start task');
    }
  };

  const handlePauseTask = async (taskId) => {
    try {
      await axios.post(`${API_URL}/api/case-study-tasks/${taskId}/pause`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMyTasks();
      showNotification('Task paused');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to pause task');
    }
  };

  const handleCompleteTask = async (taskId) => {
    const notes = prompt('Add completion notes (optional):');
    try {
      await axios.post(`${API_URL}/api/case-study-tasks/${taskId}/complete`, { notes }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMyTasks();
      showNotification('Task completed! 🎉');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete task');
    }
  };

  const showNotification = (message) => {
    // Simple notification - can be replaced with toast library
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      font-weight: 600;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
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
    const diff = Math.floor((now - start) / 1000);
    return formatTime(diff);
  };

  return (

    return (
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '20px',
          border: isActive ? '2px solid #3b82f6' : '1px solid #e5e7eb',
          boxShadow: isActive
            ? '0 8px 20px rgba(59,130,246,0.2)'
            : '0 2px 8px rgba(0,0,0,0.05)',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Active Indicator */}
        {isActive && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
            animation: 'shimmer 2s infinite'
          }} />
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#111827',
              marginBottom: '8px'
            }}>
              {task.title}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '12px'
            }}>
              {task.description || 'No description provided'}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <span style={{
                background: priorityColor.bg,
                color: priorityColor.text,
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                border: `1px solid ${priorityColor.border}`
              }}>
                {task.priority}
              </span>
              <span style={{
                background: '#f3f4f6',
                color: '#374151',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600
              }}>
                📝 {task.topic}
              </span>
              {task.deadline && (
                <span style={{
                  background: '#fef3c7',
                  color: '#92400e',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  ⏰ Due: {new Date(task.deadline).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Timer Display */}
        <div style={{
          background: isActive ? '#eff6ff' : '#f9fafb',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
          border: isActive ? '1px solid #3b82f6' : '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                Total Time Spent
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>
                {formatTime(task.timeTracking?.totalTimeSpent || 0)}
              </div>
            </div>
            {isActive && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: '#3b82f6', marginBottom: '4px' }}>
                  Current Session
                </div>
                <div style={{
                  fontSize: '20px',
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
              </div>
            )}
          </div>
        </div>

        {/* Linked Case Study */}
        {task.linkedCaseStudy && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span style={{ fontSize: '13px', color: '#065f46', fontWeight: 600 }}>
              Linked to: {task.linkedCaseStudy.title}
            </span>
          </div>
        )}

        {/* Assigned By */}
        <div style={{
          fontSize: '12px',
          color: '#6b7280',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          👤 Assigned by: <strong>{task.assignedBy?.name || 'Admin'}</strong>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {isPending && (
            <button
              onClick={() => handleStartTask(task._id)}
              style={{
                flex: 1,
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              ▶️ Start Task
            </button>
          )}

          {isActive && (
            <>
              <button
                onClick={() => handlePauseTask(task._id)}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '1px solid #f59e0b',
                  background: 'white',
                  color: '#f59e0b',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                ⏸️ Pause
              </button>
              <button
                onClick={() => navigate(`/saas/case-studies?newTask=${task._id}`)}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                }}
              >
                📝 Create Case Study
              </button>
            </>
          )}

          {!isPending && !isCompleted && !isActive && (
            <button
              onClick={() => handleStartTask(task._id)}
              style={{
                flex: 1,
                padding: '12px 24px',
                borderRadius: '8px',
                border: '1px solid #3b82f6',
                background: 'white',
                color: '#3b82f6',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              ▶️ Resume
            </button>
          )}

          {task.status === 'in_progress' && (
            <button
              onClick={() => handleCompleteTask(task._id)}
              style={{
                flex: 1,
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
              }}
            >
              ✓ Complete Task
            </button>
          )}

          {isCompleted && (
            <div style={{
              flex: 1,
              padding: '12px 24px',
              borderRadius: '8px',
              background: '#d1fae5',
              color: '#065f46',
              fontWeight: 600,
              fontSize: '14px',
              textAlign: 'center',
              border: '1px solid #86efac'
            }}>
              ✓ Completed on {new Date(task.completedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <SaasLayout title={isPrimaryAdmin ? 'Team Tasks' : 'My Tasks'}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
            {isPrimaryAdmin ? 'Team Tasks' : 'My Tasks'}
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            {isPrimaryAdmin
              ? 'Monitor what everyone is working on in real-time'
              : 'Declare what you\'re working on and track your time'}
          </p>
        </div>
        {!isPrimaryAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(59,130,246,0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(59,130,246,0.3)';
            }}
          >
            + New Task
          </button>
        )}
      </div>

      <div>
        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '32px',
          borderBottom: '2px solid #e5e7eb',
          paddingBottom: '0'
        }}>
          {[
            { key: 'all', label: 'All Tasks', count: tasks.length },
            { key: 'pending', label: 'Pending', count: tasks.filter(t => t.status === 'pending').length },
            { key: 'in_progress', label: 'In Progress', count: tasks.filter(t => t.status === 'in_progress').length },
            { key: 'completed', label: 'Completed', count: tasks.filter(t => t.status === 'completed').length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '12px 24px',
                border: 'none',
                background: 'transparent',
                color: activeTab === tab.key ? '#3b82f6' : '#6b7280',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                borderBottom: activeTab === tab.key ? '3px solid #3b82f6' : 'none',
                marginBottom: '-2px',
                transition: 'all 0.2s'
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Tasks List */}
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            color: '#6b7280',
            fontSize: '16px'
          }}>
            Loading your tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '60px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <div style={{ fontSize: '20px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
              No tasks yet
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
              Create a task to declare what case study you're working on
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '12px 24px',
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
              + Create Your First Task
            </button>
          </div>
        ) : (
          <div>
            {tasks.map(task => (
              <TaskCard key={task._id} task={task} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
      `}</style>

      {/* Create Task Modal */}
      <CreateTaskModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchMyTasks();
          setShowCreateModal(false);
        }}
      />
    </SaasLayout>
  );
};

export default MyCaseStudyTasks;
