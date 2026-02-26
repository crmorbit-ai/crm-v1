const User = require('../models/User');
const Tenant = require('../models/Tenant');
const Subscription = require('../models/Subscription');
const Reseller = require('../models/Reseller');
const { generateToken } = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sendPasswordResetOTP, sendSignupVerificationOTP, sendWelcomeEmail } = require('../utils/emailService');
const Role = require('../models/Role');
const { seedStandardFields } = require('../utils/seedStandardFields');
const cloudinary = require('../config/cloudinary');

// Upload buffer to Cloudinary
const uploadBufferToCloudinary = (buffer, mimetype, folder, publicId) => {
  return new Promise((resolve, reject) => {
    const b64 = Buffer.from(buffer).toString('base64');
    const dataURI = `data:${mimetype};base64,${b64}`;
    cloudinary.uploader.upload(dataURI, { folder, public_id: publicId, overwrite: true, resource_type: 'image' },
      (error, result) => { if (error) reject(error); else resolve(result); }
    );
  });
};

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

    // ============================================
    // 🔐 SAAS ADMIN WHITELIST CHECK (same as protect middleware)
    // ============================================
    const saasAdminEmails = (process.env.SAAS_ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(e => e);

    const isInSaasWhitelist = saasAdminEmails.includes(user.email.toLowerCase());

    if (isInSaasWhitelist && user.userType !== 'SAAS_OWNER') {
      user.userType = 'SAAS_OWNER';
      user.tenant = null;
      console.log(`🔑 Login: ${user.email} upgraded to SAAS_OWNER`);
    } else if (!isInSaasWhitelist && user.userType === 'SAAS_OWNER') {
      user.userType = 'TENANT_ADMIN';
      console.log(`🔒 Login: ${user.email} downgraded from SAAS_OWNER`);
    }
    // ============================================

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user);

    // Create minimal user response (avoid sending huge populated objects)
    const userResponse = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      userType: user.userType,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      isProfileComplete: user.isProfileComplete !== false, // Default to true for existing users
      lastLogin: user.lastLogin,
      tenant: user.tenant ? {
        _id: user.tenant._id,
        organizationId: user.tenant.organizationId,
        organizationName: user.tenant.organizationName,
        logo: user.tenant.logo,
        isActive: user.tenant.isActive
      } : null,
      roles: user.roles ? user.roles.map(r => ({
        _id: r._id,
        name: r.name,
        slug: r.slug,
        permissions: r.permissions
      })) : []
    };

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
    

    // Calculate trial end date
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + (freePlan?.trialDays || 15));

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
        plan: freePlan?._id || null,
        planName: freePlan?.name || 'Free',
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
        users: 1,
        leads: 0,
        contacts: 0,
        deals: 0,
        storage: 0,
        emailsSentToday: 0,
        lastEmailResetDate: new Date()
      },
      
      // Legacy fields
      subscriptionTier: 'free',
      subscriptionStatus: 'trial',
      subscriptionStartDate: new Date(),
      subscriptionEndDate: trialEndDate,
      maxUsers: freePlan?.limits?.users || 5,
      maxStorage: freePlan?.limits?.storage || 1024,
      
      isActive: true
    });

    // ============================================
    // 🚀 RESELLER INTEGRATION
    // ============================================
    if (resellerId) {
      try {
        const reseller = await Reseller.findById(resellerId);

        if (reseller && reseller.status === 'approved') {
          tenant.reseller = reseller._id;
          tenant.commissionRate = reseller.commissionRate;
          await tenant.save();
        }
      } catch (resellerError) {
        // Silently fail - reseller linking is non-critical
      }
    }

    // ============================================
    // CREATE TENANT ADMIN ROLE WITH FULL PERMISSIONS
    // ============================================
    const Role = require('../models/Role');

    const tenantAdminRole = await Role.create({
      name: 'Tenant Admin',
      slug: 'tenant-admin',
      description: 'Full access to all tenant features and settings',
      tenant: tenant._id,
      roleType: 'custom',
      permissions: [
        { feature: 'user_management', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { feature: 'role_management', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { feature: 'group_management', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { feature: 'lead_management', actions: ['create', 'read', 'update', 'delete', 'convert', 'import', 'export', 'manage'] },
        { feature: 'account_management', actions: ['create', 'read', 'update', 'delete', 'export', 'manage'] },
        { feature: 'contact_management', actions: ['create', 'read', 'update', 'delete', 'export', 'manage'] },
        { feature: 'opportunity_management', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { feature: 'product_management', actions: ['create', 'read', 'update', 'delete', 'export', 'manage'] },
        { feature: 'activity_management', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { feature: 'task_management', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { feature: 'meeting_management', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { feature: 'call_management', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { feature: 'note_management', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { feature: 'report_management', actions: ['read', 'create', 'export', 'manage'] },
        { feature: 'advanced_analytics', actions: ['read', 'manage'] },
        { feature: 'api_access', actions: ['read', 'manage'] }
      ],
      level: 100,
      isActive: true
    });

    // ============================================
    // 🔧 FIX: CREATE ADMIN USER WITH PROPER PASSWORD HANDLING
    // ============================================
    const adminUser = new User({
      email: adminEmail,
      firstName: adminFirstName,
      lastName: adminLastName,
      userType: 'TENANT_ADMIN',
      tenant: tenant._id,
      roles: [tenantAdminRole._id],
      isActive: true
    });

    // Set password - this will trigger the pre-save hook to hash it
    adminUser.password = adminPassword;
    
    await adminUser.save();

    // Verify password works immediately after creation
    const passwordVerify = await adminUser.comparePassword(adminPassword);

    if (!passwordVerify) {
      // Try to fix by rehashing
      const salt = await bcrypt.genSalt(10);
      adminUser.password = await bcrypt.hash(adminPassword, salt);
      await adminUser.save({ validateBeforeSave: false });
    }

    await adminUser.populate('roles');

    // ============================================
    // 🎯 SEED STANDARD FIELDS FOR ALL ENTITIES
    // ============================================
    await seedStandardFields(tenant._id, adminUser._id);

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
        plan: freePlan?.name || 'Free',
        status: 'trial',
        trialDaysRemaining: freePlan?.trialDays || 15
      }
    });

  } catch (error) {
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
    // Check if user is a reseller
    if (req.user.userType === 'RESELLER') {
      const reseller = await Reseller.findById(req.user._id).select('-password');
      return successResponse(res, 200, 'Reseller profile retrieved', reseller);
    }

    const user = await User.findById(req.user._id)
      .populate('roles', 'name slug permissions level')
      .populate('groups', 'name description')
      .populate('tenant', 'organizationId organizationName logo isActive isSuspended subscription.status subscription.planName')
      .select('-password -emailVerificationOTP -emailVerificationOTPExpire -resetPasswordOTP -resetPasswordOTPExpire -viewingPin -viewingPinOTP -viewingPinOTPExpiry');

    // Create minimal response
    const userResponse = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      userType: user.userType,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      isProfileComplete: user.isProfileComplete !== false, // Default to true for existing users
      lastLogin: user.lastLogin,
      profilePicture: user.profilePicture,
      tenant: user.tenant ? {
        _id: user.tenant._id,
        organizationId: user.tenant.organizationId,
        organizationName: user.tenant.organizationName,
        logo: user.tenant.logo,
        isActive: user.tenant.isActive,
        isSuspended: user.tenant.isSuspended,
        subscription: user.tenant.subscription
      } : null,
      roles: user.roles || [],
      groups: user.groups || []
    };

    successResponse(res, 200, 'User profile retrieved', userResponse);
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

    const user = await User.findOne({ email, isActive: true });

    if (!user) {
      return successResponse(res, 200, 'If an account exists with this email, you will receive an OTP.');
    }

    const otp = generateOTP();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    user.resetPasswordOTP = otpHash;
    user.resetPasswordOTPExpire = Date.now() + 10 * 60 * 1000;
    user.resetPasswordOTPVerified = false;
    await user.save();

    try {
      await sendPasswordResetOTP(user.email, otp, `${user.firstName} ${user.lastName}`);
      successResponse(res, 200, 'OTP sent to your email', {
        message: 'Please check your email for the OTP code.',
        email: user.email
      });
    } catch (emailError) {
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

    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.findOne({
      email,
      resetPasswordOTP: otpHash,
      resetPasswordOTPExpire: { $gt: Date.now() },
      isActive: true
    });

    if (!user) {
      return errorResponse(res, 400, 'Invalid or expired OTP');
    }

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

    const user = await User.findOne({
      email,
      resetPasswordOTPVerified: true,
      resetPasswordOTPExpire: { $gt: Date.now() },
      isActive: true
    });

    if (!user) {
      return errorResponse(res, 400, 'OTP not verified or expired. Please request a new OTP.');
    }

    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpire = undefined;
    user.resetPasswordOTPVerified = false;
    await user.save();

    try {
      await logActivity(
        { user, ip: req.ip, get: req.get.bind(req), method: req.method, originalUrl: req.originalUrl, connection: req.connection },
        'password_reset',
        'User',
        user._id
      );
    } catch (logError) {
      console.log('Activity log skipped');
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

    const user = await User.findById(req.user._id);

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return errorResponse(res, 400, 'Current password is incorrect');
    }

    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return errorResponse(res, 400, 'New password must be different from current password');
    }

    user.password = newPassword;
    await user.save();

    try {
      await logActivity(req, 'password_changed', 'User', user._id);
    } catch (logError) {
      console.log('Activity log skipped');
    }

    console.log('✅ Password changed for:', user.email);

    successResponse(res, 200, 'Password changed successfully');
  } catch (error) {
    console.error('Change password error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Register user - Step 1 (Email verification required)
 * @route   POST /api/auth/register-step1
 * @access  Public
 */
const registerStep1 = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, resellerId } = req.body;

    console.log('📝 Step 1 Registration attempt:', { email, firstName, lastName });

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return errorResponse(res, 400, 'Please provide all required fields');
    }

    if (password.length < 6) {
      return errorResponse(res, 400, 'Password must be at least 6 characters');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // If user exists but is pending verification, allow re-registration
      if (existingUser.isPendingVerification) {
        // Delete the pending user and allow new registration
        await User.findByIdAndDelete(existingUser._id);
        console.log('🗑️ Deleted pending verification user, allowing re-registration');
      } else {
        return errorResponse(res, 400, 'Email already registered');
      }
    }

    // Generate 6-digit OTP
    const otp = generateOTP();

    // Hash OTP with SHA256
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    // Set OTP expiration (10 minutes)
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000);

    // Create user with pending verification
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password, // Will be hashed by pre-save middleware
      userType: 'TENANT_ADMIN', // Will become admin of their tenant
      isPendingVerification: true,
      emailVerified: false,
      isProfileComplete: false,
      emailVerificationOTP: hashedOTP,
      emailVerificationOTPExpire: otpExpire,
      authProvider: 'local',
      registrationData: resellerId ? { resellerId } : null,
      isActive: false // Not active until email verified
    });

    // Send verification OTP email
    await sendSignupVerificationOTP(email, otp, `${firstName} ${lastName}`);

    console.log('✅ Step 1 registration successful, OTP sent to:', email);

    successResponse(res, 201, 'Registration successful! Please check your email for verification code.', {
      email,
      requiresVerification: true
    });
  } catch (error) {
    console.error('Step 1 registration error:', error);
    errorResponse(res, 500, 'Server error during registration');
  }
};

/**
 * @desc    Verify email with OTP - Step 2
 * @route   POST /api/auth/verify-email
 * @access  Public
 */
const verifyEmailSignup = async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log('🔐 Email verification attempt for:', email);

    if (!email || !otp) {
      return errorResponse(res, 400, 'Please provide email and OTP');
    }

    // Hash the provided OTP
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    // Find user with matching email, OTP, and not expired
    const user = await User.findOne({
      email,
      emailVerificationOTP: hashedOTP,
      emailVerificationOTPExpire: { $gt: Date.now() },
      isPendingVerification: true
    }).populate('tenant');

    if (!user) {
      return errorResponse(res, 400, 'Invalid or expired OTP');
    }

    // ============================================
    // 🔐 SAAS ADMIN CHECK on email verification
    // ============================================
    const saasAdminEmailsList = (process.env.SAAS_ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(e => e);

    const isSaasAdminEmail = saasAdminEmailsList.includes(user.email.toLowerCase());

    if (isSaasAdminEmail) {
      user.userType = 'SAAS_OWNER';
      user.tenant = null;
      user.isProfileComplete = true; // SAAS owners skip profile completion
      console.log(`🔑 SAAS Owner verified email: ${user.email}`);
    }
    // ============================================

    // Verify email
    user.emailVerified = true;
    user.isPendingVerification = false;
    user.emailVerificationOTP = undefined;
    user.emailVerificationOTPExpire = undefined;
    user.isActive = true; // Activate user after email verification
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    console.log('✅ Email verified successfully for:', email);

    successResponse(res, 200, 'Email verified successfully!', {
      token,
      user: userResponse,
      requiresProfileCompletion: !user.isProfileComplete
    });
  } catch (error) {
    console.error('Email verification error:', error);
    errorResponse(res, 500, 'Server error during verification');
  }
};

/**
 * @desc    Resend verification OTP
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
const resendVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;

    console.log('🔄 Resend OTP request for:', email);

    if (!email) {
      return errorResponse(res, 400, 'Please provide email');
    }

    // Find pending verification user
    const user = await User.findOne({
      email,
      isPendingVerification: true
    });

    if (!user) {
      return errorResponse(res, 404, 'No pending verification found for this email');
    }

    // Generate new OTP
    const otp = generateOTP();
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000);

    // Update user with new OTP
    user.emailVerificationOTP = hashedOTP;
    user.emailVerificationOTPExpire = otpExpire;
    await user.save();

    // Send new OTP email
    await sendSignupVerificationOTP(email, otp, `${user.firstName} ${user.lastName}`);

    console.log('✅ New OTP sent to:', email);

    successResponse(res, 200, 'New verification code sent to your email');
  } catch (error) {
    console.error('Resend OTP error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Complete user profile and create tenant
 * @route   POST /api/auth/complete-profile
 * @access  Private (requires authentication)
 */
const completeProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      organizationName,
      slug,
      businessType,
      industry,
      numberOfEmployees,
      street,
      city,
      state,
      country,
      zipCode,
      primaryColor,
      timezone,
      dateFormat,
      currency
    } = req.body;

    console.log('🏢 Profile completion attempt for user:', req.user.email);

    // Validation
    if (!organizationName || !slug) {
      return errorResponse(res, 400, 'Organization name and slug are required');
    }

    // Check if user already completed profile
    const user = await User.findById(userId);

    if (user.isProfileComplete) {
      return errorResponse(res, 400, 'Profile already completed');
    }

    if (!user.emailVerified) {
      return errorResponse(res, 403, 'Please verify your email first');
    }

    // Check if slug already exists
    const existingTenant = await Tenant.findOne({ slug });
    if (existingTenant) {
      return errorResponse(res, 400, 'Organization slug already exists. Please choose another.');
    }

    // Handle logo upload (if provided) — upload to Cloudinary
    let logoPath = null;
    if (req.file) {
      try {
        const result = await uploadBufferToCloudinary(
          req.file.buffer, req.file.mimetype,
          'crm/logos', `tenant-setup-${Date.now()}-logo`
        );
        logoPath = result.secure_url;
      } catch (cloudErr) {
        console.error('Logo upload to Cloudinary failed:', cloudErr);
        // Continue without logo if upload fails
      }
    }

    // Get Free subscription plan
    const SubscriptionPlan = require('../models/SubscriptionPlan');
    const freePlan = await SubscriptionPlan.findOne({ name: 'Free', isActive: true });

    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + (freePlan?.trialDays || 15));

    // Create Tenant
    const tenant = await Tenant.create({
      organizationName,
      slug,
      contactEmail: user.email,
      contactPhone: user.phone || '',
      businessType: businessType || 'B2B',
      industry: industry || '',
      numberOfEmployees: numberOfEmployees || '',
      address: {
        street: street || '',
        city: city || '',
        state: state || '',
        country: country || '',
        zipCode: zipCode || ''
      },
      logo: logoPath,
      primaryColor: primaryColor || '#4A90E2',
      settings: {
        timezone: timezone || 'Asia/Kolkata',
        dateFormat: dateFormat || 'DD/MM/YYYY',
        currency: currency || 'INR'
      },
      subscription: {
        plan: freePlan?._id,
        planName: 'Free',
        status: 'trial',
        isTrialActive: true,
        trialStartDate: new Date(),
        trialEndDate: trialEndDate,
        billingCycle: 'monthly',
        amount: 0,
        currency: 'USD',
        autoRenew: false
      },
      usage: {
        users: 1,
        leads: 0,
        contacts: 0,
        deals: 0,
        storage: 0,
        emailsSentToday: 0,
        lastEmailResetDate: new Date()
      },
      isActive: true,
      isSuspended: false
    });

    // Attach reseller if exists
    if (user.registrationData && user.registrationData.resellerId) {
      tenant.reseller = user.registrationData.resellerId;
      await tenant.save();
    }

    console.log('✅ Tenant created:', tenant.organizationName);

    // All features list for building role permissions
    const allFeatures = [
      'user_management', 'role_management', 'group_management',
      'lead_management', 'account_management', 'contact_management',
      'opportunity_management', 'product_management', 'activity_management',
      'task_management', 'meeting_management', 'call_management',
      'note_management', 'email_management', 'data_center',
      'quotations', 'invoices', 'rfi', 'purchase_orders', 'field_customization'
    ];
    const analyticsFeatures = ['report_management', 'advanced_analytics', 'api_access'];

    // Create 3 Default Roles for every new tenant

    // 1. User Role — Read Only
    await Role.create({
      name: 'User',
      slug: `${slug}-user`,
      description: 'Read-only access to all features',
      tenant: tenant._id,
      roleType: 'custom',
      permissions: [
        ...allFeatures.map(f => ({ feature: f, actions: ['read'] })),
        ...analyticsFeatures.map(f => ({ feature: f, actions: ['read'] }))
      ],
      level: 10,
      forUserTypes: ['TENANT_USER'],
      isActive: true
    });

    // 2. Manager Role — Read + Write
    await Role.create({
      name: 'Manager',
      slug: `${slug}-manager`,
      description: 'Create, read and update access to all features',
      tenant: tenant._id,
      roleType: 'custom',
      permissions: [
        ...allFeatures.map(f => ({ feature: f, actions: ['create', 'read', 'update'] })),
        ...analyticsFeatures.map(f => ({ feature: f, actions: ['read'] }))
      ],
      level: 50,
      forUserTypes: ['TENANT_USER', 'TENANT_MANAGER'],
      isActive: true
    });

    // 3. Admin Role — Full Access
    const adminRole = await Role.create({
      name: 'Admin',
      slug: `${slug}-admin`,
      description: 'Full access to all features',
      tenant: tenant._id,
      roleType: 'custom',
      permissions: [
        ...allFeatures.map(f => ({ feature: f, actions: ['create', 'read', 'update', 'delete', 'manage'] })),
        ...analyticsFeatures.map(f => ({ feature: f, actions: ['read', 'manage'] }))
      ],
      level: 100,
      forUserTypes: ['TENANT_USER', 'TENANT_MANAGER'],
      isActive: true
    });

    console.log('✅ 3 default roles created: User, Manager, Admin');

    // Update user — assign Admin role to tenant owner
    user.tenant = tenant._id;
    user.roles = [adminRole._id];
    user.isProfileComplete = true;
    user.registrationData = undefined; // Clear temporary data
    await user.save();

    // Fetch updated user with populated fields
    const updatedUser = await User.findById(userId)
      .populate('roles')
      .populate('tenant')
      .select('-password');

    console.log('✅ Profile completion successful for:', user.email);

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, `${user.firstName} ${user.lastName}`, tenant.organizationName).catch(err => {
      console.error('⚠️ Welcome email failed (non-blocking):', err.message);
    });

    successResponse(res, 200, 'Profile completed successfully!', updatedUser);
  } catch (error) {
    console.error('❌ Profile completion error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    errorResponse(res, 500, `Server error during profile completion: ${error.message}`);
  }
};

/**
 * @desc    Initiate Google OAuth
 * @route   GET /api/auth/google
 * @access  Public
 */
const googleOAuthInitiate = (req, res, next) => {
  const passport = require('../config/passport');

  // Capture the origin from referer or query param for dynamic redirect
  const referer = req.get('referer') || req.get('origin');
  let origin = req.query.origin || (referer ? new URL(referer).origin : null);

  // Allowed frontend URLs (comma-separated in env)
  const allowedOrigins = (process.env.ALLOWED_FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:3001')
    .split(',')
    .map(url => url.trim());

  // Validate origin against allowed list, default to first allowed if invalid
  if (!origin || !allowedOrigins.includes(origin)) {
    origin = allowedOrigins[0];
  }

  console.log('🔐 Google OAuth initiated from origin:', origin);

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: Buffer.from(JSON.stringify({ origin })).toString('base64')
  })(req, res, next);
};

/**
 * @desc    Google OAuth Callback
 * @route   GET /api/auth/google/callback
 * @access  Public
 */
const googleOAuthCallback = async (req, res) => {
  // Extract origin from state parameter for dynamic redirect
  let frontendURL = process.env.FRONTEND_URL || 'http://localhost:3001';

  try {
    // Parse state to get origin
    if (req.query.state) {
      try {
        const state = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
        if (state.origin) {
          // Validate origin against allowed list
          const allowedOrigins = (process.env.ALLOWED_FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:3001')
            .split(',')
            .map(url => url.trim());

          if (allowedOrigins.includes(state.origin)) {
            frontendURL = state.origin;
          }
        }
      } catch (e) {
        console.log('⚠️ Could not parse OAuth state, using default URL');
      }
    }

    console.log('🔐 Google OAuth callback, redirecting to:', frontendURL);

    const profile = req.user;

    console.log('🔐 Google OAuth callback:', profile.email);

    // Check if this is a new user (from passport strategy)
    if (profile.isNewUser) {
      // Check if email is in SAAS admin whitelist
      const saasAdminEmails = (process.env.SAAS_ADMIN_EMAILS || '')
        .split(',')
        .map(email => email.trim().toLowerCase())
        .filter(email => email); // Remove empty strings

      const isSaasAdmin = saasAdminEmails.includes(profile.email.toLowerCase());
      const userType = isSaasAdmin ? 'SAAS_OWNER' : 'TENANT_ADMIN';

      if (isSaasAdmin) {
        console.log('🔑 SAAS Admin detected:', profile.email);
      }

      // Create new user with Google account
      const newUser = await User.create({
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        googleId: profile.googleId,
        googleProfilePicture: profile.profilePicture,
        authProvider: 'google',
        emailVerified: true, // Google verifies emails
        isPendingVerification: false,
        isProfileComplete: isSaasAdmin ? true : false, // SAAS admins don't need profile completion
        userType: userType,
        tenant: isSaasAdmin ? null : undefined, // SAAS admins don't belong to tenants
        isActive: true,
        lastLogin: new Date()
      });

      // Generate token
      const token = generateToken(newUser);

      console.log('✅ New Google user created:', newUser.email);

      // Redirect to frontend with token and profile completion flag
      return res.redirect(`${frontendURL}/auth/callback?token=${token}&requiresProfileCompletion=${!isSaasAdmin}`);
    }

    // Existing user - populate tenant data before generating token
    const existingUser = await User.findById(profile._id)
      .populate('tenant')
      .populate('roles');

    if (!existingUser) {
      throw new Error('User not found after OAuth');
    }

    // Generate token with fully populated user
    const token = generateToken(existingUser);

    console.log('✅ Google OAuth successful for existing user:', existingUser.email);

    res.redirect(`${frontendURL}/auth/callback?token=${token}&requiresProfileCompletion=${!existingUser.isProfileComplete}`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`${frontendURL}/login?error=oauth_failed`);
  }
};

module.exports = {
  login,
  registerTenant,
  registerStep1, // NEW
  verifyEmailSignup, // NEW
  resendVerificationOTP, // NEW
  completeProfile, // NEW
  googleOAuthInitiate, // NEW
  googleOAuthCallback, // NEW
  getMe,
  logout,
  forgotPassword,
  verifyOTP,
  resetPassword,
  changePassword
};