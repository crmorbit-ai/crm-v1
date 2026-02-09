const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { successResponse, errorResponse } = require('../utils/response');

// Email transporter
const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Hash OTP with SHA256
const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

// Temporary storage for pending admin registrations (in production, use Redis)
const pendingAdmins = new Map();

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

    // Get primary owner email from env
    const primaryEmail = process.env.SAAS_OWNER_EMAIL?.toLowerCase();

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
      isPrimary: admin.email.toLowerCase() === primaryEmail
    }));

    successResponse(res, 200, 'SAAS Admins fetched', { admins: formattedAdmins });
  } catch (error) {
    console.error('Get SAAS Admins Error:', error);
    errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Step 1: Initiate SAAS Admin creation (Send OTP)
 * @route   POST /api/saas-admins/initiate
 * @access  SAAS_OWNER only
 */
const initiateSaasAdmin = async (req, res) => {
  try {
    const { email, firstName, lastName, password, saasRole } = req.body;

    // Validation
    if (!email || !firstName || !lastName || !password) {
      return errorResponse(res, 400, 'Email, first name, last name and password are required');
    }

    if (password.length < 6) {
      return errorResponse(res, 400, 'Password must be at least 6 characters');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse(res, 400, 'User with this email already exists');
    }

    // Generate OTP
    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);

    // Store pending admin data (expires in 10 minutes)
    const pendingKey = email.toLowerCase();
    pendingAdmins.set(pendingKey, {
      email: email.toLowerCase(),
      firstName,
      lastName,
      password,
      saasRole: saasRole || 'Admin',
      addedBy: req.user._id,
      otp: hashedOTP,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    // Send OTP email
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'OTP for SAAS Admin Registration',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>SAAS Admin Registration</h2>
          <p>Hello ${firstName},</p>
          <p>You are being added as a SAAS Admin by ${req.user.firstName} ${req.user.lastName}.</p>
          <p>Please share this OTP with the Primary Admin to complete your registration:</p>
          <div style="background: #f5f5f5; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h1 style="font-size: 40px; letter-spacing: 10px; color: #6366f1; margin: 0;">${otp}</h1>
          </div>
          <p>This OTP is valid for <strong>10 minutes</strong>.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `
    });

    successResponse(res, 200, 'OTP sent to email', {
      email: email.toLowerCase(),
      message: `OTP sent to ${email}. Valid for 10 minutes.`
    });
  } catch (error) {
    console.error('Initiate SAAS Admin Error:', error);
    errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Step 2: Verify OTP and create SAAS Admin
 * @route   POST /api/saas-admins/verify
 * @access  SAAS_OWNER only
 */
const verifySaasAdmin = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return errorResponse(res, 400, 'Email and OTP are required');
    }

    const pendingKey = email.toLowerCase();
    const pendingData = pendingAdmins.get(pendingKey);

    if (!pendingData) {
      return errorResponse(res, 400, 'No pending registration found. Please initiate again.');
    }

    // Check expiry
    if (Date.now() > pendingData.expiresAt) {
      pendingAdmins.delete(pendingKey);
      return errorResponse(res, 400, 'OTP has expired. Please initiate again.');
    }

    // Verify OTP
    const hashedOTP = hashOTP(otp);
    if (pendingData.otp !== hashedOTP) {
      return errorResponse(res, 400, 'Invalid OTP');
    }

    // Create the admin
    const newAdmin = await User.create({
      email: pendingData.email,
      firstName: pendingData.firstName,
      lastName: pendingData.lastName,
      password: pendingData.password,
      userType: 'SAAS_ADMIN',
      saasRole: pendingData.saasRole,
      isActive: true,
      emailVerified: true,
      isProfileComplete: true,
      authProvider: 'local',
      addedBy: pendingData.addedBy,
      tenant: null
    });

    // Clear pending data
    pendingAdmins.delete(pendingKey);

    // Send welcome email
    try {
      const transporter = getTransporter();
      await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
        to: pendingData.email,
        subject: 'Welcome - SAAS Admin Access Granted',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to CRM SAAS Admin Panel!</h2>
            <p>Hello ${pendingData.firstName},</p>
            <p>Your SAAS Admin account has been created successfully.</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Email:</strong> ${pendingData.email}</p>
              <p><strong>Role:</strong> ${pendingData.saasRole}</p>
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
    console.error('Verify SAAS Admin Error:', error);
    errorResponse(res, 500, error.message);
  }
};

/**
 * @desc    Resend OTP for pending registration
 * @route   POST /api/saas-admins/resend-otp
 * @access  SAAS_OWNER only
 */
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, 400, 'Email is required');
    }

    const pendingKey = email.toLowerCase();
    const pendingData = pendingAdmins.get(pendingKey);

    if (!pendingData) {
      return errorResponse(res, 400, 'No pending registration found. Please initiate again.');
    }

    // Generate new OTP
    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);

    // Update pending data
    pendingData.otp = hashedOTP;
    pendingData.expiresAt = Date.now() + 10 * 60 * 1000;
    pendingAdmins.set(pendingKey, pendingData);

    // Send OTP email
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'OTP for SAAS Admin Registration (Resent)',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>SAAS Admin Registration - New OTP</h2>
          <p>Hello ${pendingData.firstName},</p>
          <p>Here is your new OTP:</p>
          <div style="background: #f5f5f5; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h1 style="font-size: 40px; letter-spacing: 10px; color: #6366f1; margin: 0;">${otp}</h1>
          </div>
          <p>This OTP is valid for <strong>10 minutes</strong>.</p>
        </div>
      `
    });

    successResponse(res, 200, 'OTP resent successfully', {
      email: email.toLowerCase()
    });
  } catch (error) {
    console.error('Resend OTP Error:', error);
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
      const transporter = getTransporter();
      await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
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
    const primaryEmail = process.env.SAAS_OWNER_EMAIL?.toLowerCase();
    const isPrimary = req.user.email.toLowerCase() === primaryEmail;

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
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
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

module.exports = {
  getAllSaasAdmins,
  initiateSaasAdmin,
  verifySaasAdmin,
  resendOtp,
  updateSaasAdmin,
  removeSaasAdmin,
  resetPassword,
  getMyProfile,
  setViewingCredentials,
  verifyViewingCredentials,
  forgotViewingCredentials,
  resetViewingCredentials
};
