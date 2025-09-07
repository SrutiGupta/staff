const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = new PrismaClient();

// Shop Admin Authentication
async function loginShopAdmin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find shop admin with shop details
    const shopAdmin = await prisma.shopAdmin.findUnique({
      where: { email },
      include: {
        shop: true,
      },
    });

    if (!shopAdmin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, shopAdmin.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if shop admin is active
    if (!shopAdmin.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        shopAdminId: shopAdmin.id,
        shopId: shopAdmin.shopId,
        role: shopAdmin.role,
        email: shopAdmin.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Update last login
    await prisma.shopAdmin.update({
      where: { id: shopAdmin.id },
      data: { lastLogin: new Date() },
    });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        shopAdmin: {
          id: shopAdmin.id,
          name: shopAdmin.name,
          email: shopAdmin.email,
          role: shopAdmin.role,
          shop: shopAdmin.shop,
        },
      },
    });
  } catch (error) {
    console.error("Shop admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// Dashboard - Business Overview
async function getDashboard(req, res) {
  try {
    const { shopId } = req.shopAdmin;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Get today's summary
    const todaySummary = await prisma.dailySummary.findFirst({
      where: {
        shopId: shopId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Get real-time data for today
    const todayInvoices = await prisma.invoice.findMany({
      where: {
        staff: {
          shopId: shopId,
        },
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        staff: true,
        patient: true,
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Calculate real-time metrics
    const todayRevenue = todayInvoices.reduce(
      (sum, invoice) => sum + parseFloat(invoice.totalAmount),
      0
    );
    const todayOrders = todayInvoices.length;
    const uniqueCustomers = new Set([
      ...todayInvoices.map((inv) => inv.patientId).filter(Boolean),
      ...todayInvoices.map((inv) => inv.customerId).filter(Boolean),
    ]).size;

    // Get active staff count
    const activeStaff = await prisma.staff.count({
      where: {
        shopId: shopId,
        isActive: true,
      },
    });

    // Get low stock alerts
    const lowStockItems = await prisma.shopInventory.findMany({
      where: {
        shopId: shopId,
        currentStock: {
          lte: prisma.shopInventory.fields.minStockLevel,
        },
      },
      include: {
        product: true,
      },
      take: 10,
    });

    // Get recent activities (last 10 audit logs)
    const recentActivities = await prisma.auditLog.findMany({
      where: {
        staff: {
          shopId: shopId,
        },
      },
      include: {
        staff: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    // Get top selling products today
    const productSales = {};
    todayInvoices.forEach((invoice) => {
      invoice.items.forEach((item) => {
        const productId = item.productId;
        if (!productSales[productId]) {
          productSales[productId] = {
            product: item.product,
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[productId].quantity += item.quantity;
        productSales[productId].revenue += parseFloat(item.totalPrice);
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        metrics: {
          todayRevenue,
          todayOrders,
          uniqueCustomers,
          activeStaff,
        },
        summary: todaySummary,
        lowStockAlerts: lowStockItems,
        recentActivities,
        topProducts,
        salesTrend: todayInvoices.map((invoice) => ({
          time: invoice.createdAt,
          amount: parseFloat(invoice.totalAmount),
          staff: invoice.staff.name,
        })),
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
    });
  }
}

// Staff Management - Get all staff
async function getStaff(req, res) {
  try {
    const { shopId } = req.shopAdmin;

    const staff = await prisma.staff.findMany({
      where: {
        shopId: shopId,
      },
      include: {
        _count: {
          select: {
            invoices: true,
            patientVisits: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error("Get staff error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch staff",
    });
  }
}

// Staff Performance Report
async function getStaffPerformance(req, res) {
  try {
    const { shopId } = req.shopAdmin;
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    const end = endDate ? new Date(endDate) : new Date();

    const staffPerformance = await prisma.staff.findMany({
      where: {
        shopId: shopId,
      },
      include: {
        invoices: {
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
          include: {
            items: true,
          },
        },
        patientVisits: {
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        },
        auditLogs: {
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        },
      },
    });

    const performance = staffPerformance.map((staff) => {
      const totalRevenue = staff.invoices.reduce(
        (sum, invoice) => sum + parseFloat(invoice.totalAmount),
        0
      );
      const totalOrders = staff.invoices.length;
      const totalItems = staff.invoices.reduce(
        (sum, invoice) =>
          sum +
          invoice.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
        0
      );
      const totalVisits = staff.patientVisits.length;
      const totalActivities = staff.auditLogs.length;

      return {
        staffId: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        metrics: {
          totalRevenue,
          totalOrders,
          totalItems,
          totalVisits,
          totalActivities,
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        },
        isActive: staff.isActive,
      };
    });

    res.json({
      success: true,
      data: {
        period: { start, end },
        performance: performance.sort(
          (a, b) => b.metrics.totalRevenue - a.metrics.totalRevenue
        ),
      },
    });
  } catch (error) {
    console.error("Staff performance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch staff performance",
    });
  }
}

// Inventory Management
async function getInventory(req, res) {
  try {
    const { shopId } = req.shopAdmin;
    const { category, lowStock } = req.query;

    let whereClause = { shopId };

    if (lowStock === "true") {
      whereClause.currentStock = {
        lte: prisma.shopInventory.fields.minStockLevel,
      };
    }

    const inventory = await prisma.shopInventory.findMany({
      where: whereClause,
      include: {
        product: true,
        stockMovements: {
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
          include: {
            staff: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Filter by category if provided
    let filteredInventory = inventory;
    if (category) {
      filteredInventory = inventory.filter((item) =>
        item.product.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    res.json({
      success: true,
      data: filteredInventory,
    });
  } catch (error) {
    console.error("Get inventory error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch inventory",
    });
  }
}

// Update inventory stock
async function updateInventoryStock(req, res) {
  try {
    const { shopId, shopAdminId } = req.shopAdmin;
    const { productId, quantity, type, reason } = req.body;

    if (!productId || !quantity || !type) {
      return res.status(400).json({
        success: false,
        message: "Product ID, quantity, and type are required",
      });
    }

    // Get current inventory
    const currentInventory = await prisma.shopInventory.findUnique({
      where: {
        shopId_productId: {
          shopId,
          productId,
        },
      },
    });

    if (!currentInventory) {
      return res.status(404).json({
        success: false,
        message: "Product not found in inventory",
      });
    }

    let newStock;
    if (type === "ADD") {
      newStock = currentInventory.currentStock + quantity;
    } else if (type === "REMOVE") {
      newStock = Math.max(0, currentInventory.currentStock - quantity);
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid type. Use ADD or REMOVE",
      });
    }

    // Update inventory
    const updatedInventory = await prisma.$transaction(async (prisma) => {
      // Update stock
      const updated = await prisma.shopInventory.update({
        where: {
          shopId_productId: {
            shopId,
            productId,
          },
        },
        data: {
          currentStock: newStock,
          lastRestocked:
            type === "ADD" ? new Date() : currentInventory.lastRestocked,
        },
        include: {
          product: true,
        },
      });

      // Record stock movement
      await prisma.stockMovement.create({
        data: {
          shopInventoryId: updated.id,
          type,
          quantity,
          previousStock: currentInventory.currentStock,
          newStock,
          reason: reason || `Stock ${type.toLowerCase()}ed by admin`,
          staffId: shopAdminId, // Admin is performing this action
        },
      });

      return updated;
    });

    res.json({
      success: true,
      message: "Inventory updated successfully",
      data: updatedInventory,
    });
  } catch (error) {
    console.error("Update inventory error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update inventory",
    });
  }
}

// Business Reports
async function getBusinessReport(req, res) {
  try {
    const { shopId } = req.shopAdmin;
    const { startDate, endDate, reportType } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    let reportData = {};

    if (reportType === "sales" || !reportType) {
      // Sales Report
      const invoices = await prisma.invoice.findMany({
        where: {
          staff: {
            shopId: shopId,
          },
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        include: {
          staff: true,
          patient: true,
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      const totalRevenue = invoices.reduce(
        (sum, inv) => sum + parseFloat(inv.totalAmount),
        0
      );
      const totalOrders = invoices.length;
      const averageOrderValue =
        totalOrders > 0 ? totalRevenue / totalOrders : 0;

      reportData.sales = {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        invoices: invoices.slice(0, 100), // Limit to recent 100
      };
    }

    if (reportType === "inventory" || !reportType) {
      // Inventory Report
      const stockMovements = await prisma.stockMovement.findMany({
        where: {
          shopInventory: {
            shopId: shopId,
          },
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        include: {
          shopInventory: {
            include: {
              product: true,
            },
          },
          staff: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      reportData.inventory = {
        movements: stockMovements,
        summary: {
          totalMovements: stockMovements.length,
          stockAdded: stockMovements
            .filter((m) => m.type === "ADD")
            .reduce((sum, m) => sum + m.quantity, 0),
          stockRemoved: stockMovements
            .filter((m) => m.type === "REMOVE")
            .reduce((sum, m) => sum + m.quantity, 0),
        },
      };
    }

    res.json({
      success: true,
      data: {
        period: { start, end },
        reportType: reportType || "all",
        ...reportData,
      },
    });
  } catch (error) {
    console.error("Business report error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate report",
    });
  }
}

// Audit Logs
async function getAuditLogs(req, res) {
  try {
    const { shopId } = req.shopAdmin;
    const {
      staffId,
      action,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    let whereClause = {
      staff: {
        shopId: shopId,
      },
    };

    if (staffId) {
      whereClause.staffId = staffId;
    }

    if (action) {
      whereClause.action = action;
    }

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: whereClause,
      include: {
        staff: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: parseInt(limit),
    });

    const totalCount = await prisma.auditLog.count({
      where: whereClause,
    });

    res.json({
      success: true,
      data: {
        logs: auditLogs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    console.error("Audit logs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs",
    });
  }
}

module.exports = {
  loginShopAdmin,
  getDashboard,
  getStaff,
  getStaffPerformance,
  getInventory,
  updateInventoryStock,
  getBusinessReport,
  getAuditLogs,
};
