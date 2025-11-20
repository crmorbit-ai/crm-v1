const mongoose = require('mongoose');
const Meeting = require('../models/Meeting');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');

const getMeetings = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, relatedTo, relatedToId } = req.query;
    let query = { isActive: true };
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') query.tenant = req.user.tenant;
    if (search) query.$or = [{ title: { $regex: search, $options: 'i' }}, { location: { $regex: search, $options: 'i' }}];
    if (status) query.status = status;
    if (relatedTo) query.relatedTo = relatedTo;
    if (relatedToId) query.relatedToId = relatedToId;
    const total = await Meeting.countDocuments(query);
    const meetings = await Meeting.find(query)
      .populate('owner', 'firstName lastName email')
      .populate('host', 'firstName lastName email')
      .populate('contactName', 'firstName lastName email')
      .populate('tenant', 'organizationName')
      .limit(limit * 1).skip((page - 1) * limit).sort({ from: -1 }).lean();
    successResponse(res, 200, 'Meetings retrieved successfully', {
      meetings, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get meetings error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const getMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('owner', 'firstName lastName email')
      .populate('host', 'firstName lastName email')
      .populate('contactName', 'firstName lastName email phone')
      .populate('tenant', 'organizationName');
    if (!meeting) return errorResponse(res, 404, 'Meeting not found');
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (meeting.tenant._id.toString() !== req.user.tenant.toString()) return errorResponse(res, 403, 'Access denied');
    }
    successResponse(res, 200, 'Meeting retrieved successfully', meeting);
  } catch (error) {
    console.error('Get meeting error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const createMeeting = async (req, res) => {
  try {
    const { title, location, from, to, relatedTo, relatedToId, contactName, description, agenda, meetingType, participants } = req.body;
    if (!title || !from || !to || !relatedTo || !relatedToId) {
      return errorResponse(res, 400, 'Please provide title, from, to, relatedTo, and relatedToId');
    }
    let tenant;
    if (req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN') {
      tenant = req.body.tenant;
      if (!tenant) return errorResponse(res, 400, 'Tenant is required');
    } else tenant = req.user.tenant;
    
    // ✅ AUTO-GENERATE JITSI MEETING LINK
    const meetingId = `crm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const meetingLink = `https://meet.jit.si/${meetingId}`;
    
    const meeting = await Meeting.create({
      title, location, from, to, relatedTo, relatedToId, contactName, description, agenda, meetingType, participants,
      meetingId,
      meetingLink,
      host: req.body.host || req.user._id, owner: req.body.owner || req.user._id, tenant, 
      createdBy: req.user._id, lastModifiedBy: req.user._id
    });
    await meeting.populate('owner', 'firstName lastName email');
    await meeting.populate('host', 'firstName lastName email');
    await logActivity(req, 'meeting.created', 'Meeting', meeting._id, { title: meeting.title });
    successResponse(res, 201, 'Meeting created successfully', meeting);
  } catch (error) {
    console.error('Create meeting error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const updateMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return errorResponse(res, 404, 'Meeting not found');
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (meeting.tenant.toString() !== req.user.tenant.toString()) return errorResponse(res, 403, 'Access denied');
    }
    const allowedFields = ['title', 'location', 'from', 'to', 'description', 'agenda', 'outcome', 'meetingType', 'status', 'participants', 'contactName'];
    allowedFields.forEach(field => { if (req.body[field] !== undefined) meeting[field] = req.body[field]; });
    meeting.lastModifiedBy = req.user._id;
    await meeting.save();
    await meeting.populate('owner', 'firstName lastName email');
    await logActivity(req, 'meeting.updated', 'Meeting', meeting._id);
    successResponse(res, 200, 'Meeting updated successfully', meeting);
  } catch (error) {
    console.error('Update meeting error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return errorResponse(res, 404, 'Meeting not found');
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (meeting.tenant.toString() !== req.user.tenant.toString()) return errorResponse(res, 403, 'Access denied');
    }
    meeting.isActive = false;
    meeting.lastModifiedBy = req.user._id;
    await meeting.save();
    await logActivity(req, 'meeting.deleted', 'Meeting', meeting._id, { title: meeting.title });
    successResponse(res, 200, 'Meeting deleted successfully');
  } catch (error) {
    console.error('Delete meeting error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

module.exports = { getMeetings, getMeeting, createMeeting, updateMeeting, deleteMeeting };