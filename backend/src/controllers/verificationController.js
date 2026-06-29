const { verifyEmail, verifyPhone } = require('../services/verificationService');
const { validateGSTFormat, validatePANFormat, verifyGSTWithAPI } = require('../utils/gstVerification');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * @desc    Verify email address in real-time
 * @route   POST /api/leads/verify-email
 * @access  Private
 */
const verifyEmailAddress = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, 400, 'Email is required');
    }

    const result = await verifyEmail(email);

    successResponse(res, 200, 'Email verification completed', result);
  } catch (error) {
    console.error('Verify email endpoint error:', error);
    errorResponse(res, 500, 'Email verification failed');
  }
};

/**
 * @desc    Verify phone number in real-time
 * @route   POST /api/leads/verify-phone
 * @access  Private
 */
const verifyPhoneNumber = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return errorResponse(res, 400, 'Phone number is required');
    }

    const result = await verifyPhone(phone);

    successResponse(res, 200, 'Phone verification completed', result);
  } catch (error) {
    console.error('Verify phone endpoint error:', error);
    errorResponse(res, 500, 'Phone verification failed');
  }
};

/**
 * @desc    Verify GST Number
 * @route   POST /api/verification/gst
 * @access  Private
 */
const verifyGST = async (req, res) => {
  try {
    const { gstNumber } = req.body;

    if (!gstNumber) {
      return errorResponse(res, 400, 'GST number is required');
    }

    const result = await verifyGSTWithAPI(gstNumber);

    if (result.valid) {
      successResponse(res, 200, 'GST verification successful', result);
    } else {
      return res.status(400).json({
        success: false,
        message: result.error || 'GST verification failed',
        data: result
      });
    }

  } catch (error) {
    console.error('GST verification error:', error);
    errorResponse(res, 500, 'Server error during GST verification');
  }
};

/**
 * @desc    Validate PAN Number
 * @route   POST /api/verification/pan
 * @access  Private
 */
const validatePAN = async (req, res) => {
  try {
    const { panNumber } = req.body;

    if (!panNumber) {
      return errorResponse(res, 400, 'PAN number is required');
    }

    const result = validatePANFormat(panNumber);

    if (result.valid) {
      successResponse(res, 200, 'PAN validation successful', result);
    } else {
      return res.status(400).json({
        success: false,
        message: result.error || 'PAN validation failed',
        data: result
      });
    }

  } catch (error) {
    console.error('PAN validation error:', error);
    errorResponse(res, 500, 'Server error during PAN validation');
  }
};

module.exports = {
  verifyEmailAddress,
  verifyPhoneNumber,
  verifyGST,
  validatePAN
};