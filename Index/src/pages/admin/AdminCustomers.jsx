import { useEffect, useState } from "react";
import { adminAPI } from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";
import "../../styles/admin/AdminCustomers.css";

// NOTE: this file is named AdminCustomers.jsx (existing scaffold filename,
// already wired into AppRoutes.jsx), but it implements full USER
// MANAGEMENT - customers, salon owners, and admins - not just customers.

// Sort options as actually supported by the backend controller
// (server/controllers/admin/adminUserController.js: getUsers ->
// sortableFields = ["createdAt", "name", "role"]). "role" is omitted as a
// sort axis since it's already directly filterable via the role dropdown.
const SORT_OPTIONS = [
  { value: "newest", label: "Newest", sortBy: "createdAt", sortOrder: "desc" },
  { value: "oldest", label: "Oldest", sortBy: "createdAt", sortOrder: "asc" },
  { value: "nameAsc", label: "Name A-Z", sortBy: "name", sortOrder: "asc" },
  { value: "nameDesc", label: "Name Z-A", sortBy: "name", sortOrder: "desc" },
];

const ROLE_OPTIONS = [
  { value: "", label: "All Users" },
  { value: "customer", label: "Customer" },
  { value: "salon", label: "Salon Owner" },
  { value: "admin", label: "Admin" },
];

const ROLE_LABELS = {
  customer: "Customer",
  salon: "Salon Owner",
  admin: "Admin",
};

function getRoleLabel(role) {
  return ROLE_LABELS[role] || role;
}

function formatDate(dateString) {
  if (!dateString) return "Not available";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function UserAvatar({ name }) {
  const initial = name?.charAt(0)?.toUpperCase() || "?";
  return <div className="admin-customers-avatar">{initial}</div>;
}

function AdminCustomers() {
  // ---------- USERS TABLE ----------
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sortOption, setSortOption] = useState("newest");

  // ---------- DETAILS MODAL ----------
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  // ---------- BLOCK / UNBLOCK MODAL ----------
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusTargetUser, setStatusTargetUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ==========================================
  // FETCH USERS
  // ==========================================

  async function fetchUsers(targetPage, targetSearch, targetRole, targetSortOption) {
    try {
      setLoading(true);
      setError("");

      const sortConfig = SORT_OPTIONS.find((s) => s.value === targetSortOption) || SORT_OPTIONS[0];

      const params = {
        page: targetPage,
        limit: 10,
        sortBy: sortConfig.sortBy,
        sortOrder: sortConfig.sortOrder,
      };

      if (targetSearch) {
        params.search = targetSearch;
      }

      if (targetRole) {
        params.role = targetRole;
      }

      const response = await adminAPI.getUsers(params);

      setUsers(response.data?.users || []);
      setTotal(response.data?.total || 0);
      setTotalPages(response.data?.totalPages || 1);
      setPage(targetPage);

    } catch (error) {
      console.error("Admin Get Users Error:", error);

      setError(
        error.response?.data?.message ||
        "Failed to load users"
      );

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      fetchUsers(1, "", "", "newest");
    });
  }, []);

  // ==========================================
  // FILTER / SEARCH / SORT HANDLERS
  // ==========================================

  function handleSearchSubmit(e) {
    e.preventDefault();
    setAppliedSearch(searchInput);
    fetchUsers(1, searchInput, roleFilter, sortOption);
  }

  function handleRoleChange(value) {
    setRoleFilter(value);
    fetchUsers(1, appliedSearch, value, sortOption);
  }

  function handleSortChange(value) {
    setSortOption(value);
    fetchUsers(1, appliedSearch, roleFilter, value);
  }

  function goToPage(targetPage) {
    if (targetPage < 1 || targetPage > totalPages) return;
    fetchUsers(targetPage, appliedSearch, roleFilter, sortOption);
  }

  function handleRefresh() {
    fetchUsers(page, appliedSearch, roleFilter, sortOption);
  }

  // ==========================================
  // DETAILS MODAL
  // ==========================================

  async function openDetailsModal(userId) {
    setDetailsModalOpen(true);
    setUserDetails(null);
    setDetailsError("");
    setDetailsLoading(true);

    try {
      const response = await adminAPI.getUserById(userId);
      setUserDetails(response.data);

    } catch (error) {
      console.error("Admin User Details Error:", error);

      setDetailsError(
        error.response?.data?.message ||
        "Something went wrong"
      );

    } finally {
      setDetailsLoading(false);
    }
  }

  function closeDetailsModal() {
    setDetailsModalOpen(false);
    setUserDetails(null);
    setDetailsError("");
  }

  // ==========================================
  // BLOCK / UNBLOCK MODAL
  // ==========================================

  function openStatusModal(user) {
    setStatusTargetUser(user);
    setActionError("");
    setStatusModalOpen(true);
  }

  function closeStatusModal() {
    if (actionLoading) return;
    setStatusModalOpen(false);
    setStatusTargetUser(null);
    setActionError("");
  }

  async function confirmStatusChange() {
    const newIsActive = !statusTargetUser.isActive;

    try {
      setActionLoading(true);
      setActionError("");

      const response = await adminAPI.updateUserStatus(statusTargetUser._id, newIsActive);
      const finalIsActive = response.data?.user?.isActive ?? newIsActive;

      setUsers((prev) =>
        prev.map((u) =>
          u._id === statusTargetUser._id ? { ...u, isActive: finalIsActive } : u
        )
      );

      // Keep the details modal in sync if it's open for the same user
      setUserDetails((prev) =>
        prev && prev.user?._id === statusTargetUser._id
          ? { ...prev, user: { ...prev.user, isActive: finalIsActive } }
          : prev
      );

      setSuccessMessage(
        `${statusTargetUser.name} ${finalIsActive ? "unblocked" : "blocked"} successfully.`
      );
      setStatusModalOpen(false);
      setStatusTargetUser(null);

    } catch (error) {
      console.error("Update User Status Error:", error);

      setActionError(
        error.response?.data?.message ||
        "Failed to update user status"
      );

    } finally {
      setActionLoading(false);
    }
  }

  // ==========================================
  // PAGE-LEVEL SUMMARY (derived from the currently loaded page only -
  // the backend does not return platform-wide role breakdowns here)
  // ==========================================

  const pageCustomers = users.filter((u) => u.role === "customer").length;
  const pageSalonOwners = users.filter((u) => u.role === "salon").length;
  const pageActive = users.filter((u) => u.isActive).length;

  // ==========================================
  // UI
  // ==========================================

  return (
    <AdminLayout title="User Management">

      {/* HEADER */}
      <div className="admin-customers-header">
        <div>
          {/* <h2 className="admin-customers-heading">User Management</h2> */}
          <p className="admin-customers-subtitle">
            Manage customers, salon owners, and platform users.
          </p>
        </div>

        <button className="admin-btn admin-btn-outline" onClick={handleRefresh}>
          Refresh
        </button>
      </div>

      {successMessage && (
        <div className="admin-customers-success-banner">
          <span>{successMessage}</span>
          <button
            className="admin-customers-banner-close"
            onClick={() => setSuccessMessage("")}
            aria-label="Dismiss"
            type="button"
          >
            &times;
          </button>
        </div>
      )}

      {/* SUMMARY */}
      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <span className="admin-stat-label">Total Users (matching filters)</span>
          <span className="admin-stat-value">{total}</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-label">Customers on This Page</span>
          <span className="admin-stat-value">{pageCustomers}</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-label">Salon Owners on This Page</span>
          <span className="admin-stat-value">{pageSalonOwners}</span>
        </div>
        <div className="admin-stat-card positive">
          <span className="admin-stat-label">Active on This Page</span>
          <span className="admin-stat-value">{pageActive}</span>
        </div>
      </div>

      {/* TOOLBAR: SEARCH + FILTERS + SORT */}
      <form className="admin-filter-bar" onSubmit={handleSearchSubmit}>
        <input
          className="admin-search-input"
          type="text"
          placeholder="Search name or email..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />

        <button type="submit" className="admin-btn admin-btn-primary">
          Search
        </button>

        <select
          className="admin-select"
          value={roleFilter}
          onChange={(e) => handleRoleChange(e.target.value)}
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          className="admin-select"
          value={sortOption}
          onChange={(e) => handleSortChange(e.target.value)}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Sort: {opt.label}
            </option>
          ))}
        </select>
      </form>

      {/* USERS TABLE */}
      {loading ? (
        <div className="admin-loading-state">
          <h2>Loading users...</h2>
        </div>
      ) : error ? (
        <div className="admin-error-state">
          <h2>Failed to load users</h2>
          <p>{error}</p>
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => fetchUsers(page, appliedSearch, roleFilter, sortOption)}
          >
            Try Again
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="admin-empty-state">
          <h2>No users found.</h2>
          <p>Try changing your search or filters.</p>
        </div>
      ) : (
        <>
          <p className="admin-page-info">Total Users: {total}</p>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Account Status</th>
                  <th>Phone Verified</th>
                  <th>Joined Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="admin-customers-user-cell">
                        <UserAvatar name={u.name} />
                        <span>{u.name}</span>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>{u.phone || "Not available"}</td>
                    <td><span className={`admin-badge ${u.role}`}>{getRoleLabel(u.role)}</span></td>
                    <td>
                      <span className={`admin-badge ${u.isActive ? "active" : "blocked"}`}>
                        {u.isActive ? "Active" : "Blocked"}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge ${u.isPhoneVerified ? "active" : "pending"}`}>
                        {u.isPhoneVerified ? "Verified" : "Not Verified"}
                      </span>
                    </td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>
                      <div className="admin-customers-actions">
                        <button
                          className="admin-btn admin-btn-outline"
                          onClick={() => openDetailsModal(u._id)}
                        >
                          View Details
                        </button>

                        {u.role !== "admin" && (
                          u.isActive ? (
                            <button
                              className="admin-btn admin-btn-danger"
                              onClick={() => openStatusModal(u)}
                            >
                              Block
                            </button>
                          ) : (
                            <button
                              className="admin-btn admin-btn-success"
                              onClick={() => openStatusModal(u)}
                            >
                              Unblock
                            </button>
                          )
                        )}
                      </div>
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

      {/* USER DETAILS MODAL */}
      {detailsModalOpen && (
        <div className="admin-modal-backdrop" onClick={closeDetailsModal}>
          <div className="admin-modal admin-customers-details-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-section-title">User Details</h2>

            {detailsLoading ? (
              <div className="admin-loading-state">
                <h2>Loading details...</h2>
              </div>
            ) : detailsError ? (
              <div className="admin-error-state">
                <h2>Failed to load details</h2>
                <p>{detailsError}</p>
              </div>
            ) : userDetails ? (
              <>
                <div className="admin-customers-modal-info-grid">
                  <p><strong>Name:</strong> {userDetails.user.name}</p>
                  <p><strong>Email:</strong> {userDetails.user.email}</p>
                  <p><strong>Phone:</strong> {userDetails.user.phone || "Not available"}</p>
                  <p><strong>Role:</strong> {getRoleLabel(userDetails.user.role)}</p>
                  <p>
                    <strong>Account Status:</strong>{" "}
                    <span className={`admin-badge ${userDetails.user.isActive ? "active" : "blocked"}`}>
                      {userDetails.user.isActive ? "Active" : "Blocked"}
                    </span>
                  </p>
                  <p>
                    <strong>Phone Verification:</strong>{" "}
                    <span className={`admin-badge ${userDetails.user.isPhoneVerified ? "active" : "pending"}`}>
                      {userDetails.user.isPhoneVerified ? "Verified" : "Not Verified"}
                    </span>
                  </p>
                  <p><strong>Joined:</strong> {formatDate(userDetails.user.createdAt)}</p>
                </div>

                {userDetails.user.role === "customer" && (
                  <div className="admin-customers-modal-section">
                    <h3 className="admin-customers-modal-section-title">Booking History</h3>

                    {!userDetails.bookingHistory || userDetails.bookingHistory.length === 0 ? (
                      <p className="admin-customers-modal-empty">No booking history found.</p>
                    ) : (
                      <div className="admin-customers-modal-list">
                        {userDetails.bookingHistory.map((b) => (
                          <div key={b.bookingId} className="admin-customers-modal-list-item">
                            <div>
                              <strong>{b.salonName}</strong> — {b.serviceName}
                            </div>
                            <div className="admin-customers-modal-list-meta">
                              <span>{b.appointmentDate || "Not available"}</span>
                              <span>₹{b.amount ?? 0}</span>
                              <span className={`admin-badge ${b.status}`}>{b.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {userDetails.user.role === "salon" && (
                  <div className="admin-customers-modal-section">
                    <h3 className="admin-customers-modal-section-title">Salon Information</h3>

                    {!userDetails.salons || userDetails.salons.length === 0 ? (
                      <p className="admin-customers-modal-empty">No salons found.</p>
                    ) : (
                      <div className="admin-customers-modal-list">
                        {userDetails.salons.map((s) => (
                          <div key={s.salonId} className="admin-customers-modal-list-item">
                            <div>
                              <strong>{s.salonName}</strong>
                            </div>
                            <div className="admin-customers-modal-list-meta">
                              <span className={`admin-badge ${s.status}`}>{s.status}</span>
                              <span>Created {formatDate(s.createdAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : null}

            <div className="admin-customers-modal-actions">
              <button className="admin-btn admin-btn-outline" onClick={closeDetailsModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BLOCK / UNBLOCK CONFIRMATION MODAL */}
      {statusModalOpen && statusTargetUser && (
        <div className="admin-modal-backdrop" onClick={closeStatusModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-section-title">
              {statusTargetUser.isActive ? "Block User?" : "Unblock User?"}
            </h2>

            <p className="admin-customers-modal-text">
              You are about to {statusTargetUser.isActive ? "block" : "unblock"}:
            </p>

            <p className="admin-customers-modal-target-name">{statusTargetUser.name}</p>
            <p className="admin-customers-modal-target-email">{statusTargetUser.email}</p>

            <p className="admin-customers-modal-text">
              {statusTargetUser.isActive
                ? "This user will not be able to access the platform."
                : "This user will be able to access the platform again."}
            </p>

            {actionError && (
              <p className="admin-customers-modal-error">{actionError}</p>
            )}

            <div className="admin-customers-modal-actions">
              <button
                className="admin-btn admin-btn-outline"
                onClick={closeStatusModal}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className={statusTargetUser.isActive ? "admin-btn admin-btn-danger" : "admin-btn admin-btn-success"}
                onClick={confirmStatusChange}
                disabled={actionLoading}
              >
                {actionLoading
                  ? "Updating..."
                  : statusTargetUser.isActive
                  ? "Confirm Block"
                  : "Confirm Unblock"}
              </button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}

export default AdminCustomers;