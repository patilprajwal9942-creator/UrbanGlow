const User = require("../../models/User");
const Salon = require("../../models/Salon");
const Booking = require("../../models/Booking");

// Salons created before the status field existed have no stored value yet -
// treat those as active, same convention used in routes/salonRoutes.js.
const ACTIVE_SALON_FILTER = { $or: [{ status: "active" }, { status: { $exists: false } }] };

// GET /api/admin/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      totalUsers,
      totalCustomers,
      totalSalonOwners,
      totalSalons,
      activeSalons,
      blockedSalons,
      bookingFacetResult,
      recentBookingsRaw,
      recentUsers,
      recentSalons,
      topPerformingSalons,
      upcomingAgg,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "salon" }),
      Salon.countDocuments(),
      Salon.countDocuments(ACTIVE_SALON_FILTER),
      Salon.countDocuments({ status: "blocked" }),

      // One aggregation (with $facet) computes status counts, today's
      // booking count, and today/monthly/all-time revenue in a single
      // database round-trip.
      Booking.aggregate([
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
            statusCounts: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
            todaysBookings: [
              { $match: { createdAt: { $gte: todayStart, $lt: todayEnd } } },
              { $count: "count" },
            ],
            todaysRevenue: [
              { $match: { status: "completed", updatedAt: { $gte: todayStart, $lt: todayEnd } } },
              { $group: { _id: null, total: { $sum: "$service.price" } } },
            ],
            monthlyRevenue: [
              { $match: { status: "completed", updatedAt: { $gte: monthStart, $lt: monthEnd } } },
              { $group: { _id: null, total: { $sum: "$service.price" } } },
            ],
            totalRevenue: [
              { $match: { status: "completed" } },
              { $group: { _id: null, total: { $sum: "$service.price" } } },
            ],
          },
        },
      ]),

      Booking.find()
        .populate("customerId", "name")
        .populate("salonId", "salonName")
        .populate("serviceId", "serviceName price")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      User.find().select("-password").sort({ createdAt: -1 }).limit(5).lean(),

      Salon.find().sort({ createdAt: -1 }).limit(5).lean(),

      // Top 5 salons by completed-booking revenue. Correlated sub-pipeline
      // lookup joins each salon's bookings to their service price 1:1 (a
      // plain array-field $lookup would de-duplicate repeated services and
      // undercount revenue, so the join happens per-booking instead).
      Salon.aggregate([
        {
          $lookup: {
            from: "bookings",
            let: { salonId: "$_id" },
            pipeline: [
              { $match: { $expr: { $and: [{ $eq: ["$salonId", "$$salonId"] }, { $eq: ["$status", "completed"] }] } } },
              {
                $lookup: {
                  from: "services",
                  localField: "serviceId",
                  foreignField: "_id",
                  as: "service",
                },
              },
              { $unwind: { path: "$service", preserveNullAndEmptyArrays: true } },
              { $project: { price: "$service.price" } },
            ],
            as: "completedBookings",
          },
        },
        {
          $addFields: {
            completedCount: { $size: "$completedBookings" },
            totalRevenue: { $sum: "$completedBookings.price" },
          },
        },
        { $match: { completedCount: { $gt: 0 } } },
        { $sort: { totalRevenue: -1 } },
        { $limit: 5 },
        {
          $project: {
            _id: 0,
            salonId: "$_id",
            salonName: 1,
            ownerName: 1,
            completedBookings: "$completedCount",
            totalRevenue: 1,
          },
        },
      ]),

      // Upcoming bookings: pending/confirmed whose slot time is still ahead.
      Booking.aggregate([
        { $match: { status: { $in: ["pending", "confirmed"] } } },
        {
          $lookup: {
            from: "slots",
            localField: "slotId",
            foreignField: "_id",
            as: "slot",
          },
        },
        { $unwind: "$slot" },
        {
          $addFields: {
            slotDateTime: {
              $dateFromString: {
                dateString: { $concat: ["$slot.date", "T", "$slot.startTime", ":00"] },
                onError: null,
              },
            },
          },
        },
        { $match: { slotDateTime: { $gte: now } } },
        { $count: "count" },
      ]),
    ]);

    const facet = bookingFacetResult[0] || {};
    const statusMap = {};
    (facet.statusCounts || []).forEach((s) => {
      statusMap[s._id] = s.count;
    });

    res.status(200).json({
      success: true,
      users: {
        totalUsers,
        totalCustomers,
        totalSalonOwners,
      },
      salons: {
        totalSalons,
        activeSalons,
        blockedSalons,
      },
      bookings: {
        totalBookings:
          (statusMap.pending || 0) +
          (statusMap.confirmed || 0) +
          (statusMap.cancelled || 0) +
          (statusMap.completed || 0),
        todaysBookings: facet.todaysBookings?.[0]?.count || 0,
        upcomingBookings: upcomingAgg?.[0]?.count || 0,
        pendingBookings: statusMap.pending || 0,
        confirmedBookings: statusMap.confirmed || 0,
        completedBookings: statusMap.completed || 0,
        cancelledBookings: statusMap.cancelled || 0,
      },
      revenue: {
        todaysRevenue: facet.todaysRevenue?.[0]?.total || 0,
        monthlyRevenue: facet.monthlyRevenue?.[0]?.total || 0,
        totalRevenue: facet.totalRevenue?.[0]?.total || 0,
      },
      recentBookings: recentBookingsRaw.map((b) => ({
        bookingId: b._id,
        customerName: b.customerId?.name || "Not available",
        salonName: b.salonId?.salonName || "Not available",
        serviceName: b.serviceId?.serviceName || "Not available",
        amount: b.serviceId?.price ?? 0,
        status: b.status,
        createdAt: b.createdAt,
      })),
      recentUsers: recentUsers.map((u) => ({
        userId: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
      })),
      recentSalons: recentSalons.map((s) => ({
        salonId: s._id,
        salonName: s.salonName,
        ownerName: s.ownerName,
        status: s.status || "active",
        createdAt: s.createdAt,
      })),
      topPerformingSalons,
    });

  } catch (error) {
    console.error("Admin Dashboard Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};