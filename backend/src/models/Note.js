const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true
  },
  
  // Related To
  relatedTo: {
    type: String,
    enum: ['Lead', 'Account', 'Contact', 'Opportunity', 'Deal', 'Task'],
    required: true
  },
  
  relatedToId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedTo',
    required: true
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
noteSchema.index({ tenant: 1, isActive: 1 });
noteSchema.index({ relatedToId: 1 });
noteSchema.index({ owner: 1 });
noteSchema.index({ createdAt: -1 });

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;