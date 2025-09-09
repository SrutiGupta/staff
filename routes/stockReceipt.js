
const express = require('express');
const router = express.Router();
const stockReceiptController = require('../controllers/stockReceiptController');
const auth = require('../middleware/auth');

// All routes in this file are prefixed with /api/stock-receipts

// @route   POST /api/stock-receipts
// @desc    Create a new stock receipt (for staff)
// @access  Private
router.post('/', auth, stockReceiptController.createStockReceipt);

module.exports = router;
