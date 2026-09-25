import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminAPI } from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";
import "../../styles/admin/AdminSalons.css";

// Sort fields as actually supported by the backend controller
// (server/controllers/admin/adminSalonController.js: getSalons)
const SORT_OPTIONS = [
  { value: "createdAt", label: "Created Date" },
  { value: "salonName", label: "Salon Name" },
];

const STATUS_ACTION_LABELS = {
  active: "activated",
  inactive: "marked inactive",
  blocked: "blocked",
};

function formatDate(dateString) {
  if (!dateString) return "Not available";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function SalonAvatar({ salon }) {
  const [imgError, setImgError] = useState(false);
  const initial = salon.salonName?.charAt(0)?.toUpperCase() || "?";

  if (!salon.image || imgError) {
    return <div className="admin-salons-avatar-fallback">{initial}</div>;
  }

  return (
    <img
      src={salon.image}
      alt={salon.salonName}
      className="admin-salons-avatar-img"
      onError={() => setImgError(true)}
    />
  );
}

function AdminSalons() {
  const navigate = useNavigate();

  const [salons, setSalons] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ==========================================
  // FETCH SALONS
  // ==========================================

  async function fetchSalons(targetPage, targetSearch, targetStatus, targetSortBy, targetSortOrder) {
    try {
      setLoading(true);
      setError("");

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

      const response = await adminAPI.getSalons(params);

      setSalons(response.data?.salons || []);
      setTotal(response.data?.total || 0);
      setTotalPages(response.data?.totalPages || 1);
      setPage(targetPage);

    } catch (error) {
      console.error("Admin Get Salons Error:", error);

      setError(
        error.response?.data?.message ||
        "Failed to load salons"
      );

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      fetchSalons(1, "", "", "createdAt", "desc");
    });
  }, []);

  // ==========================================
  // FILTER / SEARCH / SORT HANDLERS
  // ==========================================

  function handleSearchSubmit(e) {
    e.preventDefault();
    setAppliedSearch(searchInput);
    fetchSalons(1, searchInput, statusFilter, sortBy, sortOrder);
  }

  function handleStatusFilterChange(value) {
    setStatusFilter(value);
    fetchSalons(1, appliedSearch, value, sortBy, sortOrder);
  }

  function handleSortByChange(value) {
    setSortBy(value);
    fetchSalons(1, appliedSearch, statusFilter, value, sortOrder);
  }

  function handleSortOrderChange(value) {
    setSortOrder(value);
    fetchSalons(1, appliedSearch, statusFilter, sortBy, value);
  }

  function goToPage(targetPage) {
    if (targetPage < 1 || targetPage > totalPages) return;
    fetchSalons(targetPage, appliedSearch, statusFilter, sortBy, sortOrder);
  }

  function handleRefresh() {
    fetchSalons(page, appliedSearch, statusFilter, sortBy, sortOrder);
  }

  // ==========================================
  // STATUS CHANGE MODAL
  // ==========================================

  function openStatusModal(salon, status) {
    setSelectedSalon(salon);
    setNewStatus(status);
    setActionError("");
    setStatusModalOpen(true);
  }

  function closeStatusModal() {
    if (actionLoading) return;
    setStatusModalOpen(false);
    setSelectedSalon(null);
    setNewStatus("");
    setActionError("");
  }

  async function confirmStatusChange() {
    try {
      setActionLoading(true);
      setActionError("");

      const response = await adminAPI.updateSalonStatus(selectedSalon._id, newStatus);
      const updatedStatus = response.data?.salon?.status || newStatus;

      setSalons((prev) =>
        prev.map((s) =>
          s._id === selectedSalon._id ? { ...s, status: updatedStatus } : s
        )
      );

      setSuccessMessage(`Salon ${STATUS_ACTION_LABELS[updatedStatus] || "updated"} successfully.`);
      setStatusModalOpen(false);
      setSelectedSalon(null);
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
  // UI
  // ==========================================

  return (
    <AdminLayout title="Salon Management">

      {/* HEADER */}
      <div className="admin-salons-header">
        <div>
          {/* <h2 className="admin-salons-heading">Salon Management</h2> */}
          <p className="admin-salons-subtitle">
            Manage all salons and control salon availability.
          </p>
        </div>

        <button className="admin-btn admin-btn-outline" onClick={handleRefresh}>
          Refresh
        </button>
      </div>

      {successMessage && (
        <div className="admin-salons-success-banner">
          <span>{successMessage}</span>
          <button
            className="admin-salons-banner-close"
            onClick={() => setSuccessMessage("")}
            aria-label="Dismiss"
            type="button"
          >
            &times;
          </button>
        </div>
      )}

      {/* TOOLBAR: SEARCH + FILTERS + SORT */}
      <form className="admin-filter-bar" onSubmit={handleSearchSubmit}>
        <input
          className="admin-search-input"
          type="text"
          placeholder="Search salon name, owner or email..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />

        <button type="submit" className="admin-btn admin-btn-primary">
          Search
        </button>

        <select
          className="admin-select"
          value={statusFilter}
          onChange={(e) => handleStatusFilterChange(e.target.value)}
        >
          <option value="">All Salons</option>
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

      {/* SALON TABLE */}
      {loading ? (
        <div className="admin-loading-state">
          <h2>Loading salons...</h2>
        </div>
      ) : error ? (
        <div className="admin-error-state">
          <h2>Failed to load salons</h2>
          <p>{error}</p>
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => fetchSalons(page, appliedSearch, statusFilter, sortBy, sortOrder)}
          >
            Try Again
          </button>
        </div>
      ) : salons.length === 0 ? (
        <div className="admin-empty-state">
          <h2>No salons found.</h2>
          <p>{appliedSearch ? "No salons match your search." : "There are no salons to show."}</p>
        </div>
      ) : (
        <>
          <p className="admin-page-info">Total Salons: {total}</p>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Salon</th>
                  <th>Owner</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {salons.map((salon) => (
                  <tr key={salon._id}>
                    <td>
                      <div className="admin-salons-name-cell">
                        <SalonAvatar salon={salon} />
                        <span>{salon.salonName}</span>
                      </div>
                    </td>
                    <td>{salon.ownerName}</td>
                    <td>{salon.email}</td>
                    <td>{salon.phone}</td>
                    <td>
                      <span className="admin-salons-address-cell" title={salon.address}>
                        {salon.address}
                      </span>
                    </td>
                    <td><span className={`admin-badge ${salon.status}`}>{salon.status}</span></td>
                    <td>{formatDate(salon.createdAt)}</td>
                    <td>
                      <div className="admin-salons-actions">
                        <button
                          className="admin-btn admin-btn-outline"
                          onClick={() => navigate(`/admin/salons/${salon._id}`)}
                        >
                          View Details
                        </button>

                        {salon.status !== "active" && (
                          <button
                            className="admin-btn admin-btn-success"
                            onClick={() => openStatusModal(salon, "active")}
                          >
                            Activate
                          </button>
                        )}

                        {salon.status !== "inactive" && (
                          <button
                            className="admin-btn admin-btn-outline"
                            onClick={() => openStatusModal(salon, "inactive")}
                          >
                            Deactivate
                          </button>
                        )}

                        {salon.status !== "blocked" && (
                          <button
                            className="admin-btn admin-btn-danger"
                            onClick={() => openStatusModal(salon, "blocked")}
                          >
                            Block
                          </button>
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

      {/* STATUS CHANGE CONFIRMATION MODAL */}
      {statusModalOpen && selectedSalon && (
        <div className="admin-modal-backdrop" onClick={closeStatusModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-section-title">Confirm Status Change</h2>

            <p className="admin-salons-modal-text">
              Are you sure you want to change the status of
              {" "}<strong>{selectedSalon.salonName}</strong>?
            </p>

            <div className="admin-salons-modal-status-row">
              <span>Current Status:</span>
              <span className={`admin-badge ${selectedSalon.status}`}>{selectedSalon.status}</span>
            </div>

            <div className="admin-salons-modal-status-row">
              <span>New Status:</span>
              <span className={`admin-badge ${newStatus}`}>{newStatus}</span>
            </div>

            {actionError && (
              <p className="admin-salons-modal-error">{actionError}</p>
            )}

            <div className="admin-salons-modal-actions">
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

export default AdminSalons;