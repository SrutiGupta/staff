const express = require("express");
const { loginDoctor } = require("../controllers/loginController");
const { getPatients, addPrescription } = require("../controllers/prescriptionController");
const authDoctor = require("../middleware/authDoctor");

const router = express.Router();

// Public route
router.post("/login", loginDoctor);

// Protected routes
router.get("/patients", authDoctor, getPatients);
router.post("/prescriptions", authDoctor, addPrescription);

module.exports = router;
