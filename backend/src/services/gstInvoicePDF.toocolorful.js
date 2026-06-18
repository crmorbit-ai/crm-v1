const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate PREMIUM Professional GST Invoice PDF
 * Enterprise-level design like Zoho Books / QuickBooks
 */
exports.generateGSTInvoicePDF = async (invoice, tenant) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 30,
        bufferPages: true
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

      // ============= PREMIUM HEADER DESIGN =============

      // Dark professional header bar
      doc.rect(0, 0, 595, 120)
         .fillAndStroke('#1e293b', '#1e293b');

      // Company Logo space (circular background)
      doc.circle(60, 60, 35)
         .fillAndStroke('#3b82f6', '#3b82f6');

      doc.fontSize(24)
         .fillColor('#ffffff')
         .font('Helvetica-Bold')
         .text(tenant.organizationName?.charAt(0) || 'C', 38, 48);

      // Company Name and Details (White on dark)
      doc.fontSize(20)
         .fillColor('#ffffff')
         .font('Helvetica-Bold')
         .text(tenant.organizationName || 'Company Name', 110, 35);

      doc.fontSize(8)
         .fillColor('#cbd5e1')
         .font('Helvetica')
         .text(tenant.headquarters?.street || '', 110, 60, { width: 250 })
         .text(`${tenant.headquarters?.city || ''}, ${tenant.headquarters?.state || ''} ${tenant.headquarters?.zipCode || ''}`, { width: 250 });

      if (tenant.gstin) {
        doc.fontSize(8)
           .fillColor('#fbbf24')
           .font('Helvetica-Bold')
           .text(`GSTIN: ${tenant.gstin}`, 110, 88);
      }

      // TAX INVOICE Badge (Right side)
      doc.rect(420, 25, 150, 70)
         .lineWidth(2)
         .strokeColor('#ef4444')
         .fillAndStroke('#ffffff', '#ef4444');

      doc.fontSize(18)
         .fillColor('#ef4444')
         .font('Helvetica-Bold')
         .text('TAX INVOICE', 430, 42, { width: 130, align: 'center' });

      doc.fontSize(9)
         .fillColor('#1e293b')
         .font('Helvetica')
         .text(invoice.invoiceNumber, 430, 70, { width: 130, align: 'center' });

      // ============= INVOICE INFO BOX (Right) =============
      const infoBoxY = 140;

      doc.rect(380, infoBoxY, 185, 100)
         .lineWidth(1)
         .fillAndStroke('#f8fafc', '#e2e8f0');

      doc.fontSize(8)
         .fillColor('#64748b')
         .font('Helvetica')
         .text('Invoice Date:', 390, infoBoxY + 12);

      doc.fillColor('#0f172a')
         .font('Helvetica-Bold')
         .text(new Date(invoice.invoiceDate).toLocaleDateString('en-IN'), 470, infoBoxY + 12);

      doc.fillColor('#64748b')
         .font('Helvetica')
         .text('Due Date:', 390, infoBoxY + 30);

      doc.fillColor('#0f172a')
         .font('Helvetica-Bold')
         .text(new Date(invoice.dueDate).toLocaleDateString('en-IN'), 470, infoBoxY + 30);

      if (invoice.placeOfSupply) {
        doc.fillColor('#64748b')
           .font('Helvetica')
           .text('Place of Supply:', 390, infoBoxY + 48);

        doc.fillColor('#0f172a')
           .font('Helvetica-Bold')
           .text(invoice.placeOfSupply, 470, infoBoxY + 48);
      }

      doc.fillColor('#64748b')
         .font('Helvetica')
         .text('Tax Type:', 390, infoBoxY + 66);

      doc.fillColor('#0f172a')
         .font('Helvetica-Bold')
         .text(invoice.taxType || 'IGST', 470, infoBoxY + 66);

      // ============= BILL TO / SHIP TO SECTION =============
      const billY = 140;

      // Bill To (Modern card design)
      doc.roundedRect(30, billY, 165, 100, 5)
         .lineWidth(1)
         .fillAndStroke('#ffffff', '#e2e8f0');

      // Blue header strip
      doc.roundedRect(30, billY, 165, 25, 5)
         .fillAndStroke('#3b82f6', '#3b82f6');

      doc.fontSize(9)
         .fillColor('#ffffff')
         .font('Helvetica-Bold')
         .text('BILL TO', 38, billY + 9);

      doc.fontSize(10)
         .fillColor('#0f172a')
         .font('Helvetica-Bold')
         .text(invoice.customerName, 38, billY + 35, { width: 150 });

      doc.fontSize(8)
         .fillColor('#475569')
         .font('Helvetica')
         .text(invoice.customerAddress || '', 38, billY + 50, { width: 150, lineGap: 2 });

      if (invoice.customerGstin) {
        doc.fontSize(7)
           .fillColor('#7c3aed')
           .font('Helvetica-Bold')
           .text(`GST: ${invoice.customerGstin}`, 38, billY + 80);
      }

      // Ship To (Only if different)
      if (invoice.shippingAddress && invoice.shippingAddress !== invoice.customerAddress) {
        doc.roundedRect(205, billY, 165, 100, 5)
           .lineWidth(1)
           .fillAndStroke('#ffffff', '#e2e8f0');

        doc.roundedRect(205, billY, 165, 25, 5)
           .fillAndStroke('#10b981', '#10b981');

        doc.fontSize(9)
           .fillColor('#ffffff')
           .font('Helvetica-Bold')
           .text('SHIP TO', 213, billY + 9);

        doc.fontSize(10)
           .fillColor('#0f172a')
           .font('Helvetica-Bold')
           .text(invoice.customerName, 213, billY + 35, { width: 150 });

        doc.fontSize(8)
           .fillColor('#475569')
           .font('Helvetica')
           .text(invoice.shippingAddress, 213, billY + 50, { width: 150, lineGap: 2 });
      }

      // ============= PREMIUM ITEMS TABLE =============
      const tableY = 260;

      // Table Header (Gradient effect with dark blue)
      doc.rect(30, tableY, 535, 28)
         .fillAndStroke('#1e40af', '#1e40af');

      const colX = {
        sno: 38,
        desc: 70,
        hsn: 280,
        qty: 335,
        rate: 375,
        disc: 425,
        tax: 465,
        total: 505
      };

      doc.fontSize(8)
         .fillColor('#ffffff')
         .font('Helvetica-Bold')
         .text('#', colX.sno, tableY + 10)
         .text('DESCRIPTION', colX.desc, tableY + 10)
         .text('HSN/SAC', colX.hsn, tableY + 10)
         .text('QTY', colX.qty, tableY + 10)
         .text('RATE', colX.rate, tableY + 10)
         .text('DISC', colX.disc, tableY + 10)
         .text('TAX', colX.tax, tableY + 10)
         .text('AMOUNT', colX.total, tableY + 10);

      // Table Rows (Alternating colors)
      let rowY = tableY + 28;
      invoice.items.forEach((item, index) => {
        const rowHeight = 30;

        // Alternating row colors
        if (index % 2 === 0) {
          doc.rect(30, rowY, 535, rowHeight)
             .fillAndStroke('#f8fafc', '#e2e8f0');
        } else {
          doc.rect(30, rowY, 535, rowHeight)
             .fillAndStroke('#ffffff', '#e2e8f0');
        }

        doc.fontSize(8)
           .fillColor('#0f172a')
           .font('Helvetica')
           .text((index + 1).toString(), colX.sno, rowY + 10);

        doc.fontSize(9)
           .fillColor('#0f172a')
           .font('Helvetica-Bold')
           .text(item.productName, colX.desc, rowY + 8, { width: 200 });

        if (item.description) {
          doc.fontSize(7)
             .fillColor('#64748b')
             .font('Helvetica')
             .text(item.description.substring(0, 80), colX.desc, rowY + 20, { width: 200 });
        }

        doc.fontSize(8)
           .fillColor('#475569')
           .font('Helvetica')
           .text(item.hsnCode || '998314', colX.hsn, rowY + 10)
           .text(item.quantity.toString(), colX.qty, rowY + 10)
           .text(`₹${item.unitPrice.toFixed(0)}`, colX.rate, rowY + 10)
           .text(`${item.discount || 0}%`, colX.disc, rowY + 10)
           .text(`${item.tax || 18}%`, colX.tax, rowY + 10);

        const itemTotal = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100) * (1 + (item.tax || 18) / 100);
        doc.fontSize(9)
           .fillColor('#0f172a')
           .font('Helvetica-Bold')
           .text(`₹${itemTotal.toFixed(2)}`, colX.total, rowY + 10);

        rowY += rowHeight;
      });

      // ============= TOTALS SECTION (Modern) =============
      const totalsY = rowY + 20;
      const totalsX = 350;

      // Subtotal
      doc.fontSize(9)
         .fillColor('#64748b')
         .font('Helvetica')
         .text('Subtotal:', totalsX, totalsY)
         .fillColor('#0f172a')
         .font('Helvetica-Bold')
         .text(`₹${invoice.subtotal.toFixed(2)}`, totalsX + 130, totalsY, { align: 'right', width: 85 });

      // Tax breakdown
      let taxY = totalsY + 18;

      if (invoice.taxType === 'CGST+SGST') {
        doc.fontSize(8)
           .fillColor('#64748b')
           .font('Helvetica')
           .text('CGST:', totalsX, taxY)
           .fillColor('#0f172a')
           .text(`₹${(invoice.totalCgst || invoice.totalTax / 2).toFixed(2)}`, totalsX + 130, taxY, { align: 'right', width: 85 });

        taxY += 15;
        doc.text('SGST:', totalsX, taxY)
           .fillColor('#0f172a')
           .text(`₹${(invoice.totalSgst || invoice.totalTax / 2).toFixed(2)}`, totalsX + 130, taxY, { align: 'right', width: 85 });
      } else {
        doc.fontSize(8)
           .fillColor('#64748b')
           .font('Helvetica')
           .text('IGST:', totalsX, taxY)
           .fillColor('#0f172a')
           .text(`₹${(invoice.totalIgst || invoice.totalTax).toFixed(2)}`, totalsX + 130, taxY, { align: 'right', width: 85 });
      }

      // Total box (Premium gradient)
      taxY += 25;
      doc.roundedRect(totalsX, taxY, 215, 35, 5)
         .lineWidth(2)
         .fillAndStroke('#1e40af', '#1e40af');

      doc.fontSize(11)
         .fillColor('#ffffff')
         .font('Helvetica-Bold')
         .text('TOTAL AMOUNT:', totalsX + 10, taxY + 11)
         .fontSize(14)
         .text(`₹${invoice.totalAmount.toFixed(2)}`, totalsX + 130, taxY + 10, { align: 'right', width: 75 });

      // Amount in words (Highlighted)
      taxY += 45;
      doc.roundedRect(30, taxY, 535, 30, 3)
         .fillAndStroke('#fef3c7', '#fbbf24');

      doc.fontSize(8)
         .fillColor('#92400e')
         .font('Helvetica-Bold')
         .text('Amount in Words:', 40, taxY + 11);

      doc.font('Helvetica')
         .text(numberToWords(invoice.totalAmount) + ' Only', 140, taxY + 11, { width: 420 });

      // ============= FOOTER SECTION =============
      taxY += 45;

      // Terms and Bank Details side by side
      if (invoice.terms) {
        doc.fontSize(9)
           .fillColor('#1e40af')
           .font('Helvetica-Bold')
           .text('TERMS & CONDITIONS', 35, taxY);

        doc.fontSize(8)
           .fillColor('#475569')
           .font('Helvetica')
           .text(invoice.terms, 35, taxY + 15, { width: 250, lineGap: 3 });
      }

      if (tenant.bankDetails) {
        doc.fontSize(9)
           .fillColor('#1e40af')
           .font('Helvetica-Bold')
           .text('BANK DETAILS', 320, taxY);

        doc.fontSize(8)
           .fillColor('#475569')
           .font('Helvetica')
           .text(`Bank: ${tenant.bankDetails.bankName || ''}`, 320, taxY + 15)
           .text(`A/C: ${tenant.bankDetails.accountNumber || ''}`, 320, taxY + 28)
           .text(`IFSC: ${tenant.bankDetails.ifscCode || ''}`, 320, taxY + 41);
      }

      // Signature section
      doc.fontSize(7)
         .fillColor('#64748b')
         .font('Helvetica-Oblique')
         .text('Authorized Signatory', 450, taxY + 50, { align: 'right', width: 110 });

      doc.moveTo(450, taxY + 48)
         .lineTo(560, taxY + 48)
         .strokeColor('#cbd5e1')
         .stroke();

      // Bottom bar
      doc.rect(0, 792, 595, 50)
         .fillAndStroke('#f1f5f9', '#f1f5f9');

      doc.fontSize(7)
         .fillColor('#64748b')
         .font('Helvetica')
         .text('This is a computer-generated invoice and does not require a physical signature.', 30, 805, { width: 535, align: 'center' });

      doc.fontSize(8)
         .fillColor('#3b82f6')
         .font('Helvetica-Bold')
         .text(`For ${tenant.organizationName || 'Company'}`, 30, 818, { width: 535, align: 'center' });

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

// Helper function - Number to Words (Indian format)
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
