const { verifyToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/response');
const User = require('../models/User');
const Reseller = require('../models/Reseller');
const BlacklistedToken = require('../models/BlacklistedToken');
const Tenant = require('../models/Tenant');

/**
 * Protect routes - verify JWT token
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    console.log('🔍 Token received:', token ? 'YES' : 'NO');
    console.log('📍 Route:', req.path);
    console.log('🔑 Token length:', token?.length);
    console.log('🔑 Token preview:', token?.substring(0, 20) + '...');

    if (!token) {
      console.log('❌ No token found in header');
      return errorResponse(res, 401, 'Not authorized to access this route');
    }

    // Verify token
    console.log('🔐 Verifying token...');
    const decoded = verifyToken(token);
    console.log('✅ Token decoded:', decoded);

    // ============================================
    // 🔐 TOKEN BLACKLIST CHECK - NEW
    // ============================================
    const isBlacklisted = await BlacklistedToken.findOne({ token });
    if (isBlacklisted) {
      return errorResponse(res, 401, 'Token has been invalidated. Please login again.');
    }
    // ============================================

    // ============================================
    // 🚀 RESELLER SUPPORT - NEW
    // ============================================
    // Check if it's a reseller token
    if (decoded.userType === 'RESELLER') {
      // Use decoded.id (from generateToken)
      const reseller = await Reseller.findById(decoded.id).select('-password');

      if (!reseller) {
        return errorResponse(res, 401, 'Reseller not found');
      }

      if (!reseller.isActive) {
        return errorResponse(res, 401, 'Reseller account is deactivated');
      }

      if (reseller.status !== 'approved') {
        return errorResponse(res, 401, `Reseller status is ${reseller.status}`);
      }

      // Attach reseller to request (similar to user)
      req.user = {
        _id: reseller._id,
        email: reseller.email,
        firstName: reseller.firstName,
        lastName: reseller.lastName,
        userType: 'RESELLER',
        isActive: reseller.isActive,
        status: reseller.status
      };
      
      return next();
    }
    // ============================================

    // Get user from database with populated roles and groups (with their roles)
    const user = await User.findById(decoded.id)
      .populate('roles')
      .populate({
        path: 'groups',
        populate: {
          path: 'roles'
        }
      })
      .select('-password');

    if (!user) {
      return errorResponse(res, 401, 'User not found');
    }

    if (!user.isActive) {
      return errorResponse(res, 401, 'User account is deactivated');
    }

    // ============================================
    // 🔐 DYNAMIC SAAS ADMIN CHECK (from .env)
    // ============================================
    // Check if user's email is in SAAS_ADMIN_EMAILS whitelist
    // Only check if user has an email (email is optional for some users)
    if (user.email) {
      const saasAdminEmails = (process.env.SAAS_ADMIN_EMAILS || '')
        .split(',')
        .map(email => email.trim().toLowerCase())
        .filter(email => email);

      const isInSaasWhitelist = saasAdminEmails.includes(user.email.toLowerCase());

      // If user is in whitelist but not SAAS_OWNER, upgrade them
      if (isInSaasWhitelist && user.userType !== 'SAAS_OWNER') {
        user.userType = 'SAAS_OWNER';
        user.tenant = null; // SAAS owners don't belong to a tenant
        await user.save();
        console.log(`🔑 User ${user.email} upgraded to SAAS_OWNER (added to .env whitelist)`);
      }

      // If user is SAAS_OWNER but NOT in whitelist, downgrade them
      if (!isInSaasWhitelist && user.userType === 'SAAS_OWNER') {
        user.userType = 'TENANT_ADMIN'; // Downgrade to tenant admin
        await user.save();
        console.log(`🔒 User ${user.email} downgraded from SAAS_OWNER (removed from .env whitelist)`);
      }
    }
    // ============================================

    // Attach user to request FIRST (before subscription check)
    req.user = user;

    // ============================================
    // 🔐 TRIAL/SUBSCRIPTION CHECK
    // ============================================
    // Skip subscription check for SAAS_OWNER and SAAS_ADMIN
    if (user.userType !== 'SAAS_OWNER' && user.userType !== 'SAAS_ADMIN' && user.tenant) {
      try {
        const tenant = await Tenant.findById(user.tenant);

        if (tenant) {
          // 🎟️ LIFETIME LICENSE CHECK - Skip all other checks if enabled
          if (tenant.subscription && tenant.subscription.lifetimeLicense && tenant.subscription.lifetimeLicense.enabled) {
            // Lifetime license - unlimited access, no expiry
            // Allow all requests
            req.user.hasLifetimeLicense = true;
          } else {
            // Regular trial/subscription checks

            // Check if trial is expired
            if (tenant.subscription && tenant.subscription.isTrialActive) {
              const trialEndDate = new Date(tenant.subscription.trialEndDate);
              const now = new Date();

              if (now > trialEndDate) {
                // Trial expired
                return errorResponse(res, 403, 'Your trial period has expired. Please subscribe to continue using the service.');
              }
            }

            // Check if subscription is active (for paid accounts)
            if (tenant.subscription && tenant.subscription.status === 'active') {
              const endDate = tenant.subscription.endDate;
              if (endDate && new Date() > new Date(endDate)) {
                return errorResponse(res, 403, 'Your subscription has expired. Please renew to continue.');
              }
            }

            // Check if subscription is cancelled or expired
            if (tenant.subscription && ['cancelled', 'expired'].includes(tenant.subscription.status)) {
              return errorResponse(res, 403, 'Your subscription is not active. Please contact support or renew your subscription.');
            }
          }
        }
      } catch (tenantError) {
        console.error('Tenant subscription check error:', tenantError);
        // Don't block if tenant check fails - log and continue
      }
    }
    // ============================================

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return errorResponse(res, 401, 'Not authorized to access this route');
  }
};

/**
 * Restrict to specific user types
 * @param  {...String} userTypes - Allowed user types
 */
const restrictTo = (...userTypes) => {
  return (req, res, next) => {
    if (!userTypes.includes(req.user.userType)) {
      return errorResponse(res, 403, 'You do not have permission to perform this action');
    }
    next();
  };
};

/**
 * Ensure user belongs to a tenant
 */
const requireTenant = (req, res, next) => {
  if (!req.user.tenant) {
    return errorResponse(res, 403, 'This action requires tenant context');
  }
  next();
};

/**
 * Ensure user is SAAS owner or admin
 * Double-checks against .env whitelist for security
 */
const requireSaasAccess = (req, res, next) => {
  // First check userType
  if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
    return errorResponse(res, 403, 'SAAS admin access required');
  }

  // Double-check against .env whitelist for SAAS_OWNER
  if (req.user.userType === 'SAAS_OWNER') {
    // Only check email if user has one
    if (req.user.email) {
      const saasAdminEmails = (process.env.SAAS_ADMIN_EMAILS || '')
        .split(',')
        .map(email => email.trim().toLowerCase())
        .filter(email => email);

      if (!saasAdminEmails.includes(req.user.email.toLowerCase())) {
        return errorResponse(res, 403, 'Your email is not authorized for SAAS admin access');
      }
    }
  }

  next();
};

/**
 * ============================================
 * 🚀 RESELLER MIDDLEWARE - NEW
 * ============================================
 * Ensure user is a reseller
 */
const requireReseller = (req, res, next) => {
  if (req.user.userType !== 'RESELLER') {
    return errorResponse(res, 403, 'Reseller access required');
  }
  next();
};

/**
 * Verify tenant context matches
 * For routes with :tenantId parameter
 */
const verifyTenantContext = (req, res, next) => {
  // SAAS owners can access any tenant
  if (req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN') {
    return next();
  }

  const tenantId = req.params.tenantId || req.body.tenant;

  if (!tenantId) {
    return errorResponse(res, 400, 'Tenant ID required');
  }

  if (req.user.tenant.toString() !== tenantId.toString()) {
    return errorResponse(res, 403, 'Access denied to this tenant');
  }

  next();
};

/**
 * Require profile completion
 * Forces users to complete their profile before accessing protected routes
 * Exceptions: /auth/complete-profile, /auth/me, /auth/logout
 */
const requireProfileComplete = (req, res, next) => {
  // SAAS owners and admins don't need profile completion
  if (req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN') {
    return next();
  }

  // Resellers don't need profile completion
  if (req.user.userType === 'RESELLER') {
    return next();
  }

  // Check if user has completed profile
  if (!req.user.isProfileComplete) {
    return errorResponse(res, 403, 'Please complete your profile to access this feature', {
      requiresProfileCompletion: true,
      redirectTo: '/complete-profile'
    });
  }

  next();
};

module.exports = {
  protect,
  restrictTo,
  requireTenant,
  requireSaasAccess,
  requireReseller,
  verifyTenantContext,
  requireProfileComplete
};