const Redis = require("redis");

/**
 * Universal Cache Service for All Portals
 * Supports: Shop Admin, Staff, Doctor, Retailer, Company portals
 */
class UniversalCacheService {
  constructor() {
    this.redis = null;
    this.inMemoryCache = new Map();
    this.inMemoryExpiry = new Map();
    this.isRedisConnected = false;
    this.maxInMemorySize = 2000; // Increased for multi-portal usage

    // Portal-specific configurations
    this.portalConfigs = {
      shopadmin: {
        prefix: "sa",
        defaultTTL: 300, // 5 minutes
        maxCacheSize: 500,
      },
      staff: {
        prefix: "st",
        defaultTTL: 180, // 3 minutes
        maxCacheSize: 300,
      },
      doctor: {
        prefix: "dr",
        defaultTTL: 600, // 10 minutes (medical data changes less frequently)
        maxCacheSize: 400,
      },
      retailer: {
        prefix: "rt",
        defaultTTL: 900, // 15 minutes
        maxCacheSize: 600,
      },
      company: {
        prefix: "co",
        defaultTTL: 1800, // 30 minutes (company data very stable)
        maxCacheSize: 200,
      },
    };

    this.initializeRedis();
  }

  /**
   * Initialize Redis connection with fallback to in-memory cache
   */
  async initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

      this.redis = Redis.createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 5) {
              console.warn(
                "Redis: Max reconnection attempts reached, using in-memory cache"
              );
              return false;
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      this.redis.on("error", (err) => {
        console.warn("Redis connection error:", err.message);
        this.isRedisConnected = false;
      });

      this.redis.on("connect", () => {
        console.log("Universal Cache Service: Redis connected");
        this.isRedisConnected = true;
      });

      this.redis.on("disconnect", () => {
        console.warn("Redis disconnected, falling back to in-memory cache");
        this.isRedisConnected = false;
      });

      await this.redis.connect();
    } catch (error) {
      console.warn(
        "Failed to initialize Redis, using in-memory cache:",
        error.message
      );
      this.isRedisConnected = false;
    }
  }

  /**
   * Generate portal-specific cache key
   * @param {string} portal - Portal type (shopadmin, staff, doctor, retailer, company)
   * @param {string|number} entityId - Shop ID, Staff ID, Doctor ID, etc.
   * @param {string} operation - Operation name
   * @param {object} params - Additional parameters
   */
  generateKey(portal, entityId, operation, params = {}) {
    const config = this.portalConfigs[portal];
    if (!config) {
      throw new Error(`Unsupported portal: ${portal}`);
    }

    const paramString = Object.keys(params)
      .sort()
      .map((key) => `${key}:${params[key]}`)
      .join("|");

    return `${config.prefix}:${entityId}:${operation}${
      paramString ? `:${paramString}` : ""
    }`;
  }

  /**
   * Get value from cache with portal-specific handling
   */
  async get(portal, entityId, operation, params = {}) {
    const key = this.generateKey(portal, entityId, operation, params);

    try {
      // Try Redis first if connected
      if (this.isRedisConnected && this.redis) {
        const value = await this.redis.get(key);
        if (value) {
          return JSON.parse(value);
        }
      }
    } catch (error) {
      console.warn(`Redis get error for key ${key}:`, error.message);
    }

    // Fallback to in-memory cache
    return this.getFromMemory(key);
  }

  /**
   * Set value in cache with portal-specific TTL
   */
  async set(portal, entityId, operation, value, customTTL = null, params = {}) {
    const key = this.generateKey(portal, entityId, operation, params);
    const config = this.portalConfigs[portal];
    const ttl = customTTL || config.defaultTTL;
    const serializedValue = JSON.stringify(value);

    try {
      // Try Redis first if connected
      if (this.isRedisConnected && this.redis) {
        await this.redis.setEx(key, ttl, serializedValue);
      }
    } catch (error) {
      console.warn(`Redis set error for key ${key}:`, error.message);
    }

    // Always set in memory as backup/fallback
    this.setInMemory(key, value, ttl);
  }

  /**
   * Delete cache entries for specific portal and entity
   */
  async clearPortalCache(portal, entityId) {
    const config = this.portalConfigs[portal];
    const pattern = `${config.prefix}:${entityId}:*`;

    try {
      // Clear from Redis
      if (this.isRedisConnected && this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(keys);
        }
      }
    } catch (error) {
      console.warn(
        `Redis clearPortalCache error for pattern ${pattern}:`,
        error.message
      );
    }

    // Clear from memory cache
    const regex = new RegExp(pattern.replace(/\*/g, ".*"));
    for (const key of this.inMemoryCache.keys()) {
      if (regex.test(key)) {
        this.inMemoryCache.delete(key);
        this.inMemoryExpiry.delete(key);
      }
    }
  }

  /**
   * Get from in-memory cache with expiry check
   */
  getFromMemory(key) {
    this.cleanupExpiredMemoryEntries();

    const expiry = this.inMemoryExpiry.get(key);
    if (expiry && Date.now() > expiry) {
      this.inMemoryCache.delete(key);
      this.inMemoryExpiry.delete(key);
      return null;
    }

    return this.inMemoryCache.get(key) || null;
  }

  /**
   * Set in memory cache with TTL
   */
  setInMemory(key, value, ttlSeconds) {
    // Cleanup and enforce size limit
    this.cleanupExpiredMemoryEntries();

    if (this.inMemoryCache.size >= this.maxInMemorySize) {
      // Remove oldest entries (LRU-like behavior)
      const keysToRemove = Math.floor(this.maxInMemorySize * 0.1); // Remove 10%
      const allKeys = Array.from(this.inMemoryCache.keys());
      for (let i = 0; i < keysToRemove && allKeys[i]; i++) {
        this.inMemoryCache.delete(allKeys[i]);
        this.inMemoryExpiry.delete(allKeys[i]);
      }
    }

    this.inMemoryCache.set(key, value);
    this.inMemoryExpiry.set(key, Date.now() + ttlSeconds * 1000);
  }

  /**
   * Clean up expired in-memory cache entries
   */
  cleanupExpiredMemoryEntries() {
    const now = Date.now();
    for (const [key, expiry] of this.inMemoryExpiry.entries()) {
      if (now > expiry) {
        this.inMemoryCache.delete(key);
        this.inMemoryExpiry.delete(key);
      }
    }
  }

  /**
   * Get portal-specific cache statistics
   */
  getPortalStats(portal) {
    const config = this.portalConfigs[portal];
    const prefix = `${config.prefix}:`;

    let memoryCount = 0;
    for (const key of this.inMemoryCache.keys()) {
      if (key.startsWith(prefix)) {
        memoryCount++;
      }
    }

    return {
      portal,
      redis: {
        connected: this.isRedisConnected,
        client: !!this.redis,
      },
      inMemory: {
        portalEntries: memoryCount,
        totalEntries: this.inMemoryCache.size,
        maxSize: this.maxInMemorySize,
      },
      config,
    };
  }

  /**
   * Health check for cache service
   */
  async healthCheck() {
    let redisHealthy = false;

    if (this.isRedisConnected && this.redis) {
      try {
        await this.redis.ping();
        redisHealthy = true;
      } catch (error) {
        console.warn("Redis health check failed:", error.message);
      }
    }

    const portalStats = {};
    for (const portal of Object.keys(this.portalConfigs)) {
      portalStats[portal] = this.getPortalStats(portal);
    }

    return {
      healthy: redisHealthy || this.inMemoryCache.size >= 0, // Always healthy if in-memory works
      redis: redisHealthy,
      inMemory: true,
      portals: portalStats,
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log("Shutting down Universal Cache Service...");

    if (this.redis) {
      try {
        await this.redis.disconnect();
      } catch (error) {
        console.warn("Error disconnecting Redis:", error.message);
      }
    }

    this.inMemoryCache.clear();
    this.inMemoryExpiry.clear();
    console.log("Universal Cache Service shutdown complete");
  }
}

// Create singleton instance
const universalCacheService = new UniversalCacheService();

// Cleanup interval for in-memory cache (every 5 minutes)
setInterval(() => {
  universalCacheService.cleanupExpiredMemoryEntries();
}, 5 * 60 * 1000);

module.exports = universalCacheService;
