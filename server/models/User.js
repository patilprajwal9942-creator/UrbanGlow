const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Password is required only for local/email registration
    password: {
      type: String,
      select: false,
    },

    // Authentication provider
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    // Google unique user ID
    googleId: {
      type: String,
      default: null,
      sparse: true,
    },

    // Google emails are already verified by Google
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    phone: {
      type: String,
      default: null,
    },

    isPhoneVerified: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      enum: ["customer", "salon", "admin"],
      default: "customer",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },

  {
    timestamps: true,
  }
);


// ==========================================
// PASSWORD VALIDATION
// ==========================================

userSchema.pre("validate", function () {

  // Local users must have a password
  if (this.authProvider === "local" && !this.password) {
    this.invalidate(
      "password",
      "Password is required for email registration"
    );
  }

});


// ==========================================
// HASH PASSWORD BEFORE SAVING
// ==========================================

userSchema.pre("save", async function () {

  // Don't hash password if it wasn't changed
  if (!this.isModified("password")) return;

  // Google users don't have a password
  if (!this.password) return;

  this.password = await bcrypt.hash(this.password, 12);

});


// ==========================================
// COMPARE PASSWORD
// ==========================================

userSchema.methods.comparePassword = async function (
  candidatePassword
) {

  if (!this.password) {
    return false;
  }

  return bcrypt.compare(
    candidatePassword,
    this.password
  );

};


module.exports = mongoose.model("User", userSchema);