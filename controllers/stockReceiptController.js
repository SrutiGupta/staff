
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createStockReceipt = async (req, res) => {
  const {
    shopId,
    productId,
    receivedQuantity,
    supplierName,
    deliveryNote,
    batchNumber,
    expiryDate,
  } = req.body;

  const receivedByStaffId = req.user.id; // Correctly using the authenticated user's ID

  if (!shopId || !productId || !receivedQuantity) {
    return res.status(400).json({ error: 'Missing required fields: shopId, productId, receivedQuantity' });
  }

  try {
    const newReceipt = await prisma.stockReceipt.create({
      data: {
        shopId,
        productId,
        receivedQuantity,
        receivedByStaffId, // Now dynamic
        supplierName,
        deliveryNote,
        batchNumber,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status: 'PENDING',
      },
    });

    res.status(201).json(newReceipt);
  } catch (error) {
    console.error('Error creating stock receipt:', error);
    res.status(500).json({ error: 'Failed to create stock receipt' });
  }
};

module.exports = {
  createStockReceipt,
};
