const express = require("express");
const Slot = require("../models/Slot");
const Salon = require("../models/Salon");
const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const {
  slotCreateLimiter,
} = require("../middleware/rateLimiters");

const router = express.Router();


// ======================================
// CREATE SLOT
// ======================================

router.post(
  "/",
  protect,
  authorize("salon", "admin"),
  slotCreateLimiter,

  async (req, res) => {

    try {

      const {
        salonId,
        date,
        startTime,
        endTime,
      } = req.body;


      // ======================================
      // REQUIRED FIELDS
      // ======================================

      if (
        !salonId ||
        !date ||
        !startTime ||
        !endTime
      ) {

        return res.status(400).json({

          message:
            "All slot details are required",

        });

      }


      // ======================================
      // VERIFY SALON
      // ======================================

      const salon =
        await Salon.findById(salonId);


      if (!salon) {

        return res.status(404).json({

          message:
            "Salon not found",

        });

      }


      // ======================================
      // VERIFY SALON OWNERSHIP
      // ======================================

      if (
        salon.ownerId.toString() !==
          req.user.id &&
        req.user.role !== "admin"
      ) {

        return res.status(403).json({

          message:
            "Not authorized to create slots for this salon",

        });

      }


      // ======================================
      // VALIDATE TIME
      // ======================================

      if (
        startTime >= endTime
      ) {

        return res.status(400).json({

          message:
            "End time must be after start time",

        });

      }


      // ======================================
      // CHECK PAST DATE / TIME
      // ======================================

      const selectedDateTime =
        new Date(
          `${date}T${startTime}:00`
        );


      const now =
        new Date();


      if (
        selectedDateTime <= now
      ) {

        return res.status(400).json({

          message:
            "You cannot create a slot in the past",

        });

      }


      // ======================================
      // CHECK DUPLICATE SLOT
      // ======================================

      const existingSlot =
        await Slot.findOne({

          salonId,

          date,

          startTime,

          endTime,

        });


      if (existingSlot) {

        return res.status(400).json({

          message:
            "This slot already exists",

        });

      }


      // ======================================
      // CREATE SLOT
      // ======================================

      const slot =
        await Slot.create({

          salonId,

          date,

          startTime,

          endTime,

          isBooked: false,

        });


      res.status(201).json({

        message:
          "Slot created successfully",

        slot,

      });


    } catch (error) {

      console.error(
        "CREATE SLOT ERROR:",
        error
      );


      res.status(500).json({

        message:
          error.message,

      });

    }

  }
);


// ======================================
// GET AVAILABLE DATES
// CUSTOMER ONLY SEES FUTURE DATES
// ======================================

router.get(
  "/available-dates/:salonId",

  async (req, res) => {

    try {

      const {
        salonId,
      } = req.params;


      const availableDates =
        await Slot.getAvailableDates(
          salonId
        );


      res.status(200).json(
        availableDates
      );


    } catch (error) {

      console.error(
        "GET AVAILABLE DATES ERROR:",
        error
      );


      res.status(500).json({

        message:
          error.message,

      });

    }

  }
);


// ======================================
// GET SLOTS FOR SALON
// ======================================

router.get(
  "/salon/:salonId",

  async (req, res) => {

    try {

      const {
        salonId,
      } = req.params;


      const {
        date,
        available,
      } = req.query;


      // ======================================
      // CREATE QUERY
      // ======================================

      const query = {

        salonId,

      };


      // ======================================
      // FILTER BY DATE
      // ======================================

      if (date) {

        query.date = date;

      }


      // ======================================
      // CUSTOMER:
      // ONLY GET NOT BOOKED SLOTS
      // ======================================

      if (
        available === "true"
      ) {

        query.isBooked = false;

      }


      // ======================================
      // GET SLOTS
      // ======================================

      const slots =
        await Slot.find(query)
          .sort({

            date: 1,

            startTime: 1,

          });


      // ======================================
      // CURRENT TIME
      // ======================================

      const now =
        new Date();


      // ======================================
      // FILTER EXPIRED SLOTS
      // ======================================

      const filteredSlots =
        slots.filter((slot) => {

          const slotDateTime =
            new Date(
              `${slot.date}T${slot.startTime}:00`
            );


          // --------------------------------------
          // CUSTOMER
          //
          // available=true
          //
          // Show:
          // ✅ Future slots
          //
          // Hide:
          // ❌ Expired slots
          // ❌ Booked slots
          // --------------------------------------

          if (
            available === "true"
          ) {

            return (
              slotDateTime > now
            );

          }


          // --------------------------------------
          // SALON OWNER
          //
          // Show all slots:
          // ✅ Future
          // ✅ Expired
          // ✅ Booked
          // --------------------------------------

          return true;

        });


      // ======================================
      // RESPONSE
      // ======================================

      res.status(200).json(
        filteredSlots
      );


    } catch (error) {

      console.error(
        "GET SLOT ERROR:",
        error
      );


      res.status(500).json({

        message:
          error.message,

      });

    }

  }
);


// ======================================
// EXPORT ROUTER
// ======================================

module.exports = router;