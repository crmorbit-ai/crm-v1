const mongoose = require('mongoose');

const productCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true
  },
  
  description: {
    type: String,
    trim: true
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Tenant
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
  }
}, {
  timestamps: true
});

// Compound index - category name must be unique per tenant
productCategorySchema.index({ tenant: 1, name: 1 }, { unique: true });
productCategorySchema.index({ tenant: 1, isActive: 1 });

const ProductCategory = mongoose.model('ProductCategory', productCategorySchema);

module.exports = ProductCategory;