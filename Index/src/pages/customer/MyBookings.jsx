import { useEffect, useState } from "react";
import { bookingAPI } from "../../services/api";
import { useNavigate } from "react-router-dom";
import "../../styles/MyBookings.css";

function MyBookings() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchBookings() {
      if (!user?._id) {
        setError("Please login first");
        setLoading(false);
        return;
      }

      try {
        const response = await bookingAPI.getByCustomer(user._id);

        setBookings(response.data);
      } catch (error) {
        console.error(error);

        setError(
          error.response?.data?.message ||
          "Failed to load bookings"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchBookings();
  }, [user?._id]);

  async function cancelBooking(bookingId) {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this booking?"
    );

    if (!confirmCancel) {
      return;
    }

    try {
      const response = await bookingAPI.updateStatus(bookingId, "cancelled");

      alert(
        response.data.message ||
        "Booking cancelled successfully"
      );

      setBookings((prev) =>
        prev.map((booking) =>
          booking._id === bookingId
            ? response.data.booking
            : booking
        )
      );

    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
        "Failed to cancel booking"
      );
    }
  }

  if (loading) {
    return (
      <div className="my-bookings-page">
        <div className="loading-state">
          <h2>Loading your bookings...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-bookings-page">
        <div className="error-state">
          <h2>{error}</h2>
          <button className="btn btn-primary" onClick={() => navigate("/login")}>
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-bookings-page">

      <header className="my-bookings-header">
        <h1>My Bookings</h1>
        <p>Welcome, {user?.name}</p>
      </header>

      <div className="divider" />

      {bookings.length === 0 ? (
        <div className="empty-state">
          <h2>No bookings yet</h2>
          <p>You have not booked any appointment.</p>
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            Find a Salon
          </button>
        </div>
      ) : (
        bookings.map((booking) => (
          <article key={booking._id} className="booking-card">
            <header className="booking-card-header">
              <div className="booking-salon">
                <h2>{booking.salonId?.salonName}</h2>
                <p>Address: {booking.salonId?.address}</p>
                <p>Phone: {booking.salonId?.phone}</p>
              </div>
              <span className={`booking-status status-${booking.status}`}>
                {booking.status}
              </span>
            </header>

            <div className="booking-details">
              <div className="booking-detail-group">
                <h3>Service</h3>
                <p>{booking.serviceId?.serviceName}</p>
                <p>Price: ₹{booking.serviceId?.price}</p>
                <p>Duration: {booking.serviceId?.duration} minutes</p>
              </div>

              <div className="booking-detail-group">
                <h3>Appointment</h3>
                <p>Date: {booking.slotId?.date}</p>
                <p>Time: {booking.slotId?.startTime} - {booking.slotId?.endTime}</p>
              </div>
            </div>

            <div className="booking-status-message">
              {booking.status === "pending" && (
                <p>🟡 Booking request sent. Waiting for salon confirmation.</p>
              )}
              {booking.status === "confirmed" && (
                <p>🟢 Your appointment is confirmed.</p>
              )}
              {booking.status === "cancelled" && (
                <p>🔴 Your booking has been cancelled.</p>
              )}
              {booking.status === "completed" && (
                <p>🔵 Your appointment has been completed.</p>
              )}
            </div>

            <footer className="booking-actions">
              {(booking.status === "pending" || booking.status === "confirmed") && (
                <button
                  className="btn btn-danger"
                  onClick={() => cancelBooking(booking._id)}
                >
                  Cancel Booking
                </button>
              )}
            </footer>
          </article>
        ))
      )}

    </div>
  );
}

export default MyBookings;