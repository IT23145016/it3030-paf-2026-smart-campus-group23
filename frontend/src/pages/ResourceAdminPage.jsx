import { useEffect, useState } from "react";
import Shell from "../components/Shell";
import ResourceAdminForm from "../components/ResourceAdminForm";
import { api } from "../services/api";

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

export default function ResourceAdminPage() {
  const [form, setForm] = useState(emptyForm);
  const [resources, setResources] = useState([]);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadResources();
  }, []);

  async function loadResources() {
    setLoading(true);
    setError("");
    try {
      const data = await api.getResources();
      setResources(data);
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

  function resetForm() {
    setEditingId("");
    setForm(emptyForm);
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
    setError("");
    try {
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
    <Shell title="Resource Administration">
      <section className="resource-intro">
        <div className="resource-intro-copy">
          <p className="eyebrow">Resource Administration</p>
          <h2>Keep the campus catalogue accurate and up to date.</h2>
          <p className="resource-intro-note">Create resources, update availability, and manage operational status from one admin workspace.</p>
          <div className="resource-intro-tags">
            <span>Create records</span>
            <span>Update details</span>
            <span>Manage status</span>
            <span>Control availability</span>
          </div>
        </div>
      </section>

      {error ? <p className="error">{error}</p> : null}

      <ResourceAdminForm
        form={form}
        editingId={editingId}
        saving={saving}
        onFormChange={handleFormChange}
        onWindowChange={handleWindowChange}
        onAddWindow={addWindow}
        onRemoveWindow={removeWindow}
        onSubmit={submitForm}
        onCancel={resetForm}
      />

      <section className="table-card">
        <div className="table-header">
          <div>
            <p className="eyebrow">Current Catalogue</p>
          </div>
          <button type="button" className="secondary-button" onClick={loadResources}>
            Refresh
          </button>
        </div>

        {loading ? <p className="muted">Loading resources...</p> : null}
        {!loading && !resources.length ? <p className="muted">No resources available yet.</p> : null}

        {!loading && resources.length ? (
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Type</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((resource) => (
                <tr key={resource.id}>
                  <td>{resource.resourceCode}</td>
                  <td>{resource.name}</td>
                  <td>{formatLabel(resource.type)}</td>
                  <td>{resource.location}</td>
                  <td>{formatLabel(resource.status)}</td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="secondary-button" onClick={() => startEdit(resource)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => removeResource(resource.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
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
