import React, { useState, useEffect } from 'react';
import api from '../services/api';

const TaskCard = ({ task, onUpdate, isPrimaryAdmin = false }) => {
  const [showActions, setShowActions] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [liveTimer, setLiveTimer] = useState('00:00:00');
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [newProgress, setNewProgress] = useState(task.progress || 0);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [holdReason, setHoldReason] = useState('');
  const [showBlockerModal, setShowBlockerModal] = useState(false);
  const [blockerDesc, setBlockerDesc] = useState('');

  // Live Timer - Real-time elapsed time tracker
  useEffect(() => {
    const updateLiveTimer = () => {
      let totalSeconds = task.timeTracking?.totalTimeSpent || 0;

      if (task.timeTracking?.timerRunning && task.timeTracking?.startedAt) {
        const startedAt = new Date(task.timeTracking.startedAt);
        const now = new Date();
        const elapsedSeconds = Math.floor((now - startedAt) / 1000);
        totalSeconds += elapsedSeconds;
      }

      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setLiveTimer(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    updateLiveTimer();
    const interval = setInterval(updateLiveTimer, 1000);
    return () => clearInterval(interval);
  }, [task.timeTracking]);

  // Countdown Timer to Deadline
  useEffect(() => {
    if (!task.deadline) {
      setCountdown('');
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const deadline = new Date(task.deadline);
      const diff = deadline - now;

      if (diff <= 0) {
        setCountdown('Overdue');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      if (days > 0) {
        setCountdown(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setCountdown(`${hours}h`);
      } else {
        setCountdown('< 1h');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [task.deadline]);

  const getStatusConfig = (status) => {
    const configs = {
      todo: { label: 'To Do', color: '#64748b', bg: '#f1f5f9' },
      in_progress: { label: 'In Progress', color: '#0ea5e9', bg: '#e0f2fe' },
      review: { label: 'In Review', color: '#f59e0b', bg: '#fef3c7' },
      on_hold: { label: 'On Hold', color: '#ef4444', bg: '#fee2e2' },
      completed: { label: 'Completed', color: '#22c55e', bg: '#dcfce7' },
      cancelled: { label: 'Cancelled', color: '#6b7280', bg: '#f3f4f6' }
    };
    return configs[status] || configs.todo;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#22c55e',
      medium: '#f59e0b',
      high: '#f97316',
      urgent: '#ef4444'
    };
    return colors[priority] || colors.medium;
  };

  const actualHours = ((task.timeTracking?.totalTimeSpent || 0) / 3600).toFixed(1);
  const isOverBudget = task.estimatedHours && parseFloat(actualHours) > task.estimatedHours;
  const isActive = task.timeTracking?.timerRunning;
  const statusConfig = getStatusConfig(task.status);

  // Overdue check: Deadline crossed OR time budget exceeded
  const isOverdue = (
    // Deadline overdue
    (task.deadline && new Date() > new Date(task.deadline) && task.status !== 'completed') ||
    // Time budget overdue (actual > estimated)
    (task.estimatedHours && parseFloat(actualHours) >= task.estimatedHours && task.status !== 'completed')
  );

  const handleStartTask = async () => {
    try {
      await api.post(`/case-study-tasks/${task._id}/start`, {});
      onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start task');
    }
  };

  const handlePauseTask = async () => {
    try {
      await api.post(`/case-study-tasks/${task._id}/pause`, {});
      onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to pause task');
    }
  };

  const handleUpdateProgress = async () => {
    try {
      await api.patch(`/case-study-tasks/${task._id}/progress`,
        { progress: newProgress });
      setShowProgressModal(false);
      onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update progress');
    }
  };

  const handleStatusChange = async (status) => {
    try {
      const payload = { status };
      if (status === 'on_hold' && holdReason) {
        payload.holdReason = holdReason;
      }

      await api.patch(`/case-study-tasks/${task._id}/status`, payload);
      setShowStatusModal(false);
      setHoldReason('');
      onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to change status');
    }
  };

  const handleAddBlocker = async () => {
    try {
      await api.post(`/case-study-tasks/${task._id}/blockers`,
        { description: blockerDesc });
      setShowBlockerModal(false);
      setBlockerDesc('');
      onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add blocker');
    }
  };

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '24px',
      marginBottom: '16px',
      transition: 'all 0.2s',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{
            margin: '0 0 8px 0',
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827',
            lineHeight: '1.4'
          }}>
            {task.title}
          </h3>
          <p style={{
            margin: '0 0 12px 0',
            fontSize: '14px',
            color: '#6b7280',
            lineHeight: '1.6'
          }}>
            {task.description || task.topic}
          </p>

          {/* Meta info row */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: statusConfig.bg,
              color: statusConfig.color,
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600
            }}>
              {statusConfig.label}
            </span>

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: '#6b7280',
              fontWeight: 500
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: getPriorityColor(task.priority)
              }} />
              {task.priority?.toUpperCase()}
            </span>

            <span style={{
              fontSize: '12px',
              color: '#6b7280',
              fontWeight: 500
            }}>
              {'⭐'.repeat(task.complexity === 'easy' ? 1 : task.complexity === 'medium' ? 2 : task.complexity === 'hard' ? 3 : 4)}
              <span style={{ marginLeft: '4px' }}>{task.complexity?.toUpperCase()}</span>
            </span>

            {task.deadline && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                color: isOverdue ? '#ef4444' : '#6b7280',
                fontWeight: 500
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
                {countdown || new Date(task.deadline).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {isOverdue && (
          <span style={{
            padding: '6px 12px',
            background: '#fef2f2',
            color: '#dc2626',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            border: '1px solid #fee2e2'
          }}>
            OVERDUE
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>Progress</span>
          <span style={{ fontSize: '12px', color: '#111827', fontWeight: 700 }}>{task.progress || 0}%</span>
        </div>
        <div style={{
          width: '100%',
          height: '8px',
          background: '#f3f4f6',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${task.progress || 0}%`,
            height: '100%',
            background: task.progress === 100 ? '#22c55e' : 'linear-gradient(90deg, #3b82f6, #06b6d4)',
            transition: 'width 0.3s ease',
            borderRadius: '4px'
          }} />
        </div>
      </div>

      {/* Time Tracking Section */}
      <div style={{
        background: isActive ? '#f0f9ff' : '#f9fafb',
        border: `1px solid ${isActive ? '#bfdbfe' : '#e5e7eb'}`,
        borderRadius: '6px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        {/* Live Timer */}
        <div style={{ marginBottom: '16px', textAlign: 'center' }}>
          <div style={{
            fontSize: '11px',
            color: '#6b7280',
            fontWeight: 600,
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            {isActive ? 'Time Elapsed' : 'Total Time Spent'}
          </div>
          <div style={{
            fontSize: '36px',
            fontWeight: 700,
            color: isActive ? '#0284c7' : '#111827',
            fontFamily: 'ui-monospace, monospace',
            letterSpacing: '2px'
          }}>
            {liveTimer}
          </div>
          {isActive && (
            <div style={{
              fontSize: '11px',
              color: '#0284c7',
              marginTop: '4px',
              fontWeight: 500
            }}>
              Timer is running...
            </div>
          )}
        </div>

        {/* Time Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '12px',
          paddingTop: '16px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px', fontWeight: 500 }}>
              Estimated
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#3b82f6', fontFamily: 'ui-monospace, monospace' }}>
              {task.estimatedHours || 0}h
            </div>
          </div>
          <div style={{ textAlign: 'center', borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px', fontWeight: 500 }}>
              Actual
            </div>
            <div style={{
              fontSize: '18px',
              fontWeight: 700,
              color: isOverBudget ? '#ef4444' : '#22c55e',
              fontFamily: 'ui-monospace, monospace'
            }}>
              {actualHours}h
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px', fontWeight: 500 }}>
              Remaining
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#6b7280', fontFamily: 'ui-monospace, monospace' }}>
              {task.estimatedHours ? Math.max(0, task.estimatedHours - parseFloat(actualHours)).toFixed(1) : '--'}h
            </div>
          </div>
        </div>
      </div>

      {/* Blockers */}
      {task.blockers && task.blockers.length > 0 && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fee2e2',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '16px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#991b1b', marginBottom: '8px' }}>
            Active Blockers
          </div>
          {task.blockers.filter(b => !b.resolvedAt).map((blocker, idx) => (
            <div key={idx} style={{
              fontSize: '13px',
              color: '#7f1d1d',
              padding: '6px 0',
              borderTop: idx > 0 ? '1px solid #fee2e2' : 'none'
            }}>
              • {blocker.description}
            </div>
          ))}
        </div>
      )}

      {/* On Hold Reason */}
      {task.status === 'on_hold' && task.holdReason && (
        <div style={{
          background: '#fef3c7',
          border: '1px solid #fde68a',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '16px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>
            Hold Reason
          </div>
          <div style={{ fontSize: '13px', color: '#78350f' }}>
            {task.holdReason}
          </div>
        </div>
      )}

      {/* Assigned User (Primary Admin View) */}
      {isPrimaryAdmin && task.assignedTo && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px',
          background: '#f9fafb',
          borderRadius: '6px',
          marginBottom: '16px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#3b82f6',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 600
          }}>
            {task.assignedTo.email?.[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
              {task.assignedTo.email}
            </div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>
              Task Owner
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {task.status === 'todo' && (
          <button
            onClick={handleStartTask}
            style={{
              padding: '10px 16px',
              background: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = '#2563eb'}
            onMouseOut={(e) => e.target.style.background = '#3b82f6'}
          >
            Start Task
          </button>
        )}

        {isActive && (
          <button
            onClick={handlePauseTask}
            style={{
              padding: '10px 16px',
              background: '#f59e0b',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = '#d97706'}
            onMouseOut={(e) => e.target.style.background = '#f59e0b'}
          >
            Pause
          </button>
        )}

        {task.status === 'in_progress' && !isActive && (
          <button
            onClick={handleStartTask}
            style={{
              padding: '10px 16px',
              background: '#22c55e',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = '#16a34a'}
            onMouseOut={(e) => e.target.style.background = '#22c55e'}
          >
            Resume
          </button>
        )}

        {task.status !== 'completed' && task.status !== 'cancelled' && (
          <>
            <button
              onClick={() => setShowProgressModal(true)}
              style={{
                padding: '10px 16px',
                background: '#ffffff',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#f9fafb';
                e.target.style.borderColor = '#9ca3af';
              }}
              onMouseOut={(e) => {
                e.target.style.background = '#ffffff';
                e.target.style.borderColor = '#d1d5db';
              }}
            >
              Update Progress
            </button>

            <button
              onClick={() => setShowStatusModal(true)}
              style={{
                padding: '10px 16px',
                background: '#ffffff',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#f9fafb';
                e.target.style.borderColor = '#9ca3af';
              }}
              onMouseOut={(e) => {
                e.target.style.background = '#ffffff';
                e.target.style.borderColor = '#d1d5db';
              }}
            >
              Change Status
            </button>

            <button
              onClick={() => setShowBlockerModal(true)}
              style={{
                padding: '10px 16px',
                background: '#ffffff',
                color: '#ef4444',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#fef2f2';
                e.target.style.borderColor = '#ef4444';
              }}
              onMouseOut={(e) => {
                e.target.style.background = '#ffffff';
                e.target.style.borderColor = '#fecaca';
              }}
            >
              Add Blocker
            </button>
          </>
        )}
      </div>

      {/* Progress Modal */}
      {showProgressModal && (
        <Modal onClose={() => setShowProgressModal(false)}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600, color: '#111827' }}>
            Update Progress
          </h3>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
              Progress: {newProgress}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={newProgress}
              onChange={(e) => setNewProgress(parseInt(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowProgressModal(false)}
              style={{
                padding: '10px 16px',
                background: '#ffffff',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateProgress}
              style={{
                padding: '10px 16px',
                background: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Update
            </button>
          </div>
        </Modal>
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <Modal onClose={() => setShowStatusModal(false)}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600, color: '#111827' }}>
            Change Status
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {['todo', 'in_progress', 'review', 'on_hold', 'completed', 'cancelled'].map(status => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                style={{
                  padding: '12px',
                  background: task.status === status ? '#eff6ff' : '#ffffff',
                  color: '#374151',
                  border: task.status === status ? '2px solid #3b82f6' : '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                {getStatusConfig(status).label}
              </button>
            ))}
          </div>

          {/* Hold Reason - Always show if selecting on_hold */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
              Hold Reason <span style={{ color: '#9ca3af' }}>(Optional - for On Hold status)</span>
            </label>
            <textarea
              value={holdReason}
              onChange={(e) => setHoldReason(e.target.value)}
              placeholder="Enter reason if moving to On Hold..."
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
                fontFamily: 'inherit',
                resize: 'vertical',
                minHeight: '80px'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowStatusModal(false)}
              style={{
                padding: '10px 16px',
                background: '#ffffff',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* Blocker Modal */}
      {showBlockerModal && (
        <Modal onClose={() => setShowBlockerModal(false)}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600, color: '#111827' }}>
            Add Blocker
          </h3>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
              Blocker Description
            </label>
            <textarea
              value={blockerDesc}
              onChange={(e) => setBlockerDesc(e.target.value)}
              placeholder="Describe the blocker..."
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
                fontFamily: 'inherit',
                resize: 'vertical',
                minHeight: '80px'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowBlockerModal(false)}
              style={{
                padding: '10px 16px',
                background: '#ffffff',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAddBlocker}
              style={{
                padding: '10px 16px',
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Add Blocker
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

const Modal = ({ children, onClose }) => (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}
    onClick={onClose}
  >
    <div
      style={{
        background: '#ffffff',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
);

export default TaskCard;
