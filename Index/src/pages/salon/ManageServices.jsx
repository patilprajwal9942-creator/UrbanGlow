import { useEffect, useState } from "react";
import { salonAPI, serviceAPI } from "../../services/api";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/ManageServices.css";
import { MdArrowBack } from "react-icons/md";

const PREDEFINED_SERVICES = [
  { name: "Haircut", defaultPrice: 300, defaultDuration: 30 },
  { name: "Beard Shaving", defaultPrice: 150, defaultDuration: 20 },
  { name: "Hair Spa", defaultPrice: 800, defaultDuration: 60 },
  { name: "Massage", defaultPrice: 1200, defaultDuration: 60 },
  { name: "Facial", defaultPrice: 600, defaultDuration: 45 },
  { name: "Manicure", defaultPrice: 400, defaultDuration: 30 },
  { name: "Pedicure", defaultPrice: 500, defaultDuration: 40 },
  { name: "Hair Coloring", defaultPrice: 1500, defaultDuration: 90 },
  { name: "Head Massage", defaultPrice: 400, defaultDuration: 30 },
  { name: "Waxing", defaultPrice: 350, defaultDuration: 30 },
  { name: "Other / Custom Service", defaultPrice: 0, defaultDuration: 30 },
];

function ManageServices() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [selectedPredefined, setSelectedPredefined] = useState(null);

  const [formData, setFormData] = useState({
    serviceName: "",
    price: "",
    duration: "",
    description: "",
  });

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

  // Get services
  useEffect(() => {
    async function fetchServices() {
      if (!salon?._id) return;

      try {
        const response = await serviceAPI.getBySalon(salon._id);

        setServices(response.data);
      } catch (error) {
        console.log(error);
      }
    }

    fetchServices();
  }, [salon?._id]);

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  function handlePredefinedSelect(service) {
    setSelectedPredefined(service);

    setFormData({
      serviceName: service.name,
      price: service.defaultPrice || "",
      duration: service.defaultDuration || "",
      description: "",
    });

    setShowCustomForm(true);
  }

  function handleCustomService() {
    setSelectedPredefined(null);

    setFormData({
      serviceName: "",
      price: "",
      duration: "",
      description: "",
    });

    setShowCustomForm(true);
  }

  function resetForm() {
    setSelectedPredefined(null);

    setFormData({
      serviceName: "",
      price: "",
      duration: "",
      description: "",
    });

    setShowCustomForm(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!salon?._id) {
      alert("Salon not found");
      return;
    }

    try {
      const response = await serviceAPI.create({
        salonId: salon._id,
        serviceName: formData.serviceName,
        price: Number(formData.price),
        duration: Number(formData.duration),
        description: formData.description,
      });

      setServices((prev) => [
        ...prev,
        response.data.service,
      ]);

      resetForm();

      alert("Service added successfully");
    } catch (error) {
      console.log(error);

      alert(
        error.response?.data?.message ||
        "Failed to add service"
      );
    }
  }

  if (loading) {
    return (
      <div className="manage-services-page">
        <div className="loading-state">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="manage-services-page">
        <div className="no-salon">
          <h2>No Salon Profile Found</h2>

          <p>
            You need to create your salon profile before
            managing services.
          </p>

          <Link
            to="/salon/create"
            className="btn btn-primary"
          >
            Create Salon Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-services-page">

      <header className="manage-services-header">

        <button
          className="owner-back-btn"
          onClick={() => navigate("/salon/dashboard")}
        >
          <MdArrowBack />
          Back to Dashboard
        </button>

        <h1>Manage Services</h1>

        <p className="salon-name">
          {salon.salonName}
        </p>

      </header>

      {/* Service Selection */}

      <section className="service-selection-section">

        <h2 className="section-title">
          Add a Service
        </h2>

        <p className="selection-hint">
          Choose a predefined service or create a custom one:
        </p>

        <div className="predefined-services-grid">

          {PREDEFINED_SERVICES.map((service) => (
            <button
              key={service.name}
              type="button"
              className={`predefined-service-btn ${
                selectedPredefined?.name === service.name
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                handlePredefinedSelect(service)
              }
            >
              <span className="service-name">
                {service.name}
              </span>

              {service.defaultPrice && (
                <span className="service-defaults">
                  ₹{service.defaultPrice} •{" "}
                  {service.defaultDuration} min
                </span>
              )}
            </button>
          ))}

        </div>

        <button
          type="button"
          className="predefined-service-btn custom-btn"
          onClick={handleCustomService}
        >
          <span>+</span> Custom Service
        </button>

      </section>

      {/* Service Form */}

      {showCustomForm && (
        <form
          className="add-service-form"
          onSubmit={handleSubmit}
        >

          <div className="form-group">

            <label>Service Name</label>

            <input
              type="text"
              name="serviceName"
              placeholder="Service Name"
              value={formData.serviceName}
              onChange={handleChange}
              required
            />

          </div>

          <div className="form-row">

            <div className="form-group">

              <label>Price (₹)</label>

              <input
                type="number"
                name="price"
                placeholder="Price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
              />

            </div>

            <div className="form-group">

              <label>Duration (minutes)</label>

              <input
                type="number"
                name="duration"
                placeholder="Duration"
                value={formData.duration}
                onChange={handleChange}
                required
                min="5"
              />

            </div>

          </div>

          <div className="form-group">

            <label>
              Service Description (Optional)
            </label>

            <textarea
              name="description"
              placeholder="Service Description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
            />

          </div>

          <div className="form-actions">

            <button
              type="submit"
              className="btn btn-primary"
            >
              Add Service
            </button>

            <button
              type="button"
              className="btn btn-outline"
              onClick={resetForm}
            >
              Cancel
            </button>

          </div>

        </form>
      )}

      <hr className="section-divider" />

      {/* Existing Services */}

      <h2 className="section-title">
        Your Services
      </h2>

      {services.length === 0 ? (
        <div className="empty-services">
          <p>No services added yet.</p>
        </div>
      ) : (
        <div className="services-list">

          {services.map((service) => (
            <article
              key={service._id}
              className="service-item"
            >

              <div className="service-header">

                <h3 className="service-name">
                  {service.serviceName}
                </h3>

                <div className="service-price">
                  ₹{service.price}
                </div>

              </div>

              <div className="service-meta">
                <span>
                  Duration: {service.duration} minutes
                </span>
              </div>

              <p className="service-description">
                {service.description || "No description"}
              </p>

            </article>
          ))}

        </div>
      )}

    </div>
  );
}

export default ManageServices;