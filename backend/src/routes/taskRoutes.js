const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// All routes require authentication
router.use(protect);

// CRUD routes with permission checks
router.route('/')
  .get(requirePermission('task_management', 'read'), getTasks)
  .post(requirePermission('task_management', 'create'), createTask);

router.route('/:id')
  .get(requirePermission('task_management', 'read'), getTask)
  .put(requirePermission('task_management', 'update'), updateTask)
  .delete(requirePermission('task_management', 'delete'), deleteTask);

module.exports = router;
