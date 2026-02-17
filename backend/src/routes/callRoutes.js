const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const {
  getCalls,
  getCall,
  createCall,
  updateCall,
  deleteCall
} = require('../controllers/callController');

router.use(protect);

// CRUD routes with permission checks
router.route('/')
  .get(requirePermission('call_management', 'read'), getCalls)
  .post(requirePermission('call_management', 'create'), createCall);

router.route('/:id')
  .get(requirePermission('call_management', 'read'), getCall)
  .put(requirePermission('call_management', 'update'), updateCall)
  .delete(requirePermission('call_management', 'delete'), deleteCall);

module.exports = router;
