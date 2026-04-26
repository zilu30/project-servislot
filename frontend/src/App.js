import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Services from "./pages/Services";
import Booking from "./pages/Booking";
import Dashboard from "./pages/Dashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import "./App.css";
import CategoryResults from "./pages/CategoryResults";
import CustomerLogin from "./pages/CustomerLogin";


function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/customer-dashboard" element={<CustomerDashboard />} />
        <Route path="/category" element={<CategoryResults />} />
        <Route path="/customer-login" element={<CustomerLogin />} />
      </Routes>
    </Router>
  );
}

export default App;