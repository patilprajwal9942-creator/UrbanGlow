const Notification = require("../models/Notification");

// ==========================================
// GET ALL NOTIFICATIONS
// GET /api/notifications
// ==========================================

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user.id,
    })
      .populate({
        path: "bookingId",
        populate: {
          path: "salonId",
          model: "Salon",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("Get Notifications Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
};

// ==========================================
// GET UNREAD NOTIFICATIONS
// GET /api/notifications/unread
// ==========================================

const getUnreadNotifications = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false,
    });

    const unreadNotifications = await Notification.find({
      recipient: req.user.id,
      isRead: false,
    })
      .populate({
        path: "bookingId",
        populate: {
          path: "salonId",
          model: "Salon",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      unreadCount,
      notifications: unreadNotifications,
    });
  } catch (error) {
    console.error("Get Unread Notifications Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch unread notifications",
    });
  }
};

// ==========================================
// MARK SINGLE NOTIFICATION AS READ
// PATCH /api/notifications/:id/read
// ==========================================

const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    notification.isRead = true;

    await notification.save();

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Mark Notification Read Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
    });
  }
};

// ==========================================
// MARK ALL NOTIFICATIONS AS READ
// PATCH /api/notifications/read-all
// ==========================================

const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user.id,
        isRead: false,
      },
      {
        isRead: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark All Notifications Read Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};