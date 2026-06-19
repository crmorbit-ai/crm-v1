require('dotenv').config();
const mongoose = require('mongoose');
const FieldDefinition = require('./src/models/FieldDefinition');
const Tenant = require('./src/models/Tenant');
const User = require('./src/models/User');

async function addGstinField() {
  try {
    // Connect to main database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all tenants
    const tenants = await Tenant.find({});
    console.log(`📊 Found ${tenants.length} tenant(s)`);

    for (const tenant of tenants) {
      // Check if GSTIN field already exists for this tenant
      const existingField = await FieldDefinition.findOne({
        tenant: tenant._id,
        entityType: 'Candidate',
        fieldName: 'gstin'
      });

      if (existingField) {
        console.log(`⏭️  GSTIN field already exists for tenant: ${tenant.organizationName}`);
        continue;
      }

      // Get tenant admin user for createdBy
      const adminUser = await User.findOne({ tenant: tenant._id, userType: 'TENANT_ADMIN' });
      if (!adminUser) {
        console.log(`⚠️  No admin user found for tenant: ${tenant.organizationName}`);
        continue;
      }

      // Create GSTIN field definition
      const gstinField = await FieldDefinition.create({
        tenant: tenant._id,
        entityType: 'Candidate',
        fieldName: 'gstin',
        label: 'GSTIN (Optional)',
        fieldType: 'text',
        section: 'Basic Information',
        isRequired: false,
        isStandardField: true,
        showInCreate: true,
        showInEdit: true,
        showInDetail: true,
        showInList: true,
        displayOrder: 5,
        isActive: true,
        placeholder: '29ABCDE1234F1Z5',
        helpText: 'GST Identification Number (15 characters)',
        validations: {
          maxLength: 15,
          pattern: '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
        },
        createdBy: adminUser._id,
        lastModifiedBy: adminUser._id
      });

      console.log(`✅ GSTIN field added for tenant: ${tenant.organizationName} (${tenant._id})`);
    }

    console.log('\n🎉 All done! GSTIN field added successfully.');
    console.log('📝 Now refresh the DataCenter page in browser.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

addGstinField();
