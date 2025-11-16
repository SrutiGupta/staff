const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const shopAdminService = require("../services/shopAdminServices");
const cacheService = require("../services/cacheService");
const { clearAdminCache } = require("../middleware/shopAdminAuth");

const prisma = new PrismaClient();

// Custom error classes for better error handling
class ShopAdminError extends Error {
  constructor(message, code, statusCode = 500) {
    super(message);
    this.name = "ShopAdminError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

class ValidationError extends ShopAdminError {
  constructor(message, field = null) {
    super(message, "VALIDATION_ERROR", 400);
    this.field = field;
  }
}

class AuthenticationError extends ShopAdminError {
  constructor(message) {
    super(message, "AUTHENTICATION_ERROR", 401);
  }
}

class AuthorizationError extends ShopAdminError {
  constructor(message) {
    super(message, "AUTHORIZATION_ERROR", 403);
  }
}

class NotFoundError extends ShopAdminError {
  constructor(resource) {
    super(`${resource} not found`, "NOT_FOUND", 404);
  }
}

// ===== AUTHENTICATION =====

/**
 * Shop Admin Login with enhanced security
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate JWT secret
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured!");
      throw new ShopAdminError(
        "Server configuration error",
        "SERVER_CONFIG_ERROR",
        500
      );
    }

    // Find shop admin with minimal data
    const shopAdmin = await prisma.shopAdmin.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        shopId: true,
        shop: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            lowStockThreshold: true,
          },
        },
      },
    });

    if (!shopAdmin) {
      throw new AuthenticationError("Invalid email or password");
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, shopAdmin.password);
    if (!validPassword) {
      throw new AuthenticationError("Invalid email or password");
    }

    // Generate JWT token with expiration
    const tokenPayload = {
      shopAdminId: shopAdmin.id,
      shopId: shopAdmin.shopId,
      iat: Math.floor(Date.now() / 1000),
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "24h",
      issuer: "optical-shop-admin",
      audience: "shop-admin",
    });

    // Log successful login
    await prisma.auditLog
      .create({
        data: {
          adminId: shopAdmin.id,
          action: "LOGIN",
          targetType: "AUTHENTICATION",
          targetId: shopAdmin.id.toString(),
          details: `Successful login from IP: ${req.ip || "unknown"}`,
          ipAddress: req.ip || "unknown",
          userAgent: req.get("User-Agent") || "unknown",
        },
      })
      .catch((err) => {
        console.warn("Failed to log audit trail:", err);
      });

    // Clear any existing cached admin data to refresh
    clearAdminCache(shopAdmin.id);

    res.json({
      token,
      expiresIn: "24h",
      shopAdmin: {
        id: shopAdmin.id,
        name: shopAdmin.name,
        email: shopAdmin.email,
        shop: shopAdmin.shop,
      },
    });
  } catch (error) {
    console.error("Shop Admin Login Error:", error);

    if (error instanceof ShopAdminError) {
      return res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
      });
    }

    res.status(500).json({
      error: "LOGIN_FAILED",
      message: "Login failed. Please try again.",
    });
  }
};

/**
 * Create Shop Admin Account with enhanced validation
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, shop } = req.body;

    // Validate JWT secret
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured!");
      throw new ShopAdminError(
        "Server configuration error",
        "SERVER_CONFIG_ERROR",
        500
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if shop admin already exists
    const existingAdmin = await prisma.shopAdmin.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingAdmin) {
      throw new ValidationError(
        "An account with this email already exists",
        "email"
      );
    }

    // Check if shop email already exists
    const existingShop = await prisma.shop.findFirst({
      where: { email: shop.email.toLowerCase().trim() },
    });

    if (existingShop) {
      throw new ValidationError(
        "A shop with this email already exists",
        "shop.email"
      );
    }

    // Hash password with stronger salt rounds
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create shop and shop admin in transaction with error handling
    const result = await prisma.$transaction(async (prisma) => {
      try {
        // Create shop
        const newShop = await prisma.shop.create({
          data: {
            name: shop.name.trim(),
            address: shop.address.trim(),
            phone: shop.phone.trim(),
            email: shop.email.toLowerCase().trim(),
            lowStockThreshold: 10, // Default threshold
            currency: "INR",
            timezone: "Asia/Nabadwip",
          },
        });

        // Create shop admin
        const newShopAdmin = await prisma.shopAdmin.create({
          data: {
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            shopId: newShop.id,
            role: "SHOP_OWNER", // Since only one admin per shop
          },
          include: {
            shop: {
              select: {
                id: true,
                name: true,
                address: true,
                phone: true,
                email: true,
                lowStockThreshold: true,
              },
            },
          },
        });

        // Log registration
        await prisma.auditLog
          .create({
            data: {
              adminId: newShopAdmin.id,
              action: "REGISTER",
              targetType: "SHOP_ADMIN",
              targetId: newShopAdmin.id.toString(),
              details: `Shop admin registered: ${newShopAdmin.name} for shop: ${newShop.name}`,
              metadata: {
                shopId: newShop.id,
                ip: req.ip || "unknown",
                userAgent: req.get("User-Agent") || "unknown",
              },
            },
          })
          .catch((err) => {
            console.warn("Failed to log registration audit:", err);
          });

        return newShopAdmin;
      } catch (error) {
        if (error.code === "P2002") {
          // Unique constraint violation
          const field = error.meta?.target?.includes("email")
            ? "email"
            : "unknown";
          throw new ValidationError(
            `An account with this ${field} already exists`,
            field
          );
        }
        throw error;
      }
    });

    // Generate JWT token
    const tokenPayload = {
      shopAdminId: result.id,
      shopId: result.shopId,
      iat: Math.floor(Date.now() / 1000),
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "24h",
      issuer: "optical-shop-admin",
      audience: "shop-admin",
    });

    res.status(201).json({
      token,
      expiresIn: "24h",
      shopAdmin: {
        id: result.id,
        name: result.name,
        email: result.email,
        shop: result.shop,
      },
      message: "Shop admin account created successfully",
    });
  } catch (error) {
    console.error("Shop Admin Registration Error:", error);

    if (error instanceof ShopAdminError) {
      return res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
        field: error.field || null,
      });
    }

    if (error.code === "P2002") {
      return res.status(400).json({
        error: "DUPLICATE_ENTRY",
        message: "An account with this information already exists",
      });
    }

    res.status(500).json({
      error: "REGISTRATION_FAILED",
      message: "Registration failed. Please try again.",
    });
  }
};

// ===== DASHBOARD =====

/**
 * Get Dashboard Overview Metrics with caching and error handling
 */
exports.getDashboardMetrics = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const cacheKey = `dashboard_metrics:${shopId}`;

    // Try cache first (5 minute cache)
    const cachedMetrics = await cacheService.get(cacheKey);
    if (cachedMetrics) {
      return res.json({
        ...cachedMetrics,
        cached: true,
        lastUpdated: cachedMetrics.lastUpdated,
      });
    }

    const metrics = await shopAdminService.getDashboardMetrics(shopId);

    // Add timestamp and cache
    const enrichedMetrics = {
      ...metrics,
      lastUpdated: new Date().toISOString(),
      cached: false,
    };

    await cacheService.set(cacheKey, enrichedMetrics, 300); // 5 minutes

    res.json(enrichedMetrics);
  } catch (error) {
    console.error("Dashboard Metrics Error:", error);

    if (error instanceof ShopAdminError) {
      return res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
      });
    }

    res.status(500).json({
      error: "DASHBOARD_METRICS_ERROR",
      message: "Failed to load dashboard metrics",
    });
  }
};

/**
 * Get Business Growth Data with validation and caching
 */
exports.getDashboardGrowth = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { period = "monthly" } = req.query;

    // Validate period parameter
    const validPeriods = ["daily", "weekly", "monthly", "yearly"];
    if (!validPeriods.includes(period)) {
      throw new ValidationError(
        "Invalid period. Must be one of: " + validPeriods.join(", "),
        "period"
      );
    }

    const cacheKey = `dashboard_growth:${shopId}:${period}`;

    // Try cache first (10 minute cache for growth data)
    const cachedGrowth = await cacheService.get(cacheKey);
    if (cachedGrowth) {
      return res.json({
        ...cachedGrowth,
        cached: true,
      });
    }

    const growthData = await shopAdminService.getDashboardGrowth(
      shopId,
      period
    );

    // Add metadata
    const enrichedGrowthData = {
      ...growthData,
      period,
      lastUpdated: new Date().toISOString(),
      cached: false,
    };

    await cacheService.set(cacheKey, enrichedGrowthData, 600); // 10 minutes

    res.json(enrichedGrowthData);
  } catch (error) {
    console.error("Dashboard Growth Error:", error);

    if (error instanceof ShopAdminError) {
      return res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
        field: error.field || null,
      });
    }

    res.status(500).json({
      error: "DASHBOARD_GROWTH_ERROR",
      message: "Failed to load growth data",
    });
  }
};

/**
 * Get Recent Activities with pagination and filtering
 */
exports.getRecentActivities = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { page = 1, limit = 20, type = "all", days = 7 } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(Math.max(1, parseInt(limit)), 100); // Max 100 items
    const daysNum = Math.min(Math.max(1, parseInt(days)), 30); // Max 30 days

    const cacheKey = `recent_activities:${shopId}:${pageNum}:${limitNum}:${type}:${daysNum}`;

    // Try cache first (2 minute cache for activities)
    const cachedActivities = await cacheService.get(cacheKey);
    if (cachedActivities) {
      return res.json({
        ...cachedActivities,
        cached: true,
      });
    }

    const activities = await shopAdminService.getRecentActivities(shopId, {
      page: pageNum,
      limit: limitNum,
      type,
      days: daysNum,
    });

    // Add pagination metadata
    const enrichedActivities = {
      ...activities,
      pagination: {
        page: pageNum,
        limit: limitNum,
        hasMore: activities.data?.length === limitNum,
      },
      filters: {
        type,
        days: daysNum,
      },
      lastUpdated: new Date().toISOString(),
      cached: false,
    };

    await cacheService.set(cacheKey, enrichedActivities, 120); // 2 minutes

    res.json(enrichedActivities);
  } catch (error) {
    console.error("Recent Activities Error:", error);

    if (error instanceof ShopAdminError) {
      return res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
      });
    }

    res.status(500).json({
      error: "RECENT_ACTIVITIES_ERROR",
      message: "Failed to load recent activities",
    });
  }
};

// ===== AUDIT REPORTS =====

/**
 * Get Staff Attendance Report with validation and export options
 */
exports.getStaffAttendanceReport = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const {
      startDate,
      endDate,
      staffId,
      format = "json",
      page = 1,
      limit = 50,
    } = req.query;

    // Validate date range
    if (!startDate || !endDate) {
      throw new ValidationError(
        "Start date and end date are required",
        "dateRange"
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ValidationError(
        "Invalid date format. Use YYYY-MM-DD",
        "dateFormat"
      );
    }

    if (start > end) {
      throw new ValidationError(
        "Start date must be before end date",
        "dateRange"
      );
    }

    // Limit date range to 90 days max
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (daysDiff > 90) {
      throw new ValidationError(
        "Date range cannot exceed 90 days",
        "dateRange"
      );
    }

    // Validate format
    const validFormats = ["json", "csv", "pdf"];
    if (!validFormats.includes(format)) {
      throw new ValidationError(
        "Invalid format. Must be one of: " + validFormats.join(", "),
        "format"
      );
    }

    // Validate staff ID if provided
    if (staffId && isNaN(parseInt(staffId))) {
      throw new ValidationError("Invalid staff ID", "staffId");
    }

    const reportOptions = {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      staffId: staffId ? parseInt(staffId) : null,
      page: Math.max(1, parseInt(page)),
      limit: Math.min(Math.max(1, parseInt(limit)), 200), // Max 200 records
      format,
    };

    const report = await shopAdminService.getStaffAttendanceReport(
      shopId,
      reportOptions
    );

    // Set appropriate headers for different formats
    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="attendance-report-${startDate}-to-${endDate}.csv"`
      );
    } else if (format === "pdf") {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="attendance-report-${startDate}-to-${endDate}.pdf"`
      );
    }

    res.json(report);
  } catch (error) {
    console.error("Staff Attendance Report Error:", error);

    if (error instanceof ShopAdminError) {
      return res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
        field: error.field || null,
      });
    }

    res.status(500).json({
      error: "ATTENDANCE_REPORT_ERROR",
      message: "Failed to generate attendance report",
    });
  }
};

/**
 * Get Staff Performance Report with enhanced metrics
 */
exports.getStaffPerformanceReport = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const {
      startDate,
      endDate,
      staffId,
      metric = "all",
      format = "json",
    } = req.query;

    // Validate date range
    if (!startDate || !endDate) {
      throw new ValidationError(
        "Start date and end date are required",
        "dateRange"
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ValidationError(
        "Invalid date format. Use YYYY-MM-DD",
        "dateFormat"
      );
    }

    if (start > end) {
      throw new ValidationError(
        "Start date must be before end date",
        "dateRange"
      );
    }

    // Validate metric type
    const validMetrics = ["all", "sales", "attendance", "efficiency"];
    if (!validMetrics.includes(metric)) {
      throw new ValidationError(
        "Invalid metric. Must be one of: " + validMetrics.join(", "),
        "metric"
      );
    }

    const reportOptions = {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      staffId: staffId ? parseInt(staffId) : null,
      metric,
      format,
    };

    const report = await shopAdminService.getStaffPerformanceReport(
      shopId,
      reportOptions
    );

    // Add metadata
    const enrichedReport = {
      ...report,
      reportPeriod: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        days: Math.ceil((end - start) / (1000 * 60 * 60 * 24)),
      },
      generatedAt: new Date().toISOString(),
      metric,
    };

    res.json(enrichedReport);
  } catch (error) {
    console.error("Staff Performance Report Error:", error);

    if (error instanceof ShopAdminError) {
      return res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
        field: error.field || null,
      });
    }

    res.status(500).json({
      error: "PERFORMANCE_REPORT_ERROR",
      message: "Failed to generate performance report",
    });
  }
};

// ===== SALES REPORTS =====

/**
 * Get Sales Summary Report with advanced filtering and analytics
 */
exports.getSalesReport = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const {
      period = "daily",
      startDate,
      endDate,
      category,
      staffId,
      format = "json",
      includeItems = false,
    } = req.query;

    // Validate period
    const validPeriods = ["daily", "weekly", "monthly", "yearly"];
    if (!validPeriods.includes(period)) {
      throw new ValidationError(
        "Invalid period. Must be one of: " + validPeriods.join(", "),
        "period"
      );
    }

    // Validate date range if provided
    let start, end;
    if (startDate || endDate) {
      if (!startDate || !endDate) {
        throw new ValidationError(
          "Both start date and end date are required when filtering by date",
          "dateRange"
        );
      }

      start = new Date(startDate);
      end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new ValidationError(
          "Invalid date format. Use YYYY-MM-DD",
          "dateFormat"
        );
      }

      if (start > end) {
        throw new ValidationError(
          "Start date must be before end date",
          "dateRange"
        );
      }
    }

    const reportOptions = {
      period,
      startDate: start?.toISOString(),
      endDate: end?.toISOString(),
      category: category || null,
      staffId: staffId ? parseInt(staffId) : null,
      format,
      includeItems: includeItems === "true",
    };

    const cacheKey = `sales_report:${shopId}:${JSON.stringify(reportOptions)}`;

    // Try cache first for complex reports (cache for 15 minutes)
    const cachedReport = await cacheService.get(cacheKey);
    if (cachedReport) {
      return res.json({
        ...cachedReport,
        cached: true,
      });
    }

    const report = await shopAdminService.getSalesReport(shopId, reportOptions);

    // Add analytics metadata
    const enrichedReport = {
      ...report,
      reportConfig: {
        period,
        dateRange:
          start && end
            ? {
                startDate: start.toISOString(),
                endDate: end.toISOString(),
                days: Math.ceil((end - start) / (1000 * 60 * 60 * 24)),
              }
            : null,
        filters: {
          category: category || "all",
          staffId: staffId || "all",
        },
      },
      generatedAt: new Date().toISOString(),
      cached: false,
    };

    // Cache complex reports
    await cacheService.set(cacheKey, enrichedReport, 900); // 15 minutes

    res.json(enrichedReport);
  } catch (error) {
    console.error("Sales Report Error:", error);

    if (error instanceof ShopAdminError) {
      return res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
        field: error.field || null,
      });
    }

    res.status(500).json({
      error: "SALES_REPORT_ERROR",
      message: "Failed to generate sales report",
    });
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
 * Stock In - Products from Retailer with validation and audit
 */
exports.stockIn = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { productId, quantity, notes, supplierId } = req.body;

    // Validate required fields
    if (!productId || !quantity) {
      throw new ValidationError(
        "Product ID and quantity are required",
        "productId,quantity"
      );
    }

    // Validate quantity
    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      throw new ValidationError(
        "Quantity must be a positive number",
        "quantity"
      );
    }

    if (quantityNum > 10000) {
      throw new ValidationError(
        "Quantity cannot exceed 10,000 per transaction",
        "quantity"
      );
    }

    // Validate product exists and belongs to shop
    const product = await prisma.product.findFirst({
      where: {
        id: parseInt(productId),
        shopId,
      },
    });

    if (!product) {
      throw new ValidationError(
        "Product not found or does not belong to this shop",
        "productId"
      );
    }

    const inventory = await shopAdminService.stockIn(shopId, {
      productId: parseInt(productId),
      quantity: quantityNum,
      notes: notes?.trim() || null,
      supplierId: supplierId ? parseInt(supplierId) : null,
      adminId: req.user.shopAdminId,
    });

    // Log the stock in activity
    await prisma.auditLog
      .create({
        data: {
          adminId: req.user.shopAdminId,
          action: "STOCK_IN",
          targetType: "PRODUCT",
          targetId: productId.toString(),
          details: `Stocked in ${quantityNum} units of ${product.name}`,
          metadata: {
            productId: parseInt(productId),
            quantity: quantityNum,
            previousStock: product.quantity,
            newStock: product.quantity + quantityNum,
            notes: notes || null,
          },
        },
      })
      .catch((err) => {
        console.warn("Failed to log stock in audit:", err);
      });

    res.json({
      ...inventory,
      message: `Successfully stocked in ${quantityNum} units`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Stock In Error:", error);

    if (error instanceof ShopAdminError) {
      return res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
        field: error.field || null,
      });
    }

    res.status(500).json({
      error: "STOCK_IN_ERROR",
      message: "Failed to process stock in operation",
    });
  }
};

/**
 * Manual Stock Adjustment with enhanced validation and audit trail
 */
exports.adjustStock = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const {
      productId,
      newQuantity,
      reason,
      adjustmentType = "manual",
    } = req.body;

    // Validate required fields
    if (!productId || newQuantity === undefined) {
      throw new ValidationError(
        "Product ID and new quantity are required",
        "productId,newQuantity"
      );
    }

    if (!reason || reason.trim().length < 10) {
      throw new ValidationError(
        "Adjustment reason must be at least 10 characters",
        "reason"
      );
    }

    // Validate quantity
    const newQtyNum = parseInt(newQuantity);
    if (isNaN(newQtyNum) || newQtyNum < 0) {
      throw new ValidationError(
        "New quantity must be a non-negative number",
        "newQuantity"
      );
    }

    // Get current shop inventory to validate and calculate difference
    const currentInventory = await prisma.shopInventory.findFirst({
      where: {
        productId: parseInt(productId),
        shopId,
      },
      include: {
        product: true,
      },
    });

    if (!currentInventory) {
      throw new ValidationError(
        "Product not found in shop inventory",
        "productId"
      );
    }

    const quantityDifference = newQtyNum - currentInventory.quantity;
    const adjustmentTypeDetermined =
      quantityDifference > 0
        ? "increase"
        : quantityDifference < 0
        ? "decrease"
        : "no_change";

    if (quantityDifference === 0) {
      return res.json({
        message:
          "No adjustment needed - quantity is already at the specified level",
        currentQuantity: currentInventory.quantity,
        requestedQuantity: newQtyNum,
      });
    }

    // Validate adjustment types
    const validAdjustmentTypes = [
      "manual",
      "damaged",
      "expired",
      "theft",
      "found",
      "correction",
    ];
    if (!validAdjustmentTypes.includes(adjustmentType)) {
      throw new ValidationError(
        "Invalid adjustment type. Must be one of: " +
          validAdjustmentTypes.join(", "),
        "adjustmentType"
      );
    }

    const inventory = await shopAdminService.adjustStock(shopId, {
      productId: parseInt(productId),
      newQuantity: newQtyNum,
      reason: reason.trim(),
      adjustmentType,
      adminId: req.user.shopAdminId,
    });

    // Log detailed audit trail
    await prisma.auditLog
      .create({
        data: {
          adminId: req.user.shopAdminId,
          action: "STOCK_ADJUSTMENT",
          targetType: "PRODUCT",
          targetId: productId.toString(),
          details: {
            message: `${adjustmentTypeDetermined.toUpperCase()} adjustment: ${
              currentInventory.product.name
            } from ${currentInventory.quantity} to ${newQtyNum} (${
              quantityDifference > 0 ? "+" : ""
            }${quantityDifference}). Reason: ${reason.trim()}`,
            productId: parseInt(productId),
            previousQuantity: currentInventory.quantity,
            newQuantity: newQtyNum,
            difference: quantityDifference,
            adjustmentType,
            reason: reason.trim(),
          },
        },
      })
      .catch((err) => {
        console.warn("Failed to log stock adjustment audit:", err);
      });

    res.json({
      ...inventory,
      adjustment: {
        type: adjustmentTypeDetermined,
        difference: quantityDifference,
        reason: reason.trim(),
      },
      message: `Stock ${adjustmentTypeDetermined} of ${Math.abs(
        quantityDifference
      )} units processed successfully`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Stock Adjustment Error:", error);

    if (error instanceof ShopAdminError) {
      return res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
        field: error.field || null,
      });
    }

    res.status(500).json({
      error: "STOCK_ADJUSTMENT_ERROR",
      message: "Failed to process stock adjustment",
    });
  }
};

/**
 * Get Current Inventory Status with filtering and pagination
 */
exports.getInventoryStatus = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const {
      page = 1,
      limit = 50,
      category,
      lowStock = false,
      search,
      sortBy = "name",
      sortOrder = "asc",
    } = req.query;

    // Validate pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(Math.max(1, parseInt(limit)), 200); // Max 200 items

    // Validate sort parameters
    const validSortFields = [
      "name",
      "quantity",
      "price",
      "category",
      "updatedAt",
    ];
    const validSortOrders = ["asc", "desc"];

    if (!validSortFields.includes(sortBy)) {
      throw new ValidationError(
        "Invalid sort field. Must be one of: " + validSortFields.join(", "),
        "sortBy"
      );
    }

    if (!validSortOrders.includes(sortOrder)) {
      throw new ValidationError(
        "Invalid sort order. Must be 'asc' or 'desc'",
        "sortOrder"
      );
    }

    const filters = {
      page: pageNum,
      limit: limitNum,
      category: category || null,
      lowStock: lowStock === "true",
      search: search?.trim() || null,
      sortBy,
      sortOrder,
    };

    const cacheKey = `inventory_status:${shopId}:${JSON.stringify(filters)}`;

    // Try cache first (2 minute cache)
    const cachedInventory = await cacheService.get(cacheKey);
    if (cachedInventory) {
      return res.json({
        ...cachedInventory,
        cached: true,
      });
    }

    const inventory = await shopAdminService.getInventoryStatus(
      shopId,
      filters
    );

    // Add metadata
    const enrichedInventory = {
      ...inventory,
      pagination: {
        page: pageNum,
        limit: limitNum,
        hasMore: inventory.products?.length === limitNum,
      },
      filters,
      lastUpdated: new Date().toISOString(),
      cached: false,
    };

    await cacheService.set(cacheKey, enrichedInventory, 120); // 2 minutes

    res.json(enrichedInventory);
  } catch (error) {
    console.error("Get Inventory Status Error:", error);

    if (error instanceof ShopAdminError) {
      return res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
        field: error.field || null,
      });
    }

    res.status(500).json({
      error: "INVENTORY_STATUS_ERROR",
      message: "Failed to load inventory status",
    });
  }
};

// ===== ADDITIONAL SALES REPORTS =====

/**
 * GET /shop-admin/reports/sales/by-tier
 * Get Sales by Price Tier Report
 */
exports.getSalesByPriceTier = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate date format if provided
    if (startDate && isNaN(Date.parse(startDate))) {
      return res.status(400).json({ error: "Invalid startDate format" });
    }
    if (endDate && isNaN(Date.parse(endDate))) {
      return res.status(400).json({ error: "Invalid endDate format" });
    }

    const report = await shopAdminService.getSalesByPriceTier(req.user.shopId, {
      startDate,
      endDate,
    });

    res.json(report);
  } catch (error) {
    console.error("Sales by Price Tier Error:", error);
    res
      .status(500)
      .json({ error: "Failed to generate sales by price tier report" });
  }
};

/**
 * GET /shop-admin/reports/sales/best-sellers
 * Get Best Sellers Report - Top products grouped by price tier
 */
exports.getBestSellersReport = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    // Validate limit parameter
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
      return res.status(400).json({
        error: "limit must be a number between 1 and 50",
      });
    }

    // Validate date format if provided
    if (startDate && isNaN(Date.parse(startDate))) {
      return res.status(400).json({ error: "Invalid startDate format" });
    }
    if (endDate && isNaN(Date.parse(endDate))) {
      return res.status(400).json({ error: "Invalid endDate format" });
    }

    const report = await shopAdminService.getBestSellersReport(
      req.user.shopId,
      {
        startDate,
        endDate,
        limit: parsedLimit,
      }
    );

    res.json(report);
  } catch (error) {
    console.error("Best Sellers Report Error:", error);
    res.status(500).json({ error: "Failed to generate best sellers report" });
  }
};

/**
 * GET /shop-admin/reports/sales/monthly-breakdown
 * Get Monthly Sales Breakdown (Daily or Monthly Aggregation)
 */
exports.getMonthlySalesBreakdown = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "daily" } = req.query;

    // Validate groupBy parameter
    if (!["daily", "monthly"].includes(groupBy)) {
      return res
        .status(400)
        .json({ error: 'groupBy must be "daily" or "monthly"' });
    }

    // Validate date format if provided
    if (startDate && isNaN(Date.parse(startDate))) {
      return res.status(400).json({ error: "Invalid startDate format" });
    }
    if (endDate && isNaN(Date.parse(endDate))) {
      return res.status(400).json({ error: "Invalid endDate format" });
    }

    const report = await shopAdminService.getMonthlySalesBreakdown(
      req.user.shopId,
      {
        startDate,
        endDate,
        groupBy,
      }
    );

    res.json(report);
  } catch (error) {
    console.error("Monthly Sales Breakdown Error:", error);
    res
      .status(500)
      .json({ error: "Failed to generate monthly sales breakdown" });
  }
};

/**
 * GET /shop-admin/reports/sales/daily
 * Get Daily Sales Report
 */
exports.getDailySalesReport = async (req, res) => {
  try {
    const { date } = req.query; // YYYY-MM-DD format

    // Validate date format if provided
    if (date && isNaN(Date.parse(date))) {
      return res
        .status(400)
        .json({ error: "Invalid date format (use YYYY-MM-DD)" });
    }

    const report = await shopAdminService.getDailySalesReport(
      req.user.shopId,
      date
    );

    res.json(report);
  } catch (error) {
    console.error("Daily Sales Report Error:", error);
    res.status(500).json({ error: "Failed to generate daily sales report" });
  }
};

// ===== EXPORT FUNCTIONS =====

/**
 * Export Report as PDF with enhanced validation and security
 */
exports.exportReportPDF = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const {
      reportType = "general",
      startDate,
      endDate,
      format = "standard",
      ...params
    } = req.query;

    // Validate reportType
    const validReportTypes = [
      "sales",
      "inventory",
      "staff",
      "patients",
      "general",
      "attendance",
      "performance",
    ];
    const normalizedReportType = reportType.toLowerCase();

    if (!validReportTypes.includes(normalizedReportType)) {
      throw new ValidationError(
        `Invalid report type. Valid types are: ${validReportTypes.join(", ")}`,
        "reportType"
      );
    }

    // Validate date range if provided
    if (startDate || endDate) {
      if (!startDate || !endDate) {
        throw new ValidationError(
          "Both start date and end date are required when filtering by date",
          "dateRange"
        );
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new ValidationError(
          "Invalid date format. Use YYYY-MM-DD",
          "dateFormat"
        );
      }

      if (start > end) {
        throw new ValidationError(
          "Start date must be before end date",
          "dateRange"
        );
      }

      // Limit to 1 year max for performance
      const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      if (daysDiff > 365) {
        throw new ValidationError(
          "Date range cannot exceed 365 days for PDF export",
          "dateRange"
        );
      }
    }

    // Validate format
    const validFormats = ["standard", "detailed", "summary"];
    if (!validFormats.includes(format)) {
      throw new ValidationError(
        "Invalid format. Must be one of: " + validFormats.join(", "),
        "format"
      );
    }

    const reportOptions = {
      ...params,
      startDate,
      endDate,
      format,
      generatedBy: req.user.name,
      generatedAt: new Date().toISOString(),
    };

    const pdfBuffer = await shopAdminService.exportReportPDF(
      shopId,
      normalizedReportType,
      reportOptions
    );

    // Log export activity
    await prisma.auditLog
      .create({
        data: {
          adminId: req.user.shopAdminId,
          action: "EXPORT_PDF",
          targetType: "REPORT",
          targetId: normalizedReportType,
          details: `Exported ${normalizedReportType} report as PDF`,
          metadata: {
            reportType: normalizedReportType,
            format,
            dateRange: startDate && endDate ? { startDate, endDate } : null,
          },
        },
      })
      .catch((err) => {
        console.warn("Failed to log PDF export audit:", err);
      });

    const filename = `${normalizedReportType}-report-${
      new Date().toISOString().split("T")[0]
    }.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Export PDF Error:", error);

    if (error instanceof ShopAdminError) {
      return res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
        field: error.field || null,
      });
    }

    res.status(500).json({
      error: "PDF_EXPORT_ERROR",
      message: "Failed to generate PDF report",
    });
  }
};

/**
 * Export Report as Excel with enhanced validation and security
 */
exports.exportReportExcel = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const {
      reportType = "general",
      startDate,
      endDate,
      format = "standard",
      includeCharts = false,
      ...params
    } = req.query;

    // Validate reportType
    const validReportTypes = [
      "sales",
      "inventory",
      "staff",
      "patients",
      "general",
      "attendance",
      "performance",
    ];
    const normalizedReportType = reportType.toLowerCase();

    if (!validReportTypes.includes(normalizedReportType)) {
      throw new ValidationError(
        `Invalid report type. Valid types are: ${validReportTypes.join(", ")}`,
        "reportType"
      );
    }

    // Validate date range if provided
    if (startDate || endDate) {
      if (!startDate || !endDate) {
        throw new ValidationError(
          "Both start date and end date are required when filtering by date",
          "dateRange"
        );
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new ValidationError(
          "Invalid date format. Use YYYY-MM-DD",
          "dateFormat"
        );
      }

      if (start > end) {
        throw new ValidationError(
          "Start date must be before end date",
          "dateRange"
        );
      }

      // Limit to 2 years max for Excel export (larger datasets allowed)
      const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      if (daysDiff > 730) {
        throw new ValidationError(
          "Date range cannot exceed 2 years for Excel export",
          "dateRange"
        );
      }
    }

    // Validate format
    const validFormats = ["standard", "detailed", "summary", "pivot"];
    if (!validFormats.includes(format)) {
      throw new ValidationError(
        "Invalid format. Must be one of: " + validFormats.join(", "),
        "format"
      );
    }

    const reportOptions = {
      ...params,
      startDate,
      endDate,
      format,
      includeCharts: includeCharts === "true",
      generatedBy: req.user.name,
      generatedAt: new Date().toISOString(),
    };

    const excelBuffer = await shopAdminService.exportReportExcel(
      shopId,
      normalizedReportType,
      reportOptions
    );

    // Log export activity
    await prisma.auditLog
      .create({
        data: {
          adminId: req.user.shopAdminId,
          action: "EXPORT_EXCEL",
          targetType: "REPORT",
          targetId: normalizedReportType,
          details: `Exported ${normalizedReportType} report as Excel`,
          metadata: {
            reportType: normalizedReportType,
            format,
            includeCharts: includeCharts === "true",
            dateRange: startDate && endDate ? { startDate, endDate } : null,
          },
        },
      })
      .catch((err) => {
        console.warn("Failed to log Excel export audit:", err);
      });

    const filename = `${normalizedReportType}-report-${
      new Date().toISOString().split("T")[0]
    }.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", excelBuffer.length);
    res.send(excelBuffer);
  } catch (error) {
    console.error("Export Excel Error:", error);

    if (error instanceof ShopAdminError) {
      return res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
        field: error.field || null,
      });
    }

    res.status(500).json({
      error: "EXCEL_EXPORT_ERROR",
      message: "Failed to generate Excel report",
    });
  }
};
