import React, { useState } from 'react';
import api from '../services/api';

const CreateTaskModal = ({ show, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    topic: '',
    taskType: 'general',
    priority: 'medium',
    complexity: 'medium',
    estimatedHours: '',
    deadline: '',
    reminderBefore: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.topic) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      await api.post('/case-study-tasks', formData);

      // Reset form
      setFormData({
        title: '',
        description: '',
        topic: '',
        taskType: 'general',
        priority: 'medium',
        complexity: 'medium',
        estimatedHours: '',
        deadline: '',
        reminderBefore: '',
        tags: ''
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
      alert(error.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }} onClick={onClose}>
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid #e5e7eb',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          color: '#ffffff',
          borderRadius: '12px 12px 0 0'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>
            ➕ Create New Task
          </h2>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
            Create tasks for sales, support, follow-ups, meetings, and more
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
          {/* Task Type & Topic */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            {/* Task Type */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '8px'
              }}>
                Task Type <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={formData.taskType}
                onChange={(e) => handleChange('taskType', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer',
                  background: '#ffffff'
                }}
                required
              >
                <option value="general">📋 General Task</option>
                <option value="sales">💰 Sales</option>
                <option value="follow_up">📞 Follow-up</option>
                <option value="meeting">🤝 Meeting</option>
                <option value="support">🎧 Support</option>
                <option value="lead_nurture">🌱 Lead Nurture</option>
                <option value="deal_closure">🎯 Deal Closure</option>
                <option value="customer_onboarding">👋 Customer Onboarding</option>
                <option value="product_demo">🖥️ Product Demo</option>
                <option value="case_study">📚 Case Study</option>
                <option value="documentation">📝 Documentation</option>
                <option value="training">🎓 Training</option>
              </select>
            </div>

            {/* Topic/Category */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '8px'
              }}>
                Topic/Category <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => handleChange('topic', e.target.value)}
                placeholder="e.g., Q1 Sales Campaign"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                required
              />
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '8px'
            }}>
              Task Title <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., Call ABC Corp for deal closure discussion"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              required
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '8px'
            }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Detailed notes, agenda, requirements, expected outcomes..."
              rows="4"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Priority & Complexity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            {/* Priority */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '8px'
              }}>
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer',
                  background: '#ffffff'
                }}
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🟠 High</option>
                <option value="urgent">🔴 Urgent</option>
              </select>
            </div>

            {/* Complexity */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '8px'
              }}>
                Complexity
              </label>
              <select
                value={formData.complexity}
                onChange={(e) => handleChange('complexity', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer',
                  background: '#ffffff'
                }}
              >
                <option value="easy">⭐ Easy</option>
                <option value="medium">⭐⭐ Medium</option>
                <option value="hard">⭐⭐⭐ Hard</option>
                <option value="expert">⭐⭐⭐⭐ Expert</option>
              </select>
            </div>
          </div>

          {/* Deadline & Reminder */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            {/* Deadline */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '8px'
              }}>
                Deadline
              </label>
              <input
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => handleChange('deadline', e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            {/* Reminder */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '8px'
              }}>
                Reminder Before
              </label>
              <select
                value={formData.reminderBefore}
                onChange={(e) => handleChange('reminderBefore', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer',
                  background: '#ffffff'
                }}
              >
                <option value="">No Reminder</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
                <option value="1440">1 day</option>
                <option value="2880">2 days</option>
              </select>
            </div>

            {/* Estimated Hours */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '8px'
              }}>
                Est. Time (hours)
              </label>
              <input
                type="number"
                value={formData.estimatedHours}
                onChange={(e) => handleChange('estimatedHours', e.target.value)}
                placeholder="e.g., 2"
                min="0"
                step="0.5"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          </div>

          {/* Tags */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '8px'
            }}>
              Tags <span style={{ color: '#6b7280', fontWeight: 400, fontSize: '12px' }}>(comma-separated)</span>
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => handleChange('tags', e.target.value)}
              placeholder="e.g., urgent, high-value, follow-up-required"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px 24px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                background: 'white',
                color: '#6b7280',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                background: loading ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                fontWeight: 700,
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(59,130,246,0.3)'
              }}
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
