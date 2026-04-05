import { useEffect, useState } from "react";
import Shell from "../components/Shell";
import { api } from "../services/api";

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    setLoading(true);
    setError("");
    try {
      const data = await api.getUserBookings();
      setBookings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell title="My Bookings">
      <section className="table-card">
        <div className="table-header">
          <div>
            <p className="eyebrow">Your Bookings</p>
            <h3>View and manage your booking requests.</h3>
          </div>
          <button type="button" className="secondary-button toolbar-button" onClick={loadBookings}>
            Refresh
          </button>
        </div>

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
              </article>
            ))}
          </div>
        )}
      </section>
    </Shell>
  );
}
