import { useEffect, useState } from "react";
import { salonAPI, slotAPI } from "../../services/api";
import "../../styles/ManageSlots.css";
import { useNavigate } from "react-router-dom";
import { MdArrowBack } from "react-icons/md";

function ManageSlots() {
  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const navigate = useNavigate();

  const [salon, setSalon] = useState(null);

  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [slots, setSlots] = useState([]);

  const [loading, setLoading] = useState(true);

  // Find owner's salon using my-salon endpoint
  useEffect(() => {
    async function fetchSalon() {
      try {
        const response = await salonAPI.getMySalon();

        setSalon(response.data.salon);
      } catch (error) {
        console.log("Fetch salon error:", error);
      } finally {
        setLoading(false);
      }
    }

    // FIX: backend user has "id", not "_id"
    if (user?.id) {
      fetchSalon();
    }
  }, [user?.id]);

  // Get salon slots
  useEffect(() => {
    async function fetchSlots() {
      if (!salon?._id) return;

      try {
        const response = await slotAPI.getBySalon(
          salon._id
        );

        setSlots(response.data);
      } catch (error) {
        console.log(error);
      }
    }

    fetchSlots();
  }, [salon]);

  async function handleAddSlot(e) {
    e.preventDefault();

    if (!salon?._id) {
      alert("Salon not found");
      return;
    }

    try {
      const response = await slotAPI.create({
        salonId: salon._id,
        date,
        startTime,
        endTime,
      });

      setSlots((prev) => [
        ...prev,
        response.data.slot,
      ]);

      setStartTime("");
      setEndTime("");

      alert("Slot added successfully");

    } catch (error) {
      console.log(error);

      alert(
        error.response?.data?.message ||
        "Failed to add slot"
      );
    }
  }

  if (loading) {
    return (
      <div className="manage-slots-page">
        <div className="loading-state">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="manage-slots-page">
        <div className="no-salon">
          <h2>No salon found</h2>
          <p>Please create your salon first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-slots-page">

      <header className="manage-slots-header">

        <button
          className="owner-back-btn"
          onClick={() =>
            navigate("/salon/dashboard")
          }
        >
          <MdArrowBack />
          Back to Dashboard
        </button>

        <h1>Manage Slots</h1>

        <p className="salon-name">
          {salon.salonName}
        </p>

      </header>

      <form
        className="add-slot-form"
        onSubmit={handleAddSlot}
      >

        <div className="form-row">

          <div className="form-group">

            <label>Date</label>

            <input
              type="date"
              value={date}
              onChange={(e) =>
                setDate(e.target.value)
              }
              required
            />

          </div>

          <div className="form-group">

            <label>Start Time</label>

            <input
              type="time"
              value={startTime}
              onChange={(e) =>
                setStartTime(e.target.value)
              }
              required
            />

          </div>

          <div className="form-group">

            <label>End Time</label>

            <input
              type="time"
              value={endTime}
              onChange={(e) =>
                setEndTime(e.target.value)
              }
              required
            />

          </div>

        </div>

        <div className="form-actions">

          <button
            type="submit"
            className="btn btn-primary"
          >
            Add Slot
          </button>

        </div>

      </form>

      <hr className="section-divider" />

      <h2 className="section-title">
        Available Slots
      </h2>

      {slots.length === 0 ? (
        <div className="empty-slots">
          <p>No slots available.</p>
        </div>
      ) : (
        <div className="slots-list">

          {slots.map((slot) => (
            <article
              key={slot._id}
              className="slot-item"
            >

              <div className="slot-info">

                <span className="slot-date">
                  <strong>Date:</strong>{" "}
                  {slot.date}
                </span>

                <span className="slot-time">
                  <strong>Time:</strong>{" "}
                  {slot.startTime} - {slot.endTime}
                </span>

                <span
                  className={`slot-status ${
                    slot.isBooked
                      ? "status-booked"
                      : "status-available"
                  }`}
                >
                  {slot.isBooked
                    ? "Booked"
                    : "Available"}
                </span>

              </div>

            </article>
          ))}

        </div>
      )}

    </div>
  );
}

export default ManageSlots;