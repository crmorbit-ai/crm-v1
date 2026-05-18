const User = require('../models/User');
const crypto = require('crypto');
const { sendMail } = require('../utils/emailService');
const { successResponse, errorResponse } = require('../utils/response');

// Hash value with SHA256 (used for viewing credentials/PIN)
const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

// Generate 6-digit OTP (used for viewing credentials/PIN reset)
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * @desc    Get all SAAS Admins
 * @route   GET /api/saas-admins
 * @access  SAAS_OWNER only
 */
const getAllSaasAdmins = async (req, res) => {
  try {
    const admins = await User.find({
      userType: { $in: ['SAAS_OWNER', 'SAAS_ADMIN'] }
    })
      .select('firstName lastName email userType saasRole isActive lastLogin createdAt addedBy authProvider')
      .populate('addedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // All emails in SAAS_ADMIN_EMAILS are primary owners
    const saasAdminEmails = (process.env.SAAS_ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(e => e);

    const formattedAdmins = admins.map(admin => ({
      _id: admin._id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      userType: admin.userType,
      saasRole: admin.saasRole || 'Admin',
      isActive: admin.isActive,
      lastLogin: admin.lastLogin,
      createdAt: admin.createdAt,
      addedBy: admin.addedBy,
      authProvider: admin.authProvider,
      isPrimary: saasAdminEmails.includes(admin.email.toLowerCase())
    }));

    successResponse(res, 200, 'SAAS Admins fetched', { admins: formattedAdmins });
  } catch (error) {
    console.error('Get SAAS Admins Error:', error);
    errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Create SAAS Admin directly (no OTP)
 * @route   POST /api/saas-admins/create
 * @access  SAAS_OWNER only
 */
const createSaasAdmin = async (req, res) => {
  try {
    const { email, firstName, lastName, password, saasRole } = req.body;

    if (!email || !firstName || !lastName || !password) {
      return errorResponse(res, 400, 'Email, first name, last name and password are required');
    }

    if (password.length < 6) {
      return errorResponse(res, 400, 'Password must be at least 6 characters');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse(res, 400, 'User with this email already exists');
    }

    const newAdmin = await User.create({
      email: email.toLowerCase(),
      firstName,
      lastName,
      password,
      userType: 'SAAS_ADMIN',
      saasRole: saasRole || 'Admin',
      isActive: true,
      emailVerified: true,
      isProfileComplete: true,
      authProvider: 'local',
      addedBy: req.user._id,
      tenant: null
    });

    // Send welcome email (non-blocking)
    try {
      await sendMail({
        to: email.toLowerCase(),
        subject: 'Welcome - SAAS Admin Access Granted',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to CRM SAAS Admin Panel!</h2>
            <p>Hello ${firstName},</p>
            <p>Your SAAS Admin account has been created successfully.</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Email:</strong> ${email.toLowerCase()}</p>
              <p><strong>Role:</strong> ${saasRole || 'Admin'}</p>
            </div>
            <p>Please login at: <a href="${process.env.FRONTEND_URL}/login">${process.env.FRONTEND_URL}/login</a></p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Welcome email failed:', emailError.message);
    }

    successResponse(res, 201, 'SAAS Admin created successfully', {
      admin: {
        _id: newAdmin._id,
        email: newAdmin.email,
        firstName: newAdmin.firstName,
        lastName: newAdmin.lastName,
        userType: newAdmin.userType,
        saasRole: newAdmin.saasRole
      }
    });
  } catch (error) {
    console.error('Create SAAS Admin Error:', error);
    errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Update SAAS Admin
 * @route   PUT /api/saas-admins/:id
 * @access  SAAS_OWNER only
 */
const updateSaasAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, saasRole, isActive } = req.body;

    const admin = await User.findById(id);
    if (!admin) {
      return errorResponse(res, 404, 'Admin not found');
    }

    // Cannot modify primary owner's active status
    const primaryEmail = process.env.SAAS_OWNER_EMAIL?.toLowerCase();
    if (admin.email.toLowerCase() === primaryEmail && isActive === false) {
      return errorResponse(res, 400, 'Cannot deactivate primary owner');
    }

    // Update fields
    if (firstName) admin.firstName = firstName;
    if (lastName) admin.lastName = lastName;
    if (saasRole) admin.saasRole = saasRole;
    if (typeof isActive === 'boolean') admin.isActive = isActive;

    await admin.save();

    successResponse(res, 200, 'Admin updated successfully', { admin });
  } catch (error) {
    console.error('Update SAAS Admin Error:', error);
    errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Remove SAAS Admin
 * @route   DELETE /api/saas-admins/:id
 * @access  SAAS_OWNER only
 */
const removeSaasAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await User.findById(id);
    if (!admin) {
      return errorResponse(res, 404, 'Admin not found');
    }

    // Cannot delete primary owner
    const primaryEmail = process.env.SAAS_OWNER_EMAIL?.toLowerCase();
    if (admin.email.toLowerCase() === primaryEmail) {
      return errorResponse(res, 400, 'Cannot remove primary owner');
    }

    // Cannot delete self
    if (admin._id.toString() === req.user._id.toString()) {
      return errorResponse(res, 400, 'Cannot remove yourself');
    }

    await User.findByIdAndDelete(id);

    successResponse(res, 200, 'SAAS Admin removed successfully');
  } catch (error) {
    console.error('Remove SAAS Admin Error:', error);
    errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Direct password reset for SAAS Admin (No OTP required)
 * @route   POST /api/saas-admins/:id/reset-password
 * @access  SAAS_OWNER only
 */
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return errorResponse(res, 400, 'Password must be at least 6 characters');
    }

    const admin = await User.findById(id);
    if (!admin) {
      return errorResponse(res, 404, 'Admin not found');
    }

    // Cannot reset primary owner's password
    const primaryEmail = process.env.SAAS_OWNER_EMAIL?.toLowerCase();
    if (admin.email.toLowerCase() === primaryEmail) {
      return errorResponse(res, 400, 'Cannot reset Primary Owner password from here');
    }

    // Set new password
    admin.password = newPassword;
    admin.authProvider = 'local';
    await admin.save();

    // Send notification email
    try {
      
      await sendMail({
        to: admin.email,
        subject: 'Password Reset - SAAS Admin',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Notification</h2>
            <p>Hello ${admin.firstName},</p>
            <p>Your password has been reset by ${req.user.firstName} ${req.user.lastName} (Primary Admin).</p>
            <p>You can now login with your new password at: <a href="${process.env.FRONTEND_URL}/login">${process.env.FRONTEND_URL}/login</a></p>
            <p>If you did not request this, please contact the Primary Admin immediately.</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Notification email failed:', emailError.message);
    }

    successResponse(res, 200, 'Password reset successfully');
  } catch (error) {
    console.error('Reset Password Error:', error);
    errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Get current SAAS Admin profile
 * @route   GET /api/saas-admins/me
 * @access  SAAS_OWNER, SAAS_ADMIN
 */
const getMyProfile = async (req, res) => {
  try {
    // All emails in SAAS_ADMIN_EMAILS are treated as primary owners
    const saasAdminEmails = (process.env.SAAS_ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(e => e);
    const isPrimary = saasAdminEmails.includes(req.user.email.toLowerCase());

    successResponse(res, 200, 'Profile fetched', {
      user: {
        _id: req.user._id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        userType: req.user.userType,
        saasRole: req.user.saasRole,
        isPrimary,
        lastLogin: req.user.lastLogin,
        isViewingCredentialSet: req.user.isViewingCredentialSet || false
      }
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Set viewing credentials
 * @route   POST /api/saas-admins/set-viewing-credentials
 * @access  SAAS_OWNER, SAAS_ADMIN
 */
const setViewingCredentials = async (req, res) => {
  try {
    const { credentialId, credentialPassword } = req.body;

    if (!credentialId || !credentialPassword) {
      return errorResponse(res, 400, 'Credential ID and Password are required');
    }

    if (credentialId.length < 4) {
      return errorResponse(res, 400, 'Credential ID must be at least 4 characters');
    }

    if (credentialPassword.length < 6) {
      return errorResponse(res, 400, 'Credential Password must be at least 6 characters');
    }

    const user = await User.findById(req.user._id);
    user.viewingCredentialId = credentialId;
    user.viewingCredentialPassword = hashOTP(credentialPassword); // Hash the password
    user.isViewingCredentialSet = true;
    await user.save();

    successResponse(res, 200, 'Viewing credentials set successfully');
  } catch (error) {
    console.error('Set Viewing Credentials Error:', error);
    errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Verify viewing credentials
 * @route   POST /api/saas-admins/verify-viewing-credentials
 * @access  SAAS_OWNER, SAAS_ADMIN
 */
const verifyViewingCredentials = async (req, res) => {
  try {
    const { credentialId, credentialPassword } = req.body;

    if (!credentialId || !credentialPassword) {
      return errorResponse(res, 400, 'Credential ID and Password are required');
    }

    const user = await User.findById(req.user._id);

    if (!user.isViewingCredentialSet) {
      return errorResponse(res, 400, 'Viewing credentials not set. Please set them first.');
    }

    if (user.viewingCredentialId !== credentialId) {
      return errorResponse(res, 401, 'Invalid Credential ID');
    }

    if (user.viewingCredentialPassword !== hashOTP(credentialPassword)) {
      return errorResponse(res, 401, 'Invalid Password');
    }

    successResponse(res, 200, 'Credentials verified', { verified: true });
  } catch (error) {
    console.error('Verify Viewing Credentials Error:', error);
    errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Forgot viewing credentials - Send OTP
 * @route   POST /api/saas-admins/forgot-viewing-credentials
 * @access  SAAS_OWNER, SAAS_ADMIN
 */
const forgotViewingCredentials = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const otp = generateOTP();

    user.viewingCredentialOTP = hashOTP(otp);
    user.viewingCredentialOTPExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send OTP email
    
    await sendMail({
      to: user.email,
      subject: 'Reset Viewing Credentials - OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Viewing Credentials</h2>
          <p>Hello ${user.firstName},</p>
          <p>Your OTP to reset viewing credentials:</p>
          <div style="background: #f5f5f5; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h1 style="font-size: 40px; letter-spacing: 10px; color: #6366f1; margin: 0;">${otp}</h1>
          </div>
          <p>Valid for 10 minutes.</p>
        </div>
      `
    });

    successResponse(res, 200, 'OTP sent to your email');
  } catch (error) {
    console.error('Forgot Viewing Credentials Error:', error);
    errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Reset viewing credentials with OTP
 * @route   POST /api/saas-admins/reset-viewing-credentials
 * @access  SAAS_OWNER, SAAS_ADMIN
 */
const resetViewingCredentials = async (req, res) => {
  try {
    const { otp, newCredentialId, newCredentialPassword } = req.body;

    if (!otp || !newCredentialId || !newCredentialPassword) {
      return errorResponse(res, 400, 'OTP, new Credential ID and Password are required');
    }

    const user = await User.findById(req.user._id);

    if (!user.viewingCredentialOTP || user.viewingCredentialOTPExpire < new Date()) {
      return errorResponse(res, 400, 'OTP expired. Please request a new one.');
    }

    if (user.viewingCredentialOTP !== hashOTP(otp)) {
      return errorResponse(res, 400, 'Invalid OTP');
    }

    user.viewingCredentialId = newCredentialId;
    user.viewingCredentialPassword = hashOTP(newCredentialPassword);
    user.isViewingCredentialSet = true;
    user.viewingCredentialOTP = null;
    user.viewingCredentialOTPExpire = null;
    await user.save();

    successResponse(res, 200, 'Viewing credentials reset successfully');
  } catch (error) {
    console.error('Reset Viewing Credentials Error:', error);
    errorResponse(res, 500, error.message);
  }
};

// ===== VIEWING PIN APIs =====

/**
 * @desc    Get PIN status
 * @route   GET /api/saas-admins/viewing-pin/status
 * @access  SAAS_OWNER, SAAS_ADMIN
 */
const getViewingPinStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    successResponse(res, 200, 'PIN status fetched', {
      isPinSet: user.isViewingPinSet || false
    });
  } catch (error) {
    console.error('Get PIN Status Error:', error);
    errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Set viewing PIN
 * @route   POST /api/saas-admins/viewing-pin/set
 * @access  SAAS_OWNER, SAAS_ADMIN
 */
const setViewingPin = async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin || pin.length !== 4) {
      return errorResponse(res, 400, 'PIN must be 4 digits');
    }

    if (!/^\d+$/.test(pin)) {
      return errorResponse(res, 400, 'PIN must contain only digits');
    }

    const user = await User.findById(req.user._id);
    user.viewingPin = hashOTP(pin);
    user.isViewingPinSet = true;
    await user.save();

    successResponse(res, 200, 'Viewing PIN set successfully');
  } catch (error) {
    console.error('Set Viewing PIN Error:', error);
    errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Verify viewing PIN
 * @route   POST /api/saas-admins/viewing-pin/verify
 * @access  SAAS_OWNER, SAAS_ADMIN
 */
const verifyViewingPin = async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin) {
      return errorResponse(res, 400, 'PIN is required');
    }

    const user = await User.findById(req.user._id);

    if (!user.isViewingPinSet) {
      return errorResponse(res, 400, 'Viewing PIN not set. Please set it first.');
    }

    if (user.viewingPin !== hashOTP(pin)) {
      return errorResponse(res, 401, 'Invalid PIN');
    }

    successResponse(res, 200, 'PIN verified', { verified: true });
  } catch (error) {
    console.error('Verify Viewing PIN Error:', error);
    errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Change viewing PIN
 * @route   POST /api/saas-admins/viewing-pin/change
 * @access  SAAS_OWNER, SAAS_ADMIN
 */
const changeViewingPin = async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;

    if (!newPin || newPin.length !== 4) {
      return errorResponse(res, 400, 'New PIN must be 4 digits');
    }

    if (!/^\d+$/.test(newPin)) {
      return errorResponse(res, 400, 'PIN must contain only digits');
    }

    const user = await User.findById(req.user._id);

    // If PIN already set, verify current PIN
    if (user.isViewingPinSet && user.viewingPin) {
      if (!currentPin) {
        return errorResponse(res, 400, 'Current PIN is required');
      }
      if (user.viewingPin !== hashOTP(currentPin)) {
        return errorResponse(res, 401, 'Current PIN is incorrect');
      }
    }

    user.viewingPin = hashOTP(newPin);
    user.isViewingPinSet = true;
    await user.save();

    successResponse(res, 200, 'Viewing PIN changed successfully');
  } catch (error) {
    console.error('Change Viewing PIN Error:', error);
    errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Forgot viewing PIN - Send OTP
 * @route   POST /api/saas-admins/viewing-pin/forgot
 * @access  SAAS_OWNER, SAAS_ADMIN
 */
const forgotViewingPin = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const otp = generateOTP();

    user.viewingPinOTP = hashOTP(otp);
    user.viewingPinOTPExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send OTP email
    
    await sendMail({
      to: user.email,
      subject: 'Reset Viewing PIN - OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Viewing PIN</h2>
          <p>Hello ${user.firstName},</p>
          <p>Your OTP to reset viewing PIN:</p>
          <div style="background: #f5f5f5; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h1 style="font-size: 40px; letter-spacing: 10px; color: #6366f1; margin: 0;">${otp}</h1>
          </div>
          <p>Valid for 10 minutes.</p>
        </div>
      `
    });

    successResponse(res, 200, 'OTP sent to your email');
  } catch (error) {
    console.error('Forgot Viewing PIN Error:', error);
    errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Reset viewing PIN with OTP
 * @route   POST /api/saas-admins/viewing-pin/reset
 * @access  SAAS_OWNER, SAAS_ADMIN
 */
const resetViewingPin = async (req, res) => {
  try {
    const { otp, newPin } = req.body;

    if (!otp || !newPin) {
      return errorResponse(res, 400, 'OTP and new PIN are required');
    }

    if (newPin.length < 4 || newPin.length > 6 || !/^\d+$/.test(newPin)) {
      return errorResponse(res, 400, 'New PIN must be 4 digits');
    }

    const user = await User.findById(req.user._id);

    if (!user.viewingPinOTP || !user.viewingPinOTPExpiry) {
      return errorResponse(res, 400, 'No OTP request found. Please request a new OTP.');
    }

    if (new Date() > user.viewingPinOTPExpiry) {
      return errorResponse(res, 400, 'OTP has expired. Please request a new one.');
    }

    if (user.viewingPinOTP !== hashOTP(otp)) {
      return errorResponse(res, 400, 'Invalid OTP');
    }

    user.viewingPin = hashOTP(newPin);
    user.isViewingPinSet = true;
    user.viewingPinOTP = null;
    user.viewingPinOTPExpiry = null;
    await user.save();

    successResponse(res, 200, 'Viewing PIN reset successfully');
  } catch (error) {
    console.error('Reset Viewing PIN Error:', error);
    errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Get all Managers (SAAS_ADMIN with saasRole: 'Manager')
 * @route   GET /api/saas-admins/managers
 * @access  SAAS_OWNER, SAAS_ADMIN
 */
const getManagers = async (req, res) => {
  try {
    const managers = await User.find({
      userType: { $in: ['SAAS_OWNER', 'SAAS_ADMIN'] },
      saasRole: 'Manager'
    })
      .select('firstName lastName email saasRole isActive')
      .sort({ firstName: 1 });

    successResponse(res, 200, 'Managers fetched', { managers });
  } catch (error) {
    console.error('Get Managers Error:', error);
    errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getAllSaasAdmins,
  getManagers,
  createSaasAdmin,
  updateSaasAdmin,
  removeSaasAdmin,
  resetPassword,
  getMyProfile,
  setViewingCredentials,
  verifyViewingCredentials,
  forgotViewingCredentials,
  resetViewingCredentials,
  getViewingPinStatus,
  setViewingPin,
  verifyViewingPin,
  changeViewingPin,
  forgotViewingPin,
  resetViewingPin
};
