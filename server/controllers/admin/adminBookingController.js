const Booking = require("../../models/Booking");

// GET /api/admin/bookings
// ?search=&status=&salonId=&customerId=&date=&page=1&limit=20
exports.getBookings = async (req, res) => {
  try {
    const {
      search = "",
      status,
      salonId,
      customerId,
      date,
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (status) query.status = status;
    if (salonId) query.salonId = salonId;
    if (customerId) query.customerId = customerId;

    // Booking status here always reuses the existing pending/confirmed/
    // cancelled/completed values from models/Booking.js - no new statuses.
    let matches = await Booking.find(query)
      .populate("customerId", "name email phone")
      .populate("salonId", "salonName")
      .populate("serviceId", "serviceName price duration")
      .populate("slotId")
      .sort({ createdAt: -1 })
      .lean();

    if (date) {
      matches = matches.filter((b) => b.slotId?.date === date);
    }

    if (search) {
      const s = search.toLowerCase();
      matches = matches.filter((b) =>
        (b.customerId?.name || "").toLowerCase().includes(s) ||
        (b.salonId?.salonName || "").toLowerCase().includes(s) ||
        (b.serviceId?.serviceName || "").toLowerCase().includes(s)
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
      status: b.status,
      createdAt: b.createdAt,
      completedAt: b.status === "completed" ? b.updatedAt : null,
    }));

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 0,
      bookings: shaped,
    });

  } catch (error) {
    console.error("Admin Get Bookings Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/bookings/:id
exports.getBookingDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id)
      .populate("customerId", "name email phone")
      .populate("salonId", "salonName ownerName email phone address")
      .populate("serviceId", "serviceName price duration")
      .populate("slotId")
      .lean();

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.status(200).json({
      success: true,
      booking,
    });

  } catch (error) {
    console.error("Admin Get Booking Details Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
