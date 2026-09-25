const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  getNotifications,
  getUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../controllers/notificationController");

// ==========================================
// GET ALL NOTIFICATIONS
// GET /api/notifications
// ==========================================

router.get(
  "/",
  protect,
  getNotifications
);

// ==========================================
// GET UNREAD NOTIFICATIONS
// GET /api/notifications/unread
// ==========================================

router.get(
  "/unread",
  protect,
  getUnreadNotifications
);

// ==========================================
// MARK SINGLE NOTIFICATION AS READ
// PATCH /api/notifications/:id/read
// ==========================================

router.patch(
  "/:id/read",
  protect,
  markNotificationRead
);

// ==========================================
// MARK ALL NOTIFICATIONS AS READ
// PATCH /api/notifications/read-all
// ==========================================

router.patch(
  "/read-all",
  protect,
  markAllNotificationsRead
);

module.exports = router;