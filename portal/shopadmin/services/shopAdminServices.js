const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ShopAdminService {
    async getDashboardMetrics(shopId) {
        const totalSale = await prisma.invoice.aggregate({
            _sum: { totalAmount: true },
            where: { shopId: shopId },
        });

        const categorySale = await prisma.invoice.findMany({
            where: { shopId: shopId },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        const recentPatients = await prisma.patient.findMany({
            where: { invoices: { some: { shopId: shopId } } },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });

        const activePatients = await prisma.patient.count({
            where: { invoices: { some: { shopId: shopId } } },
        });

        const staffLogins = await prisma.attendance.count({
            where: {
                shopStaff: {
                    shopId: shopId,
                },
            },
        });

        const doctorLogins = await prisma.attendance.count({
            where: {
                doctor: {
                    shopId: shopId,
                },
            },
        });

        return {
            totalSale: totalSale._sum.totalAmount || 0,
            categorySale: this.calculateCategorySale(categorySale),
            recentPatients,
            activePatients,
            staffLogins,
            doctorLogins,
        };
    }

    calculateCategorySale(invoices) {
        const categorySale = {};
        for (const invoice of invoices) {
            for (const item of invoice.items) {
                const category = item.product.eyewearType;
                if (category in categorySale) {
                    categorySale[category] += item.totalPrice;
                } else {
                    categorySale[category] = item.totalPrice;
                }
            }
        }
        return categorySale;
    }

    async getDashboardCalendar(shopId) {
        // TODO: Implement logic to get dashboard calendar
        return { message: "Dashboard calendar" };
    }

    async getDashboardGrowth(shopId) {
        const monthlySales = await prisma.invoice.groupBy({
            by: ['createdAt'],
            _sum: {
                totalAmount: true,
            },
            where: {
                shopId: shopId,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        return this.formatMonthlySales(monthlySales);
    }

    formatMonthlySales(monthlySales) {
        const formattedSales = {};
        for (const sale of monthlySales) {
            const month = sale.createdAt.toLocaleString('default', { month: 'long' });
            if (month in formattedSales) {
                formattedSales[month] += sale._sum.totalAmount;
            } else {
                formattedSales[month] = sale._sum.totalAmount;
            }
        }
        return formattedSales;
    }

    async getStaffAttendanceReport(shopId) {
        const attendance = await prisma.attendance.findMany({
            where: {
                shopStaff: {
                    shopId: shopId,
                },
            },
            include: {
                shopStaff: {
                    select: {
                        name: true,
                    },
                },
            },
        });
        return attendance;
    }

    async getDoctorAttendanceReport(shopId) {
        const attendance = await prisma.attendance.findMany({
            where: {
                doctor: {
                    shopId: shopId,
                },
            },
            include: {
                doctor: {
                    select: {
                        name: true,
                    },
                },
            },
        });
        return attendance;
    }

    async getSalesReport(shopId, daily = false) {
        const groupBy = daily ? ['createdAt'] : ['createdAt'];

        const sales = await prisma.invoice.groupBy({
            by: groupBy,
            _sum: {
                totalAmount: true,
            },
            where: {
                shopId: shopId,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        return sales.map(sale => ({
            date: sale.createdAt.toISOString().split('T')[0],
            total: sale._sum.totalAmount,
        }));
    }

    async getInventoryReport(shopId) {
        const inventory = await prisma.shopInventory.findMany({
            where: {
                shopId: shopId,
            },
            include: {
                product: true,
            },
        });
        return inventory;
    }

    async getPatientReport(shopId) {
        const patients = await prisma.patient.findMany({
            where: {
                invoices: {
                    some: {
                        shopId: shopId,
                    },
                },
            },
        });
        return patients;
    }

    async stockIn(shopId, productId, quantity) {
        const inventory = await prisma.shopInventory.upsert({
            where: { shopId_productId: { shopId, productId } },
            update: { quantity: { increment: quantity } },
            create: { shopId, productId, quantity },
        });
        return inventory;
    }

    async stockOut(shopId, productId, quantity) {
        const inventory = await prisma.shopInventory.update({
            where: { shopId_productId: { shopId, productId } },
            data: { quantity: { decrement: quantity } },
        });
        return inventory;
    }
}

module.exports = new ShopAdminService();
