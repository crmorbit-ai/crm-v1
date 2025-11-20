const express = require('express');
const router = express.Router();
const {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote
} = require('../controllers/noteController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// All routes require authentication
router.use(protect);

// CRUD routes
router.route('/')
  .get(requirePermission('note_management', 'read'), getNotes)
  .post(requirePermission('note_management', 'create'), createNote);

router.route('/:id')
  .get(requirePermission('note_management', 'read'), getNote)
  .put(requirePermission('note_management', 'update'), updateNote)
  .delete(requirePermission('note_management', 'delete'), deleteNote);

module.exports = router;