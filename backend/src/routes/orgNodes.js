const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const ctrl    = require('../controllers/orgNodeController');

router.use(protect);

// Tree & search
router.get('/',               ctrl.getTree);
router.get('/search',         ctrl.searchEmployees);
router.get('/tenant-users',   ctrl.getTenantUsers);

// CRUD
router.post('/',              ctrl.createNode);
router.put('/bulk-reorder',   ctrl.bulkReorder);
router.delete('/clear-all',   ctrl.clearAll);
router.put('/:id',            ctrl.updateNode);
router.put('/:id/move',       ctrl.moveNode);
router.delete('/:id',         ctrl.deleteNode);

module.exports = router;
