const mongoose = require('mongoose');

const userProductSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    // Credits/Balance
    totalCredits: {
      type: Number,
      default: 0,
    },
    usedCredits: {
      type: Number,
      default: 0,
    },
    remainingCredits: {
      type: Number,
      default: 0,
    },
    // Purchase history
    purchases: [
      {
        credits: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        purchasedAt: {
          type: Date,
          default: Date.now,
        },
        paymentMethod: {
          type: String,
          enum: ['razorpay', 'stripe', 'paypal', 'manual'],
          default: 'manual',
        },
        transactionId: {
          type: String,
        },
      },
    ],
    // Usage tracking (for DataCenter bulk operations only)
    usage: {
      thisMonth: {
        type: Number,
        default: 0,
      },
      lastMonth: {
        type: Number,
        default: 0,
      },
      total: {
        type: Number,
        default: 0,
      },
      lastUsedAt: {
        type: Date,
      },
    },
    // Monthly usage history
    usageHistory: [
      {
        month: {
          type: String, // Format: "2024-12"
          required: true,
        },
        credits: {
          type: Number,
          default: 0,
        },
        bulkSent: {
          type: Number,
          default: 0,
        },
      },
    ],
    status: {
      type: String,
      enum: ['active', 'suspended', 'cancelled'],
      default: 'active',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userProductSchema.index({ tenant: 1, product: 1 });
userProductSchema.index({ tenant: 1, status: 1 });

// Method to check if credits available
userProductSchema.methods.hasCredits = function (required = 1) {
  return this.remainingCredits >= required;
};

// Method to use credits (for DataCenter bulk operations)
userProductSchema.methods.useCredits = async function (count, isBulk = false) {
  if (!this.hasCredits(count)) {
    throw new Error('Insufficient credits');
  }

  this.usedCredits += count;
  this.remainingCredits -= count;
  this.usage.thisMonth += count;
  this.usage.total += count;
  this.usage.lastUsedAt = new Date();

  // Update monthly history
  const currentMonth = new Date().toISOString().slice(0, 7); // "2024-12"
  const monthRecord = this.usageHistory.find((h) => h.month === currentMonth);

  if (monthRecord) {
    monthRecord.credits += count;
    if (isBulk) {
      monthRecord.bulkSent += count;
    }
  } else {
    this.usageHistory.push({
      month: currentMonth,
      credits: count,
      bulkSent: isBulk ? count : 0,
    });
  }

  await this.save();
  return this;
};

// Method to add credits (purchase)
userProductSchema.methods.addCredits = async function (count, price, paymentInfo = {}) {
  this.totalCredits += count;
  this.remainingCredits += count;

  this.purchases.push({
    credits: count,
    price: price,
    purchasedAt: new Date(),
    paymentMethod: paymentInfo.paymentMethod || 'manual',
    transactionId: paymentInfo.transactionId || null,
  });

  await this.save();
  return this;
};

const UserProduct = mongoose.model('UserProduct', userProductSchema);

module.exports = UserProduct;
