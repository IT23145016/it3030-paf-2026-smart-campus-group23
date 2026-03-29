import { useEffect, useState } from "react";
import Shell from "../components/Shell";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

const TYPE_OPTIONS = ["LECTURE_HALL", "LAB", "MEETING_ROOM", "EQUIPMENT"];
const STATUS_OPTIONS = ["ACTIVE", "MAINTENANCE", "OUT_OF_SERVICE"];
const DAY_OPTIONS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

const emptyForm = {
  resourceCode: "",
  name: "",
  type: "LECTURE_HALL",
  capacity: 1,
  location: "",
  status: "ACTIVE",
  description: "",
  amenities: "",
  availabilityWindows: [{ dayOfWeek: "MONDAY", startTime: "08:00", endTime: "17:00" }]
};

export default function ResourcesPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [filters, setFilters] = useState({
    query: "",
    type: "",
    location: "",
    minCapacity: "",
    status: ""
  });
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = user?.roles?.includes("ADMIN");

  useEffect(() => {
    loadResources();
  }, []);

  async function loadResources(nextFilters = filters) {
    setLoading(true);
    setError("");
    try {
      const data = await api.getResources(nextFilters);
      setResources(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleWindowChange(index, field, value) {
    setForm((current) => ({
      ...current,
      availabilityWindows: current.availabilityWindows.map((window, windowIndex) =>
        windowIndex === index ? { ...window, [field]: value } : window
      )
    }));
  }

  function addWindow() {
    setForm((current) => ({
      ...current,
      availabilityWindows: [...current.availabilityWindows, { dayOfWeek: "MONDAY", startTime: "08:00", endTime: "17:00" }]
    }));
  }

  function removeWindow(index) {
    setForm((current) => ({
      ...current,
      availabilityWindows:
        current.availabilityWindows.length === 1
          ? current.availabilityWindows
          : current.availabilityWindows.filter((_, windowIndex) => windowIndex !== index)
    }));
  }

  function startEdit(resource) {
    setEditingId(resource.id);
    setForm({
      resourceCode: resource.resourceCode,
      name: resource.name,
      type: resource.type,
      capacity: resource.capacity,
      location: resource.location,
      status: resource.status,
      description: resource.description || "",
      amenities: resource.amenities.join(", "),
      availabilityWindows: resource.availabilityWindows
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId("");
    setForm(emptyForm);
  }

  async function submitFilters(event) {
    event.preventDefault();
    loadResources(filters);
  }

  async function submitForm(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      capacity: Number(form.capacity),
      amenities: form.amenities
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    };

    try {
      if (editingId) {
        await api.updateResource(editingId, payload);
      } else {
        await api.createResource(payload);
      }
      resetForm();
      await loadResources();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeResource(resourceId) {
    try {
      setError("");
      await api.deleteResource(resourceId);
      if (editingId === resourceId) {
        resetForm();
      }
      await loadResources();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Shell title="Facilities Catalogue">
      <section className="hero-card accent-card">
        <p className="eyebrow">Member 1 Module</p>
        <h2>Searchable campus spaces and equipment, ready for booking workflows.</h2>
        <p>
          This catalogue keeps lecture halls, labs, meeting rooms, and shared equipment visible with location,
          capacity, availability windows, and operational status in one MongoDB-backed view.
        </p>
      </section>

      <section className="table-card">
        <div className="table-header">
          <div>
            <p className="eyebrow">Search and Filter</p>
            <h3>Find the right campus resource quickly.</h3>
          </div>
          <button type="button" onClick={() => loadResources()}>
            Refresh
          </button>
        </div>

        <form className="filter-grid" onSubmit={submitFilters}>
          <label>
            Search
            <input name="query" value={filters.query} onChange={handleFilterChange} placeholder="Name, code, amenity" />
          </label>
          <label>
            Type
            <select name="type" value={filters.type} onChange={handleFilterChange}>
              <option value="">All types</option>
              {TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {formatLabel(option)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Location
            <input name="location" value={filters.location} onChange={handleFilterChange} placeholder="Block, floor, building" />
          </label>
          <label>
            Min capacity
            <input name="minCapacity" type="number" min="1" value={filters.minCapacity} onChange={handleFilterChange} />
          </label>
          <label>
            Status
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">Any status</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {formatLabel(option)}
                </option>
              ))}
            </select>
          </label>
          <div className="filter-actions">
            <button type="submit">Apply filters</button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                const cleared = { query: "", type: "", location: "", minCapacity: "", status: "" };
                setFilters(cleared);
                loadResources(cleared);
              }}
            >
              Clear
            </button>
          </div>
        </form>
      </section>

      {error ? <p className="error">{error}</p> : null}

      {isAdmin ? (
        <section className="table-card">
          <div className="table-header">
            <div>
              <p className="eyebrow">Admin Resource Management</p>
              <h3>{editingId ? "Update a resource" : "Create a new resource"}</h3>
            </div>
            {editingId ? (
              <button type="button" className="secondary-button" onClick={resetForm}>
                Cancel edit
              </button>
            ) : null}
          </div>

          <form className="resource-form" onSubmit={submitForm}>
            <label>
              Resource code
              <input name="resourceCode" value={form.resourceCode} onChange={handleFormChange} required />
            </label>
            <label>
              Name
              <input name="name" value={form.name} onChange={handleFormChange} required />
            </label>
            <label>
              Type
              <select name="type" value={form.type} onChange={handleFormChange}>
                {TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {formatLabel(option)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Capacity
              <input name="capacity" type="number" min="1" value={form.capacity} onChange={handleFormChange} required />
            </label>
            <label>
              Location
              <input name="location" value={form.location} onChange={handleFormChange} required />
            </label>
            <label>
              Status
              <select name="status" value={form.status} onChange={handleFormChange}>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {formatLabel(option)}
                  </option>
                ))}
              </select>
            </label>
            <label className="full-span">
              Description
              <textarea name="description" value={form.description} onChange={handleFormChange} rows="3" />
            </label>
            <label className="full-span">
              Amenities
              <input
                name="amenities"
                value={form.amenities}
                onChange={handleFormChange}
                placeholder="Projector, Whiteboard, Air Conditioning"
              />
            </label>

            <div className="full-span">
              <div className="table-header">
                <h4>Availability windows</h4>
                <button type="button" className="secondary-button" onClick={addWindow}>
                  Add window
                </button>
              </div>
              <div className="window-list">
                {form.availabilityWindows.map((window, index) => (
                  <div className="window-row" key={`${window.dayOfWeek}-${index}`}>
                    <select value={window.dayOfWeek} onChange={(event) => handleWindowChange(index, "dayOfWeek", event.target.value)}>
                      {DAY_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {formatLabel(option)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={window.startTime}
                      onChange={(event) => handleWindowChange(index, "startTime", event.target.value)}
                    />
                    <input
                      type="time"
                      value={window.endTime}
                      onChange={(event) => handleWindowChange(index, "endTime", event.target.value)}
                    />
                    <button type="button" className="secondary-button" onClick={() => removeWindow(index)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="full-span form-actions">
              <button type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update resource" : "Create resource"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="resource-grid">
        {loading ? <div className="panel">Loading catalogue...</div> : null}
        {!loading && resources.length === 0 ? <div className="panel">No resources matched your filters yet.</div> : null}
        {!loading
          ? resources.map((resource) => (
              <article className="resource-card" key={resource.id}>
                <div className="resource-card-head">
                  <div>
                    <p className="eyebrow">{resource.resourceCode}</p>
                    <h3>{resource.name}</h3>
                  </div>
                  <span className={`status-pill ${resource.status.toLowerCase()}`}>{formatLabel(resource.status)}</span>
                </div>
                <p className="resource-copy">{resource.description || "No description supplied yet."}</p>
                <div className="resource-meta">
                  <span>{formatLabel(resource.type)}</span>
                  <span>{resource.capacity} people</span>
                  <span>{resource.location}</span>
                </div>
                <div className="amenity-list">
                  {resource.amenities.length ? resource.amenities.map((amenity) => <span key={amenity}>{amenity}</span>) : <span>No amenities listed</span>}
                </div>
                <div className="schedule-list">
                  {resource.availabilityWindows.map((window) => (
                    <div key={`${resource.id}-${window.dayOfWeek}-${window.startTime}`}>
                      <strong>{formatLabel(window.dayOfWeek)}</strong>
                      <span>
                        {window.startTime} - {window.endTime}
                      </span>
                    </div>
                  ))}
                </div>
                {isAdmin ? (
                  <div className="card-actions">
                    <button type="button" className="secondary-button" onClick={() => startEdit(resource)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => removeResource(resource.id)}>
                      Delete
                    </button>
                  </div>
                ) : null}
              </article>
            ))
          : null}
      </section>
    </Shell>
  );
}

function formatLabel(value) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
