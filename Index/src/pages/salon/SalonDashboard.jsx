import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  MdLocationOn,
  MdStorefront,
  MdContentCut,
  MdAccessTime,
  MdCalendarMonth,
  MdAnalytics,
  MdNotificationsNone,
  MdLogout,
  MdRefresh,
} from "react-icons/md";

import { FiClock } from "react-icons/fi";

import {
  salonAPI,
  notificationAPI,
} from "../../services/api";

import "./SalonDashboard.css";

function SalonDashboard() {
  const navigate = useNavigate();

  // ==========================================
  // GET LOGGED IN USER
  // ==========================================

  const storedUser = localStorage.getItem("user");

  const user = storedUser
    ? JSON.parse(storedUser)
    : null;

  const userId =
    user?.id || user?._id;

  // ==========================================
  // STATE
  // ==========================================

  const [salon, setSalon] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [notifications, setNotifications] =
    useState([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  // ==========================================
  // LOCATION STATE
  // ==========================================

  const [locationStatus, setLocationStatus] =
    useState("idle");

  const [locationMessage, setLocationMessage] =
    useState("");

  // ==========================================
  // LOAD DASHBOARD DATA
  // ==========================================

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);

        if (!userId) {
          console.log(
            "User not found in localStorage"
          );

          return;
        }

        const results =
          await Promise.allSettled([
            salonAPI.getMySalon(),
            notificationAPI.getUnread(),
          ]);

        const salonResult =
          results[0];

        const notificationResult =
          results[1];

        // ==========================================
        // SALON
        // ==========================================

        if (
          salonResult.status ===
          "fulfilled"
        ) {
          const salonData =
            salonResult.value.data?.salon ||
            salonResult.value.data?.data ||
            salonResult.value.data;

          setSalon(salonData || null);

        } else {
          console.log(
            "No salon found:",
            salonResult.reason
          );

          setSalon(null);
        }

        // ==========================================
        // NOTIFICATIONS
        // ==========================================

        if (
          notificationResult.status ===
          "fulfilled"
        ) {
          const data =
            notificationResult.value.data;

          setUnreadCount(
            data?.unreadCount || 0
          );

          setNotifications(
            data?.notifications || []
          );

        } else {
          console.log(
            "Notification Error:",
            notificationResult.reason
          );
        }

      } catch (error) {

        console.error(
          "Dashboard Loading Error:",
          error
        );

      } finally {

        setLoading(false);

      }
    }

    loadDashboard();

  }, [userId]);


  // ==========================================
  // SET / UPDATE SALON LOCATION
  // ==========================================

  function handleSetLocation() {

    setLocationMessage("");

    if (!navigator.geolocation) {

      setLocationStatus("error");

      setLocationMessage(
        "Your browser does not support location services."
      );

      return;
    }

    setLocationStatus("loading");

    navigator.geolocation.getCurrentPosition(
      handleLocationSuccess,
      handleLocationError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }


  // ==========================================
  // LOCATION SUCCESS
  // ==========================================

  async function handleLocationSuccess(
    position
  ) {

    const {
      latitude,
      longitude,
    } = position.coords;

    try {

      const response =
        await salonAPI.updateMyLocation(
          latitude,
          longitude
        );

      setSalon((prev) => {

        if (!prev) return prev;

        return {
          ...prev,

          location:
            response.data?.location ||
            prev.location,
        };

      });

      setLocationStatus("success");

      setLocationMessage(
        "Salon location updated successfully."
      );

    } catch (error) {

      console.error(
        "Update Location Error:",
        error
      );

      setLocationStatus("error");

      setLocationMessage(
        error.response?.data?.message ||
        "Failed to save salon location."
      );

    }
  }


  // ==========================================
  // LOCATION ERROR
  // ==========================================

  function handleLocationError(error) {

    setLocationStatus("error");

    if (
      error.code ===
      error.PERMISSION_DENIED
    ) {

      setLocationMessage(
        "Location permission was denied. Please allow location access."
      );

    } else if (
      error.code ===
      error.POSITION_UNAVAILABLE
    ) {

      setLocationMessage(
        "Your location is currently unavailable."
      );

    } else if (
      error.code ===
      error.TIMEOUT
    ) {

      setLocationMessage(
        "Getting your location took too long."
      );

    } else {

      setLocationMessage(
        "Something went wrong while getting your location."
      );

    }
  }


  // ==========================================
  // LOGOUT
  // ==========================================

  function handleLogout() {

    localStorage.removeItem("user");

    localStorage.removeItem("token");

    navigate("/login");

  }


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <div className="salon-dashboard-page">

        <div className="dashboard-loading">

          <div className="loading-spinner"></div>

          <p>
            Loading dashboard...
          </p>

        </div>

      </div>

    );

  }


  // ==========================================
  // CHECK LOCATION
  // ==========================================

  const hasLocation =
    salon?.location?.coordinates?.length === 2;


  // ==========================================
  // DASHBOARD CARDS
  // ==========================================

  const dashboardCards = [

    {
      title: "Salon Profile",

      subtitle:
        salon
          ? salon.ownerName ||
            user?.name ||
            "Salon Owner"
          : "Create your salon",

      description:
        salon
          ? salon.email ||
            "Manage salon information"
          : "Create your salon profile",

      icon: <MdStorefront />,

      className: "profile-card",

      onClick: () =>
        navigate("/salon/create"),
    },


    {
      title: "Services",

      subtitle:
        "Services Management",

      description:
        "Add and manage salon services",

      icon: <MdContentCut />,

      className: "services-card",

      disabled: !salon,

      onClick: () =>
        navigate("/salon/services"),
    },


    {
      title: "Time Slots",

      subtitle:
        "Time Slots Management",

      description:
        "Manage appointment slots",

      icon: <MdAccessTime />,

      className: "slots-card",

      disabled: !salon,

      onClick: () =>
        navigate("/salon/slots"),
    },


    {
      title: "Customer Bookings",

      subtitle:
        "Customer Management",

      description:
        "View customer appointments",

      icon: <MdCalendarMonth />,

      className: "bookings-card",

      disabled: !salon,

      onClick: () =>
        navigate("/salon/bookings"),
    },


    {
      title: "Analytics & Income",

      subtitle:
        "Analytics & Management",

      description:
        "Income and booking analytics",

      icon: <MdAnalytics />,

      className: "analytics-card",

      disabled: !salon,

      onClick: () =>
        navigate("/salon/analytics"),
    },


    {
      title: "Working Hours",

      subtitle:
        "Working Hours",

      description:
        "Manage salon opening hours",

      icon: <FiClock />,

      className: "working-card",

      disabled: !salon,

      onClick: () =>
        navigate("/salon/working-hours"),
    },


    {
      title: "Notifications",

      subtitle:
        unreadCount > 0
          ? `${unreadCount} New Notifications`
          : "No New Notifications",

      description:
        "View all salon notifications",

      icon: <MdNotificationsNone />,

      className: "notification-card",

      onClick: () =>
        navigate("/notifications"),
    },

  ];


  // ==========================================
  // UI
  // ==========================================

  return (

    <div className="salon-dashboard-page">


      {/* ====================================== */}
      {/* TOP HEADER */}
      {/* ====================================== */}

      <header className="dashboard-topbar">

        <div className="dashboard-user">

          <div className="dashboard-avatar">

            {user?.name
              ? user.name
                  .charAt(0)
                  .toUpperCase()
              : "S"}

          </div>


          <div>

            <p className="welcome-text">
              Welcome,
            </p>

            <h1>
              {user?.name ||
                "Salon Owner"}
            </h1>

          </div>

        </div>


        <div className="dashboard-header-actions">


          {/* NOTIFICATION */}

          <button
            className="header-icon-btn"
            onClick={() =>
              navigate("/notifications")
            }
          >

            <MdNotificationsNone />

            {unreadCount > 0 && (

              <span className="notification-badge">

                {unreadCount}

              </span>

            )}

          </button>


          {/* LOGOUT */}

          <button
            className="header-logout-btn"
            onClick={handleLogout}
          >

            <MdLogout />

            <span>
              Logout
            </span>

          </button>

        </div>

      </header>


      {/* ====================================== */}
      {/* MAIN CONTENT */}
      {/* ====================================== */}

      <main className="dashboard-content">


        {/* ====================================== */}
        {/* NO SALON */}
        {/* ====================================== */}

        {!salon && (

          <section className="create-salon-banner">

            <div className="create-salon-icon">

              <MdStorefront />

            </div>


            <div>

              <h2>
                Create Your Salon Profile
              </h2>

              <p>
                Complete your salon profile to start
                managing services, slots and bookings.
              </p>

            </div>


            <button
              onClick={() =>
                navigate("/salon/create")
              }
            >

              Create Salon

            </button>

          </section>

        )}


        {/* ====================================== */}
        {/* LOCATION BANNER */}
        {/* ====================================== */}

        {salon && (

          <section className="location-banner">


            <div className="location-banner-left">


              <div className="location-icon-box">

                <MdLocationOn />

              </div>


              <div>

                <h2>
                  Salon Location
                </h2>

                <p>
                  Set your salon location so customers
                  can easily find your salon nearby.
                </p>


                {hasLocation && (

                  <div className="location-configured">

                    ✓ Location configured

                  </div>

                )}


                {locationStatus ===
                  "success" && (

                  <p className="location-success">

                    {locationMessage}

                  </p>

                )}


                {locationStatus ===
                  "error" && (

                  <p className="location-error">

                    {locationMessage}

                  </p>

                )}

              </div>

            </div>


            <button
              className="location-update-btn"
              onClick={handleSetLocation}
              disabled={
                locationStatus === "loading"
              }
            >

              {locationStatus ===
                "loading" ? (

                <>
                  <MdRefresh className="rotate-icon" />

                  Getting Location...

                </>

              ) : (

                <>

                  <MdLocationOn />

                  {hasLocation
                    ? "Update My Location"
                    : "Set My Location"}

                </>

              )}

            </button>

          </section>

        )}


        {/* ====================================== */}
        {/* SALON GRID */}
        {/* ====================================== */}

        <section className="dashboard-grid">

          {dashboardCards.map(
            (card, index) => (

              <button
                key={index}

                className={`
                  dashboard-management-card
                  ${card.className}
                  ${card.disabled
                    ? "card-disabled"
                    : ""}
                `}

                disabled={card.disabled}

                onClick={card.onClick}
              >


                {/* ICON */}

                <div className="management-card-icon">

                  {card.icon}

                </div>


                {/* CONTENT */}

                <div className="management-card-content">


                  <h2>

                    {card.title}

                  </h2>


                  <p className="card-subtitle">

                    {card.subtitle}

                  </p>


                  <p className="card-description">

                    {card.description}

                  </p>


                  {/* PROFILE DETAILS */}

                  {card.title ===
                    "Salon Profile" &&
                    salon && (

                    <div className="profile-mini-details">

                      <span>

                        Email:
                        {" "}
                        {salon.email ||
                          "Not available"}

                      </span>


                      <span>

                        Phone:
                        {" "}
                        {salon.phone ||
                          "Not available"}

                      </span>

                    </div>

                  )}

                </div>


                {/* ARROW */}

                <div className="card-arrow">

                  →

                </div>

              </button>

            )
          )}

        </section>


        {/* ====================================== */}
        {/* NOTIFICATION PREVIEW */}
        {/* ====================================== */}

        {notifications.length > 0 && (

          <section className="dashboard-notification-preview">

            <div className="notification-preview-header">

              <div>

                <h2>
                  Recent Notifications
                </h2>

                <p>
                  Latest updates from your salon
                </p>

              </div>


              <button
                onClick={() =>
                  navigate("/notifications")
                }
              >

                View All

              </button>

            </div>


            <div className="notification-preview-list">

              {notifications
                .slice(0, 3)
                .map(
                  (notification) => (

                    <div
                      key={notification._id}
                      className="notification-preview-item"
                    >

                      <div className="notification-preview-icon">

                        <MdNotificationsNone />

                      </div>


                      <div>

                        <h3>

                          {notification.title}

                        </h3>

                        <p>

                          {notification.message}

                        </p>

                      </div>


                      <span>

                        {notification.createdAt
                          ? new Date(
                              notification.createdAt
                            ).toLocaleDateString()
                          : "Recently"}

                      </span>

                    </div>

                  )
                )}

            </div>

          </section>

        )}


      </main>

    </div>

  );

}

export default SalonDashboard;