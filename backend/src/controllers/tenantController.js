const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');

/**
 * @desc    Get all tenants (SAAS owner view)
 * @route   GET /api/tenants
 * @access  Private (SAAS owner/admin only)
 */
const getTenants = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, planType, isActive, isSuspended } = req.query;

    // Build query
    let query = {};

    if (search) {
      query.$or = [
        { organizationName: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { contactEmail: { $regex: search, $options: 'i' } }
      ];
    }

    if (planType) {
      query.planType = planType;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (isSuspended !== undefined) {
      query.isSuspended = isSuspended === 'true';
    }

    // Get total count
    const total = await Tenant.countDocuments(query);

    // Get tenants with pagination
    const tenants = await Tenant.find(query)
      .populate('reseller', 'firstName lastName email')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    // Get user count for each tenant
    const tenantsWithStats = await Promise.all(
      tenants.map(async (tenant) => {
        const userCount = await User.countDocuments({ tenant: tenant._id });
        return {
          ...tenant.toObject(),
          userCount
        };
      })
    );

    successResponse(res, 200, 'Tenants retrieved successfully', {
      tenants: tenantsWithStats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get tenants error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get single tenant
 * @route   GET /api/tenants/:id
 * @access  Private (SAAS owner/admin only)
 */
const getTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id)
      .populate('reseller', 'firstName lastName email');

    if (!tenant) {
      return errorResponse(res, 404, 'Tenant not found');
    }

    // Get additional stats
    const userCount = await User.countDocuments({ tenant: tenant._id });
    const adminUser = await User.findOne({ tenant: tenant._id, userType: 'TENANT_ADMIN' })
      .select('firstName lastName email');

    const tenantData = {
      ...tenant.toObject(),
      userCount,
      adminUser
    };

    successResponse(res, 200, 'Tenant retrieved successfully', tenantData);
  } catch (error) {
    console.error('Get tenant error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Update tenant
 * @route   PUT /api/tenants/:id
 * @access  Private (SAAS owner/admin only)
 */
const updateTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return errorResponse(res, 404, 'Tenant not found');
    }

    // Update allowed fields
    const allowedFields = [
      'organizationName', 'contactEmail', 'contactPhone', 'address',
      'planType', 'enabledFeatures', 'theme', 'settings', 'isActive'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        tenant[field] = req.body[field];
      }
    });

    await tenant.save();

    // Log activity
    await logActivity(req, 'tenant.updated', 'Tenant', tenant._id);

    successResponse(res, 200, 'Tenant updated successfully', tenant);
  } catch (error) {
    console.error('Update tenant error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Suspend tenant
 * @route   POST /api/tenants/:id/suspend
 * @access  Private (SAAS owner/admin only)
 */
const suspendTenant = async (req, res) => {
  try {
    const { reason } = req.body;

    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return errorResponse(res, 404, 'Tenant not found');
    }

    tenant.isSuspended = true;
    tenant.suspensionReason = reason || 'No reason provided';
    tenant.isActive = false;

    // Update subscription status
    if (!tenant.subscription) {
      tenant.subscription = {};
    }
    tenant.subscription.status = 'suspended';

    await tenant.save();

    // Log activity
    await logActivity(req, 'tenant.suspended', 'Tenant', tenant._id, {
      reason: tenant.suspensionReason
    });

    successResponse(res, 200, 'Tenant suspended successfully', tenant);
  } catch (error) {
    console.error('Suspend tenant error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Activate tenant
 * @route   POST /api/tenants/:id/activate
 * @access  Private (SAAS owner/admin only)
 */
const activateTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return errorResponse(res, 404, 'Tenant not found');
    }

    tenant.isSuspended = false;
    tenant.isActive = true;
    tenant.suspensionReason = null;

    // Update subscription status to active
    if (!tenant.subscription) {
      tenant.subscription = {};
    }
    tenant.subscription.status = 'active';

    await tenant.save();

    // Log activity
    await logActivity(req, 'tenant.activated', 'Tenant', tenant._id);

    successResponse(res, 200, 'Tenant activated successfully', tenant);
  } catch (error) {
    console.error('Activate tenant error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Delete tenant
 * @route   DELETE /api/tenants/:id
 * @access  Private (SAAS owner only)
 */
const deleteTenant = async (req, res) => {
  try {
    if (req.user.userType !== 'SAAS_OWNER') {
      return errorResponse(res, 403, 'Only SAAS owners can delete tenants');
    }

    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return errorResponse(res, 404, 'Tenant not found');
    }

    // Delete all users associated with this tenant
    await User.deleteMany({ tenant: tenant._id });

    // Delete subscription
    if (tenant.subscription) {
      await Subscription.findByIdAndDelete(tenant.subscription);
    }

    await tenant.deleteOne();

    // Log activity
    await logActivity(req, 'tenant.deleted', 'Tenant', tenant._id, {
      organizationName: tenant.organizationName
    });

    successResponse(res, 200, 'Tenant deleted successfully');
  } catch (error) {
    console.error('Delete tenant error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get tenant statistics
 * @route   GET /api/tenants/stats/overview
 * @access  Private (SAAS owner/admin only)
 */
const getTenantStats = async (req, res) => {
  try {
    const totalTenants = await Tenant.countDocuments();
    const activeTenants = await Tenant.countDocuments({
      isActive: true,
      isSuspended: false,
      'subscription.status': 'active'
    });
    const suspendedTenants = await Tenant.countDocuments({ isSuspended: true });
    const trialTenants = await Tenant.countDocuments({ 'subscription.status': 'trial' });

    // Tenants by plan
    const tenantsByPlan = await Tenant.aggregate([
      {
        $group: {
          _id: '$subscription.planName',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent tenants (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentTenants = await Tenant.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    // Format tenants by plan with lowercase keys to match frontend
    const planStats = tenantsByPlan.reduce((acc, item) => {
      if (item._id) {
        acc[item._id.toLowerCase()] = item.count;
      }
      return acc;
    }, {
      free: 0,
      basic: 0,
      professional: 0,
      enterprise: 0
    });

    successResponse(res, 200, 'Tenant statistics retrieved successfully', {
      totalTenants,
      activeTenants,
      suspendedTenants,
      trialTenants,
      recentTenants,
      tenantsByPlan: planStats
    });
  } catch (error) {
    console.error('Get tenant stats error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

module.exports = {
  getTenants,
  getTenant,
  updateTenant,
  suspendTenant,
  activateTenant,
  deleteTenant,
  getTenantStats
};
