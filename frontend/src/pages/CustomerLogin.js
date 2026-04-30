import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";

function CustomerLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.username || !formData.password) {
      setError("Please enter your username and password.");
      return;
    }

    setLoading(true);

    try {
      // Login
      const response = await api.post("/token/", {
        username: formData.username,
        password: formData.password,
      });
      sessionStorage.setItem("access", response.data.access);
      sessionStorage.setItem("refresh", response.data.refresh);

      // Saving user info
      sessionStorage.setItem(
        "user",
        JSON.stringify({
          email: response.data.email,
          username: response.data.username,
        })
      );

      // User profile
      const meResponse = await api.get("/me/");

      const role = meResponse.data.role;

      // Block incorrect role (Customer/ Provider login )
      if (role !== "customer") {
        sessionStorage.clear();
        setError("This account is not a customer account. Use Provider Login.");
        return;
      }

      // Save roll
      sessionStorage.setItem("role", role);
      sessionStorage.setItem("user", JSON.stringify(meResponse.data));
      window.dispatchEvent(new Event("auth-change"));

      // Redirect
      const redirect = sessionStorage.getItem("redirect_after_login");
      if (redirect) {
        sessionStorage.removeItem("redirect_after_login");
        navigate(redirect);
      } else {
        navigate("/customer-dashboard");
      }

    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || "Invalid username or password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-header">
          <span className="auth-badge">Customer Access</span>
          <h1>Customer Login</h1>
          <p>
            Sign in to manage your bookings and access your dashboard.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>

          <label>Username</label>
          <input
            type="text"
            name="username"
            placeholder="Enter your username"
            value={formData.username}
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
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Login"}
          </button>

        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{" "}
            <Link to="/customer-signup" className="auth-inline-link">
              Sign up
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

export default CustomerLogin;