import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axiosConfig";
import "./Booking.css";

function fmt12(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12  = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export default function Booking() {
  const navigate      = useNavigate();
  const [searchParams] = useSearchParams();
  const providerId = searchParams.get("provider_id");
  const serviceId  = searchParams.get("service_id");

  const storedUser = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem("user") || "{}"); } catch { return {}; }
  }, []);
  const email = storedUser.email || "";

  const [service, setService] = useState(null);
  const [bookingName, setBookingName]   = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots]               = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes]               = useState("");
  const [loadingService, setLoadingService]     = useState(true);
  const [loadingSlots, setLoadingSlots]         = useState(false);
  const [slotsError, setSlotsError]             = useState("");
  const [submitting, setSubmitting]             = useState(false);
  const [bookingError, setBookingError]         = useState("");
  const [bookingSuccess, setBookingSuccess]     = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null); // eslint-disable-line no-unused-vars

  useEffect(() => {
    if (!serviceId) return;
    fetch(`http://127.0.0.1:8000/api/services/${serviceId}/`)
      .then((r) => r.json())
      .then((data) => setService(data))
      .catch(() => {})
      .finally(() => setLoadingService(false));
  }, [serviceId]);
  useEffect(() => {
    if (!selectedDate || !providerId) return;
    setSlots([]);
    setSelectedSlot(null);
    setSlotsError("");
    setLoadingSlots(true);
    api
      .get("/available-slots/", { params: { provider_id: providerId, date: selectedDate } })
      .then((res) => {
        setSlots(res.data);
        if (res.data.length === 0) setSlotsError("No available slots for this date.");
      })
      .catch(() => setSlotsError("Could not load slots. Try another date."))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, providerId]);

  const handleBooking = async (e) => {
    e.preventDefault();
    setBookingError("");

    if (!selectedSlot) {
      setBookingError("Please select a time slot.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/create-booking/", {
        slot_id:    selectedSlot.id,
        service_id: serviceId,
        notes,
      });
      setConfirmedBooking(res.data.booking || res.data);
      setBookingSuccess(true);
    } catch (err) {
      setBookingError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Booking failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const today       = new Date().toISOString().split("T")[0];
  const providerName = service?.provider_company || service?.provider_username || "Provider";
  if (!providerId || !serviceId) {
    return (
      <div className="bk-page">
        <div className="bk-error-state">
          <h2>No service selected</h2>
          <p>Please browse services and click "Book Now" to start a booking.</p>
          <button className="bk-btn-confirm" onClick={() => navigate("/services")}>
            Browse Services
          </button>
        </div>
      </div>
    );
  }

  // Confirmation screen shown after successful booking
  if (bookingSuccess) {
    return (
      <div className="bk-page">
        <div className="bk-success">
          <h2 className="bk-success-title">Booking Confirmed!</h2>
          <p className="bk-success-sub">
            Your appointment for <strong>{service?.title}</strong> with{" "}
            <strong>{providerName}</strong> has been successfully confirmed.
          </p>
          <div className="bk-success-details">
            <div className="bk-success-row">
              <span className="bk-success-label">Date:</span>
              <span>{selectedDate}</span>
            </div>
            <div className="bk-success-row">
              <span className="bk-success-label">Time:</span>
              <span>
                {fmt12(selectedSlot?.start_time)}
                {selectedSlot?.end_time && ` – ${fmt12(selectedSlot.end_time)}`}
              </span>
            </div>
            <div className="bk-success-row">
              <span className="bk-success-label">Email:</span>
              <span>{email}</span>
            </div>
          </div>
          <div className="bk-success-actions">
            <button className="bk-btn-confirm" onClick={() => navigate("/customer-dashboard")}>
              Go to Dashboard
            </button>
            <button className="bk-btn-cancel" onClick={() => navigate("/")}>
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bk-page">
      <div className="bk-heading">
        {loadingService ? (
          <h1 className="bk-page-title">Loading…</h1>
        ) : (
          <>
            <h1 className="bk-page-title">{service?.title || "Book Service"}</h1>
            <p className="bk-page-sub">
              Confirm your appointment details for <strong>{providerName}</strong>.
            </p>
          </>
        )}
      </div>

      <div className="bk-layout">
        <div className="bk-card">
          {service && (
            <div className="bk-service-header">
              <div>
                <p className="bk-svc-title">{service.title}</p>
                <p className="bk-svc-provider">{providerName}</p>
              </div>
              <div className="bk-svc-meta">
                <span className="bk-svc-category">{service.category}</span>
                <span className="bk-svc-price">${service.price}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleBooking} className="bk-form">
            <div className="bk-field">
              <label className="bk-label">Full Name</label>
              <input
                className="bk-input"
                type="text"
                value={bookingName}
                placeholder="Enter name for this booking"
                onChange={(e) => setBookingName(e.target.value)}
              />
            </div>
            <div className="bk-field">
              <label className="bk-label">Email Address</label>
              <input
                className="bk-input bk-input-readonly"
                type="email"
                value={email}
                readOnly
              />
            </div>

            <div className="bk-field">
              <label className="bk-label">Preferred Date</label>
              <input
                className="bk-input"
                type="date"
                min={today}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
              />
            </div>

            {/* Timeslots displayer */}
            <div className="bk-field">
              <label className="bk-label">Preferred Time</label>
              {!selectedDate && <p className="bk-slots-hint">Select a date to see available times.</p>}
              {loadingSlots && <p className="bk-slots-hint">Loading available slots…</p>}
              {!loadingSlots && slotsError && <p className="bk-slots-error">{slotsError}</p>}
              {!loadingSlots && slots.length > 0 && (
                <div className="bk-pills">
                  {slots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      className={`bk-pill ${selectedSlot?.id === slot.id ? "selected" : ""}`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {fmt12(slot.start_time)}
                      {slot.end_time && (
                        <span className="bk-pill-end"> – {fmt12(slot.end_time)}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bk-field">
              <label className="bk-label">Additional Notes</label>
              <textarea
                className="bk-textarea"
                placeholder="Any special instructions or requests..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {bookingError && <p className="bk-error">{bookingError}</p>}

            <div className="bk-actions">
              <button
                type="submit"
                className="bk-btn-confirm"
                disabled={submitting || !selectedSlot}
              >
                {submitting ? "Confirming…" : "Confirm Booking"}
              </button>
              <button type="button" className="bk-btn-cancel" onClick={() => navigate(-1)}>
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* booking summary  */}
        <div className="bk-summary">
          <h2 className="bk-summary-title">Booking Summary</h2>
          <div className="bk-summary-rows">
            <SummaryRow label="Service"  value={service?.title} />
            <SummaryRow label="Provider" value={providerName} />
            <SummaryRow label="Category" value={service?.category} />
            <SummaryRow label="Price"    value={service ? `$${service.price}` : null} />
            <SummaryRow label="Name"     value={bookingName || null} />
            <SummaryRow label="Email"    value={email || null} />
            <SummaryRow label="Date"     value={selectedDate || null} />
            <SummaryRow
              label="Time"
              value={selectedSlot
                ? `${fmt12(selectedSlot.start_time)}${selectedSlot.end_time ? ` – ${fmt12(selectedSlot.end_time)}` : ""}`
                : null}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="bk-summary-row">
      <span className="bk-summary-label">{label}</span>
      <span className={`bk-summary-value ${!value ? "bk-summary-empty" : ""}`}>
        {value || "—"}
      </span>
    </div>
  );
}
