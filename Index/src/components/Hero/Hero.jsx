import "./Hero.css";

function Hero({
  search,
  setSearch,
  onBookAppointment,
}) {
  return (
    <section className="hero">

      <div className="hero-content">

        <p className="hero-label">
          ✨ BEAUTY • STYLE • CONFIDENCE
        </p>

        <h1>
          Your Beauty,
          <br />
          <span>Your Way.</span>
        </h1>

        <p className="hero-description">
          Discover trusted salons and book your
          perfect appointment with UrbanGlow.
        </p>

        {/* SEARCH */}

        <div className="hero-search">

          <span>🔍</span>

          <input
            type="text"
            placeholder="Search salon..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        {/* BUTTON */}

        <div className="hero-buttons">

          <button
            className="hero-primary-btn"
            onClick={onBookAppointment}
          >
            Book Appointment →
          </button>

          <button
            className="hero-secondary-btn"
            onClick={onBookAppointment}
          >
            Explore Salons
          </button>

        </div>

      </div>

    </section>
  );
}

export default Hero;