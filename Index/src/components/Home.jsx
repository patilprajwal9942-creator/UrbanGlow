import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer";
import "../../styles/Home.css";

function CustomerHome() {
  return (
    <>
      <Navbar />

      <main className="home-page">
        <div className="home-content">
          <div className="premium-badge">PREMIUM SALON BOOKING</div>

          <h1 className="home-title">
            Your Beauty, <span className="amber">Your Way</span>.
          </h1>

          <p className="home-subtitle">
            Discover trusted salons and book your perfect appointment with UrbanGlow.
          </p>

          <div className="search-box">
            <label htmlFor="search">Location or Salon Name</label>
            <input type="text" id="search" className="search-input" placeholder="Search salons..." />
            <span className="search-icon">🔍</span>
          </div>

          <div className="home-actions">
            <button className="book-btn">Book Appointment →</button>
            <button className="explore-btn">Explore Salons</button>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default CustomerHome;