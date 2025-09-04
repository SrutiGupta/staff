const express = require("express");
const router = express.Router();
const companyController = require("../controller/companyController");

// Company routes
router.post("/", companyController.createCompany);
router.post("/:companyId/product", companyController.addProduct);
router.get("/:companyId/dashboard", companyController.getDashboard);
router.get("/warn/:retailerId", companyController.warnRetailer);

module.exports = router;
