import { useEffect, useState } from "react";
import { salonAPI, bookingAPI } from "../../services/api";
import "../../styles/SalonBookings.css";
import { useNavigate } from "react-router-dom";

import { MdArrowBack } from "react-icons/md";


function SalonBookings() {
  const [salon, setSalon] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate()
  // ==========================================
  // FETCH SALON AND BOOKINGS
  // ==========================================

  async function fetchSalonAndBookings() {
    try {
      setLoading(true);
      setError("");

      console.log("=================================");
      console.log("FETCHING SALON BOOKINGS");
      console.log("=================================");

      // ------------------------------------------
      // GET CURRENT OWNER'S SALON
      // ------------------------------------------

      let salonData;

      try {
        const salonResponse = await salonAPI.getMySalon();

        console.log(
          "SALON RESPONSE:",
          salonResponse.data
        );

        // Support different backend response formats

        salonData =
          salonResponse.data?.salon ||
          salonResponse.data?.data ||
          salonResponse.data;
      } catch (salonError) {
        // Backend returns 404 when the current user has no salon yet.
        // Axios throws on 404, so treat that specifically as "no salon"
        // instead of falling into the generic error state below.
        if (salonError.response?.status === 404) {
          setSalon(null);
          setBookings([]);
          setLoading(false);
          return;
        }

        throw salonError;
      }

      if (!salonData?._id) {
        setSalon(null);
        setBookings([]);
        setLoading(false);
        return;
      }

      console.log(
        "SALON ID:",
        salonData._id
      );

      setSalon(salonData);

      // ------------------------------------------
      // GET BOOKINGS FOR SALON
      // ------------------------------------------

      console.log(
        "FETCHING BOOKINGS FOR SALON:",
        salonData._id
      );

      const bookingsResponse =
        await bookingAPI.getBySalon(
          salonData._id
        );

      console.log(
        "BOOKINGS RESPONSE:",
        bookingsResponse.data
      );

      // ------------------------------------------
      // SUPPORT DIFFERENT RESPONSE FORMATS
      // ------------------------------------------

      let bookingData = [];

      // Backend returns:
      // [booking1, booking2]

      if (
        Array.isArray(bookingsResponse.data)
      ) {
        bookingData =
          bookingsResponse.data;
      }

      // Backend returns:
      // { bookings: [...] }

      else if (
        Array.isArray(
          bookingsResponse.data?.bookings
        )
      ) {
        bookingData =
          bookingsResponse.data.bookings;
      }

      // Backend returns:
      // { data: [...] }

      else if (
        Array.isArray(
          bookingsResponse.data?.data
        )
      ) {
        bookingData =
          bookingsResponse.data.data;
      }

      console.log(
        "FINAL BOOKINGS:",
        bookingData
      );

      setBookings(bookingData);

    } catch (error) {

      console.error(
        "================================="
      );

      console.error(
        "FETCH SALON BOOKINGS ERROR:"
      );

      console.error(
        "STATUS:",
        error.response?.status
      );

      console.error(
        "BACKEND ERROR:",
        error.response?.data
      );

      console.error(
        "FULL ERROR:",
        error
      );

      console.error(
        "================================="
      );

      setError(
        error.response?.data?.message ||
        "Failed to load bookings"
      );

    } finally {

      setLoading(false);

    }
  }


  // ==========================================
  // LOAD DATA
  // ==========================================

  useEffect(() => {

    // Defer to the next microtask so the setState calls inside
    // fetchSalonAndBookings (setLoading/setError, before its first
    // await) don't run synchronously within this effect.
    queueMicrotask(() => {
      fetchSalonAndBookings();
    });

  }, []);


  // ==========================================
  // UPDATE BOOKING STATUS
  // ==========================================

  async function updateStatus(
    bookingId,
    status
  ) {

    try {

      console.log(
        "UPDATING BOOKING:",
        bookingId,
        status
      );

      const response =
        await bookingAPI.updateStatus(
          bookingId,
          status
        );

      console.log(
        "UPDATE RESPONSE:",
        response.data
      );

      alert(
        response.data?.message ||
        "Booking updated successfully"
      );

      // Refresh bookings from server
      // Better than manually updating local state

      await fetchSalonAndBookings();

    } catch (error) {

      console.error(
        "UPDATE BOOKING ERROR:",
        error.response?.data ||
        error
      );

      alert(
        error.response?.data?.message ||
        "Failed to update booking"
      );

    }
  }


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <div className="salon-bookings-page">

        <div className="loading-state">

          <h2>
            Loading bookings...
          </h2>

        </div>

      </div>

    );

  }


  // ==========================================
  // ERROR
  // ==========================================

  if (error) {

    return (

      <div className="salon-bookings-page">

        <div className="error-state">

          <h2>
            {error}
          </h2>

          <button
            className="btn btn-primary"
            onClick={fetchSalonAndBookings}
          >
            Try Again
          </button>

        </div>

      </div>

    );

  }


  // ==========================================
  // NO SALON
  // ==========================================

  if (!salon) {

    return (

      <div className="salon-bookings-page">

        <div className="no-salon">

          <h2>
            No Salon Profile Found
          </h2>

          <p>
            You need to create your salon
            profile before viewing bookings.
          </p>

        </div>

      </div>

    );

  }


  // ==========================================
  // UI
  // ==========================================

  return (

    <div className="salon-bookings-page">


      {/* HEADER */}

      <header
        className="salon-bookings-header"
      >

        <div>
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
          

          <h1>
            Customer Bookings
          </h1>

          <p
            className="salon-name"
          >
            {salon.salonName}
          </p>

        </div>


        <button
          className="btn btn-outline"
          onClick={fetchSalonAndBookings}
        >

          Refresh Bookings

        </button>

      </header>


      <hr
        className="divider"
      />


      {/* BOOKING COUNT */}

      <div
        className="booking-summary"
      >

        <h3>
          Total Bookings:
          {" "}
          {bookings.length}
        </h3>

      </div>


      {/* EMPTY STATE */}

      {bookings.length === 0 ? (

        <div
          className="empty-state"
        >

          <h2>
            No bookings yet
          </h2>

          <p>
            Customers have not booked any
            appointments yet.
          </p>

          <button
            className="btn btn-primary"
            onClick={fetchSalonAndBookings}
          >

            Refresh

          </button>

        </div>

      ) : (


        /* BOOKINGS */

        <div
          className="bookings-list"
        >

          {bookings.map(
            (booking) => (

              <article
                key={booking._id}
                className="booking-card"
              >


                {/* HEADER */}

                <header
                  className="booking-card-header"
                >

                  <div
                    className="booking-customer"
                  >

                    <h2>
                      Customer Details
                    </h2>

                    <p>

                      <strong>
                        Name:
                      </strong>

                      {" "}

                      {booking.customerId?.name ||
                        "Not available"}

                    </p>


                    <p>

                      <strong>
                        Email:
                      </strong>

                      {" "}

                      {booking.customerId?.email ||
                        "Not available"}

                    </p>


                    <p>

                      <strong>
                        Phone:
                      </strong>

                      {" "}

                      {booking.customerId?.phone ||
                        "Not available"}

                    </p>

                  </div>


                  {/* STATUS */}

                  <span
                    className={`booking-status status-${(booking.status || "pending").toLowerCase()}`}
                  >

                    {booking.status ||
                      "pending"}

                  </span>

                </header>


                {/* DETAILS */}

                <div
                  className="booking-details"
                >


                  {/* SERVICE */}

                  <div
                    className="booking-detail-group"
                  >

                    <h3>
                      Service
                    </h3>


                    <p>

                      <strong>
                        Service:
                      </strong>

                      {" "}

                      {booking.serviceId?.serviceName ||
                        "Not available"}

                    </p>


                    <p>

                      <strong>
                        Price:
                      </strong>

                      {" "}

                      ₹{
                        booking.serviceId?.price ??
                        "Not available"
                      }

                    </p>


                    <p>

                      <strong>
                        Duration:
                      </strong>

                      {" "}

                      {
                        booking.serviceId?.duration ??
                        "Not available"
                      }

                      {" "}
                      minutes

                    </p>

                  </div>


                  {/* APPOINTMENT */}

                  <div
                    className="booking-detail-group"
                  >

                    <h3>
                      Appointment
                    </h3>


                    <p>

                      <strong>
                        Date:
                      </strong>

                      {" "}

                      {booking.slotId?.date ||
                        booking.date ||
                        "Not available"}

                    </p>


                    <p>

                      <strong>
                        Time:
                      </strong>

                      {" "}

                      {
                        booking.slotId?.startTime ||
                        "N/A"
                      }

                      {" - "}

                      {
                        booking.slotId?.endTime ||
                        "N/A"
                      }

                    </p>

                  </div>


                  {/* BOOKING INFO */}

                  <div
                    className="booking-detail-group"
                  >

                    <h3>
                      Booking Information
                    </h3>


                    <p>

                      <strong>
                        Booking ID:
                      </strong>

                      {" "}

                      {booking._id}

                    </p>


                    <p>

                      <strong>
                        Status:
                      </strong>

                      {" "}

                      {booking.status ||
                        "pending"}

                    </p>


                    <p>

                      <strong>
                        Created:
                      </strong>

                      {" "}

                      {
                        booking.createdAt
                          ? new Date(
                              booking.createdAt
                            ).toLocaleString()
                          : "Not available"
                      }

                    </p>

                  </div>


                </div>


                {/* ACTIONS */}

                <footer
                  className="booking-actions"
                >

                  {/* PENDING - NEW BOOKING REQUEST */}

                  {booking.status ===
                    "pending" && (

                    <>

                      <p className="new-request-label">
                        🟡 New Booking Request
                      </p>

                      <button
                        className="btn btn-success"
                        onClick={() =>
                          updateStatus(
                            booking._id,
                            "confirmed"
                          )
                        }
                      >

                        Accept Booking

                      </button>


                      <button
                        className="btn btn-danger"
                        onClick={() =>
                          updateStatus(
                            booking._id,
                            "cancelled"
                          )
                        }
                      >

                        Reject Booking

                      </button>

                    </>

                  )}


                  {/* CONFIRMED */}

                  {booking.status ===
                    "confirmed" && (

                    <button
                      className="btn btn-success"
                      onClick={() =>
                        updateStatus(
                          booking._id,
                          "completed"
                        )
                      }
                    >

                      Mark Completed

                    </button>

                  )}


                  {/* COMPLETED */}

                  {booking.status ===
                    "completed" && (

                    <p>
                      ✅ Appointment completed
                    </p>

                  )}


                  {/* CANCELLED */}

                  {booking.status ===
                    "cancelled" && (

                    <p>
                      ❌ Booking cancelled
                    </p>

                  )}

                </footer>


              </article>

            )
          )}

        </div>

      )}


    </div>

  );

}

export default SalonBookings;