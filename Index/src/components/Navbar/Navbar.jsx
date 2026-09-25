import { Link, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { notificationAPI } from "../../services/api";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();

  // Get user and logout from AuthContext
  const { user, logout } = useContext(AuthContext);

  const [unreadCount, setUnreadCount] = useState(0);

  // Logout
  const handleLogout = async () => {
    await logout();

    navigate("/login");
  };

  // Get unread notifications
  useEffect(() => {
    async function fetchUnreadCount() {
      if (!user) return;

      try {
        const response = await notificationAPI.getUnread();

        setUnreadCount(response.data.unreadCount || 0);
      } catch (error) {
        console.log("Error fetching unread count:", error);
      }
    }

    fetchUnreadCount();
  }, [user]);

  return (
    <nav className="navbar">

      {/* Logo */}
      <Link to="/" className="navbar-logo">
        <span>Urban</span>Glow
      </Link>

      {/* Navigation */}
      <div className="navbar-links">

        <Link to="/" className="navbar-link">
          Home
        </Link>

        <Link to="/services" className="navbar-link">
          Services
        </Link>

        <Link to="/about" className="navbar-link">
          About
        </Link>

        <Link to="/contact" className="navbar-link">
          Contact
        </Link>

        {/* Customer Dashboard */}
        {user?.role === "customer" && (
          <Link to="/dashboard" className="navbar-link">
            Dashboard
          </Link>
        )}

        {/* Salon Dashboard */}
        {user?.role === "salon" && (
          <Link to="/salon/dashboard" className="navbar-link">
            Dashboard
          </Link>
        )}

        {/* Admin Dashboard */}
        {user?.role === "admin" && (
          <Link to="/admin/dashboard" className="navbar-link">
            Admin Dashboard
          </Link>
        )}

      </div>

      {/* Right Side */}
      <div className="navbar-right">

        {user ? (
          <>
            {/* Notification Button */}
            <button
              className="notification-button"
              onClick={() => navigate("/notifications")}
            >
              🔔

              {unreadCount > 0 && (
                <span className="notification-badge">
                  {unreadCount}
                </span>
              )}
            </button>


            {/* Profile */}
            <div className="profile-box">

              <div className="profile-icon">
                {user.name?.charAt(0).toUpperCase()}
              </div>

              <div className="profile-text">

                <span className="welcome-text">
                  Welcome back
                </span>

                <strong>
                  {user.name}
                </strong>

              </div>

            </div>


            {/* Logout */}
            <button
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>

          </>
        ) : (
          <>
            <Link to="/login" className="login-button">
              Login
            </Link>

            <Link to="/register" className="register-button">
              Register
            </Link>
          </>
        )}

      </div>

    </nav>
  );
}

export default Navbar;