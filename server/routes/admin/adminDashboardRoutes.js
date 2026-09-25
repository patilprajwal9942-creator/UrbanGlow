const express = require("express");
const { protect, authorize } = require("../../middleware/authMiddleware");
const { getDashboard } = require("../../controllers/admin/adminDashboardController");

const router = express.Router();

router.get("/dashboard", protect, authorize("admin"), getDashboard);

module.exports = router;