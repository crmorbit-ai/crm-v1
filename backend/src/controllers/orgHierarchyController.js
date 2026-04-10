const User = require('../models/User');
const Tenant = require('../models/Tenant');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Check if requesting tenant has crossOrgHierarchy feature
 */
const checkFeatureAccess = async (req) => {
  // SAAS owners always have access
  if (req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN') {
    return true;
  }

  const tenant = await Tenant.findById(req.user.tenant).populate('subscription.plan');
  if (!tenant) return false;

  const plan = tenant.subscription?.plan;
  if (!plan) return false;

  return plan.features?.crossOrgHierarchy === true;
};

/**
 * @desc    Get all tenants list (name + id only) for org switcher
 * @route   GET /api/org-hierarchy/tenants
 * @access  Private — requires crossOrgHierarchy feature
 */
const getOrgList = async (req, res) => {
  try {
    const hasAccess = await checkFeatureAccess(req);
    if (!hasAccess) {
      return errorResponse(res, 403, 'Cross-organization hierarchy view requires an Enterprise subscription');
    }

    const tenants = await Tenant.find({ isActive: true })
      .select('organizationName organizationId slug industry numberOfEmployees')
      .lean();

    return successResponse(res, 200, 'Tenants fetched', { tenants });
  } catch (err) {
    console.error('getOrgList error:', err);
    return errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get users of a target tenant for org hierarchy view (read-only)
 * @route   GET /api/org-hierarchy/:targetTenantId/users
 * @access  Private — requires crossOrgHierarchy feature
 */
const getOrgUsers = async (req, res) => {
  try {
    const hasAccess = await checkFeatureAccess(req);
    if (!hasAccess) {
      return errorResponse(res, 403, 'Cross-organization hierarchy view requires an Enterprise subscription');
    }

    const { targetTenantId } = req.params;

    // Verify target tenant exists and is active
    const targetTenant = await Tenant.findOne({ _id: targetTenantId, isActive: true })
      .select('organizationName organizationId')
      .lean();

    if (!targetTenant) {
      return errorResponse(res, 404, 'Organization not found');
    }

    // Fetch only active users — limited fields (no sensitive data)
    const users = await User.find({ tenant: targetTenantId, isActive: true })
      .select('firstName lastName designation department email phone userType reportsTo isActive createdAt')
      .populate('reportsTo', 'firstName lastName designation')
      .lean();

    return successResponse(res, 200, 'Users fetched', {
      tenant: targetTenant,
      users,
      total: users.length,
    });
  } catch (err) {
    console.error('getOrgUsers error:', err);
    return errorResponse(res, 500, 'Server error');
  }
};

module.exports = { getOrgList, getOrgUsers };
