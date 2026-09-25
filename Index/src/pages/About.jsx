function About() {
  return (
    <section className="about-page">
      <div className="container">
        <header className="page-header">
          <h1>About UrbanGlow</h1>
          <p>
            Your trusted platform for discovering and booking beauty salon appointments.
          </p>
        </header>

        <div className="about-content">
          <section className="about-what-is">
            <h2>What is UrbanGlow?</h2>
            <p>
              UrbanGlow is an online marketplace connecting customers with professional
              beauty salons. We make it easy to find, compare, and book appointments at
              salons near you.
            </p>
          </section>

          <section className="about-discovery">
            <h2>Salon Discovery</h2>
            <p>
              Browse a wide selection of salons with verified reviews, photos, and
              service menus. Filter by location, price, and rating to find the perfect
              salon for any occasion.
            </p>
          </section>

          <section className="about-services">
            <h2>Service Browsing</h2>
            <p>
              Explore detailed service listings for each salon. View pricing, duration,
              and descriptions before booking. Everything you need to make an informed
              decision is just a click away.
            </p>
          </section>

          <section className="about-booking">
            <h2>Appointment / Slot Booking</h2>
            <p>
              Select your preferred service, time slot, and salon with our intuitive
              booking calendar. Confirm your appointment in seconds and receive
              reminders so you never miss your visit.
            </p>
          </section>

          <section className="about-benefits-customers">
            <h2>Benefits for Customers</h2>
            <ul>
              <li>Instant booking anytime, anywhere</li>
              <li>Verified salons and stylists</li>
              <li>Transparent pricing and reviews</li>
              <li>Flexible cancellation and rescheduling</li>
              <li>Digital appointment records</li>
            </ul>
          </section>

          <section className="about-benefits-salon">
            <h2>Benefits for Salon Owners</h2>
            <ul>
              <li>Reach more customers in your area</li>
              <li>Fill appointment slots efficiently</li>
              <li>Showcase services and pricing</li>
              <li>Manage bookings and calendar easily</li>
              <li>Build reputation through customer reviews</li>
            </ul>
          </section>
        </div>
      </div>
    </section>
  );
}

export default About;