
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const auth = require('../middleware/auth');

router.get('/', auth, attendanceController.getAttendance);
router.get('/:staffId', auth, attendanceController.getAttendanceByStaff);

module.exports = router;
