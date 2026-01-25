const mongoose = require('mongoose');

const rfiSchema = new mongoose.Schema({
  rfiNumber: {
    type: String,
    unique: true
  },

  title: {
    type: String,
    required: true
  },

  description: {
    type: String
  },

  // Customer reference (polymorphic)
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
  customerCompany: String,

  // RFI Details
  requirements: [{
    category: String,
    question: String,
    answer: String
  }],

  documents: [{
    name: String,
    url: String,
    uploadedAt: Date
  }],

  status: {
    type: String,
    enum: ['draft', 'sent', 'responded', 'converted', 'closed'],
    default: 'draft'
  },

  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  dueDate: Date,

  // Conversion tracking
  convertedToRFQ: {
    type: Boolean,
    default: false
  },
  rfq: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quotation'
  },

  // Response details
  responseDate: Date,
  responseNotes: String,

  notes: String,

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
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Auto-generate RFI number
rfiSchema.pre('save', async function(next) {
  if (this.isNew && !this.rfiNumber) {
    const year = new Date().getFullYear();
    const prefix = `RFI-${year}-`;

    // Find the last RFI number for this year and tenant
    const lastRFI = await this.constructor.findOne({
      tenant: this.tenant,
      rfiNumber: { $regex: `^${prefix}` }
    }).sort({ rfiNumber: -1 });

    let nextNumber = 1;
    if (lastRFI && lastRFI.rfiNumber) {
      const lastNumber = parseInt(lastRFI.rfiNumber.split('-')[2], 10);
      nextNumber = lastNumber + 1;
    }

    this.rfiNumber = `${prefix}${String(nextNumber).padStart(5, '0')}`;
  }
  next();
});

// Indexes
rfiSchema.index({ tenant: 1, status: 1 });
rfiSchema.index({ tenant: 1, createdAt: -1 });
// Note: rfiNumber index created automatically by unique: true

const RFI = mongoose.model('RFI', rfiSchema);

module.exports = RFI;
