const prisma = require("../../../lib/prisma");
// Get all companies - FIXED: Only fetch companies that retailer has products from
exports.getAllCompanies = async (req, res) => {
  try {
    const retailerId = req.retailer?.id;

    if (!retailerId) {
      return res.status(401).json({ error: "Retailer ID not found in token" });
    }

    // Get unique companies from retailer's products
    const retailerProducts = await prisma.retailerProduct.findMany({
      where: { retailerId },
      include: {
        product: {
          include: {
            company: true,
          },
        },
      },
    });

    // Extract unique companies and count products
    const companiesMap = new Map();
    retailerProducts.forEach((rp) => {
      const company = rp.product.company;
      if (!companiesMap.has(company.id)) {
        companiesMap.set(company.id, {
          id: company.id,
          name: company.name,
          description: company.description,
          createdAt: company.createdAt,
          updatedAt: company.updatedAt,
          productCount: 0,
        });
      }
      companiesMap.get(company.id).productCount += 1;
    });

    const companies = Array.from(companiesMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    res.json(companies);
  } catch (error) {
    console.error("Get companies error:", error);
    res.status(500).json({ error: "Failed to fetch companies" });
  }
};

// Add new company
exports.addCompany = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Company name is required" });
    }

    const existingCompany = await prisma.company.findUnique({
      where: { name },
    });

    if (existingCompany) {
      return res
        .status(400)
        .json({ error: "Company with this name already exists" });
    }

    const company = await prisma.company.create({
      data: {
        name,
        description,
      },
    });

    res.status(201).json({
      message: "Company added successfully",
      company,
    });
  } catch (error) {
    console.error("Add company error:", error);
    res.status(500).json({ error: "Failed to add company" });
  }
};

// Update company
exports.updateCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { name, description } = req.body;

    const company = await prisma.company.findUnique({
      where: { id: parseInt(companyId) },
    });

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    const updatedCompany = await prisma.company.update({
      where: { id: parseInt(companyId) },
      data: {
        name,
        description,
      },
    });

    res.json({
      message: "Company updated successfully",
      company: updatedCompany,
    });
  } catch (error) {
    console.error("Update company error:", error);
    res.status(500).json({ error: "Failed to update company" });
  }
};

// Get products by company
exports.getProductsByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { eyewearType, page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;
    const where = { companyId: parseInt(companyId) };

    if (eyewearType) {
      where.eyewearType = eyewearType;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        company: true,
        _count: {
          select: {
            retailerProducts: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
      skip: parseInt(skip),
      take: parseInt(limit),
    });

    const totalProducts = await prisma.product.count({ where });

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalProducts,
        pages: Math.ceil(totalProducts / limit),
      },
    });
  } catch (error) {
    console.error("Get products by company error:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

// Add new product
exports.addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      basePrice,
      barcode,
      sku,
      eyewearType,
      frameType,
      companyId,
      material,
      color,
      size,
      model,
    } = req.body;

    if (!name || !eyewearType || !companyId) {
      return res.status(400).json({
        error: "Name, eyewear type, and company are required",
      });
    }

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: parseInt(companyId) },
    });

    if (!company) {
      return res.status(400).json({ error: "Invalid company ID" });
    }

    // Check for duplicate barcode or SKU
    const existing = await prisma.product.findFirst({
      where: {
        OR: [{ barcode: barcode || undefined }, { sku: sku || undefined }],
      },
    });

    if (existing) {
      return res.status(400).json({
        error: "Product with this barcode or SKU already exists",
      });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        basePrice: parseFloat(basePrice || 0),
        barcode,
        sku,
        eyewearType,
        frameType,
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

    res.status(201).json({
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    console.error("Add product error:", error);
    res.status(500).json({ error: "Failed to add product" });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      name,
      description,
      basePrice,
      barcode,
      sku,
      eyewearType,
      frameType,
      material,
      color,
      size,
      model,
    } = req.body;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(productId) },
      data: {
        name,
        description,
        basePrice: basePrice ? parseFloat(basePrice) : undefined,
        barcode,
        sku,
        eyewearType,
        frameType,
        material,
        color,
        size,
        model,
      },
      include: {
        company: true,
      },
    });

    res.json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
};

// Get retailer's product inventory
exports.getRetailerProducts = async (req, res) => {
  try {
    const retailerId = req.retailer.id;
    const {
      companyId,
      eyewearType,
      lowStock,
      outOfStock,
      page = 1,
      limit = 20,
      search,
    } = req.query;

    const skip = (page - 1) * limit;
    const where = { retailerId };

    // Build filters
    if (companyId || eyewearType || search) {
      where.product = {};

      if (companyId) {
        where.product.companyId = parseInt(companyId);
      }

      if (eyewearType) {
        where.product.eyewearType = eyewearType;
      }

      if (search) {
        where.product.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
          { barcode: { contains: search, mode: "insensitive" } },
        ];
      }
    }

    if (lowStock === "true") {
      where.availableStock = {
        lte: prisma.retailerProduct.fields.reorderLevel,
        gt: 0,
      };
    }

    if (outOfStock === "true") {
      where.availableStock = 0;
    }

    const retailerProducts = await prisma.retailerProduct.findMany({
      where,
      include: {
        product: {
          include: {
            company: true,
          },
        },
        retailerInventory: true,
      },
      orderBy: {
        product: {
          name: "asc",
        },
      },
      skip: parseInt(skip),
      take: parseInt(limit),
    });

    const totalProducts = await prisma.retailerProduct.count({ where });

    // Add calculated fields
    const enrichedProducts = retailerProducts.map((rp) => ({
      ...rp,
      stockStatus:
        rp.availableStock === 0
          ? "OUT_OF_STOCK"
          : rp.availableStock <= rp.reorderLevel
          ? "LOW_STOCK"
          : "IN_STOCK",
      stockValue: rp.availableStock * (rp.wholesalePrice || 0),
      allocationRate:
        rp.totalStock > 0 ? (rp.allocatedStock / rp.totalStock) * 100 : 0,
    }));

    res.json({
      products: enrichedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalProducts,
        pages: Math.ceil(totalProducts / limit),
      },
    });
  } catch (error) {
    console.error("Get retailer products error:", error);
    res.status(500).json({ error: "Failed to fetch retailer products" });
  }
};

// Add product to retailer inventory
exports.addProductToInventory = async (req, res) => {
  try {
    const retailerId = req.retailer.id;
    const {
      productId,
      wholesalePrice,
      mrp,
      minSellingPrice,
      initialStock,
      reorderLevel,
      warehouseLocation,
      supplier,
      costPrice,
    } = req.body;

    if (!productId || !wholesalePrice) {
      return res.status(400).json({
        error: "Product ID and wholesale price are required",
      });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
    });

    if (!product) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    // Check if already exists for this retailer
    const existing = await prisma.retailerProduct.findUnique({
      where: {
        retailerId_productId: {
          retailerId: retailerId,
          productId: parseInt(productId),
        },
      },
    });

    if (existing) {
      return res.status(400).json({
        error: "Product already exists in your inventory",
      });
    }

    // Create retailer product
    const retailerProduct = await prisma.retailerProduct.create({
      data: {
        retailerId: retailerId,
        productId: parseInt(productId),
        wholesalePrice: parseFloat(wholesalePrice),
        mrp: mrp ? parseFloat(mrp) : null,
        minSellingPrice: minSellingPrice ? parseFloat(minSellingPrice) : null,
        totalStock: parseInt(initialStock || 0),
        availableStock: parseInt(initialStock || 0),
        reorderLevel: parseInt(reorderLevel || 10),
      },
    });

    // Create inventory record if initial stock provided
    if (initialStock && parseInt(initialStock) > 0) {
      await prisma.retailerInventory.create({
        data: {
          retailerId: retailerId,
          retailerProductId: retailerProduct.id,
          currentStock: parseInt(initialStock),
          warehouseLocation,
          supplier,
          averageCostPrice: costPrice ? parseFloat(costPrice) : null,
          lastPurchasePrice: costPrice ? parseFloat(costPrice) : null,
          lastPurchaseDate: new Date(),
        },
      });

      // Record transaction
      await prisma.retailerTransaction.create({
        data: {
          retailerId: retailerId,
          type: "PURCHASE",
          amount:
            parseInt(initialStock) * parseFloat(costPrice || wholesalePrice),
          description: `Initial stock for ${product.name}`,
          productId: parseInt(productId),
        },
      });
    }

    const fullRetailerProduct = await prisma.retailerProduct.findUnique({
      where: { id: retailerProduct.id },
      include: {
        product: {
          include: {
            company: true,
          },
        },
        retailerInventory: true,
      },
    });

    res.status(201).json({
      message: "Product added to inventory successfully",
      retailerProduct: fullRetailerProduct,
    });
  } catch (error) {
    console.error("Add product to inventory error:", error);
    res.status(500).json({ error: "Failed to add product to inventory" });
  }
};

// Update retailer product
exports.updateRetailerProduct = async (req, res) => {
  try {
    const { retailerProductId } = req.params;
    const retailerId = req.retailer.id;
    const { wholesalePrice, mrp, minSellingPrice, reorderLevel, isActive } =
      req.body;

    const retailerProduct = await prisma.retailerProduct.findFirst({
      where: {
        id: parseInt(retailerProductId),
        retailerId: retailerId,
      },
    });

    if (!retailerProduct) {
      return res
        .status(404)
        .json({ error: "Product not found in your inventory" });
    }

    const updatedProduct = await prisma.retailerProduct.update({
      where: { id: parseInt(retailerProductId) },
      data: {
        wholesalePrice: wholesalePrice ? parseFloat(wholesalePrice) : undefined,
        mrp: mrp ? parseFloat(mrp) : undefined,
        minSellingPrice: minSellingPrice
          ? parseFloat(minSellingPrice)
          : undefined,
        reorderLevel: reorderLevel ? parseInt(reorderLevel) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
      include: {
        product: {
          include: {
            company: true,
          },
        },
        retailerInventory: true,
      },
    });

    res.json({
      message: "Product updated successfully",
      retailerProduct: updatedProduct,
    });
  } catch (error) {
    console.error("Update retailer product error:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
};

// Update stock quantity
exports.updateStock = async (req, res) => {
  try {
    const { retailerProductId } = req.params;
    const retailerId = req.retailer.id;
    const {
      quantity,
      type, // 'ADD' or 'REMOVE'
      reason,
      costPrice,
      supplier,
      warehouseLocation,
      batchNumber,
      expiryDate,
    } = req.body;

    if (!quantity || !type) {
      return res.status(400).json({
        error: "Quantity and type are required",
      });
    }

    const retailerProduct = await prisma.retailerProduct.findFirst({
      where: {
        id: parseInt(retailerProductId),
        retailerId: retailerId,
      },
      include: {
        product: true,
      },
    });

    if (!retailerProduct) {
      return res
        .status(404)
        .json({ error: "Product not found in your inventory" });
    }

    const quantityChange =
      type === "ADD" ? parseInt(quantity) : -parseInt(quantity);

    // Check if removal doesn't exceed available stock
    if (
      type === "REMOVE" &&
      retailerProduct.availableStock < parseInt(quantity)
    ) {
      return res.status(400).json({
        error: "Cannot remove more stock than available",
      });
    }

    // Update retailer product stock
    const updatedProduct = await prisma.retailerProduct.update({
      where: { id: parseInt(retailerProductId) },
      data: {
        totalStock: {
          increment: quantityChange,
        },
        availableStock: {
          increment: quantityChange,
        },
      },
    });

    // Update or create inventory record
    let inventory = await prisma.retailerInventory.findFirst({
      where: {
        retailerId: retailerId,
        retailerProductId: parseInt(retailerProductId),
      },
    });

    if (inventory) {
      await prisma.retailerInventory.update({
        where: { id: inventory.id },
        data: {
          currentStock: {
            increment: quantityChange,
          },
          lastPurchasePrice:
            type === "ADD" && costPrice ? parseFloat(costPrice) : undefined,
          lastPurchaseDate: type === "ADD" ? new Date() : undefined,
          supplier: type === "ADD" && supplier ? supplier : undefined,
        },
      });
    } else if (type === "ADD") {
      await prisma.retailerInventory.create({
        data: {
          retailerId: retailerId,
          retailerProductId: parseInt(retailerProductId),
          currentStock: parseInt(quantity),
          warehouseLocation,
          supplier,
          batchNumber,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          averageCostPrice: costPrice ? parseFloat(costPrice) : null,
          lastPurchasePrice: costPrice ? parseFloat(costPrice) : null,
          lastPurchaseDate: new Date(),
        },
      });
    }

    // Record transaction
    await prisma.retailerTransaction.create({
      data: {
        retailerId: retailerId,
        type: type === "ADD" ? "PURCHASE" : "ADJUSTMENT",
        amount:
          type === "ADD"
            ? parseInt(quantity) *
              parseFloat(costPrice || retailerProduct.wholesalePrice)
            : -(parseInt(quantity) * retailerProduct.wholesalePrice),
        description:
          reason ||
          `Stock ${type.toLowerCase()} for ${retailerProduct.product.name}`,
        productId: retailerProduct.productId,
      },
    });

    const fullProduct = await prisma.retailerProduct.findUnique({
      where: { id: parseInt(retailerProductId) },
      include: {
        product: {
          include: {
            company: true,
          },
        },
        retailerInventory: true,
      },
    });

    res.json({
      message: "Stock updated successfully",
      retailerProduct: fullProduct,
    });
  } catch (error) {
    console.error("Update stock error:", error);
    res.status(500).json({ error: "Failed to update stock" });
  }
};

// Get inventory summary
exports.getInventorySummary = async (req, res) => {
  try {
    const retailerId = req.retailer.id;

    // Total products
    const totalProducts = await prisma.retailerProduct.count({
      where: { retailerId, isActive: true },
    });

    // Stock summary
    const stockSummary = await prisma.retailerProduct.aggregate({
      where: { retailerId, isActive: true },
      _sum: {
        totalStock: true,
        availableStock: true,
        allocatedStock: true,
      },
    });

    // Low stock count
    const lowStockCount = await prisma.retailerProduct.count({
      where: {
        retailerId,
        isActive: true,
        availableStock: {
          lte: prisma.retailerProduct.fields.reorderLevel,
          gt: 0,
        },
      },
    });

    // Out of stock count
    const outOfStockCount = await prisma.retailerProduct.count({
      where: {
        retailerId,
        isActive: true,
        availableStock: 0,
      },
    });

    // Company breakdown
    const companyBreakdown = await prisma.retailerProduct.groupBy({
      by: ["productId"],
      where: { retailerId, isActive: true },
      _sum: {
        totalStock: true,
        availableStock: true,
      },
    });

    // Get company details
    const companyStats = {};
    for (const item of companyBreakdown) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { company: true },
      });

      const companyName = product.company.name;
      if (!companyStats[companyName]) {
        companyStats[companyName] = {
          productCount: 0,
          totalStock: 0,
          availableStock: 0,
        };
      }

      companyStats[companyName].productCount += 1;
      companyStats[companyName].totalStock += item._sum.totalStock || 0;
      companyStats[companyName].availableStock += item._sum.availableStock || 0;
    }

    res.json({
      summary: {
        totalProducts,
        totalStock: stockSummary._sum.totalStock || 0,
        availableStock: stockSummary._sum.availableStock || 0,
        allocatedStock: stockSummary._sum.allocatedStock || 0,
        lowStockCount,
        outOfStockCount,
      },
      companyBreakdown: Object.entries(companyStats).map(
        ([company, stats]) => ({
          company,
          ...stats,
        })
      ),
    });
  } catch (error) {
    console.error("Get inventory summary error:", error);
    res.status(500).json({ error: "Failed to fetch inventory summary" });
  }
};
