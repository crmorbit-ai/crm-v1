/**
 * Script to create Product Team role with field_management permissions
 * This role allows users to create custom fields, design forms, and customize dashboards
 *
 * Usage: node backend/src/scripts/addProductTeamRole.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('../models/Role');
const Tenant = require('../models/Tenant');
const connectDB = require('../config/database');

async function addProductTeamRole() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Get all tenants
    const tenants = await Tenant.find({ isActive: true });
    console.log(`📊 Found ${tenants.length} active tenants`);

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const tenant of tenants) {
      console.log(`\n🏢 Processing tenant: ${tenant.companyName} (${tenant._id})`);

      // Check if Product Team role already exists for this tenant
      const existingRole = await Role.findOne({
        tenant: tenant._id,
        name: 'Product Team'
      });

      if (existingRole) {
        console.log(`⚠️  Product Team role already exists. Updating permissions...`);

        // Check if field_management permission exists
        const hasFieldManagement = existingRole.permissions.some(
          p => p.feature === 'field_management'
        );

        if (!hasFieldManagement) {
          // Add field_management permissions
          existingRole.permissions.push({
            feature: 'field_management',
            actions: ['create', 'read', 'update', 'delete', 'manage']
          });
        }

        // Check and add other permissions if not exist
        const permissionsToAdd = [
          { feature: 'lead_management', actions: ['read'] },
          { feature: 'account_management', actions: ['read'] },
          { feature: 'contact_management', actions: ['read'] },
          { feature: 'opportunity_management', actions: ['read'] },
          { feature: 'product_management', actions: ['read'] }
        ];

        permissionsToAdd.forEach(perm => {
          const exists = existingRole.permissions.some(p => p.feature === perm.feature);
          if (!exists) {
            existingRole.permissions.push(perm);
          }
        });

        await existingRole.save();
        updatedCount++;
        console.log(`✅ Updated Product Team role for ${tenant.companyName}`);
      } else {
        // Create new Product Team role
        const productTeamRole = new Role({
          tenant: tenant._id,
          name: 'Product Team',
          slug: 'product-team',
          description: 'Product team members can customize fields, forms, and dashboards for the organization',
          roleType: 'custom',
          isActive: true,
          level: 45, // Between TENANT_ADMIN (50) and TENANT_MANAGER (30)
          permissions: [
            // Field Management - Full access
            {
              feature: 'field_management',
              actions: ['create', 'read', 'update', 'delete', 'manage']
            },
            // CRM entities - Read-only access to understand data structure
            {
              feature: 'lead_management',
              actions: ['read']
            },
            {
              feature: 'account_management',
              actions: ['read']
            },
            {
              feature: 'contact_management',
              actions: ['read']
            },
            {
              feature: 'opportunity_management',
              actions: ['read']
            },
            {
              feature: 'product_management',
              actions: ['read']
            }
          ]
        });

        await productTeamRole.save();
        createdCount++;
        console.log(`✅ Created Product Team role for ${tenant.companyName}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   ✅ Created: ${createdCount}`);
    console.log(`   🔄 Updated: ${updatedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   📊 Total tenants processed: ${tenants.length}`);
    console.log('='.repeat(60));
    console.log('\n✅ Product Team role setup complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Assign users to the "Product Team" role');
    console.log('   2. Product Team members can now access field customization features');
    console.log('   3. Navigate to /admin/field-builder to start creating custom fields\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating Product Team role:', error);
    process.exit(1);
  }
}

// Run the script
addProductTeamRole();
