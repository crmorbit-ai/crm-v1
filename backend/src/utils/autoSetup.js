/**
 * autoSetup.js
 * Runs on every server start — safely creates default data if DB is empty.
 * Fully idempotent: skips if data already exists. No manual scripts needed.
 */

const autoSetup = async () => {
  // console.log('\n🔧 Running auto-setup checks...');
  await Promise.all([
    ensureSubscriptionPlans(),
    ensureSuperAdminRole(),
    ensureDataCenterProducts(),
  ]);
  await cleanInvalidProfileData();
  // console.log('✅ Auto-setup complete\n');
};

// ─── 1. Subscription Plans ────────────────────────────────────────────────────
const ensureSubscriptionPlans = async () => {
  try {
    const SubscriptionPlan = require('../models/SubscriptionPlan');
    const count = await SubscriptionPlan.countDocuments();
    if (count > 0) return;

    await SubscriptionPlan.insertMany([
      {
        name: 'Free', slug: 'free', displayName: 'Free Plan',
        description: 'Perfect for trying out the platform',
        price: { monthly: 0, yearly: 0 }, trialDays: 15,
        limits: { users: 5, leads: 100, contacts: 100, deals: 50, storage: 512, emailsPerDay: 50 },
        features: {
          leadManagement: true, contactManagement: true, dealTracking: true, taskManagement: true,
          emailIntegration: false, customFields: false, crossOrgHierarchy: false, salesMonetization: false,
        },
        isActive: true, isPopular: false, order: 0,
      },
      {
        name: 'Basic', slug: 'basic', displayName: 'Basic Plan',
        description: 'Great for small teams',
        price: { monthly: 999, yearly: 9990 }, trialDays: 15,
        limits: { users: 10, leads: 1000, contacts: 1000, deals: 200, storage: 5120, emailsPerDay: 500 },
        features: {
          leadManagement: true, contactManagement: true, dealTracking: true, taskManagement: true,
          emailIntegration: true, customFields: false, crossOrgHierarchy: false, salesMonetization: false,
        },
        isActive: true, isPopular: false, order: 1,
      },
      {
        name: 'Professional', slug: 'professional', displayName: 'Professional Plan',
        description: 'Best for growing businesses',
        price: { monthly: 2999, yearly: 29990 }, trialDays: 15,
        limits: { users: 25, leads: 10000, contacts: 10000, deals: 1000, storage: 20480, emailsPerDay: 2000 },
        features: {
          leadManagement: true, contactManagement: true, dealTracking: true, taskManagement: true,
          emailIntegration: true, customFields: true, crossOrgHierarchy: true, salesMonetization: true,
        },
        isActive: true, isPopular: true, order: 2,
      },
      {
        name: 'Enterprise', slug: 'enterprise', displayName: 'Enterprise Plan',
        description: 'Complete solution for large organizations',
        price: { monthly: 9999, yearly: 99990 }, trialDays: 15,
        limits: { users: -1, leads: -1, contacts: -1, deals: -1, storage: -1, emailsPerDay: -1 },
        features: {
          leadManagement: true, contactManagement: true, dealTracking: true, taskManagement: true,
          emailIntegration: true, customFields: true, crossOrgHierarchy: true, salesMonetization: true,
        },
        isActive: true, isPopular: false, order: 3,
      },
    ]);
    console.log('  ✅ Subscription plans created (Free, Basic, Professional, Enterprise)');
  } catch (err) {
    console.error('  ❌ ensureSubscriptionPlans:', err.message);
  }
};

// ─── 2. Super Admin Role ──────────────────────────────────────────────────────
const ensureSuperAdminRole = async () => {
  try {
    const Role = require('../models/Role');
    const exists = await Role.findOne({ slug: 'super-admin', roleType: 'system' });
    if (exists) return;

    const ALL_FEATURES = [
      'user_management', 'role_management', 'group_management',
      'lead_management', 'contact_management', 'account_management',
      'opportunity_management', 'data_center', 'proposal_management',
      'quotation_management', 'invoice_management', 'purchase_order_management',
      'rfi_management', 'product_management', 'task_management',
      'meeting_management', 'call_management', 'email_management',
      'subscription_management', 'field_management', 'audit_logs',
      'activity_management', 'report_management',
    ];

    await Role.create({
      name: 'Super Admin',
      slug: 'super-admin',
      description: 'Full access to all features',
      tenant: null,
      roleType: 'system',
      permissions: ALL_FEATURES.map(f => ({ feature: f, actions: ['manage'] })),
      level: 100,
      isActive: true,
    });
    console.log('  ✅ Super Admin role created');
  } catch (err) {
    console.error('  ❌ ensureSuperAdminRole:', err.message);
  }
};

// ─── 3. Data Center Products ──────────────────────────────────────────────────
const ensureDataCenterProducts = async () => {
  try {
    const { getDataCenterConnection } = require('../config/database');
    const dcConn = getDataCenterConnection();
    if (!dcConn) return;

    const Product = dcConn.model('Product');
    const count = await Product.countDocuments();
    if (count > 0) return;

    await Product.insertMany([
      {
        name: 'email', displayName: 'Email Communication', icon: '📧', type: 'email',
        description: 'Send bulk emails to DataCenter candidates',
        pricing: { pricePerUnit: 0.5, currency: 'INR', unit: 'email' },
        packages: [
          { credits: 1000,  price: 450,  discount: 10, isPopular: false },
          { credits: 5000,  price: 2000, discount: 20, isPopular: true  },
          { credits: 10000, price: 3500, discount: 30, isPopular: false },
        ],
        features: { bulkEnabled: true, apiAccess: true, analytics: true },
        isActive: true, order: 1,
      },
      {
        name: 'whatsapp', displayName: 'WhatsApp Messages', icon: '💬', type: 'whatsapp',
        description: 'Send bulk WhatsApp messages to candidates',
        pricing: { pricePerUnit: 1, currency: 'INR', unit: 'message' },
        packages: [
          { credits: 500,  price: 450,  discount: 10, isPopular: false },
          { credits: 2000, price: 1600, discount: 20, isPopular: true  },
          { credits: 5000, price: 3500, discount: 30, isPopular: false },
        ],
        features: { bulkEnabled: true, apiAccess: true, analytics: true },
        isActive: true, order: 2,
      },
      {
        name: 'sms', displayName: 'SMS Messages', icon: '📱', type: 'sms',
        description: 'Send bulk SMS to candidates',
        pricing: { pricePerUnit: 0.25, currency: 'INR', unit: 'SMS' },
        packages: [
          { credits: 1000,  price: 225,  discount: 10, isPopular: false },
          { credits: 5000,  price: 1000, discount: 20, isPopular: true  },
          { credits: 10000, price: 1750, discount: 30, isPopular: false },
        ],
        features: { bulkEnabled: true, apiAccess: true, analytics: true },
        isActive: true, order: 3,
      },
      {
        name: 'call', displayName: 'Call Minutes', icon: '📞', type: 'call',
        description: 'Automated calling to candidates',
        pricing: { pricePerUnit: 1, currency: 'INR', unit: 'minute' },
        packages: [
          { credits: 100,  price: 90,  discount: 10, isPopular: false },
          { credits: 500,  price: 400, discount: 20, isPopular: true  },
          { credits: 1000, price: 700, discount: 30, isPopular: false },
        ],
        features: { bulkEnabled: true, apiAccess: false, analytics: true },
        isActive: true, order: 4,
      },
    ]);
    console.log('  ✅ Data Center products created (Email, WhatsApp, SMS, Call)');
  } catch (err) {
    console.error('  ❌ ensureDataCenterProducts:', err.message);
  }
};

// ─── Clean invalid profile data (one-time fix) ───────────────────────────────
const cleanInvalidProfileData = async () => {
  try {
    const Tenant = require('../models/Tenant');

    // Valid URL: must start with http:// or https://
    const isInvalidUrl = (val) => val && typeof val === 'string' && val.trim().length > 0
      && !val.trim().startsWith('http://') && !val.trim().startsWith('https://');

    // Valid name: only letters, spaces, hyphens
    const isInvalidName = (val) => val && typeof val === 'string' && val.trim().length > 0
      && !/^[a-zA-Z\s\-]+$/.test(val.trim());

    const tenants = await Tenant.find({});
    let fixed = 0;

    for (const t of tenants) {
      let changed = false;

      // Fix invalid social media URLs
      const sm = t.socialMedia || {};
      ['linkedin', 'twitter', 'facebook', 'instagram'].forEach(k => {
        if (isInvalidUrl(sm[k])) { sm[k] = ''; changed = true; }
      });
      if (changed) t.socialMedia = sm;

      // Fix invalid website URL
      if (isInvalidUrl(t.website)) { t.website = ''; changed = true; }

      // Fix invalid keyContact name
      const kc = t.keyContact || {};
      if (isInvalidName(kc.name)) { kc.name = ''; t.keyContact = kc; changed = true; }

      // Fix invalid phone numbers (letters OR all-zeros)
      const isInvalidPhone = (v) => v && (/[a-zA-Z]/.test(v) || (!/[1-9]/.test(v) && v.trim().length > 0));
      ['contactPhone', 'alternatePhone'].forEach(k => {
        if (isInvalidPhone(t[k])) { t[k] = ''; changed = true; }
      });
      if (isInvalidPhone(t.keyContact?.phone)) {
        kc.phone = ''; t.keyContact = kc; changed = true;
      }

      if (changed) { await t.save(); fixed++; }
    }

    if (fixed > 0) console.log(`  ✅ Cleaned invalid profile data in ${fixed} tenant(s)`);
  } catch (err) {
    console.error('  ❌ cleanInvalidProfileData:', err.message);
  }
};

module.exports = { autoSetup };
