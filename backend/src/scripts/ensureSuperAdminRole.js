require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('../models/Role');

async function ensureSuperAdminRole() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Check if Super Admin role exists
    let superAdminRole = await Role.findOne({ slug: 'super-admin', roleType: 'system' });

    if (superAdminRole) {
      console.log('✅ Super Admin role already exists!');
      console.log(`   Role: ${superAdminRole.name}`);
      console.log(`   Permissions: ${superAdminRole.permissions.length} feature(s)\n`);

      console.log('📋 Permissions:');
      superAdminRole.permissions.forEach(perm => {
        console.log(`   - ${perm.feature}: [${perm.actions.join(', ')}]`);
      });
    } else {
      console.log('⚠️  Super Admin role not found. Creating it now...\n');

      superAdminRole = await Role.create({
        name: 'Super Admin',
        slug: 'super-admin',
        description: 'Full access to all features',
        tenant: null,
        roleType: 'system',
        permissions: [
          { feature: 'user_management', actions: ['manage'] },
          { feature: 'role_management', actions: ['manage'] },
          { feature: 'group_management', actions: ['manage'] },
          { feature: 'lead_management', actions: ['manage'] },
          { feature: 'account_management', actions: ['manage'] },
          { feature: 'contact_management', actions: ['manage'] },
          { feature: 'activity_management', actions: ['manage'] },
          { feature: 'report_management', actions: ['manage'] }
        ],
        level: 100,
        isActive: true
      });

      console.log('✅ Super Admin role created successfully!');
      console.log(`   Role: ${superAdminRole.name}`);
      console.log(`   Permissions: ${superAdminRole.permissions.length} feature(s)\n`);

      console.log('📋 Permissions:');
      superAdminRole.permissions.forEach(perm => {
        console.log(`   - ${perm.feature}: [${perm.actions.join(', ')}]`);
      });
    }

    console.log('\n========================================');
    console.log('✅ Super Admin role is ready!');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

ensureSuperAdminRole();
