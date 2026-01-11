import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../App.css";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Verify, 2: Reset Password
  const [formData, setFormData] = useState({
    customer_id: "",
    email: "",
    new_password: "",
    confirm_password: "",
  });

  const [verifiedCustomer, setVerifiedCustomer] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Step 1: Verify Customer ID and Email
  const handleVerify = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/auth/verify-customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: parseInt(formData.customer_id),
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Verification failed");
        setIsLoading(false);
        return;
      }

      setVerifiedCustomer(data);
      setMessage(`Verification successful! Welcome ${data.name}`);
      setStep(2);
      setIsLoading(false);
    } catch (error) {
      console.error("Verification error:", error);
      setMessage("Network error. Please check if the server is running.");
      setIsLoading(false);
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");

    // Validate passwords match
    if (formData.new_password !== formData.confirm_password) {
      setMessage("Passwords do not match!");
      return;
    }

    // Validate password length
    if (formData.new_password.length < 6) {
      setMessage("Password must be at least 6 characters long!");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: parseInt(formData.customer_id),
          email: formData.email,
          new_password: formData.new_password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Password reset failed");
        setIsLoading(false);
        return;
      }

      setMessage("Password reset successful! Redirecting to login...");
      
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error("Reset password error:", error);
      setMessage("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Forgot Password</h2>

        {message && (
          <div
            className={`message ${
              message.includes("successful") || message.includes("Welcome")
                ? "success"
                : "error"
            }`}
          >
            {message}
          </div>
        )}

        {step === 1 ? (
          // Step 1: Verify Customer ID and Email
          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label htmlFor="customer_id">Customer ID</label>
              <input
                type="number"
                id="customer_id"
                name="customer_id"
                placeholder="Enter your Customer ID"
                value={formData.customer_id}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your registered email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <button type="submit" className="auth-btn" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify Identity"}
            </button>
          </form>
        ) : (
          // Step 2: Reset Password
          <form onSubmit={handleResetPassword}>
            <div className="verified-user-info">
              <p>
                <strong>Customer ID:</strong> {verifiedCustomer?.customer_id}
              </p>
              <p>
                <strong>Name:</strong> {verifiedCustomer?.name}
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="new_password">New Password</label>
              <input
                type="password"
                id="new_password"
                name="new_password"
                placeholder="Enter new password"
                value={formData.new_password}
                onChange={handleChange}
                required
                minLength="6"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm_password">Confirm New Password</label>
              <input
                type="password"
                id="confirm_password"
                name="confirm_password"
                placeholder="Re-enter new password"
                value={formData.confirm_password}
                onChange={handleChange}
                required
                minLength="6"
                disabled={isLoading}
              />
            </div>

            <button type="submit" className="auth-btn" disabled={isLoading}>
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>

            <button
              type="button"
              className="back-btn"
              onClick={() => {
                setStep(1);
                setVerifiedCustomer(null);
                setMessage("");
                setFormData({
                  ...formData,
                  new_password: "",
                  confirm_password: "",
                });
              }}
              disabled={isLoading}
            >
              Back to Verification
            </button>
          </form>
        )}

        <p className="auth-link">
          Remember your password? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;