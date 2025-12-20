/**
 * Migration Script: Convert Standard Contact Fields to Field Definitions
 *
 * Usage: node backend/src/scripts/migrateStandardContactFields.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const FieldDefinition = require('../models/FieldDefinition');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const connectDB = require('../config/database');

// Define all standard Contact fields
const standardContactFields = [
  // Basic Information
  {
    fieldName: 'firstName',
    label: 'First Name',
    fieldType: 'text',
    isRequired: true,
    placeholder: 'Enter first name',
    displayOrder: 1,
    section: 'Basic Information',
    showInList: true,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    validations: { maxLength: 50 }
  },
  {
    fieldName: 'lastName',
    label: 'Last Name',
    fieldType: 'text',
    isRequired: true,
    placeholder: 'Enter last name',
    displayOrder: 2,
    section: 'Basic Information',
    showInList: true,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    validations: { maxLength: 50 }
  },
  {
    fieldName: 'email',
    label: 'Email',
    fieldType: 'email',
    isRequired: true,
    placeholder: 'Enter email address',
    displayOrder: 3,
    section: 'Contact Information',
    showInList: true,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true
  },
  {
    fieldName: 'phone',
    label: 'Phone',
    fieldType: 'phone',
    isRequired: false,
    placeholder: 'Enter phone number',
    displayOrder: 4,
    section: 'Contact Information',
    showInList: true,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true
  },
  {
    fieldName: 'mobile',
    label: 'Mobile',
    fieldType: 'phone',
    isRequired: false,
    placeholder: 'Enter mobile number',
    displayOrder: 5,
    section: 'Contact Information',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true
  },
  {
    fieldName: 'title',
    label: 'Job Title',
    fieldType: 'text',
    isRequired: false,
    placeholder: 'Enter job title',
    displayOrder: 6,
    section: 'Basic Information',
    showInList: true,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    validations: { maxLength: 100 }
  },
  {
    fieldName: 'department',
    label: 'Department',
    fieldType: 'text',
    isRequired: false,
    placeholder: 'Enter department',
    displayOrder: 7,
    section: 'Basic Information',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    validations: { maxLength: 100 }
  },
  {
    fieldName: 'description',
    label: 'Description',
    fieldType: 'textarea',
    isRequired: false,
    placeholder: 'Enter description or notes',
    displayOrder: 8,
    section: 'Additional Information',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    validations: { maxLength: 1000 }
  }
];

async function migrateStandardContactFields() {
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

      for (const fieldConfig of standardContactFields) {
        const existing = await FieldDefinition.findOne({
          tenant: tenant._id,
          entityType: 'Contact',
          fieldName: fieldConfig.fieldName
        });

        if (!existing) {
          await FieldDefinition.create({
            ...fieldConfig,
            tenant: tenant._id,
            entityType: 'Contact',
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
    console.log(`   🏷️  Total Standard Fields: ${standardContactFields.length}`);
    console.log('='.repeat(70));
    console.log('\n✅ Contact standard fields migration complete!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

migrateStandardContactFields();
