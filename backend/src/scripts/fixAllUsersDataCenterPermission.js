require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const Tenant = require('../models/Tenant');

/**
 * Script to assign tenant-admin role to all users who don't have data_center permission
 */

async function fixAllUsersDataCenterPermission() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Get all users with their roles populated
    const users = await User.find({
      userType: { $in: ['TENANT_ADMIN', 'TENANT_MANAGER', 'TENANT_USER'] }
    })
      .populate('roles')
      .populate('tenant');

    console.log(`Found ${users.length} tenant users\n`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`User: ${user.email}`);
      console.log(`Name: ${user.firstName} ${user.lastName}`);
      console.log(`Type: ${user.userType}`);
      console.log(`Tenant: ${user.tenant?.organizationName || 'None'}`);

      // Check if user has any roles
      if (!user.roles || user.roles.length === 0) {
        console.log('❌ No roles assigned');

        // Find tenant-admin role for this user's tenant
        const tenantAdminRole = await Role.findOne({
          slug: 'tenant-admin',
          tenant: user.tenant
        });

        if (tenantAdminRole) {
          user.roles = [tenantAdminRole._id];
          await user.save();
          console.log('✓ Assigned tenant-admin role');
          fixedCount++;
        } else {
          console.log('⚠️  No tenant-admin role found for this tenant');
        }
      } else {
        // Check if any role has data_center permission
        const hasDataCenterPermission = user.roles.some(role =>
          role.permissions.some(perm => perm.feature === 'data_center')
        );

        if (hasDataCenterPermission) {
          console.log('✓ Already has data_center permission');
          skippedCount++;
        } else {
          console.log('❌ No data_center permission found');

          // Find tenant-admin role for this user's tenant
          const tenantAdminRole = await Role.findOne({
            slug: 'tenant-admin',
            tenant: user.tenant
          });

          if (tenantAdminRole) {
            // Add tenant-admin role if not already assigned
            if (!user.roles.some(r => r._id.equals(tenantAdminRole._id))) {
              user.roles.push(tenantAdminRole._id);
              await user.save();
              console.log('✓ Added tenant-admin role');
              fixedCount++;
            }
          } else {
            console.log('⚠️  No tenant-admin role found for this tenant');
          }
        }
      }
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Update completed successfully!\n');
    console.log(`📊 Summary:`);
    console.log(`   • Total users checked: ${users.length}`);
    console.log(`   • Fixed: ${fixedCount}`);
    console.log(`   • Already has permission: ${skippedCount}`);
    console.log('\n🎉 All users should now have data_center access!\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB\n');
    process.exit(0);
  }
}

// Run the script
console.log('\n🚀 Fixing data_center permission for all users...\n');
fixAllUsersDataCenterPermission();
