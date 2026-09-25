const { body, param, validationResult } = require("express-validator");

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

exports.createBookingValidator = [
  // body("customerId").isMongoId().withMessage("Invalid customer ID"),
  body("salonId").isMongoId().withMessage("Invalid salon ID"),
  body("serviceId").isMongoId().withMessage("Invalid service ID"),
  body("slotId").isMongoId().withMessage("Invalid slot ID"),
  handleValidationErrors,
];

exports.updateBookingStatusValidator = [
  param("id").isMongoId().withMessage("Invalid booking ID"),
  body("status")
    .isIn(["confirmed", "cancelled", "completed"])
    .withMessage("Invalid booking status"),
  handleValidationErrors,
];

exports.getCustomerBookingsValidator = [
  param("customerId").isMongoId().withMessage("Invalid customer ID"),
  handleValidationErrors,
];

exports.getSalonBookingsValidator = [
  param("salonId").isMongoId().withMessage("Invalid salon ID"),
  handleValidationErrors,
];

exports.getSalonOwnerBookingsValidator = [
  param("userId").isMongoId().withMessage("Invalid user ID"),
  handleValidationErrors,
];