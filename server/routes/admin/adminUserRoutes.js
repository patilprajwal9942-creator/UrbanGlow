const express = require("express");
const { protect, authorize } = require("../../middleware/authMiddleware");
const { userStatusValidator } = require("../../validators/adminValidator");
const {
  getUsers,
  getUserDetails,
  updateUserStatus,
} = require("../../controllers/admin/adminUserController");

const router = express.Router();

router.get("/users", protect, authorize("admin"), getUsers);
router.get("/users/:id", protect, authorize("admin"), userStatusValidator, getUserDetails);
router.patch("/users/:id/status", protect, authorize("admin"), userStatusValidator, updateUserStatus);

module.exports = router;