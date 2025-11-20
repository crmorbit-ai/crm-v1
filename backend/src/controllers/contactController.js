const mongoose = require('mongoose');
const Contact = require('../models/Contact');
const Account = require('../models/Account');
const Opportunity = require('../models/Opportunity');
const Task = require('../models/Task');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');

const getContacts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, account, title } = req.query;
    let query = { isActive: true };
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') query.tenant = req.user.tenant;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' }}, { lastName: { $regex: search, $options: 'i' }},
        { email: { $regex: search, $options: 'i' }}, { phone: { $regex: search, $options: 'i' }}
      ];
    }
    if (account) query.account = account;
    if (title) query.title = { $regex: title, $options: 'i' };
    const total = await Contact.countDocuments(query);
    const contacts = await Contact.find(query)
      .populate('account', 'accountName accountNumber')
      .populate('owner', 'firstName lastName email')
      .populate('tenant', 'organizationName')
      .populate('reportsTo', 'firstName lastName email title')
      .limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 }).lean();
    successResponse(res, 200, 'Contacts retrieved successfully', {
      contacts, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const getContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('account', 'accountName accountNumber phone website')
      .populate('owner', 'firstName lastName email')
      .populate('tenant', 'organizationName')
      .populate('reportsTo', 'firstName lastName email title');
    if (!contact) return errorResponse(res, 404, 'Contact not found');
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (contact.tenant._id.toString() !== req.user.tenant.toString()) return errorResponse(res, 403, 'Access denied');
    }
    const [opportunities, tasks] = await Promise.all([
      Opportunity.find({ contact: req.params.id, isActive: true })
        .populate('owner', 'firstName lastName').populate('account', 'accountName')
        .limit(10).sort({ createdAt: -1 }).lean(),
      Task.find({ relatedTo: 'Contact', relatedToId: req.params.id, isActive: true })
        .populate('owner', 'firstName lastName').limit(10).sort({ dueDate: 1 }).lean()
    ]);
    const [opportunitiesCount, tasksCount] = await Promise.all([
      Opportunity.countDocuments({ contact: req.params.id, isActive: true }),
      Task.countDocuments({ relatedTo: 'Contact', relatedToId: req.params.id, isActive: true })
    ]);
    const contactData = contact.toObject();
    contactData.relatedData = {
      opportunities: { data: opportunities, total: opportunitiesCount },
      tasks: { data: tasks, total: tasksCount }
    };
    successResponse(res, 200, 'Contact retrieved successfully', contactData);
  } catch (error) {
    console.error('Get contact error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const createContact = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, mobile, account, title, department, reportsTo, leadSource, isPrimary, doNotCall, emailOptOut,
      mailingStreet, mailingCity, mailingState, mailingCountry, mailingZipCode, description } = req.body;
    if (!firstName || !lastName || !email) return errorResponse(res, 400, 'Please provide firstName, lastName, and email');
    if (!account) return errorResponse(res, 400, 'Account is required for contact');
    const accountExists = await Account.findById(account);
    if (!accountExists) return errorResponse(res, 404, 'Account not found');
    let tenant;
    if (req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN') {
      tenant = req.body.tenant;
      if (!tenant) return errorResponse(res, 400, 'Tenant is required');
    } else tenant = req.user.tenant;
    const existingContact = await Contact.findOne({ email, account, isActive: true });
    if (existingContact) return errorResponse(res, 400, 'Contact with this email already exists for this account');
    const contact = await Contact.create({
      firstName, lastName, email, phone, mobile, account, title, department, reportsTo: reportsTo || null, leadSource,
      isPrimary: isPrimary || false, doNotCall: doNotCall || false, emailOptOut: emailOptOut || false,
      mailingAddress: { street: mailingStreet, city: mailingCity, state: mailingState, country: mailingCountry, zipCode: mailingZipCode },
      description, owner: req.body.owner || req.user._id, tenant, createdBy: req.user._id, lastModifiedBy: req.user._id
    });
    await contact.populate('account', 'accountName accountNumber');
    await contact.populate('owner', 'firstName lastName email');
    await logActivity(req, 'contact.created', 'Contact', contact._id, { firstName: contact.firstName, lastName: contact.lastName, email: contact.email });
    successResponse(res, 201, 'Contact created successfully', contact);
  } catch (error) {
    console.error('Create contact error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const updateContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return errorResponse(res, 404, 'Contact not found');
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (contact.tenant.toString() !== req.user.tenant.toString()) return errorResponse(res, 403, 'Access denied');
    }
    const { firstName, lastName, email, phone, mobile, title, department, reportsTo, isPrimary, doNotCall, emailOptOut,
      mailingStreet, mailingCity, mailingState, mailingCountry, mailingZipCode, description } = req.body;
    if (firstName) contact.firstName = firstName;
    if (lastName) contact.lastName = lastName;
    if (email) contact.email = email;
    if (phone !== undefined) contact.phone = phone;
    if (mobile !== undefined) contact.mobile = mobile;
    if (title !== undefined) contact.title = title;
    if (department !== undefined) contact.department = department;
    if (reportsTo !== undefined) contact.reportsTo = reportsTo;
    if (isPrimary !== undefined) contact.isPrimary = isPrimary;
    if (doNotCall !== undefined) contact.doNotCall = doNotCall;
    if (emailOptOut !== undefined) contact.emailOptOut = emailOptOut;
    if (description !== undefined) contact.description = description;
    if (mailingStreet !== undefined) contact.mailingAddress.street = mailingStreet;
    if (mailingCity !== undefined) contact.mailingAddress.city = mailingCity;
    if (mailingState !== undefined) contact.mailingAddress.state = mailingState;
    if (mailingCountry !== undefined) contact.mailingAddress.country = mailingCountry;
    if (mailingZipCode !== undefined) contact.mailingAddress.zipCode = mailingZipCode;
    contact.lastModifiedBy = req.user._id;
    await contact.save();
    await contact.populate('account', 'accountName accountNumber');
    await contact.populate('owner', 'firstName lastName email');
    await logActivity(req, 'contact.updated', 'Contact', contact._id, { firstName: contact.firstName, lastName: contact.lastName });
    successResponse(res, 200, 'Contact updated successfully', contact);
  } catch (error) {
    console.error('Update contact error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return errorResponse(res, 404, 'Contact not found');
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (contact.tenant.toString() !== req.user.tenant.toString()) return errorResponse(res, 403, 'Access denied');
    }
    contact.isActive = false;
    contact.lastModifiedBy = req.user._id;
    await contact.save();
    await logActivity(req, 'contact.deleted', 'Contact', contact._id, { firstName: contact.firstName, lastName: contact.lastName });
    successResponse(res, 200, 'Contact deleted successfully');
  } catch (error) {
    console.error('Delete contact error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

const getContactStats = async (req, res) => {
  try {
    let query = { isActive: true };
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') query.tenant = req.user.tenant;
    const total = await Contact.countDocuments(query);
    const primaryContacts = await Contact.countDocuments({ ...query, isPrimary: true });
    const byDepartment = await Contact.aggregate([
      { $match: { ...query, department: { $ne: null, $ne: '' } } },
      { $group: { _id: '$department', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 5 }
    ]);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newThisMonth = await Contact.countDocuments({ ...query, createdAt: { $gte: startOfMonth } });
    successResponse(res, 200, 'Statistics retrieved successfully', { total, primaryContacts, newThisMonth, byDepartment });
  } catch (error) {
    console.error('Get contact stats error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

module.exports = { getContacts, getContact, createContact, updateContact, deleteContact, getContactStats };