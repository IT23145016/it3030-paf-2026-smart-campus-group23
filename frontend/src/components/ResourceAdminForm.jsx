const TYPE_OPTIONS = ["LECTURE_HALL", "LAB", "MEETING_ROOM", "EQUIPMENT"];
const STATUS_OPTIONS = ["ACTIVE", "MAINTENANCE", "OUT_OF_SERVICE"];
const DAY_OPTIONS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export default function ResourceAdminForm({
  form,
  editingId,
  saving,
  onFormChange,
  onWindowChange,
  onAddWindow,
  onRemoveWindow,
  onSubmit,
  onCancel
}) {
  return (
    <section className="table-card">
      <div className="table-header">
        <div>
          <p className="eyebrow">Resource Administration</p>
          <h3>{editingId ? "Update resource details" : "Add a new resource to the catalogue"}</h3>
        </div>
        {editingId ? (
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancel edit
          </button>
        ) : null}
      </div>

      <form className="resource-form" onSubmit={onSubmit}>
        <label>
          Resource code
          <input name="resourceCode" value={form.resourceCode} onChange={onFormChange} required />
        </label>
        <label>
          Name
          <input name="name" value={form.name} onChange={onFormChange} required />
        </label>
        <label>
          Type
          <select name="type" value={form.type} onChange={onFormChange}>
            {TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {formatLabel(option)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Capacity
          <input name="capacity" type="number" min="1" value={form.capacity} onChange={onFormChange} required />
        </label>
        <label>
          Location
          <input name="location" value={form.location} onChange={onFormChange} required />
        </label>
        <label>
          Status
          <select name="status" value={form.status} onChange={onFormChange}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {formatLabel(option)}
              </option>
            ))}
          </select>
        </label>
        <label className="full-span">
          Description
          <textarea name="description" value={form.description} onChange={onFormChange} rows="3" />
        </label>
        <label className="full-span">
          Amenities
          <input
            name="amenities"
            value={form.amenities}
            onChange={onFormChange}
            placeholder="Projector, Whiteboard, Air Conditioning"
          />
        </label>

        <div className="full-span">
          <div className="table-header">
            <h4>Availability windows</h4>
            <button type="button" className="secondary-button" onClick={onAddWindow}>
              Add window
            </button>
          </div>
          <div className="window-list">
            {form.availabilityWindows.map((window, index) => (
              <div className="window-row" key={`${window.dayOfWeek}-${index}`}>
                <select value={window.dayOfWeek} onChange={(event) => onWindowChange(index, "dayOfWeek", event.target.value)}>
                  {DAY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {formatLabel(option)}
                    </option>
                  ))}
                </select>
                <input type="time" value={window.startTime} onChange={(event) => onWindowChange(index, "startTime", event.target.value)} />
                <input type="time" value={window.endTime} onChange={(event) => onWindowChange(index, "endTime", event.target.value)} />
                <button type="button" className="secondary-button" onClick={() => onRemoveWindow(index)}>
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
  );
}

function formatLabel(value) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
