const { PrismaClient } = require("@prisma/client");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

const prisma = new PrismaClient();

// ===== DASHBOARD METRICS =====

/**
 * Get Dashboard Overview Metrics
 */
exports.getDashboardMetrics = async (shopId) => {
  try {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get today's metrics
    const todayMetrics = await Promise.all([
      // Today's sales
      prisma.invoice.aggregate({
        where: {
          createdAt: { gte: startOfToday },
          staff: { shopId },
        },
        _sum: { totalAmount: true },
        _count: true,
      }),

      // Today's patients
      prisma.patientVisit.count({
        where: {
          visitDate: { gte: startOfToday },
          shopId,
        },
      }),

      // Active staff count
      prisma.staff.count({
        where: {
          shopId,
        },
      }),

      // Current inventory value
      prisma.shopInventory.aggregate({
        where: { shopId },
        _sum: {
          quantity: true,
        },
      }),
    ]);

    // Get monthly comparison
    const monthlyMetrics = await Promise.all([
      // This month sales
      prisma.invoice.aggregate({
        where: {
          createdAt: { gte: startOfMonth },
          staff: { shopId },
        },
        _sum: { totalAmount: true },
        _count: true,
      }),

      // Last month sales
      prisma.invoice.aggregate({
        where: {
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
            lt: startOfMonth,
          },
          staff: { shopId },
        },
        _sum: { totalAmount: true },
        _count: true,
      }),
    ]);

    // Calculate growth percentages
    const salesGrowth = monthlyMetrics[1]._sum.totalAmount
      ? ((monthlyMetrics[0]._sum.totalAmount -
          monthlyMetrics[1]._sum.totalAmount) /
          monthlyMetrics[1]._sum.totalAmount) *
        100
      : 0;

    const orderGrowth = monthlyMetrics[1]._count
      ? ((monthlyMetrics[0]._count - monthlyMetrics[1]._count) /
          monthlyMetrics[1]._count) *
        100
      : 0;

    // Get low stock alerts
    const lowStockCount = await prisma.shopInventory.count({
      where: {
        shopId,
        quantity: { lte: 10 }, // Assuming low stock threshold is 10
      },
    });

    return {
      today: {
        sales: todayMetrics[0]._sum.totalAmount || 0,
        orders: todayMetrics[0]._count || 0,
        patients: todayMetrics[1] || 0,
        staff: todayMetrics[2] || 0,
      },
      monthly: {
        sales: monthlyMetrics[0]._sum.totalAmount || 0,
        orders: monthlyMetrics[0]._count || 0,
        salesGrowth: parseFloat(salesGrowth.toFixed(2)),
        orderGrowth: parseFloat(orderGrowth.toFixed(2)),
      },
      inventory: {
        totalProducts: todayMetrics[3]._sum.quantity || 0,
        lowStockAlerts: lowStockCount,
      },
    };
  } catch (error) {
    console.error("Dashboard Metrics Error:", error);
    throw new Error("Failed to fetch dashboard metrics");
  }
};

/**
 * Get Business Growth Data for Charts
 */
exports.getDashboardGrowth = async (shopId, period = "monthly") => {
  try {
    const now = new Date();
    let dateRanges = [];

    if (period === "daily") {
      // Last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        dateRanges.push({
          start: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          end: new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate() + 1
          ),
          label: date.toLocaleDateString(),
        });
      }
    } else {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(
          now.getFullYear(),
          now.getMonth() - i + 1,
          1
        );
        dateRanges.push({
          start: date,
          end: nextMonth,
          label: date.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
        });
      }
    }

    const growthData = await Promise.all(
      dateRanges.map(async (range) => {
        const [sales, patients] = await Promise.all([
          prisma.invoice.aggregate({
            where: {
              createdAt: {
                gte: range.start,
                lt: range.end,
              },
              staff: { shopId },
            },
            _sum: { totalAmount: true },
            _count: true,
          }),
          prisma.patientVisit.count({
            where: {
              visitDate: {
                gte: range.start,
                lt: range.end,
              },
              shopId,
            },
          }),
        ]);

        return {
          period: range.label,
          sales: sales._sum.totalAmount || 0,
          orders: sales._count || 0,
          patients: patients || 0,
        };
      })
    );

    return growthData;
  } catch (error) {
    console.error("Dashboard Growth Error:", error);
    throw new Error("Failed to fetch growth data");
  }
};

/**
 * Get Recent Activities
 */
exports.getRecentActivities = async (shopId) => {
  try {
    const [recentInvoices, recentAttendance, recentInventory] =
      await Promise.all([
        // Recent invoices
        prisma.invoice.findMany({
          where: { staff: { shopId } },
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            staff: { select: { name: true } },
            patient: { select: { name: true } },
          },
        }),

        // Recent attendance
        prisma.attendance.findMany({
          where: { staff: { shopId } },
          take: 5,
          orderBy: { checkIn: "desc" },
          include: {
            staff: { select: { name: true } },
          },
        }),

        // Recent inventory movements
        prisma.stockMovement.findMany({
          where: { shopId },
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            product: { select: { name: true } },
          },
        }),
      ]);

    const activities = [
      ...recentInvoices.map((invoice) => ({
        type: "sale",
        message: `${invoice.staff.name} created invoice #${invoice.id} for ${invoice.patient.name}`,
        amount: invoice.totalAmount,
        timestamp: invoice.createdAt,
      })),
      ...recentAttendance.map((attendance) => ({
        type: "attendance",
        message: `${attendance.staff.name} checked in`,
        timestamp: attendance.checkIn,
      })),
      ...recentInventory.map((movement) => ({
        type: "inventory",
        message: `${movement.product.name} - ${movement.type} (${movement.quantity} units)`,
        timestamp: movement.createdAt,
      })),
    ];

    // Sort by timestamp and return latest 10
    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);
  } catch (error) {
    console.error("Recent Activities Error:", error);
    throw new Error("Failed to fetch recent activities");
  }
};

// ===== STAFF REPORTS =====

/**
 * Get Staff Attendance Report
 */
exports.getStaffAttendanceReport = async (
  shopId,
  { startDate, endDate, staffId }
) => {
  try {
    const whereClause = {
      staff: { shopId },
    };

    if (startDate && endDate) {
      whereClause.checkIn = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (staffId) {
      whereClause.staffId = parseInt(staffId);
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        staff: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { checkIn: "desc" },
    });

    // Group by staff and calculate metrics
    const staffMetrics = {};

    attendanceRecords.forEach((record) => {
      const staffKey = record.staffId;
      if (!staffMetrics[staffKey]) {
        staffMetrics[staffKey] = {
          staff: record.staff,
          totalDays: 0,
          totalHours: 0,
          avgHours: 0,
          records: [],
        };
      }

      const hoursWorked = record.checkOut
        ? (new Date(record.checkOut) - new Date(record.checkIn)) /
          (1000 * 60 * 60)
        : 0;

      staffMetrics[staffKey].totalDays++;
      staffMetrics[staffKey].totalHours += hoursWorked;
      staffMetrics[staffKey].records.push({
        date: record.checkIn,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        hoursWorked: parseFloat(hoursWorked.toFixed(2)),
      });
    });

    // Calculate averages
    Object.keys(staffMetrics).forEach((staffKey) => {
      const metrics = staffMetrics[staffKey];
      metrics.avgHours =
        metrics.totalDays > 0
          ? parseFloat((metrics.totalHours / metrics.totalDays).toFixed(2))
          : 0;
      metrics.totalHours = parseFloat(metrics.totalHours.toFixed(2));
    });

    return Object.values(staffMetrics);
  } catch (error) {
    console.error("Staff Attendance Report Error:", error);
    throw new Error("Failed to generate staff attendance report");
  }
};

/**
 * Get Staff Performance Report
 */
exports.getStaffPerformanceReport = async (shopId, { startDate, endDate }) => {
  try {
    const whereClause = {
      staff: { shopId },
    };

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Get sales performance by staff
    const salesByStaff = await prisma.invoice.groupBy({
      by: ["staffId"],
      where: whereClause,
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
    });

    // Get staff details
    const staffDetails = await prisma.staff.findMany({
      where: { shopId },
      select: { id: true, name: true, email: true, role: true },
    });

    const performance = salesByStaff.map((sales) => {
      const staff = staffDetails.find((s) => s.id === sales.staffId);
      return {
        staff,
        totalSales: sales._sum.totalAmount || 0,
        totalOrders: sales._count || 0,
        avgOrderValue:
          sales._count > 0
            ? parseFloat((sales._sum.totalAmount / sales._count).toFixed(2))
            : 0,
      };
    });

    // Sort by total sales
    return performance.sort((a, b) => b.totalSales - a.totalSales);
  } catch (error) {
    console.error("Staff Performance Report Error:", error);
    throw new Error("Failed to generate staff performance report");
  }
};

// ===== SALES REPORTS =====

/**
 * Get Sales Report
 */
exports.getSalesReport = async (shopId, { period, startDate, endDate }) => {
  try {
    const whereClause = {
      staff: { shopId },
    };

    // Set date range based on period or custom dates
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (period) {
      const now = new Date();
      switch (period) {
        case "today":
          whereClause.createdAt = {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          };
          break;
        case "week":
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          whereClause.createdAt = { gte: weekStart };
          break;
        case "month":
          whereClause.createdAt = {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
          };
          break;
        case "year":
          whereClause.createdAt = {
            gte: new Date(now.getFullYear(), 0, 1),
          };
          break;
      }
    }

    const [salesSummary, salesDetails] = await Promise.all([
      // Sales summary
      prisma.invoice.aggregate({
        where: whereClause,
        _sum: {
          totalAmount: true,
          subtotal: true,
          taxAmount: true,
        },
        _count: true,
        _avg: {
          totalAmount: true,
        },
      }),

      // Detailed sales
      prisma.invoice.findMany({
        where: whereClause,
        include: {
          staff: { select: { name: true } },
          patient: { select: { name: true } },
          items: {
            include: {
              product: { select: { name: true, sku: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      summary: {
        totalSales: salesSummary._sum.totalAmount || 0,
        totalOrders: salesSummary._count || 0,
        avgOrderValue: salesSummary._avg.totalAmount || 0,
        totalTax: salesSummary._sum.taxAmount || 0,
        subtotal: salesSummary._sum.subtotal || 0,
      },
      details: salesDetails.map((invoice) => ({
        id: invoice.id,
        date: invoice.createdAt,
        staff: invoice.staff.name,
        patient: invoice.patient.name,
        amount: invoice.totalAmount,
        items: invoice.items.length,
        products: invoice.items.map((item) => ({
          name: item.product.name,
          sku: item.product.sku,
          quantity: item.quantity,
          price: item.price,
        })),
      })),
    };
  } catch (error) {
    console.error("Sales Report Error:", error);
    throw new Error("Failed to generate sales report");
  }
};

/**
 * Get Product Sales Report
 */
exports.getProductSalesReport = async (
  shopId,
  { startDate, endDate, productId }
) => {
  try {
    const whereClause = {
      invoice: {
        staff: { shopId },
      },
    };

    if (startDate && endDate) {
      whereClause.invoice.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (productId) {
      whereClause.productId = parseInt(productId);
    }

    const productSales = await prisma.invoiceItem.groupBy({
      by: ["productId"],
      where: whereClause,
      _sum: {
        quantity: true,
        price: true,
      },
      _count: {
        id: true,
      },
    });

    // Get product details
    const productIds = productSales.map((p) => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        sku: true,
        category: true,
        company: true,
      },
    });

    const report = productSales.map((sales) => {
      const product = products.find((p) => p.id === sales.productId);
      return {
        product,
        totalQuantitySold: sales._sum.quantity || 0,
        totalRevenue: sales._sum.price || 0,
        totalTransactions: sales._count || 0,
        avgPricePerUnit:
          sales._sum.quantity > 0
            ? parseFloat((sales._sum.price / sales._sum.quantity).toFixed(2))
            : 0,
      };
    });

    return report.sort((a, b) => b.totalRevenue - a.totalRevenue);
  } catch (error) {
    console.error("Product Sales Report Error:", error);
    throw new Error("Failed to generate product sales report");
  }
};

/**
 * Get Sales by Staff Report
 */
exports.getSalesByStaffReport = async (shopId, { startDate, endDate }) => {
  try {
    const whereClause = {
      staff: { shopId },
    };

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const salesByStaff = await prisma.invoice.groupBy({
      by: ["staffId"],
      where: whereClause,
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
    });

    // Get staff details and their sales
    const staffIds = salesByStaff.map((s) => s.staffId);
    const staffDetails = await prisma.staff.findMany({
      where: { id: { in: staffIds } },
      select: { id: true, name: true, email: true, role: true },
    });

    const report = salesByStaff.map((sales) => {
      const staff = staffDetails.find((s) => s.id === sales.staffId);
      return {
        staff,
        totalSales: sales._sum.totalAmount || 0,
        totalOrders: sales._count || 0,
        avgOrderValue:
          sales._count > 0
            ? parseFloat((sales._sum.totalAmount / sales._count).toFixed(2))
            : 0,
      };
    });

    return report.sort((a, b) => b.totalSales - a.totalSales);
  } catch (error) {
    console.error("Sales by Staff Report Error:", error);
    throw new Error("Failed to generate sales by staff report");
  }
};

// ===== INVENTORY REPORTS =====

/**
 * Get Inventory Report
 */
exports.getInventoryReport = async (shopId, { type, startDate, endDate }) => {
  try {
    const whereClause = { shopId };

    if (type && type !== "all") {
      whereClause.type = type.toUpperCase();
    }

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const movements = await prisma.stockMovement.findMany({
      where: whereClause,
      include: {
        product: {
          select: { id: true, name: true, sku: true, category: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by product and type
    const summary = {};
    movements.forEach((movement) => {
      const key = `${movement.productId}-${movement.type}`;
      if (!summary[key]) {
        summary[key] = {
          product: movement.product,
          type: movement.type,
          totalQuantity: 0,
          movements: [],
        };
      }
      summary[key].totalQuantity += movement.quantity;
      summary[key].movements.push({
        id: movement.id,
        quantity: movement.quantity,
        notes: movement.notes,
        date: movement.createdAt,
      });
    });

    return {
      summary: Object.values(summary),
      details: movements,
    };
  } catch (error) {
    console.error("Inventory Report Error:", error);
    throw new Error("Failed to generate inventory report");
  }
};

/**
 * Get Stock Status Report
 */
exports.getStockStatusReport = async (shopId) => {
  try {
    const inventory = await prisma.shopInventory.findMany({
      where: { shopId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            category: true,
            company: true,
          },
        },
      },
    });

    const categorized = {
      inStock: inventory.filter((item) => item.quantity > 10),
      lowStock: inventory.filter(
        (item) => item.quantity > 0 && item.quantity <= 10
      ),
      outOfStock: inventory.filter((item) => item.quantity === 0),
    };

    return {
      summary: {
        totalProducts: inventory.length,
        inStock: categorized.inStock.length,
        lowStock: categorized.lowStock.length,
        outOfStock: categorized.outOfStock.length,
      },
      categorized,
    };
  } catch (error) {
    console.error("Stock Status Report Error:", error);
    throw new Error("Failed to generate stock status report");
  }
};

/**
 * Get Low Stock Alerts
 */
exports.getLowStockAlerts = async (shopId) => {
  try {
    const lowStockItems = await prisma.shopInventory.findMany({
      where: {
        shopId,
        quantity: { lte: 10 },
      },
      include: {
        product: {
          select: { id: true, name: true, sku: true, category: true },
        },
      },
      orderBy: { quantity: "asc" },
    });

    return lowStockItems.map((item) => ({
      product: item.product,
      currentStock: item.quantity,
      alertLevel:
        item.quantity === 0
          ? "critical"
          : item.quantity <= 5
          ? "high"
          : "medium",
      lastUpdated: item.updatedAt,
    }));
  } catch (error) {
    console.error("Low Stock Alerts Error:", error);
    throw new Error("Failed to fetch low stock alerts");
  }
};

// ===== PATIENT REPORTS =====

/**
 * Get Patient Report
 */
exports.getPatientReport = async (shopId, { type, startDate, endDate }) => {
  try {
    const whereClause = {};

    if (type === "new" && startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [patients, visits] = await Promise.all([
      prisma.patient.findMany({
        where: whereClause,
        include: {
          invoices: {
            where: { staff: { shopId } },
            select: { id: true, totalAmount: true, createdAt: true },
          },
          prescriptions: {
            where: { staff: { shopId } },
            select: { id: true, createdAt: true },
          },
        },
      }),

      prisma.patientVisit.findMany({
        where: {
          shopId,
          ...(startDate &&
            endDate && {
              visitDate: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            }),
        },
        include: {
          patient: { select: { id: true, name: true } },
        },
      }),
    ]);

    const patientMetrics = patients.map((patient) => ({
      id: patient.id,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      registrationDate: patient.createdAt,
      totalSpent: patient.invoices.reduce(
        (sum, inv) => sum + inv.totalAmount,
        0
      ),
      totalOrders: patient.invoices.length,
      totalPrescriptions: patient.prescriptions.length,
      lastVisit:
        patient.invoices.length > 0
          ? patient.invoices[patient.invoices.length - 1].createdAt
          : null,
    }));

    return {
      summary: {
        totalPatients: patients.length,
        newPatients: type === "new" ? patients.length : 0,
        totalVisits: visits.length,
        avgSpendPerPatient:
          patients.length > 0
            ? patientMetrics.reduce((sum, p) => sum + p.totalSpent, 0) /
              patients.length
            : 0,
      },
      patients: patientMetrics,
      visits: visits.map((visit) => ({
        id: visit.id,
        patient: visit.patient,
        visitDate: visit.visitDate,
        purpose: visit.purpose,
        notes: visit.notes,
      })),
    };
  } catch (error) {
    console.error("Patient Report Error:", error);
    throw new Error("Failed to generate patient report");
  }
};

/**
 * Get Patient Visit History
 */
exports.getPatientVisitHistory = async (
  shopId,
  { patientId, startDate, endDate }
) => {
  try {
    const whereClause = { shopId };

    if (patientId) {
      whereClause.patientId = parseInt(patientId);
    }

    if (startDate && endDate) {
      whereClause.visitDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const visits = await prisma.patientVisit.findMany({
      where: whereClause,
      include: {
        patient: {
          select: { id: true, name: true, age: true, phone: true },
        },
      },
      orderBy: { visitDate: "desc" },
    });

    return visits;
  } catch (error) {
    console.error("Patient Visit History Error:", error);
    throw new Error("Failed to fetch patient visit history");
  }
};

// ===== STAFF MANAGEMENT =====

/**
 * Get All Staff Under Shop
 */
exports.getAllStaff = async (shopId) => {
  try {
    const staff = await prisma.staff.findMany({
      where: { shopId },
      include: {
        attendance: {
          take: 1,
          orderBy: { checkIn: "desc" },
        },
        invoices: {
          select: { id: true, totalAmount: true },
        },
      },
    });

    return staff.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      isActive: member.isActive,
      lastAttendance: member.attendance[0] || null,
      totalSales: member.invoices.reduce(
        (sum, inv) => sum + inv.totalAmount,
        0
      ),
      totalOrders: member.invoices.length,
      joinDate: member.createdAt,
    }));
  } catch (error) {
    console.error("Get All Staff Error:", error);
    throw new Error("Failed to fetch staff data");
  }
};

/**
 * Get Staff Details
 */
exports.getStaffDetails = async (shopId, staffId) => {
  try {
    const staff = await prisma.staff.findFirst({
      where: { id: staffId, shopId },
      include: {
        attendance: {
          orderBy: { checkIn: "desc" },
          take: 10,
        },
        invoices: {
          include: {
            patient: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        prescriptions: {
          include: {
            patient: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!staff) {
      throw new Error("Staff member not found");
    }

    return staff;
  } catch (error) {
    console.error("Get Staff Details Error:", error);
    throw new Error("Failed to fetch staff details");
  }
};

/**
 * Get Staff Activities
 */
exports.getStaffActivities = async (
  shopId,
  { staffId, startDate, endDate }
) => {
  try {
    const whereClause = { staff: { shopId } };

    if (staffId) {
      whereClause.staffId = parseInt(staffId);
    }

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [invoices, prescriptions, attendance] = await Promise.all([
      prisma.invoice.findMany({
        where: whereClause,
        include: {
          staff: { select: { name: true } },
          patient: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),

      prisma.prescription.findMany({
        where: whereClause,
        include: {
          staff: { select: { name: true } },
          patient: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),

      prisma.attendance.findMany({
        where: {
          staff: { shopId },
          ...(staffId && { staffId: parseInt(staffId) }),
          ...(startDate &&
            endDate && {
              checkIn: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            }),
        },
        include: {
          staff: { select: { name: true } },
        },
        orderBy: { checkIn: "desc" },
      }),
    ]);

    const activities = [
      ...invoices.map((invoice) => ({
        type: "invoice",
        staff: invoice.staff.name,
        description: `Created invoice #${invoice.id} for ${invoice.patient.name}`,
        amount: invoice.totalAmount,
        timestamp: invoice.createdAt,
      })),
      ...prescriptions.map((prescription) => ({
        type: "prescription",
        staff: prescription.staff.name,
        description: `Created prescription for ${prescription.patient.name}`,
        timestamp: prescription.createdAt,
      })),
      ...attendance.map((record) => ({
        type: "attendance",
        staff: record.staff.name,
        description: `${record.checkOut ? "Checked out" : "Checked in"}`,
        timestamp: record.checkOut || record.checkIn,
      })),
    ];

    return activities.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
  } catch (error) {
    console.error("Staff Activities Error:", error);
    throw new Error("Failed to fetch staff activities");
  }
};

// ===== INVENTORY MANAGEMENT =====

/**
 * Stock In - Add products to shop inventory
 */
exports.stockIn = async (shopId, { productId, quantity, notes, adminId }) => {
  try {
    return await prisma.$transaction(async (prisma) => {
      // Check if product inventory exists
      let inventory = await prisma.shopInventory.findFirst({
        where: { shopId, productId },
      });

      if (inventory) {
        // Update existing inventory
        inventory = await prisma.shopInventory.update({
          where: { id: inventory.id },
          data: { quantity: inventory.quantity + quantity },
        });
      } else {
        // Create new inventory record
        inventory = await prisma.shopInventory.create({
          data: { shopId, productId, quantity },
        });
      }

      // Record stock movement
      await prisma.stockMovement.create({
        data: {
          shopId,
          productId,
          type: "STOCK_IN",
          quantity,
          notes: notes || `Stock added by admin`,
          createdBy: adminId,
        },
      });

      return inventory;
    });
  } catch (error) {
    console.error("Stock In Error:", error);
    throw new Error("Failed to add stock");
  }
};

/**
 * Adjust Stock - Manual stock adjustment
 */
exports.adjustStock = async (
  shopId,
  { productId, newQuantity, reason, adminId }
) => {
  try {
    return await prisma.$transaction(async (prisma) => {
      // Get current inventory
      let inventory = await prisma.shopInventory.findFirst({
        where: { shopId, productId },
      });

      const oldQuantity = inventory ? inventory.quantity : 0;
      const difference = newQuantity - oldQuantity;

      if (inventory) {
        // Update existing inventory
        inventory = await prisma.shopInventory.update({
          where: { id: inventory.id },
          data: { quantity: newQuantity },
        });
      } else {
        // Create new inventory record
        inventory = await prisma.shopInventory.create({
          data: { shopId, productId, quantity: newQuantity },
        });
      }

      // Record stock movement
      await prisma.stockMovement.create({
        data: {
          shopId,
          productId,
          type: difference > 0 ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT",
          quantity: Math.abs(difference),
          notes: reason || "Manual stock adjustment",
          createdBy: adminId,
        },
      });

      return inventory;
    });
  } catch (error) {
    console.error("Stock Adjustment Error:", error);
    throw new Error("Failed to adjust stock");
  }
};

/**
 * Get Current Inventory Status
 */
exports.getInventoryStatus = async (shopId) => {
  try {
    const inventory = await prisma.shopInventory.findMany({
      where: { shopId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            category: true,
            company: true,
            price: true,
          },
        },
      },
      orderBy: { quantity: "asc" },
    });

    return inventory.map((item) => ({
      id: item.id,
      product: item.product,
      quantity: item.quantity,
      value: item.quantity * item.product.price,
      status:
        item.quantity === 0
          ? "out_of_stock"
          : item.quantity <= 5
          ? "critical"
          : item.quantity <= 10
          ? "low"
          : "good",
      lastUpdated: item.updatedAt,
    }));
  } catch (error) {
    console.error("Get Inventory Status Error:", error);
    throw new Error("Failed to fetch inventory status");
  }
};

// ===== EXPORT FUNCTIONS =====

/**
 * Export Report as PDF
 */
exports.exportReportPDF = async (shopId, reportType, params) => {
  try {
    // This is a simplified implementation
    // You would need to implement specific PDF generation for each report type
    const doc = new PDFDocument();
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {});

    doc.fontSize(20).text(`${reportType.toUpperCase()} REPORT`, 100, 100);
    doc
      .fontSize(12)
      .text(`Generated on: ${new Date().toLocaleString()}`, 100, 140);

    // Add more specific content based on reportType
    doc.text(
      "Report data would be rendered here based on the report type.",
      100,
      180
    );

    doc.end();

    return Buffer.concat(buffers);
  } catch (error) {
    console.error("Export PDF Error:", error);
    throw new Error("Failed to export PDF");
  }
};

/**
 * Export Report as Excel
 */
exports.exportReportExcel = async (shopId, reportType, params) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(reportType);

    // Add headers
    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Date", key: "date", width: 15 },
      { header: "Description", key: "description", width: 30 },
      { header: "Amount", key: "amount", width: 15 },
    ];

    // Add sample data - you would replace this with actual report data
    worksheet.addRow({
      id: 1,
      date: new Date(),
      description: "Sample data for " + reportType,
      amount: 100,
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  } catch (error) {
    console.error("Export Excel Error:", error);
    throw new Error("Failed to export Excel");
  }
};
