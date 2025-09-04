const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Create new retailer
async function createRetailer(companyId, data) {
  return prisma.retailer.create({
    data: { ...data, companyId }
  });
}

// Get all retailers under company
async function getRetailers(companyId) {
  return prisma.retailer.findMany({ where: { companyId } });
}

// Retailer payment against invoice
async function makePayment(retailerId, invoiceId, amount, method) {
  const payment = await prisma.retailerPayment.create({
    data: {
      retailerId,
      invoiceId,
      amount,
      method
    }
  });

  // update invoice paidAmount
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      paidAmount: {
        increment: amount
      },
      status: "PARTIAL"
    }
  });

  return payment;
}

// Get due amount for a retailer
async function getDue(retailerId) {
  const invoices = await prisma.invoice.findMany({
    where: { retailerId }
  });

  const due = invoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0);
  return { retailerId, due };
}

// Request new items (check dues)
async function requestItems(retailerId, items) {
  const dueInfo = await getDue(retailerId);
  if (dueInfo.due > 0) {
    return { warning: `⚠️ Clear dues of ₹${dueInfo.due} before requesting new items.` };
  }

  // Normally you would create a new invoice here
  return { success: "✅ Items request accepted.", itemsRequested: items };
}

module.exports = {
  createRetailer,
  getRetailers,
  makePayment,
  getDue,
  requestItems
};
