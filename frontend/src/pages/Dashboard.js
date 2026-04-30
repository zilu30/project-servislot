import React, { useState, useEffect, useCallback } from "react";
import api from "../api/axiosConfig";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./Dashboard.css";

const CATEGORIES = [
  "Home Services", "Repair & Maintenance", "Beauty & Personal Care",
  "Education & Tutoring", "Fitness & Wellness", "Events & Photography",
  "Pet Services", "Moving & Delivery", "Professional Services",
];

const DAYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
const DAY_LABELS = {
  monday:"Monday", tuesday:"Tuesday", wednesday:"Wednesday",
  thursday:"Thursday", friday:"Friday", saturday:"Saturday", sunday:"Sunday",
};

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const d = new Date(); d.setHours(+h, +m);
  return d.toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" });
}

function loadHours() {
  try {
    const s = localStorage.getItem("provider_working_hours");
    if (s) return JSON.parse(s);
  } catch {}
  return {
    monday:    { open:true,  start:"09:00", end:"17:00" },
    tuesday:   { open:true,  start:"09:00", end:"17:00" },
    wednesday: { open:true,  start:"09:00", end:"17:00" },
    thursday:  { open:true,  start:"09:00", end:"17:00" },
    friday:    { open:true,  start:"09:00", end:"17:00" },
    saturday:  { open:true,  start:"10:00", end:"14:00" },
    sunday:    { open:false, start:"09:00", end:"17:00" },
  };
}

export default function Dashboard() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("user")) || {}; } catch { return {}; }
  });
  const [view, setView]               = useState("overview");
  const [bookings, setBookings]       = useState([]);
  const [loadingBookings, setLoading] = useState(true);
  const [scheduleView, setScheduleView] = useState("daily");

  const [workingHours, setWorkingHours] = useState(loadHours);
  const [editHours, setEditHours]       = useState(false);
  const [hoursForm, setHoursForm]       = useState(loadHours);
  const [scheduleStatus, setScheduleStatus] = useState(null); 

  useEffect(() => {
    api.get("/working-hours/")
      .then(r => {
        if (r.data && Object.keys(r.data).length > 0) {
          localStorage.setItem("provider_working_hours", JSON.stringify(r.data));
          setWorkingHours(r.data);
          setHoursForm(r.data);
        }
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    api.post("/auto-extend-schedule/")
      .then(r => setScheduleStatus(r.data))
      .catch(() => {});
  }, []);

  // profile edit
  const [editProfile, setEditProfile]     = useState(false);
  const [profileForm, setProfileForm]     = useState({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError]   = useState("");

  const fetchBookings = useCallback(() => {
    setLoading(true);
    api.get("/provider-bookings/")
      .then(r => setBookings(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const saveHours = () => {
    setWorkingHours(hoursForm);
    localStorage.setItem("provider_working_hours", JSON.stringify(hoursForm));
    setEditHours(false);

    api.put("/working-hours/", hoursForm).catch(() => {});
  };

  const openEditProfile = () => {
    setProfileForm({
      company_name: user.company_name  || "",
      username:     user.username      || "",
      email:        user.email         || "",
      phone_number: user.phone_number  || "",
      category:     user.category      || "",
    });
    setProfileError("");
    setEditProfile(true);
  };

  const saveProfile = async () => {
    setProfileSaving(true);
    setProfileError("");
    try {
      const { data } = await api.patch("/me/update/", profileForm);
      const updated = { ...user, ...data };
      setUser(updated);
      sessionStorage.setItem("user", JSON.stringify(updated));
      window.dispatchEvent(new Event("auth-change"));
      setEditProfile(false);
    } catch (err) {
      const d = err.response?.data;
      setProfileError(
        typeof d === "string" ? d :
        d?.detail || d?.username?.[0] || d?.email?.[0] || "Failed to save. Try again."
      );
    } finally { setProfileSaving(false); }
  };

  const updateBookingStatus = async (bookingId, action) => {
    try {
      const res = await api.post("/complete-booking/", { booking_id: bookingId, action });
      setBookings(prev =>
        prev.map(b => b.id === bookingId ? { ...b, status: res.data.booking.status } : b)
      );
    } catch {}
  };

  const company  = user.company_name || user.username || "Provider";
  const todayStr = new Date().toISOString().split("T")[0];
  const todayBk  = bookings.filter(b => b.date === todayStr && b.status !== "CANCELLED");

  // Working hours grouped for the display-only view (Mon–Fri share a row)
  const groupedDays = [
    { label:"Monday – Friday", days:["monday","tuesday","wednesday","thursday","friday"] },
    { label:"Saturday",        days:["saturday"] },
    { label:"Sunday",          days:["sunday"] },
  ];
  const groupSummary = days => {
    if (!days.some(d => workingHours[d]?.open)) return "Unavailable";
    const f = workingHours[days[0]];
    return `${formatTime(f.start)} – ${formatTime(f.end)}`;
  };

  const activeBookings    = bookings.filter(b => b.status !== "CANCELLED");
  const completedBookings = bookings.filter(b => b.status === "COMPLETED");
  const totalRevenue      = completedBookings.reduce((sum, b) => sum + parseFloat(b.price || 0), 0);

  return (
    <div className="pd-page">

      <div className="pd-page-header">
        <div>
          <h1 className="pd-page-title">{company} Dashboard</h1>
          <p className="pd-page-sub">Manage appointments, availability, and provider scheduling.</p>
        </div>
      </div>

      {/* tab bar */}
      <div className="pd-tab-bar">
        <button className={`pd-tab ${view === "overview"  ? "active" : ""}`} onClick={() => setView("overview")}>Dashboard</button>
        <button className={`pd-tab ${view === "services"  ? "active" : ""}`} onClick={() => setView("services")}>My Services</button>
        <button className={`pd-tab ${view === "reports"   ? "active" : ""}`} onClick={() => setView("reports")}>Reports</button>
      </div>

      <div className="pd-sections">

        {/* Service flow */}
        {view === "create" && (
          <CreateServiceFlow
            onDone={() => { fetchBookings(); setView("overview"); }}
            onCancel={() => setView("overview")}
          />
        )}

        {/*  my services tab */}
        {view === "services" && (
          <MyServicesTab onCreateService={() => setView("create")} />
        )}

        {/*  overview tab  */}
        {view === "overview" && (
          <>
            {/* Provider Overview */}
            <section className="pd-card">
              <div className="pd-card-title-row">
                <h2 className="pd-card-title">Provider Overview</h2>
                {!editProfile
                  ? <button className="pd-btn-edit" onClick={openEditProfile}>Edit</button>
                  : <div style={{display:"flex", gap:8}}>
                      <button className="pd-btn-save" onClick={saveProfile} disabled={profileSaving}>
                        {profileSaving ? "Saving…" : "Save"}
                      </button>
                      <button className="pd-btn-cancel" onClick={() => setEditProfile(false)}>Cancel</button>
                    </div>
                }
              </div>

              {!editProfile ? (
                <div className="pd-overview-grid">
                  {[
                    { label:"Company",            value: user.company_name  || "—" },
                    { label:"Owner",              value: user.username      || "—" },
                    { label:"Email",              value: user.email         || "—" },
                    { label:"Phone",              value: user.phone_number  || "—" },
                    { label:"Service Category",   value: user.category      || "—" },
                    { label:"Total Appointments", value: loadingBookings ? "…" : activeBookings.length },
                  ].map(({ label, value }) => (
                    <div key={label} className="pd-info-box">
                      <span className="pd-info-label">{label}</span>
                      <span className="pd-info-value">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pd-profile-form">
                  <div className="pd-form-row pd-form-row-2">
                    <div className="pd-field">
                      <label>Business Name</label>
                      <input value={profileForm.company_name}
                        onChange={e => setProfileForm(p => ({...p, company_name: e.target.value}))} />
                    </div>
                    <div className="pd-field">
                      <label>Owner Name (Username)</label>
                      <input value={profileForm.username}
                        onChange={e => setProfileForm(p => ({...p, username: e.target.value}))} />
                    </div>
                    <div className="pd-field">
                      <label>Email</label>
                      <input type="email" value={profileForm.email}
                        onChange={e => setProfileForm(p => ({...p, email: e.target.value}))} />
                    </div>
                    <div className="pd-field">
                      <label>Phone Number</label>
                      <input value={profileForm.phone_number}
                        onChange={e => setProfileForm(p => ({...p, phone_number: e.target.value}))} />
                    </div>
                  </div>
                  <div className="pd-field">
                    <label>Service Category</label>
                    <select value={profileForm.category}
                      onChange={e => setProfileForm(p => ({...p, category: e.target.value}))}>
                      <option value="">— Select —</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  {profileError && <p className="pd-err" style={{marginTop:4}}>{profileError}</p>}
                </div>
              )}
            </section>

            {/* My Bookings */}
            <section className="pd-card">
              <div className="pd-card-title-row">
                <div>
                  <h2 className="pd-card-title">My Bookings</h2>
                  <p className="pd-card-month">
                    {new Date().toLocaleDateString("en-US", {month:"long", year:"numeric"})}
                  </p>
                </div>
                <select className="pd-view-select" value={scheduleView}
                  onChange={e => setScheduleView(e.target.value)}>
                  <option value="daily">Daily View</option>
                  <option value="weekly">Weekly View</option>
                  <option value="all">All Bookings</option>
                </select>
              </div>

              {loadingBookings ? <p className="pd-empty">Loading…</p> : (
                <>
                  {scheduleView === "daily"  && <DailySchedule bookings={todayBk} onUpdateStatus={updateBookingStatus} />}
                  {scheduleView === "weekly" && <WeeklySchedule bookings={bookings} />}
                  {scheduleView === "all" && (
                    bookings.length === 0
                      ? <p className="pd-empty">No bookings yet. Once customers book your services, they'll appear here.</p>
                      : (
                        <div className="pd-booking-list">
                          {bookings.map(b => (
                            <div key={b.id} className="pd-booking-item">
                              <div className="pd-booking-item-top">
                                <span className={`pd-status-badge ${b.status.toLowerCase()}`}>
                                  {b.status === "NO_SHOW" ? "No Show" : b.status}
                                </span>
                                <div className="pd-booking-actions">
                                  {b.status === "BOOKED" && (
                                    <>
                                      <button className="pd-mark-btn complete"
                                        onClick={() => updateBookingStatus(b.id, "complete")}>
                                        Mark Complete
                                      </button>
                                      <button className="pd-mark-btn no-show"
                                        onClick={() => updateBookingStatus(b.id, "no_show")}>
                                        No Show
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                              <p className="pd-booking-service">{b.service}</p>
                              <p className="pd-booking-meta"><strong>{b.client}</strong> · {b.client_email}</p>
                              <p className="pd-booking-meta">{b.date} · {formatTime(b.time)} – {formatTime(b.end_time)}</p>
                              {b.notes && <p className="pd-booking-notes">"{b.notes}"</p>}
                            </div>
                          ))}
                        </div>
                      )
                  )}
                </>
              )}
            </section>

            {/* Working Hours */}
            <section className="pd-card">
              <div className="pd-card-title-row">
                <div>
                  <h2 className="pd-card-title">Working Hours</h2>
                  {scheduleStatus?.active_through && (
                    <p className="pd-schedule-status">
                      <span className="pd-schedule-dot" />
                      Auto-schedule active through{" "}
                      {new Date(scheduleStatus.active_through + "T00:00:00").toLocaleDateString("en-US", {
                        month: "long", day: "numeric", year: "numeric"
                      })}
                      {scheduleStatus.extended && " · Extended just now"}
                    </p>
                  )}
                </div>
                {!editHours
                  ? <button className="pd-btn-edit" onClick={() => { setHoursForm({...workingHours}); setEditHours(true); }}>Edit</button>
                  : <div style={{display:"flex", gap:8}}>
                      <button className="pd-btn-save"   onClick={saveHours}>Save</button>
                      <button className="pd-btn-cancel" onClick={() => setEditHours(false)}>Cancel</button>
                    </div>
                }
              </div>

              {!editHours ? (
                <div className="pd-hours-grid">
                  {groupedDays.map(({ label, days }) => (
                    <div key={label} className="pd-info-box">
                      <span className="pd-info-label">{label}</span>
                      <span className="pd-info-value">{groupSummary(days)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pd-hours-editor">
                  {DAYS.map(day => (
                    <div key={day} className="pd-hours-row">
                      <label className="pd-hours-day">
                        <input type="checkbox"
                          checked={hoursForm[day]?.open ?? true}
                          onChange={e => setHoursForm(p => ({...p, [day]: {...p[day], open: e.target.checked}}))} />
                        {DAY_LABELS[day]}
                      </label>
                      {hoursForm[day]?.open ? (
                        <div className="pd-hours-times">
                          <input type="time" value={hoursForm[day]?.start || "09:00"} className="pd-time-input"
                            onChange={e => setHoursForm(p => ({...p, [day]: {...p[day], start: e.target.value}}))} />
                          <span>–</span>
                          <input type="time" value={hoursForm[day]?.end || "17:00"} className="pd-time-input"
                            onChange={e => setHoursForm(p => ({...p, [day]: {...p[day], end: e.target.value}}))} />
                        </div>
                      ) : <span className="pd-unavailable">Unavailable</span>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* Reports tab */}
        {view === "reports" && (
          <>
            <section className="pd-card">
              <h2 className="pd-card-title">Reports</h2>
              <p className="pd-card-sub">Summary of your completed bookings and revenue.</p>
              <div className="pd-reports-grid">
                <div className="pd-report-box">
                  <span className="pd-report-label">Completed Bookings</span>
                  <span className="pd-report-value">{completedBookings.length}</span>
                </div>
                <div className="pd-report-box">
                  <span className="pd-report-label">Total Revenue</span>
                  <span className="pd-report-value">${totalRevenue.toFixed(2)}</span>
                </div>
                <div className="pd-report-box">
                  <span className="pd-report-label">Total Appointments</span>
                  <span className="pd-report-value">{activeBookings.length}</span>
                </div>
                <div className="pd-report-box">
                  <span className="pd-report-label">Completion Rate</span>
                  <span className="pd-report-value">
                    {activeBookings.length > 0
                      ? `${Math.round((completedBookings.length / activeBookings.length) * 100)}%`
                      : "—"}
                  </span>
                </div>
              </div>
            </section>

            <section className="pd-card">
              <h2 className="pd-card-title">Completed Bookings</h2>
              {loadingBookings ? <p className="pd-empty">Loading…</p>
                : completedBookings.length === 0
                ? <p className="pd-empty">No completed bookings yet. Mark bookings as complete from the Dashboard tab.</p>
                : (
                  <div className="pd-booking-list">
                    {completedBookings.map(b => (
                      <div key={b.id} className="pd-booking-item">
                        <div className="pd-booking-item-top">
                          <span className="pd-status-badge completed">COMPLETED</span>
                          <span className="pd-booking-revenue">${parseFloat(b.price || 0).toFixed(2)}</span>
                        </div>
                        <p className="pd-booking-service">{b.service}</p>
                        <p className="pd-booking-meta"><strong>{b.client}</strong> · {b.client_email}</p>
                        <p className="pd-booking-meta">{b.date} · {formatTime(b.time)}</p>
                        {b.notes && <p className="pd-booking-notes">"{b.notes}"</p>}
                      </div>
                    ))}
                  </div>
                )
              }
            </section>
          </>
        )}
      </div>
    </div>
  );
}
// Daily schedule

function DailySchedule({ bookings, onUpdateStatus }) {
  const today = new Date().toLocaleDateString("en-US",
    { weekday:"long", month:"long", day:"numeric", year:"numeric" });
  return (
    <div>
      <p className="pd-schedule-date">{today}</p>
      {bookings.length === 0
        ? <p className="pd-empty">No appointments scheduled for today.</p>
        : (
          <div className="pd-appt-list">
            {bookings.map(b => (
              <div key={b.id} className="pd-appt-item">
                <div className="pd-appt-accent" />
                <div className="pd-appt-body">
                  <div className="pd-appt-info">
                    <p className="pd-appt-service">{b.service}</p>
                    <p className="pd-appt-meta">{formatTime(b.time)} — {b.client} · {b.client_email}</p>
                    {b.notes && <p className="pd-booking-notes">"{b.notes}"</p>}
                  </div>
                  <div className="pd-appt-right">
                    <span className={`pd-status-badge ${b.status.toLowerCase()}`}>
                      {b.status === "NO_SHOW" ? "No Show" : b.status}
                    </span>
                    {b.status === "BOOKED" && (
                      <div className="pd-appt-actions">
                        <button className="pd-mark-btn complete"
                          onClick={() => onUpdateStatus(b.id, "complete")}>
                          Mark Complete
                        </button>
                        <button className="pd-mark-btn no-show"
                          onClick={() => onUpdateStatus(b.id, "no_show")}>
                          No Show
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

// Weekly schedule

function WeeklySchedule({ bookings }) {
  const today = new Date(); today.setHours(0,0,0,0);
  // start from Sunday of the current week
  const sun  = new Date(today); sun.setDate(today.getDate() - today.getDay());
  const days = Array.from({length:7}, (_,i) => { const d=new Date(sun); d.setDate(sun.getDate()+i); return d; });
  const todayStr = today.toISOString().split("T")[0];

  return (
    <div className="pd-week-grid">
      {days.map(d => {
        const ds    = d.toISOString().split("T")[0];
        const bk    = bookings.filter(b => b.date===ds && b.status!=="CANCELLED");
        const isToday = ds===todayStr;
        return (
          <div key={ds} className={`pd-week-col${isToday?" today":""}`}>
            <div className="pd-week-col-hdr">
              <span>{d.toLocaleDateString("en-US",{weekday:"short"})}</span>
              <span className={`pd-week-num${isToday?" today-num":""}`}>{d.getDate()}</span>
            </div>
            <div className="pd-week-col-body">
              {bk.length===0
                ? <span className="pd-free">Free</span>
                : bk.map(b => (
                    <div key={b.id} className="pd-week-event">
                      <strong>{b.service}</strong>
                      <span>{formatTime(b.time)}</span>
                    </div>
                  ))
              }
            </div>
          </div>
        );
      })}
    </div>
  );
}

// My Services tab

function MyServicesTab({ onCreateService }) {
  const [services, setServices]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm]   = useState({});
  const [saving, setSaving]       = useState(false);
  const [saveMsg, setSaveMsg]     = useState({ type:"", text:"" });
  const [deleting, setDeleting]         = useState(null);
  const [schedulingId, setSchedulingId] = useState(null);
  const [confirmId, setConfirmId]       = useState(null);

  const fetch_ = () => {
    setLoading(true);
    api.get("/services/my-services/")
      .then(r => setServices(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetch_(); }, []);

  const startEdit = (svc) => {
    setEditingId(svc.id);
    setEditForm({
      title: svc.title, description: svc.description,
      price: svc.price, category: svc.category,
      rating: svc.rating ?? "", address: svc.address || "",
    });
    setSaveMsg({ type:"", text:"" });
  };

  const cancelEdit = () => { setEditingId(null); setSaveMsg({ type:"", text:"" }); };

  const saveEdit = async (id) => {
    setSaving(true); setSaveMsg({ type:"", text:"" });
    try {
      await api.patch(`/services/my-services/${id}/`, editForm);
      setSaveMsg({ type:"success", text:"Service updated." });
      fetch_();
      setTimeout(() => setEditingId(null), 800);
    } catch (err) {
      setSaveMsg({ type:"error", text: err.response?.data?.detail || "Save failed." });
    } finally { setSaving(false); }
  };

  const executeDelete = async () => {
    const id = confirmId;
    setConfirmId(null);
    setDeleting(id);
    try {
      await api.delete(`/services/my-services/${id}/`);
      setServices(p => p.filter(s => s.id !== id));
    } catch {} finally { setDeleting(null); }
  };

  return (
    <section className="pd-card">
      <div className="pd-card-title-row">
        <div>
          <h2 className="pd-card-title">My Services</h2>
          <p className="pd-card-sub">Manage and edit the services you offer.</p>
        </div>
        <button className="pd-create-btn" style={{padding:"10px 20px", fontSize:"0.9rem"}}
          onClick={onCreateService}>
          + New Service
        </button>
      </div>

      {loading ? <p className="pd-empty">Loading…</p>
        : services.length === 0
        ? (
          <div className="pd-svc-empty">
            <p>You haven't created any services yet.</p>
            <button className="pd-btn-primary" onClick={onCreateService}>Create your first service</button>
          </div>
        )
        : (
          <div className="pd-svc-list">
            {services.map(svc => (
              <div key={svc.id} className="pd-svc-item">
                {schedulingId === svc.id ? (
                  <AvailabilityForm
                    serviceTitle={svc.title}
                    onDone={() => setSchedulingId(null)}
                    onCancel={() => setSchedulingId(null)}
                  />
                ) : editingId === svc.id ? (
                  <div className="pd-svc-edit-form">
                    <div className="pd-form-row pd-form-row-2">
                      <div className="pd-field">
                        <label>Service Name</label>
                        <input value={editForm.title}
                          onChange={e => setEditForm(p=>({...p,title:e.target.value}))} />
                      </div>
                      <div className="pd-field">
                        <label>Category</label>
                        <select value={editForm.category}
                          onChange={e => setEditForm(p=>({...p,category:e.target.value}))}>
                          {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="pd-field">
                        <label>Price (USD)</label>
                        <div className="pd-price-wrap">
                          <span className="pd-currency">$</span>
                          <input type="number" step="0.01" value={editForm.price}
                            onChange={e => setEditForm(p=>({...p,price:e.target.value}))} />
                        </div>
                      </div>
                      <div className="pd-field">
                        <label>Rating (0–5)</label>
                        <input type="number" step="0.1" min="0" max="5" value={editForm.rating}
                          onChange={e => setEditForm(p=>({...p,rating:e.target.value}))} />
                      </div>
                    </div>
                    <div className="pd-field">
                      <label>Description</label>
                      <textarea rows={2} value={editForm.description}
                        onChange={e => setEditForm(p=>({...p,description:e.target.value}))} />
                    </div>
                    <div className="pd-field">
                      <label>Service Address</label>
                      <input placeholder="e.g. 123 Main St, Austin, TX 78701"
                        value={editForm.address}
                        onChange={e => setEditForm(p=>({...p,address:e.target.value}))} />
                    </div>
                    {saveMsg.text && <div className={`pd-message ${saveMsg.type}`}>{saveMsg.text}</div>}
                    <div className="pd-svc-edit-actions">
                      <button className="pd-btn-ghost" onClick={cancelEdit}>Cancel</button>
                      <button className="pd-btn-save" onClick={() => saveEdit(svc.id)} disabled={saving}>
                        {saving ? "Saving…" : "Save Changes"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pd-svc-display-row">
                    <div className="pd-svc-info">
                      <div className="pd-svc-top">
                        <span className="pd-svc-name">{svc.title}</span>
                        <span className="pd-svc-cat">{svc.category}</span>
                      </div>
                      <div className="pd-svc-chips">
                        {svc.rating != null && <span className="pd-svc-chip">⭐ {svc.rating}</span>}
                        <span className="pd-svc-chip">${svc.price}</span>
                        {svc.address && <span className="pd-svc-chip">📍 {svc.address}</span>}
                      </div>
                      <p className="pd-svc-desc">{svc.description}</p>
                    </div>
                    <div className="pd-svc-actions">
                      <button className="pd-btn-edit" onClick={() => startEdit(svc)}>Edit</button>
                      <button className="pd-svc-schedule-btn"
                        onClick={() => { setSchedulingId(svc.id); setEditingId(null); }}>
                        Schedule
                      </button>
                      <button className="pd-svc-delete-btn"
                        onClick={() => setConfirmId(svc.id)}
                        disabled={deleting === svc.id}>
                        {deleting === svc.id ? "…" : "Delete"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      }

      {/* delete confirmation modal */}
      {confirmId !== null && (
        <div className="pd-modal-overlay" onClick={() => setConfirmId(null)}>
          <div className="pd-modal" onClick={e => e.stopPropagation()}>
            <div className="pd-modal-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </div>
            <h3 className="pd-modal-title">Delete Service?</h3>
            <p className="pd-modal-body">
              This service and all its data will be permanently removed. This cannot be undone.
            </p>
            <div className="pd-modal-actions">
              <button className="pd-modal-cancel" onClick={() => setConfirmId(null)}>Cancel</button>
              <button className="pd-modal-confirm" onClick={executeDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

const DURATION_OPTIONS = [
  { value: 15,  label: "15 min" },
  { value: 20,  label: "20 min" },
  { value: 30,  label: "30 min" },
  { value: 45,  label: "45 min" },
  { value: 60,  label: "1 hour" },
  { value: 90,  label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];

function slotCount(start, end, duration) {
  if (!start || !end || !duration) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const total = (eh * 60 + em) - (sh * 60 + sm);
  return total > 0 ? Math.floor(total / duration) : 0;
}
function previewTimes(start, duration, count) {
  if (!start || !count) return [];
  const [h, m] = start.split(":").map(Number);
  const times  = [];
  for (let i = 0; i < Math.min(count, 4); i++) {
    const mins = h * 60 + m + i * duration;
    const hh   = Math.floor(mins / 60) % 24;
    const mm   = mins % 60;
    const ampm = hh >= 12 ? "PM" : "AM";
    const h12  = hh % 12 || 12;
    times.push(`${h12}:${mm.toString().padStart(2, "0")} ${ampm}`);
  }
  return times;
}

// Availability form

function AvailabilityForm({ serviceTitle, onDone, onCancel }) {
  const workingHours = loadHours();

  const JS_TO_KEY = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  const WD_TO_KEY = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
  const WD_LABELS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  const getHoursForDate = (date) => workingHours[JS_TO_KEY[date.getDay()]] || { open:true, start:"09:00", end:"17:00" };
  const getHoursForWd   = (wd)   => workingHours[WD_TO_KEY[wd]] || { open:true, start:"09:00", end:"17:00" };

  const [duration, setDuration]   = useState(30);
  const [schedMode, setSchedMode] = useState("specific");
  const [schedule, setSchedule] = useState(() => {
    const today = new Date();
    const h = getHoursForDate(today);
    return [{ date: today, start: h.start, end: h.end }];
  });

  const [recurring, setRecurring] = useState(() => {
    const monH = workingHours.monday || { start:"09:00", end:"17:00" };
    const d = new Date(); d.setDate(d.getDate() + 30);
    return { startDate: new Date(), endDate: d, days: [0,1,2,3,4], start: monH.start, end: monH.end };
  });

  const [slotMsg, setSlotMsg] = useState({ type:"", text:"" });
  const [saving, setSaving]   = useState(false);

  const addRow = () => {
    const d = new Date();
    const h = getHoursForDate(d);
    setSchedule(p => [...p, { date: d, start: h.start, end: h.end }]);
  };
  const removeRow = (i) => setSchedule(p => p.filter((_,idx) => idx!==i));
  const updateRow = (i, key, val) => setSchedule(p => p.map((r, idx) => {
    if (idx !== i) return r;
    if (key === "date") {
      const h = getHoursForDate(val);
      return { ...r, date: val, start: h.start, end: h.end };
    }
    return { ...r, [key]: val };
  }));
  const rowWarning = (r) => {
    const h = getHoursForDate(r.date);
    if (!h.open) return "You're closed this day per your working hours.";
    if (r.start < h.start || r.end > h.end)
      return `Must be within working hours: ${formatTime(h.start)} – ${formatTime(h.end)}`;
    return null;
  };
  const specificErrors = schedule.map(rowWarning).filter(Boolean);

  //validations
  const recurringWarnings = recurring.days.map(wd => {
    const h = getHoursForWd(wd);
    if (!h.open) return `${WD_LABELS[wd]} is set as unavailable in your working hours`;
    if (recurring.start < h.start || recurring.end > h.end)
      return `${WD_LABELS[wd]}: must be within ${formatTime(h.start)} – ${formatTime(h.end)}`;
    return null;
  }).filter(Boolean);

  const handleSave = async () => {
    setSaving(true); setSlotMsg({ type:"", text:"" });

    if (schedMode === "recurring") {
      try {
        const res = await api.post("/set-recurring-availability/", {
          start_date:    recurring.startDate.toISOString().split("T")[0],
          end_date:      recurring.endDate.toISOString().split("T")[0],
          days_of_week:  recurring.days,
          start_time:    recurring.start,
          end_time:      recurring.end,
          slot_duration: duration,
        });
        setSlotMsg({ type:"success", text:`Availability set for ${res.data.days_created} days.` });
        setTimeout(onDone, 1200);
      } catch (err) {
        setSlotMsg({ type:"error", text: err.response?.data?.error || "Failed to set availability." });
      }
      setSaving(false);
      return;
    }
    // specific dates mode 
    let ok = 0, fail = 0;
    for (const r of schedule) {
      const count = slotCount(r.start, r.end, duration);
      if (count === 0) { fail++; continue; }
      try {
        await api.post("/set-availability/", {
          date:          r.date.toISOString().split("T")[0],
          start_time:    r.start,
          end_time:      r.end,
          slot_duration: duration,
        });
        ok++;
      } catch { fail++; }
    }
    setSaving(false);
    if (ok === 0) {
      setSlotMsg({ type:"error", text:"Could not save. Check your times and try again." });
    } else {
      setSlotMsg({
        type:"success",
        text: fail > 0 ? `Saved ${ok} of ${ok+fail} dates.` : `${ok} date${ok>1?"s":""} saved successfully.`,
      });
      setTimeout(onDone, 1200);
    }
  };

  const totalSlots = schedule.reduce((sum, r) => sum + slotCount(r.start, r.end, duration), 0);
// days in recurring day count
  const recurringDayCount = (() => {
    if (!recurring.startDate || !recurring.endDate || !recurring.days.length) return 0;
    let count = 0;
    const cur   = new Date(recurring.startDate); cur.setHours(0,0,0,0);
    const end   = new Date(recurring.endDate);   end.setHours(0,0,0,0);
    const today = new Date(); today.setHours(0,0,0,0);
    while (cur <= end) {
      const wd = cur.getDay() === 0 ? 6 : cur.getDay() - 1;
      if (recurring.days.includes(wd) && cur >= today) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  })();
  const recurringSlotCount = recurringDayCount * slotCount(recurring.start, recurring.end, duration);
  const saveDisabled = saving ||
    (schedMode === "specific"  && (totalSlots === 0 || specificErrors.length > 0)) ||
    (schedMode === "recurring" && (recurringSlotCount === 0 || recurring.days.length === 0 || recurringWarnings.length > 0));

  return (
    <div className="pd-avail-form">
      <div className="pd-avail-form-header">
        <div>
          <p className="pd-avail-form-title">Update Availability</p>
          {serviceTitle && <p className="pd-avail-form-sub">{serviceTitle}</p>}
        </div>
        <button className="pd-flow-close" onClick={onCancel}>✕</button>
      </div>

      <div className="pd-form" style={{gap:14}}>
        {/* Duration picker */}
        <div className="pd-duration-row">
          <div className="pd-duration-label">
            <span className="pd-duration-title">Appointment duration</span>
            <span className="pd-duration-sub">How long each time slot lasts</span>
          </div>
          <div className="pd-duration-pills">
            {DURATION_OPTIONS.map(opt => (
              <button key={opt.value} type="button"
                className={`pd-duration-pill ${duration===opt.value?"active":""}`}
                onClick={() => setDuration(opt.value)}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="pd-sched-mode-tabs">
          <button type="button"
            className={`pd-sched-mode-tab ${schedMode==="specific"?"active":""}`}
            onClick={() => { setSchedMode("specific"); setSlotMsg({type:"",text:""}); }}>
            Specific Dates
          </button>
          <button type="button"
            className={`pd-sched-mode-tab ${schedMode==="recurring"?"active":""}`}
            onClick={() => { setSchedMode("recurring"); setSlotMsg({type:"",text:""}); }}>
            Recurring
          </button>
        </div>

        {/* ── specific dates ── */}
        {schedMode === "specific" && (
          <>
            <div className="pd-slot-list">
              {schedule.map((r, i) => {
                const h       = getHoursForDate(r.date);
                const count   = slotCount(r.start, r.end, duration);
                const preview = previewTimes(r.start, duration, count);
                const warn    = rowWarning(r);
                return (
                  <div key={i} className="pd-slot-row">
                    <div className="pd-slot-num">{i + 1}</div>
                    <div className="pd-slot-fields-v2">
                      <div className="pd-slot-top-row">
                        <div className="pd-field">
                          <label>Date</label>
                          <DatePicker selected={r.date}
                            onChange={d => updateRow(i,"date",d)} minDate={new Date()}
                            dateFormat="MMM d, yyyy" className="pd-datepicker" />
                        </div>
                        <div className="pd-field">
                          <label>Start</label>
                          <input type="time" value={r.start} className="pd-time-input"
                            min={h.open ? h.start : undefined} max={h.open ? h.end : undefined}
                            onChange={e => updateRow(i,"start",e.target.value)} />
                        </div>
                        <div className="pd-field">
                          <label>End</label>
                          <input type="time" value={r.end} className="pd-time-input"
                            min={h.open ? h.start : undefined} max={h.open ? h.end : undefined}
                            onChange={e => updateRow(i,"end",e.target.value)} />
                        </div>
                      </div>
                      {!warn && h.open && <p className="pd-hours-hint">Working hours: {formatTime(h.start)} – {formatTime(h.end)}</p>}
                      {warn && <p className="pd-hours-warn">{warn}</p>}
                      {!warn && count > 0 && (
                        <div className="pd-slot-preview">
                          <span className="pd-slot-count">{count} slot{count!==1?"s":""}</span>
                          <span className="pd-slot-times">{preview.join(", ")}{count>4?` … +${count-4} more`:""}</span>
                        </div>
                      )}
                    </div>
                    {schedule.length > 1 && (
                      <button className="pd-slot-remove" onClick={() => removeRow(i)}>✕</button>
                    )}
                  </div>
                );
              })}
            </div>
            <button className="pd-btn-add-date" onClick={addRow}>+ Add Another Day</button>
            {totalSlots > 0 && specificErrors.length === 0 && (
              <div className="pd-slot-summary">
                <strong>{totalSlots} slot{totalSlots!==1?"s":""}</strong>
                <span> · {duration}-min appointments</span>
              </div>
            )}
          </>
        )}

        {/* ── recurring ── */}
        {schedMode === "recurring" && (
          <div className="pd-recurring-form">
            <div className="pd-form-row pd-form-row-2">
              <div className="pd-field">
                <label>Start Date</label>
                <DatePicker selected={recurring.startDate}
                  onChange={d => setRecurring(p=>({...p,startDate:d}))}
                  minDate={new Date()} dateFormat="MMM d, yyyy" className="pd-datepicker" />
              </div>
              <div className="pd-field">
                <label>End Date</label>
                <DatePicker selected={recurring.endDate}
                  onChange={d => setRecurring(p=>({...p,endDate:d}))}
                  minDate={recurring.startDate || new Date()} dateFormat="MMM d, yyyy" className="pd-datepicker" />
              </div>
            </div>

            <div className="pd-field">
              <label>Repeat on</label>
              <div className="pd-weekday-row">
                {[["Mon",0],["Tue",1],["Wed",2],["Thu",3],["Fri",4],["Sat",5],["Sun",6]].map(([label, val]) => {
                  const h = getHoursForWd(val);
                  return (
                    <button key={val} type="button"
                      // "unavail" class visually dims days marked closed in working hours
                      className={`pd-weekday-btn ${recurring.days.includes(val)?"active":""} ${!h.open?"unavail":""}`}
                      onClick={() => setRecurring(p => ({
                        ...p, days: p.days.includes(val) ? p.days.filter(d=>d!==val) : [...p.days, val].sort()
                      }))}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* show working hours reference for selected days so provider can spot mismatches */}
            {recurring.days.length > 0 && (
              <div className="pd-hours-ref">
                <span className="pd-hours-ref-label">Your working hours:</span>
                <div className="pd-hours-ref-items">
                  {recurring.days.map(wd => {
                    const h = getHoursForWd(wd);
                    return (
                      <span key={wd} className={`pd-hours-ref-item ${!h.open?"closed":""}`}>
                        {WD_LABELS[wd]}: {h.open ? `${formatTime(h.start)} – ${formatTime(h.end)}` : "Closed"}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pd-form-row pd-form-row-2">
              <div className="pd-field">
                <label>Start Time</label>
                <input type="time" value={recurring.start} className="pd-time-input"
                  onChange={e => setRecurring(p=>({...p,start:e.target.value}))} />
              </div>
              <div className="pd-field">
                <label>End Time</label>
                <input type="time" value={recurring.end} className="pd-time-input"
                  onChange={e => setRecurring(p=>({...p,end:e.target.value}))} />
              </div>
            </div>

            {recurringWarnings.length > 0 && (
              <div className="pd-message error">
                Times outside working hours:
                <ul style={{margin:"4px 0 0",paddingLeft:18}}>
                  {recurringWarnings.map((w,i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}

            {recurringDayCount > 0 && recurringSlotCount > 0 && recurringWarnings.length === 0 && (
              <div className="pd-slot-summary">
                <strong>{recurringSlotCount} total slot{recurringSlotCount!==1?"s":""}</strong>
                <span> · {recurringDayCount} days · {duration}-min each</span>
              </div>
            )}
            {recurring.days.length === 0 && <p className="pd-err">Select at least one day.</p>}
          </div>
        )}

        {slotMsg.text && <div className={`pd-message ${slotMsg.type}`}>{slotMsg.text}</div>}

        <div className="pd-avail-footer">
          <button className="pd-btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="pd-btn-primary" onClick={handleSave} disabled={saveDisabled}>
            {saving ? "Saving…"
              : schedMode==="recurring"
                ? `Save (${recurringSlotCount} slots / ${recurringDayCount} days)`
                : `Save (${totalSlots} slot${totalSlots!==1?"s":""})`}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- create service flow (2-step wizard) ---

function CreateServiceFlow({ onDone, onCancel }) {
  const workingHours = loadHours();

  const JS_TO_KEY = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  const WD_TO_KEY = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
  const WD_LABELS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  const getHoursForDate = (date) => workingHours[JS_TO_KEY[date.getDay()]] || { open:true, start:"09:00", end:"17:00" };
  const getHoursForWd   = (wd)   => workingHours[WD_TO_KEY[wd]] || { open:true, start:"09:00", end:"17:00" };

  // Pre-select the provider's category so they don't have to pick it every time
  const profileCategory = (() => {
    try { return JSON.parse(sessionStorage.getItem("user") || "{}").category || ""; } catch { return ""; }
  })();

  const [step, setStep] = useState(1); // step 1 = details, step 2 = schedule

  // step 1 state
  const [form, setForm]       = useState({ title:"", description:"", price:"", category: profileCategory, rating:"", address:"" });
  const [errors, setErrors]   = useState({});
  const [saving, setSaving]   = useState(false);
  const [saveErr, setSaveErr] = useState("");

  // step 2 state (mirrors AvailabilityForm — duplicated because it's part of a different flow)
  const [duration, setDuration]   = useState(30);
  const [schedMode, setSchedMode] = useState("specific");

  const [schedule, setSchedule] = useState(() => {
    const today = new Date();
    const h = getHoursForDate(today);
    return [{ date: today, start: h.start, end: h.end }];
  });

  const [recurring, setRecurring] = useState(() => {
    const monH = workingHours.monday || { start:"09:00", end:"17:00" };
    const d = new Date(); d.setDate(d.getDate() + 30);
    return { startDate: new Date(), endDate: d, days: [0,1,2,3,4], start: monH.start, end: monH.end };
  });

  const [slotMsg, setSlotMsg]       = useState({ type:"", text:"" });
  const [publishing, setPublishing] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.title.trim() || form.title.trim().length < 3)
      e.title = "Title must be at least 3 characters";
    if (!form.description.trim() || form.description.trim().length < 10)
      e.description = "Description must be at least 10 characters";
    if (!form.price || parseFloat(form.price) <= 0)
      e.price = "Price must be greater than 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true); setSaveErr("");
    try {
      await api.post("services/my-services/", form);
      setStep(2); // advance to schedule step only after the service is saved
    } catch (err) {
      setSaveErr(err.response?.data?.detail || "Failed to create service. Try again.");
    } finally { setSaving(false); }
  };

  const addRow = () => {
    const d = new Date();
    const h = getHoursForDate(d);
    setSchedule(p => [...p, { date: d, start: h.start, end: h.end }]);
  };
  const removeRow = (i) => setSchedule(p => p.filter((_,idx) => idx!==i));
  const updateRow = (i, key, val) => setSchedule(p => p.map((r, idx) => {
    if (idx !== i) return r;
    if (key === "date") {
      const h = getHoursForDate(val);
      return { ...r, date: val, start: h.start, end: h.end };
    }
    return { ...r, [key]: val };
  }));

  const rowWarning = (r) => {
    const h = getHoursForDate(r.date);
    if (!h.open) return "You're closed this day per your working hours.";
    if (r.start < h.start || r.end > h.end)
      return `Must be within working hours: ${formatTime(h.start)} – ${formatTime(h.end)}`;
    return null;
  };
  const specificErrors = schedule.map(rowWarning).filter(Boolean);

  const recurringWarnings = recurring.days.map(wd => {
    const h = getHoursForWd(wd);
    if (!h.open) return `${WD_LABELS[wd]} is set as unavailable in your working hours`;
    if (recurring.start < h.start || recurring.end > h.end)
      return `${WD_LABELS[wd]}: must be within ${formatTime(h.start)} – ${formatTime(h.end)}`;
    return null;
  }).filter(Boolean);

  const handlePublish = async () => {
    setPublishing(true); setSlotMsg({ type:"", text:"" });

    if (schedMode === "recurring") {
      try {
        const res = await api.post("/set-recurring-availability/", {
          start_date:    recurring.startDate.toISOString().split("T")[0],
          end_date:      recurring.endDate.toISOString().split("T")[0],
          days_of_week:  recurring.days,
          start_time:    recurring.start,
          end_time:      recurring.end,
          slot_duration: duration,
        });
        setSlotMsg({ type:"success", text:`Done! Availability set for ${res.data.days_created} days. Service is live!` });
        setTimeout(onDone, 1600);
      } catch (err) {
        setSlotMsg({ type:"error", text: err.response?.data?.error || "Failed to set availability." });
      }
      setPublishing(false);
      return;
    }

    // specific dates — same sequential POST approach as AvailabilityForm
    let ok = 0, fail = 0;
    for (const r of schedule) {
      const count = slotCount(r.start, r.end, duration);
      if (count === 0) { fail++; continue; }
      try {
        await api.post("/set-availability/", {
          date:          r.date.toISOString().split("T")[0],
          start_time:    r.start,
          end_time:      r.end,
          slot_duration: duration,
        });
        ok++;
      } catch { fail++; }
    }
    setPublishing(false);
    if (ok === 0) {
      setSlotMsg({ type:"error", text:"Could not save availability. Check your times and try again." });
    } else {
      setSlotMsg({
        type:"success",
        text: fail > 0
          ? `Saved ${ok} of ${ok+fail} dates. Service is live!`
          : `All ${ok} date${ok>1?"s":""} saved. Service is now live!`,
      });
      setTimeout(onDone, 1400);
    }
  };

  const totalSlots = schedule.reduce((sum, r) => sum + slotCount(r.start, r.end, duration), 0);

  const recurringDayCount = (() => {
    if (!recurring.startDate || !recurring.endDate || !recurring.days.length) return 0;
    let count = 0;
    const cur   = new Date(recurring.startDate); cur.setHours(0,0,0,0);
    const end   = new Date(recurring.endDate);   end.setHours(0,0,0,0);
    const today = new Date(); today.setHours(0,0,0,0);
    while (cur <= end) {
      const wd = cur.getDay() === 0 ? 6 : cur.getDay() - 1;
      if (recurring.days.includes(wd) && cur >= today) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  })();
  const recurringSlotCount = recurringDayCount * slotCount(recurring.start, recurring.end, duration);

  const publishDisabled = publishing ||
    (schedMode === "specific"  && (totalSlots === 0 || specificErrors.length > 0)) ||
    (schedMode === "recurring" && (recurringSlotCount === 0 || recurring.days.length === 0 || recurringWarnings.length > 0));

  return (
    <section className="pd-card pd-create-flow">

      {/* step indicator */}
      <div className="pd-flow-header">
        <div className="pd-flow-steps">
          <span className={`pd-step ${step>=1?"active":""}`}>1 Service Details</span>
          <span className="pd-step-sep">→</span>
          <span className={`pd-step ${step>=2?"active":""}`}>2 Schedule</span>
        </div>
        <button className="pd-flow-close" onClick={onCancel}>✕ Cancel</button>
      </div>

      {/* ── step 1: service details ── */}
      {step === 1 && (
        <form onSubmit={handleCreateService} className="pd-form" noValidate>
          <div className="pd-section-label">Service Details</div>

          <div className="pd-field">
            <label>Service Name *</label>
            <input placeholder="e.g. Eyebrow Threading, Deep Cleaning, Oil Change"
              value={form.title} maxLength="100"
              onChange={e => setForm(p=>({...p,title:e.target.value}))}
              className={errors.title?"err":""} />
            {errors.title && <span className="pd-err">{errors.title}</span>}
          </div>

          <div className="pd-field">
            <label>Description *</label>
            <textarea rows={3} placeholder="Describe what's included, what the customer should expect…"
              value={form.description} maxLength="500"
              onChange={e => setForm(p=>({...p,description:e.target.value}))}
              className={errors.description?"err":""} />
            <span className="pd-char">{form.description.length}/500</span>
            {errors.description && <span className="pd-err">{errors.description}</span>}
          </div>

          <div className="pd-form-row pd-form-row-2">
            <div className="pd-field">
              <label>Price (USD) *</label>
              <div className="pd-price-wrap">
                <span className="pd-currency">$</span>
                <input type="number" placeholder="0.00" step="0.01" min="0"
                  value={form.price}
                  onChange={e => setForm(p=>({...p,price:e.target.value}))}
                  className={errors.price?"err":""} />
              </div>
              {errors.price && <span className="pd-err">{errors.price}</span>}
            </div>
            <div className="pd-field">
              <label>Rating (optional)</label>
              <input type="number" placeholder="e.g. 4.8" step="0.1" min="0" max="5"
                value={form.rating}
                onChange={e => setForm(p=>({...p,rating:e.target.value}))} />
            </div>
          </div>

          <div className="pd-field">
            <label>Service Address</label>
            <input placeholder="e.g. 123 Main St, Austin, TX 78701"
              value={form.address}
              onChange={e => setForm(p=>({...p,address:e.target.value}))} />
            {/* only city+state is shown to customers — full address stays private */}
            <span className="pd-char">Customers will only see the city &amp; state</span>
          </div>

          {saveErr && <div className="pd-message error">{saveErr}</div>}

          <div className="pd-flow-footer">
            <button type="button" className="pd-btn-ghost" onClick={onCancel}>Cancel</button>
            <button type="submit" className="pd-btn-primary" disabled={saving}>
              {saving ? "Creating…" : "Next: Set Schedule →"}
            </button>
          </div>
        </form>
      )}

      {/* ── step 2: schedule ── */}
      {step === 2 && (
        <div className="pd-form">
          <div className="pd-section-label">Appointment Schedule</div>

          <div className="pd-duration-row">
            <div className="pd-duration-label">
              <span className="pd-duration-title">How long is each appointment?</span>
              <span className="pd-duration-sub">Each booking takes this much time. Slots are generated automatically.</span>
            </div>
            <div className="pd-duration-pills">
              {DURATION_OPTIONS.map(opt => (
                <button key={opt.value} type="button"
                  className={`pd-duration-pill ${duration===opt.value?"active":""}`}
                  onClick={() => setDuration(opt.value)}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pd-sched-mode-tabs">
            <button type="button"
              className={`pd-sched-mode-tab ${schedMode==="specific"?"active":""}`}
              onClick={() => { setSchedMode("specific"); setSlotMsg({type:"",text:""}); }}>
              Specific Dates
            </button>
            <button type="button"
              className={`pd-sched-mode-tab ${schedMode==="recurring"?"active":""}`}
              onClick={() => { setSchedMode("recurring"); setSlotMsg({type:"",text:""}); }}>
              Recurring Schedule
            </button>
          </div>

          {/* ── specific dates ── */}
          {schedMode === "specific" && (
            <>
              <div className="pd-slot-list">
                {schedule.map((r, i) => {
                  const h       = getHoursForDate(r.date);
                  const count   = slotCount(r.start, r.end, duration);
                  const preview = previewTimes(r.start, duration, count);
                  const warn    = rowWarning(r);
                  return (
                    <div key={i} className="pd-slot-row">
                      <div className="pd-slot-num">{i + 1}</div>
                      <div className="pd-slot-fields-v2">
                        <div className="pd-slot-top-row">
                          <div className="pd-field">
                            <label>Date</label>
                            <DatePicker selected={r.date}
                              onChange={d => updateRow(i,"date",d)} minDate={new Date()}
                              dateFormat="MMM d, yyyy" className="pd-datepicker" />
                          </div>
                          <div className="pd-field">
                            <label>Start Time</label>
                            <input type="time" value={r.start} className="pd-time-input"
                              min={h.open ? h.start : undefined}
                              max={h.open ? h.end   : undefined}
                              onChange={e => updateRow(i,"start",e.target.value)} />
                          </div>
                          <div className="pd-field">
                            <label>End Time</label>
                            <input type="time" value={r.end} className="pd-time-input"
                              min={h.open ? h.start : undefined}
                              max={h.open ? h.end   : undefined}
                              onChange={e => updateRow(i,"end",e.target.value)} />
                          </div>
                        </div>
                        {!warn && h.open && (
                          <p className="pd-hours-hint">Working hours: {formatTime(h.start)} – {formatTime(h.end)}</p>
                        )}
                        {warn && <p className="pd-hours-warn">{warn}</p>}
                        {!warn && count > 0 && (
                          <div className="pd-slot-preview">
                            <span className="pd-slot-count">{count} slot{count!==1?"s":""}</span>
                            <span className="pd-slot-times">
                              {preview.join(", ")}{count > 4 ? ` … +${count-4} more` : ""}
                            </span>
                          </div>
                        )}
                        {!warn && count === 0 && r.start && r.end && r.start >= r.end && (
                          <p className="pd-err" style={{marginTop:4}}>End time must be after start time.</p>
                        )}
                      </div>
                      {schedule.length > 1 && (
                        <button className="pd-slot-remove" onClick={() => removeRow(i)}>✕</button>
                      )}
                    </div>
                  );
                })}
              </div>
              <button className="pd-btn-add-date" onClick={addRow}>+ Add Another Day</button>
              {totalSlots > 0 && specificErrors.length === 0 && (
                <div className="pd-slot-summary">
                  <strong>{totalSlots} slot{totalSlots!==1?"s":""}</strong>
                  <span> across {schedule.filter(r=>slotCount(r.start,r.end,duration)>0).length} day{schedule.length!==1?"s":""} · {duration}-min appointments</span>
                </div>
              )}
            </>
          )}

          {/* ── recurring ── */}
          {schedMode === "recurring" && (
            <div className="pd-recurring-form">
              <div className="pd-form-row pd-form-row-2">
                <div className="pd-field">
                  <label>Start Date</label>
                  <DatePicker selected={recurring.startDate}
                    onChange={d => setRecurring(p=>({...p,startDate:d}))}
                    minDate={new Date()} dateFormat="MMM d, yyyy" className="pd-datepicker" />
                </div>
                <div className="pd-field">
                  <label>End Date</label>
                  <DatePicker selected={recurring.endDate}
                    onChange={d => setRecurring(p=>({...p,endDate:d}))}
                    minDate={recurring.startDate || new Date()} dateFormat="MMM d, yyyy" className="pd-datepicker" />
                </div>
              </div>

              <div className="pd-field">
                <label>Repeat on these days</label>
                <div className="pd-weekday-row">
                  {[["Mon",0],["Tue",1],["Wed",2],["Thu",3],["Fri",4],["Sat",5],["Sun",6]].map(([label, val]) => {
                    const h = getHoursForWd(val);
                    return (
                      <button key={val} type="button"
                        className={`pd-weekday-btn ${recurring.days.includes(val)?"active":""} ${!h.open?"unavail":""}`}
                        onClick={() => setRecurring(p => ({
                          ...p, days: p.days.includes(val)
                            ? p.days.filter(d=>d!==val)
                            : [...p.days, val].sort()
                        }))}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* working hours reference for selected days */}
              {recurring.days.length > 0 && (
                <div className="pd-hours-ref">
                  <span className="pd-hours-ref-label">Your working hours:</span>
                  <div className="pd-hours-ref-items">
                    {recurring.days.map(wd => {
                      const h = getHoursForWd(wd);
                      return (
                        <span key={wd} className={`pd-hours-ref-item ${!h.open?"closed":""}`}>
                          {WD_LABELS[wd]}: {h.open ? `${formatTime(h.start)} – ${formatTime(h.end)}` : "Closed"}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pd-form-row pd-form-row-2">
                <div className="pd-field">
                  <label>Start Time</label>
                  <input type="time" value={recurring.start} className="pd-time-input"
                    onChange={e => setRecurring(p=>({...p,start:e.target.value}))} />
                </div>
                <div className="pd-field">
                  <label>End Time</label>
                  <input type="time" value={recurring.end} className="pd-time-input"
                    onChange={e => setRecurring(p=>({...p,end:e.target.value}))} />
                </div>
              </div>

              {recurringWarnings.length > 0 && (
                <div className="pd-message error">
                  Times outside working hours:
                  <ul style={{margin:"4px 0 0",paddingLeft:18}}>
                    {recurringWarnings.map((w,i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}

              {recurringDayCount > 0 && recurringSlotCount > 0 && recurringWarnings.length === 0 && (
                <div className="pd-slot-summary">
                  <strong>{recurringSlotCount} total slot{recurringSlotCount!==1?"s":""}</strong>
                  <span> across {recurringDayCount} day{recurringDayCount!==1?"s":""} · {duration}-min appointments · {slotCount(recurring.start,recurring.end,duration)} slots/day</span>
                </div>
              )}
              {recurring.days.length === 0 && (
                <p className="pd-err">Select at least one day.</p>
              )}
            </div>
          )}

          {slotMsg.text && <div className={`pd-message ${slotMsg.type}`}>{slotMsg.text}</div>}

          <div className="pd-flow-footer">
            <button className="pd-btn-ghost" onClick={() => setStep(1)}>← Back</button>
            <div style={{display:"flex", gap:10}}>
              {/* provider can skip scheduling and come back to it later */}
              <button className="pd-btn-ghost" onClick={onDone}>Skip for now</button>
              <button className="pd-btn-primary" onClick={handlePublish} disabled={publishDisabled}>
                {publishing ? "Publishing…"
                  : schedMode==="recurring"
                    ? `Publish (${recurringSlotCount} slots over ${recurringDayCount} days)`
                    : `Publish Service (${totalSlots} slots)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
