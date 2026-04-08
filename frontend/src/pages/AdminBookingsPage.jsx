import { useEffect, useState } from "react";
import Shell from "../components/Shell";
import { api } from "../services/api";

const STATUS_ORDER = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

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
    }
    if (currentStatus === "APPROVED") {
      return [{ value: "CANCELLED", label: "Cancel" }];
    }
    return [];
  }

  const summary = STATUS_ORDER.reduce((counts, status) => {
    counts[status] = bookings.filter((booking) => booking.status === status).length;
    return counts;
  }, { PENDING: 0, APPROVED: 0, REJECTED: 0, CANCELLED: 0 });

  return (
    <Shell title="Booking Management">
      <section className="booking-page-shell">
        <section className="booking-overview-grid">
          <article className="booking-overview-card booking-overview-intro">
            <p className="eyebrow">Admin Booking Queue</p>
            <h3>Review requests quickly and move decisions forward.</h3>
            <p className="muted">Scan the queue, filter down the list, and update each booking without losing context.</p>
          </article>
          <article className="booking-overview-card">
            <span>Pending</span>
            <strong>{summary.PENDING}</strong>
          </article>
          <article className="booking-overview-card">
            <span>Approved</span>
            <strong>{summary.APPROVED}</strong>
          </article>
          <article className="booking-overview-card">
            <span>Closed</span>
            <strong>{summary.REJECTED + summary.CANCELLED}</strong>
          </article>
        </section>

        <section className="table-card booking-panel">
          <div className="booking-panel-top">
            <div>
              <p className="eyebrow">Admin Panel</p>
              <h3>Manage all booking requests.</h3>
            </div>
            <button type="button" className="secondary-button toolbar-button" onClick={() => loadBookings(filters)}>
              Refresh
            </button>
          </div>

          <form className="filter-grid booking-filter-grid admin-booking-filters" onSubmit={applyFilters}>
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
            <section className="booking-editor">
              <div className="booking-panel-top">
                <div>
                  <p className="eyebrow">Update Status</p>
                  <h3>{updatingBooking.resourceName || `Resource #${updatingBooking.resourceId}`}</h3>
                </div>
                <button type="button" className="secondary-button" onClick={closeStatusUpdate}>
                  Close
                </button>
              </div>

              <form className="filter-grid booking-filter-grid" onSubmit={submitStatusUpdate}>
                <label>
                  New Status
                  <select
                    name="status"
                    value={updateForm.status}
                    onChange={(e) => setUpdateForm((prev) => ({ ...prev, status: e.target.value }))}
                    required
                  >
                    <option value="">Select status</option>
                    {getStatusOptions(updatingBooking.status).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field-full">
                  Admin Notes
                  <textarea
                    name="adminNotes"
                    value={updateForm.adminNotes}
                    onChange={(e) => setUpdateForm((prev) => ({ ...prev, adminNotes: e.target.value }))}
                    placeholder="Explain the decision or add any scheduling note..."
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
            <div className="booking-empty-state">Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="booking-empty-state">
              <p>No bookings found for the selected filters.</p>
            </div>
          ) : (
            <div className="booking-results">
              {bookings.map((booking) => (
                <article className="booking-row admin-booking-row" key={booking.id}>
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
                      <span>Requester</span>
                      <strong>{booking.userId}</strong>
                    </div>
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
                      <span>Requested</span>
                      <strong>{new Date(booking.createdAt).toLocaleString()}</strong>
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
                    {getStatusOptions(booking.status).length > 0 ? (
                      <button type="button" onClick={() => openStatusUpdate(booking)}>
                        Update Status
                      </button>
                    ) : (
                      <span className="status-note">No further actions available</span>
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
