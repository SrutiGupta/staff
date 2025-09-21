const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const attendanceController = require("../controllers/attendanceController");
const auth = require("../middleware/auth");
const shopAdminAuth = require("../portal/shopadmin/middleware/shopAdminAuth");

// Staff registration - only shop admins can register new staff
router.post("/register", shopAdminAuth, authController.register);
router.post("/login", authController.login);
router.post("/logout", auth, authController.logout);

module.exports = router;
