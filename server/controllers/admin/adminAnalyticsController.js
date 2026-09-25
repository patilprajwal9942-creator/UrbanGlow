const Booking = require("../../models/Booking");
const Salon = require("../../models/Salon");
const { getDateRangeForFilter } = require("../../utils/dateRangeHelper");

// GET /api/admin/analytics
// ?filter=today|yesterday|last7days|thisMonth|lastMonth|all|custom&startDate&endDate
exports.getAnalytics = async (req, res) => {
  try {
    const { filter = "all", startDate, endDate } = req.query;

    const range = getDateRangeForFilter(filter, startDate, endDate);
    if (range && range.error) {
      return res.status(400).json({ success: false, message: range.error });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = monthStart;

    const selectedMatch = range ? { updatedAt: { $gte: range.start, $lt: range.end } } : {};

    const [result] = await Booking.aggregate([
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
          // Totals for the selected filter window (drives the filter UI)
          selectedRange: [
            { $match: { ...selectedMatch, status: { $in: ["completed", "cancelled"] } } },
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
                revenue: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$service.price", 0] } },
              },
            },
          ],
          // Fixed reference points shown regardless of the selected filter
          allTime: [
            { $match: { status: { $in: ["completed", "cancelled"] } } },
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
                revenue: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$service.price", 0] } },
              },
            },
          ],
          today: [
            { $match: { status: "completed", updatedAt: { $gte: todayStart, $lt: todayEnd } } },
            { $group: { _id: null, revenue: { $sum: "$service.price" } } },
          ],
          week: [
            { $match: { status: "completed", updatedAt: { $gte: weekStart, $lt: todayEnd } } },
            { $group: { _id: null, revenue: { $sum: "$service.price" } } },
          ],
          month: [
            { $match: { status: "completed", updatedAt: { $gte: monthStart, $lt: monthEnd } } },
            { $group: { _id: null, revenue: { $sum: "$service.price" } } },
          ],
          lastMonth: [
            { $match: { status: "completed", updatedAt: { $gte: lastMonthStart, $lt: lastMonthEnd } } },
            { $group: { _id: null, revenue: { $sum: "$service.price" } } },
          ],
        },
      },
    ]);

    const shape = (arr) => {
      const map = {};
      (arr || []).forEach((e) => { map[e._id] = e; });
      return {
        completedBookings: map.completed?.count || 0,
        cancelledBookings: map.cancelled?.count || 0,
        revenue: map.completed?.revenue || 0,
      };
    };

    const selected = shape(result?.selectedRange);
    const allTime = shape(result?.allTime);

    const monthRevenue = result?.month?.[0]?.revenue || 0;
    const lastMonthRevenue = result?.lastMonth?.[0]?.revenue || 0;
    const revenueGrowthPercent =
      lastMonthRevenue > 0
        ? Number((((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1))
        : null;

    res.status(200).json({
      success: true,
      filter,
      // Fixed snapshots (always current, independent of the filter above)
      todaysRevenue: result?.today?.[0]?.revenue || 0,
      weeklyRevenue: result?.week?.[0]?.revenue || 0,
      monthlyRevenue: monthRevenue,
      lastMonthRevenue,
      revenueGrowthPercent,
      // All-time totals (also independent of the filter)
      totalPlatformRevenue: allTime.revenue,
      totalBookings: allTime.completedBookings + allTime.cancelledBookings,
      totalCompletedBookings: allTime.completedBookings,
      totalCancelledBookings: allTime.cancelledBookings,
      // Totals for whichever filter was selected
      selectedRange: {
        filter,
        completedBookings: selected.completedBookings,
        cancelledBookings: selected.cancelledBookings,
        revenue: selected.revenue,
      },
    });

  } catch (error) {
    console.error("Admin Analytics Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/analytics/salons
// ?search=&status=&sortBy=totalRevenue&sortOrder=desc&page=1&limit=20
exports.getSalonPerformance = async (req, res) => {
  try {
    const {
      search = "",
      status,
      sortBy = "totalRevenue",
      sortOrder = "desc",
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(parseInt(limit) || 20, 100);

    const salonMatch = {};
    if (search) {
      salonMatch.$or = [
        { salonName: { $regex: search, $options: "i" } },
        { ownerName: { $regex: search, $options: "i" } },
      ];
    }
    if (status) {
      salonMatch.status = status;
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Correlated sub-pipeline lookup: joins each salon's bookings to their
    // service price 1:1 per booking. (A plain array-field $lookup on
    // serviceId would de-duplicate repeated services and undercount
    // revenue for salons that sell the same service more than once.)
    const rows = await Salon.aggregate([
      { $match: salonMatch },
      {
        $lookup: {
          from: "bookings",
          let: { salonId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$salonId", "$$salonId"] } } },
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
              $project: {
                status: 1,
                customerId: 1,
                updatedAt: 1,
                price: "$service.price",
              },
            },
          ],
          as: "bookings",
        },
      },
      {
        $addFields: {
          totalBookings: { $size: "$bookings" },
          completedArr: { $filter: { input: "$bookings", cond: { $eq: ["$$this.status", "completed"] } } },
          cancelledBookings: {
            $size: { $filter: { input: "$bookings", cond: { $eq: ["$$this.status", "cancelled"] } } },
          },
        },
      },
      {
        $addFields: {
          completedBookings: { $size: "$completedArr" },
          uniqueCustomers: { $size: { $setUnion: ["$completedArr.customerId", []] } },
          totalRevenue: { $sum: "$completedArr.price" },
          todayRevenue: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$completedArr",
                    cond: {
                      $and: [
                        { $gte: ["$$this.updatedAt", todayStart] },
                        { $lt: ["$$this.updatedAt", todayEnd] },
                      ],
                    },
                  },
                },
                as: "b",
                in: "$$b.price",
              },
            },
          },
          monthlyRevenue: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$completedArr",
                    cond: {
                      $and: [
                        { $gte: ["$$this.updatedAt", monthStart] },
                        { $lt: ["$$this.updatedAt", monthEnd] },
                      ],
                    },
                  },
                },
                as: "b",
                in: "$$b.price",
              },
            },
          },
        },
      },
      {
        $project: {
          salonName: 1,
          ownerName: 1,
          status: { $ifNull: ["$status", "active"] },
          totalBookings: 1,
          completedBookings: 1,
          cancelledBookings: 1,
          uniqueCustomers: 1,
          totalRevenue: 1,
          todayRevenue: 1,
          monthlyRevenue: 1,
          createdAt: 1,
        },
      },
    ]);

    const sortableFields = [
      "totalRevenue", "monthlyRevenue", "todayRevenue",
      "totalBookings", "completedBookings", "cancelledBookings", "salonName",
    ];
    const sortField = sortableFields.includes(sortBy) ? sortBy : "totalRevenue";
    const sortDir = sortOrder === "asc" ? 1 : -1;

    rows.sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      if (typeof av === "string") {
        return sortDir * av.localeCompare(bv);
      }
      return sortDir * ((av || 0) - (bv || 0));
    });

    const total = rows.length;
    const start = (pageNum - 1) * limitNum;
    const paged = rows.slice(start, start + limitNum);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 0,
      salons: paged,
    });

  } catch (error) {
    console.error("Admin Salon Performance Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/transactions
// ?filter=&startDate&endDate&search=&salonId=&page=1&limit=20
exports.getTransactions = async (req, res) => {
  try {
    const {
      filter = "all",
      startDate,
      endDate,
      search = "",
      salonId,
      page = 1,
      limit = 20,
    } = req.query;

    const range = getDateRangeForFilter(filter, startDate, endDate);
    if (range && range.error) {
      return res.status(400).json({ success: false, message: range.error });
    }

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const query = { status: "completed" };
    if (range) {
      query.updatedAt = { $gte: range.start, $lt: range.end };
    }
    if (salonId) {
      query.salonId = salonId;
    }

    // Completed bookings ARE the transactions - this project has no
    // separate payment/transaction model, so (as instructed) we continue
    // using that existing logic rather than inventing fake payment records.
    let matches = await Booking.find(query)
      .populate("customerId", "name email")
      .populate("salonId", "salonName")
      .populate("serviceId", "serviceName price")
      .populate("slotId")
      .sort({ updatedAt: -1 })
      .lean();

    if (search) {
      const s = search.toLowerCase();
      matches = matches.filter((b) =>
        (b.customerId?.name || "").toLowerCase().includes(s) ||
        (b.salonId?.salonName || "").toLowerCase().includes(s)
      );
    }

    const total = matches.length;
    const paged = matches.slice(skip, skip + limitNum);

    const shaped = paged.map((b) => ({
      bookingId: b._id,
      customerName: b.customerId?.name || "Not available",
      customerEmail: b.customerId?.email || "Not available",
      salonName: b.salonId?.salonName || "Not available",
      serviceName: b.serviceId?.serviceName || "Not available",
      amount: b.serviceId?.price ?? 0,
      appointmentDate: b.slotId?.date || null,
      appointmentTime: b.slotId ? `${b.slotId.startTime} - ${b.slotId.endTime}` : null,
      completedAt: b.updatedAt,
      status: b.status,
    }));

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 0,
      transactions: shaped,
    });

  } catch (error) {
    console.error("Admin Transactions Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};