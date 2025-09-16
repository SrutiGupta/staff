const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const auth = require("../middleware/auth");

// Remove duplicate login route - use /api/auth/login instead

// Attendance logout (marks logout time)
router.post("/logout", auth, attendanceController.logout);

// Get attendance records
router.get("/", auth, attendanceController.getAttendance);
router.get("/:staffId", auth, attendanceController.getAttendanceByStaff);

module.exports = router;
