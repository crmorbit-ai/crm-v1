const mongoose = require('mongoose');

const socialAccountSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  platform: { type: String, enum: ['linkedin','facebook','instagram','twitter','youtube'], required: true },
  accountName:   { type: String, trim: true },
  accountHandle: { type: String, trim: true },
  accountUrl:    { type: String, trim: true },
  profileImage:  { type: String },
  isConnected:    { type: Boolean, default: false },
  status:         { type: String, enum: ['connected','disconnected','error'], default: 'disconnected' },
  // OAuth tokens
  accessToken:    { type: String, default: '' },
  refreshToken:   { type: String, default: '' },
  tokenExpiry:    { type: Date },
  platformUserId: { type: String, default: '' },
  followers:      { type: Number, default: 0 },
  following:     { type: Number, default: 0 },
  totalPosts:    { type: Number, default: 0 },
  lastSyncAt:    { type: Date },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

socialAccountSchema.index({ tenant: 1, platform: 1 }, { unique: true });

module.exports = mongoose.model('SocialAccount', socialAccountSchema);
