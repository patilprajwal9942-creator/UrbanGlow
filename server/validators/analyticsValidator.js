const { param, query, validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

exports.salonIdValidator = [
  param("salonId").isMongoId().withMessage("Invalid salon ID"),
  handleValidationErrors,
];

exports.dailyAnalyticsValidator = [
  param("salonId").isMongoId().withMessage("Invalid salon ID"),
  query("days")
    .optional()
    .isInt({ min: 1, max: 90 })
    .withMessage("days must be between 1 and 90"),
  handleValidationErrors,
];

exports.transactionsValidator = [
  param("salonId").isMongoId().withMessage("Invalid salon ID"),
  query("filter")
    .optional()
    .isIn(["today", "yesterday", "last7days", "thisMonth", "lastMonth", "all", "custom"])
    .withMessage("Invalid filter"),
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("startDate must be a valid date (YYYY-MM-DD)"),
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("endDate must be a valid date (YYYY-MM-DD)"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100"),
  handleValidationErrors,
];