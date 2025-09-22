const express = require("express");
const router = express.Router();
const {
  listStockReceipts,
  approveStockReceipt,
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

module.exports = router;
