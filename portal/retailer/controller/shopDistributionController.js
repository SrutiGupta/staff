const prisma = require("../../../lib/prisma");

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

// Enhanced distribute products to shop with planning and validation
exports.distributeToShop = async (req, res) => {
  try {
    const retailerId = req.retailer.id;
    const {
      retailerShopId,
      distributions, // Array of { retailerProductId, quantity, unitPrice }
      notes,
      paymentDueDate,
      deliveryExpectedDate,
      planDistribution = false, // Optional: plan distribution without committing
    } = req.body;

    // Enhanced validation
    if (!retailerShopId || !distributions || !Array.isArray(distributions)) {
      return res.status(400).json({
        error: "Shop ID and distributions array are required",
      });
    }

    if (distributions.length === 0) {
      return res.status(400).json({
        error: "At least one distribution item is required",
      });
    }

    // Verify retailer shop exists and get detailed info
    const retailerShop = await prisma.retailerShop.findFirst({
      where: {
        id: parseInt(retailerShopId),
        retailerId: retailerId,
        isActive: true,
      },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            address: true,
            contactNumber: true,
            isActive: true,
          },
        },
      },
    });

    if (!retailerShop) {
      return res.status(404).json({
        error: "Shop not found in your active network",
      });
    }

    if (!retailerShop.shop?.isActive) {
      return res.status(400).json({
        error: "Cannot distribute to inactive shop",
      });
    }

    // Batch validation phase - collect all errors before processing
    const validationErrors = [];
    const distributionPlan = [];
    let totalAmount = 0;

    // Pre-validate all distributions
    for (let i = 0; i < distributions.length; i++) {
      const dist = distributions[i];
      const { retailerProductId, quantity, unitPrice } = dist;

      // Validate required fields
      if (!retailerProductId || !quantity || !unitPrice) {
        validationErrors.push({
          index: i,
          error: "Product ID, quantity, and unit price are required",
        });
        continue;
      }

      // Validate data types and ranges
      if (parseInt(quantity) <= 0) {
        validationErrors.push({
          index: i,
          error: "Quantity must be greater than 0",
        });
        continue;
      }

      if (parseFloat(unitPrice) <= 0) {
        validationErrors.push({
          index: i,
          error: "Unit price must be greater than 0",
        });
        continue;
      }

      // Verify retailer product exists and has sufficient stock
      const retailerProduct = await prisma.retailerProduct.findFirst({
        where: {
          id: parseInt(retailerProductId),
          retailerId: retailerId,
          isActive: true,
        },
        include: {
          product: {
            include: {
              company: true,
            },
          },
        },
      });

      if (!retailerProduct) {
        validationErrors.push({
          index: i,
          productId: retailerProductId,
          error: `Product not found in your inventory`,
        });
        continue;
      }

      const requestedQuantity = parseInt(quantity);
      if (retailerProduct.availableStock < requestedQuantity) {
        validationErrors.push({
          index: i,
          productId: retailerProductId,
          productName: retailerProduct.product.name,
          error: `Insufficient stock. Available: ${retailerProduct.availableStock}, Requested: ${requestedQuantity}`,
        });
        continue;
      }

      const itemTotal = requestedQuantity * parseFloat(unitPrice);
      totalAmount += itemTotal;

      distributionPlan.push({
        ...dist,
        retailerProduct,
        itemTotal,
        parsedQuantity: requestedQuantity,
        parsedUnitPrice: parseFloat(unitPrice),
      });
    }

    // Return validation errors if any
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Validation failed for distribution items",
        validationErrors,
        summary: {
          totalItems: distributions.length,
          validItems: distributionPlan.length,
          errorItems: validationErrors.length,
        },
      });
    }

    // If planning mode, return plan without executing
    if (planDistribution) {
      return res.status(200).json({
        message: "Distribution plan created successfully",
        plan: {
          shop: {
            id: retailerShop.id,
            name: retailerShop.shop.name,
            address: retailerShop.shop.address,
          },
          items: distributionPlan.map((item) => ({
            productId: item.retailerProductId,
            productName: item.retailerProduct.product.name,
            company: item.retailerProduct.product.company.name,
            quantity: item.parsedQuantity,
            unitPrice: item.parsedUnitPrice,
            itemTotal: item.itemTotal,
            availableStock: item.retailerProduct.availableStock,
            stockAfterDistribution:
              item.retailerProduct.availableStock - item.parsedQuantity,
          })),
          totalAmount,
          paymentDueDate: paymentDueDate ? new Date(paymentDueDate) : null,
          deliveryExpectedDate: deliveryExpectedDate
            ? new Date(deliveryExpectedDate)
            : null,
          notes,
        },
      });
    }

    // Execute distribution - use transaction for data consistency
    const result = await prisma.$transaction(async (tx) => {
      const createdDistributions = [];

      // Process each validated distribution item
      for (const planItem of distributionPlan) {
        // Create distribution record
        const distribution = await tx.shopDistribution.create({
          data: {
            retailerId: retailerId,
            retailerShopId: parseInt(retailerShopId),
            retailerProductId: parseInt(planItem.retailerProductId),
            quantity: planItem.parsedQuantity,
            unitPrice: planItem.parsedUnitPrice,
            totalAmount: planItem.itemTotal,
            paymentDueDate: paymentDueDate ? new Date(paymentDueDate) : null,
            deliveryExpectedDate: deliveryExpectedDate
              ? new Date(deliveryExpectedDate)
              : null,
            notes,
            deliveryStatus: "PENDING",
            paymentStatus: "PENDING",
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
        await tx.retailerProduct.update({
          where: { id: parseInt(planItem.retailerProductId) },
          data: {
            availableStock: {
              decrement: planItem.parsedQuantity,
            },
            allocatedStock: {
              increment: planItem.parsedQuantity,
            },
          },
        });

        // Update inventory tracking
        await tx.retailerInventory.updateMany({
          where: {
            retailerId: retailerId,
            retailerProductId: parseInt(planItem.retailerProductId),
          },
          data: {
            reservedStock: {
              increment: planItem.parsedQuantity,
            },
          },
        });

        createdDistributions.push(distribution);
      }

      // Create revenue transaction
      await tx.retailerTransaction.create({
        data: {
          retailerId: retailerId,
          type: "SALE_TO_SHOP",
          amount: totalAmount,
          description: `Distribution to ${
            retailerShop.shop?.name || "Shop"
          } - ${distributionPlan.length} items`,
          shopId: retailerShop.shopId,
          referenceId: `DIST-${Date.now()}`,
        },
      });

      return createdDistributions;
    });

    res.status(201).json({
      message: "Products distributed successfully",
      distributions: result,
      summary: {
        shopName: retailerShop.shop.name,
        totalItems: distributionPlan.length,
        totalAmount,
        distributionDate: new Date().toISOString(),
        paymentDueDate: paymentDueDate
          ? new Date(paymentDueDate).toISOString()
          : null,
        deliveryExpectedDate: deliveryExpectedDate
          ? new Date(deliveryExpectedDate).toISOString()
          : null,
      },
    });
  } catch (error) {
    console.error("Enhanced distribute to shop error:", error);
    res.status(500).json({
      error: "Failed to distribute products",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
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

// 🆕 NEW: Get available shops not yet connected to retailer
exports.getAvailableShops = async (req, res) => {
  try {
    const retailerId = req.retailer.id;

    const availableShops = await prisma.shop.findMany({
      where: {
        // Only show shops not already in retailer's network
        retailerShops: {
          none: {
            retailerId: retailerId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      availableShops,
      total: availableShops.length,
      message: `${availableShops.length} new shops available for connection`,
    });
  } catch (error) {
    console.error("Get available shops error:", error);
    res.status(500).json({ error: "Failed to fetch available shops" });
  }
};

// 🆕 NEW: Get retailer's connected shops with enhanced stats (alias for getRetailerShops)
exports.getMyNetwork = async (req, res) => {
  try {
    const retailerId = req.retailer.id;

    const myShops = await prisma.retailerShop.findMany({
      where: {
        retailerId: retailerId,
        isActive: true,
      },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        joinedAt: "desc",
      },
    });

    // Add enhanced distribution stats for each shop
    const shopsWithStats = await Promise.all(
      myShops.map(async (rs) => {
        // Get distribution statistics
        const stats = await prisma.shopDistribution.aggregate({
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

        // Get pending distributions
        const pendingStats = await prisma.shopDistribution.aggregate({
          where: {
            retailerId: retailerId,
            retailerShopId: rs.id,
            deliveryStatus: "PENDING",
          },
          _count: {
            id: true,
          },
          _sum: {
            totalAmount: true,
          },
        });

        // Get last distribution
        const lastDistribution = await prisma.shopDistribution.findFirst({
          where: {
            retailerId: retailerId,
            retailerShopId: rs.id,
          },
          orderBy: {
            distributionDate: "desc",
          },
          include: {
            retailerProduct: {
              include: { product: true },
            },
          },
        });

        return {
          id: rs.id,
          shop: rs.shop,
          partnershipType: rs.partnershipType,
          joinedAt: rs.joinedAt,
          isActive: rs.isActive,
          stats: {
            totalDistributions: stats._count.id || 0,
            totalQuantityDistributed: stats._sum.quantity || 0,
            totalAmountDistributed: stats._sum.totalAmount || 0,
            pendingDeliveries: pendingStats._count.id || 0,
            pendingAmount: pendingStats._sum.totalAmount || 0,
            lastDistribution: lastDistribution
              ? {
                  date: lastDistribution.distributionDate,
                  product: lastDistribution.retailerProduct.product.name,
                  quantity: lastDistribution.quantity,
                  amount: lastDistribution.totalAmount,
                  status: lastDistribution.deliveryStatus,
                }
              : null,
          },
        };
      })
    );

    res.json({
      myShops: shopsWithStats,
      totalShops: shopsWithStats.length,
      message: `You have ${shopsWithStats.length} shops in your distribution network`,
    });
  } catch (error) {
    console.error("Get my network error:", error);
    res.status(500).json({ error: "Failed to fetch shop network" });
  }
};

// 🆕 NEW: Simplified distribution using direct shop ID
exports.distributeToShopById = async (req, res) => {
  try {
    const retailerId = req.retailer.id;
    const {
      shopId, // Direct shop ID (much simpler than retailerShopId)
      products, // [{ productId, quantity, unitPrice }]
      notes,
      expectedDeliveryDate,
    } = req.body;

    if (!shopId || !products || !Array.isArray(products)) {
      return res.status(400).json({
        error: "Shop ID and products array are required",
      });
    }

    // Verify shop is in retailer's network
    const retailerShop = await prisma.retailerShop.findFirst({
      where: {
        retailerId: retailerId,
        shop: { id: parseInt(shopId) },
        isActive: true,
      },
      include: {
        shop: {
          select: { id: true, name: true, address: true },
        },
      },
    });

    if (!retailerShop) {
      return res.status(404).json({
        error: "Shop not found in your distribution network",
        hint: "Add the shop to your network first using POST /shops",
      });
    }

    const distributions = [];
    let totalAmount = 0;

    // Process each product
    for (const item of products) {
      const { productId, quantity, unitPrice } = item;

      if (!productId || !quantity || !unitPrice) {
        return res.status(400).json({
          error:
            "Product ID, quantity, and unit price are required for each product",
        });
      }

      // Verify retailer has this product with sufficient stock
      const retailerProduct = await prisma.retailerProduct.findFirst({
        where: {
          retailerId: retailerId,
          productId: parseInt(productId),
          isActive: true,
        },
        include: {
          product: {
            select: { id: true, name: true, sku: true },
          },
        },
      });

      if (!retailerProduct) {
        return res.status(400).json({
          error: `Product ${productId} not found in your inventory`,
        });
      }

      if (retailerProduct.availableStock < parseInt(quantity)) {
        return res.status(400).json({
          error: `Insufficient stock for ${retailerProduct.product.name}`,
          available: retailerProduct.availableStock,
          requested: parseInt(quantity),
        });
      }

      const itemTotal = parseInt(quantity) * parseFloat(unitPrice);
      totalAmount += itemTotal;

      // Create distribution record
      const distribution = await prisma.shopDistribution.create({
        data: {
          retailerId: retailerId,
          retailerShopId: retailerShop.id,
          retailerProductId: retailerProduct.id,
          quantity: parseInt(quantity),
          unitPrice: parseFloat(unitPrice),
          totalAmount: itemTotal,
          deliveryStatus: "PENDING",
          paymentStatus: "PENDING",
          notes,
          expectedDeliveryDate: expectedDeliveryDate
            ? new Date(expectedDeliveryDate)
            : null,
        },
        include: {
          retailerProduct: {
            include: { product: true },
          },
        },
      });

      // Update retailer stock
      await prisma.retailerProduct.update({
        where: { id: retailerProduct.id },
        data: {
          availableStock: { decrement: parseInt(quantity) },
          allocatedStock: { increment: parseInt(quantity) },
        },
      });

      distributions.push({
        distributionId: distribution.id,
        product: retailerProduct.product,
        quantity: distribution.quantity,
        unitPrice: distribution.unitPrice,
        totalAmount: distribution.totalAmount,
      });
    }

    // Create revenue transaction
    await prisma.retailerTransaction.create({
      data: {
        retailerId: retailerId,
        type: "SALE_TO_SHOP",
        amount: totalAmount,
        description: `Distribution to ${retailerShop.shop.name}`,
        shopId: retailerShop.shopId,
      },
    });

    res.status(201).json({
      message: "Products distributed successfully",
      shop: retailerShop.shop,
      distributions,
      totalAmount,
      totalProducts: distributions.length,
    });
  } catch (error) {
    console.error("Distribute to shop by ID error:", error);
    res.status(500).json({ error: "Failed to distribute products" });
  }
};
