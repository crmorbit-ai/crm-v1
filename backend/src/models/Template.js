const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  purpose: {
    type: String,
    trim: true
  },
  module: {
    type: String,
    enum: ['lead', 'task', 'quotation', 'rfi', 'meeting', 'purchase_order', 'invoice', 'email'],
    required: true,
    index: true
  },
  icon: {
    type: String,
    default: '📋'
  },
  color: {
    type: String,
    default: '#6366f1'
  },
  // All pre-filled field values for this template
  defaultValues: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // For task templates: days offset from today for due date
  dueDateOffset: {
    type: Number,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

templateSchema.index({ tenant: 1, module: 1, isActive: 1 });

module.exports = mongoose.model('Template', templateSchema);
