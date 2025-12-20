/**
 * Migration Script: Convert Standard Product Fields to Field Definitions
 *
 * Usage: node backend/src/scripts/migrateStandardProductFields.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const FieldDefinition = require('../models/FieldDefinition');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const connectDB = require('../config/database');

// Define all standard Product fields
const standardProductFields = [
  // Basic Information
  {
    fieldName: 'name',
    label: 'Product Name',
    fieldType: 'text',
    isRequired: true,
    placeholder: 'e.g., CRM Software License',
    displayOrder: 1,
    section: 'Basic Information',
    showInList: true,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    validations: { maxLength: 200 }
  },
  {
    fieldName: 'articleNumber',
    label: 'Article Number',
    fieldType: 'text',
    isRequired: true,
    placeholder: 'e.g., CRM-001',
    displayOrder: 2,
    section: 'Basic Information',
    showInList: true,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    validations: { maxLength: 100 }
  },
  // Product Details
  {
    fieldName: 'description',
    label: 'Description',
    fieldType: 'textarea',
    isRequired: false,
    placeholder: 'Product description...',
    displayOrder: 11,
    section: 'Product Details',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    validations: { maxLength: 1000 }
  },
  {
    fieldName: 'imageUrl',
    label: 'Image URL',
    fieldType: 'url',
    isRequired: false,
    placeholder: 'https://example.com/image.jpg',
    displayOrder: 12,
    section: 'Product Details',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true
  },
  // Pricing & Inventory
  {
    fieldName: 'price',
    label: 'Price',
    fieldType: 'currency',
    isRequired: true,
    placeholder: '0.00',
    displayOrder: 21,
    section: 'Pricing & Inventory',
    showInList: true,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    validations: { min: 0 }
  },
  {
    fieldName: 'stock',
    label: 'Stock',
    fieldType: 'number',
    isRequired: false,
    placeholder: '0',
    displayOrder: 22,
    section: 'Pricing & Inventory',
    showInList: true,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    validations: { min: 0 }
  },
  {
    fieldName: 'isActive',
    label: 'Active Status',
    fieldType: 'checkbox',
    isRequired: false,
    displayOrder: 23,
    section: 'Pricing & Inventory',
    showInList: true,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    defaultValue: true,
    helpText: 'Check if the product is active and available'
  }
];

async function migrateStandardProductFields() {
  try {
    await connectDB();
    console.log('✅ Connected to database');

    const tenants = await Tenant.find({ isActive: true });
    console.log(`📊 Found ${tenants.length} active tenants`);

    if (tenants.length === 0) {
      console.log('⚠️  No active tenants found. Exiting...');
      process.exit(0);
    }

    let totalCreated = 0;
    let totalSkipped = 0;

    for (const tenant of tenants) {
      console.log(`\n🏢 Processing tenant: ${tenant.companyName}`);

      const tenantUser = await User.findOne({ tenant: tenant._id, isActive: true });
      if (!tenantUser) {
        console.log(`⚠️  No active users found. Skipping...`);
        continue;
      }

      let created = 0;
      let skipped = 0;

      for (const fieldConfig of standardProductFields) {
        const existing = await FieldDefinition.findOne({
          tenant: tenant._id,
          entityType: 'Product',
          fieldName: fieldConfig.fieldName
        });

        if (!existing) {
          await FieldDefinition.create({
            ...fieldConfig,
            tenant: tenant._id,
            entityType: 'Product',
            isStandardField: true,
            isActive: true,
            createdBy: tenantUser._id
          });
          created++;
          console.log(`  ✅ Created: ${fieldConfig.label}`);
        } else {
          skipped++;
        }
      }

      console.log(`  📊 Summary - Created: ${created}, Skipped: ${skipped}`);
      totalCreated += created;
      totalSkipped += skipped;
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Total Created: ${totalCreated}`);
    console.log(`   ⏭️  Total Skipped: ${totalSkipped}`);
    console.log(`   🏷️  Total Standard Fields: ${standardProductFields.length}`);
    console.log('='.repeat(70));
    console.log('\n✅ Product standard fields migration complete!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

migrateStandardProductFields();
