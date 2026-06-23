const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  createUser,
  bulkCreateUsers,
  updateUser,
  deleteUser,
  assignRoles,
  assignGroups,
  resetUserPassword,
  deactivateUser,
  reactivateUser,
  permanentDeleteUser,
  sendUserCreationOTP,
  verifyUserCreationOTP
} = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// All other routes are protected
router.use(protect);

// Simple list endpoint for assignment (protected but no permission check)
router.get('/list/all', async (req, res) => {
  try {
    const User = require('../models/User');
    console.log('📌 /users/list/all called, tenant:', req.user?.tenant);

    // Get users from same tenant
    const tenantId = req.user?.tenant;
    if (!tenantId) {
      console.log('⚠️ No tenant found');
      return res.json({ success: true, data: [] });
    }

    const users = await User.find({
      tenant: tenantId,
      isActive: true
    })
      .select('_id firstName lastName email userType')
      .limit(100);

    console.log('✓ Returning', users.length, 'users for tenant', tenantId);
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.json({ success: true, data: [] });
  }
});

// User creation OTP verification (before /:id routes)
router.post('/send-creation-otp', sendUserCreationOTP);
router.post('/verify-creation-otp', verifyUserCreationOTP);

// User CRUD routes
router.get('/', requirePermission('user_management', 'read'), getUsers);
router.post('/', requirePermission('user_management', 'create'), createUser);
router.post('/bulk', requirePermission('user_management', 'create'), bulkCreateUsers);

// Specific ID routes (before generic /:id routes)
router.post('/:id/send-credentials', requirePermission('user_management', 'manage'), async (req, res) => {
  try {
    const User = require('../models/User');
    const Tenant = require('../models/Tenant');
    const bcrypt = require('bcryptjs');
    const { sendUserCredentialsEmail } = require('../utils/emailService');

    const user = await User.findById(req.params.id).populate('roles');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get password from request body (admin enters it)
    const password = req.body.password;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(req.params.id, {
      password: hashedPassword
    });

    // Get tenant for organization name
    const tenant = await Tenant.findById(user.tenant);
    const organizationName = tenant?.organizationName || tenant?.companyName || 'Your Organization';

    // Extract permissions from roles
    const allPermissions = new Set();
    user.roles?.forEach(role => {
      role.permissions?.forEach(perm => {
        if (perm.actions?.length > 0) {
          allPermissions.add(perm.feature);
        }
      });
    });

    const permissions = Array.from(allPermissions).map(slug => {
      const featureMap = {
        'user_management': 'Team Management',
        'lead_management': 'Leads',
        'contact_management': 'Contacts',
        'account_management': 'Accounts',
        'opportunity_management': 'Opportunities',
        'data_center': 'Customers',
        'quotation_management': 'Quotations',
        'invoice_management': 'Invoices',
        'purchase_order_management': 'Purchase Orders',
        'rfi_management': 'RFI',
        'product_management': 'Products',
        'task_management': 'Tasks',
        'meeting_management': 'Meetings',
        'call_management': 'Calls',
        'email_management': 'Emails',
        'subscription_management': 'Subscription & Billing',
        'audit_logs': 'Audit Logs',
        'org_chart': 'Org Chart',
        'org_hierarchy': 'Org Hierarchy',
        'role_template': 'Role Template',
        'templates': 'Templates',
        'document_templates': 'Document Templates',
        'email_templates': 'Email Templates',
        'social_media': 'Social Media',
      };
      return featureMap[slug] || slug;
    });

    await sendUserCredentialsEmail({
      userEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`,
      loginName: user.loginName || user.email,
      password: password,
      organizationName,
      permissions
    });

    console.log('✅ Sending success response');
    res.json({ success: true, message: 'Credentials email sent successfully' });
  } catch (error) {
    console.error('❌ Send credentials error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to send credentials email' });
  }
});

// Role and group assignment
router.post('/:id/assign-roles', requirePermission('user_management', 'manage'), assignRoles);
router.post('/:id/assign-groups', requirePermission('user_management', 'manage'), assignGroups);

// Admin password reset
router.put('/:id/reset-password', requirePermission('user_management', 'manage'), resetUserPassword);

// Generic ID routes (at the end)
router.get('/:id', requirePermission('user_management', 'read'), getUser);
router.put('/:id', requirePermission('user_management', 'update'), updateUser);
router.delete('/:id', requirePermission('user_management', 'delete'), deleteUser);

// SAAS Admin - User management
const { requireSaasAccess } = require('../middleware/auth');
router.post('/:id/deactivate', requireSaasAccess, deactivateUser);
router.post('/:id/reactivate', requireSaasAccess, reactivateUser);
router.delete('/:id/permanent', requireSaasAccess, permanentDeleteUser);

module.exports = router;
