import React, { useState } from "react";
import { Link } from "react-router-dom";

function CustomerLogin() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
        alert("Please enter your email and password.");
        return;
    }

    // Save user (optional for demo)
    localStorage.setItem(
        "customer",
        JSON.stringify({
        email: formData.email,
        })
    );

    // Redirect WITHOUT popup
    window.location.href = "/customer-dashboard";
};

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-badge">Customer Access</span>
          <h1>Customer Login</h1>
          <p>
            Sign in to manage your bookings, view upcoming appointments, and
            access your customer dashboard.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>Email Address</label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <div className="auth-options">
            <label className="checkbox-row">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              <span>Remember me</span>
            </label>

            <button type="button" className="auth-link-button">
              Forgot password?
            </button>
          </div>

          <button type="submit" className="auth-submit-btn">
            Login
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don’t have an account?{" "}
            <Link to="/" className="auth-inline-link">
              Return Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default CustomerLogin;