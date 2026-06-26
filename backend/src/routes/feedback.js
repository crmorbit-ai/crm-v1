const express = require('express');
const router  = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, requireSaasAccess, requireTenant } = require('../middleware/auth');
const {
  submitFeedback,
  getMyFeedback,
  getTenantInbox,
  getTenantAnalytics,
  tenantAdminReply,
  tenantAdminUpdateStatus,
  escalateFeedback,
  getAllFeedback,
  getFeedbackById,
  replyToFeedback,
  updateFeedbackStatus,
  addInternalNote,
  deleteFeedback,
  getFeedbackAnalytics,
} = require('../controllers/feedbackController');

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/feedback/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'feedback-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images (JPEG, PNG), PDF, and DOC files are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

router.use(protect);

/* ── SAAS Admin ── */
// analytics & list must come BEFORE /:id
router.get('/analytics',        requireSaasAccess, getFeedbackAnalytics);
router.get('/',                 requireSaasAccess, getAllFeedback);
router.post('/:id/reply',       requireSaasAccess, replyToFeedback);
router.patch('/:id/status',     requireSaasAccess, updateFeedbackStatus);
router.post('/:id/notes',       requireSaasAccess, addInternalNote);
router.delete('/:id',           requireSaasAccess, deleteFeedback);

/* ── Tenant Admin ── */
router.get('/tenant/inbox',     requireTenant, getTenantInbox);
router.get('/tenant/analytics', requireTenant, getTenantAnalytics);
router.post('/:id/tenant-reply',       requireTenant, tenantAdminReply);
router.patch('/:id/tenant-status',     requireTenant, tenantAdminUpdateStatus);
router.post('/:id/escalate',           requireTenant, escalateFeedback);

/* ── Tenant User ── */
// Middleware wrapper to handle optional file upload
const optionalUpload = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    // If multipart, use multer
    upload.array('attachments', 5)(req, res, next);
  } else {
    // If JSON, skip multer
    next();
  }
};

router.post('/',     requireTenant, optionalUpload, submitFeedback);
router.get('/mine',  requireTenant, getMyFeedback);

/* ── Shared (any authenticated) ── */
router.get('/:id', getFeedbackById);

module.exports = router;
