
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @desc    List all stock receipts for the admin's shop
 * @route   GET /shop-admin/stock/receipts
 * @access  Private (ShopAdmin)
 */
const listStockReceipts = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    if (!shopId) {
      return res.status(403).json({ message: "Admin is not associated with a shop." });
    }

    const receipts = await prisma.stockReceipt.findMany({
      where: { shopId: shopId },
      include: {
        product: { select: { name: true, sku: true } },
        receivedByStaff: { select: { name: true } },
        verifiedByAdmin: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(receipts);
  } catch (error) {
    console.error("Error fetching stock receipts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * @desc    Approve or Reject a stock receipt
 * @route   PUT /shop-admin/stock/receipts/:id/approve
 * @access  Private (ShopAdmin)
 */
const approveStockReceipt = async (req, res) => {
  const { id } = req.params;
  const { decision, verifiedQuantity, adminNotes, discrepancyReason } = req.body;
  const adminId = req.user.shopAdminId;

  if (!['APPROVED', 'REJECTED'].includes(decision)) {
    return res.status(400).json({ message: "Decision must be either APPROVED or REJECTED." });
  }

  if (decision === 'APPROVED' && (verifiedQuantity === undefined || verifiedQuantity === null)) {
    return res.status(400).json({ message: "Verified quantity is required for approval." });
  }
  
  const quantity = decision === 'APPROVED' ? parseInt(verifiedQuantity, 10) : undefined;
  if (decision === 'APPROVED' && (isNaN(quantity) || quantity < 0)) {
    return res.status(400).json({ message: "Invalid verified quantity." });
  }

  try {
    const receipt = await prisma.stockReceipt.findUnique({
      where: { id: parseInt(id) },
    });

    if (!receipt) {
      return res.status(404).json({ message: "Stock receipt not found." });
    }

    if (receipt.shopId !== req.user.shopId) {
      return res.status(403).json({ message: "Forbidden: You can only manage receipts for your own shop." });
    }

    if (receipt.status !== 'PENDING') {
      return res.status(400).json({ message: `Receipt is already processed with status: ${receipt.status}` });
    }
    
    const updatedReceipt = await prisma.stockReceipt.update({
      where: { id: parseInt(id) },
      data: {
        status: decision,
        verifiedByAdminId: adminId,
        verifiedAt: new Date(),
        verifiedQuantity: quantity,
        adminNotes: adminNotes,
        discrepancyReason: discrepancyReason,
      },
    });

    res.status(200).json({ 
      message: `Stock receipt has been ${decision.toLowerCase()}.`, 
      receipt: updatedReceipt 
    });

  } catch (error) {
    console.error(`Failed to ${decision.toLowerCase()} stock receipt:`, error);
    res.status(500).json({ message: "An error occurred during the process." });
  }
};

module.exports = {
  listStockReceipts,
  approveStockReceipt,
};
