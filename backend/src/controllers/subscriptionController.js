const SubscriptionPlan = require('../models/SubscriptionPlan');
const Tenant           = require('../models/Tenant');
const Payment          = require('../models/Payment');
const PlanHistory      = require('../models/PlanHistory');
const { successResponse, errorResponse } = require('../utils/response');
const { createSubscriptionOrder, verifyPaymentSignature, fetchPayment } = require('../services/razorpayService');
const { sendPaymentSuccessEmail } = require('../utils/emailService');
const User = require('../models/User');

const PLAN_ORDER = { Free:0, Basic:1, Professional:2, Enterprise:3 };

/**
 * @desc    Get all subscription plans
 * @route   GET /api/subscriptions/plans
 * @access  Public
 */
const getAllPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true }).sort({ order: 1 });
    
    successResponse(res, 200, 'Plans retrieved successfully', plans);
  } catch (error) {
    console.error('Get plans error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get current subscription details
 * @route   GET /api/subscriptions/current
 * @access  Private (Tenant User)
 */
const getCurrentSubscription = async (req, res) => {
  try {
    const tenantId = req.user.tenant._id || req.user.tenant;

    const tenant = await Tenant.findById(tenantId)
      .populate('subscription.plan')
      .select('organizationName subscription usage');

    if (!tenant) {
      return errorResponse(res, 404, 'Tenant not found');
    }

    console.log('🔍 Tenant Subscription Debug:');
    console.log('   Organization:', tenant.organizationName);
    console.log('   Plan Name (direct):', tenant.subscription?.planName);
    console.log('   Plan ID:', tenant.subscription?.plan?._id);
    console.log('   Plan Populated:', tenant.subscription?.plan ? 'Yes' : 'No');
    console.log('   Plan Display Name:', tenant.subscription?.plan?.displayName);
    console.log('   Plan Limits:', tenant.subscription?.plan?.limits);
    console.log('   📊 ALL USAGE DATA:', {
      users: tenant.usage?.users || 0,
      leads: tenant.usage?.leads || 0,
      contacts: tenant.usage?.contacts || 0,
      deals: tenant.usage?.deals || 0,
      storage: tenant.usage?.storage || 0
    });

    // Calculate trial days remaining
    const trialDaysRemaining = tenant.getTrialDaysRemaining ? tenant.getTrialDaysRemaining() : 0;

    // Check if trial expired
    const isTrialExpired = tenant.isTrialExpired ? tenant.isTrialExpired() : false;

    // Check if subscription active
    const hasActiveSubscription = tenant.hasActiveSubscription ? tenant.hasActiveSubscription() : true;

    // Get payment history
    const payments = await Payment.find({ tenant: tenantId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('amount planName status paidAt invoiceNumber createdAt');

    const subscriptionData = {
      organization: tenant.organizationName,
      subscription: tenant.subscription,
      usage: tenant.usage,
      status: {
        isActive: hasActiveSubscription,
        isTrialActive: tenant.subscription?.isTrialActive || false,
        isTrialExpired: isTrialExpired,
        trialDaysRemaining: trialDaysRemaining
      },
      payments: payments
    };

    successResponse(res, 200, 'Subscription details retrieved', subscriptionData);
  } catch (error) {
    console.error('Get current subscription error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Upgrade/Change subscription plan (DEMO MODE - NO PAYMENT)
 * @route   POST /api/subscriptions/upgrade
 * @access  Private (Tenant Admin)
 */
const upgradePlan = async (req, res) => {
  try {
    const { planId, billingCycle, reason } = req.body;
    const tenantId = req.user.tenant._id || req.user.tenant;
    
    // Validation
    if (!planId || !billingCycle) {
      return errorResponse(res, 400, 'Plan ID and billing cycle are required');
    }
    
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return errorResponse(res, 400, 'Invalid billing cycle');
    }
    
    // Get plan
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) {
      return errorResponse(res, 404, 'Plan not found');
    }
    
    // Get tenant
    const tenant = await Tenant.findById(tenantId).populate('subscription.plan');
    if (!tenant) {
      return errorResponse(res, 404, 'Tenant not found');
    }
    
    // Calculate amount
    const amount = billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly;
    
    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    if (billingCycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
    
    // ============================================
    // 🎯 DEMO MODE - AUTO ACTIVATE WITHOUT PAYMENT
    // ============================================
    
    // Save plan change history BEFORE updating
    const fromPlan  = tenant.subscription?.planName || 'Free';
    const fromOrder = PLAN_ORDER[fromPlan] ?? 0;
    const toOrder   = PLAN_ORDER[plan.name] ?? 0;
    const changeType = fromPlan === plan.name ? 'new'
      : toOrder > fromOrder ? 'upgrade'
      : 'downgrade';

    await PlanHistory.create({
      tenant:      tenantId,
      fromPlan,
      toPlan:      plan.name,
      changeType,
      billingCycle,
      amount,
      reason:      reason || '',
      changedBy:   'tenant',
      changedAt:   new Date(),
    });

    // Update tenant subscription immediately
    tenant.subscription.plan = plan._id;
    tenant.subscription.planName = plan.name;
    tenant.subscription.status = 'active';
    tenant.subscription.isTrialActive = false;
    tenant.subscription.billingCycle = billingCycle;
    tenant.subscription.amount = amount;
    tenant.subscription.startDate = startDate;
    tenant.subscription.endDate = endDate;
    tenant.subscription.renewalDate = endDate;
    tenant.subscription.lastPaymentDate = new Date();
    tenant.subscription.lastPaymentAmount = amount;
    tenant.subscription.totalPaid += amount;
    
    // Update reseller commission if applicable
    if (tenant.reseller) {
      tenant.monthlySubscriptionAmount = amount;
    }
    
    await tenant.save();
    
    // Create demo payment record (marked as completed)
    const payment = await Payment.create({
      tenant: tenantId,
      plan: plan._id,
      planName: plan.name,
      amount: amount,
      currency: 'INR',
      billingCycle: billingCycle,
      billingPeriodStart: startDate,
      billingPeriodEnd: endDate,
      status: 'completed', // Auto-completed for demo
      paymentMethod: 'demo', // Demo payment method
      paidAt: new Date(),
      gatewayTransactionId: `DEMO-${Date.now()}`,
      gatewayOrderId: `ORDER-${Date.now()}`,
      paymentType: 'upgrade',
      notes: 'Demo mode - Auto-activated for presentation'
    });
    
    console.log(`✅ DEMO: Tenant ${tenant.organizationName} upgraded to ${plan.name}`);
    
    successResponse(res, 200, `Successfully upgraded to ${plan.name} plan!`, {
      subscription: tenant.subscription,
      invoice: {
        number: payment.invoiceNumber,
        url: payment.invoiceUrl
      },
      message: '🎉 Plan activated successfully! (Demo Mode)'
    });
    
  } catch (error) {
    console.error('Upgrade plan error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Cancel subscription
 * @route   POST /api/subscriptions/cancel
 * @access  Private (Tenant Admin)
 */
const cancelSubscription = async (req, res) => {
  try {
    const { reason } = req.body;
    const tenantId = req.user.tenant._id || req.user.tenant;

    const [tenant, freePlan] = await Promise.all([
      Tenant.findById(tenantId),
      SubscriptionPlan.findOne({ name: 'Free', isActive: true }),
    ]);

    if (!tenant) {
      return errorResponse(res, 404, 'Tenant not found');
    }
    if (!freePlan) {
      return errorResponse(res, 404, 'Free plan not found');
    }

    const fromPlan = tenant.subscription?.planName || 'Unknown';

    // Save downgrade history with cancel reason
    await PlanHistory.create({
      tenant:      tenantId,
      fromPlan,
      toPlan:      'Free',
      changeType:  'downgrade',
      reason:      reason || 'Plan cancelled by tenant',
      billingCycle:'monthly',
      amount:      0,
      changedBy:   'tenant',
      changedAt:   new Date(),
    });

    // Downgrade to Free — no payment needed, keep account active
    tenant.subscription.plan           = freePlan._id;
    tenant.subscription.planName       = 'Free';
    tenant.subscription.status         = 'active';
    tenant.subscription.billingCycle   = 'monthly';
    tenant.subscription.amount         = 0;
    tenant.subscription.isTrialActive  = false;
    tenant.subscription.autoRenew      = false;
    tenant.subscription.cancelledAt    = new Date();
    tenant.subscription.cancellationReason = reason || 'Plan cancelled by tenant';

    await tenant.save();

    successResponse(res, 200, 'Plan cancelled — moved to Free', {
      message: `Your plan has been downgraded to Free. Previous plan: ${fromPlan}`
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get all subscriptions (SAAS Admin)
 * @route   GET /api/subscriptions/all
 * @access  Private (SAAS Admin)
 */
const getAllSubscriptions = async (req, res) => {
  try {
    const { status, plan, page = 1, limit = 20 } = req.query;
    
    // Build filter
    const filter = {};
    if (status) {
      filter['subscription.status'] = status;
    }
    if (plan) {
      filter['subscription.planName'] = plan;
    }
    
    // Get tenants with pagination
    const tenants = await Tenant.find(filter)
      .populate('subscription.plan')
      .populate('reseller', 'firstName lastName email')
      .select('organizationName contactEmail subscription usage createdAt')
      .sort({ 'subscription.startDate': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Tenant.countDocuments(filter);
    
    // Calculate revenue
    const totalRevenue = await Tenant.aggregate([
      { $match: { 'subscription.status': 'active' } },
      { $group: { _id: null, total: { $sum: '$subscription.totalPaid' } } }
    ]);
    
    const monthlyRecurringRevenue = await Tenant.aggregate([
      { $match: { 'subscription.status': 'active', 'subscription.billingCycle': 'monthly' } },
      { $group: { _id: null, total: { $sum: '$subscription.amount' } } }
    ]);
    
    successResponse(res, 200, 'Subscriptions retrieved', {
      subscriptions: tenants,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalCount: count
      },
      revenue: {
        total: totalRevenue[0]?.total || 0,
        monthlyRecurring: monthlyRecurringRevenue[0]?.total || 0
      }
    });
    
  } catch (error) {
    console.error('Get all subscriptions error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Update tenant subscription (SAAS Admin)
 * @route   PUT /api/subscriptions/:tenantId
 * @access  Private (SAAS Admin)
 */
const updateTenantSubscription = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { planId, status, endDate } = req.body;
    
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return errorResponse(res, 404, 'Tenant not found');
    }
    
    // Update plan if provided
    if (planId) {
      const plan = await SubscriptionPlan.findById(planId);
      if (!plan) {
        return errorResponse(res, 404, 'Plan not found');
      }
      
      tenant.subscription.plan = plan._id;
      tenant.subscription.planName = plan.name;
      tenant.subscription.amount = plan.price.monthly;
    }
    
    // Update status if provided
    if (status) {
      tenant.subscription.status = status;
    }
    
    // Update end date if provided
    if (endDate) {
      tenant.subscription.endDate = new Date(endDate);
    }
    
    await tenant.save();
    
    successResponse(res, 200, 'Subscription updated', {
      subscription: tenant.subscription
    });
    
  } catch (error) {
    console.error('Update tenant subscription error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Update subscription plan features/limits (SAAS Admin)
 * @route   PUT /api/subscriptions/plans/:planId
 * @access  SAAS Admin only
 */
const updatePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const { features, limits, price, displayName, description, isPopular } = req.body;

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) return errorResponse(res, 404, 'Plan not found');

    // Merge features
    if (features && typeof features === 'object') {
      Object.keys(features).forEach(key => {
        plan.features[key] = features[key];
      });
    }
    // Merge limits
    if (limits && typeof limits === 'object') {
      Object.keys(limits).forEach(key => {
        plan.limits[key] = limits[key];
      });
    }
    if (price !== undefined) plan.price = { ...plan.price, ...price };
    if (displayName !== undefined) plan.displayName = displayName;
    if (description !== undefined) plan.description = description;
    if (isPopular !== undefined) plan.isPopular = isPopular;

    await plan.save();

    return successResponse(res, 200, 'Plan updated successfully', { plan });
  } catch (error) {
    console.error('updatePlan error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Create Razorpay order for plan upgrade
 * @route   POST /api/subscriptions/create-order
 */
const createPaymentOrder = async (req, res) => {
  try {
    const { planId, billingCycle } = req.body;
    if (!planId || !billingCycle) return errorResponse(res, 400, 'planId and billingCycle required');

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) return errorResponse(res, 404, 'Plan not found');

    const amount = billingCycle === 'yearly' ? plan.price.yearly : plan.price.monthly;
    if (!amount || amount <= 0) return errorResponse(res, 400, 'Invalid plan amount');

    const tenantId = req.user.tenant._id || req.user.tenant;
    const order = await createSubscriptionOrder({
      amount,
      receipt: `sub_${Date.now().toString(36)}`.slice(0, 40),
      notes: { planId: planId.toString(), billingCycle, tenantId: tenantId.toString() },
    });

    return successResponse(res, 200, 'Order created', {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      planName: plan.name,
    });
  } catch (error) {
    console.error('createPaymentOrder error:', error);
    return errorResponse(res, 500, 'Failed to create payment order');
  }
};

/**
 * @desc    Verify Razorpay payment & activate subscription
 * @route   POST /api/subscriptions/verify-payment
 */
const verifySubscriptionPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, billingCycle } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
      return errorResponse(res, 400, 'Missing payment fields');

    // Verify signature
    const valid = verifyPaymentSignature({ orderId: razorpay_order_id, paymentId: razorpay_payment_id, signature: razorpay_signature });
    if (!valid) return errorResponse(res, 400, 'Invalid payment signature');

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) return errorResponse(res, 404, 'Plan not found');

    const tenantId = req.user.tenant._id || req.user.tenant;
    const tenant = await Tenant.findById(tenantId).populate('subscription.plan');
    if (!tenant) return errorResponse(res, 404, 'Tenant not found');

    const amount = billingCycle === 'yearly' ? plan.price.yearly : plan.price.monthly;
    const startDate = new Date();
    const endDate = new Date();
    billingCycle === 'yearly' ? endDate.setFullYear(endDate.getFullYear() + 1) : endDate.setMonth(endDate.getMonth() + 1);

    // Save plan history
    const fromPlan = tenant.subscription?.planName || 'Free';
    await PlanHistory.create({
      tenant: tenantId, fromPlan, toPlan: plan.name,
      changeType: PLAN_ORDER[plan.name] > PLAN_ORDER[fromPlan] ? 'upgrade' : 'downgrade',
      billingCycle, amount, reason: 'Razorpay payment', changedBy: 'tenant', changedAt: new Date(),
    });

    // Update subscription
    tenant.subscription.plan = plan._id;
    tenant.subscription.planName = plan.name;
    tenant.subscription.status = 'active';
    tenant.subscription.isTrialActive = false;
    tenant.subscription.billingCycle = billingCycle;
    tenant.subscription.amount = amount;
    tenant.subscription.startDate = startDate;
    tenant.subscription.endDate = endDate;
    tenant.subscription.renewalDate = endDate;
    tenant.subscription.lastPaymentDate = new Date();
    tenant.subscription.lastPaymentAmount = amount;
    tenant.subscription.totalPaid = (tenant.subscription.totalPaid || 0) + amount;
    await tenant.save();

    // Create payment record
    await Payment.create({
      tenant: tenantId, plan: plan._id, planName: plan.name,
      amount, currency: 'INR', billingCycle,
      billingPeriodStart: startDate, billingPeriodEnd: endDate,
      status: 'completed', paymentMethod: 'razorpay',
      gatewayTransactionId: razorpay_payment_id,
      gatewayOrderId: razorpay_order_id,
      paymentType: 'upgrade', paidAt: new Date(),
    });

    // Send payment success email (non-blocking)
    try {
      const user = await User.findById(req.user._id).select('email firstName lastName');
      sendPaymentSuccessEmail({
        email: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        orgName: tenant.organizationName,
        planName: plan.name,
        amount,
        billingCycle,
        invoiceNumber: payment.invoiceNumber,
        startDate,
        endDate,
      }).catch(() => {});
    } catch (_) {}

    return successResponse(res, 200, `Successfully upgraded to ${plan.name}!`, { subscription: tenant.subscription });
  } catch (error) {
    console.error('verifySubscriptionPayment error:', error);
    return errorResponse(res, 500, 'Payment verification failed');
  }
};

/**
 * @desc    Get tenant payment history
 * @route   GET /api/subscriptions/payment-history
 */
const getPaymentHistory = async (req, res) => {
  try {
    const tenantId = req.user.tenant._id || req.user.tenant;
    const payments = await Payment.find({ tenant: tenantId })
      .sort({ createdAt: -1 })
      .populate('plan', 'name')
      .limit(50);
    return successResponse(res, 200, 'Payment history', payments);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch payment history');
  }
};

/**
 * @desc    Download receipt PDF for a payment
 * @route   GET /api/subscriptions/receipt/:paymentId
 */
const downloadReceipt = async (req, res) => {
  try {
    const tenantId = req.user.tenant._id || req.user.tenant;
    const payment = await Payment.findOne({ _id: req.params.paymentId, tenant: tenantId }).populate('plan', 'name');
    if (!payment) return errorResponse(res, 404, 'Payment not found');

    const tenant = await Tenant.findById(tenantId);
    const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${payment.invoiceNumber}.pdf`);
    doc.pipe(res);

    // Header
    doc.rect(0, 0, doc.page.width, 120).fill('#1EB980');
    doc.fillColor('#fff').fontSize(26).font('Helvetica-Bold').text('Unified CRM', 50, 35);
    doc.fontSize(12).font('Helvetica').text('Payment Receipt', 50, 68);
    doc.fontSize(10).text('support@texora.ai  |  texora.ai', 50, 88);

    // Invoice info
    doc.fillColor('#1e293b').fontSize(20).font('Helvetica-Bold').text('RECEIPT', 50, 145);
    doc.fontSize(10).font('Helvetica').fillColor('#64748b');
    doc.text(`Invoice No: ${payment.invoiceNumber}`, 50, 175);
    doc.text(`Date: ${fmt(payment.paidAt || payment.createdAt)}`, 50, 192);
    doc.text(`Status: PAID`, 50, 209);

    // Org info
    doc.fontSize(10).fillColor('#64748b').text('Bill To:', 350, 175);
    doc.fillColor('#1e293b').font('Helvetica-Bold').text(tenant?.organizationName || '', 350, 192);
    doc.font('Helvetica').fillColor('#64748b').text(req.user.email || '', 350, 209);

    // Table
    const tableY = 260;
    doc.rect(50, tableY, doc.page.width - 100, 35).fill('#f1f5f9');
    doc.fillColor('#374151').font('Helvetica-Bold').fontSize(10);
    doc.text('Description', 65, tableY + 12);
    doc.text('Billing Cycle', 270, tableY + 12);
    doc.text('Period', 380, tableY + 12);
    doc.text('Amount', 490, tableY + 12);

    const rowY = tableY + 45;
    doc.font('Helvetica').fillColor('#1e293b').fontSize(10);
    doc.text(`${payment.planName} Plan`, 65, rowY);
    doc.text(payment.billingCycle === 'yearly' ? 'Annual' : 'Monthly', 270, rowY);
    doc.text(`${fmt(payment.billingPeriodStart)} – ${fmt(payment.billingPeriodEnd)}`, 350, rowY, { width: 130 });
    doc.text(`INR ${(payment.amount || 0).toLocaleString('en-IN')}`, 490, rowY);

    doc.moveTo(50, rowY + 30).lineTo(doc.page.width - 50, rowY + 30).stroke('#e2e8f0');

    // Total
    const totalY = rowY + 50;
    doc.rect(350, totalY, doc.page.width - 400, 40).fill('#1EB980');
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(12);
    doc.text('Total Paid', 365, totalY + 13);
    doc.text(`INR ${(payment.amount || 0).toLocaleString('en-IN')}`, 460, totalY + 13);

    // Footer
    doc.fillColor('#94a3b8').font('Helvetica').fontSize(9)
      .text('Thank you for your business. This is a computer-generated receipt.', 50, doc.page.height - 60, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('downloadReceipt error:', error);
    return errorResponse(res, 500, 'Failed to generate receipt');
  }
};

module.exports = {
  getAllPlans,
  getCurrentSubscription,
  upgradePlan,
  createPaymentOrder,
  verifySubscriptionPayment,
  getPaymentHistory,
  downloadReceipt,
  cancelSubscription,
  getAllSubscriptions,
  updateTenantSubscription,
  updatePlan
};