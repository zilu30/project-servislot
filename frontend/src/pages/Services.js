import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";

const suggestedServices = [
  { service: "Cleaning", category: "Home Services" },
  { service: "Haircuts / Hairstyling", category: "Beauty & Personal Care" },
  { service: "Academic Tutoring", category: "Education & Tutoring" },
  { service: "Phone Repair", category: "Repair & Maintenance" },
  { service: "Personal Training", category: "Fitness & Wellness" },
  { service: "Portrait Photography", category: "Events & Photography" },
];

function Services() {
  const [searchTerm, setSearchTerm] = useState("");
  const [services, setServices] = useState([]);

  // Fetch services from backend
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/services/")
      .then((res) => res.json())
      .then((data) => setServices(data))
      .catch((err) => console.error(err));
  }, []);

  // Filter services based on search
  const filteredServices = useMemo(() => {
    const value = searchTerm.toLowerCase().trim();

    if (!value) return services;

    return services.filter(
      (service) =>
        service.name?.toLowerCase().includes(value) ||
        service.category?.toLowerCase().includes(value)
    );
  }, [searchTerm, services]);

  return (
    <div className="services-page">
      {/* HERO */}
      <section className="services-hero">
        <div className="services-hero-content">
          <h1>Explore Services</h1>
          <p>
            Discover categories, browse popular services, and find the right
            provider before booking an appointment.
          </p>

          <div className="services-search-box">
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="button">Search</button>
          </div>
        </div>
      </section>

      {/* SUGGESTED */}
      <section className="suggested-services-section">
        <h2>Suggested Services</h2>
        <p>Popular services users often look for first.</p>

        <div className="suggested-services">
          {suggestedServices.map((item, index) => (
            <Link
              key={index}
              to="/category"
              state={{
                category: item.category,
                service: item.service,
              }}
              className="suggested-service-chip"
            >
              {item.service}
            </Link>
          ))}
        </div>
      </section>

      {/* SERVICES GRID */}
      <section className="explore-categories-section">
        <h2>Available Services</h2>
        <p>Browse all services from providers.</p>

        <div className="services-grid">
          {filteredServices.map((service, index) => (
            <Link
              key={index}
              to="/category"
              state={{ category: service.category, service: service.name }}
              className="service-card"
            >
              <div className="service-card-top" />
              <h3>{service.name}</h3>
              <p>{service.description}</p>
              <span className="service-count">{service.category}</span>
            </Link>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="empty-search-state">
            No services matched your search.
          </div>
        )}
      </section>
    </div>
  );
}

export default Services;