const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");
const auth = require("../middleware/auth");

// Create a new patient
router.post("/", auth, patientController.createPatient);

// Get all patients (we'll add this controller function)
router.get("/", auth, patientController.getAllPatients);

// Get a single patient by ID
router.get("/:id", auth, patientController.getPatient);

module.exports = router;
