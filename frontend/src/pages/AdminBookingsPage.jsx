import { useEffect, useState } from "react";
import Shell from "../components/Shell";
import { api } from "../services/api";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    userId: "",
    resourceId: "",
    startDate: "",
    endDate: ""
  });
  const [updatingBooking, setUpdatingBooking] = useState(null);
  const [updateForm, setUpdateForm] = useState({ status: "", adminNotes: "" });

  useEffect(() => {
    loadBookings(filters);
  }, []);

  async function loadBookings(nextFilters = filters) {
    setLoading(true);
    setError("");
    try {
      const data = await api.getAllBookings(nextFilters);
      setBookings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getFilteredBookings() {
    return bookings;
  }

  function openStatusUpdate(booking) {
    setUpdatingBooking(booking);
    setUpdateForm({ status: "", adminNotes: "" });
  }

  function closeStatusUpdate() {
    setUpdatingBooking(null);
    setUpdateForm({ status: "", adminNotes: "" });
  }

  async function submitStatusUpdate(event) {
    event.preventDefault();
    if (!updatingBooking) return;

    try {
      await api.updateBookingStatus(updatingBooking.id, updateForm);
      await loadBookings(filters);
      closeStatusUpdate();
    } catch (err) {
      setError(err.message);
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

  function getStatusOptions(currentStatus) {
    if (currentStatus === "PENDING") {
      return [
        { value: "APPROVED", label: "Approve" },
        { value: "REJECTED", label: "Reject" }
      ];
    } else if (currentStatus === "APPROVED") {
      return [
        { value: "CANCELLED", label: "Cancel" }
      ];
    }
    return [];
  }

  return (
    <Shell title="Booking Management">
      <section className="table-card">
        <div className="table-header">
          <div>
            <p className="eyebrow">Admin Panel</p>
            <h3>Manage all booking requests.</h3>
          </div>
          <button type="button" className="secondary-button toolbar-button" onClick={() => loadBookings(filters)}>
            Refresh
          </button>
        </div>

        <form className="filter-grid" onSubmit={applyFilters}>
          <label>
            Status
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="all">All bookings</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <label>
            User ID
            <input name="userId" value={filters.userId} onChange={handleFilterChange} placeholder="Filter by requester" />
          </label>
          <label>
            Resource ID
            <input name="resourceId" value={filters.resourceId} onChange={handleFilterChange} placeholder="Filter by resource" />
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
                const cleared = { status: "all", userId: "", resourceId: "", startDate: "", endDate: "" };
                setFilters(cleared);
                loadBookings(cleared);
              }}
            >
              Clear
            </button>
          </div>
        </form>

        {error ? <p className="error">{error}</p> : null}

        {updatingBooking ? (
          <section className="table-card">
            <div className="table-header">
              <div>
                <p className="eyebrow">Update Status</p>
                <h3>Booking for Resource: {updatingBooking.resourceId}</h3>
              </div>
              <button type="button" className="secondary-button" onClick={closeStatusUpdate}>
                Close
              </button>
            </div>

            <form className="filter-grid" onSubmit={submitStatusUpdate}>
              <label>
                New Status
                <select
                  name="status"
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, status: e.target.value }))}
                  required
                >
                  <option value="">Select status</option>
                  {getStatusOptions(updatingBooking.status).map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-full">
                Admin Notes (optional)
                <textarea
                  name="adminNotes"
                  value={updateForm.adminNotes}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                  placeholder="Add notes for the user..."
                />
              </label>
              <div className="filter-actions">
                <button type="submit">Update Status</button>
                <button type="button" className="secondary-button" onClick={closeStatusUpdate}>
                  Cancel
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {loading ? (
          <div className="panel">Loading bookings...</div>
        ) : getFilteredBookings().length === 0 ? (
          <div className="panel">No bookings found for the selected filter.</div>
        ) : (
          <div className="booking-list">
            {getFilteredBookings().map((booking) => (
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
                  <div>
                    <strong>Requested:</strong>
                    <span>{new Date(booking.createdAt).toLocaleString()}</span>
                  </div>
                  {booking.adminNotes ? (
                    <div>
                      <strong>Admin Notes:</strong>
                      <span>{booking.adminNotes}</span>
                    </div>
                  ) : null}
                </div>
                <div className="booking-actions">
                  {getStatusOptions(booking.status).length > 0 ? (
                    <button type="button" onClick={() => openStatusUpdate(booking)}>
                      Update Status
                    </button>
                  ) : (
                    <span className="status-note">No actions available</span>
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
