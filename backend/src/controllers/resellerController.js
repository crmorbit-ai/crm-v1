const Reseller = require('../models/Reseller');
const Tenant = require('../models/Tenant');
const { successResponse, errorResponse } = require('../utils/response');
const { generateToken } = require('../utils/jwt');

/**
 * @desc    Register new reseller
 * @route   POST /api/resellers/register
 * @access  Public
 */
const registerReseller = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      companyName,
      occupation,
      website,
      address,
      reason
    } = req.body;

    // Check if email exists
    const existingReseller = await Reseller.findOne({ email });
    if (existingReseller) {
      return errorResponse(res, 400, 'Email already registered');
    }

    // Create reseller
    const reseller = await Reseller.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      companyName,
      occupation,
      website,
      address,
      reason,
      status: 'pending'
    });

    successResponse(res, 201, 'Reseller application submitted successfully. We will review and get back to you.', {
      reseller: {
        id: reseller._id,
        email: reseller.email,
        status: reseller.status
      }
    });

  } catch (error) {
    console.error('Register reseller error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Reseller login
 * @route   POST /api/resellers/login
 * @access  Public
 */
const resellerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, 'Please provide email and password');
    }

    const reseller = await Reseller.findOne({ email, isActive: true });

    if (!reseller) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    if (reseller.status !== 'approved') {
      return errorResponse(res, 403, `Your application is ${reseller.status}. Please contact admin.`);
    }

    const isPasswordValid = await reseller.comparePassword(password);

    if (!isPasswordValid) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    reseller.lastLogin = new Date();
    await reseller.save();

    const token = generateToken({ 
      _id: reseller._id, 
      userType: 'RESELLER',
      email: reseller.email 
    });

    const resellerResponse = reseller.toObject();
    delete resellerResponse.password;

    successResponse(res, 200, 'Login successful', {
      token,
      reseller: resellerResponse
    });

  } catch (error) {
    console.error('Reseller login error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get reseller dashboard data
 * @route   GET /api/resellers/dashboard
 * @access  Private (Reseller)
 */
const getResellerDashboard = async (req, res) => {
  try {
    const resellerId = req.user._id;

    const reseller = await Reseller.findById(resellerId);

    if (!reseller) {
      return errorResponse(res, 404, 'Reseller not found');
    }

    // ============================================
    // 🔧 FIX: Query Tenant collection directly
    // ============================================
    const tenants = await Tenant.find({ reseller: resellerId })
      .select('organizationName slug contactEmail subscription subscriptionStatus monthlySubscriptionAmount isActive createdAt')
      .sort({ createdAt: -1 });

    // Calculate stats
    const totalTenants = tenants.length;
    const activeTenants = tenants.filter(t => t.isActive).length;
    
    // Calculate monthly commission
    const totalMonthlyRevenue = tenants.reduce((sum, tenant) => {
      return sum + (tenant.monthlySubscriptionAmount || tenant.subscription?.amount || 0);
    }, 0);
    
    const totalMonthlyCommission = (totalMonthlyRevenue * reseller.commissionRate) / 100;

    successResponse(res, 200, 'Dashboard data retrieved', {
      reseller: {
        name: `${reseller.firstName} ${reseller.lastName}`,
        email: reseller.email,
        companyName: reseller.companyName,
        commissionRate: reseller.commissionRate,
        status: reseller.status,
        referralLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?ref=${reseller._id}`
      },
      stats: {
        totalTenants: totalTenants,
        activeTenants: activeTenants,
        totalMonthlyRevenue: totalMonthlyRevenue,
        totalMonthlyCommission: totalMonthlyCommission,
        totalEarnedCommission: reseller.totalCommission || 0
      },
      tenants: tenants.map(tenant => ({
        _id: tenant._id,
        name: tenant.organizationName,
        slug: tenant.slug,
        email: tenant.contactEmail,
        status: tenant.subscription?.status || tenant.subscriptionStatus || 'trial',
        planName: tenant.subscription?.planName || 'Free',
        isActive: tenant.isActive,
        monthlyAmount: tenant.monthlySubscriptionAmount || tenant.subscription?.amount || 0,
        commission: ((tenant.monthlySubscriptionAmount || tenant.subscription?.amount || 0) * reseller.commissionRate) / 100,
        joinedDate: tenant.createdAt
      }))
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get all resellers (SAAS Admin)
 * @route   GET /api/resellers
 * @access  Private (SAAS Admin)
 */
const getAllResellers = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;

    const resellers = await Reseller.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Reseller.countDocuments(query);

    // ============================================
    // 🔧 FIX: Get tenants for each reseller from Tenant collection
    // ============================================
    const resellersWithStats = await Promise.all(resellers.map(async (r) => {
      // Query tenants directly from Tenant collection
      const tenants = await Tenant.find({ reseller: r._id })
        .select('organizationName isActive monthlySubscriptionAmount subscription');
      
      const activeTenants = tenants.filter(t => t.isActive);
      const totalMonthlyRevenue = activeTenants.reduce((sum, t) => {
        return sum + (t.monthlySubscriptionAmount || t.subscription?.amount || 0);
      }, 0);
      const monthlyCommission = (totalMonthlyRevenue * r.commissionRate) / 100;

      return {
        ...r.toObject(),
        tenantsCount: tenants.length,
        stats: {
          totalTenants: tenants.length,
          activeTenants: activeTenants.length,
          monthlyCommission,
          totalCommission: r.totalCommission || 0
        }
      };
    }));

    successResponse(res, 200, 'Resellers retrieved', {
      resellers: resellersWithStats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get all resellers error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get single reseller details (SAAS Admin)
 * @route   GET /api/resellers/:id
 * @access  Private (SAAS Admin)
 */
const getResellerById = async (req, res) => {
  try {
    const reseller = await Reseller.findById(req.params.id).select('-password');

    if (!reseller) {
      return errorResponse(res, 404, 'Reseller not found');
    }

    // ============================================
    // 🔧 FIX: Query Tenant collection directly instead of using populate
    // ============================================
    const tenants = await Tenant.find({ reseller: req.params.id })
      .select('organizationName contactEmail subscription subscriptionStatus planType isActive monthlySubscriptionAmount createdAt')
      .sort({ createdAt: -1 });

    const activeTenants = tenants.filter(t => t.isActive);
    const totalMonthlyRevenue = activeTenants.reduce((sum, t) => {
      return sum + (t.monthlySubscriptionAmount || t.subscription?.amount || 0);
    }, 0);
    const monthlyCommission = (totalMonthlyRevenue * reseller.commissionRate) / 100;

    successResponse(res, 200, 'Reseller details retrieved', {
      reseller: reseller.toObject(),
      stats: {
        totalTenants: tenants.length,
        activeTenants: activeTenants.length,
        totalMonthlyRevenue,
        monthlyCommission,
        totalCommission: reseller.totalCommission || 0
      },
      tenants: tenants.map(t => ({
        id: t._id,
        organizationName: t.organizationName,
        contactEmail: t.contactEmail,
        planType: t.subscription?.planName || t.planType || 'Free',
        status: t.subscription?.status || t.subscriptionStatus || 'trial',
        isActive: t.isActive,
        monthlySubscription: t.monthlySubscriptionAmount || t.subscription?.amount || 0,
        monthlyCommission: ((t.monthlySubscriptionAmount || t.subscription?.amount || 0) * reseller.commissionRate) / 100,
        onboardedDate: t.createdAt
      }))
    });

  } catch (error) {
    console.error('Get reseller by ID error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Approve/Reject reseller (SAAS Admin)
 * @route   PUT /api/resellers/:id/status
 * @access  Private (SAAS Admin)
 */
const updateResellerStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['approved', 'rejected', 'suspended'].includes(status)) {
      return errorResponse(res, 400, 'Invalid status');
    }

    const reseller = await Reseller.findById(req.params.id);

    if (!reseller) {
      return errorResponse(res, 404, 'Reseller not found');
    }

    reseller.status = status;
    if (status === 'approved') {
      reseller.approvedBy = req.user._id;
      reseller.approvedAt = new Date();
    }

    await reseller.save();

    successResponse(res, 200, `Reseller ${status} successfully`, reseller);

  } catch (error) {
    console.error('Update reseller status error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Update reseller commission rate (SAAS Admin)
 * @route   PUT /api/resellers/:id/commission
 * @access  Private (SAAS Admin)
 */
const updateResellerCommission = async (req, res) => {
  try {
    const { commissionRate } = req.body;

    if (!commissionRate || commissionRate < 0 || commissionRate > 100) {
      return errorResponse(res, 400, 'Invalid commission rate');
    }

    const reseller = await Reseller.findByIdAndUpdate(
      req.params.id,
      { commissionRate },
      { new: true }
    ).select('-password');

    if (!reseller) {
      return errorResponse(res, 404, 'Reseller not found');
    }

    successResponse(res, 200, 'Commission rate updated', reseller);

  } catch (error) {
    console.error('Update commission error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get reseller's tenants/companies (SAAS Admin)
 * @route   GET /api/resellers/:id/tenants
 * @access  Private (SAAS Admin)
 */
const getResellerTenants = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const reseller = await Reseller.findById(id).select('firstName lastName email commissionRate');
    
    if (!reseller) {
      return errorResponse(res, 404, 'Reseller not found');
    }

    const tenants = await Tenant.find({ reseller: id })
      .select('organizationName slug contactEmail subscription subscriptionStatus isActive createdAt monthlySubscriptionAmount')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Tenant.countDocuments({ reseller: id });

    successResponse(res, 200, 'Reseller tenants retrieved', {
      reseller: {
        _id: reseller._id,
        name: `${reseller.firstName} ${reseller.lastName}`,
        email: reseller.email,
        commissionRate: reseller.commissionRate
      },
      tenants: tenants.map(t => ({
        _id: t._id,
        organizationName: t.organizationName,
        slug: t.slug,
        contactEmail: t.contactEmail,
        planName: t.subscription?.planName || 'Free',
        status: t.subscription?.status || t.subscriptionStatus || 'trial',
        isActive: t.isActive,
        monthlyAmount: t.monthlySubscriptionAmount || t.subscription?.amount || 0,
        createdAt: t.createdAt
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get reseller tenants error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

module.exports = {
  registerReseller,
  resellerLogin,
  getResellerDashboard,
  getAllResellers,
  getResellerById,
  updateResellerStatus,
  updateResellerCommission,
  getResellerTenants // NEW
};