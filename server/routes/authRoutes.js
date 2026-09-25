const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  register,
  login,
  logout,
  getMe,
  updatePassword,
  sendOTP,
  verifyOTP,
  resendOTP,
  verifyPhone,
  resetPassword,
   googleLogin,
} = require("../controllers/authController");
const {
  registerValidator,
  loginValidator,
  updatePasswordValidator,
  sendOTPValidator,
  verifyOTPValidator,
  resendOTPValidator,
  verifyPhoneValidator,
  resetPasswordValidator,
} = require("../validators/authValidator");
const {
  authRegisterLimiter,
  authLoginLimiter,
  otpLimiter,
  updatePasswordLimiter,
} = require("../middleware/rateLimiters");

const router = express.Router();

router.post("/register", authRegisterLimiter, registerValidator, register);
router.post("/login", authLoginLimiter, loginValidator, login);
router.post("/google", googleLogin);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.put("/update-password", protect, updatePasswordLimiter, updatePasswordValidator, updatePassword);

router.post("/send-otp", otpLimiter, sendOTPValidator, sendOTP);
router.post("/verify-otp", otpLimiter, verifyOTPValidator, verifyOTP);
router.post("/resend-otp", otpLimiter, resendOTPValidator, resendOTP);
router.post("/verify-phone", protect, otpLimiter, verifyPhoneValidator, verifyPhone);
router.post("/reset-password", otpLimiter, resetPasswordValidator, resetPassword);

module.exports = router;