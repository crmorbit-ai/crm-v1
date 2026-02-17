const express = require('express');
const router = express.Router();
const {
  getMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  resendInvitation
} = require('../controllers/meetingController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// All routes are protected
router.use(protect);

// CRUD routes with permission checks
router.route('/')
  .get(requirePermission('meeting_management', 'read'), getMeetings)
  .post(requirePermission('meeting_management', 'create'), createMeeting);

router.route('/:id')
  .get(requirePermission('meeting_management', 'read'), getMeeting)
  .put(requirePermission('meeting_management', 'update'), updateMeeting)
  .delete(requirePermission('meeting_management', 'delete'), deleteMeeting);

// Resend invitation route
router.post('/:id/resend-invitation', requirePermission('meeting_management', 'update'), resendInvitation);

module.exports = router;
