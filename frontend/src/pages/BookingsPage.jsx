import { useEffect, useState } from "react";
import Shell from "../components/Shell";
import { api } from "../services/api";

const STATUS_ORDER = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    startDate: "",
    endDate: ""
  });

  useEffect(() => {
    loadBookings(filters);
  }, []);

  async function loadBookings(nextFilters = filters) {
    setLoading(true);
    setError("");
    try {
      const data = await api.getUserBookings(nextFilters);
      setBookings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function cancelBooking(bookingId) {
    setCancellingBooking(bookingId);
    try {
      await api.cancelBooking(bookingId);
      await loadBookings(filters);
    } catch (err) {
      setError(err.message);
    } finally {
      setCancellingBooking(null);
    }
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function applyFilters(event) {
    event.preventDefault();
    loadBookings(filters);
  }

  const summary = STATUS_ORDER.reduce((counts, status) => {
    counts[status] = bookings.filter((booking) => booking.status === status).length;
    return counts;
  }, { PENDING: 0, APPROVED: 0, REJECTED: 0, CANCELLED: 0 });

  return (
    <Shell title="My Bookings">
      <section className="booking-page-shell">
        <section className="booking-overview-grid">
          <article className="booking-overview-card booking-overview-intro">
            <p className="eyebrow">Bookings Overview</p>
            <h3>Track every request from one clean timeline.</h3>
            <p className="muted">Filter by status or date, then act on the bookings that still need your attention.</p>
          </article>
          <article className="booking-overview-card">
            <span>Total</span>
            <strong>{bookings.length}</strong>
          </article>
          <article className="booking-overview-card">
            <span>Pending</span>
            <strong>{summary.PENDING}</strong>
          </article>
          <article className="booking-overview-card">
            <span>Approved</span>
            <strong>{summary.APPROVED}</strong>
          </article>
        </section>

        <section className="table-card booking-panel">
          <div className="booking-panel-top">
            <div>
              <p className="eyebrow">Your Requests</p>
              <h3>View and manage your booking requests.</h3>
            </div>
            <button type="button" className="secondary-button toolbar-button" onClick={() => loadBookings(filters)}>
              Refresh
            </button>
          </div>

          <form className="filter-grid booking-filter-grid" onSubmit={applyFilters}>
            <label>
              Status
              <select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label>
              Start date
              <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
            </label>
            <label>
              End date
              <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
            </label>
            <div className="filter-actions">
              <button type="submit">Apply filters</button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  const cleared = { status: "all", startDate: "", endDate: "" };
                  setFilters(cleared);
                  loadBookings(cleared);
                }}
              >
                Clear
              </button>
            </div>
          </form>

          {error ? <p className="error">{error}</p> : null}

          {loading ? (
            <div className="booking-empty-state">Loading your bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="booking-empty-state">
              <p>No bookings yet.</p>
              <a className="secondary-button" href="/resources">Browse Facilities</a>
            </div>
          ) : (
            <div className="booking-results">
              {bookings.map((booking) => (
                <article className="booking-row" key={booking.id}>
                  <div className="booking-row-main">
                    <div className="booking-row-title">
                      <div>
                        <p className="eyebrow">Booking Request</p>
                        <h4>{booking.resourceName || `Resource #${booking.resourceId}`}</h4>
                      </div>
                      <span className={`status-pill ${booking.status?.toLowerCase() || "pending"}`}>
                        {booking.status || "PENDING"}
                      </span>
                    </div>
                    <p className="booking-purpose">{booking.purpose}</p>
                  </div>

                  <div className="booking-meta-grid">
                    <div className="booking-meta-item">
                      <span>Attendees</span>
                      <strong>{booking.attendees}</strong>
                    </div>
                    <div className="booking-meta-item">
                      <span>Start</span>
                      <strong>{new Date(booking.startTime).toLocaleString()}</strong>
                    </div>
                    <div className="booking-meta-item">
                      <span>End</span>
                      <strong>{new Date(booking.endTime).toLocaleString()}</strong>
                    </div>
                    <div className="booking-meta-item">
                      <span>Reference</span>
                      <strong>{booking.id}</strong>
                    </div>
                  </div>

                  {booking.adminNotes ? (
                    <div className="booking-note-block">
                      <span>Admin Notes</span>
                      <p>{booking.adminNotes}</p>
                    </div>
                  ) : null}

                  <div className="booking-row-actions">
                    {booking.status === "APPROVED" || booking.status === "PENDING" ? (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => cancelBooking(booking.id)}
                        disabled={cancellingBooking === booking.id}
                      >
                        {cancellingBooking === booking.id ? "Cancelling..." : "Cancel Booking"}
                      </button>
                    ) : (
                      <span className="status-note">
                        {booking.status === "REJECTED" ? "Booking was rejected" :
                         booking.status === "CANCELLED" ? "Booking cancelled" : "No actions available"}
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </Shell>
  );
}
