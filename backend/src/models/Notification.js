const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  // null means it's for SaaS admin only
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // forSaasAdmin = true means SaaS admin should also see it
  forSaasAdmin: {
    type: Boolean,
    default: true
  },
  type: {
    type: String,
    enum: [
      'task_assigned', 'task_overdue', 'task_completed', 'task_updated',
      'lead_created', 'lead_assigned', 'lead_status_changed', 'lead_converted',
      'opportunity_created', 'opportunity_stage_changed', 'opportunity_won', 'opportunity_lost',
      'contact_created',
      'account_created',
      'meeting_reminder', 'meeting_created',
      'support_ticket_created', 'support_ticket_status_changed',
      'invoice_overdue', 'invoice_created',
      'email_received',
      'note_added',
      'tenant_registered', 'tenant_deletion_requested', 'subscription_changed', 'payment_failed'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  entityType: {
    type: String,
    enum: ['Task', 'Lead', 'Opportunity', 'Contact', 'Account', 'Meeting', 'SupportTicket', 'Invoice', 'EmailMessage', 'Note', 'Tenant', null],
    default: null
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

notificationSchema.index({ tenant: 1, userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ forSaasAdmin: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
