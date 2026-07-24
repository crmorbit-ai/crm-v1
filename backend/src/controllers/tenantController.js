const mongoose    = require('mongoose');
const Tenant      = require('../models/Tenant');
const User        = require('../models/User');
const Subscription = require('../models/Subscription');
const PlanHistory = require('../models/PlanHistory');
const ActivityLog = require('../models/ActivityLog');
const Lead        = require('../models/Lead');
const Account     = require('../models/Account');
const Contact     = require('../models/Contact');
const Opportunity = require('../models/Opportunity');
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
 * Generate unique deletion request ID in format: DRQ-YYYY-XXXX
 */
const generateDeletionRequestId = async () => {
  const year = new Date().getFullYear();
  const prefix = `DRQ-${year}-`;

  // Find the latest deletion request ID for this year
  const latestTenant = await Tenant.findOne({
    'deletionRequest.requestId': { $regex: `^${prefix}` }
  })
    .sort({ 'deletionRequest.requestId': -1 })
    .select('deletionRequest.requestId')
    .lean();

  let nextNumber = 1;
  if (latestTenant?.deletionRequest?.requestId) {
    const lastNumber = parseInt(latestTenant.deletionRequest.requestId.split('-')[2]);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

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
      .populate('assignedManagerBy', 'firstName lastName email')
      .populate('subscription.lifetimeLicense.coupon', 'code description')
      .populate('subscription.lifetimeLicense.activatedBy', 'firstName lastName email');

    if (!tenant) {
      return errorResponse(res, 404, 'Tenant not found');
    }

    // Get additional stats
    const userCount = await User.countDocuments({ tenant: tenant._id });
    const adminUser = await User.findOne({ tenant: tenant._id, userType: 'TENANT_ADMIN' })
      .select('firstName lastName email phone');

    // Get usage stats from other models
    const Lead = require('../models/Lead');
    const Contact = require('../models/Contact');
    const Account = require('../models/Account');

    const [leadsCount, contactsCount, accountsCount] = await Promise.all([
      Lead.countDocuments({ tenant: tenant._id }),
      Contact.countDocuments({ tenant: tenant._id }),
      Account.countDocuments({ tenant: tenant._id })
    ]);

    const tenantData = {
      ...tenant.toObject(),
      stats: {
        users: userCount,
        leads: leadsCount,
        contacts: contactsCount,
        accounts: accountsCount
      },
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

    // Generate unique deletion request ID
    const requestId = await generateDeletionRequestId();

    tenant.deletionRequest = {
      requestId: requestId,
      status: 'pending',
      requestedAt: new Date(),
      reason: reason || '',
      requestedBy: req.user._id
    };

    // NOTE: We DON'T deactivate tenant or cancel subscription in pending state
    // Only block all users. Tenant/subscription will be cancelled only on approval.

    await tenant.save();

    // Block ALL tenant users immediately (admin + team members)
    await User.updateMany({ tenant: tenant._id }, { isActive: false });

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
      sendDeletionRequestConfirmation(tenantAdmin.email, tenant.organizationName, tenantAdmin.firstName, requestId).catch(err =>
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
    permanentDeleteAt.setDate(permanentDeleteAt.getDate() + 30);

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
      reason:     'Deletion request approved — 30 day window',
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

    successResponse(res, 200, 'Deletion request approved. Account will be permanently deleted after 30 days.', {
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
  const session = await require('mongoose').startSession();
  session.startTransaction();

  try {
    const { rejectionReason } = req.body;
    const tenant = await Tenant.findById(req.params.id).session(session);

    if (!tenant) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse(res, 404, 'Tenant not found');
    }

    if (!tenant.deletionRequest || tenant.deletionRequest.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return errorResponse(res, 400, 'No pending deletion request found for this organization.');
    }

    console.log(`🔄 Rejecting deletion for tenant: ${tenant.organizationName} (${tenant._id})`);

    tenant.deletionRequest.status = 'rejected';
    tenant.deletionRequest.rejectedAt = new Date();
    tenant.deletionRequest.rejectedBy = req.user._id;
    tenant.deletionRequest.rejectionReason = rejectionReason || '';

    // Save tenant changes
    await tenant.save({ session });
    console.log(`✅ Tenant deletion status updated to 'rejected'`);

    // Reactivate ALL tenant users (they were blocked during pending state)
    const updateResult = await User.updateMany(
      { tenant: tenant._id },
      { $set: { isActive: true } },
      { session }
    );
    console.log(`✅ Reactivated ${updateResult.modifiedCount} users for tenant ${tenant.organizationName}`);

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Get tenant admin email (after transaction committed)
    const tenantAdmin = await User.findOne({ tenant: tenant._id, userType: 'TENANT_ADMIN' }).select('email firstName');
    if (tenantAdmin) {
      sendDeletionRejectedEmail(tenantAdmin.email, tenant.organizationName, rejectionReason, tenantAdmin.firstName).catch(err =>
        console.error('Failed to send deletion rejection email:', err)
      );
    }

    await logActivity(req, 'tenant.deletion_rejected', 'Tenant', tenant._id, {
      rejectionReason,
      rejectedBy: req.user._id,
      usersReactivated: updateResult.modifiedCount
    });

    console.log(`🎉 Deletion rejection complete for ${tenant.organizationName} - ${updateResult.modifiedCount} users reactivated`);

    successResponse(res, 200, 'Deletion request rejected. Organization account remains active.', {
      deletionRequest: tenant.deletionRequest,
      usersReactivated: updateResult.modifiedCount
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ Reject deletion error:', error);
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
    console.log('🔄 RECOVERY API CALLED for tenant:', req.params.id);
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      console.log('❌ RECOVERY: Tenant not found');
      return errorResponse(res, 404, 'Tenant not found');
    }

    console.log('📊 RECOVERY: Tenant found -', tenant.organizationName);
    console.log('   deletionRequest.status:', tenant.deletionRequest?.status);
    console.log('   subscription.status:', tenant.subscription?.status);

    if (!tenant.deletionRequest || tenant.deletionRequest.status !== 'approved') {
      return errorResponse(res, 400, 'This organization does not have an approved deletion request.');
    }

    if (tenant.deletionRequest.permanentDeleteAt && new Date() > tenant.deletionRequest.permanentDeleteAt) {
      return errorResponse(res, 400, 'Recovery window has expired. This organization cannot be recovered.');
    }

    // Reset deletion request and reactivate
    tenant.deletionRequest = undefined; // Completely remove deletion request
    tenant.isActive = true;
    tenant.isSuspended = false; // Also unsuspend if suspended

    // Fix subscription if expired/cancelled during deletion period
    console.log('🔧 RECOVERY: Checking subscription status:', tenant.subscription?.status);

    if (tenant.subscription && ['expired', 'cancelled'].includes(tenant.subscription.status)) {
      console.log('🔧 RECOVERY: Subscription is', tenant.subscription.status, '→ Fixing to active');
      tenant.subscription.status = 'active';

      // Extend trial/subscription by 30 days as recovery benefit
      const extendDate = new Date();
      extendDate.setDate(extendDate.getDate() + 30);

      if (tenant.subscription.isTrialActive) {
        tenant.subscription.trialEndDate = extendDate;
        console.log('🔧 RECOVERY: Trial extended to', extendDate.toISOString());
      } else {
        tenant.subscription.endDate = extendDate;
        console.log('🔧 RECOVERY: Subscription extended to', extendDate.toISOString());
      }
    } else {
      console.log('🔧 RECOVERY: Subscription status OK, no fix needed');
    }

    await tenant.save();
    console.log('✅ RECOVERY: Tenant saved successfully');

    // Reactivate all tenant users and ensure they're not suspended
    await User.updateMany(
      { tenant: tenant._id },
      {
        isActive: true,
        $unset: { suspendedAt: 1, suspendedBy: 1, suspensionReason: 1 }
      }
    );

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

/**
 * @desc    Force reactivate all users for a tenant (emergency fix)
 * @route   POST /api/tenants/:id/reactivate-users
 * @access  Private (SAAS_OWNER / SAAS_ADMIN only)
 */
const forceReactivateUsers = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return errorResponse(res, 404, 'Tenant not found');
    }

    const updateResult = await User.updateMany(
      { tenant: tenant._id },
      { $set: { isActive: true } }
    );

    console.log(`🔧 Force reactivated ${updateResult.modifiedCount} users for tenant ${tenant.organizationName}`);

    successResponse(res, 200, `Reactivated ${updateResult.modifiedCount} users`, {
      modifiedCount: updateResult.modifiedCount,
      tenantName: tenant.organizationName
    });
  } catch (error) {
    console.error('Force reactivate users error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get tenant activity tracking (Login/Logout, Feature Usage, Counts)
 * @route   GET /api/tenants/:id/activity
 * @access  Private (SAAS Admin only)
 */
const getTenantActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return errorResponse(res, 404, 'Tenant not found');
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    // 1. Login/Logout Count (separate query for accurate count)
    const loginCount = await ActivityLog.countDocuments({
      tenant: id,
      action: 'login.success',
      createdAt: { $gte: daysAgo }
    });

    const logoutCount = await ActivityLog.countDocuments({
      tenant: id,
      action: 'logout',
      createdAt: { $gte: daysAgo }
    });

    // 2. Recent Login/Logout Activity (for display - limited to 100)
    const loginActivity = await ActivityLog.find({
      tenant: id,
      action: { $in: ['login.success', 'logout'] },
      createdAt: { $gte: daysAgo }
    })
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

    console.log(`[getTenantActivity] Tenant: ${id}, Days: ${days}, Logins: ${loginCount}, Logouts: ${logoutCount}, Recent activities: ${loginActivity.length}`);

    // 3. Feature Usage Summary
    const featureUsage = await ActivityLog.aggregate([
      {
        $match: {
          tenant: new mongoose.Types.ObjectId(id),
          createdAt: { $gte: daysAgo },
          action: {
            $in: [
              'lead.created', 'lead.updated', 'lead.converted',
              'account.created', 'account.updated',
              'contact.created', 'contact.updated',
              'opportunity.created', 'opportunity.updated',
              'task.created', 'meeting.created', 'call.created'
            ]
          }
        }
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          lastUsed: { $max: '$createdAt' }
        }
      }
    ]);

    // 4. Current Data Counts
    const [leadsCount, accountsCount, contactsCount, opportunitiesCount] = await Promise.all([
      Lead.countDocuments({ tenant: id }),
      Account.countDocuments({ tenant: id }),
      Contact.countDocuments({ tenant: id }),
      Opportunity.countDocuments({ tenant: id })
    ]);

    // 5. Converted Leads Count
    const convertedLeadsCount = await Lead.countDocuments({
      tenant: id,
      leadStatus: 'Converted'
    });

    // 6. Active Users Count
    const activeUsersCount = await User.countDocuments({
      tenant: id,
      isActive: true
    });

    // 7. Recent Activities (grouped by feature)
    const featureStats = {
      leads: {
        total: leadsCount,
        convertedTotal: convertedLeadsCount,  // Total converted (all time)
        created: featureUsage.find(f => f._id === 'lead.created')?.count || 0,
        updated: featureUsage.find(f => f._id === 'lead.updated')?.count || 0,
        convertedInPeriod: featureUsage.find(f => f._id === 'lead.converted')?.count || 0
      },
      accounts: {
        total: accountsCount,
        created: featureUsage.find(f => f._id === 'account.created')?.count || 0,
        updated: featureUsage.find(f => f._id === 'account.updated')?.count || 0
      },
      contacts: {
        total: contactsCount,
        created: featureUsage.find(f => f._id === 'contact.created')?.count || 0,
        updated: featureUsage.find(f => f._id === 'contact.updated')?.count || 0
      },
      opportunities: {
        total: opportunitiesCount,
        created: featureUsage.find(f => f._id === 'opportunity.created')?.count || 0,
        updated: featureUsage.find(f => f._id === 'opportunity.updated')?.count || 0
      },
      tasks: {
        created: featureUsage.find(f => f._id === 'task.created')?.count || 0
      },
      meetings: {
        created: featureUsage.find(f => f._id === 'meeting.created')?.count || 0
      },
      calls: {
        created: featureUsage.find(f => f._id === 'call.created')?.count || 0
      }
    };

    // 8. Login Stats
    const loginStats = {
      totalLogins: loginCount,  // Use accurate count, not limited array length
      totalLogouts: logoutCount,
      lastLogin: loginActivity.find(a => a.action === 'login.success')?.createdAt || null,
      activeUsers: activeUsersCount
    };

    console.log(`[getTenantActivity] Login Stats:`, loginStats);
    console.log(`[getTenantActivity] Feature Stats (Leads):`, featureStats.leads);

    successResponse(res, {
      tenant: {
        id: tenant._id,
        name: tenant.organizationName,
        email: tenant.email
      },
      period: { days: parseInt(days), from: daysAgo },
      loginStats,
      featureStats,
      recentLoginActivity: loginActivity.slice(0, 20) // Last 20 logins/logouts
    });

  } catch (error) {
    console.error('Get tenant activity error:', error);
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
  bulkAssignManager,
  forceReactivateUsers,
  getTenantActivity
};
