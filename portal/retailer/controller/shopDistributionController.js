const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get all shops under retailer
exports.getRetailerShops = async (req, res) => {
  try {
    const retailerId = req.retailer.id;
    const { isActive, partnershipType } = req.query;

    const where = { retailerId };

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    if (partnershipType) {
      where.partnershipType = partnershipType;
    }

    const retailerShops = await prisma.retailerShop.findMany({
      where,
      include: {
        shop: true,
      },
      orderBy: {
        joinedAt: "desc",
      },
    });

    // Get summary stats for each shop
    const shopsWithStats = await Promise.all(
      retailerShops.map(async (rs) => {
        // Get total distributions
        const distributionStats = await prisma.shopDistribution.aggregate({
          where: {
            retailerId: retailerId,
            retailerShopId: rs.id,
          },
          _sum: {
            quantity: true,
            totalAmount: true,
          },
          _count: {
            id: true,
          },
        });

        // Get pending payments
        const pendingPayments = await prisma.shopDistribution.aggregate({
          where: {
            retailerId: retailerId,
            retailerShopId: rs.id,
            paymentStatus: "PENDING",
          },
          _sum: {
            totalAmount: true,
          },
        });

        // Get recent distribution
        const recentDistribution = await prisma.shopDistribution.findFirst({
          where: {
            retailerId: retailerId,
            retailerShopId: rs.id,
          },
          orderBy: {
            distributionDate: "desc",
          },
          include: {
            retailerProduct: {
              include: {
                product: true,
              },
            },
          },
        });

        return {
          ...rs,
          stats: {
            totalDistributions: distributionStats._count.id || 0,
            totalQuantityDistributed: distributionStats._sum.quantity || 0,
            totalAmountDistributed: distributionStats._sum.totalAmount || 0,
            pendingPayments: pendingPayments._sum.totalAmount || 0,
            lastDistribution: recentDistribution,
          },
        };
      })
    );

    res.json(shopsWithStats);
  } catch (error) {
    console.error("Get retailer shops error:", error);
    res.status(500).json({ error: "Failed to fetch shops" });
  }
};

// Add shop to retailer network
exports.addShop = async (req, res) => {
  try {
    const retailerId = req.retailer.id;
    const {
      shopId,
      partnershipType,
      commissionRate,
      creditLimit,
      paymentTerms,
    } = req.body;

    if (!shopId) {
      return res.status(400).json({ error: "Shop ID is required" });
    }

    // Check if shop exists
    const shop = await prisma.shop.findUnique({
      where: { id: parseInt(shopId) },
    });

    if (!shop) {
      return res.status(400).json({ error: "Invalid shop ID" });
    }

    // Check if relationship already exists
    const existing = await prisma.retailerShop.findUnique({
      where: {
        retailerId_shopId: {
          retailerId: retailerId,
          shopId: parseInt(shopId),
        },
      },
    });

    if (existing) {
      return res.status(400).json({
        error: "Shop is already in your network",
      });
    }

    const retailerShop = await prisma.retailerShop.create({
      data: {
        retailerId: retailerId,
        shopId: parseInt(shopId),
        partnershipType,
        commissionRate: commissionRate ? parseFloat(commissionRate) : null,
        creditLimit: creditLimit ? parseFloat(creditLimit) : null,
        paymentTerms,
      },
      include: {
        shop: true,
      },
    });

    res.status(201).json({
      message: "Shop added to network successfully",
      retailerShop,
    });
  } catch (error) {
    console.error("Add shop error:", error);
    res.status(500).json({ error: "Failed to add shop" });
  }
};

// Update shop relationship
exports.updateShopRelationship = async (req, res) => {
  try {
    const { retailerShopId } = req.params;
    const retailerId = req.retailer.id;
    const {
      partnershipType,
      commissionRate,
      creditLimit,
      paymentTerms,
      isActive,
    } = req.body;

    const retailerShop = await prisma.retailerShop.findFirst({
      where: {
        id: parseInt(retailerShopId),
        retailerId: retailerId,
      },
    });

    if (!retailerShop) {
      return res.status(404).json({ error: "Shop not found in your network" });
    }

    const updatedRelationship = await prisma.retailerShop.update({
      where: { id: parseInt(retailerShopId) },
      data: {
        partnershipType,
        commissionRate: commissionRate ? parseFloat(commissionRate) : undefined,
        creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
        paymentTerms,
        isActive: isActive !== undefined ? isActive : undefined,
      },
      include: {
        shop: true,
      },
    });

    res.json({
      message: "Shop relationship updated successfully",
      retailerShop: updatedRelationship,
    });
  } catch (error) {
    console.error("Update shop relationship error:", error);
    res.status(500).json({ error: "Failed to update shop relationship" });
  }
};

// Distribute products to shop
exports.distributeToShop = async (req, res) => {
  try {
    const retailerId = req.retailer.id;
    const {
      retailerShopId,
      distributions, // Array of { retailerProductId, quantity, unitPrice }
      notes,
      paymentDueDate,
    } = req.body;

    if (!retailerShopId || !distributions || !Array.isArray(distributions)) {
      return res.status(400).json({
        error: "Shop ID and distributions array are required",
      });
    }

    // Verify retailer shop exists
    const retailerShop = await prisma.retailerShop.findFirst({
      where: {
        id: parseInt(retailerShopId),
        retailerId: retailerId,
        isActive: true,
      },
    });

    if (!retailerShop) {
      return res.status(404).json({
        error: "Shop not found in your active network",
      });
    }

    const createdDistributions = [];
    let totalAmount = 0;

    // Process each distribution item
    for (const dist of distributions) {
      const { retailerProductId, quantity, unitPrice } = dist;

      if (!retailerProductId || !quantity || !unitPrice) {
        return res.status(400).json({
          error:
            "Product ID, quantity, and unit price are required for each distribution",
        });
      }

      // Verify retailer product exists and has sufficient stock
      const retailerProduct = await prisma.retailerProduct.findFirst({
        where: {
          id: parseInt(retailerProductId),
          retailerId: retailerId,
          isActive: true,
        },
        include: {
          product: true,
        },
      });

      if (!retailerProduct) {
        return res.status(400).json({
          error: `Product ${retailerProductId} not found in your inventory`,
        });
      }

      if (retailerProduct.availableStock < parseInt(quantity)) {
        return res.status(400).json({
          error: `Insufficient stock for ${retailerProduct.product.name}. Available: ${retailerProduct.availableStock}, Requested: ${quantity}`,
        });
      }

      const itemTotal = parseInt(quantity) * parseFloat(unitPrice);
      totalAmount += itemTotal;

      // Create distribution record
      const distribution = await prisma.shopDistribution.create({
        data: {
          retailerId: retailerId,
          retailerShopId: parseInt(retailerShopId),
          retailerProductId: parseInt(retailerProductId),
          quantity: parseInt(quantity),
          unitPrice: parseFloat(unitPrice),
          totalAmount: itemTotal,
          paymentDueDate: paymentDueDate ? new Date(paymentDueDate) : null,
          notes,
        },
        include: {
          retailerProduct: {
            include: {
              product: {
                include: {
                  company: true,
                },
              },
            },
          },
          retailerShop: {
            include: {
              shop: true,
            },
          },
        },
      });

      // Update retailer product stock
      await prisma.retailerProduct.update({
        where: { id: parseInt(retailerProductId) },
        data: {
          availableStock: {
            decrement: parseInt(quantity),
          },
          allocatedStock: {
            increment: parseInt(quantity),
          },
        },
      });

      // Update inventory
      await prisma.retailerInventory.updateMany({
        where: {
          retailerId: retailerId,
          retailerProductId: parseInt(retailerProductId),
        },
        data: {
          reservedStock: {
            increment: parseInt(quantity),
          },
        },
      });

      createdDistributions.push(distribution);
    }

    // Create revenue transaction
    await prisma.retailerTransaction.create({
      data: {
        retailerId: retailerId,
        type: "SALE_TO_SHOP",
        amount: totalAmount,
        description: `Distribution to ${retailerShop.shop?.name || "Shop"}`,
        shopId: retailerShop.shopId,
      },
    });

    res.status(201).json({
      message: "Products distributed successfully",
      distributions: createdDistributions,
      totalAmount,
    });
  } catch (error) {
    console.error("Distribute to shop error:", error);
    res.status(500).json({ error: "Failed to distribute products" });
  }
};

// Get distributions for a specific shop
exports.getShopDistributions = async (req, res) => {
  try {
    const { retailerShopId } = req.params;
    const retailerId = req.retailer.id;
    const {
      deliveryStatus,
      paymentStatus,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    // Verify shop belongs to retailer
    const retailerShop = await prisma.retailerShop.findFirst({
      where: {
        id: parseInt(retailerShopId),
        retailerId: retailerId,
      },
    });

    if (!retailerShop) {
      return res.status(404).json({ error: "Shop not found in your network" });
    }

    const skip = (page - 1) * limit;
    const where = {
      retailerId: retailerId,
      retailerShopId: parseInt(retailerShopId),
    };

    // Apply filters
    if (deliveryStatus) {
      where.deliveryStatus = deliveryStatus;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (startDate || endDate) {
      where.distributionDate = {};
      if (startDate) where.distributionDate.gte = new Date(startDate);
      if (endDate) where.distributionDate.lte = new Date(endDate);
    }

    const distributions = await prisma.shopDistribution.findMany({
      where,
      include: {
        retailerProduct: {
          include: {
            product: {
              include: {
                company: true,
              },
            },
          },
        },
        retailerShop: {
          include: {
            shop: true,
          },
        },
      },
      orderBy: {
        distributionDate: "desc",
      },
      skip: parseInt(skip),
      take: parseInt(limit),
    });

    const totalDistributions = await prisma.shopDistribution.count({ where });

    // Calculate summary
    const summary = await prisma.shopDistribution.aggregate({
      where: {
        retailerId: retailerId,
        retailerShopId: parseInt(retailerShopId),
      },
      _sum: {
        quantity: true,
        totalAmount: true,
      },
      _count: {
        id: true,
      },
    });

    const paidAmount = await prisma.shopDistribution.aggregate({
      where: {
        retailerId: retailerId,
        retailerShopId: parseInt(retailerShopId),
        paymentStatus: "PAID",
      },
      _sum: {
        totalAmount: true,
      },
    });

    res.json({
      distributions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalDistributions,
        pages: Math.ceil(totalDistributions / limit),
      },
      summary: {
        totalDistributions: summary._count.id || 0,
        totalQuantity: summary._sum.quantity || 0,
        totalAmount: summary._sum.totalAmount || 0,
        paidAmount: paidAmount._sum.totalAmount || 0,
        pendingAmount:
          (summary._sum.totalAmount || 0) - (paidAmount._sum.totalAmount || 0),
      },
    });
  } catch (error) {
    console.error("Get shop distributions error:", error);
    res.status(500).json({ error: "Failed to fetch distributions" });
  }
};

// Update delivery status
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { distributionId } = req.params;
    const retailerId = req.retailer.id;
    const { deliveryStatus, deliveryDate, trackingNumber } = req.body;

    if (!deliveryStatus) {
      return res.status(400).json({ error: "Delivery status is required" });
    }

    const distribution = await prisma.shopDistribution.findFirst({
      where: {
        id: parseInt(distributionId),
        retailerId: retailerId,
      },
      include: {
        retailerProduct: true,
      },
    });

    if (!distribution) {
      return res.status(404).json({ error: "Distribution not found" });
    }

    const updatedDistribution = await prisma.shopDistribution.update({
      where: { id: parseInt(distributionId) },
      data: {
        deliveryStatus,
        deliveryDate: deliveryDate
          ? new Date(deliveryDate)
          : deliveryStatus === "DELIVERED"
          ? new Date()
          : undefined,
        trackingNumber,
      },
      include: {
        retailerProduct: {
          include: {
            product: {
              include: {
                company: true,
              },
            },
          },
        },
        retailerShop: {
          include: {
            shop: true,
          },
        },
      },
    });

    // If delivered, update inventory
    if (
      deliveryStatus === "DELIVERED" &&
      distribution.deliveryStatus !== "DELIVERED"
    ) {
      await prisma.retailerInventory.updateMany({
        where: {
          retailerId: retailerId,
          retailerProductId: distribution.retailerProductId,
        },
        data: {
          reservedStock: {
            decrement: distribution.quantity,
          },
          inTransitStock: {
            decrement: distribution.quantity,
          },
        },
      });
    }

    // If marked as in transit, update inventory
    if (
      deliveryStatus === "IN_TRANSIT" &&
      distribution.deliveryStatus === "SHIPPED"
    ) {
      await prisma.retailerInventory.updateMany({
        where: {
          retailerId: retailerId,
          retailerProductId: distribution.retailerProductId,
        },
        data: {
          inTransitStock: {
            increment: distribution.quantity,
          },
        },
      });
    }

    res.json({
      message: "Delivery status updated successfully",
      distribution: updatedDistribution,
    });
  } catch (error) {
    console.error("Update delivery status error:", error);
    res.status(500).json({ error: "Failed to update delivery status" });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { distributionId } = req.params;
    const retailerId = req.retailer.id;
    const { paymentStatus, paidDate } = req.body;

    if (!paymentStatus) {
      return res.status(400).json({ error: "Payment status is required" });
    }

    const distribution = await prisma.shopDistribution.findFirst({
      where: {
        id: parseInt(distributionId),
        retailerId: retailerId,
      },
    });

    if (!distribution) {
      return res.status(404).json({ error: "Distribution not found" });
    }

    const updatedDistribution = await prisma.shopDistribution.update({
      where: { id: parseInt(distributionId) },
      data: {
        paymentStatus,
        paidDate: paidDate
          ? new Date(paidDate)
          : paymentStatus === "PAID"
          ? new Date()
          : undefined,
      },
      include: {
        retailerProduct: {
          include: {
            product: {
              include: {
                company: true,
              },
            },
          },
        },
        retailerShop: {
          include: {
            shop: true,
          },
        },
      },
    });

    res.json({
      message: "Payment status updated successfully",
      distribution: updatedDistribution,
    });
  } catch (error) {
    console.error("Update payment status error:", error);
    res.status(500).json({ error: "Failed to update payment status" });
  }
};

// Get all distributions across all shops
exports.getAllDistributions = async (req, res) => {
  try {
    const retailerId = req.retailer.id;
    const {
      deliveryStatus,
      paymentStatus,
      startDate,
      endDate,
      shopId,
      page = 1,
      limit = 20,
    } = req.query;

    const skip = (page - 1) * limit;
    const where = { retailerId };

    // Apply filters
    if (deliveryStatus) {
      where.deliveryStatus = deliveryStatus;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (shopId) {
      where.retailerShop = {
        shopId: parseInt(shopId),
      };
    }

    if (startDate || endDate) {
      where.distributionDate = {};
      if (startDate) where.distributionDate.gte = new Date(startDate);
      if (endDate) where.distributionDate.lte = new Date(endDate);
    }

    const distributions = await prisma.shopDistribution.findMany({
      where,
      include: {
        retailerProduct: {
          include: {
            product: {
              include: {
                company: true,
              },
            },
          },
        },
        retailerShop: {
          include: {
            shop: true,
          },
        },
      },
      orderBy: {
        distributionDate: "desc",
      },
      skip: parseInt(skip),
      take: parseInt(limit),
    });

    const totalDistributions = await prisma.shopDistribution.count({ where });

    res.json({
      distributions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalDistributions,
        pages: Math.ceil(totalDistributions / limit),
      },
    });
  } catch (error) {
    console.error("Get all distributions error:", error);
    res.status(500).json({ error: "Failed to fetch distributions" });
  }
};
