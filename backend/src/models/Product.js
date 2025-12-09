const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: '📦',
    },
    type: {
      type: String,
      required: true,
      enum: ['email', 'whatsapp', 'sms', 'call'],
    },
    pricing: {
      pricePerUnit: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        default: 'INR',
        enum: ['INR', 'USD'],
      },
      unit: {
        type: String,
        required: true, // 'email', 'message', 'SMS', 'minute'
      },
    },
    // Pre-defined packages for purchase
    packages: [
      {
        credits: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        discount: {
          type: Number,
          default: 0, // Percentage discount
        },
        isPopular: {
          type: Boolean,
          default: false,
        },
      },
    ],
    features: {
      bulkEnabled: {
        type: Boolean,
        default: true, // All products support bulk for DataCenter
      },
      apiAccess: {
        type: Boolean,
        default: false,
      },
      analytics: {
        type: Boolean,
        default: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
productSchema.index({ type: 1, isActive: 1 });
productSchema.index({ order: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
