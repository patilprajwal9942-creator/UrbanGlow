const User = require("../../models/User");
const Booking = require("../../models/Booking");
const Salon = require("../../models/Salon");
const Service = require("../../models/Service");

// ==========================================
// GET ALL USERS
// GET /api/admin/users
// ==========================================
exports.getUsers = async (req, res) => {
  try {
    const {
      search = "",
      role,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    // Role filter
    if (role) {
      query.role = role;
    }

    // Search by name or email
    if (search) {
      query.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // Only allow supported sorting fields
    const sortableFields = ["createdAt", "name", "role"];

    const validSortBy = sortableFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const validSortOrder = sortOrder === "asc" ? 1 : -1;

    const currentPage = Number(page);
    const currentLimit = Number(limit);

    const total = await User.countDocuments(query);

    const users = await User.find(query)
      .select("name email phone role isActive isPhoneVerified createdAt")
      .sort({
        [validSortBy]: validSortOrder,
      })
      .skip((currentPage - 1) * currentLimit)
      .limit(currentLimit)
      .lean();

    const totalPages = Math.ceil(total / currentLimit);

    return res.status(200).json({
      success: true,
      total,
      page: currentPage,
      limit: currentLimit,
      totalPages,
      users,
    });
  } catch (error) {
    console.error("Get Users Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};


// ==========================================
// GET USER DETAILS
// GET /api/admin/users/:id
// ==========================================
exports.getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select("-password")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const response = {
      success: true,
      user,
    };


    // ==========================================
    // CUSTOMER BOOKING HISTORY
    // ==========================================
    if (user.role === "customer") {
      const bookings = await Booking.find({
        customerId: user._id,
      })
        .populate("salonId", "salonName")
        .populate("serviceId", "serviceName")
        .populate("slotId", "date")
        .sort({ createdAt: -1 })
        .lean();

      response.bookingHistory = bookings.map((booking) => ({
        bookingId: booking._id,

        salonName:
          booking.salonId?.salonName || "Not available",

        serviceName:
          booking.serviceId?.serviceName || "Not available",

        amount: booking.amount || 0,

        appointmentDate:
          booking.slotId?.date || null,

        status: booking.status,

        createdAt: booking.createdAt,
      }));
    }


    // ==========================================
    // SALON OWNER INFORMATION
    // ==========================================
    if (user.role === "salon") {
      const salons = await Salon.find({
        ownerId: user._id,
      })
        .select("salonName status createdAt")
        .sort({ createdAt: -1 })
        .lean();

      response.salons = salons.map((salon) => ({
        salonId: salon._id,

        salonName: salon.salonName,

        status: salon.status,

        createdAt: salon.createdAt,
      }));
    }


    return res.status(200).json(response);

  } catch (error) {
    console.error("Get User Details Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user details",
    });
  }
};


// ==========================================
// UPDATE USER STATUS
// PATCH /api/admin/users/:id/status
// ==========================================
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const { isActive } = req.body;

    // Validate boolean
    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean value",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent blocking admin account
    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Cannot block an admin account",
      });
    }

    user.isActive = isActive;

    await user.save();

    return res.status(200).json({
      success: true,

      message: isActive
        ? "User account activated successfully"
        : "User account blocked successfully",

      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        isPhoneVerified: user.isPhoneVerified,
        createdAt: user.createdAt,
      },
    });

  } catch (error) {
    console.error("Update User Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user status",
    });
  }
};