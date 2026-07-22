const CaseStudyTask = require('../models/CaseStudyTask');
const User = require('../models/User');

const mkErr = (msg, code) => Object.assign(new Error(msg), { statusCode: code });

const SAAS_TYPES = ['SAAS_OWNER', 'SAAS_ADMIN'];
const isSaasUser = (user) => SAAS_TYPES.includes(user.userType);
const isPrimaryAdmin = (user) => user.userType === 'SAAS_OWNER';

/* ══════════════════════════════════════════════════════════
   CREATE TASK (SAAS Admin - Self Declaration)
══════════════════════════════════════════════════════════ */
exports.createTask = async (req, res, next) => {
  try {
    if (!isSaasUser(req.user)) {
      throw mkErr('Only SAAS users can create tasks', 403);
    }

    const {
      title,
      description,
      topic,
      taskType,
      tags,
      reminderBefore,
      priority,
      complexity,
      estimatedHours,
      deadline
    } = req.body;

    // Parse tags if provided as comma-separated string
    let tagsArray = [];
    if (tags) {
      tagsArray = typeof tags === 'string'
        ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : tags;
    }

    // SAAS Admin creates task for themselves
    const task = await CaseStudyTask.create({
      title,
      description,
      topic,
      taskType: taskType || 'general',
      tags: tagsArray,
      reminderBefore: reminderBefore ? parseInt(reminderBefore) : undefined,
      assignedTo: req.user._id, // Self-assigned
      assignedBy: req.user._id,  // Created by self
      priority: priority || 'medium',
      complexity: complexity || 'medium',
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : 0,
      deadline,
      activityLog: [{
        action: 'created',
        user: req.user._id,
        timestamp: new Date()
      }]
    });

    await task.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'assignedBy', select: 'name email' }
    ]);

    // Socket notification to primary admin
    if (global.io) {
      global.io.emit('task-created', {
        taskId: task._id,
        title: task.title,
        topic: task.topic,
        user: req.user.name,
        priority: task.priority
      });
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully! Timer ready to start.',
      data: task
    });
  } catch (e) {
    next(e);
  }
};

/* ══════════════════════════════════════════════════════════
   GET ALL TASKS (Primary Admin - see all | SAAS Admin - see own)
══════════════════════════════════════════════════════════ */
exports.getAllTasks = async (req, res, next) => {
  try {
    if (!isSaasUser(req.user)) {
      throw mkErr('Access denied', 403);
    }

    const { status, priority, assignedTo, page = 1, limit = 20 } = req.query;
    const filter = {};

    // Primary admin sees all, others see only their tasks
    if (!isPrimaryAdmin(req.user)) {
      filter.assignedTo = req.user._id;
    } else if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tasks, total] = await Promise.all([
      CaseStudyTask.find(filter)
        .populate('assignedTo', 'name email')
        .populate('assignedBy', 'name email')
        .populate('linkedCaseStudy', 'title slug status')
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      CaseStudyTask.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: tasks,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (e) {
    next(e);
  }
};

/* ══════════════════════════════════════════════════════════
   GET MY TASKS (SAAS Admin)
══════════════════════════════════════════════════════════ */
exports.getMyTasks = async (req, res, next) => {
  try {
    if (!isSaasUser(req.user)) {
      throw mkErr('Access denied', 403);
    }

    const { status } = req.query;
    const filter = { assignedTo: req.user._id };

    if (status) filter.status = status;

    const tasks = await CaseStudyTask.find(filter)
      .populate('assignedBy', 'name email')
      .populate('linkedCaseStudy', 'title slug status')
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: tasks
    });
  } catch (e) {
    next(e);
  }
};

/* ══════════════════════════════════════════════════════════
   GET TASK BY ID
══════════════════════════════════════════════════════════ */
exports.getTaskById = async (req, res, next) => {
  try {
    if (!isSaasUser(req.user)) {
      throw mkErr('Access denied', 403);
    }

    const task = await CaseStudyTask.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName email')
      .populate('linkedCaseStudy', 'title slug status')
      .populate('activityLog.user', 'firstName lastName email');

    if (!task) {
      throw mkErr('Task not found', 404);
    }

    // Check permission
    if (!isPrimaryAdmin(req.user) && task.assignedTo._id.toString() !== req.user._id.toString()) {
      throw mkErr('Access denied', 403);
    }

    res.json({ success: true, data: task });
  } catch (e) {
    next(e);
  }
};

/* ══════════════════════════════════════════════════════════
   START TASK (SAAS Admin)
══════════════════════════════════════════════════════════ */
exports.startTask = async (req, res, next) => {
  try {
    if (!isSaasUser(req.user)) {
      throw mkErr('Access denied', 403);
    }

    const task = await CaseStudyTask.findById(req.params.id);
    if (!task) {
      throw mkErr('Task not found', 404);
    }

    // Only assigned user can start
    if (task.assignedTo.toString() !== req.user._id.toString()) {
      throw mkErr('You can only start your own tasks', 403);
    }

    task.startTimer();
    task.activityLog.push({
      action: task.timeTracking.sessions.length === 0 ? 'started' : 'resumed',
      user: req.user._id,
      timestamp: new Date()
    });

    await task.save();

    // Real-time update to primary admin
    if (global.io) {
      global.io.emit('task-status-update', {
        taskId: task._id,
        status: 'in_progress',
        user: req.user.name,
        topic: task.topic
      });
    }

    res.json({
      success: true,
      message: 'Task started',
      data: task
    });
  } catch (e) {
    next(e);
  }
};

/* ══════════════════════════════════════════════════════════
   PAUSE TASK (SAAS Admin)
══════════════════════════════════════════════════════════ */
exports.pauseTask = async (req, res, next) => {
  try {
    if (!isSaasUser(req.user)) {
      throw mkErr('Access denied', 403);
    }

    const task = await CaseStudyTask.findById(req.params.id);
    if (!task) {
      throw mkErr('Task not found', 404);
    }

    if (task.assignedTo.toString() !== req.user._id.toString()) {
      throw mkErr('Access denied', 403);
    }

    task.pauseTimer();
    task.activityLog.push({
      action: 'paused',
      user: req.user._id,
      timestamp: new Date()
    });

    await task.save();

    res.json({
      success: true,
      message: 'Task paused',
      data: task
    });
  } catch (e) {
    next(e);
  }
};

/* ══════════════════════════════════════════════════════════
   COMPLETE TASK (SAAS Admin)
══════════════════════════════════════════════════════════ */
exports.completeTask = async (req, res, next) => {
  try {
    if (!isSaasUser(req.user)) {
      throw mkErr('Access denied', 403);
    }

    const task = await CaseStudyTask.findById(req.params.id);
    if (!task) {
      throw mkErr('Task not found', 404);
    }

    if (task.assignedTo.toString() !== req.user._id.toString()) {
      throw mkErr('Access denied', 403);
    }

    task.completeTask();
    task.activityLog.push({
      action: 'completed',
      user: req.user._id,
      timestamp: new Date(),
      comment: req.body.notes
    });

    if (req.body.notes) {
      task.notes = req.body.notes;
    }

    await task.save();

    // Notify primary admin
    if (global.io) {
      global.io.emit('task-completed', {
        taskId: task._id,
        title: task.title,
        user: req.user.name,
        timeSpent: task.formattedTimeSpent
      });
    }

    res.json({
      success: true,
      message: 'Task completed successfully',
      data: task
    });
  } catch (e) {
    next(e);
  }
};

/* ══════════════════════════════════════════════════════════
   UPDATE TASK (Own Task Only)
══════════════════════════════════════════════════════════ */
exports.updateTask = async (req, res, next) => {
  try {
    if (!isSaasUser(req.user)) {
      throw mkErr('Access denied', 403);
    }

    const task = await CaseStudyTask.findById(req.params.id);
    if (!task) {
      throw mkErr('Task not found', 404);
    }

    // Only owner can update their own task
    if (task.assignedTo.toString() !== req.user._id.toString()) {
      throw mkErr('You can only update your own tasks', 403);
    }

    const { title, description, topic, priority, deadline } = req.body;

    if (title) task.title = title;
    if (description) task.description = description;
    if (topic) task.topic = topic;
    if (priority) task.priority = priority;
    if (deadline) task.deadline = deadline;

    await task.save();

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (e) {
    next(e);
  }
};

/* ══════════════════════════════════════════════════════════
   DELETE TASK (Own Task Only)
══════════════════════════════════════════════════════════ */
exports.deleteTask = async (req, res, next) => {
  try {
    if (!isSaasUser(req.user)) {
      throw mkErr('Access denied', 403);
    }

    const task = await CaseStudyTask.findById(req.params.id);
    if (!task) {
      throw mkErr('Task not found', 404);
    }

    // Only owner can delete their own task
    if (task.assignedTo.toString() !== req.user._id.toString()) {
      throw mkErr('You can only delete your own tasks', 403);
    }

    await CaseStudyTask.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (e) {
    next(e);
  }
};

/* ══════════════════════════════════════════════════════════
   LINK CASE STUDY TO TASK (SAAS Admin)
══════════════════════════════════════════════════════════ */
exports.linkCaseStudy = async (req, res, next) => {
  try {
    if (!isSaasUser(req.user)) {
      throw mkErr('Access denied', 403);
    }

    const { taskId, caseStudyId } = req.body;

    const task = await CaseStudyTask.findById(taskId);
    if (!task) {
      throw mkErr('Task not found', 404);
    }

    if (task.assignedTo.toString() !== req.user._id.toString()) {
      throw mkErr('Access denied', 403);
    }

    task.linkedCaseStudy = caseStudyId;
    await task.save();

    res.json({
      success: true,
      message: 'Case study linked to task',
      data: task
    });
  } catch (e) {
    next(e);
  }
};

/* ══════════════════════════════════════════════════════════
   GET DASHBOARD STATS (Primary Admin)
══════════════════════════════════════════════════════════ */
exports.getDashboardStats = async (req, res, next) => {
  try {
    if (!isPrimaryAdmin(req.user)) {
      throw mkErr('Only Primary Admin can view dashboard stats', 403);
    }

    const [total, todo, inProgress, completed, activeNow] = await Promise.all([
      CaseStudyTask.countDocuments(),
      CaseStudyTask.countDocuments({ status: { $in: ['todo', 'pending'] } }),
      CaseStudyTask.countDocuments({ status: 'in_progress' }),
      CaseStudyTask.countDocuments({ status: 'completed' }),
      CaseStudyTask.countDocuments({ 'timeTracking.timerRunning': true })
    ]);

    // Get currently active tasks with user details
    const activeTasks = await CaseStudyTask.find({ 'timeTracking.timerRunning': true })
      .populate('assignedTo', 'name email')
      .select('title topic assignedTo timeTracking')
      .lean();

    res.json({
      success: true,
      data: {
        total,
        todo,
        inProgress,
        completed,
        activeNow,
        activeTasks
      }
    });
  } catch (e) {
    next(e);
  }
};

/* ══════════════════════════════════════════════════════════
   UPDATE TASK PROGRESS (SAAS Admin)
══════════════════════════════════════════════════════════ */
exports.updateProgress = async (req, res, next) => {
  try {
    if (!isSaasUser(req.user)) {
      throw mkErr('Access denied', 403);
    }

    const task = await CaseStudyTask.findById(req.params.id);
    if (!task) {
      throw mkErr('Task not found', 404);
    }

    if (task.assignedTo.toString() !== req.user._id.toString()) {
      throw mkErr('Access denied', 403);
    }

    const { progress } = req.body;
    if (progress < 0 || progress > 100) {
      throw mkErr('Progress must be between 0 and 100', 400);
    }

    task.progress = progress;

    // Auto-update status based on progress
    if (progress === 0) task.status = 'todo';
    else if (progress > 0 && progress < 100) task.status = 'in_progress';
    else if (progress === 100) task.status = 'review'; // Ready for review

    await task.save();

    res.json({
      success: true,
      message: 'Progress updated',
      data: task
    });
  } catch (e) {
    next(e);
  }
};

/* ══════════════════════════════════════════════════════════
   CHANGE TASK STATUS (SAAS Admin)
══════════════════════════════════════════════════════════ */
exports.changeStatus = async (req, res, next) => {
  try {
    if (!isSaasUser(req.user)) {
      throw mkErr('Access denied', 403);
    }

    const task = await CaseStudyTask.findById(req.params.id);
    if (!task) {
      throw mkErr('Task not found', 404);
    }

    if (task.assignedTo.toString() !== req.user._id.toString()) {
      throw mkErr('Access denied', 403);
    }

    const { status, holdReason } = req.body;

    // Validate status
    const validStatuses = ['todo', 'in_progress', 'review', 'on_hold', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw mkErr('Invalid status', 400);
    }

    // Update status
    task.status = status;

    // If putting on hold, save reason (optional)
    if (status === 'on_hold') {
      task.holdReason = holdReason || 'No reason provided';
    } else {
      // Clear hold reason if moving away from on_hold
      task.holdReason = undefined;
    }

    // If completed, cancelled, or on_hold, stop timer automatically
    if ((status === 'completed' || status === 'cancelled' || status === 'on_hold') && task.timeTracking.timerRunning) {
      task.pauseTimer(); // Stop the timer
    }

    // If completed, set completion time
    if (status === 'completed') {
      task.completedAt = new Date();
    }

    task.activityLog.push({
      action: 'status_changed',
      user: req.user._id,
      timestamp: new Date(),
      comment: `Status changed to: ${status}${holdReason ? ` - Reason: ${holdReason}` : ''}`
    });

    await task.save();

    // Notify primary admin
    if (global.io) {
      global.io.emit('task-status-changed', {
        taskId: task._id,
        status,
        user: req.user.name
      });
    }

    res.json({
      success: true,
      message: `Task status changed to ${status}`,
      data: task
    });
  } catch (e) {
    next(e);
  }
};

/* ══════════════════════════════════════════════════════════
   ADD BLOCKER (SAAS Admin)
══════════════════════════════════════════════════════════ */
exports.addBlocker = async (req, res, next) => {
  try {
    if (!isSaasUser(req.user)) {
      throw mkErr('Access denied', 403);
    }

    const task = await CaseStudyTask.findById(req.params.id);
    if (!task) {
      throw mkErr('Task not found', 404);
    }

    if (task.assignedTo.toString() !== req.user._id.toString()) {
      throw mkErr('Access denied', 403);
    }

    const { description } = req.body;
    if (!description) {
      throw mkErr('Blocker description is required', 400);
    }

    task.blockers.push({
      description,
      addedAt: new Date()
    });

    // Auto put on hold if blocker added
    if (task.status === 'in_progress') {
      task.status = 'on_hold';
      task.holdReason = 'Blocked';
    }

    await task.save();

    res.json({
      success: true,
      message: 'Blocker added',
      data: task
    });
  } catch (e) {
    next(e);
  }
};

/* ══════════════════════════════════════════════════════════
   RESOLVE BLOCKER (SAAS Admin)
══════════════════════════════════════════════════════════ */
exports.resolveBlocker = async (req, res, next) => {
  try {
    if (!isSaasUser(req.user)) {
      throw mkErr('Access denied', 403);
    }

    const { id, blockerId } = req.params;
    const task = await CaseStudyTask.findById(id);

    if (!task) {
      throw mkErr('Task not found', 404);
    }

    if (task.assignedTo.toString() !== req.user._id.toString()) {
      throw mkErr('Access denied', 403);
    }

    const blocker = task.blockers.id(blockerId);
    if (!blocker) {
      throw mkErr('Blocker not found', 404);
    }

    blocker.resolvedAt = new Date();
    await task.save();

    res.json({
      success: true,
      message: 'Blocker resolved',
      data: task
    });
  } catch (e) {
    next(e);
  }
};

