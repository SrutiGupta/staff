const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createCustomerAndInvoice = async (req, res) => {
  const { customer, items, staffId, paidAmount, paymentMethod } = req.body;

  if (!customer || !customer.name || !customer.address || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Missing required fields: customer details and items are required.' });
  }

  try {
    const newInvoice = await prisma.$transaction(async (tx) => {
      const newCustomer = await tx.customer.create({
        data: {
          name: customer.name,
          phone: customer.phone,
          address: customer.address,
        },
      });

      let subtotal = 0;
      const invoiceItemsData = items.map(item => {
        const itemTotal = item.quantity * item.unitPrice;
        subtotal += itemTotal;
        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: itemTotal,
        };
      });

      const createdInvoice = await tx.invoice.create({
        data: {
          customerId: newCustomer.id,
          staffId: staffId,
          subtotal: subtotal,
          totalAmount: subtotal,
          paidAmount: paidAmount,
          status: paidAmount >= subtotal ? 'PAID' : 'UNPAID',
          items: {
            create: invoiceItemsData,
          },
        },
      });

      if (paidAmount > 0) {
        await tx.transaction.create({
          data: {
            invoiceId: createdInvoice.id,
            amount: paidAmount,
            paymentMethod: paymentMethod || 'Cash',
          },
        });
      }

      for (const item of items) {
        await tx.inventory.updateMany({
          where: { productId: item.productId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      return createdInvoice;
    });

    res.status(201).json(newInvoice);

  } catch (error) {
    console.error('Failed to create customer invoice:', error);
    res.status(500).json({ error: 'An error occurred while creating the invoice.' });
  }
};

const getAddressHotspots = async (req, res) => {
  try {
    const addressCounts = await prisma.customer.groupBy({
      by: ['address'],
      _count: {
        address: true,
      },
      orderBy: {
        _count: {
          address: 'desc',
        },
      },
      take: 10, // Limit to the top 10 hotspots
    });

    const hotspots = addressCounts.map(group => ({
      address: group.address,
      customerCount: group._count.address,
    }));

    res.json(hotspots);
  } catch (error) {
    console.error('Failed to get address hotspots:', error);
    res.status(500).json({ error: 'An error occurred while fetching hotspots.' });
  }
};

module.exports = {
  createCustomerAndInvoice,
  getAddressHotspots,
};