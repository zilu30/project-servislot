import React, { useEffect, useState } from "react";

function CustomerDashboard() {
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    const savedBooking = localStorage.getItem("lastBooking");
    if (savedBooking) {
      setBooking(JSON.parse(savedBooking));
    }
  }, []);

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="customer-dashboard-page">
      <div className="dashboard-header">
        <h1>Customer Dashboard</h1>
        <p>View your appointment details and upcoming booking schedule.</p>
      </div>

      {booking ? (
        <>
          <div className="customer-info-card">
            <h2>Your Booking Details</h2>

            <div className="customer-info-grid">
              <div>
                <strong>Name</strong>
                <p>{booking.fullName}</p>
              </div>
              <div>
                <strong>Email</strong>
                <p>{booking.email}</p>
              </div>
              <div>
                <strong>Category</strong>
                <p>{booking.category}</p>
              </div>
              <div>
                <strong>Service</strong>
                <p>{booking.service}</p>
              </div>
              <div>
                <strong>Provider</strong>
                <p>{booking.provider}</p>
              </div>
              <div>
                <strong>Price</strong>
                <p>{booking.price}</p>
              </div>
              <div>
                <strong>Duration</strong>
                <p>{booking.duration}</p>
              </div>
              <div>
                <strong>Date</strong>
                <p>{booking.date}</p>
              </div>
              <div>
                <strong>Time</strong>
                <p>{booking.time}</p>
              </div>
            </div>
          </div>

          <div className="customer-calendar-card">
            <h2>Weekly Calendar View</h2>
            <div className="calendar-grid">
              {weekDays.map((day) => (
                <div className="calendar-day" key={day}>
                  <h3>{day}</h3>

                  {day === "Tue" && (
                    <div className="appointment-card">
                      <strong>{booking.service}</strong>
                      <p>{booking.time}</p>
                      <span>{booking.provider}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="empty-dashboard-card">
          <h2>No booking found</h2>
          <p>Your booking details will appear here after you schedule a service.</p>
        </div>
      )}
    </div>
  );
}

export default CustomerDashboard;