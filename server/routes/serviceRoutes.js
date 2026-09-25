const express = require("express");
const Service = require("../models/Service");
const Salon = require("../models/Salon");
const { protect, authorize } = require("../middleware/authMiddleware");
const { serviceCreateLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const services = await Service.find();

    res.status(200).json(services);

  } catch (error) {
    console.error("Service Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
});

router.get("/salon/:salonId", async (req, res) => {
  try {
    const services = await Service.find({
      salonId: req.params.salonId,
    });

    res.status(200).json(services);

  } catch (error) {
    console.error("Service Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
});

router.post("/", protect, authorize("salon", "admin"), serviceCreateLimiter, async (req, res) => {
  try {
    const { salonId, serviceName, price, duration, description } = req.body;

    // Verify salon ownership
    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({
        message: "Salon not found",
      });
    }

    if (salon.ownerId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        message: "Not authorized to create services for this salon",
      });
    }

    const service = await Service.create({
      salonId,
      serviceName,
      price,
      duration,
      description,
    });

    res.status(201).json({
      message: "Service created successfully",
      service,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;