import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiSearch, FiChevronDown } from "react-icons/fi";
import "../../styles/HelpCenter.css";

function HelpCenter() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      category: "Booking",
      question: "How do I book an appointment?",
      answer:
        "Choose a salon, select the service you want, choose an available date and time slot, and confirm your booking.",
    },
    {
      category: "Booking",
      question: "How do I select a date and time slot?",
      answer:
        "After selecting a salon and service, choose an available date. The available time slots for that date will then be displayed.",
    },
    {
      category: "Booking",
      question: "Can I cancel my booking?",
      answer:
        "Yes. Open My Bookings, select the booking you want to cancel, and use the cancellation option if the booking is still eligible for cancellation.",
    },
    {
      category: "Appointment",
      question: "What happens if my selected slot is unavailable?",
      answer:
        "If the selected slot is already booked, choose another available time slot.",
    },
    {
      category: "Services",
      question: "How can I find a particular service?",
      answer:
        "Use the Services page to browse available beauty and wellness services.",
    },
    {
      category: "Salon",
      question: "How can I find a salon?",
      answer:
        "Use the salon search and browsing options to find available salons.",
    },
    {
      category: "Account",
      question: "How can I update my profile?",
      answer:
        "Open your account profile section and update the information you want to change.",
    },
    {
      category: "Account",
      question: "How can I reset my password?",
      answer:
        "Use the Forgot Password option on the login page and follow the password reset process.",
    },
    {
      category: "Technical Issue",
      question: "I cannot log in. What should I do?",
      answer:
        "Check your email and password first. If the problem continues, contact support and describe the issue.",
    },
    {
      category: "Booking",
      question: "My booking is not showing. What should I do?",
      answer:
        "Refresh My Bookings and check again. If the booking is still missing, submit a support ticket with the relevant booking details.",
    },
    {
      category: "Appointment",
      question: "I have an issue with my appointment.",
      answer:
        "If your issue is related to a specific appointment, you can submit a support ticket and provide your booking ID.",
    },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const value = search.toLowerCase();

    return (
      faq.question.toLowerCase().includes(value) ||
      faq.answer.toLowerCase().includes(value) ||
      faq.category.toLowerCase().includes(value)
    );
  });

  function toggleFaq(index) {
    setOpenIndex(openIndex === index ? null : index);
  }

  return (
    <div className="help-page">

      <div className="help-container">

        {/* HEADER */}

        <div className="help-header">

          <button
            className="help-back-btn"
            onClick={() => navigate("/dashboard")}
          >
            <FiArrowLeft />
            Back to Dashboard
          </button>

          <h1>Help Center</h1>

          <p>
            Find answers to common questions or contact our support team.
          </p>

        </div>

        {/* SEARCH */}

        <div className="help-search">

          <FiSearch />

          <input
            type="text"
            placeholder="Search your question..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

        </div>

        {/* FAQ */}

        <div className="faq-section">

          <div className="faq-heading">
            <h2>Frequently Asked Questions</h2>

            <p>
              Find quick answers to common questions.
            </p>
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="faq-empty">
              <h3>No results found</h3>

              <p>
                Try searching with a different keyword.
              </p>
            </div>
          ) : (
            <div className="faq-list">

              {filteredFaqs.map((faq, index) => (

                <div
                  className={`faq-item ${
                    openIndex === index ? "open" : ""
                  }`}
                  key={index}
                >

                  <button
                    className="faq-question"
                    onClick={() => toggleFaq(index)}
                  >

                    <div>
                      <span className="faq-category">
                        {faq.category}
                      </span>

                      <span className="faq-question-text">
                        {faq.question}
                      </span>
                    </div>

                    <FiChevronDown />

                  </button>

                  {openIndex === index && (
                    <div className="faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  )}

                </div>

              ))}

            </div>
          )}

        </div>

        {/* CONTACT SUPPORT */}

        <div className="contact-support-card">

          <div>
            <h2>Still need help?</h2>

            <p>
              Can't find the answer you're looking for?
              Submit a support ticket and tell us about your issue.
            </p>
          </div>

          <button
            onClick={() => navigate("/support")}
          >
            Contact Support
          </button>

        </div>

      </div>

    </div>
  );
}

export default HelpCenter;