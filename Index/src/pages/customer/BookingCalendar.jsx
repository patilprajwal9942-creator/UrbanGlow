import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { slotAPI, bookingAPI } from "../../services/api";

import "../../styles/BookingCalendar.css";


function BookingCalendar() {

  const location = useLocation();
  const navigate = useNavigate();


  // ======================================
  // GET BOOKING DATA
  // ======================================

  const rawSalon =
    location.state?.salon;

  const service =
    location.state?.service;


  // Support different salon formats

  const salon =
    rawSalon?.salon ||
    rawSalon?.data ||
    rawSalon;


  // Logged-in customer (needed to create the booking)

  const user = JSON.parse(
    localStorage.getItem("user")
  );


  // ======================================
  // DATE STATES
  // ======================================

  const [
    availableDates,
    setAvailableDates,
  ] = useState([]);

  const [
    selectedDate,
    setSelectedDate,
  ] = useState("");

  const [
    loadingDates,
    setLoadingDates,
  ] = useState(true);

  const [
    datesError,
    setDatesError,
  ] = useState("");

  const [
    datesRefreshKey,
    setDatesRefreshKey,
  ] = useState(0);


  // ======================================
  // TIME SLOT STATES
  // ======================================

  const [
    slotsForDate,
    setSlotsForDate,
  ] = useState([]);

  const [
    selectedSlot,
    setSelectedSlot,
  ] = useState(null);

  const [
    loadingSlots,
    setLoadingSlots,
  ] = useState(false);

  const [
    slotsError,
    setSlotsError,
  ] = useState("");

  const [
    slotsRefreshKey,
    setSlotsRefreshKey,
  ] = useState(0);


  // ======================================
  // BOOKING REQUEST STATE
  // ======================================

  const [
    submitting,
    setSubmitting,
  ] = useState(false);


  // ======================================
  // FETCH AVAILABLE DATES
  // ======================================

  useEffect(() => {

    async function fetchAvailableDates() {

      if (!salon?._id) {

        setAvailableDates([]);

        setLoadingDates(false);

        return;
      }


      try {

        setLoadingDates(true);

      console.log("=================================");
console.log("CUSTOMER BOOKING SALON ID:", salon._id);
console.log("FETCHING AVAILABLE DATES...");
console.log("=================================");

const response =
  await slotAPI.getAvailableDates(
    salon._id
  );

console.log("AVAILABLE DATES RESPONSE:", response.data);

        let dates = [];


        // Format 1
        // ["2026-09-30"]

        if (
          Array.isArray(response.data)
        ) {

          dates =
            response.data;

        }


        // Format 2
        // { data: [...] }

        else if (
          Array.isArray(
            response.data?.data
          )
        ) {

          dates =
            response.data.data;

        }


        // Format 3
        // { dates: [...] }

        else if (
          Array.isArray(
            response.data?.dates
          )
        ) {

          dates =
            response.data.dates;

        }


        setAvailableDates(dates);


      } catch (error) {

        console.error(
          "Fetch Available Dates Error:",
          error
        );


        setAvailableDates([]);


        setDatesError(

          error.response?.data?.message ||

          "Failed to load available dates"

        );


      } finally {

        setLoadingDates(false);

      }

    }


    fetchAvailableDates();


  }, [
    salon?._id,
    datesRefreshKey,
  ]);


  // ======================================
  // FETCH TIME SLOTS FOR SELECTED DATE
  // ======================================

  useEffect(() => {

    async function fetchSlotsForDate() {

      if (
        !salon?._id ||
        !selectedDate
      ) {

        setSlotsForDate([]);

        setLoadingSlots(false);

        return;
      }


      try {

        setLoadingSlots(true);

        setSlotsError("");


        const response =
          await slotAPI.getBySalon(

            salon._id,

            {
              date: selectedDate,

              available: "true",
            }

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


        setSlotsForDate(slotData);


      } catch (error) {

        console.error(
          "Fetch Slots Error:",
          error
        );


        setSlotsForDate([]);


        setSlotsError(

          error.response?.data?.message ||

          "Failed to load available slots"

        );


      } finally {

        setLoadingSlots(false);

      }

    }


    fetchSlotsForDate();


  }, [
    salon?._id,
    selectedDate,
    slotsRefreshKey,
  ]);


  // ======================================
  // BOOKING DATA CHECK
  // ======================================

  if (!salon || !service) {

    return (

      <div className="booking-calendar-page">

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
  // FORMAT DATE FOR DISPLAY
  // (display only - does not affect any API call)
  // ======================================

  function formatDateLabel(dateString) {

    try {

      const parsed =
        new Date(`${dateString}T00:00:00`);

      return parsed.toLocaleDateString(
        "en-IN",
        {
          day: "numeric",
          month: "short",
        }
      );

    } catch (error) {

      return dateString;

    }

  }


  // ======================================
  // SELECT DATE
  // ======================================

  function handleSelectDate(date) {

    setSelectedDate(date);

    setSelectedSlot(null);

  }


  // ======================================
  // SELECT TIME SLOT
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
  // REFRESH DATES / SLOTS
  // ======================================

  function handleRefreshDates() {

    setDatesRefreshKey(
      (previous) => previous + 1
    );

  }

  function handleRefreshSlots() {

    setSelectedSlot(null);

    setSlotsRefreshKey(
      (previous) => previous + 1
    );

  }


  // ======================================
  // REQUEST BOOKING
  // ======================================

  async function handleRequestBooking() {

    if (
      !selectedDate ||
      !selectedSlot
    ) {

      return;

    }


    if (!user?._id) {

      alert("Please login first");

      navigate("/login");

      return;
    }


    try {

      setSubmitting(true);


      const response =
        await bookingAPI.create({

          salonId: salon._id,

          serviceId: service._id,

          slotId: selectedSlot._id,

        });


      alert(

        response.data.message ||

        "Booking request sent successfully. Waiting for salon confirmation."

      );


      navigate("/my-bookings");


    } catch (error) {

      console.error(
        "Booking Error:",
        error
      );


      alert(

        error.response?.data?.message ||

        "Failed to create booking"

      );


    } finally {

      setSubmitting(false);

    }



  }


  const availableSlots =
    slotsForDate.filter(
      (slot) =>
        slot.isBooked === false
    );


  // ======================================
  // UI
  // ======================================

  return (

    <div className="booking-calendar-page">


      {/* HEADER */}

      <header className="booking-calendar-header">

        <h1>
          Choose Appointment
        </h1>

      </header>


      {/* SERVICE / SALON INFO */}

      <section className="calendar-info">

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
            Price:
          </strong>

          {" "}

          ₹{service.price}

        </p>


        <p>

          <strong>
            Duration:
          </strong>

          {" "}

          {service.duration} minutes

        </p>

      </section>


      <hr className="section-divider" />


      {/* DATE SELECTION */}

      <section className="date-selection">

        <h2 className="section-title">
          Select Date
        </h2>


        {loadingDates ? (

          <div className="loading-state">

            <h2>
              Loading available dates...
            </h2>

          </div>

        ) : datesError ? (

          <div className="error-state">

            <h2>
              {datesError}
            </h2>


            <button
              className="btn btn-outline"
              onClick={handleRefreshDates}
            >
              Try Again
            </button>

          </div>

        ) : availableDates.length > 0 ? (

          <div className="date-selector">

            {availableDates.map(
              (date) => (

                <button
                  key={date}
                  type="button"
                  className={`date-btn ${
                    selectedDate === date
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    handleSelectDate(date)
                  }
                >

                  {formatDateLabel(date)}

                </button>

              )
            )}

          </div>

        ) : (

          <div className="no-dates">

            <p>
              No available dates for this salon.
            </p>


            <button
              className="btn btn-outline"
              onClick={handleRefreshDates}
            >
              Refresh Dates
            </button>

          </div>

        )}

      </section>


      {/* TIME SLOT SELECTION */}

      {selectedDate && (

        <>

          <hr className="section-divider" />

          <section>

            <h2 className="section-title">
              Available Times
            </h2>


            {loadingSlots ? (

              <div className="loading-state">

                <h2>
                  Loading available times...
                </h2>

              </div>

            ) : slotsError ? (

              <div className="error-state">

                <h2>
                  {slotsError}
                </h2>


                <button
                  className="btn btn-outline"
                  onClick={handleRefreshSlots}
                >
                  Try Again
                </button>

              </div>

            ) : availableSlots.length === 0 ? (

              <div className="empty-slots">

                <p>
                  No available slots for this date.
                </p>


                <button
                  className="btn btn-outline"
                  onClick={handleRefreshSlots}
                >
                  Refresh Times
                </button>

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

                      {slot.startTime}

                    </button>

                  )
                )}

              </div>

            )}

          </section>

        </>

      )}


      {/* SELECTED APPOINTMENT SUMMARY */}

      {selectedDate && selectedSlot && (

        <section className="selected-slot">

          <h3>
            Selected Appointment
          </h3>


          <div className="detail-row">

            <span className="detail-label">
              Service:
            </span>

            <span className="detail-value">
              {service.serviceName}
            </span>

          </div>


          <div className="detail-row">

            <span className="detail-label">
              Date:
            </span>

            <span className="detail-value">
              {formatDateLabel(selectedDate)}
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
              Price:
            </span>

            <span className="detail-value">
              ₹{service.price}
            </span>

          </div>


          <div className="selected-slot-actions">

            <button
              className="btn btn-primary"
              onClick={handleRequestBooking}
              disabled={submitting}
            >

              {submitting
                ? "Sending Request..."
                : "Request Booking"}

            </button>

          </div>

        </section>

      )}

    </div>

  );

}


export default BookingCalendar;