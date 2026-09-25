import { useEffect, useState } from "react";
import { salonAPI, analyticsAPI } from "../../services/api";
import "./TransactionHistory.css";

const FILTERS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7days", label: "Last 7 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "all", label: "All Time" },
  { value: "custom", label: "Custom Range" },
];

function TransactionHistory() {

  const [salon, setSalon] = useState(null);

  const [transactions, setTransactions] =
    useState([]);

  const [filter, setFilter] =
    useState("all");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [totalPages, setTotalPages] =
    useState(1);

  const [total, setTotal] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ==========================================
  // FETCH TRANSACTIONS
  // ==========================================

  async function fetchTransactions(
    salonId,
    targetPage = 1,
    targetFilter = filter,
    targetStart = startDate,
    targetEnd = endDate
  ) {

    if (!salonId) {
      return;
    }


    if (
      targetFilter === "custom" &&
      (!targetStart || !targetEnd)
    ) {
      return;
    }


    try {

      const params = {
        filter: targetFilter,
        page: targetPage,
        limit: 20,
      };


      // ==========================================
      // CUSTOM DATE RANGE
      // ==========================================

      if (targetFilter === "custom") {

        params.startDate =
          targetStart;

        params.endDate =
          targetEnd;

      }


      const response =
        await analyticsAPI.getTransactions(
          salonId,
          params
        );


      // ==========================================
      // UPDATE STATE AFTER API RESPONSE
      // ==========================================

      setTransactions(
        response.data?.transactions || []
      );


      setTotalPages(
        response.data?.totalPages || 1
      );


      setTotal(
        response.data?.total || 0
      );


      setPage(
        targetPage
      );


      setError("");


    } catch (error) {

      console.error(
        "Fetch Transactions Error:",
        error
      );


      setError(
        error.response?.data?.message ||
        "Failed to load transactions"
      );


    } finally {

      setLoading(false);

    }

  }


  // ==========================================
  // INITIAL LOAD
  // FETCH SALON
  // ==========================================

  useEffect(() => {

    async function initialize() {

      try {

        const salonResponse =
          await salonAPI.getMySalon();


        const salonData =
          salonResponse.data?.salon ||
          salonResponse.data?.data ||
          salonResponse.data;


        // ==========================================
        // NO SALON
        // ==========================================

        if (!salonData?._id) {

          setSalon(null);

          setLoading(false);

          return;

        }


        // ==========================================
        // SALON FOUND
        // ==========================================

        setSalon(
          salonData
        );


        // ==========================================
        // FETCH INITIAL TRANSACTIONS
        // ==========================================

        await fetchTransactions(
          salonData._id,
          1,
          "all",
          "",
          ""
        );


      } catch (error) {

        console.error(
          "Initialize Transactions Error:",
          error
        );


        if (
          error.response?.status === 404
        ) {

          setSalon(null);

        } else {

          setError(
            error.response?.data?.message ||
            "Failed to load transactions"
          );

        }


        setLoading(false);

      }

    }


    // Run async function

    initialize();


    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, []);



  // ==========================================
  // FETCH WHEN FILTER CHANGES
  // ==========================================

  useEffect(() => {

    // Don't run until salon exists

    if (!salon?._id) {

      return;

    }

        
    // Custom filter requires both dates

    if (
      filter === "custom" &&
      (!startDate || !endDate)
    ) {

      return;

    }


    // Skip initial ALL fetch
    // because initialize() already fetched it

    if (
      filter === "all" &&
      page === 1 &&
      transactions.length === 0
    ) {

      return;

    }


    async function loadTransactions() {

      setLoading(true);

      await fetchTransactions(
        salon._id,
        1,
        filter,
        startDate,
        endDate
      );

    }


    loadTransactions();


    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [
    filter,
    startDate,
    endDate
  ]);



  // ==========================================
  // HANDLE FILTER CHANGE
  // ==========================================

  function handleFilterChange(
    newFilter
  ) {

    setPage(1);

    setFilter(
      newFilter
    );


    // Reset custom dates
    // when switching to another filter

    if (
      newFilter !== "custom"
    ) {

      setStartDate("");

      setEndDate("");

    }

  }



  // ==========================================
  // PAGE CHANGE
  // ==========================================

  async function goToPage(
    newPage
  ) {

    if (
      newPage < 1 ||
      newPage > totalPages ||
      !salon?._id
    ) {

      return;

    }


    try {

      setLoading(true);


      await fetchTransactions(
        salon._id,
        newPage,
        filter,
        startDate,
        endDate
      );


    } catch (error) {

      console.error(
        error
      );

    }

  }



  // ==========================================
  // RETRY
  // ==========================================

  async function retryFetch() {

    if (!salon?._id) {

      return;

    }


    try {

      setLoading(true);

      setError("");


      await fetchTransactions(
        salon._id,
        page,
        filter,
        startDate,
        endDate
      );


    } catch (error) {

      console.error(
        error
      );

    }

  }



  // ==========================================
  // NO SALON
  // ==========================================

  if (
    !loading &&
    !salon
  ) {

    return (

      <div className="transaction-history-page">

        <div className="no-salon">

          <h2>
            No Salon Profile Found
          </h2>

          <p>
            Create your salon profile to
            view transactions.
          </p>

        </div>

      </div>

    );

  }



  // ==========================================
  // UI
  // ==========================================

  return (

    <div className="transaction-history-page">


      {/* ======================================
          HEADER
      ====================================== */}

      <header className="transaction-history-header">

        <h1>
          Transaction History
        </h1>


        {salon?.salonName && (

          <p>
            {salon.salonName}
          </p>

        )}

      </header>



      {/* ======================================
          FILTER BAR
      ====================================== */}

      <div className="filter-bar">

        {FILTERS.map((f) => (

          <button

            key={f.value}

            className={`filter-btn ${
              filter === f.value
                ? "active"
                : ""
            }`}

            onClick={() =>
              handleFilterChange(
                f.value
              )
            }

          >

            {f.label}

          </button>

        ))}

      </div>



      {/* ======================================
          CUSTOM RANGE
      ====================================== */}

      {filter === "custom" && (

        <div className="custom-range-bar">


          <label>

            From

            <input

              type="date"

              value={startDate}

              onChange={(e) =>
                setStartDate(
                  e.target.value
                )
              }

            />

          </label>



          <label>

            To

            <input

              type="date"

              value={endDate}

              onChange={(e) =>
                setEndDate(
                  e.target.value
                )
              }

            />

          </label>


        </div>

      )}



      {/* ======================================
          LOADING
      ====================================== */}

      {loading ? (

        <div className="loading-state">

          <h2>
            Loading transactions...
          </h2>

        </div>


      ) : error ? (

        <div className="error-state">


          <h2>
            Failed to load transactions
          </h2>


          <p>
            {error}
          </p>


          <button

            className="btn-retry"

            onClick={retryFetch}

          >

            Try Again

          </button>


        </div>


      ) : transactions.length === 0 ? (

        <div className="empty-state">


          <h2>
            No transactions found
          </h2>


          <p>
            No completed bookings
            match this filter.
          </p>


        </div>


      ) : (

        <>


          {/* ==================================
              TOTAL
          ================================== */}

          <p className="transaction-total">

            {total} transaction
            {total !== 1
              ? "s"
              : ""}

          </p>



          {/* ==================================
              TRANSACTION LIST
          ================================== */}

          <div className="transaction-table">


            {transactions.map(
              (tx) => (

                <div

                  key={tx.bookingId}

                  className="transaction-card"

                >


                  {/* CUSTOMER */}

                  <div className="transaction-card-row">


                    <span className="tx-label">

                      Customer

                    </span>


                    <span className="tx-value">

                      {tx.customerName}

                    </span>


                  </div>



                  {/* SERVICE */}

                  <div className="transaction-card-row">


                    <span className="tx-label">

                      Service

                    </span>


                    <span className="tx-value">

                      {tx.serviceName}

                    </span>


                  </div>



                  {/* APPOINTMENT */}

                  <div className="transaction-card-row">


                    <span className="tx-label">

                      Appointment

                    </span>


                    <span className="tx-value">


                      {
                        tx.appointmentDate ||
                        "Not available"
                      }


                      {
                        tx.appointmentTime
                          ? ` (${tx.appointmentTime})`
                          : ""
                      }


                    </span>


                  </div>



                  {/* COMPLETED DATE */}

                  <div className="transaction-card-row">


                    <span className="tx-label">

                      Completed On

                    </span>


                    <span className="tx-value">


                      {
                        tx.completedAt

                          ? new Date(
                              tx.completedAt
                            ).toLocaleString()

                          : "Not available"
                      }


                    </span>


                  </div>



                  {/* FOOTER */}

                  <div className="transaction-card-footer">


                    <span className="tx-amount">

                      ₹{tx.amount}

                    </span>


                    <span className="tx-status">

                      Completed

                    </span>


                  </div>


                </div>

              )
            )}


          </div>



          {/* ==================================
              PAGINATION
          ================================== */}

          <div className="pagination-bar">


            <button

              className="btn-page"

              disabled={
                page <= 1
              }

              onClick={() =>
                goToPage(
                  page - 1
                )
              }

            >

              Previous

            </button>



            <span className="page-info">

              Page {page}
              {" "}
              of
              {" "}
              {totalPages}

            </span>



            <button

              className="btn-page"

              disabled={
                page >= totalPages
              }

              onClick={() =>
                goToPage(
                  page + 1
                )
              }

            >

              Next

            </button>


          </div>


        </>

      )}


    </div>

  );

}

export default TransactionHistory;