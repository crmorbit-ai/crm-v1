const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  resendInvitation,
  addParticipant,
  addNote,
  uploadAttachment
} = require('../controllers/meetingController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/meetings/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

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

// Add participant route
router.post('/:id/participants', requirePermission('meeting_management', 'update'), addParticipant);

// Add note route
router.post('/:id/notes', requirePermission('meeting_management', 'update'), addNote);

// Upload attachment route
router.post('/:id/attachments', requirePermission('meeting_management', 'update'), upload.single('file'), uploadAttachment);

module.exports = router;
