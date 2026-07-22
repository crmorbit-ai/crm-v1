const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const taskController = require('../controllers/caseStudyTaskController');

/* ══════════════════════════════════════════════════════════
   TASK MANAGEMENT ROUTES
══════════════════════════════════════════════════════════ */

// Create task (SAAS Admin - self declaration)
router.post('/', protect, taskController.createTask);

// Get all tasks (Primary Admin sees all, SAAS Admin sees own)
router.get('/', protect, taskController.getAllTasks);

// Get my tasks (SAAS Admin)
router.get('/my-tasks', protect, taskController.getMyTasks);

// Get dashboard stats (Primary Admin only)
router.get('/stats', protect, taskController.getDashboardStats);

// Get task by ID
router.get('/:id', protect, taskController.getTaskById);

// Update task (Own task only)
router.put('/:id', protect, taskController.updateTask);

// Delete task (Own task only)
router.delete('/:id', protect, taskController.deleteTask);

// Task actions (SAAS Admin)
router.post('/:id/start', protect, taskController.startTask);
router.post('/:id/pause', protect, taskController.pauseTask);
router.post('/:id/complete', protect, taskController.completeTask);

// Advanced actions
router.patch('/:id/progress', protect, taskController.updateProgress);
router.patch('/:id/status', protect, taskController.changeStatus);
router.post('/:id/blockers', protect, taskController.addBlocker);
router.patch('/:id/blockers/:blockerId/resolve', protect, taskController.resolveBlocker);

// Link case study to task
router.post('/link-case-study', protect, taskController.linkCaseStudy);

module.exports = router;
