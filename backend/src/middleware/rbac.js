const { hasPermission, hasAnyPermission, hasAllPermissions } = require('../utils/permissions');
const { errorResponse } = require('../utils/response');

/**
 * Require specific permission
 * @param {String} feature - Feature slug
 * @param {String} action - Action type
 */
const requirePermission = (feature, action) => {
  return (req, res, next) => {
    if (!hasPermission(req.user, feature, action)) {
      return errorResponse(res, 403, `Permission denied: ${feature}.${action}`);
    }
    next();
  };
};

/**
 * Require any of the specified permissions
 * @param {Array} permissions - Array of {feature, action} objects
 */
const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!hasAnyPermission(req.user, permissions)) {
      return errorResponse(res, 403, 'Insufficient permissions');
    }
    next();
  };
};

/**
 * Require all specified permissions
 * @param {Array} permissions - Array of {feature, action} objects
 */
const requireAllPermissions = (permissions) => {
  return (req, res, next) => {
    if (!hasAllPermissions(req.user, permissions)) {
      return errorResponse(res, 403, 'Insufficient permissions');
    }
    next();
  };
};

module.exports = {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions
};
