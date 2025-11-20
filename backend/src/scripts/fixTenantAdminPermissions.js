require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const Tenant = require('../models/Tenant');

/**
 * Script to fix tenant admin users who have empty or missing roles
 * This ensures all tenant admins have full access to CRM features
 */

const TENANT_ADMIN_PERMISSIONS = [
  // User & Role Management
  { feature: 'user_management', actions: ['create', 'read', 'update', 'delete', 'manage'] },
  { feature: 'role_management', actions: ['create', 'read', 'update', 'delete', 'manage'] },
  { feature: 'group_management', actions: ['create', 'read', 'update', 'delete', 'manage'] },

  // CRM Features
  { feature: 'lead_management', actions: ['create', 'read', 'update', 'delete', 'convert', 'import', 'export', 'manage'] },
  { feature: 'account_management', actions: ['create', 'read', 'update', 'delete', 'export', 'manage'] },
  { feature: 'contact_management', actions: ['create', 'read', 'update', 'delete', 'export', 'manage'] },
  { feature: 'opportunity_management', actions: ['create', 'read', 'update', 'delete', 'manage'] },
  { feature: 'activity_management', actions: ['create', 'read', 'update', 'delete', 'manage'] },
  { feature: 'task_management', actions: ['create', 'read', 'update', 'delete', 'manage'] },
  { feature: 'meeting_management', actions: ['create', 'read', 'update', 'delete', 'manage'] },
  { feature: 'call_management', actions: ['create', 'read', 'update', 'delete', 'manage'] },
  { feature: 'note_management', actions: ['create', 'read', 'update', 'delete', 'manage'] },
  { feature: 'report_management', actions: ['read', 'create', 'export', 'manage'] },

  // Advanced Features
  { feature: 'advanced_analytics', actions: ['read', 'manage'] },
  { feature: 'api_access', actions: ['read', 'manage'] }
];

async function fixTenantAdminPermissions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Find all tenant admins
    const tenantAdmins = await User.find({
      userType: 'TENANT_ADMIN',
      isActive: true
    }).populate('roles tenant');

    console.log(`Found ${tenantAdmins.length} tenant admin(s)\n`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const admin of tenantAdmins) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Checking: ${admin.email}`);
      console.log(`Tenant: ${admin.tenant?.organizationName || 'Unknown'}`);
      console.log(`Current Roles: ${admin.roles.length}`);

      // Check if admin has any roles with proper permissions
      let hasProperPermissions = false;
      if (admin.roles && admin.roles.length > 0) {
        for (const role of admin.roles) {
          // Check if role has lead_management permission (as a proxy for full access)
          const hasLeadPerm = role.permissions.find(p => p.feature === 'lead_management');
          if (hasLeadPerm && hasLeadPerm.actions.includes('manage')) {
            hasProperPermissions = true;
            break;
          }
        }
      }

      if (hasProperPermissions) {
        console.log('✓ Already has proper permissions, skipping...');
        skippedCount++;
        continue;
      }

      // Create or update tenant admin role
      let tenantAdminRole = await Role.findOne({
        slug: 'tenant-admin',
        tenant: admin.tenant._id
      });

      if (tenantAdminRole) {
        console.log('ℹ Found existing tenant-admin role, updating permissions...');
        tenantAdminRole.permissions = TENANT_ADMIN_PERMISSIONS;
        tenantAdminRole.level = 100;
        await tenantAdminRole.save();
      } else {
        console.log('→ Creating new tenant-admin role...');
        tenantAdminRole = await Role.create({
          name: 'Tenant Admin',
          slug: 'tenant-admin',
          description: 'Full access to all tenant features and settings',
          tenant: admin.tenant._id,
          roleType: 'custom',
          permissions: TENANT_ADMIN_PERMISSIONS,
          level: 100,
          isActive: true
        });
        console.log('✓ Created tenant-admin role');
      }

      // Assign role to admin if not already assigned
      if (!admin.roles.find(r => r._id.toString() === tenantAdminRole._id.toString())) {
        admin.roles.push(tenantAdminRole._id);
        await admin.save();
        console.log('✓ Assigned tenant-admin role to user');
      }

      fixedCount++;
      console.log('✓ Tenant admin permissions fixed!');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Migration completed successfully!\n');
    console.log(`📊 Summary:`);
    console.log(`   • Total tenant admins: ${tenantAdmins.length}`);
    console.log(`   • Fixed: ${fixedCount}`);
    console.log(`   • Skipped (already correct): ${skippedCount}`);
    console.log('\n🎉 All tenant admins now have full CRM access!\n');

  } catch (error) {
    console.error('\n❌ Error fixing tenant admin permissions:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB\n');
    process.exit(0);
  }
}

// Run the script
console.log('\n🚀 Starting Tenant Admin Permission Fix...\n');
fixTenantAdminPermissions();
