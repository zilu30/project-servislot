import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <h2>ServiSlot</h2>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/services">Explore Services</Link>
        <Link to="/customer-login" className="btn-nav-light">
          Customer Login
        </Link>
        <Link to="/provider-login" className="btn-nav">
          Provider Login
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;