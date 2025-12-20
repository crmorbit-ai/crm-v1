require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const connectDB = require('../config/database');

const addEmailPermissions = async () => {
  try {
    await connectDB();

    const Role = require('../models/Role');

    // Get all roles
    const roles = await Role.find({});
    console.log(`Found ${roles.length} roles`);

    let updated = 0;

    for (const role of roles) {
      // Check if role already has email_management permission
      const hasEmailPermission = role.permissions.some(
        p => p.feature === 'email_management'
      );

      if (hasEmailPermission) {
        console.log(`⏭️  Role "${role.name}" already has email_management permission`);
        continue;
      }

      // Add email_management permission with standard actions
      role.permissions.push({
        feature: 'email_management',
        actions: ['create', 'read', 'update', 'delete', 'manage']
      });

      await role.save();
      updated++;
      console.log(`✅ Added email_management permission to role: ${role.name}`);
    }

    console.log(`\n🎉 Done! Updated ${updated} roles`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

addEmailPermissions();
