import {
  useContext,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

import { GoogleLogin } from "@react-oauth/google";

import {
  authAPI,
  adminAuthAPI,
} from "../../services/api";

import {
  AuthContext,
} from "../../context/AuthContext";

import "../../components/Auth/Auth.css";

function Login() {
  const navigate = useNavigate();

  const { login } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // ==========================================
  // HANDLE INPUT CHANGE
  // ==========================================

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  }

  // ==========================================
  // NORMAL LOGIN
  // ==========================================

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");

    // ==========================================
    // EMAIL VALIDATION
    // ==========================================

    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }

    const emailRegex =
      /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

    if (!emailRegex.test(formData.email.trim())) {
      setError("Please provide a valid email");
      return;
    }

    // ==========================================
    // PASSWORD VALIDATION
    // ==========================================

    if (!formData.password) {
      setError("Password is required");
      return;
    }

    try {
      setLoading(true);

      const credentials = {
        email: formData.email.trim(),
        password: formData.password,
      };

      let response;

      // ==========================================
      // TRY NORMAL USER / SALON LOGIN
      // ==========================================

      try {
        response = await authAPI.login(credentials);
      } catch (userLoginError) {
        /*
          Only try admin login when the normal
          auth API says the user was not found.
        */

        if (
          userLoginError.response?.data?.message ===
          "User not found"
        ) {
          response =
            await adminAuthAPI.login(credentials);
        } else {
          throw userLoginError;
        }
      }

      // ==========================================
      // GET USER
      // ==========================================

      const loggedInUser =
        response.data?.user;

      if (!loggedInUser) {
        throw new Error(
          "User information was not returned by the server."
        );
      }

      // ==========================================
      // UPDATE AUTH CONTEXT
      // ==========================================

      login(loggedInUser);

      // ==========================================
      // REDIRECT BASED ON ROLE
      // ==========================================

      if (loggedInUser.role === "salon") {
        navigate(
          "/salon/dashboard",
          { replace: true }
        );
      } else if (
        loggedInUser.role === "admin"
      ) {
        navigate(
          "/admin/dashboard",
          { replace: true }
        );
      } else {
        // CUSTOMER
        navigate(
          "/dashboard",
          { replace: true }
        );
      }
    } catch (error) {
      console.error(
        "Login Error:",
        error
      );

      setError(
        error.response?.data?.message ||
        error.message ||
        "Login Failed"
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // GOOGLE LOGIN SUCCESS
  // ==========================================

  async function handleGoogleSuccess(
    credentialResponse
  ) {
    try {
      setLoading(true);
      setError("");

      const response =
        await authAPI.googleLogin({
          credential:
            credentialResponse.credential,
        });

      const loggedInUser =
        response.data?.user;

      if (!loggedInUser) {
        throw new Error(
          "User information was not returned by the server."
        );
      }

      // Update AuthContext
      login(loggedInUser);

      // ==========================================
      // REDIRECT BASED ON ROLE
      // ==========================================

      if (loggedInUser.role === "salon") {
        navigate(
          "/salon/dashboard",
          { replace: true }
        );
      } else if (
        loggedInUser.role === "admin"
      ) {
        navigate(
          "/admin/dashboard",
          { replace: true }
        );
      } else {
        // CUSTOMER
        navigate(
          "/dashboard",
          { replace: true }
        );
      }
    } catch (error) {
      console.error(
        "Google Login Error:",
        error
      );

      setError(
        error.response?.data?.message ||
        error.message ||
        "Google Login Failed"
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // GOOGLE LOGIN ERROR
  // ==========================================

  function handleGoogleError() {
    console.error(
      "Google Login Failed"
    );

    setError(
      "Google Login Failed. Please try again."
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="auth-container">
      <div className="auth-card">

        <h1>
          UrbanGlow
        </h1>

        <h2>
          Welcome Back 
        </h2>

        <p className="auth-subtitle">
          Log in to book appointments
          and manage your salon visits.
        </p>

        {/* ERROR */}

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        {/* LOGIN FORM */}

        <form onSubmit={handleSubmit}>

          {/* EMAIL */}

          <div className="input-box">
            <FaEnvelope
              className="input-icon"
            />

            <input
              type="email"
              name="email"
              placeholder="Enter Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* PASSWORD */}

          <div className="input-box">

            <FaLock
              className="input-icon"
            />

            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              name="password"
              placeholder="Enter Password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <span
              className="eye"
              onClick={() =>
                setShowPassword(
                  (prev) => !prev
                )
              }
            >
              {showPassword ? (
                <FaEyeSlash />
              ) : (
                <FaEye />
              )}
            </span>

          </div>

          {/* LOGIN BUTTON */}

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>

        </form>

        {/* DIVIDER */}

        <div className="auth-divider">
          <span>
            OR
          </span>
        </div>

        {/* GOOGLE LOGIN */}

        <div className="google-login-container">
          <GoogleLogin
            onSuccess={
              handleGoogleSuccess
            }
            onError={
              handleGoogleError
            }
            width="350"
          />
        </div>

        {/* REGISTER */}

        <p>
          Don't have an account?{" "}
          <Link to="/register">
            Register
          </Link>
        </p>

        {/* FORGOT PASSWORD */}

        <p>
          Forgot Password?{" "}
          <Link to="/forgot-password">
            Reset
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Login;