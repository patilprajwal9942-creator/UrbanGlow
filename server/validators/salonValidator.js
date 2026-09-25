const { body, param, query, validationResult } = require("express-validator");

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

exports.createSalonValidator = [

  body("salonName")
    .trim()
    .notEmpty()
    .withMessage("Salon name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Salon name must be between 2 and 100 characters"),

  body("ownerName")
    .trim()
    .notEmpty()
    .withMessage("Owner name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Owner name must be between 2 and 50 characters"),

  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("phone")
    .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
    .withMessage("Please provide a valid phone number"),

  body("address")
    .trim()
    .notEmpty()
    .withMessage("Address is required")
    .isLength({ min: 5, max: 200 })
    .withMessage("Address must be between 5 and 200 characters"),

  handleValidationErrors,

];
exports.getSalonByIdValidator = [
  param("id").isMongoId().withMessage("Invalid salon ID"),
  handleValidationErrors,
];

exports.getOwnerSalonValidator = [
  param("ownerId").isMongoId().withMessage("Invalid owner ID"),
  handleValidationErrors,
];

const validateTimeFormat = (value) => {
  if (value === null || value === undefined || value === "") {
    return true;
  }
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(value);
};

const validateWorkingHours = (value, { req }) => {
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  
  if (!value || typeof value !== "object") {
    throw new Error("workingHours must be an object");
  }

  for (const day of days) {
    if (value[day] !== undefined) {
      const dayData = value[day];
      
      if (typeof dayData !== "object" || dayData === null) {
        throw new Error(`${day} must be an object`);
      }

      if (typeof dayData.isClosed !== "boolean") {
        throw new Error(`${day}.isClosed must be a boolean`);
      }

      if (dayData.isClosed) {
        if (dayData.open !== null && dayData.open !== undefined && dayData.open !== "") {
          throw new Error(`${day}.open must be null when day is closed`);
        }
        if (dayData.close !== null && dayData.close !== undefined && dayData.close !== "") {
          throw new Error(`${day}.close must be null when day is closed`);
        }
      } else {
        if (!validateTimeFormat(dayData.open)) {
          throw new Error(`${day}.open must be in HH:MM format`);
        }
        if (!validateTimeFormat(dayData.close)) {
          throw new Error(`${day}.close must be in HH:MM format`);
        }

        const openMinutes = timeToMinutes(dayData.open);
        const closeMinutes = timeToMinutes(dayData.close);
        
        if (openMinutes >= closeMinutes) {
          throw new Error(`${day}.open must be before ${day}.close`);
        }
      }
    }
  }
  return true;
};

const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

exports.updateWorkingHoursValidator = [
  body("workingHours").custom(validateWorkingHours).withMessage("Invalid working hours data"),
  handleValidationErrors,
];

// ==========================================
// FIND NEARBY SALONS
// ==========================================

exports.nearbySalonsValidator = [
  query("latitude")
    .exists().withMessage("latitude is required")
    .bail()
    .isFloat({ min: -90, max: 90 }).withMessage("latitude must be a valid number between -90 and 90"),

  query("longitude")
    .exists().withMessage("longitude is required")
    .bail()
    .isFloat({ min: -180, max: 180 }).withMessage("longitude must be a valid number between -180 and 180"),

  query("maxDistance")
    .optional()
    .isInt({ min: 100, max: 50000 })
    .withMessage("maxDistance must be between 100 and 50000 meters"),

  handleValidationErrors,
];

exports.updateSalonLocationValidator = [
  body("latitude")
    .exists().withMessage("latitude is required")
    .bail()
    .isFloat({ min: -90, max: 90 }).withMessage("latitude must be a valid number between -90 and 90"),

  body("longitude")
    .exists().withMessage("longitude is required")
    .bail()
    .isFloat({ min: -180, max: 180 }).withMessage("longitude must be a valid number between -180 and 180"),

  handleValidationErrors,
];