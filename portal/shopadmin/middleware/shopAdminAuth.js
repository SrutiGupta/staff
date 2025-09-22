const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// In-memory cache for shop admin data (since only one admin per shop)
const adminCache = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

/**
 * Optimized Shop Admin Authentication Middleware
 * Validates JWT token with minimal database queries
 * Uses caching since each shop has only one admin
 */
const shopAdminAuth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res.status(401).json({
        error: "AUTHENTICATION_REQUIRED",
        message: "Access denied. No token provided.",
      });
    }

    // Check if the header is in the 'Bearer <token>' format
    const tokenParts = authHeader.split(" ");
    if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
      return res.status(401).json({
        error: "INVALID_TOKEN_FORMAT",
        message: 'Invalid token format. Expected "Bearer <token>"',
      });
    }

    const token = tokenParts[1];

    // Verify JWT secret exists
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured!");
      return res.status(500).json({
        error: "SERVER_CONFIGURATION_ERROR",
        message: "Server configuration error.",
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
          error: "INVALID_TOKEN",
          message: "Invalid token.",
        });
      }
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          error: "TOKEN_EXPIRED",
          message: "Token expired. Please login again.",
        });
      }
      throw error;
    }

    const shopAdminId = decoded.shopAdminId;
    if (!shopAdminId) {
      return res.status(401).json({
        error: "INVALID_TOKEN_PAYLOAD",
        message: "Invalid token payload.",
      });
    }

    // Check cache first (since only one admin per shop, caching is safe)
    const cacheKey = `admin:${shopAdminId}`;
    const cached = adminCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      req.user = cached.data;
      return next();
    }

    // Query database with minimal data selection
    const shopAdmin = await prisma.shopAdmin.findUnique({
      where: { id: shopAdminId },
      select: {
        id: true,
        email: true,
        name: true,
        shopId: true,
        shop: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            lowStockThreshold: true,
          },
        },
      },
    });

    if (!shopAdmin) {
      // Clean up invalid cache entry
      adminCache.delete(cacheKey);
      return res.status(401).json({
        error: "SHOP_ADMIN_NOT_FOUND",
        message: "Shop Admin not found.",
      });
    }

    // Prepare user data
    const userData = {
      shopAdminId: shopAdmin.id,
      shopId: shopAdmin.shopId,
      email: shopAdmin.email,
      name: shopAdmin.name,
      shop: shopAdmin.shop,
    };

    // Cache the data (only one admin per shop, so safe to cache)
    adminCache.set(cacheKey, {
      data: userData,
      timestamp: Date.now(),
    });

    // Clean up old cache entries periodically
    if (adminCache.size > 1000) {
      const now = Date.now();
      for (const [key, value] of adminCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
          adminCache.delete(key);
        }
      }
    }

    req.user = userData;
    next();
  } catch (error) {
    console.error("Shop Admin Auth Error:", error);
    res.status(500).json({
      error: "SERVER_ERROR",
      message: "Server error during authentication.",
    });
  }
};

/**
 * Clear admin cache (useful for logout or admin updates)
 */
const clearAdminCache = (shopAdminId) => {
  const cacheKey = `admin:${shopAdminId}`;
  adminCache.delete(cacheKey);
};

/**
 * Clear all cache (useful for testing or memory cleanup)
 */
const clearAllCache = () => {
  adminCache.clear();
};

module.exports = {
  shopAdminAuth,
  clearAdminCache,
  clearAllCache,
};
