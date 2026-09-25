const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salon",
      required: true,
    },

    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Slot",
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "cancelled",
        "completed",
      ],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for actual query patterns:
// 1. Customer bookings: find({ customerId }).sort({ createdAt: -1 })
bookingSchema.index({ customerId: 1, createdAt: -1 });

// 2. Salon bookings: find({ salonId }).sort({ createdAt: -1 })
// 3. Salon owner bookings: find({ salonId: { $in: salonIds } }).sort({ createdAt: -1 })
bookingSchema.index({ salonId: 1, createdAt: -1 });

module.exports = mongoose.model(
  "Booking",
  bookingSchema
);