const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const Booking = require("../models/Booking");
const Slot = require("../models/Slot");
const Salon = require("../models/Salon");
const Notification = require("../models/Notification");
const {
  createBookingValidator,
  updateBookingStatusValidator,
  getCustomerBookingsValidator,
  getSalonBookingsValidator,
  getSalonOwnerBookingsValidator,
} = require("../validators/bookingValidator");
const { bookingCreateLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

// ==========================================
// MY BOOKINGS (for current user)
// ==========================================

router.get(
  "/my-bookings",
  protect,
  async (req, res) => {
    try {
      const bookings = await Booking.find({
        customerId: req.user.id,
      })
        .populate("salonId")
        .populate("serviceId")
        .populate("slotId")
        .sort({ createdAt: -1 });

      res.status(200).json(bookings);

    } catch (error) {
      console.error(
        "My Bookings Error:",
        error
      );

      res.status(500).json({
        message: error.message,
      });
    }
  }
);

// ==========================================
// CREATE BOOKING
// ==========================================

router.post("/", protect, bookingCreateLimiter, createBookingValidator, async (req, res) => {
  console.log("========== CREATE BOOKING API CALLED ==========");
  console.log("USER:", req.user);
  console.log("BODY:", req.body);
  try {
    const {
      salonId,
      serviceId,
      slotId,
    } = req.body;

    // Validate required data
    if (
      !salonId ||
      !serviceId ||
      !slotId
    ) {
      return res.status(400).json({
        message: "Booking information is incomplete",
      });
    }

    // ------------------------------------------
    // Verify salon exists
    // ------------------------------------------

    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({
        message: "Salon not found",
      });
    }

    // ------------------------------------------
    // Verify service exists and belongs to salon
    // ------------------------------------------

    const Service = require("../models/Service");
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    if (service.salonId.toString() !== salonId) {
      return res.status(400).json({
        message: "Service does not belong to this salon",
      });
    }

    // ------------------------------------------
    // Verify slot exists, belongs to salon, and has not expired
    // ------------------------------------------

    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({
        message: "Slot not found",
      });
    }

    if (slot.salonId.toString() !== salonId) {
      return res.status(400).json({
        message: "Slot does not belong to this salon",
      });
    }

    // Check slot expiration using proper Date comparison
    const slotDateTime = new Date(`${slot.date}T${slot.startTime}:00`);
    const now = new Date();

    if (slotDateTime <= now) {
      return res.status(400).json({
        message: "This slot has expired",
      });
    }

    // ------------------------------------------
    // IMPORTANT:
    // Find slot AND lock it in one operation
    // ------------------------------------------

    const lockedSlot = await Slot.findOneAndUpdate(
      {
        _id: slotId,
        salonId: salonId,
        isBooked: false,
      },
      {
        $set: {
          isBooked: true,
        },
      },
      {
        new: true,
      }
    );

    // Slot does not exist OR already booked
    if (!lockedSlot) {
      return res.status(400).json({
        message:
          "This slot is no longer available. Please select another slot.",
      });
    }

    // ------------------------------------------
    // Create booking
    // ------------------------------------------

    try {
      console.log("CREATING BOOKING...");
      const booking = await Booking.create({
        customerId: req.user.id,
        salonId,
        serviceId,
        slotId,
        status: "pending",
      });
      console.log("BOOKING CREATED:", booking);
      // Notify the salon owner of the new booking request (non-fatal if it fails)
      try {
        await Notification.create({
          recipient: salon.ownerId,
          type: "booking",
          title: "New Booking Request",
          message: "A customer has sent a new booking request.",
          bookingId: booking._id,
        });
      } catch (notifyError) {
        console.error("Create Booking Notification Error:", notifyError);
      }

      return res.status(201).json({
        message: "Booking request sent successfully. Waiting for salon confirmation.",
        booking,
      });

    } catch (bookingError) {

      // If booking creation fails,
      // release the slot again.
      await Slot.findByIdAndUpdate(slotId, {
        isBooked: false,
      });

      throw bookingError;
    }

  } catch (error) {
    console.error("========== BOOKING ERROR ==========");
    console.error(error);
    console.error("===================================");

    res.status(500).json({
      message:
        error.message || "Failed to create booking",
    });
  }
});


// ==========================================
// CUSTOMER BOOKINGS
// ==========================================

router.get(
  "/customer/:customerId",
  protect,
  getCustomerBookingsValidator,
  async (req, res) => {
    // Ownership check
    if (req.user.id !== req.params.customerId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access these bookings",
      });
    }

    try {
      const bookings = await Booking.find({
        customerId: req.params.customerId,
      })
        .populate("salonId")
        .populate("serviceId")
        .populate("slotId")
        .sort({ createdAt: -1 });

      res.status(200).json(bookings);

    } catch (error) {
      console.error(
        "Customer Bookings Error:",
        error
      );

      res.status(500).json({
        message: error.message,
      });
    }
  }
);


// ==========================================
// SALON OWNER BOOKINGS
// ==========================================

router.get(
  "/salon/:salonId",
  protect,
  authorize("salon", "admin"),
  getSalonBookingsValidator,
  async (req, res) => {
    try {

      console.log("========== SALON BOOKINGS ==========");

      console.log(
        "REQUESTED SALON ID:",
        req.params.salonId
      );

      console.log(
        "LOGGED IN USER:",
        req.user
      );

      // Verify salon exists

      const salon = await Salon.findById(
        req.params.salonId
      );

      console.log(
        "SALON FOUND:",
        salon
      );

      if (!salon) {

        return res.status(404).json({
          message: "Salon not found",
        });

      }

      console.log(
        "SALON OWNER ID:",
        salon.ownerId.toString()
      );

      console.log(
        "CURRENT USER ID:",
        req.user.id
      );


      // Ownership check

      if (
        salon.ownerId.toString() !== req.user.id &&
        req.user.role !== "admin"
      ) {

        return res.status(403).json({
          message:
            "Not authorized to access this salon's bookings",
        });

      }


      // Find bookings

      const bookings =
        await Booking.find({
          salonId: req.params.salonId,
        })
          .populate(
            "customerId",
            "name email phone"
          )
          .populate(
            "serviceId",
            "serviceName price duration"
          )
          .populate("slotId")
          .sort({
            createdAt: -1,
          });


      console.log(
        "BOOKINGS FOUND:",
        bookings
      );

      console.log(
        "TOTAL BOOKINGS:",
        bookings.length
      );

      console.log(
        "===================================="
      );


      return res.status(200).json(
        bookings
      );

    } catch (error) {

      console.error(
        "SALON BOOKINGS ERROR:",
        error
      );

      return res.status(500).json({
        message: error.message,
      });

    }
  }
);


// ==========================================
// CANCEL / UPDATE BOOKING STATUS
// ==========================================

router.patch(
  "/:id/status",
  protect,
  updateBookingStatusValidator,
  async (req, res) => {
    try {
      const { status } = req.body;

      const allowedStatus = [
        "confirmed",
        "cancelled",
        "completed",
      ];

      if (!allowedStatus.includes(status)) {
        return res.status(400).json({
          message: "Invalid booking status",
        });
      }

      const booking = await Booking.findById(
        req.params.id
      ).populate("slotId").populate("salonId");

      if (!booking) {
        return res.status(404).json({
          message: "Booking not found",
        });
      }

      // Authorization check
      const isCustomer = booking.customerId.toString() === req.user.id;
      const isSalonOwner = booking.salonId?.ownerId?.toString() === req.user.id;
      const isAdmin = req.user.role === "admin";

      if (!isCustomer && !isSalonOwner && !isAdmin) {
        return res.status(403).json({
          message: "Not authorized to update this booking",
        });
      }

      const currentStatus = booking.status;

      // ------------------------------------------
      // VALIDATE STATUS TRANSITION
      // Backend is the source of truth - never trust the frontend.
      //
      // Allowed transitions:
      //   pending   -> confirmed   (salon owner/admin accepts)
      //   pending   -> cancelled   (customer cancels own request,
      //                             or salon owner/admin rejects)
      //   confirmed -> completed   (salon owner/admin marks done)
      //   confirmed -> cancelled   (customer/admin cancels)
      // ------------------------------------------

      let action = null; // "accept" | "reject" | "cancel" | "complete"

      if (status === "confirmed") {
        if (currentStatus !== "pending") {
          return res.status(400).json({
            message: `Cannot change booking from ${currentStatus} to confirmed`,
          });
        }

        if (!isSalonOwner && !isAdmin) {
          return res.status(403).json({
            message: "Only the salon owner can accept a booking request",
          });
        }

        action = "accept";

      } else if (status === "completed") {
        if (currentStatus !== "confirmed") {
          return res.status(400).json({
            message: `Cannot change booking from ${currentStatus} to completed`,
          });
        }

        if (!isSalonOwner && !isAdmin) {
          return res.status(403).json({
            message: "Only the salon owner can mark a booking as completed",
          });
        }

        action = "complete";

      } else if (status === "cancelled") {
        if (currentStatus !== "pending" && currentStatus !== "confirmed") {
          return res.status(400).json({
            message: `Cannot change booking from ${currentStatus} to cancelled`,
          });
        }

        if (currentStatus === "pending") {
          // Customer cancels their own request, or the salon owner/admin rejects it
          if (!isCustomer && !isSalonOwner && !isAdmin) {
            return res.status(403).json({
              message: "Not authorized to cancel this booking",
            });
          }

          action = isCustomer ? "cancel" : "reject";

        } else {
          // currentStatus === "confirmed": only the customer (or admin) can cancel
          if (!isCustomer && !isAdmin) {
            return res.status(403).json({
              message: "Only the customer can cancel a confirmed booking",
            });
          }

          action = "cancel";
        }
      }

      // ------------------------------------------
      // Release the slot on cancellation/rejection
      // ------------------------------------------

      if (status === "cancelled") {
        // Check if slot time has expired
        const slotDateTime = new Date(
          `${booking.slotId.date}T${booking.slotId.startTime}:00`
        );
        const now = new Date();

        if (slotDateTime > now) {
          // Slot is still in the future - release it
          await Slot.findByIdAndUpdate(
            booking.slotId._id,
            {
              $set: {
                isBooked: false,
              },
            }
          );
        }
        // If slot has expired, keep it unavailable (do not set isBooked: false)
      }

      // ------------------------------------------
      // Notify the relevant party (non-fatal if it fails)
      // ------------------------------------------

      try {
        if (action === "accept") {
          await Notification.create({
            recipient: booking.customerId,
            type: "booking",
            title: "Booking Confirmed",
            message: "Your booking has been confirmed by the salon.",
            bookingId: booking._id,
          });
        } else if (action === "reject") {
          await Notification.create({
            recipient: booking.customerId,
            type: "booking",
            title: "Booking Rejected",
            message: "Your booking request has been rejected by the salon.",
            bookingId: booking._id,
          });
        } else if (action === "cancel") {
          const recipient = booking.salonId?.ownerId;
          if (recipient) {
            await Notification.create({
              recipient,
              type: "booking",
              title: "Booking Cancelled",
              message: "Customer cancelled the booking.",
              bookingId: booking._id,
            });
          }
        }
        // "complete" has no notification requirement
      } catch (notifyError) {
        console.error("Booking Status Notification Error:", notifyError);
      }

      booking.status = status;

      await booking.save();

      // Get updated booking with details
      const updatedBooking =
        await Booking.findById(booking._id)
          .populate("salonId")
          .populate("serviceId")
          .populate("slotId");

      const successMessages = {
        confirmed: "Booking accepted successfully",
        completed: "Booking marked as completed",
        cancelled:
          action === "reject"
            ? "Booking rejected successfully"
            : "Booking cancelled successfully",
      };

      res.status(200).json({
        message: successMessages[status],
        booking: updatedBooking,
      });

    } catch (error) {
      console.error(
        "Update Booking Error:",
        error
      );

      res.status(500).json({
        message: error.message,
      });
    }
  }
);

// ==========================================
// CANCEL BOOKING (PUT)
// ==========================================

router.put(
  "/:id/cancel",
  protect,
  async (req, res) => {
    try {
      const booking = await Booking.findById(
        req.params.id
      ).populate("slotId").populate("salonId");

      if (!booking) {
        return res.status(404).json({
          message: "Booking not found",
        });
      }

      // This endpoint is the customer-initiated cancel path.
      // Salon owners reject pending bookings via PATCH /:id/status instead,
      // and cannot cancel a confirmed booking.
      const isCustomer = booking.customerId.toString() === req.user.id;
      const isAdmin = req.user.role === "admin";

      if (!isCustomer && !isAdmin) {
        return res.status(403).json({
          message: "Only the customer can cancel their own booking",
        });
      }

      // ------------------------------------------
      // Validate transition: only pending/confirmed -> cancelled
      // ------------------------------------------

      if (booking.status !== "pending" && booking.status !== "confirmed") {
        return res.status(400).json({
          message: `Cannot cancel a booking that is already ${booking.status}`,
        });
      }

      // ------------------------------------------
      // Cancel booking - release slot
      // ------------------------------------------

      {
        // Check if slot time has expired
        const slotDateTime = new Date(
          `${booking.slotId.date}T${booking.slotId.startTime}:00`
        );
        const now = new Date();

        if (slotDateTime > now) {
          // Slot is still in the future - release it
          await Slot.findByIdAndUpdate(
            booking.slotId._id,
            {
              $set: {
                isBooked: false,
              },
            }
          );
        }
        // If slot has expired, keep it unavailable (do not set isBooked: false)

        // Notify the salon owner about the cancellation (non-fatal if it fails)
        try {
          const recipient = booking.salonId?.ownerId;

          if (recipient) {
            await Notification.create({
              recipient,
              type: "booking",
              title: "Booking Cancelled",
              message: "Customer cancelled the booking.",
              bookingId: booking._id,
            });
          }
        } catch (notifyError) {
          console.error("Cancel Booking Notification Error:", notifyError);
        }
      }

      booking.status = "cancelled";
      await booking.save();

      // Get updated booking with details
      const updatedBooking =
        await Booking.findById(booking._id)
          .populate("salonId")
          .populate("serviceId")
          .populate("slotId");

      res.status(200).json({
        message: "Booking cancelled successfully",
        booking: updatedBooking,
      });

    } catch (error) {
      console.error("Cancel Booking Error:", error);

      res.status(500).json({
        message: error.message,
      });
    }
  }
);


// ==========================================
// GET BOOKINGS FOR SALON OWNER
// ==========================================

router.get(
  "/salon-owner/:userId",
  protect,
  authorize("salon", "admin"),
  getSalonOwnerBookingsValidator,
  async (req, res) => {
    try {
      const User = require("../models/User");
      const Salon = require("../models/Salon");

      const user = await User.findById(
        req.params.userId
      );

      if (!user) {
        return res.status(404).json({
          message: "Owner not found",
        });
      }

      const salons = await Salon.find({
        ownerId: user._id,
      });

      if (salons.length === 0) {
        return res.status(404).json({
          message: "Salon not found for this owner",
        });
      }

      const salonIds = salons.map(
        (salon) => salon._id
      );

      const bookings = await Booking.find({
        salonId: {
          $in: salonIds,
        },
      })
        .populate(
          "customerId",
          "name email phone"
        )
        .populate("serviceId")
        .populate("slotId")
        .sort({
          createdAt: -1,
        });

      res.status(200).json(bookings);

    } catch (error) {
      console.error(
        "Salon Owner Bookings Error:",
        error
      );

      res.status(500).json({
        message: error.message,
      });
    }
  }
);


module.exports = router;