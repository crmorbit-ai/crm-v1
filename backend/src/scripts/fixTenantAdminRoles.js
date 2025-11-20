require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const Tenant = require('../models/Tenant');

async function fixTenantAdminRoles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find Super Admin role
    const superAdminRole = await Role.findOne({ slug: 'super-admin', roleType: 'system' });

    if (!superAdminRole) {
      console.log('❌ Super Admin role not found! Please run ensureSuperAdminRole.js first.');
      return;
    }

    console.log(`✅ Found Super Admin role: ${superAdminRole.name}\n`);

    // Find all TENANT_ADMIN users without the Super Admin role
    const tenantAdmins = await User.find({
      userType: 'TENANT_ADMIN',
      $or: [
        { roles: { $exists: false } },
        { roles: { $size: 0 } },
        { roles: { $ne: superAdminRole._id } }
      ]
    }).populate('tenant');

    if (tenantAdmins.length === 0) {
      console.log('✅ All tenant admins already have proper roles assigned!\n');
      return;
    }

    console.log(`Found ${tenantAdmins.length} tenant admin(s) without Super Admin role:\n`);

    // Update each tenant admin
    let updatedCount = 0;
    for (const admin of tenantAdmins) {
      console.log(`Processing: ${admin.email}`);
      console.log(`  Organization: ${admin.tenant ? admin.tenant.organizationName : 'N/A'}`);
      console.log(`  Current roles: ${admin.roles ? admin.roles.length : 0}`);

      // Check if they already have the super-admin role
      const hasRole = admin.roles && admin.roles.some(
        roleId => roleId.toString() === superAdminRole._id.toString()
      );

      if (!hasRole) {
        // Add super-admin role
        admin.roles = admin.roles || [];
        admin.roles.push(superAdminRole._id);
        await admin.save();
        updatedCount++;
        console.log(`  ✅ Added Super Admin role\n`);
      } else {
        console.log(`  ℹ️  Already has Super Admin role\n`);
      }
    }

    console.log('========================================');
    console.log(`✅ Updated ${updatedCount} tenant admin(s)`);
    console.log('========================================\n');

    if (updatedCount > 0) {
      console.log('⚠️  IMPORTANT: Users need to logout and login again to refresh their permissions!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixTenantAdminRoles();
