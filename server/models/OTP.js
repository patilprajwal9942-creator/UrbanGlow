const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      index: true,
    },
    otp: {
      type: String,
      required: [true, "OTP is required"],
      select: false,
    },
    type: {
      type: String,
      enum: ["registration", "login", "password_reset", "phone_verification"],
      required: [true, "OTP type is required"],
    },
    used: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    timestamps: true,
  }
);

otpSchema.index({ phone: 1, type: 1 });

otpSchema.pre("save", async function (next) {
  if (!this.isModified("otp")) return next();
  this.otp = await bcrypt.hash(this.otp, 10);
  next();
});

otpSchema.methods.compareOTP = async function (candidateOTP) {
  return bcrypt.compare(candidateOTP, this.otp);
};

otpSchema.statics.cleanupExpired = async function () {
  return this.deleteMany({ expiresAt: { $lt: new Date() } });
};

module.exports = mongoose.model("OTP", otpSchema);