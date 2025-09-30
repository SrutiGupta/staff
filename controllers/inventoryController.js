const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Helper function to safely parse shop ID
const parseShopId = (req) => {
  if (!req.user || !req.user.shopId) {
    throw new Error("Authentication required with valid shop access");
  }
  const shopId = parseInt(req.user.shopId, 10);
  if (isNaN(shopId)) {
    throw new Error("Invalid shop ID");
  }
  return shopId;
};

// Helper function to get low stock threshold
const getLowStockThreshold = async (shopId) => {
  try {
    // Try to get threshold from shop settings first
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { lowStockThreshold: true },
    });

    return (
      shop?.lowStockThreshold || parseInt(process.env.LOW_STOCK_THRESHOLD) || 5
    );
  } catch (error) {
    console.warn(
      "Failed to get shop settings, using default threshold:",
      error
    );
    return parseInt(process.env.LOW_STOCK_THRESHOLD) || 5;
  }
};

// Helper function to calculate inventory status
const getInventoryStatus = async (quantity, shopId) => {
  const lowStockThreshold = await getLowStockThreshold(shopId);
  const mediumStockThreshold = lowStockThreshold * 2; // 2x low stock threshold
  const highStockThreshold = lowStockThreshold * 4; // 4x low stock threshold

  return {
    currentStock: quantity,
    stockLevel:
      quantity > highStockThreshold
        ? "HIGH"
        : quantity > mediumStockThreshold
        ? "MEDIUM"
        : quantity > 0
        ? "LOW"
        : "OUT_OF_STOCK",
    statusMessage:
      quantity > mediumStockThreshold
        ? "In Stock"
        : quantity > 0
        ? "Low Stock"
        : "Out of Stock",
  };
};

// Helper function to validate shop ownership and access
const validateShopAccess = async (req, requiredShopId = null) => {
  const shopId = parseShopId(req);

  // If a specific shop ID is required, verify it matches the user's shop
  if (requiredShopId && shopId !== requiredShopId) {
    throw new Error(
      "Access denied: You don't have permission to access this shop's resources"
    );
  }

  // Verify the shop exists and is active
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { id: true, name: true },
  });

  if (!shop) {
    throw new Error("Shop not found or access denied");
  }

  return shopId;
};

// Helper function to validate approved receipt and check consumption
const validateApprovedReceipt = async (
  shopId,
  productId,
  requestedQuantity,
  product
) => {
  // Find approved stock receipt
  const approvedReceipt = await prisma.stockReceipt.findFirst({
    where: {
      shopId: shopId,
      productId: productId,
      status: "APPROVED",
      verifiedQuantity: {
        gte: requestedQuantity,
      },
    },
    orderBy: {
      verifiedAt: "desc",
    },
  });

  if (!approvedReceipt) {
    throw new Error(
      `No approved stock receipt found for product ${product.name}. Staff cannot perform stock operations without shop admin approval.`
    );
  }

  // Check if approved quantity has already been consumed
  const totalConsumed = await prisma.stockMovement.aggregate({
    where: {
      shopInventory: {
        shopId: shopId,
        productId: productId,
      },
      type: "STOCK_IN",
      createdAt: {
        gte: approvedReceipt.verifiedAt,
      },
    },
    _sum: {
      quantity: true,
    },
  });

  const consumedQuantity = totalConsumed._sum.quantity || 0;
  const remainingApproved = approvedReceipt.verifiedQuantity - consumedQuantity;

  if (remainingApproved < requestedQuantity) {
    throw new Error(
      `Insufficient approved stock. Remaining approved quantity: ${remainingApproved}, Requested: ${requestedQuantity}`
    );
  }

  return {
    approvedReceipt,
    consumedQuantity,
    remainingApproved,
  };
};

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
    const shopIdInt = await validateShopAccess(req);
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Find the product by its barcode with company information
      const product = await tx.product.findUnique({
        where: { barcode },
        include: {
          company: true,
        },
      });

      if (!product) {
        throw new Error(`Product with barcode ${barcode} not found.`);
      }

      // SECURITY CHECK: Verify there's an approved stock receipt for this product
      const { approvedReceipt, consumedQuantity } =
        await validateApprovedReceipt(
          shopIdInt,
          product.id,
          quantityInt,
          product
        );

      // Get current inventory to calculate previous quantity
      const currentInventory = await tx.shopInventory.findUnique({
        where: {
          shopId_productId: {
            shopId: shopIdInt,
            productId: product.id,
          },
        },
      });

      const previousQuantity = currentInventory?.quantity || 0;

      // Step 2: Upsert the inventory record
      const inventory = await tx.shopInventory.upsert({
        where: {
          shopId_productId: {
            shopId: shopIdInt,
            productId: product.id,
          },
        },
        update: {
          quantity: { increment: quantityInt },
          ...(newPrice !== undefined && { sellingPrice: newPrice }),
          lastRestockedAt: new Date(),
        },
        create: {
          shopId: shopIdInt,
          productId: product.id,
          quantity: quantityInt,
          ...(newPrice !== undefined && { sellingPrice: newPrice }),
          lastRestockedAt: new Date(),
        },
      });

      // Create stock movement record for audit trail
      await tx.stockMovement.create({
        data: {
          shopInventoryId: inventory.id,
          type: "STOCK_IN",
          quantity: quantityInt,
          previousQty: previousQuantity,
          newQty: inventory.quantity,
          staffId: req.user?.id, // Assuming you have user authentication
          reason: "STOCK_IN",
          supplierName: product.company.name,
          notes: `Stock in via barcode scan: ${barcode}`,
        },
      });

      // Update stock receipt status if fully consumed
      const newConsumedQuantity = consumedQuantity + quantityInt;
      if (newConsumedQuantity >= approvedReceipt.verifiedQuantity) {
        await tx.stockReceipt.update({
          where: { id: approvedReceipt.id },
          data: { status: "COMPLETED" },
        });
      }

      return {
        success: true,
        message: "Stock updated successfully via barcode scan",
        inventory: {
          id: inventory.id,
          productId: inventory.productId,
          quantity: inventory.quantity,
          lastRestockedAt: inventory.lastRestockedAt,
          lastUpdated: inventory.updatedAt,
        },
        productDetails: {
          // FIXED: Use 'product' instead of 'updatedProduct'
          id: product.id,
          sku: product.sku,
          barcode: product.barcode,
          name: product.name,
          description: product.description,
          model: product.model,
          size: product.size,
          color: product.color,
          material: product.material,
          price: inventory.sellingPrice ?? product.basePrice,
          eyewearType: product.eyewearType,
          frameType: product.frameType,
          company: {
            id: product.company.id,
            name: product.company.name,
            description: product.company.description,
          },
        },
        stockInDetails: {
          method: "barcode_scan",
          scannedBarcode: barcode,
          productName: product.name,
          productId: product.id,
          sku: product.sku,
          model: product.model,
          size: product.size,
          color: product.color,
          basePrice: product.basePrice,
          sellingPrice: inventory.sellingPrice,
          eyewearType: product.eyewearType,
          frameType: product.frameType,
          company: product.company.name,
          addedQuantity: quantityInt,
          newQuantity: inventory.quantity,
          previousQuantity: previousQuantity,
          stockOperation: "STOCK_IN",
          timestamp: new Date().toISOString(),
        },
        inventoryStatus: await getInventoryStatus(
          inventory.quantity,
          shopIdInt
        ),
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Failed to update stock by barcode:", error);
    if (
      error.message.includes("Authentication required") ||
      error.message.includes("Access denied") ||
      error.message.includes("Shop not found")
    ) {
      return res.status(401).json({ error: error.message });
    }
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
    if (
      error.message.includes("No approved stock receipt") ||
      error.message.includes("Insufficient approved stock")
    ) {
      return res.status(403).json({ error: error.message });
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
    basePrice,
    eyewearType,
    frameType,
    companyId,
    material,
    color,
    size,
    model,
  } = req.body;

  // Validate required fields
  if (!name || basePrice === undefined || !eyewearType || !companyId) {
    return res.status(400).json({
      error: "Name, basePrice, eyewearType, and companyId are required fields.",
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
        basePrice: parseFloat(basePrice),
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
      // Handle unique constraint violations
      if (error.meta?.target?.includes("barcode")) {
        return res.status(409).json({ error: "Barcode already exists." });
      }
      if (error.meta?.target?.includes("sku")) {
        return res.status(409).json({ error: "SKU already exists." });
      }
      return res.status(409).json({ error: "Duplicate entry found." });
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
    const shopIdInt = await validateShopAccess(req);

    // CRITICAL FIX: Wrap everything in a transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      let product;

      // Find product by barcode or productId
      if (barcode) {
        product = await tx.product.findUnique({
          where: { barcode: barcode },
          include: { company: true },
        });

        if (!product) {
          throw new Error(`Product with barcode ${barcode} not found.`);
        }
      } else {
        product = await tx.product.findUnique({
          where: { id: parseInt(productId) },
          include: { company: true },
        });

        if (!product) {
          throw new Error(`Product with ID ${productId} not found.`);
        }
      }

      // SECURITY CHECK: Verify there's an approved stock receipt for this product
      const { approvedReceipt, consumedQuantity } =
        await validateApprovedReceipt(
          shopIdInt,
          product.id,
          parseInt(quantity),
          product
        );

      // Get current inventory to calculate previous quantity
      const currentInventory = await tx.shopInventory.findUnique({
        where: {
          shopId_productId: {
            shopId: shopIdInt,
            productId: product.id,
          },
        },
      });

      const previousQuantity = currentInventory?.quantity || 0;

      // Use upsert to handle race conditions properly
      const inventory = await tx.shopInventory.upsert({
        where: {
          shopId_productId: {
            shopId: shopIdInt,
            productId: product.id,
          },
        },
        update: {
          quantity: { increment: parseInt(quantity) },
          lastRestockedAt: new Date(),
        },
        create: {
          shopId: shopIdInt,
          productId: product.id,
          quantity: parseInt(quantity),
          lastRestockedAt: new Date(),
        },
      });

      // Create stock movement record for audit trail
      await tx.stockMovement.create({
        data: {
          shopInventoryId: inventory.id,
          type: "STOCK_IN",
          quantity: parseInt(quantity),
          previousQty: previousQuantity,
          newQty: inventory.quantity,
          staffId: req.user?.id,
          reason: "STOCK_IN",
          supplierName: product.company.name,
          notes: `Stock in via ${barcode ? "barcode scan" : "product ID"}: ${
            barcode || productId
          }`,
        },
      });

      // Update stock receipt status if fully consumed
      const newConsumedQuantity = consumedQuantity + parseInt(quantity);
      if (newConsumedQuantity >= approvedReceipt.verifiedQuantity) {
        await tx.stockReceipt.update({
          where: { id: approvedReceipt.id },
          data: { status: "COMPLETED" },
        });
      }

      return {
        product,
        inventory,
        previousQuantity,
        approvedReceipt,
        consumedQuantity,
      };
    });

    const { product, inventory, previousQuantity } = result;

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
        price: product.basePrice,

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
        price: product.basePrice,
        eyewearType: product.eyewearType,
        frameType: product.frameType,
        company: product.company.name,
        addedQuantity: parseInt(quantity),
        newQuantity: inventory.quantity,
        previousQuantity: previousQuantity,
        stockOperation: "STOCK_IN",
        timestamp: new Date().toISOString(),
      },
      inventoryStatus: await getInventoryStatus(inventory.quantity, shopIdInt),
    };

    const statusCode = previousQuantity > 0 ? 200 : 201;
    res.status(statusCode).json(response);
  } catch (error) {
    console.error(error);
    if (
      error.message.includes("Authentication required") ||
      error.message.includes("Access denied") ||
      error.message.includes("Shop not found")
    ) {
      return res.status(401).json({ error: error.message });
    }
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
    if (
      error.message.includes("No approved stock receipt") ||
      error.message.includes("Insufficient approved stock")
    ) {
      return res.status(403).json({
        error: error.message,
        suggestion:
          "Create a stock receipt and wait for shop admin approval before performing stock operations.",
      });
    }
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
    const shopIdInt = await validateShopAccess(req);

    // CRITICAL FIX: Wrap in transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      let product;

      // Find product by barcode or productId
      if (barcode) {
        product = await tx.product.findUnique({
          where: { barcode: barcode },
          include: { company: true },
        });

        if (!product) {
          throw new Error(`Product with barcode ${barcode} not found.`);
        }
      } else {
        product = await tx.product.findUnique({
          where: { id: parseInt(productId) },
          include: { company: true },
        });

        if (!product) {
          throw new Error(`Product with ID ${productId} not found.`);
        }
      }

      // Check current inventory within transaction
      const currentInventory = await tx.shopInventory.findUnique({
        where: {
          shopId_productId: {
            shopId: shopIdInt,
            productId: product.id,
          },
        },
      });

      if (!currentInventory) {
        throw new Error(`No inventory found for product: ${product.name}`);
      }

      if (currentInventory.quantity < parseInt(quantity)) {
        throw new Error(
          `Insufficient stock. Available: ${currentInventory.quantity}, Requested: ${quantity}`
        );
      }

      // Update inventory using transaction
      const updatedInventory = await tx.shopInventory.update({
        where: {
          shopId_productId: {
            shopId: shopIdInt,
            productId: product.id,
          },
        },
        data: {
          quantity: {
            decrement: parseInt(quantity),
          },
        },
      });

      // Create stock movement record for audit trail
      await tx.stockMovement.create({
        data: {
          shopInventoryId: currentInventory.id,
          type: "STOCK_OUT",
          quantity: parseInt(quantity),
          previousQty: currentInventory.quantity,
          newQty: updatedInventory.quantity,
          staffId: req.user?.id,
          reason: "STOCK_OUT",
          notes: `Stock out via ${barcode ? "barcode scan" : "product ID"}: ${
            barcode || productId
          }`,
        },
      });

      return {
        product,
        currentInventory,
        updatedInventory,
      };
    });

    const { product, currentInventory, updatedInventory } = result;

    // Enhanced response with product details
    const lowStockThreshold = await getLowStockThreshold(shopIdInt);
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
          updatedInventory.quantity <= lowStockThreshold
            ? "Low stock alert!"
            : null,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    if (
      error.message.includes("Authentication required") ||
      error.message.includes("Access denied") ||
      error.message.includes("Shop not found")
    ) {
      return res.status(401).json({ error: error.message });
    }
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
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
    const shopIdInt = await validateShopAccess(req);
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Find the product by its barcode with company information
      const product = await tx.product.findUnique({
        where: { barcode: barcode },
        include: {
          company: true,
        },
      });

      if (!product) {
        throw new Error(`Product with barcode ${barcode} not found.`);
      }

      // Step 2: Check if inventory exists and has sufficient stock
      const inventory = await tx.shopInventory.findUnique({
        where: {
          shopId_productId: {
            shopId: shopIdInt, // Get shopId from authenticated user
            productId: product.id,
          },
        },
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
      const updatedInventory = await tx.shopInventory.update({
        where: {
          shopId_productId: {
            shopId: shopIdInt,
            productId: product.id,
          },
        },
        data: {
          quantity: {
            decrement: quantityInt,
          },
        },
      });

      // Create stock movement record for audit trail
      await tx.stockMovement.create({
        data: {
          shopInventoryId: inventory.id,
          type: "STOCK_OUT",
          quantity: quantityInt,
          previousQty: inventory.quantity,
          newQty: updatedInventory.quantity,
          staffId: req.user?.id,
          reason: "STOCK_OUT",
          notes: `Stock out via barcode scan: ${barcode}`,
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
            updatedInventory.quantity <= (await getLowStockThreshold(shopIdInt))
              ? "Low stock alert!"
              : null,
        },
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Failed to stock-out by barcode:", error);
    if (
      error.message.includes("Authentication required") ||
      error.message.includes("Access denied") ||
      error.message.includes("Shop not found")
    ) {
      return res.status(401).json({ error: error.message });
    }
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
    if (
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
    const shopIdInt = await validateShopAccess(req);
    const product = await prisma.product.findUnique({
      where: { barcode: barcode },
      include: {
        company: true,
        shopInventory: {
          where: {
            shopId: shopIdInt, // Only get inventory for current shop
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        error: `Product with barcode ${barcode} not found.`,
        suggestion:
          "Check if the barcode is correct or if the product needs to be added to the system.",
        canCreateNew: true,
        scannedBarcode: barcode,
        nextAction:
          "Use POST /api/inventory/product/scan-to-add to create a new product with this barcode",
      });
    }

    // Format the response with all relevant details
    const productDetails = {
      id: product.id,
      sku: product.sku, // ← SKU (Stock Keeping Unit)
      name: product.name,
      description: product.description,
      price: product.basePrice,
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
        product.shopInventory.length > 0
          ? {
              quantity: product.shopInventory[0].quantity,
              lastUpdated: product.shopInventory[0].updatedAt,
              stockStatus:
                product.shopInventory[0].quantity > 10
                  ? "In Stock"
                  : product.shopInventory[0].quantity > 0
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
        quickInfo: `${product.company.name} ${product.eyewearType} - ${product.name} ($${product.basePrice})`,
      },
    });
  } catch (error) {
    console.error("Error fetching product by barcode:", error);
    if (
      error.message.includes("Authentication required") ||
      error.message.includes("Access denied") ||
      error.message.includes("Shop not found")
    ) {
      return res.status(401).json({ error: error.message });
    }
    res
      .status(500)
      .json({ error: "Something went wrong while fetching product details." });
  }
};

exports.getProductById = async (req, res) => {
  const { productId } = req.params;

  if (!productId) {
    return res.status(400).json({ error: "Product ID is required." });
  }

  try {
    const shopIdInt = await validateShopAccess(req);
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
      include: {
        company: true,
        shopInventory: {
          where: {
            shopId: shopIdInt, // Only get inventory for current shop
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        error: `Product with ID ${productId} not found.`,
        suggestion:
          "Check if the product ID is correct or if the product exists in the system.",
      });
    }

    // Format the response with all relevant details
    const productDetails = {
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      basePrice: product.basePrice,
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

      // Current inventory for this shop
      inventory:
        product.shopInventory.length > 0
          ? {
              quantity: product.shopInventory[0].quantity,
              sellingPrice: product.shopInventory[0].sellingPrice,
              lastRestockedAt: product.shopInventory[0].lastRestockedAt,
              lastUpdated: product.shopInventory[0].updatedAt,
              stockStatus: await getInventoryStatus(
                product.shopInventory[0].quantity,
                shopIdInt
              ),
            }
          : {
              quantity: 0,
              stockStatus: {
                currentStock: 0,
                stockLevel: "OUT_OF_STOCK",
                statusMessage: "No Inventory Record",
              },
            },

      // Timestamps
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    res.status(200).json({
      success: true,
      message: "Product found successfully",
      product: productDetails,
    });
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    if (
      error.message.includes("Authentication required") ||
      error.message.includes("Access denied") ||
      error.message.includes("Shop not found")
    ) {
      return res.status(401).json({ error: error.message });
    }
    res
      .status(500)
      .json({ error: "Something went wrong while fetching product details." });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const shopIdInt = await validateShopAccess(req);
    const {
      eyewearType,
      companyId,
      frameType,
      page = 1,
      limit = 50,
    } = req.query;

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

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: whereCondition,
        include: {
          company: true,
          shopInventory: {
            where: {
              shopId: shopIdInt, // Only get inventory for current shop
            },
            select: {
              quantity: true,
              sellingPrice: true,
              lastRestockedAt: true,
              updatedAt: true,
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.product.count({
        where: whereCondition,
      }),
    ]);

    // Format products with inventory status
    const formattedProducts = await Promise.all(
      products.map(async (product) => {
        const inventory = product.shopInventory[0];
        return {
          id: product.id,
          sku: product.sku,
          name: product.name,
          description: product.description,
          basePrice: product.basePrice,
          barcode: product.barcode,
          eyewearType: product.eyewearType,
          frameType: product.frameType,
          material: product.material,
          color: product.color,
          size: product.size,
          model: product.model,
          company: {
            id: product.company.id,
            name: product.company.name,
            description: product.company.description,
          },
          inventory: inventory
            ? {
                quantity: inventory.quantity,
                sellingPrice: inventory.sellingPrice,
                lastRestockedAt: inventory.lastRestockedAt,
                lastUpdated: inventory.updatedAt,
                stockStatus: await getInventoryStatus(
                  inventory.quantity,
                  shopIdInt
                ),
              }
            : {
                quantity: 0,
                stockStatus: {
                  currentStock: 0,
                  stockLevel: "OUT_OF_STOCK",
                  statusMessage: "No Inventory Record",
                },
              },
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        };
      })
    );

    // Group by company and eyewear type
    const groupedProducts = formattedProducts.reduce((acc, product) => {
      const companyName = product.company.name;
      const eyewearType = product.eyewearType;

      if (!acc[companyName]) {
        acc[companyName] = {};
      }

      if (!acc[companyName][eyewearType]) {
        acc[companyName][eyewearType] = [];
      }

      acc[companyName][eyewearType].push(product);

      return acc;
    }, {});

    res.status(200).json({
      success: true,
      products: formattedProducts,
      grouped: groupedProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalProducts: totalCount,
        hasNextPage: skip + parseInt(limit) < totalCount,
        hasPrevPage: parseInt(page) > 1,
      },
      summary: {
        totalProducts: formattedProducts.length,
        companiesCount: Object.keys(groupedProducts).length,
        byEyewearType: formattedProducts.reduce((acc, p) => {
          acc[p.eyewearType] = (acc[p.eyewearType] || 0) + 1;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error("Error fetching all products:", error);
    if (
      error.message.includes("Authentication required") ||
      error.message.includes("Access denied") ||
      error.message.includes("Shop not found")
    ) {
      return res.status(401).json({ error: error.message });
    }
    res
      .status(500)
      .json({ error: "Something went wrong while fetching products." });
  }
};

exports.getInventory = async (req, res) => {
  try {
    const shopIdInt = await validateShopAccess(req);
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

    const inventory = await prisma.shopInventory.findMany({
      where: {
        shopId: shopIdInt, // Filter by user's shop
        ...(Object.keys(whereCondition).length > 0 && {
          product: whereCondition,
        }),
      },
      include: {
        product: {
          include: {
            company: true,
          },
        },
      },
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
    if (
      error.message.includes("Authentication required") ||
      error.message.includes("Access denied") ||
      error.message.includes("Shop not found")
    ) {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: "Something went wrong" });
  }
};

exports.updateProduct = async (req, res) => {
  const { productId } = req.params;
  const {
    name,
    description,
    barcode,
    basePrice,
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
    if (basePrice !== undefined) updateData.basePrice = parseFloat(basePrice);
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
      // Handle unique constraint violations
      if (error.meta?.target?.includes("barcode")) {
        return res.status(409).json({ error: "Barcode already exists." });
      }
      if (error.meta?.target?.includes("sku")) {
        return res.status(409).json({ error: "SKU already exists." });
      }
      return res.status(409).json({ error: "Duplicate entry found." });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Product not found." });
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
        shopInventory: true,
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

// Add new product by barcode scanning - when barcode is scanned but product doesn't exist
exports.addProductByBarcodeScan = async (req, res) => {
  const {
    scannedBarcode, // The barcode that was scanned
    name,
    description,
    basePrice,
    eyewearType,
    frameType,
    companyId,
    material,
    color,
    size,
    model,
    quantity = 0, // Initial stock quantity
    sellingPrice, // Optional selling price override
  } = req.body;

  // Validate required fields
  if (
    !scannedBarcode ||
    !name ||
    basePrice === undefined ||
    !eyewearType ||
    !companyId
  ) {
    return res.status(400).json({
      error:
        "scannedBarcode, name, basePrice, eyewearType, and companyId are required fields.",
      example: {
        scannedBarcode: "EYE001234567890",
        name: "Ray-Ban Aviator",
        basePrice: 2500.0,
        eyewearType: "SUNGLASSES",
        companyId: 1,
        frameType: "AVIATOR",
        quantity: 10,
      },
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
    const shopIdInt = await validateShopAccess(req);

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Check if barcode already exists
      const existingProduct = await tx.product.findUnique({
        where: { barcode: scannedBarcode },
      });

      if (existingProduct) {
        throw new Error(
          `Product with barcode ${scannedBarcode} already exists: ${existingProduct.name}`
        );
      }

      // Check if company exists
      const company = await tx.company.findUnique({
        where: { id: parseInt(companyId) },
      });

      if (!company) {
        throw new Error("Company not found.");
      }

      // Create the product with the scanned barcode
      const product = await tx.product.create({
        data: {
          name,
          description,
          barcode: scannedBarcode, // Use the scanned barcode
          basePrice: parseFloat(basePrice),
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

      // If quantity is provided, create initial inventory
      let inventory = null;
      if (parseInt(quantity) > 0) {
        inventory = await tx.shopInventory.create({
          data: {
            shopId: shopIdInt,
            productId: product.id,
            quantity: parseInt(quantity),
            sellingPrice: sellingPrice
              ? parseFloat(sellingPrice)
              : product.basePrice,
            lastRestockedAt: new Date(),
          },
        });

        // Create stock movement record for initial stock
        await tx.stockMovement.create({
          data: {
            shopInventoryId: inventory.id,
            type: "STOCK_IN",
            quantity: parseInt(quantity),
            previousQty: 0,
            newQty: parseInt(quantity),
            staffId: req.user?.id,
            reason: "INITIAL_STOCK",
            notes: `Initial stock via barcode scan: ${scannedBarcode}`,
          },
        });
      }

      return { product, inventory };
    });

    const { product, inventory } = result;

    res.status(201).json({
      success: true,
      message: "Product created successfully from barcode scan",
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        barcode: product.barcode,
        sku: product.sku,
        basePrice: product.basePrice,
        eyewearType: product.eyewearType,
        frameType: product.frameType,
        material: product.material,
        color: product.color,
        size: product.size,
        model: product.model,
        company: {
          id: product.company.id,
          name: product.company.name,
        },
        createdAt: product.createdAt,
      },
      inventory: inventory
        ? {
            id: inventory.id,
            quantity: inventory.quantity,
            sellingPrice: inventory.sellingPrice,
            lastRestockedAt: inventory.lastRestockedAt,
          }
        : null,
      scanDetails: {
        scannedBarcode: scannedBarcode,
        productCreated: true,
        canNowScan: true,
        nextActions: [
          "Generate SKU (optional)",
          "Print barcode label",
          "Start stock operations",
        ],
      },
    });
  } catch (error) {
    console.error("Error creating product from barcode scan:", error);

    if (error.message.includes("already exists")) {
      return res.status(409).json({
        error: error.message,
        suggestion:
          "Use GET /api/inventory/product/barcode/{barcode} to view existing product",
      });
    }

    if (error.code === "P2002") {
      if (error.meta?.target?.includes("barcode")) {
        return res.status(409).json({ error: "Barcode already exists." });
      }
      if (error.meta?.target?.includes("sku")) {
        return res.status(409).json({ error: "SKU already exists." });
      }
      return res.status(409).json({ error: "Duplicate entry found." });
    }

    if (
      error.message.includes("Authentication required") ||
      error.message.includes("Access denied") ||
      error.message.includes("Shop not found")
    ) {
      return res.status(401).json({ error: error.message });
    }

    res.status(500).json({
      error: "Failed to create product from barcode scan",
      details: error.message,
    });
  }
};
