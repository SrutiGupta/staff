const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const auth = require('../middleware/auth');

// Staff Login
router.post('/login', attendanceController.login);

router.get('/', auth, attendanceController.getAttendance);
router.get('/:staffId', auth, attendanceController.getAttendanceByStaff);

module.exports = router;
