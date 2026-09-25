import { NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaChartLine,
  FaStore,
  FaUsers,
  FaCalendarCheck,
  FaFileInvoiceDollar,
} from "react-icons/fa";
import "../../styles/admin/AdminLayout.css";

const NAV_ITEMS = [
  {
    to: "/admin/dashboard",
    label: "Dashboard",
    icon: FaTachometerAlt,
  },
  {
    to: "/admin/analytics",
    label: "Analytics",
    icon: FaChartLine,
  },
  {
    to: "/admin/salons",
    label: "Salon Management",
    icon: FaStore,
  },
  {
    to: "/admin/users",
    label: "User Management",
    icon: FaUsers,
  },
  {
    to: "/admin/bookings",
    label: "Booking Management",
    icon: FaCalendarCheck,
  },
  {
    to: "/admin/transactions",
    label: "Transactions",
    icon: FaFileInvoiceDollar,
  },
];

function AdminSidebar({
  isOpen,
  onNavigate,
}) {
  return (
    <aside
      className={`admin-sidebar ${
        isOpen ? "open" : ""
      }`}
    >

      <div className="admin-sidebar-brand">

        <span className="admin-sidebar-logo">
          UG
        </span>

        <span className="admin-sidebar-title">
          UrbanGlow Admin
        </span>

      </div>

      <nav className="admin-sidebar-nav">

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `admin-sidebar-link ${
                  isActive ? "active" : ""
                }`
              }
            >
              <Icon className="admin-sidebar-icon" />

              <span>{item.label}</span>
            </NavLink>
          );
        })}

      </nav>

    </aside>
  );
}

export default AdminSidebar;