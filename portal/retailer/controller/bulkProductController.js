const prisma = require("../../../lib/prisma");

/**
 * BULK PRODUCT UPLOAD - Production Ready
 * Allows retailers to upload multiple products in JSON format
 * Supports: Companies, Products, Inventory, Pricing
 */

// ============================================
// 1. BULK UPLOAD PRODUCTS FROM JSON
// ============================================
exports.bulkUploadProducts = async (req, res) => {
  try {
    const { products } = req.body;
    const retailerId = req.retailer.id;

    // Validation
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        error: "Products array is required and must not be empty",
      });
    }

    if (products.length > 3000) {
      return res.status(400).json({
        error: "Maximum 3000 products can be uploaded at once",
      });
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: [],
      products: [],
    };

    // Process in batches of 100 for database safety (Prisma transactions)
    const BATCH_SIZE = 100;
    const totalBatches = Math.ceil(products.length / BATCH_SIZE);

    for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
      const batchStart = batchNum * BATCH_SIZE;
      const batchEnd = Math.min(batchStart + BATCH_SIZE, products.length);
      const batch = products.slice(batchStart, batchEnd);

      // Process each item with individual transaction (flexible error handling)
      for (let i = 0; i < batch.length; i++) {
        const productData = batch[i];
        const rowNumber = batchStart + i + 1;

        try {
          // Validate required fields
          const validationErrors = validateProductData(productData, i);
          if (validationErrors.length > 0) {
            results.failed++;
            results.errors.push({
              row: rowNumber,
              product: productData.name || "Unknown",
              errors: validationErrors,
            });
            continue;
          }

          // Wrap each item in its own transaction for isolation
          try {
            await prisma.$transaction(async (tx) => {
              // Get or create company
              let company = await tx.company.findUnique({
                where: { name: productData.companyName },
              });

              if (!company) {
                company = await tx.company.create({
                  data: {
                    name: productData.companyName,
                    description: productData.companyDescription || null,
                  },
                });
              }

              // Check if product already exists by SKU
              let product = await tx.product.findFirst({
                where: {
                  sku: productData.sku,
                },
              });

              // If product exists with different company, create new one with unique SKU
              if (product && product.companyId !== company.id) {
                // Create new product if SKU exists for different company
                const mapFrameType = (frameType) => {
                  const frameTypeMap = {
                    FULL_RIM: "RECTANGULAR",
                    HALF_RIM: "SEMI_RIMLESS",
                    RIMLESS: "RIMLESS",
                    AVIATOR: "AVIATOR",
                    CAT_EYE: "CAT_EYE",
                    WAYFARER: "WAYFARER",
                    CLUBMASTER: "CLUBMASTER",
                    ROUND: "ROUND",
                    OVAL: "OVAL",
                    SQUARE: "SQUARE",
                    SEMI_RIM: "SEMI_RIMLESS",
                    WRAP_AROUND: "WRAP_AROUND",
                  };
                  return frameType
                    ? frameTypeMap[frameType.toUpperCase()] || null
                    : null;
                };

                product = await tx.product.create({
                  data: {
                    name: productData.name,
                    description: productData.description || null,
                    basePrice: parseFloat(productData.basePrice),
                    barcode: productData.barcode || null,
                    sku: `${productData.sku}-${company.id}`,
                    eyewearType: productData.eyewearType.toUpperCase(),
                    frameType: mapFrameType(productData.frameType),
                    material: productData.material || null,
                    color: productData.color || null,
                    size: productData.size || null,
                    model: productData.model || null,
                    companyId: company.id,
                  },
                });
              } else if (!product) {
                // Map frameType to valid enum values
                const frameTypeMap = {
                  FULL_RIM: "RECTANGULAR",
                  HALF_RIM: "SEMI_RIMLESS",
                  RIMLESS: "RIMLESS",
                  AVIATOR: "AVIATOR",
                  CAT_EYE: "CAT_EYE",
                  WAYFARER: "WAYFARER",
                  CLUBMASTER: "CLUBMASTER",
                  ROUND: "ROUND",
                  OVAL: "OVAL",
                  SQUARE: "SQUARE",
                  SEMI_RIM: "SEMI_RIMLESS",
                  WRAP_AROUND: "WRAP_AROUND",
                };
                const frameTypeValue = productData.frameType
                  ? frameTypeMap[productData.frameType.toUpperCase()] || null
                  : null;

                // Create new product
                product = await tx.product.create({
                  data: {
                    name: productData.name,
                    description: productData.description || null,
                    basePrice: parseFloat(productData.basePrice),
                    barcode: productData.barcode || null,
                    sku: productData.sku,
                    eyewearType: productData.eyewearType.toUpperCase(),
                    frameType: frameTypeValue,
                    material: productData.material || null,
                    color: productData.color || null,
                    size: productData.size || null,
                    model: productData.model || null,
                    companyId: company.id,
                  },
                });
              }

              // Add to retailer inventory or update if exists
              if (
                productData.quantity !== undefined &&
                productData.quantity !== null
              ) {
                const quantity = parseInt(productData.quantity);
                console.log(
                  `Saving inventory for ${productData.name}: quantity=${quantity}`
                );

                await tx.retailerProduct.upsert({
                  where: {
                    retailerId_productId: {
                      retailerId,
                      productId: product.id,
                    },
                  },
                  update: {
                    totalStock: quantity,
                    allocatedStock: 0, // Reset allocated when updating
                    availableStock: quantity, // Make all available
                    mrp: productData.sellingPrice
                      ? parseFloat(productData.sellingPrice)
                      : null,
                  },
                  create: {
                    retailerId,
                    productId: product.id,
                    wholesalePrice: parseFloat(productData.basePrice),
                    mrp: productData.sellingPrice
                      ? parseFloat(productData.sellingPrice)
                      : null,
                    totalStock: quantity,
                    allocatedStock: 0,
                    availableStock: quantity,
                  },
                });
              }

              results.successful++;
              results.products.push({
                id: product.id,
                name: product.name,
                sku: product.sku,
                company: company.name,
                quantity: productData.quantity || 0,
                sellingPrice: productData.sellingPrice || productData.basePrice,
              });
            });
          } catch (txError) {
            // Item-level transaction error
            results.failed++;
            results.errors.push({
              row: rowNumber,
              product: productData.name || "Unknown",
              errors: [txError.message],
            });
          }
        } catch (itemError) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            product: productData.name || "Unknown",
            errors: [itemError.message],
          });
        }
      }
    }

    // Return results
    res.status(201).json({
      message: `Bulk upload completed: ${results.successful} successful, ${results.failed} failed`,
      summary: {
        total: products.length,
        successful: results.successful,
        failed: results.failed,
      },
      products: results.products.slice(0, 50), // Show first 50
      errors: results.errors.slice(0, 20), // Show first 20 errors
      hasMoreProducts: results.products.length > 50,
      hasMoreErrors: results.errors.length > 20,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({ error: "Failed to process bulk upload" });
  }
};

// ============================================
// 2. EXPORT RETAILER PRODUCTS AS JSON
// ============================================
exports.exportRetailerProducts = async (req, res) => {
  try {
    const retailerId = req.retailer.id;

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

    // Format for export
    const exportData = retailerProducts.map((rp) => ({
      sku: rp.product.sku,
      name: rp.product.name,
      description: rp.product.description,
      companyName: rp.product.company.name,
      companyDescription: rp.product.company.description,
      eyewearType: rp.product.eyewearType,
      frameType: rp.product.frameType,
      material: rp.product.material,
      color: rp.product.color,
      size: rp.product.size,
      model: rp.product.model,
      barcode: rp.product.barcode,
      basePrice: rp.product.basePrice,
      sellingPrice: rp.mrp || rp.product.basePrice,
      quantity: rp.totalStock,
      minStockLevel: rp.reorderLevel,
      maxStockLevel: null, // Not tracked separately
      lastUpdated: rp.updatedAt,
    }));

    // Send as JSON file
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="retailer-products-${Date.now()}.json"`
    );
    res.json(exportData);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ error: "Failed to export products" });
  }
};

// ============================================
// 3. BULK UPDATE PRODUCT INVENTORY
// ============================================
exports.bulkUpdateInventory = async (req, res) => {
  try {
    const { updates } = req.body;
    const retailerId = req.retailer.id;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        error: "Updates array is required",
      });
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < updates.length; i++) {
      const update = updates[i];

      try {
        // Find retailer product
        const retailerProduct = await prisma.retailerProduct.findFirst({
          where: {
            AND: [
              { retailerId },
              {
                product: {
                  sku: update.sku,
                },
              },
            ],
          },
          include: {
            product: true,
          },
        });

        if (!retailerProduct) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            sku: update.sku,
            error: "Product not found in retailer inventory",
          });
          continue;
        }

        // Update inventory with correct field names
        await prisma.retailerProduct.update({
          where: { id: retailerProduct.id },
          data: {
            totalStock:
              update.quantity !== undefined ? update.quantity : undefined,
            mrp: update.sellingPrice
              ? parseFloat(update.sellingPrice)
              : undefined,
            reorderLevel: update.minStockLevel || undefined,
          },
        });

        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          sku: update.sku,
          error: error.message,
        });
      }
    }

    res.json({
      message: `Bulk inventory update completed: ${results.successful} successful, ${results.failed} failed`,
      summary: {
        total: updates.length,
        successful: results.successful,
        failed: results.failed,
      },
      errors: results.errors,
    });
  } catch (error) {
    console.error("Bulk update error:", error);
    res.status(500).json({ error: "Failed to process bulk update" });
  }
};

// ============================================
// 4. BULK DISTRIBUTE TO SHOPS
// ============================================
exports.bulkDistributeToShops = async (req, res) => {
  try {
    const { distributions } = req.body;
    const retailerId = req.retailer.id;

    if (
      !distributions ||
      !Array.isArray(distributions) ||
      distributions.length === 0
    ) {
      return res.status(400).json({
        error: "Distributions array is required",
      });
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: [],
      distributions: [],
    };

    for (let i = 0; i < distributions.length; i++) {
      const dist = distributions[i];

      try {
        // Validate
        if (!dist.retailerShopId || !dist.productId || !dist.quantity) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            error: "retailerShopId, productId, and quantity are required",
          });
          continue;
        }

        // Verify shop belongs to retailer
        const shop = await prisma.retailerShop.findFirst({
          where: {
            AND: [{ id: parseInt(dist.retailerShopId) }, { retailerId }],
          },
        });

        if (!shop) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            error: "Shop not found or does not belong to retailer",
          });
          continue;
        }

        // Verify retailer has product - lookup by retailerProductId
        const retailerProduct = await prisma.retailerProduct.findFirst({
          where: {
            AND: [{ retailerId }, { id: parseInt(dist.productId) }],
          },
        });

        if (!retailerProduct) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            error: "Product not found in retailer inventory",
          });
          continue;
        }

        // Check available stock (totalStock - allocatedStock)
        const availableQty =
          retailerProduct.totalStock - retailerProduct.allocatedStock;
        if (availableQty < dist.quantity) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            error: `Insufficient product quantity. Available: ${availableQty}, Requested: ${dist.quantity}`,
          });
          continue;
        }

        // Create distribution using shopDistribution model
        const distribution = await prisma.shopDistribution.create({
          data: {
            retailerId,
            retailerShopId: parseInt(dist.retailerShopId),
            retailerProductId: retailerProduct.id,
            quantity: parseInt(dist.quantity),
            unitPrice: dist.unitPrice ? parseFloat(dist.unitPrice) : null,
            totalAmount: dist.totalPrice ? parseFloat(dist.totalPrice) : null,
            deliveryStatus: "PENDING",
            paymentStatus: "PENDING",
          },
        });

        // Get shop ID from retailer shop relationship
        const shopData = await prisma.retailerShop.findUnique({
          where: { id: parseInt(dist.retailerShopId) },
          include: { shop: true },
        });

        // Create incoming shipment record for shop admin visibility
        // This allows shop admin to see expected stock BEFORE staff creates stock receipt
        await prisma.incomingShipment.create({
          data: {
            shopId: shopData.shop.id,
            productId: retailerProduct.productId,
            shopDistributionId: distribution.id,
            expectedQuantity: parseInt(dist.quantity),
            status: "EXPECTED",
            distributionDate: new Date(),
            notes: `Distributed from retailer: ${retailerProduct.retailer.id}`,
          },
        });

        // Update retailer inventory (reduce available quantity)
        await prisma.retailerProduct.update({
          where: { id: retailerProduct.id },
          data: {
            allocatedStock:
              retailerProduct.allocatedStock + parseInt(dist.quantity),
            availableStock:
              retailerProduct.availableStock - parseInt(dist.quantity),
          },
        });

        results.successful++;
        results.distributions.push({
          distributionId: distribution.id,
          shopId: dist.retailerShopId,
          productId: dist.productId,
          quantity: dist.quantity,
          status: "PENDING",
        });
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          error: error.message,
        });
      }
    }

    res.status(201).json({
      message: `Bulk distribution completed: ${results.successful} successful, ${results.failed} failed`,
      summary: {
        total: distributions.length,
        successful: results.successful,
        failed: results.failed,
      },
      distributions: results.distributions,
      errors: results.errors,
    });
  } catch (error) {
    console.error("Bulk distribute error:", error);
    res.status(500).json({ error: "Failed to process bulk distribution" });
  }
};

// ============================================
// 5. GET UPLOAD TEMPLATE
// ============================================
exports.getUploadTemplate = async (req, res) => {
  try {
    const template = [
      {
        sku: "RB-AV-001",
        name: "Ray-Ban Aviator Classic",
        description: "Classic aviator sunglasses with metal frame",
        companyName: "Ray-Ban",
        companyDescription: "Premium eyewear brand",
        eyewearType: "SUNGLASSES",
        frameType: "FULL_RIM",
        material: "Metal",
        color: "Gold",
        size: "Medium",
        model: "RB3025",
        barcode: "1234567890123",
        basePrice: 200.0,
        sellingPrice: 250.0,
        quantity: 50,
        minStockLevel: 10,
        maxStockLevel: 100,
      },
      {
        sku: "OAK-HB-001",
        name: "Oakley Holbrook",
        description: "Lifestyle sunglasses with Prizm lens technology",
        companyName: "Oakley",
        companyDescription: "Sports eyewear brand",
        eyewearType: "SUNGLASSES",
        frameType: "FULL_RIM",
        material: "Plastic",
        color: "Matte Black",
        size: "Large",
        model: "OO9102",
        barcode: "9876543210987",
        basePrice: 180.0,
        sellingPrice: 220.0,
        quantity: 75,
        minStockLevel: 15,
        maxStockLevel: 150,
      },
    ];

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=bulk-upload-template.json"
    );
    res.json(template);
  } catch (error) {
    console.error("Template error:", error);
    res.status(500).json({ error: "Failed to generate template" });
  }
};

// ============================================
// VALIDATION HELPER
// ============================================
function validateProductData(data, index) {
  const errors = [];

  if (!data.sku || typeof data.sku !== "string") {
    errors.push("SKU is required and must be a string");
  }
  if (!data.name || typeof data.name !== "string") {
    errors.push("Product name is required and must be a string");
  }
  if (!data.companyName || typeof data.companyName !== "string") {
    errors.push("Company name is required and must be a string");
  }
  if (!data.basePrice || isNaN(parseFloat(data.basePrice))) {
    errors.push("Base price is required and must be a number");
  }
  if (!data.eyewearType) {
    errors.push("Eyewear type is required (GLASSES, SUNGLASSES, or LENSES)");
  } else if (
    !["GLASSES", "SUNGLASSES", "LENSES"].includes(
      data.eyewearType.toUpperCase()
    )
  ) {
    errors.push("Invalid eyewear type. Must be GLASSES, SUNGLASSES, or LENSES");
  }

  // Conditional validation for glasses and sunglasses
  if (["GLASSES", "SUNGLASSES"].includes(data.eyewearType?.toUpperCase())) {
    if (!data.frameType) {
      errors.push("Frame type is required for glasses and sunglasses");
    } else if (
      !["FULL_RIM", "HALF_RIM", "RIMLESS"].includes(
        data.frameType.toUpperCase()
      )
    ) {
      errors.push("Invalid frame type. Must be FULL_RIM, HALF_RIM, or RIMLESS");
    }
  }

  return errors;
}
