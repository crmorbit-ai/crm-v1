const Invoice = require('../models/Invoice');
const ProductItem = require('../models/ProductItem');
const StockTransaction = require('../models/StockTransaction');
const Tenant = require('../models/Tenant');
const fs = require('fs');

// Helper function to calculate GST breakdown
const calculateGSTBreakdown = async (invoiceData, tenantId) => {
  try {
    // Fetch tenant to get company state
    const tenant = await Tenant.findById(tenantId);
    const companyStateCode = tenant?.stateCode || tenant?.gstin?.substring(0, 2) || '29'; // Default Delhi if not set

    // Extract customer state code from GSTIN or use customerStateCode
    let customerStateCode = invoiceData.customerStateCode;
    if (!customerStateCode && invoiceData.customerGstin) {
      customerStateCode = invoiceData.customerGstin.substring(0, 2);
    }

    // Determine if same state (intra-state) or different state (inter-state)
    const isSameState = customerStateCode && customerStateCode === companyStateCode;

    // Calculate tax for each item
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    invoiceData.items = invoiceData.items.map(item => {
      const taxableAmount = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);
      const taxAmount = taxableAmount * ((item.tax || 18) / 100);

      if (isSameState) {
        // Intra-state: Split into CGST + SGST
        item.cgst = taxAmount / 2;
        item.sgst = taxAmount / 2;
        item.igst = 0;
        totalCgst += item.cgst;
        totalSgst += item.sgst;
      } else {
        // Inter-state: IGST
        item.cgst = 0;
        item.sgst = 0;
        item.igst = taxAmount;
        totalIgst += item.igst;
      }

      return item;
    });

    // Update invoice level GST totals
    invoiceData.totalCgst = totalCgst;
    invoiceData.totalSgst = totalSgst;
    invoiceData.totalIgst = totalIgst;
    invoiceData.taxType = isSameState ? 'CGST+SGST' : 'IGST';
    invoiceData.placeOfSupply = invoiceData.placeOfSupply || invoiceData.customerState || 'India';

    return invoiceData;
  } catch (error) {
    console.error('GST calculation error:', error);
    // Return original data if calculation fails
    return invoiceData;
  }
};

exports.createInvoice = async (req, res) => {
  try {
    let invoiceData = {
      ...req.body,
      tenant: req.user.tenant,
      createdBy: req.user.id
    };

    if (!invoiceData.dueDate) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      invoiceData.dueDate = dueDate;
    }

    // Calculate GST breakdown
    invoiceData = await calculateGSTBreakdown(invoiceData, req.user.tenant);

    const invoice = new Invoice(invoiceData);
    await invoice.save();


    res.status(201).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating invoice',
      error: error.message
    });
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const query = { tenant: req.user.tenant };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } }
      ];
    }

    const invoices = await Invoice.find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('customer')
      .populate('quotation')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Invoice.countDocuments(query);

    res.json({
      success: true,
      data: invoices,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching invoices',
      error: error.message
    });
  }
};

exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    })
      .populate('createdBy', 'firstName lastName email')
      .populate('customer')
      .populate('quotation')
      .populate('payments.recordedBy', 'firstName lastName email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching invoice',
      error: error.message
    });
  }
};

exports.updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update paid invoice'
      });
    }

    // Calculate GST breakdown for updated data
    let updatedData = await calculateGSTBreakdown(req.body, req.user.tenant);

    Object.assign(invoice, updatedData);
    invoice.lastModifiedBy = req.user.id;
    await invoice.save();


    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating invoice',
      error: error.message
    });
  }
};

exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (invoice.status === 'paid' || invoice.payments.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete invoice with payments'
      });
    }

    await invoice.deleteOne();


    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting invoice',
      error: error.message
    });
  }
};

exports.sendInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    }).populate('createdBy', 'firstName lastName email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    const Tenant = require('../models/Tenant');
    const tenant = await Tenant.findById(req.user.tenant);
    const { recipients, subject, message } = req.body;
    const emailList = recipients || [invoice.customerEmail];

    const { generateInvoicePDF } = require('../services/pdfService');
    const pdfResult = await generateInvoicePDF(invoice, tenant);

    if (!pdfResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate PDF'
      });
    }

    const emailService = require('../services/emailService');
    const emailSubject = subject || `Invoice ${invoice.invoiceNumber} from ${tenant.companyName || 'Unified CRM'}`;
    const emailMessage = message || `
      Dear ${invoice.customerName},

      Please find attached your invoice.

      Invoice Number: ${invoice.invoiceNumber}
      Invoice Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}
      Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}
      Total Amount: ₹${invoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      Amount Paid: ₹${(invoice.paidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      Balance Due: ₹${((invoice.totalAmount || 0) - (invoice.paidAmount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}

      If you have any questions, please don't hesitate to contact us.

      Best regards,
      ${tenant.companyName || 'Unified CRM'}
    `;

    for (const email of emailList) {
      await emailService.sendEmail(
        req.user.id,
        {
          to: email,
          subject: emailSubject,
          text: emailMessage,
          html: emailMessage.replace(/\n/g, '<br>'),
          attachments: [{
            filename: pdfResult.fileName,
            path: pdfResult.filePath
          }]
        },
        req.user.tenant
      );
    }

    invoice.status = 'sent';
    invoice.sentAt = new Date();
    invoice.sentTo = emailList;
    await invoice.save();

    res.json({
      success: true,
      message: 'Invoice sent successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Error sending invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending invoice',
      error: error.message
    });
  }
};

exports.downloadInvoicePDF = async (req, res) => {
  try {
    // Build query - SAAS admins can access all invoices, tenants only their own
    const query = { _id: req.params.id };
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      query.tenant = req.user.tenant;
    }

    const invoice = await Invoice.findOne(query).populate('createdBy', 'firstName lastName email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    const Tenant = require('../models/Tenant');
    const tenant = await Tenant.findById(invoice.tenant || req.user.tenant).select('organizationName contactEmail contactPhone logo invoiceLogo signature gstin panNumber headquarters bankDetails website');

    const { generateInvoicePDF } = require('../services/pdfService');
    const pdfResult = await generateInvoicePDF(invoice, tenant);

    if (!pdfResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate PDF'
      });
    }

    res.download(pdfResult.filePath, pdfResult.fileName, (err) => {
      // Delete file after download (whether successful or not)
      fs.unlink(pdfResult.filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error deleting PDF file:', unlinkErr);
        }
      });
      if (err) {
        console.error('Error downloading PDF:', err);
      }
    });
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating PDF',
      error: error.message
    });
  }
};

exports.addPayment = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    const paymentData = {
      ...req.body,
      recordedBy: req.user.id
    };

    invoice.payments.push(paymentData);
    await invoice.save();


    res.json({
      success: true,
      message: 'Payment added successfully',
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding payment',
      error: error.message
    });
  }
};

exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    const previousStatus = invoice.status;
    invoice.status = status;
    await invoice.save();

    // Auto stock deduction when invoice marked as paid
    if (status === 'paid' && previousStatus !== 'paid') {
      const itemsWithProduct = (invoice.items || []).filter(item => item.product);
      for (const item of itemsWithProduct) {
        try {
          const product = await ProductItem.findOne({ _id: item.product, tenant: req.user.tenant });
          if (!product) continue;
          const previousStock = product.stock;
          const deductQty = item.quantity || 1;
          const newStock = Math.max(0, previousStock - deductQty);
          product.stock = newStock;
          await product.save();
          await StockTransaction.create({
            tenant: req.user.tenant,
            product: product._id,
            productName: product.name,
            type: 'stock_out',
            quantity: deductQty,
            previousStock,
            newStock,
            reason: `Invoice paid — ${invoice.invoiceNumber}`,
            referenceType: 'invoice',
            referenceId: invoice._id,
            referenceNumber: invoice.invoiceNumber,
            createdBy: req.user.id
          });
        } catch (err) {
          console.error('Stock deduction error for product', item.product, err.message);
        }
      }
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating invoice status',
      error: error.message
    });
  }
};

exports.getInvoiceStats = async (req, res) => {
  try {
    const stats = await Invoice.aggregate([
      { $match: { tenant: req.user.tenant } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$totalPaid' },
          balanceDue: { $sum: '$balanceDue' }
        }
      }
    ]);

    const totalStats = await Invoice.aggregate([
      { $match: { tenant: req.user.tenant } },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$totalPaid' },
          totalDue: { $sum: '$balanceDue' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        byStatus: stats,
        overall: totalStats[0] || {
          totalInvoices: 0,
          totalAmount: 0,
          totalPaid: 0,
          totalDue: 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching invoice stats',
      error: error.message
    });
  }
};

// ─── RAZORPAY PAYMENT LINK FOR INVOICE ───────────────────────────────────────
const { createInvoicePaymentLink } = require('../services/razorpayService');

exports.generatePaymentLink = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, tenant: req.user.tenant });

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (invoice.status === 'paid') return res.status(400).json({ success: false, message: 'Invoice already paid' });

    const remaining = (invoice.totalAmount || 0) - (invoice.paidAmount || 0);
    if (remaining <= 0) return res.status(400).json({ success: false, message: 'No outstanding amount' });

    const customerName = invoice.customerName || '';
    const customerEmail = invoice.customerEmail || '';
    const customerPhone = invoice.customerPhone || '';

    const link = await createInvoicePaymentLink({
      amount: remaining,
      description: `Invoice ${invoice.invoiceNumber} - ${req.user.tenant?.organizationName || 'CRM'}`,
      customerName,
      customerEmail,
      customerPhone,
      invoiceId: invoice._id.toString(),
      callbackUrl: `${process.env.FRONTEND_URL}/invoices/${invoice._id}`,
    });

    // Save payment link on invoice
    invoice.razorpayPaymentLinkId = link.id;
    invoice.razorpayPaymentLinkUrl = link.short_url;
    await invoice.save();

    return res.json({ success: true, message: 'Payment link generated', data: { paymentLinkUrl: link.short_url, paymentLinkId: link.id, amount: remaining } });
  } catch (error) {
    console.error('generatePaymentLink error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate payment link', error: error.message });
  }
};
