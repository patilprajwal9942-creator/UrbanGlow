import "./FeaturedSalons.css";
import { useNavigate } from "react-router-dom";

function FeaturedSalons({ salons = [], search = "" }) {
  const navigate = useNavigate();

  return (
    <section
      className="featured"
      id="salons"
    >

      <div className="featured-header">

        <p className="featured-subtitle">
          DISCOVER & BOOK
        </p>

        <h2>
          Featured <span>Salons</span>
        </h2>

        <p className="featured-description">
          Explore trusted salons and book your
          appointment easily.
        </p>

      </div>


      {/* SEARCH RESULT */}

      {search && (
        <p className="search-result">
          Search results for:
          <strong> "{search}"</strong>
        </p>
      )}


      {/* NO RESULT */}

      {salons.length === 0 ? (

        <div className="no-salons">

          <h3>
            No salons found
          </h3>

          <p>
            Try another salon name or location.
          </p>

        </div>

      ) : (

        <div className="salon-container">

          {salons.map((salon) => (

            <div
              className="salon-card"
              key={salon._id}
            >

              <div className="salon-image-container">

                <img
                  src={
                    salon.image ||
                    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f"
                  }
                  alt={salon.salonName}
                />

                <span className="salon-badge">
                  Available
                </span>

              </div>


              <div className="salon-info">

                <h3>
                  {salon.salonName}
                </h3>

                <p className="salon-owner">
                  Owner: {salon.ownerName}
                </p>

                <div className="salon-detail">
                  <span>📍</span>
                  <p>{salon.address}</p>
                </div>

                <div className="salon-detail">
                  <span>📞</span>
                  <p>{salon.phone}</p>
                </div>


                <button
                  className="salon-book-btn"
                  onClick={() =>
                    navigate(
                      `/salon/${salon._id}`
                    )
                  }
                >
                  Book Appointment →
                </button>

              </div>

            </div>

          ))}

        </div>

      )}

    </section>
  );
}

export default FeaturedSalons;