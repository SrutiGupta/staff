const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const shopAdminService = require("../services/shopAdminServices");

const prisma = new PrismaClient();

// ===== AUTHENTICATION =====

/**
 * Shop Admin Login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find shop admin
    const shopAdmin = await prisma.shopAdmin.findUnique({
      where: { email },
      include: {
        shop: {
          include: {
            staff: true,
          },
        },
      },
    });

    if (!shopAdmin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, shopAdmin.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { shopAdminId: shopAdmin.id },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      shopAdmin: {
        id: shopAdmin.id,
        name: shopAdmin.name,
        email: shopAdmin.email,
        shop: {
          id: shopAdmin.shop.id,
          name: shopAdmin.shop.name,
          address: shopAdmin.shop.address,
          phone: shopAdmin.shop.phone,
        },
      },
    });
  } catch (error) {
    console.error("Shop Admin Login Error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

/**
 * Create Shop Admin Account
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, shop } = req.body;

    if (!name || !email || !password || !shop) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if shop admin already exists
    const existingAdmin = await prisma.shopAdmin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      return res.status(400).json({ message: "Shop Admin already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create shop and shop admin in transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create shop
      const newShop = await prisma.shop.create({
        data: {
          name: shop.name,
          address: shop.address,
          phone: shop.phone,
          email: shop.email,
        },
      });

      // Create shop admin
      const newShopAdmin = await prisma.shopAdmin.create({
        data: {
          name,
          email,
          password: hashedPassword,
          shopId: newShop.id,
        },
        include: {
          shop: true,
        },
      });

      return newShopAdmin;
    });

    // Generate JWT token
    const token = jwt.sign({ shopAdminId: result.id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(201).json({
      token,
      shopAdmin: {
        id: result.id,
        name: result.name,
        email: result.email,
        shop: result.shop,
      },
    });
  } catch (error) {
    console.error("Shop Admin Registration Error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
};

// ===== DASHBOARD =====

/**
 * Get Dashboard Overview Metrics
 */
exports.getDashboardMetrics = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const metrics = await shopAdminService.getDashboardMetrics(shopId);
    res.json(metrics);
  } catch (error) {
    console.error("Dashboard Metrics Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Business Growth Data
 */
exports.getDashboardGrowth = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { period = "monthly" } = req.query;
    const growthData = await shopAdminService.getDashboardGrowth(
      shopId,
      period
    );
    res.json(growthData);
  } catch (error) {
    console.error("Dashboard Growth Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Recent Activities
 */
exports.getRecentActivities = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const activities = await shopAdminService.getRecentActivities(shopId);
    res.json(activities);
  } catch (error) {
    console.error("Recent Activities Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ===== AUDIT REPORTS =====

/**
 * Get Staff Attendance Report
 */
exports.getStaffAttendanceReport = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { startDate, endDate, staffId } = req.query;
    const report = await shopAdminService.getStaffAttendanceReport(shopId, {
      startDate,
      endDate,
      staffId,
    });
    res.json(report);
  } catch (error) {
    console.error("Staff Attendance Report Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Staff Performance Report
 */
exports.getStaffPerformanceReport = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { startDate, endDate } = req.query;
    const report = await shopAdminService.getStaffPerformanceReport(shopId, {
      startDate,
      endDate,
    });
    res.json(report);
  } catch (error) {
    console.error("Staff Performance Report Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ===== SALES REPORTS =====

/**
 * Get Sales Summary Report
 */
exports.getSalesReport = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { period = "daily", startDate, endDate } = req.query;
    const report = await shopAdminService.getSalesReport(shopId, {
      period,
      startDate,
      endDate,
    });
    res.json(report);
  } catch (error) {
    console.error("Sales Report Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Product-wise Sales Breakdown
 */
exports.getProductSalesReport = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { startDate, endDate, productId } = req.query;
    const report = await shopAdminService.getProductSalesReport(shopId, {
      startDate,
      endDate,
      productId,
    });
    res.json(report);
  } catch (error) {
    console.error("Product Sales Report Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Sales by Staff Report
 */
exports.getSalesByStaffReport = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { startDate, endDate } = req.query;
    const report = await shopAdminService.getSalesByStaffReport(shopId, {
      startDate,
      endDate,
    });
    res.json(report);
  } catch (error) {
    console.error("Sales by Staff Report Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ===== INVENTORY REPORTS =====

/**
 * Get Inventory History Report
 */
exports.getInventoryReport = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { type, startDate, endDate } = req.query; // type: 'stock_in', 'stock_out', 'all'
    const report = await shopAdminService.getInventoryReport(shopId, {
      type,
      startDate,
      endDate,
    });
    res.json(report);
  } catch (error) {
    console.error("Inventory Report Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Stock Status Report
 */
exports.getStockStatusReport = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const report = await shopAdminService.getStockStatusReport(shopId);
    res.json(report);
  } catch (error) {
    console.error("Stock Status Report Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Low Stock Alerts
 */
exports.getLowStockAlerts = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const alerts = await shopAdminService.getLowStockAlerts(shopId);
    res.json(alerts);
  } catch (error) {
    console.error("Low Stock Alerts Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ===== PATIENT REPORTS =====

/**
 * Get Patient Report
 */
exports.getPatientReport = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { type = "active", startDate, endDate } = req.query; // type: 'active', 'new', 'all'
    const report = await shopAdminService.getPatientReport(shopId, {
      type,
      startDate,
      endDate,
    });
    res.json(report);
  } catch (error) {
    console.error("Patient Report Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Patient Visit History
 */
exports.getPatientVisitHistory = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { patientId, startDate, endDate } = req.query;
    const history = await shopAdminService.getPatientVisitHistory(shopId, {
      patientId,
      startDate,
      endDate,
    });
    res.json(history);
  } catch (error) {
    console.error("Patient Visit History Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ===== STAFF MANAGEMENT =====

/**
 * Get All Staff Under Shop
 */
exports.getAllStaff = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const staff = await shopAdminService.getAllStaff(shopId);
    res.json(staff);
  } catch (error) {
    console.error("Get All Staff Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Staff Details
 */
exports.getStaffDetails = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { staffId } = req.params;
    const staffDetails = await shopAdminService.getStaffDetails(
      shopId,
      parseInt(staffId)
    );
    res.json(staffDetails);
  } catch (error) {
    console.error("Get Staff Details Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Monitor Staff Activities
 */
exports.getStaffActivities = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { staffId, startDate, endDate } = req.query;
    const activities = await shopAdminService.getStaffActivities(shopId, {
      staffId,
      startDate,
      endDate,
    });
    res.json(activities);
  } catch (error) {
    console.error("Staff Activities Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ===== INVENTORY MANAGEMENT =====

/**
 * Stock In - Products from Retailer
 */
exports.stockIn = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { productId, quantity, notes } = req.body;

    if (!productId || !quantity) {
      return res
        .status(400)
        .json({ message: "Product ID and quantity are required" });
    }

    const inventory = await shopAdminService.stockIn(shopId, {
      productId: parseInt(productId),
      quantity: parseInt(quantity),
      notes,
      adminId: req.user.shopAdminId,
    });

    res.json(inventory);
  } catch (error) {
    console.error("Stock In Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Manual Stock Adjustment
 */
exports.adjustStock = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { productId, newQuantity, reason } = req.body;

    if (!productId || newQuantity === undefined) {
      return res
        .status(400)
        .json({ message: "Product ID and new quantity are required" });
    }

    const inventory = await shopAdminService.adjustStock(shopId, {
      productId: parseInt(productId),
      newQuantity: parseInt(newQuantity),
      reason,
      adminId: req.user.shopAdminId,
    });

    res.json(inventory);
  } catch (error) {
    console.error("Stock Adjustment Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Current Inventory Status
 */
exports.getInventoryStatus = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const inventory = await shopAdminService.getInventoryStatus(shopId);
    res.json(inventory);
  } catch (error) {
    console.error("Get Inventory Status Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ===== EXPORT FUNCTIONS =====

/**
 * Export Report as PDF
 */
exports.exportReportPDF = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { reportType, ...params } = req.query;

    const pdfBuffer = await shopAdminService.exportReportPDF(
      shopId,
      reportType,
      params
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${reportType}-report.pdf`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Export PDF Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Export Report as Excel
 */
exports.exportReportExcel = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { reportType, ...params } = req.query;

    const excelBuffer = await shopAdminService.exportReportExcel(
      shopId,
      reportType,
      params
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${reportType}-report.xlsx`
    );
    res.send(excelBuffer);
  } catch (error) {
    console.error("Export Excel Error:", error);
    res.status(500).json({ message: error.message });
  }
};
