const mongoose = require('mongoose');
const Role = require('../models/Role');
require('dotenv').config();

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

async function updateSuperAdminRole() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find Super Admin role
    const superAdminRole = await Role.findOne({ slug: 'super-admin' });

    if (!superAdminRole) {
      console.log('❌ Super Admin role not found!');
      return;
    }

    console.log(`Found role: ${superAdminRole.name}`);
    console.log(`Current permissions: ${superAdminRole.permissions.length} feature(s)\n`);

    // Add CRM permissions
    let updated = false;

    for (const crmPerm of CRM_PERMISSIONS) {
      const exists = superAdminRole.permissions.find(p => p.feature === crmPerm.feature);

      if (!exists) {
        superAdminRole.permissions.push(crmPerm);
        console.log(`✅ Added ${crmPerm.feature}`);
        updated = true;
      } else {
        console.log(`⚠️  ${crmPerm.feature} already exists`);
      }
    }

    if (updated) {
      await superAdminRole.save();
      console.log('\n✅ Super Admin role updated successfully!');
      console.log(`\nNew permissions: ${superAdminRole.permissions.length} feature(s)`);

      console.log('\n📋 All permissions:');
      superAdminRole.permissions.forEach(perm => {
        console.log(`  - ${perm.feature}: [${perm.actions.join(', ')}]`);
      });

      console.log('\n⚠️  IMPORTANT: Logout and login again to refresh your token!');
    } else {
      console.log('\n✅ No updates needed - all CRM permissions already exist!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

updateSuperAdminRole();
