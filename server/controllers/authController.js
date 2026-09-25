const User = require("../models/User");
const OTP = require("../models/OTP");
const jwt = require("jsonwebtoken");
const smsService = require("../services/smsService");
const { OAuth2Client } = require("google-auth-library");

// Google OAuth Client
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

// ==========================================
// Generate JWT Token
// ==========================================

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// ==========================================
// Generate OTP
// ==========================================

const generateOTP = () => {
  return Math.floor(
    100000 + Math.random() * 900000
  ).toString();
};

// ==========================================
// Send Token Response
// ==========================================

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() +
        (process.env.JWT_COOKIE_EXPIRES_IN || 7) *
          24 *
          60 *
          60 *
          1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };

  res.cookie("token", token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    user,
  });
};

// ==========================================
// SEND OTP
// ==========================================

exports.sendOTP = async (req, res) => {
  try {
    const { phone, type } = req.body;

    const existingOTP = await OTP.findOne({
      phone,
      type,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (existingOTP) {
      const timeLeft = Math.ceil(
        (existingOTP.expiresAt - new Date()) /
          1000 /
          60
      );

      return res.status(400).json({
        success: false,
        message: `Please wait ${timeLeft} minutes before requesting a new OTP`,
      });
    }

    const otp = generateOTP();

    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    await OTP.create({
      phone,
      otp,
      type,
      expiresAt,
    });

    await smsService.sendSMS({
      phone,
      message: `Your UrbanGlow OTP is: ${otp}. Valid for 10 minutes.`,
    });

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      expiresIn: 600,
    });

  } catch (error) {
    console.error("Send OTP Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
};

// ==========================================
// VERIFY OTP
// ==========================================

exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp, type } = req.body;

    const otpRecord = await OTP.findOne({
      phone,
      type,
      used: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    if (otpRecord.attempts >= 5) {
      return res.status(400).json({
        success: false,
        message:
          "Too many failed attempts, please request a new OTP",
      });
    }

    const isValid =
      await otpRecord.compareOTP(otp);

    if (!isValid) {
      otpRecord.attempts += 1;

      await otpRecord.save();

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
        attemptsLeft: 5 - otpRecord.attempts,
      });
    }

    otpRecord.used = true;

    await otpRecord.save();

    let user = null;
    let token = null;

    if (
      type === "registration" ||
      type === "login"
    ) {
      user = await User.findOne({ phone });

      if (user) {
        token = generateToken(user._id);
      }
    }

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      user,
      token,
    });

  } catch (error) {
    console.error(
      "Verify OTP Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "OTP verification failed",
    });
  }
};

// ==========================================
// RESEND OTP
// ==========================================

exports.resendOTP = async (req, res) => {
  try {
    const { phone, type } = req.body;

    await OTP.updateMany(
      {
        phone,
        type,
        used: false,
      },
      {
        used: true,
      }
    );

    const otp = generateOTP();

    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    await OTP.create({
      phone,
      otp,
      type,
      expiresAt,
    });

    await smsService.sendSMS({
      phone,
      message: `Your UrbanGlow OTP is: ${otp}. Valid for 10 minutes.`,
    });

    res.status(200).json({
      success: true,
      message: "OTP resent successfully",
      expiresIn: 600,
    });

  } catch (error) {
    console.error(
      "Resend OTP Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to resend OTP",
    });
  }
};

// ==========================================
// VERIFY PHONE
// ==========================================

exports.verifyPhone = async (
  req,
  res
) => {
  try {
    const { phone, otp } = req.body;

    const otpRecord = await OTP.findOne({
      phone,
      type: "phone_verification",
      used: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    const isValid =
      await otpRecord.compareOTP(otp);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const user =
      await User.findByIdAndUpdate(
        req.user.id,
        {
          isPhoneVerified: true,
        },
        {
          new: true,
        }
      );

    otpRecord.used = true;

    await otpRecord.save();

    res.status(200).json({
      success: true,
      message:
        "Phone number verified successfully",
      user,
    });

  } catch (error) {
    console.error(
      "Verify Phone Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Phone verification failed",
    });
  }
};

// ==========================================
// REGISTER USER
// ==========================================

exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
    } = req.body;

    // Prevent public admin registration
    if (role === "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Admin registration is not allowed",
      });
    }

    // Allow only customer and salon
    const allowedRoles = [
      "customer",
      "salon",
    ];

    const userRole =
      allowedRoles.includes(role)
        ? role
        : "customer";

    const userExists =
      await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: userRole,
    });

    res.status(201).json({
      success: true,
      message:
        "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });

  } catch (error) {
    console.error(
      "Register Error:",
      error
    );

    if (
      error.name === "ValidationError"
    ) {
      const messages =
        Object.values(error.errors).map(
          (val) => val.message
        );

      return res.status(400).json({
        success: false,
        message:
          messages[0] ||
          "Validation error",
      });
    }

    if (error.code === 11000) {
      const field =
        Object.keys(
          error.keyPattern
        )[0];

      return res.status(409).json({
        success: false,
        message:
          `${field} already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// NORMAL LOGIN
// ==========================================

exports.login = async (req, res) => {
  try {
    const { email, password } =
      req.body;

    const user = await User.findOne({
      email,
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been deactivated",
      });
    }

    const isMatch =
      await user.comparePassword(
        password
      );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid credentials",
      });
    }

    sendTokenResponse(
      user,
      200,
      res
    );

  } catch (error) {
    console.error(
      "Login Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// GOOGLE LOGIN
// ==========================================

exports.googleLogin = async (
  req,
  res
) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message:
          "Google credential is required",
      });
    }

    // Verify Google ID Token
    const ticket =
      await googleClient.verifyIdToken({
        idToken: credential,
        audience:
          process.env.GOOGLE_CLIENT_ID,
      });

    const payload =
      ticket.getPayload();

    const {
      sub: googleId,
      email,
      name,
      email_verified,
    } = payload;

    // Security check
    if (!email_verified) {
      return res.status(400).json({
        success: false,
        message:
          "Google email is not verified",
      });
    }

    // Find existing UrbanGlow user
    const user =
      await User.findOne({
        email: email.toLowerCase(),
      });

    // User does not exist
    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "No UrbanGlow account found with this Google email. Please register first.",
      });
    }

    // Check account status
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been deactivated",
      });
    }

    // Login successful
    sendTokenResponse(
      user,
      200,
      res
    );

  } catch (error) {
    console.error(
      "Google Login Error:",
      error
    );

    res.status(401).json({
      success: false,
      message:
        "Google authentication failed",
    });
  }
};

// ==========================================
// LOGOUT
// ==========================================

exports.logout = async (req, res) => {
  try {
    res.cookie("token", "", {
      expires: new Date(Date.now()),
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      message:
        "Logged out successfully",
    });

  } catch (error) {
    console.error(
      "Logout Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// GET CURRENT USER
// ==========================================

exports.getMe = async (req, res) => {
  try {
    const user =
      await User.findById(
        req.user.id
      );

    if (user) {
      res.status(200).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      });

    } else {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

  } catch (error) {
    console.error(
      "Get Me Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// UPDATE PASSWORD
// ==========================================

exports.updatePassword = async (
  req,
  res
) => {
  try {
    const user =
      await User.findById(
        req.user.id
      );

    const {
      currentPassword,
      newPassword,
    } = req.body;

    if (
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide current and new password",
      });
    }

    const isMatch =
      await user.comparePassword(
        currentPassword
      );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message:
          "Current password is incorrect",
      });
    }

    user.password = newPassword;

    await user.save();

    res.status(200).json({
      success: true,
      message:
        "Password updated successfully",
    });

  } catch (error) {
    console.error(
      "Update Password Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// RESET PASSWORD
// ==========================================

exports.resetPassword = async (
  req,
  res
) => {
  try {
    const {
      phone,
      newPassword,
    } = req.body;

    if (
      !phone ||
      !newPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Phone and new password are required",
      });
    }

    const OTP_VERIFIED_WINDOW_MS =
      10 * 60 * 1000;

    const verifiedOTP =
      await OTP.findOne({
        phone,
        type: "password_reset",
        used: true,
      }).sort({
        updatedAt: -1,
      });

    if (
      !verifiedOTP ||
      Date.now() -
        new Date(
          verifiedOTP.updatedAt
        ).getTime() >
        OTP_VERIFIED_WINDOW_MS
    ) {
      return res.status(400).json({
        success: false,
        message:
          "OTP verification required before resetting password. Please verify your OTP again.",
      });
    }

    const user =
      await User.findOne({
        phone,
      });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    user.password =
      newPassword;

    await user.save();

    verifiedOTP.used = true;

    await verifiedOTP.save();

    res.status(200).json({
      success: true,
      message:
        "Password reset successfully",
    });

  } catch (error) {
    console.error(
      "Reset Password Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};