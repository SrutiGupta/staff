const express = require("express");
const router = express.Router();
const shopAdminController = require("../controllers/shopAdminController");
const addDoctorController = require("../controllers/addDoctorController");
const shopAdminAuth = require("../middleware/shopAdminAuth");

// ===== PUBLIC ROUTES (No Authentication Required) =====

/**
 * @route POST /api/shopadmin/auth/login
 * @desc Shop Admin Login
 * @access Public
 */
router.post("/auth/login", shopAdminController.login);

/**
 * @route POST /api/shopadmin/auth/register
 * @desc Register new Shop Admin and Shop
 * @access Public
 */
router.post("/auth/register", shopAdminController.register);

// ===== PROTECTED ROUTES (Authentication Required) =====
// Apply authentication middleware to all routes below
router.use(shopAdminAuth);

// ===== DASHBOARD ROUTES =====

/**
 * @route GET /api/shopadmin/dashboard/metrics
 * @desc Get dashboard overview metrics (sales, orders, patients, staff)
 * @access Private (Shop Admin)
 */
router.get("/dashboard/metrics", shopAdminController.getDashboardMetrics);

/**
 * @route GET /api/shopadmin/dashboard/growth
 * @desc Get business growth data for charts (daily/monthly trends)
 * @access Private (Shop Admin)
 * @query period - 'daily' or 'monthly' (default: monthly)
 */
router.get("/dashboard/growth", shopAdminController.getDashboardGrowth);

/**
 * @route GET /api/shopadmin/dashboard/activities
 * @desc Get recent activities (sales, attendance, inventory)
 * @access Private (Shop Admin)
 */
router.get("/dashboard/activities", shopAdminController.getRecentActivities);

// ===== AUDIT & REPORTS ROUTES =====

/**
 * @route GET /api/shopadmin/reports/staff/attendance
 * @desc Get staff attendance report
 * @access Private (Shop Admin)
 * @query startDate, endDate, staffId (optional filters)
 */
router.get(
  "/reports/staff/attendance",
  shopAdminController.getStaffAttendanceReport
);

/**
 * @route GET /api/shopadmin/reports/staff/performance
 * @desc Get staff performance report (sales metrics)
 * @access Private (Shop Admin)
 * @query startDate, endDate (optional filters)
 */
router.get(
  "/reports/staff/performance",
  shopAdminController.getStaffPerformanceReport
);

/**
 * @route GET /api/shopadmin/reports/sales
 * @desc Get sales summary report
 * @access Private (Shop Admin)
 * @query period - 'today', 'week', 'month', 'year' or custom with startDate/endDate
 */
router.get("/reports/sales", shopAdminController.getSalesReport);

/**
 * @route GET /api/shopadmin/reports/sales/products
 * @desc Get product-wise sales breakdown
 * @access Private (Shop Admin)
 * @query startDate, endDate, productId (optional filters)
 */
router.get(
  "/reports/sales/products",
  shopAdminController.getProductSalesReport
);

/**
 * @route GET /api/shopadmin/reports/sales/staff
 * @desc Get sales by staff report
 * @access Private (Shop Admin)
 * @query startDate, endDate (optional filters)
 */
router.get("/reports/sales/staff", shopAdminController.getSalesByStaffReport);

/**
 * @route GET /api/shopadmin/reports/inventory
 * @desc Get inventory movement report
 * @access Private (Shop Admin)
 * @query type - 'stock_in', 'stock_out', 'all', startDate, endDate
 */
router.get("/reports/inventory", shopAdminController.getInventoryReport);

/**
 * @route GET /api/shopadmin/reports/inventory/status
 * @desc Get current stock status report
 * @access Private (Shop Admin)
 */
router.get(
  "/reports/inventory/status",
  shopAdminController.getStockStatusReport
);

/**
 * @route GET /api/shopadmin/reports/inventory/alerts
 * @desc Get low stock alerts
 * @access Private (Shop Admin)
 */
router.get("/reports/inventory/alerts", shopAdminController.getLowStockAlerts);

/**
 * @route GET /api/shopadmin/reports/patients
 * @desc Get patient report
 * @access Private (Shop Admin)
 * @query type - 'active', 'new', 'all', startDate, endDate
 */
router.get("/reports/patients", shopAdminController.getPatientReport);

/**
 * @route GET /api/shopadmin/reports/patients/visits
 * @desc Get patient visit history
 * @access Private (Shop Admin)
 * @query patientId, startDate, endDate (optional filters)
 */
router.get(
  "/reports/patients/visits",
  shopAdminController.getPatientVisitHistory
);

// ===== STAFF MANAGEMENT ROUTES =====

/**
 * @route GET /api/shopadmin/staff
 * @desc Get all staff under the shop
 * @access Private (Shop Admin)
 */
router.get("/staff", shopAdminController.getAllStaff);

/**
 * @route GET /api/shopadmin/staff/:staffId
 * @desc Get detailed information about specific staff member
 * @access Private (Shop Admin)
 */
router.get("/staff/:staffId", shopAdminController.getStaffDetails);

/**
 * @route GET /api/shopadmin/staff/activities
 * @desc Monitor staff activities and performance
 * @access Private (Shop Admin)
 * @query staffId, startDate, endDate (optional filters)
 */
router.get("/staff/activities", shopAdminController.getStaffActivities);

// ===== DOCTOR MANAGEMENT ROUTES =====

/**
 * @route POST /api/shopadmin/doctors/add
 * @desc Add a new doctor (OPTOMETRIST) to the shop
 * @access Private (Shop Admin)
 * @body email, password, name
 */
router.post("/doctors/add", addDoctorController.addDoctor);

/**
 * @route GET /api/shopadmin/doctors
 * @desc Get all doctors (OPTOMETRISTS) in the shop
 * @access Private (Shop Admin)
 */
router.get("/doctors", addDoctorController.getDoctors);

/**
 * @route PUT /api/shopadmin/doctors/:doctorId/status
 * @desc Update doctor status (activate/deactivate)
 * @access Private (Shop Admin)
 * @body isActive
 */
router.put("/doctors/:doctorId/status", addDoctorController.updateDoctorStatus);

// ===== INVENTORY MANAGEMENT ROUTES =====

/**
 * @route POST /api/shopadmin/inventory/stock-in
 * @desc Add stock to shop inventory (from retailer)
 * @access Private (Shop Admin)
 * @body productId, quantity, notes
 */
router.post("/inventory/stock-in", shopAdminController.stockIn);

/**
 * @route POST /api/shopadmin/inventory/adjust
 * @desc Manual stock adjustment
 * @access Private (Shop Admin)
 * @body productId, newQuantity, reason
 */
router.post("/inventory/adjust", shopAdminController.adjustStock);

/**
 * @route GET /api/shopadmin/inventory/status
 * @desc Get current inventory status with stock levels
 * @access Private (Shop Admin)
 */
router.get("/inventory/status", shopAdminController.getInventoryStatus);

// ===== EXPORT ROUTES =====

/**
 * @route GET /api/shopadmin/export/pdf
 * @desc Export any report as PDF
 * @access Private (Shop Admin)
 * @query reportType, and other report-specific parameters
 */
router.get("/export/pdf", shopAdminController.exportReportPDF);

/**
 * @route GET /api/shopadmin/export/excel
 * @desc Export any report as Excel
 * @access Private (Shop Admin)
 * @query reportType, and other report-specific parameters
 */
router.get("/export/excel", shopAdminController.exportReportExcel);

// ===== ERROR HANDLING =====

/**
 * Error handling middleware for Shop Admin routes
 */
router.use((error, req, res, next) => {
  console.error("Shop Admin Route Error:", error);

  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation Error",
      details: error.details,
    });
  }

  if (error.name === "UnauthorizedError") {
    return res.status(401).json({
      message: "Unauthorized Access",
    });
  }

  res.status(500).json({
    message: "Internal Server Error",
    error:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
  });
});

module.exports = router;
