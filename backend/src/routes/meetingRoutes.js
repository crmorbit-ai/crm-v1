const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting
} = require('../controllers/meetingController');

router.use(protect);

router.route('/')
  .get(getMeetings)
  .post(createMeeting);

router.route('/:id')
  .get(getMeeting)
  .put(updateMeeting)
  .delete(deleteMeeting);

module.exports = router;