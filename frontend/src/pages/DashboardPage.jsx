import { useEffect, useState } from "react";
import NotificationPanel from "../components/NotificationPanel";
import Shell from "../components/Shell";
import { api } from "../services/api";

export default function DashboardPage() {
  const [resources, setResources] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const [resourceData, userData] = await Promise.all([api.getResources(), api.getUsers()]);
        setResources(resourceData);
        setUsers(userData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const activeResources = resources.filter((resource) => resource.status === "ACTIVE").length;
  const maintenanceResources = resources.filter((resource) => resource.status === "MAINTENANCE").length;
  const outOfServiceResources = resources.filter((resource) => resource.status === "OUT_OF_SERVICE").length;
  const totalResources = resources.length;

  const adminCount = users.filter((user) => user.roles.includes("ADMIN")).length;
  const technicianCount = users.filter((user) => user.roles.includes("TECHNICIAN")).length;
  const standardUserCount = users.filter((user) => user.roles.includes("USER")).length;

  const activeDegrees = totalResources ? (activeResources / totalResources) * 360 : 0;
  const maintenanceDegrees = totalResources ? (maintenanceResources / totalResources) * 360 : 0;
  const outOfServiceDegrees = totalResources ? (outOfServiceResources / totalResources) * 360 : 0;
  const resourceChartStyle = {
    background: `conic-gradient(
      #2f8f5b 0deg ${activeDegrees}deg,
      #d3a341 ${activeDegrees}deg ${activeDegrees + maintenanceDegrees}deg,
      #bf5a52 ${activeDegrees + maintenanceDegrees}deg ${activeDegrees + maintenanceDegrees + outOfServiceDegrees}deg,
      rgba(16, 33, 29, 0.08) ${activeDegrees + maintenanceDegrees + outOfServiceDegrees}deg 360deg
    )`
  };

  return (
    <Shell title="Operations Dashboard">
      <section className="dashboard-hero">
        <div className="hero-card accent-card">
          <p className="eyebrow">Administration Centre</p>
          <h2>See the platform status at a glance.</h2>
          <p>Track resource availability, maintenance activity, and user role distribution from one admin view.</p>
        </div>
      </section>

      {error ? <p className="error">{error}</p> : null}
      {loading ? <p className="muted">Loading dashboard data...</p> : null}

      {!loading ? (
        <>
          <section className="dashboard-resource-layout">
            <article className="hero-card resource-chart-card">
              <div>
                <p className="eyebrow">Resource Status</p>
                <h3>Facilities overview</h3>
              </div>
              <div className="resource-chart-wrap">
                <div className="resource-chart" style={resourceChartStyle}>
                  <div className="resource-chart-center">
                    <strong>{totalResources}</strong>
                    <span>Total</span>
                  </div>
                </div>
                <div className="resource-chart-legend">
                  <div className="resource-chart-legend-item">
                    <span className="resource-chart-dot active" />
                    <span>Available</span>
                    <strong>{activeResources}</strong>
                  </div>
                  <div className="resource-chart-legend-item">
                    <span className="resource-chart-dot maintenance" />
                    <span>Maintenance</span>
                    <strong>{maintenanceResources}</strong>
                  </div>
                  <div className="resource-chart-legend-item">
                    <span className="resource-chart-dot out-of-service" />
                    <span>Out of service</span>
                    <strong>{outOfServiceResources}</strong>
                  </div>
                </div>
              </div>
            </article>

            <section className="dashboard-kpi-grid">
              <article className="metric-card">
                <span>Total resources</span>
                <strong>{totalResources}</strong>
                <small>All rooms, labs, meeting spaces, and equipment currently in the catalogue.</small>
              </article>
              <article className="metric-card">
                <span>Available now</span>
                <strong>{activeResources}</strong>
                <small>Resources currently marked active and ready for staff or student use.</small>
              </article>
              <article className="metric-card">
                <span>In maintenance</span>
                <strong>{maintenanceResources}</strong>
                <small>Resources under maintenance that may need updates before new bookings.</small>
              </article>
              <article className="metric-card">
                <span>Out of service</span>
                <strong>{outOfServiceResources}</strong>
                <small>Resources unavailable for use until operations staff restore them.</small>
              </article>
            </section>
          </section>

          <section className="insight-grid">
            <article className="info-card">
              <p className="eyebrow">Role Summary</p>
              <h3>Current access distribution across the platform.</h3>
              <div className="dashboard-role-list">
                <div className="dashboard-role-row">
                  <span>Administrators</span>
                  <strong>{adminCount}</strong>
                </div>
                <div className="dashboard-role-row">
                  <span>Technicians</span>
                  <strong>{technicianCount}</strong>
                </div>
                <div className="dashboard-role-row">
                  <span>Standard users</span>
                  <strong>{standardUserCount}</strong>
                </div>
                <div className="dashboard-role-row">
                  <span>Total user accounts</span>
                  <strong>{users.length}</strong>
                </div>
              </div>
            </article>

            <article className="info-card">
              <p className="eyebrow">Operations Summary</p>
              <h3>What an admin can confirm quickly.</h3>
              <div className="dashboard-checklist">
                <span>Resource availability is visible in real time through the catalogue.</span>
                <span>Maintenance and outage counts are separated for faster decisions.</span>
                <span>Role totals show who can manage, support, and use the system.</span>
                <span>Admin pages remain protected from non-admin users.</span>
              </div>
            </article>
          </section>

          <NotificationPanel />
        </>
      ) : null}
    </Shell>
  );
}
