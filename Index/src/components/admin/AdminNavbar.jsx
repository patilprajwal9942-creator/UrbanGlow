import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBars,
  FaSignOutAlt,
} from "react-icons/fa";
import { AuthContext } from "../../context/AuthContext";
import "../../styles/admin/AdminLayout.css";

function AdminNavbar({
  title,
  onToggleSidebar,
}) {
  const navigate = useNavigate();
  const { user, logout } =
    useContext(AuthContext);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <header className="admin-navbar">

      <div className="admin-navbar-left">

        <button
          className="admin-sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle menu"
          type="button"
        >
          <FaBars />
        </button>

        <h1 className="admin-navbar-title">
          {title}
        </h1>

      </div>

      <div className="admin-navbar-user">

        <div className="admin-navbar-user-info">

          <span className="admin-navbar-name">
            {user?.name || "Admin"}
          </span>

          <span className="admin-navbar-role">
            {user?.role || "admin"}
          </span>

        </div>

        <button
          className="admin-navbar-logout"
          onClick={handleLogout}
          type="button"
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>

      </div>

    </header>
  );
}

export default AdminNavbar;