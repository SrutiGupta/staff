const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const attendanceController = require("../controllers/attendanceController");
const auth = require("../middleware/auth");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", auth, authController.logout);

module.exports = router;
