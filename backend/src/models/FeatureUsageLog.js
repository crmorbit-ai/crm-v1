const mongoose = require('mongoose');

// One document per tenant+feature+day (upserted daily — no bloat)
const featureUsageLogSchema = new mongoose.Schema({
  tenant:  { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  feature: { type: String, required: true, index: true },   // e.g. 'leadManagement'
  date:    { type: String, required: true, index: true },   // 'YYYY-MM-DD'
  count:   { type: Number, default: 1 },                    // API hits that day
  lastUsed:{ type: Date,   default: Date.now },
}, { timestamps: false });

featureUsageLogSchema.index({ tenant: 1, feature: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('FeatureUsageLog', featureUsageLogSchema);
