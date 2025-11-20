const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');
const { canManageUser } = require('../utils/permissions');
const { logActivity } = require('../middleware/activityLogger');

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
    }

    // Apply filters
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (userType) {
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
    const { email, password, firstName, lastName, userType, tenant, roles, groups } = req.body;

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
      isActive: true
    };

    const user = await User.create(userData);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

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
    const allowedFields = ['firstName', 'lastName', 'phone', 'profilePicture', 'isActive', 'roles', 'groups', 'customPermissions'];

    // Only SAAS owners can change userType
    if (req.body.userType && req.user.userType === 'SAAS_OWNER') {
      allowedFields.push('userType');
    }

    // Update fields
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    // Log activity
    await logActivity(req, 'user.updated', 'User', user._id);

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

    const user = await User.findById(req.params.id);

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Check if current user can manage this user
    if (!canManageUser(req.user, user)) {
      return errorResponse(res, 403, 'You cannot manage this user');
    }

    user.roles = roles;
    await user.save();

    // Log activity
    await logActivity(req, 'permission.granted', 'User', user._id, {
      roles
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

    const user = await User.findById(req.params.id);

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Check if current user can manage this user
    if (!canManageUser(req.user, user)) {
      return errorResponse(res, 403, 'You cannot manage this user');
    }

    user.groups = groups;
    await user.save();

    // Log activity
    await logActivity(req, 'user.updated', 'User', user._id, {
      action: 'groups_assigned',
      groups
    });

    successResponse(res, 200, 'Groups assigned successfully', user);
  } catch (error) {
    console.error('Assign groups error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  assignRoles,
  assignGroups
};
