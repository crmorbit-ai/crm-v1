const SubscriptionPlan = require('../models/SubscriptionPlan');
const Tenant = require('../models/Tenant');
const Payment = require('../models/Payment');
const { successResponse, errorResponse } = require('../utils/response');

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
    const { planId, billingCycle } = req.body;
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
    
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return errorResponse(res, 404, 'Tenant not found');
    }
    
    // Update subscription
    tenant.subscription.status = 'cancelled';
    tenant.subscription.autoRenew = false;
    tenant.subscription.cancelledAt = new Date();
    tenant.subscription.cancellationReason = reason;
    
    await tenant.save();
    
    successResponse(res, 200, 'Subscription cancelled', {
      message: 'Your subscription will remain active until ' + 
        (tenant.subscription.endDate ? tenant.subscription.endDate.toLocaleDateString() : 'end of period')
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

module.exports = {
  getAllPlans,
  getCurrentSubscription,
  upgradePlan,
  cancelSubscription,
  getAllSubscriptions,
  updateTenantSubscription
};