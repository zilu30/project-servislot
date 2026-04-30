import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import "./ServiceDetails.css";

export default function ServiceDetails() {
  const navigate      = useNavigate();
  const location      = useLocation();
  const [searchParams] = useSearchParams();
  const serviceId     = searchParams.get("id");
  const [service, setService]       = useState(location.state?.service || null);
  const [loading, setLoading]       = useState(!location.state?.service);
  const [availableToday, setAvailableToday] = useState(null); 

  const isLoggedIn = !!sessionStorage.getItem("access");
  const role       = sessionStorage.getItem("role");

  useEffect(() => {
    if (service || !serviceId) return;
    fetch(`http://127.0.0.1:8000/api/services/${serviceId}/`)
      .then((r) => r.json())
      .then((data) => setService(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [service, serviceId]);

  useEffect(() => {
    if (!service?.provider_id) return;
    const today = new Date().toISOString().split("T")[0];
    fetch(
      `http://127.0.0.1:8000/api/available-slots/?provider_id=${service.provider_id}&date=${today}`
    )
      .then((r) => r.json())
      .then((slots) => setAvailableToday(Array.isArray(slots) && slots.length > 0))
      .catch(() => setAvailableToday(false));
  }, [service]);

  const providerName = service?.provider_company || service?.provider_username || "Provider";

  const handleBook = () => {
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

  if (loading) {
    return <div className="sd-loading">Loading service details...</div>;
  }

  if (!service) {
    return (
      <div className="sd-loading">
        <p>Service not found.</p>
        <button className="sd-btn-back" onClick={() => navigate("/services")}>
          Back to Services
        </button>
      </div>
    );
  }

  return (
    <div className="sd-page">
      <div className="sd-container">

        <span className="sd-category-badge">{service.category}</span>
        <h1 className="sd-title">{service.title}</h1>
        <p className="sd-provider">{providerName}</p>
        <div className="sd-chips">
          {service.rating != null && (
            <span className="sd-chip rating">⭐ {service.rating}</span>
          )}
          <span className="sd-chip price">${service.price}</span>
          {availableToday === true  && <span className="sd-chip available">Available today</span>}
          {availableToday === false && <span className="sd-chip unavailable">Book in advance</span>}
        </div>

        <p className="sd-description">{service.description}</p>

        <hr className="sd-divider" />

        <section className="sd-section">
          <h2 className="sd-section-title">Service Details</h2>
          <p className="sd-section-body">
            This service is offered by <strong>{providerName}</strong>. You can
            review the provider information, price, and availability before booking.
          </p>
        </section>

        <hr className="sd-divider" />

        <section className="sd-section">
          <h2 className="sd-section-title">Provider Information</h2>
          <div className="sd-info-rows">
            <div className="sd-info-row">
              <span className="sd-label">Company</span>
              <span className="sd-value">{providerName}</span>
            </div>
            {service.rating != null && (
              <div className="sd-info-row">
                <span className="sd-label">Rating</span>
                <span className="sd-value">{service.rating} / 5</span>
              </div>
            )}
            <div className="sd-info-row">
              <span className="sd-label">Starting Price</span>
              <span className="sd-value">${service.price}</span>
            </div>
            <div className="sd-info-row">
              <span className="sd-label">Availability</span>
              <span className="sd-value">
                {availableToday === true  ? "Available today"  :
                 availableToday === false ? "Book in advance"  :
                 "Checking…"}
              </span>
            </div>
            {service.address && (
              <div className="sd-info-row">
                <span className="sd-label">Address</span>
                <span className="sd-value">{service.address}</span>
              </div>
            )}
          </div>
        </section>

        <div className="sd-actions">
          <button className="sd-btn-back" onClick={() => navigate(-1)}>
            Back to Results
          </button>
          <button className="sd-btn-book" onClick={handleBook}>
            Book This Service
          </button>
        </div>

      </div>
    </div>
  );
}
