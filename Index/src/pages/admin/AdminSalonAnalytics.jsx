import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminAPI } from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";
import "../../styles/admin/AdminAnalytics.css";

const FILTER_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7days", label: "Last 7 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "all", label: "All Time" },
  { value: "custom", label: "Custom Range" },
];

const FILTER_LABELS = FILTER_OPTIONS.reduce((acc, f) => {
  acc[f.value] = f.label;
  return acc;
}, {});

// Sort fields as actually supported by the backend controller
// (server/controllers/admin/adminAnalyticsController.js: getSalonPerformance)
const SORT_OPTIONS = [
  { value: "totalRevenue", label: "Total Revenue" },
  { value: "monthlyRevenue", label: "Monthly Revenue" },
  { value: "todayRevenue", label: "Today's Revenue" },
  { value: "totalBookings", label: "Total Bookings" },
  { value: "completedBookings", label: "Completed Bookings" },
  { value: "cancelledBookings", label: "Cancelled Bookings" },
  { value: "salonName", label: "Salon Name" },
];

function formatCurrency(amount) {
  const value = Number(amount) || 0;
  return `₹${value.toLocaleString("en-IN")}`;
}

function formatFilterLabel(filter) {
  return FILTER_LABELS[filter] || filter;
}

function AdminSalonAnalytics() {
  const navigate = useNavigate();

  // ---------- ANALYTICS (Sections 1-5) ----------
  const [filter, setFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");

  // ---------- SALON PERFORMANCE TABLE (Sections 6-10) ----------
  const [salons, setSalons] = useState([]);
  const [totalSalons, setTotalSalons] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("totalRevenue");
  const [sortOrder, setSortOrder] = useState("desc");
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState("");

  // ==========================================
  // FETCH ANALYTICS
  // ==========================================

  async function fetchAnalytics(targetFilter, targetStart, targetEnd) {
    try {
      setAnalyticsLoading(true);
      setAnalyticsError("");

      const params = { filter: targetFilter };

      if (targetFilter === "custom") {
        params.startDate = targetStart;
        params.endDate = targetEnd;
      }

      const response = await adminAPI.getAnalytics(params);
      setAnalytics(response.data);

    } catch (error) {
      console.error("Admin Analytics Error:", error);

      setAnalyticsError(
        error.response?.data?.message ||
        "Failed to load analytics"
      );

    } finally {
      setAnalyticsLoading(false);
    }
  }

  // ==========================================
  // FETCH SALON PERFORMANCE
  // ==========================================

  async function fetchSalonPerformance(targetPage, targetSearch, targetStatus, targetSortBy, targetSortOrder) {
    try {
      setTableLoading(true);
      setTableError("");

      const params = {
        page: targetPage,
        limit: 10,
        sortBy: targetSortBy,
        sortOrder: targetSortOrder,
      };

      if (targetSearch) {
        params.search = targetSearch;
      }

      if (targetStatus) {
        params.status = targetStatus;
      }

      const response = await adminAPI.getSalonAnalytics(params);

      setSalons(response.data?.salons || []);
      setTotalPages(response.data?.totalPages || 1);
      setTotalSalons(response.data?.total || 0);
      setPage(targetPage);

    } catch (error) {
      console.error("Admin Salon Performance Error:", error);

      setTableError(
        error.response?.data?.message ||
        "Failed to load salon performance"
      );

    } finally {
      setTableLoading(false);
    }
  }

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    queueMicrotask(() => {
      fetchAnalytics("all", "", "");
      fetchSalonPerformance(1, "", "", "totalRevenue", "desc");
    });
  }, []);

  // ==========================================
  // FILTER HANDLERS
  // ==========================================

  function handleFilterChange(value) {
    setFilter(value);

    // Named filters apply immediately; "custom" waits for the
    // Apply Filter button once both dates are chosen.
    if (value !== "custom") {
      fetchAnalytics(value, "", "");
    }
  }

  function handleApplyCustomFilter() {
    if (!startDate || !endDate) {
      return;
    }
    fetchAnalytics("custom", startDate, endDate);
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setAppliedSearch(searchInput);
    fetchSalonPerformance(1, searchInput, statusFilter, sortBy, sortOrder);
  }

  function handleStatusChange(value) {
    setStatusFilter(value);
    fetchSalonPerformance(1, appliedSearch, value, sortBy, sortOrder);
  }

  function handleSortByChange(value) {
    setSortBy(value);
    fetchSalonPerformance(1, appliedSearch, statusFilter, value, sortOrder);
  }

  function handleSortOrderChange(value) {
    setSortOrder(value);
    fetchSalonPerformance(1, appliedSearch, statusFilter, sortBy, value);
  }

  function goToPage(newPage) {
    if (newPage < 1 || newPage > totalPages) return;
    fetchSalonPerformance(newPage, appliedSearch, statusFilter, sortBy, sortOrder);
  }

  function handleRefresh() {
    fetchAnalytics(filter, startDate, endDate);
    fetchSalonPerformance(page, appliedSearch, statusFilter, sortBy, sortOrder);
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <AdminLayout title="Platform Analytics">

      {/* HEADER */}
      <div className="admin-analytics-header">
        <div>
          {/* <h2 className="admin-analytics-heading">Platform Analytics</h2> */}
          <p className="admin-analytics-subtitle">
            Monitor platform revenue, bookings and salon performance.
          </p>
        </div>

        <button className="admin-btn admin-btn-outline" onClick={handleRefresh}>
          Refresh
        </button>
      </div>

      {/* DATE FILTER */}
      <div className="admin-filter-bar">
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f.value}
            className={`admin-filter-btn ${filter === f.value ? "active" : ""}`}
            onClick={() => handleFilterChange(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filter === "custom" && (
        <div className="admin-analytics-custom-range">
          <label className="admin-analytics-date-label">
            Start Date
            <input
              type="date"
              className="admin-search-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>

          <label className="admin-analytics-date-label">
            End Date
            <input
              type="date"
              className="admin-search-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>

          <button
            className="admin-btn admin-btn-primary"
            onClick={handleApplyCustomFilter}
            disabled={!startDate || !endDate}
          >
            Apply Filter
          </button>
        </div>
      )}

      {/* ANALYTICS SECTIONS */}
      {analyticsLoading ? (
        <div className="admin-loading-state">
          <h2>Loading analytics...</h2>
        </div>
      ) : analyticsError ? (
        <div className="admin-error-state">
          <h2>Failed to load analytics</h2>
          <p>{analyticsError}</p>
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => fetchAnalytics(filter, startDate, endDate)}
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* REVENUE OVERVIEW */}
          <h3 className="admin-analytics-group-title">Revenue Overview</h3>
          <div className="admin-stat-grid">
            <div className="admin-stat-card positive">
              <span className="admin-stat-label">Today's Revenue</span>
              <span className="admin-stat-value">{formatCurrency(analytics.todaysRevenue)}</span>
            </div>
            <div className="admin-stat-card positive">
              <span className="admin-stat-label">Weekly Revenue</span>
              <span className="admin-stat-value">{formatCurrency(analytics.weeklyRevenue)}</span>
            </div>
            <div className="admin-stat-card positive">
              <span className="admin-stat-label">Monthly Revenue</span>
              <span className="admin-stat-value">{formatCurrency(analytics.monthlyRevenue)}</span>
            </div>
            <div className="admin-stat-card positive">
              <span className="admin-stat-label">Last Month Revenue</span>
              <span className="admin-stat-value">{formatCurrency(analytics.lastMonthRevenue)}</span>
            </div>
            <div className="admin-stat-card positive">
              <span className="admin-stat-label">Total Platform Revenue</span>
              <span className="admin-stat-value">{formatCurrency(analytics.totalPlatformRevenue)}</span>
            </div>
          </div>

          {/* REVENUE GROWTH */}
          <div className="admin-analytics-growth-card">
            <span className="admin-stat-label">Revenue Growth (vs last month)</span>
            {analytics.revenueGrowthPercent === null ? (
              <span className="admin-analytics-growth-value neutral">N/A</span>
            ) : (
              <span
                className={`admin-analytics-growth-value ${
                  analytics.revenueGrowthPercent > 0
                    ? "positive"
                    : analytics.revenueGrowthPercent < 0
                    ? "negative"
                    : "neutral"
                }`}
              >
                {analytics.revenueGrowthPercent > 0 ? "+" : ""}
                {analytics.revenueGrowthPercent}%
              </span>
            )}
          </div>

          {/* BOOKING OVERVIEW */}
          <h3 className="admin-analytics-group-title">Booking Overview</h3>
          <div className="admin-stat-grid">
            <div className="admin-stat-card">
              <span className="admin-stat-label">Total Bookings</span>
              <span className="admin-stat-value">{analytics.totalBookings}</span>
            </div>
            <div className="admin-stat-card positive">
              <span className="admin-stat-label">Completed Bookings</span>
              <span className="admin-stat-value">{analytics.totalCompletedBookings}</span>
            </div>
            <div className="admin-stat-card danger">
              <span className="admin-stat-label">Cancelled Bookings</span>
              <span className="admin-stat-value">{analytics.totalCancelledBookings}</span>
            </div>
          </div>

          {/* SELECTED RANGE SUMMARY */}
          <section className="admin-section">
            <h2 className="admin-section-title">
              Selected Period: {formatFilterLabel(analytics.selectedRange.filter)}
            </h2>

            <div className="admin-stat-grid">
              <div className="admin-stat-card positive">
                <span className="admin-stat-label">Revenue</span>
                <span className="admin-stat-value">{formatCurrency(analytics.selectedRange.revenue)}</span>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-label">Completed Bookings</span>
                <span className="admin-stat-value">{analytics.selectedRange.completedBookings}</span>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-label">Cancelled Bookings</span>
                <span className="admin-stat-value">{analytics.selectedRange.cancelledBookings}</span>
              </div>
            </div>
          </section>
        </>
      )}

      {/* SALON PERFORMANCE */}
      <section className="admin-section">
        <div className="admin-section-header-row">
          <h2 className="admin-section-title">Salon Performance</h2>
        </div>

        <form className="admin-filter-bar" onSubmit={handleSearchSubmit}>
          <input
            className="admin-search-input"
            type="text"
            placeholder="Search salon name or owner..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />

          <button type="submit" className="admin-btn admin-btn-primary">
            Search
          </button>

          <select
            className="admin-select"
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
          </select>

          <select
            className="admin-select"
            value={sortBy}
            onChange={(e) => handleSortByChange(e.target.value)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Sort: {opt.label}
              </option>
            ))}
          </select>

          <select
            className="admin-select"
            value={sortOrder}
            onChange={(e) => handleSortOrderChange(e.target.value)}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </form>

        {tableLoading ? (
          <div className="admin-loading-state">
            <h2>Loading salon performance...</h2>
          </div>
        ) : tableError ? (
          <div className="admin-error-state">
            <h2>Failed to load salon performance</h2>
            <p>{tableError}</p>
            <button
              className="admin-btn admin-btn-primary"
              onClick={() => fetchSalonPerformance(page, appliedSearch, statusFilter, sortBy, sortOrder)}
            >
              Try Again
            </button>
          </div>
        ) : salons.length === 0 ? (
          <div className="admin-empty-state">
            <h2>No salon performance data found.</h2>
            <p>Try a different search or filter.</p>
          </div>
        ) : (
          <>
            <p className="admin-page-info">Total Salons: {totalSalons}</p>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Salon Name</th>
                    <th>Owner</th>
                    <th>Status</th>
                    <th>Total Bookings</th>
                    <th>Completed</th>
                    <th>Cancelled</th>
                    <th>Customers</th>
                    <th>Today's Revenue</th>
                    <th>Monthly Revenue</th>
                    <th>Total Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {salons.map((s) => (
                    <tr
                      key={s._id}
                      onClick={() => navigate(`/admin/salons/${s._id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>{s.salonName}</td>
                      <td>{s.ownerName}</td>
                      <td><span className={`admin-badge ${s.status}`}>{s.status}</span></td>
                      <td>{s.totalBookings}</td>
                      <td>{s.completedBookings}</td>
                      <td>{s.cancelledBookings}</td>
                      <td>{s.uniqueCustomers}</td>
                      <td>{formatCurrency(s.todayRevenue)}</td>
                      <td>{formatCurrency(s.monthlyRevenue)}</td>
                      <td>{formatCurrency(s.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-pagination-bar">
              <button
                className="admin-btn admin-btn-outline"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
              >
                Previous
              </button>
              <span className="admin-page-info">Page {page} of {totalPages}</span>
              <button
                className="admin-btn admin-btn-outline"
                disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </section>

    </AdminLayout>
  );
}

export default AdminSalonAnalytics;