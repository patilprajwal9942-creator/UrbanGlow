import { Routes, Route } from "react-router-dom";

import ProtectedRoute from "../routes/Protectedroutes";

// ================= AUTH =================
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";

// ================= CUSTOMER =================
import HelpCenter from "../pages/customer/HelpCenter";

import Services from "../pages/customer/Services.jsx";
import CustomerHome from "../pages/customer/CustomerHome";
import About from "../pages/About";
import Contact from "../pages/Contact";
import SalonDetails from "../pages/customer/SalonDetails";
import BookingCalendar from "../pages/customer/BookingCalendar";
import CustomerDashboard from "../pages/customer/CustomerDashboard";
import BookingConfirm from "../pages/customer/BookingConfirm";
import MyBookings from "../pages/customer/MyBookings";
import CustomerNotifications from "../pages/customer/CustomerNotifications";
import CustomerSupport from "../pages/customer/CustomerSupport";

// ================= SALON OWNER =================
import SalonDashboard from "../pages/salon/SalonDashboard";
import ManageServices from "../pages/salon/ManageServices";
import ManageSlots from "../pages/salon/ManageSlots";
import CreateSalon from "../pages/salon/CreateSalon";
import SalonBookings from "../pages/salon/SalonBookings";
import WorkingHours from "../pages/salon/WorkingHours";
import SalonAnalytics from "../pages/salon/SalonAnalytics";
import TransactionHistory from "../pages/salon/TransactionHistory";
import SalonNotifications from "../pages/salon/SalonNotifications";

// ================= ADMIN =================
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminSalonAnalytics from "../pages/admin/AdminSalonAnalytics";
import AdminSalons from "../pages/admin/AdminSalons";
import AdminSalonDetails from "../pages/admin/AdminSalonDetails";
import AdminCustomers from "../pages/admin/AdminCustomers";
import AdminBookings from "../pages/admin/AdminBookings";
import AdminTransactions from "../pages/admin/AdminTransactions";

function AppRoutes() {
  return (
    <Routes>

      {/* ================= CUSTOMER PUBLIC ================= */}

      <Route
        path="/"
        element={<CustomerHome />}
      />

      <Route
        path="/services"
        element={<Services />}
      />

      <Route
        path="/about"
        element={<About />}
      />

      <Route
        path="/contact"
        element={<Contact />}
      />

      <Route
        path="/salon/:id"
        element={<SalonDetails />}
      />


      {/* ================= AUTH ================= */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      <Route
        path="/reset-password"
        element={<ResetPassword />}
      />


      {/* ================= CUSTOMER PROTECTED ================= */}

      {/* Customer Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="customer">
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />

      {/* Customer Notifications */}
      <Route
        path="/customer/notifications"
        element={
          <ProtectedRoute role="customer">
            <CustomerNotifications />
          </ProtectedRoute>
        }
      />

      {/* Booking Calendar */}
      <Route
        path="/booking"
        element={
          <ProtectedRoute role="customer">
            <BookingCalendar />
          </ProtectedRoute>
        }
      />

      {/* Booking Slots -
          now the same combined date+time+summary screen as /booking,
          kept as its own route so any existing bookmark/navigation
          to /booking/slots still resolves */}
      <Route
        path="/booking/slots"
        element={
          <ProtectedRoute role="customer">
            <BookingCalendar />
          </ProtectedRoute>
        }
      />

      {/* Booking Confirmation */}
      <Route
        path="/booking/confirm"
        element={
          <ProtectedRoute role="customer">
            <BookingConfirm />
          </ProtectedRoute>
        }
      />

      {/* My Bookings */}
      <Route
        path="/my-bookings"
        element={
          <ProtectedRoute role="customer">
            <MyBookings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/support"
        element={
          <ProtectedRoute role="customer">
            <CustomerSupport />
          </ProtectedRoute>
        }
      />

      <Route
  path="/help"
  element={
    <ProtectedRoute role="customer">
      <HelpCenter />
    </ProtectedRoute>
  }
/>


      {/* ================= SALON OWNER ================= */}

      <Route
        path="/salon/dashboard"
        element={
          <ProtectedRoute role="salon">
            <SalonDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/salon/create"
        element={
          <ProtectedRoute role="salon">
            <CreateSalon />
          </ProtectedRoute>
        }
      />

      <Route
        path="/salon/services"
        element={
          <ProtectedRoute role="salon">
            <ManageServices />
          </ProtectedRoute>
        }
      />

      <Route
        path="/salon/slots"
        element={
          <ProtectedRoute role="salon">
            <ManageSlots />
          </ProtectedRoute>
        }
      />

      <Route
        path="/salon/bookings"
        element={
          <ProtectedRoute role="salon">
            <SalonBookings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/salon/working-hours"
        element={
          <ProtectedRoute role="salon">
            <WorkingHours />
          </ProtectedRoute>
        }
      />

      <Route
        path="/salon/analytics"
        element={
          <ProtectedRoute role="salon">
            <SalonAnalytics />
          </ProtectedRoute>
        }
      />

      <Route
        path="/salon/transactions"
        element={
          <ProtectedRoute role="salon">
            <TransactionHistory />
          </ProtectedRoute>
        }
      />

      {/* Salon Owner Notifications */}
      <Route
        path="/notifications"
        element={
          <ProtectedRoute role="salon">
            <SalonNotifications />
          </ProtectedRoute>
        }
      />


      {/* ================= ADMIN ================= */}

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute role="admin">
            <AdminSalonAnalytics />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/salons"
        element={
          <ProtectedRoute role="admin">
            <AdminSalons />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/salons/:id"
        element={
          <ProtectedRoute role="admin">
            <AdminSalonDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute role="admin">
            <AdminCustomers />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/bookings"
        element={
          <ProtectedRoute role="admin">
            <AdminBookings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/transactions"
        element={
          <ProtectedRoute role="admin">
            <AdminTransactions />
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}

export default AppRoutes;