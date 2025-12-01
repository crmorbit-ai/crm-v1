const { verifyEmail, verifyPhone } = require('../services/verificationService');
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

module.exports = {
  verifyEmailAddress,
  verifyPhoneNumber
};