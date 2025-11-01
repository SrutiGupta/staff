const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * @desc    List all stock receipts for the admin's shop with pagination
 * @route   GET /shop-admin/stock/receipts
 * @access  Private (ShopAdmin)
 */
const listStockReceipts = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    if (!shopId) {
      return res.status(403).json({
        error: "SHOP_NOT_ASSOCIATED",
        message: "Admin is not associated with a shop.",
      });
    }

    // Get pagination parameters (validated by middleware)
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = { shopId: shopId };

    // Get total count for pagination
    const totalCount = await prisma.stockReceipt.count({ where });

    // Get paginated receipts
    const receipts = await prisma.stockReceipt.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            basePrice: true,
          },
        },
        receivedByStaff: {
          select: {
            id: true,
            name: true,
          },
        },
        verifiedByAdmin: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: parseInt(skip),
      take: parseInt(limit),
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      receipts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: totalCount,
        itemsPerPage: parseInt(limit),
        hasNextPage,
        hasPrevPage,
      },
      summary: {
        pending: receipts.filter((r) => r.status === "PENDING").length,
        approved: receipts.filter((r) => r.status === "APPROVED").length,
        rejected: receipts.filter((r) => r.status === "REJECTED").length,
      },
    });
  } catch (error) {
    console.error("Error fetching stock receipts:", error);
    res.status(500).json({
      error: "FETCH_RECEIPTS_FAILED",
      message: "Failed to fetch stock receipts",
    });
  }
};

/**
 * @desc    Approve or Reject a stock receipt with enhanced validation
 * @route   PUT /shop-admin/stock/receipts/:id/verify
 * @access  Private (ShopAdmin)
 */
const approveStockReceipt = async (req, res) => {
  const { id } = req.params;
  const { decision, verifiedQuantity, adminNotes, discrepancyReason } =
    req.body;
  const adminId = req.user.shopAdminId;
  const shopId = req.user.shopId;

  // Parse and validate receipt ID
  const receiptId = parseInt(id);
  if (isNaN(receiptId) || receiptId <= 0) {
    return res.status(400).json({
      error: "INVALID_RECEIPT_ID",
      message: "Invalid receipt ID provided.",
    });
  }

  try {
    // Use transaction for data consistency with increased timeout
    const result = await prisma.$transaction(
      async (prisma) => {
      // Get receipt with lock for update
      const receipt = await prisma.stockReceipt.findUnique({
        where: { id: receiptId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
        },
      });

      if (!receipt) {
        throw new Error("RECEIPT_NOT_FOUND");
      }

      if (receipt.shopId !== shopId) {
        throw new Error("FORBIDDEN_ACCESS");
      }

      if (receipt.status !== "PENDING") {
        throw new Error("RECEIPT_ALREADY_PROCESSED");
      }

      const quantity =
        decision === "APPROVED" ? parseInt(verifiedQuantity, 10) : undefined;

      // Update the receipt
      const updatedReceipt = await prisma.stockReceipt.update({
        where: { id: receiptId },
        data: {
          status: decision,
          verifiedByAdminId: adminId,
          verifiedAt: new Date(),
          verifiedQuantity: quantity,
          adminNotes: adminNotes || null,
          discrepancyReason: discrepancyReason || null,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
          verifiedByAdmin: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // If approved, update shop inventory
      if (decision === "APPROVED" && quantity > 0) {
        // Get current inventory quantity
        let currentShopInventory = await prisma.shopInventory.findUnique({
          where: {
            shopId_productId: {
              shopId: shopId,
              productId: receipt.productId,
            },
          },
        });

        const previousQty = currentShopInventory?.quantity || 0;
        const newQty = previousQty + quantity;

        // Upsert inventory with current quantity
        const updatedInventory = await prisma.shopInventory.upsert({
          where: {
            shopId_productId: {
              shopId: shopId,
              productId: receipt.productId,
            },
          },
          update: {
            quantity: newQty,
            lastRestockedAt: new Date(),
          },
          create: {
            shopId: shopId,
            productId: receipt.productId,
            quantity: newQty,
            lastRestockedAt: new Date(),
          },
        });

        // Log stock movement with proper fields
        await prisma.stockMovement.create({
          data: {
            shopInventoryId: updatedInventory.id,
            type: "STOCK_IN",
            quantity: quantity,
            previousQty: previousQty,
            newQty: newQty,
            adminId: adminId,
            stockReceiptId: receiptId,
            reason: "STOCK_IN",
            supplierName: receipt.supplierName,
            batchNo: receipt.batchNumber,
            expiryDate: receipt.expiryDate,
            notes: `Stock receipt approved - Receipt #${receiptId}`,
          },
        });
      }

      return updatedReceipt;
    },
    {
      timeout: 10000, // 10 seconds timeout for transaction
    }
    );

    res.status(200).json({
      message: `Stock receipt has been ${decision.toLowerCase()} successfully.`,
      receipt: result,
      updatedInventory:
        decision === "APPROVED"
          ? {
              productId: result.productId,
              quantityAdded: verifiedQuantity,
            }
          : null,
    });
  } catch (error) {
    console.error(`Failed to ${decision.toLowerCase()} stock receipt:`, error);

    // Handle specific transaction errors
    if (error.message === "RECEIPT_NOT_FOUND") {
      return res.status(404).json({
        error: "RECEIPT_NOT_FOUND",
        message: "Stock receipt not found.",
      });
    }

    if (error.message === "FORBIDDEN_ACCESS") {
      return res.status(403).json({
        error: "FORBIDDEN_ACCESS",
        message: "You can only manage receipts for your own shop.",
      });
    }

    if (error.message === "RECEIPT_ALREADY_PROCESSED") {
      return res.status(400).json({
        error: "RECEIPT_ALREADY_PROCESSED",
        message: `Receipt has already been processed with status: ${
          error.details?.status || "unknown"
        }`,
      });
    }

    res.status(500).json({
      error: "RECEIPT_PROCESSING_FAILED",
      message: "An error occurred while processing the receipt.",
    });
  }
};

module.exports = {
  listStockReceipts,
  approveStockReceipt,
};
