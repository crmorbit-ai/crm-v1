const mongoose = require('mongoose');
const Task = require('../models/Task');
const { successResponse, errorResponse } = require('../utils/response');
// const { logActivity } = require('../middleware/activityLogger'); // COMMENTED OUT

const getTasks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      priority,
      relatedTo,
      relatedToId,
      owner
    } = req.query;

    let query = { isActive: true };

    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      query.tenant = req.user.tenant;
    }

    if (search) {
      query.subject = { $regex: search, $options: 'i' };
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (relatedTo) query.relatedTo = relatedTo;
    if (relatedToId) query.relatedToId = relatedToId;
    if (owner) query.owner = owner;

    console.log('Task Query:', query); // DEBUG

    const total = await Task.countDocuments(query);
    console.log('Total tasks:', total); // DEBUG

    const tasks = await Task.find(query)
      .populate('owner', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('relatedToId')
      .populate('tenant', 'organizationName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ dueDate: 1 })
      .lean();

    // 🆕 Fetch groups for each created user
    const Group = require('../models/Group');
    for (let task of tasks) {
      if (task.createdBy && task.createdBy._id) {
        const userGroups = await Group.find({
          members: task.createdBy._id,
          isActive: true
        }).select('name category').lean();
        task.createdBy.groups = userGroups;
      }
    }

    console.log('Tasks retrieved:', tasks.length); // DEBUG

    successResponse(res, 200, 'Tasks retrieved successfully', {
      tasks,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('owner', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('relatedToId')
      .populate('tenant', 'organizationName')
      .lean();

    if (!task) {
      return errorResponse(res, 404, 'Task not found');
    }

    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (task.tenant._id.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    // 🆕 Fetch groups for created user
    const Group = require('../models/Group');
    if (task.createdBy && task.createdBy._id) {
      const userGroups = await Group.find({
        members: task.createdBy._id,
        isActive: true
      }).select('name category').lean();
      task.createdBy.groups = userGroups;
    }

    successResponse(res, 200, 'Task retrieved successfully', task);
  } catch (error) {
    console.error('Get task error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const createTask = async (req, res) => {
  try {
    const {
      subject,
      dueDate,
      status,
      priority,
      relatedTo,
      relatedToId,
      description,
      reminder,
      assignedTo
    } = req.body;

    console.log('Create task body:', req.body); // DEBUG

    if (!subject || !dueDate || !relatedTo || !relatedToId) {
      return errorResponse(res, 400, 'Please provide subject, dueDate, relatedTo, and relatedToId');
    }

    let tenant;
    if (req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN') {
      tenant = req.body.tenant;
      if (!tenant) {
        return errorResponse(res, 400, 'Tenant is required');
      }
    } else {
      tenant = req.user.tenant;
    }

    const task = await Task.create({
      subject,
      dueDate,
      status: status || 'Not Started',
      priority: priority || 'Normal',
      relatedTo,
      relatedToId,
      description,
      reminder,
      assignedTo: assignedTo || req.user._id,
      owner: req.user._id,
      tenant,
      createdBy: req.user._id,
      lastModifiedBy: req.user._id
    });

    await task.populate('owner', 'firstName lastName email');
    await task.populate('assignedTo', 'firstName lastName email');

    // await logActivity(req, 'task.created', 'Task', task._id, {
    //   subject: task.subject,
    //   dueDate: task.dueDate
    // }); // COMMENTED OUT

    console.log('Task created successfully:', task._id); // DEBUG

    successResponse(res, 201, 'Task created successfully', task);
  } catch (error) {
    console.error('Create task error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return errorResponse(res, 404, 'Task not found');
    }

    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (task.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    const allowedFields = [
      'subject', 'dueDate', 'status', 'priority', 'relatedTo', 'relatedToId',
      'description', 'reminder', 'assignedTo'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    task.lastModifiedBy = req.user._id;
    await task.save();

    await task.populate('owner', 'firstName lastName email');
    await task.populate('assignedTo', 'firstName lastName email');

    // await logActivity(req, 'task.updated', 'Task', task._id); // COMMENTED OUT

    successResponse(res, 200, 'Task updated successfully', task);
  } catch (error) {
    console.error('Update task error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return errorResponse(res, 404, 'Task not found');
    }

    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (task.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    task.isActive = false;
    task.lastModifiedBy = req.user._id;
    await task.save();

    // await logActivity(req, 'task.deleted', 'Task', task._id, {
    //   subject: task.subject
    // }); // COMMENTED OUT

    successResponse(res, 200, 'Task deleted successfully');
  } catch (error) {
    console.error('Delete task error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask
};