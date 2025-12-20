/**
 * Migration Script: Convert Standard Account Fields to Field Definitions
 *
 * Usage: node backend/src/scripts/migrateStandardAccountFields.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const FieldDefinition = require('../models/FieldDefinition');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const connectDB = require('../config/database');

// Define all standard Account fields
const standardAccountFields = [
  // Basic Information
  {
    fieldName: 'accountName',
    label: 'Account Name',
    fieldType: 'text',
    isRequired: true,
    placeholder: 'Enter account name',
    displayOrder: 1,
    section: 'Basic Information',
    showInList: true,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    validations: { maxLength: 200 }
  },
  {
    fieldName: 'accountType',
    label: 'Account Type',
    fieldType: 'dropdown',
    isRequired: false,
    displayOrder: 2,
    section: 'Basic Information',
    showInList: true,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    defaultValue: 'Customer',
    options: [
      { label: 'Customer', value: 'Customer' },
      { label: 'Prospect', value: 'Prospect' },
      { label: 'Partner', value: 'Partner' },
      { label: 'Vendor', value: 'Vendor' },
      { label: 'Competitor', value: 'Competitor' }
    ]
  },
  {
    fieldName: 'phone',
    label: 'Phone',
    fieldType: 'phone',
    isRequired: false,
    placeholder: 'Enter phone number',
    displayOrder: 3,
    section: 'Basic Information',
    showInList: true,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true
  },
  {
    fieldName: 'website',
    label: 'Website',
    fieldType: 'url',
    isRequired: false,
    placeholder: 'https://example.com',
    displayOrder: 4,
    section: 'Basic Information',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true
  },
  {
    fieldName: 'fax',
    label: 'Fax',
    fieldType: 'phone',
    isRequired: false,
    placeholder: 'Enter fax number',
    displayOrder: 5,
    section: 'Basic Information',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true
  },
  // Business Information
  {
    fieldName: 'industry',
    label: 'Industry',
    fieldType: 'dropdown',
    isRequired: false,
    displayOrder: 11,
    section: 'Business Information',
    showInList: true,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    options: [
      { label: 'Technology', value: 'Technology' },
      { label: 'Healthcare', value: 'Healthcare' },
      { label: 'Finance', value: 'Finance' },
      { label: 'Manufacturing', value: 'Manufacturing' },
      { label: 'Retail', value: 'Retail' },
      { label: 'Other', value: 'Other' }
    ]
  },
  {
    fieldName: 'annualRevenue',
    label: 'Annual Revenue',
    fieldType: 'currency',
    isRequired: false,
    placeholder: 'Enter annual revenue',
    displayOrder: 12,
    section: 'Business Information',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    validations: { min: 0 }
  },
  {
    fieldName: 'numberOfEmployees',
    label: 'Number of Employees',
    fieldType: 'number',
    isRequired: false,
    placeholder: 'Enter number of employees',
    displayOrder: 13,
    section: 'Business Information',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    validations: { min: 0 }
  },
  // Additional Information
  {
    fieldName: 'description',
    label: 'Description',
    fieldType: 'textarea',
    isRequired: false,
    placeholder: 'Enter description or notes',
    displayOrder: 21,
    section: 'Additional Information',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    validations: { maxLength: 1000 }
  }
];

async function migrateStandardAccountFields() {
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

      for (const fieldConfig of standardAccountFields) {
        const existing = await FieldDefinition.findOne({
          tenant: tenant._id,
          entityType: 'Account',
          fieldName: fieldConfig.fieldName
        });

        if (!existing) {
          await FieldDefinition.create({
            ...fieldConfig,
            tenant: tenant._id,
            entityType: 'Account',
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
    console.log(`   🏷️  Total Standard Fields: ${standardAccountFields.length}`);
    console.log('='.repeat(70));
    console.log('\n✅ Account standard fields migration complete!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

migrateStandardAccountFields();
