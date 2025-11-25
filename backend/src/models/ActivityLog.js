const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  // Who performed the action
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Tenant context (null for SAAS owner actions)
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    default: null
  },
  // Action details
  action: {
    type: String,
    required: true,
    enum: [
      'user.created', 'user.updated', 'user.deleted',
      'role.created', 'role.updated', 'role.deleted',
      'group.created', 'group.updated', 'group.deleted',
      'tenant.created', 'tenant.updated', 'tenant.suspended', 'tenant.activated',
      'subscription.created', 'subscription.updated', 'subscription.cancelled',
      'billing.created', 'billing.paid',
      'login.success', 'login.failed', 'logout',
      'permission.granted', 'permission.revoked',
      'feature.enabled', 'feature.disabled',
      'settings.updated',
      'lead.created', 'lead.updated', 'lead.deleted', 'lead.converted',
      'leads.bulk_import', 'leads.bulk_upload',
      'account.created', 'account.updated', 'account.deleted',
      'contact.created', 'contact.updated', 'contact.deleted',
      'opportunity.created', 'opportunity.updated', 'opportunity.deleted',
      'task.created', 'task.updated', 'task.deleted',
      'meeting.created', 'meeting.updated', 'meeting.deleted',
      'call.created', 'call.updated', 'call.deleted',
      'note.created', 'note.updated', 'note.deleted',
      'other'
    ]
  },
  // Target resource
  resourceType: {
    type: String,
    enum: ['User', 'Role', 'Group', 'Tenant', 'Subscription', 'Billing', 'Feature', 'Settings',
           'Lead', 'Account', 'Contact', 'Opportunity', 'Task', 'Meeting', 'Call', 'Note']
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  // Additional details
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  // IP address and user agent
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  // Request metadata
  requestMethod: {
    type: String
  },
  requestPath: {
    type: String
  }
}, {
  timestamps: true
});

// Index for faster queries
activityLogSchema.index({ user: 1 });
activityLogSchema.index({ tenant: 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
