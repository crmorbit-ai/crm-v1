require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');

/**
 * Script to add data_center permission to all existing tenant admin roles
 */

async function addDataCenterPermission() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Find all tenant-admin roles
    const tenantAdminRoles = await Role.find({
      slug: 'tenant-admin'
    });

    console.log(`Found ${tenantAdminRoles.length} tenant-admin role(s)\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const role of tenantAdminRoles) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Checking Role: ${role.name} (ID: ${role._id})`);

      // Check if role already has data_center permission
      const hasDataCenter = role.permissions.find(p => p.feature === 'data_center');

      if (hasDataCenter) {
        console.log('✓ Already has data_center permission, skipping...');
        skippedCount++;
        continue;
      }

      // Add data_center permission
      role.permissions.push({
        feature: 'data_center',
        actions: ['create', 'read', 'update', 'delete', 'export', 'move_to_leads', 'manage']
      });

      await role.save();
      console.log('✓ Added data_center permission to role');
      updatedCount++;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Update completed successfully!\n');
    console.log(`📊 Summary:`);
    console.log(`   • Total tenant-admin roles: ${tenantAdminRoles.length}`);
    console.log(`   • Updated: ${updatedCount}`);
    console.log(`   • Skipped (already has permission): ${skippedCount}`);
    console.log('\n🎉 All tenant admin roles now have data_center permission!\n');

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
console.log('\n🚀 Adding data_center permission to tenant-admin roles...\n');
addDataCenterPermission();
