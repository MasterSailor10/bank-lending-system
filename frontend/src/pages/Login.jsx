import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../App.css";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Login failed");
        setIsLoading(false);
        return;
      }

      // Store token and login status
      localStorage.setItem("token", data.token);
      localStorage.setItem("isLoggedIn", "true");

      setMessage("Login successful! Redirecting...");
      
      setTimeout(() => {
        navigate("/home");
      }, 500);
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Network error. Please check if the server is running.");
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Login to Bank System</h2>

        {message && (
          <div className={`message ${message.includes("successful") ? "success" : "error"}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleLogin}>
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
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="auth-btn" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth-link">
          <Link to="/forgot-password">Forgot Password?</Link>
        </p>

        <p className="auth-link">
          New user? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;