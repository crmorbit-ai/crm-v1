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

// All routes are protected
router.use(protect);

// CRUD routes
router.route('/')
  .get(getMeetings)
  .post(createMeeting);

router.route('/:id')
  .get(getMeeting)
  .put(updateMeeting)
  .delete(deleteMeeting);

// 📧 Resend invitation route
router.post('/:id/resend-invitation', resendInvitation);

module.exports = router;