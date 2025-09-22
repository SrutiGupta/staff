const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: "Too many authentication attempts, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for general API endpoints
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    error: "Too many requests, please slow down.",
    retryAfter: "1 minute",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Slow down middleware for report generation
const reportSlowDown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 5, // Allow 5 requests per window without delay
  delayMs: (used, req) => (used - 5) * 500, // Incremental delay function for v2
  maxDelayMs: 20000, // Maximum delay of 20 seconds
});

// Rate limiting for export endpoints (more restrictive)
const exportLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 exports per 5 minutes
  message: {
    error:
      "Too many export requests, please wait before generating more reports.",
    retryAfter: "5 minutes",
  },
});

module.exports = {
  authLimiter,
  apiLimiter,
  reportSlowDown,
  exportLimiter,
};
