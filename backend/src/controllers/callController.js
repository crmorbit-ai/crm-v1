const mongoose = require('mongoose');
const Call = require('../models/Call');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');

const getCalls = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, callType, relatedTo, relatedToId } = req.query;
    let query = { isActive: true };
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') query.tenant = req.user.tenant;
    if (search) query.$or = [{ subject: { $regex: search, $options: 'i' }}];
    if (callType) query.callType = callType;
    if (relatedTo) query.relatedTo = relatedTo;
    if (relatedToId) query.relatedToId = relatedToId;
    const total = await Call.countDocuments(query);
    const calls = await Call.find(query)
      .populate('owner', 'firstName lastName email')
      .populate('contactName', 'firstName lastName email')
      .populate('tenant', 'organizationName')
      .limit(limit * 1).skip((page - 1) * limit).sort({ callStartTime: -1 }).lean();
    successResponse(res, 200, 'Calls retrieved successfully', {
      calls, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get calls error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const getCall = async (req, res) => {
  try {
    const call = await Call.findById(req.params.id)
      .populate('owner', 'firstName lastName email')
      .populate('contactName', 'firstName lastName email phone')
      .populate('tenant', 'organizationName');
    if (!call) return errorResponse(res, 404, 'Call not found');
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (call.tenant._id.toString() !== req.user.tenant.toString()) return errorResponse(res, 403, 'Access denied');
    }
    successResponse(res, 200, 'Call retrieved successfully', call);
  } catch (error) {
    console.error('Get call error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const createCall = async (req, res) => {
  try {
    const { subject, callType, callStartTime, callDuration, callPurpose, callResult, relatedTo, relatedToId, contactName, description } = req.body;
    if (!subject || !callStartTime || !relatedTo || !relatedToId) {
      return errorResponse(res, 400, 'Please provide subject, callStartTime, relatedTo, and relatedToId');
    }
    let tenant;
    if (req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN') {
      tenant = req.body.tenant;
      if (!tenant) return errorResponse(res, 400, 'Tenant is required');
    } else tenant = req.user.tenant;
    const call = await Call.create({
      subject, callType, callStartTime, callDuration, callPurpose, callResult, relatedTo, relatedToId, contactName, description,
      owner: req.body.owner || req.user._id, tenant, createdBy: req.user._id, lastModifiedBy: req.user._id
    });
    await call.populate('owner', 'firstName lastName email');
    await logActivity(req, 'call.created', 'Call', call._id, { subject: call.subject });
    successResponse(res, 201, 'Call created successfully', call);
  } catch (error) {
    console.error('Create call error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const updateCall = async (req, res) => {
  try {
    const call = await Call.findById(req.params.id);
    if (!call) return errorResponse(res, 404, 'Call not found');
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (call.tenant.toString() !== req.user.tenant.toString()) return errorResponse(res, 403, 'Access denied');
    }
    const allowedFields = ['subject', 'callType', 'callStartTime', 'callDuration', 'callPurpose', 'callResult', 'description', 'contactName'];
    allowedFields.forEach(field => { if (req.body[field] !== undefined) call[field] = req.body[field]; });
    call.lastModifiedBy = req.user._id;
    await call.save();
    await call.populate('owner', 'firstName lastName email');
    await logActivity(req, 'call.updated', 'Call', call._id);
    successResponse(res, 200, 'Call updated successfully', call);
  } catch (error) {
    console.error('Update call error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const deleteCall = async (req, res) => {
  try {
    const call = await Call.findById(req.params.id);
    if (!call) return errorResponse(res, 404, 'Call not found');
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (call.tenant.toString() !== req.user.tenant.toString()) return errorResponse(res, 403, 'Access denied');
    }
    call.isActive = false;
    call.lastModifiedBy = req.user._id;
    await call.save();
    await logActivity(req, 'call.deleted', 'Call', call._id, { subject: call.subject });
    successResponse(res, 200, 'Call deleted successfully');
  } catch (error) {
    console.error('Delete call error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

module.exports = { getCalls, getCall, createCall, updateCall, deleteCall };