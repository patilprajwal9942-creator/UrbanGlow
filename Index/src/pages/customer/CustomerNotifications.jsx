import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FiArrowLeft,
  FiBell,
  FiCalendar,
  FiCheck,
  FiInfo,
  FiMapPin,
  FiRefreshCw,
} from "react-icons/fi";

import { notificationAPI } from "../../services/api";

import "../../styles/CustomerNotifications.css";


// ==========================================
// FORMAT DATE
// ==========================================

function formatDate(dateString) {
  if (!dateString) {
    return "Date unavailable";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}


// ==========================================
// NOTIFICATION ICON
// ==========================================

function getNotificationIcon(type) {
  if (type === "booking") {
    return <FiCalendar />;
  }

  return <FiInfo />;
}


// ==========================================
// CUSTOMER NOTIFICATIONS
// ==========================================

function CustomerNotifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [markingAll, setMarkingAll] = useState(false);

  const [markingId, setMarkingId] = useState(null);


  // ========================================
  // FETCH NOTIFICATIONS
  // ========================================

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      setError("");

      const response = await notificationAPI.getAll();

      setNotifications(
        response.data?.notifications || []
      );

    } catch (error) {
      console.error(
        "Get Customer Notifications Error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load notifications."
      );

    } finally {
      setLoading(false);
    }
  };


  // ========================================
  // INITIAL LOAD
  // ========================================

  useEffect(() => {
    fetchNotifications();
  }, []);


  // ========================================
  // MARK SINGLE READ
  // ========================================

  const handleMarkRead = async (id) => {
    try {
      setMarkingId(id);

      await notificationAPI.markRead(id);

      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === id
            ? {
                ...notification,
                isRead: true,
              }
            : notification
        )
      );

    } catch (error) {
      console.error(
        "Mark Notification Read Error:",
        error
      );

    } finally {
      setMarkingId(null);
    }
  };


  // ========================================
  // MARK ALL READ
  // ========================================

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);

      await notificationAPI.markReadAll();

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

    } catch (error) {
      console.error(
        "Mark All Notifications Read Error:",
        error
      );

    } finally {
      setMarkingAll(false);
    }
  };


  // ========================================
  // UNREAD COUNT
  // ========================================

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;


  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="customer-notifications-page">

      {/* ======================================
          HEADER
      ====================================== */}

      <header className="customer-notifications-header">

        <div className="customer-notifications-header-left">

          <button
            className="customer-notifications-back"
            onClick={() => navigate("/dashboard")}
            type="button"
          >
            <FiArrowLeft />

            <span>
              Back to Dashboard
            </span>
          </button>


          <div className="customer-notifications-title">

            <div className="customer-notifications-title-icon">
              <FiBell />
            </div>


            <div>

              <h1>
                Notifications
              </h1>

              <p>
                {unreadCount > 0
                  ? `${unreadCount} unread notification${
                      unreadCount !== 1
                        ? "s"
                        : ""
                    }`
                  : "You're all caught up"}
              </p>

            </div>

          </div>

        </div>


        {/* MARK ALL */}

        {unreadCount > 0 && (
          <button
            className="customer-notifications-mark-all"
            onClick={handleMarkAllRead}
            disabled={markingAll}
            type="button"
          >
            <FiCheck />

            {markingAll
              ? "Marking..."
              : "Mark All as Read"}
          </button>
        )}

      </header>


      {/* ======================================
          CONTENT
      ====================================== */}

      <main className="customer-notifications-content">

        {/* ====================================
            LOADING
        ==================================== */}

        {loading && (
          <div className="customer-notifications-state">

            <div className="customer-notifications-loader">
              <FiRefreshCw />
            </div>

            <h2>
              Loading notifications...
            </h2>

            <p>
              Please wait while we fetch your
              latest updates.
            </p>

          </div>
        )}


        {/* ====================================
            ERROR
        ==================================== */}

        {!loading && error && (
          <div className="customer-notifications-state error-state">

            <div className="customer-notifications-state-icon">
              <FiInfo />
            </div>

            <h2>
              Something went wrong
            </h2>

            <p>
              {error}
            </p>

            <button
              className="customer-notifications-retry"
              onClick={fetchNotifications}
              type="button"
            >
              <FiRefreshCw />

              Try Again
            </button>

          </div>
        )}


        {/* ====================================
            EMPTY
        ==================================== */}

        {!loading &&
          !error &&
          notifications.length === 0 && (
            <div className="customer-notifications-state">

              <div className="customer-notifications-empty-icon">
                <FiBell />
              </div>

              <h2>
                No notifications yet
              </h2>

              <p>
                Booking confirmations, updates,
                and other important messages will
                appear here.
              </p>

              <button
                className="customer-notifications-dashboard-btn"
                onClick={() => navigate("/dashboard")}
                type="button"
              >
                Explore Dashboard
              </button>

            </div>
          )}


        {/* ====================================
            NOTIFICATION LIST
        ==================================== */}

        {!loading &&
          !error &&
          notifications.length > 0 && (

            <div className="customer-notifications-list">

              {notifications.map(
                (notification) => {

                  const booking =
                    notification.bookingId;

                  const salon =
                    booking?.salonId;


                  return (
                    <article
                      key={notification._id}
                      className={`customer-notification-card ${
                        notification.isRead
                          ? "read"
                          : "unread"
                      }`}
                    >

                      {/* ICON */}

                      <div className="customer-notification-icon">

                        {getNotificationIcon(
                          notification.type
                        )}

                      </div>


                      {/* BODY */}

                      <div className="customer-notification-body">

                        {/* TITLE */}

                        <div className="customer-notification-top">

                          <h3>
                            {notification.title}
                          </h3>

                          {!notification.isRead && (
                            <span
                              className="customer-notification-unread-dot"
                              aria-label="Unread notification"
                            />
                          )}

                        </div>


                        {/* MESSAGE */}

                        <p className="customer-notification-message">
                          {notification.message}
                        </p>


                        {/* SALON INFORMATION */}

                        {notification.type ===
                          "booking" &&
                          salon && (
                            <div className="customer-notification-salon">

                              <div className="customer-notification-salon-row">

                                <span className="customer-notification-salon-icon">
                                  🏪
                                </span>

                                <div>

                                  <span className="customer-notification-label">
                                    Salon
                                  </span>

                                  <strong>
                                    {salon.name ||
                                      "Salon"}
                                  </strong>

                                </div>

                              </div>


                              {salon.address && (
                                <div className="customer-notification-salon-row">

                                  <FiMapPin className="customer-notification-location-icon" />

                                  <div>

                                    <span className="customer-notification-label">
                                      Address
                                    </span>

                                    <span className="customer-notification-address">
                                      {salon.address}
                                    </span>

                                  </div>

                                </div>
                              )}

                            </div>
                          )}


                        {/* BOTTOM */}

                        <div className="customer-notification-bottom">

                          <span className="customer-notification-date">
                            {formatDate(
                              notification.createdAt
                            )}
                          </span>


                          {!notification.isRead && (
                            <button
                              className="customer-notification-read-btn"
                              onClick={() =>
                                handleMarkRead(
                                  notification._id
                                )
                              }
                              disabled={
                                markingId ===
                                notification._id
                              }
                              type="button"
                            >
                              <FiCheck />

                              {markingId ===
                              notification._id
                                ? "Marking..."
                                : "Mark as read"}
                            </button>
                          )}

                        </div>

                      </div>

                    </article>
                  );
                }
              )}

            </div>
          )}

      </main>

    </div>
  );
}

export default CustomerNotifications;