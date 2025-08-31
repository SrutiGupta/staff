
const { PrismaClient } = require('@prisma/client');
const PDFDocument = require('pdfkit');
require('dotenv').config(); // Load environment variables

const prisma = new PrismaClient();

// Create a new invoice
exports.createInvoice = async (req, res) => {
  const { patientId, prescriptionId, items } = req.body;
  const staffId = req.user.id; // Assuming staffId is available in req.user

  if (!patientId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Patient ID and at least one item are required.' });
  }

  try {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalIgst = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    const invoiceItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        return res.status(404).json({ error: `Product with ID ${item.productId} not found.` });
      }

      const inventory = await prisma.inventory.findFirst({ where: { productId: item.productId } });
      if (!inventory || inventory.quantity < item.quantity) {
        return res.status(400).json({ error: `Not enough stock for ${product.name}.` });
      }

      const itemSubtotal = product.price * item.quantity;
      const itemDiscount = item.discount || 0;
      const itemIgst = item.igst || 0;
      const itemCgst = item.cgst || 0;
      const itemSgst = item.sgst || 0;
      
      const totalPrice = itemSubtotal - itemDiscount + itemIgst + itemCgst + itemSgst;

      subtotal += itemSubtotal;
      totalDiscount += itemDiscount;
      totalIgst += itemIgst;
      totalCgst += itemCgst;
      totalSgst += itemSgst;

      invoiceItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        discount: itemDiscount,
        igst: itemIgst,
        cgst: itemCgst,
        sgst: itemSgst,
        totalPrice: totalPrice,
      });
    }

    const totalAmount = subtotal - totalDiscount + totalIgst + totalCgst + totalSgst;

    // Create the invoice and its items in a transaction
    const newInvoice = await prisma.$transaction(async (prisma) => {
      const invoice = await prisma.invoice.create({
        data: {
          patientId,
          staffId,
          prescriptionId,
          subtotal,
          totalDiscount,
          totalIgst,
          totalCgst,
          totalSgst,
          totalAmount,
          items: {
            create: invoiceItems,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Update inventory for each item
      for (const item of items) {
        await prisma.inventory.updateMany({
          where: { productId: item.productId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      }
      return invoice;
    });

    res.status(201).json(newInvoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice.' });
  }
};

// Get a single invoice by ID
exports.getInvoice = async (req, res) => {
  const { id } = req.params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: true,
        items: {
          include: {
            product: true,
          },
        },
        transactions: true,
        prescription: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    res.status(200).json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice.' });
  }
};


function generateTableRow(doc, y, ...cols) {
  let x = 40;
  const widths = [150, 70, 70, 50, 50, 50, 40, 70]
  cols.forEach((text, i) => {
    doc.text(text, x, y, { width: widths[i], align: 'left' });
    x += widths[i];
  });
}

// Generate and stream an invoice PDF
exports.generateInvoicePdf = async (req, res) => {
    const { id } = req.params;

    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                patient: true,
                items: {
                    include: {
                        product: true,
                    },
                },
                prescription: true
            },
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.id}.pdf`);

        doc.pipe(res);

        // ===== Header =====
        doc
            .fontSize(16)
            .text('Tax Invoice', 250, 40, { align: 'center' });

        doc
            .fontSize(10)
            .text('LENSKART SOLUTIONS PRIVATE LIMITED', 250, 60, { align: 'center' })
            .text('Property No 29/24/2, 25/2/1 ... Gurugram (06) - 122004', 250, 75, { align: 'center' });

        // Right top box (Shipment details)
        doc
            .rect(450, 40, 120, 100)
            .stroke()
            .fontSize(10)
            .text(`Shipment Code: ${invoice.id}`, 455, 50)
            .text(`Order #: ${invoice.id}`, 455, 65)
            .text(`Order Date: ${invoice.createdAt.toLocaleDateString()}`, 455, 80)
            .text(`Total Quantity: ${invoice.items.reduce((acc, item) => acc + item.quantity, 0)}`, 455, 95);

        // ===== Bill To & Delivery =====
        doc
            .moveDown()
            .fontSize(11)
            .text('Bill To Address', 40, 160, { underline: true })
            .text(invoice.patient.name)
            .text(invoice.patient.address || '')
            .text(invoice.patient.phone || '');

        doc
            .text('Address Of Delivery', 300, 160, { underline: true })
            .text(invoice.patient.name)
            .text(invoice.patient.address || '')
            .text(invoice.patient.phone || '');

        // ===== Prescription Table =====
        if (invoice.prescription) {
            doc
                .moveDown()
                .fontSize(11)
                .text('Prescription Details:', 40, 250);

            const prescTableTop = 270;
            const p = invoice.prescription;
            const rightEye = p.rightEye || {};
            const leftEye = p.leftEye || {};
            generateTableRow(doc, prescTableTop, "Eye", "SPH", "CYL", "Axis", "Add", "PD", "BC");
            generateTableRow(doc, prescTableTop + 20, "Right", rightEye.sph || '', rightEye.cyl || '', rightEye.axis || '', rightEye.add || '', rightEye.pd || '', rightEye.bc || '');
            generateTableRow(doc, prescTableTop + 40, "Left", leftEye.sph || '', leftEye.cyl || '', leftEye.axis || '', leftEye.add || '', leftEye.pd || '', leftEye.bc || '');
        }


        // ===== Item Table =====
        doc.moveDown().text('Description Of Goods', 40, 350);

        const itemTableTop = 370;
        generateTableRow(
            doc,
            itemTableTop,
            'Description',
            'Unit Price',
            'Discount',
            'IGST',
            'SGST',
            'CGST',
            'QTY',
            'Total'
        );

        invoice.items.forEach((item, i) => {
            const y = itemTableTop + (i + 1) * 20;
            generateTableRow(
                doc,
                y,
                item.product.name,
                item.unitPrice.toFixed(2),
                item.discount.toFixed(2),
                item.igst.toFixed(2),
                item.sgst.toFixed(2),
                item.cgst.toFixed(2),
                item.quantity.toString(),
                item.totalPrice.toFixed(2)
            );
        });

        // ===== Summary =====
        doc
            .moveDown()
            .fontSize(11)
            .text(`Subtotal: ${invoice.subtotal.toFixed(2)}`, { align: 'right' })
            .text(`Discount: ${invoice.totalDiscount.toFixed(2)}`, { align: 'right' })
            .text(`IGST: ${invoice.totalIgst.toFixed(2)}`, { align: 'right' })
            .text(`CGST: ${invoice.totalCgst.toFixed(2)}`, { align: 'right' })
            .text(`SGST: ${invoice.totalSgst.toFixed(2)}`, { align: 'right' })
            .text(`Grand Total: ${invoice.totalAmount.toFixed(2)}`, { align: 'right' });

        // ===== Footer =====
        doc
            .moveDown()
            .fontSize(9)
            .text('Disclaimer: This is computer generated invoice and does not require signature', 40, 700)
            .text('For T&C please visit www.lenskart.com', 40, 715);

        doc.end();

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ error: 'Failed to generate PDF invoice' });
    }
};

// Generate a plain text receipt for thermal printing
exports.generateInvoiceThermal = async (req, res) => {
  const { id } = req.params;
  const printerWidth = parseInt(process.env.THERMAL_PRINTER_WIDTH, 10) || 48;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: true,
        items: { include: { product: true } },
        prescription: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (!invoice.patient) {
        return res.status(404).json({ error: `Patient data not found for invoice ID: ${id}` });
    }

    const center = (text) => text.padStart(Math.floor((printerWidth + text.length) / 2), ' ').padEnd(printerWidth, ' ');
    const line = (left, right) => `${left.padEnd(printerWidth/2)}${right.padStart(printerWidth/2)}`;
    const separator = '-'.repeat(printerWidth);

    let receipt = [];

    receipt.push(center('Tax Invoice'));
    receipt.push(center('LENSKART SOLUTIONS PRIVATE LIMITED'));
    receipt.push(center('Gurugram (06) - 122004'));
    receipt.push(separator);

    receipt.push(line(`Order #: ${invoice.id}`, `Date: ${invoice.createdAt.toLocaleDateString()}`));
    receipt.push(line(`Total Qty: ${invoice.items.reduce((acc, item) => acc + item.quantity, 0)}`, ''));
    receipt.push(separator);

    receipt.push('Bill To & Delivery Address:');
    receipt.push(invoice.patient.name);
    if(invoice.patient.address) receipt.push(invoice.patient.address);
    if(invoice.patient.phone) receipt.push(invoice.patient.phone);
    receipt.push(separator);

    if (invoice.prescription) {
        receipt.push('Prescription Details:');
        const p = invoice.prescription;
        receipt.push('Eye   SPH    CYL    Axis   Add');
        if (p.rightEye) {
            const { sph, cyl, axis, add } = p.rightEye;
            receipt.push(`R     ${sph || '-'}    ${cyl || '-'}    ${axis || '-'}    ${add || '-'}`);
        }
        if (p.leftEye) {
            const { sph, cyl, axis, add } = p.leftEye;
            receipt.push(`L     ${sph || '-'}    ${cyl || '-'}    ${axis || '-'}    ${add || '-'}`);
        }
        receipt.push(separator);
    }
    
    receipt.push('Items');
    receipt.push(line('Name/Price', 'Qty x Total'));
    receipt.push(separator);

    invoice.items.forEach(item => {
      const productName = item.product ? item.product.name : 'Product Not Found';
      receipt.push(`${productName}`);
      receipt.push(line(`  @ ${item.unitPrice.toFixed(2)}`, `${item.quantity} x ${item.totalPrice.toFixed(2)}`));
       if (item.discount > 0) receipt.push(line('  Discount:', `-${item.discount.toFixed(2)}`));
    });
    receipt.push(separator);

    receipt.push(line('Subtotal:', invoice.subtotal.toFixed(2)));
    receipt.push(line('Total Discount:', `-${invoice.totalDiscount.toFixed(2)}`));
    if (invoice.totalIgst > 0) receipt.push(line('IGST:', invoice.totalIgst.toFixed(2)));
    if (invoice.totalCgst > 0) receipt.push(line('CGST:', invoice.totalCgst.toFixed(2)));
    if (invoice.totalSgst > 0) receipt.push(line('SGST:', invoice.totalSgst.toFixed(2)));
    receipt.push(separator);
    receipt.push(line('Grand Total:', invoice.totalAmount.toFixed(2)));
    receipt.push(separator);
    
    receipt.push(center('Disclaimer: This is a computer'));
    receipt.push(center('generated invoice and does not'));
    receipt.push(center('require a signature.'));
    receipt.push(center('For T&C please visit www.company.com'));

    const receiptText = receipt.join('\n');

    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(receiptText);

  } catch (error) {
    console.error('Error generating thermal receipt:', error);
    res.status(500).json({ error: 'Failed to generate thermal receipt' });
  }
};
