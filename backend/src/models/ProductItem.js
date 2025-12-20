const mongoose = require('mongoose');

const productItemSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },

  articleNumber: {
    type: String,
    required: [true, 'Article number is required'],
    trim: true,
    uppercase: true
  },

  // Category is now just a string (not enum) - CHANGED
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },

  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },

  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },

  description: {
    type: String,
    trim: true
  },

  imageUrl: {
    type: String,
    trim: true
  },

  isActive: {
    type: Boolean,
    default: true
  },

  // Tenant and User
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Custom Fields (Dynamic fields defined via Field Builder)
  customFields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound index - articleNumber must be unique per tenant
productItemSchema.index({ tenant: 1, articleNumber: 1 }, { unique: true });

// Other indexes for better query performance
productItemSchema.index({ tenant: 1, isActive: 1 });
productItemSchema.index({ tenant: 1, category: 1 });
productItemSchema.index({ tenant: 1, stock: 1 });
productItemSchema.index({ name: 'text', articleNumber: 'text', description: 'text' });

const ProductItem = mongoose.model('ProductItem', productItemSchema);

module.exports = ProductItem;