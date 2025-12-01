const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const Account = require('../models/Account');
const Contact = require('../models/Contact');
const Opportunity = require('../models/Opportunity');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');
const { trackChanges, getRecordName } = require('../utils/changeTracker');

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
      owner
    } = req.query;

    let query = { 
      isActive: true,
    
    };

    // Tenant filtering
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      query.tenant = req.user.tenant;
    }

    // Filters
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

    console.log('Lead query:', query);

    const total = await Lead.countDocuments(query);
    console.log('Total leads found:', total);

    const leads = await Lead.find(query)
      .populate('owner', 'firstName lastName email')
      .populate('tenant', 'organizationName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .lean();

    console.log('Leads retrieved:', leads.length);

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
    const {
      firstName,
      lastName,
      email,
      phone,
      mobilePhone,
      fax,
      company,
      jobTitle,
      website,
      leadSource,
      leadStatus,
      industry,
      numberOfEmployees,
      annualRevenue,
      rating,
      emailOptOut,
      doNotCall,
      skypeId,
      secondaryEmail,
      twitter,
      linkedIn,
      street,
      city,
      state,
      country,
      zipCode,
      flatHouseNo,
      latitude,
      longitude,
      description
    } = req.body;

    console.log('Create lead request body:', req.body);

    // Basic validation - at least one identifying field required
    if (!firstName && !lastName && !email && !company) {
      return errorResponse(res, 400, 'Please provide at least one of: First Name, Last Name, Email, or Company');
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

    // Check for duplicate email in same tenant (if email provided)
    if (email) {
      const existingLead = await Lead.findOne({ 
        email, 
        tenant, 
        isActive: true,
        isConverted: false
      });
      
      if (existingLead) {
        return errorResponse(res, 400, 'Lead with this email already exists');
      }
    }

    // Create lead
    const lead = await Lead.create({
      firstName: firstName || '',
      lastName: lastName || '',
      email: email || '',
      phone,
      mobilePhone,
      fax,
      company,
      jobTitle,
      website,
      leadSource,
      leadStatus: leadStatus || 'New',
      industry,
      numberOfEmployees,
      annualRevenue,
      rating,
      emailOptOut: emailOptOut || false,
      doNotCall: doNotCall || false,
      skypeId,
      secondaryEmail,
      twitter,
      linkedIn,
      street,
      city,
      state,
      country,
      zipCode,
      flatHouseNo,
      latitude,
      longitude,
      description,
      owner: req.body.owner || req.user._id,
      tenant,
      createdBy: req.user._id,
      lastModifiedBy: req.user._id
    });

    await lead.populate('owner', 'firstName lastName email');

    await logActivity(req, 'lead.created', 'Lead', lead._id, {
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      company: lead.company
    });

    console.log('Lead created successfully:', lead._id);

    successResponse(res, 201, 'Lead created successfully', lead);
  } catch (error) {
    console.error('Create lead error:', error);
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

    // Fields to track
    const allowedFields = [
      'firstName', 'lastName', 'email', 'phone', 'mobilePhone', 'fax',
      'company', 'jobTitle', 'website', 'leadSource', 'leadStatus',
      'industry', 'numberOfEmployees', 'annualRevenue', 'rating',
      'emailOptOut', 'doNotCall', 'skypeId', 'secondaryEmail', 'twitter',
      'linkedIn', 'street', 'city', 'state', 'country', 'zipCode',
      'flatHouseNo', 'latitude', 'longitude', 'description', 'tags'
    ];

    // Track changes BEFORE updating
    const changes = trackChanges(lead, req.body, allowedFields);

    // Update fields
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        lead[field] = req.body[field];
      }
    });

    // Handle owner separately
    if (req.body.owner && req.body.owner !== lead.owner.toString()) {
      changes.owner = {
        old: lead.owner.toString(),
        new: req.body.owner
      };
      lead.owner = req.body.owner;
    }

    lead.lastModifiedBy = req.user._id;
    await lead.save();
    await lead.populate('owner', 'firstName lastName email');

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
      // ============================================
      // 🔧 FIX: Add default closeDate if not provided
      // ============================================
      const defaultCloseDate = new Date();
      defaultCloseDate.setDate(defaultCloseDate.getDate() + 30); // 30 days from now

      opportunity = await Opportunity.create({
        ...opportunityData,
        // 🔧 FIX: Ensure closeDate is always set
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
    errorResponse(res, 500, 'Server error');
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
          owner: req.user._id,
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

    const createdLeads = [];

    // Process each lead
    for (let i = 0; i < leadsData.length; i++) {
      const row = leadsData[i];
      
      try {
        // Map columns (flexible column naming)
        const leadData = {
          firstName: row['First Name'] || row['firstName'] || row['first_name'] || '',
          lastName: row['Last Name'] || row['lastName'] || row['last_name'] || '',
          email: row['Email'] || row['email'] || '',
          phone: row['Phone'] || row['phone'] || '',
          mobilePhone: row['Mobile'] || row['mobilePhone'] || row['mobile_phone'] || '',
          company: row['Company'] || row['company'] || '',
          jobTitle: row['Job Title'] || row['jobTitle'] || row['job_title'] || '',
          leadSource: row['Lead Source'] || row['leadSource'] || row['lead_source'] || 'Website',
          leadStatus: row['Lead Status'] || row['leadStatus'] || row['lead_status'] || 'New',
          rating: row['Rating'] || row['rating'] || 'Warm',
          industry: row['Industry'] || row['industry'] || '',
          website: row['Website'] || row['website'] || '',
          street: row['Street'] || row['street'] || '',
          city: row['City'] || row['city'] || '',
          state: row['State'] || row['state'] || '',
          country: row['Country'] || row['country'] || '',
          zipCode: row['Zip Code'] || row['zipCode'] || row['zip_code'] || '',
          description: row['Description'] || row['description'] || '',
          numberOfEmployees: row['No. of Employees'] || row['numberOfEmployees'] || '',
          annualRevenue: row['Annual Revenue'] || row['annualRevenue'] || '',
          tenant,
          owner: req.user._id,
          createdBy: req.user._id,
          lastModifiedBy: req.user._id
        };

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
 * @desc    Download sample template for bulk upload
 * @route   GET /api/leads/download-template
 * @access  Private
 */
const downloadSampleTemplate = async (req, res) => {
  const xlsx = require('xlsx');
  
  try {
    const sampleData = [
      {
        'First Name': 'John',
        'Last Name': 'Doe',
        'Email': 'john.doe@example.com',
        'Phone': '+91-9876543210',
        'Mobile': '+91-9876543210',
        'Company': 'Tech Corp Pvt Ltd',
        'Job Title': 'Chief Executive Officer',
        'Lead Source': 'Website',
        'Lead Status': 'New',
        'Rating': 'Hot',
        'Industry': 'Technology',
        'Website': 'https://techcorp.com',
        'Street': '123 Main Street, Sector 5',
        'City': 'Mumbai',
        'State': 'Maharashtra',
        'Country': 'India',
        'Zip Code': '400001',
        'No. of Employees': '100',
        'Annual Revenue': '10000000',
        'Description': 'Potential enterprise client interested in CRM solutions'
      },
      {
        'First Name': 'Jane',
        'Last Name': 'Smith',
        'Email': 'jane.smith@example.com',
        'Phone': '+91-9876543211',
        'Mobile': '+91-9876543211',
        'Company': 'Business Solutions Ltd',
        'Job Title': 'Sales Director',
        'Lead Source': 'Referral',
        'Lead Status': 'Contacted',
        'Rating': 'Warm',
        'Industry': 'Consulting',
        'Website': 'https://businesssolutions.com',
        'Street': '456 Park Avenue',
        'City': 'Delhi',
        'State': 'Delhi',
        'Country': 'India',
        'Zip Code': '110001',
        'No. of Employees': '50',
        'Annual Revenue': '5000000',
        'Description': 'Looking for marketing automation tools'
      }
    ];

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
  getLeadStats
};