const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Define the price tiers. These can be adjusted as needed.
const PRICE_TIERS = {
  low: { max: 50 },
  medium: { min: 50, max: 500 },
  high: { min: 500 },
};

exports.getBestSellersByPriceTier = async (req, res) => {
  const { startDate, endDate, limit = 5 } = req.query;
  const take = parseInt(limit, 10);

  const dateFilter = {};
  if (startDate) dateFilter.gte = new Date(startDate);
  if (endDate) dateFilter.lte = new Date(endDate);

  try {
    const items = await prisma.invoiceItem.findMany({
      where: {
        invoice: {
          createdAt: dateFilter,
          staff: {
            shopId: req.user.shopId, // Filter by user's shop
          },
        },
      },
      include: {
        product: true,
      },
    });

    const productSales = {};

    for (const item of items) {
      if (!productSales[item.productId]) {
        productSales[item.productId] = {
          productName: item.product.name,
          totalQuantity: 0,
          unitPrice: item.unitPrice,
        };
      }
      productSales[item.productId].totalQuantity += item.quantity;
    }

    const bestSellers = {
      low: [],
      medium: [],
      high: [],
    };

    for (const productId in productSales) {
      const sale = productSales[productId];
      if (sale.unitPrice < PRICE_TIERS.low.max) {
        bestSellers.low.push(sale);
      } else if (
        sale.unitPrice >= PRICE_TIERS.medium.min &&
        sale.unitPrice < PRICE_TIERS.medium.max
      ) {
        bestSellers.medium.push(sale);
      } else if (sale.unitPrice >= PRICE_TIERS.high.min) {
        bestSellers.high.push(sale);
      }
    }

    // Sort and limit the results for each tier
    bestSellers.low
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .splice(take);
    bestSellers.medium
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .splice(take);
    bestSellers.high
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .splice(take);

    res.status(200).json({
      tierDefinitions: PRICE_TIERS,
      bestSellers,
    });
  } catch (error) {
    console.error("Error generating best sellers report:", error);
    res.status(500).json({ error: "Failed to generate best sellers report." });
  }
};

exports.getSalesByPriceTier = async (req, res) => {
  const { startDate, endDate } = req.query;

  // Build the date filter for the query
  const dateFilter = {};
  if (startDate) {
    dateFilter.gte = new Date(startDate);
  }
  if (endDate) {
    dateFilter.lte = new Date(endDate);
  }

  try {
    // Fetch all invoice items within the date range
    const items = await prisma.invoiceItem.findMany({
      where: {
        invoice: {
          createdAt: dateFilter,
        },
      },
      select: {
        quantity: true,
        unitPrice: true,
      },
    });

    // Initialize counters for each tier
    const salesByTier = {
      low: { count: 0 },
      medium: { count: 0 },
      high: { count: 0 },
    };

    // Categorize each item and aggregate the quantities
    for (const item of items) {
      if (item.unitPrice < PRICE_TIERS.low.max) {
        salesByTier.low.count += item.quantity;
      } else if (
        item.unitPrice >= PRICE_TIERS.medium.min &&
        item.unitPrice < PRICE_TIERS.medium.max
      ) {
        salesByTier.medium.count += item.quantity;
      } else if (item.unitPrice >= PRICE_TIERS.high.min) {
        salesByTier.high.count += item.quantity;
      }
    }

    res.status(200).json({
      tierDefinitions: PRICE_TIERS,
      salesByTier,
    });
  } catch (error) {
    console.error("Error generating sales by price tier report:", error);
    res.status(500).json({ error: "Failed to generate sales report." });
  }
};

exports.getDailyReport = async (req, res) => {
  const { date } = req.query;
  const startDate = new Date(date);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);

  try {
    const attendance = await prisma.attendance.findMany({
      where: {
        loginTime: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        staff: true,
      },
    });

    const inventory = await prisma.shopInventory.findMany({
      where: {
        shopId: req.user.shopId,
      },
      include: {
        product: true,
      },
    });

    res.status(200).json({ attendance, inventory });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

exports.getMonthlyReport = async (req, res) => {
  const { year, month } = req.query;
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  try {
    const attendance = await prisma.attendance.findMany({
      where: {
        loginTime: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        staff: true,
      },
    });

    const inventory = await prisma.shopInventory.findMany({
      where: {
        shopId: req.user.shopId,
      },
      include: {
        product: true,
      },
    });

    res.status(200).json({ attendance, inventory });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

exports.getStaffSalesReport = async (req, res) => {
  const { startDate, endDate } = req.query;

  const where = {};
  if (startDate) {
    where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
  }
  if (endDate) {
    where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
  }

  try {
    const salesByStaff = await prisma.invoice.groupBy({
      by: ["staffId"],
      where,
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
    });

    // Get staff details
    const staffIds = salesByStaff.map((sale) => sale.staffId);
    const staffDetails = await prisma.staff.findMany({
      where: {
        id: {
          in: staffIds,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const staffMap = staffDetails.reduce((map, staff) => {
      map[staff.id] = staff;
      return map;
    }, {});

    const report = salesByStaff.map((sale) => ({
      staff: staffMap[sale.staffId],
      totalSales: sale._sum.totalAmount,
      invoiceCount: sale._count.id,
    }));

    res.status(200).json(report);
  } catch (error) {
    console.error("Error generating staff sales report:", error);
    res.status(500).json({ error: "Failed to generate staff sales report." });
  }
};
