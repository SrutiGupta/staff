const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.updateStockByBarcode = async (req, res) => {
  const { barcode, quantity, price } = req.body;

  if (!barcode || quantity === undefined) {
    return res
      .status(400)
      .json({ error: "Barcode and quantity are required." });
  }

  const quantityInt = parseInt(quantity, 10);
  const newPrice = price !== undefined ? parseFloat(price) : undefined;

  if (isNaN(quantityInt)) {
    return res.status(400).json({ error: "Quantity must be a valid number." });
  }
  if (price !== undefined && isNaN(newPrice)) {
    return res.status(400).json({ error: "Price must be a valid number." });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Find the product by its barcode with company information
      const product = await tx.product.findUnique({
        where: { barcode: barcode },
        include: {
          company: true,
          inventory: true,
        },
      });

      if (!product) {
        throw new Error(`Product with barcode ${barcode} not found.`);
      }

      // Step 2 (Optional): Update the product's price if a new price is provided
      let updatedProduct = product;
      if (newPrice !== undefined && product.price !== newPrice) {
        updatedProduct = await tx.product.update({
          where: { id: product.id },
          data: { price: newPrice },
          include: {
            company: true,
          },
        });
      }

      // Step 3: Upsert the inventory record
      const inventory = await tx.inventory.upsert({
        where: { productId: product.id },
        update: {
          quantity: {
            increment: quantityInt,
          },
        },
        create: {
          productId: product.id,
          quantity: quantityInt,
        },
      });

      return {
        ...inventory,
        product: updatedProduct,
        stockInDetails: {
          productName: updatedProduct.name,
          eyewearType: updatedProduct.eyewearType,
          frameType: updatedProduct.frameType,
          company: updatedProduct.company.name,
          newQuantity: inventory.quantity,
          addedQuantity: quantityInt,
        },
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Failed to update stock by barcode:", error);
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
    res
      .status(500)
      .json({ error: "An error occurred while updating the inventory." });
  }
};

exports.addProduct = async (req, res) => {
  const {
    name,
    description,
    barcode,
    price,
    eyewearType,
    frameType,
    companyId,
    material,
    color,
    size,
    model,
  } = req.body;

  // Validate required fields
  if (!name || price === undefined || !eyewearType || !companyId) {
    return res.status(400).json({
      error: "Name, price, eyewearType, and companyId are required fields.",
    });
  }

  // Validate eyewear type
  const validEyewearTypes = ["GLASSES", "SUNGLASSES", "LENSES"];
  if (!validEyewearTypes.includes(eyewearType)) {
    return res.status(400).json({
      error: "Invalid eyewearType. Must be GLASSES, SUNGLASSES, or LENSES.",
    });
  }

  // Validate frame type for glasses and sunglasses
  if (eyewearType !== "LENSES" && !frameType) {
    return res.status(400).json({
      error: "FrameType is required for glasses and sunglasses.",
    });
  }

  try {
    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: parseInt(companyId) },
    });

    if (!company) {
      return res.status(400).json({ error: "Company not found." });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        barcode,
        price: parseFloat(price),
        eyewearType,
        frameType: eyewearType === "LENSES" ? null : frameType,
        companyId: parseInt(companyId),
        material,
        color,
        size,
        model,
      },
      include: {
        company: true,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Barcode already exists." });
    }
    res.status(500).json({ error: "Something went wrong" });
  }
};

exports.stockIn = async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    const existingInventory = await prisma.inventory.findFirst({
      where: { productId: parseInt(productId) },
    });

    if (existingInventory) {
      const inventory = await prisma.inventory.update({
        where: { id: existingInventory.id },
        data: {
          quantity: {
            increment: parseInt(quantity),
          },
        },
      });
      res.status(200).json(inventory);
    } else {
      const inventory = await prisma.inventory.create({
        data: {
          productId: parseInt(productId),
          quantity: parseInt(quantity),
        },
      });
      res.status(201).json(inventory);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

exports.stockOut = async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    const inventory = await prisma.inventory.updateMany({
      where: {
        productId: parseInt(productId),
        quantity: {
          gte: parseInt(quantity),
        },
      },
      data: {
        quantity: {
          decrement: parseInt(quantity),
        },
      },
    });

    res.status(200).json(inventory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

exports.getInventory = async (req, res) => {
  try {
    const { eyewearType, companyId, frameType } = req.query;

    // Build filter object
    const whereCondition = {};

    if (eyewearType) {
      whereCondition.eyewearType = eyewearType;
    }

    if (companyId) {
      whereCondition.companyId = parseInt(companyId);
    }

    if (frameType) {
      whereCondition.frameType = frameType;
    }

    const inventory = await prisma.inventory.findMany({
      include: {
        product: {
          include: {
            company: true,
          },
          where:
            Object.keys(whereCondition).length > 0 ? whereCondition : undefined,
        },
      },
      where:
        Object.keys(whereCondition).length > 0
          ? {
              product: whereCondition,
            }
          : undefined,
    });

    // Filter out null products (when where condition doesn't match)
    const filteredInventory = inventory.filter((item) => item.product !== null);

    // Group by company and eyewear type for better organization
    const groupedInventory = filteredInventory.reduce((acc, item) => {
      const companyName = item.product.company.name;
      const eyewearType = item.product.eyewearType;

      if (!acc[companyName]) {
        acc[companyName] = {};
      }

      if (!acc[companyName][eyewearType]) {
        acc[companyName][eyewearType] = [];
      }

      acc[companyName][eyewearType].push(item);

      return acc;
    }, {});

    res.status(200).json({
      inventory: filteredInventory,
      grouped: groupedInventory,
      summary: {
        totalProducts: filteredInventory.length,
        totalQuantity: filteredInventory.reduce(
          (sum, item) => sum + item.quantity,
          0
        ),
        companiesCount: Object.keys(groupedInventory).length,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

exports.updateProduct = async (req, res) => {
  const { productId } = req.params;
  const {
    name,
    description,
    barcode,
    price,
    eyewearType,
    frameType,
    companyId,
    material,
    color,
    size,
    model,
  } = req.body;

  try {
    const updateData = {};

    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (barcode) updateData.barcode = barcode;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (eyewearType) updateData.eyewearType = eyewearType;
    if (frameType !== undefined) updateData.frameType = frameType;
    if (companyId) updateData.companyId = parseInt(companyId);
    if (material !== undefined) updateData.material = material;
    if (color !== undefined) updateData.color = color;
    if (size !== undefined) updateData.size = size;
    if (model !== undefined) updateData.model = model;

    const product = await prisma.product.update({
      where: { id: parseInt(productId) },
      data: updateData,
      include: {
        company: true,
      },
    });
    res.status(200).json(product);
  } catch (error) {
    console.error(error);
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Barcode already exists." });
    }
    res.status(500).json({ error: "Something went wrong" });
  }
};

// Company Management Functions
exports.addCompany = async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Company name is required." });
  }

  try {
    const company = await prisma.company.create({
      data: {
        name,
        description,
      },
    });
    res.status(201).json(company);
  } catch (error) {
    console.error(error);
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Company name already exists." });
    }
    res.status(500).json({ error: "Something went wrong" });
  }
};

exports.getCompanies = async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
    res.status(200).json(companies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

exports.getCompanyProducts = async (req, res) => {
  const { companyId } = req.params;
  const { eyewearType, frameType } = req.query;

  try {
    const whereCondition = { companyId: parseInt(companyId) };

    if (eyewearType) {
      whereCondition.eyewearType = eyewearType;
    }

    if (frameType) {
      whereCondition.frameType = frameType;
    }

    const products = await prisma.product.findMany({
      where: whereCondition,
      include: {
        company: true,
        inventory: true,
      },
    });

    // Group by eyewear type and frame type
    const grouped = products.reduce((acc, product) => {
      const eyewearType = product.eyewearType;
      const frameType = product.frameType || "N/A";

      if (!acc[eyewearType]) {
        acc[eyewearType] = {};
      }

      if (!acc[eyewearType][frameType]) {
        acc[eyewearType][frameType] = [];
      }

      acc[eyewearType][frameType].push(product);

      return acc;
    }, {});

    res.status(200).json({
      products,
      grouped,
      summary: {
        totalProducts: products.length,
        byEyewearType: products.reduce((acc, p) => {
          acc[p.eyewearType] = (acc[p.eyewearType] || 0) + 1;
          return acc;
        }, {}),
        byFrameType: products.reduce((acc, p) => {
          const frameType = p.frameType || "N/A";
          acc[frameType] = (acc[frameType] || 0) + 1;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};
