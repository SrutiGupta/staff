const Redis = require("redis");
const { PrismaClient } = require("@prisma/client");

// Redis disabled for shop admin - using in-memory cache only
let redisClient = null;
console.log("Shop Admin Cache Service: Using in-memory cache (Redis disabled)");

class CacheService {
  constructor() {
    this.redis = null; // Redis disabled
    this.defaultTTL = 300; // 5 minutes default TTL
    this.memoryCache = new Map(); // In-memory cache
    this.maxMemoryCacheSize = 1000;
  }

  /**
   * Generate cache key for shop admin operations
   */
  generateKey(shopId, operation, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map((key) => `${key}:${params[key]}`)
      .join("|");

    return `shopadmin:${shopId}:${operation}:${paramString}`;
  }

  /**
   * Get cached data
   */
  async get(key) {
    try {
      if (this.redis && this.redis.isReady) {
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
      } else {
        // Fallback to memory cache
        const cached = this.memoryCache.get(key);
        if (cached && cached.expires > Date.now()) {
          return cached.data;
        } else if (cached) {
          this.memoryCache.delete(key);
        }
        return null;
      }
    } catch (error) {
      console.warn("Cache get error:", error);
      return null;
    }
  }

  /**
   * Set cached data
   */
  async set(key, data, ttl = this.defaultTTL) {
    try {
      if (this.redis && this.redis.isReady) {
        await this.redis.setEx(key, ttl, JSON.stringify(data));
      } else {
        // Fallback to memory cache
        if (this.memoryCache.size >= this.maxMemoryCacheSize) {
          // Remove oldest entries
          const firstKey = this.memoryCache.keys().next().value;
          this.memoryCache.delete(firstKey);
        }

        this.memoryCache.set(key, {
          data,
          expires: Date.now() + ttl * 1000,
        });
      }
    } catch (error) {
      console.warn("Cache set error:", error);
    }
  }

  /**
   * Delete cached data
   */
  async del(key) {
    try {
      if (this.redis && this.redis.isReady) {
        await this.redis.del(key);
      } else {
        this.memoryCache.delete(key);
      }
    } catch (error) {
      console.warn("Cache delete error:", error);
    }
  }

  /**
   * Clear all cache for a shop
   */
  async clearShopCache(shopId) {
    try {
      if (this.redis && this.redis.isReady) {
        const pattern = `shopadmin:${shopId}:*`;
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(keys);
        }
      } else {
        // Clear memory cache
        const keysToDelete = [];
        for (const [key] of this.memoryCache) {
          if (key.startsWith(`shopadmin:${shopId}:`)) {
            keysToDelete.push(key);
          }
        }
        keysToDelete.forEach((key) => this.memoryCache.delete(key));
      }
    } catch (error) {
      console.warn("Cache clear error:", error);
    }
  }

  /**
   * Cache middleware for specific operations
   */
  middleware(operation, ttl = this.defaultTTL, paramExtractor = null) {
    return async (req, res, next) => {
      try {
        const shopId = req.user?.shopId;
        if (!shopId) return next();

        const params = paramExtractor
          ? paramExtractor(req)
          : {
              ...req.query,
              ...req.params,
            };

        const cacheKey = this.generateKey(shopId, operation, params);
        const cachedData = await this.get(cacheKey);

        if (cachedData) {
          return res.json(cachedData);
        }

        // Store original json method
        const originalJson = res.json;

        // Override json method to cache the response
        res.json = async function (data) {
          if (res.statusCode === 200 && data && typeof data === "object") {
            await cacheService.set(cacheKey, data, ttl);
          }
          originalJson.call(this, data);
        };

        next();
      } catch (error) {
        console.warn("Cache middleware error:", error);
        next();
      }
    };
  }

  /**
   * Invalidate cache when data changes
   */
  async invalidateRelatedCache(shopId, operations = []) {
    const operationsToInvalidate = [
      "dashboard_metrics",
      "dashboard_growth",
      "recent_activities",
      "inventory_status",
      "staff_list",
      ...operations,
    ];

    for (const operation of operationsToInvalidate) {
      try {
        if (this.redis && this.redis.isReady) {
          const pattern = `shopadmin:${shopId}:${operation}:*`;
          const keys = await this.redis.keys(pattern);
          if (keys.length > 0) {
            await this.redis.del(keys);
          }
        } else {
          // Clear memory cache
          const keysToDelete = [];
          for (const [key] of this.memoryCache) {
            if (key.startsWith(`shopadmin:${shopId}:${operation}:`)) {
              keysToDelete.push(key);
            }
          }
          keysToDelete.forEach((key) => this.memoryCache.delete(key));
        }
      } catch (error) {
        console.warn(`Error invalidating cache for ${operation}:`, error);
      }
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

// Redis is disabled for shop admin - using in-memory cache only
console.log("Shop Admin Cache Service initialized with in-memory cache");

module.exports = cacheService;
