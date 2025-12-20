/**
 * Migration Script: Convert Standard Candidate (Data Center) Fields to Field Definitions
 *
 * Usage: node backend/src/scripts/migrateStandardCandidateFields.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const FieldDefinition = require('../models/FieldDefinition');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const connectDB = require('../config/database');

// Define all standard Candidate (Data Center) fields
const standardCandidateFields = [
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
    placeholder: 'candidate@example.com',
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
    isRequired: true,
    placeholder: 'Enter phone number',
    displayOrder: 4,
    section: 'Basic Information',
    showInList: true,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true
  },
  {
    fieldName: 'alternatePhone',
    label: 'Alternate Phone',
    fieldType: 'phone',
    isRequired: false,
    placeholder: 'Enter alternate phone',
    displayOrder: 5,
    section: 'Basic Information',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true
  },
  // Professional Information
  {
    fieldName: 'currentCompany',
    label: 'Current Company',
    fieldType: 'text',
    isRequired: false,
    placeholder: 'e.g., Infosys',
    displayOrder: 11,
    section: 'Professional Information',
    showInList: true,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    validations: { maxLength: 200 }
  },
  {
    fieldName: 'currentDesignation',
    label: 'Current Designation',
    fieldType: 'text',
    isRequired: false,
    placeholder: 'e.g., Software Engineer',
    displayOrder: 12,
    section: 'Professional Information',
    showInList: true,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    validations: { maxLength: 100 }
  },
  {
    fieldName: 'totalExperience',
    label: 'Total Experience (Years)',
    fieldType: 'number',
    isRequired: true,
    placeholder: '0',
    displayOrder: 13,
    section: 'Professional Information',
    showInList: true,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    defaultValue: 0,
    validations: { min: 0, max: 50 }
  },
  {
    fieldName: 'relevantExperience',
    label: 'Relevant Experience (Years)',
    fieldType: 'number',
    isRequired: false,
    placeholder: '0',
    displayOrder: 14,
    section: 'Professional Information',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    validations: { min: 0, max: 50 }
  },
  // Skills
  {
    fieldName: 'skills',
    label: 'Skills (comma-separated)',
    fieldType: 'textarea',
    isRequired: false,
    placeholder: 'e.g., Java, Python, React',
    displayOrder: 21,
    section: 'Skills & Qualifications',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    helpText: 'Enter skills separated by commas'
  },
  {
    fieldName: 'education',
    label: 'Education',
    fieldType: 'text',
    isRequired: false,
    placeholder: 'e.g., B.Tech in Computer Science',
    displayOrder: 22,
    section: 'Skills & Qualifications',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true
  },
  {
    fieldName: 'highestQualification',
    label: 'Highest Qualification',
    fieldType: 'dropdown',
    isRequired: false,
    displayOrder: 23,
    section: 'Skills & Qualifications',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    options: [
      { label: '10th', value: '10th' },
      { label: '12th', value: '12th' },
      { label: 'Diploma', value: 'Diploma' },
      { label: 'Graduate', value: 'Graduate' },
      { label: 'Post Graduate', value: 'Post Graduate' },
      { label: 'PhD', value: 'PhD' }
    ]
  },
  // Location
  {
    fieldName: 'currentLocation',
    label: 'Current Location',
    fieldType: 'text',
    isRequired: true,
    placeholder: 'e.g., Bangalore',
    displayOrder: 31,
    section: 'Location Information',
    showInList: true,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true
  },
  {
    fieldName: 'willingToRelocate',
    label: 'Willing to Relocate',
    fieldType: 'checkbox',
    isRequired: false,
    displayOrder: 32,
    section: 'Location Information',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    defaultValue: false
  },
  // Salary
  {
    fieldName: 'currentCTC',
    label: 'Current CTC (INR)',
    fieldType: 'currency',
    isRequired: false,
    placeholder: '0',
    displayOrder: 41,
    section: 'Salary Information',
    showInList: true,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    defaultValue: 0,
    validations: { min: 0 }
  },
  {
    fieldName: 'expectedCTC',
    label: 'Expected CTC (INR)',
    fieldType: 'currency',
    isRequired: false,
    placeholder: '0',
    displayOrder: 42,
    section: 'Salary Information',
    showInList: true,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    defaultValue: 0,
    validations: { min: 0 }
  },
  {
    fieldName: 'noticePeriod',
    label: 'Notice Period (Days)',
    fieldType: 'number',
    isRequired: false,
    placeholder: '30',
    displayOrder: 43,
    section: 'Salary Information',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    defaultValue: 30,
    validations: { min: 0, max: 180 }
  },
  // Availability
  {
    fieldName: 'availability',
    label: 'Availability',
    fieldType: 'dropdown',
    isRequired: false,
    displayOrder: 51,
    section: 'Availability',
    showInList: true,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    defaultValue: 'Immediate',
    options: [
      { label: 'Immediate', value: 'Immediate' },
      { label: '15 Days', value: '15 Days' },
      { label: '30 Days', value: '30 Days' },
      { label: '45 Days', value: '45 Days' },
      { label: '60 Days', value: '60 Days' },
      { label: '90 Days', value: '90 Days' },
      { label: 'Serving Notice', value: 'Serving Notice' }
    ]
  },
  {
    fieldName: 'lastWorkingDay',
    label: 'Last Working Day',
    fieldType: 'date',
    isRequired: false,
    displayOrder: 52,
    section: 'Availability',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true
  },
  // Links
  {
    fieldName: 'resumeUrl',
    label: 'Resume URL',
    fieldType: 'url',
    isRequired: false,
    placeholder: 'https://drive.google.com/...',
    displayOrder: 61,
    section: 'Resume & Links',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true
  },
  {
    fieldName: 'linkedInUrl',
    label: 'LinkedIn URL',
    fieldType: 'url',
    isRequired: false,
    placeholder: 'https://linkedin.com/in/...',
    displayOrder: 62,
    section: 'Resume & Links',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true
  },
  {
    fieldName: 'githubUrl',
    label: 'GitHub URL',
    fieldType: 'url',
    isRequired: false,
    placeholder: 'https://github.com/...',
    displayOrder: 63,
    section: 'Resume & Links',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true
  },
  // Source Info
  {
    fieldName: 'sourceWebsite',
    label: 'Source Website',
    fieldType: 'dropdown',
    isRequired: true,
    displayOrder: 71,
    section: 'Source Information',
    showInList: true,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    defaultValue: 'Other',
    options: [
      { label: 'Naukri', value: 'Naukri' },
      { label: 'LinkedIn', value: 'LinkedIn' },
      { label: 'Monster', value: 'Monster' },
      { label: 'Indeed', value: 'Indeed' },
      { label: 'TimesJobs', value: 'TimesJobs' },
      { label: 'Shine', value: 'Shine' },
      { label: 'Glassdoor', value: 'Glassdoor' },
      { label: 'AngelList', value: 'AngelList' },
      { label: 'Other', value: 'Other' }
    ]
  },
  {
    fieldName: 'lastActiveOn',
    label: 'Last Active On',
    fieldType: 'datetime',
    isRequired: true,
    displayOrder: 72,
    section: 'Source Information',
    showInList: true,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    defaultValue: new Date().toISOString()
  },
  // Job Preferences
  {
    fieldName: 'jobType',
    label: 'Job Type',
    fieldType: 'dropdown',
    isRequired: false,
    displayOrder: 81,
    section: 'Job Preferences',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    defaultValue: 'Full-time',
    options: [
      { label: 'Full-time', value: 'Full-time' },
      { label: 'Part-time', value: 'Part-time' },
      { label: 'Contract', value: 'Contract' },
      { label: 'Freelance', value: 'Freelance' },
      { label: 'Internship', value: 'Internship' }
    ]
  },
  {
    fieldName: 'workMode',
    label: 'Work Mode',
    fieldType: 'dropdown',
    isRequired: false,
    displayOrder: 82,
    section: 'Job Preferences',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    defaultValue: 'Flexible',
    options: [
      { label: 'Work from Office', value: 'Work from Office' },
      { label: 'Work from Home', value: 'Work from Home' },
      { label: 'Hybrid', value: 'Hybrid' },
      { label: 'Flexible', value: 'Flexible' }
    ]
  },
  // Status
  {
    fieldName: 'status',
    label: 'Status',
    fieldType: 'dropdown',
    isRequired: false,
    displayOrder: 91,
    section: 'Status',
    showInList: true,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    defaultValue: 'Available',
    options: [
      { label: 'Available', value: 'Available' },
      { label: 'Moved to Leads', value: 'Moved to Leads' },
      { label: 'Contacted', value: 'Contacted' },
      { label: 'Not Interested', value: 'Not Interested' },
      { label: 'Invalid', value: 'Invalid' }
    ]
  },
  // Additional Info
  {
    fieldName: 'summary',
    label: 'Summary',
    fieldType: 'textarea',
    isRequired: false,
    placeholder: 'Brief professional summary...',
    displayOrder: 101,
    section: 'Additional Information',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true,
    validations: { maxLength: 1000 }
  },
  {
    fieldName: 'notes',
    label: 'Notes',
    fieldType: 'textarea',
    isRequired: false,
    placeholder: 'Internal notes...',
    displayOrder: 102,
    section: 'Additional Information',
    showInList: false,
    showInDetail: true,
    showInCreate: true,
    showInEdit: true
  }
];

async function migrateStandardCandidateFields() {
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

      for (const fieldConfig of standardCandidateFields) {
        const existing = await FieldDefinition.findOne({
          tenant: tenant._id,
          entityType: 'Candidate',
          fieldName: fieldConfig.fieldName
        });

        if (!existing) {
          await FieldDefinition.create({
            ...fieldConfig,
            tenant: tenant._id,
            entityType: 'Candidate',
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
    console.log(`   🏷️  Total Standard Fields: ${standardCandidateFields.length}`);
    console.log('='.repeat(70));
    console.log('\n✅ Candidate standard fields migration complete!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

migrateStandardCandidateFields();
