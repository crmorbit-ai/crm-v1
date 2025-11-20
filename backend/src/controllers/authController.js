const User = require('../models/User');
const Tenant = require('../models/Tenant');
const Subscription = require('../models/Subscription');
const Reseller = require('../models/Reseller');
const { generateToken } = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sendPasswordResetOTP } = require('../utils/emailService');

/**
 * Generate 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return errorResponse(res, 400, 'Please provide email and password');
    }

    // Find user
    const user = await User.findOne({ email }).populate('roles').populate('tenant');

    if (!user) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      return errorResponse(res, 401, 'Account is deactivated');
    }

    // Check if tenant is active (for tenant users)
    if (user.tenant && user.tenant.isSuspended) {
      return errorResponse(res, 401, 'Your organization account is suspended');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    // Log activity
    await logActivity(
      { user, ip: req.ip, get: req.get.bind(req), method: req.method, originalUrl: req.originalUrl, connection: req.connection },
      'login.success',
      'User',
      user._id
    );

    successResponse(res, 200, 'Login successful', {
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    errorResponse(res, 500, 'Server error during login');
  }
};

/**
 * @desc    Register new tenant organization
 * @route   POST /api/auth/register-tenant
 * @access  Public
 */
const registerTenant = async (req, res) => {
  try {
    const {
      organizationName,
      slug,
      contactEmail,
      contactPhone,
      adminFirstName,
      adminLastName,
      adminEmail,
      adminPassword,
      resellerId
    } = req.body;

    // Validation
    if (!organizationName || !slug || !contactEmail || !adminFirstName || !adminLastName || !adminEmail || !adminPassword) {
      return errorResponse(res, 400, 'Please provide all required fields');
    }

    // Check if tenant slug already exists
    const existingTenant = await Tenant.findOne({ slug });
    if (existingTenant) {
      return errorResponse(res, 400, 'Organization slug already exists');
    }

    // Check if admin email already exists
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      return errorResponse(res, 400, 'Email already registered');
    }

    // ============================================
    // 💰 GET FREE SUBSCRIPTION PLAN
    // ============================================
    const SubscriptionPlan = require('../models/SubscriptionPlan');
    const freePlan = await SubscriptionPlan.findOne({ name: 'Free', isActive: true });
    
    if (!freePlan) {
      return errorResponse(res, 500, 'Default subscription plan not found. Please contact support.');
    }

    // Calculate trial end date
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + freePlan.trialDays);

    // ============================================
    // CREATE TENANT WITH SUBSCRIPTION
    // ============================================
    const tenant = await Tenant.create({
      organizationName,
      slug,
      contactEmail,
      contactPhone,
      
      // Subscription Details
      subscription: {
        plan: freePlan._id,
        planName: freePlan.name,
        status: 'trial',
        isTrialActive: true,
        trialStartDate: new Date(),
        trialEndDate: trialEndDate,
        startDate: new Date(),
        billingCycle: 'monthly',
        amount: 0,
        currency: 'INR',
        autoRenew: true
      },
      
      // Usage tracking
      usage: {
        users: 1, // Admin user
        leads: 0,
        contacts: 0,
        deals: 0,
        storage: 0,
        emailsSentToday: 0,
        lastEmailResetDate: new Date()
      },
      
      // Legacy fields for backward compatibility
      subscriptionTier: 'free',
      subscriptionStatus: 'trial',
      subscriptionStartDate: new Date(),
      subscriptionEndDate: trialEndDate,
      maxUsers: freePlan.limits.users,
      maxStorage: freePlan.limits.storage,
      
      isActive: true
    });

    // ============================================
    // 🚀 RESELLER INTEGRATION
    // ============================================
    if (resellerId) {
      try {
        const Reseller = require('../models/Reseller');
        const reseller = await Reseller.findById(resellerId);
        
        if (reseller && reseller.status === 'approved') {
          tenant.reseller = reseller._id;
          tenant.commissionRate = reseller.commissionRate;
          await tenant.save();
          
          console.log(`✅ Tenant ${organizationName} linked to reseller ${reseller.firstName} ${reseller.lastName}`);
        }
      } catch (resellerError) {
        console.error('Reseller linking error:', resellerError);
      }
    }

    // ============================================
    // CREATE TENANT ADMIN ROLE WITH FULL PERMISSIONS
    // ============================================
    const Role = require('../models/Role');

    // Create tenant-specific admin role with full CRM permissions
    const tenantAdminRole = await Role.create({
      name: 'Tenant Admin',
      slug: 'tenant-admin',
      description: 'Full access to all tenant features and settings',
      tenant: tenant._id,
      roleType: 'custom',
      permissions: [
        // User & Role Management
        { feature: 'user_management', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { feature: 'role_management', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { feature: 'group_management', actions: ['create', 'read', 'update', 'delete', 'manage'] },

        // CRM Features
        { feature: 'lead_management', actions: ['create', 'read', 'update', 'delete', 'convert', 'import', 'export', 'manage'] },
        { feature: 'account_management', actions: ['create', 'read', 'update', 'delete', 'export', 'manage'] },
        { feature: 'contact_management', actions: ['create', 'read', 'update', 'delete', 'export', 'manage'] },
        { feature: 'opportunity_management', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { feature: 'activity_management', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { feature: 'task_management', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { feature: 'meeting_management', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { feature: 'call_management', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { feature: 'note_management', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { feature: 'report_management', actions: ['read', 'create', 'export', 'manage'] },

        // Advanced Features
        { feature: 'advanced_analytics', actions: ['read', 'manage'] },
        { feature: 'api_access', actions: ['read', 'manage'] }
      ],
      level: 100,
      isActive: true
    });

    console.log(`✓ Created tenant admin role for ${organizationName}`);

    // ============================================
    // CREATE ADMIN USER
    // ============================================
    const adminUser = await User.create({
      email: adminEmail,
      password: adminPassword,
      firstName: adminFirstName,
      lastName: adminLastName,
      userType: 'TENANT_ADMIN',
      tenant: tenant._id,
      roles: [tenantAdminRole._id],
      isActive: true
    });

    await adminUser.populate('roles');

    // Generate token
    const token = generateToken(adminUser);

    // Remove password from response
    const userResponse = adminUser.toObject();
    delete userResponse.password;

    successResponse(res, 201, 'Registration successful! Your 15-day free trial has started.', {
      token,
      user: userResponse,
      tenant: {
        _id: tenant._id,
        organizationName: tenant.organizationName,
        slug: tenant.slug
      },
      subscription: {
        plan: freePlan.name,
        status: 'trial',
        trialDaysRemaining: freePlan.trialDays
      }
    });

  } catch (error) {
    console.error('Tenant registration error:', error);
    errorResponse(res, 500, 'Server error during registration');
  }
};
/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    // ============================================
    // 🚀 RESELLER SUPPORT - NEW
    // ============================================
    // Check if user is a reseller
    if (req.user.userType === 'RESELLER') {
      const reseller = await Reseller.findById(req.user._id).select('-password');
      return successResponse(res, 200, 'Reseller profile retrieved', reseller);
    }
    // ============================================

    const user = await User.findById(req.user._id)
      .populate('roles')
      .populate('groups')
      .populate('tenant')
      .select('-password');

    successResponse(res, 200, 'User profile retrieved', user);
  } catch (error) {
    console.error('Get me error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res) => {
  try {
    // Log activity
    await logActivity(req, 'logout', 'User', req.user._id);

    successResponse(res, 200, 'Logout successful');
  } catch (error) {
    console.error('Logout error:', error);
    errorResponse(res, 500, 'Server error during logout');
  }
};

/**
 * @desc    Send OTP for password reset
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, 400, 'Please provide email');
    }

    // Find user
    const user = await User.findOne({ email, isActive: true });

    if (!user) {
      // Don't reveal if user exists - security best practice
      return successResponse(res, 200, 'If an account exists with this email, you will receive an OTP.');
    }

    // Generate 6-digit OTP
    const otp = generateOTP();
    
    // Hash OTP before saving
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    // Save OTP to user
    user.resetPasswordOTP = otpHash;
    user.resetPasswordOTPExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.resetPasswordOTPVerified = false;
    await user.save();

    // Send OTP email
    try {
      await sendPasswordResetOTP(
        user.email,
        otp,
        `${user.firstName} ${user.lastName}`
      );

      console.log('✅ OTP sent to:', user.email);
      console.log('🔢 OTP (for testing):', otp); // REMOVE IN PRODUCTION

      successResponse(res, 200, 'OTP sent to your email', {
        message: 'Please check your email for the OTP code.',
        email: user.email
      });

    } catch (emailError) {
      console.error('❌ OTP email failed:', emailError);

      // Clear OTP if email fails
      user.resetPasswordOTP = undefined;
      user.resetPasswordOTPExpire = undefined;
      await user.save();

      return errorResponse(res, 500, 'Failed to send OTP. Please try again.');
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Verify OTP
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return errorResponse(res, 400, 'Please provide email and OTP');
    }

    // Hash the provided OTP
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    // Find user with valid OTP
    const user = await User.findOne({
      email,
      resetPasswordOTP: otpHash,
      resetPasswordOTPExpire: { $gt: Date.now() },
      isActive: true
    });

    if (!user) {
      return errorResponse(res, 400, 'Invalid or expired OTP');
    }

    // Mark OTP as verified
    user.resetPasswordOTPVerified = true;
    await user.save();

    console.log('✅ OTP verified for:', user.email);

    successResponse(res, 200, 'OTP verified successfully', {
      message: 'You can now reset your password',
      email: user.email
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Reset Password with verified OTP
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return errorResponse(res, 400, 'Please provide email and new password');
    }

    if (newPassword.length < 6) {
      return errorResponse(res, 400, 'Password must be at least 6 characters');
    }

    // Find user with verified OTP
    const user = await User.findOne({
      email,
      resetPasswordOTPVerified: true,
      resetPasswordOTPExpire: { $gt: Date.now() },
      isActive: true
    });

    if (!user) {
      return errorResponse(res, 400, 'OTP not verified or expired. Please request a new OTP.');
    }

    // ✅ IMPORTANT: Set password directly - User model will hash it automatically
    user.password = newPassword;

    // Clear OTP fields
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpire = undefined;
    user.resetPasswordOTPVerified = false;

    await user.save();

    // Log activity - skip if enum not available
    try {
      await logActivity(
        { user, ip: req.ip, get: req.get.bind(req), method: req.method, originalUrl: req.originalUrl, connection: req.connection },
        'password_reset', // Changed from 'password.reset'
        'User',
        user._id
      );
    } catch (logError) {
      console.log('Activity log skipped (enum not available)');
    }

    console.log('✅ Password reset successful for:', user.email);

    successResponse(res, 200, 'Password reset successful', {
      message: 'You can now login with your new password'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Change Password (Logged in users)
 * @route   POST /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 400, 'Please provide current and new password');
    }

    if (newPassword.length < 6) {
      return errorResponse(res, 400, 'New password must be at least 6 characters');
    }

    // Get user
    const user = await User.findById(req.user._id);

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return errorResponse(res, 400, 'Current password is incorrect');
    }

    // Check if new password is same as current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return errorResponse(res, 400, 'New password must be different from current password');
    }

    // ✅ IMPORTANT: Set password directly - User model will hash it automatically
    user.password = newPassword;

    await user.save();

    // Log activity - skip if enum not available
    try {
      await logActivity(req, 'password_changed', 'User', user._id);
    } catch (logError) {
      console.log('Activity log skipped (enum not available)');
    }

    console.log('✅ Password changed for:', user.email);

    successResponse(res, 200, 'Password changed successfully');

  } catch (error) {
    console.error('Change password error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

module.exports = {
  login,
  registerTenant,
  getMe,
  logout,
  forgotPassword,
  verifyOTP,
  resetPassword,
  changePassword
};