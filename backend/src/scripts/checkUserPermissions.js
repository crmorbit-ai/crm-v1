require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const Tenant = require('../models/Tenant');
const Group = require('../models/Group');
const { hasPermission } = require('../utils/permissions');

/**
 * Script to check a specific user's permissions
 */

async function checkUserPermissions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Get email from command line argument
    const email = process.argv[2];

    if (!email) {
      console.log('Usage: node checkUserPermissions.js <email>');
      process.exit(1);
    }

    // Find user with populated roles and groups
    const user = await User.findOne({ email })
      .populate('roles')
      .populate({
        path: 'groups',
        populate: {
          path: 'roles'
        }
      })
      .populate('tenant');

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log('════════════════════════════════════════════════════');
    console.log(`User: ${user.email}`);
    console.log(`Name: ${user.firstName} ${user.lastName}`);
    console.log(`Type: ${user.userType}`);
    console.log(`Tenant: ${user.tenant?.organizationName || 'None'}`);
    console.log(`Active: ${user.isActive}`);
    console.log('════════════════════════════════════════════════════\n');

    console.log('Roles:');
    if (user.roles && user.roles.length > 0) {
      user.roles.forEach((role, index) => {
        console.log(`\n  ${index + 1}. ${role.name} (${role.slug})`);
        console.log(`     Level: ${role.level}`);
        console.log(`     Permissions:`);
        role.permissions.forEach(perm => {
          console.log(`       - ${perm.feature}: [${perm.actions.join(', ')}]`);
        });
      });
    } else {
      console.log('  No roles assigned');
    }

    console.log('\n════════════════════════════════════════════════════');
    console.log('Permission Checks:');
    console.log('════════════════════════════════════════════════════');

    const permissionsToCheck = [
      { feature: 'data_center', action: 'read' },
      { feature: 'data_center', action: 'create' },
      { feature: 'data_center', action: 'manage' },
      { feature: 'lead_management', action: 'read' },
      { feature: 'account_management', action: 'read' },
      { feature: 'user_management', action: 'read' }
    ];

    permissionsToCheck.forEach(({ feature, action }) => {
      const result = hasPermission(user, feature, action);
      const status = result ? '✓' : '✗';
      console.log(`  ${status} ${feature}.${action}: ${result}`);
    });

    console.log('\n════════════════════════════════════════════════════\n');

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
checkUserPermissions();
