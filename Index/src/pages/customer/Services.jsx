import { useEffect, useState } from "react";
import { serviceAPI } from "../../services/api";
import "../../styles/Services.css";

function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchServices() {
      try {
        const response = await serviceAPI.getAll();

        setServices(response.data);
      } catch (error) {
        console.log(error);

        setError(
          error.response?.data?.message ||
          "Failed to load services"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
  }, []);

  if (loading) {
    return (
      <div className="services-page">
        <div className="loading-state">
          <h2>Loading services...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="services-page">
        <div className="error-state">
          <h2>{error}</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="services-page">

      <header className="services-header">
        <h1>Our Services</h1>
        <p>Discover our range of professional beauty services</p>
      </header>

      {services.length === 0 ? (
        <div className="empty-services">
          <p>No services available</p>
        </div>
      ) : (
        <div className="services-grid">
          {services.map((service) => (
            <article key={service._id} className="service-card">
              <h2 className="service-name">{service.serviceName}</h2>

              <div className="service-price">₹{service.price}</div>

              <div className="service-duration">
                Duration: {service.duration} minutes
              </div>

              <p className="service-description">{service.description}</p>

              <button className="btn btn-primary">Book Now</button>
            </article>
          ))}
        </div>
      )}

    </div>
  );
}

export default Services;