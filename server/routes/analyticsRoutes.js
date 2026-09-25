const express = require("express");
const mongoose = require("mongoose");
const { protect, authorize } = require("../middleware/authMiddleware");
const Booking = require("../models/Booking");
const Salon = require("../models/Salon");
const { getDateRangeForFilter } = require("../utils/dateRangeHelper");
const {
  salonIdValidator,
  dailyAnalyticsValidator,
  transactionsValidator,
} = require("../validators/analyticsValidator");

const router = express.Router();

// ==========================================
// HELPERS
// ==========================================

// Verify the salon exists and the current user owns it (or is admin).
// Reuses the same ownership pattern already used in bookingRoutes.js /
// SlotRoutes.js so salon owners can never see another salon's analytics.
async function verifySalonOwnership(salonId, user) {
  const salon = await Salon.findById(salonId);

  if (!salon) {
    return { status: 404, message: "Salon not found" };
  }

  if (salon.ownerId.toString() !== user.id && user.role !== "admin") {
    return {
      status: 403,
      message: "Not authorized to access this salon's analytics",
    };
  }

  return { salon };
}

// Turn one $facet bucket (an array of { _id: status, count, income, customers })
// into a flat, predictable object.
function shapeStatusGroup(groupArray) {
  const shaped = {
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
    income: 0,
    customersServed: 0,
  };

  (groupArray || []).forEach((entry) => {
    if (Object.prototype.hasOwnProperty.call(shaped, entry._id)) {
      shaped[entry._id] = entry.count;
    }

    if (entry._id === "completed") {
      shaped.income = entry.income || 0;
      shaped.customersServed = (entry.customers || []).length;
    }
  });

  return shaped;
}

// ==========================================
// GET OVERVIEW (today + this month + overall + status summary)
//
// A single aggregation (with $facet) computes all four sections in one
// database round-trip instead of running four separate queries.
// ==========================================

router.get(
  "/salon/:salonId/overview",
  protect,
  authorize("salon", "admin"),
  salonIdValidator,
  async (req, res) => {
    try {
      const { salonId } = req.params;

      const ownership = await verifySalonOwnership(salonId, req.user);
      if (ownership.status) {
        return res.status(ownership.status).json({
          success: false,
          message: ownership.message,
        });
      }

      const salonObjectId = new mongoose.Types.ObjectId(salonId);

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const [result] = await Booking.aggregate([
        { $match: { salonId: salonObjectId } },
        {
          $lookup: {
            from: "services",
            localField: "serviceId",
            foreignField: "_id",
            as: "service",
          },
        },
        { $unwind: { path: "$service", preserveNullAndEmptyArrays: true } },
        {
          $facet: {
            // "Today" = new requests received today, OR bookings whose
            // status last changed today (accepted/rejected/completed today).
            today: [
              {
                $match: {
                  $or: [
                    { status: "pending", createdAt: { $gte: todayStart, $lt: todayEnd } },
                    {
                      status: { $in: ["confirmed", "cancelled", "completed"] },
                      updatedAt: { $gte: todayStart, $lt: todayEnd },
                    },
                  ],
                },
              },
              {
                $group: {
                  _id: "$status",
                  count: { $sum: 1 },
                  income: {
                    $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$service.price", 0] },
                  },
                  customers: { $addToSet: "$customerId" },
                },
              },
            ],
            // "This month" = bookings whose status last changed this month
            month: [
              {
                $match: {
                  status: { $in: ["confirmed", "cancelled", "completed"] },
                  updatedAt: { $gte: monthStart, $lt: monthEnd },
                },
              },
              {
                $group: {
                  _id: "$status",
                  count: { $sum: 1 },
                  income: {
                    $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$service.price", 0] },
                  },
                  customers: { $addToSet: "$customerId" },
                },
              },
            ],
            // All-time totals + current status counts
            overall: [
              {
                $group: {
                  _id: "$status",
                  count: { $sum: 1 },
                  income: {
                    $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$service.price", 0] },
                  },
                  customers: { $addToSet: "$customerId" },
                },
              },
            ],
          },
        },
      ]);

      const today = shapeStatusGroup(result?.today);
      const month = shapeStatusGroup(result?.month);
      const overall = shapeStatusGroup(result?.overall);

      res.status(200).json({
        success: true,
        today: {
          totalIncome: today.income,
          customersServed: today.customersServed,
          completedBookings: today.completed,
          pendingRequests: today.pending,
          confirmedBookings: today.confirmed,
          cancelledBookings: today.cancelled,
        },
        thisMonth: {
          monthlyIncome: month.income,
          completedCustomers: month.customersServed,
          completedBookings: month.completed,
          cancelledBookings: month.cancelled,
        },
        overall: {
          totalCustomersServed: overall.customersServed,
          totalCompletedBookings: overall.completed,
          totalIncome: overall.income,
          totalCancelledBookings: overall.cancelled,
          totalPendingBookings: overall.pending,
          totalConfirmedBookings: overall.confirmed,
        },
        statusSummary: {
          pending: overall.pending,
          confirmed: overall.confirmed,
          completed: overall.completed,
          cancelled: overall.cancelled,
        },
      });

    } catch (error) {
      console.error("Analytics Overview Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// ==========================================
// GET DAILY INCOME (for the chart)
// ==========================================

router.get(
  "/salon/:salonId/daily",
  protect,
  authorize("salon", "admin"),
  dailyAnalyticsValidator,
  async (req, res) => {
    try {
      const { salonId } = req.params;

      const ownership = await verifySalonOwnership(salonId, req.user);
      if (ownership.status) {
        return res.status(ownership.status).json({
          success: false,
          message: ownership.message,
        });
      }

      const numDays = Math.min(parseInt(req.query.days) || 30, 90);
      const end = new Date();
      const start = new Date(end.getTime() - numDays * 24 * 60 * 60 * 1000);

      const salonObjectId = new mongoose.Types.ObjectId(salonId);

      const data = await Booking.aggregate([
        {
          $match: {
            salonId: salonObjectId,
            status: "completed",
            updatedAt: { $gte: start, $lte: end },
          },
        },
        {
          $lookup: {
            from: "services",
            localField: "serviceId",
            foreignField: "_id",
            as: "service",
          },
        },
        { $unwind: "$service" },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
            income: { $sum: "$service.price" },
            completedBookings: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      res.status(200).json({
        success: true,
        days: numDays,
        data: data.map((entry) => ({
          date: entry._id,
          income: entry.income,
          completedBookings: entry.completedBookings,
        })),
      });

    } catch (error) {
      console.error("Analytics Daily Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// ==========================================
// GET TRANSACTION HISTORY (completed bookings only)
// ==========================================

router.get(
  "/salon/:salonId/transactions",
  protect,
  authorize("salon", "admin"),
  transactionsValidator,
  async (req, res) => {
    try {
      const { salonId } = req.params;

      const ownership = await verifySalonOwnership(salonId, req.user);
      if (ownership.status) {
        return res.status(ownership.status).json({
          success: false,
          message: ownership.message,
        });
      }

      const { filter = "all", startDate, endDate } = req.query;

      const range = getDateRangeForFilter(filter, startDate, endDate);

      if (range && range.error) {
        return res.status(400).json({ success: false, message: range.error });
      }

      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const skip = (page - 1) * limit;

      const query = {
        salonId,
        status: "completed",
      };

      // Transactions are dated by completion time (when the status last
      // changed to "completed"), the same field income is calculated from.
      if (range) {
        query.updatedAt = { $gte: range.start, $lt: range.end };
      }

      const [transactions, total] = await Promise.all([
        Booking.find(query)
          .populate("customerId", "name email")
          .populate("serviceId", "serviceName price")
          .populate("slotId")
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit),
        Booking.countDocuments(query),
      ]);

      const shaped = transactions.map((booking) => ({
        bookingId: booking._id,
        customerName: booking.customerId?.name || "Not available",
        customerEmail: booking.customerId?.email || "Not available",
        serviceName: booking.serviceId?.serviceName || "Not available",
        amount: booking.serviceId?.price ?? 0,
        appointmentDate: booking.slotId?.date || null,
        appointmentTime: booking.slotId
          ? `${booking.slotId.startTime} - ${booking.slotId.endTime}`
          : null,
        completedAt: booking.updatedAt,
        status: booking.status,
      }));

      res.status(200).json({
        success: true,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 0,
        transactions: shaped,
      });

    } catch (error) {
      console.error("Analytics Transactions Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

module.exports = router;