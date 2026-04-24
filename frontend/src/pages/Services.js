import React, { useMemo, useState } from "react";
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

  const filteredCategories = useMemo(() => {
    const value = searchTerm.toLowerCase().trim();

    if (!value) return categories;

    return categories.filter(
      (category) =>
        category.title.toLowerCase().includes(value) ||
        category.description.toLowerCase().includes(value)
    );
  }, [searchTerm]);

  return (
    <div className="services-page">
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
              placeholder="Search categories or services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="button">Search</button>
          </div>
        </div>
      </section>

      <section className="suggested-services-section">
        <h2>Suggested Services</h2>
        <p>Popular services users often look for first.</p>

        <div className="suggested-services">
          {suggestedServices.map((item, index) => (
            <Link
              to="/category"
              state={{ category: item.category, service: item.service }}
              className="suggested-service-chip"
              key={index}
              style={{ textDecoration: "none" }}
            >
              {item.service}
            </Link>
          ))}
        </div>
      </section>

      <section className="explore-categories-section">
        <h2>Browse by Category</h2>
        <p>Choose a category to explore available services and providers.</p>

        <div className="services-grid">
          {filteredCategories.map((category, index) => (
            <Link
              to="/category"
              state={{ category: category.title }}
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

        {filteredCategories.length === 0 && (
          <div className="empty-search-state">
            No categories matched your search.
          </div>
        )}
      </section>
    </div>
  );
}

export default Services;