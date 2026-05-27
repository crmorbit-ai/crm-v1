const mongoose = require('mongoose');
const Counter = require('./Counter');

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

// Auto-generate RFI number using atomic counter
rfiSchema.pre('save', async function(next) {
  if (this.isNew && !this.rfiNumber) {
    try {
      const year = new Date().getFullYear();

      // Use findOneAndUpdate with atomic increment - RACE CONDITION SAFE
      const counter = await Counter.findOneAndUpdate(
        {
          name: 'rfi',
          tenant: this.tenant,
          year: year
        },
        {
          $inc: { sequence: 1 }
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true
        }
      );

      const nextNumber = counter.sequence;
      this.rfiNumber = `RFI-${year}-${String(nextNumber).padStart(5, '0')}`;

      next();
    } catch (err) {
      return next(err);
    }
  } else {
    next();
  }
});

// Indexes
rfiSchema.index({ tenant: 1, status: 1 });
rfiSchema.index({ tenant: 1, createdAt: -1 });
// Note: rfiNumber index created automatically by unique: true

const RFI = mongoose.model('RFI', rfiSchema);

module.exports = RFI;
