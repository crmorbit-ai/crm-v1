const mongoose = require('mongoose');

// 🔥 FULLY DYNAMIC SCHEMA - All Excel columns become database fields
const dataCenterCandidateSchema = new mongoose.Schema({
  // 🔒 System Fields Only (Required for multi-tenant isolation and tracking)
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },

  // Status and Tracking (for internal workflow management)
  status: {
    type: String,
    default: 'Available'
  },

  movedToLeadsAt: {
    type: Date
  },

  movedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  movedToTenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant'
  },

  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
  },

  // Import Metadata
  importedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  importedAt: {
    type: Date,
    default: Date.now
  },

  dataSource: {
    type: String,
    trim: true
  },

  isActive: {
    type: Boolean,
    default: true
  }

  // ⚡ ALL OTHER FIELDS ARE DYNAMIC - Excel columns will be stored directly at root level
  // No predefined schema - accepts any field from uploaded Excel files

}, {
  timestamps: true,
  strict: false  // 🔥 This allows any field to be saved to the document
});

// Basic indexes for system fields and common query patterns
dataCenterCandidateSchema.index({ status: 1 });
dataCenterCandidateSchema.index({ isActive: 1 });
dataCenterCandidateSchema.index({ tenant: 1, createdAt: -1 });

// 🔥 Dynamic field indexes - these will be created automatically by MongoDB when querying
// No need to predefine indexes for dynamic fields

const DataCenterCandidate = mongoose.model('DataCenterCandidate', dataCenterCandidateSchema);

module.exports = DataCenterCandidate;