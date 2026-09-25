import { useEffect, useState } from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { slotAPI } from "../../services/api";

import "../../styles/BookingSlots.css";


function BookingSlots() {

  const location = useLocation();

  const navigate = useNavigate();


  // ======================================
  // GET DATA
  // ======================================

  const rawSalon =
    location.state?.salon;

  const service =
    location.state?.service;

  const selectedDate =
    location.state?.selectedDate;


  const salon =
    rawSalon?.salon ||
    rawSalon?.data ||
    rawSalon;


  // ======================================
  // STATES
  // ======================================

  const [slots, setSlots] =
    useState([]);

  const [
    selectedSlot,
    setSelectedSlot,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    refresh,
    setRefresh,
  ] = useState(0);


  // ======================================
  // FETCH SLOTS
  // ======================================

  useEffect(() => {

    async function fetchSlots() {

      if (
        !salon?._id ||
        !selectedDate
      ) {

        setSlots([]);

        setLoading(false);

        return;

      }


      try {

        setLoading(true);

        setError("");


        console.log(
          "Fetching Slots:",
          {
            salonId: salon._id,
            date: selectedDate,
          }
        );


        const response =
          await slotAPI.getBySalon(

            salon._id,

            {
              date: selectedDate,

              available: "true",
            }

          );


        console.log(
          "Slots Response:",
          response.data
        );


        let slotData = [];


        if (
          Array.isArray(response.data)
        ) {

          slotData =
            response.data;

        }

        else if (
          Array.isArray(
            response.data?.data
          )
        ) {

          slotData =
            response.data.data;

        }

        else if (
          Array.isArray(
            response.data?.slots
          )
        ) {

          slotData =
            response.data.slots;

        }


        setSlots(slotData);


      } catch (error) {

        console.error(
          "Fetch Slots Error:",
          error
        );


        setSlots([]);


        setError(

          error.response?.data?.message ||

          "Failed to load available slots"

        );


      } finally {

        setLoading(false);

      }

    }


    fetchSlots();


  }, [
    salon?._id,
    selectedDate,
    refresh,
  ]);


  // ======================================
  // CHECK DATA
  // ======================================

  if (
    !salon ||
    !service ||
    !selectedDate
  ) {

    return (

      <div className="booking-slots-page">

        <div className="empty-slots">

          <h2>
            Booking information not found
          </h2>


          <button
            className="btn btn-primary"
            onClick={() =>
              navigate("/")
            }
          >
            Go Home
          </button>

        </div>

      </div>

    );

  }


  // ======================================
  // LOADING
  // ======================================

  if (loading) {

    return (

      <div className="booking-slots-page">

        <div className="loading-state">

          <h2>
            Loading available slots...
          </h2>

        </div>

      </div>

    );

  }


  // ======================================
  // ERROR
  // ======================================

  if (error) {

    return (

      <div className="booking-slots-page">

        <div className="error-state">

          <h2>
            {error}
          </h2>


          <button
            className="btn btn-outline"
            onClick={() =>
              navigate(-1)
            }
          >
            Back
          </button>

        </div>

      </div>

    );

  }


  // ======================================
  // AVAILABLE SLOTS
  // ======================================

  const availableSlots =
    slots.filter(
      (slot) =>
        slot.isBooked === false
    );


  // ======================================
  // SELECT SLOT
  // ======================================

  function handleSelectSlot(slot) {

    if (slot.isBooked) {

      alert(
        "This slot is already booked"
      );

      return;

    }


    setSelectedSlot(slot);

  }


  // ======================================
  // CONTINUE
  // ======================================

  function handleContinue() {

    if (!selectedSlot) {

      alert(
        "Please select an available time slot"
      );

      return;

    }


    navigate(
      "/booking/confirm",
      {
        state: {

          salon,

          service,

          selectedDate,

          slot: selectedSlot,

        },
      }
    );

  }


  // ======================================
  // REFRESH
  // ======================================

  function handleRefresh() {

    setSelectedSlot(null);

    setRefresh(
      (previous) =>
        previous + 1
    );

  }


  // ======================================
  // UI
  // ======================================

  return (

    <div className="booking-slots-page">


      {/* HEADER */}

      <header className="booking-slots-header">

        <h1>
          Select Time Slot
        </h1>

      </header>


      {/* SALON INFO */}

      <section className="salon-info">

        <h2>
          {salon.salonName}
        </h2>


        <p>

          <strong>
            Service:
          </strong>

          {" "}

          {service.serviceName}

        </p>


        <p>

          <strong>
            Date:
          </strong>

          {" "}

          {selectedDate}

        </p>

      </section>


      <hr className="section-divider" />


      {/* SLOTS */}

      <h2 className="section-title">

        Available Slots

      </h2>


      {availableSlots.length === 0 ? (

        <div className="empty-slots">

          <p>
            No available slots for this date.
          </p>


          <div className="selected-slot-actions">

            <button
              className="btn btn-outline"
              onClick={() =>
                navigate(-1)
              }
            >
              Choose Another Date
            </button>


            <button
              className="btn btn-primary"
              onClick={handleRefresh}
            >
              Refresh Slots
            </button>

          </div>

        </div>

      ) : (

        <div className="slots-grid">

          {availableSlots.map(
            (slot) => (

              <button
                key={slot._id}
                type="button"
                className={`slot-btn ${
                  selectedSlot?._id === slot._id
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  handleSelectSlot(slot)
                }
              >

                <div className="slot-time">

                  {slot.startTime}

                  {" - "}

                  {slot.endTime}

                </div>


                <div className="slot-status">

                  Available

                </div>

              </button>

            )
          )}

        </div>

      )}


      {/* SELECTED SLOT */}

      {selectedSlot && (

        <section className="selected-slot">

          <h3>
            Selected Slot
          </h3>


          <div className="detail-row">

            <span className="detail-label">
              Date:
            </span>

            <span className="detail-value">
              {selectedDate}
            </span>

          </div>


          <div className="detail-row">

            <span className="detail-label">
              Time:
            </span>

            <span className="detail-value">

              {selectedSlot.startTime}

              {" - "}

              {selectedSlot.endTime}

            </span>

          </div>


          <div className="detail-row">

            <span className="detail-label">
              Status:
            </span>

            <span className="detail-value">
              Available
            </span>

          </div>


          <div className="selected-slot-actions">

            <button
              className="btn btn-primary"
              onClick={handleContinue}
            >
              Continue to Booking
            </button>

          </div>

        </section>

      )}

    </div>

  );

}


export default BookingSlots;