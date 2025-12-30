import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { taskService } from '../services/taskService';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import '../styles/crm.css';

const Tasks = () => {
  const { hasPermission } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);

  const [formData, setFormData] = useState({
    subject: '',
    dueDate: '',
    status: 'Not Started',
    priority: 'Normal',
    description: ''
  });

  const statuses = [
    { name: 'Not Started', color: '#6B7280', icon: '⭕' },
    { name: 'Deferred', color: '#F59E0B', icon: '⏸️' },
    { name: 'In Progress', color: '#3B82F6', icon: '🔄' },
    { name: 'Completed', color: '#10B981', icon: '✅' },
    { name: 'Waiting for Input', color: '#8B5CF6', icon: '⏳' }
  ];

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await taskService.getTasks({ page: 1, limit: 100 });
      if (response?.success) {
        setTasks(response.data.tasks || []);
      }
    } catch (err) {
      console.error('Load tasks error:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await taskService.createTask({
        ...formData,
        relatedTo: 'Lead',
        relatedToId: '000000000000000000000000'
      });
      setSuccess('Task created!');
      setShowCreateModal(false);
      setFormData({ subject: '', dueDate: '', status: 'Not Started', priority: 'Normal', description: '' });
      loadTasks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to create task');
    }
  };

  const handleDragStart = (e, task) => {
    setDraggedItem(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.status === targetStatus) {
      setDraggedItem(null);
      return;
    }

    setTasks(prev =>
      prev.map(task =>
        task._id === draggedItem._id ? { ...task, status: targetStatus } : task
      )
    );

    try {
      await taskService.updateTask(draggedItem._id, { status: targetStatus });
    } catch (err) {
      console.error('Update failed:', err);
      loadTasks();
    }
    setDraggedItem(null);
  };

  const getTasksByStatus = (statusName) => {
    return tasks.filter(task => task.status === statusName);
  };

  const getPriorityColor = (priority) => {
    const colors = { 'High': '#EF4444', 'Normal': '#3B82F6', 'Low': '#6B7280' };
    return colors[priority] || '#6B7280';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  return (
    <DashboardLayout
      title="Tasks - Kanban View"
      actionButton={
        <button className="crm-btn crm-btn-primary" onClick={() => setShowCreateModal(true)}>
          + New Task
        </button>
      }
    >
      {success && <div className="alert-success">{success}</div>}
      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
      ) : (
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '20px 0', minHeight: '75vh' }}>
          {statuses.map(status => {
            const statusTasks = getTasksByStatus(status.name);

            return (
              <div
                key={status.name}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status.name)}
                style={{
                  minWidth: '280px',
                  maxWidth: '280px',
                  background: '#F9FAFB',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '16px' }}>{status.icon}</span>
                      <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: 0 }}>
                        {status.name}
                      </h3>
                    </div>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'white',
                      background: status.color,
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}>
                      {statusTasks.length}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
                  {statusTasks.length === 0 ? (
                    <div style={{
                      padding: '20px',
                      textAlign: 'center',
                      color: '#9CA3AF',
                      fontSize: '12px',
                      border: '2px dashed #E5E7EB',
                      borderRadius: '6px',
                      background: 'white'
                    }}>
                      No tasks
                    </div>
                  ) : (
                    statusTasks.map(task => (
                      <div
                        key={task._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        style={{
                          background: 'white',
                          borderRadius: '6px',
                          padding: '10px',
                          cursor: 'grab',
                          border: '1px solid #E5E7EB',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <h4 style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          marginBottom: '8px',
                          color: '#111827',
                          lineHeight: '1.3'
                        }}>
                          {task.subject}
                        </h4>

                        {task.relatedTo && task.relatedToId && (
                          <div style={{
                            fontSize: '11px',
                            color: '#3B82F6',
                            marginBottom: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#EFF6FF',
                            padding: '4px 8px',
                            borderRadius: '4px'
                          }}>
                            <span style={{ fontWeight: '600' }}>{task.relatedTo}:</span>
                            <span style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {task.relatedToId.companyName ||
                               `${task.relatedToId.firstName || ''} ${task.relatedToId.lastName || ''}`.trim() ||
                               task.relatedToId.name ||
                               task.relatedToId.title ||
                               'N/A'}
                            </span>
                          </div>
                        )}

                        {task.description && (
                          <p style={{
                            fontSize: '11px',
                            color: '#6B7280',
                            marginBottom: '8px',
                            lineHeight: '1.4',
                            maxHeight: '40px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {task.description}
                          </p>
                        )}

                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginTop: '8px',
                          paddingTop: '8px',
                          borderTop: '1px solid #F3F4F6',
                          gap: '8px'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                            <span style={{ fontSize: '10px', color: '#9CA3AF' }}>
                              📅 {formatDate(task.dueDate)}
                            </span>
                            {task.createdBy && (
                              <div style={{ fontSize: '10px' }}>
                                <div style={{ fontWeight: '600', color: '#1e3c72' }}>
                                  👤 {task.createdBy.firstName} {task.createdBy.lastName}
                                </div>
                                {task.createdBy.groups && task.createdBy.groups.length > 0 && (
                                  <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>
                                    📁 {task.createdBy.groups[0].name}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{
                              fontSize: '9px',
                              fontWeight: '600',
                              color: 'white',
                              background: getPriorityColor(task.priority),
                              padding: '2px 6px',
                              borderRadius: '8px'
                            }}>
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Task">
        <form onSubmit={handleCreate}>
          <div className="crm-form-group">
            <label>Subject *</label>
            <input
              type="text"
              className="crm-form-input"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
            />
          </div>
          <div className="crm-form-group">
            <label>Due Date *</label>
            <input
              type="date"
              className="crm-form-input"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              required
            />
          </div>
          <div className="crm-form-group">
            <label>Priority</label>
            <select
              className="crm-form-select"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            >
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div className="crm-form-group">
            <label>Description</label>
            <textarea
              className="crm-form-textarea"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="crm-btn crm-btn-secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </button>
            <button type="submit" className="crm-btn crm-btn-primary">Create</button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default Tasks;