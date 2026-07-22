import React, { useState, useEffect } from 'react';
import api from '../services/api';

const TaskDetailModal = ({ taskId, show, onClose, onUpdate }) => {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show && taskId) {
      setTask(null); // Reset task when opening modal
      fetchTaskDetail();
    } else if (!show) {
      setTask(null); // Clear task when closing modal
    }
  }, [show, taskId]);

  const fetchTaskDetail = async () => {
    try {
      setLoading(true);
      console.log('Fetching task with ID:', taskId);
      const response = await api.get(`/case-study-tasks/${taskId}`);
      console.log('Full response:', response);
      console.log('Response.data:', response.data);
      console.log('Response.data.data:', response.data?.data);

      // Handle both response formats
      const taskData = response.data?.data || response.data;
      console.log('Setting task:', taskData);
      setTask(taskData);
    } catch (err) {
      console.error('Failed to fetch task details:', err);
      console.error('Error response:', err.response);
      alert(err.response?.data?.message || 'Failed to load task details');
      onClose(); // Close modal on error
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getStatusStyle = (status) => {
    const styles = {
      todo: { bg: '#f1f5f9', color: '#475569', text: 'To Do' },
      in_progress: { bg: '#dbeafe', color: '#1e40af', text: 'In Progress' },
      review: { bg: '#fef3c7', color: '#92400e', text: 'In Review' },
      on_hold: { bg: '#fee2e2', color: '#991b1b', text: 'On Hold' },
      completed: { bg: '#dcfce7', color: '#166534', text: 'Completed' },
      cancelled: { bg: '#f3f4f6', color: '#6b7280', text: 'Cancelled' }
    };
    return styles[status] || styles.todo;
  };

  const getPriorityStyle = (priority) => {
    const styles = {
      low: { color: '#22c55e', text: '🟢 Low' },
      medium: { color: '#f59e0b', text: '🟡 Medium' },
      high: { color: '#f97316', text: '🟠 High' },
      urgent: { color: '#ef4444', text: '🔴 Urgent' }
    };
    return styles[priority] || styles.medium;
  };

  const getComplexityStyle = (complexity) => {
    const styles = {
      easy: '⭐ Easy',
      medium: '⭐⭐ Medium',
      hard: '⭐⭐⭐ Hard',
      expert: '⭐⭐⭐⭐ Expert'
    };
    return styles[complexity] || styles.medium;
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatActionText = (action) => {
    const actions = {
      created: '✨ Created',
      assigned: '👤 Assigned',
      started: '▶️ Started',
      paused: '⏸️ Paused',
      resumed: '▶️ Resumed',
      completed: '✅ Completed',
      cancelled: '❌ Cancelled',
      commented: '💬 Commented',
      status_changed: '🔄 Status Changed'
    };
    return actions[action] || action;
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
            Loading task details...
          </div>
        ) : task ? (
          <>
            {/* Header */}
            <div
              style={{
                padding: '32px',
                borderBottom: '2px solid #e5e7eb',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: '#ffffff',
                borderRadius: '16px 16px 0 0'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '26px', fontWeight: 700 }}>
                    {task.title}
                  </h2>
                  <p style={{ margin: 0, fontSize: '15px', opacity: 0.9 }}>
                    📂 {task.topic}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '24px',
                    width: '40px',
                    height: '40px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>

              {/* Quick Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginTop: '16px' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  padding: '12px',
                  borderRadius: '8px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '4px' }}>Status</div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>{getStatusStyle(task.status).text}</div>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  padding: '12px',
                  borderRadius: '8px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '4px' }}>Priority</div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>{getPriorityStyle(task.priority).text}</div>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  padding: '12px',
                  borderRadius: '8px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '4px' }}>Progress</div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>{task.progress || 0}%</div>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  padding: '12px',
                  borderRadius: '8px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '4px' }}>Time Spent</div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>
                    {formatTime(task.timeTracking?.totalTimeSpent || 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '32px' }}>
              {/* Description */}
              <section style={{ marginBottom: '32px' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700, color: '#111827' }}>
                  📝 Description
                </h3>
                <div
                  style={{
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '16px',
                    fontSize: '14px',
                    color: '#374151',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    minHeight: '60px'
                  }}
                >
                  {task.description || 'No description provided'}
                </div>
              </section>

              {/* Details Grid */}
              <section style={{ marginBottom: '32px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: '#111827' }}>
                  📊 Task Details
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                  <DetailRow label="Complexity" value={getComplexityStyle(task.complexity)} />
                  <DetailRow label="Estimated Time" value={`${task.estimatedHours || 0} hours`} />
                  <DetailRow label="Deadline" value={formatDate(task.deadline)} />
                  <DetailRow label="Created At" value={formatDate(task.createdAt)} />
                  {task.completedAt && <DetailRow label="Completed At" value={formatDate(task.completedAt)} />}
                  {task.assignedTo && (
                    <DetailRow
                      label="Assigned To"
                      value={`${task.assignedTo.firstName || ''} ${task.assignedTo.lastName || ''} (${task.assignedTo.email})`}
                    />
                  )}
                </div>
              </section>

              {/* Hold Reason */}
              {task.status === 'on_hold' && task.holdReason && (
                <section style={{ marginBottom: '32px' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700, color: '#111827' }}>
                    ⏸️ Hold Reason
                  </h3>
                  <div
                    style={{
                      background: '#fef3c7',
                      border: '1px solid #fbbf24',
                      borderRadius: '8px',
                      padding: '16px',
                      fontSize: '14px',
                      color: '#92400e',
                      lineHeight: '1.6'
                    }}
                  >
                    {task.holdReason}
                  </div>
                </section>
              )}

              {/* Time Tracking Details */}
              {task.timeTracking?.sessions && task.timeTracking.sessions.length > 0 && (
                <section style={{ marginBottom: '32px' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700, color: '#111827' }}>
                    ⏱️ Time Sessions ({task.timeTracking.sessions.length})
                  </h3>
                  <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', maxHeight: '200px', overflowY: 'auto' }}>
                    {task.timeTracking.sessions.slice(-10).reverse().map((session, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '8px 0',
                          borderBottom: idx < Math.min(9, task.timeTracking.sessions.length - 1) ? '1px solid #e5e7eb' : 'none',
                          fontSize: '13px',
                          color: '#6b7280',
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span>{formatDate(session.startTime)} → {formatDate(session.endTime)}</span>
                        <span style={{ fontWeight: 600, color: '#111827' }}>{formatTime(session.duration)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Activity Log */}
              {task.activityLog && task.activityLog.length > 0 && (
                <section>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700, color: '#111827' }}>
                    📜 Activity Log
                  </h3>
                  <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', maxHeight: '300px', overflowY: 'auto' }}>
                    {task.activityLog.slice().reverse().map((log, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '12px 0',
                          borderBottom: idx < task.activityLog.length - 1 ? '1px solid #e5e7eb' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                            {formatActionText(log.action)}
                          </span>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>
                            {formatDate(log.timestamp)}
                          </span>
                        </div>
                        {log.comment && (
                          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px', paddingLeft: '8px', borderLeft: '2px solid #e5e7eb' }}>
                            {log.comment}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </>
        ) : (
          <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
            Task not found
          </div>
        )}
      </div>
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div>
    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: 600 }}>
      {label}
    </div>
    <div style={{ fontSize: '14px', color: '#111827', fontWeight: 500 }}>
      {value}
    </div>
  </div>
);

export default TaskDetailModal;
