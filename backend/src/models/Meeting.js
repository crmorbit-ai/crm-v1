const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Meeting title is required'],
    trim: true
  },

  location: {
    type: String,
    trim: true
  },

  from: {
    type: Date,
    required: [true, 'Start date/time is required']
  },

  to: {
    type: Date,
    required: [true, 'End date/time is required']
  },

  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Meeting Link (Auto-generated Jitsi)
  meetingLink: {
    type: String,
    trim: true
  },

  meetingId: {
    type: String,
    unique: true,
    sparse: true
  },

  // Participants
  participants: [{
    type: String,
    trim: true
  }],

  // Related To (Optional - for entity-linked meetings)
  relatedTo: {
    type: String,
    enum: ['Lead', 'Account', 'Contact', 'Opportunity', 'Deal'],
    required: false
  },

  relatedToId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    refPath: 'relatedTo'
  },

  contactName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact'
  },

  // Additional Info
  description: {
    type: String,
    trim: true
  },

  agenda: {
    type: String,
    trim: true
  },

  outcome: {
    type: String,
    trim: true
  },

  // Meeting Type
  meetingType: {
    type: String,
    enum: ['Online', 'In-Person', 'Phone Call'],
    default: 'Online'
  },

  // Status
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'],
    default: 'Scheduled'
  },

  // Owner and Tenant
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

  // Tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
meetingSchema.index({ tenant: 1, isActive: 1 });
meetingSchema.index({ owner: 1 });
meetingSchema.index({ host: 1 });
meetingSchema.index({ from: 1 });
meetingSchema.index({ status: 1 });
meetingSchema.index({ relatedTo: 1, relatedToId: 1 });

const Meeting = mongoose.model('Meeting', meetingSchema);

module.exports = Meeting;