const bwipjs = require("bwip-js");
const { createCanvas, loadImage } = require("canvas");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Generate a unique barcode for a product
function generateUniqueBarcode(productId, companyPrefix = "EYE") {
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  const paddedId = productId.toString().padStart(4, "0"); // Product ID padded to 4 digits
  return `${companyPrefix}${paddedId}${timestamp}`;
}

// Generate a unique SKU (Stock Keeping Unit) for a product
function generateUniqueSKU(
  productId,
  companyCode,
  eyewearType,
  frameType = null
) {
  const paddedId = productId.toString().padStart(4, "0");
  const eyewearCode = eyewearType.substring(0, 3).toUpperCase(); // GLA, SUN, LEN
  const frameCode = frameType ? frameType.substring(0, 3).toUpperCase() : "GEN";
  const timestamp = Date.now().toString().slice(-4); // Last 4 digits

  return `${companyCode}-${eyewearCode}-${frameCode}-${paddedId}-${timestamp}`;
  // Example: RAY-SUN-AVI-0003-5678 (Ray-Ban Sunglasses Aviator Product#3)
}

// Generate and assign barcode to a product without barcode
exports.generateBarcodeForProduct = async (req, res) => {
  const { productId } = req.params;
  const { companyPrefix } = req.body; // Optional company prefix (default: 'EYE')

  try {
    // Check if product exists and doesn't have a barcode
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
      include: { company: true },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    if (product.barcode) {
      return res.status(400).json({
        error: "Product already has a barcode.",
        existingBarcode: product.barcode,
      });
    }

    // Generate unique barcode
    let newBarcode;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      newBarcode = generateUniqueBarcode(
        product.id,
        companyPrefix || product.company.name.substring(0, 3).toUpperCase()
      );

      // Check if barcode is unique
      const existingProduct = await prisma.product.findUnique({
        where: { barcode: newBarcode },
      });

      if (!existingProduct) {
        isUnique = true;
      } else {
        attempts++;
        // Add random suffix if collision occurs
        newBarcode += Math.floor(Math.random() * 100)
          .toString()
          .padStart(2, "0");
      }
    }

    if (!isUnique) {
      return res.status(500).json({
        error: "Unable to generate unique barcode. Please try again.",
      });
    }

    // Update product with new barcode
    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(productId) },
      data: { barcode: newBarcode },
      include: {
        company: true,
        shopInventory: true,
      },
    });

    res.status(200).json({
      message: "Barcode generated successfully",
      product: updatedProduct,
      generatedBarcode: newBarcode,
      canNowScan: true,
      nextStep: "Use this barcode for stock-in/stock-out operations",
    });
  } catch (error) {
    console.error("Error generating barcode for product:", error);
    res
      .status(500)
      .json({ error: "Something went wrong while generating barcode." });
  }
};

// Generate and assign SKU to a product without SKU
exports.generateSKUForProduct = async (req, res) => {
  const { productId } = req.params;
  const { companyCode } = req.body; // Optional company code override

  try {
    // Check if product exists and doesn't have a SKU
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
      include: { company: true },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    if (product.sku) {
      return res.status(400).json({
        error: "Product already has a SKU.",
        existingSKU: product.sku,
      });
    }

    // Generate unique SKU
    let newSKU;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      const companyCodeToUse =
        companyCode || product.company.name.substring(0, 3).toUpperCase();
      newSKU = generateUniqueSKU(
        product.id,
        companyCodeToUse,
        product.eyewearType,
        product.frameType
      );

      // Check if SKU is unique
      const existingProduct = await prisma.product.findUnique({
        where: { sku: newSKU },
      });

      if (!existingProduct) {
        isUnique = true;
      } else {
        attempts++;
        // Add random suffix if collision occurs
        newSKU += Math.floor(Math.random() * 100)
          .toString()
          .padStart(2, "0");
      }
    }

    if (!isUnique) {
      return res.status(500).json({
        error: "Unable to generate unique SKU. Please try again.",
      });
    }

    // Update product with new SKU
    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(productId) },
      data: { sku: newSKU },
      include: {
        company: true,
        shopInventory: true,
      },
    });

    res.status(200).json({
      message: "SKU generated successfully",
      product: updatedProduct,
      generatedSKU: newSKU,
      skuBreakdown: {
        company: updatedProduct.company.name.substring(0, 3).toUpperCase(),
        eyewearType: product.eyewearType.substring(0, 3).toUpperCase(),
        frameType: product.frameType
          ? product.frameType.substring(0, 3).toUpperCase()
          : "GEN",
        productId: product.id.toString().padStart(4, "0"),
        timestamp: newSKU.split("-").pop(),
      },
      nextStep:
        "SKU can now be used for internal tracking and inventory management",
    });
  } catch (error) {
    console.error("Error generating SKU for product:", error);
    res
      .status(500)
      .json({ error: "Something went wrong while generating SKU." });
  }
};

// Get products without barcodes (for barcode generation)
exports.getProductsWithoutBarcodes = async (req, res) => {
  try {
    const { companyId, eyewearType } = req.query;

    const whereCondition = {
      barcode: null, // Products without barcodes
    };

    if (companyId) {
      whereCondition.companyId = parseInt(companyId);
    }

    if (eyewearType) {
      whereCondition.eyewearType = eyewearType;
    }

    const products = await prisma.product.findMany({
      where: whereCondition,
      include: {
        company: true,
        shopInventory: true,
      },
      orderBy: [
        { company: { name: "asc" } },
        { eyewearType: "asc" },
        { name: "asc" },
      ],
    });

    res.status(200).json({
      products,
      count: products.length,
      message:
        products.length === 0
          ? "All products have barcodes assigned"
          : `${products.length} products need barcode generation`,
    });
  } catch (error) {
    console.error("Error fetching products without barcodes:", error);
    res.status(500).json({ error: "Something went wrong." });
  }
};

// Generate barcode label (existing function - enhanced)
exports.generateBarcodeLabel = async (req, res) => {
  try {
    // Data will come from frontend (query or body)
    const {
      productId, // Optional: If provided, fetch product details
      name, // Product name
      description, // Product description
      price, // Product price
      data, // Barcode value (SKU, ID, etc.)
      bcid = "code128", // Barcode type
      scale = 3, // Scaling
      height = 20, // Barcode height
      includetext = false, // Barcode text, default false since we draw our own
    } = req.body;

    let productDetails = { name, description, price, data };

    // Ensure price is properly formatted if provided manually
    if (price && !productId) {
      // If price is a number, format it with $ and 2 decimal places
      if (typeof price === "number") {
        productDetails.price = `$${price.toFixed(2)}`;
      } else if (typeof price === "string" && !price.startsWith("$")) {
        // If price is a string number without $, add $ and format
        const numPrice = parseFloat(price);
        if (!isNaN(numPrice)) {
          productDetails.price = `$${numPrice.toFixed(2)}`;
        }
      }
    }

    // If productId is provided, fetch product details from database
    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: parseInt(productId) },
        include: { company: true },
      });

      if (!product) {
        return res.status(404).json({ error: "Product not found." });
      }

      if (!product.barcode) {
        return res.status(400).json({
          error: "Product does not have a barcode. Generate barcode first.",
          suggestion: `Use POST /api/barcode/generate/${productId} to generate barcode`,
        });
      }

      productDetails = {
        name: product.name || "Unknown Product",
        description: product.description || "",
        price: `$${(product.basePrice || 0).toFixed(2)}`,
        data: product.barcode,
      };
    }

    // Validate required fields
    if (!productDetails.name || !productDetails.price || !productDetails.data) {
      return res.status(400).json({
        error: "Missing required fields: name, price, data (barcode)",
        received: {
          name: productDetails.name,
          price: productDetails.price,
          data: productDetails.data,
        },
      });
    }

    // Generate barcode buffer
    const barcodeBuffer = await bwipjs.toBuffer({
      bcid,
      text: productDetails.data,
      scale: parseInt(scale),
      height: parseInt(height),
      includetext: includetext === true,
    });

    // Create canvas for full label
    const canvas = createCanvas(400, 150);
    const ctx = canvas.getContext("2d");

    // Background white
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Product name
    ctx.font = "bold 16px Arial";
    ctx.fillStyle = "#000";
    ctx.fillText(productDetails.name, 10, 25);

    // Description (optional)
    if (productDetails.description) {
      ctx.font = "12px Arial";
      ctx.fillText(productDetails.description, 10, 45);
    }

    // Price (align right)
    ctx.font = "bold 14px Arial";
    ctx.fillText(productDetails.price, 300, 25);

    // Company info (if available from productId)
    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: parseInt(productId) },
        include: { company: true },
      });
      if (product?.company) {
        ctx.font = "10px Arial";
        ctx.fillText(product.company.name, 10, 140);
      }
    }

    // Load barcode onto canvas
    const barcodeImg = await loadImage(barcodeBuffer);
    ctx.drawImage(barcodeImg, 10, 60, 300, 60);

    // Barcode text below the barcode
    ctx.font = "12px Arial";
    ctx.fillText(productDetails.data, 10, 135);

    // Send final label as PNG
    res.set("Content-Type", "image/png");
    res.send(canvas.toBuffer());
  } catch (error) {
    console.error("Error generating barcode label:", error.message);
    res
      .status(500)
      .json({ error: "Internal server error while generating label" });
  }
};
