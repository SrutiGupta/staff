const express = require("express");
const router = express.Router();
const retailerController = require("../controller/retailerController");

// Retailer routes
router.post("/:companyId", retailerController.createRetailer);
router.get("/:companyId", retailerController.getRetailers);
router.post("/:retailerId/payment/:invoiceId", retailerController.makePayment);
router.get("/:retailerId/due", retailerController.getDue);
router.post("/:retailerId/request", retailerController.requestItems);

module.exports = router;
