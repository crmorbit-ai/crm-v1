const { hasPermission, hasAnyPermission, hasAllPermissions } = require('../utils/permissions');
const { errorResponse } = require('../utils/response');

/**
 * Require specific permission
 * @param {String} feature - Feature slug
 * @param {String} action - Action type
 */
const requirePermission = (feature, action) => {
  return (req, res, next) => {
    // Support array of features (any one of them)
    if (Array.isArray(feature)) {
      const hasAny = feature.some(f => hasPermission(req.user, f, action));
      if (!hasAny) {
        return errorResponse(res, 403, `Permission denied: requires one of [${feature.join(', ')}].${action}`);
      }
      return next();
    }

    // Build context from request body OR query params for contextual permissions
    const context = {
      relatedTo: req.body?.relatedTo || req.query?.relatedTo,
      relatedToId: req.body?.relatedToId || req.query?.relatedToId
    };

    if (!hasPermission(req.user, feature, action, context)) {
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
