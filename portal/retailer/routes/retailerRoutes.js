const express = require("express");
const router = express.Router();

// Import controllers
const authController = require("../controller/authController");
const dashboardController = require("../controller/dashboardController");
const reportsController = require("../controller/reportsController");
const inventoryController = require("../controller/inventoryController");
const shopDistributionController = require("../controller/shopDistributionController");
const bulkProductController = require("../controller/bulkProductController");

// Import middleware
const {
  authenticateRetailer,
  validateRegistration,
  validateLogin,
  validatePasswordChange,
} = require("../middleware/authMiddleware");

// ================================
// AUTH ROUTES
// ================================

// Register new retailer
router.post("/auth/register", validateRegistration, authController.register);

// Login retailer
router.post("/auth/login", validateLogin, authController.login);

// Get retailer profile (protected)
router.get("/auth/profile", authenticateRetailer, authController.getProfile);

// Update retailer profile (protected)
router.put("/auth/profile", authenticateRetailer, authController.updateProfile);

// Change password (protected)
router.put(
  "/auth/change-password",
  authenticateRetailer,
  validatePasswordChange,
  authController.changePassword
);

// Refresh token (protected)
router.post(
  "/auth/refresh-token",
  authenticateRetailer,
  authController.refreshToken
);

// ================================
// DASHBOARD ROUTES
// ================================

// Get dashboard overview
router.get(
  "/dashboard/overview",
  authenticateRetailer,
  dashboardController.getDashboardOverview
);

// Get sales analytics
router.get(
  "/dashboard/sales-analytics",
  authenticateRetailer,
  dashboardController.getSalesAnalytics
);

// Get inventory analytics
router.get(
  "/dashboard/inventory-analytics",
  authenticateRetailer,
  dashboardController.getInventoryAnalytics
);

// Get shop performance
router.get(
  "/dashboard/shop-performance",
  authenticateRetailer,
  dashboardController.getShopPerformance
);

// ================================
// REPORTS ROUTES
// ================================

// Generate Profit & Loss Report
router.get(
  "/reports/profit-loss",
  authenticateRetailer,
  reportsController.generateProfitLossReport
);

// Generate Tax Report
router.get(
  "/reports/tax-report",
  authenticateRetailer,
  reportsController.generateTaxReport
);

// Generate Stock Valuation Report
router.get(
  "/reports/stock-valuation",
  authenticateRetailer,
  reportsController.generateStockValuationReport
);

// Get all reports
router.get("/reports", authenticateRetailer, reportsController.getAllReports);

// Delete a report
router.delete(
  "/reports/:reportId",
  authenticateRetailer,
  reportsController.deleteReport
);

// ================================
// INVENTORY MANAGEMENT ROUTES
// ================================

// Company management
router.get(
  "/inventory/companies",
  authenticateRetailer,
  inventoryController.getAllCompanies
);
router.post(
  "/inventory/companies",
  authenticateRetailer,
  inventoryController.addCompany
);
router.put(
  "/inventory/companies/:companyId",
  authenticateRetailer,
  inventoryController.updateCompany
);

// Product management
router.get(
  "/inventory/companies/:companyId/products",
  authenticateRetailer,
  inventoryController.getProductsByCompany
);
router.post(
  "/inventory/products",
  authenticateRetailer,
  inventoryController.addProduct
);
router.put(
  "/inventory/products/:productId",
  authenticateRetailer,
  inventoryController.updateProduct
);

// Retailer inventory management
router.get(
  "/inventory/my-products",
  authenticateRetailer,
  inventoryController.getRetailerProducts
);
router.post(
  "/inventory/my-products",
  authenticateRetailer,
  inventoryController.addProductToInventory
);
router.put(
  "/inventory/my-products/:retailerProductId",
  authenticateRetailer,
  inventoryController.updateRetailerProduct
);
router.put(
  "/inventory/my-products/:retailerProductId/stock",
  authenticateRetailer,
  inventoryController.updateStock
);

// Inventory summary
router.get(
  "/inventory/summary",
  authenticateRetailer,
  inventoryController.getInventorySummary
);

// ================================
// SHOP DISTRIBUTION ROUTES
// ================================

// Shop management - existing routes
router.get(
  "/shops",
  authenticateRetailer,
  shopDistributionController.getRetailerShops
);
router.post("/shops", authenticateRetailer, shopDistributionController.addShop);
router.put(
  "/shops/:retailerShopId",
  authenticateRetailer,
  shopDistributionController.updateShopRelationship
);

// 🆕 NEW: Enhanced shop discovery and management
router.get(
  "/shops/available",
  authenticateRetailer,
  shopDistributionController.getAvailableShops
);
router.get(
  "/shops/my-network",
  authenticateRetailer,
  shopDistributionController.getMyNetwork
);

// Distribution management - existing routes
router.post(
  "/distributions",
  authenticateRetailer,
  shopDistributionController.distributeToShop
);
router.get(
  "/distributions",
  authenticateRetailer,
  shopDistributionController.getAllDistributions
);
router.get(
  "/shops/:retailerShopId/distributions",
  authenticateRetailer,
  shopDistributionController.getShopDistributions
);

// Update distribution status - existing routes
router.put(
  "/distributions/:distributionId/delivery-status",
  authenticateRetailer,
  shopDistributionController.updateDeliveryStatus
);
router.put(
  "/distributions/:distributionId/payment-status",
  authenticateRetailer,
  shopDistributionController.updatePaymentStatus
);

// ================================
// BULK OPERATIONS ROUTES
// ================================

// Get bulk upload template
router.get(
  "/bulk/template",
  authenticateRetailer,
  bulkProductController.getUploadTemplate
);

// Bulk upload products from JSON
router.post(
  "/bulk/products/upload",
  authenticateRetailer,
  bulkProductController.bulkUploadProducts
);

// Bulk update inventory
router.post(
  "/bulk/inventory/update",
  authenticateRetailer,
  bulkProductController.bulkUpdateInventory
);

// Bulk distribute to shops
router.post(
  "/bulk/distributions/create",
  authenticateRetailer,
  bulkProductController.bulkDistributeToShops
);

// Export retailer products as JSON
router.get(
  "/bulk/products/export",
  authenticateRetailer,
  bulkProductController.exportRetailerProducts
);

module.exports = router;
