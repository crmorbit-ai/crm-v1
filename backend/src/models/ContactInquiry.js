const mongoose = require('mongoose');

const contactInquirySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true, default: '' },
  subject: {
    type: String,
    required: true,
    enum: ['General Inquiry', 'Sales', 'Technical Support', 'Partnership', 'Billing', 'Other'],
  },
  message: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ['New', 'Read', 'Replied'],
    default: 'New',
  },
  adminNote: { type: String, default: '' },
  adminReply: { type: String, default: '' },
  repliedAt: { type: Date },
  ipAddress: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('ContactInquiry', contactInquirySchema);
