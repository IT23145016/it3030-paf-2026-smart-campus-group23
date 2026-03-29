import Shell from "../components/Shell";

export default function DashboardPage() {
  return (
    <Shell title="Operations Dashboard">
      <section className="dashboard-hero">
        <div className="hero-card accent-card">
          <p className="eyebrow">Mission Control</p>
          <h2>Keep bookings, incidents, and role changes moving with confidence.</h2>
          <p>
            This dashboard is designed as the communication layer for the wider campus platform, surfacing the
            updates that matter before they turn into missed approvals or unresolved faults.
          </p>
        </div>

        <div className="metric-grid">
          <article className="metric-card">
            <span>Catalogue coverage</span>
            <strong>Spaces mapped</strong>
            <small>Facilities metadata is ready for searching and future booking rules.</small>
          </article>
          <article className="metric-card">
            <span>Approval workflow</span>
            <strong>Pending to clear</strong>
            <small>Booking outcomes can feed this alert stream immediately.</small>
          </article>
          <article className="metric-card">
            <span>Incident handling</span>
            <strong>Technician ready</strong>
            <small>Status changes and comments are built to notify affected users.</small>
          </article>
        </div>
      </section>

      <section className="insight-grid">
        <article className="info-card">
          <p className="eyebrow">Facilities foundation</p>
          <h3>Resources are now first-class data, not static text.</h3>
          <p>
            Lecture halls, labs, meeting rooms, and equipment can be stored in MongoDB with searchable
            metadata, availability windows, and status for booking readiness.
          </p>
        </article>
        <article className="info-card">
          <p className="eyebrow">What this module owns</p>
          <h3>Notifications that feel immediate, not buried.</h3>
          <p>
            Booking approval events, ticket workflow changes, and staff comments can all feed the same inbox so
            users do not need to chase updates across separate screens.
          </p>
        </article>
      </section>
    </Shell>
  );
}
