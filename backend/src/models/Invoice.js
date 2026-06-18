const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductItem',
    required: false
  },
  productName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  hsnCode: {
    type: String,
    trim: true,
    default: '998314' // Default: IT/Software services
  },
  cgst: {
    type: Number,
    default: 0,
    min: 0
  },
  sgst: {
    type: Number,
    default: 0,
    min: 0
  },
  igst: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true
  }
});

const paymentSchema = new mongoose.Schema({
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'upi', 'cheque', 'other'],
    required: true
  },
  referenceNumber: String,
  notes: String,
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const invoiceSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  invoiceNumber: {
    type: String,
    unique: true,
    index: true
  },
  quotation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quotation',
    required: false
  },
  purchaseOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder',
    required: false
  },
  customerPONumber: {
    type: String
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'customerModel',
    required: false
  },
  customerModel: {
    type: String,
    enum: ['Lead', 'Contact', 'Account'],
    required: false
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerPhone: String,
  customerAddress: String,
  customerGstin: {
    type: String,
    trim: true,
    uppercase: true
  },
  customerState: {
    type: String,
    trim: true
  },
  customerStateCode: {
    type: String,
    trim: true
  },
  billingAddress: String,
  shippingAddress: String,
  placeOfSupply: {
    type: String,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  items: [invoiceItemSchema],
  subtotal: {
    type: Number,
    required: true,
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
  totalCgst: {
    type: Number,
    default: 0
  },
  totalSgst: {
    type: Number,
    default: 0
  },
  totalIgst: {
    type: Number,
    default: 0
  },
  taxType: {
    type: String,
    enum: ['CGST+SGST', 'IGST', 'None'],
    default: 'CGST+SGST'
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled'],
    default: 'draft',
    index: true
  },
  invoiceDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  terms: {
    type: String,
    default: 'Payment due within 30 days.'
  },
  notes: String,
  sentAt: Date,
  sentTo: [String],
  payments: [paymentSchema],
  razorpayPaymentLinkId: String,
  razorpayPaymentLinkUrl: String,
  totalPaid: {
    type: Number,
    default: 0
  },
  balanceDue: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

invoiceSchema.pre('save', async function(next) {
  if (this.isNew && !this.invoiceNumber) {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    const last = await this.constructor.findOne(
      { invoiceNumber: { $regex: `^${prefix}` } },
      { invoiceNumber: 1 },
      { sort: { invoiceNumber: -1 } }
    );
    let nextNum = 1;
    if (last?.invoiceNumber) {
      const lastNum = parseInt(last.invoiceNumber.replace(prefix, ''), 10);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    this.invoiceNumber = `${prefix}${String(nextNum).padStart(5, '0')}`;
  }
  next();
});

invoiceSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
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

  if (this.payments && this.payments.length > 0) {
    this.totalPaid = this.payments.reduce((sum, payment) => sum + payment.amount, 0);
  }

  this.balanceDue = this.totalAmount - this.totalPaid;

  if (this.balanceDue <= 0 && this.status !== 'paid') {
    this.status = 'paid';
  } else if (this.totalPaid > 0 && this.balanceDue > 0 && this.status !== 'partially_paid') {
    this.status = 'partially_paid';
  }

  next();
});

invoiceSchema.index({ tenant: 1, status: 1, createdAt: -1 });
invoiceSchema.index({ tenant: 1, customerEmail: 1 });
invoiceSchema.index({ tenant: 1, dueDate: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
