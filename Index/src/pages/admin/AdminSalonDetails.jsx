import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminAPI } from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";
import "../../styles/admin/AdminSalonDetails.css";

const STATUS_ACTION_LABELS = {
  active: "activated",
  inactive: "marked inactive",
  blocked: "blocked",
};

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
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

function formatTime(timeStr) {
  if (!timeStr) return "";
  const [hourStr, minuteStr] = timeStr.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr || "00";
  if (isNaN(hour)) return timeStr;
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${period}`;
}

function SalonAvatarLarge({ salon }) {
  const [imgError, setImgError] = useState(false);
  const initial = salon?.salonName?.charAt(0)?.toUpperCase() || "?";

  if (!salon?.image || imgError) {
    return <div className="admin-salon-details-avatar-fallback">{initial}</div>;
  }

  return (
    <img
      src={salon.image}
      alt={salon.salonName}
      className="admin-salon-details-avatar-img"
      onError={() => setImgError(true)}
    />
  );
}

function AdminSalonDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ==========================================
  // FETCH SALON DETAILS
  // ==========================================

  async function fetchDetails() {
    try {
      setLoading(true);
      setError("");

      const response = await adminAPI.getSalonById(id);
      setData(response.data);

    } catch (error) {
      console.error("Admin Salon Details Error:", error);

      setError(
        error.response?.data?.message ||
        "Failed to load salon details."
      );

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      fetchDetails();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ==========================================
  // STATUS CHANGE MODAL
  // ==========================================

  function openStatusModal(status) {
    setNewStatus(status);
    setActionError("");
    setStatusModalOpen(true);
  }

  function closeStatusModal() {
    if (actionLoading) return;
    setStatusModalOpen(false);
    setNewStatus("");
    setActionError("");
  }

  async function confirmStatusChange() {
    try {
      setActionLoading(true);
      setActionError("");

      const response = await adminAPI.updateSalonStatus(id, newStatus);
      const updatedStatus = response.data?.salon?.status || newStatus;

      setData((prev) => ({
        ...prev,
        salon: { ...prev.salon, status: updatedStatus },
      }));

      setSuccessMessage(`Salon ${STATUS_ACTION_LABELS[updatedStatus] || "updated"} successfully.`);
      setStatusModalOpen(false);
      setNewStatus("");

    } catch (error) {
      console.error("Update Salon Status Error:", error);

      setActionError(
        error.response?.data?.message ||
        "Failed to update salon status"
      );

    } finally {
      setActionLoading(false);
    }
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <AdminLayout title="Salon Details">
        <div className="admin-loading-state">
          <h2>Loading salon details...</h2>
        </div>
      </AdminLayout>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <AdminLayout title="Salon Details">
        <div className="admin-error-state">
          <h2>Failed to load salon details.</h2>
          <p>{error}</p>
          <div className="admin-salon-details-error-actions">
            <button className="admin-btn admin-btn-outline" onClick={() => navigate("/admin/salons")}>
              Back to Salons
            </button>
            <button className="admin-btn admin-btn-primary" onClick={fetchDetails}>
              Try Again
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const { salon, stats, services, recentBookings } = data;
  const safeServices = services || [];
  const safeRecentBookings = recentBookings || [];

  return (
    <AdminLayout title="Salon Details">

      <button className="admin-btn admin-btn-outline" onClick={() => navigate("/admin/salons")}>
        ← Back to Salons
      </button>

      {successMessage && (
        <div className="admin-salon-details-success-banner">
          <span>{successMessage}</span>
          <button
            className="admin-salon-details-banner-close"
            onClick={() => setSuccessMessage("")}
            aria-label="Dismiss"
            type="button"
          >
            &times;
          </button>
        </div>
      )}

      {/* SALON HEADER */}
      <section className="admin-section admin-salon-details-header-section">
        <div className="admin-salon-details-profile">
          <SalonAvatarLarge salon={salon} />

          <div className="admin-salon-details-profile-info">
            <h2 className="admin-salon-details-name">{salon.salonName}</h2>
            <p className="admin-salon-details-owner">Owner: {salon.ownerName}</p>
            <div className="admin-salon-details-badge-row">
              <span className={`admin-badge ${salon.status}`}>{salon.status}</span>
              <span className="admin-salon-details-created">
                Created {formatDate(salon.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="admin-salons-actions">
          {salon.status !== "active" && (
            <button className="admin-btn admin-btn-success" onClick={() => openStatusModal("active")}>
              Activate
            </button>
          )}
          {salon.status !== "inactive" && (
            <button className="admin-btn admin-btn-outline" onClick={() => openStatusModal("inactive")}>
              Deactivate
            </button>
          )}
          {salon.status !== "blocked" && (
            <button className="admin-btn admin-btn-danger" onClick={() => openStatusModal("blocked")}>
              Block
            </button>
          )}
        </div>
      </section>

      {/* CONTACT INFORMATION */}
      <section className="admin-section">
        <h2 className="admin-section-title">Contact Information</h2>

        <div className="admin-salon-details-contact-grid">
          <p><strong>Owner Name:</strong> {salon.ownerName}</p>
          <p><strong>Email:</strong> {salon.email}</p>
          <p><strong>Phone:</strong> {salon.phone}</p>
          <p><strong>Address:</strong> {salon.address}</p>
        </div>
      </section>

      {/* BOOKING STATISTICS */}
      <section className="admin-section">
        <h2 className="admin-section-title">Booking Statistics</h2>

        <div className="admin-stat-grid">
          <div className="admin-stat-card">
            <span className="admin-stat-label">Total Bookings</span>
            <span className="admin-stat-value">{stats.totalBookings}</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-label">Pending</span>
            <span className="admin-stat-value">{stats.pendingBookings}</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-label">Confirmed</span>
            <span className="admin-stat-value">{stats.confirmedBookings}</span>
          </div>
          <div className="admin-stat-card positive">
            <span className="admin-stat-label">Completed</span>
            <span className="admin-stat-value">{stats.completedBookings}</span>
          </div>
          <div className="admin-stat-card danger">
            <span className="admin-stat-label">Cancelled</span>
            <span className="admin-stat-value">{stats.cancelledBookings}</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-label">Total Customers</span>
            <span className="admin-stat-value">{stats.totalCustomers}</span>
          </div>
        </div>
      </section>

      {/* REVENUE OVERVIEW */}
      <section className="admin-section">
        <h2 className="admin-section-title">Revenue Overview</h2>

        <div className="admin-stat-grid">
          <div className="admin-stat-card positive">
            <span className="admin-stat-label">Today's Revenue</span>
            <span className="admin-stat-value">{formatCurrency(stats.todayRevenue)}</span>
          </div>
          <div className="admin-stat-card positive">
            <span className="admin-stat-label">Monthly Revenue</span>
            <span className="admin-stat-value">{formatCurrency(stats.monthlyRevenue)}</span>
          </div>
          <div className="admin-stat-card positive">
            <span className="admin-stat-label">Total Revenue</span>
            <span className="admin-stat-value">{formatCurrency(stats.totalRevenue)}</span>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="admin-section">
        <h2 className="admin-section-title">Services ({safeServices.length})</h2>

        {safeServices.length === 0 ? (
          <div className="admin-empty-state">
            <p>No services added yet.</p>
          </div>
        ) : (
          <div className="admin-salon-details-services-grid">
            {safeServices.map((svc) => (
              <div key={svc._id} className="admin-salon-details-service-card">
                <h3 className="admin-salon-details-service-name">{svc.serviceName}</h3>
                <p className="admin-salon-details-service-price">{formatCurrency(svc.price)}</p>
                <p className="admin-salon-details-service-duration">{svc.duration} min</p>
                <p className="admin-salon-details-service-description">
                  {svc.description || "No description available"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* WORKING HOURS */}
      <section className="admin-section">
        <h2 className="admin-section-title">Working Hours</h2>

        {!salon.workingHours ? (
          <div className="admin-empty-state">
            <p>Working hours not set.</p>
          </div>
        ) : (
          <div className="admin-salon-details-working-hours">
            {DAYS.map((day) => {
              const dayData = salon.workingHours[day.key];

              return (
                <div key={day.key} className="admin-salon-details-hours-row">
                  <span className="admin-salon-details-hours-day">{day.label}</span>
                  <span className="admin-salon-details-hours-value">
                    {!dayData || dayData.isClosed
                      ? "Closed"
                      : `${formatTime(dayData.open)} - ${formatTime(dayData.close)}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* RECENT BOOKINGS */}
      <section className="admin-section">
        <h2 className="admin-section-title">Recent Bookings</h2>

        {safeRecentBookings.length === 0 ? (
          <div className="admin-empty-state">
            <p>No recent bookings found.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Amount</th>
                  <th>Appointment Date</th>
                  <th>Status</th>
                  <th>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {safeRecentBookings.map((b) => (
                  <tr key={b.bookingId}>
                    <td>{b.customerName}</td>
                    <td>{b.serviceName}</td>
                    <td>{formatCurrency(b.amount)}</td>
                    <td>{b.appointmentDate || "Not available"}</td>
                    <td><span className={`admin-badge ${b.status}`}>{b.status}</span></td>
                    <td>{formatDate(b.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* STATUS CHANGE CONFIRMATION MODAL */}
      {statusModalOpen && (
        <div className="admin-modal-backdrop" onClick={closeStatusModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-section-title">Confirm Status Change</h2>

            <p className="admin-salon-details-modal-text">
              Are you sure you want to change the status of
              {" "}<strong>{salon.salonName}</strong>?
            </p>

            <div className="admin-salon-details-modal-status-row">
              <span>Current Status:</span>
              <span className={`admin-badge ${salon.status}`}>{salon.status}</span>
            </div>

            <div className="admin-salon-details-modal-status-row">
              <span>New Status:</span>
              <span className={`admin-badge ${newStatus}`}>{newStatus}</span>
            </div>

            {actionError && (
              <p className="admin-salon-details-modal-error">{actionError}</p>
            )}

            <div className="admin-salon-details-modal-actions">
              <button
                className="admin-btn admin-btn-outline"
                onClick={closeStatusModal}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="admin-btn admin-btn-primary"
                onClick={confirmStatusChange}
                disabled={actionLoading}
              >
                {actionLoading ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}

export default AdminSalonDetails;