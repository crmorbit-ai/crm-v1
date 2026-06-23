const mongoose = require('mongoose');
require('dotenv').config();

async function fixLiveUsers() {
  try {
    console.log('🔧 Fixing live users...\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to:', mongoose.connection.name);

    const User = require('./src/models/User');

    // Fix 1: Add loginName to users without it
    const usersWithoutLoginName = await User.find({
      $or: [
        { loginName: { $exists: false } },
        { loginName: null },
        { loginName: '' }
      ]
    });

    console.log(`\n📋 Found ${usersWithoutLoginName.length} users without loginName`);

    for (const user of usersWithoutLoginName) {
      if (user.email) {
        user.loginName = user.email.toLowerCase();
        await user.save({ validateBeforeSave: false });
        console.log(`✅ Set loginName for: ${user.email}`);
      }
    }

    // Fix 2: Reset passwords for SAAS admins
    const saasAdmins = await User.find({
      userType: { $in: ['SAAS_OWNER', 'SAAS_ADMIN'] }
    });

    console.log(`\n👑 Found ${saasAdmins.length} SAAS admins`);

    const defaultPassword = '123456';

    for (const admin of saasAdmins) {
      console.log(`\n🔐 Resetting password for: ${admin.email}`);

      // Set plain password - pre-save hook will hash it
      admin.password = defaultPassword;
      await admin.save();

      console.log(`✅ Password reset to: ${defaultPassword}`);
    }

    // Fix 3: Show tenant admins
    const tenantAdmins = await User.find({
      userType: 'TENANT_ADMIN'
    }).limit(5).select('email loginName firstName lastName');

    console.log(`\n👤 Sample Tenant Admins (reset these manually if needed):`);
    tenantAdmins.forEach((u, i) => {
      console.log(`${i+1}. ${u.firstName} ${u.lastName}`);
      console.log(`   Email: ${u.email}`);
      console.log(`   LoginName: ${u.loginName || 'NOT SET'}`);
      console.log('');
    });

    console.log('\n✅ ✅ ✅ FIXES COMPLETE!\n');
    console.log('🔐 SAAS Admin Login Credentials:');
    saasAdmins.forEach(admin => {
      console.log(`   Email: ${admin.email}`);
      console.log(`   Password: ${defaultPassword}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixLiveUsers();
