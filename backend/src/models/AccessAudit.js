const mongoose = require('mongoose');

const accessAuditSchema = new mongoose.Schema({
  // Who accessed
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Which tenant
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  // What type of resource (lead, contact, deal, etc.)
  resourceType: {
    type: String,
    enum: ['lead', 'contact', 'deal', 'task', 'document', 'other'],
    required: true
  },
  // Resource ID
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  // Resource name/title for display
  resourceName: {
    type: String,
    default: ''
  },
  // Action performed
  action: {
    type: String,
    enum: ['viewed', 'edited', 'deleted', 'exported'],
    default: 'viewed'
  },
  // IP Address (optional)
  ipAddress: {
    type: String
  },
  // User Agent (optional)
  userAgent: {
    type: String
  },
  // Access timestamp
  accessedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
accessAuditSchema.index({ tenant: 1, accessedAt: -1 });
accessAuditSchema.index({ user: 1, accessedAt: -1 });
accessAuditSchema.index({ resourceType: 1, resourceId: 1 });

module.exports = mongoose.model('AccessAudit', accessAuditSchema);
