const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate Clean Professional GST Invoice PDF
 * Simple Black & White Design - CA Style
 */
exports.generateGSTInvoicePDF = async (invoice, tenant) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40
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

      // ============= SIMPLE HEADER =============

      // Company Name (Large, Bold)
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .fillColor('#000000')
         .text(tenant.organizationName || 'COMPANY NAME', 40, 40);

      // Company Address
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#333333')
         .text(tenant.headquarters?.street || '', 40, 70, { width: 280 })
         .text(`${tenant.headquarters?.city || ''}, ${tenant.headquarters?.state || ''} - ${tenant.headquarters?.zipCode || ''}`, { width: 280 })
         .text(`Email: ${tenant.contactEmail || ''}`, { width: 280 })
         .text(`Phone: ${tenant.contactPhone || ''}`, { width: 280 });

      if (tenant.gstin) {
        doc.fontSize(9)
           .font('Helvetica-Bold')
           .text(`GSTIN: ${tenant.gstin}`, 40, doc.y + 3);
      }

      // Horizontal Line
      doc.moveTo(40, 130)
         .lineTo(555, 130)
         .lineWidth(2)
         .strokeColor('#000000')
         .stroke();

      // TAX INVOICE Title (Right side)
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .fillColor('#000000')
         .text('TAX INVOICE', 350, 50, { align: 'right', width: 205 });

      // Invoice Details Box (Right)
      const infoY = 80;
      doc.rect(350, infoY, 205, 45)
         .lineWidth(1)
         .strokeColor('#000000')
         .stroke();

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#000000')
         .text('Invoice No:', 360, infoY + 8)
         .font('Helvetica-Bold')
         .text(invoice.invoiceNumber, 440, infoY + 8);

      doc.font('Helvetica')
         .text('Date:', 360, infoY + 22)
         .font('Helvetica-Bold')
         .text(new Date(invoice.invoiceDate).toLocaleDateString('en-IN'), 440, infoY + 22);

      // ============= BILL TO SECTION =============
      const billY = 150;

      // Bill To Box
      doc.rect(40, billY, 250, 90)
         .lineWidth(1)
         .strokeColor('#000000')
         .stroke();

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#000000')
         .text('BILL TO', 45, billY + 8);

      doc.fontSize(11)
         .text(invoice.customerName, 45, billY + 25, { width: 240 });

      doc.fontSize(9)
         .font('Helvetica')
         .text(invoice.customerAddress || '', 45, billY + 42, { width: 240 });

      if (invoice.customerGstin) {
        doc.fontSize(9)
           .font('Helvetica-Bold')
           .text(`GSTIN: ${invoice.customerGstin}`, 45, billY + 72);
      }

      // Ship To (Only if different)
      if (invoice.shippingAddress && invoice.shippingAddress !== invoice.customerAddress) {
        doc.rect(305, billY, 250, 90)
           .lineWidth(1)
           .strokeColor('#000000')
           .stroke();

        doc.fontSize(10)
           .font('Helvetica-Bold')
           .text('SHIP TO', 310, billY + 8);

        doc.fontSize(11)
           .text(invoice.customerName, 310, billY + 25, { width: 240 });

        doc.fontSize(9)
           .font('Helvetica')
           .text(invoice.shippingAddress, 310, billY + 42, { width: 240 });
      }

      // Invoice Details (Right side below bill to)
      const detailY = billY;
      doc.rect(305, detailY, 250, 90)
         .lineWidth(1)
         .strokeColor('#000000')
         .stroke();

      doc.fontSize(9)
         .font('Helvetica')
         .text('Due Date:', 310, detailY + 8)
         .font('Helvetica-Bold')
         .text(new Date(invoice.dueDate).toLocaleDateString('en-IN'), 420, detailY + 8);

      if (invoice.placeOfSupply) {
        doc.font('Helvetica')
           .text('Place of Supply:', 310, detailY + 25)
           .font('Helvetica-Bold')
           .text(invoice.placeOfSupply, 420, detailY + 25);
      }

      doc.font('Helvetica')
         .text('Tax Type:', 310, detailY + 42)
         .font('Helvetica-Bold')
         .text(invoice.taxType || 'IGST', 420, detailY + 42);

      // ============= ITEMS TABLE =============
      const tableY = 260;

      // Table Header
      doc.rect(40, tableY, 515, 25)
         .fillAndStroke('#000000', '#000000');

      const colX = {
        sno: 45,
        desc: 75,
        hsn: 260,
        qty: 315,
        rate: 360,
        disc: 415,
        tax: 455,
        total: 495
      };

      doc.fontSize(9)
         .fillColor('#ffffff')
         .font('Helvetica-Bold')
         .text('#', colX.sno, tableY + 8)
         .text('DESCRIPTION', colX.desc, tableY + 8)
         .text('HSN/SAC', colX.hsn, tableY + 8)
         .text('QTY', colX.qty, tableY + 8)
         .text('RATE', colX.rate, tableY + 8)
         .text('DISC', colX.disc, tableY + 8)
         .text('TAX', colX.tax, tableY + 8)
         .text('TOTAL', colX.total, tableY + 8);

      // Table Rows
      let rowY = tableY + 25;
      invoice.items.forEach((item, index) => {
        const rowHeight = item.description ? 35 : 25;

        // Row border
        doc.rect(40, rowY, 515, rowHeight)
           .strokeColor('#cccccc')
           .stroke();

        doc.fontSize(9)
           .fillColor('#000000')
           .font('Helvetica')
           .text((index + 1).toString(), colX.sno, rowY + 8);

        doc.font('Helvetica-Bold')
           .text(item.productName, colX.desc, rowY + 8, { width: 180 });

        if (item.description) {
          doc.fontSize(8)
             .font('Helvetica')
             .fillColor('#666666')
             .text(item.description.substring(0, 100), colX.desc, rowY + 20, { width: 180 });
        }

        doc.fontSize(9)
           .fillColor('#000000')
           .font('Helvetica')
           .text(item.hsnCode || '998314', colX.hsn, rowY + 8)
           .text(item.quantity.toString(), colX.qty, rowY + 8)
           .text(`₹${item.unitPrice.toFixed(2)}`, colX.rate, rowY + 8)
           .text(`${item.discount || 0}%`, colX.disc, rowY + 8)
           .text(`${item.tax || 18}%`, colX.tax, rowY + 8);

        const taxableAmount = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);
        const taxAmount = taxableAmount * (item.tax / 100);
        const totalAmount = taxableAmount + taxAmount;

        doc.font('Helvetica-Bold')
           .text(`₹${totalAmount.toFixed(2)}`, colX.total, rowY + 8);

        rowY += rowHeight;
      });

      // Bottom line
      doc.moveTo(40, rowY)
         .lineTo(555, rowY)
         .lineWidth(1)
         .strokeColor('#000000')
         .stroke();

      // ============= TOTALS SECTION =============
      const totalsY = rowY + 15;
      const totalsX = 380;

      // Subtotal
      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica')
         .text('Subtotal:', totalsX, totalsY)
         .font('Helvetica-Bold')
         .text(`₹${invoice.subtotal.toFixed(2)}`, totalsX + 100, totalsY, { align: 'right', width: 75 });

      // Tax breakdown
      let taxY = totalsY + 18;

      if (invoice.taxType === 'CGST+SGST') {
        doc.font('Helvetica')
           .text('CGST:', totalsX, taxY)
           .font('Helvetica-Bold')
           .text(`₹${(invoice.totalCgst || invoice.totalTax / 2).toFixed(2)}`, totalsX + 100, taxY, { align: 'right', width: 75 });

        taxY += 15;
        doc.font('Helvetica')
           .text('SGST:', totalsX, taxY)
           .font('Helvetica-Bold')
           .text(`₹${(invoice.totalSgst || invoice.totalTax / 2).toFixed(2)}`, totalsX + 100, taxY, { align: 'right', width: 75 });
      } else {
        doc.font('Helvetica')
           .text('IGST:', totalsX, taxY)
           .font('Helvetica-Bold')
           .text(`₹${(invoice.totalIgst || invoice.totalTax).toFixed(2)}`, totalsX + 100, taxY, { align: 'right', width: 75 });
      }

      // Total Line
      taxY += 20;
      doc.moveTo(totalsX, taxY)
         .lineTo(555, taxY)
         .lineWidth(2)
         .strokeColor('#000000')
         .stroke();

      // Total Amount
      taxY += 10;
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('TOTAL:', totalsX, taxY)
         .text(`₹${invoice.totalAmount.toFixed(2)}`, totalsX + 100, taxY, { align: 'right', width: 75 });

      // Amount in Words
      taxY += 30;
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .text('Amount in Words:', 40, taxY);

      doc.font('Helvetica')
         .text(numberToWords(invoice.totalAmount) + ' Only', 40, taxY + 13, { width: 515 });

      // ============= FOOTER =============
      taxY += 40;

      // Terms
      if (invoice.terms) {
        doc.fontSize(9)
           .font('Helvetica-Bold')
           .text('TERMS & CONDITIONS:', 40, taxY);

        doc.fontSize(8)
           .font('Helvetica')
           .text(invoice.terms, 40, taxY + 13, { width: 250 });
      }

      // Bank Details
      if (tenant.bankDetails) {
        doc.fontSize(9)
           .font('Helvetica-Bold')
           .text('BANK DETAILS:', 310, taxY);

        doc.fontSize(8)
           .font('Helvetica')
           .text(`Bank Name: ${tenant.bankDetails.bankName || ''}`, 310, taxY + 13)
           .text(`Account No: ${tenant.bankDetails.accountNumber || ''}`, 310, taxY + 26)
           .text(`IFSC Code: ${tenant.bankDetails.ifscCode || ''}`, 310, taxY + 39);
      }

      // Signature
      taxY += 70;
      doc.moveTo(420, taxY)
         .lineTo(540, taxY)
         .lineWidth(1)
         .strokeColor('#000000')
         .stroke();

      doc.fontSize(8)
         .font('Helvetica')
         .text('Authorized Signatory', 420, taxY + 5, { align: 'right', width: 120 });

      // Footer note
      doc.fontSize(7)
         .fillColor('#666666')
         .text('This is a computer-generated invoice and does not require a physical signature.', 40, 770, { width: 515, align: 'center' });

      doc.fontSize(8)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(`For ${tenant.organizationName || 'Company'}`, 40, 782, { width: 515, align: 'center' });

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
