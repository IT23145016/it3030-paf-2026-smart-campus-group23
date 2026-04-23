import { useEffect, useState } from "react";
import Shell from "../components/Shell";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

const ROLE_OPTIONS = ["USER", "ADMIN", "TECHNICIAN", "STUDENT"];
const NOTIFICATION_REFRESH_EVENT = "scoh:refresh-notifications";

export default function RoleManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    query: "",
    role: "all",
    status: "all"
  });
  const [updatingUserId, setUpdatingUserId] = useState("");
  const [deletingUserId, setDeletingUserId] = useState("");
  const [confirmDeleteUser, setConfirmDeleteUser] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setError("");
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleRole(userId, role) {
    const targetUser = users.find((user) => user.id === userId);
    const nextRoles = targetUser.roles.includes(role)
      ? targetUser.roles.filter((item) => item !== role)
      : [...targetUser.roles, role];

    try {
      setUpdatingUserId(userId);
      const updated = await api.updateRoles(userId, nextRoles);
      setUsers((current) => current.map((user) => (user.id === userId ? updated : user)));
      setError("");
      window.dispatchEvent(new Event(NOTIFICATION_REFRESH_EVENT));
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingUserId("");
    }
  }

  async function toggleStatus(userId, active) {
    const targetUser = users.find((item) => item.id === userId);
    const isSelf = currentUser?.id === userId;

    if (isSelf && active === false) {
      setError("Admins cannot deactivate their own account.");
      return;
    }

    if (targetUser) {
      const confirmed = window.confirm(
        active
          ? `Activate ${targetUser.fullName || targetUser.email}?`
          : `Deactivate ${targetUser.fullName || targetUser.email}?`
      );
      if (!confirmed) {
        return;
      }
    }

    try {
      setUpdatingUserId(userId);
      const updated = await api.updateUserStatus(userId, active);
      setUsers((current) => current.map((user) => (user.id === userId ? updated : user)));
      setError("");
      window.dispatchEvent(new Event(NOTIFICATION_REFRESH_EVENT));
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingUserId("");
    }
  }
  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  async function deleteUser(userId) {
    if (currentUser?.id === userId) {
      setError("Admins cannot delete their own account.");
      return;
    }
    const targetUser = users.find((item) => item.id === userId);
    setConfirmDeleteUser(targetUser);
  }

  async function confirmDelete() {
    if (!confirmDeleteUser) return;
    try {
      setDeletingUserId(confirmDeleteUser.id);
      await api.deleteUser(confirmDeleteUser.id);
      setUsers((current) => current.filter((user) => user.id !== confirmDeleteUser.id));
      setError("");
      setSuccessMessage(`${confirmDeleteUser.fullName || confirmDeleteUser.email} has been deleted successfully.`);
      setTimeout(() => setSuccessMessage(""), 4000);
      window.dispatchEvent(new Event(NOTIFICATION_REFRESH_EVENT));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingUserId("");
      setConfirmDeleteUser(null);
    }
  }

  const filteredUsers = users.filter((user) => {
    const query = filters.query.trim().toLowerCase();
    const matchesQuery = !query
      || user.fullName?.toLowerCase().includes(query)
      || user.email?.toLowerCase().includes(query);
    const matchesRole = filters.role === "all" || user.roles.includes(filters.role);
    const matchesStatus = filters.status === "all"
      || (filters.status === "active" && user.active)
      || (filters.status === "inactive" && !user.active);

    return matchesQuery && matchesRole && matchesStatus;
  });

  return (
    <Shell title="Role Management">
      <section className="hero-card accent-card">
        <p className="eyebrow">Admin Controls</p>
        <h2>Grant the right level of access without losing traceability.</h2>
        <p>
          Admins can promote staff to technicians, keep standard users scoped down, and notify users whenever
          their permissions change.
        </p>
      </section>

      {error ? <p className="error">{error}</p> : null}
      {confirmDeleteUser ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(16,33,29,0.45)", zIndex: 50, display: "grid", placeItems: "center" }}>
          <div style={{ background: "#fff", borderRadius: "24px", padding: "2rem", maxWidth: "400px", width: "90%", boxShadow: "0 24px 60px rgba(33,76,113,0.18)", display: "grid", gap: "1.2rem", textAlign: "center" }}>
            <h3 style={{ margin: 0, color: "#173f61" }}>Delete Account</h3>
            <p style={{ margin: 0, color: "#5d6f7d" }}>
              Are you sure you want to delete <strong>{confirmDeleteUser.fullName || confirmDeleteUser.email}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button onClick={confirmDelete} disabled={!!deletingUserId}>
                {deletingUserId ? "Deleting..." : "Yes, Delete"}
              </button>
              <button className="secondary-button" onClick={() => setConfirmDeleteUser(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {successMessage ? (
        <div style={{
          position: "fixed",
          top: "1.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          background: "linear-gradient(135deg, #214c71, #5f93bc)",
          color: "#f7fbff",
          padding: "0.9rem 1.6rem",
          borderRadius: "16px",
          boxShadow: "0 14px 32px rgba(33, 76, 113, 0.22)",
          fontWeight: "600",
          zIndex: 999,
          whiteSpace: "nowrap"
        }}>
          ✓ {successMessage}
        </div>
      ) : null}

      <section className="table-card">
        <div className="table-header">
          <h3>Users</h3>
          <button type="button" className="secondary-button toolbar-button" onClick={loadUsers}>
            Refresh
          </button>
        </div>
        <form className="filter-grid role-management-filters" onSubmit={(event) => event.preventDefault()}>
          <label>
            Search
            <input
              name="query"
              value={filters.query}
              onChange={handleFilterChange}
              placeholder="Search by name or email"
            />
          </label>
          <label>
            Role
            <select name="role" value={filters.role} onChange={handleFilterChange}>
              <option value="all">All roles</option>
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="all">All users</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <div className="filter-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setFilters({ query: "", role: "all", status: "all" })}
            >
              Clear filters
            </button>
          </div>
        </form>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Roles</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.fullName}</td>
                <td>{user.email}</td>
                <td>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => toggleStatus(user.id, !user.active)}
                    disabled={updatingUserId === user.id}
                    >
                    {updatingUserId === user.id
                      ? "Updating..."
                      : user.active
                        ? "Active"
                        : "Inactive"}
                  </button>
                </td>
                <td>
                  <div className="role-group">
                    {ROLE_OPTIONS.map((role) => (
                      <label key={role} className="role-pill">
                        <input
                          type="checkbox"
                          checked={user.roles.includes(role)}
                          onChange={() => toggleRole(user.id, role)}
                          disabled={updatingUserId === user.id}
                        />
                        <span>{role}</span>
                      </label>
                    ))}
                  </div>
                </td>
                <td>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => deleteUser(user.id)}
                    disabled={currentUser?.id === user.id}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filteredUsers.length ? <p className="muted">No users matched the selected filters.</p> : null}
      </section>
    </Shell>
  );
}
