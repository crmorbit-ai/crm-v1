const RoleTemplate = require('../models/RoleTemplate');
const OrgNode      = require('../models/OrgNode');
const { getDataCenterConnection } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const crypto = require('crypto');
const shortId = () => crypto.randomBytes(4).toString('hex');

const getTenantId = (req) =>
  req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN'
    ? (req.query.tenantId || req.body.tenantId)
    : req.user.tenant?.toString();

/* ── Sync OrgNode to DataCenter ────────────────────────── */
const syncDC = async (doc) => {
  try {
    const conn = getDataCenterConnection();
    if (!conn) return;
    const DC = conn.models.OrgNode || conn.model('OrgNode', OrgNode.schema);
    const plain = doc.toObject ? doc.toObject() : doc;
    await DC.findByIdAndUpdate(plain._id, plain, { upsert: true, new: true });
  } catch (e) { console.error('[RoleTemplate DC sync]', e.message); }
};

/* ── Auto-detect field value from a lead doc ────────────
   Tries multiple common field names, returns first match
─────────────────────────────────────────────────────── */
const autoDetect = (lead, patterns) => {
  for (const p of patterns) {
    const val = lead[p];
    if (val && typeof val === 'string' && val.trim()) return val.trim();
  }
  // Fallback: scan all keys for a key matching any pattern
  for (const key of Object.keys(lead)) {
    if (patterns.some(p => key.toLowerCase().includes(p.toLowerCase()))) {
      const val = lead[key];
      if (val && typeof val === 'string' && val.trim()) return val.trim();
    }
  }
  return '';
};

const resolveName  = (lead) => {
  const full = autoDetect(lead, ['name','fullName','full_name']);
  if (full) return full;
  const first = autoDetect(lead, ['firstName','first_name','fname','givenName']);
  const last  = autoDetect(lead, ['lastName','last_name','lname','surname','familyName']);
  return `${first} ${last}`.trim() || 'Unknown';
};
const resolveDesig = (lead) => autoDetect(lead, ['designation','title','jobTitle','job_title','position','role','post','grade']);
const resolveDept  = (lead) => autoDetect(lead, ['department','dept','division','team','unit','group','function']);
const resolveEmail = (lead) => autoDetect(lead, ['email','emailAddress','email_address','mail']);
const resolvePhone = (lead) => autoDetect(lead, ['phone','mobile','phoneNumber','phone_number','contact','cell']);

/* ──────────────────────────────────────────────────────────
   GET /api/role-templates
─────────────────────────────────────────────────────────*/
exports.getTemplate = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return errorResponse(res, 400, 'tenantId required');
    const template = await RoleTemplate.findOne({ tenant: tenantId, isActive: true });
    successResponse(res, 200, 'Template fetched', { template });
  } catch (err) { errorResponse(res, 500, err.message); }
};

/* ──────────────────────────────────────────────────────────
   POST /api/role-templates  — create or replace template
─────────────────────────────────────────────────────────*/
exports.saveTemplate = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return errorResponse(res, 400, 'tenantId required');

    const { templateName, roles } = req.body;
    if (!Array.isArray(roles) || roles.length === 0)
      return errorResponse(res, 400, 'roles array is required');

    const normalised = roles.map((r, i) => ({
      roleId:       r.roleId || `role_${i}_${shortId()}`,
      roleName:     r.roleName || 'Unnamed',
      level:        r.level ?? i,
      type:         r.type || 'role',
      parentRoleId: r.parentRoleId || null,
      keywords:     (r.keywords || []).map(k => k.toLowerCase().trim()).filter(Boolean),
      order:        r.order ?? i,
    }));

    const template = await RoleTemplate.findOneAndUpdate(
      { tenant: tenantId },
      { tenant: tenantId, templateName: templateName || 'Default Hierarchy Template', roles: normalised, isActive: true },
      { upsert: true, new: true }
    );

    successResponse(res, 200, 'Template saved', { template });
  } catch (err) { errorResponse(res, 500, err.message); }
};

/* ──────────────────────────────────────────────────────────
   POST /api/role-templates/preview-match
   — dry run without field mapping — auto-detects fields
─────────────────────────────────────────────────────────*/
exports.previewMatch = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return errorResponse(res, 400, 'tenantId required');

    const template = await RoleTemplate.findOne({ tenant: tenantId, isActive: true });
    if (!template) return errorResponse(res, 404, 'No template found — save a template first');

    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    const rawLeads = await db.collection('leads')
      .find({ tenant: new mongoose.Types.ObjectId(tenantId), isActive: true })
      .toArray();

    const rolesSorted = [...template.roles].sort((a, b) => a.level - b.level || a.order - b.order);
    const matchCounts = {};
    rolesSorted.forEach(r => { matchCounts[r.roleId] = { roleName: r.roleName, level: r.level, count: 0, sample: [] }; });

    const unmatched = [];

    rawLeads.forEach(lead => {
      const desig = resolveDesig(lead).toLowerCase();
      if (!desig) return;

      let matched = false;
      for (const role of rolesSorted) {
        const kws = role.keywords || [];
        const isMatch =
          kws.some(kw => desig.includes(kw) || kw.includes(desig)) ||
          desig.includes(role.roleName.toLowerCase()) ||
          role.roleName.toLowerCase().includes(desig);
        if (isMatch) {
          matchCounts[role.roleId].count++;
          if (matchCounts[role.roleId].sample.length < 3) matchCounts[role.roleId].sample.push(resolveDesig(lead));
          matched = true;
          break;
        }
      }
      if (!matched) unmatched.push(resolveDesig(lead));
    });

    const totalMatched = Object.values(matchCounts).reduce((s, r) => s + r.count, 0);

    successResponse(res, 200, 'Preview ready', {
      matchCounts,
      totalLeads:      rawLeads.length,
      totalMatched,
      unmatchedCount:  unmatched.length,
      unmatchedSample: [...new Set(unmatched)].slice(0, 20),
    });
  } catch (err) { errorResponse(res, 500, err.message); }
};

/* ──────────────────────────────────────────────────────────
   POST /api/role-templates/generate-tree
   — auto-detects all fields, no mapping needed
   body: { clearExisting: true/false }
─────────────────────────────────────────────────────────*/
exports.generateTree = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return errorResponse(res, 400, 'tenantId required');

    const { clearExisting = false } = req.body;

    const template = await RoleTemplate.findOne({ tenant: tenantId, isActive: true });
    if (!template) return errorResponse(res, 404, 'No role template found — create one first');
    if (!template.roles.length) return errorResponse(res, 400, 'Template has no roles defined');

    if (clearExisting) await OrgNode.updateMany({ tenant: tenantId }, { isActive: false });

    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    const rawLeads = await db.collection('leads')
      .find({ tenant: new mongoose.Types.ObjectId(tenantId), isActive: true })
      .toArray();

    const rolesSorted = [...template.roles].sort((a, b) => a.level - b.level || a.order - b.order);

    // Step 1: Create role structure nodes
    const roleNodeMap = {};
    for (const role of rolesSorted) {
      const parentNodeId = role.parentRoleId ? roleNodeMap[role.parentRoleId] : null;
      const parentNode   = parentNodeId ? await OrgNode.findById(parentNodeId) : null;
      const node = await OrgNode.create({
        tenant:   tenantId,
        name:     role.roleName,
        title:    role.roleName,
        type:     role.type || 'role',
        parent:   parentNodeId || null,
        level:    parentNode ? parentNode.level + 1 : (role.level || 0),
        order:    role.order ?? 0,
        isActive: true,
      });
      await syncDC(node);
      roleNodeMap[role.roleId] = node._id;
    }

    // Step 2: Match leads → role → create person nodes in batches
    let matched = 0, unmatched = 0;
    const BATCH = 200;

    for (let i = 0; i < rawLeads.length; i += BATCH) {
      const batch = rawLeads.slice(i, i + BATCH);
      const toCreate = [];

      for (const lead of batch) {
        const name  = resolveName(lead);
        const desig = resolveDesig(lead).toLowerCase();
        const email = resolveEmail(lead);
        const phone = resolvePhone(lead);
        const dept  = resolveDept(lead);

        let matchedRoleId = null;
        for (const role of rolesSorted) {
          const kws = role.keywords || [];
          const isMatch =
            kws.some(kw => desig.includes(kw) || kw.includes(desig)) ||
            (desig && (desig.includes(role.roleName.toLowerCase()) || role.roleName.toLowerCase().includes(desig)));
          if (isMatch) { matchedRoleId = role.roleId; break; }
        }

        // Soft-match fallback
        if (!matchedRoleId && desig) {
          for (const role of rolesSorted) {
            const words = role.roleName.toLowerCase().split(/\s+/);
            if (words.some(w => w.length > 3 && desig.includes(w))) {
              matchedRoleId = role.roleId; break;
            }
          }
        }

        const parentNodeId = matchedRoleId ? roleNodeMap[matchedRoleId] : null;
        const parentNode   = parentNodeId ? await OrgNode.findById(parentNodeId) : null;

        toCreate.push({
          tenant: tenantId, name, title: resolveDesig(lead),
          type: 'person', email, phone, department: dept,
          parent:   parentNodeId || null,
          level:    parentNode ? parentNode.level + 1 : 99,
          order:    i,
          isActive: true,
        });

        if (matchedRoleId) matched++; else unmatched++;
      }

      const created = await OrgNode.insertMany(toCreate);
      for (const node of created) await syncDC(node);
    }

    const totalNodes = await OrgNode.countDocuments({ tenant: tenantId, isActive: true });

    successResponse(res, 200, 'Tree generated', {
      totalLeads: rawLeads.length, matched, unmatched,
      totalNodes, rolesCreated: rolesSorted.length,
    });
  } catch (err) {
    console.error('generateTree error:', err);
    errorResponse(res, 500, err.message);
  }
};
