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

    let query = { isActive: true };

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
    const candidate = await DataCenterCandidate.findById(req.params.id);

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

    // Check if candidate with email already exists
    const existingCandidate = await DataCenterCandidate.findOne({
      email: req.body.email
    });

    if (existingCandidate) {
      return errorResponse(res, 'Candidate with this email already exists', 400);
    }

    // Create candidate
    const candidate = await DataCenterCandidate.create({
      ...req.body,
      importedBy: req.user._id,
      importedAt: new Date(),
      isActive: true
    });

    // Log activity
    await logActivity(req.user._id, req.user.tenant, 'datacenter.create_candidate', {
      candidateId: candidate._id,
      candidateName: `${candidate.firstName} ${candidate.lastName}`,
      email: candidate.email
    });

    return successResponse(res, candidate, 'Candidate created successfully', 201);

  } catch (error) {
    console.error('Error creating candidate:', error);
    return errorResponse(res, error.message || 'Error creating candidate', 500);
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

    const totalCandidates = await DataCenterCandidate.countDocuments({ isActive: true });
    const availableCandidates = await DataCenterCandidate.countDocuments({ 
      isActive: true, 
      status: 'Available' 
    });
    const movedToLeads = await DataCenterCandidate.countDocuments({ 
      isActive: true, 
      status: 'Moved to Leads' 
    });

    // Last 24 hours active
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeInLast24Hours = await DataCenterCandidate.countDocuments({
      isActive: true,
      lastActiveOn: { $gte: yesterday }
    });

    // Group by experience ranges
    const byExperience = await DataCenterCandidate.aggregate([
      { $match: { isActive: true } },
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
      { $match: { isActive: true, currentLocation: { $exists: true, $ne: '' } } },
      { $group: { _id: '$currentLocation', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Group by availability
    const byAvailability = await DataCenterCandidate.aggregate([
      { $match: { isActive: true, availability: { $exists: true } } },
      { $group: { _id: '$availability', count: { $sum: 1 } } }
    ]);

    // Top skills
    const topSkills = await DataCenterCandidate.aggregate([
      { $match: { isActive: true } },
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
        const candidate = await DataCenterCandidate.findById(candidateId);

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

        // Create lead description
        const description = `
Candidate from Data Center:
Experience: ${candidate.totalExperience} years
Skills: ${candidate.skills ? candidate.skills.join(', ') : 'N/A'}
Current CTC: ₹${candidate.currentCTC ? candidate.currentCTC.toLocaleString() : 'N/A'}
Expected CTC: ₹${candidate.expectedCTC ? candidate.expectedCTC.toLocaleString() : 'N/A'}
Availability: ${candidate.availability || 'N/A'}
LinkedIn: ${candidate.linkedInUrl || 'N/A'}
Resume: ${candidate.resumeUrl || 'N/A'}
Source: ${candidate.sourceWebsite || 'N/A'}
        `.trim();

        // Create tags
        const tags = [
          'Data Center',
          candidate.sourceWebsite
        ];
        if (candidate.skills && candidate.skills.length > 0) {
          tags.push(...candidate.skills.slice(0, 3));
        }

        // Create lead
        const newLead = await Lead.create({
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          email: candidate.email,
          phone: candidate.phone,
          company: candidate.currentCompany,
          jobTitle: candidate.currentDesignation,
          city: candidate.currentLocation,
          annualRevenue: candidate.expectedCTC,
          description,
          status: leadStatus || 'New',
          source: leadSource || 'Data Center',
          rating: rating || 'Warm',
          owner: assignTo || req.user._id,
          tenant: targetTenant,
          tags
        });

        // Update candidate status
        candidate.status = 'Moved to Leads';
        candidate.movedToLeadsAt = new Date();
        candidate.movedBy = req.user._id;
        candidate.movedToTenant = targetTenant;
        candidate.leadId = newLead._id;
        await candidate.save();

        // Log activity
        await logActivity(req.user._id, targetTenant, 'datacenter.move_to_leads', {
          candidateId: candidate._id,
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
        // Check for duplicate email
        const existingCandidate = await DataCenterCandidate.findOne({ 
          email: candidateData.email 
        });

        if (existingCandidate) {
          results.duplicates.push({
            email: candidateData.email,
            name: `${candidateData.firstName} ${candidateData.lastName}`
          });
          continue;
        }

        // Create candidate
        const candidate = await DataCenterCandidate.create({
          ...candidateData,
          importedBy: req.user?._id,
          importedAt: new Date()
        });

        results.success.push({
          id: candidate._id,
          name: `${candidate.firstName} ${candidate.lastName}`,
          email: candidate.email
        });

      } catch (error) {
        results.failed.push({
          data: candidateData,
          reason: error.message
        });
      }
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

    let query = { isActive: true };
    
    if (candidateIds && Array.isArray(candidateIds) && candidateIds.length > 0) {
      query._id = { $in: candidateIds };
    }

    const candidates = await DataCenterCandidate.find(query).select('-__v');

    if (candidates.length === 0) {
      return errorResponse(res, 'No candidates found to export', 404);
    }

    // Prepare data for Excel
    const data = candidates.map(candidate => ({
      'Name': `${candidate.firstName} ${candidate.lastName}`,
      'Email': candidate.email,
      'Phone': candidate.phone,
      'Current Company': candidate.currentCompany || '',
      'Designation': candidate.currentDesignation || '',
      'Experience (Years)': candidate.totalExperience || 0,
      'Skills': candidate.skills ? candidate.skills.join(', ') : '',
      'Location': candidate.currentLocation || '',
      'Current CTC': candidate.currentCTC || '',
      'Expected CTC': candidate.expectedCTC || '',
      'Notice Period (Days)': candidate.noticePeriod || '',
      'Availability': candidate.availability || '',
      'Resume': candidate.resumeUrl || '',
      'LinkedIn': candidate.linkedInUrl || '',
      'Last Active': candidate.lastActiveOn ? new Date(candidate.lastActiveOn).toLocaleDateString() : '',
      'Source': candidate.sourceWebsite || '',
      'Status': candidate.status || ''
    }));

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

        // Helper function to get mapped value
        const getMappedValue = (row, csvColumn, fieldName) => {
          // If column mapping exists, use it
          if (Object.keys(columnMapping).length > 0) {
            // Find the CSV column that maps to this field
            const mappedCsvColumn = Object.keys(columnMapping).find(
              csvCol => columnMapping[csvCol] === fieldName
            );
            return mappedCsvColumn ? row[mappedCsvColumn] : undefined;
          }
          // Otherwise, try common column names (fallback)
          return row[csvColumn] || row[fieldName];
        };

        // Map CSV/Excel columns to model fields
        const candidates = rawData.map(row => {
          const candidate = {
            firstName: getMappedValue(row, 'First Name', 'firstName') || '',
            lastName: getMappedValue(row, 'Last Name', 'lastName') || '',
            email: getMappedValue(row, 'Email', 'email') || '',
            phone: getMappedValue(row, 'Phone', 'phone') || '',
            alternatePhone: getMappedValue(row, 'Alternate Phone', 'alternatePhone'),

            currentCompany: getMappedValue(row, 'Current Company', 'currentCompany'),
            currentDesignation: getMappedValue(row, 'Designation', 'currentDesignation'),
            totalExperience: parseFloat(getMappedValue(row, 'Experience', 'totalExperience') || 0),
            relevantExperience: parseFloat(getMappedValue(row, 'Relevant Experience', 'relevantExperience') || 0),

            currentLocation: getMappedValue(row, 'Location', 'currentLocation') || '',
            availability: getMappedValue(row, 'Availability', 'availability') || 'Immediate',

            currentCTC: parseFloat(getMappedValue(row, 'Current CTC', 'currentCTC') || 0),
            expectedCTC: parseFloat(getMappedValue(row, 'Expected CTC', 'expectedCTC') || 0),
            noticePeriod: parseInt(getMappedValue(row, 'Notice Period', 'noticePeriod') || 0),

            education: getMappedValue(row, 'Education', 'education'),
            highestQualification: getMappedValue(row, 'Qualification', 'highestQualification'),

            linkedInUrl: getMappedValue(row, 'LinkedIn', 'linkedInUrl'),
            resumeUrl: getMappedValue(row, 'Resume URL', 'resumeUrl'),

            sourceWebsite: getMappedValue(row, 'Source', 'sourceWebsite') || 'Manual Upload',
            jobType: getMappedValue(row, 'Job Type', 'jobType') || 'Full-time',
            workMode: getMappedValue(row, 'Work Mode', 'workMode') || 'Hybrid',

            status: 'Available',
            isActive: true,
            lastActiveOn: new Date()
          };

          // Handle skills (comma-separated)
          const skillsValue = getMappedValue(row, 'Skills', 'skills');
          if (skillsValue) {
            candidate.skills = typeof skillsValue === 'string'
              ? skillsValue.split(',').map(s => s.trim())
              : skillsValue;
          } else {
            candidate.skills = [];
          }

          // Handle preferred locations (comma-separated)
          const locationsValue = getMappedValue(row, 'Preferred Locations', 'preferredLocations');
          if (locationsValue) {
            candidate.preferredLocations = typeof locationsValue === 'string'
              ? locationsValue.split(',').map(s => s.trim())
              : locationsValue;
          } else {
            candidate.preferredLocations = [];
          }

          return candidate;
        });

        // Filter out candidates without email (required field)
        const validCandidates = candidates.filter(c => c.email && c.firstName);

        if (validCandidates.length === 0) {
          return errorResponse(res, 'No valid candidates found. Ensure First Name and Email columns are present.', 400);
        }

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

module.exports = {
  getCandidates,
  getCandidate,
  createCandidate,
  getStats,
  moveToLeads,
  bulkImportCandidates,
  exportCandidates,
  uploadCandidatesFile
};