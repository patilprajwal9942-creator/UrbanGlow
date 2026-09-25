const mongoose = require("mongoose");
const Salon = require("../../models/Salon");
const Booking = require("../../models/Booking");
const Service = require("../../models/Service");

// GET /api/admin/salons
// ?search=&status=&page=1&limit=20&sortBy=createdAt&sortOrder=desc
exports.getSalons = async (req, res) => {
  try {
    const {
      search = "",
      status,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (search) {
      query.$or = [
        { salonName: { $regex: search, $options: "i" } },
        { ownerName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (status) {
      query.status = status;
    }

    const sortableFields = ["createdAt", "salonName", "status"];
    const sortField = sortableFields.includes(sortBy) ? sortBy : "createdAt";
    const sortDir = sortOrder === "asc" ? 1 : -1;

    const [salons, total] = await Promise.all([
      Salon.find(query)
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Salon.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 0,
      salons: salons.map((s) => ({ ...s, status: s.status || "active" })),
    });

  } catch (error) {
    console.error("Admin Get Salons Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/salons/:id
exports.getSalonDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const salon = await Salon.findById(id).lean();
    if (!salon) {
      return res.status(404).json({ success: false, message: "Salon not found" });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const salonObjectId = new mongoose.Types.ObjectId(id);

    const [statsResult, services, recentBookingsRaw] = await Promise.all([
      Booking.aggregate([
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
            statusCounts: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
            customers: [
              { $match: { status: "completed" } },
              { $group: { _id: "$customerId" } },
              { $count: "count" },
            ],
            todayRevenue: [
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
      Service.find({ salonId: id }).lean(),
      Booking.find({ salonId: id })
        .populate("customerId", "name email")
        .populate("serviceId", "serviceName price")
        .populate("slotId")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const facet = statsResult[0] || {};
    const statusMap = {};
    (facet.statusCounts || []).forEach((s) => {
      statusMap[s._id] = s.count;
    });

    res.status(200).json({
      success: true,
      salon: { ...salon, status: salon.status || "active" },
      stats: {
        totalBookings:
          (statusMap.pending || 0) +
          (statusMap.confirmed || 0) +
          (statusMap.cancelled || 0) +
          (statusMap.completed || 0),
        pendingBookings: statusMap.pending || 0,
        confirmedBookings: statusMap.confirmed || 0,
        completedBookings: statusMap.completed || 0,
        cancelledBookings: statusMap.cancelled || 0,
        totalCustomers: facet.customers?.[0]?.count || 0,
        todayRevenue: facet.todayRevenue?.[0]?.total || 0,
        monthlyRevenue: facet.monthlyRevenue?.[0]?.total || 0,
        totalRevenue: facet.totalRevenue?.[0]?.total || 0,
      },
      services,
      recentBookings: recentBookingsRaw.map((b) => ({
        bookingId: b._id,
        customerName: b.customerId?.name || "Not available",
        serviceName: b.serviceId?.serviceName || "Not available",
        amount: b.serviceId?.price ?? 0,
        appointmentDate: b.slotId?.date || null,
        status: b.status,
        createdAt: b.createdAt,
      })),
    });

  } catch (error) {
    console.error("Admin Salon Details Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/salons/:id/status
// Body: { status: "active" | "inactive" | "blocked" }
//
// Deliberately a status update, not a hard delete: bookings, services, and
// slots all reference salonId, so deleting a salon document would either
// orphan those records or require cascading deletes across three
// collections. Setting status to "blocked" is the safe equivalent - it
// hides the salon from customer discovery (see routes/salonRoutes.js)
// without breaking any existing relationship.
exports.updateSalonStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["active", "inactive", "blocked"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowedStatuses.join(", ")}`,
      });
    }

    const salon = await Salon.findById(id);
    if (!salon) {
      return res.status(404).json({ success: false, message: "Salon not found" });
    }

    salon.status = status;
    await salon.save();

    res.status(200).json({
      success: true,
      message: `Salon status updated to ${status}`,
      salon,
    });

  } catch (error) {
    console.error("Admin Update Salon Status Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};