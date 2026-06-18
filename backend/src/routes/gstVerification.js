const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { verifyGSTIN } = require('../services/gstVerificationService');

/**
 * @route   POST /api/verify-gstin
 * @desc    Verify GSTIN and fetch company details
 * @access  Private
 */
router.post('/verify-gstin', protect, async (req, res) => {
  try {
    const { gstin } = req.body;

    if (!gstin) {
      return res.status(400).json({
        success: false,
        message: 'GSTIN is required'
      });
    }

    // Call verification service
    const result = await verifyGSTIN(gstin.toUpperCase().trim());

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('GST Verification Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to verify GSTIN'
    });
  }
});

module.exports = router;
