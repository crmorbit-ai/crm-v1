// Quick script to check tenant's lifetime license status
const mongoose = require('mongoose');
const Tenant = require('./src/models/Tenant');
require('dotenv').config();

const checkLicense = async (tenantEmail) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const tenant = await Tenant.findOne({ email: tenantEmail })
      .populate('subscription.lifetimeLicense.coupon')
      .populate('subscription.lifetimeLicense.activatedBy', 'firstName lastName email');

    if (!tenant) {
      console.log('❌ Tenant not found:', tenantEmail);
      process.exit(1);
    }

    console.log('\n🏢 Tenant:', tenant.companyName || tenant.email);
    console.log('📧 Email:', tenant.email);
    console.log('\n━━━ SUBSCRIPTION STATUS ━━━');
    console.log('Status:', tenant.subscription.status);
    console.log('Trial Active:', tenant.subscription.isTrialActive);
    if (tenant.subscription.trialEndDate) {
      console.log('Trial End Date:', new Date(tenant.subscription.trialEndDate).toLocaleString());
    }

    console.log('\n━━━ LIFETIME LICENSE ━━━');
    if (tenant.subscription.lifetimeLicense && tenant.subscription.lifetimeLicense.enabled) {
      console.log('✅ LIFETIME LICENSE ACTIVE');
      console.log('Coupon Code:', tenant.subscription.lifetimeLicense.couponCode);
      console.log('Activated At:', new Date(tenant.subscription.lifetimeLicense.activatedAt).toLocaleString());
      if (tenant.subscription.lifetimeLicense.activatedBy) {
        console.log('Activated By:', tenant.subscription.lifetimeLicense.activatedBy.email);
      }
      console.log('\n🎉 Benefits:');
      console.log('  ✓ No expiry date (forever access)');
      console.log('  ✓ Unlimited users');
      console.log('  ✓ Unlimited storage');
      console.log('  ✓ All features unlocked');
    } else {
      console.log('❌ NO LIFETIME LICENSE');
      console.log('Tenant is on regular subscription/trial');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

// Get email from command line
const email = process.argv[2];
if (!email) {
  console.log('Usage: node check-license.js <tenant-email>');
  console.log('Example: node check-license.js tenant@example.com');
  process.exit(1);
}

checkLicense(email);
