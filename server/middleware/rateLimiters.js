const rateLimit = require("express-rate-limit");

const createLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: message || "Too many requests. Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

const authRegisterLimiter = createLimiter(
  15 * 60 * 1000,
  5,
  "Too many registration attempts. Please try again later."
);

const authLoginLimiter = createLimiter(
  15 * 60 * 1000,
  5,
  "Too many login attempts. Please try again later."
);

const otpLimiter = createLimiter(
  15 * 60 * 1000,
  3,
  "Too many OTP requests. Please try again later."
);

const updatePasswordLimiter = createLimiter(
  15 * 60 * 1000,
  3,
  "Too many password change attempts. Please try again later."
);

const bookingCreateLimiter = createLimiter(
  15 * 60 * 1000,
  20,
  "Too many booking requests. Please try again later."
);

const salonCreateLimiter = createLimiter(
  15 * 60 * 1000,
  5,
  "Too many salon creation requests. Please try again later."
);

const serviceCreateLimiter = createLimiter(
  15 * 60 * 1000,
  30,
  "Too many service creation requests. Please try again later."
);

const slotCreateLimiter = createLimiter(
  15 * 60 * 1000,
  50,
  "Too many slot creation requests. Please try again later."
);

module.exports = {
  authRegisterLimiter,
  authLoginLimiter,
  otpLimiter,
  updatePasswordLimiter,
  bookingCreateLimiter,
  salonCreateLimiter,
  serviceCreateLimiter,
  slotCreateLimiter,
};