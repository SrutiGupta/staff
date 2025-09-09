
const express = require('express');
const router = express.Router();
const { listStockReceipts, verifyStockReceipt } = require('../controllers/shopAdminStockController');
const shopAdminAuth = require('../middleware/shopAdminAuth');

// All routes in this file are prefixed with /shop-admin/stock

// @route   GET /shop-admin/stock/receipts
// @desc    List all stock receipts for the admin's shop
// @access  Private (ShopAdmin)
router.get('/receipts', shopAdminAuth, listStockReceipts);

// @route   PUT /shop-admin/stock/receipts/:id/verify
// @desc    Verify a specific stock receipt
// @access  Private (ShopAdmin)
router.put('/receipts/:id/verify', shopAdminAuth, verifyStockReceipt);

module.exports = router;
