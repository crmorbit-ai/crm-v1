const Notification = require('../models/Notification');
const User = require('../models/User');

// Maps notification type prefix → notificationPreferences key
const TYPE_TO_PREF = {
  task:          'taskNotifications',
  lead:          'leadNotifications',
  opportunity:   'opportunityNotifications',
  support:       'supportTicketNotifications',
  meeting:       'meetingReminders',
  contact:       'contactNotifications',
  account:       'accountNotifications',
  invoice:       'invoiceNotifications',
  email:         'emailNotifications',
};

function getPrefKey(type) {
  if (!type) return null;
  const prefix = type.split('_')[0];
  return TYPE_TO_PREF[prefix] || null;
}

/**
 * Create a notification for a tenant user (and also visible to SaaS admin)
 *
 * @param {Object} params
 * @param {ObjectId} params.tenantId
 * @param {ObjectId|null} params.userId      - recipient user (null = no specific user)
 * @param {String}        params.type        - notification type enum
 * @param {String}        params.title
 * @param {String}        params.message
 * @param {String|null}   params.entityType
 * @param {ObjectId|null} params.entityId
 * @param {ObjectId|null} params.createdBy
 * @param {Boolean}       params.forSaasAdmin - default true
 */
const createNotification = async ({
  tenantId,
  userId = null,
  type,
  title,
  message,
  entityType = null,
  entityId = null,
  createdBy = null,
  forSaasAdmin = true
}) => {
  try {
    // Check recipient's notification preferences before creating
    if (userId) {
      const prefKey = getPrefKey(type);
      if (prefKey) {
        const recipient = await User.findById(userId).select('notificationPreferences').lean();
        if (recipient) {
          const prefs = recipient.notificationPreferences || {};
          // Default to true if preference not set yet
          const enabled = prefs[prefKey] !== undefined ? prefs[prefKey] : true;
          if (!enabled) {
            console.log(`🔔 Notification skipped (user preference off): type=${type}, prefKey=${prefKey}, userId=${userId}`);
            return null;
          }
        }
      }
    }

    console.log('🔔 Creating notification:', type, '| userId:', userId, '| tenant:', tenantId, '| forSaasAdmin:', forSaasAdmin);
    const notification = await Notification.create({
      tenant: tenantId,
      userId,
      type,
      title,
      message,
      entityType,
      entityId,
      createdBy,
      forSaasAdmin
    });

    // Emit real-time via socket.io if available
    if (global.io) {
      // Emit to tenant room
      global.io.to(`tenant-${tenantId}`).emit('new-notification', {
        _id: notification._id,
        type,
        title,
        message,
        entityType,
        entityId,
        createdAt: notification.createdAt
      });

      // Emit to saas-admin room
      if (forSaasAdmin) {
        global.io.to('saas-admin').emit('new-notification', {
          _id: notification._id,
          type,
          title,
          message,
          entityType,
          entityId,
          tenantId,
          createdAt: notification.createdAt
        });
      }
    }

    console.log('🔔 Notification created:', notification._id);
    return notification;
  } catch (err) {
    // Notification errors should never break the main flow
    console.error('🔔 notificationService.create ERROR:', err.message, '| data:', { type, userId, tenantId });
    return null;
  }
};

module.exports = { createNotification };
