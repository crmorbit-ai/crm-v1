require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('../models/Role');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const addProductManagementPermission = async () => {
  try {
    await connectDB();

    console.log('🔧 Adding product_management permission to tenant admin roles...\n');

    // Find all tenant admin roles (both 'tenant-admin' and 'super-admin' slugs)
    const adminRoles = await Role.find({
      slug: { $in: ['tenant-admin', 'super-admin'] }
    });

    console.log(`Found ${adminRoles.length} admin roles`);

    let updatedCount = 0;

    for (const role of adminRoles) {
      // Check if product_management permission already exists
      const hasProductPermission = role.permissions.some(
        p => p.feature === 'product_management'
      );

      if (!hasProductPermission) {
        // Add product_management permission
        role.permissions.push({
          feature: 'product_management',
          actions: ['create', 'read', 'update', 'delete', 'export', 'manage']
        });

        await role.save();
        updatedCount++;
        console.log(`✅ Added product_management permission to role: ${role.name} (${role.slug})`);
      } else {
        console.log(`⏭️  Role already has product_management: ${role.name} (${role.slug})`);
      }
    }

    console.log(`\n✅ Updated ${updatedCount} roles`);
    console.log('🎉 Product management permission added successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

addProductManagementPermission();
