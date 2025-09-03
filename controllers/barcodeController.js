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
        inventory: true,
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
        inventory: true,
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
        name: product.name,
        description: product.description,
        price: `$${product.price.toFixed(2)}`,
        data: product.barcode,
      };
    }

    // Validate required fields
    if (!productDetails.name || !productDetails.price || !productDetails.data) {
      return res.status(400).json({
        error: "Missing required fields: name, price, data (barcode)",
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
