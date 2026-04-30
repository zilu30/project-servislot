import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../api/axiosConfig";
import "./Services.css";

// displaying company's name
function providerDisplayName(service) {
  return service.provider_company || service.provider_username || "Provider";
}

export default function ServicesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const qParam        = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || "";
  const filterParam   = searchParams.get("filter") || "";

  const [query, setQuery]       = useState(qParam);
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);

  // Favorites are stored in localStorage 
  const [liked, setLiked] = useState(() => {
    try { return JSON.parse(localStorage.getItem("customer_favorites") || "{}"); } catch { return {}; }
  });

  const isLoggedIn = !!sessionStorage.getItem("access");
  const role       = sessionStorage.getItem("role");

  // Pull favorites from backend 
  useEffect(() => {
    if (!isLoggedIn || role !== "customer") return;
    api.get("/services/favorites/")
      .then(r => {
        const map = {};
        r.data.forEach(s => { map[s.id] = s; });
        setLiked(map);
        localStorage.setItem("customer_favorites", JSON.stringify(map));
      })
      .catch(() => {});
  }, [isLoggedIn, role]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/services/")
      .then((r) => r.json())
      .then((data) => setServices(Array.isArray(data) ? data : []))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { setQuery(qParam); }, [qParam]);

  const pageTitle = useMemo(() => {
    if (categoryParam)                return categoryParam;
    if (qParam)                       return `Results for "${qParam}"`;
    if (filterParam === "popular")    return "Popular Services";
    if (filterParam === "quickbook")  return "Quick Book";
    if (filterParam === "new")        return "New Providers";
    return "Explore Services";
  }, [categoryParam, qParam, filterParam]);

  const filtered = useMemo(() => {
    let list = [...services];
    if (categoryParam) list = list.filter((s) => s.category === categoryParam);
    if (qParam) {
      const q = qParam.toLowerCase();
      list = list.filter(
        (s) =>
          s.title?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.category?.toLowerCase().includes(q) ||
          providerDisplayName(s).toLowerCase().includes(q)
      );
    }
    if (filterParam === "new")     list = list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (filterParam === "popular") list = list.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    return list;
  }, [services, categoryParam, qParam, filterParam]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/services?q=${encodeURIComponent(q)}` : "/services");
  };

  const handleBookNow = (service) => {
    if (!isLoggedIn || role !== "customer") {
      sessionStorage.setItem(
        "redirect_after_login",
        `/booking?provider_id=${service.provider_id}&service_id=${service.id}`
      );
      navigate("/customer-login");
    } else {
      navigate(`/booking?provider_id=${service.provider_id}&service_id=${service.id}`);
    }
  };

  const toggleLike = (service) => {
    const isLiked = !!liked[service.id];
    if (isLoggedIn && role === "customer") {
      if (isLiked) {
        api.delete(`/services/favorites/${service.id}/`).catch(() => {});
      } else {
        api.post("/services/favorites/", { service_id: service.id }).catch(() => {});
      }
    }
    setLiked((prev) => {
      const next = { ...prev };
      if (next[service.id]) { delete next[service.id]; }
      else { next[service.id] = service; }
      localStorage.setItem("customer_favorites", JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="srv-page">
      {/* search */}
      <div className="srv-header">
        <span className="srv-badge">Service Providers</span>
        <h1 className="srv-title">{pageTitle}</h1>
        <p className="srv-subtitle">
          {categoryParam
            ? `Browse ${categoryParam} providers and book your appointment online.`
            : "Compare services by provider, price, and availability."}
        </p>

        <form className="srv-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search services, providers, or keywords..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        {!categoryParam && (
          <div className="srv-filter-chips">
            <Link to="/services?filter=popular"   className={`srv-chip ${filterParam === "popular"   ? "active" : ""}`}>Popular</Link>
            <Link to="/services?filter=new"        className={`srv-chip ${filterParam === "new"       ? "active" : ""}`}>New Providers</Link>
            <Link to="/services?filter=quickbook"  className={`srv-chip ${filterParam === "quickbook" ? "active" : ""}`}>Quick Book</Link>
            <Link to="/services"                   className={`srv-chip ${!filterParam && !qParam     ? "active" : ""}`}>All Services</Link>
          </div>
        )}
      </div>

      {/* --- results grid --- */}
      <div className="srv-body">
        {loading ? (
          <div className="srv-loading">Loading services...</div>
        ) : filtered.length === 0 ? (
          <div className="srv-empty">
            <p>No services found{qParam ? ` for "${qParam}"` : ""}.</p>
            <Link to="/services" className="srv-reset-link">View all services</Link>
          </div>
        ) : (
          <div className="srv-grid">
            {filtered.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                liked={!!liked[service.id]}
                onLike={() => toggleLike(service)}
                onBook={() => handleBookNow(service)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* Service card  */
function ServiceCard({ service, liked, onLike, onBook }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const name  = service.provider_company || service.provider_username || "Provider";
  const desc  = service.description || "";
  const short = desc.length > 90 ? desc.slice(0, 90) + "…" : desc;

  return (
    <div className="srv-card">
      <div className="srv-card-top-row">
        <div>
          <h3 className="srv-name">{service.title}</h3>
          <p className="srv-provider-name">{name}</p>
          <p className={`srv-avail ${service.has_availability ? "avail-yes" : "avail-no"}`}>
            {service.has_availability ? "Available" : "No Availability"}
          </p>
        </div>
        <button
          className={`srv-heart ${liked ? "liked" : ""}`}
          onClick={onLike}
          aria-label="Save to favourites"
        >
          {liked ? "♥" : "♡"}
        </button>
      </div>

      {/* Rating, price and location */}
      <div className="srv-chips-row">
        {service.rating != null && (
          <span className="srv-chip-pill rating-chip">⭐ {service.rating}</span>
        )}
        <span className="srv-chip-pill price-chip">${service.price}</span>
        {service.city_state && (
          <span className="srv-chip-pill loc-chip">📍 {service.city_state}</span>
        )}
      </div>

      <p className="srv-desc">{expanded ? desc : short}</p>
      {desc.length > 90 && (
        <button className="srv-toggle" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Show less" : "Show more"}
        </button>
      )}

      <div className="srv-card-btns">
        <button
          className="srv-btn-details"
          onClick={() => navigate(`/service-details?id=${service.id}`, { state: { service } })}
        >
          View More Details
        </button>
        <button className="srv-btn-book" onClick={onBook}>
          Book Now
        </button>
      </div>
    </div>
  );
}
