import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  
} from "recharts";
import { salonAPI, analyticsAPI } from "../../services/api";
import "./SalonAnalytics.css";
import { MdArrowBack } from "react-icons/md";

function SalonAnalytics() {
  const navigate = useNavigate();

  const [salon, setSalon] = useState(null);
  const [overview, setOverview] = useState(null);
  const [daily, setDaily] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH DASHBOARD DATA
  // ==========================================

  async function fetchDashboard() {
    try {
      setLoading(true);
      setError("");

      let salonData;

      try {
        const salonResponse = await salonAPI.getMySalon();

        salonData =
          salonResponse.data?.salon ||
          salonResponse.data?.data ||
          salonResponse.data;
      } catch (salonError) {
        // Backend returns 404 when the current user has no salon yet.
        if (salonError.response?.status === 404) {
          setSalon(null);
          setLoading(false);
          return;
        }

        throw salonError;
      }

      if (!salonData?._id) {
        setSalon(null);
        setLoading(false);
        return;
      }

      setSalon(salonData);

      const [overviewResponse, dailyResponse, transactionsResponse] = await Promise.all([
        analyticsAPI.getOverview(salonData._id),
        analyticsAPI.getDaily(salonData._id, { days: 14 }),
        analyticsAPI.getTransactions(salonData._id, { filter: "all", page: 1, limit: 5 }),
      ]);

      setOverview(overviewResponse.data);
      setDaily(dailyResponse.data?.data || []);
      setRecentTransactions(transactionsResponse.data?.transactions || []);

    } catch (error) {
      console.error("Fetch Analytics Error:", error);

      setError(
        error.response?.data?.message ||
        "Failed to load dashboard data"
      );

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Defer to the next microtask so the setState calls at the top of
    // fetchDashboard (before its first await) don't run synchronously
    // within this effect.
    queueMicrotask(() => {
      fetchDashboard();
    });
  }, []);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="salon-analytics-page">
        <div className="loading-state">
          <h2>Loading dashboard...</h2>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="salon-analytics-page">
        <div className="error-state">
          <h2>Failed to load dashboard data</h2>
          <p>{error}</p>
          <button className="btn-retry" onClick={fetchDashboard}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // NO SALON
  // ==========================================

  if (!salon) {
    return (
      <div className="salon-analytics-page">
        <div className="no-salon">
          <h2>No Salon Profile Found</h2>
          <p>Create your salon profile to see analytics and income.</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="salon-analytics-page">
      <button
  className="owner-back-btn"
  onClick={() => navigate("/salon/dashboard")}
>
  <MdArrowBack />
  Back to Dashboard
</button>

      <header className="analytics-header">
        <h1>Analytics &amp; Income</h1>
        <p className="salon-name">{salon.salonName}</p>
      </header>

      {/* TODAY */}
      <section className="analytics-section">
        <h2 className="section-title">Today</h2>

        <div className="stat-grid">
          <div className="stat-card income">
            <span className="stat-label">Total Income</span>
            <span className="stat-value">₹{overview?.today?.totalIncome ?? 0}</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Customers Served</span>
            <span className="stat-value">{overview?.today?.customersServed ?? 0}</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Completed Bookings</span>
            <span className="stat-value">{overview?.today?.completedBookings ?? 0}</span>
          </div>

          <div className="stat-card pending">
            <span className="stat-label">Pending Requests</span>
            <span className="stat-value">{overview?.today?.pendingRequests ?? 0}</span>
          </div>
        </div>
      </section>

      {/* CURRENT MONTH */}
      <section className="analytics-section">
        <h2 className="section-title">Current Month</h2>

        <div className="stat-grid">
          <div className="stat-card income">
            <span className="stat-label">Monthly Income</span>
            <span className="stat-value">₹{overview?.thisMonth?.monthlyIncome ?? 0}</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Completed Customers</span>
            <span className="stat-value">{overview?.thisMonth?.completedCustomers ?? 0}</span>
          </div>

          <div className="stat-card cancelled">
            <span className="stat-label">Cancelled Bookings</span>
            <span className="stat-value">{overview?.thisMonth?.cancelledBookings ?? 0}</span>
          </div>
        </div>
      </section>

      {/* OVERALL ANALYTICS */}
      <section className="analytics-section">
        <h2 className="section-title">Overall Salon Analytics</h2>

        <div className="stat-grid">
          <div className="stat-card income">
            <span className="stat-label">Total Income</span>
            <span className="stat-value">₹{overview?.overall?.totalIncome ?? 0}</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Total Customers Served</span>
            <span className="stat-value">{overview?.overall?.totalCustomersServed ?? 0}</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Total Completed Bookings</span>
            <span className="stat-value">{overview?.overall?.totalCompletedBookings ?? 0}</span>
          </div>

          <div className="stat-card cancelled">
            <span className="stat-label">Total Cancelled Bookings</span>
            <span className="stat-value">{overview?.overall?.totalCancelledBookings ?? 0}</span>
          </div>
        </div>
      </section>

      {/* BOOKING STATUS */}
      <section className="analytics-section">
        <h2 className="section-title">Booking Status</h2>

        <div className="status-grid">
          <div className="status-pill pending">
            Pending: {overview?.statusSummary?.pending ?? 0}
          </div>

          <div className="status-pill confirmed">
            Confirmed: {overview?.statusSummary?.confirmed ?? 0}
          </div>

          <div className="status-pill completed">
            Completed: {overview?.statusSummary?.completed ?? 0}
          </div>

          <div className="status-pill cancelled">
            Cancelled: {overview?.statusSummary?.cancelled ?? 0}
          </div>
        </div>
      </section>

      {/* INCOME ANALYTICS */}
      <section className="analytics-section">
        <h2 className="section-title">Income Analytics</h2>

        {daily.length === 0 ? (
          <p className="empty-message">No income data yet.</p>
        ) : (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e5e8" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`₹${value}`, "Income"]} />
                <Bar dataKey="income" fill="#D97706" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* RECENT TRANSACTIONS */}
      <section className="analytics-section">
        <div className="section-header-row">
          <h2 className="section-title">Recent Transactions</h2>

          <button
            className="btn-view-all"
            onClick={() => navigate("/salon/transactions")}
          >
            View All Transactions
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <p className="empty-message">No completed bookings yet.</p>
        ) : (
          <div className="transaction-list">
            {recentTransactions.map((tx) => (
              <div key={tx.bookingId} className="transaction-row">
                <div className="transaction-main">
                  <span className="transaction-customer">{tx.customerName}</span>
                  <span className="transaction-service">{tx.serviceName}</span>
                </div>

                <div className="transaction-meta">
                  <span className="transaction-date">{tx.appointmentDate}</span>
                  <span className="transaction-status">Completed</span>
                </div>

                <div className="transaction-amount">₹{tx.amount}</div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}

export default SalonAnalytics;