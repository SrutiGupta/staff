const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createCustomerAndInvoice = async (req, res) => {
  const { customer, items, staffId, paidAmount, paymentMethod } = req.body;

  if (
    !customer ||
    !customer.name ||
    !customer.address ||
    !items ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res
      .status(400)
      .json({
        error:
          "Missing required fields: customer details and items are required.",
      });
  }

  try {
    // Step 1: Verify stock for all items before making any database changes
    for (const item of items) {
      const inventory = await prisma.inventory.findFirst({
        where: { productId: item.productId },
      });

      if (!inventory || inventory.quantity < item.quantity) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });
        const productName = product ? product.name : `ID ${item.productId}`;
        return res.status(400).json({
          error: `Insufficient stock for product: "${productName}". Requested: ${
            item.quantity
          }, Available: ${inventory ? inventory.quantity : 0}.`,
        });
      }
    }

    // Step 2: Create the customer
    const newCustomer = await prisma.customer.create({
      data: {
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
      },
    });

    // Step 3: Calculate totals and prepare invoice data
    let subtotal = 0;
    const invoiceItemsData = items.map((item) => {
      const itemTotal = item.quantity * item.unitPrice;
      subtotal += itemTotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: itemTotal,
      };
    });

    // Step 4: Create the invoice with its items
    const createdInvoice = await prisma.invoice.create({
      data: {
        customerId: newCustomer.id,
        staffId: staffId,
        subtotal: subtotal,
        totalAmount: subtotal,
        paidAmount: paidAmount,
        status: paidAmount >= subtotal ? "PAID" : "UNPAID",
        items: {
          create: invoiceItemsData,
        },
      },
    });

    // Step 5: Record the payment transaction if an amount was paid
    if (paidAmount > 0) {
      await prisma.transaction.create({
        data: {
          invoiceId: createdInvoice.id,
          amount: paidAmount,
          paymentMethod: paymentMethod || "Cash",
        },
      });
    }

    // Step 6: Decrement the inventory for each item
    for (const item of items) {
      await prisma.inventory.updateMany({
        where: { productId: item.productId },
        data: {
          quantity: {
            decrement: item.quantity,
          },
        },
      });
    }

    res.status(201).json(createdInvoice);
  } catch (error) {
    console.error("Failed to create customer invoice:", error);

    // Handle specific Prisma errors
    if (error.code === "P2028") {
      return res
        .status(500)
        .json({ error: "Database transaction failed. Please try again." });
    }

    // Handle database connection errors
    if (error.code === "P1001" || error.code === "P1002") {
      return res
        .status(500)
        .json({ error: "Database connection failed. Please try again." });
    }

    // Fallback to a generic error for other unexpected issues
    res
      .status(500)
      .json({ error: "An error occurred while creating the invoice." });
  }
};

const getAddressHotspots = async (req, res) => {
  try {
    const addressCounts = await prisma.customer.groupBy({
      by: ["address"],
      _count: {
        address: true,
      },
      orderBy: {
        _count: {
          address: "desc",
        },
      },
      take: 10,
    });

    const hotspots = addressCounts.map((group) => ({
      address: group.address,
      customerCount: group._count.address,
    }));

    res.json(hotspots);
  } catch (error) {
    console.error("Failed to get address hotspots:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching hotspots." });
  }
};

module.exports = {
  createCustomerAndInvoice,
  getAddressHotspots,
};
