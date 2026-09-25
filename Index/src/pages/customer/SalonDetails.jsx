import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { salonAPI, serviceAPI } from "../../services/api";
import "../../styles/SalonDetails.css";

function SalonDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ======================================
  // FETCH SALON AND SERVICES
  // ======================================

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError("");

        // Get salon details
        const salonResponse = await salonAPI.getById(id);

        console.log(
          "Salon API Response:",
          salonResponse.data
        );

        // Store only actual salon object
        setSalon(salonResponse.data.salon);

        // Get services for this salon
        const serviceResponse =
          await serviceAPI.getBySalon(id);

        console.log(
          "Service API Response:",
          serviceResponse.data
        );

        // Handle services response
        if (Array.isArray(serviceResponse.data)) {
          setServices(serviceResponse.data);
        } else if (serviceResponse.data.services) {
          setServices(serviceResponse.data.services);
        } else {
          setServices([]);
        }

      } catch (error) {
        console.error(
          "Fetch Salon Error:",
          error
        );

        setError(
          error.response?.data?.message ||
          "Failed to load salon"
        );

      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  // ======================================
  // LOADING
  // ======================================

  if (loading) {
    return (
      <div className="salon-details-page">
        <div className="loading-state">
          <h2>Loading salon...</h2>
        </div>
      </div>
    );
  }

  // ======================================
  // ERROR
  // ======================================

  if (error) {
    return (
      <div className="salon-details-page">
        <div className="error-state">
          <h2>{error}</h2>
        </div>
      </div>
    );
  }

  // ======================================
  // SALON NOT FOUND
  // ======================================

  if (!salon) {
    return (
      <div className="salon-details-page">
        <div className="empty-services">
          <h2>Salon not found</h2>

          <button
            className="btn btn-primary"
            onClick={() => navigate("/")}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // ======================================
  // CONTINUE BOOKING
  // ======================================

  function handleBooking() {
    if (!selectedService) {
      alert("Please select a service");
      return;
    }

    console.log("Booking Salon:", salon);
    console.log("Selected Service:", selectedService);

    navigate("/booking", {
      state: {
        salon,
        service: selectedService,
      },
    });
  }

  // ======================================
  // UI
  // ======================================

  return (
    <div className="salon-details-page">

      {/* SALON DETAILS */}

      <header className="salon-header">

        <div className="salon-image">
          <img
            src={salon.image}
            alt={salon.salonName}
          />
        </div>

        <div className="salon-info">

          <h1>{salon.salonName}</h1>

          <h3>
            Owner: {salon.ownerName}
          </h3>

          <p>
            Email: {salon.email}
          </p>

          <p>
            Phone: {salon.phone}
          </p>

          <p>
            Address: {salon.address}
          </p>

        </div>

      </header>

      <hr className="section-divider" />

      {/* SERVICES */}

      <h2 className="section-title">
        Available Services
      </h2>

      {services.length === 0 ? (

        <div className="empty-services">
          <p>No services available</p>
        </div>

      ) : (

        <div className="services-grid">

          {services.map((service) => (

            <article
              key={service._id}
              className={`service-card ${
                selectedService?._id === service._id
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                setSelectedService(service)
              }
            >

              <div className="service-header">

                <h3 className="service-name">
                  {service.serviceName}
                </h3>

                <div className="service-price">
                  ₹{service.price}
                </div>

              </div>

              <div className="service-duration">
                Duration: {service.duration} minutes
              </div>

              {service.description && (
                <p className="service-description">
                  {service.description}
                </p>
              )}

              <button
                type="button"
                className="btn btn-primary service-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedService(service);
                }}
              >
                {selectedService?._id === service._id
                  ? "Selected ✓"
                  : "Select Service"}
              </button>

            </article>

          ))}

        </div>

      )}

      {/* SELECTED SERVICE */}

      {selectedService && (

        <section className="selected-service">

          <h2>Selected Service</h2>

          <div className="detail-row">

            <span className="detail-label">
              Service:
            </span>

            <span className="detail-value">
              {selectedService.serviceName}
            </span>

          </div>

          <div className="detail-row">

            <span className="detail-label">
              Price:
            </span>

            <span className="detail-value">
              ₹{selectedService.price}
            </span>

          </div>

          <div className="detail-row">

            <span className="detail-label">
              Duration:
            </span>

            <span className="detail-value">
              {selectedService.duration} minutes
            </span>

          </div>

          <div className="selected-service-actions">

            <button
              className="btn btn-primary"
              onClick={handleBooking}
            >
              Select Booking Date
            </button>

          </div>

        </section>

      )}

    </div>
  );
}

export default SalonDetails;