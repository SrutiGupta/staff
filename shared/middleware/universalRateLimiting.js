const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");

/**
 * Universal Rate Limiting Service for All Portals
 * Supports: Shop Admin, Staff, Doctor, Retailer, Company portals
 */
class UniversalRateLimitService {
  constructor() {
    // Portal-specific rate limiting configurations
    this.configs = {
      shopadmin: {
        auth: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15 min
        api: { windowMs: 1 * 60 * 1000, max: 100 }, // 100 req per minute
        export: { windowMs: 5 * 60 * 1000, max: 3 }, // 3 exports per 5 min
        reports: { windowMs: 15 * 60 * 1000, delayAfter: 5, delayMs: 500 },
      },
      staff: {
        auth: { windowMs: 15 * 60 * 1000, max: 10 }, // 10 attempts per 15 min (staff login more frequently)
        api: { windowMs: 1 * 60 * 1000, max: 150 }, // 150 req per minute (more operational actions)
        export: { windowMs: 10 * 60 * 1000, max: 5 }, // 5 exports per 10 min
        reports: { windowMs: 10 * 60 * 1000, delayAfter: 10, delayMs: 300 },
      },
      doctor: {
        auth: { windowMs: 15 * 60 * 1000, max: 8 }, // 8 attempts per 15 min
        api: { windowMs: 1 * 60 * 1000, max: 80 }, // 80 req per minute (medical consultations)
        export: { windowMs: 15 * 60 * 1000, max: 2 }, // 2 exports per 15 min (medical reports)
        reports: { windowMs: 20 * 60 * 1000, delayAfter: 3, delayMs: 1000 },
      },
      retailer: {
        auth: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15 min
        api: { windowMs: 1 * 60 * 1000, max: 200 }, // 200 req per minute (inventory management)
        export: { windowMs: 5 * 60 * 1000, max: 10 }, // 10 exports per 5 min (business operations)
        reports: { windowMs: 10 * 60 * 1000, delayAfter: 8, delayMs: 200 },
      },
      company: {
        auth: { windowMs: 15 * 60 * 1000, max: 3 }, // 3 attempts per 15 min (high security)
        api: { windowMs: 1 * 60 * 1000, max: 50 }, // 50 req per minute (admin operations)
        export: { windowMs: 10 * 60 * 1000, max: 5 }, // 5 exports per 10 min
        reports: { windowMs: 30 * 60 * 1000, delayAfter: 3, delayMs: 2000 },
      },
    };
  }

  /**
   * Create authentication rate limiter for specific portal
   */
  createAuthLimiter(portal) {
    const config = this.configs[portal];
    if (!config) {
      throw new Error(`Unsupported portal: ${portal}`);
    }

    return rateLimit({
      windowMs: config.auth.windowMs,
      max: config.auth.max,
      message: {
        error: `Too many ${portal} authentication attempts, please try again later.`,
        retryAfter: Math.ceil(config.auth.windowMs / 60000) + " minutes",
        portal: portal,
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        // Include portal in key to separate rate limits
        return `${portal}:auth:${req.ip}`;
      },
    });
  }

  /**
   * Create API rate limiter for specific portal
   */
  createApiLimiter(portal) {
    const config = this.configs[portal];
    if (!config) {
      throw new Error(`Unsupported portal: ${portal}`);
    }

    return rateLimit({
      windowMs: config.api.windowMs,
      max: config.api.max,
      message: {
        error: `Too many ${portal} requests, please slow down.`,
        retryAfter: Math.ceil(config.api.windowMs / 60000) + " minute(s)",
        portal: portal,
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        // Include user ID if authenticated, otherwise use IP
        const userId =
          req.user?.id || req.shopAdmin?.id || req.staff?.id || req.doctor?.id;
        return userId
          ? `${portal}:api:user:${userId}`
          : `${portal}:api:ip:${req.ip}`;
      },
    });
  }

  /**
   * Create export rate limiter for specific portal
   */
  createExportLimiter(portal) {
    const config = this.configs[portal];
    if (!config) {
      throw new Error(`Unsupported portal: ${portal}`);
    }

    return rateLimit({
      windowMs: config.export.windowMs,
      max: config.export.max,
      message: {
        error: `Too many ${portal} export requests, please wait before generating more reports.`,
        retryAfter: Math.ceil(config.export.windowMs / 60000) + " minute(s)",
        portal: portal,
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        // Always use user ID for export limits (more restrictive)
        const userId =
          req.user?.id || req.shopAdmin?.id || req.staff?.id || req.doctor?.id;
        return `${portal}:export:${userId || req.ip}`;
      },
    });
  }

  /**
   * Create slow down middleware for reports
   */
  createReportSlowDown(portal) {
    const config = this.configs[portal];
    if (!config) {
      throw new Error(`Unsupported portal: ${portal}`);
    }

    return slowDown({
      windowMs: config.reports.windowMs,
      delayAfter: config.reports.delayAfter,
      delayMs: (used, req) =>
        Math.max(0, used - config.reports.delayAfter) * config.reports.delayMs, // v2 compatible
      maxDelayMs: 30000, // Maximum delay of 30 seconds
      keyGenerator: (req) => {
        const userId =
          req.user?.id || req.shopAdmin?.id || req.staff?.id || req.doctor?.id;
        return `${portal}:reports:${userId || req.ip}`;
      },
    });
  }

  /**
   * Get all rate limiters for a portal (convenience method)
   */
  getPortalLimiters(portal) {
    return {
      auth: this.createAuthLimiter(portal),
      api: this.createApiLimiter(portal),
      export: this.createExportLimiter(portal),
      reportSlowDown: this.createReportSlowDown(portal),
    };
  }

  /**
   * Get rate limiting configuration for a portal
   */
  getPortalConfig(portal) {
    return this.configs[portal] || null;
  }

  /**
   * Update rate limiting configuration for a portal
   */
  updatePortalConfig(portal, newConfig) {
    if (!this.configs[portal]) {
      throw new Error(`Unsupported portal: ${portal}`);
    }

    this.configs[portal] = {
      ...this.configs[portal],
      ...newConfig,
    };
  }

  /**
   * Get all supported portals
   */
  getSupportedPortals() {
    return Object.keys(this.configs);
  }
}

// Create singleton instance
const universalRateLimitService = new UniversalRateLimitService();

module.exports = universalRateLimitService;
