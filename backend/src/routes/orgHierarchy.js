const express = require('express');
const router = express.Router();
const { getOrgList, getOrgUsers } = require('../controllers/orgHierarchyController');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/org-hierarchy/tenants — list all orgs for switcher
router.get('/tenants', getOrgList);

// GET /api/org-hierarchy/:targetTenantId/users — get users of target org
router.get('/:targetTenantId/users', getOrgUsers);

module.exports = router;
