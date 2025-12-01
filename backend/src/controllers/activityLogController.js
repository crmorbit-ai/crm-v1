const ActivityLog = require('../models/ActivityLog');
const { successResponse, errorResponse } = require('../utils/response');
const xlsx = require('xlsx');

/**
 * @desc    Get activity logs with filters
 * @route   GET /api/activity-logs
 * @access  Private (Admin only)
 */
const getActivityLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      user,
      action,
      resourceType,
      startDate,
      endDate,
      search
    } = req.query;

    // Build query
    let query = {};

    // Tenant filtering
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      query.tenant = req.user.tenant;
    } else if (req.query.tenant) {
      query.tenant = req.query.tenant;
    }

    // Filters
    if (user) query.user = user;
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Count total
    const total = await ActivityLog.countDocuments(query);

    // Get logs
    const logs = await ActivityLog.find(query)
      .populate('user', 'firstName lastName email')
      .populate('tenant', 'organizationName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    successResponse(res, 200, 'Activity logs retrieved successfully', {
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get activity log statistics
 * @route   GET /api/activity-logs/stats
 * @access  Private (Admin only)
 */
const getActivityStats = async (req, res) => {
  try {
    let query = {};
    
    // Tenant filtering
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      query.tenant = req.user.tenant;
    } else if (req.query.tenant) {
      query.tenant = req.query.tenant;
    }

    // Total activities
    const total = await ActivityLog.countDocuments(query);

    // Activities by action (top 10)
    const byAction = await ActivityLog.aggregate([
      { $match: query },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Activities by resource type
    const byResourceType = await ActivityLog.aggregate([
      { $match: query },
      { $group: { _id: '$resourceType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Activities by user (top 10)
    const byUserAgg = await ActivityLog.aggregate([
      { $match: query },
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Populate user details
    const User = require('../models/User');
    const byUser = await Promise.all(
      byUserAgg.map(async (item) => {
        if (item._id) {
          const user = await User.findById(item._id).select('firstName lastName email');
          return {
            user: user ? {
              _id: user._id,
              name: `${user.firstName} ${user.lastName}`,
              email: user.email
            } : null,
            count: item.count
          };
        }
        return { user: null, count: item.count };
      })
    );

    // Today's activities
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await ActivityLog.countDocuments({
      ...query,
      createdAt: { $gte: today }
    });

    // This week's activities
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekCount = await ActivityLog.countDocuments({
      ...query,
      createdAt: { $gte: weekStart }
    });

    // This month's activities
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthCount = await ActivityLog.countDocuments({
      ...query,
      createdAt: { $gte: monthStart }
    });

    successResponse(res, 200, 'Activity statistics retrieved successfully', {
      total,
      todayCount,
      weekCount,
      monthCount,
      byAction: byAction.map(item => ({ action: item._id, count: item.count })),
      byResourceType: byResourceType.map(item => ({ type: item._id, count: item.count })),
      byUser: byUser.filter(item => item.user !== null)
    });

  } catch (error) {
    console.error('Get activity stats error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Export activity logs to Excel
 * @route   GET /api/activity-logs/export
 * @access  Private (Admin only)
 */
const exportActivityLogs = async (req, res) => {
  try {
    const { user, action, resourceType, startDate, endDate } = req.query;

    // Build query
    let query = {};
    
    // Tenant filtering
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      query.tenant = req.user.tenant;
    } else if (req.query.tenant) {
      query.tenant = req.query.tenant;
    }

    if (user) query.user = user;
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Get all logs matching criteria (limit to 10000 for performance)
    const logs = await ActivityLog.find(query)
      .populate('user', 'firstName lastName email')
      .populate('tenant', 'organizationName')
      .sort({ createdAt: -1 })
      .limit(10000)
      .lean();

    // Prepare data for Excel
    const data = logs.map(log => ({
      'Date/Time': new Date(log.createdAt).toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      'User': log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System',
      'Email': log.user?.email || '',
      'Organization': log.tenant?.organizationName || 'N/A',
      'Action': log.action,
      'Resource Type': log.resourceType || '',
      'IP Address': log.ipAddress || '',
      'Request Method': log.requestMethod || '',
      'Request Path': log.requestPath || '',
      'Details': log.details ? JSON.stringify(log.details) : ''
    }));

    // Create workbook
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(data);

    // Set column widths
    const wscols = [
      { wch: 20 }, // Date/Time
      { wch: 20 }, // User
      { wch: 30 }, // Email
      { wch: 25 }, // Organization
      { wch: 20 }, // Action
      { wch: 15 }, // Resource Type
      { wch: 15 }, // IP Address
      { wch: 10 }, // Request Method
      { wch: 30 }, // Request Path
      { wch: 40 }  // Details
    ];
    worksheet['!cols'] = wscols;

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Activity Logs');

    // Generate buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers
    const filename = `activity_logs_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    return res.send(buffer);

  } catch (error) {
    console.error('Export activity logs error:', error);
    errorResponse(res, 500, 'Failed to export activity logs');
  }
};

/**
 * @desc    Get single activity log
 * @route   GET /api/activity-logs/:id
 * @access  Private (Admin only)
 */
const getActivityLog = async (req, res) => {
  try {
    const log = await ActivityLog.findById(req.params.id)
      .populate('user', 'firstName lastName email')
      .populate('tenant', 'organizationName');

    if (!log) {
      return errorResponse(res, 404, 'Activity log not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (log.tenant && log.tenant._id.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    successResponse(res, 200, 'Activity log retrieved successfully', log);
  } catch (error) {
    console.error('Get activity log error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get audit report (all edit changes with before/after values)
 * @route   GET /api/activity-logs/audit-report
 * @access  Private (Admin only)
 */
const getAuditReport = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      user,
      resourceType,
      startDate,
      endDate
    } = req.query;

    // Build query for edit operations only
    let query = {
      action: {
        $in: [
          'lead.updated', 'account.updated', 'contact.updated',
          'opportunity.updated', 'user.updated', 'permission.granted',
          'task.updated', 'meeting.updated', 'note.updated', 'call.updated'
        ]
      }
    };

    // Tenant filtering
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      query.tenant = req.user.tenant;
    } else if (req.query.tenant) {
      query.tenant = req.query.tenant;
    }

    // Filters
    if (user) query.user = user;
    if (resourceType) query.resourceType = resourceType;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Count total
    const total = await ActivityLog.countDocuments(query);

    // Get audit logs
    const auditLogs = await ActivityLog.find(query)
      .populate('user', 'firstName lastName email')
      .populate('tenant', 'organizationName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    successResponse(res, 200, 'Audit report retrieved successfully', {
      auditLogs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get audit report error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get login logs report
 * @route   GET /api/activity-logs/login-report
 * @access  Private (Admin only)
 */
const getLoginReport = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      user,
      startDate,
      endDate,
      actionType // 'login.success', 'login.failed', 'logout'
    } = req.query;

    // Build query for login/logout operations
    let query = {
      action: { $in: ['login.success', 'login.failed', 'logout'] }
    };

    // Specific action filter
    if (actionType) {
      query.action = actionType;
    }

    // Tenant filtering
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      query.tenant = req.user.tenant;
    } else if (req.query.tenant) {
      query.tenant = req.query.tenant;
    }

    // User filter
    if (user) query.user = user;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Count total
    const total = await ActivityLog.countDocuments(query);

    // Get login logs
    const loginLogs = await ActivityLog.find(query)
      .populate('user', 'firstName lastName email userType')
      .populate('tenant', 'organizationName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    // Get login statistics
    const stats = await ActivityLog.aggregate([
      { $match: query },
      { $group: { _id: '$action', count: { $sum: 1 } } }
    ]);

    const statsMap = {
      successfulLogins: 0,
      failedLogins: 0,
      logouts: 0
    };

    stats.forEach(stat => {
      if (stat._id === 'login.success') statsMap.successfulLogins = stat.count;
      if (stat._id === 'login.failed') statsMap.failedLogins = stat.count;
      if (stat._id === 'logout') statsMap.logouts = stat.count;
    });

    successResponse(res, 200, 'Login report retrieved successfully', {
      loginLogs,
      statistics: statsMap,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get login report error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Export audit report to Excel
 * @route   GET /api/activity-logs/audit-report/export
 * @access  Private (Admin only)
 */
const exportAuditReport = async (req, res) => {
  try {
    const { user, resourceType, startDate, endDate } = req.query;

    // Build query for edit operations only
    let query = {
      action: {
        $in: [
          'lead.updated', 'account.updated', 'contact.updated',
          'opportunity.updated', 'user.updated', 'permission.granted',
          'task.updated', 'meeting.updated', 'note.updated', 'call.updated'
        ]
      }
    };

    // Tenant filtering
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      query.tenant = req.user.tenant;
    } else if (req.query.tenant) {
      query.tenant = req.query.tenant;
    }

    if (user) query.user = user;
    if (resourceType) query.resourceType = resourceType;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Get all audit logs matching criteria (limit to 10000)
    const logs = await ActivityLog.find(query)
      .populate('user', 'firstName lastName email')
      .populate('tenant', 'organizationName')
      .sort({ createdAt: -1 })
      .limit(10000)
      .lean();

    // Prepare data for Excel
    const data = logs.map(log => ({
      'Date/Time': new Date(log.createdAt).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      'User': log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System',
      'Email': log.user?.email || '',
      'Organization': log.tenant?.organizationName || 'N/A',
      'Action': log.action,
      'Resource Type': log.resourceType || '',
      'Resource ID': log.resourceId || '',
      'Changes': log.details?.changes ? JSON.stringify(log.details.changes, null, 2) : '',
      'IP Address': log.ipAddress || ''
    }));

    // Create workbook
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(data);

    // Set column widths
    const wscols = [
      { wch: 20 }, // Date/Time
      { wch: 20 }, // User
      { wch: 30 }, // Email
      { wch: 25 }, // Organization
      { wch: 20 }, // Action
      { wch: 15 }, // Resource Type
      { wch: 25 }, // Resource ID
      { wch: 60 }, // Changes
      { wch: 15 }  // IP Address
    ];
    worksheet['!cols'] = wscols;

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Audit Report');

    // Generate buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers
    const filename = `audit_report_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    return res.send(buffer);

  } catch (error) {
    console.error('Export audit report error:', error);
    errorResponse(res, 500, 'Failed to export audit report');
  }
};

/**
 * @desc    Export login report to Excel
 * @route   GET /api/activity-logs/login-report/export
 * @access  Private (Admin only)
 */
const exportLoginReport = async (req, res) => {
  try {
    const { user, startDate, endDate, actionType } = req.query;

    // Build query
    let query = {
      action: { $in: ['login.success', 'login.failed', 'logout'] }
    };

    if (actionType) query.action = actionType;

    // Tenant filtering
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      query.tenant = req.user.tenant;
    } else if (req.query.tenant) {
      query.tenant = req.query.tenant;
    }

    if (user) query.user = user;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Get login logs (limit to 10000)
    const logs = await ActivityLog.find(query)
      .populate('user', 'firstName lastName email userType')
      .populate('tenant', 'organizationName')
      .sort({ createdAt: -1 })
      .limit(10000)
      .lean();

    // Prepare data for Excel
    const data = logs.map(log => ({
      'Date/Time': new Date(log.createdAt).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      'User': log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Unknown',
      'Email': log.user?.email || '',
      'User Type': log.user?.userType || '',
      'Organization': log.tenant?.organizationName || 'N/A',
      'Action': log.action,
      'IP Address': log.ipAddress || '',
      'User Agent': log.userAgent || ''
    }));

    // Create workbook
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(data);

    // Set column widths
    const wscols = [
      { wch: 20 }, // Date/Time
      { wch: 20 }, // User
      { wch: 30 }, // Email
      { wch: 15 }, // User Type
      { wch: 25 }, // Organization
      { wch: 15 }, // Action
      { wch: 15 }, // IP Address
      { wch: 50 }  // User Agent
    ];
    worksheet['!cols'] = wscols;

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Login Report');

    // Generate buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers
    const filename = `login_report_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    return res.send(buffer);

  } catch (error) {
    console.error('Export login report error:', error);
    errorResponse(res, 500, 'Failed to export login report');
  }
};

module.exports = {
  getActivityLogs,
  getActivityStats,
  exportActivityLogs,
  getActivityLog,
  getAuditReport,
  getLoginReport,
  exportAuditReport,
  exportLoginReport
};