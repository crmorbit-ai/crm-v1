const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  poNumber: {
    type: String,
    unique: true
  },

  // Customer's PO Number (external)
  customerPONumber: {
    type: String,
    required: true
  },

  title: {
    type: String,
    required: true
  },

  description: String,

  // Customer reference
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'customerModel'
  },
  customerModel: {
    type: String,
    enum: ['Lead', 'Contact', 'Account']
  },
  customerName: String,
  customerEmail: String,
  customerPhone: String,
  customerAddress: String,

  // Link to Quotation/RFQ
  quotation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quotation'
  },

  // PO Details
  poDate: {
    type: Date,
    required: true,
    default: Date.now
  },

  deliveryDate: Date,
  paymentTerms: String,

  // Items (copied from quotation)
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductItem'
    },
    productName: String,
    description: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      required: true
    }
  }],

  // Totals
  subtotal: {
    type: Number,
    default: 0
  },
  totalDiscount: {
    type: Number,
    default: 0
  },
  totalTax: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },

  // PO Document
  poDocument: {
    filename: String,
    path: String,
    uploadedAt: Date
  },

  status: {
    type: String,
    enum: ['draft', 'received', 'approved', 'in_progress', 'completed', 'cancelled'],
    default: 'draft'
  },

  // Conversion tracking
  convertedToInvoice: {
    type: Boolean,
    default: false
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },

  terms: String,
  notes: String,

  // Approval
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,

  // Multi-tenancy
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Auto-generate PO number
purchaseOrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.poNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({ tenant: this.tenant });
    this.poNumber = `PO-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  // Calculate totals if items changed
  if (this.isModified('items')) {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    this.items.forEach(item => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemDiscount = (itemSubtotal * item.discount) / 100;
      const itemTaxableAmount = itemSubtotal - itemDiscount;
      const itemTax = (itemTaxableAmount * item.tax) / 100;

      item.total = itemTaxableAmount + itemTax;

      subtotal += itemSubtotal;
      totalDiscount += itemDiscount;
      totalTax += itemTax;
    });

    this.subtotal = subtotal;
    this.totalDiscount = totalDiscount;
    this.totalTax = totalTax;
    this.totalAmount = subtotal - totalDiscount + totalTax;
  }

  next();
});

// Indexes
purchaseOrderSchema.index({ tenant: 1, status: 1 });
purchaseOrderSchema.index({ tenant: 1, createdAt: -1 });
// Note: poNumber index created automatically by unique: true
purchaseOrderSchema.index({ customerPONumber: 1 });

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

module.exports = PurchaseOrder;
