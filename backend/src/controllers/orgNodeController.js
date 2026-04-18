const OrgNode = require('../models/OrgNode');
const Tenant  = require('../models/Tenant');
const User    = require('../models/User');
const { getDataCenterConnection } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

/* ─────────────────────────────────────────────────────────────
   Helper: get the OrgNode model bound to the Data Center DB
───────────────────────────────────────────────────────────── */
const getDCModel = () => {
  const conn = getDataCenterConnection();
  if (!conn) return null;
  return conn.models.OrgNode || conn.model('OrgNode', OrgNode.schema);
};

/* ─────────────────────────────────────────────────────────────
   Helper: dual-write a document to Data Center DB
   op = 'upsert' | 'delete'
───────────────────────────────────────────────────────────── */
const syncToDataCenter = async (op, doc) => {
  try {
    const DC = getDCModel();
    if (!DC) return;
    if (op === 'delete') {
      await DC.deleteOne({ _id: doc._id });
    } else {
      const plain = doc.toObject ? doc.toObject() : doc;
      await DC.findByIdAndUpdate(plain._id, plain, { upsert: true, new: true });
    }
  } catch (err) {
    // Non-fatal — log but don't fail the main request
    console.error('[OrgNode DataCenter sync error]', err.message);
  }
};

/* ─────────────────────────────────────────────────────────────
   Helper: resolve tenant for the request
───────────────────────────────────────────────────────────── */
const getTenantId = (req) =>
  req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN'
    ? (req.query.tenantId || req.body.tenantId)
    : req.user.tenant?.toString();

/* ─────────────────────────────────────────────────────────────
   GET /api/org-nodes?tenantId=   — full tree for a tenant
───────────────────────────────────────────────────────────── */
exports.getTree = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return errorResponse(res, 400, 'tenantId required');

    const nodes = await OrgNode.find({ tenant: tenantId, isActive: true })
      .populate('linkedUser', 'firstName lastName email avatar')
      .populate('reportsTo', 'name title')
      .sort({ level: 1, order: 1 })
      .lean();

    // Build parent→children map for easy tree rendering on frontend
    const map = {};
    nodes.forEach(n => { map[n._id] = { ...n, children: [] }; });
    const roots = [];
    nodes.forEach(n => {
      if (n.parent && map[n.parent]) {
        map[n.parent].children.push(map[n._id]);
      } else {
        roots.push(map[n._id]);
      }
    });

    successResponse(res, 200, 'Org tree fetched', { tree: roots, flat: nodes, total: nodes.length });
  } catch (err) {
    console.error('getTree error:', err);
    errorResponse(res, 500, 'Server error');
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/org-nodes/tenant-users  — user list for the picker
───────────────────────────────────────────────────────────── */
exports.getTenantUsers = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return errorResponse(res, 400, 'tenantId required');

    const users = await User.find({
      tenant: tenantId,
      isActive: true,
      userType: { $in: ['TENANT_ADMIN', 'TENANT_MANAGER', 'TENANT_USER'] },
    })
      .select('firstName lastName email phone designation department userType')
      .sort({ firstName: 1 })
      .lean();

    successResponse(res, 200, 'Users fetched', { users });
  } catch (err) {
    console.error('getTenantUsers error:', err);
    errorResponse(res, 500, 'Server error');
  }
};

/* ─────────────────────────────────────────────────────────────
   POST /api/org-nodes   — create a node
───────────────────────────────────────────────────────────── */
exports.createNode = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return errorResponse(res, 400, 'tenantId required');

    let { name, title, type, email, phone, avatar, parent, order, linkedUser, reportsTo } = req.body;

    // If a user is linked, pull their details — user list is the source of truth
    if (linkedUser) {
      const userDoc = await User.findOne({ _id: linkedUser, tenant: tenantId, isActive: true })
        .select('firstName lastName email phone designation department userType');
      if (!userDoc) return errorResponse(res, 404, 'User not found in this tenant');
      name  = name  || `${userDoc.firstName} ${userDoc.lastName}`.trim();
      title = title || userDoc.designation || userDoc.department || '';
      email = email || userDoc.email || '';
      phone = phone || userDoc.phone  || '';
      // Auto-set type based on role if not explicitly provided
      if (!type) {
        if (userDoc.userType === 'TENANT_ADMIN')   type = 'person';
        else if (userDoc.userType === 'TENANT_MANAGER') type = 'person';
        else type = 'person';
      }
    }

    if (!name) return errorResponse(res, 400, 'name is required — select a user or enter a name');

    // Compute level from parent
    let level = 0;
    if (parent) {
      const parentNode = await OrgNode.findOne({ _id: parent, tenant: tenantId });
      if (!parentNode) return errorResponse(res, 404, 'Parent node not found');
      level = parentNode.level + 1;
    }

    // Auto order — place at end of siblings
    const siblingCount = await OrgNode.countDocuments({ tenant: tenantId, parent: parent || null, isActive: true });

    const node = await OrgNode.create({
      tenant: tenantId,
      name, title: title || '', type: type || 'role',
      email: email || '', phone: phone || '', avatar: avatar || '',
      parent: parent || null,
      level, order: order ?? siblingCount,
      linkedUser: linkedUser || null,
      reportsTo: reportsTo || null,
    });

    // Dual-write
    await syncToDataCenter('upsert', node);

    successResponse(res, 201, 'Node created', node);
  } catch (err) {
    console.error('createNode error:', err);
    errorResponse(res, 500, 'Server error');
  }
};

/* ─────────────────────────────────────────────────────────────
   PUT /api/org-nodes/:id   — update a node
───────────────────────────────────────────────────────────── */
exports.updateNode = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const node = await OrgNode.findOne({ _id: req.params.id, tenant: tenantId });
    if (!node) return errorResponse(res, 404, 'Node not found');

    const { name, title, type, email, phone, avatar, order, linkedUser, reportsTo } = req.body;
    if (reportsTo !== undefined) node.reportsTo = reportsTo || null;
    if (name  !== undefined) node.name  = name;
    if (title !== undefined) node.title = title;
    if (type  !== undefined) node.type  = type;
    if (email !== undefined) node.email = email;
    if (phone !== undefined) node.phone = phone;
    if (avatar !== undefined) node.avatar = avatar;
    if (order !== undefined) node.order  = order;
    if (linkedUser !== undefined) node.linkedUser = linkedUser || null;

    await node.save();

    // Dual-write
    await syncToDataCenter('upsert', node);

    successResponse(res, 200, 'Node updated', node);
  } catch (err) {
    console.error('updateNode error:', err);
    errorResponse(res, 500, 'Server error');
  }
};

/* ─────────────────────────────────────────────────────────────
   PUT /api/org-nodes/:id/move   — change parent (reparent)
   body: { newParentId }  (null = make root)
───────────────────────────────────────────────────────────── */
exports.moveNode = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const node = await OrgNode.findOne({ _id: req.params.id, tenant: tenantId });
    if (!node) return errorResponse(res, 404, 'Node not found');

    const { newParentId, order } = req.body;

    // Guard: cannot make a node its own parent or child of its own subtree
    if (newParentId) {
      if (newParentId === req.params.id) return errorResponse(res, 400, 'Cannot move node into itself');
      const newParent = await OrgNode.findOne({ _id: newParentId, tenant: tenantId });
      if (!newParent) return errorResponse(res, 404, 'New parent node not found');
      node.parent = newParentId;
      node.level  = newParent.level + 1;
    } else {
      node.parent = null;
      node.level  = 0;
    }
    if (order !== undefined) node.order = order;
    await node.save();

    // Recursively recompute levels of all descendants
    await recomputeLevels(node._id, node.level, tenantId);

    // Dual-write
    await syncToDataCenter('upsert', node);

    successResponse(res, 200, 'Node moved', node);
  } catch (err) {
    console.error('moveNode error:', err);
    errorResponse(res, 500, 'Server error');
  }
};

async function recomputeLevels(parentId, parentLevel, tenantId) {
  const children = await OrgNode.find({ parent: parentId, tenant: tenantId, isActive: true });
  for (const child of children) {
    child.level = parentLevel + 1;
    await child.save();
    await syncToDataCenter('upsert', child);
    await recomputeLevels(child._id, child.level, tenantId);
  }
}

/* ─────────────────────────────────────────────────────────────
   DELETE /api/org-nodes/:id   — soft delete (+ optionally children)
   query: ?deleteChildren=true
───────────────────────────────────────────────────────────── */
exports.deleteNode = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const node = await OrgNode.findOne({ _id: req.params.id, tenant: tenantId });
    if (!node) return errorResponse(res, 404, 'Node not found');

    if (req.query.deleteChildren === 'true') {
      // Recursively soft-delete all descendants
      await softDeleteSubtree(req.params.id, tenantId);
    } else {
      // Reassign direct children to this node's parent
      await OrgNode.updateMany(
        { parent: req.params.id, tenant: tenantId },
        { parent: node.parent, level: node.level }
      );
    }

    node.isActive = false;
    await node.save();
    await syncToDataCenter('delete', node);

    successResponse(res, 200, 'Node deleted');
  } catch (err) {
    console.error('deleteNode error:', err);
    errorResponse(res, 500, 'Server error');
  }
};

async function softDeleteSubtree(parentId, tenantId) {
  const children = await OrgNode.find({ parent: parentId, tenant: tenantId, isActive: true });
  for (const child of children) {
    await softDeleteSubtree(child._id, tenantId);
    child.isActive = false;
    await child.save();
    await syncToDataCenter('delete', child);
  }
}

/* ─────────────────────────────────────────────────────────────
   GET /api/org-nodes/search?q=&tenantId=
   Subscription-gated: requires 'crossOrgHierarchy' feature OR is own tenant
───────────────────────────────────────────────────────────── */
exports.searchEmployees = async (req, res) => {
  try {
    const { q, tenantId } = req.query;
    if (!q || q.trim().length < 1) return errorResponse(res, 400, 'Search query required');

    const ownTenantId = req.user.tenant?.toString();
    const isSaas = req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN';

    // Searching own org — always allowed
    const targetTenant = tenantId || ownTenantId;
    const isOwnOrg = targetTenant === ownTenantId;

    // Searching another org — requires subscription feature
    if (!isSaas && !isOwnOrg) {
      const tenant = await Tenant.findById(ownTenantId).populate('subscription.plan');
      const hasFeature = tenant?.subscription?.plan?.features?.crossOrgHierarchy === true;
      if (!hasFeature) {
        return errorResponse(res, 403, 'Upgrade to Enterprise to search employees across organizations');
      }
    }

    const regex = new RegExp(q.trim(), 'i');
    const query = {
      tenant: targetTenant,
      isActive: true,
      $or: [
        { name:  regex },
        { title: regex },
        { email: regex },
        { phone: regex },
        { type:  regex },
      ],
    };

    const results = await OrgNode.find(query)
      .populate('linkedUser', 'firstName lastName email')
      .populate('parent', 'name title')
      .sort({ level: 1, order: 1 })
      .limit(30)
      .lean();

    successResponse(res, 200, 'Search results', { results, total: results.length });
  } catch (err) {
    console.error('searchEmployees error:', err);
    errorResponse(res, 500, 'Server error');
  }
};

/* ─────────────────────────────────────────────────────────────
   DELETE /api/org-nodes/clear-all  — delete entire tree
───────────────────────────────────────────────────────────── */
exports.clearAll = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return errorResponse(res, 400, 'tenantId required');

    const nodes = await OrgNode.find({ tenant: tenantId, isActive: true }).select('_id').lean();
    await OrgNode.updateMany({ tenant: tenantId, isActive: true }, { isActive: false });

    // Sync deletions to DataCenter
    const DC = getDCModel();
    if (DC) {
      await Promise.all(nodes.map(n => DC.deleteOne({ _id: n._id }).catch(() => {})));
    }

    successResponse(res, 200, `${nodes.length} nodes deleted`);
  } catch (err) {
    console.error('clearAll error:', err);
    errorResponse(res, 500, 'Server error');
  }
};

/* ─────────────────────────────────────────────────────────────
   POST /api/org-nodes/bulk-reorder
   body: [{ id, order }]  — reorder siblings
───────────────────────────────────────────────────────────── */
exports.bulkReorder = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { items } = req.body; // [{ id, order }]
    if (!Array.isArray(items)) return errorResponse(res, 400, 'items array required');

    await Promise.all(items.map(({ id, order }) =>
      OrgNode.findOneAndUpdate({ _id: id, tenant: tenantId }, { order })
    ));

    successResponse(res, 200, 'Reordered');
  } catch (err) {
    console.error('bulkReorder error:', err);
    errorResponse(res, 500, 'Server error');
  }
};
