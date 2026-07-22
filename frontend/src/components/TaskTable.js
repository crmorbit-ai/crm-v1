import React, { useState, useEffect } from 'react';
import api from '../services/api';
import TaskDetailModal from './TaskDetailModal';

const TaskTable = ({ tasks, onUpdate, isPrimaryAdmin = false }) => {
  const [, forceUpdate] = useState({});
  const [showStatusModal, setShowStatusModal] = useState(null);
  const [holdReason, setHoldReason] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Force re-render every second for live timer
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate({});
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const handleStartTask = async (taskId) => {
    try {
      await api.post(`/case-study-tasks/${taskId}/start`, {});
      onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start task');
    }
  };

  const handlePauseTask = async (taskId) => {
    try {
      await api.post(`/case-study-tasks/${taskId}/pause`, {});
      onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to pause task');
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await api.patch(`/case-study-tasks/${taskId}/status`, { status: 'completed' });
      onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete task');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      // If selecting "on_hold", show modal for reason
      if (newStatus === 'on_hold') {
        setShowStatusModal(taskId);
        return;
      }

      const payload = { status: newStatus };
      await api.patch(`/case-study-tasks/${taskId}/status`, payload);
      onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to change status');
    }
  };

  const handleHoldSubmit = async (taskId) => {
    try {
      const payload = {
        status: 'on_hold',
        holdReason: holdReason || 'No reason provided'
      };
      await api.patch(`/case-study-tasks/${taskId}/status`, payload);
      setShowStatusModal(null);
      setHoldReason('');
      onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to put task on hold');
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getLiveTime = (task) => {
    let totalSeconds = task.timeTracking?.totalTimeSpent || 0;
    if (task.timeTracking?.timerRunning && task.timeTracking?.startedAt) {
      const startedAt = new Date(task.timeTracking.startedAt);
      const now = new Date();
      const elapsedSeconds = Math.floor((now - startedAt) / 1000);
      totalSeconds += elapsedSeconds;
    }
    return formatTime(totalSeconds);
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

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#22c55e',
      medium: '#f59e0b',
      high: '#f97316',
      urgent: '#ef4444'
    };
    return colors[priority] || colors.medium;
  };

  return (
    <>
      {/* Task Detail Modal */}
      <TaskDetailModal
        taskId={selectedTaskId}
        show={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdate={onUpdate}
      />

      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '13px'
        }}>
          {/* Header */}
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <th style={headerStyle}>Task</th>
              <th style={headerStyle}>Status</th>
              <th style={headerStyle}>Priority</th>
              <th style={headerStyle}>Progress</th>
              <th style={headerStyle}>Time Elapsed</th>
              <th style={headerStyle}>Estimated</th>
              <th style={headerStyle}>Remaining</th>
              {isPrimaryAdmin && <th style={headerStyle}>Assigned To</th>}
              <th style={headerStyle}>Actions</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td
                  colSpan={isPrimaryAdmin ? 9 : 8}
                  style={{
                    padding: '60px',
                    textAlign: 'center',
                    color: '#6b7280',
                    background: '#f9fafb'
                  }}
                >
                  No tasks found
                </td>
              </tr>
            ) : (
              tasks.map((task, index) => {
                const statusStyle = getStatusStyle(task.status);
                const actualHours = ((task.timeTracking?.totalTimeSpent || 0) / 3600).toFixed(1);
                const isOverBudget = task.estimatedHours && parseFloat(actualHours) >= task.estimatedHours;
                const isRunning = task.timeTracking?.timerRunning;

                return (
                  <tr
                    key={task._id}
                    onClick={() => setSelectedTaskId(task._id)}
                    style={{
                      borderBottom: index < tasks.length - 1 ? '1px solid #e5e7eb' : 'none',
                      background: isRunning ? '#f0f9ff' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      if (!isRunning) e.currentTarget.style.background = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      if (!isRunning) e.currentTarget.style.background = '#ffffff';
                    }}
                  >
                    {/* Task Name */}
                    <td style={{ ...cellStyle, maxWidth: '300px' }}>
                      <div style={{ fontWeight: 600, color: '#111827' }}>
                        {task.title}
                      </div>
                    </td>

                    {/* Status - Dropdown */}
                    <td style={{ ...cellStyle, position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                      {task.status === 'completed' || task.status === 'cancelled' ? (
                        // Show as badge for completed/cancelled
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 600
                        }}>
                          {statusStyle.text}
                        </span>
                      ) : (
                        // Dropdown for active tasks
                        <select
                          value={task.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleStatusChange(task._id, e.target.value);
                          }}
                          style={{
                            padding: '6px 12px',
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            border: `1px solid ${statusStyle.color}40`,
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            outline: 'none',
                            minWidth: '130px'
                          }}
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">In Review</option>
                          <option value="on_hold">On Hold</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      )}

                      {/* Hold Reason Modal */}
                      {showStatusModal === task._id && (
                        <>
                          {/* Backdrop */}
                          <div
                            onClick={() => {
                              setShowStatusModal(null);
                              setHoldReason('');
                            }}
                            style={{
                              position: 'fixed',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: 'rgba(0,0,0,0.5)',
                              zIndex: 9998
                            }}
                          />
                          {/* Modal */}
                          <div style={{
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            background: '#ffffff',
                            borderRadius: '12px',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                            zIndex: 9999,
                            width: '90%',
                            maxWidth: '500px',
                            padding: '24px'
                          }}>
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700, color: '#111827' }}>
                              Put Task on Hold
                            </h3>
                            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280' }}>
                              Please provide a reason for putting this task on hold:
                            </p>
                            <textarea
                              value={holdReason}
                              onChange={(e) => setHoldReason(e.target.value)}
                              placeholder="e.g., Waiting for client feedback..."
                              rows="4"
                              style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                outline: 'none',
                                resize: 'vertical',
                                marginBottom: '16px'
                              }}
                              autoFocus
                            />
                            <div style={{ display: 'flex', gap: '12px' }}>
                              <button
                                onClick={() => {
                                  setShowStatusModal(null);
                                  setHoldReason('');
                                }}
                                style={{
                                  flex: 1,
                                  padding: '10px 16px',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px',
                                  background: '#ffffff',
                                  color: '#6b7280',
                                  fontWeight: 600,
                                  fontSize: '14px',
                                  cursor: 'pointer'
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleHoldSubmit(task._id)}
                                style={{
                                  flex: 1,
                                  padding: '10px 16px',
                                  border: 'none',
                                  borderRadius: '8px',
                                  background: '#f59e0b',
                                  color: '#ffffff',
                                  fontWeight: 700,
                                  fontSize: '14px',
                                  cursor: 'pointer'
                                }}
                              >
                                Put on Hold
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </td>

                    {/* Priority */}
                    <td style={cellStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: getPriorityColor(task.priority)
                        }} />
                        <span style={{ textTransform: 'capitalize' }}>{task.priority}</span>
                      </div>
                    </td>

                    {/* Progress */}
                    <td style={cellStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          flex: 1,
                          height: '6px',
                          background: '#e5e7eb',
                          borderRadius: '3px',
                          overflow: 'hidden',
                          minWidth: '60px'
                        }}>
                          <div style={{
                            width: `${task.progress || 0}%`,
                            height: '100%',
                            background: task.progress === 100 ? '#22c55e' : '#3b82f6',
                            transition: 'width 0.3s'
                          }} />
                        </div>
                        <span style={{ fontWeight: 600, minWidth: '35px' }}>{task.progress || 0}%</span>
                      </div>
                    </td>

                    {/* Time Elapsed */}
                    <td style={cellStyle}>
                      <div style={{
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: isRunning ? '#0284c7' : '#111827'
                      }}>
                        {getLiveTime(task)}
                      </div>
                      {isRunning && (
                        <div style={{ fontSize: '10px', color: '#0284c7', marginTop: '2px' }}>
                          Running...
                        </div>
                      )}
                    </td>

                    {/* Estimated */}
                    <td style={cellStyle}>
                      <span style={{ fontWeight: 600 }}>{task.estimatedHours || 0}h</span>
                    </td>

                    {/* Remaining */}
                    <td style={cellStyle}>
                      <span style={{
                        fontWeight: 600,
                        color: isOverBudget ? '#ef4444' : '#6b7280'
                      }}>
                        {task.estimatedHours
                          ? Math.max(0, task.estimatedHours - parseFloat(actualHours)).toFixed(1)
                          : '--'}h
                      </span>
                    </td>

                    {/* Assigned To (Primary Admin only) */}
                    {isPrimaryAdmin && (
                      <td style={cellStyle}>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                          {task.assignedTo?.email || 'Unknown'}
                        </span>
                      </td>
                    )}

                    {/* Actions */}
                    <td style={{ ...cellStyle, whiteSpace: 'nowrap', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {task.status === 'todo' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartTask(task._id);
                            }}
                            style={actionButtonStyle('#22c55e')}
                            title="Start Task"
                          >
                            ▶
                          </button>
                        )}

                        {isRunning && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePauseTask(task._id);
                            }}
                            style={actionButtonStyle('#f59e0b')}
                            title="Pause"
                          >
                            ⏸
                          </button>
                        )}

                        {task.status === 'in_progress' && !isRunning && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartTask(task._id);
                            }}
                            style={actionButtonStyle('#22c55e')}
                            title="Resume"
                          >
                            ▶
                          </button>
                        )}

                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
};

const headerStyle = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: 700,
  color: '#374151',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  whiteSpace: 'nowrap'
};

const cellStyle = {
  padding: '16px',
  verticalAlign: 'middle',
  color: '#374151'
};

const actionButtonStyle = (color) => ({
  width: '32px',
  height: '32px',
  border: 'none',
  borderRadius: '6px',
  background: color,
  color: '#ffffff',
  fontSize: '14px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s'
});

const menuItemStyle = {
  width: '100%',
  padding: '10px 16px',
  border: 'none',
  background: 'transparent',
  textAlign: 'left',
  fontSize: '14px',
  color: '#374151',
  cursor: 'pointer',
  transition: 'background 0.15s',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontWeight: 500
};

export default TaskTable;
