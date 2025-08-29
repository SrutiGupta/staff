const { PrismaClient } = require('@prisma/client');
const PDFDocument = require('pdfkit');

const prisma = new PrismaClient();

// Create a new invoice
exports.createInvoice = async (req, res) => {
  const { patientId, items } = req.body;

  if (!patientId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Patient ID and at least one item are required.' });
  }

  try {
    let totalAmount = 0;
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

      const itemTotalPrice = product.price * item.quantity;
      totalAmount += itemTotalPrice;
      invoiceItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice: itemTotalPrice,
      });
    }

    // Create the invoice and its items in a transaction
    const newInvoice = await prisma.$transaction(async (prisma) => {
      const invoice = await prisma.invoice.create({
        data: {
          patientId,
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
            },
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.id}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(20).text('INVOICE', { align: 'center' });
        doc.moveDown();

        // Customer Information
        doc.fontSize(12).text(`Invoice ID: ${invoice.id}`);
        doc.text(`Patient: ${invoice.patient.name}`);
        doc.text(`Date: ${invoice.createdAt.toLocaleDateString()}`);
        doc.moveDown(2);

        // Invoice Table Header
        const tableTop = doc.y;
        doc.fontSize(10);
        doc.text('Item', 50, tableTop);
        doc.text('Quantity', 250, tableTop, { width: 100, align: 'right' });
        doc.text('Unit Price', 350, tableTop, { width: 100, align: 'right' });
        doc.text('Total', 450, tableTop, { width: 100, align: 'right' });
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();


        // Invoice Table Rows
        let itemY = tableTop + 25;
        invoice.items.forEach(item => {
            doc.text(item.product.name, 50, itemY);
            doc.text(item.quantity.toString(), 250, itemY, { width: 100, align: 'right' });
            doc.text(`$${item.unitPrice.toFixed(2)}`, 350, itemY, { width: 100, align: 'right' });
            doc.text(`$${item.totalPrice.toFixed(2)}`, 450, itemY, { width: 100, align: 'right' });
            itemY += 20;
        });

        doc.moveTo(50, itemY).lineTo(550, itemY).stroke();
        doc.moveDown();

        // Total
        doc.fontSize(12).text(`Total Amount: $${invoice.totalAmount.toFixed(2)}`, { align: 'right' });
        doc.text(`Paid Amount: $${invoice.paidAmount.toFixed(2)}`, { align: 'right' });
        doc.fontSize(14).text(`Amount Due: $${(invoice.totalAmount - invoice.paidAmount).toFixed(2)}`, { align: 'right' });

        // Footer
        doc.fontSize(8).text('Thank you for your business!', 50, 700, { align: 'center' });

        doc.end();

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ error: 'Failed to generate PDF invoice' });
    }
};

