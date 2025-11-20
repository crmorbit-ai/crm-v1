const mongoose = require('mongoose');
const Role = require('../models/Role');
require('dotenv').config();

/**
 * Script to add CRM permissions to existing Tenant Admin roles
 * Run this script once to update existing roles with new CRM permissions
 */

const CRM_PERMISSIONS = [
  {
    feature: 'lead_management',
    actions: ['create', 'read', 'update', 'delete', 'convert', 'import', 'export', 'manage']
  },
  {
    feature: 'account_management',
    actions: ['create', 'read', 'update', 'delete', 'export', 'manage']
  },
  {
    feature: 'contact_management',
    actions: ['create', 'read', 'update', 'delete', 'export', 'manage']
  },
  {
    feature: 'activity_management',
    actions: ['create', 'read', 'update', 'delete', 'manage']
  },
  {
    feature: 'report_management',
    actions: ['read', 'create', 'export', 'manage']
  }
];

async function addCrmPermissions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all Tenant Admin roles
    const tenantAdminRoles = await Role.find({
      slug: { $in: ['tenant-admin', 'tenant_admin'] }
    });

    console.log(`Found ${tenantAdminRoles.length} Tenant Admin role(s)`);

    for (const role of tenantAdminRoles) {
      console.log(`\nUpdating role: ${role.name} (${role._id})`);

      // Add CRM permissions if they don't exist
      let updated = false;

      for (const crmPerm of CRM_PERMISSIONS) {
        const exists = role.permissions.find(p => p.feature === crmPerm.feature);

        if (!exists) {
          role.permissions.push(crmPerm);
          console.log(`  ✓ Added ${crmPerm.feature}`);
          updated = true;
        } else {
          console.log(`  - ${crmPerm.feature} already exists`);
        }
      }

      if (updated) {
        await role.save();
        console.log(`  ✓ Role updated successfully!`);
      } else {
        console.log(`  - No updates needed`);
      }
    }

    // Also update Tenant Manager roles with read-only CRM access
    const tenantManagerRoles = await Role.find({
      slug: { $in: ['tenant-manager', 'tenant_manager'] }
    });

    console.log(`\nFound ${tenantManagerRoles.length} Tenant Manager role(s)`);

    for (const role of tenantManagerRoles) {
      console.log(`\nUpdating role: ${role.name} (${role._id})`);

      let updated = false;

      // Give managers create, read, update access (not delete or manage)
      const managerPermissions = [
        {
          feature: 'lead_management',
          actions: ['create', 'read', 'update', 'convert', 'import', 'export']
        },
        {
          feature: 'account_management',
          actions: ['create', 'read', 'update', 'export']
        },
        {
          feature: 'contact_management',
          actions: ['create', 'read', 'update', 'export']
        },
        {
          feature: 'activity_management',
          actions: ['create', 'read', 'update']
        },
        {
          feature: 'report_management',
          actions: ['read', 'export']
        }
      ];

      for (const crmPerm of managerPermissions) {
        const exists = role.permissions.find(p => p.feature === crmPerm.feature);

        if (!exists) {
          role.permissions.push(crmPerm);
          console.log(`  ✓ Added ${crmPerm.feature}`);
          updated = true;
        } else {
          console.log(`  - ${crmPerm.feature} already exists`);
        }
      }

      if (updated) {
        await role.save();
        console.log(`  ✓ Role updated successfully!`);
      } else {
        console.log(`  - No updates needed`);
      }
    }

    console.log('\n✅ CRM permissions added successfully!');
    console.log('\nYou can now:');
    console.log('1. Login as Tenant Admin');
    console.log('2. Access Leads page');
    console.log('3. Create and manage leads');

  } catch (error) {
    console.error('Error adding CRM permissions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
addCrmPermissions();
