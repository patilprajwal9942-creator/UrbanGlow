const SupportTicket = require("../models/SupportTicket");

// ==========================================
// CREATE TICKET
// ==========================================

const createTicket = async (req, res) => {
  try {
    const {
      bookingId,
      subject,
      category,
      description,
    } = req.body;

    if (
      !subject ||
      !category ||
      !description
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Subject, category and description are required",
      });
    }

    const ticket =
      await SupportTicket.create({
        userId: req.user.id,
        bookingId: bookingId || null,
        subject,
        category,
        description,
      });

    res.status(201).json({
      success: true,
      message: "Support ticket created successfully",
      ticket,
    });
  } catch (error) {
    console.error(
      "Create Ticket Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to create support ticket",
    });
  }
};

// ==========================================
// GET MY TICKETS
// ==========================================

const getMyTickets = async (req, res) => {
  try {
    const tickets =
      await SupportTicket.find({
        userId: req.user.id,
      })
        .populate("bookingId")
        .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      tickets,
    });
  } catch (error) {
    console.error(
      "Get My Tickets Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch tickets",
    });
  }
};

// ==========================================
// GET ALL TICKETS
// ==========================================

const getAllTickets = async (req, res) => {
  try {
    const tickets =
      await SupportTicket.find()
        .populate(
          "userId",
          "name email"
        )
        .populate("bookingId")
        .populate(
          "repliedBy",
          "name email"
        )
        .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      tickets,
    });
  } catch (error) {
    console.error(
      "Get All Tickets Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch tickets",
    });
  }
};

// ==========================================
// UPDATE STATUS
// ==========================================

const updateTicketStatus = async (
  req,
  res
) => {
  try {
    const { status } = req.body;

    if (
      ![
        "Open",
        "In Progress",
        "Resolved",
      ].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket status",
      });
    }

    const ticket =
      await SupportTicket.findByIdAndUpdate(
        req.params.id,
        { status },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Ticket status updated",
      ticket,
    });
  } catch (error) {
    console.error(
      "Update Ticket Status Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to update ticket status",
    });
  }
};

// ==========================================
// REPLY TO TICKET
// ==========================================

const replyToTicket = async (
  req,
  res
) => {
  try {
    const { reply } = req.body;

    if (!reply?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reply is required",
      });
    }

    const ticket =
      await SupportTicket.findByIdAndUpdate(
        req.params.id,
        {
          reply: reply.trim(),
          repliedBy: req.user.id,
          status: "In Progress",
        },
        {
          new: true,
        }
      );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Reply added successfully",
      ticket,
    });
  } catch (error) {
    console.error(
      "Reply Ticket Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to reply to ticket",
    });
  }
};

module.exports = {
  createTicket,
  getMyTickets,
  getAllTickets,
  updateTicketStatus,
  replyToTicket,
};