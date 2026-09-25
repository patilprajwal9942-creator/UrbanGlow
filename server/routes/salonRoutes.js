const express = require("express");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const Salon = require("../models/Salon");

const upload = require("../middleware/upload");

const {
  createSalonValidator,
  getSalonByIdValidator,
  getOwnerSalonValidator,
  updateWorkingHoursValidator,
  nearbySalonsValidator,
  updateSalonLocationValidator,
} = require("../validators/salonValidator");

const {
  salonCreateLimiter,
} = require("../middleware/rateLimiters");

const router = express.Router();

// ======================================================
// GET SALON FOR CURRENT USER
// ======================================================

router.get(
  "/my-salon",
  protect,
  authorize("salon", "admin"),
  async (req, res) => {
    try {
      const salon = await Salon.findOne({
        ownerId: req.user.id,
      });

      if (!salon) {
        return res.status(404).json({
          success: false,
          message: "Salon not found for current user",
        });
      }

      res.status(200).json({
        success: true,
        salon,
      });
    } catch (error) {
      console.error("Get My Salon Error:", error);

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ======================================================
// UPDATE MY SALON LOCATION
// ======================================================

router.put(
  "/my-salon/location",
  protect,
  authorize("salon", "admin"),
  updateSalonLocationValidator,
  async (req, res) => {
    try {
      const {
        latitude,
        longitude,
      } = req.body;

      const salon = await Salon.findOne({
        ownerId: req.user.id,
      });

      if (!salon) {
        return res.status(404).json({
          success: false,
          message: "Salon not found for current user",
        });
      }

      // GeoJSON order:
      // [longitude, latitude]

      salon.location = {
        type: "Point",
        coordinates: [
          Number(longitude),
          Number(latitude),
        ],
      };

      await salon.save();

      res.status(200).json({
        success: true,
        message: "Salon location updated successfully",
        location: salon.location,
      });
    } catch (error) {
      console.error(
        "Update Salon Location Error:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ======================================================
// UPDATE WORKING HOURS
// ======================================================

router.put(
  "/my-salon/working-hours",
  protect,
  authorize("salon", "admin"),
  updateWorkingHoursValidator,
  async (req, res) => {
    try {
      const salon = await Salon.findOne({
        ownerId: req.user.id,
      });

      if (!salon) {
        return res.status(404).json({
          success: false,
          message: "Salon not found for current user",
        });
      }

      salon.workingHours =
        req.body.workingHours;

      await salon.save();

      res.status(200).json({
        success: true,
        message:
          "Working hours updated successfully",
        workingHours: salon.workingHours,
      });
    } catch (error) {
      console.error(
        "Update Working Hours Error:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ======================================================
// CREATE SALON
// ======================================================

router.post(
  "/",
  protect,
  authorize("salon", "admin"),
  salonCreateLimiter,
  upload.single("image"),
  createSalonValidator,
  async (req, res) => {
    try {
      const {
        salonName,
        ownerName,
        email,
        phone,
        address,
        latitude,
        longitude,
      } = req.body;

      // ==========================================
      // REQUIRED FIELDS
      // ==========================================

      if (
        !salonName ||
        !ownerName ||
        !email ||
        !phone ||
        !address
      ) {
        return res.status(400).json({
          success: false,
          message:
            "All salon details are required",
        });
      }

      // ==========================================
      // PREPARE SALON DATA
      // ==========================================

      const salonData = {
        ownerId: req.user.id,
        salonName,
        ownerName,
        email,
        phone,
        address,
        image: req.file
          ? req.file.path
          : undefined,
      };

      // ==========================================
      // SAVE LOCATION IF PROVIDED
      // ==========================================

      if (
        latitude !== undefined &&
        latitude !== "" &&
        longitude !== undefined &&
        longitude !== ""
      ) {
        const parsedLatitude =
          Number(latitude);

        const parsedLongitude =
          Number(longitude);

        if (
          Number.isNaN(parsedLatitude) ||
          Number.isNaN(parsedLongitude)
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid latitude or longitude",
          });
        }

        if (
          parsedLatitude < -90 ||
          parsedLatitude > 90
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid latitude",
          });
        }

        if (
          parsedLongitude < -180 ||
          parsedLongitude > 180
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid longitude",
          });
        }

        salonData.location = {
          type: "Point",
          coordinates: [
            parsedLongitude,
            parsedLatitude,
          ],
        };
      }

      // ==========================================
      // CREATE SALON
      // ==========================================

      const salon =
        await Salon.create(salonData);

      res.status(201).json({
        success: true,
        message:
          "Salon created successfully",
        salon,
      });
    } catch (error) {
      console.error(
        "CREATE SALON ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          error?.message ||
          "Failed to create salon",
      });
    }
  }
);

// ======================================================
// GET ALL SALONS
// ======================================================

router.get("/", async (req, res) => {
  try {
    const salons = await Salon.find({
      $or: [
        {
          status: "active",
        },
        {
          status: {
            $exists: false,
          },
        },
      ],
    });

    res.status(200).json({
      success: true,
      count: salons.length,
      salons,
    });
  } catch (error) {
    console.error(
      "Get Salon Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ======================================================
// GET SALON BY OWNER
// ======================================================

router.get(
  "/owner/:ownerId",
  protect,
  getOwnerSalonValidator,
  async (req, res) => {
    if (
      req.user.id !==
        req.params.ownerId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Not authorized to access this salon",
      });
    }

    try {
      const salon = await Salon.findOne({
        ownerId: req.params.ownerId,
      });

      if (!salon) {
        return res.status(404).json({
          success: false,
          message: "Salon not found",
        });
      }

      res.status(200).json({
        success: true,
        salon,
      });
    } catch (error) {
      console.error(
        "Get Owner Salon Error:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ======================================================
// FIND NEARBY SALONS
// ======================================================
// GET:
// /api/salons/nearby
// ?latitude=18.5204
// &longitude=73.8567
// &maxDistance=10000
//
// maxDistance is in METERS.
//
// 10000 = 10 KM
// ======================================================

router.get(
  "/nearby",
  nearbySalonsValidator,
  async (req, res) => {
    try {
      const latitude =
        parseFloat(
          req.query.latitude
        );

      const longitude =
        parseFloat(
          req.query.longitude
        );

      const maxDistance =
        req.query.maxDistance
          ? parseInt(
              req.query.maxDistance
            )
          : 10000;

      // ==========================================
      // MONGODB GEO QUERY
      // ==========================================

      const salons =
        await Salon.aggregate([
          {
            $geoNear: {
              near: {
                type: "Point",

                coordinates: [
                  longitude,
                  latitude,
                ],
              },

              distanceField:
                "distanceInMeters",

              maxDistance,

              spherical: true,

              query: {
                $or: [
                  {
                    status: "active",
                  },
                  {
                    status: {
                      $exists: false,
                    },
                  },
                ],
              },
            },
          },

          // Maximum 20 nearest salons
          {
            $limit: 20,
          },

          {
            $project: {
              salonName: 1,
              ownerName: 1,
              address: 1,
              phone: 1,
              image: 1,
              status: 1,
              location: 1,
              rating: 1,
              distanceInMeters: 1,
            },
          },
        ]);

      // ==========================================
      // ADD DISTANCE IN KM
      // ==========================================

      const shaped =
        salons.map((salon) => ({
          ...salon,

          distanceKm:
            Math.round(
              (salon.distanceInMeters /
                1000) *
                10
            ) / 10,
        }));

      res.status(200).json({
        success: true,
        count: shaped.length,
        salons: shaped,
      });
    } catch (error) {
      console.error(
        "Nearby Salons Error:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ======================================================
// GET SALON BY ID
// ======================================================

router.get(
  "/:id",
  getSalonByIdValidator,
  async (req, res) => {
    try {
      const salon =
        await Salon.findById(
          req.params.id
        );

      if (!salon) {
        return res.status(404).json({
          success: false,
          message: "Salon not found",
        });
      }

      res.status(200).json({
        success: true,
        salon,
      });
    } catch (error) {
      console.error(
        "Get Salon By ID Error:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

module.exports = router;