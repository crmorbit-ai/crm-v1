const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['core', 'analytics', 'reporting', 'integration', 'advanced', 'custom'],
    default: 'core'
  },
  // Available actions for this feature
  availableActions: [{
    type: String,
    enum: ['create', 'read', 'update', 'delete', 'manage'],
    default: ['read']
  }],
  // Plans that include this feature
  availableInPlans: [{
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise']
  }],
  // Is this feature enabled by default
  isDefaultEnabled: {
    type: Boolean,
    default: false
  },
  // Is this a core feature (cannot be disabled)
  isCoreFeature: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Icon for UI representation
  icon: {
    type: String
  },
  // Display order
  displayOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Feature', featureSchema);
