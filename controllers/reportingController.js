
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

    const inventory = await prisma.inventory.findMany({
      include: {
        product: true,
      },
    });

    res.status(200).json({ attendance, inventory });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
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

    const inventory = await prisma.inventory.findMany({
      include: {
        product: true,
      },
    });

    res.status(200).json({ attendance, inventory });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
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
      by: ['staffId'],
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
    console.error('Error generating staff sales report:', error);
    res.status(500).json({ error: 'Failed to generate staff sales report.' });
  }
};
