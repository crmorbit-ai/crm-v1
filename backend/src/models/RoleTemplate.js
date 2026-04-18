const mongoose = require('mongoose');

const roleEntrySchema = new mongoose.Schema({
  roleId:       { type: String, required: true },          // unique within template e.g. "role_1"
  roleName:     { type: String, required: true, trim: true }, // "CEO", "VP Sales"
  level:        { type: Number, required: true, default: 0 }, // 0 = top
  type:         { type: String, enum: ['company','division','department','team','role','person'], default: 'role' },
  parentRoleId: { type: String, default: null },            // roleId of parent in this template
  keywords:     [{ type: String, trim: true }],             // designation keywords to match leads e.g. ["ceo","chief executive","md"]
  order:        { type: Number, default: 0 },
}, { _id: false });

const roleTemplateSchema = new mongoose.Schema({
  tenant:       { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  templateName: { type: String, default: 'Default Hierarchy Template', trim: true },
  roles:        [roleEntrySchema],
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('RoleTemplate', roleTemplateSchema);
