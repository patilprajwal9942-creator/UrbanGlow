import { useState } from "react";
import { salonAPI } from "../../services/api";
import { useNavigate } from "react-router-dom";
import "./CreateSalon.css";

import {
  MdArrowBack,
  MdLocationOn,
} from "react-icons/md";

function CreateSalon() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const [formData, setFormData] = useState({
    salonName: "",
    ownerName: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: "",

    // NEW
    latitude: "",
    longitude: "",
  });

  const [image, setImage] =
    useState(null);

  const [preview, setPreview] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [locationLoading, setLocationLoading] =
    useState(false);

  const [locationMessage, setLocationMessage] =
    useState("");

  // ======================================================
  // HANDLE INPUT
  // ======================================================

  function handleChange(e) {
    const {
      name,
      value,
    } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // ======================================================
  // GET OWNER CURRENT LOCATION
  // ======================================================

  function handleGetLocation() {
    if (!navigator.geolocation) {
      alert(
        "Geolocation is not supported by your browser."
      );
      return;
    }

    setLocationLoading(true);
    setLocationMessage("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const {
          latitude,
          longitude,
        } = position.coords;

        setFormData((prev) => ({
          ...prev,

          latitude:
            latitude.toString(),

          longitude:
            longitude.toString(),
        }));

        setLocationMessage(
          "Location captured successfully."
        );

        setLocationLoading(false);

        console.log(
          "Salon latitude:",
          latitude
        );

        console.log(
          "Salon longitude:",
          longitude
        );
      },

      (error) => {
        console.error(
          "Location Error:",
          error
        );

        setLocationLoading(false);

        if (error.code === 1) {
          alert(
            "Please allow location access to save your salon location."
          );
        } else if (error.code === 2) {
          alert(
            "Your location could not be determined."
          );
        } else if (error.code === 3) {
          alert(
            "Location request timed out. Please try again."
          );
        } else {
          alert(
            "Unable to get your current location."
          );
        }
      },

      {
        enableHighAccuracy: true,

        timeout: 10000,

        maximumAge: 0,
      }
    );
  }

  // ======================================================
  // IMAGE
  // ======================================================

  function handleImageChange(e) {
    const file =
      e.target.files[0];

    if (!file) return;

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      alert(
        "Please select an image file"
      );
      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      alert(
        "Image size must be less than 5 MB"
      );
      return;
    }

    setImage(file);

    setPreview(
      URL.createObjectURL(file)
    );
  }

  // ======================================================
  // SUBMIT
  // ======================================================

  async function handleSubmit(e) {
    e.preventDefault();

    if (!user?._id) {
      alert("Please login first");

      navigate("/login");

      return;
    }

    if (user.role !== "salon") {
      alert(
        "Only salon owners can create a salon"
      );

      return;
    }

    if (!formData.salonName.trim()) {
      alert(
        "Please enter salon name"
      );

      return;
    }

    if (!formData.phone.trim()) {
      alert(
        "Please enter phone number"
      );

      return;
    }

    if (!formData.address.trim()) {
      alert(
        "Please enter salon address"
      );

      return;
    }

    if (!image) {
      alert(
        "Please select salon image"
      );

      return;
    }

    try {
      setLoading(true);

      const data =
        new FormData();

      data.append(
        "salonName",
        formData.salonName
      );

      data.append(
        "ownerName",
        formData.ownerName
      );

      data.append(
        "email",
        formData.email
      );

      data.append(
        "phone",
        formData.phone
      );

      data.append(
        "address",
        formData.address
      );

      // ==========================================
      // SEND LOCATION ONLY IF AVAILABLE
      // ==========================================

      if (
        formData.latitude !== "" &&
        formData.longitude !== ""
      ) {
        data.append(
          "latitude",
          formData.latitude
        );

        data.append(
          "longitude",
          formData.longitude
        );
      }

      data.append(
        "image",
        image
      );

      const response =
        await salonAPI.create(
          data
        );

      alert(
        response.data.message
      );

      navigate(
        "/salon/dashboard"
      );
    } catch (error) {
      console.error(
        "Create Salon Error:",
        error.response?.data ||
          error
      );

      alert(
        error.response?.data
          ?.message ||
          "Failed to create salon"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="create-salon-page">

      <div className="create-salon-card">

        {/* BACK */}

        <button
          className="owner-back-btn"
          onClick={() =>
            navigate(
              "/salon/dashboard"
            )
          }
        >
          <MdArrowBack />

          Back to Dashboard
        </button>

        {/* HEADER */}

        <div className="create-salon-header">

          <p>
            URBANGLOW
          </p>

          <h1>
            Create Your Salon
          </h1>

          <span>
            Add your salon details and
            make it available for
            customers.
          </span>

        </div>

        <form
          onSubmit={handleSubmit}
        >

          {/* SALON NAME */}

          <div className="form-group">

            <label>
              Salon Name
            </label>

            <input
              type="text"
              name="salonName"
              value={
                formData.salonName
              }
              onChange={
                handleChange
              }
              placeholder="Enter salon name"
            />

          </div>

          {/* OWNER + EMAIL */}

          <div className="form-row">

            <div className="form-group">

              <label>
                Owner Name
              </label>

              <input
                type="text"
                name="ownerName"
                value={
                  formData.ownerName
                }
                onChange={
                  handleChange
                }
                placeholder="Owner name"
              />

            </div>

            <div className="form-group">

              <label>
                Email
              </label>

              <input
                type="email"
                name="email"
                value={
                  formData.email
                }
                onChange={
                  handleChange
                }
                placeholder="Email address"
              />

            </div>

          </div>

          {/* PHONE */}

          <div className="form-group">

            <label>
              Phone Number
            </label>

            <input
              type="text"
              name="phone"
              value={
                formData.phone
              }
              onChange={
                handleChange
              }
              placeholder="Enter phone number"
            />

          </div>

          {/* ADDRESS */}

          <div className="form-group">

            <label>
              Salon Address
            </label>

            <textarea
              name="address"
              value={
                formData.address
              }
              onChange={
                handleChange
              }
              placeholder="Enter complete salon address"
              rows="4"
            />

          </div>

          {/* ==========================================
              LOCATION
          ========================================== */}

          <div className="form-group">

            <label>
              Salon Location
            </label>

            <p
              style={{
                marginTop: "0",
                marginBottom:
                  "10px",
                color:
                  "#64748b",
                fontSize:
                  "13px",
              }}
            >
              Save your salon's
              location so customers
              can find it nearby.
            </p>

            <button
              type="button"
              className="salon-location-btn"
              onClick={
                handleGetLocation
              }
              disabled={
                locationLoading
              }
            >
              <MdLocationOn />

              {locationLoading
                ? "Getting Location..."
                : "Use Current Location"}
            </button>

            {locationMessage && (
              <p
                style={{
                  marginTop:
                    "8px",
                  marginBottom:
                    "0",
                  color:
                    "#16a34a",
                  fontSize:
                    "13px",
                  fontWeight:
                    "600",
                }}
              >
                ✓{" "}
                {locationMessage}
              </p>
            )}

          </div>

          {/* IMAGE */}

          <div className="form-group">

            <label>
              Salon Image
            </label>

            <div className="upload-box">

              <input
                type="file"
                accept="image/*"
                onChange={
                  handleImageChange
                }
              />

              <p>
                Choose a salon image
              </p>

              <span>
                JPG, PNG or WEBP •
                Maximum 5 MB
              </span>

            </div>

          </div>

          {/* PREVIEW */}

          {preview && (
            <div className="image-preview">

              <p>
                Image Preview
              </p>

              <img
                src={preview}
                alt="Salon Preview"
              />

            </div>
          )}

          {/* BUTTONS */}

          <div className="form-buttons">

            <button
              type="button"
              className="back-btn"
              onClick={() =>
                navigate(
                  "/salon/dashboard"
                )
              }
            >
              Back
            </button>

            <button
              type="submit"
              className="create-btn"
              disabled={loading}
            >
              {loading
                ? "Creating Salon..."
                : "Create Salon"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default CreateSalon;