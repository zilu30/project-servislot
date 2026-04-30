import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const CATEGORY_META = {
  "Home Services":           { description: "Cleaning, plumbing, electrical, and more" },
  "Repair & Maintenance":    { description: "Car, phone, laptop, and handyman services" },
  "Beauty & Personal Care":  { description: "Haircuts, makeup, nails, massage, and more" },
  "Education & Tutoring":    { description: "Tutoring, coding, languages, and music" },
  "Fitness & Wellness":      { description: "Training, yoga, nutrition, and wellness support" },
  "Events & Photography":    { description: "Photographers, videographers, DJs, and planners" },
  "Pet Services":            { description: "Walking, grooming, sitting, and home visits" },
  "Moving & Delivery":       { description: "Movers, delivery, packing, and junk removal" },
  "Professional Services":   { description: "Legal, tax, coaching, and resume help" },
};
const SMART_CHIPS = [
  { label: "Popular Near You", filter: "popular" },
  { label: "Quick Book",       filter: "quickbook" },
  { label: "New Providers",    filter: "new" },
];

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [categoryCounts, setCategoryCounts] = useState({});
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/services/")
      .then((r) => r.json())
      .then((services) => {
        const counts = {};
        services.forEach((s) => {
          counts[s.category] = (counts[s.category] || 0) + 1;
        });
        setCategoryCounts(counts);
      })
      .catch(() => {}); 
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/services?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const categories = Object.entries(CATEGORY_META).map(([title, meta]) => ({
    title,
    description: meta.description,
    count: categoryCounts[title] ?? 0,
  }));

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <h1>
            Smarter booking with <span>ServiSlot</span>
          </h1>
          <p>
            Explore trusted services, discover providers, and book appointments
            with a faster and more organized experience for both customers and
            service professionals.
          </p>

          <form className="search-box" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search services like cleaning, tutoring, beauty, repair..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>

          <div className="smart-chips-hero">
            {SMART_CHIPS.map((chip) => (
              <Link
                key={chip.filter}
                to={`/services?filter=${chip.filter}`}
                className="smart-chip"
              >
                {chip.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categry grid */}
      <section className="services-section">
        <h2>Popular Service Categories</h2>
        <p>Explore a wide range of services and discover the right provider.</p>

        <div className="services-grid">
          {categories.map((cat) => (
            <Link
              key={cat.title}
              to={`/services?category=${encodeURIComponent(cat.title)}`}
              className="service-card"
              style={{ textDecoration: "none" }}
            >
              <div className="service-card-top" />
              <h3>{cat.title}</h3>
              <p>{cat.description}</p>
              <span className="service-count">
                {cat.count} {cat.count === 1 ? "service" : "services"}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <h2>Why Choose ServiSlot?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Easy Discovery</h3>
            <p>Browse service categories, explore providers, and find what you need without confusion.</p>
          </div>
          <div className="feature-card">
            <h3>Real-Time Availability</h3>
            <p>View open time slots instantly and choose what best fits your schedule.</p>
          </div>
          <div className="feature-card">
            <h3>Organized Scheduling</h3>
            <p>Providers can manage bookings, availability, and appointments in one place.</p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>© 2026 ServiSlot. All rights reserved.</p>
      </footer>
    </div>
  );
}
