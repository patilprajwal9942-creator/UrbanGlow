const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema(
  {
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salon",
      required: true,
    },

    date: {
      type: String,
      required: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    isBooked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Same salon + same date + same start/end time cannot be duplicated
slotSchema.index(
  {
    salonId: 1,
    date: 1,
    startTime: 1,
    endTime: 1,
  },
  {
    unique: true,
  }
);

// Method to get full datetime for comparison
slotSchema.methods.getFullDateTime = function () {
  return new Date(`${this.date}T${this.startTime}:00`);
};

// Static method to get available dates for a salon
slotSchema.statics.getAvailableDates = async function (salonId) {
  const now = new Date();

  const slots = await this.find({
    salonId,
    isBooked: false,
  }).select("date startTime");

  const dates = new Set();

  slots.forEach((slot) => {
    const slotDateTime = slot.getFullDateTime();
    if (slotDateTime > now) {
      dates.add(slot.date);
    }
  });

  return Array.from(dates);
};

module.exports = mongoose.model("Slot", slotSchema);