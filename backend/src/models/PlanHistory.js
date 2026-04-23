const mongoose = require('mongoose');

const planHistorySchema = new mongoose.Schema({
  tenant:      { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  fromPlan:    { type: String, default: null },   // null = first subscription
  toPlan:      { type: String, required: true },
  changeType:  { type: String, enum: ['new', 'upgrade', 'downgrade', 'cancel', 'reactivate', 'trial_end'], default: 'new' },
  billingCycle:{ type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  amount:      { type: Number, default: 0 },
  reason:      { type: String, default: '' },     // cancellation/downgrade reason
  changedBy:   { type: String, default: 'system' }, // 'tenant', 'admin', 'system'
  changedAt:   { type: Date,   default: Date.now },
}, { timestamps: false });

planHistorySchema.index({ tenant: 1, changedAt: -1 });

module.exports = mongoose.model('PlanHistory', planHistorySchema);
