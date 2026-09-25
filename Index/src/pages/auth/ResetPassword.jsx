import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../../services/api";

function ResetPassword() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ otp: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState("otp" | false);
  const [error, setError] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  function getStoredPhone() {
    return localStorage.getItem("resetPhone");
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear errors when user starts typing
    if (error) {
      setError("");
    }
  }

  async function handleOtpSubmit(e) {
    e.preventDefault();
    setError("");

    const otp = formData.otp;
    const phone = getStoredPhone();

    if (!otp.trim()) {
      setError("OTP is required");
      return;
    }

    if (!phone) {
      setError("Phone number not found. Please try again.");
      return;
    }

    setLoading("otp");

    try {
      const response = await authAPI.verifyOTP({
        phone,
        otp,
        type: "password_reset",
      });

      if (response.data.success) {
        // OTP verified successfully, now show new password form
        // The OTP is already marked as used by the server
        setShowNewPassword(true);
        // Store phone for the reset-password endpoint
        // We need to keep the phone in state or recover it
      } else {
        setError(response.data.message || "OTP verification failed");
        setLoading(false);
      }
    } catch (error) {
      console.log(error);
      setError(
        error.response?.data?.message || "OTP verification failed"
      );
      setLoading(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setError("");

    const { newPassword, confirmPassword } = formData;
    const phone = getStoredPhone();

    if (!newPassword || !confirmPassword) {
      setError("Both password fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading("password");

    try {
      const response = await authAPI.resetPassword({
        phone,
        newPassword,
      });

      if (response.data.success) {
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(response.data.message || "Failed to reset password");
        setLoading(false);
      }
    } catch (error) {
      console.log(error);
      setError(
        error.response?.data?.message || "Failed to reset password"
      );
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">

      <div className="auth-card">

        <h1>UrbanGlow</h1>

        <h2>Reset Password</h2>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        {showNewPassword && (
          <div className="reset-password-form">

            <p>OTP verified successfully</p>
            <p>Enter your new password below</p>

            <form onSubmit={handlePasswordSubmit}>
              <div className="input-box">
                <input
                  type="password"
                  name="newPassword"
                  placeholder="New Password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-box">
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                type="submit"
                className="login-btn"
                disabled={loading === "password"}
              >
                {loading === "password"
                  ? "Updating..."
                  : "Reset Password"}
              </button>
            </form>

            <p>
              <Link to="/login">Go to Login</Link>
            </p>

          </div>
        )}

        {/* OTP Verification Form (shown by default initially) */}
        {!showNewPassword && (
          <form onSubmit={handleOtpSubmit}>
            <p>Enter the OTP sent to your phone</p>

            <div className="input-box">
              <input
                type="tel"
                name="otp"
                placeholder="123456"
                value={formData.otp}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={loading === "otp"}
            >
              {loading === "otp"
                ? "Verifying..."
                : "Verify OTP"}
            </button>
          </form>
        )}

      </div>

    </div>
  );
}

export default ResetPassword;