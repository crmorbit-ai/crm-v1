const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
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
  // Tenant reference
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  // Parent group for hierarchical structure
  parentGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  // Members of this group
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Roles assigned to this group
  roles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  }],
  // Group-level permissions (override individual roles)
  groupPermissions: [{
    feature: {
      type: String,
      required: true
    },
    actions: [{
      type: String,
      enum: ['create', 'read', 'update', 'delete', 'manage']
    }]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Compound index to ensure unique group names per tenant
groupSchema.index({ slug: 1, tenant: 1 }, { unique: true });

module.exports = mongoose.model('Group', groupSchema);
