const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// Generate Profit & Loss Report
exports.generateProfitLossReport = async (req, res) => {
  try {
    const retailerId = req.retailer.id;
    const { startDate, endDate, format = "json" } = req.query;

    // Default to current month if no dates provided
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    // Revenue from sales to shops
    const revenue = await prisma.retailerTransaction.aggregate({
      where: {
        retailerId: retailerId,
        type: "SALE_TO_SHOP",
        transactionDate: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Cost of goods sold (purchases)
    const costOfGoodsSold = await prisma.retailerTransaction.aggregate({
      where: {
        retailerId: retailerId,
        type: "PURCHASE",
        transactionDate: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Operating expenses
    const operatingExpenses = await prisma.retailerTransaction.aggregate({
      where: {
        retailerId: retailerId,
        type: "EXPENSE",
        transactionDate: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Refunds and returns
    const refunds = await prisma.retailerTransaction.aggregate({
      where: {
        retailerId: retailerId,
        type: "REFUND",
        transactionDate: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Calculate profit/loss
    const totalRevenue = revenue._sum.amount || 0;
    const totalCOGS = costOfGoodsSold._sum.amount || 0;
    const totalExpenses = operatingExpenses._sum.amount || 0;
    const totalRefunds = refunds._sum.amount || 0;

    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - totalExpenses - totalRefunds;

    const reportData = {
      period: {
        startDate: start,
        endDate: end,
      },
      revenue: {
        totalSales: totalRevenue,
        refunds: totalRefunds,
        netRevenue: totalRevenue - totalRefunds,
      },
      costs: {
        costOfGoodsSold: totalCOGS,
        operatingExpenses: totalExpenses,
        totalCosts: totalCOGS + totalExpenses,
      },
      profit: {
        grossProfit: grossProfit,
        grossProfitMargin:
          totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
        netProfit: netProfit,
        netProfitMargin:
          totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
      },
    };

    // Save report to database
    await prisma.retailerReport.create({
      data: {
        retailerId: retailerId,
        reportType: "PROFIT_LOSS",
        title: `Profit & Loss Report - ${start.toDateString()} to ${end.toDateString()}`,
        filters: { startDate, endDate },
        data: reportData,
      },
    });

    if (format === "pdf") {
      const pdfPath = await generateProfitLossPDF(reportData, req.retailer);
      res.download(pdfPath);
    } else {
      res.json(reportData);
    }
  } catch (error) {
    console.error("Profit & Loss report error:", error);
    res.status(500).json({ error: "Failed to generate Profit & Loss report" });
  }
};

// Generate Tax Report
exports.generateTaxReport = async (req, res) => {
  try {
    const retailerId = req.retailer.id;
    const { startDate, endDate, format = "json" } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    // Get all sales transactions with GST calculations
    const salesData = await prisma.shopDistribution.findMany({
      where: {
        retailerId: retailerId,
        distributionDate: {
          gte: start,
          lte: end,
        },
        deliveryStatus: "DELIVERED",
      },
      include: {
        retailerShop: {
          include: {
            shop: true,
          },
        },
        retailerProduct: {
          include: {
            product: {
              include: {
                company: true,
              },
            },
          },
        },
      },
    });

    // Calculate GST for each transaction (assuming 18% GST rate)
    const GST_RATE = 0.18;
    let totalSalesValue = 0;
    let totalGSTCollected = 0;
    const taxBreakdown = [];

    salesData.forEach((sale) => {
      const baseAmount = sale.totalAmount / (1 + GST_RATE); // Remove GST to get base amount
      const gstAmount = sale.totalAmount - baseAmount;

      totalSalesValue += baseAmount;
      totalGSTCollected += gstAmount;

      taxBreakdown.push({
        date: sale.distributionDate,
        shop: sale.retailerShop.shop.name,
        product: sale.retailerProduct.product.name,
        quantity: sale.quantity,
        baseAmount: baseAmount,
        gstAmount: gstAmount,
        totalAmount: sale.totalAmount,
      });
    });

    // Get purchase data for input tax credit
    const purchaseTransactions = await prisma.retailerTransaction.findMany({
      where: {
        retailerId: retailerId,
        type: "PURCHASE",
        transactionDate: {
          gte: start,
          lte: end,
        },
      },
    });

    let totalPurchaseValue = 0;
    let totalInputTax = 0;

    purchaseTransactions.forEach((purchase) => {
      const baseAmount = purchase.amount / (1 + GST_RATE);
      const inputTax = purchase.amount - baseAmount;

      totalPurchaseValue += baseAmount;
      totalInputTax += inputTax;
    });

    const netGSTPayable = totalGSTCollected - totalInputTax;

    const reportData = {
      period: {
        startDate: start,
        endDate: end,
      },
      sales: {
        totalSalesValue: totalSalesValue,
        totalGSTCollected: totalGSTCollected,
        transactionCount: salesData.length,
      },
      purchases: {
        totalPurchaseValue: totalPurchaseValue,
        totalInputTax: totalInputTax,
        transactionCount: purchaseTransactions.length,
      },
      gstSummary: {
        gstCollected: totalGSTCollected,
        inputTaxCredit: totalInputTax,
        netGSTPayable: netGSTPayable,
        effectiveGSTRate:
          totalSalesValue > 0 ? (totalGSTCollected / totalSalesValue) * 100 : 0,
      },
      taxBreakdown: taxBreakdown,
    };

    // Save report to database
    await prisma.retailerReport.create({
      data: {
        retailerId: retailerId,
        reportType: "TAX_REPORT",
        title: `Tax Report - ${start.toDateString()} to ${end.toDateString()}`,
        filters: { startDate, endDate },
        data: reportData,
      },
    });

    if (format === "pdf") {
      const pdfPath = await generateTaxReportPDF(reportData, req.retailer);
      res.download(pdfPath);
    } else {
      res.json(reportData);
    }
  } catch (error) {
    console.error("Tax report error:", error);
    res.status(500).json({ error: "Failed to generate tax report" });
  }
};

// Generate Stock Valuation Report
exports.generateStockValuationReport = async (req, res) => {
  try {
    const retailerId = req.retailer.id;
    const { format = "json", valuationMethod = "FIFO" } = req.query;

    // Get all current inventory
    const inventory = await prisma.retailerInventory.findMany({
      where: {
        retailerId: retailerId,
        currentStock: {
          gt: 0,
        },
      },
      include: {
        retailerProduct: {
          include: {
            product: {
              include: {
                company: true,
              },
            },
          },
        },
      },
    });

    let totalStockValue = 0;
    const stockValuation = [];

    inventory.forEach((item) => {
      const currentStock = item.currentStock;
      const avgCostPrice = item.averageCostPrice || item.lastPurchasePrice || 0;
      const wholeSalePrice = item.retailerProduct.wholesalePrice || 0;
      const stockValue = currentStock * avgCostPrice;
      const potentialRevenue = currentStock * wholeSalePrice;

      totalStockValue += stockValue;

      stockValuation.push({
        product: {
          id: item.retailerProduct.product.id,
          name: item.retailerProduct.product.name,
          sku: item.retailerProduct.product.sku,
          company: item.retailerProduct.product.company.name,
          eyewearType: item.retailerProduct.product.eyewearType,
        },
        inventory: {
          currentStock: currentStock,
          reservedStock: item.reservedStock,
          inTransitStock: item.inTransitStock,
          warehouseLocation: item.warehouseLocation,
        },
        valuation: {
          unitCostPrice: avgCostPrice,
          unitWholesalePrice: wholeSalePrice,
          stockValue: stockValue,
          potentialRevenue: potentialRevenue,
          expectedProfit: potentialRevenue - stockValue,
          profitMargin:
            stockValue > 0
              ? ((potentialRevenue - stockValue) / stockValue) * 100
              : 0,
        },
        lastPurchase: {
          date: item.lastPurchaseDate,
          price: item.lastPurchasePrice,
          supplier: item.supplier,
        },
      });
    });

    // Group by company
    const companyValuation = {};
    stockValuation.forEach((item) => {
      const company = item.product.company;
      if (!companyValuation[company]) {
        companyValuation[company] = {
          productCount: 0,
          totalStock: 0,
          totalValue: 0,
          totalPotentialRevenue: 0,
        };
      }
      companyValuation[company].productCount += 1;
      companyValuation[company].totalStock += item.inventory.currentStock;
      companyValuation[company].totalValue += item.valuation.stockValue;
      companyValuation[company].totalPotentialRevenue +=
        item.valuation.potentialRevenue;
    });

    // Group by eyewear type
    const typeValuation = {};
    stockValuation.forEach((item) => {
      const type = item.product.eyewearType;
      if (!typeValuation[type]) {
        typeValuation[type] = {
          productCount: 0,
          totalStock: 0,
          totalValue: 0,
          totalPotentialRevenue: 0,
        };
      }
      typeValuation[type].productCount += 1;
      typeValuation[type].totalStock += item.inventory.currentStock;
      typeValuation[type].totalValue += item.valuation.stockValue;
      typeValuation[type].totalPotentialRevenue +=
        item.valuation.potentialRevenue;
    });

    const reportData = {
      generatedAt: new Date(),
      valuationMethod: valuationMethod,
      summary: {
        totalProducts: stockValuation.length,
        totalStockValue: totalStockValue,
        totalPotentialRevenue: stockValuation.reduce(
          (sum, item) => sum + item.valuation.potentialRevenue,
          0
        ),
        totalExpectedProfit: stockValuation.reduce(
          (sum, item) => sum + item.valuation.expectedProfit,
          0
        ),
      },
      stockValuation: stockValuation.sort(
        (a, b) => b.valuation.stockValue - a.valuation.stockValue
      ),
      companyBreakdown: Object.entries(companyValuation).map(
        ([company, data]) => ({
          company,
          ...data,
          averageValue: data.totalValue / data.productCount,
        })
      ),
      typeBreakdown: Object.entries(typeValuation).map(([type, data]) => ({
        eyewearType: type,
        ...data,
        averageValue: data.totalValue / data.productCount,
      })),
    };

    // Save report to database
    await prisma.retailerReport.create({
      data: {
        retailerId: retailerId,
        reportType: "STOCK_VALUATION",
        title: `Stock Valuation Report - ${new Date().toDateString()}`,
        filters: { valuationMethod },
        data: reportData,
      },
    });

    if (format === "pdf") {
      const pdfPath = await generateStockValuationPDF(reportData, req.retailer);
      res.download(pdfPath);
    } else {
      res.json(reportData);
    }
  } catch (error) {
    console.error("Stock valuation report error:", error);
    res
      .status(500)
      .json({ error: "Failed to generate stock valuation report" });
  }
};

// Get all reports for retailer
exports.getAllReports = async (req, res) => {
  try {
    const retailerId = req.retailer.id;
    const { reportType, page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;
    const where = { retailerId };

    if (reportType) {
      where.reportType = reportType;
    }

    const reports = await prisma.retailerReport.findMany({
      where,
      orderBy: {
        generatedAt: "desc",
      },
      skip: parseInt(skip),
      take: parseInt(limit),
    });

    const totalReports = await prisma.retailerReport.count({ where });

    res.json({
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalReports,
        pages: Math.ceil(totalReports / limit),
      },
    });
  } catch (error) {
    console.error("Get reports error:", error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
};

// Delete a report
exports.deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const retailerId = req.retailer.id;

    const report = await prisma.retailerReport.findFirst({
      where: {
        id: parseInt(reportId),
        retailerId: retailerId,
      },
    });

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    // Delete associated PDF file if exists
    if (report.filePath && fs.existsSync(report.filePath)) {
      fs.unlinkSync(report.filePath);
    }

    await prisma.retailerReport.delete({
      where: { id: parseInt(reportId) },
    });

    res.json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Delete report error:", error);
    res.status(500).json({ error: "Failed to delete report" });
  }
};

// Helper function to generate Profit & Loss PDF
async function generateProfitLossPDF(data, retailer) {
  return new Promise((resolve, reject) => {
    try {
      const fileName = `profit-loss-${Date.now()}.pdf`;
      const filePath = path.join(__dirname, "../../../temp", fileName);

      // Ensure temp directory exists
      const tempDir = path.dirname(filePath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20).text("Profit & Loss Report", 50, 50);
      doc
        .fontSize(12)
        .text(`${retailer.name} (${retailer.companyName})`, 50, 80);
      doc.text(
        `Period: ${data.period.startDate.toDateString()} to ${data.period.endDate.toDateString()}`,
        50,
        100
      );
      doc.text(`Generated on: ${new Date().toDateString()}`, 50, 120);

      // Revenue Section
      doc.fontSize(16).text("Revenue", 50, 160);
      doc
        .fontSize(12)
        .text(`Total Sales: ₹${data.revenue.totalSales.toFixed(2)}`, 70, 180)
        .text(`Refunds: ₹${data.revenue.refunds.toFixed(2)}`, 70, 200)
        .text(`Net Revenue: ₹${data.revenue.netRevenue.toFixed(2)}`, 70, 220);

      // Costs Section
      doc.fontSize(16).text("Costs", 50, 260);
      doc
        .fontSize(12)
        .text(
          `Cost of Goods Sold: ₹${data.costs.costOfGoodsSold.toFixed(2)}`,
          70,
          280
        )
        .text(
          `Operating Expenses: ₹${data.costs.operatingExpenses.toFixed(2)}`,
          70,
          300
        )
        .text(`Total Costs: ₹${data.costs.totalCosts.toFixed(2)}`, 70, 320);

      // Profit Section
      doc.fontSize(16).text("Profit Analysis", 50, 360);
      doc
        .fontSize(12)
        .text(`Gross Profit: ₹${data.profit.grossProfit.toFixed(2)}`, 70, 380)
        .text(
          `Gross Profit Margin: ${data.profit.grossProfitMargin.toFixed(2)}%`,
          70,
          400
        )
        .text(`Net Profit: ₹${data.profit.netProfit.toFixed(2)}`, 70, 420)
        .text(
          `Net Profit Margin: ${data.profit.netProfitMargin.toFixed(2)}%`,
          70,
          440
        );

      doc.end();

      stream.on("finish", () => {
        resolve(filePath);
      });

      stream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
}

// Helper function to generate Tax Report PDF
async function generateTaxReportPDF(data, retailer) {
  return new Promise((resolve, reject) => {
    try {
      const fileName = `tax-report-${Date.now()}.pdf`;
      const filePath = path.join(__dirname, "../../../temp", fileName);

      const tempDir = path.dirname(filePath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20).text("Tax Report", 50, 50);
      doc
        .fontSize(12)
        .text(`${retailer.name} (${retailer.companyName})`, 50, 80);
      doc.text(
        `Period: ${data.period.startDate.toDateString()} to ${data.period.endDate.toDateString()}`,
        50,
        100
      );

      // GST Summary
      doc.fontSize(16).text("GST Summary", 50, 140);
      doc
        .fontSize(12)
        .text(
          `GST Collected: ₹${data.gstSummary.gstCollected.toFixed(2)}`,
          70,
          160
        )
        .text(
          `Input Tax Credit: ₹${data.gstSummary.inputTaxCredit.toFixed(2)}`,
          70,
          180
        )
        .text(
          `Net GST Payable: ₹${data.gstSummary.netGSTPayable.toFixed(2)}`,
          70,
          200
        )
        .text(
          `Effective GST Rate: ${data.gstSummary.effectiveGSTRate.toFixed(2)}%`,
          70,
          220
        );

      doc.end();

      stream.on("finish", () => {
        resolve(filePath);
      });

      stream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
}

// Helper function to generate Stock Valuation PDF
async function generateStockValuationPDF(data, retailer) {
  return new Promise((resolve, reject) => {
    try {
      const fileName = `stock-valuation-${Date.now()}.pdf`;
      const filePath = path.join(__dirname, "../../../temp", fileName);

      const tempDir = path.dirname(filePath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20).text("Stock Valuation Report", 50, 50);
      doc
        .fontSize(12)
        .text(`${retailer.name} (${retailer.companyName})`, 50, 80);
      doc.text(`Generated on: ${data.generatedAt.toDateString()}`, 50, 100);

      // Summary
      doc.fontSize(16).text("Summary", 50, 140);
      doc
        .fontSize(12)
        .text(`Total Products: ${data.summary.totalProducts}`, 70, 160)
        .text(
          `Total Stock Value: ₹${data.summary.totalStockValue.toFixed(2)}`,
          70,
          180
        )
        .text(
          `Potential Revenue: ₹${data.summary.totalPotentialRevenue.toFixed(
            2
          )}`,
          70,
          200
        )
        .text(
          `Expected Profit: ₹${data.summary.totalExpectedProfit.toFixed(2)}`,
          70,
          220
        );

      doc.end();

      stream.on("finish", () => {
        resolve(filePath);
      });

      stream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
}
