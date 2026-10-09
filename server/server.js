const dotenv = require("dotenv");

// IMPORTANT: Load .env FIRST
dotenv.config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

// ==========================================
// CONFIG
// ==========================================

const connectDB = require("./config/db");

// ==========================================
// ROUTES
// ==========================================

const adminAuthRoutes = require("./routes/admin/adminAuthRoutes");

const authRoutes = require("./routes/authRoutes");
const salonRoutes = require("./routes/salonRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const slotRoutes = require("./routes/SlotRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

const notificationRoutes = require("./routes/notificationRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

// Support
const supportRoutes = require("./routes/supportRoutes");

// ==========================================
// ADMIN ROUTES
// ==========================================

const adminStatsRoutes = require("./routes/adminStatsRoutes");
const adminDashboardRoutes = require("./routes/admin/adminDashboardRoutes");
const adminAnalyticsRoutes = require("./routes/admin/adminAnalyticsRoutes");
const adminSalonRoutes = require("./routes/admin/adminSalonRoutes");
const adminUserRoutes = require("./routes/admin/adminUserRoutes");
const adminBookingRoutes = require("./routes/admin/adminBookingRoutes");

// ==========================================
// APP
// ==========================================

const app = express();

// ==========================================
// CONNECT DATABASE
// ==========================================

connectDB();

// ==========================================
// SECURITY MIDDLEWARE
// ==========================================

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],

        styleSrc: [
          "'self'",
          "'unsafe-inline'",
        ],

        scriptSrc: ["'self'"],

        imgSrc: [
          "'self'",
          "data:",
          "https:",
        ],

        connectSrc: [
          "'self'",
        ],

        fontSrc: [
          "'self'",
        ],

        objectSrc: [
          "'none'",
        ],

        mediaSrc: [
          "'self'",
        ],

        frameSrc: [
          "'none'",
        ],
      },
    },

    crossOriginEmbedderPolicy: false,
  })
);

// ==========================================
// RATE LIMITER
// ==========================================

const limiter =
  require("express-rate-limit")({
    windowMs:
      15 * 60 * 1000,

    max: 100,

    message: {
      success: false,
      message:
        "Too many requests from this IP, please try again later",
    },

    standardHeaders: true,

    legacyHeaders: false,
  });

app.use(limiter);

// ==========================================
// CORS
// ==========================================

const allowedOrigins = [
  "http://localhost:5173",
  "https://urban-glow-ioi1lkmaa-patilprajwal9942-creator.vercel.app",
  "https://urban-glow-zeta.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// ==========================================
// BODY PARSER
// ==========================================

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

// ==========================================
// COOKIE PARSER
// ==========================================

app.use(cookieParser());

// ==========================================
// ROUTES
// ==========================================

// ------------------------------------------
// Authentication
// ------------------------------------------

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/admin/auth",
  adminAuthRoutes
);

// ------------------------------------------
// Main Application
// ------------------------------------------

app.use(
  "/api/salons",
  salonRoutes
);

app.use(
  "/api/services",
  serviceRoutes
);

app.use(
  "/api/slots",
  slotRoutes
);

app.use(
  "/api/bookings",
  bookingRoutes
);

// ------------------------------------------
// Notifications
// ------------------------------------------

app.use(
  "/api/notifications",
  notificationRoutes
);

// ------------------------------------------
// Analytics
// ------------------------------------------

app.use(
  "/api/analytics",
  analyticsRoutes
);

// ------------------------------------------
// Support Tickets
// ------------------------------------------

app.use(
  "/api/support",
  supportRoutes
);

// ==========================================
// ADMIN ROUTES
// ==========================================

app.use(
  "/api/admin",
  adminStatsRoutes
);

app.use(
  "/api/admin",
  adminDashboardRoutes
);

app.use(
  "/api/admin",
  adminAnalyticsRoutes
);

app.use(
  "/api/admin",
  adminSalonRoutes
);

app.use(
  "/api/admin",
  adminUserRoutes
);

app.use(
  "/api/admin",
  adminBookingRoutes
);

// ==========================================
// TEST ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.send(
    "UrbanGlow Backend Running 🚀"
  );
});

// ==========================================
// START SERVER
// ==========================================

const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});