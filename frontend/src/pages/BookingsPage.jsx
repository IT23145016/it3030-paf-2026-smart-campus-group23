import { useEffect, useState } from "react";
import Shell from "../components/Shell";
import { api } from "../services/api";

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

  return (
    <Shell title="My Bookings">
      <section className="table-card">
        <div className="table-header">
          <div>
            <p className="eyebrow">Your Bookings</p>
            <h3>View and manage your booking requests.</h3>
          </div>
          <button type="button" className="secondary-button toolbar-button" onClick={() => loadBookings(filters)}>
            Refresh
          </button>
        </div>

        <form className="filter-grid" onSubmit={applyFilters}>
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
          <div className="panel">Loading your bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="panel">You haven't requested any bookings yet. Visit the <a href="/resources">Facilities Catalogue</a> to request a booking.</div>
        ) : (
          <div className="booking-list">
            {bookings.map((booking) => (
              <article className="booking-card" key={booking.id}>
                <div className="booking-header">
                  <div>
                    <p className="eyebrow">Booking Request</p>
                    <h4>Resource: {booking.resourceId}</h4>
                  </div>
                  <span className={`status-pill ${booking.status?.toLowerCase() || "pending"}`}>
                    {booking.status || "PENDING"}
                  </span>
                </div>
                <div className="booking-details">
                  <div>
                    <strong>Purpose:</strong>
                    <span>{booking.purpose}</span>
                  </div>
                  <div>
                    <strong>Attendees:</strong>
                    <span>{booking.attendees}</span>
                  </div>
                  <div>
                    <strong>Start:</strong>
                    <span>{new Date(booking.startTime).toLocaleString()}</span>
                  </div>
                  <div>
                    <strong>End:</strong>
                    <span>{new Date(booking.endTime).toLocaleString()}</span>
                  </div>
                  {booking.adminNotes ? (
                    <div>
                      <strong>Admin Notes:</strong>
                      <span>{booking.adminNotes}</span>
                    </div>
                  ) : null}
                </div>
                <div className="booking-actions">
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
                      {booking.status === "PENDING" ? "Waiting for approval" :
                       booking.status === "REJECTED" ? "Booking rejected" :
                       booking.status === "CANCELLED" ? "Booking cancelled" : "No actions available"}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </Shell>
  );
}
