const express = require("express");
const { protect, authorize } = require("../../middleware/authMiddleware");
const { salonStatusValidator } = require("../../validators/adminValidator");
const {
  getSalons,
  getSalonDetails,
  updateSalonStatus,
} = require("../../controllers/admin/adminSalonController");

const router = express.Router();

router.get("/salons", protect, authorize("admin"), getSalons);
router.get("/salons/:id", protect, authorize("admin"), salonStatusValidator, getSalonDetails);
router.patch("/salons/:id/status", protect, authorize("admin"), salonStatusValidator, updateSalonStatus);

module.exports = router;