import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Shell from "../components/Shell";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

const STATUS_COLORS = {
  OPEN:        { bg: "rgba(232,168,56,0.12)",  color: "#b87a00" },
  IN_PROGRESS: { bg: "rgba(79,143,190,0.12)",  color: "#1f567f" },
  RESOLVED:    { bg: "rgba(46,139,87,0.12)",   color: "#1e6b42" },
  CLOSED:      { bg: "rgba(93,111,125,0.12)",  color: "#3d5166" },
  REJECTED:    { bg: "rgba(217,95,75,0.12)",   color: "#b03a2a" },
};

const PRIORITY_COLORS = {
  LOW:      { bg: "rgba(93,111,125,0.1)",  color: "#3d5166" },
  MEDIUM:   { bg: "rgba(232,168,56,0.12)", color: "#b87a00" },
  HIGH:     { bg: "rgba(217,95,75,0.12)",  color: "#b03a2a" },
  CRITICAL: { bg: "rgba(139,0,0,0.1)",     color: "#8b0000" },
};

export default function TicketOperationsPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ status: "all", priority: "all", location: "" });
  const [commentDrafts, setCommentDrafts] = useState({});
  const [statusForms, setStatusForms] = useState({});
  const [assigningId, setAssigningId] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const ticketRefs = useRef({});
  const highlightedTicketId = searchParams.get("ticketId");

  useEffect(() => { loadData(filters); }, []);

  useEffect(() => {
    if (!highlightedTicketId) return;
    const el = ticketRefs.current[highlightedTicketId];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [highlightedTicketId, tickets]);

  async function loadData(nextFilters = filters) {
    try {
      const ticketData = await api.getTickets(nextFilters);
      setTickets(ticketData);
      if (user?.roles?.includes("ADMIN")) {
        const userData = await api.getUsers();
        setTechnicians(userData.filter((u) => u.roles.includes("TECHNICIAN") && u.active));
      }
      setError("");
    } catch (err) { setError(err.message); }
  }

  function handleFilterChange(e) {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleStatusForm(ticketId, field, value) {
    setStatusForms((cur) => ({
      ...cur,
      [ticketId]: {
        status: cur[ticketId]?.status || "IN_PROGRESS",
        resolutionNote: cur[ticketId]?.resolutionNote || "",
        rejectionReason: cur[ticketId]?.rejectionReason || "",
        [field]: value
      }
    }));
  }

  async function updateStatus(ticket) {
    const payload = statusForms[ticket.id] || { status: ticket.status, resolutionNote: "", rejectionReason: "" };
    try {
      setUpdatingId(ticket.id);
      await api.updateTicketStatus(ticket.id, payload);
      await loadData(filters);
    } catch (err) { setError(err.message); }
    finally { setUpdatingId(""); }
  }

  async function assignTechnician(ticketId, technicianId) {
    if (!technicianId) return;
    try {
      setAssigningId(ticketId);
      await api.assignTicket(ticketId, technicianId);
      await loadData(filters);
    } catch (err) { setError(err.message); }
    finally { setAssigningId(""); }
  }

  async function submitComment(ticketId) {
    const message = commentDrafts[ticketId]?.trim();
    if (!message) { setError("Enter a comment before posting."); return; }
    try {
      await api.addTicketUpdate(ticketId, message);
      setCommentDrafts((cur) => ({ ...cur, [ticketId]: "" }));
      await loadData(filters);
    } catch (err) { setError(err.message); }
  }

  return (
    <Shell title="Ticket Operations">

      {/* Filters */}
      <section className="table-card" style={{ padding: "1.2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <h3 style={{ margin: 0 }}>Filter Ticket Queue</h3>
          <button type="button" className="secondary-button" onClick={() => loadData(filters)}
            style={{ width: "36px", height: "36px", padding: 0, borderRadius: "999px", display: "grid", placeItems: "center" }} aria-label="Refresh">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
            </svg>
          </button>
        </div>
        <form style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "0.85rem", alignItems: "end" }}
          onSubmit={(e) => { e.preventDefault(); loadData(filters); }} noValidate>
          <label>Status
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="all">All</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </label>
          <label>Priority
            <select name="priority" value={filters.priority} onChange={handleFilterChange}>
              <option value="all">All</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </label>
          <label>Location<input name="location" value={filters.location} onChange={handleFilterChange} placeholder="Building or room" /></label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="submit">Apply</button>
            <button type="button" className="secondary-button" onClick={() => { const c = { status: "all", priority: "all", location: "" }; setFilters(c); loadData(c); }}>Clear</button>
          </div>
        </form>
      </section>

      {error ? <p className="error">{error}</p> : null}
      {tickets.length === 0 ? <p className="muted" style={{ textAlign: "center", padding: "2rem" }}>No tickets found.</p> : null}

      {/* Ticket Cards */}
      <section style={{ display: "grid", gap: "1rem" }}>
        {tickets.map((ticket) => {
          const form = statusForms[ticket.id] || { status: ticket.status, resolutionNote: "", rejectionReason: "" };
          const statusCfg = STATUS_COLORS[ticket.status] || STATUS_COLORS.OPEN;
          const priorityCfg = PRIORITY_COLORS[ticket.priority] || PRIORITY_COLORS.LOW;

          return (
            <article key={ticket.id}
              ref={(el) => { ticketRefs.current[ticket.id] = el; }}
              style={{
                background: "var(--card)", borderRadius: "18px", padding: "1.3rem",
                border: highlightedTicketId === ticket.id ? "2px solid #4f8fbe" : "1px solid var(--outline)",
                boxShadow: "0 8px 24px rgba(16,33,29,0.07)"
              }}>

              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                <div>
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "999px", background: statusCfg.bg, color: statusCfg.color }}>{ticket.status}</span>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "999px", background: priorityCfg.bg, color: priorityCfg.color }}>{ticket.priority}</span>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "999px", background: "rgba(79,143,190,0.1)", color: "#214c71" }}>{ticket.category}</span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: "1rem", color: "#173f61" }}>{ticket.title}</h3>
                </div>
                {ticket.assignedToName ? (
                  <span style={{ fontSize: "0.78rem", padding: "0.3rem 0.75rem", borderRadius: "999px", background: "rgba(46,139,87,0.1)", color: "#1e6b42", fontWeight: 700, whiteSpace: "nowrap" }}>
                    👷 {ticket.assignedToName}
                  </span>
                ) : (
                  <span style={{ fontSize: "0.78rem", padding: "0.3rem 0.75rem", borderRadius: "999px", background: "rgba(232,168,56,0.1)", color: "#b87a00", fontWeight: 700 }}>
                    Unassigned
                  </span>
                )}
              </div>

              <p style={{ margin: "0 0 0.85rem", color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.6 }}>{ticket.description}</p>

              {/* Meta */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "0.5rem", marginBottom: "1rem" }}>
                {[
                  { label: "Resource", value: ticket.resourceName },
                  { label: "Reporter", value: ticket.createdByName },
                  { label: "Contact", value: ticket.preferredContactDetails },
                ].map((m) => (
                  <div key={m.label} style={{ padding: "0.6rem 0.75rem", borderRadius: "10px", background: "rgba(224,238,249,0.6)", border: "1px solid rgba(53,102,141,0.08)" }}>
                    <span style={{ display: "block", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.07em", color: "#61706a", fontWeight: 700 }}>{m.label}</span>
                    <strong style={{ fontSize: "0.85rem", color: "#173f61" }}>{m.value || "—"}</strong>
                  </div>
                ))}
              </div>

              {/* Assign Technician */}
              {user?.roles?.includes("ADMIN") ? (
                <div style={{ marginBottom: "1rem", padding: "1rem", borderRadius: "14px", background: "rgba(214,231,246,0.4)", border: "1px solid rgba(79,143,190,0.14)" }}>
                  <p style={{ margin: "0 0 0.6rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#214c71" }}>👷 Assign Technician</p>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                    <select
                      value={ticket.assignedToUserId || ""}
                      onChange={(e) => assignTechnician(ticket.id, e.target.value)}
                      disabled={assigningId === ticket.id}
                      style={{ flex: 1, minWidth: "200px" }}
                    >
                      <option value="">— Select a technician —</option>
                      {technicians.map((t) => (
                        <option key={t.id} value={t.id}>{t.fullName} ({t.email})</option>
                      ))}
                    </select>
                    {assigningId === ticket.id ? <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>Assigning…</span> : null}
                    {ticket.assignedToName ? <span style={{ fontSize: "0.82rem", color: "#1e6b42", fontWeight: 600 }}>✓ Currently: {ticket.assignedToName}</span> : null}
                  </div>
                  {technicians.length === 0 ? <p style={{ margin: "0.5rem 0 0", fontSize: "0.82rem", color: "var(--muted)" }}>No active technicians available.</p> : null}
                </div>
              ) : null}

              {/* Status Update */}
              <div style={{ padding: "1rem", borderRadius: "14px", background: "rgba(224,238,249,0.4)", border: "1px solid rgba(79,143,190,0.14)", marginBottom: "1rem" }}>
                <p style={{ margin: "0 0 0.6rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#214c71" }}>🔄 Update Status</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <label style={{ margin: 0 }}>Next Status
                    <select value={form.status} onChange={(e) => handleStatusForm(ticket.id, "status", e.target.value)}>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                      {user?.roles?.includes("ADMIN") ? <option value="REJECTED">Rejected</option> : null}
                    </select>
                  </label>
                  <label style={{ margin: 0 }}>Resolution Note
                    <input value={form.resolutionNote} onChange={(e) => handleStatusForm(ticket.id, "resolutionNote", e.target.value)} placeholder="Optional note..." />
                  </label>
                  {user?.roles?.includes("ADMIN") && form.status === "REJECTED" ? (
                    <label style={{ margin: 0, gridColumn: "1 / -1" }}>Rejection Reason
                      <input value={form.rejectionReason} onChange={(e) => handleStatusForm(ticket.id, "rejectionReason", e.target.value)} placeholder="Required for rejection..." />
                    </label>
                  ) : null}
                </div>
                <button type="button" onClick={() => updateStatus(ticket)} disabled={updatingId === ticket.id}
                  style={{ marginTop: "0.75rem", borderRadius: "10px", padding: "0.5rem 1.2rem", fontSize: "0.85rem" }}>
                  {updatingId === ticket.id ? "Saving…" : "Save Status"}
                </button>
              </div>

              {ticket.rejectionReason ? <p style={{ margin: "0 0 0.75rem", color: "#b03a2a", fontSize: "0.85rem", fontWeight: 600 }}>❌ Rejection reason: {ticket.rejectionReason}</p> : null}
              {ticket.resolutionNotes ? <p style={{ margin: "0 0 0.75rem", color: "#1e6b42", fontSize: "0.85rem", fontWeight: 600 }}>✓ Resolution: {ticket.resolutionNotes}</p> : null}

              {/* Comments */}
              <div style={{ borderTop: "1px solid var(--outline)", paddingTop: "0.85rem" }}>
                <p style={{ margin: "0 0 0.6rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#214c71" }}>💬 Comments</p>
                {ticket.updates.length > 0 ? (
                  <div style={{ display: "grid", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    {ticket.updates.map((update) => (
                      <div key={update.id} style={{ padding: "0.7rem 0.9rem", borderRadius: "12px", background: "rgba(224,238,249,0.5)", border: "1px solid rgba(53,102,141,0.08)" }}>
                        <strong style={{ fontSize: "0.82rem", color: "#214c71" }}>{update.updatedByName}</strong>
                        <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "#38556d" }}>{update.message}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
                  <textarea rows="2" placeholder="Add a comment..." value={commentDrafts[ticket.id] || ""}
                    onChange={(e) => setCommentDrafts((cur) => ({ ...cur, [ticket.id]: e.target.value }))}
                    style={{ flex: 1, resize: "none", borderRadius: "10px" }} />
                  <button type="button" onClick={() => submitComment(ticket.id)} style={{ borderRadius: "10px", padding: "0.5rem 1rem", fontSize: "0.85rem", flexShrink: 0 }}>Post</button>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </Shell>
  );
}
