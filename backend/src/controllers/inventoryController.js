const ProductItem = require('../models/ProductItem');
const StockTransaction = require('../models/StockTransaction');
const PurchaseOrder = require('../models/PurchaseOrder');

// ─── GET /api/inventory ───────────────────────────────────────────────────────
exports.getInventory = async (req, res) => {
  try {
    const { search, stockStatus, category, itemType, page = 1, limit = 50 } = req.query;
    const query = { tenant: req.user.tenant, isActive: true };

    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { articleNumber: { $regex: search, $options: 'i' } }];
    if (category) query.category = category;
    if (itemType) query.itemType = itemType;

    let products = await ProductItem.find(query).sort({ name: 1 });

    if (stockStatus === 'low')  products = products.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold);
    else if (stockStatus === 'out')  products = products.filter(p => p.stock === 0);
    else if (stockStatus === 'ok')  products = products.filter(p => p.stock > p.lowStockThreshold);

    const total = products.length;
    const paginated = products.slice((page - 1) * limit, page * limit);

    const allProducts = await ProductItem.find({ tenant: req.user.tenant, isActive: true });
    const summary = {
      totalProducts: allProducts.length,
      outOfStock: allProducts.filter(p => p.stock === 0).length,
      lowStock: allProducts.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold).length,
      totalStockValue: allProducts.reduce((sum, p) => sum + (p.stock * (p.costPrice || p.price)), 0),
      totalCommitted: allProducts.reduce((sum, p) => sum + p.committedStock, 0),
    };

    res.json({ success: true, data: { products: paginated, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) }, summary } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch inventory', error: error.message });
  }
};

// ─── POST /api/inventory/po/:poId/receive ─────────────────────────────────────
exports.receivePO = async (req, res) => {
  try {
    const { items, notes } = req.body;
    // items: [{ product: id, quantity: n }]

    const po = await PurchaseOrder.findOne({ _id: req.params.poId, tenant: req.user.tenant });
    if (!po) return res.status(404).json({ success: false, message: 'Purchase Order not found' });
    if (po.receiveStatus === 'fully_received') return res.status(400).json({ success: false, message: 'This PO is already fully received' });

    const receiveItems = [];

    for (const receiveItem of items) {
      if (!receiveItem.quantity || receiveItem.quantity <= 0) continue;

      const poItem = po.items.find(i => i.product?.toString() === receiveItem.product);
      if (!poItem) continue;

      const pending = poItem.quantity - (poItem.receivedQuantity || 0);
      const toReceive = Math.min(receiveItem.quantity, pending);
      if (toReceive <= 0) continue;

      // Update stock
      const product = await ProductItem.findOne({ _id: receiveItem.product, tenant: req.user.tenant });
      if (!product) continue;

      const previousStock = product.stock;
      product.stock += toReceive;
      await product.save();

      // Log transaction
      await StockTransaction.create({
        tenant: req.user.tenant,
        product: product._id,
        productName: product.name,
        type: 'stock_in',
        quantity: toReceive,
        previousStock,
        newStock: product.stock,
        reason: `PO received — ${po.poNumber}`,
        referenceType: 'purchase_order',
        referenceId: po._id,
        referenceNumber: po.poNumber,
        createdBy: req.user.id
      });

      // Update PO item received qty
      poItem.receivedQuantity = (poItem.receivedQuantity || 0) + toReceive;
      receiveItems.push({ product: product._id, productName: product.name, quantity: toReceive });
    }

    // Log receive event on PO
    po.receives.push({ receiveDate: new Date(), receivedBy: req.user.id, items: receiveItems, notes });

    // Update receive status
    const allFullyReceived = po.items.every(i => (i.receivedQuantity || 0) >= i.quantity);
    const anyReceived = po.items.some(i => (i.receivedQuantity || 0) > 0);
    po.receiveStatus = allFullyReceived ? 'fully_received' : anyReceived ? 'partially_received' : 'pending';
    if (allFullyReceived) po.status = 'completed';

    await po.save();

    res.json({ success: true, message: `${receiveItems.length} item(s) received and stock updated`, data: { poNumber: po.poNumber, receiveStatus: po.receiveStatus, receivedItems: receiveItems } });
  } catch (error) {
    console.error('receivePO error:', error);
    res.status(500).json({ success: false, message: 'Failed to receive PO', error: error.message });
  }
};

// ─── POST /api/inventory/:productId/adjust ────────────────────────────────────
exports.adjustStock = async (req, res) => {
  try {
    const { type, quantity, reason } = req.body;

    if (!['stock_in', 'stock_out', 'adjustment'].includes(type))
      return res.status(400).json({ success: false, message: 'Invalid type' });
    if (!quantity || quantity <= 0)
      return res.status(400).json({ success: false, message: 'Quantity must be greater than 0' });

    const product = await ProductItem.findOne({ _id: req.params.productId, tenant: req.user.tenant });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const previousStock = product.stock;
    let newStock;

    if (type === 'stock_in') newStock = previousStock + Number(quantity);
    else if (type === 'stock_out') {
      if (previousStock < quantity) return res.status(400).json({ success: false, message: `Insufficient stock. Available: ${previousStock}` });
      newStock = previousStock - Number(quantity);
    } else {
      newStock = Number(quantity);
    }

    product.stock = newStock;
    await product.save();

    await StockTransaction.create({
      tenant: req.user.tenant,
      product: product._id,
      productName: product.name,
      type,
      quantity: Number(quantity),
      previousStock,
      newStock,
      reason: reason || 'Manual adjustment',
      referenceType: 'manual',
      createdBy: req.user.id
    });

    res.json({ success: true, message: 'Stock updated', data: { productId: product._id, previousStock, newStock } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to adjust stock', error: error.message });
  }
};

// ─── GET /api/inventory/transactions ─────────────────────────────────────────
exports.getTransactions = async (req, res) => {
  try {
    const { productId, type, page = 1, limit = 30 } = req.query;
    const query = { tenant: req.user.tenant };
    if (productId) query.product = productId;
    if (type) query.type = type;

    const total = await StockTransaction.countDocuments(query);
    const transactions = await StockTransaction.find(query)
      .populate('product', 'name articleNumber')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: { transactions, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch transactions', error: error.message });
  }
};

// ─── GET /api/inventory/low-stock ────────────────────────────────────────────
exports.getLowStock = async (req, res) => {
  try {
    const products = await ProductItem.find({ tenant: req.user.tenant, isActive: true });
    const lowStockItems = products.filter(p => p.stock <= p.lowStockThreshold);
    res.json({ success: true, data: lowStockItems });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch low stock', error: error.message });
  }
};

// ─── PATCH /api/inventory/:productId/threshold ───────────────────────────────
exports.updateThreshold = async (req, res) => {
  try {
    const product = await ProductItem.findOneAndUpdate(
      { _id: req.params.productId, tenant: req.user.tenant },
      { lowStockThreshold: req.body.lowStockThreshold, reorderPoint: req.body.reorderPoint, reorderQuantity: req.body.reorderQuantity },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Settings updated', data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update settings', error: error.message });
  }
};

// ─── GET /api/inventory/reports/summary ──────────────────────────────────────
exports.getStockSummary = async (req, res) => {
  try {
    const products = await ProductItem.find({ tenant: req.user.tenant, isActive: true });

    const summary = products.map(p => ({
      _id: p._id,
      name: p.name,
      articleNumber: p.articleNumber,
      category: p.category,
      unit: p.unit,
      openingStock: 0, // will compute from transactions
      stockIn: 0,
      stockOut: 0,
      currentStock: p.stock,
      committedStock: p.committedStock,
      availableStock: Math.max(0, p.stock - p.committedStock),
      costPrice: p.costPrice,
      sellingPrice: p.price,
      stockValue: p.stock * (p.costPrice || p.price),
      stockStatus: p.stockStatus
    }));

    // Enrich with transaction totals
    const transactions = await StockTransaction.find({ tenant: req.user.tenant });
    for (const item of summary) {
      const itemTx = transactions.filter(t => t.product?.toString() === item._id.toString());
      item.stockIn = itemTx.filter(t => t.type === 'stock_in').reduce((s, t) => s + t.quantity, 0);
      item.stockOut = itemTx.filter(t => t.type === 'stock_out').reduce((s, t) => s + t.quantity, 0);
    }

    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate summary', error: error.message });
  }
};

// ─── GET /api/inventory/reports/valuation ────────────────────────────────────
exports.getStockValuation = async (req, res) => {
  try {
    const products = await ProductItem.find({ tenant: req.user.tenant, isActive: true });
    const totalValue = products.reduce((sum, p) => sum + p.stock * (p.costPrice || p.price), 0);
    const data = products.map(p => ({
      _id: p._id, name: p.name, articleNumber: p.articleNumber, category: p.category,
      stock: p.stock, costPrice: p.costPrice, sellingPrice: p.price,
      stockValue: p.stock * (p.costPrice || p.price),
      potentialRevenue: p.stock * p.price
    })).sort((a, b) => b.stockValue - a.stockValue);

    res.json({ success: true, data: { items: data, totalValue, totalPotentialRevenue: data.reduce((s, i) => s + i.potentialRevenue, 0) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate valuation', error: error.message });
  }
};

// ─── GET /api/inventory/reports/abc ──────────────────────────────────────────
exports.getABCAnalysis = async (req, res) => {
  try {
    const transactions = await StockTransaction.find({ tenant: req.user.tenant, type: 'stock_out' })
      .populate('product', 'name articleNumber category price');

    // Group by product
    const productMap = {};
    for (const tx of transactions) {
      if (!tx.product) continue;
      const id = tx.product._id.toString();
      if (!productMap[id]) productMap[id] = { product: tx.product, totalQty: 0, totalRevenue: 0 };
      productMap[id].totalQty += tx.quantity;
      productMap[id].totalRevenue += tx.quantity * (tx.product.price || 0);
    }

    const items = Object.values(productMap).sort((a, b) => b.totalRevenue - a.totalRevenue);
    const totalRevenue = items.reduce((s, i) => s + i.totalRevenue, 0);

    let cumulative = 0;
    const result = items.map(item => {
      cumulative += item.totalRevenue;
      const cumulativePercent = totalRevenue > 0 ? (cumulative / totalRevenue) * 100 : 0;
      return {
        _id: item.product._id,
        name: item.product.name,
        articleNumber: item.product.articleNumber,
        category: item.product.category,
        totalQtySold: item.totalQty,
        totalRevenue: item.totalRevenue,
        revenuePercent: totalRevenue > 0 ? ((item.totalRevenue / totalRevenue) * 100).toFixed(1) : 0,
        cumulativePercent: cumulativePercent.toFixed(1),
        abcClass: cumulativePercent <= 80 ? 'A' : cumulativePercent <= 95 ? 'B' : 'C'
      };
    });

    res.json({ success: true, data: { items: result, totalRevenue, summary: { A: result.filter(i => i.abcClass === 'A').length, B: result.filter(i => i.abcClass === 'B').length, C: result.filter(i => i.abcClass === 'C').length } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate ABC analysis', error: error.message });
  }
};

// ─── GET /api/inventory/reports/aging ────────────────────────────────────────
exports.getStockAging = async (req, res) => {
  try {
    const products = await ProductItem.find({ tenant: req.user.tenant, isActive: true, stock: { $gt: 0 } });
    const transactions = await StockTransaction.find({ tenant: req.user.tenant, type: 'stock_in' }).sort({ createdAt: 1 });

    const now = new Date();
    const result = products.map(p => {
      const lastReceive = transactions.filter(t => t.product?.toString() === p._id.toString()).pop();
      const daysSinceReceive = lastReceive ? Math.floor((now - new Date(lastReceive.createdAt)) / (1000 * 60 * 60 * 24)) : null;
      let agingBucket = 'No receive recorded';
      if (daysSinceReceive !== null) {
        if (daysSinceReceive <= 30) agingBucket = '0-30 days';
        else if (daysSinceReceive <= 60) agingBucket = '31-60 days';
        else if (daysSinceReceive <= 90) agingBucket = '61-90 days';
        else agingBucket = '90+ days';
      }
      return {
        _id: p._id, name: p.name, articleNumber: p.articleNumber, category: p.category,
        stock: p.stock, lastReceiveDate: lastReceive?.createdAt || null,
        daysSinceReceive, agingBucket,
        stockValue: p.stock * (p.costPrice || p.price)
      };
    }).sort((a, b) => (b.daysSinceReceive || 0) - (a.daysSinceReceive || 0));

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate aging report', error: error.message });
  }
};

// ─── GET /api/inventory/by-type ─────────────────────────────────────────────
exports.getInventoryByType = async (req, res) => {
  try {
    const { itemType, page = 1, limit = 50 } = req.query;
    const query = { tenant: req.user.tenant, isActive: true };

    if (itemType) query.itemType = itemType;

    let items = await ProductItem.find(query).sort({ name: 1 });
    const total = items.length;
    const paginated = items.slice((page - 1) * limit, page * limit);

    const summary = {
      total: total,
      byItemType: {
        product: await ProductItem.countDocuments({ ...query, itemType: 'product' }),
        service: await ProductItem.countDocuments({ ...query, itemType: 'service' }),
        lead: await ProductItem.countDocuments({ ...query, itemType: 'lead' })
      }
    };

    res.json({ success: true, data: { items: paginated, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) }, summary } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch inventory by type', error: error.message });
  }
};

// ─── GET /api/inventory/service ──────────────────────────────────────────────
exports.getServiceInventory = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 50 } = req.query;
    const query = { tenant: req.user.tenant, isActive: true, itemType: 'service' };

    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { articleNumber: { $regex: search, $options: 'i' } }];
    if (category) query.category = category;

    let services = await ProductItem.find(query).sort({ name: 1 });
    const total = services.length;
    const paginated = services.slice((page - 1) * limit, page * limit);

    const summary = {
      totalServices: services.length,
      outOfStock: services.filter(s => s.stock === 0).length,
      lowStock: services.filter(s => s.stock > 0 && s.stock <= s.lowStockThreshold).length,
      available: services.filter(s => s.stock > s.lowStockThreshold).length
    };

    res.json({ success: true, data: { services: paginated, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) }, summary } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch service inventory', error: error.message });
  }
};

// ─── GET /api/inventory/lead ────────────────────────────────────────────────
exports.getLeadInventory = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 50 } = req.query;
    const query = { tenant: req.user.tenant, isActive: true, itemType: 'lead' };

    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { articleNumber: { $regex: search, $options: 'i' } }];
    if (category) query.category = category;

    let leads = await ProductItem.find(query).sort({ name: 1 });
    const total = leads.length;
    const paginated = leads.slice((page - 1) * limit, page * limit);

    const summary = {
      totalLeads: leads.length,
      outOfStock: leads.filter(l => l.stock === 0).length,
      lowStock: leads.filter(l => l.stock > 0 && l.stock <= l.lowStockThreshold).length,
      available: leads.filter(l => l.stock > l.lowStockThreshold).length
    };

    res.json({ success: true, data: { leads: paginated, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) }, summary } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch lead inventory', error: error.message });
  }
};

// ─── GET /api/inventory/hr-visibility ────────────────────────────────────────
exports.getHRVisibility = async (req, res) => {
  try {
    const { itemType = 'service' } = req.query;
    const query = { tenant: req.user.tenant, isActive: true, itemType };

    const items = await ProductItem.find(query).sort({ name: 1 });

    const visibility = items.map(item => ({
      _id: item._id,
      name: item.name,
      category: item.category,
      stock: item.stock,
      availableStock: item.availableStock,
      lowStockThreshold: item.lowStockThreshold,
      isAvailable: item.stock > 0,
      stockStatus: item.stockStatus,
      unit: item.unit
    }));

    const summary = {
      total: items.length,
      available: visibility.filter(v => v.isAvailable).length,
      outOfStock: visibility.filter(v => v.stock === 0).length,
      lowStock: visibility.filter(v => v.stock > 0 && v.stock <= v.lowStockThreshold).length
    };

    res.json({ success: true, data: { visibility, summary } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch HR visibility', error: error.message });
  }
};

// ─── GET /api/inventory/categories-breakdown ────────────────────────────────
exports.getCategoriesBreakdown = async (req, res) => {
  try {
    const items = await ProductItem.find({ tenant: req.user.tenant, isActive: true });

    const categoriesMap = {};

    for (const item of items) {
      const key = `${item.categoryType || 'product'}:${item.category}`;
      if (!categoriesMap[key]) {
        categoriesMap[key] = {
          categoryType: item.categoryType || 'product',
          category: item.category,
          items: [],
          totalStock: 0,
          totalCommitted: 0,
          totalAvailable: 0
        };
      }

      categoriesMap[key].items.push({
        _id: item._id,
        name: item.name,
        articleNumber: item.articleNumber,
        stock: item.stock,
        committedStock: item.committedStock,
        availableStock: item.availableStock
      });

      categoriesMap[key].totalStock += item.stock;
      categoriesMap[key].totalCommitted += item.committedStock;
      categoriesMap[key].totalAvailable += item.availableStock;
    }

    const breakdown = Object.values(categoriesMap).sort((a, b) =>
      a.categoryType.localeCompare(b.categoryType) || a.category.localeCompare(b.category)
    );

    res.json({ success: true, data: breakdown });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories breakdown', error: error.message });
  }
};

// ─── POST /api/inventory/check-availability ──────────────────────────────────
exports.checkAvailability = async (req, res) => {
  try {
    const { items } = req.body; // items: [{ productId: id, quantity: n }, ...]

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items array is required' });
    }

    const results = [];
    const unavailable = [];

    for (const item of items) {
      const product = await ProductItem.findOne({ _id: item.productId, tenant: req.user.tenant });
      if (!product) {
        unavailable.push({ productId: item.productId, reason: 'Product not found' });
        continue;
      }

      const availableStock = product.stock - product.committedStock;
      const isAvailable = availableStock >= item.quantity;

      results.push({
        productId: product._id,
        productName: product.name,
        requiredQty: item.quantity,
        availableQty: availableStock,
        stockOnHand: product.stock,
        committedQty: product.committedStock,
        isAvailable,
        itemType: product.itemType,
        category: product.category
      });

      if (!isAvailable) {
        unavailable.push({
          productId: product._id,
          productName: product.name,
          requiredQty: item.quantity,
          availableQty: availableStock,
          shortage: item.quantity - availableStock
        });
      }
    }

    res.json({
      success: true,
      data: {
        items: results,
        unavailable,
        allAvailable: unavailable.length === 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to check availability', error: error.message });
  }
};

// ─── GET /api/inventory/dashboard ────────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  try {
    const tenant = req.user.tenant;
    const products = await ProductItem.find({ tenant, isActive: true });
    const productsByType = {
      product: products.filter(p => p.itemType === 'product'),
      service: products.filter(p => p.itemType === 'service'),
      lead: products.filter(p => p.itemType === 'lead')
    };
    const transactions = await StockTransaction.find({ tenant }).sort({ createdAt: -1 });

    // Top selling products
    const soldMap = {};
    transactions.filter(t => t.type === 'stock_out').forEach(t => {
      const id = t.product?.toString();
      if (!id) return;
      if (!soldMap[id]) soldMap[id] = { productName: t.productName, totalQty: 0 };
      soldMap[id].totalQty += t.quantity;
    });
    const topSelling = Object.entries(soldMap)
      .sort((a, b) => b[1].totalQty - a[1].totalQty)
      .slice(0, 5)
      .map(([id, v]) => ({ _id: id, ...v }));

    // Pending POs to receive
    const pendingPOs = await PurchaseOrder.find({ tenant, receiveStatus: { $in: ['pending', 'partially_received'] } })
      .select('poNumber customerName receiveStatus createdAt').limit(5);

    // Low stock - all types
    const lowStockItems = products.filter(p => p.stock <= p.lowStockThreshold && p.stock > 0);
    const outOfStockItems = products.filter(p => p.stock === 0);

    // Recent activity
    const recentActivity = transactions.slice(0, 10).map(t => ({
      _id: t._id, type: t.type, productName: t.productName,
      quantity: t.quantity, reason: t.reason, referenceNumber: t.referenceNumber,
      createdAt: t.createdAt
    }));

    res.json({
      success: true,
      data: {
        summary: {
          totalItems: products.length,
          byType: {
            products: productsByType.product.length,
            services: productsByType.service.length,
            leads: productsByType.lead.length
          },
          totalStockValue: products.reduce((s, p) => s + p.stock * (p.costPrice || p.price), 0),
          lowStockCount: lowStockItems.length,
          outOfStockCount: outOfStockItems.length,
          totalCommitted: products.reduce((s, p) => s + p.committedStock, 0),
          pendingPOCount: pendingPOs.length
        },
        byItemType: {
          products: {
            total: productsByType.product.length,
            available: productsByType.product.filter(p => p.stock > p.lowStockThreshold).length,
            lowStock: productsByType.product.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold).length,
            outOfStock: productsByType.product.filter(p => p.stock === 0).length
          },
          services: {
            total: productsByType.service.length,
            available: productsByType.service.filter(s => s.stock > s.lowStockThreshold).length,
            lowStock: productsByType.service.filter(s => s.stock > 0 && s.stock <= s.lowStockThreshold).length,
            outOfStock: productsByType.service.filter(s => s.stock === 0).length
          },
          leads: {
            total: productsByType.lead.length,
            available: productsByType.lead.filter(l => l.stock > l.lowStockThreshold).length,
            lowStock: productsByType.lead.filter(l => l.stock > 0 && l.stock <= l.lowStockThreshold).length,
            outOfStock: productsByType.lead.filter(l => l.stock === 0).length
          }
        },
        topSelling,
        pendingPOs,
        lowStockItems: lowStockItems.slice(0, 5),
        outOfStockItems: outOfStockItems.slice(0, 5),
        recentActivity
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load dashboard', error: error.message });
  }
};
