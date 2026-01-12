const FieldDefinition = require('../models/FieldDefinition');
const { verifyToken } = require('../utils/jwt');
const { seedStandardFields } = require('../utils/seedStandardFields');

// @desc    Get all field definitions for a specific entity type
// @route   GET /api/field-definitions/:entityType
// @access  Private
exports.getFieldDefinitions = async (req, res) => {
  try {
    const { entityType } = req.params;
    const { includeInactive } = req.query;

    const query = {
      tenant: req.user.tenant,
      entityType
    };

    if (!includeInactive) {
      query.isActive = true;
    }

    const fieldDefinitions = await FieldDefinition.find(query)
      .sort({ displayOrder: 1, createdAt: 1 })
      .populate('createdBy', 'firstName lastName email')
      .populate('lastModifiedBy', 'firstName lastName email');

    res.status(200).json({
      success: true,
      count: fieldDefinitions.length,
      data: fieldDefinitions
    });
  } catch (error) {
    console.error('Error fetching field definitions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching field definitions',
      error: error.message
    });
  }
};

// @desc    Get a single field definition by ID
// @route   GET /api/field-definitions/detail/:id
// @access  Private
exports.getFieldDefinition = async (req, res) => {
  try {
    const fieldDefinition = await FieldDefinition.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    })
      .populate('createdBy', 'firstName lastName email')
      .populate('lastModifiedBy', 'firstName lastName email');

    if (!fieldDefinition) {
      return res.status(404).json({
        success: false,
        message: 'Field definition not found'
      });
    }

    res.status(200).json({
      success: true,
      data: fieldDefinition
    });
  } catch (error) {
    console.error('Error fetching field definition:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching field definition',
      error: error.message
    });
  }
};

// @desc    Create a new field definition
// @route   POST /api/field-definitions
// @access  Private (Product Team only)
exports.createFieldDefinition = async (req, res) => {
  try {
    const {
      entityType,
      fieldName,
      label,
      fieldType,
      isRequired,
      defaultValue,
      placeholder,
      helpText,
      options,
      validations,
      displayOrder,
      section,
      showInList,
      showInDetail,
      showInCreate,
      showInEdit,
      conditionalDisplay
    } = req.body;

    // Validate field name format (snake_case)
    const fieldNameRegex = /^[a-z][a-z0-9_]*$/;
    if (!fieldNameRegex.test(fieldName)) {
      return res.status(400).json({
        success: false,
        message: 'Field name must be in snake_case format (e.g., course_name, fee_amount)'
      });
    }

    // Check if field already exists for this entity type
    const existingField = await FieldDefinition.findOne({
      tenant: req.user.tenant,
      entityType,
      fieldName
    });

    if (existingField) {
      return res.status(400).json({
        success: false,
        message: `Field '${fieldName}' already exists for ${entityType}`
      });
    }

    // Validate options for dropdown/multi_select/radio
    if (['dropdown', 'multi_select', 'radio'].includes(fieldType)) {
      if (!options || !Array.isArray(options) || options.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Options are required for ${fieldType} field type`
        });
      }
    }

    // Handle display order positioning
    let finalDisplayOrder;

    if (displayOrder && displayOrder > 0) {
      // User specified a position - shift existing fields
      await FieldDefinition.updateMany(
        {
          tenant: req.user.tenant,
          entityType,
          displayOrder: { $gte: displayOrder }
        },
        {
          $inc: { displayOrder: 1 }
        }
      );
      finalDisplayOrder = displayOrder;
    } else {
      // No position specified - add at end
      const maxOrderField = await FieldDefinition.findOne({
        tenant: req.user.tenant,
        entityType
      }).sort({ displayOrder: -1 });

      finalDisplayOrder = maxOrderField ? maxOrderField.displayOrder + 1 : 1;
    }

    const fieldDefinition = await FieldDefinition.create({
      tenant: req.user.tenant,
      entityType,
      fieldName,
      label,
      fieldType,
      isRequired: isRequired || false,
      defaultValue: defaultValue || null,
      placeholder: placeholder || '',
      helpText: helpText || '',
      options: options || [],
      validations: validations || {},
      displayOrder: finalDisplayOrder,
      section: section || 'Additional Information',
      showInList: showInList !== undefined ? showInList : false,
      showInDetail: showInDetail !== undefined ? showInDetail : true,
      showInCreate: showInCreate !== undefined ? showInCreate : true,
      showInEdit: showInEdit !== undefined ? showInEdit : true,
      conditionalDisplay: conditionalDisplay || { enabled: false },
      createdBy: req.user._id
    });

    const populatedField = await FieldDefinition.findById(fieldDefinition._id)
      .populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Field definition created successfully',
      data: populatedField
    });
  } catch (error) {
    console.error('Error creating field definition:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Field with this name already exists for this entity type'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating field definition',
      error: error.message
    });
  }
};

// @desc    Update a field definition
// @route   PUT /api/field-definitions/:id
// @access  Private (Product Team only)
exports.updateFieldDefinition = async (req, res) => {
  try {
    const fieldDefinition = await FieldDefinition.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });

    if (!fieldDefinition) {
      return res.status(404).json({
        success: false,
        message: 'Field definition not found'
      });
    }

    const {
      label,
      isRequired,
      defaultValue,
      placeholder,
      helpText,
      options,
      validations,
      displayOrder,
      section,
      showInList,
      showInDetail,
      showInCreate,
      showInEdit,
      conditionalDisplay,
      isActive
    } = req.body;

    // Validate options for dropdown/multi_select/radio if fieldType is being used
    if (['dropdown', 'multi_select', 'radio'].includes(fieldDefinition.fieldType)) {
      if (options && (!Array.isArray(options) || options.length === 0)) {
        return res.status(400).json({
          success: false,
          message: `Options are required for ${fieldDefinition.fieldType} field type`
        });
      }
    }

    // Update allowed fields (fieldName and entityType cannot be changed)
    if (label) fieldDefinition.label = label;
    if (isRequired !== undefined) fieldDefinition.isRequired = isRequired;
    if (defaultValue !== undefined) fieldDefinition.defaultValue = defaultValue;
    if (placeholder !== undefined) fieldDefinition.placeholder = placeholder;
    if (helpText !== undefined) fieldDefinition.helpText = helpText;
    if (options) fieldDefinition.options = options;
    if (validations) fieldDefinition.validations = validations;
    if (displayOrder !== undefined) fieldDefinition.displayOrder = displayOrder;
    if (section) fieldDefinition.section = section;
    if (showInList !== undefined) fieldDefinition.showInList = showInList;
    if (showInDetail !== undefined) fieldDefinition.showInDetail = showInDetail;
    if (showInCreate !== undefined) fieldDefinition.showInCreate = showInCreate;
    if (showInEdit !== undefined) fieldDefinition.showInEdit = showInEdit;
    if (conditionalDisplay) fieldDefinition.conditionalDisplay = conditionalDisplay;
    if (isActive !== undefined) fieldDefinition.isActive = isActive;

    fieldDefinition.lastModifiedBy = req.user._id;

    await fieldDefinition.save();

    const updatedField = await FieldDefinition.findById(fieldDefinition._id)
      .populate('createdBy', 'firstName lastName email')
      .populate('lastModifiedBy', 'firstName lastName email');

    res.status(200).json({
      success: true,
      message: 'Field definition updated successfully',
      data: updatedField
    });
  } catch (error) {
    console.error('Error updating field definition:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating field definition',
      error: error.message
    });
  }
};

// @desc    Delete a field definition (soft delete by setting isActive = false)
// @route   DELETE /api/field-definitions/:id
// @access  Private (Product Team only)
exports.deleteFieldDefinition = async (req, res) => {
  try {
    const fieldDefinition = await FieldDefinition.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });

    if (!fieldDefinition) {
      return res.status(404).json({
        success: false,
        message: 'Field definition not found'
      });
    }

    // Soft delete by setting isActive to false
    fieldDefinition.isActive = false;
    fieldDefinition.lastModifiedBy = req.user._id;
    await fieldDefinition.save();

    res.status(200).json({
      success: true,
      message: 'Field definition deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting field definition:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting field definition',
      error: error.message
    });
  }
};

// @desc    Permanently delete a field definition
// @route   DELETE /api/field-definitions/:id/permanent
// @access  Private (Product Team only)
exports.permanentDeleteFieldDefinition = async (req, res) => {
  try {
    const fieldDefinition = await FieldDefinition.findOneAndDelete({
      _id: req.params.id,
      tenant: req.user.tenant
    });

    if (!fieldDefinition) {
      return res.status(404).json({
        success: false,
        message: 'Field definition not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Field definition permanently deleted'
    });
  } catch (error) {
    console.error('Error permanently deleting field definition:', error);
    res.status(500).json({
      success: false,
      message: 'Error permanently deleting field definition',
      error: error.message
    });
  }
};

// @desc    Reorder field definitions
// @route   PUT /api/field-definitions/reorder
// @access  Private (Product Team only)
exports.reorderFieldDefinitions = async (req, res) => {
  try {
    const { fields } = req.body; // Array of { id, displayOrder }

    if (!Array.isArray(fields)) {
      return res.status(400).json({
        success: false,
        message: 'Fields must be an array'
      });
    }

    const updatePromises = fields.map(field =>
      FieldDefinition.findOneAndUpdate(
        { _id: field.id, tenant: req.user.tenant },
        { displayOrder: field.displayOrder, lastModifiedBy: req.user._id },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: 'Field order updated successfully'
    });
  } catch (error) {
    console.error('Error reordering fields:', error);
    res.status(500).json({
      success: false,
      message: 'Error reordering fields',
      error: error.message
    });
  }
};

// @desc    Get field statistics for an entity type
// @route   GET /api/field-definitions/:entityType/stats
// @access  Private (Product Team only)
exports.getFieldStats = async (req, res) => {
  try {
    const { entityType } = req.params;

    const stats = await FieldDefinition.aggregate([
      {
        $match: {
          tenant: req.user.tenant,
          entityType
        }
      },
      {
        $group: {
          _id: '$fieldType',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalFields = await FieldDefinition.countDocuments({
      tenant: req.user.tenant,
      entityType
    });

    const activeFields = await FieldDefinition.countDocuments({
      tenant: req.user.tenant,
      entityType,
      isActive: true
    });

    res.status(200).json({
      success: true,
      data: {
        total: totalFields,
        active: activeFields,
        inactive: totalFields - activeFields,
        byType: stats
      }
    });
  } catch (error) {
    console.error('Error fetching field stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching field stats',
      error: error.message
    });
  }
};

// @desc    Seed standard fields for current tenant (for existing tenants)
// @route   POST /api/field-definitions/seed-standard-fields
// @access  Private (Admin only)
exports.seedStandardFieldsForTenant = async (req, res) => {
  try {
    console.log(`📋 Seeding standard fields for tenant ${req.user.tenant}...`);

    const result = await seedStandardFields(req.user.tenant, req.user._id);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: `Successfully seeded ${result.created} standard field definitions`,
        data: { created: result.created }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error seeding standard fields',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error seeding standard fields:', error);
    res.status(500).json({
      success: false,
      message: 'Error seeding standard fields',
      error: error.message
    });
  }
};
