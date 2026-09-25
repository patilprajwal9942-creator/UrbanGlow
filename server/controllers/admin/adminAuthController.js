const Admin = require("../../models/admin");
const jwt = require("jsonwebtoken");

// ==========================================
// GENERATE ADMIN JWT TOKEN
// ==========================================

const generateAdminToken = (adminId) => {
  return jwt.sign(
    {
      id: adminId,
      userType: "admin",
    },
    process.env.JWT_SECRET,
    {
      expiresIn:
        process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};


// ==========================================
// SEND ADMIN TOKEN RESPONSE
// ==========================================

const sendAdminTokenResponse = (
  admin,
  statusCode,
  res
) => {

  const token =
    generateAdminToken(admin._id);

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

    secure:
      process.env.NODE_ENV === "production",

    sameSite: "lax",
  };

  res.cookie(
    "token",
    token,
    cookieOptions
  );

  res.status(statusCode).json({
    success: true,

    user: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: "admin",
    },
  });
};


// ==========================================
// ADMIN LOGIN
// ==========================================

exports.adminLogin = async (
  req,
  res
) => {

  try {

    const {
      email,
      password,
    } = req.body;

    // Check email and password
    if (!email || !password) {

      return res.status(400).json({
        success: false,
        message:
          "Please provide email and password",
      });
    }

    // Find admin
    const admin =
      await Admin.findOne({
        email:
          email.trim().toLowerCase(),
      }).select("+password");

    if (!admin) {

      return res.status(401).json({
        success: false,
        message:
          "Invalid admin credentials",
      });
    }

    // Check account status
    if (!admin.isActive) {

      return res.status(403).json({
        success: false,
        message:
          "Admin account has been deactivated",
      });
    }

    // Check password
    const isMatch =
      await admin.comparePassword(
        password
      );

    if (!isMatch) {

      return res.status(401).json({
        success: false,
        message:
          "Invalid admin credentials",
      });
    }

    // Login successful
    sendAdminTokenResponse(
      admin,
      200,
      res
    );

  } catch (error) {

    console.error(
      "Admin Login Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Admin login failed",
    });
  }
};


// ==========================================
// ADMIN LOGOUT
// ==========================================

exports.adminLogout = async (
  req,
  res
) => {

  try {

    res.cookie(
      "token",
      "",
      {
        expires:
          new Date(Date.now()),

        httpOnly: true,

        secure:
          process.env.NODE_ENV ===
          "production",

        sameSite: "lax",
      }
    );

    res.status(200).json({
      success: true,
      message:
        "Admin logged out successfully",
    });

  } catch (error) {

    console.error(
      "Admin Logout Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Admin logout failed",
    });
  }
};


// ==========================================
// GET ADMIN PROFILE
// ==========================================

exports.getAdminProfile = async (
  req,
  res
) => {

  try {

    const admin =
      await Admin.findById(
        req.user._id
      );

    if (!admin) {

      return res.status(404).json({
        success: false,
        message:
          "Admin not found",
      });
    }

    res.status(200).json({

      success: true,

      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: "admin",
      },

    });

  } catch (error) {

    console.error(
      "Get Admin Profile Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to get admin profile",
    });
  }
};