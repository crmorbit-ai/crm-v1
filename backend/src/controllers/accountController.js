const mongoose = require('mongoose');
const Account = require('../models/Account');
const Contact = require('../models/Contact');
const Opportunity = require('../models/Opportunity');
const Task = require('../models/Task');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');
const { trackChanges, getRecordName } = require('../utils/changeTracker');

const getAccounts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, accountType, industry, owner, rating } = req.query;
    let query = { isActive: true };
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      query.tenant = req.user.tenant;
    }
    if (search) {
      query.$or = [
        { accountName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    if (accountType) query.accountType = accountType;
    if (industry) query.industry = industry;
    if (owner) query.owner = owner;
    if (rating) query.rating = rating;
    const total = await Account.countDocuments(query);
    const accounts = await Account.find(query)
      .populate('owner', 'firstName lastName email')
      .populate('parentAccount', 'accountName')
      .populate('tenant', 'organizationName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .lean();
    successResponse(res, 200, 'Accounts retrieved successfully', {
      accounts,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const getAccount = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id)
      .populate('owner', 'firstName lastName email')
      .populate('parentAccount', 'accountName accountType')
      .populate('tenant', 'organizationName');
    if (!account) return errorResponse(res, 404, 'Account not found');
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (account.tenant._id.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }
    const [contacts, opportunities, tasks] = await Promise.all([
      Contact.find({ account: req.params.id, isActive: true })
        .populate('owner', 'firstName lastName').limit(10).sort({ createdAt: -1 }).lean(),
      Opportunity.find({ account: req.params.id, isActive: true })
        .populate('owner', 'firstName lastName').populate('contact', 'firstName lastName')
        .limit(10).sort({ createdAt: -1 }).lean(),
      Task.find({ relatedTo: 'Account', relatedToId: req.params.id, isActive: true })
        .populate('owner', 'firstName lastName').limit(10).sort({ dueDate: 1 }).lean()
    ]);
    const [contactsCount, opportunitiesCount, tasksCount] = await Promise.all([
      Contact.countDocuments({ account: req.params.id, isActive: true }),
      Opportunity.countDocuments({ account: req.params.id, isActive: true }),
      Task.countDocuments({ relatedTo: 'Account', relatedToId: req.params.id, isActive: true })
    ]);
    const accountData = account.toObject();
    accountData.relatedData = {
      contacts: { data: contacts, total: contactsCount },
      opportunities: { data: opportunities, total: opportunitiesCount },
      tasks: { data: tasks, total: tasksCount }
    };
    successResponse(res, 200, 'Account retrieved successfully', accountData);
  } catch (error) {
    console.error('Get account error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const createAccount = async (req, res) => {
  try {
    const { accountName, accountType, industry, website, phone, fax, email, annualRevenue, numberOfEmployees,
      billingAddress, shippingAddress, parentAccount, rating, ownership, tickerSymbol, SICCode, description } = req.body;
    if (!accountName) return errorResponse(res, 400, 'Please provide account name');
    let tenant;
    if (req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN') {
      tenant = req.body.tenant;
      if (!tenant) return errorResponse(res, 400, 'Tenant is required');
    } else tenant = req.user.tenant;
    const existingAccount = await Account.findOne({ accountName, tenant, isActive: true });
    if (existingAccount) return errorResponse(res, 400, 'Account with this name already exists');
    const account = await Account.create({
      accountName, accountType: accountType || 'Prospect', industry, website, phone, fax, email, annualRevenue,
      numberOfEmployees, billingAddress, shippingAddress, parentAccount, rating, ownership, tickerSymbol,
      SICCode, description, owner: req.body.owner || req.user._id, tenant, createdBy: req.user._id, lastModifiedBy: req.user._id
    });
    await account.populate('owner', 'firstName lastName email');
    await logActivity(req, 'account.created', 'Account', account._id, { accountName: account.accountName, accountType: account.accountType });
    successResponse(res, 201, 'Account created successfully', account);
  } catch (error) {
    console.error('Create account error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const updateAccount = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) return errorResponse(res, 404, 'Account not found');
    
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (account.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    const allowedFields = [
      'accountName', 'accountType', 'industry', 'website', 'phone', 'fax', 
      'email', 'annualRevenue', 'numberOfEmployees', 'billingAddress', 
      'shippingAddress', 'parentAccount', 'rating', 'ownership', 
      'tickerSymbol', 'SICCode', 'description', 'tags'
    ];

    // Track changes
    const changes = trackChanges(account, req.body, allowedFields);

    // Update fields
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        account[field] = req.body[field];
      }
    });

    // Handle owner separately
    if (req.body.owner && req.body.owner !== account.owner.toString()) {
      changes.owner = {
        old: account.owner.toString(),
        new: req.body.owner
      };
      account.owner = req.body.owner;
    }

    account.lastModifiedBy = req.user._id;
    await account.save();
    await account.populate('owner', 'firstName lastName email');

    // Log with changes
    if (Object.keys(changes).length > 0) {
      await logActivity(req, 'account.updated', 'Account', account._id, {
        targetUser: `${account.accountName || 'Unknown Account'} (${account.email || 'No Email'})`,
        changedBy: `${req.user.firstName} ${req.user.lastName} - ${req.user.userType || 'User'} (${req.user.email})`,
        recordName: getRecordName(account, 'Account'),
        changes: changes,
        fieldsChanged: Object.keys(changes)
      });
    }

    successResponse(res, 200, 'Account updated successfully', account);
  } catch (error) {
    console.error('Update account error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const deleteAccount = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) return errorResponse(res, 404, 'Account not found');
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (account.tenant.toString() !== req.user.tenant.toString()) return errorResponse(res, 403, 'Access denied');
    }
    account.isActive = false;
    account.lastModifiedBy = req.user._id;
    await account.save();
    await logActivity(req, 'account.deleted', 'Account', account._id, { accountName: account.accountName });
    successResponse(res, 200, 'Account deleted successfully');
  } catch (error) {
    console.error('Delete account error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const getAccountStats = async (req, res) => {
  try {
    const query = { isActive: true };
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') query.tenant = req.user.tenant;
    const [totalAccounts, customers, prospects, partners, byType, byIndustry] = await Promise.all([
      Account.countDocuments(query), Account.countDocuments({ ...query, accountType: 'Customer' }),
      Account.countDocuments({ ...query, accountType: 'Prospect' }), Account.countDocuments({ ...query, accountType: 'Partner' }),
      Account.aggregate([{ $match: query }, { $group: { _id: '$accountType', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Account.aggregate([{ $match: query }, { $group: { _id: '$industry', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }])
    ]);
    successResponse(res, 200, 'Account statistics retrieved successfully', {
      total: totalAccounts, byType: { customers, prospects, partners }, byTypeDetailed: byType, byIndustry
    });
  } catch (error) {
    console.error('Get account stats error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

module.exports = { getAccounts, getAccount, createAccount, updateAccount, deleteAccount, getAccountStats };