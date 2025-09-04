const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const authMiddleware = require("../middleware/auth");

// Get all invoices with optional filtering - REQUIRES AUTH
router.get("/", authMiddleware, invoiceController.getAllInvoices);

// Create a new invoice - REQUIRES AUTH
router.post("/", authMiddleware, invoiceController.createInvoice);

// Get a single invoice by ID - REQUIRES AUTH
router.get("/:id", authMiddleware, invoiceController.getInvoice);

// Update invoice status - REQUIRES AUTH
router.patch(
  "/:id/status",
  authMiddleware,
  invoiceController.updateInvoiceStatus
);

// Add payment to invoice - REQUIRES AUTH
router.post("/:id/payment", authMiddleware, invoiceController.addPayment);

// Delete/Cancel invoice - REQUIRES AUTH
router.delete("/:id", authMiddleware, invoiceController.deleteInvoice);

// Generate a PDF for an invoice - REQUIRES AUTH
router.post("/pdf", authMiddleware, invoiceController.generateInvoicePdf);

// Generate a plain text receipt for thermal printing - REQUIRES AUTH
router.get(
  "/:id/thermal",
  authMiddleware,
  invoiceController.generateInvoiceThermal
);

module.exports = router;
