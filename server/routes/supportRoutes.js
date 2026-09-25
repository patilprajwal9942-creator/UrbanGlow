const express = require("express");

const router = express.Router();

const {
  createTicket,
  getMyTickets,
  getAllTickets,
  updateTicketStatus,
  replyToTicket,
} = require("../controllers/supportController");

const {
  protect,
} = require("../middleware/authMiddleware");

// Customer
router.post(
  "/",
  protect,
  createTicket
);

router.get(
  "/my-tickets",
  protect,
  getMyTickets
);

// Admin / Salon
router.get(
  "/",
  protect,
  getAllTickets
);

router.patch(
  "/:id/status",
  protect,
  updateTicketStatus
);

router.patch(
  "/:id/reply",
  protect,
  replyToTicket
);

module.exports = router;