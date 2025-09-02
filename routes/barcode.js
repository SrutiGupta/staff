const express = require("express");
const router = express.Router();
const barcodeController = require("../controllers/barcodeController");

router.post("/", barcodeController.generateBarcodeLabel);

module.exports = router;
