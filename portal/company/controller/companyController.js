const companyService = require("../services/companyServices");

// Create new company
exports.createCompany = async (req, res) => {
  try {
    const company = await companyService.createCompany(req.body);
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add product under company
exports.addProduct = async (req, res) => {
  try {
    const { companyId } = req.params;
    const product = await companyService.addProduct(Number(companyId), req.body);
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Dashboard
exports.getDashboard = async (req, res) => {
  try {
    const { companyId } = req.params;
    const dashboard = await companyService.getDashboard(Number(companyId));
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Warn retailer dues
exports.warnRetailer = async (req, res) => {
  try {
    const { retailerId } = req.params;
    const message = await companyService.warnRetailer(Number(retailerId));
    res.json({ message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
