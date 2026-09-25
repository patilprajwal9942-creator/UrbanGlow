import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FiHome,
  FiCalendar,
  FiHeart,
  FiUser,
  FiBell,
  FiHelpCircle,
  FiLogOut,
  FiSearch,
  FiMapPin,
  FiChevronRight,
  FiScissors,
  FiClock,
  FiArrowRight,
} from "react-icons/fi";

import { salonAPI } from "../../services/api";

import "../../styles/CustomerDashboard.css";

function CustomerDashboard() {
  const navigate = useNavigate();

  const storedUser =
    localStorage.getItem("user");

  const user = storedUser
    ? JSON.parse(storedUser)
    : null;

  const [search, setSearch] =
    useState("");

  // ==========================================
  // NEARBY SALON STATE
  // ==========================================

  const [nearbySalons, setNearbySalons] =
    useState([]);

  const [locationLoading, setLocationLoading] =
    useState(false);

  const [locationError, setLocationError] =
    useState("");

  // ==========================================
  // LOGOUT
  // ==========================================

  function logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    navigate("/login", {
      replace: true,
    });
  }

  // ==========================================
  // NORMAL SEARCH
  // ==========================================

  function handleSearch() {
    const value =
      search.trim();

    if (!value) return;

    navigate("/", {
      state: {
        search: value,
      },
    });
  }

  // ==========================================
  // FIND NEARBY SALONS
  // ==========================================

  function handleNearMe() {
    if (!navigator.geolocation) {
      setLocationError(
        "Geolocation is not supported by your browser."
      );

      return;
    }

    setLocationLoading(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const {
            latitude,
            longitude,
          } = position.coords;

          console.log(
            "Customer Latitude:",
            latitude
          );

          console.log(
            "Customer Longitude:",
            longitude
          );

          // ==========================================
          // 10 KM SEARCH
          // ==========================================

          const response =
            await salonAPI.getNearby(
              latitude,
              longitude,
              10000
            );

          console.log(
            "Nearby Salon Response:",
            response.data
          );

          setNearbySalons(
            response.data.salons || []
          );
        } catch (error) {
          console.error(
            "Nearby Salon Error:",
            error.response?.data ||
              error
          );

          setLocationError(
            error.response?.data
              ?.message ||
              "Unable to find nearby salons."
          );
        } finally {
          setLocationLoading(
            false
          );
        }
      },

      (error) => {
        console.error(
          "Customer Location Error:",
          error
        );

        setLocationLoading(
          false
        );

        if (error.code === 1) {
          setLocationError(
            "Please allow location access to find nearby salons."
          );
        } else if (
          error.code === 2
        ) {
          setLocationError(
            "Your location could not be determined."
          );
        } else if (
          error.code === 3
        ) {
          setLocationError(
            "Location request timed out. Please try again."
          );
        } else {
          setLocationError(
            "Unable to get your current location."
          );
        }
      },

      {
        enableHighAccuracy: true,

        timeout: 10000,

        maximumAge: 0,
      }
    );
  }

  return (
    <div className="customer-dashboard">

      {/* ==========================================
          SIDEBAR
      ========================================== */}

      <aside className="customer-sidebar">

        <div className="customer-logo">

          <div className="customer-logo-mark">
            U
          </div>

          <div>
            <h2>
              UrbanGlow
            </h2>

            <span>
              Beauty & Wellness
            </span>
          </div>

        </div>

        <nav className="customer-nav">

          <p className="nav-section-title">
            MENU
          </p>

          <button
            className="customer-nav-item active"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <FiHome />
            <span>
              Home
            </span>
          </button>

          <button
            className="customer-nav-item"
            onClick={() =>
              navigate(
                "/my-bookings"
              )
            }
          >
            <FiCalendar />
            <span>
              My Bookings
            </span>
          </button>

          <button
            className="customer-nav-item"
            onClick={() =>
              navigate("/")
            }
          >
            <FiHeart />
            <span>
              Favorites
            </span>
          </button>

          <button
            className="customer-nav-item"
            onClick={() =>
              navigate(
                "/services"
              )
            }
          >
            <FiScissors />
            <span>
              Services
            </span>
          </button>

          <p className="nav-section-title nav-section-space">
            ACCOUNT
          </p>

          <button
            className="customer-nav-item"
            onClick={() => {
              console.log(
                "Profile clicked"
              );
            }}
          >
            <FiUser />
            <span>
              Profile
            </span>
          </button>

          <button
            className="customer-nav-item"
            onClick={() =>
              navigate(
                "/customer/notifications"
              )
            }
          >
            <FiBell />

            <span>
              Notifications
            </span>

            <span className="notification-badge">
              2
            </span>
          </button>

          <button
            className="customer-nav-item"
            onClick={() =>
              navigate("/help")
            }
          >
            <FiHelpCircle />

            <span>
              Help & Support
            </span>
          </button>

        </nav>

        <div className="sidebar-bottom">

          <button
            className="customer-nav-item logout-nav"
            onClick={logout}
          >
            <FiLogOut />

            <span>
              Logout
            </span>
          </button>

        </div>

      </aside>

      {/* ==========================================
          MAIN
      ========================================== */}

      <main className="customer-main">

        {/* TOPBAR */}

        <header className="customer-topbar">

          <div className="mobile-brand">

            <div className="customer-logo-mark">
              U
            </div>

            <strong>
              UrbanGlow
            </strong>

          </div>

          <div className="topbar-search">

            <FiSearch />

            <input
              type="text"
              placeholder="Search salons, services..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              onKeyDown={(e) => {
                if (
                  e.key === "Enter"
                ) {
                  handleSearch();
                }
              }}
            />

          </div>

          <div className="topbar-actions">

            <button
              className="topbar-icon-btn"
              aria-label="Notifications"
              onClick={() =>
                navigate(
                  "/customer/notifications"
                )
              }
            >
              <FiBell />

              <span className="notification-dot"></span>
            </button>

            <div className="topbar-profile">

              <div className="profile-avatar">
                {user?.name
                  ?.charAt(0)
                  ?.toUpperCase() ||
                  "U"}
              </div>

              <div className="profile-info">

                <strong>
                  {user?.name ||
                    "User"}
                </strong>

                <span>
                  Customer
                </span>

              </div>

            </div>

          </div>

        </header>

        <div className="customer-content">

          {/* ==========================================
              WELCOME
          ========================================== */}

          <section className="welcome-section">

            <div>

              <p className="welcome-label">
                WELCOME BACK 👋
              </p>

              <h1>
                Hello,{" "}
                {user?.name ||
                  "there"}
                !
              </h1>

              <p className="welcome-description">
                Discover your next
                beauty experience and
                book your favorite
                services with ease.
              </p>

            </div>

            <button
              className="primary-action"
              onClick={() =>
                navigate("/")
              }
            >
              Explore Salons
              <FiArrowRight />
            </button>

          </section>

          {/* ==========================================
              SEARCH
          ========================================== */}

          <section className="dashboard-search-card">

            <div className="search-card-heading">

              {/* ======================================
                  CLICKABLE LOCATION BUTTON
              ====================================== */}

              <button
                type="button"
                className="search-card-icon"
                onClick={
                  handleNearMe
                }
                disabled={
                  locationLoading
                }
                aria-label="Find salons near me"
                title="Find salons near me"
              >
                <FiMapPin />
              </button>

              <div>

                <h3>
                  Find your perfect
                  salon
                </h3>

                <p>
                  Search for salons
                  and beauty services
                  near you
                </p>

              </div>

            </div>

            <div className="large-search">

              <FiSearch />

              <input
                type="text"
                placeholder="Search salon name or location..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter"
                  ) {
                    handleSearch();
                  }
                }}
              />

              <button
                onClick={
                  handleSearch
                }
              >
                Search
              </button>

            </div>

            {/* LOCATION STATUS */}

            {locationLoading && (
              <p className="location-status">
                Finding salons near
                you...
              </p>
            )}

            {locationError && (
              <p className="location-error">
                {locationError}
              </p>
            )}

          </section>

          {/* ==========================================
              NEARBY SALONS
          ========================================== */}

          {nearbySalons.length > 0 && (
            <section className="dashboard-section">

              <div className="section-heading">

                <div>

                  <h2>
                    Salons Near You
                  </h2>

                  <p>
                    Nearest salons based
                    on your current
                    location
                  </p>

                </div>

                <button
                  className="view-all-btn"
                  onClick={() =>
                    navigate("/")
                  }
                >
                  View All
                  <FiArrowRight />
                </button>

              </div>

              <div className="services-grid">

                {nearbySalons.map(
                  (salon) => (
                    <button
                      key={
                        salon._id
                      }
                      className="service-card"
                      onClick={() =>
                        navigate(
                          `/salon/${salon._id}`
                        )
                      }
                    >

                      <div className="service-card-icon pink-bg">
                        <FiMapPin />
                      </div>

                      <div>

                        <h3>
                          {
                            salon.salonName
                          }
                        </h3>

                        <p>
                          {
                            salon.address
                          }
                        </p>

                      </div>

                      <span>
                        {salon.distanceKm}{" "}
                        km
                      </span>

                    </button>
                  )
                )}

              </div>

            </section>
          )}

          {/* ==========================================
              NO NEARBY SALONS
          ========================================== */}

          {!locationLoading &&
            nearbySalons.length ===
              0 &&
            !locationError && (
              <section className="dashboard-section">

                <div className="nearby-hint">

                  <FiMapPin />

                  <div>

                    <h3>
                      Find salons near
                      you
                    </h3>

                    <p>
                      Click the location
                      icon above to
                      discover salons
                      within 10 km of
                      your current
                      location.
                    </p>

                  </div>

                </div>

              </section>
            )}

          {/* ==========================================
              QUICK ACTIONS
          ========================================== */}

          <section className="dashboard-section">

            <div className="section-heading">

              <div>

                <h2>
                  Quick Actions
                </h2>

                <p>
                  Everything you need,
                  right at your
                  fingertips
                </p>

              </div>

            </div>

            <div className="quick-actions">

              <button
                className="quick-action-card"
                onClick={() =>
                  navigate("/")
                }
              >
                <div className="quick-action-icon pink">
                  <FiSearch />
                </div>

                <div>
                  <h3>
                    Browse Salons
                  </h3>

                  <p>
                    Find salons near
                    you
                  </p>
                </div>

                <FiChevronRight className="quick-arrow" />
              </button>

              <button
                className="quick-action-card"
                onClick={() =>
                  navigate(
                    "/my-bookings"
                  )
                }
              >
                <div className="quick-action-icon teal">
                  <FiCalendar />
                </div>

                <div>
                  <h3>
                    My Bookings
                  </h3>

                  <p>
                    View your
                    appointments
                  </p>
                </div>

                <FiChevronRight className="quick-arrow" />
              </button>

              <button
                className="quick-action-card"
                onClick={() =>
                  navigate(
                    "/services"
                  )
                }
              >
                <div className="quick-action-icon purple">
                  <FiScissors />
                </div>

                <div>
                  <h3>
                    Explore Services
                  </h3>

                  <p>
                    Discover beauty
                    services
                  </p>
                </div>

                <FiChevronRight className="quick-arrow" />
              </button>

            </div>

          </section>

          {/* ==========================================
              POPULAR SERVICES
          ========================================== */}

          <section className="dashboard-section">

            <div className="section-heading">

              <div>

                <h2>
                  Popular Services
                </h2>

                <p>
                  Services customers
                  love
                </p>

              </div>

              <button
                className="view-all-btn"
                onClick={() =>
                  navigate(
                    "/services"
                  )
                }
              >
                View All
                <FiArrowRight />
              </button>

            </div>

            <div className="services-grid">

              <button
                className="service-card"
                onClick={() =>
                  navigate(
                    "/services"
                  )
                }
              >
                <div className="service-card-icon pink-bg">
                  ✂️
                </div>

                <div>
                  <h3>
                    Hair Styling
                  </h3>

                  <p>
                    Haircuts & styling
                  </p>
                </div>

                <span>
                  Explore
                </span>
              </button>

              <button
                className="service-card"
                onClick={() =>
                  navigate(
                    "/services"
                  )
                }
              >
                <div className="service-card-icon teal-bg">
                  💆
                </div>

                <div>
                  <h3>
                    Spa & Massage
                  </h3>

                  <p>
                    Relax & refresh
                  </p>
                </div>

                <span>
                  Explore
                </span>
              </button>

              <button
                className="service-card"
                onClick={() =>
                  navigate(
                    "/services"
                  )
                }
              >
                <div className="service-card-icon purple-bg">
                  💅
                </div>

                <div>
                  <h3>
                    Nail Care
                  </h3>

                  <p>
                    Manicure & pedicure
                  </p>
                </div>

                <span>
                  Explore
                </span>
              </button>

              <button
                className="service-card"
                onClick={() =>
                  navigate(
                    "/services"
                  )
                }
              >
                <div className="service-card-icon orange-bg">
                  ✨
                </div>

                <div>
                  <h3>
                    Beauty Care
                  </h3>

                  <p>
                    Facial & skincare
                  </p>
                </div>

                <span>
                  Explore
                </span>
              </button>

            </div>

          </section>

          {/* ==========================================
              FEATURED SALONS
          ========================================== */}

          <section className="dashboard-section">

            <div className="section-heading">

              <div>

                <h2>
                  Featured Salons
                </h2>

                <p>
                  Discover popular
                  salons on UrbanGlow
                </p>

              </div>

              <button
                className="view-all-btn"
                onClick={() =>
                  navigate("/")
                }
              >
                View All
                <FiArrowRight />
              </button>

            </div>

            <div className="featured-salon-placeholder">

              <div className="placeholder-icon">
                🏪
              </div>

              <h3>
                Discover amazing
                salons
              </h3>

              <p>
                Browse available
                salons and find the
                perfect place for your
                next appointment.
              </p>

              <button
                className="secondary-action"
                onClick={() =>
                  navigate("/")
                }
              >
                Browse Salons
                <FiArrowRight />
              </button>

            </div>

          </section>

          {/* ==========================================
              UPCOMING BOOKINGS
          ========================================== */}

          <section className="dashboard-section">

            <div className="section-heading">

              <div>

                <h2>
                  Upcoming Bookings
                </h2>

                <p>
                  Your next
                  appointments
                </p>

              </div>

              <button
                className="view-all-btn"
                onClick={() =>
                  navigate(
                    "/my-bookings"
                  )
                }
              >
                View All
                <FiArrowRight />
              </button>

            </div>

            <div className="upcoming-empty">

              <div className="upcoming-icon">
                <FiClock />
              </div>

              <div>

                <h3>
                  No upcoming
                  bookings
                </h3>

                <p>
                  You don't have any
                  upcoming
                  appointments. Book
                  your next beauty
                  experience today.
                </p>

              </div>

              <button
                onClick={() =>
                  navigate("/")
                }
                className="secondary-action"
              >
                Book Appointment
              </button>

            </div>

          </section>

        </div>

      </main>

    </div>
  );
}

export default CustomerDashboard;