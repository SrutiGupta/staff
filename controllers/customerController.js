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
    return res.status(400).json({
      error:
        "Missing required fields: customer details and items are required.",
    });
  }

  try {
    // Step 1: Verify stock for all items before making any database changes
    for (const item of items) {
      const inventory = await prisma.shopInventory.findFirst({
        where: {
          productId: item.productId,
          shopId: req.user.shopId,
        },
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
        shopId: 1, // Default shop ID - should be dynamic based on staff's shop
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
      await prisma.shopInventory.updateMany({
        where: {
          productId: item.productId,
          shopId: req.user.shopId,
        },
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

// Create a standalone customer
const createCustomer = async (req, res) => {
  const { name, phone, address } = req.body;

  if (!name || !address) {
    return res.status(400).json({
      error: "Missing required fields: name and address are required.",
    });
  }

  try {
    const newCustomer = await prisma.customer.create({
      data: {
        name,
        phone,
        address,
        shopId: 1, // Default shop ID - should be dynamic based on staff's shop
      },
    });

    res.status(201).json(newCustomer);
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({ error: "Failed to create customer." });
  }
};

// Get all customers with optional filtering
const getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.customer.count({ where }),
    ]);

    res.status(200).json({
      customers,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / take),
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Failed to fetch customers." });
  }
};

// Get a single customer by ID
const getCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(id) },
      include: {
        invoices: {
          include: {
            items: {
              include: { product: true },
            },
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found." });
    }

    res.status(200).json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({ error: "Failed to fetch customer." });
  }
};

module.exports = {
  createCustomerAndInvoice,
  getAddressHotspots,
  createCustomer,
  getAllCustomers,
  getCustomer,
};
