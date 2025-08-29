
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const attendanceController = require('../controllers/attendanceController');

router.post('/register', authController.register);
router.post('/login', attendanceController.login);
router.post('/logout', attendanceController.logout);

module.exports = router;
