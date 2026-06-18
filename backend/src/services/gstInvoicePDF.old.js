const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate Professional GST Invoice PDF
 */
exports.generateGSTInvoicePDF = async (invoice, tenant) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40
      });

      // Use /tmp for Vercel serverless, uploads for local
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

      // ======== HEADER SECTION ========
      // Company Logo/Name - Left
      doc.fontSize(22)
         .fillColor('#1a73e8')
         .font('Helvetica-Bold')
         .text(tenant.organizationName || 'Company Name', 40, 40, { width: 300 });

      doc.fontSize(9)
         .fillColor('#333333')
         .font('Helvetica')
         .text(tenant.headquarters?.street || '', 40, 70, { width: 250 })
         .text(`${tenant.headquarters?.city || ''}, ${tenant.headquarters?.state || ''} ${tenant.headquarters?.zipCode || ''}`, { width: 250 })
         .text(`Email: ${tenant.contactEmail || ''}`, { width: 250 })
         .text(`Phone: ${tenant.contactPhone || ''}`, { width: 250 });

      // Company GSTIN
      if (tenant.gstin) {
        doc.fontSize(9)
           .fillColor('#000000')
           .font('Helvetica-Bold')
           .text(`GSTIN: ${tenant.gstin}`, 40, doc.y + 3);
      }

      // TAX INVOICE - Right
      doc.fontSize(24)
         .fillColor('#d32f2f')
         .font('Helvetica-Bold')
         .text('TAX INVOICE', 320, 40, { align: 'right', width: 235 });

      // Invoice box - Right
      const boxX = 350;
      const boxY = 75;
      doc.rect(boxX, boxY, 205, 70)
         .lineWidth(1)
         .strokeColor('#cccccc')
         .stroke();

      doc.fontSize(9)
         .fillColor('#666666')
         .font('Helvetica')
         .text('Invoice No:', boxX + 10, boxY + 10)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(invoice.invoiceNumber, boxX + 80, boxY + 10);

      doc.fillColor('#666666')
         .font('Helvetica')
         .text('Invoice Date:', boxX + 10, boxY + 25)
         .fillColor('#000000')
         .text(new Date(invoice.invoiceDate).toLocaleDateString('en-IN'), boxX + 80, boxY + 25);

      doc.fillColor('#666666')
         .text('Due Date:', boxX + 10, boxY + 40)
         .fillColor('#000000')
         .text(new Date(invoice.dueDate).toLocaleDateString('en-IN'), boxX + 80, boxY + 40);

      if (invoice.placeOfSupply) {
        doc.fillColor('#666666')
           .text('Place of Supply:', boxX + 10, boxY + 55)
           .fillColor('#000000')
           .text(invoice.placeOfSupply, boxX + 80, boxY + 55);
      }

      // ======== BILL TO & SHIP TO SECTION ========
      const billY = 160;

      // Bill To Box
      doc.rect(40, billY, 250, 90)
         .lineWidth(1)
         .strokeColor('#cccccc')
         .stroke();

      doc.fontSize(10)
         .fillColor('#1a73e8')
         .font('Helvetica-Bold')
         .text('BILL TO', 45, billY + 8);

      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(invoice.customerName, 45, billY + 25, { width: 240 });

      doc.fontSize(9)
         .fillColor('#333333')
         .font('Helvetica')
         .text(invoice.customerAddress || '', 45, billY + 40, { width: 240 });

      if (invoice.customerGstin) {
        doc.fontSize(9)
           .fillColor('#000000')
           .font('Helvetica-Bold')
           .text(`GSTIN: ${invoice.customerGstin}`, 45, billY + 65);
      }

      // Ship To Box (only show if different from billing address)
      if (invoice.shippingAddress && invoice.shippingAddress !== invoice.customerAddress) {
        doc.rect(305, billY, 250, 90)
           .lineWidth(1)
           .strokeColor('#cccccc')
           .stroke();

        doc.fontSize(10)
           .fillColor('#1a73e8')
           .font('Helvetica-Bold')
           .text('SHIP TO', 310, billY + 8);

        doc.fontSize(10)
           .fillColor('#000000')
           .font('Helvetica-Bold')
           .text(invoice.customerName, 310, billY + 25, { width: 240 });

        doc.fontSize(9)
           .fillColor('#333333')
           .font('Helvetica')
           .text(invoice.shippingAddress, 310, billY + 40, { width: 240 });
      }

      // ======== ITEMS TABLE ========
      const tableY = 270;
      const colX = {
        sno: 45,
        desc: 75,
        hsn: 260,
        qty: 315,
        rate: 355,
        disc: 410,
        taxable: 450,
        gst: 505
      };

      // Table Header
      doc.rect(40, tableY, 515, 25)
         .fillAndStroke('#1a73e8', '#1a73e8');

      doc.fontSize(8)
         .fillColor('#ffffff')
         .font('Helvetica-Bold')
         .text('S.No', colX.sno, tableY + 9, { width: 25 })
         .text('Description', colX.desc, tableY + 9, { width: 180 })
         .text('HSN/SAC', colX.hsn, tableY + 9, { width: 50 })
         .text('Qty', colX.qty, tableY + 9, { width: 35 })
         .text('Rate', colX.rate, tableY + 9, { width: 50 })
         .text('Disc%', colX.disc, tableY + 9, { width: 35 })
         .text('Taxable', colX.taxable, tableY + 9, { width: 50 })
         .text('GST%', colX.gst, tableY + 9, { width: 45 });

      // Table Rows
      let rowY = tableY + 25;
      invoice.items.forEach((item, index) => {
        const rowHeight = item.description && item.description.length > 50 ? 35 : 25;

        // Alternate row background
        if (index % 2 === 1) {
          doc.rect(40, rowY, 515, rowHeight)
             .fillAndStroke('#f5f5f5', '#e0e0e0');
        } else {
          doc.rect(40, rowY, 515, rowHeight)
             .stroke('#e0e0e0');
        }

        doc.fontSize(8)
           .fillColor('#000000')
           .font('Helvetica')
           .text((index + 1).toString(), colX.sno, rowY + 8, { width: 25 })
           .text(item.productName, colX.desc, rowY + 8, { width: 180 });

        if (item.description) {
          doc.fontSize(7)
             .fillColor('#666666')
             .text(item.description.substring(0, 100), colX.desc, rowY + 18, { width: 180 });
        }

        doc.fontSize(8)
           .fillColor('#000000')
           .text(item.hsnCode || '998314', colX.hsn, rowY + 8, { width: 50 })
           .text(item.quantity.toString(), colX.qty, rowY + 8, { width: 35 })
           .text(`₹${item.unitPrice.toFixed(2)}`, colX.rate, rowY + 8, { width: 50 })
           .text(`${item.discount || 0}%`, colX.disc, rowY + 8, { width: 35 });

        const taxableAmount = item.unitPrice * item.quantity * (1 - (item.discount || 0) / 100);
        doc.text(`₹${taxableAmount.toFixed(2)}`, colX.taxable, rowY + 8, { width: 50 })
           .text(`${item.tax || 18}%`, colX.gst, rowY + 8, { width: 45 });

        rowY += rowHeight;
      });

      // ======== TAX SUMMARY TABLE ========
      const taxSummaryY = rowY + 10;

      // Left side - Bank Details (if available)
      if (tenant.bankDetails) {
        doc.fontSize(9)
           .fillColor('#1a73e8')
           .font('Helvetica-Bold')
           .text('BANK DETAILS', 45, taxSummaryY);

        doc.fontSize(8)
           .fillColor('#000000')
           .font('Helvetica')
           .text(`Bank: ${tenant.bankDetails.bankName || ''}`, 45, taxSummaryY + 15)
           .text(`A/C No: ${tenant.bankDetails.accountNumber || ''}`, 45, taxSummaryY + 28)
           .text(`IFSC: ${tenant.bankDetails.ifscCode || ''}`, 45, taxSummaryY + 41);
      }

      // Right side - Amount Summary
      const sumX = 360;
      let sumY = taxSummaryY;

      doc.fontSize(9)
         .fillColor('#666666')
         .font('Helvetica')
         .text('Subtotal:', sumX, sumY, { width: 100 })
         .fillColor('#000000')
         .text(`₹${invoice.subtotal.toFixed(2)}`, sumX + 100, sumY, { align: 'right', width: 95 });

      if (invoice.totalDiscount > 0) {
        sumY += 15;
        doc.fillColor('#666666')
           .text('Discount:', sumX, sumY, { width: 100 })
           .fillColor('#d32f2f')
           .text(`- ₹${invoice.totalDiscount.toFixed(2)}`, sumX + 100, sumY, { align: 'right', width: 95 });
      }

      sumY += 15;
      doc.fillColor('#666666')
         .text('Taxable Amount:', sumX, sumY, { width: 100 })
         .fillColor('#000000')
         .text(`₹${(invoice.subtotal - invoice.totalDiscount).toFixed(2)}`, sumX + 100, sumY, { align: 'right', width: 95 });

      // GST Breakdown
      if (invoice.taxType === 'CGST+SGST') {
        sumY += 15;
        doc.fillColor('#666666')
           .text('CGST:', sumX, sumY, { width: 100 })
           .fillColor('#000000')
           .text(`₹${(invoice.totalCgst || invoice.totalTax / 2).toFixed(2)}`, sumX + 100, sumY, { align: 'right', width: 95 });

        sumY += 15;
        doc.fillColor('#666666')
           .text('SGST:', sumX, sumY, { width: 100 })
           .fillColor('#000000')
           .text(`₹${(invoice.totalSgst || invoice.totalTax / 2).toFixed(2)}`, sumX + 100, sumY, { align: 'right', width: 95 });
      } else if (invoice.taxType === 'IGST') {
        sumY += 15;
        doc.fillColor('#666666')
           .text('IGST:', sumX, sumY, { width: 100 })
           .fillColor('#000000')
           .text(`₹${(invoice.totalIgst || invoice.totalTax).toFixed(2)}`, sumX + 100, sumY, { align: 'right', width: 95 });
      }

      // Total Amount Box
      sumY += 20;
      doc.rect(sumX, sumY, 195, 25)
         .fillAndStroke('#1a73e8', '#1a73e8');

      doc.fontSize(11)
         .fillColor('#ffffff')
         .font('Helvetica-Bold')
         .text('TOTAL AMOUNT:', sumX + 10, sumY + 8)
         .fontSize(12)
         .text(`₹${invoice.totalAmount.toFixed(2)}`, sumX + 100, sumY + 8, { align: 'right', width: 85 });

      // Amount in Words
      sumY += 35;
      doc.fontSize(9)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Amount in Words:', 45, sumY)
         .font('Helvetica')
         .text(numberToWords(invoice.totalAmount) + ' Only', 45, sumY + 13, { width: 510 });

      // ======== TERMS & FOOTER ========
      sumY += 40;

      if (invoice.terms) {
        doc.fontSize(9)
           .fillColor('#1a73e8')
           .font('Helvetica-Bold')
           .text('TERMS & CONDITIONS', 45, sumY);

        doc.fontSize(8)
           .fillColor('#333333')
           .font('Helvetica')
           .text(invoice.terms, 45, sumY + 13, { width: 510 });

        sumY += 35;
      }

      // GST Declaration
      doc.fontSize(7)
         .fillColor('#666666')
         .text('This is a computer-generated invoice and does not require a physical signature.', 45, sumY, { width: 510, align: 'center' });

      doc.fontSize(7)
         .text('Certified that the particulars given above are true and correct.', { width: 510, align: 'center' });

      // Footer
      if (tenant.organizationName) {
        doc.fontSize(8)
           .fillColor('#1a73e8')
           .font('Helvetica-Bold')
           .text(`For ${tenant.organizationName}`, 400, sumY + 25);

        doc.fontSize(7)
           .fillColor('#666666')
           .font('Helvetica')
           .text('Authorized Signatory', 400, sumY + 55);
      }

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

// Helper function to convert number to words (Indian format)
function numberToWords(num) {
  if (num === 0) return 'Zero';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  const convert = (n) => {
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    return '';
  };

  const crores = Math.floor(num / 10000000);
  const lakhs = Math.floor((num % 10000000) / 100000);
  const thousands = Math.floor((num % 100000) / 1000);
  const hundreds = Math.floor(num % 1000);

  let words = '';
  if (crores) words += convert(crores) + ' Crore ';
  if (lakhs) words += convert(lakhs) + ' Lakh ';
  if (thousands) words += convert(thousands) + ' Thousand ';
  if (hundreds) words += convert(hundreds);

  return words.trim() + ' Rupees';
}
