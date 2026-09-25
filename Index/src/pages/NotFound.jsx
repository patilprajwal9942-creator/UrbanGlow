import { Link } from "react-router-dom";
import "../../styles/NotFound.css";

function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-code">404</div>
      <h1 className="not-found-title">Page Not Found</h1>
      <p className="not-found-message">
        Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
      </p>
      <div className="not-found-actions">
        <Link to="/">
          <button className="btn btn-primary">Go Home</button>
        </Link>
        <Link to="/login">
          <button className="btn btn-outline">Login</button>
        </Link>
      </div>
    </div>
  );
}

export default NotFound;