import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, role }) {
  const storedUser = localStorage.getItem("user");

  // User is not logged in
  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  let user;

  try {
    user = JSON.parse(storedUser);
  } catch (error) {
    console.error("Invalid user data in localStorage:", error);

    localStorage.removeItem("user");
    localStorage.removeItem("token");

    return <Navigate to="/login" replace />;
  }

  // User data exists but role is missing
  if (!user?.role) {
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    return <Navigate to="/login" replace />;
  }

  // User has the wrong role
  if (role && user.role !== role) {
    if (user.role === "customer") {
      return <Navigate to="/dashboard" replace />;
    }

    if (user.role === "salon") {
      return <Navigate to="/salon/dashboard" replace />;
    }

    if (user.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    // Unknown role
    return <Navigate to="/login" replace />;
  }

  // Authorized user
  return children;
}

export default ProtectedRoute;