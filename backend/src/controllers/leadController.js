const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const Account = require('../models/Account');
const Contact = require('../models/Contact');
const Opportunity = require('../models/Opportunity');
const FieldDefinition = require('../models/FieldDefinition');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');
const { trackChanges, getRecordName } = require('../utils/changeTracker');
const { sendLeadAssignmentEmail } = require('../utils/emailService');

/**
 * @desc    Get all leads
 * @route   GET /api/leads
 * @access  Private
 */
const getLeads = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      leadStatus,
      leadSource,
      rating,
      owner,
      product,
      assignedGroup,
      unassigned
    } = req.query;

    let query = {
      isActive: true,
    };

    // Tenant filtering
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      query.tenant = req.user.tenant;
    }

    // 🆕 Group-based Visibility
    const Group = require('../models/Group');

    if (req.user.userType === 'TENANT_USER' || req.user.userType === 'TENANT_MANAGER') {
      // Get user's groups (members is simple array: [userId1, userId2, ...])
      const userGroups = await Group.find({
        members: req.user.id,  // ✅ FIXED: members is array of IDs, not objects
        isActive: true
      });

      if (userGroups.length > 0) {
        const groupIds = userGroups.map(g => g._id);

        // User can see: 1) Leads assigned to them directly, OR
        //              2) Leads assigned to their groups AND they are in assignedMembers
        query.$or = [
          { owner: req.user.id },                    // Assigned directly to user
          {
            assignedGroup: { $in: groupIds },        // Assigned to user's groups
            assignedMembers: req.user.id             // 🆕 AND user is in assignedMembers
          }
        ];
      } else {
        // Not in any group - see only directly assigned leads
        query.owner = req.user.id;
      }
    }

    // 🆕 Unassigned filter
    if (unassigned === 'true') {
      query.owner = null;
      query.assignedGroup = null;
    }

    // 🆕 Group filter
    if (assignedGroup) {
      if (assignedGroup === 'null' || assignedGroup === 'unassigned') {
        query.assignedGroup = null;
      } else {
        query.assignedGroup = assignedGroup;
      }
    }

    // Existing filters
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (leadStatus) query.leadStatus = leadStatus;
    if (leadSource) query.leadSource = leadSource;
    if (rating) query.rating = rating;
    if (owner) query.owner = owner;
    if (product) query.product = product;

    const total = await Lead.countDocuments(query);

    const leads = await Lead.find(query)
      .populate('owner', 'firstName lastName email')
      .populate('assignedGroup', 'name category') // 🆕 Populate group
      .populate('tenant', 'organizationName')
      .populate('product', 'name articleNumber')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .lean();

    successResponse(res, 200, 'Leads retrieved successfully', {
      leads,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get leads error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get single lead
 * @route   GET /api/leads/:id
 * @access  Private
 */
const getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('owner', 'firstName lastName email')
      .populate('tenant', 'organizationName')
      .populate('product', 'name articleNumber category price')
      .populate('convertedAccount', 'accountName accountType')
      .populate('convertedContact', 'firstName lastName email')
      .populate('convertedOpportunity', 'opportunityName amount stage');

    if (!lead) {
      return errorResponse(res, 404, 'Lead not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (lead.tenant._id.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    successResponse(res, 200, 'Lead retrieved successfully', lead);
  } catch (error) {
    console.error('Get lead error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get lead statistics
 * @route   GET /api/leads/stats
 * @access  Private
 */
const getLeadStats = async (req, res) => {
  try {
    let query = { isActive: true };

    // Tenant filtering
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      query.tenant = req.user.tenant;
    } else if (req.query.tenant) {
      query.tenant = req.query.tenant;
    }

    // Total leads
    const totalLeads = await Lead.countDocuments(query);

    // Leads by status
    const leadsByStatus = await Lead.aggregate([
      { $match: query },
      { $group: { _id: '$leadStatus', count: { $sum: 1 } } }
    ]);

    // Leads by source
    const leadsBySource = await Lead.aggregate([
      { $match: query },
      { $group: { _id: '$leadSource', count: { $sum: 1 } } }
    ]);

    // Leads by rating
    const leadsByRating = await Lead.aggregate([
      { $match: query },
      { $group: { _id: '$rating', count: { $sum: 1 } } }
    ]);

    // New leads this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const newLeadsThisMonth = await Lead.countDocuments({
      ...query,
      createdAt: { $gte: startOfMonth }
    });

    // Converted leads
    const convertedLeads = await Lead.countDocuments({
      ...query,
      isConverted: true
    });

    // Conversion rate
    const conversionRate = totalLeads > 0 
      ? parseFloat(((convertedLeads / totalLeads) * 100).toFixed(2)) 
      : 0;

    // Recent leads
    const recentLeads = await Lead.find(query)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('owner', 'firstName lastName')
      .select('firstName lastName email company leadStatus createdAt');

    successResponse(res, 200, 'Lead statistics retrieved successfully', {
      total: totalLeads,
      newThisMonth: newLeadsThisMonth,
      convertedLeads,
      conversionRate,
      byStatusDetailed: leadsByStatus,
      leadsByStatus: leadsByStatus.reduce((acc, item) => {
        acc[item._id || 'Unknown'] = item.count;
        return acc;
      }, {}),
      leadsBySource: leadsBySource.reduce((acc, item) => {
        acc[item._id || 'Unknown'] = item.count;
        return acc;
      }, {}),
      leadsByRating: leadsByRating.reduce((acc, item) => {
        acc[item._id || 'Unknown'] = item.count;
        return acc;
      }, {}),
      recentLeads
    });

  } catch (error) {
    console.error('Get lead stats error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Create new lead
 * @route   POST /api/leads
 * @access  Private
 */
const createLead = async (req, res) => {
  try {
    console.log('=== CREATE LEAD START ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    // 🔥 Extract system fields that need special handling
    const { product, productDetails, tenant: bodyTenant, ...otherFields } = req.body;

    // Determine tenant
    let tenant;
    if (req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN') {
      tenant = bodyTenant;
      if (!tenant) {
        console.log('❌ Tenant missing for SAAS user');
        return errorResponse(res, 400, 'Tenant is required');
      }
    } else {
      tenant = req.user.tenant;
    }

    console.log('✅ Tenant:', tenant);
    console.log('User:', req.user._id, req.user.userType);

    // Check for duplicate email (flexible field name)
    const email = otherFields.email || otherFields.Email;
    if (email) {
      console.log('Checking duplicate email...');
      const existingLead = await Lead.findOne({
        $or: [
          { email },
          { Email: email }
        ],
        tenant,
        isActive: true,
        isConverted: false
      });

      if (existingLead) {
        console.log('❌ Duplicate email found:', existingLead._id);
        return errorResponse(res, 400, 'Lead with this email already exists');
      }
      console.log('✅ No duplicate email');
    }

    // Validate product if provided
    if (product) {
      console.log('=== PRODUCT VALIDATION START ===');
      console.log('Product ID:', product);

      const mongoose = require('mongoose');

      // Check ObjectId validity
      if (!mongoose.Types.ObjectId.isValid(product)) {
        console.log('❌ Invalid ObjectId format');
        return errorResponse(res, 400, 'Invalid product ID format');
      }
      console.log('✅ Valid ObjectId format');

      const ProductItem = require('../models/ProductItem');

      console.log('Searching for product with tenant:', tenant);
      const productExists = await ProductItem.findOne({
        _id: product,
        isActive: true
      });

      console.log('Product search result:', productExists);

      if (!productExists) {
        console.log('❌ Product not found or inactive');
        return errorResponse(res, 400, 'Product not found or is not active');
      }

      // Check if product belongs to tenant
      if (productExists.tenant.toString() !== tenant.toString()) {
        console.log('❌ Product tenant mismatch');
        return errorResponse(res, 400, 'Product does not belong to your organization');
      }

      console.log('✅ Product validation passed');
    }

    // Prepare product details
    let productDetailsToSave = undefined;
    if (product && productDetails) {
      console.log('=== PREPARING PRODUCT DETAILS ===');
      productDetailsToSave = {
        quantity: productDetails.quantity || 1,
        requirements: productDetails.requirements || '',
        estimatedBudget: productDetails.estimatedBudget ? Number(productDetails.estimatedBudget) : undefined,
        priority: productDetails.priority || '',
        notes: productDetails.notes || '',
        linkedDate: new Date()
      };
      console.log('Product details:', productDetailsToSave);
    }

    console.log('=== CREATING LEAD ===');

    // 🔥 Create lead with ALL fields directly at root level + system fields
    const leadData = {
      ...otherFields,  // All form fields go directly to root
      product: product || undefined,
      productDetails: productDetailsToSave,
      leadStatus: otherFields.leadStatus || 'New',
      owner: req.body.owner || req.user._id,
      tenant,
      createdBy: req.user._id,
      lastModifiedBy: req.user._id
    };

    console.log('Lead data to create:', JSON.stringify(leadData, null, 2));

    const lead = await Lead.create(leadData);

    console.log('✅ Lead created successfully:', lead._id);

    // Populate fields
    await lead.populate('owner', 'firstName lastName email');
    if (product) {
      await lead.populate('product', 'name articleNumber category price');
    }

    // 🔥 Get lead name flexibly (handles different field name variations)
    const getLeadName = (lead) => {
      if (lead.name || lead.Name) return lead.name || lead.Name;
      const firstName = lead.firstName || lead.FirstName || '';
      const lastName = lead.lastName || lead.LastName || '';
      return `${firstName} ${lastName}`.trim() || 'Unknown';
    };

    const leadName = getLeadName(lead);
    const leadEmail = lead.email || lead.Email;
    const leadCompany = lead.company || lead.Company;

    // Log activity
    await logActivity(req, 'lead.created', 'Lead', lead._id, {
      name: leadName,
      email: leadEmail,
      company: leadCompany,
      product: product ? 'Product linked' : 'No product'
    });

    // Send email notification if lead is assigned to someone other than creator
    if (lead.owner && lead.owner.toString() !== req.user._id.toString()) {
      try {
        const ownerUser = await mongoose.model('User').findById(lead.owner);
        const creator = await mongoose.model('User').findById(req.user._id);

        if (ownerUser && creator) {
          await sendLeadAssignmentEmail(
            ownerUser.email,
            `${ownerUser.firstName} ${ownerUser.lastName}`,
            {
              id: lead._id,
              name: leadName,
              company: leadCompany,
              email: leadEmail,
              phone: lead.phone || lead.Phone || lead.mobile || lead.Mobile,
              jobTitle: lead.jobTitle || lead.JobTitle || lead.designation || lead.Designation,
              leadSource: lead.source || 'Unknown',
              leadStatus: lead.leadStatus || 'New',
              rating: lead.rating || 'Warm'
            },
            `${creator.firstName} ${creator.lastName}`
          );
          console.log(`✅ Lead assignment email sent to ${ownerUser.email}`);
        }
      } catch (emailError) {
        console.error('❌ Failed to send lead assignment email:', emailError.message);
        // Don't fail the lead creation if email fails
      }
    }

    console.log('=== CREATE LEAD SUCCESS ===');

    successResponse(res, 201, 'Lead created successfully', lead);

  } catch (error) {
    console.error('=== CREATE LEAD ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', error.errors);
      const messages = Object.values(error.errors).map(err => err.message);
      return errorResponse(res, 400, `Validation failed: ${messages.join(', ')}`);
    }
    
    if (error.name === 'CastError') {
      console.error('Cast error:', error);
      return errorResponse(res, 400, `Invalid ${error.path}: ${error.value}`);
    }

    errorResponse(res, 500, error.message || 'Server error');
  }
};

/**
 * @desc    Update lead
 * @route   PUT /api/leads/:id
 * @access  Private
 */
const updateLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return errorResponse(res, 404, 'Lead not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (lead.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    // Validate product if provided
    if (req.body.product) {
      const ProductItem = require('../models/ProductItem');
      const productExists = await ProductItem.findOne({
        _id: req.body.product,
        tenant: lead.tenant,
        isActive: true
      });

      if (!productExists) {
        return errorResponse(res, 400, 'Invalid product or product does not belong to your tenant');
      }
    }

    // Validate and prepare custom fields if provided
    let validatedCustomFields = null;
    if (req.body.customFields !== undefined) {
      if (req.body.customFields && Object.keys(req.body.customFields).length > 0) {
        const validation = await FieldDefinition.validateCustomFields(lead.tenant, 'Lead', req.body.customFields);

        if (!validation.valid) {
          return errorResponse(res, 400, 'Custom field validation failed', validation.errors);
        }

        validatedCustomFields = validation.validatedData;
      } else {
        validatedCustomFields = {}; // Clear custom fields if empty object sent
      }
    }

    // Fields to track
    const allowedFields = [
      'firstName', 'lastName', 'email', 'phone', 'mobilePhone', 'fax',
      'company', 'jobTitle', 'website', 'leadSource', 'leadStatus',
      'industry', 'numberOfEmployees', 'annualRevenue', 'rating',
      'emailOptOut', 'doNotCall', 'skypeId', 'secondaryEmail', 'twitter',
      'linkedIn', 'street', 'city', 'state', 'country', 'zipCode',
      'flatHouseNo', 'latitude', 'longitude', 'description', 'tags', 'product'
    ];

    // Track changes BEFORE updating
    const changes = trackChanges(lead, req.body, allowedFields);

    // Update fields
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        lead[field] = req.body[field];
      }
    });

    // Handle product details update
    if (req.body.productDetails) {
      if (lead.product) {
        // Update existing product details
        lead.productDetails = {
          quantity: req.body.productDetails.quantity || lead.productDetails?.quantity || 1,
          requirements: req.body.productDetails.requirements || lead.productDetails?.requirements || '',
          estimatedBudget: req.body.productDetails.estimatedBudget || lead.productDetails?.estimatedBudget || undefined,
          priority: req.body.productDetails.priority || lead.productDetails?.priority || '',
          notes: req.body.productDetails.notes || lead.productDetails?.notes || '',
          linkedDate: lead.productDetails?.linkedDate || new Date()
        };
      }
    } else if (req.body.product && !lead.product) {
      // New product added, initialize product details
      lead.productDetails = {
        quantity: 1,
        linkedDate: new Date()
      };
    } else if (!req.body.product && req.body.product === null) {
      // Product removed
      lead.productDetails = undefined;
    }

    // Handle owner separately
    if (req.body.owner && req.body.owner !== lead.owner.toString()) {
      changes.owner = {
        old: lead.owner.toString(),
        new: req.body.owner
      };
      lead.owner = req.body.owner;
    }

    // Update custom fields if validated
    if (validatedCustomFields !== null) {
      lead.customFields = validatedCustomFields;
    }

    lead.lastModifiedBy = req.user._id;
    await lead.save();
    await lead.populate('owner', 'firstName lastName email');
    if (lead.product) {
      await lead.populate('product', 'name articleNumber category price');
    }

    // Log activity with changes
    if (Object.keys(changes).length > 0) {
      await logActivity(req, 'lead.updated', 'Lead', lead._id, {
        targetUser: `${lead.firstName || ''} ${lead.lastName || ''} (${lead.email || 'No Email'})`.trim(),
        changedBy: `${req.user.firstName} ${req.user.lastName} - ${req.user.userType || 'User'} (${req.user.email})`,
        recordName: getRecordName(lead, 'Lead'),
        changes: changes,
        fieldsChanged: Object.keys(changes)
      });
    }

    // Send email notification if owner changed
    if (changes.owner) {
      try {
        const newOwner = await mongoose.model('User').findById(changes.owner.new);
        const updatedBy = await mongoose.model('User').findById(req.user._id);

        if (newOwner && updatedBy && newOwner._id.toString() !== req.user._id.toString()) {
          await sendLeadAssignmentEmail(
            newOwner.email,
            `${newOwner.firstName} ${newOwner.lastName}`,
            {
              id: lead._id,
              name: `${lead.firstName} ${lead.lastName}`,
              company: lead.company,
              email: lead.email,
              phone: lead.phone || lead.mobilePhone,
              jobTitle: lead.jobTitle,
              leadSource: lead.leadSource,
              leadStatus: lead.leadStatus,
              rating: lead.rating
            },
            `${updatedBy.firstName} ${updatedBy.lastName}`
          );
          console.log(`✅ Lead reassignment email sent to ${newOwner.email}`);
        }
      } catch (emailError) {
        console.error('❌ Failed to send lead reassignment email:', emailError.message);
        // Don't fail the update if email fails
      }
    }

    successResponse(res, 200, 'Lead updated successfully', lead);
  } catch (error) {
    console.error('Update lead error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Delete lead (soft delete)
 * @route   DELETE /api/leads/:id
 * @access  Private
 */
const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return errorResponse(res, 404, 'Lead not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (lead.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    // Soft delete
    lead.isActive = false;
    lead.lastModifiedBy = req.user._id;
    await lead.save();

    await logActivity(req, 'lead.deleted', 'Lead', lead._id, {
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email
    });

    successResponse(res, 200, 'Lead deleted successfully');
  } catch (error) {
    console.error('Delete lead error:', error);
    errorResponse(res, 500, 'Server error');
  }
};


/**
 * @desc    Convert lead to account/contact/opportunity
 * @route   POST /api/leads/:id/convert
 * @access  Private
 */
const convertLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return errorResponse(res, 404, 'Lead not found');
    }

    if (lead.isConverted) {
      return errorResponse(res, 400, 'Lead is already converted');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (lead.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    const {
      createAccount,
      createContact,
      createOpportunity,
      accountData,
      contactData,
      opportunityData
    } = req.body;

    let account = null;
    let contact = null;
    let opportunity = null;

    // Industry mapping for enum compatibility
    const industryMap = {
      'IT': 'IT',
      'Information Technology': 'Technology',
      'Tech': 'Technology',
      'Software': 'Technology',
      'Telecom': 'Telecommunications',
      'Food': 'Food & Beverage',
      'Medical': 'Healthcare',
      'Non-Profit': 'Not For Profit'
    };

    // Create Account
    if (createAccount && accountData) {
      // Map industry if provided
      if (accountData.industry && industryMap[accountData.industry]) {
        accountData.industry = industryMap[accountData.industry];
      }

      account = await Account.create({
        ...accountData,
        owner: req.user._id,
        tenant: lead.tenant,
        createdBy: req.user._id,
        lastModifiedBy: req.user._id
      });
      lead.convertedAccount = account._id;
    }

    // Create Contact
    if (createContact && contactData) {
      contact = await Contact.create({
        ...contactData,
        account: account ? account._id : null,
        owner: req.user._id,
        tenant: lead.tenant,
        createdBy: req.user._id,
        lastModifiedBy: req.user._id
      });
      lead.convertedContact = contact._id;
    }

    // Create Opportunity
    if (createOpportunity && opportunityData) {
      const defaultCloseDate = new Date();
      defaultCloseDate.setDate(defaultCloseDate.getDate() + 30); // 30 days from now

      opportunity = await Opportunity.create({
        ...opportunityData,
        closeDate: opportunityData.closeDate || defaultCloseDate,
        account: account ? account._id : (opportunityData.account || null),
        contact: contact ? contact._id : null,
        lead: lead._id,
        owner: req.user._id,
        tenant: lead.tenant,
        createdBy: req.user._id,
        lastModifiedBy: req.user._id
      });
      lead.convertedOpportunity = opportunity._id;
    }

    // Mark lead as converted
    lead.isConverted = true;
    lead.convertedDate = new Date();
    lead.lastModifiedBy = req.user._id;
    await lead.save();

    await logActivity(req, 'lead.converted', 'Lead', lead._id, {
      accountCreated: !!account,
      contactCreated: !!contact,
      opportunityCreated: !!opportunity
    });

    successResponse(res, 200, 'Lead converted successfully', {
      lead,
      account,
      contact,
      opportunity
    });
  } catch (error) {
    console.error('Convert lead error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    errorResponse(res, 500, error.message || 'Server error');
  }
};

/**
 * @desc    Bulk import leads from CSV
 * @route   POST /api/leads/bulk-import
 * @access  Private
 */
const bulkImportLeads = async (req, res) => {
  try {
    const { leads } = req.body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return errorResponse(res, 400, 'Please provide an array of leads');
    }

    // Determine tenant
    let tenant;
    if (req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN') {
      tenant = req.body.tenant;
      if (!tenant) {
        return errorResponse(res, 400, 'Tenant is required');
      }
    } else {
      tenant = req.user.tenant;
    }

    const results = {
      success: [],
      failed: []
    };

    for (const leadData of leads) {
      try {
        const lead = await Lead.create({
          ...leadData,
          owner: null, // 🔧 Keep UNASSIGNED on bulk import
          tenant,
          createdBy: req.user._id,
          lastModifiedBy: req.user._id
        });
        results.success.push(lead);
      } catch (error) {
        results.failed.push({
          data: leadData,
          error: error.message
        });
      }
    }

    await logActivity(req, 'leads.bulk_import', 'Lead', null, {
      total: leads.length,
      success: results.success.length,
      failed: results.failed.length
    });

    successResponse(res, 201, 'Bulk import completed', results);
  } catch (error) {
    console.error('Bulk import error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Bulk upload leads from Excel/CSV file
 * @route   POST /api/leads/bulk-upload
 * @access  Private
 */
const bulkUploadLeads = async (req, res) => {
  const xlsx = require('xlsx');
  const fs = require('fs');

  try {
    if (!req.file) {
      return errorResponse(res, 400, 'Please upload a file');
    }

    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    let leadsData = [];
    const errors = [];

    // Read Excel/CSV file
    if (fileExtension === 'xlsx' || fileExtension === 'xls' || fileExtension === 'csv') {
      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      leadsData = xlsx.utils.sheet_to_json(worksheet);
    } else {
      fs.unlinkSync(req.file.path);
      return errorResponse(res, 400, 'Invalid file format. Please upload Excel (.xlsx, .xls) or CSV file');
    }

    // Determine tenant
    let tenant;
    if (req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN') {
      tenant = req.body.tenant;
      if (!tenant) {
        fs.unlinkSync(req.file.path);
        return errorResponse(res, 400, 'Tenant is required');
      }
    } else {
      tenant = req.user.tenant;
    }

    // 🆕 Load field definitions for mapping custom fields
    const fieldDefinitions = await FieldDefinition.find({
      tenant,
      entityType: 'Lead',
      isActive: true
    });

    console.log(`📤 Processing bulk upload with ${fieldDefinitions.length} field definitions`);

    const createdLeads = [];

    // Process each lead
    for (let i = 0; i < leadsData.length; i++) {
      const row = leadsData[i];

      try {
        // 🆕 Build leadData dynamically from field definitions
        const leadData = {
          tenant,
          owner: null, // 🔧 Keep UNASSIGNED on bulk upload
          createdBy: req.user._id,
          lastModifiedBy: req.user._id
        };

        const customFields = {};

        // Helper function to find value in row with case-insensitive matching
        const findValueInRow = (row, field) => {
          // Direct matches
          if (row[field.label] !== undefined) return row[field.label];
          if (row[field.fieldName] !== undefined) return row[field.fieldName];

          // Case-insensitive search
          const lowerLabel = field.label.toLowerCase();
          const lowerFieldName = field.fieldName.toLowerCase();

          for (const key of Object.keys(row)) {
            const lowerKey = key.toLowerCase().trim();
            if (lowerKey === lowerLabel || lowerKey === lowerFieldName) {
              return row[key];
            }
            // Also check without spaces (e.g., "firstname" matches "First Name")
            if (lowerKey.replace(/\s+/g, '') === lowerLabel.replace(/\s+/g, '')) {
              return row[key];
            }
            if (lowerKey.replace(/\s+/g, '') === lowerFieldName.replace(/\s+/g, '')) {
              return row[key];
            }
          }

          // Try camelCase to space conversion
          const spacedFieldName = field.fieldName.replace(/([A-Z])/g, ' $1').trim();
          if (row[spacedFieldName] !== undefined) return row[spacedFieldName];

          return undefined;
        };

        // Process each field definition
        fieldDefinitions.forEach(field => {
          // Try to get value from CSV using flexible matching
          const value = findValueInRow(row, field);

          if (value !== undefined && value !== null && value !== '') {
            // Convert value based on field type
            let processedValue = value;

            switch (field.fieldType) {
              case 'number':
              case 'currency':
              case 'percentage':
                processedValue = parseFloat(value) || 0;
                break;

              case 'checkbox':
                processedValue = value === 'Yes' || value === 'yes' || value === 'true' || value === '1' || value === true;
                break;

              case 'multi_select':
                if (typeof value === 'string') {
                  processedValue = value.split(',').map(v => v.trim());
                }
                break;

              case 'date':
              case 'datetime':
                processedValue = new Date(value);
                break;

              default:
                processedValue = String(value).trim();
            }

            // Store in appropriate location
            if (field.isStandardField) {
              leadData[field.fieldName] = processedValue;
            } else {
              customFields[field.fieldName] = processedValue;
            }
          } else if (field.defaultValue !== null && field.defaultValue !== undefined) {
            // Use default value if no value provided
            if (field.isStandardField) {
              leadData[field.fieldName] = field.defaultValue;
            } else {
              customFields[field.fieldName] = field.defaultValue;
            }
          }
        });

        // Add customFields to leadData if any exist
        if (Object.keys(customFields).length > 0) {
          leadData.customFields = customFields;
        }

        // Validate - at least one identifying field required
        if (!leadData.firstName && !leadData.lastName && !leadData.email && !leadData.company) {
          errors.push({
            row: i + 2,
            error: 'At least one of First Name, Last Name, Email, or Company is required'
          });
          continue;
        }

        // Check for duplicate email if email provided
        if (leadData.email) {
          const existingLead = await Lead.findOne({ 
            email: leadData.email, 
            tenant,
            isActive: true,
            isConverted: false
          });

          if (existingLead) {
            errors.push({
              row: i + 2,
              email: leadData.email,
              error: 'Email already exists'
            });
            continue;
          }
        }

        // Create lead
        const lead = await Lead.create(leadData);
        createdLeads.push(lead);

      } catch (error) {
        errors.push({
          row: i + 2,
          error: error.message
        });
      }
    }

    // Delete uploaded file
    fs.unlinkSync(req.file.path);

    // Log activity
    await logActivity(req, 'leads.bulk_upload', 'Lead', null, {
      totalRows: leadsData.length,
      successCount: createdLeads.length,
      errorCount: errors.length
    });

    successResponse(res, 200, `Successfully uploaded ${createdLeads.length} leads`, {
      totalRows: leadsData.length,
      successCount: createdLeads.length,
      errorCount: errors.length,
      errors: errors.slice(0, 20), // Return first 20 errors
      leads: createdLeads
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    
    // Delete uploaded file if exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    errorResponse(res, 500, 'Failed to upload leads: ' + error.message);
  }
};

/**
 * @desc    Download sample template for bulk upload (Dynamic - includes custom fields)
 * @route   GET /api/leads/download-template
 * @access  Private
 */
const downloadSampleTemplate = async (req, res) => {
  const xlsx = require('xlsx');

  try {
    // Determine tenant
    let tenant;
    if (req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN') {
      tenant = req.query.tenant || req.user.tenant;
    } else {
      tenant = req.user.tenant;
    }

    // 🆕 Get active field definitions for Lead entity
    const fieldDefinitions = await FieldDefinition.find({
      tenant,
      entityType: 'Lead',
      isActive: true,
      showInCreate: true
    }).sort({ displayOrder: 1 });

    console.log(`📥 Generating CSV template with ${fieldDefinitions.length} fields`);

    // 🆕 Build sample data dynamically based on field definitions
    const sampleRow1 = {};
    const sampleRow2 = {};

    fieldDefinitions.forEach(field => {
      const label = field.label;

      // Generate example values based on field type
      let example1, example2;

      switch (field.fieldType) {
        case 'text':
          example1 = field.fieldName === 'firstName' ? 'John' :
                     field.fieldName === 'lastName' ? 'Doe' :
                     field.fieldName === 'company' ? 'Tech Corp Pvt Ltd' :
                     field.fieldName === 'jobTitle' ? 'CEO' :
                     `Example ${field.label}`;
          example2 = field.fieldName === 'firstName' ? 'Jane' :
                     field.fieldName === 'lastName' ? 'Smith' :
                     field.fieldName === 'company' ? 'Business Solutions Ltd' :
                     field.fieldName === 'jobTitle' ? 'Sales Director' :
                     `Sample ${field.label}`;
          break;

        case 'email':
          example1 = 'john.doe@example.com';
          example2 = 'jane.smith@example.com';
          break;

        case 'phone':
          example1 = '+91-9876543210';
          example2 = '+91-9876543211';
          break;

        case 'url':
          example1 = field.fieldName === 'website' ? 'https://techcorp.com' : 'https://example.com';
          example2 = field.fieldName === 'website' ? 'https://businesssolutions.com' : 'https://example2.com';
          break;

        case 'number':
          example1 = field.fieldName === 'numberOfEmployees' ? '100' : '10';
          example2 = field.fieldName === 'numberOfEmployees' ? '50' : '20';
          break;

        case 'currency':
          example1 = field.fieldName === 'annualRevenue' ? '10000000' : '50000';
          example2 = field.fieldName === 'annualRevenue' ? '5000000' : '25000';
          break;

        case 'percentage':
          example1 = '75';
          example2 = '50';
          break;

        case 'date':
        case 'datetime':
          example1 = '2025-01-15';
          example2 = '2025-02-20';
          break;

        case 'checkbox':
          example1 = 'Yes';
          example2 = 'No';
          break;

        case 'dropdown':
        case 'radio':
          if (field.options && field.options.length > 0) {
            example1 = field.options[0].value;
            example2 = field.options.length > 1 ? field.options[1].value : field.options[0].value;
          } else {
            example1 = field.defaultValue || '';
            example2 = field.defaultValue || '';
          }
          break;

        case 'multi_select':
          if (field.options && field.options.length > 0) {
            example1 = field.options[0].value;
            example2 = field.options.slice(0, 2).map(opt => opt.value).join(', ');
          } else {
            example1 = '';
            example2 = '';
          }
          break;

        case 'textarea':
          example1 = field.fieldName === 'description' ? 'Potential enterprise client interested in CRM solutions' : `Detailed ${field.label}`;
          example2 = field.fieldName === 'description' ? 'Looking for marketing automation tools' : `Sample ${field.label}`;
          break;

        default:
          example1 = field.defaultValue || '';
          example2 = field.defaultValue || '';
      }

      sampleRow1[label] = example1;
      sampleRow2[label] = example2;
    });

    const sampleData = [sampleRow1, sampleRow2];

    const worksheet = xlsx.utils.json_to_sheet(sampleData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Leads Sample');

    // Set column widths
    const wscols = [
      { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 },
      { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 15 },
      { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 20 },
      { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 40 }
    ];
    worksheet['!cols'] = wscols;

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=leads_bulk_upload_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

  } catch (error) {
    console.error('Download template error:', error);
    errorResponse(res, 500, 'Failed to download template');
  }
};

/**
 * @desc    Assign leads to a group (with optional specific members)
 * @route   POST /api/leads/assign-to-group
 * @access  Private
 */
const assignLeadsToGroup = async (req, res) => {
  try {
    const { leadIds, groupId, memberIds } = req.body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return errorResponse(res, 400, 'Please provide lead IDs');
    }

    if (!groupId) {
      return errorResponse(res, 400, 'Please provide group ID');
    }

    const Group = require('../models/Group');

    // Verify group exists
    const group = await Group.findById(groupId).populate('members', 'firstName lastName email');
    if (!group) {
      return errorResponse(res, 404, 'Group not found');
    }

    // 🆕 If specific members provided, validate they belong to the group
    let validatedMemberIds = [];
    if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
      const groupMemberIds = group.members.map(m => m._id.toString());

      for (const memberId of memberIds) {
        if (!groupMemberIds.includes(memberId.toString())) {
          return errorResponse(res, 400, `Member ${memberId} does not belong to group ${group.name}`);
        }
      }
      validatedMemberIds = memberIds;
    } else {
      // If no specific members, assign to ALL group members
      validatedMemberIds = group.members.map(m => m._id);
    }

    // Update leads
    const results = {
      success: [],
      failed: []
    };

    for (const leadId of leadIds) {
      try {
        const lead = await Lead.findById(leadId);

        if (!lead) {
          results.failed.push({ leadId, error: 'Lead not found' });
          continue;
        }

        // Update lead with group and specific members
        lead.assignedGroup = groupId;
        lead.assignedMembers = validatedMemberIds; // 🆕 Set specific members
        lead.assignmentChain.push({
          assignedTo: groupId,
          assignedToModel: 'Group',
          assignedBy: req.user.id,
          assignedAt: new Date()
        });
        lead.lastModifiedBy = req.user.id;

        await lead.save();
        results.success.push(leadId);

        await logActivity(req, 'lead.updated', 'Lead', lead._id, {
          action: 'Assigned to group',
          groupId,
          groupName: group.name,
          assignedMembersCount: validatedMemberIds.length
        });
      } catch (error) {
        results.failed.push({ leadId, error: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `${results.success.length} leads assigned to ${validatedMemberIds.length} member(s) successfully`,
      data: results
    });
  } catch (error) {
    console.error('Error assigning leads to group:', error);
    return errorResponse(res, 500, 'Error assigning leads to group');
  }
};

/**
 * @desc    Assign lead to user (within group hierarchy)
 * @route   POST /api/leads/:id/assign
 * @access  Private
 */
const assignLeadToUser = async (req, res) => {
  try {
    const { userId, role } = req.body;

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return errorResponse(res, 404, 'Lead not found');
    }

    const User = require('../models/User');
    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Update lead owner
    lead.owner = userId;
    lead.assignmentChain.push({
      assignedTo: userId,
      assignedToModel: 'User',
      assignedBy: req.user.id,
      assignedAt: new Date(),
      role: role || 'member'
    });
    lead.lastModifiedBy = req.user.id;

    await lead.save();

    // Send email notification to assigned user
    try {
      const assignedBy = await mongoose.model('User').findById(req.user.id);
      await sendLeadAssignmentEmail(
        user.email,
        `${user.firstName} ${user.lastName}`,
        {
          id: lead._id,
          name: `${lead.firstName} ${lead.lastName}`,
          company: lead.company,
          email: lead.email,
          phone: lead.phone || lead.mobilePhone,
          jobTitle: lead.jobTitle,
          leadSource: lead.leadSource,
          leadStatus: lead.leadStatus,
          rating: lead.rating
        },
        `${assignedBy.firstName} ${assignedBy.lastName}`
      );
      console.log(`✅ Lead assignment email sent to ${user.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send lead assignment email:', emailError.message);
      // Don't fail the assignment if email fails
    }

    await logActivity(req, 'lead.updated', 'Lead', lead._id, {
      action: 'Assigned to user',
      userId,
      userName: user.name,
      role
    });

    res.status(200).json({
      success: true,
      message: 'Lead assigned successfully',
      data: lead
    });
  } catch (error) {
    console.error('Error assigning lead to user:', error);
    return errorResponse(res, 500, 'Error assigning lead to user');
  }
};

module.exports = {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  convertLead,
  bulkImportLeads,
  bulkUploadLeads,
  downloadSampleTemplate,
  getLeadStats,
  assignLeadsToGroup,
  assignLeadToUser
};