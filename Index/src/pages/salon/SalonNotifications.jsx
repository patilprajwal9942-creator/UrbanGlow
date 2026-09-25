import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notificationAPI } from "../../services/api";
import "../../styles/SalonNotifications.css";
import { MdArrowBack } from "react-icons/md";
function formatDate(dateString) {
  if (!dateString) return "Not available";
  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SalonNotifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  async function fetchNotifications() {
    try {
      setLoading(true);
      setError("");

      const response = await notificationAPI.getAll();
      setNotifications(response.data?.notifications || []);

    } catch (error) {
      console.error("Get Notifications Error:", error);

      setError(
        error.response?.data?.message ||
        "Failed to load notifications"
      );

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      fetchNotifications();
    });
  }, []);

  async function handleMarkRead(id) {
    try {
      await notificationAPI.markRead(id);

      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );

    } catch (error) {
      console.error("Mark Read Error:", error);
    }
  }

  async function handleMarkAllRead() {
    try {
      setMarkingAll(true);
      await notificationAPI.markReadAll();

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );

    } catch (error) {
      console.error("Mark All Read Error:", error);
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="salon-notifications-page">


      <header className="salon-notifications-header">
        <div>
          <button
            className="owner-back-btn"
            onClick={() => navigate("/salon/dashboard")}
          >
            <MdArrowBack />
            Back to Dashboard
          </button>


          <h1>Notifications</h1>

          <p>
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "You're all caught up"}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            className="salon-notifications-mark-all"
            onClick={handleMarkAllRead}
            disabled={markingAll}
          >
            {markingAll ? "Marking..." : "Mark All Read"}
          </button>
        )}
      </header>

      {loading ? (
        <div className="salon-notifications-loading">
          <h2>Loading notifications...</h2>
        </div>
      ) : error ? (
        <div className="salon-notifications-error">
          <h2>{error}</h2>
          <button className="btn btn-primary" onClick={fetchNotifications}>
            Try Again
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="salon-notifications-empty">
          <div className="salon-notifications-empty-icon">🔔</div>
          <h2>No notifications yet</h2>
          <p>You'll see booking requests and updates here.</p>
        </div>
      ) : (
        <div className="salon-notifications-list">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`salon-notification-card ${notification.isRead ? "" : "unread"}`}
              onClick={() => !notification.isRead && handleMarkRead(notification._id)}
            >
              <div className="salon-notification-icon">
                {notification.type === "booking" ? "📅" : "🔔"}
              </div>

              <div className="salon-notification-content">
                <div className="salon-notification-top-row">
                  <h3>{notification.title}</h3>
                  {!notification.isRead && (
                    <span className="salon-notification-dot" aria-label="Unread" />
                  )}
                </div>

                <p className="salon-notification-message">
                  {notification.message}
                </p>

                <span className="salon-notification-time">
                  {formatDate(notification.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default SalonNotifications;