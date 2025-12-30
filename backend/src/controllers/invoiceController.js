const Invoice = require('../models/Invoice');

exports.createInvoice = async (req, res) => {
  try {
    const invoiceData = {
      ...req.body,
      tenant: req.user.tenant,
      createdBy: req.user.id
    };

    if (!invoiceData.dueDate) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      invoiceData.dueDate = dueDate;
    }

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

    Object.assign(invoice, req.body);
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
    const emailSubject = subject || `Invoice ${invoice.invoiceNumber} from ${tenant.companyName || 'UFS CRM'}`;
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
      ${tenant.companyName || 'UFS CRM'}
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

    const { generateInvoicePDF } = require('../services/pdfService');
    const pdfResult = await generateInvoicePDF(invoice, tenant);

    if (!pdfResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate PDF'
      });
    }

    res.download(pdfResult.filePath, pdfResult.fileName, (err) => {
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

    invoice.status = status;
    await invoice.save();


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
