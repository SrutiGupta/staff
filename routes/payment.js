const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Process a payment for an invoice
router.post('/', paymentController.processPayment);

module.exports = router;
