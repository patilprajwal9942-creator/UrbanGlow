const express = require("express");
const { protect, authorize } = require("../../middleware/authMiddleware");
const { analyticsFilterValidator } = require("../../validators/adminValidator");
const {
  getAnalytics,
  getSalonPerformance,
  getTransactions,
} = require("../../controllers/admin/adminAnalyticsController");

const router = express.Router();

router.get("/analytics", protect, authorize("admin"), analyticsFilterValidator, getAnalytics);
router.get("/analytics/salons", protect, authorize("admin"), getSalonPerformance);
router.get("/transactions", protect, authorize("admin"), analyticsFilterValidator, getTransactions);

module.exports = router;