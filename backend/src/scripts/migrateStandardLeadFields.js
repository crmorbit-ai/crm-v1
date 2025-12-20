/**
 * Migration Script: Convert Standard Lead Fields to Field Definitions
 *
 * This script creates FieldDefinition records for all standard CRM lead fields
 * so that they can be managed (enabled/disabled/reordered) through the Field Builder UI.
 *
 * Usage: node backend/src/scripts/migrateStandardLeadFields.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const FieldDefinition = require('../models/FieldDefinition');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const connectDB = require('../config/database');

// Define all standard Lead fields with their configurations
const standardLeadFields = [
  // SECTION 1: Basic Information (displayOrder 1-10)
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
    section: 'Basic Information',
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
    section: 'Basic Information',
    showInList: true,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true
  },
  {
    fieldName: 'mobilePhone',
    label: 'Mobile Phone',
    fieldType: 'phone',
    isRequired: false,
    placeholder: 'Enter mobile number',
    displayOrder: 5,
    section: 'Basic Information',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true
  },
  {
    fieldName: 'company',
    label: 'Company',
    fieldType: 'text',
    isRequired: false,
    placeholder: 'Enter company name',
    displayOrder: 6,
    section: 'Basic Information',
    showInList: true,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    validations: { maxLength: 100 }
  },
  {
    fieldName: 'jobTitle',
    label: 'Job Title',
    fieldType: 'text',
    isRequired: false,
    placeholder: 'Enter job title',
    displayOrder: 7,
    section: 'Basic Information',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    validations: { maxLength: 100 }
  },
  {
    fieldName: 'website',
    label: 'Website',
    fieldType: 'url',
    isRequired: false,
    placeholder: 'https://example.com',
    displayOrder: 8,
    section: 'Basic Information',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true
  },

  // SECTION 2: Lead Classification (displayOrder 11-20)
  {
    fieldName: 'leadSource',
    label: 'Lead Source',
    fieldType: 'dropdown',
    isRequired: false,
    displayOrder: 11,
    section: 'Lead Classification',
    showInList: true,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    options: [
      { label: 'Advertisement', value: 'Advertisement' },
      { label: 'Cold Call', value: 'Cold Call' },
      { label: 'Employee Referral', value: 'Employee Referral' },
      { label: 'External Referral', value: 'External Referral' },
      { label: 'Online Store', value: 'Online Store' },
      { label: 'Partner', value: 'Partner' },
      { label: 'Public Relations', value: 'Public Relations' },
      { label: 'Sales Mail Alias', value: 'Sales Mail Alias' },
      { label: 'Seminar Partner', value: 'Seminar Partner' },
      { label: 'Internal Seminar', value: 'Internal Seminar' },
      { label: 'Trade Show', value: 'Trade Show' },
      { label: 'Web Download', value: 'Web Download' },
      { label: 'Web Research', value: 'Web Research' },
      { label: 'Chat', value: 'Chat' },
      { label: 'Twitter', value: 'Twitter' },
      { label: 'Facebook', value: 'Facebook' },
      { label: 'Google+', value: 'Google+' },
      { label: 'Website', value: 'Website' },
      { label: 'Campaign', value: 'Campaign' },
      { label: 'Social Media', value: 'Social Media' },
      { label: 'Other', value: 'Other' }
    ]
  },
  {
    fieldName: 'leadStatus',
    label: 'Lead Status',
    fieldType: 'dropdown',
    isRequired: true,
    displayOrder: 12,
    section: 'Lead Classification',
    showInList: true,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    defaultValue: 'New',
    options: [
      { label: 'New', value: 'New', color: '#3B82F6' },
      { label: 'Contacted', value: 'Contacted', color: '#8B5CF6' },
      { label: 'Qualified', value: 'Qualified', color: '#10B981' },
      { label: 'Unqualified', value: 'Unqualified', color: '#F59E0B' },
      { label: 'Lost', value: 'Lost', color: '#EF4444' },
      { label: 'Converted', value: 'Converted', color: '#059669' }
    ]
  },
  {
    fieldName: 'industry',
    label: 'Industry',
    fieldType: 'text',
    isRequired: false,
    placeholder: 'e.g., Technology, Healthcare, Finance',
    displayOrder: 13,
    section: 'Lead Classification',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    validations: { maxLength: 100 }
  },
  {
    fieldName: 'rating',
    label: 'Rating',
    fieldType: 'dropdown',
    isRequired: false,
    displayOrder: 14,
    section: 'Lead Classification',
    showInList: true,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    options: [
      { label: 'Hot', value: 'Hot', color: '#EF4444' },
      { label: 'Warm', value: 'Warm', color: '#F59E0B' },
      { label: 'Cold', value: 'Cold', color: '#3B82F6' }
    ]
  },

  // SECTION 3: Business Information (displayOrder 21-30)
  {
    fieldName: 'numberOfEmployees',
    label: 'Number of Employees',
    fieldType: 'number',
    isRequired: false,
    placeholder: 'Enter number of employees',
    displayOrder: 21,
    section: 'Business Information',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    validations: { min: 0 }
  },
  {
    fieldName: 'annualRevenue',
    label: 'Annual Revenue',
    fieldType: 'currency',
    isRequired: false,
    placeholder: 'Enter annual revenue',
    displayOrder: 22,
    section: 'Business Information',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    validations: { min: 0 }
  },

  // SECTION 4: Communication Preferences (displayOrder 31-40)
  {
    fieldName: 'emailOptOut',
    label: 'Email Opt Out',
    fieldType: 'checkbox',
    isRequired: false,
    displayOrder: 31,
    section: 'Communication Preferences',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    helpText: 'Check if the lead has opted out of email communications'
  },
  {
    fieldName: 'doNotCall',
    label: 'Do Not Call',
    fieldType: 'checkbox',
    isRequired: false,
    displayOrder: 32,
    section: 'Communication Preferences',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    helpText: 'Check if the lead should not be called'
  },
  {
    fieldName: 'fax',
    label: 'Fax',
    fieldType: 'phone',
    isRequired: false,
    placeholder: 'Enter fax number',
    displayOrder: 33,
    section: 'Communication Preferences',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true
  },
  {
    fieldName: 'secondaryEmail',
    label: 'Secondary Email',
    fieldType: 'email',
    isRequired: false,
    placeholder: 'Enter secondary email',
    displayOrder: 34,
    section: 'Communication Preferences',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true
  },

  // SECTION 5: Social Media (displayOrder 41-50)
  {
    fieldName: 'skypeId',
    label: 'Skype ID',
    fieldType: 'text',
    isRequired: false,
    placeholder: 'Enter Skype ID',
    displayOrder: 41,
    section: 'Social Media',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true
  },
  {
    fieldName: 'twitter',
    label: 'Twitter',
    fieldType: 'text',
    isRequired: false,
    placeholder: '@username',
    displayOrder: 42,
    section: 'Social Media',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true
  },
  {
    fieldName: 'linkedIn',
    label: 'LinkedIn',
    fieldType: 'url',
    isRequired: false,
    placeholder: 'LinkedIn profile URL',
    displayOrder: 43,
    section: 'Social Media',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true
  },

  // SECTION 6: Address (displayOrder 51-60)
  {
    fieldName: 'flatHouseNo',
    label: 'Flat/House No',
    fieldType: 'text',
    isRequired: false,
    placeholder: 'Enter flat or house number',
    displayOrder: 51,
    section: 'Address',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true
  },
  {
    fieldName: 'street',
    label: 'Street',
    fieldType: 'text',
    isRequired: false,
    placeholder: 'Enter street address',
    displayOrder: 52,
    section: 'Address',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true
  },
  {
    fieldName: 'city',
    label: 'City',
    fieldType: 'text',
    isRequired: false,
    placeholder: 'Enter city',
    displayOrder: 53,
    section: 'Address',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true
  },
  {
    fieldName: 'state',
    label: 'State/Province',
    fieldType: 'text',
    isRequired: false,
    placeholder: 'Enter state or province',
    displayOrder: 54,
    section: 'Address',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true
  },
  {
    fieldName: 'country',
    label: 'Country',
    fieldType: 'text',
    isRequired: false,
    placeholder: 'Enter country',
    displayOrder: 55,
    section: 'Address',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true
  },
  {
    fieldName: 'zipCode',
    label: 'Zip/Postal Code',
    fieldType: 'text',
    isRequired: false,
    placeholder: 'Enter zip or postal code',
    displayOrder: 56,
    section: 'Address',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true
  },
  {
    fieldName: 'latitude',
    label: 'Latitude',
    fieldType: 'text',
    isRequired: false,
    placeholder: 'Enter latitude',
    displayOrder: 57,
    section: 'Address',
    showInList: false,
    showInDetail: false,
    showInCreate: false,
    showInEdit: true,
    helpText: 'Geographic latitude coordinate'
  },
  {
    fieldName: 'longitude',
    label: 'Longitude',
    fieldType: 'text',
    isRequired: false,
    placeholder: 'Enter longitude',
    displayOrder: 58,
    section: 'Address',
    showInList: false,
    showInDetail: false,
    showInCreate: false,
    showInEdit: true,
    helpText: 'Geographic longitude coordinate'
  },

  // SECTION 7: Additional Information (displayOrder 61-70)
  {
    fieldName: 'description',
    label: 'Description',
    fieldType: 'textarea',
    isRequired: false,
    placeholder: 'Enter any additional notes or description',
    displayOrder: 61,
    section: 'Additional Information',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    validations: { maxLength: 1000 }
  }
];

async function migrateStandardLeadFields() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Get all active tenants
    const tenants = await Tenant.find({ isActive: true });
    console.log(`📊 Found ${tenants.length} active tenants`);

    if (tenants.length === 0) {
      console.log('⚠️  No active tenants found. Exiting...');
      process.exit(0);
    }

    let totalCreated = 0;
    let totalSkipped = 0;
    let totalUpdated = 0;

    for (const tenant of tenants) {
      console.log(`\n🏢 Processing tenant: ${tenant.companyName} (${tenant._id})`);

      // Find a user from this tenant to use as createdBy
      const tenantUser = await User.findOne({ tenant: tenant._id, isActive: true });

      if (!tenantUser) {
        console.log(`⚠️  No active users found for tenant ${tenant.companyName}. Skipping...`);
        continue;
      }

      let created = 0;
      let skipped = 0;
      let updated = 0;

      for (const fieldConfig of standardLeadFields) {
        // Check if field definition already exists
        const existing = await FieldDefinition.findOne({
          tenant: tenant._id,
          entityType: 'Lead',
          fieldName: fieldConfig.fieldName
        });

        if (existing) {
          // Update existing field to mark it as standard if not already
          if (!existing.isStandardField) {
            existing.isStandardField = true;
            existing.lastModifiedBy = tenantUser._id;
            await existing.save();
            updated++;
            console.log(`  🔄 Updated: ${fieldConfig.label} (marked as standard field)`);
          } else {
            skipped++;
          }
        } else {
          // Create new field definition
          const fieldDefinition = new FieldDefinition({
            ...fieldConfig,
            tenant: tenant._id,
            entityType: 'Lead',
            isStandardField: true,
            isActive: true,
            createdBy: tenantUser._id
          });

          await fieldDefinition.save();
          created++;
          console.log(`  ✅ Created: ${fieldConfig.label}`);
        }
      }

      console.log(`  📊 Tenant Summary - Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
      totalCreated += created;
      totalUpdated += updated;
      totalSkipped += skipped;
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Total Created: ${totalCreated}`);
    console.log(`   🔄 Total Updated: ${totalUpdated}`);
    console.log(`   ⏭️  Total Skipped: ${totalSkipped}`);
    console.log(`   📊 Total Tenants: ${tenants.length}`);
    console.log(`   🏷️  Total Standard Fields: ${standardLeadFields.length}`);
    console.log('='.repeat(70));
    console.log('\n✅ Standard Lead fields migration complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Update Leads.js to render form dynamically from field definitions');
    console.log('   2. Update LeadDetail.js to display fields dynamically');
    console.log('   3. Update Field Builder UI to show enable/disable toggles');
    console.log('   4. Add reorder functionality to Field Builder\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the migration
migrateStandardLeadFields();
