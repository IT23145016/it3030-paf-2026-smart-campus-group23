import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Shell from "../components/Shell";
import { api } from "../services/api";

export default function BookingCheckInPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Missing check-in token.");
      setLoading(false);
      return;
    }

    loadVerification();
  }, [token]);

  async function loadVerification() {
    setLoading(true);
    setError("");
    try {
      const data = await api.verifyBookingCheckIn(token);
      setBooking(data);
    } catch (err) {
      setBooking(null);
      setError(err.message || "Unable to verify this booking.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmCheckIn() {
    setConfirming(true);
    setError("");
    try {
      const data = await api.confirmBookingCheckIn(token);
      setBooking(data);
    } catch (err) {
      setError(err.message || "Unable to confirm check-in.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <Shell title="Booking Check-In">
      <section className="booking-page-shell">
        <section className="booking-overview-grid checkin-overview-grid">
          <article className="booking-overview-card booking-overview-intro">
            <p className="eyebrow">QR Verification</p>
            <h3>Validate approved bookings before facility access is granted.</h3>
            <p className="muted">Use this screen after scanning a booking QR code from the request owner.</p>
          </article>
          <article className="booking-overview-card">
            <span>Status</span>
            <strong>{booking?.status || (error ? "Invalid" : "Waiting")}</strong>
          </article>
          <article className="booking-overview-card">
            <span>Check-In</span>
            <strong>{booking?.checkedInAt ? "Complete" : "Pending"}</strong>
          </article>
        </section>

        <section className="table-card booking-panel">
          {loading ? (
            <div className="booking-empty-state">Verifying booking token...</div>
          ) : error ? (
            <div className="booking-empty-state">
              <p>{error}</p>
            </div>
          ) : booking ? (
            <article className="booking-row">
              <div className="booking-row-main">
                <div className="booking-row-title">
                  <div>
                    <p className="eyebrow">Approved Booking</p>
                    <h4>{booking.resourceName || `Resource #${booking.resourceId}`}</h4>
                  </div>
                  <span className={`status-pill ${booking.status?.toLowerCase() || "approved"}`}>
                    {booking.status}
                  </span>
                </div>
                <p className="booking-purpose">{booking.purpose}</p>
              </div>

              <div className="booking-meta-grid admin-booking-meta-grid">
                <div className="booking-meta-item">
                  <span>Reference</span>
                  <strong>{booking.id}</strong>
                </div>
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
                  <span>Token</span>
                  <strong>{booking.checkInToken}</strong>
                </div>
              </div>

              {booking.checkedInAt ? (
                <div className="booking-note-block">
                  <span>Check-In Recorded</span>
                  <p>
                    Confirmed on {new Date(booking.checkedInAt).toLocaleString()}
                    {booking.checkedInBy ? ` by ${booking.checkedInBy}.` : "."}
                  </p>
                </div>
              ) : (
                <div className="booking-note-block">
                  <span>Ready for confirmation</span>
                  <p>This booking is approved and has not been checked in yet.</p>
                </div>
              )}

              <div className="booking-row-actions">
                <button type="button" onClick={confirmCheckIn} disabled={confirming || Boolean(booking.checkedInAt)}>
                  {booking.checkedInAt ? "Already checked in" : confirming ? "Confirming..." : "Confirm check-in"}
                </button>
                <Link className="booking-return-link" to="/admin/bookings">
                  <strong>Back to booking management</strong>
                </Link>
              </div>
            </article>
          ) : null}
        </section>
      </section>
    </Shell>
  );
}
