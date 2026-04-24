import React from "react";
import { Link } from "react-router-dom";

const categories = [
  {
    title: "Home Services",
    description: "Cleaning, plumbing, electrical, and more",
    count: "8 services",
  },
  {
    title: "Repair & Maintenance",
    description: "Car, phone, laptop, and handyman services",
    count: "5 services",
  },
  {
    title: "Beauty & Personal Care",
    description: "Haircuts, makeup, nails, massage, and more",
    count: "6 services",
  },
  {
    title: "Education & Tutoring",
    description: "Tutoring, coding, languages, and music",
    count: "5 services",
  },
  {
    title: "Fitness & Wellness",
    description: "Training, yoga, nutrition, and wellness support",
    count: "5 services",
  },
  {
    title: "Events & Photography",
    description: "Photographers, videographers, DJs, and planners",
    count: "4 services",
  },
  {
    title: "Pet Services",
    description: "Walking, grooming, sitting, and home visits",
    count: "4 services",
  },
  {
    title: "Moving & Delivery",
    description: "Movers, delivery, packing, and junk removal",
    count: "4 services",
  },
  {
    title: "Digital & Freelance Services",
    description: "Web, design, content, and social media",
    count: "5 services",
  },
  {
    title: "Professional Services",
    description: "Legal, tax, coaching, and resume help",
    count: "4 services",
  },
  {
    title: "Lifestyle & Personal Help",
    description: "Babysitting, errands, chefs, and house help",
    count: "4 services",
  },
  {
    title: "Security & Tech Setup",
    description: "CCTV, smart home, Wi-Fi, and network setup",
    count: "3 services",
  },
];

const smartCategories = [
  "Popular Near You",
  "Quick Book",
  "Budget Friendly",
  "Repeat Services",
  "New Providers",
];

function Home() {
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

          <div className="search-box">
            <input
              type="text"
              placeholder="Search services like cleaning, tutoring, beauty, repair..."
            />
            <button>Search</button>
          </div>

          <div className="hero-buttons">
            <Link to="/services">
              <button className="btn-primary">Explore Services</button>
            </Link>
            <Link to="/provider-login">
              <button className="btn-secondary">Provider Login</button>
            </Link>
          </div>
        </div>
      </section>

      <section className="services-section">
        <h2>Popular Service Categories</h2>
        <p>Explore a wide range of services and discover the right provider.</p>

        <div className="services-grid">
          {categories.map((category, index) => (
            <Link
              to="/booking"
              state={{ selectedCategory: category.title }}
              className="service-card"
              key={index}
              style={{ textDecoration: "none" }}
            >
              <div className="service-card-top" />
              <h3>{category.title}</h3>
              <p>{category.description}</p>
              <span className="service-count">{category.count}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="smart-categories-section">
        <h2>Smart Categories</h2>
        <p>Quick ways to discover services based on your needs.</p>

        <div className="smart-categories">
          {smartCategories.map((item, index) => (
            <Link
              to="/services"
              className="smart-chip"
              key={index}
              style={{ textDecoration: "none" }}
            >
              {item}
            </Link>
          ))}
        </div>
      </section>

      <section className="features-section">
        <h2>Why Choose ServiSlot?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Easy Discovery</h3>
            <p>
              Browse service categories, explore providers, and find what you
              need without confusion.
            </p>
          </div>
          <div className="feature-card">
            <h3>Real-Time Availability</h3>
            <p>
              View open time slots instantly and choose what best fits your
              schedule.
            </p>
          </div>
          <div className="feature-card">
            <h3>Organized Scheduling</h3>
            <p>
              Providers can manage bookings, availability, and appointments in
              one place.
            </p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>© 2026 ServiSlot. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home;