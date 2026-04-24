const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  tenant:      { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },

  /* ── Core Fields ── */
  type: {
    type: String,
    enum: ['bug', 'feature_request', 'general', 'complaint', 'praise'],
    required: true, index: true,
  },
  category: {
    type: String,
    enum: ['service', 'product', 'support', 'ui', 'pricing', 'other'],
    default: 'other', index: true,
  },
  title:       { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  rating:      { type: Number, min: 1, max: 5, default: null },

  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium', index: true,
  },
  status: {
    type: String,
    enum: ['new', 'acknowledged', 'in_progress', 'resolved', 'closed'],
    default: 'new', index: true,
  },

  /* ── Sentiment (auto-computed) ── */
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral',
  },

  /* ── Context ── */
  context: {
    page:             String,
    feature:          String,
    browser:          String,
    os:               String,
    screenResolution: String,
    userAgent:        String,
  },

  /* ── Tier 1: Tenant Admin Reply (visible to user) ── */
  tenantAdminReply:       { type: String, trim: true, maxlength: 2000 },
  tenantAdminRepliedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tenantAdminRepliedAt:   Date,
  tenantAdminStatus: {
    type: String,
    enum: ['pending', 'in_review', 'resolved', 'escalated'],
    default: 'pending', index: true,
  },

  /* ── Tier 2: Escalation to SAAS ── */
  escalatedToSaas:  { type: Boolean, default: false, index: true },
  escalatedAt:      Date,
  escalatedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  escalatedReason:  { type: String, trim: true, maxlength: 1000 },

  /* ── Tier 2: SAAS Admin Reply (visible to tenant admin) ── */
  adminReply:     { type: String, trim: true, maxlength: 2000 },
  repliedAt:      Date,
  repliedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tenantNotified: { type: Boolean, default: false },

  /* ── Internal Notes (SAAS only, never visible to tenant) ── */
  internalNotes: [{
    note:    { type: String, trim: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now },
  }],

  attachments: [{ url: String, name: String, size: Number }],

  /* ── SLA Timestamps ── */
  acknowledgedAt: Date,
  resolvedAt:     Date,
  closedAt:       Date,

}, { timestamps: true });

/* ── Auto-compute sentiment + priority ── */
feedbackSchema.pre('save', function(next) {
  if (this.isModified('rating') || this.isModified('type')) {
    if (this.type === 'praise' || this.rating >= 4)
      this.sentiment = 'positive';
    else if (this.type === 'complaint' || this.type === 'bug' || this.rating <= 2)
      this.sentiment = 'negative';
    else
      this.sentiment = 'neutral';

    if (this.type === 'bug' && this.rating && this.rating <= 2) this.priority = 'critical';
    else if (this.type === 'bug')                               this.priority = 'high';
    else if (this.type === 'complaint' && this.rating <= 2)     this.priority = 'high';
  }
  next();
});

feedbackSchema.virtual('responseTimeHours').get(function() {
  if (!this.tenantAdminRepliedAt) return null;
  return Math.round((this.tenantAdminRepliedAt - this.createdAt) / (1000 * 60 * 60));
});

feedbackSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
