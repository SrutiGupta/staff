const retailerService = require("../services/retailerServices");

// Create retailer
exports.createRetailer = async (req, res) => {
  try {
    const { companyId } = req.params;
    const retailer = await retailerService.createRetailer(Number(companyId), req.body);
    res.json(retailer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get retailers
exports.getRetailers = async (req, res) => {
  try {
    const { companyId } = req.params;
    const retailers = await retailerService.getRetailers(Number(companyId));
    res.json(retailers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Make payment
exports.makePayment = async (req, res) => {
  try {
    const { retailerId, invoiceId } = req.params;
    const { amount, method } = req.body;
    const payment = await retailerService.makePayment(
      Number(retailerId),
      invoiceId,
      Number(amount),
      method
    );
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get due
exports.getDue = async (req, res) => {
  try {
    const { retailerId } = req.params;
    const due = await retailerService.getDue(Number(retailerId));
    res.json(due);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Request items
exports.requestItems = async (req, res) => {
  try {
    const { retailerId } = req.params;
    const items = req.body.items;
    const response = await retailerService.requestItems(Number(retailerId), items);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
