const express = require("express");
const router = express.Router();
const barcodeController = require("../controllers/barcodeController");
const auth = require("../middleware/auth");

// Generate barcode label (can be used with or without productId)
router.post("/label", auth, barcodeController.generateBarcodeLabel);

// Generate and assign barcode to a product without barcode
router.post(
  "/generate/:productId",
  auth,
  barcodeController.generateBarcodeForProduct
);

// Generate and assign SKU to a product without SKU
router.post(
  "/sku/generate/:productId",
  auth,
  barcodeController.generateSKUForProduct
);

// Get products that don't have barcodes (need barcode generation)
router.get("/missing", auth, barcodeController.getProductsWithoutBarcodes);

// Legacy route for backward compatibility
router.post("/", auth, barcodeController.generateBarcodeLabel);

module.exports = router;
