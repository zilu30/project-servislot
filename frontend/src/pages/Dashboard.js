import React from "react";

function Dashboard() {
  return (
    <div className="container">
      <h1>Provider Dashboard</h1>
      <p>Manage today’s appointments, working hours, and reports.</p>

      <div className="hero-card">
        <h3>Today’s Schedule</h3>

        <div className="card-item">
          <strong>Haircut Appointment</strong>
          <span>10:00 AM - Marcus Well</span>
        </div>

        <div className="card-item">
          <strong>Notary Appointment</strong>
          <span>1:30 PM - Linda Thompson</span>
        </div>

        <div className="card-item">
          <strong>Consultation</strong>
          <span>4:00 PM - Available Slot</span>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;