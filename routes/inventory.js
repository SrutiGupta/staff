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

// Product management
router.post("/product", auth, inventoryController.addProduct);
router.put("/product/:productId", auth, inventoryController.updateProduct);

// Stock operations
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
