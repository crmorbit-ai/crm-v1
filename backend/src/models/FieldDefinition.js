const mongoose = require('mongoose');

const fieldDefinitionSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  entityType: {
    type: String,
    required: true,
    enum: ['Lead', 'Account', 'Contact', 'Opportunity', 'Product', 'Candidate'],
    index: true
  },
  fieldName: {
    type: String,
    required: true,
    trim: true,
    // Field name can be in camelCase or snake_case
    match: /^[a-z][a-zA-Z0-9_]*$/,
    maxlength: 50
  },
  label: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  fieldType: {
    type: String,
    required: true,
    enum: [
      'text',
      'textarea',
      'number',
      'email',
      'phone',
      'url',
      'date',
      'datetime',
      'checkbox',
      'dropdown',
      'multi_select',
      'radio',
      'currency',
      'percentage'
    ]
  },
  isRequired: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isStandardField: {
    type: Boolean,
    default: false,
    // Standard fields are pre-defined CRM fields (firstName, lastName, email, etc.)
    // They can be disabled but not deleted. Custom fields can be fully deleted.
  },
  defaultValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  placeholder: {
    type: String,
    trim: true,
    maxlength: 200
  },
  helpText: {
    type: String,
    trim: true,
    maxlength: 500
  },
  // For dropdown, multi_select, radio
  options: [{
    label: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    },
    color: String // for visual distinction
  }],
  // Validation rules
  validations: {
    minLength: Number,
    maxLength: Number,
    min: Number,
    max: Number,
    pattern: String, // regex pattern
    customMessage: String
  },
  // Display configuration
  displayOrder: {
    type: Number,
    default: 0
  },
  section: {
    type: String,
    default: 'Additional Information',
    trim: true
  },
  showInList: {
    type: Boolean,
    default: false
  },
  showInDetail: {
    type: Boolean,
    default: true
  },
  showInCreate: {
    type: Boolean,
    default: true
  },
  showInEdit: {
    type: Boolean,
    default: true
  },
  // For conditional logic (future enhancement)
  conditionalDisplay: {
    enabled: {
      type: Boolean,
      default: false
    },
    condition: {
      field: String,
      operator: String, // equals, not_equals, contains, greater_than, etc.
      value: mongoose.Schema.Types.Mixed
    }
  },
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index to ensure unique field names per entity per tenant
fieldDefinitionSchema.index({ tenant: 1, entityType: 1, fieldName: 1 }, { unique: true });

// Index for querying active fields
fieldDefinitionSchema.index({ tenant: 1, entityType: 1, isActive: 1, displayOrder: 1 });

// Virtual for full field path (used in queries)
fieldDefinitionSchema.virtual('fieldPath').get(function() {
  return `customFields.${this.fieldName}`;
});

// Method to validate a value against this field definition
fieldDefinitionSchema.methods.validateValue = function(value) {
  const errors = [];

  // Required check
  if (this.isRequired && (value === null || value === undefined || value === '')) {
    errors.push(`${this.label} is required`);
    return { valid: false, errors };
  }

  // Skip validation if value is empty and not required
  if (!value && !this.isRequired) {
    return { valid: true, errors: [] };
  }

  // Type-specific validation
  switch (this.fieldType) {
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.push(`${this.label} must be a valid email address`);
      }
      break;

    case 'phone':
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
      if (!phoneRegex.test(value)) {
        errors.push(`${this.label} must be a valid phone number`);
      }
      break;

    case 'url':
      try {
        new URL(value);
      } catch (e) {
        errors.push(`${this.label} must be a valid URL`);
      }
      break;

    case 'number':
    case 'currency':
    case 'percentage':
      if (isNaN(value)) {
        errors.push(`${this.label} must be a number`);
      }
      break;

    case 'dropdown':
    case 'radio':
      const validOptions = this.options.map(opt => opt.value);
      if (!validOptions.includes(value)) {
        errors.push(`${this.label} must be one of: ${validOptions.join(', ')}`);
      }
      break;

    case 'multi_select':
      if (!Array.isArray(value)) {
        errors.push(`${this.label} must be an array`);
      } else {
        const validOptions = this.options.map(opt => opt.value);
        const invalidValues = value.filter(v => !validOptions.includes(v));
        if (invalidValues.length > 0) {
          errors.push(`${this.label} contains invalid values: ${invalidValues.join(', ')}`);
        }
      }
      break;
  }

  // Custom validations
  if (this.validations) {
    const val = this.validations;

    if (val.minLength && String(value).length < val.minLength) {
      errors.push(val.customMessage || `${this.label} must be at least ${val.minLength} characters`);
    }

    if (val.maxLength && String(value).length > val.maxLength) {
      errors.push(val.customMessage || `${this.label} must be at most ${val.maxLength} characters`);
    }

    if (val.min !== undefined && Number(value) < val.min) {
      errors.push(val.customMessage || `${this.label} must be at least ${val.min}`);
    }

    if (val.max !== undefined && Number(value) > val.max) {
      errors.push(val.customMessage || `${this.label} must be at most ${val.max}`);
    }

    if (val.pattern) {
      const regex = new RegExp(val.pattern);
      if (!regex.test(value)) {
        errors.push(val.customMessage || `${this.label} format is invalid`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Static method to get all active fields for an entity type
fieldDefinitionSchema.statics.getActiveFields = async function(tenantId, entityType) {
  return this.find({
    tenant: tenantId,
    entityType,
    isActive: true
  }).sort({ displayOrder: 1, createdAt: 1 });
};

// Static method to validate custom fields object
fieldDefinitionSchema.statics.validateCustomFields = async function(tenantId, entityType, customFields) {
  const fieldDefinitions = await this.getActiveFields(tenantId, entityType);
  const errors = {};
  const validatedData = {};

  // Only validate custom fields that were actually submitted
  for (const fieldName in customFields) {
    const fieldDef = fieldDefinitions.find(f => f.fieldName === fieldName);

    if (!fieldDef) {
      // Field doesn't exist in definitions, skip it
      continue;
    }

    const value = customFields[fieldName];
    const validation = fieldDef.validateValue(value);

    if (!validation.valid) {
      errors[fieldName] = validation.errors;
    } else if (value !== undefined && value !== null && value !== '') {
      validatedData[fieldName] = value;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    validatedData
  };
};

const FieldDefinition = mongoose.model('FieldDefinition', fieldDefinitionSchema);

module.exports = FieldDefinition;
