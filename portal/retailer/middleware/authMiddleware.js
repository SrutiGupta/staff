const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Middleware to authenticate retailer
exports.authenticateRetailer = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is for retailer
    if (decoded.type !== "retailer") {
      return res
        .status(401)
        .json({ error: "Invalid token type. Retailer access required." });
    }

    // Find retailer in database
    const retailer = await prisma.retailer.findUnique({
      where: { id: decoded.retailerId },
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        isActive: true,
      },
    });

    if (!retailer) {
      return res
        .status(401)
        .json({ error: "Invalid token. Retailer not found." });
    }

    if (!retailer.isActive) {
      return res.status(401).json({ error: "Account is deactivated." });
    }

    // Add retailer info to request object
    req.retailer = retailer;
    next();
  } catch (error) {
    console.error("Authentication error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token." });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired." });
    }

    res.status(500).json({ error: "Authentication failed." });
  }
};

// Optional middleware for routes that work with or without authentication
exports.optionalAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      // No token provided, continue without authentication
      req.retailer = null;
      return next();
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is for retailer
    if (decoded.type !== "retailer") {
      req.retailer = null;
      return next();
    }

    // Find retailer in database
    const retailer = await prisma.retailer.findUnique({
      where: { id: decoded.retailerId },
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        isActive: true,
      },
    });

    if (!retailer || !retailer.isActive) {
      req.retailer = null;
      return next();
    }

    // Add retailer info to request object
    req.retailer = retailer;
    next();
  } catch (error) {
    // If authentication fails, continue without auth
    req.retailer = null;
    next();
  }
};

// Middleware to check if retailer owns a specific shop
exports.checkShopOwnership = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const retailerId = req.retailer.id;

    // Check if retailer has access to this shop
    const retailerShop = await prisma.retailerShop.findFirst({
      where: {
        retailerId: retailerId,
        shopId: parseInt(shopId),
        isActive: true,
      },
    });

    if (!retailerShop) {
      return res.status(403).json({
        error: "Access denied. You don't have permission to access this shop.",
      });
    }

    // Add shop relationship info to request
    req.retailerShop = retailerShop;
    next();
  } catch (error) {
    console.error("Shop ownership check error:", error);
    res.status(500).json({ error: "Authorization check failed." });
  }
};

// Middleware to validate request data
exports.validateRegistration = (req, res, next) => {
  const { email, password, name } = req.body;

  // Check required fields
  if (!email || !password || !name) {
    return res.status(400).json({
      error: "Email, password, and name are required.",
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  // Validate password strength
  if (password.length < 8) {
    return res.status(400).json({
      error: "Password must be at least 8 characters long.",
    });
  }

  next();
};

exports.validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "Email and password are required.",
    });
  }

  next();
};

exports.validatePasswordChange = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      error: "Current password and new password are required.",
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      error: "New password must be at least 8 characters long.",
    });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({
      error: "New password must be different from current password.",
    });
  }

  next();
};
