const mongoose = require('mongoose');

const productItemSchema = new mongoose.Schema({
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

  itemType: {
    type: String,
    enum: ['product', 'service', 'lead'],
    default: 'product',
    index: true
  },

  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },

  categoryType: {
    type: String,
    enum: ['product', 'service'],
    default: 'product'
  },

  unit: {
    type: String,
    default: 'piece',
    enum: ['piece', 'box', 'kg', 'litre', 'metre', 'set', 'pair', 'dozen']
  },

  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },

  costPrice: {
    type: Number,
    default: 0,
    min: 0
  },

  // Stock on Hand — actual physical stock
  stock: {
    type: Number,
    default: 0,
    min: 0
  },

  // Committed Stock — reserved via accepted quotations
  committedStock: {
    type: Number,
    default: 0,
    min: 0
  },

  // Available for Sale = stock - committedStock
  // Computed via virtual, not stored

  lowStockThreshold: {
    type: Number,
    default: 10,
    min: 0
  },

  reorderPoint: {
    type: Number,
    default: 5,
    min: 0
  },

  reorderQuantity: {
    type: Number,
    default: 10,
    min: 0
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

  customFields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual — available for sale
productItemSchema.virtual('availableStock').get(function () {
  return Math.max(0, this.stock - this.committedStock);
});

// Virtual — stock status
productItemSchema.virtual('stockStatus').get(function () {
  if (this.stock === 0) return 'out_of_stock';
  if (this.stock <= this.lowStockThreshold) return 'low_stock';
  return 'in_stock';
});

// Virtual — stock value at cost
productItemSchema.virtual('stockValue').get(function () {
  return this.stock * this.costPrice;
});

productItemSchema.index({ tenant: 1, articleNumber: 1 }, { unique: true });
productItemSchema.index({ tenant: 1, isActive: 1 });
productItemSchema.index({ tenant: 1, category: 1 });
productItemSchema.index({ tenant: 1, stock: 1 });
productItemSchema.index({ name: 'text', articleNumber: 'text', description: 'text' });

const ProductItem = mongoose.model('ProductItem', productItemSchema);

module.exports = ProductItem;
