const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  // Basic Information
  subject: {
    type: String,
    required: [true, 'Call subject is required'],
    trim: true
  },

  callType: {
    type: String,
    enum: ['Outbound', 'Inbound', 'Missed'],
    default: 'Outbound'
  },

  callStartTime: {
    type: Date,
    required: true
  },

  callDuration: {
    type: Number, // in minutes
    min: 0
  },

  // Call Purpose
  callPurpose: {
    type: String,
    enum: ['Prospecting', 'Follow-up', 'Demo', 'Support', 'Other'],
    default: 'Follow-up'
  },

  callResult: {
    type: String,
    enum: ['Interested', 'Not Interested', 'No Answer', 'Call Back Later', 'Completed'],
    default: 'Completed'
  },

  // Related To
  relatedTo: {
    type: String,
    enum: ['Lead', 'Account', 'Contact', 'Opportunity', 'Deal'],
    required: true
  },

  relatedToId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
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

  callAgenda: {
    type: String,
    trim: true
  },

  callNotes: {
    type: String,
    trim: true
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
callSchema.index({ tenant: 1, isActive: 1 });
callSchema.index({ owner: 1 });
callSchema.index({ callStartTime: 1 });
callSchema.index({ callType: 1 });
callSchema.index({ relatedTo: 1, relatedToId: 1 });

const Call = mongoose.model('Call', callSchema);

module.exports = Call;