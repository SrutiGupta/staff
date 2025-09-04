const express = require("express");
const router = express.Router();
const prescriptionController = require("../controllers/prescriptionController");
const authMiddleware = require("../middleware/auth");

// Create a new prescription
router.post("/", authMiddleware, prescriptionController.createPrescription);

// Get all prescriptions with optional filtering
router.get("/", authMiddleware, prescriptionController.getAllPrescriptions);

// Get a prescription by ID
router.get("/:id", authMiddleware, prescriptionController.getPrescription);

// Generate PDF for prescription's invoice
router.get(
  "/:id/pdf",
  authMiddleware,
  prescriptionController.generatePrescriptionPdf
);

// Generate thermal print for prescription's invoice
router.get(
  "/:id/thermal",
  authMiddleware,
  prescriptionController.generatePrescriptionThermal
);

module.exports = router;
