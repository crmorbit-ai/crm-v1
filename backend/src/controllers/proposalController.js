const Proposal = require('../models/Proposal');
const { successResponse, errorResponse } = require('../utils/response');
const { generateProposalPDF } = require('../services/proposalPDFService');

/**
 * @desc    Get all proposals for tenant
 * @route   GET /api/proposals
 * @access  Private
 */
const getProposals = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;

    const query = {
      tenant: req.user.tenant,
      isActive: true
    };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { proposalNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } }
      ];
    }

    const proposals = await Proposal.find(query)
      .populate('customer', 'accountName firstName lastName email phone')
      .populate('opportunity', 'opportunityName amount stage')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Proposal.countDocuments(query);

    successResponse(res, 200, 'Proposals retrieved successfully', proposals, {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get proposals error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get single proposal
 * @route   GET /api/proposals/:id
 * @access  Private
 */
const getProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id)
      .populate('customer', 'accountName firstName lastName email phone company industry')
      .populate('opportunity', 'opportunityName amount stage closeDate')
      .populate('createdBy', 'firstName lastName email')
      .populate('lastModifiedBy', 'firstName lastName email')
      .populate('tenant', 'organizationName legalName email phone address logo invoiceLogo signature bankDetails gstin pan');

    if (!proposal) {
      return errorResponse(res, 404, 'Proposal not found');
    }

    // Check tenant access
    if (proposal.tenant._id.toString() !== req.user.tenant.toString()) {
      return errorResponse(res, 403, 'Access denied');
    }

    // Check if expired
    proposal.checkExpiry();
    if (proposal.isModified('status')) {
      await proposal.save();
    }

    successResponse(res, 200, 'Proposal retrieved successfully', proposal);
  } catch (error) {
    console.error('Get proposal error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Create new proposal
 * @route   POST /api/proposals
 * @access  Private
 */
const createProposal = async (req, res) => {
  try {
    console.log('📝 Creating proposal with data:', JSON.stringify(req.body, null, 2));

    // Title validation and sanitization
    if (!req.body.title || req.body.title.trim().length < 5) {
      return errorResponse(res, 400, 'Proposal Title must be at least 5 characters');
    }

    if (req.body.title.length > 150) {
      return errorResponse(res, 400, 'Proposal Title cannot exceed 150 characters');
    }

    // Sanitize title - remove potentially harmful characters
    const sanitizedTitle = req.body.title
      .replace(/[<>]/g, '') // Remove angle brackets (XSS prevention)
      .replace(/[^\w\s\-_,.&()]/g, '') // Only allow alphanumeric, spaces, and basic punctuation
      .trim();

    // Check meaningful content
    const alphanumericCount = (sanitizedTitle.match(/[a-zA-Z0-9]/g) || []).length;
    if (alphanumericCount < 3) {
      return errorResponse(res, 400, 'Proposal Title must contain meaningful text');
    }

    // Customer name validation
    if (req.body.customerName) {
      if (req.body.customerName.trim().length < 2) {
        return errorResponse(res, 400, 'Customer Name must be at least 2 characters');
      }
      if (req.body.customerName.length > 100) {
        return errorResponse(res, 400, 'Customer Name cannot exceed 100 characters');
      }

      // Sanitize - only letters, spaces, hyphens, periods, apostrophes
      req.body.customerName = req.body.customerName.replace(/[^a-zA-Z\s\-\.']/g, '').trim();

      const nameLetters = (req.body.customerName.match(/[a-zA-Z]/g) || []).length;
      if (nameLetters < 2) {
        return errorResponse(res, 400, 'Customer Name must contain at least 2 letters');
      }
    }

    // Phone validation
    if (req.body.customerPhone) {
      const phoneDigits = req.body.customerPhone.replace(/[^\d]/g, '');
      if (phoneDigits.length > 0 && phoneDigits.length < 10) {
        return errorResponse(res, 400, 'Phone number must be at least 10 digits');
      }
      if (phoneDigits.length > 15) {
        return errorResponse(res, 400, 'Phone number cannot exceed 15 digits');
      }
      // Sanitize phone - only keep numbers, +, -, and spaces
      req.body.customerPhone = req.body.customerPhone.replace(/[^\d+\-\s]/g, '');
    }

    const proposalData = {
      ...req.body,
      title: sanitizedTitle, // Use sanitized title
      tenant: req.user.tenant,
      createdBy: req.user._id,
      lastModifiedBy: req.user._id
    };

    // Set default validUntil if not provided (30 days from now)
    if (!proposalData.validUntil) {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30);
      proposalData.validUntil = validUntil;
    }

    // Date validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const proposalDate = new Date(proposalData.proposalDate);
    const validUntil = new Date(proposalData.validUntil);

    if (proposalDate < today) {
      return errorResponse(res, 400, 'Proposal Date cannot be in the past');
    }

    if (validUntil <= proposalDate) {
      return errorResponse(res, 400, 'Valid Until date must be after Proposal Date');
    }

    if (validUntil < today) {
      return errorResponse(res, 400, 'Valid Until date cannot be in the past');
    }

    console.log('📝 Final proposal data:', JSON.stringify(proposalData, null, 2));

    const proposal = await Proposal.create(proposalData);
    console.log('✅ Proposal created with ID:', proposal._id);

    const populatedProposal = await Proposal.findById(proposal._id)
      .populate('customer', 'name customerName email phone')
      .populate('opportunity', 'opportunityName amount')
      .populate('createdBy', 'firstName lastName email');

    console.log('✅ Proposal populated and returning');
    successResponse(res, 201, 'Proposal created successfully', populatedProposal);
  } catch (error) {
    console.error('❌ Create proposal error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message).join(', ');
      console.error('Validation errors:', errors);
      return errorResponse(res, 400, errors);
    }
    errorResponse(res, 500, `Server error: ${error.message}`);
  }
};

/**
 * @desc    Update proposal
 * @route   PUT /api/proposals/:id
 * @access  Private
 */
const updateProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return errorResponse(res, 404, 'Proposal not found');
    }

    // Check tenant access
    if (proposal.tenant.toString() !== req.user.tenant.toString()) {
      return errorResponse(res, 403, 'Access denied');
    }

    // Prevent editing accepted/rejected proposals
    if (['accepted', 'rejected'].includes(proposal.status) && req.body.status !== proposal.status) {
      return errorResponse(res, 400, 'Cannot modify accepted/rejected proposals');
    }

    // Title validation if being updated
    if (req.body.title !== undefined) {
      if (!req.body.title || req.body.title.trim().length < 5) {
        return errorResponse(res, 400, 'Proposal Title must be at least 5 characters');
      }
      if (req.body.title.length > 150) {
        return errorResponse(res, 400, 'Proposal Title cannot exceed 150 characters');
      }

      // Sanitize title
      req.body.title = req.body.title
        .replace(/[<>]/g, '')
        .replace(/[^\w\s\-_,.&()]/g, '')
        .trim();

      const alphanumericCount = (req.body.title.match(/[a-zA-Z0-9]/g) || []).length;
      if (alphanumericCount < 3) {
        return errorResponse(res, 400, 'Proposal Title must contain meaningful text');
      }
    }

    // Customer name validation if being updated
    if (req.body.customerName !== undefined) {
      if (req.body.customerName.trim().length < 2) {
        return errorResponse(res, 400, 'Customer Name must be at least 2 characters');
      }
      if (req.body.customerName.length > 100) {
        return errorResponse(res, 400, 'Customer Name cannot exceed 100 characters');
      }

      req.body.customerName = req.body.customerName.replace(/[^a-zA-Z\s\-\.']/g, '').trim();

      const nameLetters = (req.body.customerName.match(/[a-zA-Z]/g) || []).length;
      if (nameLetters < 2) {
        return errorResponse(res, 400, 'Customer Name must contain at least 2 letters');
      }
    }

    // Phone validation if being updated
    if (req.body.customerPhone !== undefined) {
      const phoneDigits = req.body.customerPhone.replace(/[^\d]/g, '');
      if (phoneDigits.length > 0 && phoneDigits.length < 10) {
        return errorResponse(res, 400, 'Phone number must be at least 10 digits');
      }
      if (phoneDigits.length > 15) {
        return errorResponse(res, 400, 'Phone number cannot exceed 15 digits');
      }
      req.body.customerPhone = req.body.customerPhone.replace(/[^\d+\-\s]/g, '');
    }

    // Date validation if dates are being updated
    if (req.body.proposalDate || req.body.validUntil) {
      const proposalDate = new Date(req.body.proposalDate || proposal.proposalDate);
      const validUntil = new Date(req.body.validUntil || proposal.validUntil);

      if (validUntil <= proposalDate) {
        return errorResponse(res, 400, 'Valid Until date must be after Proposal Date');
      }
    }

    // Update fields
    const allowedFields = [
      'title', 'rfpNumber', 'proposalDate', 'validUntil', 'status',
      'customerName', 'customerEmail', 'customerPhone', 'customerAddress', 'customerCompany',
      'sections', 'milestones', 'totalDuration', 'totalDurationUnit',
      'resources', 'currency', 'paymentTerms',
      'terms', 'notes', 'internalNotes'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        proposal[field] = req.body[field];
      }
    });

    proposal.lastModifiedBy = req.user._id;

    await proposal.save();

    const updatedProposal = await Proposal.findById(proposal._id)
      .populate('customer', 'accountName firstName lastName email phone')
      .populate('opportunity', 'opportunityName amount')
      .populate('createdBy', 'firstName lastName email')
      .populate('lastModifiedBy', 'firstName lastName email');

    successResponse(res, 200, 'Proposal updated successfully', updatedProposal);
  } catch (error) {
    console.error('Update proposal error:', error);
    if (error.name === 'ValidationError') {
      return errorResponse(res, 400, Object.values(error.errors).map(e => e.message).join(', '));
    }
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Delete proposal
 * @route   DELETE /api/proposals/:id
 * @access  Private
 */
const deleteProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return errorResponse(res, 404, 'Proposal not found');
    }

    // Check tenant access
    if (proposal.tenant.toString() !== req.user.tenant.toString()) {
      return errorResponse(res, 403, 'Access denied');
    }

    // Soft delete
    proposal.isActive = false;
    await proposal.save();

    successResponse(res, 200, 'Proposal deleted successfully');
  } catch (error) {
    console.error('Delete proposal error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Send proposal via email
 * @route   POST /api/proposals/:id/send
 * @access  Private
 */
const sendProposal = async (req, res) => {
  try {
    const { recipients } = req.body;

    const proposal = await Proposal.findById(req.params.id)
      .populate('tenant', 'organizationName email logo invoiceLogo gstin panNumber cinNumber headquarters');

    if (!proposal) {
      return errorResponse(res, 404, 'Proposal not found');
    }

    // Check tenant access
    if (proposal.tenant._id.toString() !== req.user.tenant.toString()) {
      return errorResponse(res, 403, 'Access denied');
    }

    // Generate PDF
    const pdfBuffer = await generateProposalPDF(proposal, proposal.tenant);

    // Send email with PDF attachment using AWS SES
    const { sendMailWithAttachment } = require('../utils/emailService');
    const recipientList = recipients || [proposal.customerEmail];

    for (const email of recipientList) {
      await sendMailWithAttachment({
        to: email,
        fromNoreply: true, // Use no-reply@texora.ai
        subject: `Proposal: ${proposal.title || proposal.proposalNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">New Proposal from ${proposal.tenant.organizationName}</h2>
            <p>Dear ${proposal.customerName},</p>
            <p>Please find attached the proposal for <strong>${proposal.title}</strong>.</p>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Proposal Number:</strong> ${proposal.proposalNumber}</p>
              <p style="margin: 8px 0 0 0;"><strong>Total Amount:</strong> ₹${proposal.totalAmount?.toLocaleString('en-IN') || 0}</p>
            </div>
            <p>If you have any questions, please don't hesitate to reach out.</p>
            <p>Best regards,<br>${proposal.tenant.organizationName}</p>
          </div>
        `,
        attachments: [{
          filename: `${proposal.proposalNumber || 'proposal'}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }]
      });
    }

    // Update status
    proposal.status = 'sent';
    proposal.sentAt = new Date();
    proposal.sentTo = recipientList;
    proposal.lastModifiedBy = req.user._id;

    await proposal.save();

    successResponse(res, 200, 'Proposal sent successfully via email', proposal);
  } catch (error) {
    console.error('Send proposal error:', error);
    errorResponse(res, 500, error.message || 'Failed to send proposal');
  }
};

/**
 * @desc    Clone/Duplicate proposal
 * @route   POST /api/proposals/:id/clone
 * @access  Private
 */
const cloneProposal = async (req, res) => {
  try {
    const original = await Proposal.findById(req.params.id);

    if (!original) {
      return errorResponse(res, 404, 'Proposal not found');
    }

    // Check tenant access
    if (original.tenant.toString() !== req.user.tenant.toString()) {
      return errorResponse(res, 403, 'Access denied');
    }

    const clonedData = original.toObject();
    delete clonedData._id;
    delete clonedData.proposalNumber;
    delete clonedData.createdAt;
    delete clonedData.updatedAt;
    delete clonedData.sentAt;
    delete clonedData.sentTo;
    delete clonedData.viewedAt;
    delete clonedData.viewedBy;

    clonedData.title = `${clonedData.title} (Copy)`;
    clonedData.status = 'draft';
    clonedData.createdBy = req.user._id;
    clonedData.lastModifiedBy = req.user._id;

    const clonedProposal = await Proposal.create(clonedData);

    const populated = await Proposal.findById(clonedProposal._id)
      .populate('customer', 'accountName firstName lastName email phone')
      .populate('createdBy', 'firstName lastName email');

    successResponse(res, 201, 'Proposal cloned successfully', populated);
  } catch (error) {
    console.error('Clone proposal error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Generate proposal PDF
 * @route   GET /api/proposals/:id/pdf
 * @access  Private
 */
const generatePDF = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id)
      .populate('tenant', 'organizationName legalName email phone headquarters logo invoiceLogo gstin panNumber cinNumber')
      .lean();

    if (!proposal) {
      return errorResponse(res, 404, 'Proposal not found');
    }

    // Check tenant access
    if (proposal.tenant._id.toString() !== req.user.tenant.toString()) {
      return errorResponse(res, 403, 'Access denied');
    }

    const pdfBuffer = await generateProposalPDF(proposal, proposal.tenant);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${proposal.proposalNumber || 'proposal'}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Generate PDF error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Assign proposal to manager
 * @route   POST /api/proposals/:id/assign
 * @access  Private
 */
const assignProposal = async (req, res) => {
  try {
    const { assignedTo } = req.body;

    if (!assignedTo) {
      return errorResponse(res, 400, 'Manager ID required');
    }

    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return errorResponse(res, 404, 'Proposal not found');
    }

    // Check access
    if (proposal.tenant.toString() !== req.user.tenant.toString()) {
      return errorResponse(res, 403, 'Access denied');
    }

    // Verify assignedTo user is a manager
    const User = require('../models/User');
    const manager = await User.findOne({
      _id: assignedTo,
      tenant: req.user.tenant,
      userType: 'TENANT_MANAGER'
    });

    if (!manager) {
      return errorResponse(res, 400, 'Invalid manager ID');
    }

    proposal.assignedTo = assignedTo;
    proposal.assignedBy = req.user._id;
    proposal.assignedAt = new Date();
    proposal.reviewStatus = 'pending';

    await proposal.save();

    successResponse(res, 200, 'Proposal assigned successfully', proposal);
  } catch (error) {
    console.error('Assign proposal error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get assigned proposals (for managers)
 * @route   GET /api/proposals/assigned/me
 * @access  Private
 */
const getAssignedProposals = async (req, res) => {
  try {
    const proposals = await Proposal.find({
      tenant: req.user.tenant,
      assignedTo: req.user._id
    })
      .populate('createdBy', 'name email')
      .populate('assignedBy', 'name email')
      .sort({ assignedAt: -1 });

    successResponse(res, 200, 'Assigned proposals retrieved', proposals);
  } catch (error) {
    console.error('Get assigned proposals error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Review proposal (Approve/Reject)
 * @route   POST /api/proposals/:id/review
 * @access  Private (Managers only)
 */
const reviewProposal = async (req, res) => {
  try {
    const { reviewStatus, reviewNotes } = req.body;

    if (!reviewStatus || !['approved', 'rejected', 'revision_needed'].includes(reviewStatus)) {
      return errorResponse(res, 400, 'Valid review status required');
    }

    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return errorResponse(res, 404, 'Proposal not found');
    }

    // Check if user is the assigned manager
    if (proposal.assignedTo?.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Only assigned manager can review');
    }

    proposal.reviewStatus = reviewStatus;
    proposal.reviewedBy = req.user._id;
    proposal.reviewedAt = new Date();
    proposal.reviewNotes = reviewNotes || '';

    await proposal.save();

    successResponse(res, 200, 'Proposal reviewed successfully', proposal);
  } catch (error) {
    console.error('Review proposal error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get managers list (for assignment dropdown)
 * @route   GET /api/proposals/managers/list
 * @access  Private
 */
const getManagersList = async (req, res) => {
  try {
    const User = require('../models/User');

    const managers = await User.find({
      tenant: req.user.tenant,
      userType: 'TENANT_MANAGER',
      isActive: true
    })
      .select('name email userType')
      .sort({ name: 1 });

    successResponse(res, 200, 'Managers list retrieved', managers);
  } catch (error) {
    console.error('Get managers error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

module.exports = {
  getProposals,
  getProposal,
  createProposal,
  updateProposal,
  deleteProposal,
  sendProposal,
  cloneProposal,
  generatePDF,
  assignProposal,
  getAssignedProposals,
  reviewProposal,
  getManagersList
};
