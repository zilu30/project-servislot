import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import "./CustomerDashboard.css";

function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const d = new Date();
  d.setHours(+h, +m);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

// Monthly calendar 

function MonthlyCalendar({ bookings }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthLabel = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const todayStr   = today.toISOString().split("T")[0];
  const firstWeekday = new Date(year, month, 1).getDay(); 
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const pad = (n) => String(n).padStart(2, "0");

  const bookingsByDate = {};
  bookings.forEach((b) => {
    if (b.status === "CANCELLED") return;
    if (!bookingsByDate[b.date]) bookingsByDate[b.date] = [];
    bookingsByDate[b.date].push(b);
  });
// Grid
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  return (
    <div className="cd-calendar">
      <div className="cd-cal-nav">
        <button className="cd-cal-arrow" onClick={prevMonth}>&#8249;</button>
        <span className="cd-cal-month">{monthLabel}</span>
        <button className="cd-cal-arrow" onClick={nextMonth}>&#8250;</button>
      </div>

      <div className="cd-cal-grid">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d} className="cd-cal-day-header">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} className="cd-cal-cell cd-cal-empty" />;
          const dateStr    = `${year}-${pad(month + 1)}-${pad(day)}`;
          const dayBookings = bookingsByDate[dateStr] || [];
          const isToday    = dateStr === todayStr;
          return (
            <div key={dateStr} className={`cd-cal-cell ${isToday ? "cd-cal-today" : ""}`}>
              <span className="cd-cal-date">{day}</span>
              {dayBookings.map((b) => (
                <div key={b.id} className="cd-cal-event">
                  <strong>{b.service}</strong>
                  <span>{formatTime(b.time)}</span>
                  <span className="cd-cal-event-provider">{b.provider_company || b.provider}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Weekly calendar 

function WeeklyCalendar({ bookings }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  // start from Sunday of the current week
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay());
    return d;
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const bookingsByDate = {};
  bookings.forEach((b) => {
    if (b.status === "CANCELLED") return;
    if (!bookingsByDate[b.date]) bookingsByDate[b.date] = [];
    bookingsByDate[b.date].push(b);
  });

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); };
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); };

  const weekLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div className="cd-calendar">
      <div className="cd-cal-nav">
        <button className="cd-cal-arrow" onClick={prevWeek}>&#8249;</button>
        <span className="cd-cal-month">{weekLabel}</span>
        <button className="cd-cal-arrow" onClick={nextWeek}>&#8250;</button>
      </div>
      <div className="cd-week-grid">
        {weekDays.map((dayDate) => {
          const dayStr      = dayDate.toISOString().split("T")[0];
          const dayBookings = bookingsByDate[dayStr] || [];
          const isToday     = dayStr === todayStr;
          return (
            <div key={dayStr} className={`cd-week-col ${isToday ? "cd-week-today" : ""}`}>
              <div className="cd-week-col-header">
                <span>{dayDate.toLocaleDateString("en-US", { weekday: "short" })}</span>
                <span className={`cd-week-day-num ${isToday ? "cd-today-num" : ""}`}>
                  {dayDate.getDate()}
                </span>
              </div>
              <div className="cd-week-col-body">
                {dayBookings.length === 0 ? (
                  <span className="cd-free">Free</span>
                ) : (
                  dayBookings.map((b) => (
                    <div key={b.id} className="cd-week-event">
                      <strong>{b.service}</strong>
                      <span>{formatTime(b.time)}</span>
                      <span className="cd-cal-event-provider">{b.provider_company || b.provider}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// favorite services 

function FavoriteServices() {
  const navigate   = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    api.get("/services/favorites/")
      .then(r => {
        setFavorites(r.data);
        const map = {};
        r.data.forEach(s => { map[s.id] = s; });
        localStorage.setItem("customer_favorites", JSON.stringify(map));
      })
      .catch(() => {
        try {
          setFavorites(Object.values(JSON.parse(localStorage.getItem("customer_favorites") || "{}")));
        } catch { setFavorites([]); }
      })
      .finally(() => setLoading(false));
  }, []);

  const removeFavorite = async (id) => {
    try {
      await api.delete(`/services/favorites/${id}/`);
      const updated = favorites.filter(s => s.id !== id);
      setFavorites(updated);
      const map = {};
      updated.forEach(s => { map[s.id] = s; });
      localStorage.setItem("customer_favorites", JSON.stringify(map));
    } catch {}
  };

  const handleBook = (service) => {
    navigate(`/booking?provider_id=${service.provider_id}&service_id=${service.id}`);
  };

  return (
    <section className="cd-card">
      <h2 className="cd-card-title">Favorite Services</h2>
      {loading ? (
        <p className="cd-empty-text">Loading…</p>
      ) : favorites.length === 0 ? (
        <div className="cd-empty-state">
          <p className="cd-empty-text">No favorite services yet.</p>
          <button className="cd-btn-primary" onClick={() => navigate("/services")}>Browse Services</button>
        </div>
      ) : (
        <div className="cd-fav-list">
          {favorites.map(svc => (
            <div key={svc.id} className="cd-fav-item">
              <div className="cd-fav-info">
                <div className="cd-fav-top">
                  <span className="cd-fav-name">{svc.title}</span>
                  {svc.category && <span className="cd-fav-cat">{svc.category}</span>}
                </div>
                <p className="cd-fav-provider">{svc.provider_company || svc.provider_username || "Provider"}</p>
                <p className="cd-fav-price">${svc.price}</p>
              </div>
              <div className="cd-fav-actions">
                <button className="cd-btn-primary cd-fav-book" onClick={() => handleBook(svc)}>Book</button>
                <button className="cd-fav-remove" onClick={() => removeFavorite(svc.id)} aria-label="Remove from favorites">
                  ♥
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// Main component 

export default function CustomerDashboard() {
  const navigate   = useNavigate();
  const [userData, setUserData] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("user")) || {}; } catch { return {}; }
  });

  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [calView, setCalView]     = useState("monthly");

  // profile editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm]       = useState({ username: "", email: "", phone_number: "" });
  const [profileSaving, setProfileSaving]   = useState(false);
  const [profileError, setProfileError]     = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // cancel modal
  const [cancelId, setCancelId]           = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // reschedule panel
  const [rescheduleBooking, setRescheduleBooking] = useState(null);
  const [rescheduleDate, setRescheduleDate]       = useState("");
  const [rescheduleSlots, setRescheduleSlots]     = useState([]);
  const [rescheduleSlotId, setRescheduleSlotId]   = useState("");
  const [slotsLoading, setSlotsLoading]           = useState(false);
  const [slotsError, setSlotsError]               = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError]     = useState("");

  const openEditProfile = () => {
    setProfileForm({
      username:     userData.username     || "",
      email:        userData.email        || "",
      phone_number: userData.phone_number || "",
    });
    setProfileError("");
    setProfileSuccess("");
    setEditingProfile(true);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    setProfileSaving(true);
    try {
      const res = await api.patch("/me/update/", profileForm);
      const updated = res.data;
      sessionStorage.setItem("user", JSON.stringify(updated));
      setUserData(updated);
      setProfileSuccess("Profile updated successfully.");
      setEditingProfile(false);
    } catch (err) {
      setProfileError(err.response?.data?.error || "Failed to save changes.");
    } finally {
      setProfileSaving(false);
    }
  };

  const fetchBookings = useCallback(() => {
    setLoading(true);
    api.get("/my-bookings/")
      .then((res) => setBookings(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // Fetch new slots
  useEffect(() => {
    if (!rescheduleDate || !rescheduleBooking) return;
    setRescheduleSlots([]);
    setRescheduleSlotId("");
    setSlotsError("");
    setSlotsLoading(true);
    api.get("/available-slots/", {
      params: { provider_id: rescheduleBooking.provider_id, date: rescheduleDate },
    })
      .then((res) => {
        setRescheduleSlots(res.data);
        if (res.data.length === 0) setSlotsError("No available slots for this date.");
      })
      .catch(() => setSlotsError("Failed to load slots."))
      .finally(() => setSlotsLoading(false));
  }, [rescheduleDate, rescheduleBooking]);

  const confirmCancel = async () => {
    setCancelLoading(true);
    try {
      await api.post("/cancel-booking/", { booking_id: cancelId });
      setBookings((prev) => prev.map((b) => b.id === cancelId ? { ...b, status: "CANCELLED" } : b));
    } catch {}
    finally { setCancelLoading(false); setCancelId(null); }
  };

  const confirmReschedule = async () => {
    if (!rescheduleSlotId) { setRescheduleError("Please select a new time slot."); return; }
    setRescheduleLoading(true);
    setRescheduleError("");
    try {
      const { data } = await api.post("/reschedule-booking/", {
        booking_id:  rescheduleBooking.id,
        new_slot_id: rescheduleSlotId,
      });
      setBookings((prev) => prev.map((b) => b.id === rescheduleBooking.id ? data.booking : b));
      setRescheduleBooking(null);
    } catch (err) {
      setRescheduleError(err.response?.data?.error || "Reschedule failed.");
    } finally { setRescheduleLoading(false); }
  };

  const openReschedule = (booking) => {
    setRescheduleBooking(booking);
    setRescheduleDate("");
    setRescheduleSlots([]);
    setRescheduleSlotId("");
    setSlotsError("");
    setRescheduleError("");
  };

  const todayStr        = new Date().toISOString().split("T")[0];
  const activeBookings  = bookings.filter((b) => b.status === "BOOKED");
  const historyBookings = bookings; // show all bookings

  return (
    <div className="cd-page">
      <div className="cd-page-header">
        <h1 className="cd-page-title">Customer Dashboard</h1>
        <p className="cd-page-sub">View your profile, appointments, favorites, and booking history.</p>
      </div>

      <div className="cd-sections">
        <section className="cd-card">
          <div className="cd-card-title-row">
            <h2 className="cd-card-title">Your Profile</h2>
            {!editingProfile && (
              <button className="cd-btn-edit" onClick={openEditProfile}>Edit</button>
            )}
          </div>

          {profileSuccess && <p className="cd-profile-success">{profileSuccess}</p>}

          {!editingProfile ? (
            <div className="cd-profile-grid">
              <div className="cd-profile-box">
                <span className="cd-profile-label">Name</span>
                <span className="cd-profile-value">{userData.username || "—"}</span>
              </div>
              <div className="cd-profile-box">
                <span className="cd-profile-label">Email</span>
                <span className="cd-profile-value">{userData.email || "—"}</span>
              </div>
              <div className="cd-profile-box">
                <span className="cd-profile-label">Phone Number</span>
                <span className="cd-profile-value">{userData.phone_number || "—"}</span>
              </div>
            </div>
          ) : (
            <form className="cd-edit-form" onSubmit={saveProfile}>
              <div className="cd-edit-grid">
                <div className="cd-edit-field">
                  <label className="cd-edit-label">Name</label>
                  <input
                    className="cd-edit-input" type="text"
                    value={profileForm.username} required
                    onChange={(e) => setProfileForm((p) => ({ ...p, username: e.target.value }))}
                  />
                </div>
                <div className="cd-edit-field">
                  <label className="cd-edit-label">Email</label>
                  <input
                    className="cd-edit-input" type="email"
                    value={profileForm.email} required
                    onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div className="cd-edit-field">
                  <label className="cd-edit-label">Phone Number</label>
                  <input
                    className="cd-edit-input" type="text"
                    value={profileForm.phone_number}
                    onChange={(e) => setProfileForm((p) => ({ ...p, phone_number: e.target.value }))}
                  />
                </div>
              </div>
              {profileError && <p className="cd-profile-error">{profileError}</p>}
              <div className="cd-edit-actions">
                <button type="submit" className="cd-btn-primary" disabled={profileSaving}>
                  {profileSaving ? "Saving…" : "Save Changes"}
                </button>
                <button type="button" className="cd-btn-secondary" onClick={() => setEditingProfile(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
        <section className="cd-card">
          <div className="cd-cal-header-row">
            <h2 className="cd-card-title">Appointment Calendar</h2>
            <select className="cd-view-select" value={calView} onChange={(e) => setCalView(e.target.value)}>
              <option value="monthly">Monthly View</option>
              <option value="weekly">Weekly View</option>
            </select>
          </div>
          {loading ? (
            <p className="cd-loading">Loading...</p>
          ) : calView === "monthly" ? (
            <MonthlyCalendar bookings={bookings} />
          ) : (
            <WeeklyCalendar bookings={bookings} />
          )}
        </section>

        {/* --- favorites --- */}
        <FavoriteServices />

        {/* --- booking history --- */}
        <section className="cd-card">
          <h2 className="cd-card-title">Booking History</h2>
          {loading ? (
            <p className="cd-loading">Loading...</p>
          ) : historyBookings.length === 0 ? (
            <div className="cd-empty-state">
              <p className="cd-empty-text">No bookings yet.</p>
              <button className="cd-btn-primary" onClick={() => navigate("/services")}>Browse Services</button>
            </div>
          ) : (
            <div className="cd-history-list">
              {historyBookings.map((b) => (
                <div key={b.id} className="cd-history-item">
                  <div className="cd-history-left">
                    <p className="cd-history-service">{b.service}</p>
                    <p className="cd-history-provider">{b.provider_company || b.provider}</p>
                    <p className="cd-history-meta">
                      {b.date} at {formatTime(b.time)}
                      {b.status === "CANCELLED" && <span className="cd-cancelled-tag"> · Cancelled</span>}
                    </p>
                  </div>
                  <div className="cd-history-actions">
                    {/* Past bookings */}
                    {(b.status === "COMPLETED" || b.status === "NO_SHOW" || b.status === "CANCELLED") && (
                      <button className="cd-btn-rebook"
                        onClick={() => navigate(`/booking?provider_id=${b.provider_id}&service_id=${b.service_id}`)}>
                        Rebook
                      </button>
                    )}
                    {b.status === "BOOKED" && (
                      <>
                        <button className="cd-btn-reschedule" onClick={() => openReschedule(b)}>Reschedule</button>
                        <button className="cd-btn-cancel"     onClick={() => setCancelId(b.id)}>Cancel</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* cancel confirmation modal  */}
      {cancelId && (
        <div className="cd-modal-overlay">
          <div className="cd-modal">
            <h3>Cancel Appointment?</h3>
            <p>This action cannot be undone. The time slot will be freed.</p>
            <div className="cd-modal-actions">
              <button className="cd-btn-danger" onClick={confirmCancel} disabled={cancelLoading}>
                {cancelLoading ? "Cancelling…" : "Yes, Cancel"}
              </button>
              <button className="cd-btn-secondary" onClick={() => setCancelId(null)}>Go Back</button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule  */}
      {rescheduleBooking && (
        <div className="cd-modal-overlay">
          <div className="cd-modal cd-modal-wide">
            <div className="cd-modal-top">
              <h3>Reschedule: {rescheduleBooking.service}</h3>
              <button className="cd-modal-close" onClick={() => setRescheduleBooking(null)}>✕</button>
            </div>
            <p className="cd-modal-sub">
              Current: {rescheduleBooking.date} at {formatTime(rescheduleBooking.time)}
            </p>
            <div className="cd-modal-field">
              <label>Select new date</label>
              <input
                type="date" min={todayStr} value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="cd-modal-input"
              />
            </div>
            {slotsLoading && <p className="cd-slots-hint">Loading slots…</p>}
            {!slotsLoading && slotsError && <p className="cd-slots-error">{slotsError}</p>}
            {!slotsLoading && rescheduleSlots.length > 0 && (
              <div className="cd-modal-field">
                <label>Select new time slot</label>
                <div className="cd-reschedule-pills">
                  {rescheduleSlots.map((s) => (
                    <button
                      key={s.id} type="button"
                      className={`cd-pill ${rescheduleSlotId === String(s.id) ? "selected" : ""}`}
                      onClick={() => setRescheduleSlotId(String(s.id))}
                    >
                      {formatTime(s.start_time)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {rescheduleError && <p className="cd-slots-error">{rescheduleError}</p>}
            <div className="cd-modal-actions">
              <button
                className="cd-btn-primary"
                onClick={confirmReschedule}
                disabled={rescheduleLoading || !rescheduleSlotId}
              >
                {rescheduleLoading ? "Rescheduling…" : "Confirm Reschedule"}
              </button>
              <button className="cd-btn-secondary" onClick={() => setRescheduleBooking(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
