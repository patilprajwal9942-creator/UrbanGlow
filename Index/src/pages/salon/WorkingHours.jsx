import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { salonAPI } from "../../services/api";
import "../../styles/WorkingHours.css";

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

function WorkingHours() {
  const navigate = useNavigate();
  const [workingHours, setWorkingHours] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const getDefaultHours = () => {
    const defaults = {};
    DAYS.forEach((day, index) => {
      if (day.key === "sunday") {
        defaults[day.key] = { open: null, close: null, isClosed: true };
      } else if (day.key === "saturday") {
        defaults[day.key] = { open: "10:00", close: "20:00", isClosed: false };
      } else {
        defaults[day.key] = { open: "10:00", close: "18:00", isClosed: false };
      }
    });
    return defaults;
  };

  useEffect(() => {
    async function fetchWorkingHours() {
      try {
        const response = await salonAPI.getWorkingHours();
        const salon = response.data.salon;
        if (salon.workingHours && Object.keys(salon.workingHours).length > 0) {
          setWorkingHours(salon.workingHours);
        } else {
          setWorkingHours(getDefaultHours());
        }
      } catch (error) {
        console.error("Error fetching working hours:", error);
        setWorkingHours(getDefaultHours());
      } finally {
        setLoading(false);
      }
    }
    fetchWorkingHours();
  }, []);

  const handleChange = (dayKey, field, value) => {
    setWorkingHours((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value,
      },
    }));
  };

  const handleToggleClosed = (dayKey) => {
    setWorkingHours((prev) => {
      const isClosed = !prev[dayKey]?.isClosed;
      return {
        ...prev,
        [dayKey]: {
          ...prev[dayKey],
          isClosed,
          open: isClosed ? null : prev[dayKey]?.open || "10:00",
          close: isClosed ? null : prev[dayKey]?.close || "18:00",
        },
      };
    });
  };

  const validateForm = () => {
    for (const day of DAYS) {
      const dayData = workingHours[day.key];
      if (!dayData.isClosed) {
        if (!dayData.open || !dayData.close) {
          setMessage({ type: "error", text: `${day.label}: Please fill in both open and close times` });
          return false;
        }
        const openMinutes = timeToMinutes(dayData.open);
        const closeMinutes = timeToMinutes(dayData.close);
        if (openMinutes >= closeMinutes) {
          setMessage({ type: "error", text: `${day.label}: Open time must be before close time` });
          return false;
        }
      }
    }
    return true;
  };

  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      await salonAPI.updateWorkingHours(workingHours);
      setMessage({ type: "success", text: "Working hours saved successfully!" });
    } catch (error) {
      console.error("Error saving working hours:", error);
      const errorMsg = error.response?.data?.message || "Failed to save working hours";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate("/salon/dashboard");
  };

  if (loading) {
    return (
      <div className="working-hours-page">
        <div className="loading-state">Loading working hours...</div>
      </div>
    );
  }

  return (
    <div className="working-hours-page">
      <div className="working-hours-header">
        <button className="btn-back" onClick={handleBack}>
          ← Back to Dashboard
        </button>
        <h1>Manage Working Hours</h1>
      </div>

      {message.text && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="working-hours-grid">
        {DAYS.map((day) => {
          const dayData = workingHours[day.key] || { open: "", close: "", isClosed: false };
          return (
            <div key={day.key} className="day-card">
              <div className="day-header">
                <span className="day-name">{day.label}</span>
                <label className="closed-toggle">
                  <input
                    type="checkbox"
                    checked={dayData.isClosed}
                    onChange={() => handleToggleClosed(day.key)}
                  />
                  <span className="toggle-slider"></span>
                  <span className="closed-label">Closed</span>
                </label>
              </div>
              <div className="time-inputs" style={{ opacity: dayData.isClosed ? 0.5 : 1 }}>
                <div className="time-input-group">
                  <label htmlFor={`${day.key}-open`}>Open</label>
                  <input
                    id={`${day.key}-open`}
                    type="time"
                    value={dayData.open || ""}
                    onChange={(e) => handleChange(day.key, "open", e.target.value)}
                    disabled={dayData.isClosed}
                  />
                </div>
                <div className="time-input-group">
                  <label htmlFor={`${day.key}-close`}>Close</label>
                  <input
                    id={`${day.key}-close`}
                    type="time"
                    value={dayData.close || ""}
                    onChange={(e) => handleChange(day.key, "close", e.target.value)}
                    disabled={dayData.isClosed}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="working-hours-actions">
        <button className="btn btn-primary btn-save" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Working Hours"}
        </button>
        <button className="btn btn-secondary" onClick={handleBack}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default WorkingHours;