const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const auth = require('../middleware/auth');

// New route for barcode-based stock updates
router.post('/stock-by-barcode', auth, inventoryController.updateStockByBarcode);

router.post('/product', auth, inventoryController.addProduct);
router.post('/stock-in', auth, inventoryController.stockIn);
router.post('/stock-out', auth, inventoryController.stockOut);
router.get('/', auth, inventoryController.getInventory);
router.put('/product/:productId', auth, inventoryController.updateProduct);

module.exports = router;
