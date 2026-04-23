const Tenant      = require('../models/Tenant');
const User        = require('../models/User');
const Subscription = require('../models/Subscription');
const PlanHistory = require('../models/PlanHistory');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');
const {
  sendDeletionRequestNotification,
  sendDeletionRequestConfirmation,
  sendDeletionApprovedEmail,
  sendDeletionRejectedEmail,
  sendAccountRecoveredEmail
} = require('../utils/emailService');

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

    if (req.query.deletionStatus) {
      query['deletionRequest.status'] = req.query.deletionStatus;
    }

    // Filter by assigned manager
    if (req.query.assignedManager) {
      query.assignedManager = req.query.assignedManager === 'me' ? req.user._id : req.query.assignedManager;
    }

    // Get total count
    const total = await Tenant.countDocuments(query);

    // Get tenants with pagination
    const tenants = await Tenant.find(query)
      .populate('reseller', 'firstName lastName email')
      .populate('assignedManager', 'firstName lastName email')
      .populate('assignedManagerBy', 'firstName lastName email')
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
      .populate('reseller', 'firstName lastName email')
      .populate('assignedManager', 'firstName lastName email')
      .populate('assignedManagerBy', 'firstName lastName email');

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

    // Record churn in PlanHistory before deleting
    await PlanHistory.create({
      tenant:     tenant._id,
      fromPlan:   tenant.subscription?.planName || 'Free',
      toPlan:     tenant.subscription?.planName || 'Free',
      changeType: 'cancel',
      reason:     'Organization deleted by SAAS admin',
      changedBy:  'admin',
      changedAt:  new Date(),
    }).catch(() => {});

    // Mark cancelledAt for churn tracking
    tenant.subscription.cancelledAt        = new Date();
    tenant.subscription.cancellationReason = 'Organization deleted by SAAS admin';
    tenant.subscription.status             = 'cancelled';
    await tenant.save().catch(() => {});

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
    const pendingDeletionRequests = await Tenant.countDocuments({ 'deletionRequest.status': 'pending' });

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
      tenantsByPlan: planStats,
      pendingDeletionRequests
    });
  } catch (error) {
    console.error('Get tenant stats error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Tenant requests account deletion
 * @route   POST /api/tenants/request-deletion
 * @access  Private (TENANT_ADMIN only)
 */
const requestDeletion = async (req, res) => {
  try {
    const { reason } = req.body;
    const tenant = await Tenant.findById(req.user.tenant);

    if (!tenant) {
      return errorResponse(res, 404, 'Organization not found');
    }

    if (tenant.deletionRequest && tenant.deletionRequest.status === 'pending') {
      return errorResponse(res, 400, 'Deletion request is already pending. Please wait for SAAS Admin response.');
    }

    if (tenant.deletionRequest && tenant.deletionRequest.status === 'approved') {
      return errorResponse(res, 400, 'Your account is already scheduled for deletion.');
    }

    tenant.deletionRequest = {
      status: 'pending',
      requestedAt: new Date(),
      reason: reason || '',
      requestedBy: req.user._id
    };

    await tenant.save();

    // Get tenant admin email for confirmation
    const tenantAdmin = await User.findOne({ tenant: tenant._id, userType: 'TENANT_ADMIN' }).select('email firstName');

    // Send email to SAAS Admin
    const saasAdminEmails = (process.env.SAAS_ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
    for (const adminEmail of saasAdminEmails) {
      sendDeletionRequestNotification(adminEmail, tenant, reason).catch(err =>
        console.error('Failed to send deletion notification to SAAS admin:', err)
      );
    }

    // Send confirmation to tenant admin
    if (tenantAdmin) {
      sendDeletionRequestConfirmation(tenantAdmin.email, tenant.organizationName, tenantAdmin.firstName).catch(err =>
        console.error('Failed to send deletion confirmation to tenant:', err)
      );
    }

    await logActivity(req, 'tenant.deletion_requested', 'Tenant', tenant._id, { reason });

    successResponse(res, 200, 'Deletion request submitted successfully. SAAS Admin will contact you shortly.', {
      deletionRequest: tenant.deletionRequest
    });
  } catch (error) {
    console.error('Request deletion error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    SAAS Admin approves deletion request
 * @route   POST /api/tenants/:id/approve-deletion
 * @access  Private (SAAS_OWNER / SAAS_ADMIN only)
 */
const approveDeletion = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return errorResponse(res, 404, 'Tenant not found');
    }

    if (!tenant.deletionRequest || tenant.deletionRequest.status !== 'pending') {
      return errorResponse(res, 400, 'No pending deletion request found for this organization.');
    }

    const permanentDeleteAt = new Date();
    permanentDeleteAt.setDate(permanentDeleteAt.getDate() + 45);

    tenant.deletionRequest.status           = 'approved';
    tenant.deletionRequest.approvedAt       = new Date();
    tenant.deletionRequest.approvedBy       = req.user._id;
    tenant.deletionRequest.permanentDeleteAt = permanentDeleteAt;
    tenant.isActive                          = false;

    // Record churn
    tenant.subscription.cancelledAt        = new Date();
    tenant.subscription.cancellationReason = 'Organization deletion request approved';
    tenant.subscription.status             = 'cancelled';

    await tenant.save();

    // Save plan history
    await PlanHistory.create({
      tenant:     tenant._id,
      fromPlan:   tenant.subscription?.planName || 'Free',
      toPlan:     tenant.subscription?.planName || 'Free',
      changeType: 'cancel',
      reason:     'Deletion request approved — 45 day window',
      changedBy:  'admin',
      changedAt:  new Date(),
    }).catch(() => {});

    // Block all tenant users
    await User.updateMany({ tenant: tenant._id }, { isActive: false });

    // Get tenant admin email
    const tenantAdmin = await User.findOne({ tenant: tenant._id, userType: 'TENANT_ADMIN' }).select('email firstName');
    if (tenantAdmin) {
      sendDeletionApprovedEmail(tenantAdmin.email, tenant.organizationName, permanentDeleteAt, tenantAdmin.firstName).catch(err =>
        console.error('Failed to send deletion approval email:', err)
      );
    }

    await logActivity(req, 'tenant.deletion_approved', 'Tenant', tenant._id, {
      permanentDeleteAt,
      approvedBy: req.user._id
    });

    successResponse(res, 200, 'Deletion request approved. Account will be permanently deleted after 45 days.', {
      deletionRequest: tenant.deletionRequest
    });
  } catch (error) {
    console.error('Approve deletion error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    SAAS Admin rejects deletion request
 * @route   POST /api/tenants/:id/reject-deletion
 * @access  Private (SAAS_OWNER / SAAS_ADMIN only)
 */
const rejectDeletion = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return errorResponse(res, 404, 'Tenant not found');
    }

    if (!tenant.deletionRequest || tenant.deletionRequest.status !== 'pending') {
      return errorResponse(res, 400, 'No pending deletion request found for this organization.');
    }

    tenant.deletionRequest.status = 'rejected';
    tenant.deletionRequest.rejectedAt = new Date();
    tenant.deletionRequest.rejectedBy = req.user._id;
    tenant.deletionRequest.rejectionReason = rejectionReason || '';

    await tenant.save();

    // Get tenant admin email
    const tenantAdmin = await User.findOne({ tenant: tenant._id, userType: 'TENANT_ADMIN' }).select('email firstName');
    if (tenantAdmin) {
      sendDeletionRejectedEmail(tenantAdmin.email, tenant.organizationName, rejectionReason, tenantAdmin.firstName).catch(err =>
        console.error('Failed to send deletion rejection email:', err)
      );
    }

    await logActivity(req, 'tenant.deletion_rejected', 'Tenant', tenant._id, {
      rejectionReason,
      rejectedBy: req.user._id
    });

    successResponse(res, 200, 'Deletion request rejected. Organization account remains active.', {
      deletionRequest: tenant.deletionRequest
    });
  } catch (error) {
    console.error('Reject deletion error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    SAAS Admin recovers a deleted organization within 45-day window
 * @route   POST /api/tenants/:id/recover
 * @access  Private (SAAS_OWNER / SAAS_ADMIN only)
 */
const recoverTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return errorResponse(res, 404, 'Tenant not found');
    }

    if (!tenant.deletionRequest || tenant.deletionRequest.status !== 'approved') {
      return errorResponse(res, 400, 'This organization does not have an approved deletion request.');
    }

    if (tenant.deletionRequest.permanentDeleteAt && new Date() > tenant.deletionRequest.permanentDeleteAt) {
      return errorResponse(res, 400, 'Recovery window has expired. This organization cannot be recovered.');
    }

    // Reset deletion request and reactivate
    tenant.deletionRequest = { status: 'none' };
    tenant.isActive = true;

    await tenant.save();

    // Reactivate all tenant users
    await User.updateMany({ tenant: tenant._id }, { isActive: true });

    // Get tenant admin email
    const tenantAdmin = await User.findOne({ tenant: tenant._id, userType: 'TENANT_ADMIN' }).select('email firstName');
    if (tenantAdmin) {
      sendAccountRecoveredEmail(tenantAdmin.email, tenant.organizationName, tenantAdmin.firstName).catch(err =>
        console.error('Failed to send account recovery email:', err)
      );
    }

    await logActivity(req, 'tenant.recovered', 'Tenant', tenant._id, {
      recoveredBy: req.user._id
    });

    successResponse(res, 200, 'Organization account recovered successfully. All users have been reactivated.', {
      tenant
    });
  } catch (error) {
    console.error('Recover tenant error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Assign a manager to a tenant
 * @route   POST /api/tenants/:id/assign-manager
 * @access  SAAS_OWNER only
 */
const assignManager = async (req, res) => {
  try {
    const { id } = req.params;
    const { managerId } = req.body;

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return errorResponse(res, 404, 'Tenant not found');
    }

    if (managerId) {
      const manager = await User.findById(managerId);
      if (!manager || manager.saasRole !== 'Manager') {
        return errorResponse(res, 400, 'Invalid manager — user must have saasRole: Manager');
      }
      tenant.assignedManager = managerId;
      tenant.assignedManagerAt = new Date();
      tenant.assignedManagerBy = req.user._id;
    } else {
      tenant.assignedManager = null;
      tenant.assignedManagerAt = null;
      tenant.assignedManagerBy = null;
    }

    await tenant.save();
    await tenant.populate('assignedManager', 'firstName lastName email');
    await tenant.populate('assignedManagerBy', 'firstName lastName email');

    successResponse(res, 200, 'Manager assigned successfully', { tenant });
  } catch (error) {
    console.error('Assign Manager Error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Bulk assign a manager to multiple tenants
 * @route   POST /api/tenants/bulk-assign-manager
 * @access  SAAS_OWNER only
 * @body    { managerId, tenantIds: [] }
 */
const bulkAssignManager = async (req, res) => {
  try {
    const { managerId, tenantIds } = req.body;

    if (!Array.isArray(tenantIds)) {
      return errorResponse(res, 400, 'tenantIds must be an array');
    }

    if (managerId) {
      const manager = await User.findById(managerId);
      if (!manager || manager.saasRole !== 'Manager') {
        return errorResponse(res, 400, 'Invalid manager — user must have saasRole: Manager');
      }
    }

    // Set assignedManager for all specified tenants
    const now = new Date();
    await Tenant.updateMany(
      { _id: { $in: tenantIds } },
      { $set: {
        assignedManager: managerId || null,
        assignedManagerAt: managerId ? now : null,
        assignedManagerBy: managerId ? req.user._id : null
      }}
    );

    successResponse(res, 200, `Manager ${managerId ? 'assigned to' : 'removed from'} ${tenantIds.length} tenant(s)`, {
      updated: tenantIds.length
    });
  } catch (error) {
    console.error('Bulk Assign Manager Error:', error);
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
  getTenantStats,
  requestDeletion,
  approveDeletion,
  rejectDeletion,
  recoverTenant,
  assignManager,
  bulkAssignManager
};
