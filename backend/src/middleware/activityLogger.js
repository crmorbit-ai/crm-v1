const ActivityLog = require('../models/ActivityLog');

/**
 * Log activity
 * @param {String} action - Action type
 * @param {String} resourceType - Resource type
 * @param {String} resourceId - Resource ID
 * @param {Object} details - Additional details
 */
const logActivity = async (req, action, resourceType = null, resourceId = null, details = null) => {
  try {
    await ActivityLog.create({
      user: req.user._id,
      tenant: req.user.tenant || null,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      requestMethod: req.method,
      requestPath: req.originalUrl
    });
  } catch (error) {
    console.error('Activity logging error:', error);
    // Don't throw error to avoid breaking the request
  }
};

/**
 * Middleware to automatically log activities
 * @param {String} action - Action type
 */
const autoLog = (action) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method
    res.json = function(data) {
      // Only log successful responses (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300 && data.success) {
        // Extract resource info from response data
        const resourceId = data.data?._id || data.data?.id || null;
        const resourceType = req.baseUrl.split('/').pop();

        logActivity(req, action, resourceType, resourceId, {
          response: data.message
        });
      }

      // Call original json method
      return originalJson(data);
    };

    next();
  };
};

module.exports = {
  logActivity,
  autoLog
};
