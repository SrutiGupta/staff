const express = require("express");
const { loginDoctor, logoutDoctor } = require("../controller/loginController");
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
router.post("/logout", authDoctor, logoutDoctor);

// Protected routes
router.get("/patients", authDoctor, getPatients);
router.post("/prescriptions", authDoctor, createPrescription);
router.get("/prescriptions", authDoctor, getAllPrescriptions);
router.get("/prescriptions/:id", authDoctor, getPrescription);
router.get(
  "/prescriptions/:id/pdf",
  authDoctor,
  require("../controller/prescriptionController").generatePrescriptionPdf
);
router.get(
  "/prescriptions/:id/thermal",
  authDoctor,
  require("../controller/prescriptionController").generatePrescriptionThermal
);

module.exports = router;
