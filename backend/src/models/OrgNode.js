const mongoose = require('mongoose');

const orgNodeSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },

  // Node identity
  name: { type: String, required: true, trim: true },       // "CEO", "John Doe", "Engineering Dept"
  title: { type: String, trim: true, default: '' },          // Job title / designation
  type: {
    type: String,
    enum: ['company', 'division', 'department', 'team', 'role', 'person'],
    default: 'role',
  },

  // Contact info (optional, for person nodes)
  email:      { type: String, trim: true, lowercase: true, default: '' },
  phone:      { type: String, trim: true, default: '' },
  avatar:     { type: String, default: '' },                     // URL or initials fallback
  department: { type: String, trim: true, default: '' },         // Department name from lead

  // Tree structure
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrgNode',
    default: null,
  },
  level: { type: Number, default: 0 },                       // 0 = root (CEO / Company)
  order: { type: Number, default: 0 },                       // sibling order

  // Reporting line — separate from structural parent
  // Can point to same level, above, or any node in the org
  reportsTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrgNode',
    default: null,
  },

  // Optional link to a CRM User
  linkedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Compound index for fast tenant tree queries
orgNodeSchema.index({ tenant: 1, parent: 1, order: 1 });
orgNodeSchema.index({ tenant: 1, isActive: 1 });

// Text index for employee search
orgNodeSchema.index({ name: 'text', title: 'text', email: 'text' });

module.exports = mongoose.model('OrgNode', orgNodeSchema);
