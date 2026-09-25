const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const User = require("../models/User");
const Salon = require("../models/Salon");
const Service = require("../models/Service");
const Booking = require("../models/Booking");

const router = express.Router();

router.get(
  "/stats",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const [totalUsers, totalSalons, totalServices, totalBookings] = await Promise.all([
        User.countDocuments(),
        Salon.countDocuments(),
        Service.countDocuments(),
        Booking.countDocuments(),
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalUsers,
          totalSalons,
          totalServices,
          totalBookings,
        },
      });
    } catch (error) {
      console.error("Admin Stats Error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

module.exports = router;