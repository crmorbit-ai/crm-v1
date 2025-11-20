const mongoose = require('mongoose');
const Opportunity = require('../models/Opportunity');
const Account = require('../models/Account');
const Contact = require('../models/Contact');
const Task = require('../models/Task');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');

const getOpportunities = async (req, res) => {
  try {
    const { page = 1, limit = 100, search, stage, type, owner, account } = req.query;
    let query = { isActive: true };
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') query.tenant = req.user.tenant;
    if (search) query.$or = [{ opportunityName: { $regex: search, $options: 'i' }}, { description: { $regex: search, $options: 'i' }}];
    if (stage) query.stage = stage;
    if (type) query.type = type;
    if (owner) query.owner = owner;
    if (account) query.account = account;
    const total = await Opportunity.countDocuments(query);
    const opportunities = await Opportunity.find(query)
      .populate('owner', 'firstName lastName email')
      .populate('account', 'accountName accountType')
      .populate('contact', 'firstName lastName email')
      .populate('tenant', 'organizationName')
      .limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 }).lean();
    successResponse(res, 200, 'Opportunities retrieved successfully', {
      opportunities, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get opportunities error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const getOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id)
      .populate('owner', 'firstName lastName email')
      .populate('account', 'accountName accountType industry website phone')
      .populate('contact', 'firstName lastName email phone jobTitle')
      .populate('lead', 'firstName lastName email')
      .populate('tenant', 'organizationName');
    if (!opportunity) return errorResponse(res, 404, 'Opportunity not found');
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (opportunity.tenant._id.toString() !== req.user.tenant.toString()) return errorResponse(res, 403, 'Access denied');
    }
    const tasks = await Task.find({ relatedTo: 'Opportunity', relatedToId: req.params.id, isActive: true })
      .populate('owner', 'firstName lastName').limit(10).sort({ dueDate: 1 }).lean();
    const tasksCount = await Task.countDocuments({ relatedTo: 'Opportunity', relatedToId: req.params.id, isActive: true });
    const opportunityData = opportunity.toObject();
    opportunityData.relatedData = { tasks: { data: tasks, total: tasksCount } };
    successResponse(res, 200, 'Opportunity retrieved successfully', opportunityData);
  } catch (error) {
    console.error('Get opportunity error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const createOpportunity = async (req, res) => {
  try {
    const { opportunityName, amount, closeDate, stage, probability, type, leadSource, account, contact, nextStep, description, campaignSource, contactRole } = req.body;
    if (!opportunityName || !closeDate || !account) return errorResponse(res, 400, 'Please provide opportunityName, closeDate, and account');
    const accountExists = await Account.findById(account);
    if (!accountExists) return errorResponse(res, 404, 'Account not found');
    let tenant;
    if (req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN') {
      tenant = req.body.tenant;
      if (!tenant) return errorResponse(res, 400, 'Tenant is required');
    } else tenant = req.user.tenant;
    const opportunity = await Opportunity.create({
      opportunityName, amount: amount || 0, closeDate, stage: stage || 'Qualification', probability: probability || 50,
      type: type || 'New Business', leadSource, account, contact, nextStep, description, campaignSource, contactRole,
      owner: req.body.owner || req.user._id, tenant, createdBy: req.user._id, lastModifiedBy: req.user._id
    });
    await opportunity.populate('owner', 'firstName lastName email');
    await opportunity.populate('account', 'accountName');
    await logActivity(req, 'opportunity.created', 'Opportunity', opportunity._id, { opportunityName: opportunity.opportunityName, amount: opportunity.amount, stage: opportunity.stage });
    successResponse(res, 201, 'Opportunity created successfully', opportunity);
  } catch (error) {
    console.error('Create opportunity error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const updateOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) return errorResponse(res, 404, 'Opportunity not found');
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (opportunity.tenant.toString() !== req.user.tenant.toString()) return errorResponse(res, 403, 'Access denied');
    }
    const allowedFields = ['opportunityName', 'amount', 'closeDate', 'stage', 'probability', 'type', 'leadSource', 'account', 'contact', 'nextStep', 'description', 'campaignSource', 'contactRole', 'owner', 'tags'];
    allowedFields.forEach(field => { if (req.body[field] !== undefined) opportunity[field] = req.body[field]; });
    opportunity.lastModifiedBy = req.user._id;
    await opportunity.save();
    await opportunity.populate('owner', 'firstName lastName email');
    await opportunity.populate('account', 'accountName');
    await logActivity(req, 'opportunity.updated', 'Opportunity', opportunity._id);
    successResponse(res, 200, 'Opportunity updated successfully', opportunity);
  } catch (error) {
    console.error('Update opportunity error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const deleteOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) return errorResponse(res, 404, 'Opportunity not found');
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (opportunity.tenant.toString() !== req.user.tenant.toString()) return errorResponse(res, 403, 'Access denied');
    }
    opportunity.isActive = false;
    opportunity.lastModifiedBy = req.user._id;
    await opportunity.save();
    await logActivity(req, 'opportunity.deleted', 'Opportunity', opportunity._id, { opportunityName: opportunity.opportunityName });
    successResponse(res, 200, 'Opportunity deleted successfully');
  } catch (error) {
    console.error('Delete opportunity error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const getOpportunityStats = async (req, res) => {
  try {
    const query = { isActive: true };
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') query.tenant = req.user.tenant;
    const [totalOpportunities, totalValue, wonDeals, lostDeals, byStage, byType] = await Promise.all([
      Opportunity.countDocuments(query),
      Opportunity.aggregate([{ $match: query }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Opportunity.countDocuments({ ...query, stage: 'Closed Won' }),
      Opportunity.countDocuments({ ...query, stage: 'Closed Lost' }),
      Opportunity.aggregate([{ $match: query }, { $group: { _id: '$stage', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }, { $sort: { count: -1 } }]),
      Opportunity.aggregate([{ $match: query }, { $group: { _id: '$type', count: { $sum: 1 } } }])
    ]);
    successResponse(res, 200, 'Opportunity statistics retrieved successfully', {
      total: totalOpportunities, totalValue: totalValue[0]?.total || 0, won: wonDeals, lost: lostDeals, byStage, byType
    });
  } catch (error) {
    console.error('Get opportunity stats error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

module.exports = { getOpportunities, getOpportunity, createOpportunity, updateOpportunity, deleteOpportunity, getOpportunityStats };