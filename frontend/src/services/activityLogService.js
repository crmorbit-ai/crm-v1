import api from './api';

export const activityLogService = {
  // Get all activity logs
  getActivityLogs: async (params) => {
    const response = await api.get('/activity-logs', { params });
    return response;
  },

  // Get single activity log
  getActivityLog: async (id) => {
    const response = await api.get(`/activity-logs/${id}`);
    return response;
  },

  // Get activity statistics
  getActivityStats: async () => {
    const response = await api.get('/activity-logs/stats');
    return response;
  },

  // Export to Excel
  exportActivityLogs: async (params) => {
    const response = await api.get('/activity-logs/export', {
      params,
      responseType: 'blob'
    });

    // Create download link
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `activity_logs_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true };
  },

  // Get audit report (edit changes only)
  getAuditReport: async (params) => {
    const response = await api.get('/activity-logs/audit-report', { params });
    return response;
  },

  // Export audit report
  exportAuditReport: async (params) => {
    const response = await api.get('/activity-logs/audit-report/export', {
      params,
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true };
  },

  // Get login report
  getLoginReport: async (params) => {
    const response = await api.get('/activity-logs/login-report', { params });
    return response;
  },

  // Export login report
  exportLoginReport: async (params) => {
    const response = await api.get('/activity-logs/login-report/export', {
      params,
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `login_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true };
  }
};