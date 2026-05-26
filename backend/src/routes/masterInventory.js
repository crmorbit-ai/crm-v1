const express = require('express');
const router = express.Router();
const MasterInventoryItem = require('../models/MasterInventoryItem');
const { protect } = require('../middleware/auth');

router.use(protect);

// ─── GET /api/master-inventory/dashboard ───────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const tenant = req.user.tenant || req.user._id?.toString() || 'default';
    const items = await MasterInventoryItem.find({ tenant, isActive: true });
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
    const itemData = {
      ...req.body,
      tenant: req.user.tenant || req.user._id?.toString() || 'default',
      createdBy: req.user.email || 'system'
    };
    const item = new MasterInventoryItem(itemData);
    await item.save();
    res.status(201).json({ success: true, data: item, message: 'Item created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create item', error: error.message });
  }
});

// ─── PATCH /api/master-inventory/:id ─────────────────────────────────────────────
router.patch('/:id', async (req, res) => {
  try {
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
