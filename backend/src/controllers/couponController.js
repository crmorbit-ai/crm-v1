const Coupon = require('../models/Coupon');
const Tenant = require('../models/Tenant');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Generate random coupon code
 */
const generateCouponCode = () => {
  const prefix = 'LIC';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}${random}`;
};

/**
 * Create new coupon (SAAS Admin only)
 * POST /api/coupons
 */
exports.createCoupon = async (req, res) => {
  try {
    const { code, description, notes, expiresAt } = req.body;

    // Generate code if not provided
    const couponCode = code || generateCouponCode();

    // Check if code already exists
    const existing = await Coupon.findOne({ code: couponCode });
    if (existing) {
      return errorResponse(res, 400, 'Coupon code already exists');
    }

    const coupon = await Coupon.create({
      code: couponCode,
      description: description || 'Lifetime unlimited access license',
      notes,
      expiresAt,
      createdBy: req.user._id,
      type: 'lifetime'
    });

    return successResponse(res, 201, 'Coupon created successfully', coupon);
  } catch (error) {
    console.error('Create coupon error:', error);
    return errorResponse(res, 500, error.message || 'Failed to create coupon');
  }
};

/**
 * Get all coupons (SAAS Admin only)
 * GET /api/coupons
 */
exports.getAllCoupons = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const coupons = await Coupon.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .populate('usedBy', 'organizationName email')
      .sort({ createdAt: -1 });

    return successResponse(res, 200, 'Coupons retrieved successfully', {
      coupons,
      total: coupons.length
    });
  } catch (error) {
    console.error('Get coupons error:', error);
    return errorResponse(res, 500, error.message || 'Failed to retrieve coupons');
  }
};

/**
 * Validate coupon code
 * GET /api/coupons/validate/:code
 */
exports.validateCoupon = async (req, res) => {
  try {
    const { code } = req.params;

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return errorResponse(res, 'Invalid coupon code. Please check and try again.', 404);
    }

    const validation = coupon.isValidForUse();

    if (!validation.valid) {
      return errorResponse(res, validation.reason, 400);
    }

    return successResponse(res, 200, 'Coupon is valid', {
      code: coupon.code,
      description: coupon.description,
      benefits: coupon.benefits
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    return errorResponse(res, error.message || 'Failed to validate coupon', 500);
  }
};

/**
 * Apply coupon to tenant (Tenant Admin)
 * POST /api/coupons/apply
 */
exports.applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user._id;
    const tenantId = req.user.tenant;

    if (!tenantId) {
      return errorResponse(res, 'User is not associated with a tenant', 400);
    }

    // Find coupon
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return errorResponse(res, 'Invalid coupon code. Please check and try again.', 404);
    }

    // Validate coupon
    const validation = coupon.isValidForUse();
    if (!validation.valid) {
      return errorResponse(res, validation.reason, 400);
    }

    // Get tenant
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return errorResponse(res, 'Tenant not found', 404);
    }

    // Check if tenant already has lifetime license
    if (tenant.subscription.lifetimeLicense && tenant.subscription.lifetimeLicense.enabled) {
      return errorResponse(res, 'Your account already has a lifetime license activated.', 400);
    }

    // Apply lifetime license
    tenant.subscription.lifetimeLicense = {
      enabled: true,
      couponCode: coupon.code,
      coupon: coupon._id,
      activatedAt: new Date(),
      activatedBy: userId,
      notes: `Applied coupon: ${coupon.code}`
    };

    // Update subscription status
    tenant.subscription.status = 'active';
    tenant.subscription.isTrialActive = false;

    await tenant.save();

    // Mark coupon as used
    await coupon.markAsUsed(tenantId);

    return successResponse(res, 200, 'Lifetime license activated successfully!', {
      tenant: {
        companyName: tenant.companyName,
        lifetimeLicense: tenant.subscription.lifetimeLicense
      },
      coupon: {
        code: coupon.code,
        description: coupon.description,
        benefits: coupon.benefits
      }
    });
  } catch (error) {
    console.error('Apply coupon error:', error);
    return errorResponse(res, error.message || 'Failed to apply coupon', 500);
  }
};

/**
 * Revoke lifetime license from tenant (SAAS Admin only)
 * POST /api/coupons/revoke/:tenantId
 */
exports.revokeLicense = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { reason } = req.body;

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return errorResponse(res, 404, 'Tenant not found');
    }

    if (!tenant.subscription.lifetimeLicense || !tenant.subscription.lifetimeLicense.enabled) {
      return errorResponse(res, 400, 'Tenant does not have a lifetime license');
    }

    // Store coupon ID before revoking (for re-enable later)
    const previousCouponId = tenant.subscription.lifetimeLicense.coupon;
    const previousCouponCode = tenant.subscription.lifetimeLicense.couponCode;

    // Revoke coupon
    if (previousCouponId) {
      const coupon = await Coupon.findById(previousCouponId);
      if (coupon) {
        await coupon.revoke();
      }
    }

    // Remove lifetime license but keep coupon reference for re-enable
    tenant.subscription.lifetimeLicense = {
      enabled: false,
      couponCode: previousCouponCode, // Keep for re-enable
      coupon: previousCouponId,       // Keep for re-enable
      activatedAt: null,
      activatedBy: null,
      notes: reason || 'License revoked by SAAS admin'
    };

    // Restore to trial (check if trial is still valid)
    const now = new Date();
    const trialEndDate = new Date(tenant.subscription.trialEndDate);

    if (now <= trialEndDate) {
      // Trial still valid
      tenant.subscription.status = 'trial';
      tenant.subscription.isTrialActive = true;
    } else {
      // Trial expired - give 7 more days grace period to renew
      tenant.subscription.status = 'trial';
      tenant.subscription.isTrialActive = true;
      tenant.subscription.trialEndDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    }

    await tenant.save();

    return successResponse(res, 200, 'Lifetime license revoked successfully', {
      tenant: {
        companyName: tenant.companyName,
        status: tenant.subscription.status
      }
    });
  } catch (error) {
    console.error('Revoke license error:', error);
    return errorResponse(res, 500, error.message || 'Failed to revoke license');
  }
};

/**
 * Re-enable premium access for tenant (SAAS Admin only)
 * POST /api/coupons/re-enable/:tenantId
 */
exports.reEnableLicense = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { couponCode } = req.body;

    console.log('🔄 Re-enable request:', { tenantId, couponCode });

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return errorResponse(res, 404, 'Tenant not found');
    }

    console.log('✅ Tenant found:', tenant.organizationName);
    console.log('📋 Current license state:', tenant.subscription.lifetimeLicense);

    // Check if tenant already has premium
    if (tenant.subscription.lifetimeLicense?.enabled) {
      return errorResponse(res, 400, 'Tenant already has premium access');
    }

    // Find coupon (either from request or previously used one)
    let coupon;
    if (couponCode) {
      console.log('🎟️ Using provided coupon code:', couponCode);
      coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (!coupon) {
        return errorResponse(res, 404, 'Coupon not found');
      }
    } else if (tenant.subscription.lifetimeLicense?.coupon) {
      console.log('🎟️ Reusing previous coupon ID:', tenant.subscription.lifetimeLicense.coupon);
      // Reuse previously revoked coupon
      coupon = await Coupon.findById(tenant.subscription.lifetimeLicense.coupon);
      if (!coupon) {
        console.error('❌ Previous coupon not found in database');
        return errorResponse(res, 404, 'Previous coupon not found');
      }
      console.log('✅ Found previous coupon:', coupon.code, 'Status:', coupon.status);
    } else {
      // Fallback: Try to find revoked coupon by this tenant
      console.log('🔍 No coupon reference found, searching revoked coupons for this tenant...');
      coupon = await Coupon.findOne({
        usedBy: tenantId,
        status: 'revoked'
      });

      if (!coupon) {
        // Try to find used coupon by this tenant (in case status wasn't updated)
        console.log('🔍 Checking used coupons...');
        coupon = await Coupon.findOne({
          usedBy: tenantId,
          status: 'used'
        });
      }

      if (!coupon) {
        console.error('❌ No coupon found for this tenant');
        return errorResponse(res, 400, 'No coupon found for this tenant. Please provide a coupon code.');
      }

      console.log('✅ Found coupon by tenant lookup:', coupon.code, 'Status:', coupon.status);
    }

    console.log('🎟️ Coupon details:', { code: coupon.code, status: coupon.status, usedBy: coupon.usedBy });

    // Reactivate coupon if it was revoked or already used by this tenant
    if (coupon.status === 'revoked') {
      console.log('↻ Reactivating revoked coupon');
      coupon.status = 'used';
      coupon.usedBy = tenantId;
      await coupon.save();
    } else if (coupon.status === 'used') {
      // If already used, check if by same tenant
      if (coupon.usedBy?.toString() !== tenantId.toString()) {
        console.error('❌ Coupon used by different tenant:', coupon.usedBy);
        return errorResponse(res, 400, 'Coupon is already used by another tenant');
      }
      console.log('✅ Coupon already used by this tenant - reactivating');
      // Already used by this tenant - just reactivate
    } else if (coupon.status === 'active') {
      console.log('✅ Coupon is active - marking as used');
      coupon.status = 'used';
      coupon.usedBy = tenantId;
      await coupon.save();
    }

    // Re-enable premium access
    tenant.subscription.lifetimeLicense = {
      enabled: true,
      couponCode: coupon.code,
      coupon: coupon._id,
      activatedAt: new Date(),
      activatedBy: req.user._id,
      notes: 'Re-enabled by SAAS admin'
    };

    tenant.subscription.status = 'active';
    tenant.subscription.isTrialActive = false;

    await tenant.save();

    console.log('✅ Premium access re-enabled successfully for:', tenant.organizationName);

    return successResponse(res, 200, 'Premium access re-enabled successfully', {
      tenant: {
        organizationName: tenant.organizationName,
        email: tenant.email,
        status: tenant.subscription.status
      }
    });
  } catch (error) {
    console.error('Re-enable license error:', error);
    return errorResponse(res, 500, error.message || 'Failed to re-enable license');
  }
};

/**
 * Delete coupon (SAAS Admin only)
 * DELETE /api/coupons/:couponId
 */
exports.deleteCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return errorResponse(res, 404, 'Coupon not found');
    }

    // Check if coupon is used
    if (coupon.status === 'used') {
      return errorResponse(res, 400, 'Cannot delete used coupon. Revoke the license first.');
    }

    await coupon.deleteOne();

    return successResponse(res, 200, 'Coupon deleted successfully');
  } catch (error) {
    console.error('Delete coupon error:', error);
    return errorResponse(res, 500, error.message || 'Failed to delete coupon');
  }
};

/**
 * Get tenant's license info
 * GET /api/coupons/my-license
 */
exports.getMyLicense = async (req, res) => {
  try {
    const tenantId = req.user.tenant;

    if (!tenantId) {
      return errorResponse(res, 400, 'User is not associated with a tenant');
    }

    const tenant = await Tenant.findById(tenantId)
      .populate('subscription.lifetimeLicense.coupon')
      .populate('subscription.lifetimeLicense.activatedBy', 'firstName lastName email');

    if (!tenant) {
      return errorResponse(res, 404, 'Tenant not found');
    }

    return successResponse(res, 200, 'License info retrieved', {
      hasLifetimeLicense: tenant.subscription.lifetimeLicense?.enabled || false,
      license: tenant.subscription.lifetimeLicense || null,
      subscription: {
        status: tenant.subscription.status,
        isTrialActive: tenant.subscription.isTrialActive,
        trialEndDate: tenant.subscription.trialEndDate
      }
    });
  } catch (error) {
    console.error('Get license error:', error);
    return errorResponse(res, 500, error.message || 'Failed to retrieve license info');
  }
};

module.exports = exports;
