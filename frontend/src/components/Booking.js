import React from "react";
import BookingForm from "../components/BookingForm";

// Booking function
function Booking() {
  return (
    <div className="booking-page">
      <div className="booking-header">
        <h1>Book a Service</h1>
        <p>
          Select a category, choose a service, pick a date and time, and submit
          your booking request.
        </p>
      </div>
  
      <BookingForm />
    </div>
  );
}

export default Booking;