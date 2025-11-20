const mongoose = require('mongoose');
const Note = require('../models/Note');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');

const getNotes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      relatedTo,
      relatedToId,
      owner
    } = req.query;

    let query = { isActive: true };

    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      query.tenant = req.user.tenant;
    }

    if (relatedTo) query.relatedTo = relatedTo;
    if (relatedToId) query.relatedToId = relatedToId;
    if (owner) query.owner = owner;

    const total = await Note.countDocuments(query);

    const notes = await Note.find(query)
      .populate('owner', 'firstName lastName email')
      .populate('relatedToId')
      .populate('tenant', 'organizationName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .lean();

    successResponse(res, 200, 'Notes retrieved successfully', {
      notes,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get notes error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const getNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('owner', 'firstName lastName email')
      .populate('relatedToId')
      .populate('tenant', 'organizationName');

    if (!note) {
      return errorResponse(res, 404, 'Note not found');
    }

    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (note.tenant._id.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    successResponse(res, 200, 'Note retrieved successfully', note);
  } catch (error) {
    console.error('Get note error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const createNote = async (req, res) => {
  try {
    const {
      title,
      content,
      relatedTo,
      relatedToId
    } = req.body;

    if (!title || !content || !relatedTo || !relatedToId) {
      return errorResponse(res, 400, 'Please provide title, content, relatedTo, and relatedToId');
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

    const note = await Note.create({
      title,
      content,
      relatedTo,
      relatedToId,
      owner: req.user._id,
      tenant,
      createdBy: req.user._id,
      lastModifiedBy: req.user._id
    });

    await note.populate('owner', 'firstName lastName email');

    await logActivity(req, 'note.created', 'Note', note._id, {
      title: note.title
    });

    successResponse(res, 201, 'Note created successfully', note);
  } catch (error) {
    console.error('Create note error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const updateNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return errorResponse(res, 404, 'Note not found');
    }

    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (note.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    const allowedFields = ['title', 'content'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        note[field] = req.body[field];
      }
    });

    note.lastModifiedBy = req.user._id;
    await note.save();

    await note.populate('owner', 'firstName lastName email');

    await logActivity(req, 'note.updated', 'Note', note._id);

    successResponse(res, 200, 'Note updated successfully', note);
  } catch (error) {
    console.error('Update note error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return errorResponse(res, 404, 'Note not found');
    }

    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (note.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    note.isActive = false;
    note.lastModifiedBy = req.user._id;
    await note.save();

    await logActivity(req, 'note.deleted', 'Note', note._id, {
      title: note.title
    });

    successResponse(res, 200, 'Note deleted successfully');
  } catch (error) {
    console.error('Delete note error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

module.exports = {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote
};