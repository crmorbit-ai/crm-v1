const express = require('express');
const router  = express.Router();
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
router.post('/',     requireTenant, submitFeedback);
router.get('/mine',  requireTenant, getMyFeedback);

/* ── Shared (any authenticated) ── */
router.get('/:id', getFeedbackById);

module.exports = router;
