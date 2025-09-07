
const express = require('express');
const router = express.Router();
const shopAdminController = require('../controllers/shopAdminController');

// Dashboard
router.get('/dashboard/metrics', shopAdminController.getDashboardMetrics);
router.get('/dashboard/calendar', shopAdminController.getDashboardCalendar);
router.get('/dashboard/growth', shopAdminController.getDashboardGrowth);

// Reports
router.get('/reports/audit/staff-attendance', shopAdminController.getStaffAttendanceReport);
router.get('/reports/audit/doctor-attendance', shopAdminController.getDoctorAttendanceReport);
router.get('/reports/sales/summary', shopAdminController.getSalesReport);
router.get('/reports/inventory/history', shopAdminController.getInventoryReport);
router.get('/reports/patients/list', shopAdminController.getPatientReport);

// Inventory Management
router.post('/inventory/stock-in', shopAdminController.stockIn);
router.post('/inventory/stock-out', shopAdminController.stockOut);

module.exports = router;
