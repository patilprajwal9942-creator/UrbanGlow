import { useState } from "react";
import { IoIosMail } from "react-icons/io";
import { CiLocationOn } from "react-icons/ci";

function Contact() {
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Frontend-only: show success message, no API call
    setShowSuccess(true);
    // Reset form after 3 seconds
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <section className="contact-page">
      <div className="container">
        <header className="page-header">
          <h1>Contact</h1>
        </header>

        {showSuccess ? (
          <div className="success-message">
            <p>Thank you! Your message has been sent successfully.</p>
          </div>
        ) : (
          <div className="contact-form">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" required />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input type="email" required />
              </div>

              <div className="form-group">
                <label>Subject</label>
                <input type="text" required />
              </div>

              <div className="form-group">
                <label>Message</label>
                <textarea rows={4} required></textarea>
              </div>

              <button type="submit" className="btn btn-primary">
                Send Message
              </button>
            </form>
          </div>
        )}

        <div className="contact-info">
          <h3>Contact Information</h3>
          <p><IoIosMail /> support@urbanglow.com</p>
          <p>📞 +91 9876543210</p>
          <p><CiLocationOn /> Pune, Maharashtra</p>
        </div>
      </div>
    </section>
  );
}

export default Contact;