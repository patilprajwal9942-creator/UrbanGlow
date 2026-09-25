const express = require("express");
const { protect, authorize } = require("../../middleware/authMiddleware");
const { mongoIdParamValidator } = require("../../validators/adminValidator");
const {
  getBookings,
  getBookingDetails,
} = require("../../controllers/admin/adminBookingController");

const router = express.Router();

router.get("/bookings", protect, authorize("admin"), getBookings);
router.get("/bookings/:id", protect, authorize("admin"), mongoIdParamValidator("id"), getBookingDetails);

module.exports = router;