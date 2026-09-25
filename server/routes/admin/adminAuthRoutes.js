const express = require("express");

const router = express.Router();

const {
  adminLogin,
  adminLogout,
  getAdminProfile,
} = require("../../controllers/admin/adminAuthController");

const {
  protect,
  authorize,
} = require("../../middleware/authMiddleware");


// ==========================================
// ADMIN LOGIN
// ==========================================

router.post(
  "/login",
  adminLogin
);


// ==========================================
// ADMIN LOGOUT
// ==========================================

router.post(
  "/logout",
  adminLogout
);


// ==========================================
// GET ADMIN PROFILE
// ==========================================

router.get(
  "/me",
  protect,
  authorize("admin"),
  getAdminProfile
);


module.exports = router;