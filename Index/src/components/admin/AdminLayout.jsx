import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminNavbar from "./AdminNavbar";
import "../../styles/admin/AdminLayout.css";

function AdminLayout({ title, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function closeSidebar() {
    setSidebarOpen(false);
  }

  function toggleSidebar() {
    setSidebarOpen((prev) => !prev);
  }

  return (
    <div className="admin-layout">

      {sidebarOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={closeSidebar}
        />
      )}

      <AdminSidebar
        isOpen={sidebarOpen}
        onNavigate={closeSidebar}
      />

      <div className="admin-layout-main">

        <AdminNavbar
          title={title}
          onToggleSidebar={toggleSidebar}
        />

        <main className="admin-layout-content">
          {children}
        </main>

      </div>

    </div>
  );
}

export default AdminLayout;