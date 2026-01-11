import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../App.css";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const token = localStorage.getItem("token");
    
    if (isLoggedIn && token) {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    setCustomerId("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:5000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Registration failed");
        setIsLoading(false);
        return;
      }

      setCustomerId(data.customer_id);
      setMessage(`Registration successful! Your Customer ID is: ${data.customer_id}. Redirecting to login...`);

      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      console.error("Registration error:", error);
      setMessage("Network error. Please check if the server is running.");
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Register for Bank System</h2>

        {message && (
          <div className={`message ${message.includes("successful") ? "success" : "error"}`}>
            {message}
            {customerId && (
              <div style={{ marginTop: '10px', fontSize: '16px', fontWeight: 'bold' }}>
                Please save this Customer ID: <span style={{ color: '#667eea' }}>{customerId}</span>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
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
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="auth-btn" disabled={isLoading}>
            {isLoading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="auth-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;