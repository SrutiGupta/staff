const express = require("express");
const { loginDoctor } = require("../controller/loginController");
const {
  getPatients,
  createPrescription,
  getAllPrescriptions,
  getPrescription,
} = require("../controller/prescriptionController.js");
const authDoctor = require("../middleware/authDoctor");

const router = express.Router();

// Public route
router.post("/login", loginDoctor);

// Protected routes
router.post("/prescriptions", authDoctor, createPrescription);
router.get("/prescriptions", authDoctor, getAllPrescriptions);
router.get("/prescriptions/:id", authDoctor, getPrescription);

module.exports = router;

