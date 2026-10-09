import "./Categories.css";

function Categories() {

  const services = [
    {
      id: 1,
      icon: "💇‍♂️",
      name: "Hair Cut"
    },
    {
      id: 2,
      icon: "💆",
      name: "Facial"
    },
    {
      id: 3,
      icon: "🧖",
      name: "Spa"
    },
    {
      id: 4,
      icon: "💅",
      name: "Manicure"
    },
    {
      id: 5,
      icon: "🧔",
      name: "Beard"
    },
    {
      id: 6,
      icon: "💄",
      name: "Makeup"
    }
  ];

  return (

    <section className="categories">

      <h2>Our Services</h2>

      <div className="category-container">

        {
          services.map((service) => (

            <div className="card" key={service.id}>

              <h1>{service.icon}</h1>

              <h3>{service.name}</h3>

            </div>

          ))
        }

      </div>

    </section>

  );

}

export default Categories;