const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate REAL Professional Invoice - Zoho/AWS Style
 * Mostly white, clean, minimal - ACTUALLY like real SaaS invoices
 */
exports.generateGSTInvoicePDF = async (invoice, tenant) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      const uploadsDir = process.env.VERCEL
        ? '/tmp/invoices'
        : path.join(__dirname, '../../uploads/invoices');

      try {
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
      } catch (error) {
        console.error('Error creating invoice PDF directory:', error);
      }

      const fileName = `invoice-${invoice.invoiceNumber}-${Date.now()}.pdf`;
      const filePath = path.join(uploadsDir, fileName);
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Brand color (subtle blue - only for accents)
      const brandColor = '#2563eb';

      // ============= HEADER SECTION =============

      // Company Name (large, bold, brand color)
      doc.fontSize(26)
         .font('Helvetica-Bold')
         .fillColor(brandColor)
         .text(tenant.organizationName || 'COMPANY NAME', 50, 45);

      // Company Address (small, gray)
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#666666')
         .text(tenant.headquarters?.street || '', 50, 80, { width: 300 })
         .text(`${tenant.headquarters?.city || ''}, ${tenant.headquarters?.state || ''} ${tenant.headquarters?.zipCode || ''}`, { width: 300 });

      doc.fontSize(9)
         .text(`Email: ${tenant.contactEmail || ''}`, 50, doc.y + 3)
         .text(`Phone: ${tenant.contactPhone || ''}`, 50, doc.y + 3);

      if (tenant.gstin) {
        doc.fontSize(9)
           .fillColor('#333333')
           .text(`GSTIN: ${tenant.gstin}`, 50, doc.y + 3);
      }

      // Top line separator
      doc.moveTo(50, 145)
         .lineTo(545, 145)
         .strokeColor('#e5e7eb')
         .lineWidth(1)
         .stroke();

      // INVOICE title (right side, large)
      doc.fontSize(32)
         .font('Helvetica-Bold')
         .fillColor('#111827')
         .text('INVOICE', 350, 50, { align: 'right', width: 195 });

      // ============= INVOICE INFO (Right Column) =============

      let infoY = 100;

      // Invoice Number
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#6b7280')
         .text('Invoice Number', 350, infoY);

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#111827')
         .text(invoice.invoiceNumber, 450, infoY, { align: 'right', width: 95 });

      infoY += 20;

      // Date
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#6b7280')
         .text('Date', 350, infoY);

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#111827')
         .text(new Date(invoice.invoiceDate).toLocaleDateString('en-IN'), 470, infoY, { align: 'right', width: 75 });

      infoY += 20;

      // Due Date
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#6b7280')
         .text('Due Date', 350, infoY);

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#111827')
         .text(new Date(invoice.dueDate).toLocaleDateString('en-IN'), 470, infoY, { align: 'right', width: 75 });

      // ============= BILL TO / SHIP TO SECTION =============

      let billY = 165;

      // Bill To
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#111827')
         .text('BILL TO', 50, billY);

      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#111827')
         .text(invoice.customerName, 50, billY + 20, { width: 240 });

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#6b7280')
         .text(invoice.customerAddress || '', 50, billY + 40, { width: 240, lineGap: 2 });

      if (invoice.customerGstin) {
        doc.fontSize(9)
           .fillColor('#374151')
           .text(`GSTIN: ${invoice.customerGstin}`, 50, doc.y + 5);
      }

      // Ship To (if different)
      if (invoice.shippingAddress && invoice.shippingAddress !== invoice.customerAddress) {
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor('#111827')
           .text('SHIP TO', 310, billY);

        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text(invoice.customerName, 310, billY + 20, { width: 240 });

        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#6b7280')
           .text(invoice.shippingAddress, 310, billY + 40, { width: 240, lineGap: 2 });
      }

      // Place of Supply & Tax Type (right column)
      if (invoice.placeOfSupply) {
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#6b7280')
           .text('Place of Supply', 350, billY + 60);

        doc.fontSize(10)
           .fillColor('#111827')
           .text(invoice.placeOfSupply, 470, billY + 60, { align: 'right', width: 75 });
      }

      doc.fontSize(9)
         .fillColor('#6b7280')
         .text('Tax Type', 350, billY + 80);

      doc.fontSize(10)
         .fillColor('#111827')
         .text(invoice.taxType || 'IGST', 470, billY + 80, { align: 'right', width: 75 });

      // ============= ITEMS TABLE =============

      const tableY = 310;

      // Table header line
      doc.moveTo(50, tableY)
         .lineTo(545, tableY)
         .strokeColor('#e5e7eb')
         .lineWidth(1)
         .stroke();

      // Column headers
      const cols = {
        desc: 55,
        hsn: 280,
        qty: 340,
        rate: 385,
        tax: 445,
        amount: 495
      };

      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor('#374151')
         .text('DESCRIPTION', cols.desc, tableY + 10)
         .text('HSN/SAC', cols.hsn, tableY + 10)
         .text('QTY', cols.qty, tableY + 10)
         .text('RATE', cols.rate, tableY + 10)
         .text('TAX', cols.tax, tableY + 10)
         .text('AMOUNT', cols.amount, tableY + 10, { align: 'right', width: 50 });

      // Header bottom line
      doc.moveTo(50, tableY + 30)
         .lineTo(545, tableY + 30)
         .strokeColor('#e5e7eb')
         .lineWidth(1)
         .stroke();

      // Items
      let rowY = tableY + 40;

      invoice.items.forEach((item, index) => {
        const rowHeight = item.description ? 50 : 35;

        // Product name
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor('#111827')
           .text(item.productName, cols.desc, rowY, { width: 215 });

        // Description
        if (item.description) {
          doc.fontSize(8)
             .font('Helvetica')
             .fillColor('#9ca3af')
             .text(item.description.substring(0, 100), cols.desc, rowY + 15, { width: 215 });
        }

        // HSN
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#6b7280')
           .text(item.hsnCode || '998314', cols.hsn, rowY + 5);

        // Qty
        doc.text(item.quantity.toString(), cols.qty, rowY + 5);

        // Rate
        doc.text(`Rs.${formatIndianCurrency(item.unitPrice)}`, cols.rate, rowY + 5);

        // Tax
        doc.text(`${item.tax || 18}%`, cols.tax, rowY + 5);

        // Calculate amount
        const taxableAmount = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);
        const taxAmount = taxableAmount * ((item.tax || 18) / 100);
        const itemTotal = taxableAmount + taxAmount;

        // Amount
        doc.font('Helvetica-Bold')
           .fillColor('#111827')
           .text(`Rs.${itemTotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`, cols.amount, rowY + 5, { align: 'right', width: 50 });

        // Row separator (light)
        if (index < invoice.items.length - 1) {
          doc.moveTo(50, rowY + rowHeight - 5)
             .lineTo(545, rowY + rowHeight - 5)
             .strokeColor('#f3f4f6')
             .lineWidth(1)
             .stroke();
        }

        rowY += rowHeight;
      });

      // Bottom table line
      doc.moveTo(50, rowY)
         .lineTo(545, rowY)
         .strokeColor('#e5e7eb')
         .lineWidth(1)
         .stroke();

      // ============= TOTALS =============

      rowY += 20;
      const totalX = 385;

      // Subtotal
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#6b7280')
         .text('Subtotal', totalX, rowY);

      doc.fillColor('#111827')
         .text(`Rs.${invoice.subtotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`, totalX + 90, rowY, { align: 'right', width: 70 });

      rowY += 20;

      // Tax
      if (invoice.taxType === 'CGST+SGST') {
        doc.fillColor('#6b7280')
           .text('CGST', totalX, rowY);
        doc.fillColor('#111827')
           .text(`Rs.${(invoice.totalCgst || invoice.totalTax / 2).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`, totalX + 90, rowY, { align: 'right', width: 70 });

        rowY += 18;

        doc.fillColor('#6b7280')
           .text('SGST', totalX, rowY);
        doc.fillColor('#111827')
           .text(`Rs.${(invoice.totalSgst || invoice.totalTax / 2).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`, totalX + 90, rowY, { align: 'right', width: 70 });
      } else {
        doc.fillColor('#6b7280')
           .text('IGST', totalX, rowY);
        doc.fillColor('#111827')
           .text(`Rs.${(invoice.totalIgst || invoice.totalTax).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`, totalX + 90, rowY, { align: 'right', width: 70 });
      }

      rowY += 25;

      // Total line
      doc.moveTo(totalX, rowY)
         .lineTo(545, rowY)
         .strokeColor('#d1d5db')
         .lineWidth(1)
         .stroke();

      rowY += 12;

      // Total (larger, bold, brand color)
      doc.fontSize(13)
         .font('Helvetica-Bold')
         .fillColor('#111827')
         .text('Total', totalX, rowY);

      doc.fillColor(brandColor)
         .text(`Rs.${invoice.totalAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`, totalX + 90, rowY, { align: 'right', width: 70 });

      // Amount in words
      rowY += 35;

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#6b7280')
         .text('Amount in words', 50, rowY);

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#111827')
         .text(numberToWords(invoice.totalAmount) + ' Only', 50, rowY + 15, { width: 495 });

      // ============= FOOTER =============

      rowY += 50;

      // Separator
      doc.moveTo(50, rowY)
         .lineTo(545, rowY)
         .strokeColor('#e5e7eb')
         .lineWidth(1)
         .stroke();

      rowY += 20;

      // Terms & Bank Details (two columns)
      if (invoice.terms) {
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor('#374151')
           .text('Terms & Conditions', 50, rowY);

        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#6b7280')
           .text(invoice.terms, 50, rowY + 18, { width: 230 });
      }

      if (tenant.bankDetails) {
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor('#374151')
           .text('Payment Details', 310, rowY);

        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#6b7280')
           .text(`Bank: ${tenant.bankDetails.bankName || ''}`, 310, rowY + 18)
           .text(`Account: ${tenant.bankDetails.accountNumber || ''}`, 310, rowY + 31)
           .text(`IFSC: ${tenant.bankDetails.ifscCode || ''}`, 310, rowY + 44);
      }

      // Company name at bottom
      doc.fontSize(8)
         .font('Helvetica')
         .fillColor('#9ca3af')
         .text('Thank you for your business', 50, 765, { width: 495, align: 'center' });

      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor('#6b7280')
         .text(tenant.organizationName || 'Company', 50, 778, { width: 495, align: 'center' });

      doc.end();

      stream.on('finish', () => {
        resolve({ filePath, fileName });
      });

      stream.on('error', reject);

    } catch (error) {
      reject(error);
    }
  });
};

// Helper: Format Indian Currency (no quotes)
function formatIndianCurrency(num) {
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Helper: Number to Words
function numberToWords(num) {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero Rupees';

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = Math.floor(num / 100);
  num %= 100;

  let result = '';
  if (crore > 0) result += convertTwoDigit(crore) + ' Crore ';
  if (lakh > 0) result += convertTwoDigit(lakh) + ' Lakh ';
  if (thousand > 0) result += convertTwoDigit(thousand) + ' Thousand ';
  if (hundred > 0) result += a[hundred] + ' Hundred ';
  if (num > 0) result += convertTwoDigit(num);

  return result.trim() + ' Rupees';

  function convertTwoDigit(n) {
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + ' ' + a[n % 10];
  }
}
