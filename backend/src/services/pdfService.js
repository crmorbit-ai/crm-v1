const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate Quotation PDF
 */
exports.generateQuotationPDF = async (quotation, tenant) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '../../uploads/quotations');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // File path
      const fileName = `quotation-${quotation.quotationNumber}-${Date.now()}.pdf`;
      const filePath = path.join(uploadsDir, fileName);

      // Pipe to file
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header with company info
      doc.fontSize(24)
         .fillColor('#4361ee')
         .text(tenant.companyName || 'UFS CRM', { align: 'left' });

      doc.fontSize(10)
         .fillColor('#666666')
         .text(tenant.address || 'Company Address', { align: 'left' })
         .text(tenant.email || 'company@email.com', { align: 'left' })
         .text(tenant.phone || '+91 1234567890', { align: 'left' });

      // Quotation title
      doc.moveDown(2);
      doc.fontSize(20)
         .fillColor('#000000')
         .text('QUOTATION', { align: 'center' });

      // Quotation details box
      doc.moveDown(1);
      const detailsY = doc.y;

      doc.fontSize(10)
         .fillColor('#666666');

      // Left side - Quotation info
      doc.text(`Quotation No: ${quotation.quotationNumber}`, 50, detailsY);
      doc.text(`Date: ${new Date(quotation.quotationDate).toLocaleDateString('en-IN')}`, 50, detailsY + 15);
      doc.text(`Valid Until: ${new Date(quotation.expiryDate).toLocaleDateString('en-IN')}`, 50, detailsY + 30);
      doc.text(`Status: ${quotation.status.toUpperCase()}`, 50, detailsY + 45);

      // Right side - Customer info
      doc.fontSize(10)
         .fillColor('#000000')
         .text('Bill To:', 350, detailsY, { underline: true });

      doc.fillColor('#666666')
         .text(quotation.customerName, 350, detailsY + 15);
      doc.text(quotation.customerEmail, 350, detailsY + 30);
      if (quotation.customerPhone) {
        doc.text(quotation.customerPhone, 350, detailsY + 45);
      }
      if (quotation.customerAddress) {
        doc.fontSize(9)
           .text(quotation.customerAddress, 350, detailsY + 60, { width: 150 });
      }

      // Title and description
      doc.moveDown(5);
      doc.fontSize(14)
         .fillColor('#000000')
         .text(quotation.title, { align: 'left' });

      if (quotation.description) {
        doc.moveDown(0.5);
        doc.fontSize(10)
           .fillColor('#666666')
           .text(quotation.description, { align: 'left' });
      }

      // Items table
      doc.moveDown(1.5);
      const tableTop = doc.y;
      const itemHeight = 25;

      // Table header
      doc.fillColor('#4361ee')
         .rect(50, tableTop, 495, 30)
         .fill();

      doc.fontSize(10)
         .fillColor('#ffffff')
         .text('Item', 55, tableTop + 10, { width: 150 })
         .text('Qty', 210, tableTop + 10, { width: 40 })
         .text('Price', 260, tableTop + 10, { width: 60 })
         .text('Disc.', 330, tableTop + 10, { width: 40 })
         .text('Tax', 380, tableTop + 10, { width: 40 })
         .text('Total', 440, tableTop + 10, { width: 100, align: 'right' });

      // Table rows
      let currentY = tableTop + 35;
      quotation.items.forEach((item, index) => {
        const rowColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';

        doc.fillColor(rowColor)
           .rect(50, currentY, 495, itemHeight)
           .fill();

        doc.fillColor('#000000')
           .fontSize(9)
           .text(item.productName, 55, currentY + 8, { width: 150 })
           .text(item.quantity.toString(), 210, currentY + 8, { width: 40 })
           .text(`₹${item.unitPrice.toLocaleString('en-IN')}`, 260, currentY + 8, { width: 60 })
           .text(`${item.discount}%`, 330, currentY + 8, { width: 40 })
           .text(`${item.tax}%`, 380, currentY + 8, { width: 40 })
           .text(`₹${item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 440, currentY + 8, { width: 100, align: 'right' });

        if (item.description) {
          doc.fontSize(8)
             .fillColor('#666666')
             .text(item.description, 55, currentY + 18, { width: 150 });
        }

        currentY += itemHeight;
      });

      // Summary box
      const summaryTop = currentY + 20;
      const summaryLeft = 350;

      doc.fontSize(10)
         .fillColor('#666666');

      doc.text('Subtotal:', summaryLeft, summaryTop)
         .text(`₹${quotation.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryLeft + 100, summaryTop, { align: 'right', width: 95 });

      doc.text('Discount:', summaryLeft, summaryTop + 15)
         .text(`- ₹${quotation.totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryLeft + 100, summaryTop + 15, { align: 'right', width: 95 });

      doc.text('Tax (GST):', summaryLeft, summaryTop + 30)
         .text(`+ ₹${quotation.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryLeft + 100, summaryTop + 30, { align: 'right', width: 95 });

      // Total line
      doc.moveTo(summaryLeft, summaryTop + 50)
         .lineTo(summaryLeft + 195, summaryTop + 50)
         .stroke();

      doc.fontSize(12)
         .fillColor('#000000')
         .text('TOTAL:', summaryLeft, summaryTop + 55, { bold: true })
         .fontSize(14)
         .fillColor('#4361ee')
         .text(`₹${quotation.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryLeft + 100, summaryTop + 55, { align: 'right', width: 95, bold: true });

      // Terms and conditions
      if (quotation.terms) {
        doc.moveDown(3);
        doc.fontSize(10)
           .fillColor('#000000')
           .text('Terms & Conditions:', { underline: true });

        doc.moveDown(0.5);
        doc.fontSize(9)
           .fillColor('#666666')
           .text(quotation.terms, { align: 'left' });
      }

      // Notes
      if (quotation.notes) {
        doc.moveDown(1);
        doc.fontSize(10)
           .fillColor('#000000')
           .text('Notes:', { underline: true });

        doc.moveDown(0.5);
        doc.fontSize(9)
           .fillColor('#666666')
           .text(quotation.notes, { align: 'left' });
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(8)
         .fillColor('#999999')
         .text('This is a computer-generated quotation and does not require a signature.', { align: 'center' });

      doc.text('Thank you for your business!', { align: 'center' });

      // Finalize PDF file
      doc.end();

      stream.on('finish', () => {
        resolve({
          success: true,
          filePath,
          fileName
        });
      });

      stream.on('error', (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate Invoice PDF
 */
exports.generateInvoicePDF = async (invoice, tenant) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      const uploadsDir = path.join(__dirname, '../../uploads/invoices');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileName = `invoice-${invoice.invoiceNumber}-${Date.now()}.pdf`;
      const filePath = path.join(uploadsDir, fileName);
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(24)
         .fillColor('#4361ee')
         .text(tenant.companyName || 'UFS CRM', { align: 'left' });

      doc.fontSize(10)
         .fillColor('#666666')
         .text(tenant.address || 'Company Address', { align: 'left' })
         .text(tenant.email || 'company@email.com', { align: 'left' })
         .text(tenant.phone || '+91 1234567890', { align: 'left' });

      // Invoice title
      doc.moveDown(2);
      doc.fontSize(20)
         .fillColor('#dc3545')
         .text('INVOICE', { align: 'center' });

      // Invoice details
      doc.moveDown(1);
      const detailsY = doc.y;
      doc.fontSize(10).fillColor('#666666');

      // Left side
      doc.text(`Invoice No: ${invoice.invoiceNumber}`, 50, detailsY);
      doc.text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}`, 50, detailsY + 15);
      doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}`, 50, detailsY + 30);
      doc.text(`Status: ${invoice.status.toUpperCase()}`, 50, detailsY + 45);

      // Right side - Customer info
      doc.fontSize(10)
         .fillColor('#000000')
         .text('Bill To:', 350, detailsY, { underline: true });

      doc.fillColor('#666666')
         .text(invoice.customerName, 350, detailsY + 15)
         .text(invoice.customerEmail, 350, detailsY + 30);
      if (invoice.customerPhone) {
        doc.text(invoice.customerPhone, 350, detailsY + 45);
      }
      if (invoice.customerAddress) {
        doc.fontSize(9).text(invoice.customerAddress, 350, detailsY + 60, { width: 150 });
      }

      // Items table
      doc.moveDown(5);
      const tableTop = doc.y;
      const itemHeight = 25;

      // Table header
      doc.fillColor('#dc3545')
         .rect(50, tableTop, 495, 30)
         .fill();

      doc.fontSize(10)
         .fillColor('#ffffff')
         .text('Item', 55, tableTop + 10, { width: 150 })
         .text('Qty', 210, tableTop + 10, { width: 40 })
         .text('Price', 260, tableTop + 10, { width: 60 })
         .text('Disc.', 330, tableTop + 10, { width: 40 })
         .text('Tax', 380, tableTop + 10, { width: 40 })
         .text('Total', 440, tableTop + 10, { width: 100, align: 'right' });

      // Table rows
      let currentY = tableTop + 35;
      invoice.items.forEach((item, index) => {
        const rowColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
        doc.fillColor(rowColor).rect(50, currentY, 495, itemHeight).fill();

        doc.fillColor('#000000')
           .fontSize(9)
           .text(item.productName, 55, currentY + 8, { width: 150 })
           .text(item.quantity.toString(), 210, currentY + 8, { width: 40 })
           .text(`₹${item.unitPrice.toLocaleString('en-IN')}`, 260, currentY + 8, { width: 60 })
           .text(`${item.discount}%`, 330, currentY + 8, { width: 40 })
           .text(`${item.tax}%`, 380, currentY + 8, { width: 40 })
           .text(`₹${item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 440, currentY + 8, { width: 100, align: 'right' });

        if (item.description) {
          doc.fontSize(8).fillColor('#666666').text(item.description, 55, currentY + 18, { width: 150 });
        }
        currentY += itemHeight;
      });

      // Summary box
      const summaryTop = currentY + 20;
      const summaryLeft = 350;
      doc.fontSize(10).fillColor('#666666');

      doc.text('Subtotal:', summaryLeft, summaryTop)
         .text(`₹${invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryLeft + 100, summaryTop, { align: 'right', width: 95 });

      doc.text('Discount:', summaryLeft, summaryTop + 15)
         .text(`- ₹${invoice.totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryLeft + 100, summaryTop + 15, { align: 'right', width: 95 });

      doc.text('Tax (GST):', summaryLeft, summaryTop + 30)
         .text(`+ ₹${invoice.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryLeft + 100, summaryTop + 30, { align: 'right', width: 95 });

      doc.moveTo(summaryLeft, summaryTop + 50).lineTo(summaryLeft + 195, summaryTop + 50).stroke();

      doc.fontSize(12).fillColor('#000000')
         .text('TOTAL:', summaryLeft, summaryTop + 55, { bold: true })
         .fontSize(14).fillColor('#dc3545')
         .text(`₹${invoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryLeft + 100, summaryTop + 55, { align: 'right', width: 95, bold: true });

      // Payment info
      doc.fontSize(10).fillColor('#000000')
         .text('Paid:', summaryLeft, summaryTop + 75)
         .fillColor('#198754')
         .text(`₹${(invoice.paidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryLeft + 100, summaryTop + 75, { align: 'right', width: 95 });

      doc.fillColor('#000000')
         .text('Balance Due:', summaryLeft, summaryTop + 90)
         .fillColor('#dc3545')
         .text(`₹${((invoice.totalAmount || 0) - (invoice.paidAmount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryLeft + 100, summaryTop + 90, { align: 'right', width: 95 });

      // Terms and notes
      if (invoice.terms) {
        doc.moveDown(3);
        doc.fontSize(10).fillColor('#000000').text('Terms & Conditions:', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(9).fillColor('#666666').text(invoice.terms, { align: 'left' });
      }

      if (invoice.notes) {
        doc.moveDown(1);
        doc.fontSize(10).fillColor('#000000').text('Notes:', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(9).fillColor('#666666').text(invoice.notes, { align: 'left' });
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(8).fillColor('#999999')
         .text('This is a computer-generated invoice and does not require a signature.', { align: 'center' })
         .text('Thank you for your business!', { align: 'center' });

      doc.end();

      stream.on('finish', () => {
        resolve({ success: true, filePath, fileName });
      });

      stream.on('error', (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
};
