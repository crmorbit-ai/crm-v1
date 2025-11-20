const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  // Activity Type
  activityType: {
    type: String,
    enum: ['task', 'call', 'email', 'meeting'],
    required: true
  },

  // Basic Information
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },

  // Scheduling
  dueDate: Date,
  startTime: Date,
  endTime: Date,
  duration: {
    type: Number,
    min: 0
  }, // in minutes

  // Status and Priority
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed', 'Deferred', 'Canceled'],
    default: 'Not Started'
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },

  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },

  // Related To (polymorphic - can be Lead, Account, Contact, etc.)
  relatedTo: {
    type: {
      type: String,
      enum: ['Lead', 'Account', 'Contact', 'Opportunity'],
      required: true
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'relatedTo.type'
    }
  },

  // Call Specific Fields
  callType: {
    type: String,
    enum: ['Inbound', 'Outbound']
  },
  callDuration: {
    type: Number,
    min: 0
  }, // in seconds
  callResult: {
    type: String,
    enum: ['Connected', 'Left Message', 'No Answer', 'Busy', 'Wrong Number']
  },

  // Email Specific Fields
  from: String,
  to: [String],
  cc: [String],
  bcc: [String],
  emailBody: String,

  // Reminders
  reminder: {
    enabled: {
      type: Boolean,
      default: false
    },
    time: Date
  },

  // System Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedDate: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
activitySchema.index({ activityType: 1 });
activitySchema.index({ status: 1 });
activitySchema.index({ dueDate: 1 });
activitySchema.index({ assignedTo: 1 });
activitySchema.index({ owner: 1 });
activitySchema.index({ tenant: 1 });
activitySchema.index({ 'relatedTo.type': 1, 'relatedTo.id': 1 });
activitySchema.index({ createdAt: -1 });

// Auto-update completedDate when status changes to Completed
activitySchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'Completed' && !this.completedDate) {
    this.completedDate = new Date();
  }
  next();
});

module.exports = mongoose.model('Activity', activitySchema);
