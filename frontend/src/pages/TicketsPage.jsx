import { useEffect, useState } from "react";
import Shell from "../components/Shell";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

const INITIAL_FORM = {
  resourceId: "",
  title: "",
  description: "",
  location: "",
  category: "EQUIPMENT",
  priority: "MEDIUM",
  preferredContactDetails: ""
};

export default function TicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [resources, setResources] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState(INITIAL_FORM);
  const [filters, setFilters] = useState({ status: "all", priority: "all", location: "" });
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [editingCommentId, setEditingCommentId] = useState("");

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage(nextFilters = filters) {
    setLoading(true);
    try {
      const [ticketData, resourceData] = await Promise.all([api.getTickets(nextFilters), api.getResources()]);
      setTickets(ticketData);
      setResources(resourceData);
      if (!form.resourceId && resourceData.length) {
        setForm((current) => ({ ...current, resourceId: resourceData[0].id }));
      }
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  async function createTicket(event) {
    event.preventDefault();
    try {
      await api.createTicket(form);
      setForm((current) => ({ ...INITIAL_FORM, resourceId: current.resourceId || resources[0]?.id || "" }));
      await loadPage(filters);
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeTicket(ticketId) {
    try {
      await api.deleteTicket(ticketId);
      await loadPage(filters);
    } catch (err) {
      setError(err.message);
    }
  }

  async function uploadAttachment(event) {
    event.preventDefault();
    if (!selectedTicketId || !selectedFile) {
      setError("Select a ticket and image before uploading.");
      return;
    }

    try {
      await api.uploadTicketAttachment(selectedTicketId, selectedFile);
      setSelectedFile(null);
      await loadPage(filters);
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
      setEditingCommentId("");
      await loadPage(filters);
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveEditedComment(ticketId, updateId) {
    const message = commentDrafts[updateId]?.trim();
    if (!message) {
      setError("Edited comment cannot be empty.");
      return;
    }
    try {
      await api.editTicketUpdate(ticketId, updateId, message);
      setEditingCommentId("");
      await loadPage(filters);
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteComment(ticketId, updateId) {
    try {
      await api.deleteTicketUpdate(ticketId, updateId);
      await loadPage(filters);
    } catch (err) {
      setError(err.message);
    }
  }

  function canManageComment(update) {
    return update.updatedByUserId === user?.id || user?.roles?.includes("ADMIN");
  }

  return (
    <Shell title="Incident Tickets">
      <section className="hero-card accent-card">
              <h2>Report issues against a campus resource and keep the full service conversation in one place.</h2>
        <p>Each ticket captures resource, category, priority, location, contact preference, image evidence, and comment history.</p>
      </section>

      <section className="table-card">
        <div className="table-header">
          <h3>Create incident ticket</h3>
        </div>
        <form className="resource-form" onSubmit={createTicket}>
          <label>
            Resource
            <select name="resourceId" value={form.resourceId} onChange={handleFormChange} required>
              <option value="">Select resource</option>
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>{resource.name}</option>
              ))}
            </select>
          </label>
          <label>
            Location
            <input name="location" value={form.location} onChange={handleFormChange} required />
          </label>
          <label>
            Category
            <select name="category" value={form.category} onChange={handleFormChange}>
              <option value="FACILITY">FACILITY</option>
              <option value="NETWORK">NETWORK</option>
              <option value="EQUIPMENT">EQUIPMENT</option>
              <option value="SOFTWARE">SOFTWARE</option>
              <option value="SAFETY">SAFETY</option>
              <option value="OTHER">OTHER</option>
            </select>
          </label>
          <label>
            Priority
            <select name="priority" value={form.priority} onChange={handleFormChange}>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </label>
          <label>
            Title
            <input name="title" value={form.title} onChange={handleFormChange} required />
          </label>
          <label>
            Preferred contact
            <input name="preferredContactDetails" value={form.preferredContactDetails} onChange={handleFormChange} required />
          </label>
          <label className="full-span">
            Description
            <textarea name="description" rows="4" value={form.description} onChange={handleFormChange} required />
          </label>
          <div className="form-actions">
            <button type="submit">Submit ticket</button>
          </div>
        </form>
      </section>

      <section className="table-card">
        <div className="table-header">
          <h3>Attach evidence</h3>
          <p className="muted">Each ticket supports up to 3 JPG or PNG images.</p>
        </div>
        <form className="filter-grid" onSubmit={uploadAttachment}>
          <label>
            Ticket
            <select value={selectedTicketId} onChange={(event) => setSelectedTicketId(event.target.value)}>
              <option value="">Select ticket</option>
              {tickets.map((ticket) => (
                <option key={ticket.id} value={ticket.id}>{ticket.title}</option>
              ))}
            </select>
          </label>
          <label>
            Image file
            <input type="file" accept=".jpg,.jpeg,.png" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} />
          </label>
          <div className="filter-actions">
            <button type="submit">Upload image</button>
          </div>
        </form>
      </section>

      <section className="table-card">
        <div className="table-header">
          <h3>My tickets</h3>
          <button type="button" className="secondary-button toolbar-button" onClick={() => loadPage(filters)}>
            Refresh
          </button>
        </div>
        <form className="filter-grid" onSubmit={(event) => { event.preventDefault(); loadPage(filters); }}>
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

        {error ? <p className="error">{error}</p> : null}
        {loading ? <p className="muted">Loading tickets...</p> : null}

        <div className="ticket-list">
          {tickets.map((ticket) => (
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
                <div><span className="ticket-meta-label">Location</span><strong>{ticket.location}</strong></div>
                <div><span className="ticket-meta-label">Preferred contact</span><strong>{ticket.preferredContactDetails}</strong></div>
              </div>
              {ticket.rejectionReason ? <p className="error">Rejected reason: {ticket.rejectionReason}</p> : null}
              {ticket.resolutionNotes ? <p className="muted">Resolution notes: {ticket.resolutionNotes}</p> : null}
              {ticket.attachments.length ? (
                <div className="ticket-link-list">
                  {ticket.attachments.map((attachment) => (
                    <a key={attachment.id} href={`http://localhost:8081${attachment.downloadUrl}`} target="_blank" rel="noreferrer">
                      {attachment.originalFileName}
                    </a>
                  ))}
                </div>
              ) : null}
              <div className="ticket-update-list">
                {ticket.updates.map((update) => (
                  <div key={update.id}>
                    <strong>{update.updatedByName}</strong>
                    {editingCommentId === update.id ? (
                      <>
                        <textarea rows="3" value={commentDrafts[update.id] ?? update.message} onChange={(event) => setCommentDrafts((current) => ({ ...current, [update.id]: event.target.value }))} />
                        <div className="form-actions">
                          <button type="button" onClick={() => saveEditedComment(ticket.id, update.id)}>Save comment</button>
                          <button type="button" className="secondary-button" onClick={() => setEditingCommentId("")}>Cancel</button>
                        </div>
                      </>
                    ) : (
                      <p>{update.message}</p>
                    )}
                    {update.editedAt ? <small className="muted">Edited</small> : null}
                    {canManageComment(update) && editingCommentId !== update.id ? (
                      <div className="form-actions">
                        <button type="button" className="secondary-button" onClick={() => { setEditingCommentId(update.id); setCommentDrafts((current) => ({ ...current, [update.id]: update.message })); }}>Edit</button>
                        <button type="button" className="secondary-button" onClick={() => deleteComment(ticket.id, update.id)}>Delete</button>
                      </div>
                    ) : null}
                  </div>
                ))}
                <div>
                  <textarea rows="3" placeholder="Add a comment" value={commentDrafts[ticket.id] || ""} onChange={(event) => setCommentDrafts((current) => ({ ...current, [ticket.id]: event.target.value }))} />
                  <div className="form-actions">
                    <button type="button" onClick={() => submitComment(ticket.id)}>Post comment</button>
                  </div>
                </div>
              </div>
              <div className="booking-actions">
                <button type="button" className="secondary-button" onClick={() => removeTicket(ticket.id)}>Delete</button>
              </div>
            </article>
          ))}
          {!tickets.length && !loading ? <p className="muted">No incident tickets found.</p> : null}
        </div>
      </section>
    </Shell>
  );
}
