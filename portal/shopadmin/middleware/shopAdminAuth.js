const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Shop Admin Authentication Middleware
 * Validates JWT token and ensures user is a Shop Admin
 */
const shopAdminAuth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    // Check if the header is in the 'Bearer <token>' format
    const tokenParts = authHeader.split(" ");
    if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
      return res
        .status(401)
        .json({ message: 'Invalid token format. Expected "Bearer <token>"' });
    }

    const token = tokenParts[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find shop admin in database
    const shopAdmin = await prisma.shopAdmin.findUnique({
      where: { id: decoded.shopAdminId },
      include: {
        shop: {
          include: {
            staff: true,
          },
        },
      },
    });

    if (!shopAdmin) {
      return res.status(401).json({ message: "Shop Admin not found." });
    }

    // Add shop admin info to request
    req.user = {
      shopAdminId: shopAdmin.id,
      shopId: shopAdmin.shopId,
      email: shopAdmin.email,
      name: shopAdmin.name,
      shop: shopAdmin.shop,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token." });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired." });
    }
    console.error("Shop Admin Auth Error:", error);
    res.status(500).json({ message: "Server error during authentication." });
  }
};

module.exports = shopAdminAuth;
