const express = require('express');
const router = express.Router();
const barcodeController = require('../controllers/barcodeController');

router.get('/:data', barcodeController.generateBarcode);

module.exports = router;
