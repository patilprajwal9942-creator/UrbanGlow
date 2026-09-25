import "./Testimonials.css";

function Testimonials() {

  const reviews = [

    {
      id: 1,
      name: "Priya Sharma",
      rating: "⭐⭐⭐⭐⭐",
      review: "Amazing service! The stylist was very professional and friendly."
    },

    {
      id: 2,
      name: "Rahul Patil",
      rating: "⭐⭐⭐⭐⭐",
      review: "Easy booking process and the salon was clean and hygienic."
    },

    {
      id: 3,
      name: "Sneha Joshi",
      rating: "⭐⭐⭐⭐⭐",
      review: "Loved the experience. I will definitely book again."
    }

  ];

  return (

    <section className="testimonials">

      <h2>What Our Customers Say</h2>

      <div className="testimonial-container">

        {

          reviews.map((review) => (

            <div className="testimonial-card" key={review.id}>

              <div className="user">

                👤

              </div>

              <p className="rating">

                {review.rating}

              </p>

              <p className="review">

                "{review.review}"

              </p>

              <h4>

                {review.name}

              </h4>

            </div>

          ))

        }

      </div>

    </section>

  );

}

export default Testimonials;