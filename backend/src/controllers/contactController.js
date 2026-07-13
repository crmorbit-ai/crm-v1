const mongoose = require('mongoose');
const Contact = require('../models/Contact');
const Account = require('../models/Account');
const Opportunity = require('../models/Opportunity');
const Task = require('../models/Task');
const Tenant = require('../models/Tenant');
const FieldDefinition = require('../models/FieldDefinition');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');
const { trackChanges, getRecordName } = require('../utils/changeTracker');
const { createNotification } = require('../services/notificationService');

const getContacts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, account, title, isPrimary, hasAccount } = req.query;
    let query = { isActive: true };
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      query.tenant = req.user.tenant;

      // TENANT_USER and TENANT_MANAGER can only see contacts they own or created
      // TENANT_ADMIN sees all contacts in their tenant
      if (req.user.userType === 'TENANT_USER' || req.user.userType === 'TENANT_MANAGER') {
        query.$and = [
          { $or: [{ owner: req.user._id }, { createdBy: req.user._id }] }
        ];
      }
    }
    if (search) {
      const searchOr = [
        { firstName: { $regex: search, $options: 'i' }}, { lastName: { $regex: search, $options: 'i' }},
        { email: { $regex: search, $options: 'i' }}, { phone: { $regex: search, $options: 'i' }}
      ];
      if (query.$and) {
        query.$and.push({ $or: searchOr });
      } else {
        query.$or = searchOr;
      }
    }
    if (account) query.account = account;
    if (title) query.jobTitle = { $regex: title, $options: 'i' };
    if (isPrimary === 'true') query.isPrimary = true;
    if (hasAccount === 'true') query.account = { $ne: null };
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
      .populate('createdBy', 'firstName lastName email userType')
      .populate('lastModifiedBy', 'firstName lastName email')
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
      mailingStreet, mailingCity, mailingState, mailingCountry, mailingZipCode, description, customFields } = req.body;
    if (!firstName) return errorResponse(res, 400, 'Please provide Customer Name');

    // Phone validation - only allow digits and must be 10 digits if provided
    if (phone && !/^\d{10}$/.test(phone)) {
      return errorResponse(res, 400, 'Phone number must be exactly 10 digits');
    }
    if (mobile && !/^\d{10}$/.test(mobile)) {
      return errorResponse(res, 400, 'Mobile number must be exactly 10 digits');
    }
    let accountExists = null;
    if (account) {
      accountExists = await Account.findById(account);
      if (!accountExists) return errorResponse(res, 404, 'Account not found');
    }
    let tenant;
    if (req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN') {
      tenant = req.body.tenant;
      if (!tenant) return errorResponse(res, 400, 'Tenant is required');
    } else tenant = req.user.tenant;
    if (email && account) {
      const existingContact = await Contact.findOne({ email, account, isActive: true });
      if (existingContact) return errorResponse(res, 400, 'Contact with this email already exists for this account');
    }
    const contact = await Contact.create({
      firstName, lastName: lastName || '', email: email || '', phone, mobile, account: account || undefined, jobTitle: title, department, reportsTo: reportsTo || null, leadSource,
      isPrimary: isPrimary || false, doNotCall: doNotCall || false, emailOptOut: emailOptOut || false,
      mailingAddress: { street: mailingStreet, city: mailingCity, state: mailingState, country: mailingCountry, zipCode: mailingZipCode },
      description, customFields: customFields || {}, owner: req.body.owner || req.user._id, tenant, createdBy: req.user._id, lastModifiedBy: req.user._id
    });
    // Update tenant usage count
    await Tenant.findByIdAndUpdate(tenant, { $inc: { 'usage.contacts': 1 } });

    await contact.populate('account', 'accountName accountNumber');
    await contact.populate('owner', 'firstName lastName email');
    await logActivity(req, 'contact.created', 'Contact', contact._id, { firstName: contact.firstName, lastName: contact.lastName, email: contact.email });
    const creatorName = `${req.user.firstName} ${req.user.lastName}`;
    await createNotification({
      tenantId: tenant,
      userId: req.user._id,
      type: 'contact_created',
      title: 'New Contact Added',
      message: `${creatorName} added a new contact - "${contact.firstName} ${contact.lastName}"`,
      entityType: 'Contact',
      entityId: contact._id,
      createdBy: req.user._id
    });
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
      if (contact.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    // Phone validation - only allow digits and must be 10 digits if provided
    if (req.body.phone && req.body.phone !== '' && !/^\d{10}$/.test(req.body.phone)) {
      return errorResponse(res, 400, 'Phone number must be exactly 10 digits');
    }
    if (req.body.mobile && req.body.mobile !== '' && !/^\d{10}$/.test(req.body.mobile)) {
      return errorResponse(res, 400, 'Mobile number must be exactly 10 digits');
    }

    const fields = [
      'firstName', 'lastName', 'email', 'phone', 'mobile', 'title',
      'department', 'description', 'isPrimary', 'doNotCall', 'emailOptOut'
    ];

    // Track changes BEFORE updating
    const changes = trackChanges(contact, req.body, fields);

    // Update basic fields
    if (req.body.firstName) contact.firstName = req.body.firstName;
    if (req.body.lastName) contact.lastName = req.body.lastName;
    if (req.body.email) contact.email = req.body.email;
    if (req.body.phone !== undefined) contact.phone = req.body.phone;
    if (req.body.mobile !== undefined) contact.mobile = req.body.mobile;
    if (req.body.title !== undefined) contact.jobTitle = req.body.title;
    if (req.body.department !== undefined) contact.department = req.body.department;
    if (req.body.reportsTo !== undefined) contact.reportsTo = req.body.reportsTo;
    if (req.body.isPrimary !== undefined) contact.isPrimary = req.body.isPrimary;
    if (req.body.doNotCall !== undefined) contact.doNotCall = req.body.doNotCall;
    if (req.body.emailOptOut !== undefined) contact.emailOptOut = req.body.emailOptOut;
    if (req.body.description !== undefined) contact.description = req.body.description;
    
    // Address fields
    if (req.body.mailingStreet !== undefined) contact.mailingAddress.street = req.body.mailingStreet;
    if (req.body.mailingCity !== undefined) contact.mailingAddress.city = req.body.mailingCity;
    if (req.body.mailingState !== undefined) contact.mailingAddress.state = req.body.mailingState;
    if (req.body.mailingCountry !== undefined) contact.mailingAddress.country = req.body.mailingCountry;
    if (req.body.mailingZipCode !== undefined) contact.mailingAddress.zipCode = req.body.mailingZipCode;

    // Custom fields
    if (req.body.customFields !== undefined) {
      contact.customFields = { ...contact.customFields, ...req.body.customFields };
    }

    contact.lastModifiedBy = req.user._id;
    await contact.save();
    
    await contact.populate('account', 'accountName accountNumber');
    await contact.populate('owner', 'firstName lastName email');

    // Log with changes
    if (Object.keys(changes).length > 0) {
      await logActivity(req, 'contact.updated', 'Contact', contact._id, {
        targetUser: `${contact.firstName || ''} ${contact.lastName || ''} (${contact.email || 'No Email'})`.trim(),
        changedBy: `${req.user.firstName} ${req.user.lastName} - ${req.user.userType || 'User'} (${req.user.email})`,
        recordName: getRecordName(contact, 'Contact'),
        changes: changes,
        fieldsChanged: Object.keys(changes)
      });
    }

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

    // Update tenant usage count
    await Tenant.findByIdAndUpdate(contact.tenant, { $inc: { 'usage.contacts': -1 } });

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
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      query.tenant = req.user.tenant;

      // TENANT_USER and TENANT_MANAGER can only see their own contacts
      if (req.user.userType === 'TENANT_USER' || req.user.userType === 'TENANT_MANAGER') {
        query.$and = [
          { $or: [{ owner: req.user._id }, { createdBy: req.user._id }] }
        ];
      }
    }
    const total = await Contact.countDocuments(query);
    const primaryContacts = await Contact.countDocuments({ ...query, isPrimary: true });
    const withAccount = await Contact.countDocuments({ ...query, account: { $ne: null } });
    const byDepartment = await Contact.aggregate([
      { $match: { ...query, department: { $ne: null, $ne: '' } } },
      { $group: { _id: '$department', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 5 }
    ]);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newThisMonth = await Contact.countDocuments({ ...query, createdAt: { $gte: startOfMonth } });
    successResponse(res, 200, 'Statistics retrieved successfully', { total, primaryContacts, withAccount, newThisMonth, byDepartment });
  } catch (error) {
    console.error('Get contact stats error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Bulk upload contacts from Excel/CSV
 * @route   POST /api/contacts/bulk-upload
 * @access  Private
 */
const bulkUploadContacts = async (req, res) => {
  const xlsx = require('xlsx');
  const fs = require('fs');

  try {
    if (!req.file) {
      return errorResponse(res, 400, 'Please upload a file');
    }

    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    let contactsData = [];
    const errors = [];

    // Read Excel/CSV file
    if (fileExtension === 'xlsx' || fileExtension === 'xls' || fileExtension === 'csv') {
      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      contactsData = xlsx.utils.sheet_to_json(worksheet);
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

    // Load field definitions for mapping custom fields
    const fieldDefinitions = await FieldDefinition.find({
      tenant,
      entityType: 'Contact',
      isActive: true
    });

    const createdContacts = [];

    // Common column header → standard Contact field name mapping
    const STANDARD_FIELD_MAP = {
      'firstname':       'firstName',
      'first name':      'firstName',
      'customername':    'firstName',
      'customer name':   'firstName',
      'name':            'firstName',
      'lastname':        'lastName',
      'last name':       'lastName',
      'email':           'email',
      'emailaddress':    'email',
      'email address':   'email',
      'phone':           'phone',
      'mobile':          'mobile',
      'phonenumber':     'phone',
      'phone number':    'phone',
      'contact':         'phone',
      'account':         'account',
      'company':         'account',
      'title':           'title',
      'jobtitle':        'title',
      'designation':     'title',
      'department':      'department',
      'dept':            'department',
      'reportsto':       'reportsTo',
      'reports to':      'reportsTo',
      'leadsource':      'leadSource',
      'lead source':     'leadSource',
      'source':          'leadSource',
      'isprimary':       'isPrimary',
      'is primary':      'isPrimary',
      'primary':         'isPrimary',
      'donotcall':       'doNotCall',
      'do not call':     'doNotCall',
      'emailoptout':     'emailOptOut',
      'email opt out':   'emailOptOut',
      'description':     'description',
      'notes':           'description',
      'mailingstreet':   'mailingStreet',
      'mailing street':  'mailingStreet',
      'street':          'mailingStreet',
      'mailingcity':     'mailingCity',
      'mailing city':    'mailingCity',
      'city':            'mailingCity',
      'mailingstate':    'mailingState',
      'mailing state':   'mailingState',
      'state':           'mailingState',
      'mailingcountry':  'mailingCountry',
      'mailing country': 'mailingCountry',
      'country':         'mailingCountry',
      'mailingzipcode':  'mailingZipCode',
      'mailing zipcode': 'mailingZipCode',
      'mailing zip code':'mailingZipCode',
      'zipcode':         'mailingZipCode',
      'zip code':        'mailingZipCode',
      'postalcode':      'mailingZipCode',
      'postal code':     'mailingZipCode',
    };

    // Convert any column header to a safe camelCase key
    const toCamelKey = (str) =>
      str.trim()
        .replace(/[^a-zA-Z0-9\s_]/g, '')
        .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
        .replace(/^(.)/, c => c.toLowerCase())
        .replace(/\s+/g, '');

    // Process each contact
    for (let i = 0; i < contactsData.length; i++) {
      const row = contactsData[i];

      try {
        // Build contactData dynamically from field definitions
        const contactData = {
          tenant,
          owner: req.body.owner || req.user._id,
          createdBy: req.user._id,
          lastModifiedBy: req.user._id,
          mailingAddress: {}
        };

        const customFields = {};
        const mappedColKeys = new Set();

        // Helper function to find value in row with case-insensitive matching
        const findValueInRow = (row, field) => {
          if (row[field.label] !== undefined) return row[field.label];
          if (row[field.fieldName] !== undefined) return row[field.fieldName];

          const lowerLabel = field.label.toLowerCase();
          const lowerFieldName = field.fieldName.toLowerCase();

          for (const key of Object.keys(row)) {
            const lowerKey = key.toLowerCase().trim();
            if (lowerKey === lowerLabel || lowerKey === lowerFieldName) {
              mappedColKeys.add(key);
              return row[key];
            }
            if (lowerKey.replace(/\s+/g, '') === lowerLabel.replace(/\s+/g, '')) {
              mappedColKeys.add(key);
              return row[key];
            }
            if (lowerKey.replace(/\s+/g, '') === lowerFieldName.replace(/\s+/g, '')) {
              mappedColKeys.add(key);
              return row[key];
            }
          }

          const spacedFieldName = field.fieldName.replace(/([A-Z])/g, ' $1').trim();
          if (row[spacedFieldName] !== undefined) {
            mappedColKeys.add(spacedFieldName);
            return row[spacedFieldName];
          }

          return undefined;
        };

        // Process each field definition
        fieldDefinitions.forEach(field => {
          const value = findValueInRow(row, field);

          if (value !== undefined && value !== null && value !== '') {
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
                if (typeof value === 'string') processedValue = value.split(',').map(v => v.trim());
                break;
              case 'date':
              case 'datetime':
                processedValue = new Date(value);
                break;
              default:
                processedValue = String(value).trim();
            }

            if (field.isStandardField) {
              // Handle mailing address fields separately
              if (['mailingStreet', 'mailingCity', 'mailingState', 'mailingCountry', 'mailingZipCode'].includes(field.fieldName)) {
                const addressField = field.fieldName.replace('mailing', '').toLowerCase();
                contactData.mailingAddress[addressField] = processedValue;
              } else {
                contactData[field.fieldName] = processedValue;
              }
            } else {
              customFields[field.fieldName] = processedValue;
            }
          } else if (field.defaultValue !== null && field.defaultValue !== undefined) {
            if (field.isStandardField) {
              contactData[field.fieldName] = field.defaultValue;
            } else {
              customFields[field.fieldName] = field.defaultValue;
            }
          }
        });

        // Save ALL remaining columns not handled by FieldDefinitions
        for (const [colKey, colVal] of Object.entries(row)) {
          if (mappedColKeys.has(colKey)) continue;
          if (colVal === undefined || colVal === null || colVal === '') continue;

          const lk = colKey.toLowerCase().trim();

          // Map to standard field name if known
          if (STANDARD_FIELD_MAP[lk]) {
            const stdField = STANDARD_FIELD_MAP[lk];
            // Handle mailing address fields
            if (['mailingStreet', 'mailingCity', 'mailingState', 'mailingCountry', 'mailingZipCode'].includes(stdField)) {
              const addressField = stdField.replace('mailing', '').toLowerCase();
              if (!contactData.mailingAddress[addressField]) {
                contactData.mailingAddress[addressField] = colVal;
              }
            } else if (!contactData[stdField]) {
              contactData[stdField] = colVal;
            }
          } else {
            const camelKey = toCamelKey(colKey);
            if (camelKey && !contactData[camelKey]) contactData[camelKey] = colVal;
          }
        }

        // Add customFields to contactData if any exist
        if (Object.keys(customFields).length > 0) {
          contactData.customFields = customFields;
        }

        // Validate - firstName is required
        if (!contactData.firstName || String(contactData.firstName).trim() === '') {
          errors.push({
            row: i + 2,
            error: 'Customer Name (firstName) is required'
          });
          continue;
        }

        // Check for duplicate email if email and account provided
        if (contactData.email && contactData.account) {
          const existingContact = await Contact.findOne({
            email: contactData.email,
            account: contactData.account,
            tenant,
            isActive: true
          });

          if (existingContact) {
            errors.push({
              row: i + 2,
              email: contactData.email,
              error: 'Contact with this email already exists for this account'
            });
            continue;
          }
        }

        // Create contact
        const contact = await Contact.create(contactData);

        // Update tenant usage count
        await Tenant.findByIdAndUpdate(tenant, { $inc: { 'usage.contacts': 1 } });

        createdContacts.push(contact);

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
    await logActivity(req, 'contacts.bulk_upload', 'Contact', null, {
      totalRows: contactsData.length,
      successCount: createdContacts.length,
      errorCount: errors.length
    });

    successResponse(res, 200, `Successfully uploaded ${createdContacts.length} contacts`, {
      totalRows: contactsData.length,
      successCount: createdContacts.length,
      errorCount: errors.length,
      errors: errors.slice(0, 20),
      contacts: createdContacts
    });

  } catch (error) {
    console.error('Bulk upload error:', error);

    // Delete uploaded file if exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Download contact template
 * @route   GET /api/contacts/download-template
 * @access  Private
 */
const downloadContactTemplate = async (req, res) => {
  const xlsx = require('xlsx');

  try {
    // Determine tenant
    let tenant;
    if (req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN') {
      tenant = req.query.tenant || req.user.tenant;
    } else {
      tenant = req.user.tenant;
    }

    // Get active field definitions for Contact entity
    const fieldDefinitions = await FieldDefinition.find({
      tenant,
      entityType: 'Contact',
      isActive: true,
      showInCreate: true
    }).sort({ displayOrder: 1 });

    // Build sample data dynamically based on field definitions
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
                     field.fieldName === 'title' ? 'Sales Manager' :
                     field.fieldName === 'department' ? 'Sales' :
                     `Example ${field.label}`;
          example2 = field.fieldName === 'firstName' ? 'Jane' :
                     field.fieldName === 'lastName' ? 'Smith' :
                     field.fieldName === 'title' ? 'Marketing Director' :
                     field.fieldName === 'department' ? 'Marketing' :
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
          example1 = 'https://example.com';
          example2 = 'https://example2.com';
          break;

        case 'number':
          example1 = '10';
          example2 = '20';
          break;

        case 'currency':
          example1 = '50000';
          example2 = '75000';
          break;

        case 'percentage':
          example1 = '75';
          example2 = '85';
          break;

        case 'date':
        case 'datetime':
          example1 = '2025-01-15';
          example2 = '2025-02-20';
          break;

        case 'checkbox':
          example1 = field.fieldName === 'isPrimary' ? 'Yes' : 'No';
          example2 = field.fieldName === 'isPrimary' ? 'No' : 'Yes';
          break;

        case 'picklist':
        case 'select':
          if (field.picklistValues && field.picklistValues.length > 0) {
            example1 = field.picklistValues[0];
            example2 = field.picklistValues[1] || field.picklistValues[0];
          } else {
            example1 = 'Option 1';
            example2 = 'Option 2';
          }
          break;

        case 'multi_select':
          if (field.picklistValues && field.picklistValues.length > 0) {
            example1 = field.picklistValues.slice(0, 2).join(', ');
            example2 = field.picklistValues.slice(1, 3).join(', ');
          } else {
            example1 = 'Option1, Option2';
            example2 = 'Option2, Option3';
          }
          break;

        default:
          example1 = `Example ${field.label}`;
          example2 = `Sample ${field.label}`;
      }

      sampleRow1[label] = example1;
      sampleRow2[label] = example2;
    });

    const data = [sampleRow1, sampleRow2];
    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Contacts');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=contacts_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

  } catch (error) {
    console.error('Download template error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

module.exports = {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  getContactStats,
  bulkUploadContacts,
  downloadContactTemplate
};