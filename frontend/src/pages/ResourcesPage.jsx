import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import Shell from "../components/Shell";
import { api } from "../services/api";

const TYPE_OPTIONS = ["LECTURE_HALL", "LAB", "MEETING_ROOM", "EQUIPMENT"];
const STATUS_OPTIONS = ["ACTIVE", "MAINTENANCE", "OUT_OF_SERVICE"];
const DAY_OPTIONS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

const emptyForm = {
  resourceCode: "",
  name: "",
  type: "LECTURE_HALL",
  capacity: 1,
  location: "",
  status: "ACTIVE",
  description: "",
  amenities: "",
  availabilityWindows: [{ dayOfWeek: "MONDAY", startTime: "08:00", endTime: "17:00" }]
};

export default function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [filters, setFilters] = useState({
    query: "",
    type: "",
    location: "",
    minCapacity: "",
    status: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingResource, setBookingResource] = useState(null);
  const [bookingForm, setBookingForm] = useState({ purpose: "", attendees: 1, startTime: "", endTime: "" });
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const bookingSectionRef = useRef(null);
  const { user } = useAuth();
  const activeCount = resources.filter((resource) => resource.status === "ACTIVE").length;
  const maintenanceCount = resources.filter((resource) => resource.status === "MAINTENANCE").length;
  const outOfServiceCount = resources.filter((resource) => resource.status === "OUT_OF_SERVICE").length;

  useEffect(() => {
    loadResources();
  }, []);

  useEffect(() => {
    if (!bookingResource || !bookingSectionRef.current) {
      return;
    }

    bookingSectionRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
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

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  async function submitFilters(event) {
    event.preventDefault();
    loadResources(filters);
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

  function handleBookingChange(event) {
    const { name, value } = event.target;
    setBookingForm((current) => ({ ...current, [name]: value }));
    setBookingError("");
  }

  function validateBookingAgainstAvailability(resource, form) {
    if (!form.startTime || !form.endTime) {
      return null;
    }

    const start = new Date(form.startTime);
    const end = new Date(form.endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return "Choose valid start and end times.";
    }

    if (start.toDateString() !== end.toDateString()) {
      return "Booking must start and end on the same day.";
    }

    const dayName = start.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
    const matchingWindows = (resource.availabilityWindows || []).filter(
      (window) => window.dayOfWeek?.toUpperCase() === dayName
    );

    if (!matchingWindows.length) {
      return `This resource is not available on ${formatLabel(dayName)}.`;
    }

    const startTime = form.startTime.slice(11, 16);
    const endTime = form.endTime.slice(11, 16);
    const withinWindow = matchingWindows.some(
      (window) => startTime >= window.startTime && endTime <= window.endTime
    );

    if (!withinWindow) {
      const windowsText = matchingWindows
        .map((window) => `${window.startTime} - ${window.endTime}`)
        .join(", ");
      return `Select a time within ${formatLabel(dayName)} availability: ${windowsText}.`;
    }

    return null;
  }

  async function submitBooking(event) {
    event.preventDefault();
    if (!bookingResource) {
      return;
    }

    setBookingLoading(true);
    setBookingError("");
    setBookingMessage("");
    try {
      const availabilityError = validateBookingAgainstAvailability(bookingResource, bookingForm);
      if (availabilityError) {
        throw new Error(availabilityError);
      }

      await api.createBooking({
        resourceId: bookingResource.id,
        purpose: bookingForm.purpose,
        attendees: Number(bookingForm.attendees),
        // The backend expects a LocalDateTime string, so send the plain datetime-local value.
        startTime: bookingForm.startTime,
        endTime: bookingForm.endTime
      });
      setBookingMessage("Booking request submitted successfully.");
      setBookingForm((current) => ({ ...current, purpose: "", attendees: 1, startTime: "", endTime: "" }));
      setTimeout(() => {
        closeBooking();
      }, 2000);
    } catch (err) {
      setBookingError(err.message || "Failed to submit booking request.");
    } finally {
      setBookingLoading(false);
    }
  }

  return (
    <Shell title="Facilities Catalogue">
      <section className="resource-summary">
        <article>
          <strong>{resources.length}</strong>
          <span>Total resources</span>
        </article>
        <article>
          <strong>{activeCount}</strong>
          <span>Ready to use</span>
        </article>
        <article>
          <strong>{maintenanceCount}</strong>
          <span>In maintenance</span>
        </article>
        <article>
          <strong>{outOfServiceCount}</strong>
          <span>Out of service</span>
        </article>
      </section>

      <section className="resource-intro">
        <div className="resource-intro-copy">
          <p className="eyebrow">Facilities and Assets</p>
          <h2>Find the right space or equipment quickly.</h2>
          <p className="resource-intro-note">Check availability, compare capacity, and confirm the best location before sending a booking request.</p>
          <div className="resource-intro-tags">
            <span>Rooms</span>
            <span>Labs</span>
            <span>Meeting spaces</span>
            <span>Equipment</span>
          </div>
        </div>
      </section>

      <section className="table-card">
        <div className="table-header">
          <div>
            <p className="eyebrow">Catalogue Filters</p>
            <h3>Search by name, location, type, capacity, or current status.</h3>
          </div>
          <button type="button" className="secondary-button toolbar-button" onClick={() => loadResources()}>
            Refresh
          </button>
        </div>

        <form className="filter-grid" onSubmit={submitFilters}>
          <label>
            Search
            <input name="query" value={filters.query} onChange={handleFilterChange} placeholder="Lecture hall, projector, lab" />
          </label>
          <label>
            Type
            <select name="type" value={filters.type} onChange={handleFilterChange}>
              <option value="">All types</option>
              {TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {formatLabel(option)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Location
            <input name="location" value={filters.location} onChange={handleFilterChange} placeholder="Building or block" />
          </label>
          <label>
            Min capacity
            <input name="minCapacity" type="number" min="1" value={filters.minCapacity} onChange={handleFilterChange} />
          </label>
          <label>
            Status
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">Any status</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {formatLabel(option)}
                </option>
              ))}
            </select>
          </label>
          <div className="filter-actions">
            <button type="submit">Apply filters</button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                const cleared = { query: "", type: "", location: "", minCapacity: "", status: "" };
                setFilters(cleared);
                loadResources(cleared);
              }}
            >
              Clear
            </button>
          </div>
        </form>
      </section>

      {error ? <p className="error">{error}</p> : null}

      {bookingResource ? (
        <section className="booking-request-panel" ref={bookingSectionRef}>
          <article className="booking-request-summary">
            <p className="eyebrow">Booking Request</p>
            <h3>{bookingResource.name}</h3>
            <p className="muted">Choose a time slot, confirm the attendee count, and explain the purpose of the booking.</p>

            <div className="booking-request-meta">
              <div>
                <span>Type</span>
                <strong>{formatLabel(bookingResource.type)}</strong>
              </div>
              <div>
                <span>Capacity</span>
                <strong>{bookingResource.capacity} people</strong>
              </div>
              <div>
                <span>Location</span>
                <strong>{bookingResource.location}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{formatLabel(bookingResource.status)}</strong>
              </div>
            </div>
          </article>

          <article className="table-card booking-request-form-card">
            <div className="booking-panel-top">
              <div>
                <p className="eyebrow">Request Details</p>
                <h3>Reserve this resource</h3>
              </div>
              <button type="button" className="secondary-button" onClick={closeBooking}>
                Close
              </button>
            </div>

            <form className="booking-request-form" onSubmit={submitBooking}>
              <label>
                Start time
                <input type="datetime-local" name="startTime" value={bookingForm.startTime} onChange={handleBookingChange} required />
              </label>
              <label>
                End time
                <input type="datetime-local" name="endTime" value={bookingForm.endTime} onChange={handleBookingChange} required />
              </label>
              <label>
                Attendees
                <input type="number" min="1" max={bookingResource.capacity} name="attendees" value={bookingForm.attendees} onChange={handleBookingChange} required />
              </label>
              <label className="field-full">
                Purpose
                <textarea
                  name="purpose"
                  value={bookingForm.purpose}
                  onChange={handleBookingChange}
                  placeholder="Describe the class, meeting, or activity this booking supports..."
                  required
                />
              </label>
              <div className="field-full booking-availability-note">
                <span>Available windows</span>
                <p>
                  {(bookingResource.availabilityWindows || [])
                    .map((window) => `${formatLabel(window.dayOfWeek)} ${window.startTime} - ${window.endTime}`)
                    .join(" • ")}
                </p>
              </div>
              <div className="filter-actions">
                <button type="submit" disabled={bookingLoading}>
                  {bookingLoading ? "Submitting..." : "Submit booking request"}
                </button>
                <button type="button" className="secondary-button" onClick={closeBooking}>
                  Cancel
                </button>
              </div>
              {bookingMessage ? <p className="success">{bookingMessage}</p> : null}
              {bookingError ? <p className="error">{bookingError}</p> : null}
            </form>
          </article>
        </section>
      ) : null}

      <section className="resource-grid">
        {loading ? <div className="panel">Loading catalogue...</div> : null}
        {!loading && resources.length === 0 ? <div className="panel">No resources matched your filters.</div> : null}
        {!loading
          ? resources.map((resource) => (
              <article className="resource-card" key={resource.id}>
                <div className="resource-card-head">
                  <div>
                    <p className="eyebrow">{resource.resourceCode}</p>
                    <h3>{resource.name}</h3>
                  </div>
                  <span className={`status-pill ${resource.status.toLowerCase()}`}>{formatLabel(resource.status)}</span>
                </div>
                <p className="resource-copy">{resource.description || "No description supplied yet."}</p>
                <div className="resource-details-grid">
                  <div className="resource-detail">
                    <span className="resource-detail-label">Type</span>
                    <strong>{formatLabel(resource.type)}</strong>
                  </div>
                  <div className="resource-detail">
                    <span className="resource-detail-label">Capacity</span>
                    <strong>{resource.capacity} people</strong>
                  </div>
                  <div className="resource-detail resource-detail-wide">
                    <span className="resource-detail-label">Location</span>
                    <strong>{resource.location}</strong>
                  </div>
                </div>
                <div className="resource-section">
                  <p className="resource-section-title">Amenities</p>
                  <div className="amenity-list">
                    {resource.amenities.length ? resource.amenities.map((amenity) => <span key={amenity}>{amenity}</span>) : <span>No amenities listed</span>}
                  </div>
                </div>
                <div className="resource-section">
                  <p className="resource-section-title">Availability</p>
                  <div className="schedule-list">
                  {resource.availabilityWindows.map((window) => (
                    <div key={`${resource.id}-${window.dayOfWeek}-${window.startTime}`}>
                      <strong>{formatLabel(window.dayOfWeek)}</strong>
                      <span>
                        {window.startTime} - {window.endTime}
                      </span>
                    </div>
                  ))}
                </div>
                </div>
                <div className="resource-card-actions">
                  {user && resource.status === "ACTIVE" ? (
                    <button type="button" onClick={() => openBooking(resource)}>
                      Request booking
                    </button>
                  ) : (
                    <button type="button" className="secondary-button" disabled>
                      {user ? "Booking unavailable" : "Sign in to book"}
                    </button>
                  )}
                </div>
              </article>
            ))
          : null}
      </section>
    </Shell>
  );
}

function formatLabel(value) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
