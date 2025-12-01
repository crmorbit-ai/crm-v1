const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // Tenant reference (null for system-wide roles)
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    default: null
  },
  // Role type: 'system' (predefined) or 'custom' (created by tenant admin)
  roleType: {
    type: String,
    enum: ['system', 'custom'],
    default: 'custom'
  },
  // Permissions: array of feature-action combinations
  permissions: [{
    feature: {
      type: String,
      required: true
    },
    actions: [{
      type: String,
      enum: ['create', 'read', 'update', 'delete', 'manage', 'convert', 'import', 'export', 'move_to_leads'],
      required: true
    }]
  }],
  // Priority/hierarchy level (higher number = more privileges)
  level: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique role names per tenant
roleSchema.index({ slug: 1, tenant: 1 }, { unique: true });

module.exports = mongoose.model('Role', roleSchema);
