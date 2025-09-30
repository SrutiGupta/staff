const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");
const auth = require("../middleware/auth");

// Barcode-based stock operations
router.post(
  "/stock-by-barcode",
  auth,
  inventoryController.updateStockByBarcode
);
router.post(
  "/stock-out-by-barcode",
  auth,
  inventoryController.stockOutByBarcode
);

// Barcode-based product lookup/enlisting
router.get(
  "/product/barcode/:barcode",
  auth,
  inventoryController.getProductByBarcode
);

// Add new product by barcode scanning (ONLY REQUIRES SCANNED BARCODE!)
// Smart parsing extracts: company, model, frame type, color, material, etc.
router.post(
  "/product/scan-to-add",
  auth,
  inventoryController.addProductByBarcodeScan
);

// Get product by ID
router.get("/product/:productId", auth, inventoryController.getProductById);

// Get all products
router.get("/products", auth, inventoryController.getAllProducts);

// Product management
router.post("/product", auth, inventoryController.addProduct);
router.put("/product/:productId", auth, inventoryController.updateProduct);

// Traditional stock operations (by product ID)
router.post("/stock-in", auth, inventoryController.stockIn);
router.post("/stock-out", auth, inventoryController.stockOut);

// Inventory viewing
router.get("/", auth, inventoryController.getInventory);

// Company management
router.post("/company", auth, inventoryController.addCompany);
router.get("/companies", auth, inventoryController.getCompanies);
router.get(
  "/company/:companyId/products",
  auth,
  inventoryController.getCompanyProducts
);

module.exports = router;
