const { getDataCenterConnection } = require('../config/database');
const Lead = require('../models/Lead');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');

// Get Data Center model dynamically
const getDataCenterModel = () => {
  const connection = getDataCenterConnection();
  if (!connection) {
    throw new Error('Data Center database not connected');
  }
  return connection.model('DataCenterCandidate');
};

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.csv' && ext !== '.xlsx' && ext !== '.xls') {
      return cb(new Error('Only CSV and Excel files are allowed'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
}).single('file');

/**
 * @desc    Get all candidates from Data Center
 * @route   GET /api/data-center
 * @access  Private
 */
const getCandidates = async (req, res) => {
  try {
    const DataCenterCandidate = getDataCenterModel();

    const {
      page = 1,
      limit = 20,
      search,
      skills,
      experience_min,
      experience_max,
      location,
      availability,
      lastActive,
      ctc_min,
      ctc_max,
      status,
      sourceWebsite,
      education,
      jobType,
      workMode
    } = req.query;

    // 🔒 Tenant Isolation: Only show candidates belonging to user's tenant
    let query = {
      isActive: true,
      tenant: req.user.tenant
    };

    // Search by name, email, skills
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { skills: { $regex: search, $options: 'i' } },
        { currentCompany: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by skills (comma-separated)
    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim());
      query.skills = { $in: skillsArray };
    }

    // Filter by experience range
    if (experience_min) {
      query.totalExperience = { ...query.totalExperience, $gte: parseFloat(experience_min) };
    }
    if (experience_max) {
      query.totalExperience = { ...query.totalExperience, $lte: parseFloat(experience_max) };
    }

    // Filter by location
    if (location) {
      query.currentLocation = { $regex: location, $options: 'i' };
    }

    // Filter by availability
    if (availability) {
      query.availability = availability;
    }

    // Filter by last active
    if (lastActive) {
      const now = new Date();
      let dateThreshold;
      
      switch(lastActive) {
        case '24hours':
          dateThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '3months':
          dateThreshold = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
      }
      
      if (dateThreshold) {
        query.lastActiveOn = { $gte: dateThreshold };
      }
    }

    // Filter by CTC range
    if (ctc_min) {
      query.expectedCTC = { ...query.expectedCTC, $gte: parseFloat(ctc_min) };
    }
    if (ctc_max) {
      query.expectedCTC = { ...query.expectedCTC, $lte: parseFloat(ctc_max) };
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by source website
    if (sourceWebsite) {
      query.sourceWebsite = sourceWebsite;
    }

    // Filter by education
    if (education) {
      query.highestQualification = { $regex: education, $options: 'i' };
    }

    // Filter by job type
    if (jobType) {
      query.jobType = jobType;
    }

    // Filter by work mode
    if (workMode) {
      query.workMode = workMode;
    }

    // Pagination
    const skip = (page - 1) * limit;
    const total = await DataCenterCandidate.countDocuments(query);

    // Get candidates
    const candidates = await DataCenterCandidate.find(query)
      .sort({ lastActiveOn: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .select('-__v');

    return successResponse(res, {
      candidates,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching candidates:', error);
    return errorResponse(res, 'Error fetching candidates', 500);
  }
};

/**
 * @desc    Get single candidate
 * @route   GET /api/data-center/:id
 * @access  Private
 */
const getCandidate = async (req, res) => {
  try {
    const DataCenterCandidate = getDataCenterModel();

    // 🔒 Tenant Isolation: Only allow access to own tenant's candidates
    const candidate = await DataCenterCandidate.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });

    if (!candidate) {
      return errorResponse(res, 'Candidate not found', 404);
    }

    return successResponse(res, candidate);

  } catch (error) {
    console.error('Error fetching candidate:', error);
    return errorResponse(res, 'Error fetching candidate', 500);
  }
};

/**
 * @desc    Create a new candidate
 * @route   POST /api/data-center
 * @access  Private
 */
const createCandidate = async (req, res) => {
  try {
    const DataCenterCandidate = getDataCenterModel();

    // 🔒 Tenant Isolation: Check for duplicate email (flexible field name check)
    const emailValue = req.body.email || req.body.Email;
    if (emailValue) {
      const existingCandidate = await DataCenterCandidate.findOne({
        $or: [
          { email: emailValue },
          { Email: emailValue }
        ],
        tenant: req.user.tenant
      });

      if (existingCandidate) {
        return errorResponse(res, 'Candidate with this email already exists in your database', 400);
      }
    }

    // 🔥 Create candidate with ALL fields directly at root level
    const candidate = await DataCenterCandidate.create({
      ...req.body,  // All form fields go directly to root
      importedBy: req.user._id,
      importedAt: new Date(),
      isActive: true,
      tenant: req.user.tenant // 🔒 Add tenant
    });

    // Log activity
    const candidateName = candidate.name || candidate.Name ||
                         `${candidate.firstName || candidate.FirstName || ''} ${candidate.lastName || candidate.LastName || ''}`.trim() ||
                         'Unknown';
    await logActivity(req, 'datacenter.create_candidate', 'Candidate', candidate._id, {
      candidateName,
      email: emailValue
    });

    return successResponse(res, candidate, 'Candidate created successfully', 201);

  } catch (error) {
    console.error('Error creating candidate:', error);
    return errorResponse(res, error.message || 'Error creating candidate', 500);
  }
};

/**
 * @desc    Delete candidates (soft delete by setting isActive to false)
 * @route   DELETE /api/data-center
 * @access  Private
 */
const deleteCandidates = async (req, res) => {
  try {
    const DataCenterCandidate = getDataCenterModel();
    const { candidateIds } = req.body;

    if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return errorResponse(res, 'Please provide candidate IDs to delete', 400);
    }

    // 🔒 Tenant Isolation: Only delete own tenant's candidates
    const result = await DataCenterCandidate.updateMany(
      {
        _id: { $in: candidateIds },
        tenant: req.user.tenant
      },
      {
        $set: { isActive: false }
      }
    );

    // Log activity
    await logActivity(req, 'datacenter.delete_candidates', 'Candidate', null, {
      deletedCount: result.modifiedCount,
      candidateIds
    });

    return successResponse(res, {
      deleted: result.modifiedCount
    }, `Successfully deleted ${result.modifiedCount} candidate(s)`);

  } catch (error) {
    console.error('Error deleting candidates:', error);
    return errorResponse(res, 'Error deleting candidates', 500);
  }
};

/**
 * @desc    Get Data Center statistics
 * @route   GET /api/data-center/stats
 * @access  Private
 */
const getStats = async (req, res) => {
  try {
    const DataCenterCandidate = getDataCenterModel();

    // 🔒 Tenant Isolation: Add tenant filter to all queries
    const tenantFilter = { tenant: req.user.tenant };

    const totalCandidates = await DataCenterCandidate.countDocuments({
      isActive: true,
      ...tenantFilter
    });
    const availableCandidates = await DataCenterCandidate.countDocuments({
      isActive: true,
      status: 'Available',
      ...tenantFilter
    });
    const movedToLeads = await DataCenterCandidate.countDocuments({
      isActive: true,
      status: 'Moved to Leads',
      ...tenantFilter
    });

    // Last 24 hours active
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeInLast24Hours = await DataCenterCandidate.countDocuments({
      isActive: true,
      lastActiveOn: { $gte: yesterday },
      ...tenantFilter
    });

    // Group by experience ranges
    const byExperience = await DataCenterCandidate.aggregate([
      { $match: { isActive: true, ...tenantFilter } },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ['$totalExperience', 1] }, then: '0-1 years' },
                { case: { $lt: ['$totalExperience', 3] }, then: '1-3 years' },
                { case: { $lt: ['$totalExperience', 5] }, then: '3-5 years' },
                { case: { $lt: ['$totalExperience', 7] }, then: '5-7 years' },
                { case: { $lt: ['$totalExperience', 10] }, then: '7-10 years' }
              ],
              default: '10+ years'
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Group by location (top 10)
    const byLocation = await DataCenterCandidate.aggregate([
      { $match: { isActive: true, currentLocation: { $exists: true, $ne: '' }, ...tenantFilter } },
      { $group: { _id: '$currentLocation', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Group by availability
    const byAvailability = await DataCenterCandidate.aggregate([
      { $match: { isActive: true, availability: { $exists: true }, ...tenantFilter } },
      { $group: { _id: '$availability', count: { $sum: 1 } } }
    ]);

    // Top skills
    const topSkills = await DataCenterCandidate.aggregate([
      { $match: { isActive: true, ...tenantFilter } },
      { $unwind: '$skills' },
      { $group: { _id: '$skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    return successResponse(res, {
      totalCandidates,
      availableCandidates,
      movedToLeads,
      activeInLast24Hours,
      byExperience: byExperience.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byLocation: byLocation.map(item => ({ location: item._id, count: item.count })),
      byAvailability: byAvailability.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      topSkills: topSkills.map(item => ({ skill: item._id, count: item.count }))
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    return errorResponse(res, 'Error fetching statistics', 500);
  }
};

/**
 * @desc    Move selected candidates to Leads
 * @route   POST /api/data-center/move-to-leads
 * @access  Private
 */
const moveToLeads = async (req, res) => {
  try {
    const DataCenterCandidate = getDataCenterModel();
    const { candidateIds, tenant, assignTo, leadStatus, leadSource, rating } = req.body;

    if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return errorResponse(res, 'Please provide candidate IDs', 400);
    }

    // Determine tenant
    let targetTenant = tenant;
    if (req.user.role === 'SAAS_OWNER' || req.user.role === 'SAAS_ADMIN') {
      if (!tenant) {
        return errorResponse(res, 'Tenant is required for SAAS users', 400);
      }
    } else {
      targetTenant = req.user.tenant;
    }

    const results = {
      success: [],
      failed: [],
      alreadyMoved: []
    };

    for (const candidateId of candidateIds) {
      try {
        // 🔒 Tenant Isolation: Only allow moving own tenant's candidates
        const candidate = await DataCenterCandidate.findOne({
          _id: candidateId,
          tenant: req.user.tenant
        });

        if (!candidate) {
          results.failed.push({ candidateId, reason: 'Candidate not found' });
          continue;
        }

        if (candidate.status === 'Moved to Leads') {
          results.alreadyMoved.push({ 
            candidateId, 
            candidate: `${candidate.firstName} ${candidate.lastName}`,
            reason: 'Already moved to Leads' 
          });
          continue;
        }

        // 🔥 Copy ALL dynamic fields from candidate to lead
        const excludeFields = ['_id', '__v', 'tenant', 'importedBy', 'importedAt', 'createdAt', 'updatedAt', 'isActive', 'status', 'movedToLeadsAt', 'movedBy', 'movedToTenant', 'leadId', 'dataSource'];

        // Get all candidate fields
        const candidateData = {};
        const candidateObj = candidate.toObject();

        Object.keys(candidateObj).forEach(key => {
          if (!excludeFields.includes(key) && candidateObj[key] !== null && candidateObj[key] !== undefined && candidateObj[key] !== '') {
            candidateData[key] = candidateObj[key];
          }
        });

        // Create tags from available data
        const tags = ['Data Center'];
        const skillsField = candidate.skills || candidate.Skills || candidate.skill || candidate.Skill;
        if (skillsField) {
          const skillsArray = Array.isArray(skillsField) ? skillsField : skillsField.split(',').map(s => s.trim());
          tags.push(...skillsArray.slice(0, 3));
        }

        // 🔥 Create lead with ALL candidate fields + system fields
        const newLead = await Lead.create({
          ...candidateData,  // All candidate fields copied directly
          leadStatus: leadStatus || 'New',
          source: leadSource || 'Data Center',
          rating: rating || 'Warm',
          owner: assignTo || req.user._id,
          tenant: targetTenant,
          tags,
          dataCenterCandidateId: candidate._id,  // Track source candidate
          createdBy: req.user._id
        });

        // Update candidate status
        candidate.status = 'Moved to Leads';
        candidate.movedToLeadsAt = new Date();
        candidate.movedBy = req.user._id;
        candidate.movedToTenant = targetTenant;
        candidate.leadId = newLead._id;
        await candidate.save();

        // Log activity
        await logActivity(req, 'datacenter.move_to_leads', 'Candidate', candidate._id, {
          leadId: newLead._id,
          candidateName: `${candidate.firstName} ${candidate.lastName}`
        });

        results.success.push({
          candidateId: candidate._id,
          leadId: newLead._id,
          candidate: `${candidate.firstName} ${candidate.lastName}`
        });

      } catch (error) {
        console.error(`Error moving candidate ${candidateId}:`, error);
        results.failed.push({ 
          candidateId, 
          reason: error.message 
        });
      }
    }

    return successResponse(res, results);

  } catch (error) {
    console.error('Error moving to leads:', error);
    return errorResponse(res, 'Error moving candidates to leads', 500);
  }
};

/**
 * @desc    Bulk import candidates
 * @route   POST /api/data-center/bulk-import
 * @access  Private (SAAS_OWNER only)
 */
const bulkImportCandidates = async (req, res, isInternal = false) => {
  try {
    const DataCenterCandidate = getDataCenterModel();
    const { candidates } = req.body || req;

    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
      if (!isInternal) {
        return errorResponse(res, 'Please provide candidates array', 400);
      }
      throw new Error('Please provide candidates array');
    }

    const results = {
      success: [],
      failed: [],
      duplicates: []
    };

    for (const candidateData of candidates) {
      try {
        // 🔒 Tenant Isolation: Check for duplicate based on any email field
        let existingCandidate = null;
        if (candidateData.email || candidateData.Email) {
          const emailToCheck = candidateData.email || candidateData.Email;
          existingCandidate = await DataCenterCandidate.findOne({
            $or: [
              { email: emailToCheck },
              { Email: emailToCheck }
            ],
            tenant: req.user?.tenant
          });
        }

        if (existingCandidate) {
          results.duplicates.push({
            email: candidateData.email || candidateData.Email,
            name: candidateData.name || candidateData.Name || candidateData.firstName || candidateData.FirstName || 'Unknown'
          });
          continue;
        }

        // 🔥 Create candidate with ALL fields at root level + system fields
        const candidate = await DataCenterCandidate.create({
          ...candidateData,  // All Excel columns go directly to root
          importedBy: req.user?._id,
          importedAt: new Date(),
          tenant: req.user?.tenant,  // 🔒 Add tenant
          isActive: true
        });

        results.success.push({
          id: candidate._id,
          name: candidateData.name || candidateData.Name || candidateData.firstName || candidateData.FirstName || 'Unknown',
          email: candidateData.email || candidateData.Email
        });

      } catch (error) {
        console.error('❌ Failed to import candidate:', candidateData);
        console.error('   Error:', error.message);
        console.error('   Stack:', error.stack);
        results.failed.push({
          data: candidateData,
          reason: error.message
        });
      }
    }

    // Log summary
    console.log(`📊 Import Summary: Success: ${results.success.length}, Failed: ${results.failed.length}, Duplicates: ${results.duplicates.length}`);
    if (results.failed.length > 0) {
      console.log('❌ Failed records details:');
      results.failed.forEach((f, i) => {
        console.log(`   ${i + 1}. ${f.data?.firstName || 'N/A'} (${f.data?.email || 'N/A'}): ${f.reason}`);
      });
    }

    if (isInternal) {
      return results;
    }

    return successResponse(res, results);

  } catch (error) {
    console.error('Error importing candidates:', error);
    if (isInternal) {
      throw error;
    }
    return errorResponse(res, 'Error importing candidates', 500);
  }
};

/**
 * @desc    Export candidates to Excel
 * @route   POST /api/data-center/export
 * @access  Private
 */
const exportCandidates = async (req, res) => {
  try {
    const DataCenterCandidate = getDataCenterModel();
    const { candidateIds } = req.body;

    // 🔒 Tenant Isolation: Only export own tenant's candidates
    let query = {
      isActive: true,
      tenant: req.user.tenant
    };

    if (candidateIds && Array.isArray(candidateIds) && candidateIds.length > 0) {
      query._id = { $in: candidateIds };
    }

    const candidates = await DataCenterCandidate.find(query).select('-__v');

    if (candidates.length === 0) {
      return errorResponse(res, 'No candidates found to export', 404);
    }

    // 🔥 Prepare data for Excel - Dynamic columns from all candidates
    const excludeFields = ['_id', '__v', 'tenant', 'importedBy', 'importedAt', 'createdAt', 'updatedAt', 'movedBy', 'movedToTenant', 'leadId', 'dataSource'];

    // Collect all unique column names from all candidates
    const allColumns = new Set();
    candidates.forEach(candidate => {
      Object.keys(candidate.toObject()).forEach(key => {
        if (!excludeFields.includes(key)) {
          allColumns.add(key);
        }
      });
    });

    // Map candidates to Excel rows with all columns
    const data = candidates.map(candidate => {
      const row = {};
      const candidateObj = candidate.toObject();

      allColumns.forEach(column => {
        const value = candidateObj[column];
        if (value === null || value === undefined || value === '') {
          row[column] = '';
        } else if (Array.isArray(value)) {
          row[column] = value.join(', ');
        } else if (value instanceof Date) {
          row[column] = value.toLocaleDateString();
        } else if (typeof value === 'object') {
          row[column] = JSON.stringify(value);
        } else {
          row[column] = value;
        }
      });

      return row;
    });

    // Create workbook
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Candidates');

    // Generate buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers
    res.setHeader('Content-Disposition', `attachment; filename=candidates_${Date.now()}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    return res.send(buffer);

  } catch (error) {
    console.error('Error exporting candidates:', error);
    return errorResponse(res, 'Error exporting candidates', 500);
  }
};

/**
 * @desc    Upload CSV/Excel file with candidates
 * @route   POST /api/data-center/upload
 * @access  Private
 */
const uploadCandidatesFile = async (req, res) => {
  try {
    // Handle file upload with multer
    upload(req, res, async (err) => {
      if (err) {
        return errorResponse(res, err.message, 400);
      }

      if (!req.file) {
        return errorResponse(res, 'Please upload a file', 400);
      }

      try {
        // Get column mapping from request (if provided)
        let columnMapping = {};
        if (req.body.columnMapping) {
          try {
            columnMapping = JSON.parse(req.body.columnMapping);
          } catch (e) {
            console.error('Failed to parse columnMapping:', e);
          }
        }

        // Read file buffer
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const rawData = xlsx.utils.sheet_to_json(worksheet);

        if (rawData.length === 0) {
          return errorResponse(res, 'File is empty or invalid format', 400);
        }

        // Helper function to safely parse numbers (returns undefined if no value)
        const parseNumberOrUndefined = (value) => {
          if (value === undefined || value === null || value === '') return undefined;
          const parsed = parseFloat(value);
          return isNaN(parsed) ? undefined : parsed;
        };

        // Helper function to safely parse integers (returns undefined if no value)
        const parseIntOrUndefined = (value) => {
          if (value === undefined || value === null || value === '') return undefined;
          const parsed = parseInt(value);
          return isNaN(parsed) ? undefined : parsed;
        };

        // 🔥 FULLY DYNAMIC MAPPING - All Excel columns are saved directly at root level
        const systemFields = ['tenant', 'status', 'movedToLeadsAt', 'movedBy', 'movedToTenant', 'leadId', 'importedBy', 'importedAt', 'dataSource', 'isActive', '_id', '__v', 'createdAt', 'updatedAt'];

        // Map CSV/Excel columns to model fields - ALL columns become database fields
        const candidates = rawData.map((row, index) => {
          const candidate = {};

          // Process ALL columns from Excel/CSV
          Object.keys(row).forEach(csvColumn => {
            const value = row[csvColumn];

            // Skip empty values
            if (value === undefined || value === null || value === '') return;

            // Skip system fields that shouldn't come from Excel
            if (systemFields.includes(csvColumn)) return;

            // Clean column name (remove extra spaces, special characters)
            const cleanColumnName = csvColumn.trim();

            // Smart type detection and conversion
            // Check if value looks like a number
            if (typeof value === 'number') {
              candidate[cleanColumnName] = value;
            }
            // Check if it's a string that looks like a comma-separated list
            else if (typeof value === 'string' && value.includes(',') && value.split(',').length > 1) {
              // Convert comma-separated to array
              candidate[cleanColumnName] = value.split(',').map(s => s.trim()).filter(Boolean);
            }
            // Check if it's a date string
            else if (typeof value === 'string' && !isNaN(Date.parse(value)) && value.match(/\d{4}-\d{2}-\d{2}/)) {
              candidate[cleanColumnName] = new Date(value);
            }
            // Check if it's a boolean-like string
            else if (typeof value === 'string' && ['true', 'false', 'yes', 'no'].includes(value.toLowerCase())) {
              candidate[cleanColumnName] = ['true', 'yes'].includes(value.toLowerCase());
            }
            // Check if it's a numeric string
            else if (typeof value === 'string' && !isNaN(value) && value.trim() !== '') {
              const numValue = parseFloat(value);
              candidate[cleanColumnName] = isNaN(numValue) ? value : numValue;
            }
            // Default: store as is
            else {
              candidate[cleanColumnName] = value;
            }
          });

          return candidate;
        });

        // Accept all rows - no strict validation
        const validCandidates = candidates;

        console.log(`✅ Processing ${validCandidates.length} candidates from Excel file`);
        console.log(`📋 Sample candidate data (first record):`, JSON.stringify(validCandidates[0], null, 2));

        // Bulk import
        const result = await bulkImportCandidates({
          body: { candidates: validCandidates },
          user: req.user
        }, res, true);

        // Return success with stats
        return successResponse(res, {
          total: rawData.length,
          valid: validCandidates.length,
          imported: result.success.length,
          failed: result.failed.length,
          duplicates: result.duplicates?.length || 0
        }, `Successfully uploaded ${result.success.length} candidates`);

      } catch (parseError) {
        console.error('File parsing error:', parseError);
        return errorResponse(res, 'Error parsing file. Please check the format.', 400);
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return errorResponse(res, 'Error uploading file', 500);
  }
};

/**
 * @desc    Send bulk emails to candidates
 * @route   POST /api/data-center/bulk-email
 * @access  Private
 */
const sendBulkEmail = async (req, res) => {
  try {
    const emailService = require('../services/emailService');
    const { candidates, subject, message } = req.body;

    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
      return errorResponse(res, 'Please provide candidates', 400);
    }

    if (!subject || !message) {
      return errorResponse(res, 'Please provide subject and message', 400);
    }

    // Use email service for bulk sending (with user ID and tenant ID)
    const results = await emailService.sendBulkEmails(req.user._id, candidates, subject, message, req.user.tenant);

    // Log activity
    await logActivity(req, 'datacenter.bulk_email', 'DataCenter', null, {
      totalCandidates: candidates.length,
      sent: results.sent,
      failed: results.failed,
    });

    return successResponse(res, results, `Bulk email completed: ${results.sent} sent, ${results.failed} failed`);
  } catch (error) {
    console.error('Error sending bulk email:', error);
    return errorResponse(res, 'Error sending bulk emails', 500);
  }
};

/**
 * @desc    Send bulk WhatsApp messages to candidates
 * @route   POST /api/data-center/bulk-whatsapp
 * @access  Private
 */
const sendBulkWhatsApp = async (req, res) => {
  try {
    const whatsappService = require('../services/whatsappService');
    const { candidates, message } = req.body;

    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
      return errorResponse(res, 'Please provide candidates', 400);
    }

    if (!message) {
      return errorResponse(res, 'Please provide message', 400);
    }

    // Use WhatsApp service for bulk sending
    const results = await whatsappService.sendBulkMessages(candidates, message);

    // Log activity
    await logActivity(req, 'datacenter.bulk_whatsapp', 'DataCenter', null, {
      totalCandidates: candidates.length,
      sent: results.sent,
      failed: results.failed,
      mode: results.mode,
    });

    return successResponse(res, results, `Bulk WhatsApp completed (${results.mode}): ${results.sent} sent, ${results.failed} failed`);
  } catch (error) {
    console.error('Error sending bulk WhatsApp:', error);
    return errorResponse(res, 'Error sending bulk WhatsApp', 500);
  }
};

/**
 * @desc    Send bulk SMS to candidates
 * @route   POST /api/data-center/bulk-sms
 * @access  Private
 */
const sendBulkSMS = async (req, res) => {
  try {
    const smsService = require('../services/smsService');
    const { candidates, message } = req.body;

    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
      return errorResponse(res, 'Please provide candidates', 400);
    }

    if (!message) {
      return errorResponse(res, 'Please provide message', 400);
    }

    // Use SMS service for bulk sending
    const results = await smsService.sendBulkSMS(candidates, message);

    // Log activity
    await logActivity(req, 'datacenter.bulk_sms', 'DataCenter', null, {
      totalCandidates: candidates.length,
      sent: results.sent,
      failed: results.failed,
    });

    return successResponse(res, results, `Bulk SMS completed: ${results.sent} sent, ${results.failed} failed`);
  } catch (error) {
    console.error('Error sending bulk SMS:', error);
    return errorResponse(res, 'Error sending bulk SMS', 500);
  }
};

/**
 * @desc    Download sample template for bulk upload (Dynamic - includes custom fields)
 * @route   GET /api/data-center/download-template
 * @access  Private
 */
const downloadSampleTemplate = async (req, res) => {
  const xlsx = require('xlsx');
  const FieldDefinition = require('../models/FieldDefinition');

  try {
    // Determine tenant
    let tenant;
    if (req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN') {
      tenant = req.query.tenant || req.user.tenant;
    } else {
      tenant = req.user.tenant;
    }

    // Get active field definitions for Candidate entity
    const fieldDefinitions = await FieldDefinition.find({
      tenant,
      entityType: 'Candidate',
      isActive: true,
      showInCreate: true
    }).sort({ displayOrder: 1 });

    console.log(`📥 Generating Candidate CSV template with ${fieldDefinitions.length} fields`);

    // Build sample data dynamically based on field definitions
    const sampleRow1 = {};
    const sampleRow2 = {};

    fieldDefinitions.forEach(field => {
      const label = field.label;
      let example1, example2;

      switch (field.fieldType) {
        case 'text':
          example1 = field.fieldName === 'firstName' ? 'Rahul' :
                     field.fieldName === 'lastName' ? 'Sharma' :
                     field.fieldName === 'currentCompany' ? 'Infosys' :
                     field.fieldName === 'currentDesignation' ? 'Software Engineer' :
                     field.fieldName === 'currentLocation' ? 'Bangalore' :
                     field.fieldName === 'education' ? 'B.Tech in Computer Science' :
                     `Example ${field.label}`;
          example2 = field.fieldName === 'firstName' ? 'Priya' :
                     field.fieldName === 'lastName' ? 'Patel' :
                     field.fieldName === 'currentCompany' ? 'TCS' :
                     field.fieldName === 'currentDesignation' ? 'Senior Developer' :
                     field.fieldName === 'currentLocation' ? 'Mumbai' :
                     field.fieldName === 'education' ? 'MCA' :
                     `Sample ${field.label}`;
          break;

        case 'email':
          example1 = 'rahul.sharma@example.com';
          example2 = 'priya.patel@example.com';
          break;

        case 'phone':
          example1 = '+91-9876543210';
          example2 = '+91-9876543211';
          break;

        case 'url':
          example1 = field.fieldName === 'linkedInUrl' ? 'https://linkedin.com/in/rahulsharma' :
                     field.fieldName === 'githubUrl' ? 'https://github.com/rahulsharma' :
                     field.fieldName === 'resumeUrl' ? 'https://drive.google.com/file/d/xyz' :
                     'https://example.com';
          example2 = field.fieldName === 'linkedInUrl' ? 'https://linkedin.com/in/priyapatel' :
                     field.fieldName === 'githubUrl' ? 'https://github.com/priyapatel' :
                     field.fieldName === 'resumeUrl' ? 'https://drive.google.com/file/d/abc' :
                     'https://example2.com';
          break;

        case 'number':
          example1 = field.fieldName === 'totalExperience' ? '5' :
                     field.fieldName === 'relevantExperience' ? '4' :
                     field.fieldName === 'noticePeriod' ? '30' :
                     '10';
          example2 = field.fieldName === 'totalExperience' ? '7' :
                     field.fieldName === 'relevantExperience' ? '6' :
                     field.fieldName === 'noticePeriod' ? '60' :
                     '20';
          break;

        case 'currency':
          example1 = field.fieldName === 'currentCTC' ? '800000' :
                     field.fieldName === 'expectedCTC' ? '1200000' :
                     '50000';
          example2 = field.fieldName === 'currentCTC' ? '1000000' :
                     field.fieldName === 'expectedCTC' ? '1500000' :
                     '75000';
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
          example1 = field.fieldName === 'willingToRelocate' ? 'Yes' : 'No';
          example2 = field.fieldName === 'willingToRelocate' ? 'No' : 'Yes';
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
          example1 = field.fieldName === 'skills' ? 'Java, Python, React, Node.js' :
                     field.fieldName === 'summary' ? '5 years experience in full-stack development' :
                     field.fieldName === 'notes' ? 'Strong communication skills' :
                     `Detailed ${field.label}`;
          example2 = field.fieldName === 'skills' ? 'JavaScript, Angular, MongoDB, AWS' :
                     field.fieldName === 'summary' ? '7 years experience in backend development' :
                     field.fieldName === 'notes' ? 'Team player with leadership skills' :
                     `Sample ${field.label}`;
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
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Candidates Sample');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=candidates_import_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

  } catch (error) {
    console.error('Error generating template:', error);
    return errorResponse(res, 500, 'Error generating template');
  }
};

module.exports = {
  getCandidates,
  getCandidate,
  createCandidate,
  deleteCandidates,
  getStats,
  moveToLeads,
  bulkImportCandidates,
  exportCandidates,
  uploadCandidatesFile,
  sendBulkEmail,
  sendBulkWhatsApp,
  sendBulkSMS,
  downloadSampleTemplate,
};