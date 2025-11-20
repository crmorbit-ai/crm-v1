const Billing = require('../models/Billing');
const Subscription = require('../models/Subscription');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');

/**
 * @desc    Get all billings
 * @route   GET /api/billings
 * @access  Private (SAAS owner/admin or own billings)
 */
const getBillings = async (req, res) => {
  try {
    const { page = 1, limit = 10, paymentStatus, tenantId } = req.query;

    let query = {};

    // Tenant users can only see their own billings
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      query.tenant = req.user.tenant;
    } else if (tenantId) {
      query.tenant = tenantId;
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    const total = await Billing.countDocuments(query);

    const billings = await Billing.find(query)
      .populate('tenant', 'organizationName slug contactEmail')
      .populate('subscription', 'planType status')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ invoiceDate: -1 });

    successResponse(res, 200, 'Billings retrieved successfully', {
      billings,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get billings error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get single billing
 * @route   GET /api/billings/:id
 * @access  Private
 */
const getBilling = async (req, res) => {
  try {
    const billing = await Billing.findById(req.params.id)
      .populate('tenant')
      .populate('subscription');

    if (!billing) {
      return errorResponse(res, 404, 'Billing not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (billing.tenant._id.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    successResponse(res, 200, 'Billing retrieved successfully', billing);
  } catch (error) {
    console.error('Get billing error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Create billing/invoice
 * @route   POST /api/billings
 * @access  Private (SAAS owner/admin only)
 */
const createBilling = async (req, res) => {
  try {
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      return errorResponse(res, 403, 'Only SAAS admins can create billings');
    }

    const {
      tenant,
      subscription,
      billingPeriod,
      items,
      subtotal,
      tax,
      discount
    } = req.body;

    // Validation
    if (!tenant || !subscription || !billingPeriod || !items || !subtotal) {
      return errorResponse(res, 400, 'Please provide all required fields');
    }

    // Generate unique invoice number
    const invoiceCount = await Billing.countDocuments();
    const invoiceNumber = `INV-${Date.now()}-${String(invoiceCount + 1).padStart(5, '0')}`;

    // Calculate total
    const total = subtotal + (tax || 0) - (discount || 0);

    // Set due date (30 days from now)
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const billing = await Billing.create({
      tenant,
      subscription,
      invoiceNumber,
      invoiceDate: new Date(),
      dueDate,
      billingPeriod,
      items,
      subtotal,
      tax: tax || 0,
      discount: discount || 0,
      total,
      currency: 'USD',
      paymentStatus: 'pending'
    });

    // Log activity
    await logActivity(req, 'billing.created', 'Billing', billing._id, {
      invoiceNumber: billing.invoiceNumber,
      total
    });

    successResponse(res, 201, 'Billing created successfully', billing);
  } catch (error) {
    console.error('Create billing error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Update billing payment status
 * @route   PUT /api/billings/:id
 * @access  Private (SAAS owner/admin only)
 */
const updateBilling = async (req, res) => {
  try {
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      return errorResponse(res, 403, 'Only SAAS admins can update billings');
    }

    const billing = await Billing.findById(req.params.id);

    if (!billing) {
      return errorResponse(res, 404, 'Billing not found');
    }

    // Update allowed fields
    const allowedFields = ['paymentStatus', 'paymentMethod', 'transactionId', 'notes'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        billing[field] = req.body[field];
      }
    });

    // If payment status changed to paid, set paidAt timestamp
    if (req.body.paymentStatus === 'paid' && !billing.paidAt) {
      billing.paidAt = new Date();
    }

    await billing.save();

    // Log activity
    if (req.body.paymentStatus === 'paid') {
      await logActivity(req, 'billing.paid', 'Billing', billing._id, {
        invoiceNumber: billing.invoiceNumber
      });
    }

    successResponse(res, 200, 'Billing updated successfully', billing);
  } catch (error) {
    console.error('Update billing error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get billing statistics
 * @route   GET /api/billings/stats/overview
 * @access  Private (SAAS owner/admin only)
 */
const getBillingStats = async (req, res) => {
  try {
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      return errorResponse(res, 403, 'SAAS admin access required');
    }

    // Total revenue (all paid invoices)
    const paidBillings = await Billing.find({ paymentStatus: 'paid' });
    const totalRevenue = paidBillings.reduce((sum, bill) => sum + bill.total, 0);

    // Pending payments
    const pendingBillings = await Billing.find({ paymentStatus: 'pending' });
    const pendingAmount = pendingBillings.reduce((sum, bill) => sum + bill.total, 0);

    // Failed payments
    const failedCount = await Billing.countDocuments({ paymentStatus: 'failed' });

    // Revenue by month (last 6 months)
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const monthlyRevenue = await Billing.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          paidAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$paidAt' },
            month: { $month: '$paidAt' }
          },
          revenue: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    successResponse(res, 200, 'Billing statistics retrieved successfully', {
      totalRevenue,
      pendingAmount,
      failedCount,
      paidInvoicesCount: paidBillings.length,
      pendingInvoicesCount: pendingBillings.length,
      monthlyRevenue
    });
  } catch (error) {
    console.error('Get billing stats error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

module.exports = {
  getBillings,
  getBilling,
  createBilling,
  updateBilling,
  getBillingStats
};
