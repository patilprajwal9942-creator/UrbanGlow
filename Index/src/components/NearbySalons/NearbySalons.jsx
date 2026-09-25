import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { salonAPI } from "../../services/api";
import "./NearbySalons.css";

function formatDistance(distanceKm) {
  if (distanceKm === undefined || distanceKm === null) return null;
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m away`;
  }
  return `${distanceKm} km away`;
}

function NearbySalons() {
  const navigate = useNavigate();

  const [status, setStatus] = useState("idle"); // idle | loading | error | success
  const [errorMessage, setErrorMessage] = useState("");
  const [salons, setSalons] = useState([]);

  function handleFindNearby() {
    setErrorMessage("");

    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMessage(
        "Your browser does not support location services."
      );
      return;
    }

    setStatus("loading");

    navigator.geolocation.getCurrentPosition(
      handleLocationSuccess,
      handleLocationError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  async function handleLocationSuccess(position) {
    const { latitude, longitude } = position.coords;

    try {
      const response = await salonAPI.getNearby(latitude, longitude, 10000);

      setSalons(response.data?.salons || []);
      setStatus("success");

    } catch (error) {
      console.error("Nearby Salons Error:", error);

      setStatus("error");
      setErrorMessage(
        error.response?.data?.message ||
        "Failed to load nearby salons. Please try again."
      );
    }
  }

  function handleLocationError(error) {
    setStatus("error");

    if (error.code === error.PERMISSION_DENIED) {
      setErrorMessage(
        "Location permission was denied. Please allow location access and try again."
      );
    } else if (error.code === error.POSITION_UNAVAILABLE) {
      setErrorMessage(
        "Your location is currently unavailable. Please try again."
      );
    } else if (error.code === error.TIMEOUT) {
      setErrorMessage(
        "Getting your location took too long. Please try again."
      );
    } else {
      setErrorMessage(
        "Something went wrong while getting your location. Please try again."
      );
    }
  }

  return (
    <section className="nearby-section" id="nearby-salons">

      <div className="nearby-header">

        <p className="nearby-subtitle">
          FIND SALONS AROUND YOU
        </p>

        <h2>
          📍 Nearby <span>Salons</span>
        </h2>

        <p className="nearby-description">
          Allow location access to discover salons close to you,
          sorted by distance.
        </p>

        <button
          className="nearby-find-btn"
          onClick={handleFindNearby}
          disabled={status === "loading"}
        >
          {status === "loading"
            ? "Getting your location..."
            : "📍 Find Nearby Salons"}
        </button>

      </div>

      {/* ERROR STATE */}

      {status === "error" && (
        <div className="nearby-error">
          <p>{errorMessage}</p>
          <button
            className="nearby-retry-btn"
            onClick={handleFindNearby}
          >
            Try Again
          </button>
        </div>
      )}

      {/* SUCCESS - NO SALONS */}

      {status === "success" && salons.length === 0 && (
        <div className="nearby-empty">
          <h3>No salons found nearby</h3>
          <p>Try again later or explore all salons below.</p>
        </div>
      )}

      {/* SUCCESS - SALON LIST */}

      {status === "success" && salons.length > 0 && (
        <div className="nearby-container">

          {salons.map((salon) => (
            <div className="nearby-card" key={salon._id}>

              <div className="nearby-image-container">
                <img
                  src={
                    salon.image ||
                    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f"
                  }
                  alt={salon.salonName}
                />

                {formatDistance(salon.distanceKm) && (
                  <span className="nearby-distance-badge">
                    {formatDistance(salon.distanceKm)}
                  </span>
                )}
              </div>

              <div className="nearby-info">

                <h3>{salon.salonName}</h3>

                <div className="nearby-detail">
                  <span>📍</span>
                  <p>{salon.address}</p>
                </div>

                {salon.rating && (
                  <div className="nearby-detail">
                    <span>⭐</span>
                    <p>{salon.rating}</p>
                  </div>
                )}

                <button
                  className="nearby-view-btn"
                  onClick={() => navigate(`/salon/${salon._id}`)}
                >
                  View Salon →
                </button>

              </div>

            </div>
          ))}

        </div>
      )}

    </section>
  );
}

export default NearbySalons;