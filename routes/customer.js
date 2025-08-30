const express = require('express');
const router = express.Router();
const { createCustomerAndInvoice, getAddressHotspots } = require('../controllers/customerController');
const auth = require('../middleware/auth');

// POST /api/customer/invoice - Create an invoice for a new walk-in customer
router.post('/invoice', auth, createCustomerAndInvoice);

// GET /api/customer/hotspots - Get a list of top customer address hotspots
router.get('/hotspots', auth, getAddressHotspots);

module.exports = router;