const express = require("express");
const router = express.Router();
const {
  createCustomerAndInvoice,
  getAddressHotspots,
  createCustomer,
  getAllCustomers,
  getCustomer,
} = require("../controllers/customerController");
const auth = require("../middleware/auth");

// Create a standalone customer
router.post("/", auth, createCustomer);

// Get all customers
router.get("/", auth, getAllCustomers);

// Get a single customer by ID
router.get("/:id", auth, getCustomer);

// POST /api/customer/invoice - Create an invoice for a new walk-in customer
router.post("/invoice", auth, createCustomerAndInvoice);

// GET /api/customer/hotspots - Get a list of top customer address hotspots
router.get("/hotspots", auth, getAddressHotspots);

module.exports = router;
