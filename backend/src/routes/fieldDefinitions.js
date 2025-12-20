const express = require('express');
const router = express.Router();
const {
  getFieldDefinitions,
  getFieldDefinition,
  createFieldDefinition,
  updateFieldDefinition,
  deleteFieldDefinition,
  permanentDeleteFieldDefinition,
  reorderFieldDefinitions,
  getFieldStats
} = require('../controllers/fieldDefinitionController');

const { protect, requireTenant } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// All routes require authentication and tenant context
router.use(protect);
router.use(requireTenant);

// Routes that require field_management permission (Product Team only)

// Get all field definitions for an entity type
router.get(
  '/:entityType',
  getFieldDefinitions
);

// Get field statistics for an entity type
router.get(
  '/:entityType/stats',
  requirePermission('field_management', 'read'),
  getFieldStats
);

// Get a single field definition by ID
router.get(
  '/detail/:id',
  getFieldDefinition
);

// Create a new field definition
router.post(
  '/',
  requirePermission('field_management', 'create'),
  createFieldDefinition
);

// Reorder field definitions
router.put(
  '/reorder',
  requirePermission('field_management', 'update'),
  reorderFieldDefinitions
);

// Update a field definition
router.put(
  '/:id',
  requirePermission('field_management', 'update'),
  updateFieldDefinition
);

// Soft delete a field definition
router.delete(
  '/:id',
  requirePermission('field_management', 'delete'),
  deleteFieldDefinition
);

// Permanently delete a field definition
router.delete(
  '/:id/permanent',
  requirePermission('field_management', 'delete'),
  permanentDeleteFieldDefinition
);

module.exports = router;
