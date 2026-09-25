import { useEffect, useState } from "react";
import { adminAPI } from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";
import "../../styles/admin/AdminBookings.css";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
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

function AdminBookings() {
  // ---------- BOOKINGS TABLE ----------
  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [salonIdInput, setSalonIdInput] = useState("");
  const [salonId, setSalonId] = useState("");

  // ---------- DETAILS MODAL ----------
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  // ==========================================
  // FETCH BOOKINGS
  // ==========================================

  async function fetchBookings(targetPage, targetSearch, targetStatus, targetDate, targetSalonId) {
    try {
      setLoading(true);
      setError("");

      const params = {
        page: targetPage,
        limit: 20,
      };

      if (targetSearch) params.search = targetSearch;
      if (targetStatus) params.status = targetStatus;
      if (targetDate) params.date = targetDate;
      if (targetSalonId) params.salonId = targetSalonId;

      const response = await adminAPI.getBookings(params);

      setBookings(response.data?.bookings || []);
      setTotal(response.data?.total || 0);
      setTotalPages(response.data?.totalPages || 1);
      setPage(targetPage);

    } catch (error) {
      console.error("Admin Get Bookings Error:", error);

      setError(
        error.response?.data?.message ||
        "Failed to load bookings"
      );

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      fetchBookings(1, "", "", "", "");
    });
  }, []);

  // ==========================================
  // FILTER HANDLERS
  // ==========================================

  function handleSearchSubmit(e) {
    e.preventDefault();
    setSearch(searchInput);
    fetchBookings(1, searchInput, status, date, salonId);
  }

  function handleStatusChange(value) {
    setStatus(value);
    fetchBookings(1, search, value, date, salonId);
  }

  function handleDateChange(value) {
    setDate(value);
    fetchBookings(1, search, status, value, salonId);
  }

  function handleClearDate() {
    setDate("");
    fetchBookings(1, search, status, "", salonId);
  }

  function handleSalonIdSubmit(e) {
    e.preventDefault();
    setSalonId(salonIdInput);
    fetchBookings(1, search, status, date, salonIdInput);
  }

  function handleClearFilters() {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setDate("");
    setSalonIdInput("");
    setSalonId("");
    fetchBookings(1, "", "", "", "");
  }

  function goToPage(targetPage) {
    if (targetPage < 1 || targetPage > totalPages) return;
    fetchBookings(targetPage, search, status, date, salonId);
  }

  function handleRefresh() {
    fetchBookings(page, search, status, date, salonId);
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
  // PAGE-LEVEL SUMMARY (derived from the currently loaded page only -
  // the backend only returns "total" for the current filters, no
  // platform-wide status breakdown)
  // ==========================================

  const pagePending = bookings.filter((b) => b.status === "pending").length;
  const pageConfirmed = bookings.filter((b) => b.status === "confirmed").length;
  const pageCompleted = bookings.filter((b) => b.status === "completed").length;
  const pageCancelled = bookings.filter((b) => b.status === "cancelled").length;

  const filtersActive = Boolean(search || status || date || salonId);

  // ==========================================
  // UI
  // ==========================================

  return (
    <AdminLayout title="Admin Bookings">

      {/* HEADER */}
      <div className="admin-bookings-header">
        <div>
          {/* <h2 className="admin-bookings-heading">Booking Management</h2> */}
          <p className="admin-bookings-subtitle">
            Monitor and manage platform bookings
          </p>
        </div>

        <button className="admin-btn admin-btn-outline" onClick={handleRefresh}>
          Refresh
        </button>
      </div>

      {/* SUMMARY */}
      <div className="admin-bookings-summary">
        <div className="admin-stat-grid">
          <div className="admin-stat-card">
            <span className="admin-stat-label">Total Bookings (Matching Current Filters)</span>
            <span className="admin-stat-value">{total}</span>
          </div>
          <div className="admin-stat-card warning">
            <span className="admin-stat-label">On This Page: Pending</span>
            <span className="admin-stat-value">{pagePending}</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-label">On This Page: Confirmed</span>
            <span className="admin-stat-value">{pageConfirmed}</span>
          </div>
          <div className="admin-stat-card positive">
            <span className="admin-stat-label">On This Page: Completed</span>
            <span className="admin-stat-value">{pageCompleted}</span>
          </div>
          <div className="admin-stat-card danger">
            <span className="admin-stat-label">On This Page: Cancelled</span>
            <span className="admin-stat-value">{pageCancelled}</span>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="admin-bookings-toolbar">
        <form className="admin-filter-bar" onSubmit={handleSearchSubmit}>
          <input
            className="admin-search-input"
            type="text"
            placeholder="Search customer, salon or service"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="admin-btn admin-btn-primary">
            Search
          </button>

          <select
            className="admin-select"
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <input
            className="admin-search-input"
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
          />

          {date && (
            <button
              type="button"
              className="admin-btn admin-btn-outline"
              onClick={handleClearDate}
            >
              Clear Date
            </button>
          )}
        </form>

        <form className="admin-filter-bar" onSubmit={handleSalonIdSubmit}>
          <label className="admin-bookings-salon-id-label">
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

      {/* BOOKINGS TABLE */}
      {loading ? (
        <div className="admin-loading-state">
          <h2>Loading bookings...</h2>
        </div>
      ) : error ? (
        <div className="admin-error-state">
          <h2>Failed to load bookings</h2>
          <p>{error}</p>
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => fetchBookings(page, search, status, date, salonId)}
          >
            Try Again
          </button>
        </div>
      ) : bookings.length === 0 ? (
        <div className="admin-empty-state">
          <h2>No bookings found.</h2>
          <p>{filtersActive ? "No bookings found matching your filters." : "There are no bookings to show."}</p>
        </div>
      ) : (
        <>
          <p className="admin-page-info">Total Bookings: {total}</p>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Salon</th>
                  <th>Service</th>
                  <th>Amount</th>
                  <th>Appointment</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.bookingId}>
                    <td>
                      <div className="admin-bookings-customer">
                        <span>{b.customerName}</span>
                        <span className="admin-bookings-email">
                          {b.customerEmail || "Not available"}
                        </span>
                      </div>
                    </td>
                    <td>{b.salonName}</td>
                    <td>{b.serviceName}</td>
                    <td>{formatCurrency(b.amount)}</td>
                    <td>
                      <div className="admin-bookings-appointment">
                        <span>{b.appointmentDate ? formatDate(b.appointmentDate) : "Not available"}</span>
                        <span>{b.appointmentTime || "Not available"}</span>
                      </div>
                    </td>
                    <td><span className={`admin-badge ${b.status}`}>{b.status}</span></td>
                    <td>{formatDate(b.createdAt)}</td>
                    <td>
                      <button
                        className="admin-btn admin-btn-outline"
                        onClick={() => openDetailsModal(b.bookingId)}
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
          <div className="admin-modal admin-bookings-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-section-title">Booking Details</h2>

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
                <div className="admin-bookings-detail-section">
                  <h3 className="admin-bookings-detail-title">Booking Information</h3>
                  <div className="admin-bookings-detail-grid">
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
                <div className="admin-bookings-detail-section">
                  <h3 className="admin-bookings-detail-title">Customer Information</h3>
                  <div className="admin-bookings-detail-grid">
                    <p><strong>Name:</strong> {bookingDetails?.customerId?.name || "Not available"}</p>
                    <p><strong>Email:</strong> {bookingDetails?.customerId?.email || "Not available"}</p>
                    <p><strong>Phone:</strong> {bookingDetails?.customerId?.phone || "Not available"}</p>
                  </div>
                </div>

                {/* SALON INFORMATION */}
                <div className="admin-bookings-detail-section">
                  <h3 className="admin-bookings-detail-title">Salon Information</h3>
                  <div className="admin-bookings-detail-grid">
                    <p><strong>Salon Name:</strong> {bookingDetails?.salonId?.salonName || "Not available"}</p>
                    <p><strong>Owner Name:</strong> {bookingDetails?.salonId?.ownerName || "Not available"}</p>
                    <p><strong>Email:</strong> {bookingDetails?.salonId?.email || "Not available"}</p>
                    <p><strong>Phone:</strong> {bookingDetails?.salonId?.phone || "Not available"}</p>
                    <p><strong>Address:</strong> {bookingDetails?.salonId?.address || "Not available"}</p>
                  </div>
                </div>

                {/* SERVICE INFORMATION */}
                <div className="admin-bookings-detail-section">
                  <h3 className="admin-bookings-detail-title">Service Information</h3>
                  <div className="admin-bookings-detail-grid">
                    <p><strong>Service Name:</strong> {bookingDetails?.serviceId?.serviceName || "Not available"}</p>
                    <p><strong>Price:</strong> {formatCurrency(bookingDetails?.serviceId?.price)}</p>
                    <p><strong>Duration:</strong> {bookingDetails?.serviceId?.duration ? `${bookingDetails.serviceId.duration} min` : "Not available"}</p>
                  </div>
                </div>

                {/* APPOINTMENT INFORMATION */}
                <div className="admin-bookings-detail-section">
                  <h3 className="admin-bookings-detail-title">Appointment Information</h3>
                  <div className="admin-bookings-detail-grid">
                    <p><strong>Date:</strong> {bookingDetails?.slotId?.date || "Not available"}</p>
                    <p><strong>Start Time:</strong> {bookingDetails?.slotId?.startTime || "Not available"}</p>
                    <p><strong>End Time:</strong> {bookingDetails?.slotId?.endTime || "Not available"}</p>
                  </div>
                </div>
              </>
            ) : null}

            <div className="admin-bookings-modal-actions">
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

export default AdminBookings;