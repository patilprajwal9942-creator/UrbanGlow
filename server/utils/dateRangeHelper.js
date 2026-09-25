// Shared date-range resolver used by both the salon-owner analytics routes
// (routes/analyticsRoutes.js) and the admin analytics/transactions routes
// (controllers/admin/adminAnalyticsController.js), so the two stay in sync
// instead of maintaining two copies of the same filter logic.

// Resolve a named filter (or a custom range) into a concrete { start, end }
// Date window. `end` is always exclusive.
function getDateRangeForFilter(filter, startDate, endDate) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

  switch (filter) {
    case "today":
      return { start: startOfToday, end: endOfToday };

    case "yesterday": {
      const start = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
      return { start, end: startOfToday };
    }

    case "last7days": {
      const start = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { start, end: endOfToday };
    }

    case "thisMonth": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { start, end };
    }

    case "lastMonth": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end };
    }

    case "custom": {
      if (!startDate || !endDate) {
        return { error: "startDate and endDate are required for the custom filter" };
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { error: "Invalid startDate or endDate" };
      }

      if (start > end) {
        return { error: "startDate must be before or equal to endDate" };
      }

      // Make endDate inclusive of the whole day it names
      const inclusiveEnd = new Date(end.getTime() + 24 * 60 * 60 * 1000);

      return { start, end: inclusiveEnd };
    }

    case "all":
    default:
      return null; // no date filter
  }
}

module.exports = { getDateRangeForFilter };