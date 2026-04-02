const User = require('../models/User');
const Group = require('../models/Group');
const Tenant = require('../models/Tenant');
const Subscription = require('../models/Subscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const { successResponse, errorResponse } = require('../utils/response');
const { canManageUser, getUserHierarchyLevel } = require('../utils/permissions');
const { logActivity } = require('../middleware/activityLogger');
const { sendUserInvitationEmail } = require('../utils/emailService');
const { trackChanges } = require('../utils/changeTracker');
const bcrypt = require('bcryptjs');

/**
 * @desc    Get all users (filtered by tenant for tenant admins)
 * @route   GET /api/users
 * @access  Private
 */
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, userType, isActive } = req.query;

    // Build query
    let query = {};

    // SAAS owners can see all users
    // Tenant users can only see users in their tenant
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      query.tenant = req.user.tenant;

      // Hierarchy-based filtering: users can only see users at or below their own level
      // e.g., TENANT_USER cannot see TENANT_ADMIN or TENANT_MANAGER
      const currentLevel = getUserHierarchyLevel(req.user.userType);
      const allUserTypes = ['SAAS_OWNER', 'SAAS_ADMIN', 'TENANT_ADMIN', 'TENANT_MANAGER', 'TENANT_USER'];
      const allowedUserTypes = allUserTypes.filter(
        (type) => getUserHierarchyLevel(type) <= currentLevel
      );

      if (userType) {
        // If a specific userType filter is requested, check if it's allowed
        if (!allowedUserTypes.includes(userType)) {
          return errorResponse(res, 403, 'Access denied');
        }
        query.userType = userType;
      } else {
        query.userType = { $in: allowedUserTypes };
      }
    }

    // Apply filters
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (!query.userType && userType) {
      query.userType = userType;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Get total count
    const total = await User.countDocuments(query);

    // Get users with pagination
    const users = await User.find(query)
      .populate('roles', 'name slug description permissions roleType')
      .populate({
        path: 'groups',
        select: 'name slug roles',
        populate: {
          path: 'roles',
          select: 'name slug description permissions roleType'
        }
      })
      .populate('tenant', 'organizationName slug')
      .populate('addedBy', 'firstName lastName email')
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    successResponse(res, 200, 'Users retrieved successfully', {
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get single user
 * @route   GET /api/users/:id
 * @access  Private
 */
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('roles')
      .populate('groups')
      .populate('tenant')
      .select('-password');

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Check if current user can view this user
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (user.tenant && user.tenant._id.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }

      // Hierarchy check: cannot view users with higher hierarchy level
      // e.g., TENANT_USER cannot view TENANT_ADMIN's profile
      const currentLevel = getUserHierarchyLevel(req.user.userType);
      const targetLevel = getUserHierarchyLevel(user.userType);
      if (targetLevel > currentLevel) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    successResponse(res, 200, 'User retrieved successfully', user);
  } catch (error) {
    console.error('Get user error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Create new user
 * @route   POST /api/users
 * @access  Private (Admin only)
 */
const createUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, userType, tenant, roles, groups, loginName, department, subDepartment, personalEmail, officeEmail, phone, alternatePhone, reportingManager, viewingPin } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName || !userType) {
      return errorResponse(res, 400, 'Please provide all required fields');
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 400, 'Email already exists');
    }

    // Validate userType permissions
    if (userType === 'SAAS_OWNER' || userType === 'SAAS_ADMIN') {
      if (req.user.userType !== 'SAAS_OWNER') {
        return errorResponse(res, 403, 'Only SAAS owners can create SAAS admin users');
      }
    }

    // For tenant users, ensure tenant is provided
    if (userType.startsWith('TENANT_') && !tenant) {
      return errorResponse(res, 400, 'Tenant is required for tenant users');
    }

    // ✅ CHECK SUBSCRIPTION LIMITS FOR TENANT USERS
    if (userType.startsWith('TENANT_')) {
      const tenantId = tenant || req.user.tenant;

      // Get tenant with subscription details
      const tenantData = await Tenant.findById(tenantId).populate('subscription.plan');

      if (!tenantData) {
        return errorResponse(res, 404, 'Organization not found');
      }

      // Check if subscription exists and is active
      if (!tenantData.subscription || !['active', 'trial'].includes(tenantData.subscription.status)) {
        return errorResponse(res, 403, 'No active subscription found for this organization. Please contact support.');
      }

      // Get subscription plan limits
      let plan = tenantData.subscription.plan;

      // If plan is not populated, fetch it
      if (!plan || !plan.limits) {
        plan = await SubscriptionPlan.findById(tenantData.subscription.plan);
      }

      // If still no plan found, try by planName
      if (!plan) {
        plan = await SubscriptionPlan.findOne({
          name: tenantData.subscription.planName
        });
      }

      if (!plan) {
        return errorResponse(res, 500, 'Subscription plan not found. Please contact support.');
      }

      console.log('📊 Plan Info:', {
        planName: plan.name || plan.displayName,
        userLimit: plan.limits.users,
        currentUsers: tenantData.usage.users || 0
      });

      // Count current active users for this tenant
      const currentUserCount = await User.countDocuments({
        tenant: tenantId,
        isActive: true
      });

      // Check if limit is reached
      const userLimit = plan.limits.users;
      if (userLimit !== -1 && currentUserCount >= userLimit) {
        return errorResponse(
          res,
          403,
          `❌ User limit reached! Your ${plan.displayName || plan.name} plan allows maximum ${userLimit} users. You currently have ${currentUserCount} active users. Please upgrade your plan to add more users.`
        );
      }

      console.log(`✅ User limit check passed: ${currentUserCount}/${userLimit === -1 ? 'Unlimited' : userLimit} users`);

      // Update tenant usage count
      tenantData.usage.users = currentUserCount + 1;
      await tenantData.save();
    }

    // Hash PIN if provided
    let hashedPin = null;
    if (viewingPin && /^\d{4}$/.test(viewingPin)) {
      const salt = await bcrypt.genSalt(10);
      hashedPin = await bcrypt.hash(viewingPin, salt);
    }

    // Create user data
    const userData = {
      email,
      password,
      firstName,
      lastName,
      userType,
      tenant: tenant || null,
      roles: roles || [],
      groups: groups || [],
      isActive: true,
      isProfileComplete: true,  // Admin-created users don't need profile completion
      ...(loginName        && { loginName }),
      ...(department       && { department }),
      ...(subDepartment    && { subDepartment }),
      ...(personalEmail    && { personalEmail }),
      ...(officeEmail      && { officeEmail }),
      ...(phone            && { phone }),
      ...(alternatePhone   && { alternatePhone }),
      ...(reportingManager && { reportingManager }),
      addedBy: req.user._id,
      ...(hashedPin && { viewingPin: hashedPin, isViewingPinSet: true })
    };

    const user = await User.create(userData);

    // Sync: add user to each group's members array
    if (groups && groups.length > 0) {
      await Group.updateMany(
        { _id: { $in: groups } },
        { $addToSet: { members: user._id } }
      );
    }

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    // ✅ SEND INVITATION EMAIL TO NEW USER
    if (userType.startsWith('TENANT_')) {
      try {
        const tenantData = await Tenant.findById(tenant || req.user.tenant);
        const roleNames = roles && roles.length > 0
          ? await require('../models/Role').find({ _id: { $in: roles } }).select('name')
          : [];

        await sendUserInvitationEmail({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          organizationName: tenantData.organizationName,
          invitedBy: `${req.user.firstName} ${req.user.lastName}`,
          roles: roleNames.map(r => r.name).join(', ') || 'Team Member',
          temporaryPassword: password // In production, generate a secure random password
        });
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Don't fail user creation if email fails
      }
    }

    // Log activity
    await logActivity(req, 'user.created', 'User', user._id, {
      email: user.email,
      userType: user.userType
    });

    successResponse(res, 201, 'User created successfully', userResponse);
  } catch (error) {
    console.error('Create user error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private (Admin only)
 */
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Check if current user can manage this user
    if (!canManageUser(req.user, user)) {
      return errorResponse(res, 403, 'You cannot manage this user');
    }

    // Fields that can be updated
    const allowedFields = ['firstName', 'lastName', 'phone', 'alternatePhone', 'personalEmail', 'officeEmail', 'profilePicture', 'isActive', 'roles', 'groups', 'customPermissions', 'loginName', 'department', 'subDepartment', 'reportingManager'];

    // SAAS owners and TENANT_ADMIN can change userType
    if (req.body.userType && (req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN' || req.user.userType === 'TENANT_ADMIN')) {
      allowedFields.push('userType');
    }

    // Track changes BEFORE updating
    const changes = trackChanges(user, req.body, allowedFields);

    // Capture old groups before update for sync
    const oldGroups = user.groups.map(g => g.toString());

    // Update fields
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    // Handle viewingPin update (hash if provided)
    if (req.body.viewingPin && /^\d{4}$/.test(req.body.viewingPin)) {
      const salt = await bcrypt.genSalt(10);
      user.viewingPin = await bcrypt.hash(req.body.viewingPin, salt);
      user.isViewingPinSet = true;
    }

    await user.save();

    // Sync Group.members when groups change
    if (req.body.groups !== undefined) {
      const newGroups = req.body.groups.map(g => g.toString());
      const added = newGroups.filter(g => !oldGroups.includes(g));
      const removed = oldGroups.filter(g => !newGroups.includes(g));
      if (added.length > 0) {
        await Group.updateMany({ _id: { $in: added } }, { $addToSet: { members: user._id } });
      }
      if (removed.length > 0) {
        await Group.updateMany({ _id: { $in: removed } }, { $pull: { members: user._id } });
      }
    }

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    // Log activity with changes
    await logActivity(req, 'user.updated', 'User', user._id, {
      changes,
      targetUser: `${user.firstName} ${user.lastName} - ${user.userType || 'User'} (${user.email})`,
      changedBy: `${req.user.firstName} ${req.user.lastName} - ${req.user.userType || 'User'} (${req.user.email})`
    });

    successResponse(res, 200, 'User updated successfully', userResponse);
  } catch (error) {
    console.error('Update user error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private (Admin only)
 */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Check if current user can manage this user
    if (!canManageUser(req.user, user)) {
      return errorResponse(res, 403, 'You cannot delete this user');
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return errorResponse(res, 400, 'You cannot delete yourself');
    }

    // Update tenant usage count if tenant user
    if (user.tenant && user.userType.startsWith('TENANT_')) {
      const tenantData = await Tenant.findById(user.tenant);
      if (tenantData && tenantData.usage.users > 0) {
        tenantData.usage.users = tenantData.usage.users - 1;
        await tenantData.save();
        console.log(`✅ Updated tenant usage: ${tenantData.usage.users} users`);
      }
    }

    await user.deleteOne();

    // Log activity
    await logActivity(req, 'user.deleted', 'User', user._id, {
      email: user.email
    });

    successResponse(res, 200, 'User deleted successfully');
  } catch (error) {
    console.error('Delete user error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Assign roles to user
 * @route   POST /api/users/:id/assign-roles
 * @access  Private (Admin only)
 */
const assignRoles = async (req, res) => {
  try {
    const { roles } = req.body;

    const user = await User.findById(req.params.id).populate('roles', 'name slug');

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Check if current user can manage this user
    if (!canManageUser(req.user, user)) {
      return errorResponse(res, 403, 'You cannot manage this user');
    }

    // Get old role names (with defensive check)
    const oldRoleNames = user.roles && user.roles.length > 0
      ? user.roles.map(role => role.name || role._id.toString())
      : [];
    const oldRoleIds = user.roles && user.roles.length > 0
      ? user.roles.map(role => role._id.toString())
      : [];

    console.log('🔍 Old Roles:', oldRoleNames);

    // Get new role IDs
    const newRoleIds = roles || [];

    // Fetch new role details to get names
    const Role = require('../models/Role');
    const newRoleObjects = await Role.find({ _id: { $in: newRoleIds } }).select('name');
    const newRoleNames = newRoleObjects.map(role => role.name);

    console.log('🔍 New Roles:', newRoleNames);

    // Find added and removed
    const addedRoleIds = newRoleIds.filter(r => !oldRoleIds.includes(r.toString()));
    const removedRoleIds = oldRoleIds.filter(r => !newRoleIds.includes(r));

    const addedRoleObjects = await Role.find({ _id: { $in: addedRoleIds } }).select('name');
    const addedRoleNames = addedRoleObjects.map(r => r.name);

    const removedRoleObjects = await Role.find({ _id: { $in: removedRoleIds } }).select('name');
    const removedRoleNames = removedRoleObjects.map(r => r.name);

    console.log('🔍 Added Roles:', addedRoleNames);
    console.log('🔍 Removed Roles:', removedRoleNames);

    // Create changes object with role names
    const changes = {
      roles: {
        old: oldRoleNames.length > 0 ? oldRoleNames.join(', ') : 'None',
        new: newRoleNames.length > 0 ? newRoleNames.join(', ') : 'None',
        added: addedRoleNames.length > 0 ? addedRoleNames.join(', ') : 'None',
        removed: removedRoleNames.length > 0 ? removedRoleNames.join(', ') : 'None'
      }
    };

    console.log('📝 Final Changes Object:', JSON.stringify(changes, null, 2));

    user.roles = roles;
    await user.save();

    // Log activity with detailed changes
    await logActivity(req, 'permission.granted', 'User', user._id, {
      changes,
      targetUser: `${user.firstName} ${user.lastName} - ${user.userType || 'User'} (${user.email})`,
      changedBy: `${req.user.firstName} ${req.user.lastName} - ${req.user.userType || 'User'} (${req.user.email})`,
      actionType: 'roles_updated'
    });

    successResponse(res, 200, 'Roles assigned successfully', user);
  } catch (error) {
    console.error('Assign roles error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Assign groups to user
 * @route   POST /api/users/:id/assign-groups
 * @access  Private (Admin only)
 */
const assignGroups = async (req, res) => {
  try {
    const { groups } = req.body;

    const user = await User.findById(req.params.id).populate('groups', 'name slug');

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Check if current user can manage this user
    if (!canManageUser(req.user, user)) {
      return errorResponse(res, 403, 'You cannot manage this user');
    }

    // Get old group names (with defensive check)
    const oldGroupNames = user.groups && user.groups.length > 0
      ? user.groups.map(group => group.name || group._id.toString())
      : [];
    const oldGroupIds = user.groups && user.groups.length > 0
      ? user.groups.map(group => group._id.toString())
      : [];

    console.log('🔍 Old Groups:', oldGroupNames);

    // Get new group IDs
    const newGroupIds = groups || [];

    // Fetch new group details to get names
    const newGroupObjects = await Group.find({ _id: { $in: newGroupIds } }).select('name');
    const newGroupNames = newGroupObjects.map(group => group.name);

    console.log('🔍 New Groups:', newGroupNames);

    // Find added and removed
    const addedGroupIds = newGroupIds.filter(g => !oldGroupIds.includes(g.toString()));
    const removedGroupIds = oldGroupIds.filter(g => !newGroupIds.includes(g));

    const addedGroupObjects = await Group.find({ _id: { $in: addedGroupIds } }).select('name');
    const addedGroupNames = addedGroupObjects.map(g => g.name);

    const removedGroupObjects = await Group.find({ _id: { $in: removedGroupIds } }).select('name');
    const removedGroupNames = removedGroupObjects.map(g => g.name);

    console.log('🔍 Added Groups:', addedGroupNames);
    console.log('🔍 Removed Groups:', removedGroupNames);

    // Create changes object with group names
    const changes = {
      groups: {
        old: oldGroupNames.length > 0 ? oldGroupNames.join(', ') : 'None',
        new: newGroupNames.length > 0 ? newGroupNames.join(', ') : 'None',
        added: addedGroupNames.length > 0 ? addedGroupNames.join(', ') : 'None',
        removed: removedGroupNames.length > 0 ? removedGroupNames.join(', ') : 'None'
      }
    };

    console.log('📝 Final Changes Object:', JSON.stringify(changes, null, 2));

    user.groups = groups;
    await user.save();

    // Sync Group.members: add user to new groups, remove from old groups
    if (addedGroupIds.length > 0) {
      await Group.updateMany({ _id: { $in: addedGroupIds } }, { $addToSet: { members: user._id } });
    }
    if (removedGroupIds.length > 0) {
      await Group.updateMany({ _id: { $in: removedGroupIds } }, { $pull: { members: user._id } });
    }

    // Log activity with detailed changes
    await logActivity(req, 'user.updated', 'User', user._id, {
      changes,
      targetUser: `${user.firstName} ${user.lastName} - ${user.userType || 'User'} (${user.email})`,
      changedBy: `${req.user.firstName} ${req.user.lastName} - ${req.user.userType || 'User'} (${req.user.email})`,
      actionType: 'groups_assigned'
    });

    successResponse(res, 200, 'Groups assigned successfully', user);
  } catch (error) {
    console.error('Assign groups error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Reset a user's password (by admin)
 * @route   PUT /api/users/:id/reset-password
 * @access  Private (TENANT_ADMIN, SAAS_OWNER, SAAS_ADMIN)
 */
const resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 4) {
      return errorResponse(res, 400, 'Password must be at least 4 characters');
    }

    const user = await User.findById(req.params.id);
    if (!user) return errorResponse(res, 404, 'User not found');

    // Tenant isolation: non-SAAS admins can only reset passwords within their tenant
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (!user.tenant || user.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
      // Tenant admin cannot reset another tenant admin's password
      if (user.userType === 'TENANT_ADMIN' && user._id.toString() !== req.user._id.toString()) {
        return errorResponse(res, 403, 'Cannot reset another admin\'s password');
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(req.params.id, { password: hashedPassword });

    await logActivity(req, 'user.password_reset', 'User', user._id, {
      targetUser: `${user.firstName} ${user.lastName} (${user.email})`,
      resetBy: `${req.user.firstName} ${req.user.lastName} (${req.user.email})`
    });

    successResponse(res, 200, 'Password reset successfully');
  } catch (error) {
    console.error('Reset password error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Bulk create users from CSV data
 * @route   POST /api/users/bulk
 * @access  Private
 */
const bulkCreateUsers = async (req, res) => {
  try {
    const { users: usersData } = req.body;
    if (!Array.isArray(usersData) || usersData.length === 0) {
      return errorResponse(res, 400, 'No users provided');
    }
    if (usersData.length > 100) {
      return errorResponse(res, 400, 'Maximum 100 users per bulk import');
    }

    const tenantId = req.user.tenant;

    // Check subscription limit once
    const tenantData = await Tenant.findById(tenantId).populate('subscription.plan');
    if (!tenantData) return errorResponse(res, 404, 'Organization not found');
    if (!tenantData.subscription || !['active', 'trial'].includes(tenantData.subscription.status)) {
      return errorResponse(res, 403, 'No active subscription');
    }
    let plan = tenantData.subscription.plan;
    if (!plan || !plan.limits) plan = await SubscriptionPlan.findById(tenantData.subscription.plan);
    const currentCount = await User.countDocuments({ tenant: tenantId, isActive: true });
    const maxUsers = plan?.limits?.users ?? Infinity;
    const slotsLeft = maxUsers === -1 ? Infinity : maxUsers - currentCount;
    if (slotsLeft < usersData.length) {
      return errorResponse(res, 403, `Only ${slotsLeft} user slot(s) remaining in your plan`);
    }

    const results = [];
    for (let i = 0; i < usersData.length; i++) {
      const row = usersData[i];
      try {
        const { firstName, lastName, email, password, userType = 'TENANT_USER', phone, loginName, department } = row;
        if (!firstName || !lastName || !email || !password) {
          results.push({ row: i + 1, email, status: 'failed', error: 'Missing required fields' });
          continue;
        }
        const exists = await User.findOne({ email: email.toLowerCase() });
        if (exists) {
          results.push({ row: i + 1, email, status: 'failed', error: 'Email already exists' });
          continue;
        }
        const newUser = await User.create({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.toLowerCase().trim(),
          password,
          userType,
          tenant: tenantId,
          phone: phone || '',
          loginName: loginName || `${firstName}.${lastName}`.toLowerCase().replace(/\s+/g, ''),
          department: department || '',
          addedBy: req.user._id,
          isActive: true,
          isProfileComplete: true,
          emailVerified: true,
        });
        results.push({ row: i + 1, email, status: 'created', userId: newUser._id });
      } catch (err) {
        results.push({ row: i + 1, email: row.email, status: 'failed', error: err.message });
      }
    }

    const created = results.filter(r => r.status === 'created').length;
    const failed  = results.filter(r => r.status === 'failed').length;
    return res.status(200).json({ success: true, message: `${created} created, ${failed} failed`, results });
  } catch (error) {
    console.error('Bulk create error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  bulkCreateUsers,
  updateUser,
  deleteUser,
  assignRoles,
  assignGroups,
  resetUserPassword
};
