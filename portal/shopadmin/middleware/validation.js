const Joi = require("joi");

// Validation schemas for shop admin endpoints
const schemas = {
  // Authentication
  login: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),
    password: Joi.string().min(6).required().messages({
      "string.min": "Password must be at least 6 characters long",
      "string.empty": "Password is required",
      "any.required": "Password is required",
    }),
  }),

  register: Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
      "string.min": "Name must be at least 2 characters long",
      "string.max": "Name cannot exceed 100 characters",
      "any.required": "Name is required",
    }),
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        "string.min": "Password must be at least 8 characters long",
        "string.pattern.base":
          "Password must contain at least one lowercase letter, one uppercase letter, and one number",
      }),
    shop: Joi.object({
      name: Joi.string().min(2).max(200).required(),
      address: Joi.string().min(10).max(500).required(),
      phone: Joi.string()
        .pattern(/^[\+]?[1-9][\d]{0,15}$/)
        .required()
        .messages({
          "string.pattern.base": "Please provide a valid phone number",
        }),
      email: Joi.string().email().required(),
    }).required(),
  }),

  // Doctor management
  addDoctor: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().min(2).max(100).required(),
  }),

  updateDoctorStatus: Joi.object({
    isActive: Joi.boolean().required().messages({
      "boolean.base": "isActive must be a boolean value",
      "any.required": "isActive field is required",
    }),
  }),

  // Inventory management
  stockIn: Joi.object({
    productId: Joi.number().integer().positive().required().messages({
      "number.base": "Product ID must be a number",
      "number.integer": "Product ID must be an integer",
      "number.positive": "Product ID must be positive",
      "any.required": "Product ID is required",
    }),
    quantity: Joi.number().integer().positive().required().messages({
      "number.base": "Quantity must be a number",
      "number.integer": "Quantity must be an integer",
      "number.positive": "Quantity must be positive",
      "any.required": "Quantity is required",
    }),
    notes: Joi.string().max(500).optional(),
  }),

  adjustStock: Joi.object({
    productId: Joi.number().integer().positive().required(),
    newQuantity: Joi.number().integer().min(0).required().messages({
      "number.min": "New quantity cannot be negative",
    }),
    reason: Joi.string().min(10).max(500).required().messages({
      "string.min": "Adjustment reason must be at least 10 characters",
      "any.required": "Reason for stock adjustment is required",
    }),
  }),

  // Stock receipt verification
  approveStockReceipt: Joi.object({
    decision: Joi.string().valid("APPROVED", "REJECTED").required().messages({
      "any.only": "Decision must be either APPROVED or REJECTED",
    }),
    verifiedQuantity: Joi.when("decision", {
      is: "APPROVED",
      then: Joi.number().integer().min(0).required().messages({
        "any.required": "Verified quantity is required for approval",
        "number.min": "Verified quantity cannot be negative",
      }),
      otherwise: Joi.number().optional(),
    }),
    adminNotes: Joi.string().max(1000).optional(),
    discrepancyReason: Joi.when("decision", {
      is: "REJECTED",
      then: Joi.string().min(10).max(500).required().messages({
        "any.required": "Discrepancy reason is required for rejection",
        "string.min": "Discrepancy reason must be at least 10 characters long",
      }),
      otherwise: Joi.string().optional(),
    }),
  }),

  // Query parameter validation
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  }),

  dateRange: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date()
      .iso()
      .greater(Joi.ref("startDate"))
      .optional()
      .messages({
        "date.greater": "End date must be after start date",
      }),
  }),

  reportFilters: Joi.object({
    period: Joi.string()
      .valid("daily", "weekly", "monthly", "yearly", "custom")
      .default("monthly"),
    type: Joi.string().optional(),
    staffId: Joi.number().integer().positive().optional(),
    productId: Joi.number().integer().positive().optional(),
    patientId: Joi.number().integer().positive().optional(),
  }),
};

// Validation middleware factory
const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const data =
      source === "body"
        ? req.body
        : source === "query"
        ? req.query
        : source === "params"
        ? req.params
        : req[source];

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
        value: detail.context?.value,
      }));

      return res.status(400).json({
        error: "Validation Error",
        message: "Please check your input data",
        details: errors,
      });
    }

    // Replace the original data with validated and sanitized data
    if (source === "body") req.body = value;
    else if (source === "query") req.query = value;
    else if (source === "params") req.params = value;
    else req[source] = value;

    next();
  };
};

module.exports = {
  schemas,
  validate,
};
