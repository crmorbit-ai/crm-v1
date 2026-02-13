const User = require('../models/User');
const AccessAudit = require('../models/AccessAudit');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

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

/**
 * @desc    Set viewing PIN
 * @route   POST /api/viewing-pin/set
 * @access  Private (Tenant users)
 */
const setViewingPin = async (req, res) => {
  try {
    const { pin } = req.body;
    const userId = req.user._id;

    // Validate PIN (4-6 digits)
    if (!pin || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: 'PIN must be 4 digits'
      });
    }

    // Hash the PIN
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(pin, salt);

    // Update user
    await User.findByIdAndUpdate(userId, {
      viewingPin: hashedPin,
      isViewingPinSet: true
    });

    res.json({
      success: true,
      message: 'Viewing PIN set successfully'
    });
  } catch (error) {
    console.error('Set viewing PIN error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Verify viewing PIN
 * @route   POST /api/viewing-pin/verify
 * @access  Private (Tenant users)
 */
const verifyViewingPin = async (req, res) => {
  try {
    const { pin } = req.body;
    const userId = req.user._id;

    if (!pin) {
      return res.status(400).json({
        success: false,
        message: 'PIN is required'
      });
    }

    const user = await User.findById(userId);

    if (!user.isViewingPinSet || !user.viewingPin) {
      return res.status(400).json({
        success: false,
        message: 'Viewing PIN not set. Please set your PIN first.'
      });
    }

    // Compare PIN
    const isMatch = await bcrypt.compare(pin, user.viewingPin);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid PIN'
      });
    }

    res.json({
      success: true,
      message: 'PIN verified successfully'
    });
  } catch (error) {
    console.error('Verify viewing PIN error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Change viewing PIN
 * @route   POST /api/viewing-pin/change
 * @access  Private (Tenant users)
 */
const changeViewingPin = async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;
    const userId = req.user._id;

    // Validate new PIN
    if (!newPin || !/^\d{4}$/.test(newPin)) {
      return res.status(400).json({
        success: false,
        message: 'New PIN must be 4 digits'
      });
    }

    const user = await User.findById(userId);

    // If PIN already set, verify current PIN
    if (user.isViewingPinSet && user.viewingPin) {
      if (!currentPin) {
        return res.status(400).json({
          success: false,
          message: 'Current PIN is required'
        });
      }

      const isMatch = await bcrypt.compare(currentPin, user.viewingPin);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current PIN is incorrect'
        });
      }
    }

    // Hash new PIN
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(newPin, salt);

    // Update user
    await User.findByIdAndUpdate(userId, {
      viewingPin: hashedPin,
      isViewingPinSet: true
    });

    res.json({
      success: true,
      message: 'Viewing PIN changed successfully'
    });
  } catch (error) {
    console.error('Change viewing PIN error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Get PIN status
 * @route   GET /api/viewing-pin/status
 * @access  Private
 */
const getPinStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('isViewingPinSet');

    res.json({
      success: true,
      data: {
        isViewingPinSet: user.isViewingPinSet || false
      }
    });
  } catch (error) {
    console.error('Get PIN status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Log resource access (after PIN verification)
 * @route   POST /api/viewing-pin/log-access
 * @access  Private
 */
const logAccess = async (req, res) => {
  try {
    const { resourceType, resourceId, resourceName, action } = req.body;
    const userId = req.user._id;
    const tenantId = req.user.tenant;

    if (!resourceType || !resourceId) {
      return res.status(400).json({
        success: false,
        message: 'resourceType and resourceId are required'
      });
    }

    // Create audit log
    const auditLog = await AccessAudit.create({
      user: userId,
      tenant: tenantId,
      resourceType,
      resourceId,
      resourceName: resourceName || '',
      action: action || 'viewed',
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Access logged',
      data: { auditId: auditLog._id }
    });
  } catch (error) {
    console.error('Log access error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Get access audit logs
 * @route   GET /api/viewing-pin/audit-logs
 * @access  Private (Tenant Admin only)
 */
const getAuditLogs = async (req, res) => {
  try {
    const tenantId = req.user.tenant;
    const { page = 1, limit = 20, resourceType, userId, startDate, endDate } = req.query;

    // Build query
    const query = { tenant: tenantId };

    if (resourceType) query.resourceType = resourceType;
    if (userId) query.user = userId;
    if (startDate || endDate) {
      query.accessedAt = {};
      if (startDate) query.accessedAt.$gte = new Date(startDate);
      if (endDate) query.accessedAt.$lte = new Date(endDate);
    }

    const total = await AccessAudit.countDocuments(query);
    const logs = await AccessAudit.find(query)
      .populate('user', 'firstName lastName email')
      .sort({ accessedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Forgot viewing PIN - Send OTP to email
 * @route   POST /api/viewing-pin/forgot
 * @access  Private
 */
const forgotViewingPin = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Hash OTP before storing
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    // Save OTP to user
    await User.findByIdAndUpdate(userId, {
      viewingPinOTP: hashedOTP,
      viewingPinOTPExpiry: otpExpiry
    });

    // Send OTP via email
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: 'Reset Your Viewing PIN - OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Viewing PIN</h2>
          <p>Hello ${user.firstName},</p>
          <p>You requested to reset your viewing PIN. Use the OTP below:</p>
          <div style="background: #f5f5f5; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h1 style="font-size: 40px; letter-spacing: 10px; color: #6366f1; margin: 0;">${otp}</h1>
          </div>
          <p>This OTP is valid for <strong>10 minutes</strong>.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `
    });

    res.json({
      success: true,
      message: 'OTP sent to your email'
    });
  } catch (error) {
    console.error('Forgot viewing PIN error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
};

/**
 * @desc    Reset viewing PIN with OTP
 * @route   POST /api/viewing-pin/reset
 * @access  Private
 */
const resetViewingPin = async (req, res) => {
  try {
    const { otp, newPin } = req.body;
    const userId = req.user._id;

    if (!otp || !newPin) {
      return res.status(400).json({
        success: false,
        message: 'OTP and new PIN are required'
      });
    }

    // Validate new PIN
    if (!/^\d{4,6}$/.test(newPin)) {
      return res.status(400).json({
        success: false,
        message: 'New PIN must be 4 digits'
      });
    }

    const user = await User.findById(userId);

    if (!user.viewingPinOTP || !user.viewingPinOTPExpiry) {
      return res.status(400).json({
        success: false,
        message: 'No OTP request found. Please request a new OTP.'
      });
    }

    // Check OTP expiry
    if (new Date() > user.viewingPinOTPExpiry) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Verify OTP
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
    if (user.viewingPinOTP !== hashedOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Hash new PIN
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(newPin, salt);

    // Update user - set new PIN and clear OTP
    await User.findByIdAndUpdate(userId, {
      viewingPin: hashedPin,
      isViewingPinSet: true,
      viewingPinOTP: null,
      viewingPinOTPExpiry: null
    });

    res.json({
      success: true,
      message: 'Viewing PIN reset successfully'
    });
  } catch (error) {
    console.error('Reset viewing PIN error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  setViewingPin,
  verifyViewingPin,
  changeViewingPin,
  getPinStatus,
  logAccess,
  getAuditLogs,
  forgotViewingPin,
  resetViewingPin
};
