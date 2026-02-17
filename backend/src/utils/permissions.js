/**
 * Check if user has permission for a specific feature and action
 * @param {Object} user - User object with populated roles and groups
 * @param {String} feature - Feature slug
 * @param {String} action - Action type (create, read, update, delete, manage)
 * @returns {Boolean}
 */


const hasPermission = (user, feature, action) => {
  // SAAS_OWNER and SAAS_ADMIN have all permissions
  if (user.userType === 'SAAS_OWNER' || user.userType === 'SAAS_ADMIN') {
    return true;
  }

  // TENANT_ADMIN has all permissions within their tenant
  if (user.userType === 'TENANT_ADMIN') {
    return true;
  }

  // Check custom permissions first (highest priority)
  if (user.customPermissions && user.customPermissions.length > 0) {
    const customPerm = user.customPermissions.find(p => p.feature === feature);
    if (customPerm) {
      // If manage permission exists, grant all actions
      if (customPerm.actions.includes('manage')) {
        return true;
      }
      return customPerm.actions.includes(action);
    }
  }

  // Check role-based permissions (direct user roles)
  if (user.roles && user.roles.length > 0) {
    for (const role of user.roles) {
      const permission = role.permissions.find(p => p.feature === feature);
      if (permission) {
        // If manage permission exists, grant all actions
        if (permission.actions.includes('manage')) {
          return true;
        }
        if (permission.actions.includes(action)) {
          return true;
        }
      }
    }
  }

  // Check permissions inherited from groups
  if (user.groups && user.groups.length > 0) {
    for (const group of user.groups) {
      // Check if group has roles assigned
      if (group.roles && group.roles.length > 0) {
        for (const role of group.roles) {
          const permission = role.permissions.find(p => p.feature === feature);
          if (permission) {
            // If manage permission exists, grant all actions
            if (permission.actions.includes('manage')) {
              return true;
            }
            if (permission.actions.includes(action)) {
              return true;
            }
          }
        }
      }

      // Check group-level custom permissions
      if (group.groupPermissions && group.groupPermissions.length > 0) {
        const groupPerm = group.groupPermissions.find(p => p.feature === feature);
        if (groupPerm) {
          // If manage permission exists, grant all actions
          if (groupPerm.actions.includes('manage')) {
            return true;
          }
          if (groupPerm.actions.includes(action)) {
            return true;
          }
        }
      }
    }
  }

  return false;
};

/**
 * Check if user has any of the specified permissions
 * @param {Object} user - User object
 * @param {Array} permissions - Array of {feature, action} objects
 * @returns {Boolean}
 */
const hasAnyPermission = (user, permissions) => {
  return permissions.some(perm => hasPermission(user, perm.feature, perm.action));
};

/**
 * Check if user has all specified permissions
 * @param {Object} user - User object
 * @param {Array} permissions - Array of {feature, action} objects
 * @returns {Boolean}
 */
const hasAllPermissions = (user, permissions) => {
  return permissions.every(perm => hasPermission(user, perm.feature, perm.action));
};

/**
 * Get user hierarchy level
 * @param {String} userType - User type
 * @returns {Number} Hierarchy level (higher = more privileges)
 */
const getUserHierarchyLevel = (userType) => {
  const hierarchy = {
    'SAAS_OWNER': 100,
    'SAAS_ADMIN': 90,
    'TENANT_ADMIN': 50,
    'TENANT_MANAGER': 30,
    'TENANT_USER': 10
  };
  return hierarchy[userType] || 0;
};

/**
 * Check if user can manage another user
 * @param {Object} currentUser - Current user
 * @param {Object} targetUser - Target user to manage
 * @returns {Boolean}
 */
const canManageUser = (currentUser, targetUser) => {
  // SAAS users can manage anyone
  if (currentUser.userType === 'SAAS_OWNER' || currentUser.userType === 'SAAS_ADMIN') {
    return true;
  }

  // TENANT_ADMIN can manage all users in their tenant (including other admins)
  if (currentUser.userType === 'TENANT_ADMIN') {
    // Must be same tenant
    if (currentUser.tenant && targetUser.tenant) {
      return currentUser.tenant.toString() === targetUser.tenant.toString();
    }
    return false;
  }

  // For other user types, check hierarchy
  const currentLevel = getUserHierarchyLevel(currentUser.userType);
  const targetLevel = getUserHierarchyLevel(targetUser.userType);

  // Can't manage users of equal or higher level
  if (currentLevel <= targetLevel) {
    return false;
  }

  // Tenant users can only manage users in their own tenant
  if (currentUser.tenant && targetUser.tenant) {
    return currentUser.tenant.toString() === targetUser.tenant.toString();
  }

  return false;
};

module.exports = {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserHierarchyLevel,
  canManageUser
};
