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

          // Update corresponding IncomingShipment record if exists
          const incomingShipment = await prisma.incomingShipment.findFirst({
            where: {
              shopId: shopId,
              productId: receipt.productId,
              status: {
                in: ["EXPECTED", "IN_TRANSIT", "PARTIALLY_RECEIVED"],
              },
            },
            orderBy: { distributionDate: "desc" },
          });

          if (incomingShipment) {
            // Calculate discrepancy
            const discrepancy = quantity - incomingShipment.expectedQuantity;
            const newStatus =
              quantity >= incomingShipment.expectedQuantity
                ? "FULLY_RECEIVED"
                : "PARTIALLY_RECEIVED";

            // Update incoming shipment
            await prisma.incomingShipment.update({
              where: { id: incomingShipment.id },
              data: {
                receivedQuantity: quantity,
                stockReceiptId: receiptId,
                discrepancyQuantity: discrepancy,
                status: newStatus,
                actualDeliveryDate: new Date(),
                discrepancyReason:
                  discrepancy !== 0
                    ? discrepancy > 0
                      ? "EXCESS_ITEMS"
                      : "SHORTAGE"
                    : null,
              },
            });
          }
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

/**
 * @desc    List all incoming shipments (expected stock from bulk distribution)
 * @route   GET /shop-admin/stock/incoming-shipments
 * @access  Private (ShopAdmin)
 */
const listIncomingShipments = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    if (!shopId) {
      return res.status(403).json({
        error: "SHOP_NOT_ASSOCIATED",
        message: "Admin is not associated with a shop.",
      });
    }

    // Get pagination and filter parameters
    const {
      page = 1,
      limit = 10,
      status = null,
      sortBy = "distributionDate",
      sortOrder = "desc",
    } = req.query;

    const skip = (page - 1) * limit;

    // Build where clause with filters
    const where = { shopId: shopId };
    if (status) {
      where.status = status; // Filter by status if provided
    }

    // Get total count
    const totalCount = await prisma.incomingShipment.count({ where });

    // Get paginated incoming shipments
    const shipments = await prisma.incomingShipment.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
            company: {
              select: {
                name: true,
              },
            },
          },
        },
        shopDistribution: {
          select: {
            id: true,
            retailerProduct: {
              select: {
                retailer: {
                  select: {
                    name: true,
                    companyName: true,
                  },
                },
              },
            },
          },
        },
        stockReceipt: {
          select: {
            id: true,
            receivedQuantity: true,
            verifiedQuantity: true,
            status: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: parseInt(skip),
      take: parseInt(limit),
    });

    // Calculate summary statistics
    const summary = {
      total: totalCount,
      expected: await prisma.incomingShipment.count({
        where: { ...where, status: "EXPECTED" },
      }),
      inTransit: await prisma.incomingShipment.count({
        where: { ...where, status: "IN_TRANSIT" },
      }),
      partiallyReceived: await prisma.incomingShipment.count({
        where: { ...where, status: "PARTIALLY_RECEIVED" },
      }),
      fullyReceived: await prisma.incomingShipment.count({
        where: { ...where, status: "FULLY_RECEIVED" },
      }),
      overdue: await prisma.incomingShipment.count({
        where: { ...where, status: "OVERDUE" },
      }),
      cancelled: await prisma.incomingShipment.count({
        where: { ...where, status: "CANCELLED" },
      }),
    };

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      message: "Incoming shipments retrieved successfully",
      shipments: shipments.map((shipment) => ({
        id: shipment.id,
        product: shipment.product,
        expectedQuantity: shipment.expectedQuantity,
        receivedQuantity: shipment.receivedQuantity,
        discrepancyQuantity: shipment.discrepancyQuantity,
        status: shipment.status,
        distributionDate: shipment.distributionDate,
        expectedDeliveryDate: shipment.expectedDeliveryDate,
        actualDeliveryDate: shipment.actualDeliveryDate,
        retailer: shipment.shopDistribution?.retailerProduct?.retailer,
        stockReceipt: shipment.stockReceipt,
        discrepancyReason: shipment.discrepancyReason,
        notes: shipment.notes,
        createdAt: shipment.createdAt,
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: totalCount,
        itemsPerPage: parseInt(limit),
        hasNextPage,
        hasPrevPage,
      },
      summary,
    });
  } catch (error) {
    console.error("Error fetching incoming shipments:", error);
    res.status(500).json({
      error: "FETCH_SHIPMENTS_FAILED",
      message: "Failed to fetch incoming shipments",
    });
  }
};

/**
 * @desc    Get detailed information about a specific incoming shipment
 * @route   GET /shop-admin/stock/incoming-shipments/:id
 * @access  Private (ShopAdmin)
 */
const getIncomingShipmentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const shopId = req.user.shopId;

    if (!shopId) {
      return res.status(403).json({
        error: "SHOP_NOT_ASSOCIATED",
        message: "Admin is not associated with a shop.",
      });
    }

    const shipment = await prisma.incomingShipment.findFirst({
      where: {
        id: parseInt(id),
        shopId: shopId,
      },
      include: {
        product: {
          include: {
            company: true,
          },
        },
        shop: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        shopDistribution: {
          include: {
            retailer: {
              select: {
                id: true,
                name: true,
                companyName: true,
                email: true,
              },
            },
            retailerProduct: {
              select: {
                wholesalePrice: true,
                mrp: true,
              },
            },
          },
        },
        stockReceipt: {
          include: {
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
        },
      },
    });

    if (!shipment) {
      return res.status(404).json({
        error: "SHIPMENT_NOT_FOUND",
        message: "Incoming shipment not found",
      });
    }

    res.json({
      message: "Incoming shipment details retrieved successfully",
      shipment: {
        id: shipment.id,
        product: shipment.product,
        shop: shipment.shop,
        retailer: shipment.shopDistribution?.retailer,
        expectedQuantity: shipment.expectedQuantity,
        receivedQuantity: shipment.receivedQuantity,
        discrepancyQuantity: shipment.discrepancyQuantity,
        status: shipment.status,
        distributionDate: shipment.distributionDate,
        expectedDeliveryDate: shipment.expectedDeliveryDate,
        actualDeliveryDate: shipment.actualDeliveryDate,
        wholesalePrice:
          shipment.shopDistribution?.retailerProduct?.wholesalePrice,
        mrp: shipment.shopDistribution?.retailerProduct?.mrp,
        stockReceipt: shipment.stockReceipt,
        discrepancyReason: shipment.discrepancyReason,
        notes: shipment.notes,
        createdAt: shipment.createdAt,
        updatedAt: shipment.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching shipment details:", error);
    res.status(500).json({
      error: "FETCH_SHIPMENT_FAILED",
      message: "Failed to fetch shipment details",
    });
  }
};

/**
 * @desc    Get comparison between expected and received stock
 * @route   GET /shop-admin/stock/incoming-shipments/summary/comparison
 * @access  Private (ShopAdmin)
 */
const getIncomingShipmentComparison = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    if (!shopId) {
      return res.status(403).json({
        error: "SHOP_NOT_ASSOCIATED",
        message: "Admin is not associated with a shop.",
      });
    }

    const { dateFrom, dateTo } = req.query;

    // Build where clause with optional date filtering
    const where = { shopId: shopId };
    if (dateFrom || dateTo) {
      where.distributionDate = {};
      if (dateFrom) {
        where.distributionDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.distributionDate.lte = new Date(dateTo);
      }
    }

    // Get all incoming shipments for comparison
    const shipments = await prisma.incomingShipment.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
            company: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { distributionDate: "desc" },
    });

    // Calculate comparison metrics
    const comparison = {
      totalExpected: shipments.reduce((sum, s) => sum + s.expectedQuantity, 0),
      totalReceived: shipments.reduce((sum, s) => sum + s.receivedQuantity, 0),
      totalDiscrepancy: shipments.reduce(
        (sum, s) => sum + s.discrepancyQuantity,
        0
      ),
      shipmentDetails: shipments.map((shipment) => ({
        id: shipment.id,
        product: shipment.product,
        expectedQuantity: shipment.expectedQuantity,
        receivedQuantity: shipment.receivedQuantity,
        discrepancyQuantity: shipment.discrepancyQuantity,
        status: shipment.status,
        discrepancyReason: shipment.discrepancyReason,
        discrepancyPercent:
          shipment.expectedQuantity > 0
            ? (
                (shipment.discrepancyQuantity / shipment.expectedQuantity) *
                100
              ).toFixed(2)
            : 0,
        distributionDate: shipment.distributionDate,
        actualDeliveryDate: shipment.actualDeliveryDate,
      })),
      // Shipments with issues (discrepancies)
      discrepancyShipments: shipments
        .filter((s) => s.discrepancyQuantity !== 0)
        .map((s) => ({
          id: s.id,
          product: s.product.name,
          sku: s.product.sku,
          expectedQuantity: s.expectedQuantity,
          receivedQuantity: s.receivedQuantity,
          discrepancy: s.discrepancyQuantity,
          reason: s.discrepancyReason || "Not specified",
        })),
    };

    res.json({
      message: "Shipment comparison retrieved successfully",
      comparison,
      summary: {
        totalShipments: shipments.length,
        fullyReceivedCount: shipments.filter((s) => s.discrepancyQuantity === 0)
          .length,
        discrepancyCount: shipments.filter((s) => s.discrepancyQuantity !== 0)
          .length,
        accuracyPercent:
          shipments.length > 0
            ? (
                (shipments.filter((s) => s.discrepancyQuantity === 0).length /
                  shipments.length) *
                100
              ).toFixed(2)
            : 0,
      },
    });
  } catch (error) {
    console.error("Error getting comparison:", error);
    res.status(500).json({
      error: "COMPARISON_FAILED",
      message: "Failed to get comparison data",
    });
  }
};

module.exports = {
  listStockReceipts,
  approveStockReceipt,
  listIncomingShipments,
  getIncomingShipmentDetails,
  getIncomingShipmentComparison,
};
