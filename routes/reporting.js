
const express = require('express');
const router = express.Router();
const reportingController = require('../controllers/reportingController');
const auth = require('../middleware/auth');

router.get('/daily', auth, reportingController.getDailyReport);
router.get('/monthly', auth, reportingController.getMonthlyReport);

module.exports = router;
