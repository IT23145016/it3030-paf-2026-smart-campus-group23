import { useEffect, useState } from "react";
import Shell from "../components/Shell";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

export default function TicketOperationsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ status: "all", priority: "all", location: "" });
  const [commentDrafts, setCommentDrafts] = useState({});
  const [statusForms, setStatusForms] = useState({});

  useEffect(() => {
    loadData(filters);
  }, []);

  async function loadData(nextFilters = filters) {
    try {
      const ticketData = await api.getTickets(nextFilters);
      setTickets(ticketData);

      if (user?.roles?.includes("ADMIN")) {
        const userData = await api.getUsers();
        setTechnicians(userData.filter((account) => account.roles.includes("TECHNICIAN") && account.active));
      } else {
        setTechnicians([]);
      }

      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function handleStatusForm(ticketId, field, value) {
    setStatusForms((current) => ({
      ...current,
      [ticketId]: {
        status: current[ticketId]?.status || "IN_PROGRESS",
        resolutionNote: current[ticketId]?.resolutionNote || "",
        rejectionReason: current[ticketId]?.rejectionReason || "",
        [field]: value
      }
    }));
  }

  async function updateStatus(ticket) {
    const payload = statusForms[ticket.id] || { status: ticket.status, resolutionNote: "", rejectionReason: "" };
    try {
      await api.updateTicketStatus(ticket.id, payload);
      await loadData(filters);
    } catch (err) {
      setError(err.message);
    }
  }

  async function assignTechnician(ticketId, technicianId) {
    if (!technicianId) return;
    try {
      await api.assignTicket(ticketId, technicianId);
      await loadData(filters);
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitComment(ticketId) {
    const message = commentDrafts[ticketId]?.trim();
    if (!message) {
      setError("Enter a comment before posting.");
      return;
    }

    try {
      await api.addTicketUpdate(ticketId, message);
      setCommentDrafts((current) => ({ ...current, [ticketId]: "" }));
      await loadData(filters);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Shell title="Ticket Operations">
      <section className="hero-card accent-card">
         <h2>Assign Technicians, Manage Rejections, and Close Incidents with Resolution Notes</h2>
  <p>
    Administrators and technicians can efficiently manage incident workflows by assigning tasks,
    handling rejections, and closing tickets with detailed resolution notes. The system preserves
    full context, including resource details and a complete history of updates and comments.
  </p>
</section>

      <section className="table-card">
        <div className="table-header">
          <h3>Filter ticket queue</h3>
          <button type="button" className="secondary-button toolbar-button" onClick={() => loadData(filters)}>Refresh</button>
        </div>
        <form className="filter-grid" onSubmit={(event) => { event.preventDefault(); loadData(filters); }}>
          <label>
            Status
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="all">All</option>
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </label>
          <label>
            Priority
            <select name="priority" value={filters.priority} onChange={handleFilterChange}>
              <option value="all">All</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </label>
          <label>
            Location
            <input name="location" value={filters.location} onChange={handleFilterChange} />
          </label>
          <div className="filter-actions">
            <button type="submit">Apply filters</button>
          </div>
        </form>
      </section>

      {error ? <p className="error">{error}</p> : null}

      <section className="ticket-list">
        {tickets.map((ticket) => {
          const form = statusForms[ticket.id] || { status: ticket.status, resolutionNote: "", rejectionReason: "" };
          return (
            <article className="ticket-card" key={ticket.id}>
              <div className="ticket-card-head">
                <div>
                  <p className="eyebrow">{ticket.category} | {ticket.priority} priority</p>
                  <h3>{ticket.title}</h3>
                </div>
                <span className={`status-pill ${ticket.status.toLowerCase()}`}>{ticket.status}</span>
              </div>
              <p>{ticket.description}</p>
              <div className="ticket-meta-grid">
                <div><span className="ticket-meta-label">Resource</span><strong>{ticket.resourceName}</strong></div>
                <div><span className="ticket-meta-label">Reporter</span><strong>{ticket.createdByName}</strong></div>
                <div><span className="ticket-meta-label">Contact</span><strong>{ticket.preferredContactDetails}</strong></div>
              </div>
              <div className="resource-form">
                {user?.roles?.includes("ADMIN") ? (
                  <label>
                    Assign technician
                    <select value={ticket.assignedToUserId || ""} onChange={(event) => assignTechnician(ticket.id, event.target.value)}>
                      <option value="">Select technician</option>
                      {technicians.map((technician) => (
                        <option key={technician.id} value={technician.id}>{technician.fullName}</option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <label>
                  Next status
                  <select value={form.status} onChange={(event) => handleStatusForm(ticket.id, "status", event.target.value)}>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                    {user?.roles?.includes("ADMIN") ? <option value="REJECTED">REJECTED</option> : null}
                  </select>
                </label>
                <label>
                  Resolution note
                  <input value={form.resolutionNote} onChange={(event) => handleStatusForm(ticket.id, "resolutionNote", event.target.value)} />
                </label>
                {user?.roles?.includes("ADMIN") ? (
                  <label>
                    Rejection reason
                    <input value={form.rejectionReason} onChange={(event) => handleStatusForm(ticket.id, "rejectionReason", event.target.value)} />
                  </label>
                ) : null}
                <div className="form-actions">
                  <button type="button" onClick={() => updateStatus(ticket)}>Save status</button>
                </div>
              </div>
              {ticket.rejectionReason ? <p className="error">Rejected reason: {ticket.rejectionReason}</p> : null}
              {ticket.resolutionNotes ? <p className="muted">Resolution notes: {ticket.resolutionNotes}</p> : null}
              <div className="ticket-update-list">
                {ticket.updates.map((update) => (
                  <div key={update.id}>
                    <strong>{update.updatedByName}</strong>
                    <p>{update.message}</p>
                  </div>
                ))}
                <div>
                  <textarea rows="3" placeholder="Add operational comment" value={commentDrafts[ticket.id] || ""} onChange={(event) => setCommentDrafts((current) => ({ ...current, [ticket.id]: event.target.value }))} />
                  <div className="form-actions">
                    <button type="button" onClick={() => submitComment(ticket.id)}>Post comment</button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </Shell>
  );
}
