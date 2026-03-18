const Notification = require('../models/Notification');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');

// GET /api/notifications — tenant user apni notifications
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, isRead } = req.query;
    const isSaas = req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN';

    let query = {};

    if (isSaas) {
      // SaaS admin: saari tenants ki notifications
      query.forSaasAdmin = true;
      if (req.query.tenantId) query.tenant = req.query.tenantId;
    } else {
      // Tenant user: apni hi notifications
      query.tenant = req.user.tenant;
      query.userId = req.user._id;
    }

    if (type) query.type = type;
    if (isRead !== undefined) query.isRead = isRead === 'true';

    console.log('🔔 GET NOTIFS query:', JSON.stringify(query));
    const total = await Notification.countDocuments(query);
    console.log('🔔 GET NOTIFS total found:', total);
    const notifications = await Notification.find(query)
      .populate('userId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('tenant', 'organizationName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    successResponse(res, 200, 'Notifications fetched successfully', {
      notifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('getNotifications error:', err);
    errorResponse(res, 500, 'Server error');
  }
};

// GET /api/notifications/unread-count
const getUnreadCount = async (req, res) => {
  try {
    const isSaas = req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN';

    let query = { isRead: false };

    if (isSaas) {
      query.forSaasAdmin = true;
    } else {
      query.tenant = req.user.tenant;
      query.userId = req.user._id;
    }

    const count = await Notification.countDocuments(query);
    successResponse(res, 200, 'Unread count fetched', { count });
  } catch (err) {
    console.error('getUnreadCount error:', err);
    errorResponse(res, 500, 'Server error');
  }
};

// PATCH /api/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    const isSaas = req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN';
    const notif = await Notification.findById(req.params.id);

    if (!notif) return errorResponse(res, 404, 'Notification not found');

    if (!isSaas && notif.userId?.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Access denied');
    }

    notif.isRead = true;
    await notif.save();

    successResponse(res, 200, 'Marked as read', notif);
  } catch (err) {
    console.error('markAsRead error:', err);
    errorResponse(res, 500, 'Server error');
  }
};

// PATCH /api/notifications/read-all
const markAllAsRead = async (req, res) => {
  try {
    const isSaas = req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN';

    let query = { isRead: false };

    if (isSaas) {
      query.forSaasAdmin = true;
    } else {
      query.tenant = req.user.tenant;
      query.userId = req.user._id;
    }

    await Notification.updateMany(query, { $set: { isRead: true } });

    successResponse(res, 200, 'All marked as read');
  } catch (err) {
    console.error('markAllAsRead error:', err);
    errorResponse(res, 500, 'Server error');
  }
};

// DELETE /api/notifications/:id
const deleteNotification = async (req, res) => {
  try {
    const isSaas = req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN';
    const notif = await Notification.findById(req.params.id);

    if (!notif) return errorResponse(res, 404, 'Notification not found');

    if (!isSaas && notif.userId?.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Access denied');
    }

    await notif.deleteOne();
    successResponse(res, 200, 'Notification deleted');
  } catch (err) {
    console.error('deleteNotification error:', err);
    errorResponse(res, 500, 'Server error');
  }
};

// GET /api/notifications/preferences
const getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notificationPreferences').lean();
    if (!user) return errorResponse(res, 404, 'User not found');
    // Return stored prefs or defaults
    const prefs = user.notificationPreferences || {};
    const defaults = {
      taskNotifications: true, leadNotifications: true, opportunityNotifications: true,
      supportTicketNotifications: true, meetingReminders: true, contactNotifications: true,
      accountNotifications: true, invoiceNotifications: true, emailNotifications: false
    };
    successResponse(res, 200, 'Preferences fetched', { ...defaults, ...prefs });
  } catch (err) {
    console.error('getPreferences error:', err);
    errorResponse(res, 500, 'Server error');
  }
};

// PUT /api/notifications/preferences
const updatePreferences = async (req, res) => {
  try {
    const allowed = [
      'taskNotifications', 'leadNotifications', 'opportunityNotifications',
      'supportTicketNotifications', 'meetingReminders', 'contactNotifications',
      'accountNotifications', 'invoiceNotifications', 'emailNotifications'
    ];
    const update = {};
    allowed.forEach(k => {
      if (k in req.body) update[`notificationPreferences.${k}`] = Boolean(req.body[k]);
    });
    await User.findByIdAndUpdate(req.user._id, { $set: update });
    successResponse(res, 200, 'Preferences updated');
  } catch (err) {
    console.error('updatePreferences error:', err);
    errorResponse(res, 500, 'Server error');
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreferences,
  updatePreferences
};
