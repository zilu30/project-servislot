import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

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

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!formData.email || !formData.password) {
    alert("Please enter your email and password.");
    return;
  }

  try {
    const response = await axios.post("http://127.0.0.1:8000/api/token/", {
      username: formData.email,   
      password: formData.password,
    });

    // Save tokens
    localStorage.setItem("access", response.data.access);
    localStorage.setItem("refresh", response.data.refresh);

    // Optional user info
    localStorage.setItem(
      "customer",
      JSON.stringify({ email: formData.email })
    );

    // Redirect
    window.location.href = "/customer-dashboard";
  } catch (error) {
    console.error(error);
    alert("Invalid email or password");
  }
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