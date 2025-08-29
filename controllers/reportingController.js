
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
