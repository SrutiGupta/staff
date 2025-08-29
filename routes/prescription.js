const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const authMiddleware = require('../middleware/auth');

// Create a new prescription
router.post('/', authMiddleware, prescriptionController.createPrescription);

// Get a prescription by ID
router.get('/:id', authMiddleware, prescriptionController.getPrescription);

module.exports = router;
