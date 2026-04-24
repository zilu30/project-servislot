import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function BookingForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const passedCategory = location.state?.selectedCategory || "";

  const normalizeCategory = (category) => {
    const categoryMap = {
      "Education & Tutoring": "Education & Tutoring",
      Tutoring: "Education & Tutoring",
      "Home Services": "Home Services",
      "Repair & Maintenance": "Repair & Maintenance",
      "Beauty & Personal Care": "Beauty & Personal Care",
      "Fitness & Wellness": "Fitness & Wellness",
      "Events & Photography": "Events & Photography",
      "Pet Services": "Pet Services",
      "Moving & Delivery": "Moving & Delivery",
      "Digital & Freelance Services": "Digital & Freelance Services",
      "Professional Services": "Professional Services",
      "Lifestyle & Personal Help": "Lifestyle & Personal Help",
      "Security & Tech Setup": "Security & Tech Setup",
    };

    return categoryMap[category] || category;
  };

  const servicesByCategory = {
    "Home Services": [
      {
        name: "Deep Cleaning",
        provider: "Spark Home Care",
        price: "$120",
        duration: "2 hrs",
      },
      {
        name: "Plumbing Repair",
        provider: "FlowFix Services",
        price: "$90",
        duration: "1 hr",
      },
      {
        name: "Electrical Work",
        provider: "BrightWire Solutions",
        price: "$110",
        duration: "1.5 hrs",
      },
      {
        name: "HVAC / AC Repair",
        provider: "CoolAir Experts",
        price: "$140",
        duration: "2 hrs",
      },
    ],
    "Repair & Maintenance": [
      {
        name: "Phone Repair",
        provider: "TechRevive",
        price: "$70",
        duration: "45 mins",
      },
      {
        name: "Laptop Repair",
        provider: "Device Doctors",
        price: "$120",
        duration: "2 hrs",
      },
      {
        name: "Car Maintenance",
        provider: "AutoCare Center",
        price: "$150",
        duration: "2.5 hrs",
      },
    ],
    "Beauty & Personal Care": [
      {
        name: "Haircut",
        provider: "Glow Salon",
        price: "$40",
        duration: "45 mins",
      },
      {
        name: "Makeup Session",
        provider: "Beauty Touch Studio",
        price: "$65",
        duration: "1 hr",
      },
      {
        name: "Facial",
        provider: "Radiance Spa",
        price: "$85",
        duration: "1 hr",
      },
    ],
    "Education & Tutoring": [
      {
        name: "Math Tutoring",
        provider: "Academic Boost",
        price: "$35",
        duration: "1 hr",
      },
      {
        name: "Science Tutoring",
        provider: "Bright Minds Tutoring",
        price: "$40",
        duration: "1 hr",
      },
      {
        name: "English Tutoring",
        provider: "LearnWell Academy",
        price: "$30",
        duration: "1 hr",
      },
    ],
    "Fitness & Wellness": [
      {
        name: "Personal Training",
        provider: "FitCore Coaching",
        price: "$55",
        duration: "1 hr",
      },
      {
        name: "Yoga Session",
        provider: "Calm Flow Studio",
        price: "$45",
        duration: "1 hr",
      },
      {
        name: "Nutrition Consultation",
        provider: "Wellness Path",
        price: "$60",
        duration: "45 mins",
      },
    ],
    "Events & Photography": [
      {
        name: "Event Photography",
        provider: "Moments Media",
        price: "$150",
        duration: "2 hrs",
      },
      {
        name: "Videography",
        provider: "Golden Frame Studio",
        price: "$220",
        duration: "3 hrs",
      },
      {
        name: "DJ Booking",
        provider: "Party Pulse DJs",
        price: "$180",
        duration: "4 hrs",
      },
    ],
    "Pet Services": [
      {
        name: "Dog Walking",
        provider: "Happy Paws Care",
        price: "$25",
        duration: "30 mins",
      },
      {
        name: "Pet Grooming",
        provider: "Fluffy Friends Spa",
        price: "$50",
        duration: "1 hr",
      },
      {
        name: "Pet Sitting",
        provider: "HomePet Helpers",
        price: "$40",
        duration: "1 hr",
      },
    ],
    "Moving & Delivery": [
      {
        name: "Local Moving Help",
        provider: "Swift Move Team",
        price: "$120",
        duration: "2 hrs",
      },
      {
        name: "Furniture Delivery",
        provider: "CarryGo Delivery",
        price: "$75",
        duration: "1 hr",
      },
      {
        name: "Junk Removal",
        provider: "ClearOut Pros",
        price: "$90",
        duration: "1.5 hrs",
      },
    ],
    "Digital & Freelance Services": [
      {
        name: "Website Design",
        provider: "PixelCraft Studio",
        price: "$200",
        duration: "2 hrs",
      },
      {
        name: "Graphic Design",
        provider: "Creative Hive",
        price: "$85",
        duration: "1 hr",
      },
      {
        name: "Social Media Help",
        provider: "BrandLift Media",
        price: "$70",
        duration: "1 hr",
      },
    ],
    "Professional Services": [
      {
        name: "Resume Review",
        provider: "Career Launch Co.",
        price: "$45",
        duration: "45 mins",
      },
      {
        name: "Tax Preparation",
        provider: "Accurate Tax Solutions",
        price: "$95",
        duration: "1 hr",
      },
      {
        name: "Career Coaching",
        provider: "NextStep Coaching",
        price: "$80",
        duration: "1 hr",
      },
    ],
    "Lifestyle & Personal Help": [
      {
        name: "Babysitting",
        provider: "CareNest Helpers",
        price: "$35",
        duration: "1 hr",
      },
      {
        name: "Errand Assistance",
        provider: "DayAssist Services",
        price: "$30",
        duration: "1 hr",
      },
      {
        name: "Personal Chef Visit",
        provider: "HomeTable Chefs",
        price: "$110",
        duration: "2 hrs",
      },
    ],
    "Security & Tech Setup": [
      {
        name: "Wi-Fi Setup",
        provider: "NetPro Setup",
        price: "$65",
        duration: "1 hr",
      },
      {
        name: "CCTV Installation",
        provider: "SafeHome Tech",
        price: "$180",
        duration: "2 hrs",
      },
      {
        name: "Smart Home Setup",
        provider: "SmartNest Solutions",
        price: "$95",
        duration: "1.5 hrs",
      },
    ],
  };

  const [category, setCategory] = useState("");
  const [selectedService, setSelectedService] = useState(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [bookingSubmitted, setBookingSubmitted] = useState(false);

  useEffect(() => {
    if (passedCategory) {
      setCategory(normalizeCategory(passedCategory));
      setSelectedService(null);
      setBookingSubmitted(false);
    }
  }, [passedCategory]);

  const availableServices = useMemo(() => {
    return servicesByCategory[category] || [];
  }, [category]);

  const timeSlots = [
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
  ];

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setSelectedService(null);
    setBookingSubmitted(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setBookingSubmitted(true);
  };

  const handleCancel = () => {
    setSelectedService(null);
    setDate("");
    setTime("");
    setFullName("");
    setEmail("");
    setNotes("");
    setBookingSubmitted(false);
  };

  return (
    <div className="booking-layout">
      <form className="booking-card" onSubmit={handleSubmit}>
        <h2>Appointment Details</h2>

        <label>Service Category</label>
        <select value={category} onChange={handleCategoryChange}>
          <option value="">Select a category</option>
          <option value="Home Services">Home Services</option>
          <option value="Repair & Maintenance">Repair & Maintenance</option>
          <option value="Beauty & Personal Care">Beauty & Personal Care</option>
          <option value="Education & Tutoring">Education & Tutoring</option>
          <option value="Fitness & Wellness">Fitness & Wellness</option>
          <option value="Events & Photography">Events & Photography</option>
          <option value="Pet Services">Pet Services</option>
          <option value="Moving & Delivery">Moving & Delivery</option>
          <option value="Digital & Freelance Services">
            Digital & Freelance Services
          </option>
          <option value="Professional Services">Professional Services</option>
          <option value="Lifestyle & Personal Help">
            Lifestyle & Personal Help
          </option>
          <option value="Security & Tech Setup">Security & Tech Setup</option>
        </select>

        <label>Select a Service</label>
        {category ? (
          <div className="service-options">
            {availableServices.map((service) => (
              <button
                type="button"
                key={service.name}
                className={`service-option-card ${
                  selectedService?.name === service.name ? "selected-service" : ""
                }`}
                onClick={() => setSelectedService(service)}
              >
                <strong>{service.name}</strong>
                <span>{service.provider}</span>
                <small>
                  {service.price} • {service.duration}
                </small>
              </button>
            ))}
          </div>
        ) : (
          <input
            type="text"
            value="Choose a category to view available services."
            readOnly
          />
        )}

        <label>Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <label>Available Time Slots</label>
        <div className="time-slots">
          {timeSlots.map((slot) => (
            <button
              type="button"
              key={slot}
              className={time === slot ? "time-slot selected" : "time-slot"}
              onClick={() => setTime(slot)}
            >
              {slot}
            </button>
          ))}
        </div>

        <label>Full Name</label>
        <input
          type="text"
          placeholder="Enter your full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <label>Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Notes (Optional)</label>
        <textarea
          placeholder="Add any extra details"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows="5"
        />

        <div className="booking-actions">
          <button type="submit" className="submit-booking-btn">
            Confirm Booking
          </button>
          <button
            type="button"
            className="cancel-booking-btn"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      </form>

      <div className="booking-summary-card">
        <h3>Booking Summary</h3>

        <div className="summary-item">
          <strong>Category:</strong>
          <span>{category || "Not selected"}</span>
        </div>

        <div className="summary-item">
          <strong>Service:</strong>
          <span>{selectedService?.name || "Not selected"}</span>
        </div>

        <div className="summary-item">
          <strong>Provider:</strong>
          <span>{selectedService?.provider || "Not selected"}</span>
        </div>

        <div className="summary-item">
          <strong>Price:</strong>
          <span>{selectedService?.price || "Not selected"}</span>
        </div>

        <div className="summary-item">
          <strong>Duration:</strong>
          <span>{selectedService?.duration || "Not selected"}</span>
        </div>

        <div className="summary-item">
          <strong>Date:</strong>
          <span>{date || "Not selected"}</span>
        </div>

        <div className="summary-item">
          <strong>Time:</strong>
          <span>{time || "Not selected"}</span>
        </div>

        {bookingSubmitted && (
          <div className="success-box">
            <p>Booking submitted successfully.</p>
            <div style={{ marginTop: "12px" }}>
              <button
                type="button"
                className="submit-booking-btn"
                onClick={() => navigate("/customer-dashboard")}
              >
                View Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingForm;