import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Shell from "../components/Shell";
import { api } from "../services/api";

export default function DashboardPage() {
  const [resources, setResources] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        const [resourceData, userData, bookingData, ticketData] = await Promise.all([
          api.getResources(),
          api.getUsers(),
          api.getAllBookings(),
          api.getTickets()
        ]);
        setResources(resourceData);
        setUsers(userData);
        setBookings(bookingData);
        setTickets(ticketData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const activeResources = resources.filter((r) => r.status === "ACTIVE").length;
  const maintenanceResources = resources.filter((r) => r.status === "MAINTENANCE").length;
  const outOfServiceResources = resources.filter((r) => r.status === "OUT_OF_SERVICE").length;
  const totalResources = resources.length;

  const pendingBookings = bookings.filter((b) => b.status === "PENDING").length;
  const approvedBookings = bookings.filter((b) => b.status === "APPROVED").length;
  const totalBookings = bookings.length;

  const openTickets = tickets.filter((t) => t.status === "OPEN").length;
  const inProgressTickets = tickets.filter((t) => t.status === "IN_PROGRESS").length;
  const resolvedTickets = tickets.filter((t) => t.status === "RESOLVED").length;
  const totalTickets = tickets.length;

  const adminCount = users.filter((u) => u.roles.includes("ADMIN")).length;
  const technicianCount = users.filter((u) => u.roles.includes("TECHNICIAN")).length;
  const activeUsers = users.filter((u) => u.active).length;

  const activeDegrees = totalResources ? (activeResources / totalResources) * 360 : 0;
  const maintenanceDegrees = totalResources ? (maintenanceResources / totalResources) * 360 : 0;
  const outOfServiceDegrees = totalResources ? (outOfServiceResources / totalResources) * 360 : 0;

  return (
    <Shell title="Operations Dashboard">

      <section className="hero-card accent-card" style={{ padding: "1.8rem" }}>
        <p className="eyebrow">Administration Centre</p>
        <h2 style={{ marginBottom: "0.5rem" }}>Good to have you back, Admin.</h2>
        <p style={{ color: "var(--muted)", marginBottom: "1.2rem" }}>Here's a live snapshot of your campus operations.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          <Link className="solid-link" to="/admin/bookings" style={{ padding: "0.7rem 1.1rem", borderRadius: "12px", fontSize: "0.9rem" }}>Manage Bookings</Link>
          <Link className="ghost-link" to="/tickets/manage" style={{ padding: "0.7rem 1.1rem", borderRadius: "12px", fontSize: "0.9rem" }}>Manage Tickets</Link>
          <Link className="ghost-link" to="/admin/resources" style={{ padding: "0.7rem 1.1rem", borderRadius: "12px", fontSize: "0.9rem" }}>Manage Resources</Link>
          <Link className="ghost-link" to="/admin/roles" style={{ padding: "0.7rem 1.1rem", borderRadius: "12px", fontSize: "0.9rem" }}>Role Management</Link>
        </div>
      </section>

      {error ? <p className="error">{error}</p> : null}
      {loading ? <p className="muted">Loading dashboard data...</p> : null}

      {!loading ? (
        <>
          {/* KPI Row */}
          <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: "1rem" }}>
            <KpiCard label="Total Resources" value={totalResources} sub={`${activeResources} active`} accent />
            <KpiCard label="Pending Bookings" value={pendingBookings} sub={`${totalBookings} total bookings`} alert={pendingBookings > 0} />
            <KpiCard label="Open Tickets" value={openTickets} sub={`${inProgressTickets} in progress`} alert={openTickets > 0} />
            <KpiCard label="Active Users" value={activeUsers} sub={`${users.length} total accounts`} />
          </section>

          {/* Resource Chart - Hero Section */}
          <section className="hero-card" style={{ padding: "2rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
              <div>
                <p className="eyebrow" style={{ textAlign: "center" }}>Resource Status</p>
                <h3 style={{ textAlign: "center", marginBottom: 0 }}>Facilities Overview</h3>
              </div>
              <PieChart
                active={activeResources}
                maintenance={maintenanceResources}
                outOfService={outOfServiceResources}
                total={totalResources}
              />
            </div>

            <div style={{ display: "grid", gap: "1rem" }}>
              <h4 style={{ margin: "0 0 0.5rem", color: "#173f61" }}>Breakdown</h4>
              {[
                { label: "Available", value: activeResources, color: "#4f8fbe", pct: totalResources ? Math.round((activeResources / totalResources) * 100) : 0 },
                { label: "Maintenance", value: maintenanceResources, color: "#e8a838", pct: totalResources ? Math.round((maintenanceResources / totalResources) * 100) : 0 },
                { label: "Out of Service", value: outOfServiceResources, color: "#d95f4b", pct: totalResources ? Math.round((outOfServiceResources / totalResources) * 100) : 0 },
              ].map((item) => (
                <div key={item.label} style={{ display: "grid", gap: "0.4rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: item.color, display: "inline-block", flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, color: "#244866" }}>{item.label}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: "#173f61" }}>{item.value} <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: "0.85rem" }}>({item.pct}%)</span></span>
                  </div>
                  <div style={{ height: "8px", borderRadius: "999px", background: "rgba(53,102,141,0.1)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${item.pct}%`, background: item.color, borderRadius: "999px", transition: "width 0.6s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Bookings + Tickets */}
          <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <article className="info-card" style={{ padding: "1.3rem" }}>
              <p className="eyebrow">Bookings</p>
              <h3 style={{ marginBottom: "1rem" }}>Booking request status</h3>
              <div className="dashboard-role-list">
                <div className="dashboard-role-row"><span>Pending approval</span><strong style={{ color: pendingBookings > 0 ? "#1f567f" : "inherit" }}>{pendingBookings}</strong></div>
                <div className="dashboard-role-row"><span>Approved</span><strong>{approvedBookings}</strong></div>
                <div className="dashboard-role-row"><span>Total bookings</span><strong>{totalBookings}</strong></div>
              </div>
              <Link to="/admin/bookings" style={{ display: "inline-block", marginTop: "1rem", color: "#214c71", fontWeight: 700, fontSize: "0.9rem" }}>View all bookings →</Link>
            </article>
            <article className="info-card" style={{ padding: "1.3rem" }}>
              <p className="eyebrow">Tickets</p>
              <h3 style={{ marginBottom: "1rem" }}>Incident ticket status</h3>
              <div className="dashboard-role-list">
                <div className="dashboard-role-row"><span>Open</span><strong style={{ color: openTickets > 0 ? "#1f567f" : "inherit" }}>{openTickets}</strong></div>
                <div className="dashboard-role-row"><span>In progress</span><strong>{inProgressTickets}</strong></div>
                <div className="dashboard-role-row"><span>Resolved</span><strong>{resolvedTickets}</strong></div>
                <div className="dashboard-role-row"><span>Total tickets</span><strong>{totalTickets}</strong></div>
              </div>
              <Link to="/tickets/manage" style={{ display: "inline-block", marginTop: "1rem", color: "#214c71", fontWeight: 700, fontSize: "0.9rem" }}>View all tickets →</Link>
            </article>
          </section>

          {/* Users + Quick Actions */}
          {/* Users + Quick Actions */}
          <section className="insight-grid">
            <article className="info-card" style={{ padding: "1.3rem" }}>
              <p className="eyebrow">User Accounts</p>
              <h3>Access distribution across the platform</h3>
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
                  <span>Active accounts</span>
                  <strong>{activeUsers}</strong>
                </div>
                <div className="dashboard-role-row">
                  <span>Total accounts</span>
                  <strong>{users.length}</strong>
                </div>
              </div>
              <Link to="/admin/roles" style={{ display: "inline-block", marginTop: "1rem", color: "#214c71", fontWeight: 700, fontSize: "0.9rem" }}>
                Manage roles →
              </Link>
            </article>

            <article className="info-card" style={{ padding: "1.3rem" }}>
              <p className="eyebrow">Quick Actions</p>
              <h3>Common admin tasks</h3>
              <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
                <Link to="/admin/bookings" className="dashboard-role-row" style={{ textDecoration: "none", color: "inherit" }}>
                  <span>Review pending bookings</span>
                  <strong style={{ color: "#214c71" }}>{pendingBookings} pending →</strong>
                </Link>
                <Link to="/tickets/manage" className="dashboard-role-row" style={{ textDecoration: "none", color: "inherit" }}>
                  <span>Handle open tickets</span>
                  <strong style={{ color: "#214c71" }}>{openTickets} open →</strong>
                </Link>
                <Link to="/admin/resources" className="dashboard-role-row" style={{ textDecoration: "none", color: "inherit" }}>
                  <span>Update resource status</span>
                  <strong style={{ color: "#214c71" }}>Manage →</strong>
                </Link>
                <Link to="/notifications" className="dashboard-role-row" style={{ textDecoration: "none", color: "inherit" }}>
                  <span>Check notifications</span>
                  <strong style={{ color: "#214c71" }}>View →</strong>
                </Link>
              </div>
            </article>
          </section>
        </>
      ) : null}
    </Shell>
  );
}

function PieChart({ active, maintenance, outOfService, total }) {
  const [selected, setSelected] = useState(null);

  const segments = [
    { key: "active", label: "Available", value: active, color: "#4f8fbe" },
    { key: "maintenance", label: "Maintenance", value: maintenance, color: "#e8a838" },
    { key: "outOfService", label: "Out of Service", value: outOfService, color: "#d95f4b" },
  ];

  const activeDeg = total ? (active / total) * 360 : 0;
  const maintDeg = total ? (maintenance / total) * 360 : 0;
  const outDeg = total ? (outOfService / total) * 360 : 0;

  const chartBg = `conic-gradient(
    #4f8fbe 0deg ${activeDeg}deg,
    #e8a838 ${activeDeg}deg ${activeDeg + maintDeg}deg,
    #d95f4b ${activeDeg + maintDeg}deg ${activeDeg + maintDeg + outDeg}deg,
    rgba(16,33,29,0.08) ${activeDeg + maintDeg + outDeg}deg 360deg
  )`;

  const sel = selected ? segments.find((s) => s.key === selected) : null;
  const selPct = sel && total ? Math.round((sel.value / total) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.2rem" }}>
      <div
        onClick={() => setSelected(null)}
        style={{
          width: "260px", height: "260px", borderRadius: "50%",
          background: chartBg,
          display: "grid", placeItems: "center", cursor: "pointer",
          boxShadow: selected
            ? `0 24px 60px rgba(33,76,113,0.22), 0 0 0 10px ${sel.color}33`
            : "0 20px 50px rgba(33,76,113,0.18), 0 0 0 8px rgba(214,231,246,0.4)",
          transform: selected ? "scale(1.06)" : "scale(1)",
          transition: "transform 0.3s ease, box-shadow 0.3s ease"
        }}
      >
        <div style={{
          width: "148px", height: "148px", borderRadius: "50%",
          background: "rgba(248,252,255,0.98)",
          border: `3px solid ${sel ? sel.color : "rgba(53,102,141,0.1)"}`,
          display: "grid", placeItems: "center", textAlign: "center",
          transition: "border-color 0.3s ease",
          pointerEvents: "none"
        }}>
          {sel ? (
            <div>
              <strong style={{ display: "block", fontSize: "2rem", lineHeight: 1, color: sel.color }}>{selPct}%</strong>
              <span style={{ color: sel.color, fontSize: "0.82rem", fontWeight: 700 }}>{sel.label}</span>
              <span style={{ display: "block", color: "var(--muted)", fontSize: "0.78rem" }}>{sel.value} resources</span>
            </div>
          ) : (
            <div>
              <strong style={{ display: "block", fontSize: "2.4rem", lineHeight: 1, color: "#173f61" }}>{total}</strong>
              <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Total</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center" }}>
        {segments.map((seg) => (
          <button
            key={seg.key}
            onClick={() => setSelected(selected === seg.key ? null : seg.key)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.45rem",
              padding: "0.45rem 0.9rem", borderRadius: "999px",
              background: selected === seg.key ? seg.color : "rgba(255,255,255,0.9)",
              color: selected === seg.key ? "#fff" : "#244866",
              border: `2px solid ${seg.color}`,
              fontWeight: 700, fontSize: "0.82rem", cursor: "pointer",
              boxShadow: selected === seg.key ? `0 6px 18px ${seg.color}55` : "none",
              transform: selected === seg.key ? "translateY(-2px)" : "none",
              transition: "all 0.2s ease"
            }}
          >
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: selected === seg.key ? "#fff" : seg.color, display: "inline-block" }} />
            {seg.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, accent, alert }) {
  return (
    <article className="metric-card" style={{
      padding: "1.3rem",
      background: accent
        ? "linear-gradient(145deg, rgba(33,76,113,0.96), rgba(88,132,175,0.94))"
        : alert
          ? "linear-gradient(145deg, rgba(188,219,241,0.6), rgba(214,231,246,0.8))"
          : undefined,
      color: accent ? "#f7fbff" : undefined,
      border: alert && !accent ? "1px solid rgba(79,143,190,0.3)" : undefined
    }}>
      <span style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, opacity: accent ? 0.8 : 1 }}>{label}</span>
      <strong style={{ display: "block", fontSize: "2.4rem", lineHeight: 1, margin: "0.4rem 0", color: accent ? "#f7fbff" : alert ? "#1f567f" : undefined }}>{value}</strong>
      <small style={{ color: accent ? "rgba(247,251,255,0.75)" : "var(--muted)" }}>{sub}</small>
    </article>
  );
}
