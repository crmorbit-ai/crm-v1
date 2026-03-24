const mongoose = require('mongoose');
const crypto = require('crypto');

const documentTemplateSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  purpose: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    default: 'General',
    trim: true
  },
  // Rich text content stored as HTML string
  content: {
    type: String,
    default: ''
  },
  // Default download format
  format: {
    type: String,
    enum: ['word', 'excel', 'powerpoint'],
    default: 'word'
  },
  icon: { type: String, default: '📄' },
  color: { type: String, default: '#2563eb' },

  // Sharing
  isPublic: { type: Boolean, default: false },
  shareToken: {
    type: String,
    default: () => crypto.randomBytes(16).toString('hex'),
    unique: true,
    sparse: true
  },
  sharedWith: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    permission: { type: String, enum: ['view', 'edit'], default: 'view' }
  }],

  usageCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

documentTemplateSchema.index({ tenant: 1, isActive: 1 });
documentTemplateSchema.index({ shareToken: 1 });

module.exports = mongoose.model('DocumentTemplate', documentTemplateSchema);
