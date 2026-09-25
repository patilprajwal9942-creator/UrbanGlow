import { useEffect, useState } from "react";
import { salonAPI } from "../../services/api";

import Navbar from "../../components/Navbar/Navbar";
import Hero from "../../components/Hero/Hero";
import NearbySalons from "../../components/NearbySalons/NearbySalons";
import FeaturedSalons from "../../components/FeaturedSalons/FeaturedSalons";
import Footer from "../../components/Footer/Footer";

function CustomerHome() {
  const [salons, setSalons] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch salons
  useEffect(() => {
    async function fetchSalons() {
      try {
        const response = await salonAPI.getAll();

        console.log("SALONS:", response.data);

        setSalons(response.data?.salons || []);
      } catch (error) {
        console.log("Salon Error:", error);

        setError(
          error.response?.data?.message ||
            "Failed to load salons"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchSalons();
  }, []);

  // Search salons
  const filteredSalons = (salons || []).filter((salon) => {
    const searchText = search.trim().toLowerCase();

    // Empty search = show all salons
    if (!searchText) {
      return true;
    }

    const salonName = (
      salon.salonName || ""
    ).toLowerCase();

    const address = (
      salon.address || ""
    ).toLowerCase();

    return (
      salonName.includes(searchText) ||
      address.includes(searchText)
    );
  });

  // Hero button
  function handleBookAppointment() {
    document
      .getElementById("salons")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  }

  // Loading
  if (loading) {
    return (
      <>
        <Navbar />

        <div>
          <h2>Loading salons...</h2>
        </div>
      </>
    );
  }

  // Error
  if (error) {
    return (
      <>
        <Navbar />

        <div>
          <h2>{error}</h2>
        </div>
      </>
    );
  }

  return (
    <div>

      {/* Navbar */}

      <Navbar />

      {/* Hero */}

      <Hero
        search={search}
        setSearch={setSearch}
        onBookAppointment={handleBookAppointment}
      />

      {/* Nearby Salons (browser geolocation) */}

      <NearbySalons />

      {/* Salons */}

      <FeaturedSalons
        salons={filteredSalons}
        search={search}
      />
      <Footer/>
    </div>
  );
}

export default CustomerHome;