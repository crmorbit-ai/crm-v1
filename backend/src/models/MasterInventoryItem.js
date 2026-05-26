const mongoose = require('mongoose');

const masterInventoryItemSchema = new mongoose.Schema({
  tenant: { type: String, required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['product', 'service', 'lead'], required: true, index: true },
  department: { type: String, default: 'sales', index: true },
  status: { type: String, enum: ['new', 'quoted', 'won', 'lost'], default: 'new', index: true },
  description: String,

  // Product fields
  sku: String,
  category: String,
  productPrice: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },

  // Service fields
  serviceType: String,
  duration: String,
  serviceRate: { type: Number, default: 0 },

  // Lead fields
  leadEmail: String,
  leadPhone: String,
  leadSource: String,

  // Financial
  quotedAmount: { type: Number, default: 0 },
  wonAmount: { type: Number, default: 0 },
  receivedAmount: { type: Number, default: 0 },

  // Additional
  notes: String,
  tags: [String],

  // Assignment
  assignedGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
  assignedMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  assignedToName: String,

  createdBy: { type: String, default: 'system' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

masterInventoryItemSchema.index({ tenant: 1, name: 1 });
masterInventoryItemSchema.index({ tenant: 1, type: 1 });
masterInventoryItemSchema.index({ tenant: 1, status: 1 });

module.exports = mongoose.model('MasterInventoryItem', masterInventoryItemSchema);
