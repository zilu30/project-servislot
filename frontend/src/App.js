import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Services from "./pages/Services";
import ServiceDetails from "./pages/ServiceDetails";
import Booking from "./pages/Booking";
import Dashboard from "./pages/Dashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import CategoryResults from "./pages/CategoryResults";
import CustomerLogin from "./pages/CustomerLogin";
import ProviderLogin from "./pages/ProviderLogin";

import "./App.css";
import CustomerSignup from "./pages/CustomerSignup";


// Redirects to login if not authenticated, or if the user's role doesn't match
function ProtectedRoute({ children, requiredRole, loginPath }) {
  const token = sessionStorage.getItem("access");
  const role  = sessionStorage.getItem("role");

  if (!token) {
    return <Navigate to={loginPath || "/customer-login"} replace />;
  }

  if (requiredRole && role !== requiredRole) {
    // input validation for login
    return <Navigate to={loginPath || "/customer-login"} replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/"                element={<Home />} />
        <Route path="/services"        element={<Services />} />
        <Route path="/service-details" element={<ServiceDetails />} />
        <Route path="/category"        element={<CategoryResults />} />
        <Route path="/customer-login"  element={<CustomerLogin />} />
        <Route path="/provider-login"  element={<ProviderLogin />} />
        <Route path="/customer-signup" element={<CustomerSignup />} />

        <Route
          path="/booking"
          element={
            <ProtectedRoute requiredRole="customer" loginPath="/customer-login">
              <Booking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer-dashboard"
          element={
            <ProtectedRoute requiredRole="customer" loginPath="/customer-login">
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="provider" loginPath="/provider-login">
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/provider-signup" element={<Navigate to="/provider-login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
