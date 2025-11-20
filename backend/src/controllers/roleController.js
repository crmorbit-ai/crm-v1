const Role = require('../models/Role');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');

/**
 * @desc    Get all roles
 * @route   GET /api/roles
 * @access  Private
 */
const getRoles = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, roleType } = req.query;

    // Build query
    let query = {};

    // SAAS owners can see all roles
    // Tenant users can only see their tenant roles and system roles
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      query.$or = [
        { tenant: req.user.tenant },
        { roleType: 'system' }
      ];
    }

    // Apply filters
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      });
    }

    if (roleType) {
      query.roleType = roleType;
    }

    // Get total count
    const total = await Role.countDocuments(query);

    // Get roles with pagination
    const roles = await Role.find(query)
      .populate('tenant', 'organizationName slug')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ level: -1, createdAt: -1 });

    successResponse(res, 200, 'Roles retrieved successfully', {
      roles,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get roles error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get single role
 * @route   GET /api/roles/:id
 * @access  Private
 */
const getRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id).populate('tenant');

    if (!role) {
      return errorResponse(res, 404, 'Role not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (role.tenant && role.tenant._id.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    successResponse(res, 200, 'Role retrieved successfully', role);
  } catch (error) {
    console.error('Get role error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Create new role
 * @route   POST /api/roles
 * @access  Private (Admin only)
 */
const createRole = async (req, res) => {
  try {
    const { name, slug, description, permissions, level } = req.body;

    // Validation
    if (!name || !slug) {
      return errorResponse(res, 400, 'Please provide name and slug');
    }

    // Determine tenant context
    let tenant = null;
    let roleType = 'custom';

    if (req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN') {
      // SAAS users can create system-wide roles
      tenant = req.body.tenant || null;
      if (!tenant) {
        roleType = 'system';
      }
    } else {
      // Tenant users can only create roles for their tenant
      tenant = req.user.tenant;
    }

    // Check if role with same slug exists for this tenant
    const existingRole = await Role.findOne({ slug, tenant });
    if (existingRole) {
      return errorResponse(res, 400, 'Role with this slug already exists');
    }

    const role = await Role.create({
      name,
      slug,
      description,
      tenant,
      roleType,
      permissions: permissions || [],
      level: level || 1,
      isActive: true
    });

    // Log activity
    await logActivity(req, 'role.created', 'Role', role._id, {
      name: role.name,
      slug: role.slug
    });

    successResponse(res, 201, 'Role created successfully', role);
  } catch (error) {
    console.error('Create role error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Update role
 * @route   PUT /api/roles/:id
 * @access  Private (Admin only)
 */
const updateRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return errorResponse(res, 404, 'Role not found');
    }

    // Check if user can update this role
    if (role.roleType === 'system' && req.user.userType !== 'SAAS_OWNER') {
      return errorResponse(res, 403, 'Cannot modify system roles');
    }

    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (role.tenant && role.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    // Update fields
    const allowedFields = ['name', 'description', 'permissions', 'level', 'isActive'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        role[field] = req.body[field];
      }
    });

    await role.save();

    // Log activity
    await logActivity(req, 'role.updated', 'Role', role._id);

    successResponse(res, 200, 'Role updated successfully', role);
  } catch (error) {
    console.error('Update role error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Delete role
 * @route   DELETE /api/roles/:id
 * @access  Private (Admin only)
 */
const deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return errorResponse(res, 404, 'Role not found');
    }

    // Check if user can delete this role
    if (role.roleType === 'system') {
      return errorResponse(res, 403, 'Cannot delete system roles');
    }

    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (role.tenant && role.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    await role.deleteOne();

    // Log activity
    await logActivity(req, 'role.deleted', 'Role', role._id, {
      name: role.name
    });

    successResponse(res, 200, 'Role deleted successfully');
  } catch (error) {
    console.error('Delete role error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

module.exports = {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole
};
