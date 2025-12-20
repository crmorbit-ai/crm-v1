const mongoose = require('mongoose');

const emailMessageSchema = new mongoose.Schema({
  // Core Email Fields
  messageId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },

  // Email Direction
  direction: {
    type: String,
    enum: ['sent', 'received'],
    required: true,
    index: true
  },

  // Sender & Recipients
  from: {
    email: { type: String, required: true, lowercase: true },
    name: String
  },
  to: [{
    email: { type: String, required: true, lowercase: true },
    name: String
  }],
  cc: [{
    email: { type: String, lowercase: true },
    name: String
  }],
  bcc: [{
    email: { type: String, lowercase: true },
    name: String
  }],

  // Email Content
  subject: {
    type: String,
    required: true,
    trim: true,
    index: 'text'
  },
  bodyText: {
    type: String,
    default: ''
  },
  bodyHtml: {
    type: String,
    default: ''
  },

  // Threading & Conversation
  inReplyTo: {
    type: String,
    index: true
  },
  references: [String],
  threadId: {
    type: String,
    index: true
  },

  // Email Type & Context
  emailType: {
    type: String,
    enum: [
      'bulk',
      'otp',
      'meeting_invitation',
      'meeting_reminder',
      'meeting_cancellation',
      'user_invitation',
      'test_email',
      'manual',
      'reply',
      'other'
    ],
    default: 'other',
    index: true
  },

  // Related Entities (Polymorphic)
  relatedTo: {
    type: {
      type: String,
      enum: ['Lead', 'Contact', 'Account', 'Candidate', 'Meeting', 'User', null],
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedTo.type'
    }
  },

  // Status Tracking
  status: {
    type: String,
    enum: ['sent', 'delivered', 'failed', 'bounced', 'opened', 'replied'],
    default: 'sent',
    index: true
  },

  // Delivery Information
  sentAt: {
    type: Date,
    required: true,
    index: true,
    default: Date.now
  },
  deliveredAt: Date,
  openedAt: Date,
  repliedAt: Date,

  // SMTP Mode
  smtpMode: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free'
  },

  // User & Tenant (Multi-tenancy)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },

  // Attachments
  attachments: [{
    filename: String,
    contentType: String,
    size: Number,
    url: String,
    cid: String
  }],

  // IMAP Sync (for received emails)
  imapUid: Number,
  imapFolder: String,

  // Headers
  headers: {
    type: Map,
    of: String
  },

  // Error Tracking
  errorMessage: String,
  errorCode: String,

  // Soft Delete
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },

  // Read Status
  isRead: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true
});

// Compound Indexes for Performance
emailMessageSchema.index({ tenant: 1, userId: 1, sentAt: -1 });
emailMessageSchema.index({ tenant: 1, 'relatedTo.type': 1, 'relatedTo.id': 1 });
emailMessageSchema.index({ tenant: 1, threadId: 1, sentAt: 1 });
emailMessageSchema.index({ tenant: 1, direction: 1, status: 1 });
emailMessageSchema.index({ messageId: 1, tenant: 1 }, { unique: true });

// Text index for search
emailMessageSchema.index({
  subject: 'text',
  bodyText: 'text',
  'from.email': 'text',
  'to.email': 'text'
});

// Generate threadId before saving
emailMessageSchema.pre('save', function(next) {
  if (this.isNew && !this.threadId) {
    // If it's a reply, threadId will be set by service
    // Otherwise, use this message's ID as threadId
    if (!this.inReplyTo) {
      this.threadId = this.messageId;
    }
  }
  next();
});

// Method to get full thread
emailMessageSchema.methods.getThread = async function() {
  const EmailMessage = mongoose.model('EmailMessage');
  return await EmailMessage.find({
    threadId: this.threadId,
    tenant: this.tenant,
    isDeleted: false
  }).sort({ sentAt: 1 });
};

// Virtual for checking if email has replies
emailMessageSchema.virtual('hasReplies', {
  ref: 'EmailMessage',
  localField: 'messageId',
  foreignField: 'inReplyTo',
  count: true
});

module.exports = mongoose.model('EmailMessage', emailMessageSchema);
