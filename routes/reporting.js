
const express = require('express');
const router = express.Router();
const { getDailyReport, getMonthlyReport, getStaffSalesReport, getSalesByPriceTier, getBestSellersByPriceTier } = require('../controllers/reportingController');
const auth = require('../middleware/auth');

router.get('/daily', auth, getDailyReport);
router.get('/monthly', auth, getMonthlyReport);
router.get('/staff-sales', auth, getStaffSalesReport);
router.get('/sales-by-price-tier', auth, getSalesByPriceTier);
router.get('/best-sellers-by-price-tier', auth, getBestSellersByPriceTier);

module.exports = router;
