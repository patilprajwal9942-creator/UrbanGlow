import { useEffect, useState } from "react";
import { adminAPI } from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";
import "../../styles/admin/AdminTransactions.css";

const FILTER_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7days", label: "Last 7 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "all", label: "All Time" },
  { value: "custom", label: "Custom Range" },
];

function formatCurrency(amount) {
  const value = Number(amount) || 0;
  return `₹${value.toLocaleString("en-IN")}`;
}

function formatDate(dateString) {
  if (!dateString) return "Not available";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function AdminTransactions() {
  // ---------- TRANSACTIONS TABLE ----------
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customRangeError, setCustomRangeError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [salonIdInput, setSalonIdInput] = useState("");
  const [salonId, setSalonId] = useState("");

  // ---------- DETAILS MODAL (reuses the existing booking-details endpoint,
  // since transactions[].bookingId is the same Booking _id it accepts) ----------
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  // ==========================================
  // FETCH TRANSACTIONS
  // ==========================================

  async function fetchTransactions(targetPage, targetFilter, targetStartDate, targetEndDate, targetSearch, targetSalonId) {
    try {
      setLoading(true);
      setError("");

      const params = {
        page: targetPage,
        limit: 20,
        filter: targetFilter,
      };

      if (targetFilter === "custom") {
        params.startDate = targetStartDate;
        params.endDate = targetEndDate;
      }

      if (targetSearch) params.search = targetSearch;
      if (targetSalonId) params.salonId = targetSalonId;

      const response = await adminAPI.getTransactions(params);

      setTransactions(response.data?.transactions || []);
      setTotal(response.data?.total || 0);
      setTotalPages(response.data?.totalPages || 1);
      setPage(targetPage);

    } catch (error) {
      console.error("Admin Get Transactions Error:", error);

      setError(
        error.response?.data?.message ||
        "Failed to load transactions"
      );

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      fetchTransactions(1, "all", "", "", "", "");
    });
  }, []);

  // ==========================================
  // FILTER HANDLERS
  // ==========================================

  function handleFilterChange(value) {
    setFilter(value);
    setCustomRangeError("");

    // Named filters apply immediately; "custom" waits for Apply Filter
    // once both dates are chosen and validated.
    if (value !== "custom") {
      fetchTransactions(1, value, "", "", search, salonId);
    }
  }

  function handleApplyCustomRange() {
    if (!startDate || !endDate) {
      setCustomRangeError("Please select both a start and end date.");
      return;
    }

    if (startDate > endDate) {
      setCustomRangeError("End date cannot be before start date.");
      return;
    }

    setCustomRangeError("");
    fetchTransactions(1, "custom", startDate, endDate, search, salonId);
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setSearch(searchInput);
    fetchTransactions(1, filter, startDate, endDate, searchInput, salonId);
  }

  function handleSalonIdSubmit(e) {
    e.preventDefault();
    setSalonId(salonIdInput);
    fetchTransactions(1, filter, startDate, endDate, search, salonIdInput);
  }

  function handleClearFilters() {
    setFilter("all");
    setStartDate("");
    setEndDate("");
    setCustomRangeError("");
    setSearchInput("");
    setSearch("");
    setSalonIdInput("");
    setSalonId("");
    fetchTransactions(1, "all", "", "", "", "");
  }

  function goToPage(targetPage) {
    if (targetPage < 1 || targetPage > totalPages) return;
    fetchTransactions(targetPage, filter, startDate, endDate, search, salonId);
  }

  function handleRefresh() {
    fetchTransactions(page, filter, startDate, endDate, search, salonId);
  }

  // ==========================================
  // BOOKING DETAILS MODAL
  // ==========================================

  async function fetchBookingDetails(id) {
    try {
      setDetailsLoading(true);
      setDetailsError("");

      const response = await adminAPI.getBookingById(id);
      setBookingDetails(response.data?.booking || null);

    } catch (error) {
      console.error("Admin Booking Details Error:", error);

      setDetailsError(
        error.response?.data?.message ||
        "Failed to load booking details"
      );

    } finally {
      setDetailsLoading(false);
    }
  }

  function openDetailsModal(id) {
    setSelectedBookingId(id);
    setDetailsModalOpen(true);
    setBookingDetails(null);
    setDetailsError("");
    fetchBookingDetails(id);
  }

  function closeDetailsModal() {
    setDetailsModalOpen(false);
    setSelectedBookingId(null);
    setBookingDetails(null);
    setDetailsError("");
  }

  // ==========================================
  // PAGE-LEVEL SUMMARY (the backend only returns "total" for the current
  // filters - no platform-wide revenue total exists, so "Revenue On This
  // Page" is explicitly page-scoped, never labeled as a platform total)
  // ==========================================

  const pageRevenue = transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const filtersActive = Boolean(search || salonId || filter !== "all");

  // ==========================================
  // UI
  // ==========================================

  return (
    <AdminLayout title="Transactions">

      {/* HEADER */}
      <div className="admin-transactions-header">
        <div>
          {/* <h2 className="admin-transactions-heading">Transactions</h2> */}
          <p className="admin-transactions-subtitle">
            Monitor platform revenue and completed booking transactions
          </p>
        </div>

        <button className="admin-btn admin-btn-outline" onClick={handleRefresh}>
          Refresh
        </button>
      </div>

      {/* SUMMARY */}
      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <span className="admin-stat-label">Total Transactions (Matching Current Filters)</span>
          <span className="admin-stat-value">{total}</span>
        </div>
        <div className="admin-stat-card positive">
          <span className="admin-stat-label">Revenue On This Page</span>
          <span className="admin-stat-value">{formatCurrency(pageRevenue)}</span>
        </div>
      </div>

      {/* QUICK FILTERS */}
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
        <div className="admin-transactions-custom-range">
          <label className="admin-transactions-date-label">
            Start Date
            <input
              type="date"
              className="admin-search-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>

          <label className="admin-transactions-date-label">
            End Date
            <input
              type="date"
              className="admin-search-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>

          <button className="admin-btn admin-btn-primary" onClick={handleApplyCustomRange}>
            Apply Filter
          </button>

          {customRangeError && (
            <p className="admin-transactions-range-error">{customRangeError}</p>
          )}
        </div>
      )}

      {/* SEARCH + SALON FILTER */}
      <div className="admin-transactions-toolbar">
        <form className="admin-filter-bar" onSubmit={handleSearchSubmit}>
          <input
            className="admin-search-input"
            type="text"
            placeholder="Search customer or salon..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="admin-btn admin-btn-primary">
            Search
          </button>
        </form>

        <form className="admin-filter-bar" onSubmit={handleSalonIdSubmit}>
          <label className="admin-transactions-salon-id-label">
            Salon ID
            <input
              className="admin-search-input"
              type="text"
              placeholder="Enter salon ID"
              value={salonIdInput}
              onChange={(e) => setSalonIdInput(e.target.value)}
            />
          </label>

          <button type="submit" className="admin-btn admin-btn-primary">
            Apply
          </button>

          <button
            type="button"
            className="admin-btn admin-btn-outline"
            onClick={handleClearFilters}
          >
            Clear Filters
          </button>
        </form>
      </div>

      {/* TRANSACTIONS TABLE */}
      {loading ? (
        <div className="admin-loading-state">
          <h2>Loading transactions...</h2>
        </div>
      ) : error ? (
        <div className="admin-error-state">
          <h2>Failed to load transactions</h2>
          <p>{error}</p>
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => fetchTransactions(page, filter, startDate, endDate, search, salonId)}
          >
            Try Again
          </button>
        </div>
      ) : transactions.length === 0 ? (
        <div className="admin-empty-state">
          <h2>No transactions found.</h2>
          <p>{filtersActive ? "No transactions found matching your filters." : "There are no completed bookings yet."}</p>
        </div>
      ) : (
        <>
          <p className="admin-page-info">Total Transactions: {total}</p>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Salon</th>
                  <th>Service</th>
                  <th>Amount</th>
                  <th>Appointment</th>
                  <th>Completed Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.bookingId}>
                    <td className="admin-transactions-booking-id" title={t.bookingId}>
                      {t.bookingId ? `${t.bookingId.slice(-8)}` : "Not available"}
                    </td>
                    <td>
                      <div className="admin-transactions-customer">
                        <span>{t.customerName}</span>
                        <span className="admin-transactions-email">
                          {t.customerEmail || "Not available"}
                        </span>
                      </div>
                    </td>
                    <td>{t.salonName}</td>
                    <td>{t.serviceName}</td>
                    <td>{formatCurrency(t.amount)}</td>
                    <td>
                      <div className="admin-transactions-appointment">
                        <span>{t.appointmentDate ? formatDate(t.appointmentDate) : "Not available"}</span>
                        <span>{t.appointmentTime || "Not available"}</span>
                      </div>
                    </td>
                    <td>{t.completedAt ? formatDate(t.completedAt) : "Not available"}</td>
                    <td><span className={`admin-badge ${t.status}`}>{t.status}</span></td>
                    <td>
                      <button
                        className="admin-btn admin-btn-outline"
                        onClick={() => openDetailsModal(t.bookingId)}
                      >
                        View Details
                      </button>
                    </td>
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

      {/* BOOKING DETAILS MODAL */}
      {detailsModalOpen && (
        <div className="admin-modal-backdrop" onClick={closeDetailsModal}>
          <div className="admin-modal admin-transactions-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-section-title">Transaction Details</h2>

            {detailsLoading ? (
              <div className="admin-loading-state">
                <h2>Loading booking details...</h2>
              </div>
            ) : detailsError ? (
              <div className="admin-error-state">
                <h2>Failed to load booking details</h2>
                <p>{detailsError}</p>
                <button
                  className="admin-btn admin-btn-primary"
                  onClick={() => fetchBookingDetails(selectedBookingId)}
                >
                  Try Again
                </button>
              </div>
            ) : bookingDetails ? (
              <>
                {/* BOOKING INFORMATION */}
                <div className="admin-transactions-detail-section">
                  <h3 className="admin-transactions-detail-title">Booking Information</h3>
                  <div className="admin-transactions-detail-grid">
                    <p><strong>Booking ID:</strong> {bookingDetails._id}</p>
                    <p>
                      <strong>Status:</strong>{" "}
                      <span className={`admin-badge ${bookingDetails.status}`}>{bookingDetails.status}</span>
                    </p>
                    <p><strong>Created Date:</strong> {formatDate(bookingDetails.createdAt)}</p>
                    {bookingDetails.status === "completed" && (
                      <p><strong>Completed Date:</strong> {formatDate(bookingDetails.updatedAt)}</p>
                    )}
                  </div>
                </div>

                {/* CUSTOMER INFORMATION */}
                <div className="admin-transactions-detail-section">
                  <h3 className="admin-transactions-detail-title">Customer Information</h3>
                  <div className="admin-transactions-detail-grid">
                    <p><strong>Name:</strong> {bookingDetails?.customerId?.name || "Not available"}</p>
                    <p><strong>Email:</strong> {bookingDetails?.customerId?.email || "Not available"}</p>
                    <p><strong>Phone:</strong> {bookingDetails?.customerId?.phone || "Not available"}</p>
                  </div>
                </div>

                {/* SALON INFORMATION */}
                <div className="admin-transactions-detail-section">
                  <h3 className="admin-transactions-detail-title">Salon Information</h3>
                  <div className="admin-transactions-detail-grid">
                    <p><strong>Salon Name:</strong> {bookingDetails?.salonId?.salonName || "Not available"}</p>
                    <p><strong>Owner Name:</strong> {bookingDetails?.salonId?.ownerName || "Not available"}</p>
                    <p><strong>Email:</strong> {bookingDetails?.salonId?.email || "Not available"}</p>
                    <p><strong>Phone:</strong> {bookingDetails?.salonId?.phone || "Not available"}</p>
                    <p><strong>Address:</strong> {bookingDetails?.salonId?.address || "Not available"}</p>
                  </div>
                </div>

                {/* SERVICE INFORMATION */}
                <div className="admin-transactions-detail-section">
                  <h3 className="admin-transactions-detail-title">Service Information</h3>
                  <div className="admin-transactions-detail-grid">
                    <p><strong>Service Name:</strong> {bookingDetails?.serviceId?.serviceName || "Not available"}</p>
                    <p><strong>Price:</strong> {formatCurrency(bookingDetails?.serviceId?.price)}</p>
                    <p><strong>Duration:</strong> {bookingDetails?.serviceId?.duration ? `${bookingDetails.serviceId.duration} min` : "Not available"}</p>
                  </div>
                </div>

                {/* APPOINTMENT INFORMATION */}
                <div className="admin-transactions-detail-section">
                  <h3 className="admin-transactions-detail-title">Appointment Information</h3>
                  <div className="admin-transactions-detail-grid">
                    <p><strong>Date:</strong> {bookingDetails?.slotId?.date || "Not available"}</p>
                    <p><strong>Start Time:</strong> {bookingDetails?.slotId?.startTime || "Not available"}</p>
                    <p><strong>End Time:</strong> {bookingDetails?.slotId?.endTime || "Not available"}</p>
                  </div>
                </div>
              </>
            ) : null}

            <div className="admin-transactions-modal-actions">
              <button className="admin-btn admin-btn-outline" onClick={closeDetailsModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}

export default AdminTransactions;