import "./WhyChooseUs.css";

function WhyChooseUs() {

  const features = [

    {
      id: 1,
      icon: "👨‍💼",
      title: "Expert Stylists",
      description: "Professional and experienced stylists for every service."
    },

    {
      id: 2,
      icon: "📅",
      title: "Easy Booking",
      description: "Book your appointment anytime with just a few clicks."
    },

    {
      id: 3,
      icon: "💰",
      title: "Affordable Prices",
      description: "Premium salon services at budget-friendly prices."
    },

    {
      id: 4,
      icon: "🛡️",
      title: "Trusted Salons",
      description: "Verified salons with genuine customer reviews."
    }

  ];

  return (

    <section className="why">

      <h2>Why Choose UrbanGlow?</h2>

      <div className="why-container">

        {
          features.map((feature) => (

            <div className="why-card" key={feature.id}>

              <div className="why-icon">
                {feature.icon}
              </div>

              <h3>{feature.title}</h3>

              <p>{feature.description}</p>

            </div>

          ))
        }

      </div>

    </section>

  );

}

export default WhyChooseUs;