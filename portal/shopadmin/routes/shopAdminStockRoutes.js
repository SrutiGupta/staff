const express = require("express");
const router = express.Router();
const {
  listStockReceipts,
  approveStockReceipt,
  listIncomingShipments,
  getIncomingShipmentDetails,
  getIncomingShipmentComparison,
} = require("../controllers/shopAdminStockController");
const { shopAdminAuth } = require("../middleware/shopAdminAuth");
const { apiLimiter } = require("../middleware/rateLimiting");
const { validate, schemas } = require("../middleware/validation");

// All routes in this file are prefixed with /shop-admin/stock
// Apply authentication and rate limiting to all routes
router.use(shopAdminAuth);
router.use(apiLimiter);

// @route   GET /shop-admin/stock/receipts
// @desc    List all stock receipts for the admin's shop
// @access  Private (ShopAdmin)
router.get(
  "/receipts",
  validate(schemas.pagination, "query"),
  listStockReceipts
);

// @route   PUT /shop-admin/stock/receipts/:id/verify
// @desc    Approve or reject a specific stock receipt
// @access  Private (ShopAdmin)
router.put(
  "/receipts/:id/verify",
  validate(schemas.approveStockReceipt),
  approveStockReceipt
);

// ============================================
// INCOMING SHIPMENTS - Bulk Distribution Tracking
// ============================================

// @route   GET /shop-admin/stock/incoming-shipments
// @desc    List all incoming shipments (expected stock from retailers)
// @access  Private (ShopAdmin)
router.get(
  "/incoming-shipments",
  validate(schemas.pagination, "query"),
  listIncomingShipments
);

// @route   GET /shop-admin/stock/incoming-shipments/:id
// @desc    Get details of a specific incoming shipment
// @access  Private (ShopAdmin)
router.get("/incoming-shipments/:id", getIncomingShipmentDetails);

// @route   GET /shop-admin/stock/incoming-shipments/summary/comparison
// @desc    Get comparison between expected and received stock
// @access  Private (ShopAdmin)
router.get(
  "/incoming-shipments/summary/comparison",
  getIncomingShipmentComparison
);

module.exports = router;
