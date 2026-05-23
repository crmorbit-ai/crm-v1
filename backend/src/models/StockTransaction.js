const mongoose = require('mongoose');

const stockTransactionSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductItem',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['stock_in', 'stock_out', 'adjustment'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  previousStock: {
    type: Number,
    required: true
  },
  newStock: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    default: ''
  },
  referenceType: {
    type: String,
    enum: ['invoice', 'purchase_order', 'manual', null],
    default: null
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  referenceNumber: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

stockTransactionSchema.index({ tenant: 1, product: 1, createdAt: -1 });
stockTransactionSchema.index({ tenant: 1, type: 1 });
stockTransactionSchema.index({ tenant: 1, createdAt: -1 });

const StockTransaction = mongoose.model('StockTransaction', stockTransactionSchema);

module.exports = StockTransaction;
