const Template = require('../models/Template');
const { successResponse, errorResponse } = require('../utils/response');

// GET /api/templates?module=lead|task|quotation
const getTemplates = async (req, res) => {
  try {
    const { module } = req.query;
    const query = { tenant: req.user.tenant, isActive: true };
    if (module) query.module = module;

    const templates = await Template.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ usageCount: -1, createdAt: -1 })
      .lean();

    successResponse(res, 200, 'Templates fetched', templates);
  } catch (err) {
    console.error('getTemplates error:', err);
    errorResponse(res, 500, 'Server error');
  }
};

// POST /api/templates
const createTemplate = async (req, res) => {
  try {
    const { name, description, purpose, module, icon, color, defaultValues, dueDateOffset } = req.body;
    if (!name || !module) return errorResponse(res, 400, 'Name and module are required');

    const template = await Template.create({
      tenant: req.user.tenant,
      name, description, purpose, module,
      icon: icon || '📋',
      color: color || '#6366f1',
      defaultValues: defaultValues || {},
      dueDateOffset: dueDateOffset || null,
      createdBy: req.user._id
    });

    successResponse(res, 201, 'Template created', template);
  } catch (err) {
    console.error('createTemplate error:', err);
    errorResponse(res, 500, 'Server error');
  }
};

// PUT /api/templates/:id
const updateTemplate = async (req, res) => {
  try {
    const template = await Template.findOne({ _id: req.params.id, tenant: req.user.tenant });
    if (!template) return errorResponse(res, 404, 'Template not found');

    const { name, description, purpose, icon, color, defaultValues, dueDateOffset, isActive } = req.body;
    if (name !== undefined) template.name = name;
    if (description !== undefined) template.description = description;
    if (purpose !== undefined) template.purpose = purpose;
    if (icon !== undefined) template.icon = icon;
    if (color !== undefined) template.color = color;
    if (defaultValues !== undefined) template.defaultValues = defaultValues;
    if (dueDateOffset !== undefined) template.dueDateOffset = dueDateOffset;
    if (isActive !== undefined) template.isActive = isActive;

    await template.save();
    successResponse(res, 200, 'Template updated', template);
  } catch (err) {
    console.error('updateTemplate error:', err);
    errorResponse(res, 500, 'Server error');
  }
};

// DELETE /api/templates/:id
const deleteTemplate = async (req, res) => {
  try {
    const template = await Template.findOne({ _id: req.params.id, tenant: req.user.tenant });
    if (!template) return errorResponse(res, 404, 'Template not found');
    await template.deleteOne();
    successResponse(res, 200, 'Template deleted');
  } catch (err) {
    console.error('deleteTemplate error:', err);
    errorResponse(res, 500, 'Server error');
  }
};

// PATCH /api/templates/:id/use  — increment usage count
const useTemplate = async (req, res) => {
  try {
    const template = await Template.findOneAndUpdate(
      { _id: req.params.id, tenant: req.user.tenant },
      { $inc: { usageCount: 1 } },
      { new: true }
    );
    if (!template) return errorResponse(res, 404, 'Template not found');
    successResponse(res, 200, 'Usage recorded', template);
  } catch (err) {
    console.error('useTemplate error:', err);
    errorResponse(res, 500, 'Server error');
  }
};

module.exports = { getTemplates, createTemplate, updateTemplate, deleteTemplate, useTemplate };
