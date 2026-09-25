import "./Footer.css";
import { IoIosMail } from "react-icons/io";
import { CiLocationOn } from "react-icons/ci";


function Footer() {
  return (
    <footer className="footer">

      <div className="footer-container">

        {/* Company Information */}

        <div className="footer-section">

          <h2>UrbanGlow</h2>

          <p>
            Your trusted online salon booking platform.
            Book appointments anytime, anywhere with ease.
          </p>

        </div>

        {/* Quick Links */}

        <div className="footer-section">

          <h3>Quick Links</h3>

          <ul>

            <li>Home</li>
            <li>Services</li>
            <li>Salons</li>
            <li>Contact</li>

          </ul>

        </div>

        {/* Contact */}

        <div className="footer-section">

          <h3>Contact</h3>

          <p><IoIosMail/> support@urbanglow.com</p>

          <p>📞 +91 9876543210</p>

          <p> <CiLocationOn /> Pune, Maharashtra</p>

        </div>

        {/* Social Media */}

        <div className="footer-section">

          <h3>Follow Us</h3>

          <div className="social-icons">

            <span>📘</span>

            <span>📷</span>

            <span>🐦</span>

            <span>💼</span>

          </div>

        </div>

      </div>

      <hr />

      <p className="copyright">

        © 2026 UrbanGlow. All Rights Reserved.

      </p>

    </footer>
  );
}

export default Footer;