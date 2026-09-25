import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminAPI } from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";
import "../../styles/admin/AdminDashboard.css";

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

function AdminDashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchDashboard() {
    try {
      setLoading(true);
      setError("");

      const response = await adminAPI.getDashboard();
      setData(response.data);
    } catch (error) {
      console.error("Admin Dashboard Fetch Error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      fetchDashboard();
    });
  }, []);

  /* ==========================================
     LOADING
  ========================================== */

  if (loading) {
    return (
      <AdminLayout title="Admin Dashboard">
        <div className="admin-loading-state">
          <h2>Loading dashboard...</h2>
        </div>
      </AdminLayout>
    );
  }

  /* ==========================================
     ERROR
  ========================================== */

  if (error) {
    return (
      <AdminLayout title="Admin Dashboard">
        <div className="admin-error-state">
          <h2>Failed to load dashboard</h2>

          <p>{error}</p>

          <button
            className="admin-btn admin-btn-primary"
            onClick={fetchDashboard}
          >
            Try Again
          </button>
        </div>
      </AdminLayout>
    );
  }

  const {
    users,
    salons,
    bookings,
    revenue,
    recentBookings,
    recentUsers,
    recentSalons,
    topPerformingSalons,
  } = data;

  return (
    <AdminLayout title="Admin Dashboard">

      {/* REFRESH BUTTON */}

      <div className="admin-dashboard-header">
        <button
          className="admin-btn admin-btn-outline"
          onClick={fetchDashboard}
        >
          Refresh
        </button>
      </div>

      {/* USERS */}

      <h3 className="admin-dashboard-group-title">
        Users
      </h3>

      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <span className="admin-stat-label">
            Total Users
          </span>

          <span className="admin-stat-value">
            {users.totalUsers}
          </span>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-label">
            Total Customers
          </span>

          <span className="admin-stat-value">
            {users.totalCustomers}
          </span>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-label">
            Total Salon Owners
          </span>

          <span className="admin-stat-value">
            {users.totalSalonOwners}
          </span>
        </div>
      </div>

      {/* SALONS */}

      <h3 className="admin-dashboard-group-title">
        Salons
      </h3>

      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <span className="admin-stat-label">
            Total Salons
          </span>

          <span className="admin-stat-value">
            {salons.totalSalons}
          </span>
        </div>

        <div className="admin-stat-card positive">
          <span className="admin-stat-label">
            Active Salons
          </span>

          <span className="admin-stat-value">
            {salons.activeSalons}
          </span>
        </div>

        <div className="admin-stat-card danger">
          <span className="admin-stat-label">
            Blocked Salons
          </span>

          <span className="admin-stat-value">
            {salons.blockedSalons}
          </span>
        </div>
      </div>

      {/* BOOKINGS */}

      <h3 className="admin-dashboard-group-title">
        Bookings
      </h3>

      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <span className="admin-stat-label">
            Total Bookings
          </span>

          <span className="admin-stat-value">
            {bookings.totalBookings}
          </span>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-label">
            Today's Bookings
          </span>

          <span className="admin-stat-value">
            {bookings.todaysBookings}
          </span>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-label">
            Upcoming Bookings
          </span>

          <span className="admin-stat-value">
            {bookings.upcomingBookings}
          </span>
        </div>
      </div>

      {/* REVENUE */}

      <h3 className="admin-dashboard-group-title">
        Revenue
      </h3>

      <div className="admin-stat-grid">
        <div className="admin-stat-card positive">
          <span className="admin-stat-label">
            Today's Revenue
          </span>

          <span className="admin-stat-value">
            {formatCurrency(revenue.todaysRevenue)}
          </span>
        </div>

        <div className="admin-stat-card positive">
          <span className="admin-stat-label">
            Monthly Revenue
          </span>

          <span className="admin-stat-value">
            {formatCurrency(revenue.monthlyRevenue)}
          </span>
        </div>

        <div className="admin-stat-card positive">
          <span className="admin-stat-label">
            Total Revenue
          </span>

          <span className="admin-stat-value">
            {formatCurrency(revenue.totalRevenue)}
          </span>
        </div>
      </div>

      {/* BOOKING STATUS SUMMARY */}

      <section className="admin-section">
        <h2 className="admin-section-title">
          Booking Status Summary
        </h2>

        <div className="admin-status-summary-grid">

          <div className="admin-status-summary-card pending">
            <span className="admin-status-summary-value">
              {bookings.pendingBookings}
            </span>

            <span className="admin-status-summary-label">
              Pending
            </span>
          </div>

          <div className="admin-status-summary-card confirmed">
            <span className="admin-status-summary-value">
              {bookings.confirmedBookings}
            </span>

            <span className="admin-status-summary-label">
              Confirmed
            </span>
          </div>

          <div className="admin-status-summary-card completed">
            <span className="admin-status-summary-value">
              {bookings.completedBookings}
            </span>

            <span className="admin-status-summary-label">
              Completed
            </span>
          </div>

          <div className="admin-status-summary-card cancelled">
            <span className="admin-status-summary-value">
              {bookings.cancelledBookings}
            </span>

            <span className="admin-status-summary-label">
              Cancelled
            </span>
          </div>

        </div>
      </section>

      {/* TOP PERFORMING SALONS */}

      <section className="admin-section">

        <div className="admin-section-header-row">

          <h2 className="admin-section-title">
            Top Performing Salons
          </h2>

          <button
            className="admin-btn admin-btn-outline"
            onClick={() => navigate("/admin/analytics")}
          >
            View Analytics
          </button>

        </div>

        {topPerformingSalons.length === 0 ? (
          <div className="admin-empty-state">
            <p>No completed bookings yet.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">

            <table className="admin-table">

              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Salon Name</th>
                  <th>Owner</th>
                  <th>Completed Bookings</th>
                  <th>Total Revenue</th>
                </tr>
              </thead>

              <tbody>
                {topPerformingSalons.map((s, index) => (
                  <tr key={s.salonId}>

                    <td>#{index + 1}</td>

                    <td>{s.salonName}</td>

                    <td>{s.ownerName}</td>

                    <td>{s.completedBookings}</td>

                    <td>
                      {formatCurrency(s.totalRevenue)}
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>

          </div>
        )}

      </section>

      {/* RECENT BOOKINGS */}

      <section className="admin-section">

        <div className="admin-section-header-row">

          <h2 className="admin-section-title">
            Recent Bookings
          </h2>

          <button
            className="admin-btn admin-btn-outline"
            onClick={() => navigate("/admin/bookings")}
          >
            View All Bookings
          </button>

        </div>

        {recentBookings.length === 0 ? (
          <div className="admin-empty-state">
            <p>No recent bookings found.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">

            <table className="admin-table">

              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Salon</th>
                  <th>Service</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created Date</th>
                </tr>
              </thead>

              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.bookingId}>

                    <td>{b.customerName}</td>

                    <td>{b.salonName}</td>

                    <td>{b.serviceName}</td>

                    <td>
                      {formatCurrency(b.amount)}
                    </td>

                    <td>
                      <span
                        className={`admin-badge ${b.status}`}
                      >
                        {b.status}
                      </span>
                    </td>

                    <td>
                      {formatDate(b.createdAt)}
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>

          </div>
        )}

      </section>

      {/* RECENT USERS + RECENT SALONS */}

      <div className="admin-dashboard-split">

        {/* RECENT USERS */}

        <section className="admin-section">

          <div className="admin-section-header-row">

            <h2 className="admin-section-title">
              Recent Users
            </h2>

            <button
              className="admin-btn admin-btn-outline"
              onClick={() => navigate("/admin/users")}
            >
              View All Users
            </button>

          </div>

          {recentUsers.length === 0 ? (
            <div className="admin-empty-state">
              <p>No recent users found.</p>
            </div>
          ) : (
            <div className="admin-table-wrapper">

              <table className="admin-table">

                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined Date</th>
                  </tr>
                </thead>

                <tbody>
                  {recentUsers.map((u) => (
                    <tr key={u.userId}>

                      <td>{u.name}</td>

                      <td>{u.email}</td>

                      <td>
                        <span
                          className={`admin-badge ${u.role}`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`admin-badge ${
                            u.isActive
                              ? "active"
                              : "blocked"
                          }`}
                        >
                          {u.isActive
                            ? "Active"
                            : "Blocked"}
                        </span>
                      </td>

                      <td>
                        {formatDate(u.createdAt)}
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>

            </div>
          )}

        </section>

        {/* RECENT SALONS */}

        <section className="admin-section">

          <div className="admin-section-header-row">

            <h2 className="admin-section-title">
              Recent Salons
            </h2>

            <button
              className="admin-btn admin-btn-outline"
              onClick={() => navigate("/admin/salons")}
            >
              Manage Salons
            </button>

          </div>

          {recentSalons.length === 0 ? (
            <div className="admin-empty-state">
              <p>No recent salons found.</p>
            </div>
          ) : (
            <div className="admin-table-wrapper">

              <table className="admin-table">

                <thead>
                  <tr>
                    <th>Salon Name</th>
                    <th>Owner</th>
                    <th>Status</th>
                    <th>Created Date</th>
                  </tr>
                </thead>

                <tbody>
                  {recentSalons.map((s) => (
                    <tr key={s.salonId}>

                      <td>{s.salonName}</td>

                      <td>{s.ownerName}</td>

                      <td>
                        <span
                          className={`admin-badge ${s.status}`}
                        >
                          {s.status}
                        </span>
                      </td>

                      <td>
                        {formatDate(s.createdAt)}
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>

            </div>
          )}

        </section>

      </div>

    </AdminLayout>
  );
}

export default AdminDashboard;