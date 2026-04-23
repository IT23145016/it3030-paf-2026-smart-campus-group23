import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import Shell from "../components/Shell";
import { api } from "../services/api";

const TYPE_OPTIONS = ["LECTURE_HALL", "LAB", "MEETING_ROOM", "EQUIPMENT"];
const STATUS_OPTIONS = ["ACTIVE", "MAINTENANCE", "OUT_OF_SERVICE"];

export default function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [filters, setFilters] = useState({ query: "", type: "", location: "", minCapacity: "", status: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingResource, setBookingResource] = useState(null);
  const [bookingForm, setBookingForm] = useState({ purpose: "", attendees: 1, startTime: "", endTime: "" });
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const bookingSectionRef = useRef(null);
  const { user } = useAuth();

  const activeCount = resources.filter((r) => r.status === "ACTIVE").length;
  const maintenanceCount = resources.filter((r) => r.status === "MAINTENANCE").length;
  const outOfServiceCount = resources.filter((r) => r.status === "OUT_OF_SERVICE").length;

  useEffect(() => { loadResources(); }, []);

  useEffect(() => {
    if (!bookingResource || !bookingSectionRef.current) return;
    bookingSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [bookingResource]);

  async function loadResources(nextFilters = filters) {
    setLoading(true);
    setError("");
    try {
      const data = await api.getResources(nextFilters);
      setResources(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(e) {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function openBooking(resource) {
    setBookingResource(resource);
    setBookingForm({ purpose: "", attendees: 1, startTime: "", endTime: "" });
    setBookingError("");
    setBookingMessage("");
  }

  function closeBooking() {
    setBookingResource(null);
    setBookingError("");
    setBookingMessage("");
  }

  function validateBookingAgainstAvailability(resource, form) {
    if (!form.startTime || !form.endTime) return null;
    const start = new Date(form.startTime);
    const end = new Date(form.endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "Choose valid start and end times.";
    if (start.toDateString() !== end.toDateString()) return "Booking must start and end on the same day.";
    const dayName = start.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
    const matchingWindows = (resource.availabilityWindows || []).filter((w) => w.dayOfWeek?.toUpperCase() === dayName);
    if (!matchingWindows.length) return `This resource is not available on ${formatLabel(dayName)}.`;
    const startTime = form.startTime.slice(11, 16);
    const endTime = form.endTime.slice(11, 16);
    const withinWindow = matchingWindows.some((w) => startTime >= w.startTime && endTime <= w.endTime);
    if (!withinWindow) {
      const windowsText = matchingWindows.map((w) => `${w.startTime} - ${w.endTime}`).join(", ");
      return `Select a time within ${formatLabel(dayName)} availability: ${windowsText}.`;
    }
    return null;
  }

  async function submitBooking(e) {
    e.preventDefault();
    if (!bookingResource) return;
    setBookingLoading(true);
    setBookingError("");
    setBookingMessage("");
    try {
      const availabilityError = validateBookingAgainstAvailability(bookingResource, bookingForm);
      if (availabilityError) throw new Error(availabilityError);
      await api.createBooking({
        resourceId: bookingResource.id,
        purpose: bookingForm.purpose,
        attendees: Number(bookingForm.attendees),
        startTime: bookingForm.startTime,
        endTime: bookingForm.endTime
      });
      setBookingMessage("Booking request submitted successfully.");
      setBookingForm({ purpose: "", attendees: 1, startTime: "", endTime: "" });
      setTimeout(() => closeBooking(), 2000);
    } catch (err) {
      setBookingError(err.message || "Failed to submit booking request.");
    } finally {
      setBookingLoading(false);
    }
  }

  const statusColor = { ACTIVE: "#4f8fbe", MAINTENANCE: "#e8a838", OUT_OF_SERVICE: "#d95f4b" };
  const typeIcon = { LECTURE_HALL: "🏛", LAB: "🔬", MEETING_ROOM: "🤝", EQUIPMENT: "🔧" };

  return (
    <Shell title="Facilities Catalogue">

      {/* Stats Row */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: "1rem" }}>
        {[
          { label: "Total Resources", value: resources.length, color: "#214c71" },
          { label: "Available", value: activeCount, color: "#4f8fbe" },
          { label: "Maintenance", value: maintenanceCount, color: "#e8a838" },
          { label: "Out of Service", value: outOfServiceCount, color: "#d95f4b" },
        ].map((stat) => (
          <article key={stat.label} className="metric-card" style={{ padding: "1.2rem", borderTop: `3px solid ${stat.color}` }}>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, color: "var(--muted)" }}>{stat.label}</span>
            <strong style={{ display: "block", fontSize: "2.2rem", lineHeight: 1, margin: "0.3rem 0", color: stat.color }}>{stat.value}</strong>
          </article>
        ))}
      </section>

      {/* Filters */}
      <section className="table-card" style={{ padding: "1.4rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <p className="eyebrow">Filter Resources</p>
            <h3 style={{ margin: 0 }}>Find the right space or equipment</h3>
          </div>
          <button type="button" className="secondary-button" onClick={() => loadResources()} style={{ width: "42px", height: "42px", padding: 0, borderRadius: "999px", display: "inline-flex", alignItems: "center", justifyContent: "center" }} aria-label="Refresh">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        </div>
        <form style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr)) auto", gap: "0.85rem", alignItems: "end" }}
          onSubmit={(e) => { e.preventDefault(); loadResources(filters); }} noValidate>
          <label>Search<input name="query" value={filters.query} onChange={handleFilterChange} placeholder="Name, code..." /></label>
          <label>Type
            <select name="type" value={filters.type} onChange={handleFilterChange}>
              <option value="">All types</option>
              {TYPE_OPTIONS.map((o) => <option key={o} value={o}>{formatLabel(o)}</option>)}
            </select>
          </label>
          <label>Location<input name="location" value={filters.location} onChange={handleFilterChange} placeholder="Building or block" /></label>
          <label>Min Capacity<input name="minCapacity" type="number" min="1" value={filters.minCapacity} onChange={handleFilterChange} /></label>
          <label>Status
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">Any status</option>
              {STATUS_OPTIONS.map((o) => <option key={o} value={o}>{formatLabel(o)}</option>)}
            </select>
          </label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="submit">Search</button>
            <button type="button" className="secondary-button" onClick={() => { const c = { query: "", type: "", location: "", minCapacity: "", status: "" }; setFilters(c); loadResources(c); }}>Clear</button>
          </div>
        </form>
      </section>

      {error ? <p className="error">{error}</p> : null}

      {/* Booking Form Modal */}
      {bookingResource ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(16,33,29,0.45)", zIndex: 50, display: "grid", placeItems: "center", padding: "1rem" }} ref={bookingSectionRef}>
          <div style={{ background: "#fff", borderRadius: "24px", padding: "2rem", maxWidth: "560px", width: "100%", boxShadow: "0 24px 60px rgba(33,76,113,0.2)", display: "grid", gap: "1.2rem", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
              <div>
                <p className="eyebrow">Booking Request</p>
                <h3 style={{ margin: 0, color: "#173f61" }}>{bookingResource.name}</h3>
                <p style={{ margin: "0.3rem 0 0", color: "var(--muted)", fontSize: "0.88rem" }}>{bookingResource.location} · Capacity: {bookingResource.capacity}</p>
              </div>
              <button type="button" className="secondary-button" onClick={closeBooking} style={{ padding: "0.5rem 0.9rem", borderRadius: "10px", flexShrink: 0 }}>✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", padding: "0.9rem", borderRadius: "14px", background: "rgba(224,238,249,0.5)" }}>
              {(bookingResource.availabilityWindows || []).map((w) => (
                <span key={`${w.dayOfWeek}-${w.startTime}`} style={{ fontSize: "0.82rem", color: "#244866", fontWeight: 600 }}>
                  📅 {formatLabel(w.dayOfWeek)}: {w.startTime} – {w.endTime}
                </span>
              ))}
            </div>

            <form onSubmit={submitBooking} style={{ display: "grid", gap: "1rem" }} noValidate>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                <label className="signup-inline-field"><span>Start Time</span><input type="datetime-local" name="startTime" value={bookingForm.startTime} onChange={(e) => { setBookingForm((p) => ({ ...p, startTime: e.target.value })); setBookingError(""); }} required /></label>
                <label className="signup-inline-field"><span>End Time</span><input type="datetime-local" name="endTime" value={bookingForm.endTime} onChange={(e) => { setBookingForm((p) => ({ ...p, endTime: e.target.value })); setBookingError(""); }} required /></label>
              </div>
              <label className="signup-inline-field"><span>Attendees (max {bookingResource.capacity})</span><input type="number" min="1" max={bookingResource.capacity} name="attendees" value={bookingForm.attendees} onChange={(e) => setBookingForm((p) => ({ ...p, attendees: e.target.value }))} required /></label>
              <label className="signup-inline-field"><span>Purpose</span><textarea name="purpose" value={bookingForm.purpose} onChange={(e) => setBookingForm((p) => ({ ...p, purpose: e.target.value }))} placeholder="Describe the purpose of this booking..." style={{ minHeight: "90px", resize: "vertical" }} required /></label>
              {bookingError ? <p className="error" style={{ margin: 0 }}>{bookingError}</p> : null}
              {bookingMessage ? <p style={{ margin: 0, color: "#214c71", fontWeight: 600 }}>{bookingMessage}</p> : null}
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button type="submit" disabled={bookingLoading} style={{ flex: 1 }}>{bookingLoading ? "Submitting…" : "Submit Request"}</button>
                <button type="button" className="secondary-button" onClick={closeBooking} style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Resource Grid */}
      {loading ? <p className="muted" style={{ textAlign: "center", padding: "2rem" }}>Loading catalogue...</p> : null}
      {!loading && resources.length === 0 ? <p className="muted" style={{ textAlign: "center", padding: "2rem" }}>No resources matched your filters.</p> : null}

      {!loading ? (
        <section style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "1.25rem" }}>
          {resources.map((resource) => (
            <article key={resource.id} style={{
              background: "var(--card)", borderRadius: "22px", padding: "1.4rem",
              border: "1px solid var(--outline)", display: "grid", gap: "0.85rem",
              boxShadow: "0 16px 40px rgba(16,33,29,0.07), inset 0 1px 0 rgba(255,255,255,0.28)",
              transition: "transform 0.18s ease, box-shadow 0.18s ease"
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 22px 50px rgba(33,76,113,0.13)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(16,33,29,0.07)"; }}
            >
              {/* Card Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontSize: "1.6rem", lineHeight: 1 }}>{typeIcon[resource.type] || "📦"}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", fontWeight: 700 }}>{resource.resourceCode}</p>
                    <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#173f61", lineHeight: 1.3 }}>{resource.name}</h3>
                  </div>
                </div>
                <span style={{
                  display: "inline-flex", padding: "0.3rem 0.7rem", borderRadius: "999px",
                  fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap",
                  background: `${statusColor[resource.status]}22`, color: statusColor[resource.status]
                }}>{formatLabel(resource.status)}</span>
              </div>

              {/* Description */}
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {resource.description || "No description provided."}
              </p>

              {/* Details */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                {[
                  { label: "Type", value: formatLabel(resource.type) },
                  { label: "Capacity", value: `${resource.capacity} people` },
                  { label: "Location", value: resource.location },
                  { label: "Amenities", value: resource.amenities?.length ? `${resource.amenities.length} listed` : "None" },
                ].map((d) => (
                  <div key={d.label} style={{ padding: "0.6rem 0.75rem", borderRadius: "12px", background: "rgba(224,238,249,0.6)", border: "1px solid rgba(53,102,141,0.08)" }}>
                    <span style={{ display: "block", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.07em", color: "#61706a", fontWeight: 700 }}>{d.label}</span>
                    <strong style={{ fontSize: "0.88rem", color: "#173f61" }}>{d.value}</strong>
                  </div>
                ))}
              </div>

              {/* Availability */}
              {resource.availabilityWindows?.length ? (
                <div style={{ padding: "0.6rem 0.75rem", borderRadius: "12px", background: "rgba(214,231,246,0.4)", border: "1px solid rgba(79,143,190,0.12)" }}>
                  <span style={{ display: "block", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.07em", color: "#61706a", fontWeight: 700, marginBottom: "0.35rem" }}>Availability</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                    {resource.availabilityWindows.slice(0, 3).map((w) => (
                      <span key={`${w.dayOfWeek}-${w.startTime}`} style={{ fontSize: "0.75rem", padding: "0.2rem 0.55rem", borderRadius: "999px", background: "rgba(79,143,190,0.12)", color: "#214c71", fontWeight: 600 }}>
                        {formatLabel(w.dayOfWeek).slice(0, 3)} {w.startTime}–{w.endTime}
                      </span>
                    ))}
                    {resource.availabilityWindows.length > 3 ? (
                      <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.55rem", borderRadius: "999px", background: "rgba(79,143,190,0.12)", color: "#214c71", fontWeight: 600 }}>
                        +{resource.availabilityWindows.length - 3} more
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {/* Action */}
              <button
                type="button"
                onClick={() => resource.status === "ACTIVE" && user ? openBooking(resource) : null}
                disabled={resource.status !== "ACTIVE" || !user}
                style={{ width: "100%", borderRadius: "12px", padding: "0.75rem", fontSize: "0.9rem" }}
              >
                {!user ? "Sign in to book" : resource.status === "ACTIVE" ? "Request Booking" : "Unavailable"}
              </button>
            </article>
          ))}
        </section>
      ) : null}
    </Shell>
  );
}

function formatLabel(value) {
  return value.toLowerCase().split("_").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}
