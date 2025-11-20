const Group = require('../models/Group');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');

/**
 * @desc    Get all groups
 * @route   GET /api/groups
 * @access  Private
 */
const getGroups = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    // Build query
    let query = {};

    // Tenant users can only see their tenant groups
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      query.tenant = req.user.tenant;
    }

    // Apply filters
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count
    const total = await Group.countDocuments(query);

    // Get groups with pagination
    const groups = await Group.find(query)
      .populate('tenant', 'organizationName slug')
      .populate('members', 'firstName lastName email')
      .populate('roles', 'name slug')
      .populate('parentGroup', 'name slug')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    successResponse(res, 200, 'Groups retrieved successfully', {
      groups,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get groups error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get single group
 * @route   GET /api/groups/:id
 * @access  Private
 */
const getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('tenant')
      .populate('members', 'firstName lastName email userType')
      .populate('roles')
      .populate('parentGroup');

    if (!group) {
      return errorResponse(res, 404, 'Group not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (group.tenant._id.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    successResponse(res, 200, 'Group retrieved successfully', group);
  } catch (error) {
    console.error('Get group error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Create new group
 * @route   POST /api/groups
 * @access  Private (Admin only)
 */
const createGroup = async (req, res) => {
  try {
    const { name, slug, description, parentGroup, roles, groupPermissions } = req.body;

    // Validation
    if (!name || !slug) {
      return errorResponse(res, 400, 'Please provide name and slug');
    }

    // Determine tenant
    let tenant;
    if (req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN') {
      tenant = req.body.tenant;
      if (!tenant) {
        return errorResponse(res, 400, 'Tenant is required');
      }
    } else {
      tenant = req.user.tenant;
    }

    // Check if group with same slug exists for this tenant
    const existingGroup = await Group.findOne({ slug, tenant });
    if (existingGroup) {
      return errorResponse(res, 400, 'Group with this slug already exists');
    }

    const group = await Group.create({
      name,
      slug,
      description,
      tenant,
      parentGroup: parentGroup || null,
      members: [],
      roles: roles || [],
      groupPermissions: groupPermissions || [],
      isActive: true
    });

    // Log activity
    await logActivity(req, 'group.created', 'Group', group._id, {
      name: group.name,
      slug: group.slug
    });

    successResponse(res, 201, 'Group created successfully', group);
  } catch (error) {
    console.error('Create group error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Update group
 * @route   PUT /api/groups/:id
 * @access  Private (Admin only)
 */
const updateGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return errorResponse(res, 404, 'Group not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (group.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    // Update fields
    const allowedFields = ['name', 'description', 'parentGroup', 'roles', 'groupPermissions', 'isActive'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        group[field] = req.body[field];
      }
    });

    await group.save();

    // Log activity
    await logActivity(req, 'group.updated', 'Group', group._id);

    successResponse(res, 200, 'Group updated successfully', group);
  } catch (error) {
    console.error('Update group error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Delete group
 * @route   DELETE /api/groups/:id
 * @access  Private (Admin only)
 */
const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return errorResponse(res, 404, 'Group not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (group.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    await group.deleteOne();

    // Log activity
    await logActivity(req, 'group.deleted', 'Group', group._id, {
      name: group.name
    });

    successResponse(res, 200, 'Group deleted successfully');
  } catch (error) {
    console.error('Delete group error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Add members to group
 * @route   POST /api/groups/:id/members
 * @access  Private (Admin only)
 */
const addMembers = async (req, res) => {
  try {
    const { members } = req.body;

    const group = await Group.findById(req.params.id);

    if (!group) {
      return errorResponse(res, 404, 'Group not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (group.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    // Add members (avoid duplicates)
    members.forEach(memberId => {
      if (!group.members.includes(memberId)) {
        group.members.push(memberId);
      }
    });

    await group.save();

    // Log activity
    await logActivity(req, 'group.updated', 'Group', group._id, {
      action: 'members_added',
      members
    });

    successResponse(res, 200, 'Members added successfully', group);
  } catch (error) {
    console.error('Add members error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Remove members from group
 * @route   DELETE /api/groups/:id/members
 * @access  Private (Admin only)
 */
const removeMembers = async (req, res) => {
  try {
    const { members } = req.body;

    const group = await Group.findById(req.params.id);

    if (!group) {
      return errorResponse(res, 404, 'Group not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (group.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    // Remove members
    group.members = group.members.filter(m => !members.includes(m.toString()));

    await group.save();

    // Log activity
    await logActivity(req, 'group.updated', 'Group', group._id, {
      action: 'members_removed',
      members
    });

    successResponse(res, 200, 'Members removed successfully', group);
  } catch (error) {
    console.error('Remove members error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Assign roles to group
 * @route   POST /api/groups/:id/roles
 * @access  Private (Admin only)
 */
const assignRoles = async (req, res) => {
  try {
    const { roles } = req.body;

    if (!roles || !Array.isArray(roles)) {
      return errorResponse(res, 400, 'Please provide roles array');
    }

    const group = await Group.findById(req.params.id);

    if (!group) {
      return errorResponse(res, 404, 'Group not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (group.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    // Add roles (avoid duplicates)
    roles.forEach(roleId => {
      if (!group.roles.includes(roleId)) {
        group.roles.push(roleId);
      }
    });

    await group.save();

    // Populate roles before returning
    await group.populate('roles');

    // Log activity
    await logActivity(req, 'group.updated', 'Group', group._id, {
      action: 'roles_assigned',
      roles
    });

    successResponse(res, 200, 'Roles assigned successfully', group);
  } catch (error) {
    console.error('Assign roles error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Remove roles from group
 * @route   DELETE /api/groups/:id/roles
 * @access  Private (Admin only)
 */
const removeRoles = async (req, res) => {
  try {
    const { roles } = req.body;

    if (!roles || !Array.isArray(roles)) {
      return errorResponse(res, 400, 'Please provide roles array');
    }

    const group = await Group.findById(req.params.id);

    if (!group) {
      return errorResponse(res, 404, 'Group not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (group.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    // Remove roles
    group.roles = group.roles.filter(r => !roles.includes(r.toString()));

    await group.save();

    // Populate roles before returning
    await group.populate('roles');

    // Log activity
    await logActivity(req, 'group.updated', 'Group', group._id, {
      action: 'roles_removed',
      roles
    });

    successResponse(res, 200, 'Roles removed successfully', group);
  } catch (error) {
    console.error('Remove roles error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

module.exports = {
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  addMembers,
  removeMembers,
  assignRoles,
  removeRoles
};
