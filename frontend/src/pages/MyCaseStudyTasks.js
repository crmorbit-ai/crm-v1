import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import io from 'socket.io-client';
import CreateTaskModal from '../components/CreateTaskModal';
import TaskCard from '../components/TaskCard';
import TaskTable from '../components/TaskTable';
import { useAuth } from '../context/AuthContext';
import SaasLayout from '../components/layout/SaasLayout';
import { API_URL } from '../config/api.config';

const MyCaseStudyTasks = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [allAdmins, setAllAdmins] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [globalFilter, setGlobalFilter] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const isPrimaryAdmin = user?.userType === 'SAAS_OWNER';

  useEffect(() => {
    if (isPrimaryAdmin) {
      fetchAllAdmins();
    } else {
      fetchMyTasks();
    }

    const token = localStorage.getItem('token');
    const socket = io(API_URL, { auth: { token } });
    const userData = JSON.parse(localStorage.getItem('user') || '{}');

    socket.on(`task-assigned-${userData._id}`, () => {
      if (isPrimaryAdmin) fetchAllAdmins();
      else fetchMyTasks();
    });
    socket.on('task-status-changed', () => {
      if (isPrimaryAdmin) fetchAllAdmins();
      else fetchMyTasks();
    });

    return () => socket.disconnect();
  }, []);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const params = activeTab !== 'all' ? { status: activeTab } : {};
      const data = await api.get('/case-study-tasks/my-tasks', { params });
      setTasks(data.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAdmins = async () => {
    try {
      setLoading(true);

      // Fetch all SAAS admins
      const usersData = await api.get('/auth/saas-admins');
      const adminUsers = usersData.data || [];

      // Fetch all tasks
      const tasksData = await api.get('/case-study-tasks');
      const allTasks = tasksData.data || [];

      // Create admin map with task stats
      const adminsWithStats = adminUsers.map(admin => {
        const userTasks = allTasks.filter(t => t.assignedTo?._id === admin._id);

        const stats = {
          total: userTasks.length,
          todo: userTasks.filter(t => t.status === 'todo').length,
          inProgress: userTasks.filter(t => t.status === 'in_progress').length,
          review: userTasks.filter(t => t.status === 'review').length,
          onHold: userTasks.filter(t => t.status === 'on_hold').length,
          completed: userTasks.filter(t => t.status === 'completed').length,
          overdue: userTasks.filter(t => {
            // Only count as overdue if deadline is explicitly set AND crossed
            if (!t.deadline) return false;
            return new Date() > new Date(t.deadline) && t.status !== 'completed';
          }).length,
          activeTime: userTasks
            .filter(t => t.timeTracking?.timerRunning)
            .reduce((acc, t) => acc + (t.timeTracking?.totalTimeSpent || 0), 0)
        };

        return {
          ...admin,
          tasks: userTasks,
          stats
        };
      });

      setAllAdmins(adminsWithStats);
    } catch (err) {
      console.error('Error fetching admins:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTasks = async (userId) => {
    try {
      const data = await api.get('/case-study-tasks');
      const userTasks = data.data.filter(t => t.assignedTo?._id === userId);
      return userTasks;
    } catch (err) {
      console.error('Error fetching user tasks:', err);
      return [];
    }
  };

  const handleUserClick = async (admin) => {
    setSelectedUser(admin);
    setActiveTab('all');
  };

  const getFilteredTasks = () => {
    if (!selectedUser || !selectedUser.tasks) return [];

    let filtered = selectedUser.tasks;

    if (activeTab !== 'all') {
      filtered = filtered.filter(t => t.status === activeTab);
    }

    return filtered;
  };

  const filteredTasks = getFilteredTasks();

  // SAAS Admin View (Normal)
  if (!isPrimaryAdmin) {
    return (
      <SaasLayout title="My Tasks">
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                My Tasks
              </h1>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                Track your work with smart progress monitoring
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                background: '#3b82f6',
                color: 'white',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              + New Task
            </button>
          </div>

          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '24px',
            borderBottom: '1px solid #e5e7eb',
            overflowX: 'auto'
          }}>
            {[
              { key: 'all', label: 'All Tasks', count: tasks.length },
              { key: 'todo', label: 'To Do', count: tasks.filter(t => t.status === 'todo').length },
              { key: 'in_progress', label: 'In Progress', count: tasks.filter(t => t.status === 'in_progress').length },
              { key: 'review', label: 'Review', count: tasks.filter(t => t.status === 'review').length },
              { key: 'on_hold', label: 'On Hold', count: tasks.filter(t => t.status === 'on_hold').length },
              { key: 'completed', label: 'Completed', count: tasks.filter(t => t.status === 'completed').length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  background: 'transparent',
                  color: activeTab === tab.key ? '#3b82f6' : '#6b7280',
                  fontWeight: activeTab === tab.key ? 600 : 500,
                  fontSize: '14px',
                  cursor: 'pointer',
                  borderBottom: activeTab === tab.key ? '2px solid #3b82f6' : '2px solid transparent',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
              Loading tasks...
            </div>
          ) : tasks.filter(t => activeTab === 'all' || t.status === activeTab).length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              background: '#f9fafb',
              borderRadius: '8px',
              border: '1px dashed #d1d5db'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                No tasks yet
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Create your first task to get started
              </div>
            </div>
          ) : (
            <TaskTable
              tasks={tasks.filter(t => activeTab === 'all' || t.status === activeTab)}
              onUpdate={fetchMyTasks}
              isPrimaryAdmin={false}
            />
          )}

          {showCreateModal && (
            <CreateTaskModal
              show={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onSuccess={fetchMyTasks}
            />
          )}
        </div>
      </SaasLayout>
    );
  }

  // Calculate global stats
  const globalStats = {
    totalMembers: allAdmins.length,
    totalTasks: allAdmins.reduce((acc, admin) => acc + admin.stats.total, 0),
    todo: allAdmins.reduce((acc, admin) => acc + admin.stats.todo, 0),
    inProgress: allAdmins.reduce((acc, admin) => acc + admin.stats.inProgress, 0),
    review: allAdmins.reduce((acc, admin) => acc + admin.stats.review, 0),
    onHold: allAdmins.reduce((acc, admin) => acc + admin.stats.onHold, 0),
    completed: allAdmins.reduce((acc, admin) => acc + admin.stats.completed, 0),
    overdue: allAdmins.reduce((acc, admin) => acc + admin.stats.overdue, 0)
  };

  // Primary Admin View - Full Page User Grid + Slide-in Panel
  return (
    <SaasLayout title="Team Tasks">
      <div style={{ position: 'relative', minHeight: 'calc(100vh - 80px)', background: '#f9fafb' }}>
        {/* Header - Full Width */}
        <div style={{ padding: '24px 24px 0 24px', background: '#f9fafb' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
            Team Tasks Monitor
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
            Monitor all team members and their task progress in real-time
          </p>
        </div>

        {/* Global Stats Bar - ALWAYS Full Width */}
        <div style={{
          padding: '0 24px 24px 24px',
          background: '#f9fafb'
        }}>
          <div style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'nowrap',
            overflowX: 'auto'
          }}>
            <div
              onClick={() => setGlobalFilter(null)}
              onMouseEnter={(e) => e.currentTarget.style.background = '#ffffff'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
              style={{
                flex: '1 1 0',
                minWidth: '140px',
                background: '#ffffff',
                border: globalFilter === null ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#3b82f6' }}>
                {globalStats.totalMembers}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500, marginTop: '8px' }}>Total Members</div>
            </div>

            <div
              onClick={() => setGlobalFilter(null)}
              onMouseEnter={(e) => e.currentTarget.style.background = '#ffffff'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
              style={{
                flex: '1 1 0',
                minWidth: '140px',
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#111827' }}>
                {globalStats.totalTasks}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500, marginTop: '8px' }}>Total Tasks</div>
            </div>

            <div
              onClick={() => setGlobalFilter('todo')}
              onMouseEnter={(e) => e.currentTarget.style.background = '#ffffff'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
              style={{
                flex: '1 1 0',
                minWidth: '140px',
                background: '#ffffff',
                border: globalFilter === 'todo' ? '2px solid #64748b' : '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#64748b' }}>
                {globalStats.todo}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500, marginTop: '8px' }}>To Do</div>
            </div>

            <div
              onClick={() => setGlobalFilter('in_progress')}
              onMouseEnter={(e) => e.currentTarget.style.background = '#ffffff'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
              style={{
                flex: '1 1 0',
                minWidth: '140px',
                background: '#ffffff',
                border: globalFilter === 'in_progress' ? '2px solid #0ea5e9' : '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#0ea5e9' }}>
                {globalStats.inProgress}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500, marginTop: '8px' }}>In Progress</div>
            </div>

            <div
              onClick={() => setGlobalFilter('on_hold')}
              onMouseEnter={(e) => e.currentTarget.style.background = '#ffffff'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
              style={{
                flex: '1 1 0',
                minWidth: '140px',
                background: '#ffffff',
                border: globalFilter === 'on_hold' ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#f59e0b' }}>
                {globalStats.onHold}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500, marginTop: '8px' }}>On Hold</div>
            </div>

            <div
              onClick={() => setGlobalFilter('completed')}
              onMouseEnter={(e) => e.currentTarget.style.background = '#ffffff'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
              style={{
                flex: '1 1 0',
                minWidth: '140px',
                background: '#ffffff',
                border: globalFilter === 'completed' ? '2px solid #22c55e' : '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#22c55e' }}>
                {globalStats.completed}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500, marginTop: '8px' }}>Completed</div>
            </div>
          </div>
        </div>

        {/* User Grid - Separate Section */}
        <div style={{
          padding: '0 24px 24px 24px',
          transition: 'margin-right 0.3s ease',
          marginRight: selectedUser ? '600px' : '0',
          background: '#f9fafb'
        }}>

          {/* User Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
              Loading team members...
            </div>
          ) : allAdmins.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              background: '#f9fafb',
              borderRadius: '8px',
              border: '1px dashed #d1d5db'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                No team members yet
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Create SAAS admins to see them here
              </div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px'
            }}>
              {allAdmins
                .filter(admin => {
                  if (!globalFilter) return true;
                  if (globalFilter === 'overdue') return admin.stats.overdue > 0;
                  if (globalFilter === 'todo') return admin.stats.todo > 0;
                  if (globalFilter === 'in_progress') return admin.stats.inProgress > 0;
                  if (globalFilter === 'on_hold') return admin.stats.onHold > 0;
                  if (globalFilter === 'completed') return admin.stats.completed > 0;
                  return true;
                })
                .map(admin => (
                <div
                  key={admin._id}
                  onClick={() => handleUserClick(admin)}
                  style={{
                    background: '#ffffff',
                    border: selectedUser?._id === admin._id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: selectedUser?._id === admin._id
                      ? '0 4px 12px rgba(59, 130, 246, 0.15)'
                      : '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedUser?._id !== admin._id) {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedUser?._id !== admin._id) {
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {/* User Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '12px',
                      background: '#3b82f6',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      fontWeight: 700
                    }}>
                      {admin.email?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#111827',
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {admin.email}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        {admin.stats.total} task{admin.stats.total !== 1 ? 's' : ''} total
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      padding: '12px',
                      background: '#eff6ff',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: '#0ea5e9', marginBottom: '4px' }}>
                        {admin.stats.inProgress}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500 }}>In Progress</div>
                    </div>
                    <div style={{
                      padding: '12px',
                      background: '#f0fdf4',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: '#22c55e', marginBottom: '4px' }}>
                        {admin.stats.completed}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500 }}>Completed</div>
                    </div>
                  </div>

                  {/* Additional Stats Row */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px',
                    background: '#f9fafb',
                    borderRadius: '8px'
                  }}>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#64748b' }}>
                        {admin.stats.todo}
                      </div>
                      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>To Do</div>
                    </div>
                    <div style={{ textAlign: 'center', flex: 1, borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#f59e0b' }}>
                        {admin.stats.review}
                      </div>
                      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>Review</div>
                    </div>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#ef4444' }}>
                        {admin.stats.overdue}
                      </div>
                      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>Overdue</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Slide-in Panel */}
        {selectedUser && (
          <>
            {/* Overlay - User grid area only */}
            <div
              onClick={() => setSelectedUser(null)}
              style={{
                position: 'fixed',
                top: '340px',
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.3)',
                zIndex: 999,
                animation: 'fadeIn 0.3s ease'
              }}
            />

            {/* Panel - Aligned with user grid */}
            <div style={{
              position: 'fixed',
              top: '340px',
              right: 0,
              width: '600px',
              height: 'calc(100vh - 340px)',
              background: '#ffffff',
              boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
              borderTopLeftRadius: '12px',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideIn 0.3s ease',
              overflow: 'hidden'
            }}>
              {/* Panel Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e5e7eb',
                background: '#ffffff'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: 700
                    }}>
                      {selectedUser.email?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                        {selectedUser.email}
                      </h3>
                      <p style={{ fontSize: '13px', color: '#6b7280' }}>
                        {selectedUser.stats.total} total tasks
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb',
                      background: '#ffffff',
                      color: '#6b7280',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      transition: 'all 0.2s'
                    }}
                  >
                    ×
                  </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                  {[
                    { key: 'all', label: 'All', count: selectedUser.tasks.length },
                    { key: 'in_progress', label: 'Active', count: selectedUser.stats.inProgress },
                    { key: 'review', label: 'Review', count: selectedUser.stats.review },
                    { key: 'completed', label: 'Done', count: selectedUser.stats.completed }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      style={{
                        padding: '8px 14px',
                        border: 'none',
                        background: activeTab === tab.key ? '#3b82f6' : '#ffffff',
                        color: activeTab === tab.key ? '#ffffff' : '#6b7280',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Tasks List */}
              <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
                {filteredTasks.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: '#6b7280'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                      No tasks found
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      Try a different filter
                    </div>
                  </div>
                ) : (
                  <TaskTable
                    tasks={filteredTasks}
                    onUpdate={fetchAllAdmins}
                    isPrimaryAdmin={true}
                  />
                )}
              </div>
            </div>
          </>
        )}

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>
      </div>
    </SaasLayout>
  );
};

export default MyCaseStudyTasks;
