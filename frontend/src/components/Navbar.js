import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const [role, setRole] = useState(() => sessionStorage.getItem("role"));

  useEffect(() => {
    const sync = () => setRole(sessionStorage.getItem("role"));
    window.addEventListener("auth-change", sync);
    return () => window.removeEventListener("auth-change", sync);
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    setRole(null);
    window.dispatchEvent(new Event("auth-change")); 
    navigate("/");
  };

  return (
    <nav className="navbar">
      <Link to="/" style={{ textDecoration: "none" }} className="logo">
        Servi<span>Slot</span>
      </Link>

      <div className="nav-links">
        <Link to="/">Home</Link>

        {/* --- not logged in --- */}
        {!role && (
          <>
            <Link to="/customer-login" className="btn-nav-light">Customer Login</Link>
            <Link to="/provider-login" className="btn-nav">Provider Login</Link>
          </>
        )}

        {/* --- customer --- */}
        {role === "customer" && (
          <>
            <Link to="/services">Explore Services</Link>
            <button className="btn-nav-logout" onClick={handleLogout}>Logout</button>
            <Link to="/customer-dashboard" className="btn-nav">Dashboard</Link>
          </>
        )}

        {/* --- provider --- */}
        {role === "provider" && (
          <>
            <Link to="/dashboard" className="btn-nav-light">My Dashboard</Link>
            <button className="btn-nav-logout" onClick={handleLogout}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
