const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  // Ticket Information
  ticketNumber: {
    type: String,
    unique: true,
    index: true
  },

  // Ticket Details
  summary: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },

  description: {
    type: String,
    required: true,
    trim: true
  },

  category: {
    type: String,
    enum: [
      'Lead Management',
      'Account Management',
      'Contact Management',
      'Data Center',
      'Email/SMS Issues',
      'Product Purchase',
      'User Management',
      'Performance Issue',
      'Bug Report',
      'Feature Request',
      'Other'
    ],
    default: 'Other'
  },

  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },

  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Waiting for Customer', 'Resolved', 'Closed'],
    default: 'Open',
    index: true
  },

  // User Information
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },

  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // SAAS Admin who handles this ticket
  },

  // Communication Thread
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderType: {
      type: String,
      enum: ['TENANT_USER', 'SAAS_ADMIN'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    attachments: [{
      fileName: String,
      fileUrl: String,
      fileType: String
    }],
    sentAt: {
      type: Date,
      default: Date.now
    },
    isInternal: {
      type: Boolean,
      default: false // Internal notes only visible to SAAS admins
    }
  }],

  // Tracking
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  closedAt: Date,

  resolutionNotes: String,

  // Metadata
  tags: [String],

  lastResponseAt: Date,

  responseTime: Number, // in minutes - time taken for first response

  resolutionTime: Number, // in minutes - time taken to resolve

  isRead: {
    type: Boolean,
    default: false // For SAAS admin to mark as read
  },

  // Rating (after resolution)
  customerRating: {
    type: Number,
    min: 1,
    max: 5
  },

  customerFeedback: String

}, {
  timestamps: true
});

// Indexes for better performance
supportTicketSchema.index({ status: 1, createdAt: -1 });
supportTicketSchema.index({ tenant: 1, status: 1 });
supportTicketSchema.index({ assignedTo: 1, status: 1 });
supportTicketSchema.index({ ticketNumber: 1 });

// Generate ticket number before saving
supportTicketSchema.pre('save', async function(next) {
  if (this.isNew && !this.ticketNumber) {
    try {
      // Generate unique ticket number: TKT-YYYYMMDD-XXXX
      const date = new Date();
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

      // Find last ticket number for today
      const SupportTicket = mongoose.model('SupportTicket');
      const lastTicket = await SupportTicket
        .findOne({ ticketNumber: new RegExp(`^TKT-${dateStr}`) })
        .sort({ ticketNumber: -1 });

      let sequence = 1;
      if (lastTicket) {
        const lastSeq = parseInt(lastTicket.ticketNumber.split('-')[2]);
        sequence = lastSeq + 1;
      }

      this.ticketNumber = `TKT-${dateStr}-${sequence.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating ticket number:', error);
      return next(error);
    }
  }
  next();
});

// Virtual for age of ticket in hours
supportTicketSchema.virtual('ageInHours').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60));
});

// Method to add message
supportTicketSchema.methods.addMessage = function(senderId, senderType, message, isInternal = false) {
  this.messages.push({
    sender: senderId,
    senderType,
    message,
    isInternal,
    sentAt: new Date()
  });
  this.lastResponseAt = new Date();

  // Calculate response time if this is first response from SAAS admin
  if (senderType === 'SAAS_ADMIN' && !this.responseTime) {
    this.responseTime = Math.floor((Date.now() - this.createdAt) / (1000 * 60));
  }

  return this.save();
};

// Method to update status
supportTicketSchema.methods.updateStatus = function(newStatus, userId) {
  this.status = newStatus;

  if (newStatus === 'Resolved') {
    this.resolvedAt = new Date();
    this.resolvedBy = userId;
    this.resolutionTime = Math.floor((Date.now() - this.createdAt) / (1000 * 60));
  } else if (newStatus === 'Closed') {
    this.closedAt = new Date();
  }

  return this.save();
};

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
