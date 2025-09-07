const shopAdminService = require('../services/shopAdminServices');

exports.getDashboardMetrics = async (req, res) => {
    try {
        const metrics = await shopAdminService.getDashboardMetrics(req.user.shopId);
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getDashboardCalendar = async (req, res) => {
    try {
        const calendarData = await shopAdminService.getDashboardCalendar(req.user.shopId);
        res.json(calendarData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getDashboardGrowth = async (req, res) => {
    try {
        const growthData = await shopAdminService.getDashboardGrowth(req.user.shopId);
        res.json(growthData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getStaffAttendanceReport = async (req, res) => {
    try {
        const report = await shopAdminService.getStaffAttendanceReport(req.user.shopId);
        res.json(report);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getDoctorAttendanceReport = async (req, res) => {
    try {
        const report = await shopAdminService.getDoctorAttendanceReport(req.user.shopId);
        res.json(report);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSalesReport = async (req, res) => {
    try {
        const report = await shopAdminService.getSalesReport(req.user.shopId);
        res.json(report);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getInventoryReport = async (req, res) => {
    try {
        const report = await shopAdminService.getInventoryReport(req.user.shopId);
        res.json(report);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getPatientReport = async (req, res) => {
    try {
        const report = await shopAdminService.getPatientReport(req.user.shopId);
        res.json(report);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.stockIn = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const inventory = await shopAdminService.stockIn(req.user.shopId, productId, quantity);
        res.json(inventory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.stockOut = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const inventory = await shopAdminService.stockOut(req.user.shopId, productId, quantity);
        res.json(inventory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
