/**
 * Add user-level filtering to queries
 * TENANT_ADMIN sees all tenant data
 * TENANT_MANAGER and TENANT_USER see only their own data (created by or assigned to them)
 */

const addUserLevelFilter = (query, user, options = {}) => {
  // SAAS users see everything
  if (user.userType === 'SAAS_OWNER' || user.userType === 'SAAS_ADMIN') {
    return query;
  }

  // TENANT_ADMIN sees all data in their tenant
  if (user.userType === 'TENANT_ADMIN') {
    return query;
  }

  // TENANT_MANAGER and TENANT_USER see only their own data
  const {
    createdByField = 'createdBy',
    assignedToField = 'assignedTo',
    additionalFields = []
  } = options;

  // Build $or conditions for user's own data
  const userConditions = [
    { [createdByField]: user._id }
  ];

  // Add assignedTo condition if field exists
  if (assignedToField) {
    userConditions.push({ [assignedToField]: user._id });
  }

  // Add any additional fields (e.g., team members, etc.)
  additionalFields.forEach(field => {
    userConditions.push({ [field]: user._id });
  });

  // If query already has conditions, wrap them with user filter
  if (Object.keys(query).length > 0) {
    return {
      $and: [
        query,
        { $or: userConditions }
      ]
    };
  }

  // Otherwise just add $or conditions
  query.$or = userConditions;
  return query;
};

module.exports = {
  addUserLevelFilter
};
