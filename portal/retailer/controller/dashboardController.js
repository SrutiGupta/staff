const prisma = require("../../../lib/prisma");

// Get dashboard overview data
exports.getDashboardOverview = async (req, res) => {
  try {
    const retailerId = req.retailer.id;
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get sales summary for today
    const todaySales = await prisma.retailerTransaction.aggregate({
      where: {
        retailerId: retailerId,
        type: "SALE_TO_SHOP",
        transactionDate: {
          gte: startOfDay,
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Get sales summary for this month
    const monthlySales = await prisma.retailerTransaction.aggregate({
      where: {
        retailerId: retailerId,
        type: "SALE_TO_SHOP",
        transactionDate: {
          gte: startOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Get inventory status
    const inventoryStats = await prisma.retailerProduct.aggregate({
      where: {
        retailerId: retailerId,
        isActive: true,
      },
      _sum: {
        totalStock: true,
        availableStock: true,
        allocatedStock: true,
      },
      _count: {
        id: true,
      },
    });

    // Get low stock products
    const lowStockProducts = await prisma.retailerProduct.count({
      where: {
        retailerId: retailerId,
        isActive: true,
        availableStock: {
          lte: prisma.retailerProduct.fields.reorderLevel,
        },
      },
    });

    // Get out of stock products
    const outOfStockProducts = await prisma.retailerProduct.count({
      where: {
        retailerId: retailerId,
        isActive: true,
        availableStock: 0,
      },
    });

    // Get monthly product distribution
    const monthlyDistributions = await prisma.shopDistribution.aggregate({
      where: {
        retailerId: retailerId,
        distributionDate: {
          gte: startOfMonth,
        },
        deliveryStatus: "DELIVERED",
      },
      _sum: {
        quantity: true,
        totalAmount: true,
      },
      _count: {
        id: true,
      },
    });

    // Get active shops count
    const activeShopsCount = await prisma.retailerShop.count({
      where: {
        retailerId: retailerId,
        isActive: true,
      },
    });

    // Top performing products this month
    const topProducts = await prisma.shopDistribution.groupBy({
      by: ["retailerProductId"],
      where: {
        retailerId: retailerId,
        distributionDate: {
          gte: startOfMonth,
        },
        deliveryStatus: "DELIVERED",
      },
      _sum: {
        quantity: true,
        totalAmount: true,
      },
      orderBy: {
        _sum: {
          totalAmount: "desc",
        },
      },
      take: 5,
    });

    // Get product details for top products
    const topProductDetails = await Promise.all(
      topProducts.map(async (item) => {
        const retailerProduct = await prisma.retailerProduct.findUnique({
          where: { id: item.retailerProductId },
          include: {
            product: {
              include: {
                company: true,
              },
            },
          },
        });
        return {
          ...retailerProduct,
          soldQuantity: item._sum.quantity,
          revenue: item._sum.totalAmount,
        };
      })
    );

    const dashboardData = {
      salesSummary: {
        today: {
          totalSales: todaySales._sum.amount || 0,
          orderCount: todaySales._count.id || 0,
        },
        thisMonth: {
          totalSales: monthlySales._sum.amount || 0,
          orderCount: monthlySales._count.id || 0,
        },
      },
      inventoryStatus: {
        totalProducts: inventoryStats._count.id || 0,
        totalStock: inventoryStats._sum.totalStock || 0,
        availableStock: inventoryStats._sum.availableStock || 0,
        allocatedStock: inventoryStats._sum.allocatedStock || 0,
        lowStockProducts: lowStockProducts,
        outOfStockProducts: outOfStockProducts,
      },
      monthlyOverview: {
        productsSold: monthlyDistributions._sum.quantity || 0,
        revenueGenerated: monthlyDistributions._sum.totalAmount || 0,
        distributionCount: monthlyDistributions._count.id || 0,
        activeShops: activeShopsCount,
      },
      topProducts: topProductDetails,
    };

    res.json(dashboardData);
  } catch (error) {
    console.error("Dashboard overview error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
};

// Get sales analytics by time period
exports.getSalesAnalytics = async (req, res) => {
  try {
    const retailerId = req.retailer.id;
    const { period = "month", startDate, endDate } = req.query;

    let dateFilter = {};
    const now = new Date();

    if (startDate && endDate) {
      dateFilter = {
        transactionDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };
    } else {
      switch (period) {
        case "today":
          dateFilter = {
            transactionDate: {
              gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            },
          };
          break;
        case "week":
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - 7);
          dateFilter = {
            transactionDate: {
              gte: weekStart,
            },
          };
          break;
        case "month":
          dateFilter = {
            transactionDate: {
              gte: new Date(now.getFullYear(), now.getMonth(), 1),
            },
          };
          break;
        case "year":
          dateFilter = {
            transactionDate: {
              gte: new Date(now.getFullYear(), 0, 1),
            },
          };
          break;
      }
    }

    // Sales by date
    const salesByDate = await prisma.retailerTransaction.groupBy({
      by: ["transactionDate"],
      where: {
        retailerId: retailerId,
        type: "SALE_TO_SHOP",
        ...dateFilter,
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        transactionDate: "asc",
      },
    });

    // Sales by shop
    const salesByShop = await prisma.shopDistribution.groupBy({
      by: ["retailerShopId"],
      where: {
        retailerId: retailerId,
        deliveryStatus: "DELIVERED",
        distributionDate: dateFilter.transactionDate || {},
      },
      _sum: {
        totalAmount: true,
        quantity: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          totalAmount: "desc",
        },
      },
    });

    // Get shop details
    const shopDetails = await Promise.all(
      salesByShop.map(async (item) => {
        const retailerShop = await prisma.retailerShop.findUnique({
          where: { id: item.retailerShopId },
          include: {
            shop: true,
          },
        });
        return {
          shop: retailerShop?.shop,
          revenue: item._sum.totalAmount,
          quantity: item._sum.quantity,
          orderCount: item._count.id,
        };
      })
    );

    res.json({
      period,
      salesByDate: salesByDate.map((item) => ({
        date: item.transactionDate,
        revenue: item._sum.amount,
        orders: item._count.id,
      })),
      salesByShop: shopDetails,
    });
  } catch (error) {
    console.error("Sales analytics error:", error);
    res.status(500).json({ error: "Failed to fetch sales analytics" });
  }
};

// Get inventory analytics
exports.getInventoryAnalytics = async (req, res) => {
  try {
    const retailerId = req.retailer.id;

    // Inventory by category/company
    const inventoryByCompany = await prisma.retailerProduct.groupBy({
      by: ["productId"],
      where: {
        retailerId: retailerId,
        isActive: true,
      },
      _sum: {
        totalStock: true,
        availableStock: true,
        allocatedStock: true,
      },
    });

    // Get product and company details
    const companyInventory = await Promise.all(
      inventoryByCompany.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: {
            company: true,
          },
        });
        return {
          product,
          totalStock: item._sum.totalStock,
          availableStock: item._sum.availableStock,
          allocatedStock: item._sum.allocatedStock,
        };
      })
    );

    // Group by company
    const companySummary = {};
    companyInventory.forEach((item) => {
      const companyName = item.product.company.name;
      if (!companySummary[companyName]) {
        companySummary[companyName] = {
          company: item.product.company,
          totalStock: 0,
          availableStock: 0,
          allocatedStock: 0,
          productCount: 0,
        };
      }
      companySummary[companyName].totalStock += item.totalStock;
      companySummary[companyName].availableStock += item.availableStock;
      companySummary[companyName].allocatedStock += item.allocatedStock;
      companySummary[companyName].productCount += 1;
    });

    // Stock aging analysis
    const stockAging = await prisma.retailerInventory.findMany({
      where: {
        retailerId: retailerId,
        currentStock: {
          gt: 0,
        },
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
      },
      orderBy: {
        lastPurchaseDate: "asc",
      },
    });

    // Low stock alerts
    const lowStockAlerts = await prisma.retailerProduct.findMany({
      where: {
        retailerId: retailerId,
        isActive: true,
        availableStock: {
          lte: prisma.retailerProduct.fields.reorderLevel,
        },
      },
      include: {
        product: {
          include: {
            company: true,
          },
        },
      },
      orderBy: {
        availableStock: "asc",
      },
    });

    res.json({
      inventoryByCompany: Object.values(companySummary),
      stockAging: stockAging.map((item) => ({
        product: item.retailerProduct.product,
        currentStock: item.currentStock,
        lastPurchaseDate: item.lastPurchaseDate,
        supplier: item.supplier,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
      })),
      lowStockAlerts: lowStockAlerts.map((item) => ({
        product: item.product,
        availableStock: item.availableStock,
        reorderLevel: item.reorderLevel,
        wholesalePrice: item.wholesalePrice,
      })),
    });
  } catch (error) {
    console.error("Inventory analytics error:", error);
    res.status(500).json({ error: "Failed to fetch inventory analytics" });
  }
};

// Get shop performance analytics
exports.getShopPerformance = async (req, res) => {
  try {
    const retailerId = req.retailer.id;
    const { period = "month" } = req.query;

    const now = new Date();
    let dateFilter = {};

    switch (period) {
      case "week":
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        dateFilter = {
          distributionDate: {
            gte: weekStart,
          },
        };
        break;
      case "month":
        dateFilter = {
          distributionDate: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
          },
        };
        break;
      case "quarter":
        const quarterStart = new Date(
          now.getFullYear(),
          Math.floor(now.getMonth() / 3) * 3,
          1
        );
        dateFilter = {
          distributionDate: {
            gte: quarterStart,
          },
        };
        break;
      case "year":
        dateFilter = {
          distributionDate: {
            gte: new Date(now.getFullYear(), 0, 1),
          },
        };
        break;
    }

    const shopPerformance = await prisma.shopDistribution.groupBy({
      by: ["retailerShopId"],
      where: {
        retailerId: retailerId,
        deliveryStatus: "DELIVERED",
        ...dateFilter,
      },
      _sum: {
        quantity: true,
        totalAmount: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          totalAmount: "desc",
        },
      },
    });

    // Get detailed shop information
    const detailedPerformance = await Promise.all(
      shopPerformance.map(async (item) => {
        const retailerShop = await prisma.retailerShop.findUnique({
          where: { id: item.retailerShopId },
          include: {
            shop: true,
          },
        });

        // Get payment status for this shop
        const paymentStats = await prisma.shopDistribution.aggregate({
          where: {
            retailerId: retailerId,
            retailerShopId: item.retailerShopId,
            ...dateFilter,
          },
          _sum: {
            totalAmount: true,
          },
          _count: {
            id: true,
          },
        });

        const paidAmount = await prisma.shopDistribution.aggregate({
          where: {
            retailerId: retailerId,
            retailerShopId: item.retailerShopId,
            paymentStatus: "PAID",
            ...dateFilter,
          },
          _sum: {
            totalAmount: true,
          },
        });

        return {
          shop: retailerShop?.shop,
          partnershipType: retailerShop?.partnershipType,
          performance: {
            totalRevenue: item._sum.totalAmount,
            totalQuantity: item._sum.quantity,
            orderCount: item._count.id,
            averageOrderValue: item._sum.totalAmount / item._count.id,
          },
          payments: {
            totalAmount: paymentStats._sum.totalAmount || 0,
            paidAmount: paidAmount._sum.totalAmount || 0,
            pendingAmount:
              (paymentStats._sum.totalAmount || 0) -
              (paidAmount._sum.totalAmount || 0),
            paymentRate: paymentStats._sum.totalAmount
              ? ((paidAmount._sum.totalAmount || 0) /
                  paymentStats._sum.totalAmount) *
                100
              : 0,
          },
        };
      })
    );

    res.json({
      period,
      shopPerformance: detailedPerformance,
    });
  } catch (error) {
    console.error("Shop performance error:", error);
    res.status(500).json({ error: "Failed to fetch shop performance data" });
  }
};
