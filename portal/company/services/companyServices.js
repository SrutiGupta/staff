const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Create a new company
async function createCompany(data) {
  return prisma.company.create({ data });
}

// Add a product for a company
async function addProduct(companyId, productData) {
  return prisma.product.create({
    data: {
      ...productData,
      companyId
    }
  });
}

// Dashboard: total retailers + pending dues
async function getDashboard(companyId) {
  const retailers = await prisma.retailer.findMany({
    where: { companyId },
    include: {
      invoices: {
        include: { transactions: true }
      }
    }
  });

  const dashboard = retailers.map(r => {
    const totalDue = r.invoices.reduce((sum, inv) => {
      return sum + (inv.totalAmount - inv.paidAmount);
    }, 0);

    return {
      retailerId: r.id,
      retailerName: r.name,
      totalDue
    };
  });

  return {
    totalRetailers: retailers.length,
    retailers: dashboard,
    totalOutstanding: dashboard.reduce((sum, r) => sum + r.totalDue, 0)
  };
}

// Warn retailer if dues exist
async function warnRetailer(retailerId) {
  const invoices = await prisma.invoice.findMany({
    where: { retailerId }
  });

  const due = invoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0);

  if (due > 0) {
    return `⚠️ Retailer has pending due of ₹${due}. Please clear payment before new order.`;
  }
  return "✅ No dues. Retailer can request items.";
}

module.exports = {
  createCompany,
  addProduct,
  getDashboard,
  warnRetailer
};
