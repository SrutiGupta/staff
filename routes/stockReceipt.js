const express = require("express");
const router = express.Router();
const stockReceiptController = require("../controllers/stockReceiptController");
const auth = require("../middleware/auth");

// All routes in this file are prefixed with /api/stock-receipts

// @route   POST /api/stock-receipts
// @desc    Create a new stock receipt (for staff)
// @access  Private
router.post("/", auth, stockReceiptController.createStockReceipt);

// @route   GET /api/stock-receipts
// @desc    Get all stock receipts for the staff's shop (with optional status filter)
// @access  Private
router.get("/", auth, stockReceiptController.getStockReceipts);

// @route   GET /api/stock-receipts/:id
// @desc    Get a specific stock receipt by ID
// @access  Private
router.get("/:id", auth, stockReceiptController.getStockReceiptById);

module.exports = router;
