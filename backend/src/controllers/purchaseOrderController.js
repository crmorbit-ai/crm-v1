const PurchaseOrder = require('../models/PurchaseOrder');
const Invoice = require('../models/Invoice');
const Quotation = require('../models/Quotation');
const Tenant = require('../models/Tenant');
const { logActivity } = require('../middleware/activityLogger');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../../uploads/purchase-orders');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'PO-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only PDF, DOC, DOCX, JPG, JPEG, PNG files are allowed'));
  }
}).single('poDocument');

exports.uploadPODocument = upload;

exports.createPurchaseOrder = async (req, res) => {
  try {
    const poData = {
      ...req.body,
      tenant: req.user.tenant,
      createdBy: req.user.id
    };

    // Parse items if it's a JSON string (from FormData)
    if (typeof poData.items === 'string') {
      try {
        poData.items = JSON.parse(poData.items);
      } catch (e) {
        console.error('Error parsing items:', e);
      }
    }

    // Parse customer if it's a JSON string (from FormData)
    if (typeof poData.customer === 'string') {
      try {
        const parsedCustomer = JSON.parse(poData.customer);
        // Extract just the ID if it's an object
        poData.customer = parsedCustomer._id || parsedCustomer.id || parsedCustomer;
      } catch (e) {
        // If it's "[object Object]" or invalid, try to extract from quotation
        if (poData.customer === '[object Object]' || poData.customer.includes('[object')) {
          console.log('⚠️ Invalid customer format, will use quotation data if available');
          delete poData.customer;
        }
      }
    }

    if (req.file) {
      poData.poDocument = {
        filename: req.file.filename,
        path: req.file.path,
        uploadedAt: new Date()
      };
    }

    const purchaseOrder = new PurchaseOrder(poData);
    await purchaseOrder.save();

    if (poData.quotation) {
      const quotation = await Quotation.findById(poData.quotation);
      if (quotation) {
        quotation.status = 'accepted';
        await quotation.save();
      }
    }

    await logActivity(req, 'purchase_order.created', 'PurchaseOrder', purchaseOrder._id, {
      poNumber: purchaseOrder.poNumber,
      customerPONumber: purchaseOrder.customerPONumber,
      customerName: purchaseOrder.customerName,
      totalAmount: purchaseOrder.totalAmount
    });

    res.status(201).json({
      success: true,
      data: purchaseOrder
    });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating purchase order',
      error: error.message
    });
  }
};

exports.getPurchaseOrders = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const query = { tenant: req.user.tenant };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { poNumber: { $regex: search, $options: 'i' } },
        { customerPONumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } }
      ];
    }

    const purchaseOrders = await PurchaseOrder.find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('customer')
      .populate('quotation')
      .populate('invoice')
      .populate('approvedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await PurchaseOrder.countDocuments(query);

    res.json({
      success: true,
      data: purchaseOrders,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching purchase orders',
      error: error.message
    });
  }
};

exports.getPurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    })
      .populate('createdBy', 'firstName lastName email')
      .populate('customer')
      .populate('quotation')
      .populate('invoice')
      .populate('approvedBy', 'firstName lastName email');

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    res.json({
      success: true,
      data: purchaseOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching purchase order',
      error: error.message
    });
  }
};

exports.updatePurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    if (purchaseOrder.convertedToInvoice) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update purchase order that has been converted to invoice'
      });
    }

    if (req.file) {
      if (purchaseOrder.poDocument && purchaseOrder.poDocument.path) {
        if (fs.existsSync(purchaseOrder.poDocument.path)) {
          fs.unlinkSync(purchaseOrder.poDocument.path);
        }
      }
      req.body.poDocument = {
        filename: req.file.filename,
        path: req.file.path,
        uploadedAt: new Date()
      };
    }

    Object.assign(purchaseOrder, req.body);
    await purchaseOrder.save();

    await logActivity(req, 'purchase_order.updated', 'PurchaseOrder', purchaseOrder._id, {
      poNumber: purchaseOrder.poNumber,
      customerPONumber: purchaseOrder.customerPONumber
    });

    res.json({
      success: true,
      data: purchaseOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating purchase order',
      error: error.message
    });
  }
};

exports.deletePurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    if (purchaseOrder.convertedToInvoice) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete purchase order that has been converted to invoice'
      });
    }

    if (purchaseOrder.poDocument && purchaseOrder.poDocument.path) {
      if (fs.existsSync(purchaseOrder.poDocument.path)) {
        fs.unlinkSync(purchaseOrder.poDocument.path);
      }
    }

    await purchaseOrder.deleteOne();

    await logActivity(req, 'purchase_order.deleted', 'PurchaseOrder', purchaseOrder._id, {
      poNumber: purchaseOrder.poNumber,
      customerPONumber: purchaseOrder.customerPONumber
    });

    res.json({
      success: true,
      message: 'Purchase order deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting purchase order',
      error: error.message
    });
  }
};

exports.approvePurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    purchaseOrder.status = 'approved';
    purchaseOrder.approvedBy = req.user.id;
    purchaseOrder.approvedAt = new Date();
    await purchaseOrder.save();

    await logActivity(req, 'purchase_order.approved', 'PurchaseOrder', purchaseOrder._id, {
      poNumber: purchaseOrder.poNumber,
      customerPONumber: purchaseOrder.customerPONumber
    });

    res.json({
      success: true,
      message: 'Purchase order approved successfully',
      data: purchaseOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving purchase order',
      error: error.message
    });
  }
};

exports.convertToInvoice = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    if (purchaseOrder.convertedToInvoice) {
      return res.status(400).json({
        success: false,
        message: 'Purchase order already converted to invoice'
      });
    }

    if (purchaseOrder.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Purchase order must be approved before converting to invoice'
      });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const invoice = new Invoice({
      tenant: purchaseOrder.tenant,
      quotation: purchaseOrder.quotation,
      purchaseOrder: purchaseOrder._id,
      customerPONumber: purchaseOrder.customerPONumber,
      customer: purchaseOrder.customer,
      customerModel: purchaseOrder.customerModel,
      customerName: purchaseOrder.customerName,
      customerEmail: purchaseOrder.customerEmail,
      customerPhone: purchaseOrder.customerPhone,
      customerAddress: purchaseOrder.customerAddress,
      title: purchaseOrder.title,
      description: purchaseOrder.description,
      items: purchaseOrder.items,
      subtotal: purchaseOrder.subtotal,
      totalDiscount: purchaseOrder.totalDiscount,
      totalTax: purchaseOrder.totalTax,
      totalAmount: purchaseOrder.totalAmount,
      invoiceDate: new Date(),
      dueDate: dueDate,
      terms: purchaseOrder.terms,
      notes: purchaseOrder.notes,
      createdBy: req.user.id
    });

    await invoice.save();

    purchaseOrder.convertedToInvoice = true;
    purchaseOrder.invoice = invoice._id;
    purchaseOrder.status = 'completed';
    await purchaseOrder.save();

    await logActivity(req, 'purchase_order.converted', 'PurchaseOrder', purchaseOrder._id, {
      poNumber: purchaseOrder.poNumber,
      customerPONumber: purchaseOrder.customerPONumber,
      invoiceNumber: invoice.invoiceNumber,
      invoiceId: invoice._id
    });

    res.json({
      success: true,
      message: 'Purchase order converted to invoice successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Error converting purchase order to invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error converting purchase order to invoice',
      error: error.message
    });
  }
};

exports.updatePOStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const purchaseOrder = await PurchaseOrder.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    purchaseOrder.status = status;
    await purchaseOrder.save();

    await logActivity(req, 'purchase_order.status_updated', 'PurchaseOrder', purchaseOrder._id, {
      poNumber: purchaseOrder.poNumber,
      customerPONumber: purchaseOrder.customerPONumber,
      newStatus: status
    });

    res.json({
      success: true,
      data: purchaseOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating purchase order status',
      error: error.message
    });
  }
};

exports.downloadPODocument = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    if (!purchaseOrder.poDocument || !purchaseOrder.poDocument.path) {
      return res.status(404).json({
        success: false,
        message: 'No document found for this purchase order'
      });
    }

    if (!fs.existsSync(purchaseOrder.poDocument.path)) {
      return res.status(404).json({
        success: false,
        message: 'Document file not found'
      });
    }

    res.download(purchaseOrder.poDocument.path, purchaseOrder.poDocument.filename, (err) => {
      if (err) {
        console.error('Error downloading PO document:', err);
      }
    });
  } catch (error) {
    console.error('Error downloading PO document:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading document',
      error: error.message
    });
  }
};
