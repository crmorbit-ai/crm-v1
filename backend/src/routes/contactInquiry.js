const express = require('express');
const router = express.Router();
const { protect, requireSaasAccess } = require('../middleware/auth');
const { submitInquiry, getAllInquiries, updateInquiryStatus, deleteInquiry } = require('../controllers/contactInquiryController');

// Public route — anyone can submit
router.post('/', submitInquiry);

// SAAS Admin only
router.get('/', protect, requireSaasAccess, getAllInquiries);
router.patch('/:id', protect, requireSaasAccess, updateInquiryStatus);
router.delete('/:id', protect, requireSaasAccess, deleteInquiry);

module.exports = router;
