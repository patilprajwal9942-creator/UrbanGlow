const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Admin = require("../models/admin");

const OTP = require("../models/OTP");


// ==========================================
// PROTECT ROUTES
// Supports User and Admin
// ==========================================

exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token =
      req.headers.authorization.split(" ")[1];

  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message:
        "Not authorized to access this route",
    });
  }

  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    let currentUser = null;

    // ==========================================
    // CHECK ADMIN TOKEN
    // ==========================================

    if (decoded.userType === "admin") {

      currentUser =
        await Admin.findById(decoded.id);

      if (!currentUser) {
        return res.status(401).json({
          success: false,
          message: "Admin not found",
        });
      }

      if (!currentUser.isActive) {
        return res.status(401).json({
          success: false,
          message:
            "Admin account has been deactivated",
        });
      }

      // Add role manually
      req.user = {
        ...currentUser.toObject(),
        role: "admin",
      };

      req.userType = "admin";

    } 
    
    // ==========================================
    // CHECK NORMAL USER
    // ==========================================

    else {

      currentUser =
        await User.findById(decoded.id);

      if (!currentUser) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      if (!currentUser.isActive) {
        return res.status(401).json({
          success: false,
          message:
            "Account has been deactivated",
        });
      }

      req.user = currentUser;

      req.userType = "user";
    }

    next();

  } catch (error) {

    console.error(
      "Auth Error:",
      error
    );

    return res.status(401).json({
      success: false,
      message:
        "Not authorized to access this route",
    });
  }
};


// ==========================================
// AUTHORIZE ROLE
// ==========================================

exports.authorize = (...roles) => {
  return (req, res, next) => {

    if (
      !req.user ||
      !roles.includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message:
          `Role ${
            req.user?.role || "unknown"
          } is not authorized to access this route`,
      });
    }

    next();
  };
};


// ==========================================
// OPTIONAL AUTH
// ==========================================

exports.optionalAuth = async (
  req,
  res,
  next
) => {

  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith(
      "Bearer"
    )
  ) {
    token =
      req.headers.authorization.split(" ")[1];

  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {

    try {

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      if (
        decoded.userType === "admin"
      ) {

        const admin =
          await Admin.findById(
            decoded.id
          );

        if (admin) {

          req.user = {
            ...admin.toObject(),
            role: "admin",
          };

          req.userType = "admin";
        }

      } else {

        const user =
          await User.findById(
            decoded.id
          );

        if (user) {
          req.user = user;
          req.userType = "user";
        }
      }

    } catch (error) {

      req.user = null;
      req.userType = null;
    }
  }

  next();
};


// ==========================================
// VERIFY OTP
// ==========================================

exports.verifyOTP = async (
  req,
  res,
  next
) => {

  try {

    const {
      phone,
      otp,
      type,
    } = req.body;

    if (
      !phone ||
      !otp ||
      !type
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Phone, OTP, and type are required",
      });
    }

    const otpRecord =
      await OTP.findOne({
        phone,
        type,
        used: false,
      }).sort({
        createdAt: -1,
      });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired OTP",
      });
    }

    const isValid =
      await otpRecord.compareOTP(
        otp
      );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (
      otpRecord.expiresAt <
      new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    req.otpRecord =
      otpRecord;

    next();

  } catch (error) {

    console.error(
      "OTP Verification Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "OTP verification failed",
    });
  }
};


// ==========================================
// REQUIRE PHONE VERIFIED
// ==========================================

exports.requirePhoneVerified = async (
  req,
  res,
  next
) => {

  // Admin doesn't need phone verification
  if (
    req.userType === "admin"
  ) {
    return next();
  }

  if (
    !req.user.isPhoneVerified
  ) {
    return res.status(403).json({
      success: false,
      message:
        "Phone number verification required",
    });
  }

  next();
};


// ==========================================
// SANITIZE INPUT
// ==========================================

exports.sanitizeInput = (
  req,
  res,
  next
) => {

  const sanitize = (obj) => {

    for (const key in obj) {

      if (
        typeof obj[key] === "string"
      ) {

        obj[key] =
          obj[key]
            .trim()
            .replace(/[<>]/g, "");

      } else if (
        typeof obj[key] === "object" &&
        obj[key] !== null
      ) {

        sanitize(obj[key]);
      }
    }
  };

  if (req.body) {
    sanitize(req.body);
  }

  if (req.query) {
    sanitize(req.query);
  }

  if (req.params) {
    sanitize(req.params);
  }

  next();
};


// ==========================================
// PREVENT BRUTE FORCE
// ==========================================

exports.preventBruteForce = (
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000
) => {

  const attempts = new Map();

  return (
    req,
    res,
    next
  ) => {

    const key = req.ip;

    const now =
      Date.now();

    const windowStart =
      now - windowMs;

    if (!attempts.has(key)) {
      attempts.set(
        key,
        []
      );
    }

    const userAttempts =
      attempts
        .get(key)
        .filter(
          (time) =>
            time > windowStart
        );

    if (
      userAttempts.length >=
      maxAttempts
    ) {
      return res.status(429).json({
        success: false,
        message:
          "Too many attempts, please try again later",
      });
    }

    userAttempts.push(now);

    attempts.set(
      key,
      userAttempts
    );

    req.bruteForceAttempts =
      userAttempts.length;

    next();
  };
};


// ==========================================
// AUDIT LOG
// ==========================================

exports.auditLog = (action) => {

  return (
    req,
    res,
    next
  ) => {

    const logData = {

      action,

      ip: req.ip,

      userAgent:
        req.get("User-Agent"),

      userId:
        req.user?._id || null,

      userType:
        req.userType || null,

      timestamp:
        new Date(),
    };

    console.log(
      "AUDIT:",
      JSON.stringify(logData)
    );

    next();
  };
};