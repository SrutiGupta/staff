const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

// Create a new invoice
router.post('/', invoiceController.createInvoice);

// Get a single invoice by ID
router.get('/:id', invoiceController.getInvoice);

// Generate a PDF for an invoice
router.get('/:id/pdf', invoiceController.generateInvoicePdf);

// Generate a plain text receipt for thermal printing
router.get('/:id/thermal', invoiceController.generateInvoiceThermal);

module.exports = router;
