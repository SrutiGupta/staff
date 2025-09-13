const { PrismaClient } = require("@prisma/client");
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
  const shopIdFromUser = req.user.shopId; // Get shopId from authenticated user

  if (!productId || !receivedQuantity) {
    return res
      .status(400)
      .json({ error: "Missing required fields: productId, receivedQuantity" });
  }

  try {
    // Verify the product exists
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
      include: { company: true },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const newReceipt = await prisma.stockReceipt.create({
      data: {
        shopId: shopIdFromUser, // Use shopId from authenticated user
        productId: parseInt(productId),
        receivedQuantity: parseInt(receivedQuantity),
        receivedByStaffId,
        supplierName,
        deliveryNote,
        batchNumber,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status: "PENDING",
      },
      include: {
        product: {
          include: {
            company: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message:
        "Stock receipt created successfully. Waiting for shop admin approval.",
      receipt: newReceipt,
    });
  } catch (error) {
    console.error("Error creating stock receipt:", error);
    res.status(500).json({ error: "Failed to create stock receipt" });
  }
};

const getStockReceipts = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { status } = req.query;

    const whereCondition = { shopId };
    if (status) {
      whereCondition.status = status;
    }

    const receipts = await prisma.stockReceipt.findMany({
      where: whereCondition,
      include: {
        product: {
          include: {
            company: true,
          },
        },
        receivedByStaff: {
          select: {
            name: true,
          },
        },
        verifiedByAdmin: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      receipts,
      summary: {
        total: receipts.length,
        pending: receipts.filter((r) => r.status === "PENDING").length,
        approved: receipts.filter((r) => r.status === "APPROVED").length,
        rejected: receipts.filter((r) => r.status === "REJECTED").length,
        completed: receipts.filter((r) => r.status === "COMPLETED").length,
      },
    });
  } catch (error) {
    console.error("Error fetching stock receipts:", error);
    res.status(500).json({ error: "Failed to fetch stock receipts" });
  }
};

const getStockReceiptById = async (req, res) => {
  try {
    const { id } = req.params;
    const shopId = req.user.shopId;

    const receipt = await prisma.stockReceipt.findFirst({
      where: {
        id: parseInt(id),
        shopId: shopId, // Ensure staff can only access their shop's receipts
      },
      include: {
        product: {
          include: {
            company: true,
          },
        },
        receivedByStaff: {
          select: {
            name: true,
          },
        },
        verifiedByAdmin: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!receipt) {
      return res.status(404).json({ error: "Stock receipt not found" });
    }

    res.status(200).json(receipt);
  } catch (error) {
    console.error("Error fetching stock receipt:", error);
    res.status(500).json({ error: "Failed to fetch stock receipt" });
  }
};

module.exports = {
  createStockReceipt,
  getStockReceipts,
  getStockReceiptById,
};
