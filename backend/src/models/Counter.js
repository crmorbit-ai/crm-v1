const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  sequence: {
    type: Number,
    default: 0
  }
});

// Compound unique index for name + tenant + year
counterSchema.index({ name: 1, tenant: 1, year: 1 }, { unique: true });

const Counter = mongoose.model('Counter', counterSchema);

module.exports = Counter;
