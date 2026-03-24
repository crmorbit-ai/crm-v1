const mongoose = require('mongoose');

const socialPostSchema = new mongoose.Schema({
  tenant:    { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  content:   { type: String, required: true },
  media:     [{ url: String, type: { type: String, enum: ['image','video'] } }],
  platforms: [{ type: String, enum: ['linkedin','facebook','instagram','twitter','youtube'] }],
  status:    { type: String, enum: ['draft','scheduled','published','failed'], default: 'draft', index: true },
  scheduledAt:  { type: Date },
  publishedAt:  { type: Date },
  engagement: {
    likes:    { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares:   { type: Number, default: 0 },
    reach:    { type: Number, default: 0 },
  },
  tags:      [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

socialPostSchema.index({ tenant: 1, status: 1 });
socialPostSchema.index({ tenant: 1, scheduledAt: 1 });

module.exports = mongoose.model('SocialPost', socialPostSchema);
