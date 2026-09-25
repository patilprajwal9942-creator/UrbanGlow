const mongoose = require("mongoose");

const daySchema = new mongoose.Schema(
  {
    open: {
      type: String,
      trim: true,
    },

    close: {
      type: String,
      trim: true,
    },

    isClosed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const workingHoursSchema = new mongoose.Schema(
  {
    monday: {
      type: daySchema,
      default: {
        open: "10:00",
        close: "18:00",
        isClosed: false,
      },
    },

    tuesday: {
      type: daySchema,
      default: {
        open: "10:00",
        close: "18:00",
        isClosed: false,
      },
    },

    wednesday: {
      type: daySchema,
      default: {
        open: "10:00",
        close: "18:00",
        isClosed: false,
      },
    },

    thursday: {
      type: daySchema,
      default: {
        open: "10:00",
        close: "18:00",
        isClosed: false,
      },
    },

    friday: {
      type: daySchema,
      default: {
        open: "10:00",
        close: "18:00",
        isClosed: false,
      },
    },

    saturday: {
      type: daySchema,
      default: {
        open: "10:00",
        close: "20:00",
        isClosed: false,
      },
    },

    sunday: {
      type: daySchema,
      default: {
        open: null,
        close: null,
        isClosed: true,
      },
    },
  },
  { _id: false }
);

const salonSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    salonName: {
      type: String,
      required: true,
      trim: true,
    },

    ownerName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f",
    },

    workingHours: {
      type: workingHoursSchema,
      default: {},
    },

    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },

    // ==========================================
    // SALON LOCATION
    // ==========================================
    // GeoJSON Point
    // coordinates = [longitude, latitude]
    //
    // This remains optional so existing salons
    // without coordinates continue to work.
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },

      coordinates: {
        type: [Number],
      },
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// MONGODB GEO INDEX
// ==========================================

salonSchema.index({
  location: "2dsphere",
});

module.exports = mongoose.model(
  "Salon",
  salonSchema,
  "Salon"
);