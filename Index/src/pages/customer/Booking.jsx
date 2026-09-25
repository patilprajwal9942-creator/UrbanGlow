import { useLocation, useNavigate } from "react-router-dom";
import { bookingAPI } from "../../services/api";
import "../../styles/Booking.css";

function Booking() {
  const location = useLocation();
  const navigate = useNavigate();

  // Data coming from BookingSlots.jsx
  const salon = location.state?.salon;
  const service = location.state?.service;
  const slot = location.state?.slot;

  // Logged-in customer
  const user = JSON.parse(
    localStorage.getItem("user")
  );

  // ==============================
  // Missing information
  // ==============================

  if (!salon || !service || !slot) {
    return (
      <div className="booking-page">
        <div className="missing-info">
          <h2>Booking information missing</h2>
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // ==============================
  // Confirm Booking
  // ==============================

  async function handleBooking() {
    if (!user?._id) {
      alert("Please login first");
      navigate("/login");
      return;
    }

    try {
      const response = await bookingAPI.create({
        customerId: user._id,
        salonId: salon._id,
        serviceId: service._id,
        slotId: slot._id,
      });

      alert(
        response.data.message ||
        "Booking confirmed successfully"
      );

      // Go to customer's bookings
      navigate("/my-bookings");

    } catch (error) {
      console.error("Booking Error:", error);

      alert(
        error.response?.data?.message ||
        "Booking failed"
      );
    }
  }

  return (
    <div className="booking-page">

      <header className="booking-header">
        <h1>Confirm Booking</h1>
      </header>

      <div className="divider" />

      {/* ==============================
          SALON
      ============================== */}

      <section className="booking-section">
        <h2>Salon Details</h2>

        <div className="detail-row">
          <span className="detail-label">Salon:</span>
          <span className="detail-value">{salon.salonName}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Address:</span>
          <span className="detail-value">{salon.address}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Phone:</span>
          <span className="detail-value">{salon.phone}</span>
        </div>
      </section>

      {/* ==============================
          SERVICE
      ============================== */}

      <section className="booking-section">
        <h2>Service Details</h2>

        <div className="detail-row">
          <span className="detail-label">Service:</span>
          <span className="detail-value">{service.serviceName}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Price:</span>
          <span className="detail-value">₹{service.price}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Duration:</span>
          <span className="detail-value">{service.duration} minutes</span>
        </div>
      </section>

      {/* ==============================
          APPOINTMENT
      ============================== */}

      <section className="booking-section">
        <h2>Appointment Details</h2>

        <div className="detail-row">
          <span className="detail-label">Date:</span>
          <span className="detail-value">{slot.date}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Time:</span>
          <span className="detail-value">{slot.startTime} - {slot.endTime}</span>
        </div>
      </section>

      {/* ==============================
          CUSTOMER
      ============================== */}

      <section className="booking-section">
        <h2>Customer Details</h2>

        <div className="detail-row">
          <span className="detail-label">Name:</span>
          <span className="detail-value">{user?.name}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Email:</span>
          <span className="detail-value">{user?.email}</span>
        </div>
      </section>

      {/* ==============================
          FINAL BUTTON
      ============================== */}

      <div className="booking-total">
        <h2>Total: ₹{service.price}</h2>
      </div>

      <div className="booking-actions">
        <button className="btn btn-primary" onClick={handleBooking}>
          Confirm Booking
        </button>

        <button className="btn btn-outline" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>

    </div>
  );
}

export default Booking;