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

    const proposalData = {
      ...req.body,
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
      .populate('tenant', 'organizationName email logo');

    if (!proposal) {
      return errorResponse(res, 404, 'Proposal not found');
    }

    // Check tenant access
    if (proposal.tenant._id.toString() !== req.user.tenant.toString()) {
      return errorResponse(res, 403, 'Access denied');
    }

    // TODO: Implement email sending with PDF attachment
    // For now, just update status

    proposal.status = 'sent';
    proposal.sentAt = new Date();
    proposal.sentTo = recipients || [proposal.customerEmail];
    proposal.lastModifiedBy = req.user._id;

    await proposal.save();

    successResponse(res, 200, 'Proposal sent successfully', proposal);
  } catch (error) {
    console.error('Send proposal error:', error);
    errorResponse(res, 500, 'Server error');
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
      .populate('tenant', 'organizationName legalName email phone address logo invoiceLogo signature')
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

module.exports = {
  getProposals,
  getProposal,
  createProposal,
  updateProposal,
  deleteProposal,
  sendProposal,
  cloneProposal,
  generatePDF
};
