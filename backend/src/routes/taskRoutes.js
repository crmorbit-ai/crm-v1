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
// const { requirePermission } = require('../middleware/rbac'); // COMMENTED OUT

// All routes require authentication
router.use(protect);

// CRUD routes - NO PERMISSION CHECKS
router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

module.exports = router;