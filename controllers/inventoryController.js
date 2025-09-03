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
        success: true,
        message: "Stock updated successfully via barcode scan",
        inventory: {
          id: inventory.id,
          productId: inventory.productId,
          quantity: inventory.quantity,
          lastUpdated: inventory.updatedAt,
        },
        productDetails: {
          // Product identification
          id: updatedProduct.id,
          sku: updatedProduct.sku, // ← SKU (Stock Keeping Unit)
          barcode: updatedProduct.barcode,
          name: updatedProduct.name,
          description: updatedProduct.description,

          // Product specifications
          model: updatedProduct.model,
          size: updatedProduct.size,
          color: updatedProduct.color,
          material: updatedProduct.material,
          price: updatedProduct.price,

          // Eyewear categorization
          eyewearType: updatedProduct.eyewearType,
          frameType: updatedProduct.frameType,

          // Company information
          company: {
            id: updatedProduct.company.id,
            name: updatedProduct.company.name,
            description: updatedProduct.company.description,
          },
        },
        stockInDetails: {
          method: "barcode_scan",
          scannedBarcode: barcode,
          productName: updatedProduct.name,
          productId: updatedProduct.id,
          sku: updatedProduct.sku, // ← SKU in operation details
          model: updatedProduct.model,
          size: updatedProduct.size,
          color: updatedProduct.color,
          price: updatedProduct.price,
          eyewearType: updatedProduct.eyewearType,
          frameType: updatedProduct.frameType,
          company: updatedProduct.company.name,
          addedQuantity: quantityInt,
          newQuantity: inventory.quantity,
          previousQuantity: inventory.quantity - quantityInt,
          stockOperation: "STOCK_IN",
          timestamp: new Date().toISOString(),
        },
        inventoryStatus: {
          currentStock: inventory.quantity,
          stockLevel:
            inventory.quantity > 20
              ? "HIGH"
              : inventory.quantity > 10
              ? "MEDIUM"
              : inventory.quantity > 0
              ? "LOW"
              : "OUT_OF_STOCK",
          statusMessage:
            inventory.quantity > 10
              ? "In Stock"
              : inventory.quantity > 0
              ? "Low Stock"
              : "Out of Stock",
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
    sku, // ← Added SKU support
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
        sku, // ← Include SKU in product creation
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
  const { productId, barcode, quantity } = req.body;

  // Support both traditional (productId) and barcode-based stock-in
  if (!productId && !barcode) {
    return res.status(400).json({
      error: "Either productId or barcode is required.",
      examples: {
        traditional: { productId: 15, quantity: 10 },
        barcodeScan: { barcode: "RAY0015678901", quantity: 10 },
      },
    });
  }

  if (!quantity) {
    return res.status(400).json({ error: "Quantity is required." });
  }

  try {
    let product;

    // Find product by barcode or productId
    if (barcode) {
      product = await prisma.product.findUnique({
        where: { barcode: barcode },
        include: { company: true },
      });

      if (!product) {
        return res.status(404).json({
          error: `Product with barcode ${barcode} not found.`,
          suggestion:
            "Verify the barcode or add the product to the system first.",
        });
      }
    } else {
      product = await prisma.product.findUnique({
        where: { id: parseInt(productId) },
        include: { company: true },
      });

      if (!product) {
        return res.status(404).json({
          error: `Product with ID ${productId} not found.`,
        });
      }
    }

    // Check if inventory exists
    const existingInventory = await prisma.inventory.findFirst({
      where: { productId: product.id },
    });

    let inventory;
    if (existingInventory) {
      inventory = await prisma.inventory.update({
        where: { id: existingInventory.id },
        data: {
          quantity: {
            increment: parseInt(quantity),
          },
        },
      });
    } else {
      inventory = await prisma.inventory.create({
        data: {
          productId: product.id,
          quantity: parseInt(quantity),
        },
      });
    }

    // Enhanced response with complete product details
    const response = {
      success: true,
      message: `Stock-in successful via ${
        barcode ? "barcode scan" : "product ID"
      }`,
      inventory: {
        id: inventory.id,
        productId: inventory.productId,
        quantity: inventory.quantity,
        lastUpdated: inventory.updatedAt,
      },
      productDetails: {
        // Product identification
        id: product.id,
        sku: product.sku, // ← SKU (Stock Keeping Unit)
        barcode: product.barcode,
        name: product.name,
        description: product.description,

        // Product specifications
        model: product.model,
        size: product.size,
        color: product.color,
        material: product.material,
        price: product.price,

        // Eyewear categorization
        eyewearType: product.eyewearType,
        frameType: product.frameType,

        // Company information
        company: {
          id: product.company.id,
          name: product.company.name,
          description: product.company.description,
        },
      },
      stockInDetails: {
        method: barcode ? "barcode_scan" : "product_id",
        identifier: barcode || productId,
        scannedBarcode: barcode,
        productId: product.id,
        sku: product.sku, // ← SKU in operation details
        productName: product.name,
        model: product.model,
        size: product.size,
        color: product.color,
        price: product.price,
        eyewearType: product.eyewearType,
        frameType: product.frameType,
        company: product.company.name,
        addedQuantity: parseInt(quantity),
        newQuantity: inventory.quantity,
        previousQuantity: existingInventory ? existingInventory.quantity : 0,
        stockOperation: "STOCK_IN",
        timestamp: new Date().toISOString(),
      },
      inventoryStatus: {
        currentStock: inventory.quantity,
        stockLevel:
          inventory.quantity > 20
            ? "HIGH"
            : inventory.quantity > 10
            ? "MEDIUM"
            : inventory.quantity > 0
            ? "LOW"
            : "OUT_OF_STOCK",
        statusMessage:
          inventory.quantity > 10
            ? "In Stock"
            : inventory.quantity > 0
            ? "Low Stock"
            : "Out of Stock",
      },
    };

    const statusCode = existingInventory ? 200 : 201;
    res.status(statusCode).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

exports.stockOut = async (req, res) => {
  const { productId, barcode, quantity } = req.body;

  // Support both traditional (productId) and barcode-based stock-out
  if (!productId && !barcode) {
    return res.status(400).json({
      error: "Either productId or barcode is required.",
      examples: {
        traditional: { productId: 15, quantity: 5 },
        barcodeScan: { barcode: "RAY0015678901", quantity: 5 },
      },
    });
  }

  if (!quantity) {
    return res.status(400).json({ error: "Quantity is required." });
  }

  try {
    let product;

    // Find product by barcode or productId
    if (barcode) {
      product = await prisma.product.findUnique({
        where: { barcode: barcode },
        include: {
          company: true,
          inventory: true,
        },
      });

      if (!product) {
        return res.status(404).json({
          error: `Product with barcode ${barcode} not found.`,
        });
      }
    } else {
      product = await prisma.product.findUnique({
        where: { id: parseInt(productId) },
        include: {
          company: true,
          inventory: true,
        },
      });

      if (!product) {
        return res.status(404).json({
          error: `Product with ID ${productId} not found.`,
        });
      }
    }

    // Check current inventory
    const currentInventory = product.inventory[0];
    if (!currentInventory) {
      return res.status(400).json({
        error: `No inventory found for product: ${product.name}`,
        suggestion: "Add stock to this product first.",
      });
    }

    if (currentInventory.quantity < parseInt(quantity)) {
      return res.status(400).json({
        error: `Insufficient stock. Available: ${currentInventory.quantity}, Requested: ${quantity}`,
        availableStock: currentInventory.quantity,
      });
    }

    // Update inventory
    const updatedInventory = await prisma.inventory.update({
      where: { id: currentInventory.id },
      data: {
        quantity: {
          decrement: parseInt(quantity),
        },
      },
    });

    // Enhanced response with product details
    const response = {
      ...updatedInventory,
      product: product,
      stockOutDetails: {
        method: barcode ? "barcode_scan" : "product_id",
        identifier: barcode || productId,
        productName: product.name,
        eyewearType: product.eyewearType,
        frameType: product.frameType,
        company: product.company.name,
        removedQuantity: parseInt(quantity),
        previousQuantity: currentInventory.quantity,
        newQuantity: updatedInventory.quantity,
        lowStockWarning:
          updatedInventory.quantity <= 5 ? "Low stock alert!" : null,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// New function: Stock-out by barcode scanning
exports.stockOutByBarcode = async (req, res) => {
  const { barcode, quantity } = req.body;

  if (!barcode || quantity === undefined) {
    return res
      .status(400)
      .json({ error: "Barcode and quantity are required." });
  }

  const quantityInt = parseInt(quantity, 10);

  if (isNaN(quantityInt) || quantityInt <= 0) {
    return res
      .status(400)
      .json({ error: "Quantity must be a positive number." });
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

      // Step 2: Check if inventory exists and has sufficient stock
      const inventory = await tx.inventory.findUnique({
        where: { productId: product.id },
      });

      if (!inventory) {
        throw new Error(`No inventory found for product: ${product.name}`);
      }

      if (inventory.quantity < quantityInt) {
        throw new Error(
          `Insufficient stock. Available: ${inventory.quantity}, Requested: ${quantityInt}`
        );
      }

      // Step 3: Update the inventory record
      const updatedInventory = await tx.inventory.update({
        where: { productId: product.id },
        data: {
          quantity: {
            decrement: quantityInt,
          },
        },
      });

      return {
        ...updatedInventory,
        product: product,
        stockOutDetails: {
          productName: product.name,
          eyewearType: product.eyewearType,
          frameType: product.frameType,
          company: product.company.name,
          previousQuantity: inventory.quantity,
          removedQuantity: quantityInt,
          newQuantity: updatedInventory.quantity,
          lowStockWarning:
            updatedInventory.quantity <= 5 ? "Low stock alert!" : null,
        },
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Failed to stock-out by barcode:", error);
    if (
      error.message.includes("not found") ||
      error.message.includes("Insufficient stock") ||
      error.message.includes("No inventory")
    ) {
      return res.status(400).json({ error: error.message });
    }
    res
      .status(500)
      .json({ error: "An error occurred while updating the inventory." });
  }
};

// Get product details by barcode scanning (for product enlisting/selection)
exports.getProductByBarcode = async (req, res) => {
  const { barcode } = req.params;

  if (!barcode) {
    return res.status(400).json({ error: "Barcode is required." });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { barcode: barcode },
      include: {
        company: true,
        inventory: true,
      },
    });

    if (!product) {
      return res.status(404).json({
        error: `Product with barcode ${barcode} not found.`,
        suggestion:
          "Check if the barcode is correct or if the product needs to be added to the system.",
      });
    }

    // Format the response with all relevant details
    const productDetails = {
      id: product.id,
      sku: product.sku, // ← SKU (Stock Keeping Unit)
      name: product.name,
      description: product.description,
      price: product.price,
      barcode: product.barcode,

      // Eyewear categorization
      eyewearType: product.eyewearType,
      frameType: product.frameType,

      // Company information
      company: {
        id: product.company.id,
        name: product.company.name,
        description: product.company.description,
      },

      // Product attributes
      material: product.material,
      color: product.color,
      size: product.size,
      model: product.model,

      // Current inventory
      inventory:
        product.inventory.length > 0
          ? {
              quantity: product.inventory[0].quantity,
              lastUpdated: product.inventory[0].updatedAt,
              stockStatus:
                product.inventory[0].quantity > 10
                  ? "In Stock"
                  : product.inventory[0].quantity > 0
                  ? "Low Stock"
                  : "Out of Stock",
            }
          : {
              quantity: 0,
              stockStatus: "No Inventory Record",
            },

      // Timestamps
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    res.status(200).json({
      success: true,
      message: "Product found successfully",
      product: productDetails,
      scanResult: {
        scannedBarcode: barcode,
        productFound: true,
        quickInfo: `${product.company.name} ${product.eyewearType} - ${product.name} ($${product.price})`,
      },
    });
  } catch (error) {
    console.error("Error fetching product by barcode:", error);
    res
      .status(500)
      .json({ error: "Something went wrong while fetching product details." });
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
