const FieldDefinition = require('../models/FieldDefinition');

/**
 * Default standard fields for each entity type
 * These will be automatically created when a new tenant registers
 */

const getStandardFields = (entityType) => {
  const fields = {
    // ============================================
    // LEAD STANDARD FIELDS
    // ============================================
    Lead: [
      { fieldName: 'firstName', label: 'First Name', fieldType: 'text', isRequired: true, displayOrder: 1, section: 'Basic Information', showInList: true },
      { fieldName: 'lastName', label: 'Last Name', fieldType: 'text', isRequired: true, displayOrder: 2, section: 'Basic Information', showInList: true },
      { fieldName: 'email', label: 'Email', fieldType: 'email', isRequired: true, displayOrder: 3, section: 'Basic Information', showInList: true },
      { fieldName: 'phone', label: 'Phone', fieldType: 'phone', isRequired: false, displayOrder: 4, section: 'Basic Information', showInList: true },
      { fieldName: 'company', label: 'Company', fieldType: 'text', isRequired: false, displayOrder: 5, section: 'Basic Information', showInList: true },
      { fieldName: 'jobTitle', label: 'Job Title', fieldType: 'text', isRequired: false, displayOrder: 6, section: 'Basic Information', showInList: false },
      { fieldName: 'leadStatus', label: 'Lead Status', fieldType: 'dropdown', isRequired: true, displayOrder: 7, section: 'Lead Details', showInList: true,
        options: [
          { label: 'New', value: 'New', color: '#3B82F6' },
          { label: 'Contacted', value: 'Contacted', color: '#8B5CF6' },
          { label: 'Qualified', value: 'Qualified', color: '#10B981' },
          { label: 'Unqualified', value: 'Unqualified', color: '#F59E0B' },
          { label: 'Lost', value: 'Lost', color: '#EF4444' },
          { label: 'Converted', value: 'Converted', color: '#059669' }
        ]
      },
      { fieldName: 'leadSource', label: 'Lead Source', fieldType: 'dropdown', isRequired: false, displayOrder: 8, section: 'Lead Details', showInList: true,
        options: [
          { label: 'Website', value: 'Website' },
          { label: 'Social Media', value: 'Social Media' },
          { label: 'Referral', value: 'Referral' },
          { label: 'Campaign', value: 'Campaign' },
          { label: 'Cold Call', value: 'Cold Call' },
          { label: 'Other', value: 'Other' }
        ]
      },
      { fieldName: 'website', label: 'Website', fieldType: 'url', isRequired: false, displayOrder: 9, section: 'Basic Information', showInList: false },
      { fieldName: 'industry', label: 'Industry', fieldType: 'text', isRequired: false, displayOrder: 10, section: 'Business Information', showInList: false },
      { fieldName: 'city', label: 'City', fieldType: 'text', isRequired: false, displayOrder: 11, section: 'Address', showInList: false },
      { fieldName: 'state', label: 'State', fieldType: 'text', isRequired: false, displayOrder: 12, section: 'Address', showInList: false },
      { fieldName: 'country', label: 'Country', fieldType: 'text', isRequired: false, displayOrder: 13, section: 'Address', showInList: false },
      { fieldName: 'description', label: 'Description', fieldType: 'textarea', isRequired: false, displayOrder: 14, section: 'Additional Information', showInList: false }
    ],

    // ============================================
    // CONTACT STANDARD FIELDS
    // ============================================
    Contact: [
      { fieldName: 'firstName', label: 'First Name', fieldType: 'text', isRequired: true, displayOrder: 1, section: 'Basic Information', showInList: true },
      { fieldName: 'lastName', label: 'Last Name', fieldType: 'text', isRequired: true, displayOrder: 2, section: 'Basic Information', showInList: true },
      { fieldName: 'email', label: 'Email', fieldType: 'email', isRequired: false, displayOrder: 3, section: 'Basic Information', showInList: true },
      { fieldName: 'phone', label: 'Phone', fieldType: 'phone', isRequired: false, displayOrder: 4, section: 'Basic Information', showInList: true },
      { fieldName: 'mobilePhone', label: 'Mobile Phone', fieldType: 'phone', isRequired: false, displayOrder: 5, section: 'Basic Information', showInList: false },
      { fieldName: 'jobTitle', label: 'Job Title', fieldType: 'text', isRequired: false, displayOrder: 6, section: 'Professional Information', showInList: true },
      { fieldName: 'department', label: 'Department', fieldType: 'dropdown', isRequired: false, displayOrder: 7, section: 'Professional Information', showInList: false,
        options: [
          { label: 'Executive Management', value: 'Executive Management' },
          { label: 'Sales', value: 'Sales' },
          { label: 'Marketing', value: 'Marketing' },
          { label: 'Finance', value: 'Finance' },
          { label: 'Operations', value: 'Operations' },
          { label: 'IT', value: 'IT' },
          { label: 'Other', value: 'Other' }
        ]
      },
      { fieldName: 'city', label: 'City', fieldType: 'text', isRequired: false, displayOrder: 8, section: 'Address', showInList: false },
      { fieldName: 'state', label: 'State', fieldType: 'text', isRequired: false, displayOrder: 9, section: 'Address', showInList: false },
      { fieldName: 'country', label: 'Country', fieldType: 'text', isRequired: false, displayOrder: 10, section: 'Address', showInList: false },
      { fieldName: 'description', label: 'Description', fieldType: 'textarea', isRequired: false, displayOrder: 11, section: 'Additional Information', showInList: false }
    ],

    // ============================================
    // ACCOUNT STANDARD FIELDS
    // ============================================
    Account: [
      { fieldName: 'accountName', label: 'Account Name', fieldType: 'text', isRequired: true, displayOrder: 1, section: 'Basic Information', showInList: true },
      { fieldName: 'accountType', label: 'Account Type', fieldType: 'dropdown', isRequired: false, displayOrder: 2, section: 'Basic Information', showInList: true,
        options: [
          { label: 'Customer', value: 'Customer' },
          { label: 'Prospect', value: 'Prospect' },
          { label: 'Partner', value: 'Partner' },
          { label: 'Reseller', value: 'Reseller' },
          { label: 'Vendor', value: 'Vendor' },
          { label: 'Other', value: 'Other' }
        ]
      },
      { fieldName: 'industry', label: 'Industry', fieldType: 'dropdown', isRequired: false, displayOrder: 3, section: 'Business Information', showInList: true,
        options: [
          { label: 'Technology', value: 'Technology' },
          { label: 'Healthcare', value: 'Healthcare' },
          { label: 'Finance', value: 'Finance' },
          { label: 'Manufacturing', value: 'Manufacturing' },
          { label: 'Retail', value: 'Retail' },
          { label: 'Education', value: 'Education' },
          { label: 'Other', value: 'Other' }
        ]
      },
      { fieldName: 'website', label: 'Website', fieldType: 'url', isRequired: false, displayOrder: 4, section: 'Basic Information', showInList: false },
      { fieldName: 'phone', label: 'Phone', fieldType: 'phone', isRequired: false, displayOrder: 5, section: 'Basic Information', showInList: true },
      { fieldName: 'email', label: 'Email', fieldType: 'email', isRequired: false, displayOrder: 6, section: 'Basic Information', showInList: false },
      { fieldName: 'billingStreet', label: 'Billing Street', fieldType: 'text', isRequired: false, displayOrder: 7, section: 'Billing Address', showInList: false },
      { fieldName: 'billingCity', label: 'Billing City', fieldType: 'text', isRequired: false, displayOrder: 8, section: 'Billing Address', showInList: false },
      { fieldName: 'billingState', label: 'Billing State', fieldType: 'text', isRequired: false, displayOrder: 9, section: 'Billing Address', showInList: false },
      { fieldName: 'billingCountry', label: 'Billing Country', fieldType: 'text', isRequired: false, displayOrder: 10, section: 'Billing Address', showInList: false },
      { fieldName: 'description', label: 'Description', fieldType: 'textarea', isRequired: false, displayOrder: 11, section: 'Additional Information', showInList: false }
    ],

    // ============================================
    // PRODUCT STANDARD FIELDS
    // ============================================
    Product: [
      { fieldName: 'name', label: 'Product Name', fieldType: 'text', isRequired: true, displayOrder: 1, section: 'Basic Information', showInList: true },
      { fieldName: 'articleNumber', label: 'Article Number', fieldType: 'text', isRequired: true, displayOrder: 2, section: 'Basic Information', showInList: true },
      { fieldName: 'category', label: 'Category', fieldType: 'text', isRequired: true, displayOrder: 3, section: 'Basic Information', showInList: true },
      { fieldName: 'price', label: 'Price', fieldType: 'currency', isRequired: true, displayOrder: 4, section: 'Pricing', showInList: true },
      { fieldName: 'stock', label: 'Stock', fieldType: 'number', isRequired: false, displayOrder: 5, section: 'Inventory', showInList: true },
      { fieldName: 'description', label: 'Description', fieldType: 'textarea', isRequired: false, displayOrder: 6, section: 'Additional Information', showInList: false },
      { fieldName: 'isActive', label: 'Active', fieldType: 'checkbox', isRequired: false, displayOrder: 7, section: 'Status', showInList: true }
    ]
  };

  return fields[entityType] || [];
};

/**
 * Seed standard fields for a tenant
 * Called automatically during tenant registration
 */
const seedStandardFields = async (tenantId, userId) => {
  try {
    console.log(`📋 Seeding standard fields for tenant ${tenantId}...`);

    const entityTypes = ['Lead', 'Contact', 'Account', 'Product'];
    let totalCreated = 0;

    for (const entityType of entityTypes) {
      const fields = getStandardFields(entityType);

      for (const fieldConfig of fields) {
        // Check if field already exists
        const existing = await FieldDefinition.findOne({
          tenant: tenantId,
          entityType,
          fieldName: fieldConfig.fieldName
        });

        if (!existing) {
          await FieldDefinition.create({
            ...fieldConfig,
            tenant: tenantId,
            entityType,
            isStandardField: true,
            isActive: true,
            showInDetail: true,
            showInCreate: true,
            showInEdit: true,
            createdBy: userId
          });
          totalCreated++;
        }
      }

      console.log(`  ✅ ${entityType}: ${fields.length} fields`);
    }

    console.log(`✅ Created ${totalCreated} standard field definitions`);
    return { success: true, created: totalCreated };

  } catch (error) {
    console.error('❌ Error seeding standard fields:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { seedStandardFields, getStandardFields };
