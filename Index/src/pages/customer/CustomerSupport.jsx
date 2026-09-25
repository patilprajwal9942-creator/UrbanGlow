import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supportAPI } from "../../services/api";
import "../../styles/CustomerSupport.css";

function CustomerSupport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const bookingId = searchParams.get("bookingId") || "";

  const [formData, setFormData] = useState({
    subject: "",
    category: "Booking",
    description: "",
    bookingId,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!formData.subject.trim()) {
      setError("Please enter a subject.");
      return;
    }

    if (!formData.description.trim()) {
      setError("Please describe your issue.");
      return;
    }

    try {
      setLoading(true);

      const response = await supportAPI.create({
        subject: formData.subject.trim(),
        category: formData.category,
        description: formData.description.trim(),
        bookingId: formData.bookingId || null,
      });

      if (response.data?.success) {
        setMessage("Your support ticket has been submitted successfully.");

        setFormData({
          subject: "",
          category: "Booking",
          description: "",
          bookingId: "",
        });
      } else {
        setError(response.data?.message || "Failed to submit ticket.");
      }
    } catch (err) {
      console.error("Create Support Ticket Error:", err);

      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="support-page">
      <div className="support-container">

        {/* Header */}
        <div className="support-header">
          <button
            className="support-back-btn"
            onClick={() => navigate("/help")}
          >
            ← Back to Help Center
          </button>

          <div className="support-title-section">
            <span className="support-icon">🎧</span>

            <div>
              <h1>Contact Support</h1>
              <p>
                Tell us about your issue and our support team will help you.
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="support-card">
          <div className="support-card-header">
            <h2>Submit a Support Ticket</h2>
            <p>
              Please provide as much detail as possible so we can understand
              and resolve your issue.
            </p>
          </div>

          <form onSubmit={handleSubmit}>

            {/* Subject */}
            <div className="support-form-group">
              <label htmlFor="subject">
                Subject <span>*</span>
              </label>

              <input
                id="subject"
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Example: My booking is not showing"
                maxLength={100}
              />

              <small>
                {formData.subject.length}/100 characters
              </small>
            </div>

            {/* Category */}
            <div className="support-form-group">
              <label htmlFor="category">
                Category <span>*</span>
              </label>

              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="Booking">Booking</option>
                <option value="Appointment">Appointment</option>
                <option value="Service">Service</option>
                <option value="Salon">Salon</option>
                <option value="Account">Account</option>
                <option value="Technical Issue">
                  Technical Issue
                </option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Booking ID */}
            <div className="support-form-group">
              <label htmlFor="bookingId">
                Booking ID <span className="optional">(Optional)</span>
              </label>

              <input
                id="bookingId"
                type="text"
                name="bookingId"
                value={formData.bookingId}
                onChange={handleChange}
                placeholder="Enter booking ID if your issue is related to a booking"
              />

              <small>
                You can leave this empty if your issue is not related to a
                booking.
              </small>
            </div>

            {/* Description */}
            <div className="support-form-group">
              <label htmlFor="description">
                Describe your issue <span>*</span>
              </label>

              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Please explain what happened..."
                rows="7"
                maxLength={1000}
              />

              <small>
                {formData.description.length}/1000 characters
              </small>
            </div>

            {/* Success */}
            {message && (
              <div className="support-message support-success">
                ✓ {message}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="support-message support-error">
                ⚠ {error}
              </div>
            )}

            {/* Actions */}
            <div className="support-form-actions">
              <button
                type="button"
                className="support-cancel-btn"
                onClick={() => navigate("/help")}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="support-submit-btn"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Ticket"}
              </button>
            </div>
          </form>
        </div>

        {/* Bottom Info */}
        <div className="support-info">
          <div className="support-info-icon">💬</div>

          <div>
            <h3>Need help?</h3>
            <p>
              Before submitting a ticket, you can check our Help Center for
              answers to common questions.
            </p>

            <button onClick={() => navigate("/help")}>
              Visit Help Center →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default CustomerSupport;