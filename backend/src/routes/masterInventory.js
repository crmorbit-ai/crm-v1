const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getDataCenterConnection } = require('../config/database');

// ═══════════════════════════════════════════════════════════════
// 🌐 DATA CENTER MODEL - Shared across all tenants
// ═══════════════════════════════════════════════════════════════
const getMasterInventoryModel = () => {
  const dataCenterConnection = getDataCenterConnection();
  if (!dataCenterConnection) {
    console.error('❌ Data Center connection not available!');
    throw new Error('Data Center database not available');
  }

  console.log('✅ Using Data Center DB:', dataCenterConnection.name);

  // Check if model already exists
  if (dataCenterConnection.models.MasterInventoryItem) {
    console.log('📦 Using existing MasterInventoryItem model from Data Center DB');
    return dataCenterConnection.models.MasterInventoryItem;
  }

  console.log('🆕 Creating new MasterInventoryItem model in Data Center DB');

  // Define schema
  const mongoose = require('mongoose');
  const masterInventoryItemSchema = new mongoose.Schema({
    tenant: { type: String, required: true, index: true },
    serialNumber: { type: String, unique: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['product', 'service', 'lead'], required: true, index: true },
    department: { type: String, default: 'sales', index: true },
    status: { type: String, enum: ['new', 'quoted', 'won', 'lost'], default: 'new', index: true },
    description: String,

    // Product fields
    sku: String,
    category: String,
    productPrice: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },

    // Service fields
    serviceType: String,
    duration: String,
    serviceRate: { type: Number, default: 0 },

    // Lead fields
    leadName: String,
    leadEmail: String,
    leadPhone: String,
    leadSource: String,

    // Financial
    quotedAmount: { type: Number, default: 0 },
    wonAmount: { type: Number, default: 0 },
    receivedAmount: { type: Number, default: 0 },

    // Additional
    notes: String,
    tags: [String],

    // Assignment
    assignedGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
    assignedMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    assignedToName: String,

    createdBy: { type: String, default: 'system' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
  });

  masterInventoryItemSchema.index({ tenant: 1, name: 1 });
  masterInventoryItemSchema.index({ tenant: 1, type: 1 });
  masterInventoryItemSchema.index({ tenant: 1, status: 1 });

  return dataCenterConnection.model('MasterInventoryItem', masterInventoryItemSchema);
};

router.use(protect);

// ─── GET /api/master-inventory/dashboard ───────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const MasterInventoryItem = getMasterInventoryModel();
    const tenant = req.user.tenant || req.user._id?.toString() || 'default';
    const { type, department } = req.query;

    const query = { tenant, isActive: true };
    if (type) query.type = type;
    if (department) query.department = department;

    const items = await MasterInventoryItem.find(query);

    const byType = {
      product: items.filter(i => i.type === 'product').length,
      service: items.filter(i => i.type === 'service').length,
      lead: items.filter(i => i.type === 'lead').length
    };

    const byDept = {};
    items.forEach(item => {
      byDept[item.department] = (byDept[item.department] || 0) + 1;
    });

    res.json({ success: true, data: { byType, byDept, total: items.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load dashboard', error: error.message });
  }
});

// ─── GET /api/master-inventory ───────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const MasterInventoryItem = getMasterInventoryModel();
    const { page = 1, limit = 50, search, type, department, status } = req.query;
    const tenant = req.user.tenant || req.user._id?.toString() || 'default';
    const query = { tenant, isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { leadEmail: { $regex: search, $options: 'i' } }
      ];
    }
    if (type) query.type = type;
    if (department) query.department = department;
    if (status) query.status = status;

    const total = await MasterInventoryItem.countDocuments(query);
    const items = await MasterInventoryItem.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch items', error: error.message });
  }
});

// ─── GET /api/master-inventory/type/:type ─────────────────────────────────────
router.get('/type/:type', async (req, res) => {
  try {
    const MasterInventoryItem = getMasterInventoryModel();
    const { page = 1, limit = 50, search } = req.query;
    const { type } = req.params;
    const tenant = req.user.tenant || req.user._id?.toString() || 'default';
    const query = { tenant, type, isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await MasterInventoryItem.countDocuments(query);
    const items = await MasterInventoryItem.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch items', error: error.message });
  }
});

// ─── GET /api/master-inventory/:id ────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const MasterInventoryItem = getMasterInventoryModel();
    const tenant = req.user.tenant || req.user._id?.toString() || 'default';
    const item = await MasterInventoryItem.findOne({ _id: req.params.id, tenant });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch item', error: error.message });
  }
});

// ─── POST /api/master-inventory ──────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    console.log('🔵 POST /api/master-inventory - Creating item...');
    const MasterInventoryItem = getMasterInventoryModel();
    console.log('📊 Model DB:', MasterInventoryItem.db.name);
    console.log('📊 Collection:', MasterInventoryItem.collection.name);

    // Generate Serial Number
    const year = new Date().getFullYear();
    const type = req.body.type || 'product';
    const prefix = type === 'product' ? 'MI-P' : type === 'service' ? 'MI-S' : 'MI-L';

    // Find the last serial number for this type and year
    const lastItem = await MasterInventoryItem.findOne({
      serialNumber: { $regex: `^${prefix}-${year}-` }
    }).sort({ serialNumber: -1 });

    let serialNumber;
    if (lastItem && lastItem.serialNumber) {
      // Extract the counter from last serial number
      const match = lastItem.serialNumber.match(/-(\d+)$/);
      const lastCounter = match ? parseInt(match[1]) : 0;
      const newCounter = String(lastCounter + 1).padStart(4, '0');
      serialNumber = `${prefix}-${year}-${newCounter}`;
    } else {
      // First item of this type in this year
      serialNumber = `${prefix}-${year}-0001`;
    }

    const itemData = {
      ...req.body,
      serialNumber,
      tenant: req.user.tenant || req.user._id?.toString() || 'default',
      createdBy: req.user.email || 'system'
    };
    const item = new MasterInventoryItem(itemData);
    await item.save();

    console.log('✅ Item saved to:', item.collection.name, 'in DB:', item.db.name);
    console.log('🔢 Generated Serial Number:', serialNumber);
    res.status(201).json({ success: true, data: item, message: 'Item created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create item', error: error.message });
  }
});

// ─── PATCH /api/master-inventory/:id ─────────────────────────────────────────────
router.patch('/:id', async (req, res) => {
  try {
    const MasterInventoryItem = getMasterInventoryModel();
    const { _id, tenant: _, createdAt, createdBy, ...updateData } = req.body;
    updateData.updatedAt = new Date();
    const tenant = req.user.tenant || req.user._id?.toString() || 'default';
    const item = await MasterInventoryItem.findOneAndUpdate(
      { _id: req.params.id, tenant },
      updateData,
      { new: true }
    );
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, data: item, message: 'Item updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update item', error: error.message });
  }
});

// ─── DELETE /api/master-inventory/:id ────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const MasterInventoryItem = getMasterInventoryModel();
    const tenant = req.user.tenant || req.user._id?.toString() || 'default';
    const item = await MasterInventoryItem.findOneAndUpdate(
      { _id: req.params.id, tenant },
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete item', error: error.message });
  }
});

module.exports = router;
