import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import "./ProviderAuth.css";

const CATEGORIES = [
  "Home Services", "Repair & Maintenance", "Beauty & Personal Care",
  "Education & Tutoring", "Fitness & Wellness", "Events & Photography",
  "Pet Services", "Moving & Delivery", "Professional Services",
];

export default function ProviderLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); 

  // Login state 
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError]   = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup state 
  const [signupForm, setSignupForm] = useState({
    company_name: "", owner_name: "", email: "",
    phone_number: "", category: "", password: "", confirmPassword: "",
  });
  const [signupError, setSignupError]   = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const finishAuth = (tokens, userData) => {
    sessionStorage.setItem("access",  tokens.access);
    sessionStorage.setItem("refresh", tokens.refresh);
    sessionStorage.setItem("role",    "provider");
    sessionStorage.setItem("user",    JSON.stringify(userData));
    window.dispatchEvent(new Event("auth-change"));
    navigate("/dashboard");
  };

  // Login submit 
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    if (!loginForm.username || !loginForm.password) {
      setLoginError("Please enter your username and password.");
      return;
    }
    setLoginLoading(true);
    try {
      const { data } = await api.post("/token/", {
        username: loginForm.username,
        password: loginForm.password,
      });

      sessionStorage.setItem("access",  data.access);
      sessionStorage.setItem("refresh", data.refresh);

      const me = await api.get("/me/");
      if (me.data.role !== "provider") {
        sessionStorage.clear();
        setLoginError("This account is not a provider account. Use Customer Login.");
        return;
      }
      finishAuth(data, me.data);
    } catch (err) {
      setLoginError(err.response?.data?.detail || "Invalid username or password.");
    } finally {
      setLoginLoading(false);
    }
  };

  // Signup submit 
  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupError("");

    const { company_name, owner_name, email, phone_number, category, password, confirmPassword } = signupForm;
    if (!company_name || !owner_name || !email || !phone_number || !category || !password) {
      setSignupError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setSignupError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setSignupError("Password must be at least 8 characters.");
      return;
    }

    setSignupLoading(true);
    try {
      // Create account 
      await api.post("/signup/", {
        username:     owner_name,
        email,
        password,
        role:         "provider",
        company_name,
        phone_number,
        category,
      });
      const { data } = await api.post("/token/", { username: owner_name, password });
      sessionStorage.setItem("access",  data.access);
      sessionStorage.setItem("refresh", data.refresh);
      const me = await api.get("/me/");
      finishAuth(data, me.data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setSignupError(typeof detail === "string" ? detail : "Registration failed. Please try again.");
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="pa-page">
      <div className="pa-card">
        {/* Badge + title */}
        <div className="pa-header">
          <span className="pa-badge">Provider Access</span>
          <h1 className="pa-title">
            {mode === "login" ? "Provider Login" : "Create Provider Account"}
          </h1>
          <p className="pa-sub">
            {mode === "login"
              ? "Sign in to manage your services, bookings, and scheduling."
              : "Set up your provider profile to start accepting bookings."}
          </p>
        </div>

        {/* Toggle tabs */}
        <div className="pa-tabs">
          <button
            className={`pa-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => { setMode("login"); setLoginError(""); }}
          >
            Login
          </button>
          <button
            className={`pa-tab ${mode === "signup" ? "active" : ""}`}
            onClick={() => { setMode("signup"); setSignupError(""); }}
          >
            Create Account
          </button>
        </div>

        {/* Login form */}
        {mode === "login" && (
          <form className="pa-form" onSubmit={handleLogin}>
            <div className="pa-field">
              <label>Username</label>
              <input
                type="text"
                placeholder="Enter your username"
                value={loginForm.username}
                onChange={(e) => setLoginForm((p) => ({ ...p, username: e.target.value }))}
                required
              />
            </div>
            <div className="pa-field">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={loginForm.password}
                onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                required
              />
            </div>
            {loginError && <p className="pa-error">{loginError}</p>}
            <button type="submit" className="pa-btn" disabled={loginLoading}>
              {loginLoading ? "Signing in…" : "Login"}
            </button>
          </form>
        )}

        {/* Signup form  */}
        {mode === "signup" && (
          <form className="pa-form" onSubmit={handleSignup}>
            <div className="pa-grid-2">
              <div className="pa-field">
                <label>Business Name</label>
                <input
                  type="text"
                  placeholder="e.g. Spark Home Care"
                  value={signupForm.company_name}
                  onChange={(e) => setSignupForm((p) => ({ ...p, company_name: e.target.value }))}
                  required
                />
              </div>
              <div className="pa-field">
                <label>Your Name</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={signupForm.owner_name}
                  onChange={(e) => setSignupForm((p) => ({ ...p, owner_name: e.target.value }))}
                  required
                />
              </div>
              <div className="pa-field">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="business@email.com"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm((p) => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>
              <div className="pa-field">
                <label>Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. 4161234567"
                  value={signupForm.phone_number}
                  onChange={(e) => setSignupForm((p) => ({ ...p, phone_number: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="pa-field">
              <label>Service Category</label>
              <select
                value={signupForm.category}
                onChange={(e) => setSignupForm((p) => ({ ...p, category: e.target.value }))}
                required
              >
                <option value="">— Select your main category —</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="pa-grid-2">
              <div className="pa-field">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="At least 8 characters"
                  value={signupForm.password}
                  onChange={(e) => setSignupForm((p) => ({ ...p, password: e.target.value }))}
                  required
                />
              </div>
              <div className="pa-field">
                <label>Confirm Password</label>
                <input
                  type="password"
                  placeholder="Repeat password"
                  value={signupForm.confirmPassword}
                  onChange={(e) => setSignupForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  required
                />
              </div>
            </div>
            {signupError && <p className="pa-error">{signupError}</p>}
            <button type="submit" className="pa-btn" disabled={signupLoading}>
              {signupLoading ? "Creating account…" : "Create Account & Go to Dashboard"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
